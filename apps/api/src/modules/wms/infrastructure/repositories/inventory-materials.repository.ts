/**
 * @module inventory-materials.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IInventoryMaterialsRepo } from '../../domain/repositories/i-inventory-materials.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class InventoryMaterialsRepository implements IInventoryMaterialsRepo {
  async listMaterials(search: string | undefined, category: string | undefined, limit: number, offset: number): Promise<Result<Row[]>>  {
  try {
      // mm_materials is a VIEW over material_cards (no primary key). The old form
      // "SELECT m.* ... LEFT JOIN wms_stock_levels GROUP BY m.id" relied on the PK
      // functional dependency (valid only for a base TABLE) and errors on a view
      // ("column m.name must appear in GROUP BY"). Aggregate stock in a subquery so
      // there is no GROUP BY on m.* — view-safe and identical result shape.
      return search && category
        ? exec(sql`SELECT m.*, COALESCE(s.total_stock, 0)::numeric AS total_stock, COALESCE(s.stock_value, 0)::numeric(15,2) AS stock_value, COALESCE(s.warehouse_count, 0)::int AS warehouse_count FROM mm_materials m LEFT JOIN (SELECT material_id, SUM(quantity_on_hand)::numeric AS total_stock, SUM(quantity_on_hand * unit_cost)::numeric(15,2) AS stock_value, COUNT(DISTINCT warehouse_id)::int AS warehouse_count FROM wms_stock_levels GROUP BY material_id) s ON s.material_id = m.id WHERE m.is_active = true AND (m.name ILIKE ${'%' + search + '%'} OR m.sku ILIKE ${'%' + search + '%'}) AND m.category = ${category} ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : search
        ? exec(sql`SELECT m.*, COALESCE(s.total_stock, 0)::numeric AS total_stock, COALESCE(s.stock_value, 0)::numeric(15,2) AS stock_value, COALESCE(s.warehouse_count, 0)::int AS warehouse_count FROM mm_materials m LEFT JOIN (SELECT material_id, SUM(quantity_on_hand)::numeric AS total_stock, SUM(quantity_on_hand * unit_cost)::numeric(15,2) AS stock_value, COUNT(DISTINCT warehouse_id)::int AS warehouse_count FROM wms_stock_levels GROUP BY material_id) s ON s.material_id = m.id WHERE m.is_active = true AND (m.name ILIKE ${'%' + search + '%'} OR m.sku ILIKE ${'%' + search + '%'}) ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : category
        ? exec(sql`SELECT m.*, COALESCE(s.total_stock, 0)::numeric AS total_stock, COALESCE(s.stock_value, 0)::numeric(15,2) AS stock_value, COALESCE(s.warehouse_count, 0)::int AS warehouse_count FROM mm_materials m LEFT JOIN (SELECT material_id, SUM(quantity_on_hand)::numeric AS total_stock, SUM(quantity_on_hand * unit_cost)::numeric(15,2) AS stock_value, COUNT(DISTINCT warehouse_id)::int AS warehouse_count FROM wms_stock_levels GROUP BY material_id) s ON s.material_id = m.id WHERE m.is_active = true AND m.category = ${category} ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT m.*, COALESCE(s.total_stock, 0)::numeric AS total_stock, COALESCE(s.stock_value, 0)::numeric(15,2) AS stock_value, COALESCE(s.warehouse_count, 0)::int AS warehouse_count FROM mm_materials m LEFT JOIN (SELECT material_id, SUM(quantity_on_hand)::numeric AS total_stock, SUM(quantity_on_hand * unit_cost)::numeric(15,2) AS stock_value, COUNT(DISTINCT warehouse_id)::int AS warehouse_count FROM wms_stock_levels GROUP BY material_id) s ON s.material_id = m.id WHERE m.is_active = true ORDER BY m.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
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

  async createMaterial(body: Row): Promise<Result<Row>>  {
  try {
      // Repoint WRITER to canonical material_cards (mm_materials = empty staging).
      // Map create DTO -> material_cards columns. kod is UNIQUE NOT NULL — generate if absent.
      const kod = (body.code ?? body.kod) as string | undefined ?? `MAT-${Date.now()}`;
      const xomAshyo = (body.name ?? body.xom_ashyo ?? '') as string;
      const unit = (body.unit ?? body.unitOfMeasure ?? body.unit_of_measure ?? '') as string;
      const category = (body.category ?? null) as string | null;
      const minStock = (body.minStock ?? body.min_stock ?? null) as number | null;
      const maxStock = (body.maxStock ?? body.max_stock ?? null) as number | null;
      const unitPrice = (body.unitPrice ?? body.unit_price ?? null) as number | null;
      const description = (body.description ?? null) as string | null;
      const isActive = body.is_active === false ? false : true;
      const r = await exec(sql`
        INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, category, min_stock, max_stock, unit_price, description, is_active, created_at)
        VALUES (${kod}, ${xomAshyo}, ${unit}, ${category}, ${minStock}, ${maxStock}, ${unitPrice}, ${description}, ${isActive}, NOW())
        RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
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
      return exec(sql`SELECT pol.*, po.created_at, v.name AS vendor_name, po.status FROM purchase_order_items pol JOIN mm_purchase_orders po ON po.id = pol.purchase_order_id JOIN mm_vendors v ON v.id = po.vendor_id WHERE pol.material_id = ${id} ORDER BY po.created_at DESC LIMIT 10`);  } catch (_e) {
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
      // Repoint WRITER to canonical material_cards. name -> xom_ashyo; min/max_quantity -> min/max_stock.
      const r = await exec(sql`UPDATE material_cards SET xom_ashyo = COALESCE(${body.name ?? body.xom_ashyo ?? null}, xom_ashyo), description = COALESCE(${body.description ?? null}, description), category = COALESCE(${body.category ?? null}, category), unit_of_measure = COALESCE(${body.unit ?? body.unitOfMeasure ?? body.unit_of_measure ?? null}, unit_of_measure), min_stock = COALESCE(${body.min_quantity ?? body.minStock ?? body.min_stock ?? null}, min_stock), max_stock = COALESCE(${body.max_quantity ?? body.maxStock ?? body.max_stock ?? null}, max_stock), is_active = COALESCE(${body.is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteMaterial(id: number): Promise<Result<Row>>  {
  try {
      // Repoint WRITER to canonical material_cards (soft-delete).
      const r = await exec(sql`UPDATE material_cards SET is_active = false, updated_at = NOW() WHERE id = ${id} RETURNING id`);
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
