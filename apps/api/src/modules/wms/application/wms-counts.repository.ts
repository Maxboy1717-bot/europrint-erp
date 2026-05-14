/**
 * @module wms-counts.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeInt } from '../../hr/common/db-rows';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class WmsCountsRepository {
  async listInventoryCounts(warehouseId?: string, status?: string, lim = 20): Promise<Result<Row[]>>  {
  try {  
      const wid = warehouseId ? safeInt(warehouseId, 0) : null;
      return wid && status
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.deleted_at IS NULL AND ic.warehouse_id = ${wid} AND ic.status = ${status} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : wid
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.deleted_at IS NULL AND ic.warehouse_id = ${wid} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : status
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.deleted_at IS NULL AND ic.status = ${status} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.deleted_at IS NULL ORDER BY ic.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createInventoryCount(warehouseId: number, countedBy: number | null, notes: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO wms_inventory_counts (warehouse_id, counted_by, notes, status, count_date) VALUES (${warehouseId}, ${countedBy ?? null}, ${notes ?? null}, 'in_progress', NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listInternalRequests(status?: string, lim = 50): Promise<Result<Row[]>>  {
  try {  
      return status
        ? exec(sql`SELECT ir.*, e.full_name AS requested_by_name FROM wms_internal_requests ir LEFT JOIN employees e ON e.id = ir.requested_by WHERE ir.status = ${status} ORDER BY ir.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT ir.*, e.full_name AS requested_by_name FROM wms_internal_requests ir LEFT JOIN employees e ON e.id = ir.requested_by ORDER BY ir.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createInternalRequest(requestedBy: number | null, fromWarehouseId: number | null, toWarehouseId: number | null, materialId: number, quantity: number, notes: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO wms_internal_requests (requested_by, from_warehouse_id, to_warehouse_id, material_id, quantity, notes, status) VALUES (${requestedBy}, ${fromWarehouseId ?? null}, ${toWarehouseId ?? null}, ${materialId}, ${quantity}, ${notes ?? null}, 'pending') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateInternalRequest(id: number, status: string | null, notes: string | null): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`UPDATE wms_internal_requests SET status = COALESCE(${status ?? null}, status), notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBatches(materialId?: string, warehouseId?: string, expiring?: string): Promise<Result<Row[]>>  {
  try {  
      const mid = materialId ? safeInt(materialId, 0) : null;
      const wid = warehouseId ? safeInt(warehouseId, 0) : null;
      return mid && wid && expiring
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} AND b.warehouse_id = ${wid} AND b.expiry_date <= NOW() + INTERVAL '30 days' ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : mid && wid
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} AND b.warehouse_id = ${wid} ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : mid
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProductionSupply(sessionId?: string): Promise<Result<Row[]>>  {
  try {  
      const sid = sessionId ? safeInt(sessionId, 0) : null;
      return sid
        ? exec(sql`SELECT ps.*, m.name AS material_name, m.unit_of_measure FROM wms_production_supply ps LEFT JOIN mm_materials m ON m.id = ps.material_id WHERE ps.session_id = ${sid} ORDER BY ps.created_at DESC`)
        : exec(sql`SELECT ps.*, m.name AS material_name, m.unit_of_measure FROM wms_production_supply ps LEFT JOIN mm_materials m ON m.id = ps.material_id ORDER BY ps.created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
