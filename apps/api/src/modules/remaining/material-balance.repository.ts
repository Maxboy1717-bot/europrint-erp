/**
 * @module material-balance.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class MaterialBalanceRepository {
  async getOverview(): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(id) AS total_count, COALESCE(SUM(current_stock * COALESCE(unit_price, 0)), 0) AS total_stock_value, COUNT(*) FILTER (WHERE current_stock < min_stock AND current_stock > 0) AS low_stock_count, COUNT(*) FILTER (WHERE current_stock <= 0) AS critical_stock_count FROM material_cards WHERE is_active = true`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAlerts(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.id, mc.kod, mc.xom_ashyo, mc.xom_ashyo_ru, mc.current_stock, mc.min_stock, mc.max_stock, mc.unit_of_measure, mc.unit_price, mc.warehouse_id, w.name AS warehouse_name, w.code AS warehouse_code FROM material_cards mc LEFT JOIN warehouses w ON w.id = mc.warehouse_id WHERE mc.is_active = true AND (mc.current_stock < mc.min_stock OR mc.current_stock <= 0) ORDER BY mc.current_stock ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getInternalRequests(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ir.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, w.name AS from_warehouse_name FROM internal_requests ir LEFT JOIN material_cards mc ON mc.id = ir.material_id LEFT JOIN warehouses w ON w.id = ir.warehouse_id ORDER BY ir.created_at DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async approveRequest(id: number, userId: number, note: unknown): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE internal_requests SET status = 'approved', approved_by = ${userId}, approved_at = NOW(), approval_note = ${note ?? null} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { error: 'Request not found' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async issueRequest(id: number): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE internal_requests SET status = 'issued', issued_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { error: 'Request not found' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProduction(): Promise<Result<Row[]>>  {
  try {
      // FIX (iter-76): old query referenced pmb.material_card_id (column does not exist on
      // production_material_balance) → 42703 → "production" tab fully broken (500). The FE
      // ProductionStock reader expects a material STOCK list (materialId/kod/xomAshyo/currentStock/
      // minStock/unitOfMeasure/unitPrice/warehouseName) — production raw-material stock, NOT movements.
      // Return that shape with camelCase aliases the FE reads directly.
      return exec(sql`
        SELECT mc.id            AS "materialId",
               mc.kod           AS "kod",
               mc.xom_ashyo     AS "xomAshyo",
               mc.current_stock AS "currentStock",
               mc.min_stock     AS "minStock",
               mc.unit_of_measure AS "unitOfMeasure",
               mc.unit_price    AS "unitPrice",
               NULL             AS "warehouseName"
        FROM material_cards mc
        WHERE mc.is_active = true
        ORDER BY mc.xom_ashyo`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async productionAction(body: Row, actionType: string): Promise<Result<Row>>  {
  try {
      // FIX (iter-76): old INSERT wrote material_card_id/production_order_id/action_type/quantity —
      // none exist on production_material_balance → 42703, and material_id/material_name (NOT NULL)
      // were never written → 23502. Rewrite to real cols; material_id/material_name come from a
      // material_cards lookup (no fabrication); qty routed to the column matching the action.
      const materialCardId = body['materialCardId'] ?? null;
      const qty            = body['quantity'] ?? 0;
      const notes          = body['notes'] ?? body['reason'] ?? null;
      const papkaOrderId   = body['papkaOrderId'] ?? body['productionOrderId'] ?? null;
      const operatorId     = body['operatorId'] ?? null;
      const r = await exec(sql`
        INSERT INTO production_material_balance
          (material_id, material_name, unit, action, taken_qty, used_qty, returned_qty, notes, papka_order_id, operator_id, created_at)
        SELECT mc.id, mc.xom_ashyo, COALESCE(mc.unit_of_measure, 'dona'), ${actionType},
               CASE WHEN ${actionType} = 'take'   THEN ${qty} ELSE 0 END,
               CASE WHEN ${actionType} = 'use'    THEN ${qty} ELSE 0 END,
               CASE WHEN ${actionType} = 'return' THEN ${qty} ELSE 0 END,
               ${notes}, ${papkaOrderId}, ${operatorId}, NOW()
        FROM material_cards mc WHERE mc.id = ${materialCardId}
        RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getNegativeStock(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT id, kod, xom_ashyo, current_stock, min_stock, unit_of_measure FROM material_cards WHERE is_active = true AND current_stock < 0 ORDER BY current_stock ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getHistory(materialId: number, startDate: string | null, endDate: string | null): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM warehouse_transactions WHERE material_card_id = ${materialId} AND (${startDate}::text IS NULL OR transaction_date >= ${startDate}::date) AND (${endDate}::text IS NULL OR transaction_date <= ${endDate}::date) ORDER BY transaction_date DESC, created_at DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getReconciliation(materialId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT id, kod, xom_ashyo, current_stock, min_stock, max_stock, unit_of_measure, unit_price FROM material_cards WHERE id = ${materialId} LIMIT 1`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getByWarehouse(warehouseId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.*, w.name AS warehouse_name FROM material_cards mc LEFT JOIN warehouses w ON w.id = mc.warehouse_id WHERE mc.warehouse_id = ${warehouseId} AND mc.is_active = true ORDER BY mc.xom_ashyo ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
