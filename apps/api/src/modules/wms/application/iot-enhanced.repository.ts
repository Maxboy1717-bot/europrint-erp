/**
 * @module iot-enhanced.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeInt } from '../../hr/common/db-rows';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class IotEnhancedRepository {
  async getOrdersForKits(status?: string): Promise<Result<Row[]>>  {
  try {  
      return status
        ? exec(sql`SELECT po.id, po.order_number AS reference_number, po.status, po.created_at FROM production_orders po WHERE po.status = ${status} ORDER BY po.created_at DESC LIMIT 100`)
        : exec(sql`SELECT po.id, po.order_number AS reference_number, po.status, po.created_at FROM production_orders po ORDER BY po.created_at DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialKits(status?: string): Promise<Result<Row[]>>  {
  try {  
      return status
        ? exec(sql`SELECT mk.*, po.order_number AS order_reference, e.full_name AS prepared_by_name FROM mm_material_kits mk LEFT JOIN production_orders po ON po.id = mk.production_order_id LEFT JOIN employees e ON e.id = mk.prepared_by WHERE mk.status = ${status} ORDER BY mk.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT mk.*, po.order_number AS order_reference, e.full_name AS prepared_by_name FROM mm_material_kits mk LEFT JOIN production_orders po ON po.id = mk.production_order_id LEFT JOIN employees e ON e.id = mk.prepared_by ORDER BY mk.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createMaterialKit(body: Row, userId: number | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO mm_material_kits (production_order_id, status, prepared_by, notes, created_at) VALUES (${body['productionOrderId'] ?? body['production_order_id'] ?? null}, 'draft', ${userId}, ${body['notes'] ?? null}, NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async calculateBom(orderId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bi.material_id, m.name AS material_name, m.unit_of_measure, bi.quantity AS required_per_unit, po.quantity AS order_qty, (bi.quantity * po.quantity)::numeric AS total_required, COALESCE(sl.quantity_on_hand, 0)::numeric AS available, GREATEST(0, (bi.quantity * po.quantity) - COALESCE(sl.quantity_on_hand, 0))::numeric AS shortage FROM production_orders po JOIN bom_items bi ON bi.bom_id = po.bom_id JOIN mm_materials m ON m.id = bi.material_id LEFT JOIN (SELECT material_id, SUM(quantity_on_hand) AS quantity_on_hand FROM wms_stock_levels GROUP BY material_id) sl ON sl.material_id = bi.material_id WHERE po.id = ${orderId}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getKitItems(kitId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ki.*, m.name AS material_name, m.unit_of_measure, m.sku, w.name AS warehouse_name FROM mm_material_kit_items ki JOIN mm_materials m ON m.id = ki.material_id LEFT JOIN wms_warehouses w ON w.id = ki.warehouse_id WHERE ki.kit_id = ${kitId} ORDER BY m.name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async addKitItem(kitId: number, body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO mm_material_kit_items (kit_id, material_id, quantity, warehouse_id, notes) VALUES (${kitId}, ${safeInt(String(body['materialId'] ?? body['material_id'] ?? 0), 0)}, ${body['quantity'] ?? 0}, ${body['warehouseId'] ? safeInt(String(body['warehouseId']), 0) : null}, ${body['notes'] ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialKitById(kitId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`
        SELECT mk.*, po.order_number AS order_reference, e.full_name AS prepared_by_name
        FROM mm_material_kits mk
        LEFT JOIN production_orders po ON po.id = mk.production_order_id
        LEFT JOIN employees e ON e.id = mk.prepared_by
        WHERE mk.id = ${kitId} LIMIT 1
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateMaterialKitStatus(kitId: number, status: string): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`
        UPDATE mm_material_kits SET status = ${status}, updated_at = NOW()
        WHERE id = ${kitId} RETURNING *
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
