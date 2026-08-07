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
    // Audit 2026-08-07: `pos_materials` jadvali BAZADA YO'Q (`to_regclass` -> null), shuning uchun
    // bu so'rov har chaqiruvda yiqilardi va xato `getCandidates` ning `catch` ida yutilardi ->
    // butun FIFO/FEFO oqimi jimgina ishlamasdi. Kanonik manba `material_cards`; muddatlilik
    // belgisi = `shelf_life_days` to'ldirilganmi (alohida `has_expiry` bayrog'i mavjud emas).
    const r = await runQuery<{ has_expiry: boolean }>(sql`
      SELECT COALESCE(shelf_life_days, 0) > 0 AS has_expiry
      FROM material_cards WHERE id = ${materialId} LIMIT 1
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

      // `pos_batches` ham mavjud emas — kanonik partiya jadvali `batch_lots` (WMS expiry
      // hisoboti ham aynan shundan o'qiydi). Ustun moslashuvi: current_qty ->
      // remaining_quantity, status='ACTIVE' -> is_active, batch_number -> lot_number (fallback
      // batch_number). `batch_lots` da narx ustuni yo'q, shuning uchun `material_cards.unit_price`
      // dan olinadi — bu ayni WmsCatalogAbcAgingExpiryService ishlatadigan manba.
      const r = await runQuery<BatchCandidate>(sql`
        SELECT
          b.id                                    AS "batchId",
          COALESCE(b.lot_number, b.batch_number)  AS "batchNumber",
          b.warehouse_id                          AS "warehouseId",
          COALESCE(b.remaining_quantity, 0)       AS "availableQty",
          COALESCE(mc.unit_price, 0)              AS "unitPrice",
          b.expiry_date                           AS "expiryDate",
          b.received_date                         AS "receivedDate"
        FROM batch_lots b
        LEFT JOIN material_cards mc ON mc.id = b.material_id
        WHERE b.warehouse_id = ${warehouseId}
          AND b.material_id  = ${materialId}
          AND b.is_active = true
          AND COALESCE(b.remaining_quantity, 0) > 0
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
   * Muddati o'tgan partiyalarni SANAYDI (cron uchun).
   *
   * Audit 2026-08-07 — nima uchun endi belgilamaydi, sanaydi:
   *   Avvalgi versiya mavjud bo'lmagan `pos_batches` jadvalida `status='EXPIRED'` qo'yardi, ya'ni
   *   har kecha jimgina yiqilardi. Kanonik jadval — `batch_lots`, unda `status` ustuni umuman
   *   yo'q; eng yaqin ekvivalent `is_active`.
   *
   *   ⚠️ LEKIN `is_active = false` qo'yish REGRESSIYA bo'lardi: `WmsCatalogAbcAgingExpiryService`
   *   `getExpiry()` aynan `bl.is_active = true` bo'yicha filtrlaydi va muddati o'tgan lotlarni
   *   `status='expired'` deb KO'RSATADI — ular ombor xodimi chora ko'rishi uchun ro'yxatda
   *   turishi kerak. Bayroqni o'chirish ularni hisobotdan **yashirib qo'yardi**.
   *
   *   `batch_lots.quality_status` ustuni bor, lekin jonli bazada barcha qiymatlar NULL — ya'ni
   *   "muddati o'tgan" uchun qabul qilingan lug'at mavjud emas. Yangi qiymat o'ylab topish
   *   semantik qaror (Q-34) va egasi ishi. Shu sababli bu metod hozircha faqat haqiqiy sonni
   *   qaytaradi — soxta mutatsiya ham, soxta muvaffaqiyat ham yo'q (Q-40).
   */
  async countExpiredBatches(): Promise<Result<number>> {
    try {
      const r = await runQuery<{ cnt: string }>(sql`
        SELECT COUNT(*)::text AS cnt
        FROM batch_lots
        WHERE is_active = true
          AND COALESCE(remaining_quantity, 0) > 0
          AND expiry_date IS NOT NULL
          AND expiry_date < CURRENT_DATE
      `);
      const count = Number(r.rows[0]?.cnt ?? 0);
      if (count > 0) this.logger.warn(`${count} ta partiya muddati o'tgan (hamon omborda)`);
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
