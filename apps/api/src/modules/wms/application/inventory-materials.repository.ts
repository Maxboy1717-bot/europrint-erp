/**
 * @module inventory-materials.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class InventoryMaterialsRepository {
  async listMaterials(search: string | undefined, category: string | undefined, limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return search && category
        ? exec(sql`SELECT m.*, COALESCE(SUM(sl.quantity_on_hand), 0)::numeric AS total_stock, COALESCE(SUM(sl.quantity_on_hand * sl.unit_cost), 0)::numeric(15,2) AS stock_value, COUNT(DISTINCT sl.warehouse_id)::int AS warehouse_count FROM mm_materials m LEFT JOIN wms_stock_levels sl ON sl.material_id = m.id WHERE m.is_active = true AND (m.name ILIKE ${'%' + search + '%'} OR m.sku ILIKE ${'%' + search + '%'}) AND m.category = ${category} GROUP BY m.id ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : search
        ? exec(sql`SELECT m.*, COALESCE(SUM(sl.quantity_on_hand), 0)::numeric AS total_stock, COALESCE(SUM(sl.quantity_on_hand * sl.unit_cost), 0)::numeric(15,2) AS stock_value, COUNT(DISTINCT sl.warehouse_id)::int AS warehouse_count FROM mm_materials m LEFT JOIN wms_stock_levels sl ON sl.material_id = m.id WHERE m.is_active = true AND (m.name ILIKE ${'%' + search + '%'} OR m.sku ILIKE ${'%' + search + '%'}) GROUP BY m.id ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : category
        ? exec(sql`SELECT m.*, COALESCE(SUM(sl.quantity_on_hand), 0)::numeric AS total_stock, COALESCE(SUM(sl.quantity_on_hand * sl.unit_cost), 0)::numeric(15,2) AS stock_value, COUNT(DISTINCT sl.warehouse_id)::int AS warehouse_count FROM mm_materials m LEFT JOIN wms_stock_levels sl ON sl.material_id = m.id WHERE m.is_active = true AND m.category = ${category} GROUP BY m.id ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT m.*, COALESCE(SUM(sl.quantity_on_hand), 0)::numeric AS total_stock, COALESCE(SUM(sl.quantity_on_hand * sl.unit_cost), 0)::numeric(15,2) AS stock_value, COUNT(DISTINCT sl.warehouse_id)::int AS warehouse_count FROM mm_materials m LEFT JOIN wms_stock_levels sl ON sl.material_id = m.id WHERE m.is_active = true GROUP BY m.id ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async countMaterials(search?: string): Promise<Result<number>>  {
  try {  
      const rows = search
        ? await exec(sql`SELECT COUNT(*)::int AS total FROM mm_materials WHERE is_active = true AND (name ILIKE ${'%' + search + '%'})`)
        : await exec(sql`SELECT COUNT(*)::int AS total FROM mm_materials WHERE is_active = true`);
      return rows.ok ? Ok(Number(rows.data[0]?.total ?? 0)) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterial(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT * FROM mm_materials WHERE id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialStock(id: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT sl.*, w.name AS warehouse_name FROM wms_stock_levels sl JOIN wms_warehouses w ON w.id = sl.warehouse_id WHERE sl.material_id = ${id}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialRecentPurchases(id: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pol.*, po.created_at, v.name AS vendor_name, po.status FROM mm_purchase_order_lines pol JOIN mm_purchase_orders po ON po.id = pol.purchase_order_id JOIN mm_vendors v ON v.id = po.vendor_id WHERE pol.material_id = ${id} ORDER BY po.created_at DESC LIMIT 10`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialRecentTransactions(id: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT t.*, w.name AS warehouse_name FROM wms_transactions t JOIN wms_warehouses w ON w.id = t.warehouse_id WHERE t.material_id = ${id} AND t.deleted_at IS NULL ORDER BY t.created_at DESC LIMIT 20`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateMaterial(id: number, body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE mm_materials SET name = COALESCE(${body.name ?? null}, name), description = COALESCE(${body.description ?? null}, description), category = COALESCE(${body.category ?? null}, category), unit_of_measure = COALESCE(${body.unitOfMeasure ?? body.unit_of_measure ?? null}, unit_of_measure), min_stock = COALESCE(${body.minStock ?? body.min_stock ?? null}, min_stock), max_stock = COALESCE(${body.maxStock ?? body.max_stock ?? null}, max_stock), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteMaterial(id: number): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE mm_materials SET is_active = false, updated_at = NOW() WHERE id = ${id} RETURNING id`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLowStockList(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT sl.material_id, m.name, m.unit_of_measure, m.sku, sl.quantity_on_hand, sl.min_stock, sl.max_stock, (sl.min_stock - sl.quantity_on_hand) AS shortage, w.name AS warehouse_name FROM wms_stock_levels sl JOIN mm_materials m ON m.id = sl.material_id JOIN wms_warehouses w ON w.id = sl.warehouse_id WHERE sl.quantity_on_hand <= sl.min_stock AND sl.min_stock > 0 ORDER BY shortage DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
