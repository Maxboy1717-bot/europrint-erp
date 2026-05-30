/**
 * @module warehouse-config.service
 * @description Ombor tip KONFIGURATSIYASI (warehouse_types) + omborlar o'qish — config-driven UI uchun.
 *   Yangi toza per-tur ombor sahifalari shu config'dan generatsiya qilinadi (eski rasvo WMS'ni almashtirish).
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

export interface IssueStockInput {
  materialId: number;
  quantity: number;
  unit?: string;
  reason?: string;
  notes?: string;
}

@Injectable()
export class WarehouseConfigService {
  private readonly logger = new Logger(WarehouseConfigService.name);
  /** Faol ombor turlari (sort_order bo'yicha) + har turdagi omborlar soni. */
  async listTypes(): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT wt.code, wt.name_uz AS "nameUz", wt.name_ru AS "nameRu", wt.category, wt.icon,
               wt.inbound_flow AS "inboundFlow", wt.outbound_flow AS "outboundFlow",
               wt.needs_quarantine AS "needsQuarantine", wt.needs_qc AS "needsQc",
               wt.unit_basis AS "unitBasis", wt.label_template AS "labelTemplate", wt.sort_order AS "sortOrder",
               (SELECT COUNT(*)::int FROM warehouses w WHERE w.type = wt.code AND w.is_active) AS "warehouseCount"
        FROM warehouse_types wt
        WHERE wt.is_active = true
        ORDER BY wt.sort_order
      `);
      return dbRows(rows);
    });
  }

  /** Omborlar ro'yxati (ixtiyoriy ?type= filtri). */
  async listWarehouses(type?: string): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const t = type ?? null;
      const rows = await rawSql(sql`
        SELECT id, code, name, name_ru AS "nameRu", type, location, is_active AS "isActive"
        FROM warehouses
        WHERE is_active = true AND (${t}::text IS NULL OR type = ${t})
        ORDER BY name
      `);
      return dbRows(rows);
    });
  }

  /**
   * Bitta ombor qoldig'i — warehouse_stock + material_cards (kod/nom/birlik). P2P qabul (§7.7)
   * tovarni shu jadvalga prixod qiladi; bu yerda ombordagi joriy qoldiq ko'rsatiladi.
   */
  async getWarehouseStock(warehouseId: number): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const wh = dbRows(await rawSql(sql`
        SELECT id, code, name, name_ru AS "nameRu", type, location FROM warehouses WHERE id = ${warehouseId}
      `))[0];
      if (!wh) throw new NotFoundException(`Ombor topilmadi: ${warehouseId}`);
      const stock = dbRows(await rawSql(sql`
        SELECT ws.id, ws.material_id AS "materialId", mc.kod,
               COALESCE(mc.xom_ashyo, '—') AS "name",
               COALESCE(ws.quantity, 0) AS quantity,
               COALESCE(ws.reserved_quantity, 0) AS reserved,
               COALESCE(ws.available_quantity, 0) AS available,
               COALESCE(mc.unit_of_measure, 'dona') AS unit,
               ws.last_updated_at AS "lastUpdatedAt"
        FROM warehouse_stock ws
        LEFT JOIN material_cards mc ON mc.id = ws.material_id
        WHERE ws.warehouse_id = ${warehouseId}
        ORDER BY mc.xom_ashyo NULLS LAST, ws.id
        LIMIT 500
      `));
      const totalQuantity = stock.reduce((s, r) => s + Number(r['quantity'] ?? 0), 0);
      return { warehouse: wh, stock, lineCount: stock.length, totalQuantity };
    });
  }

  /**
   * Ombordan material CHIQIM (iste'mol/sarf) — warehouse_stock atomik kamaytiriladi (faqat mavjud
   * qoldiq yetsa), material_cards.current_stock yangilanadi va material_movements ('ISSUE') jurnaliga
   * yoziladi. Qoldiq yetmasa BadRequest. performedBy = amalni bajargan foydalanuvchi.
   */
  async issueStock(
    warehouseId: number,
    input: IssueStockInput,
    performedBy: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const qty = Number(input.quantity);
      if (!input.materialId) throw new BadRequestException('materialId majburiy');
      if (!Number.isFinite(qty) || qty <= 0) throw new BadRequestException("quantity musbat bo'lishi kerak");

      const mat = dbRows(await rawSql(sql`
        SELECT id, kod, xom_ashyo, unit_of_measure FROM material_cards WHERE id = ${input.materialId}
      `))[0];
      if (!mat) throw new NotFoundException(`Material topilmadi: ${input.materialId}`);
      const unit = input.unit ?? String(mat['unit_of_measure'] ?? 'dona');
      const materialName = String(mat['xom_ashyo'] ?? mat['kod'] ?? `#${input.materialId}`);

      // Atomik chiqim — faqat mavjud qoldiq yetganda kamayadi
      const updated = dbRows(await rawSql(sql`
        UPDATE warehouse_stock
        SET quantity = quantity - ${qty}, available_quantity = available_quantity - ${qty}, last_updated_at = NOW()
        WHERE warehouse_id = ${warehouseId} AND material_id = ${input.materialId} AND available_quantity >= ${qty}
        RETURNING quantity, available_quantity
      `))[0];
      if (!updated) throw new BadRequestException("Yetarli mavjud qoldiq yo'q yoki material bu omborda mavjud emas");

      await rawSql(sql`
        UPDATE material_cards SET current_stock = GREATEST(0, COALESCE(current_stock, 0) - ${qty}) WHERE id = ${input.materialId}
      `);

      const mv = dbRows(await rawSql(sql`
        INSERT INTO material_movements (material_id, material_name, movement_type, quantity, unit, performed_by, reason, notes)
        VALUES (${input.materialId}, ${materialName}, 'ISSUE', ${qty}, ${unit}, ${performedBy}, ${input.reason ?? null}, ${input.notes ?? null})
        RETURNING id
      `))[0];

      this.logger.log(`[WMS] Ombor #${warehouseId} chiqim: material ${input.materialId} ×${qty} ${unit} (movement #${mv?.['id'] ?? '?'})`);
      return {
        warehouseId,
        materialId: input.materialId,
        issued: qty,
        newQuantity: Number(updated['quantity']),
        newAvailable: Number(updated['available_quantity']),
        movementId: mv?.['id'] ?? null,
      };
    });
  }
}
