import { Injectable , NotFoundException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_QUERY_LIMIT, MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
@Injectable()
export class WarehouseCatalogService {

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
    const conditions: string[] = ['1=1'];
    if (materialId)  conditions.push(`wb.material_card_id = '${materialId.replace(/'/g, "''")}'`);
    if (warehouseId) conditions.push(`wb.warehouse_id = '${warehouseId.replace(/'/g, "''")}'`);
    if (status)      conditions.push(`wb.status = '${status.replace(/'/g, "''")}'`);
    if (search)      conditions.push(`(wb.batch_number ILIKE '%${search.replace(/'/g, "''")}%' OR mc.xom_ashyo ILIKE '%${search.replace(/'/g, "''")}%')`);
    const result = await rawSql(sql.raw(`
      SELECT wb.id, wb.batch_number AS "batchNumber", wb.material_card_id AS "materialCardId",
             mc.xom_ashyo AS "materialName", wb.warehouse_id AS "warehouseId", w.name AS "warehouseName",
             wb.quantity, wb.remaining_quantity AS "remainingQuantity", wb.unit_cost AS "unitCost",
             TO_CHAR(wb.production_date, 'YYYY-MM-DD') AS "productionDate",
             TO_CHAR(wb.expiry_date, 'YYYY-MM-DD') AS "expiryDate",
             wb.supplier_batch_number AS "supplierBatchNumber", wb.qc_status AS "qcStatus",
             wb.status, mc.barcode, wb.notes
      FROM warehouse_batches wb JOIN material_cards mc ON mc.id = wb.material_card_id
      LEFT JOIN warehouses w ON w.id = wb.warehouse_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY wb.created_at DESC LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `));
    return dbRows(result);
  
    });}

  async createBatch(body: Record<string, unknown>){
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
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateBatch(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const fieldMap: Record<string, string> = {
      batchNumber: 'batch_number', materialCardId: 'material_card_id', warehouseId: 'warehouse_id',
      quantity: 'quantity', remainingQuantity: 'remaining_quantity', unitCost: 'unit_cost',
      productionDate: 'production_date', expiryDate: 'expiry_date',
      supplierBatchNumber: 'supplier_batch_number', qcStatus: 'qc_status', status: 'status', notes: 'notes',
    };
    const sets: string[] = [];
    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) {
        const val = body[jsKey];
        if (val === null) sets.push(`${dbCol} = NULL`);
        else if (typeof val === 'number') sets.push(`${dbCol} = ${val}`);
        else sets.push(`${dbCol} = '${String(val).replace(/'/g, "''")}'`);
      }
    }
    if (!sets.length) return body;
    sets.push('updated_at = NOW()');
    const result = await rawSql(sql.raw(`UPDATE warehouse_batches SET ${sets.join(', ')} WHERE id = '${id.replace(/'/g, "''")}' RETURNING *`));
    const _found = dbRows(result)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}
}
