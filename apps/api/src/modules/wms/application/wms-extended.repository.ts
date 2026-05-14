/**
 * @module wms-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { execWmsAlertInsert } from '@common/database/queries-remaining';
import { safeInt } from '../../hr/common/db-rows';

type Row = Record<string, unknown>;

@Injectable()
export class WmsExtendedRepository {
  async getTotalStats(): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT COUNT(DISTINCT material_id)::int AS total_materials,
               COUNT(DISTINCT warehouse_id)::int AS total_warehouses,
               COALESCE(SUM(quantity_on_hand), 0)::numeric AS total_quantity,
               COALESCE(SUM(quantity_on_hand * unit_cost), 0)::numeric(15,2) AS total_value,
               COUNT(*) FILTER (WHERE quantity_on_hand <= min_stock AND min_stock > 0)::int AS low_stock_count
        FROM wms_stock_levels
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getFifoCostBatches(mid: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT material_id, batch_number, quantity_on_hand, unit_cost,
               (quantity_on_hand * unit_cost) AS batch_value, received_at
        FROM wms_stock_batches
        WHERE material_id = ${mid} AND quantity_on_hand > 0
        ORDER BY received_at ASC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listTransactions(wid: number | null, mid: number | null, type: string | undefined, from: string | undefined, to: string | undefined, lim: number, off: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT t.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name, e.full_name AS created_by_name
        FROM wms_transactions t
        LEFT JOIN mm_materials m ON m.id = t.material_id
        LEFT JOIN wms_warehouses w ON w.id = t.warehouse_id
        LEFT JOIN employees e ON e.id = t.created_by
        WHERE t.deleted_at IS NULL
          AND (${wid}::int IS NULL OR t.warehouse_id = ${wid})
          AND (${mid}::int IS NULL OR t.material_id = ${mid})
          AND (${type ?? null}::text IS NULL OR t.type = ${type ?? null})
          AND (${from ?? null}::text IS NULL OR t.created_at::date >= ${from ?? null}::date)
          AND (${to ?? null}::text IS NULL OR t.created_at::date <= ${to ?? null}::date)
        ORDER BY t.created_at DESC LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createTransaction(body: Row, userId: number | null): Promise<Result<Row>>  {
  try {  
      const { warehouse_id, material_id, type, quantity, unit_cost, batch_number, reference_id, notes } = body;
      const rows = await runQuery<Row>(sql`
        INSERT INTO wms_transactions (warehouse_id, material_id, type, quantity, unit_cost, batch_number, reference_id, created_by, notes)
        VALUES (${safeInt(String(warehouse_id), 0)}, ${safeInt(String(material_id), 0)}, ${type}, ${quantity ?? 0}, ${unit_cost ?? null}, ${batch_number ?? null}, ${reference_id ?? null}, ${userId}, ${notes ?? null})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAlerts(wid: number | null, type?: string): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT a.*, m.name AS material_name, w.name AS warehouse_name
        FROM wms_alerts a
        LEFT JOIN mm_materials m ON m.id = a.material_id
        LEFT JOIN wms_warehouses w ON w.id = a.warehouse_id
        WHERE a.is_resolved = false
          AND (${wid}::int IS NULL OR a.warehouse_id = ${wid})
          AND (${type ?? null}::text IS NULL OR a.type = ${type ?? null})
        ORDER BY a.severity DESC, a.created_at DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLowStockItems(): Promise<Result<unknown[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT sl.material_id, sl.warehouse_id, sl.quantity_on_hand, sl.min_stock, m.name AS material_name
        FROM wms_stock_levels sl
        JOIN mm_materials m ON m.id = sl.material_id
        WHERE sl.quantity_on_hand <= sl.min_stock AND sl.min_stock > 0
      `);
      return Ok(rows.rows as Record<string, unknown>[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findExistingLowStockAlert(materialId: number, warehouseId: number): Promise<Result<boolean>>  {
  try {  
      const rows = await runQuery<{ id: number }>(sql`
        SELECT id FROM wms_alerts
        WHERE material_id = ${materialId} AND warehouse_id = ${warehouseId} AND type = 'low_stock' AND is_resolved = false
        LIMIT 1
      `);
      return Ok(rows.rows.length > 0);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createLowStockAlert(materialId: number, warehouseId: number, materialName: string): Promise<Result<void>>  {
  try {  
      await execWmsAlertInsert(materialId, warehouseId, materialName);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async batchInsertLowStockAlerts(
    items: ReadonlyArray<{ material_id: number; warehouse_id: number; material_name: string }>,
  ): Promise<Result<{ inserted: number }>> {
    if (!items.length) return Ok({ inserted: 0 });
    try {
      const valuesChunks = (Array.isArray(items) ? items : []).map((i) =>
        sql`(${i.material_id}, ${i.warehouse_id}, 'low_stock', 'high', ${'Low stock: ' + i.material_name}, false, NOW())`
      );
      const valuesSql = sql.join(valuesChunks, sql`, `);
      const rows = await runQuery<{ id: number }>(sql`
        INSERT INTO wms_alerts (material_id, warehouse_id, type, severity, message, is_resolved, created_at)
        VALUES ${valuesSql}
        ON CONFLICT (material_id, warehouse_id) WHERE type = 'low_stock' AND is_resolved = false
        DO NOTHING
        RETURNING id
      `);
      return Ok({ inserted: rows.rows.length });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getReplenishmentSuggestions(wid: number | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT sl.material_id, sl.warehouse_id, m.name AS material_name,
               sl.quantity_on_hand, sl.min_stock, sl.max_stock,
               (sl.max_stock - sl.quantity_on_hand) AS suggested_order_qty, m.unit_of_measure
        FROM wms_stock_levels sl
        JOIN mm_materials m ON m.id = sl.material_id
        WHERE sl.quantity_on_hand < sl.min_stock AND sl.min_stock > 0
          AND (${wid}::int IS NULL OR sl.warehouse_id = ${wid})
        ORDER BY (sl.min_stock - sl.quantity_on_hand) DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLowStock(wid: number | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT sl.*, m.name AS material_name, m.unit_of_measure, m.sku, w.name AS warehouse_name,
               (sl.min_stock - sl.quantity_on_hand) AS shortage
        FROM wms_stock_levels sl
        JOIN mm_materials m ON m.id = sl.material_id
        JOIN wms_warehouses w ON w.id = sl.warehouse_id
        WHERE sl.quantity_on_hand <= sl.min_stock AND sl.min_stock > 0
          AND (${wid}::int IS NULL OR sl.warehouse_id = ${wid})
        ORDER BY (sl.min_stock - sl.quantity_on_hand) DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async scanBarcode(barcode: string): Promise<Result<Row | null>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name
        FROM wms_stock_batches b
        JOIN mm_materials m ON m.id = b.material_id
        JOIN wms_warehouses w ON w.id = b.warehouse_id
        WHERE (b.batch_number = ${barcode} OR m.barcode = ${barcode} OR m.sku = ${barcode})
          AND b.deleted_at IS NULL
        LIMIT 1
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
