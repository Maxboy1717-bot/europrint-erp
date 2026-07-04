/**
 * @module warehouse-catalog.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable , NotFoundException, ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_QUERY_LIMIT, MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
@Injectable()
export class WarehouseCatalogService {
  constructor(private readonly i18n: I18nService) {}

  async getMaterials(search?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const searchFilter = search ? sql`AND mc.xom_ashyo ILIKE ${'%' + search + '%'}` : sql``;
    const result = await rawSql(sql`
      SELECT mc.id, mc.xom_ashyo AS "xomAshyo", mc.xom_ashyo_ru AS "xomAshyoRu",
             COALESCE(mc.kod, mc.id::text) AS "kod", mc.unit_of_measure AS "unitOfMeasure",
             mc.material_type AS "materialType", mc.category, mc.current_stock AS "currentStock"
      FROM material_cards mc
      WHERE 1=1 ${searchFilter}
      ORDER BY mc.xom_ashyo LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(result);
  
    });}

  /**
   * POST /api/warehouse/materials — the MaterialCardsPage create form lands here.
   * Real INSERT into material_cards (the canonical materials table this controller
   * already reads in getMaterials). FE payload { materialCode, name, unit, category,
   * minStock } → { kod, xom_ashyo, unit_of_measure, category, min_stock }.
   * `kod` is UNIQUE — a duplicate surfaces as a 409 (ON CONFLICT returns no row).
   * Returns the getMaterials row shape so the list refreshes consistently.
   */
  async createMaterial(body: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const kod = String(body['materialCode'] ?? body['kod'] ?? '').trim();
      const name = String(body['name'] ?? body['xom_ashyo'] ?? '').trim();
      const unit = String(body['unit'] ?? body['unit_of_measure'] ?? 'dona').trim();
      const category =
        body['category'] != null && String(body['category']).trim() !== ''
          ? String(body['category']).trim()
          : null;
      const minStock = body['minStock'] != null ? Number(body['minStock']) : 0;
      const result = await rawSql(sql`
        INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, category, min_stock, created_at)
        VALUES (${kod}, ${name}, ${unit}, ${category}, ${minStock}, NOW())
        ON CONFLICT (kod) DO NOTHING
        RETURNING id, xom_ashyo AS "xomAshyo", xom_ashyo_ru AS "xomAshyoRu",
                  COALESCE(kod, id::text) AS "kod", unit_of_measure AS "unitOfMeasure",
                  material_type AS "materialType", category, current_stock AS "currentStock"
      `);
      const row = dbRows(result)[0];
      if (!row) throw new ConflictException(`Bu kod allaqachon mavjud: ${kod}`);
      return row;
    });
  }

  /**
   * PUT /api/warehouse/materials/:id — SB0756/SB0757: MaterialCardsPage (the routed
   * FE material-master page) had create but no edit; this closes that gap using the
   * same COALESCE-update pattern as updateBatch() below. Same field mapping as
   * createMaterial (materialCode/name/unit/category/minStock -> kod/xom_ashyo/...).
   */
  async updateMaterial(id: string, body: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const name = body['name'] != null ? String(body['name']).trim() : null;
      const unit = body['unit'] != null ? String(body['unit']).trim() : null;
      const category =
        body['category'] != null && String(body['category']).trim() !== ''
          ? String(body['category']).trim()
          : null;
      const minStock = body['minStock'] != null ? Number(body['minStock']) : null;
      const result = await rawSql(sql`
        UPDATE material_cards SET
          xom_ashyo = COALESCE(${name}, xom_ashyo),
          unit_of_measure = COALESCE(${unit}, unit_of_measure),
          category = COALESCE(${category}, category),
          min_stock = COALESCE(${minStock}, min_stock),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING id, xom_ashyo AS "xomAshyo", xom_ashyo_ru AS "xomAshyoRu",
                  COALESCE(kod, id::text) AS "kod", unit_of_measure AS "unitOfMeasure",
                  material_type AS "materialType", category, current_stock AS "currentStock"
      `);
      const row = dbRows(result)[0];
      if (!row) throw new NotFoundException(`Material topilmadi: ${id}`);
      return row;
    });
  }

  async getBatchesStats(){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT COUNT(*) FILTER (WHERE status = 'active') AS "activeBatches",
             COUNT(*) FILTER (WHERE expiry_date <= NOW() + INTERVAL '30 days' AND expiry_date > NOW() AND status = 'active') AS "expiringBatches",
             COALESCE(SUM(quantity), 0) AS "totalQuantity",
             COALESCE(SUM(quantity * COALESCE(unit_cost, 0)), 0) AS "totalValue"
      FROM warehouse_batches
    `);
    const row = dbRows(result)[0] ?? {};
    return {
      activeBatches:   Number(row['activeBatches']   ?? 0),
      expiringBatches: Number(row['expiringBatches'] ?? 0),
      totalQuantity:   Number(row['totalQuantity']   ?? 0),
      totalValue:      Number(row['totalValue']      ?? 0),
    };
  
    });}

  async getBatches(materialId?: string, warehouseId?: string, status?: string, search?: string){
    return safeCall(async () => {
    // Parameterized filters — no string concatenation, no sql.raw()
    const matFilter    = materialId  ? sql`AND wb.material_card_id = ${materialId}`  : sql``;
    const whFilter     = warehouseId ? sql`AND wb.warehouse_id = ${warehouseId}`     : sql``;
    const statusFilter = status      ? sql`AND wb.status = ${status}`                : sql``;
    const searchFilter = search
      ? sql`AND (wb.batch_number ILIKE ${'%' + search + '%'} OR mc.xom_ashyo ILIKE ${'%' + search + '%'})`
      : sql``;
    const result = await rawSql(sql`
      SELECT wb.id, wb.batch_number AS "batchNumber", wb.material_card_id AS "materialCardId",
             mc.xom_ashyo AS "materialName", wb.warehouse_id AS "warehouseId", w.name AS "warehouseName",
             wb.quantity, wb.remaining_quantity AS "remainingQuantity", wb.unit_cost AS "unitCost",
             TO_CHAR(wb.production_date, 'YYYY-MM-DD') AS "productionDate",
             TO_CHAR(wb.expiry_date, 'YYYY-MM-DD') AS "expiryDate",
             wb.supplier_batch_number AS "supplierBatchNumber", wb.qc_status AS "qcStatus",
             wb.status, mc.barcode, wb.notes
      FROM warehouse_batches wb JOIN material_cards mc ON mc.id = wb.material_card_id
      LEFT JOIN warehouses w ON w.id = wb.warehouse_id
      WHERE 1=1 ${matFilter} ${whFilter} ${statusFilter} ${searchFilter}
      ORDER BY wb.created_at DESC LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `);
    return dbRows(result);

    });}

  async createBatch(body: Record<string, unknown>){
    const recordNotFoundMsg = await this.i18n.t('errors.recordNotFound');
    return safeCall(async () => {
    const result = await rawSql(sql`
      INSERT INTO warehouse_batches (batch_number, material_card_id, warehouse_id, quantity, remaining_quantity,
        unit_cost, production_date, expiry_date, supplier_batch_number, qc_status, status, notes, created_at, updated_at)
      VALUES (${body['batchNumber'] ?? null}, ${body['materialCardId'] ?? null}, ${body['warehouseId'] ?? null},
              ${Number(body['quantity'] ?? 0)}, ${Number(body['remainingQuantity'] ?? body['quantity'] ?? 0)},
              ${body['unitCost'] ? Number(body['unitCost']) : null},
              ${body['productionDate'] ?? null}, ${body['expiryDate'] ?? null},
              ${body['supplierBatchNumber'] ?? null}, ${body['qcStatus'] ?? 'pending'}, ${body['status'] ?? 'active'},
              ${body['notes'] ?? null}, NOW(), NOW())
      RETURNING *
    `);
    const _found = dbRows(result)[0];
    if (!_found) throw new NotFoundException(recordNotFoundMsg);
    return _found;

    });}

  async updateBatch(id: string, body: Record<string, unknown>){
    const recordNotFoundMsg = await this.i18n.t('errors.recordNotFound');
    return safeCall(async () => {
    // Fully parameterized COALESCE update — no sql.raw(), no string injection possible
    const result = await rawSql(sql`
      UPDATE warehouse_batches SET
        batch_number          = COALESCE(${body['batchNumber']          ?? null}, batch_number),
        material_card_id      = COALESCE(${body['materialCardId']       ?? null}, material_card_id),
        warehouse_id          = COALESCE(${body['warehouseId']          ?? null}, warehouse_id),
        quantity              = COALESCE(${body['quantity'] != null ? Number(body['quantity']) : null}, quantity),
        remaining_quantity    = COALESCE(${body['remainingQuantity'] != null ? Number(body['remainingQuantity']) : null}, remaining_quantity),
        unit_cost             = COALESCE(${body['unitCost'] != null ? Number(body['unitCost']) : null}, unit_cost),
        production_date       = COALESCE(${body['productionDate']       ?? null}, production_date),
        expiry_date           = COALESCE(${body['expiryDate']           ?? null}, expiry_date),
        supplier_batch_number = COALESCE(${body['supplierBatchNumber']  ?? null}, supplier_batch_number),
        qc_status             = COALESCE(${body['qcStatus']             ?? null}, qc_status),
        status                = COALESCE(${body['status']               ?? null}, status),
        notes                 = COALESCE(${body['notes']                ?? null}, notes),
        updated_at            = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    const _found = dbRows(result)[0];
    if (!_found) throw new NotFoundException(recordNotFoundMsg);
    return _found;

    });}
}
