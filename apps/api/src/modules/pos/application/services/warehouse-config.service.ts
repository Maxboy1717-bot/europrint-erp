/**
 * @module warehouse-config.service
 * @description Ombor tip KONFIGURATSIYASI (warehouse_types) + omborlar o'qish — config-driven UI uchun.
 *   Yangi toza per-tur ombor sahifalari shu config'dan generatsiya qilinadi (eski rasvo WMS'ni almashtirish).
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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

  constructor(private readonly i18n: I18nService) {}

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
      if (!wh) throw new NotFoundException(await this.i18n.t('errors.warehouseNotFoundWithId', { args: { id: warehouseId } }));
      const typeConfig = dbRows(await rawSql(sql`
        SELECT code, name_uz AS "nameUz", category, needs_quarantine AS "needsQuarantine", needs_qc AS "needsQc",
               unit_basis AS "unitBasis", label_template AS "labelTemplate",
               inbound_flow AS "inboundFlow", outbound_flow AS "outboundFlow"
        FROM warehouse_types WHERE code = ${String(wh['type'])}
      `))[0] ?? null;
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
      const totalQuantity = (Array.isArray(stock) ? stock : []).reduce((s, r) => s + Number(r['quantity'] ?? 0), 0);
      return { warehouse: wh, typeConfig, stock, lineCount: stock.length, totalQuantity };
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
      if (!input.materialId) throw new BadRequestException(await this.i18n.t('validation.materialIdRequired'));
      if (!Number.isFinite(qty) || qty <= 0) throw new BadRequestException(await this.i18n.t('validation.quantityMustBePositive'));

      const mat = dbRows(await rawSql(sql`
        SELECT id, kod, xom_ashyo, unit_of_measure FROM material_cards WHERE id = ${input.materialId}
      `))[0];
      if (!mat) throw new NotFoundException(await this.i18n.t('errors.materialNotFoundWithId', { args: { id: input.materialId } }));
      const unit = input.unit ?? String(mat['unit_of_measure'] ?? 'dona');
      const materialName = String(mat['xom_ashyo'] ?? mat['kod'] ?? `#${input.materialId}`);

      // Atomik chiqim — faqat mavjud qoldiq yetganda kamayadi
      const updated = dbRows(await rawSql(sql`
        UPDATE warehouse_stock
        SET quantity = quantity - ${qty}, available_quantity = available_quantity - ${qty}, last_updated_at = NOW()
        WHERE warehouse_id = ${warehouseId} AND material_id = ${input.materialId} AND available_quantity >= ${qty}
        RETURNING quantity, available_quantity
      `))[0];
      if (!updated) throw new BadRequestException(await this.i18n.t('errors.insufficientStockOrMaterialNotInWarehouse'));

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

  /**
   * Ombor KIRIM (qo'lda / tuzatish) — warehouse_stock qoldig'i oshiriladi (UPDATE→INSERT upsert),
   * material_cards.current_stock yangilanadi va material_movements ('RECEIVE') jurnaliga yoziladi.
   * Inventarizatsiya tuzatishi yoki P2P'siz qo'lda kirim uchun (korreksiya). performedBy = bajaruvchi.
   */
  async receiveStock(
    warehouseId: number,
    input: IssueStockInput,
    performedBy: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const qty = Number(input.quantity);
      if (!input.materialId) throw new BadRequestException(await this.i18n.t('validation.materialIdRequired'));
      if (!Number.isFinite(qty) || qty <= 0) throw new BadRequestException(await this.i18n.t('validation.quantityMustBePositive'));

      const wh = dbRows(await rawSql(sql`SELECT id, code FROM warehouses WHERE id = ${warehouseId}`))[0];
      if (!wh) throw new NotFoundException(await this.i18n.t('errors.warehouseNotFoundWithId', { args: { id: warehouseId } }));
      const mat = dbRows(await rawSql(sql`
        SELECT id, kod, xom_ashyo, unit_of_measure FROM material_cards WHERE id = ${input.materialId}
      `))[0];
      if (!mat) throw new NotFoundException(await this.i18n.t('errors.materialNotFoundWithId', { args: { id: input.materialId } }));
      const unit = input.unit ?? String(mat['unit_of_measure'] ?? 'dona');
      const materialName = String(mat['xom_ashyo'] ?? mat['kod'] ?? `#${input.materialId}`);

      // warehouse_stock upsert (oshirish)
      const updated = dbRows(await rawSql(sql`
        UPDATE warehouse_stock
        SET quantity = quantity + ${qty}, available_quantity = available_quantity + ${qty}, last_updated_at = NOW()
        WHERE warehouse_id = ${warehouseId} AND material_id = ${input.materialId}
        RETURNING quantity, available_quantity
      `))[0];
      let newQuantity: number;
      let newAvailable: number;
      if (updated) {
        newQuantity = Number(updated['quantity']);
        newAvailable = Number(updated['available_quantity']);
      } else {
        const ins = dbRows(await rawSql(sql`
          INSERT INTO warehouse_stock (warehouse_id, material_id, quantity, reserved_quantity, available_quantity)
          VALUES (${warehouseId}, ${input.materialId}, ${qty}, 0, ${qty})
          RETURNING quantity, available_quantity
        `))[0];
        newQuantity = Number(ins?.['quantity'] ?? qty);
        newAvailable = Number(ins?.['available_quantity'] ?? qty);
      }

      await rawSql(sql`
        UPDATE material_cards SET current_stock = COALESCE(current_stock, 0) + ${qty} WHERE id = ${input.materialId}
      `);

      const mv = dbRows(await rawSql(sql`
        INSERT INTO material_movements (material_id, material_name, movement_type, quantity, unit, performed_by, reason)
        VALUES (${input.materialId}, ${materialName}, 'RECEIVE', ${qty}, ${unit}, ${performedBy}, ${input.reason ?? "Qo'lda kirim"})
        RETURNING id
      `))[0];

      this.logger.log(`[WMS] Ombor #${warehouseId} kirim: material ${input.materialId} +${qty} ${unit} (movement #${mv?.['id'] ?? '?'})`);
      return { warehouseId, materialId: input.materialId, received: qty, newQuantity, newAvailable, movementId: mv?.['id'] ?? null };
    });
  }

  /**
   * Material harakat tarixi (material_movements) — kirim/chiqim ('RECEIVE'/'ISSUE'/...) jurnali,
   * eng yangisi birinchi. Material 360 / ombor qoldig'i sahifasidagi "Tarix" uchun.
   */
  async getMaterialMovements(materialId: number): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT mm.id, mm.movement_type AS "movementType", COALESCE(mm.quantity, 0) AS quantity,
               mm.unit, mm.reason, mm.notes, mm.created_at AS "createdAt",
               COALESCE(NULLIF(TRIM(u.full_name), ''), u.username, 'User #' || mm.performed_by) AS "performedByName"
        FROM material_movements mm
        LEFT JOIN users u ON u.id = mm.performed_by
        WHERE mm.material_id = ${materialId}
        ORDER BY mm.created_at DESC, mm.id DESC
        LIMIT 50
      `);
      return dbRows(rows);
    });
  }

  /**
   * Moliya/Ombor umumiy dashboard (rahbar nazorati): har ombor qoldiq + QIYMAT (qty × unit_price),
   * umumiy yig'indilar va so'nggi harakatlar. "Markaziy ombor yo'q — moliya rahbari ko'rib turadi".
   */
  async getDashboard(): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const warehouses = dbRows(await rawSql(sql`
        SELECT w.id, w.code, w.name, w.type,
               COUNT(ws.id)::int AS "lineCount",
               COALESCE(SUM(ws.quantity), 0) AS "totalQuantity",
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, mc.last_purchase_price, 0)), 0) AS "totalValue"
        FROM warehouses w
        LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        LEFT JOIN material_cards mc ON mc.id = ws.material_id
        WHERE w.is_active = true
        GROUP BY w.id, w.code, w.name, w.type
        ORDER BY "totalValue" DESC
      `));
      const recentMovements = dbRows(await rawSql(sql`
        SELECT mm.id, mm.material_id AS "materialId", mm.material_name AS "materialName",
               mm.movement_type AS "movementType", COALESCE(mm.quantity, 0) AS quantity, mm.unit,
               mm.reason, mm.created_at AS "createdAt",
               COALESCE(NULLIF(TRIM(u.full_name), ''), u.username, 'User #' || mm.performed_by) AS "performedByName"
        FROM material_movements mm
        LEFT JOIN users u ON u.id = mm.performed_by
        ORDER BY mm.created_at DESC, mm.id DESC
        LIMIT 20
      `));
      // Kam qoldiq (reorder_point yoki min_stock'dan past mavjud qoldiq)
      const lowStock = dbRows(await rawSql(sql`
        SELECT w.id AS "warehouseId", w.code AS "warehouseCode", mc.id AS "materialId",
               COALESCE(mc.xom_ashyo, mc.kod, '—') AS "name", COALESCE(mc.unit_of_measure, 'dona') AS unit,
               ROUND(ws.available_quantity, 2) AS available,
               COALESCE(NULLIF(mc.reorder_point, 0), mc.min_stock, 0) AS threshold
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        JOIN warehouses w ON w.id = ws.warehouse_id
        WHERE w.is_active = true
          AND COALESCE(NULLIF(mc.reorder_point, 0), mc.min_stock, 0) > 0
          AND ws.available_quantity < COALESCE(NULLIF(mc.reorder_point, 0), mc.min_stock, 0)
        ORDER BY (COALESCE(NULLIF(mc.reorder_point, 0), mc.min_stock, 0) - ws.available_quantity) DESC
        LIMIT 20
      `));
      const totals = {
        warehouses: warehouses.length,
        stockedWarehouses: warehouses.filter((w) => Number(w['lineCount'] ?? 0) > 0).length,
        stockLines: warehouses.reduce((s, w) => s + Number(w['lineCount'] ?? 0), 0),
        totalValue: warehouses.reduce((s, w) => s + Number(w['totalValue'] ?? 0), 0),
        lowStockCount: lowStock.length,
      };
      return { totals, warehouses, recentMovements, lowStock };
    });
  }
}
