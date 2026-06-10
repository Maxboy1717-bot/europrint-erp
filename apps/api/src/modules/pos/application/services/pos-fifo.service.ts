/**
 * FIFO (First In First Out) va FEFO (First Expired First Out) partiya tanlash servisi.
 * Harakat qatorida partiya ko'rsatilmasa, bu servis avtomatik tanlaydi.
 * Muddatli material → FEFO; muddatsiz → FIFO.
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface BatchCandidate {
  batchId: number;
  batchNumber: string;
  warehouseId: number;
  availableQty: number;
  unitPrice: number;
  expiryDate: string | null;
  receivedDate: string;
}

export interface AllocationResult {
  batchId: number;
  batchNumber: string;
  allocatedQty: number;
  unitPrice: number;
}

@Injectable()
export class PosFifoService {
  private readonly logger = new Logger(PosFifoService.name);

  /**
   * Materialning muddatli yoki muddatsizligini tekshirish
   */
  private async hasExpiry(materialId: number): Promise<boolean> {
    const r = await runQuery<{ has_expiry: boolean }>(sql`
      SELECT COALESCE(has_expiry, false) AS has_expiry
      FROM pos_materials WHERE id = ${materialId} LIMIT 1
    `).catch(() => ({ rows: [{ has_expiry: false }] }));
    return r.rows[0]?.has_expiry ?? false;
  }

  /**
   * Ombordagi mavjud partiyalarni FIFO yoki FEFO tartibida qaytaradi
   */
  async getCandidates(warehouseId: number, materialId: number): Promise<Result<BatchCandidate[]>> {
    try {
      const hasExpiry = await this.hasExpiry(materialId);
      // FEFO (muddatli) yoki FIFO (muddatsiz) — hardcoded sql fragments, no sql.raw()
      const orderClause = hasExpiry
        ? sql`b.expiry_date ASC NULLS LAST, b.received_date ASC`
        : sql`b.received_date ASC`;

      const r = await runQuery<BatchCandidate>(sql`
        SELECT
          b.id         AS "batchId",
          b.batch_number AS "batchNumber",
          b.warehouse_id AS "warehouseId",
          COALESCE(b.current_qty, 0) AS "availableQty",
          COALESCE(b.unit_price, 0)  AS "unitPrice",
          b.expiry_date  AS "expiryDate",
          b.received_date AS "receivedDate"
        FROM pos_batches b
        WHERE b.warehouse_id = ${warehouseId}
          AND b.material_id  = ${materialId}
          AND b.status = 'ACTIVE'
          AND COALESCE(b.current_qty, 0) > 0
        ORDER BY ${orderClause}
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  /**
   * Kerakli miqdorni partiyalarga ajratadi (FIFO/FEFO)
   * Bir nechta partiyadan olish mumkin — natijani array sifatida qaytaradi.
   */
  async allocate(warehouseId: number, materialId: number, requiredQty: number): Promise<Result<AllocationResult[]>> {
    const candidatesR = await this.getCandidates(warehouseId, materialId);
    if (!candidatesR.ok) return Err(candidatesR.error);

    const allocations: AllocationResult[] = [];
    let remaining = requiredQty;

    for (const batch of candidatesR.data) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, batch.availableQty);
      allocations.push({
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        allocatedQty: take,
        unitPrice: batch.unitPrice,
      });
      remaining -= take;
    }

    if (remaining > 0) {
      this.logger.warn(`FIFO/FEFO: ${remaining} birlik yetishmaydi. Material: ${materialId}, Ombor: ${warehouseId}`);
      return Err(`Yetarli qoldiq yo'q: ${remaining} birlik yetishmaydi`);
    }

    return Ok(allocations);
  }

  /**
   * Muddati o'tgan partiyalarni belgilash (cron uchun)
   */
  async markExpiredBatches(): Promise<Result<number>> {
    try {
      const r = await runQuery<{ cnt: string }>(sql`
        WITH updated AS (
          UPDATE pos_batches
          SET status = 'EXPIRED', updated_at = NOW()
          WHERE status = 'ACTIVE'
            AND expiry_date IS NOT NULL
            AND expiry_date < CURRENT_DATE
          RETURNING id
        ) SELECT COUNT(*)::text AS cnt FROM updated
      `);
      const count = Number(r.rows[0]?.cnt ?? 0);
      if (count > 0) this.logger.warn(`${count} ta partiya muddati tugadi`);
      return Ok(count);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  /**
   * Ombordagi past qoldiqlarni topish (cron uchun)
   */
  async getLowStockMaterials(): Promise<Result<Array<{ materialId: number; materialCode: string; warehouseId: number; currentQty: number; minQty: number }>>> {
    try {
      // Canonical stock = warehouse_stock + material_cards (pos_stock_balances/pos_materials
      // do not exist — they crashed the hourly cron every run).
      const r = await runQuery<{ materialId: number; materialCode: string; warehouseId: number; currentQty: number; minQty: number }>(sql`
        SELECT
          mc.id           AS "materialId",
          mc.kod          AS "materialCode",
          ws.warehouse_id AS "warehouseId",
          COALESCE(ws.available_quantity, 0) AS "currentQty",
          COALESCE(mc.min_stock, 0)          AS "minQty"
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        WHERE COALESCE(ws.available_quantity, 0) < COALESCE(mc.min_stock, 0)
          AND COALESCE(mc.min_stock, 0) > 0
          AND mc.is_active = true
        ORDER BY (COALESCE(ws.available_quantity, 0) / NULLIF(mc.min_stock, 0)) ASC
        LIMIT 200
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
