/**
 * @module pos-reports.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { Ok, Err, Result, safeCall } from '@common/result';

import { Injectable } from '@nestjs/common';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosReportsRepository {
  async getKpi(): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM pos_movements WHERE status = 'pending') AS pending_approvals, (SELECT COUNT(*) FROM pos_movements WHERE status = 'qc_pending') AS qc_pending, (SELECT COUNT(*) FROM pos_material_requests WHERE status = 'pending') AS pending_requests, (SELECT COUNT(*) FROM employee_liability_cases WHERE status IN ('OPEN', 'UNDER_REVIEW')) AS open_liabilities, (SELECT COUNT(*) FROM material_card_suggestions WHERE status = 'PENDING') AS ai_suggestions_pending, (SELECT COUNT(*) FROM pos_inventory_counts WHERE status IN ('draft', 'in_progress', 'review')) AS active_counts, (SELECT COUNT(*) FROM pos_barcode_print_queue WHERE status = 'QUEUED') AS print_queue, (SELECT COALESCE(SUM(quantity_on_hand), 0) FROM current_stock) AS total_stock_qty, (SELECT COUNT(*) FROM pos_movements WHERE created_at >= NOW() - INTERVAL '24 hours') AS movements_today`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getStockReport(warehouseId?: string, category?: string): Promise<Result<Row[]>>  {
  try {  
      return warehouseId && category
        ? exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_id WHERE cs.warehouse_id = ${warehouseId} AND mc.material_type = ${category} ORDER BY w.name, mc.xom_ashyo`)
        : warehouseId
        ? exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_id WHERE cs.warehouse_id = ${warehouseId} ORDER BY w.name, mc.xom_ashyo`)
        : exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_id = cs.material_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_id ORDER BY w.name, mc.xom_ashyo`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMovementStats(interval: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT movement_type AS movement_type, movement_type AS movement_type_name, COUNT(*) AS count, COUNT(*) AS completed, 0 AS cancelled FROM material_movements WHERE created_at >= NOW() - (${interval})::interval GROUP BY movement_type ORDER BY count DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTopMaterials(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.id, mc.xom_ashyo AS material_name, mc.unit_of_measure, SUM(pml.quantity::numeric) AS total_issued_qty, COUNT(DISTINCT pm.id) AS movement_count FROM pos_movement_lines pml JOIN pos_movements pm ON pm.id = pml.movement_id JOIN pos_movement_types pmt ON pmt.id = pm.movement_type_id JOIN material_cards mc ON mc.id = pml.material_id WHERE pm.created_at >= NOW() - INTERVAL '30 days' AND pmt.code = 'INTERNAL_ISSUE' AND pm.status = 'completed' GROUP BY mc.id, mc.xom_ashyo, mc.unit_of_measure ORDER BY total_issued_qty DESC LIMIT 20`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getThreeWayMismatch(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pm.movement_number, pm.supplier_name, pm.created_at, t3.purchase_order_id, t3.goods_receipt_id, t3.invoice_id, t3.qty_variance, t3.price_variance, t3.overall_match FROM pos_three_way_match t3 JOIN pos_movements pm ON pm.id = t3.pos_movement_id WHERE t3.overall_match = FALSE ORDER BY pm.created_at DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLiabilityReport(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT elc.*, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, u.department AS department_code, mc.xom_ashyo AS material_name, mc.unit_of_measure FROM employee_liability_cases elc JOIN users u ON u.id = elc.user_id JOIN material_cards mc ON mc.id = elc.material_id WHERE elc.status IN ('OPEN', 'UNDER_REVIEW') ORDER BY elc.assessed_value::numeric DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAbcAnalysis(warehouseId?: string): Promise<Result<Row[]>> {
    try {
      const whereClause = warehouseId
        ? sql`WHERE cs.warehouse_id = ${warehouseId}`
        : sql`WHERE 1=1`;
      return exec(sql`
        WITH ranked AS (
          SELECT
            mc.id                AS material_card_id,
            mc.xom_ashyo         AS material_name,
            mc.unit_of_measure,
            mc.material_type,
            COALESCE(cs.quantity_on_hand, 0)    AS qty_on_hand,
            COALESCE(mc.unit_price, mc.last_purchase_price, 0) AS unit_price,
            COALESCE(cs.quantity_on_hand, 0) * COALESCE(mc.unit_price, mc.last_purchase_price, 0) AS total_value,
            SUM(COALESCE(cs.quantity_on_hand, 0) * COALESCE(mc.unit_price, mc.last_purchase_price, 0))
              OVER () AS grand_total
          FROM current_stock cs
          JOIN material_cards mc ON mc.id = cs.material_id
          ${whereClause}
          AND mc.is_active = true
        ),
        cumulative AS (
          SELECT *,
            SUM(total_value) OVER (ORDER BY total_value DESC) AS cumulative_value,
            CASE
              WHEN grand_total = 0 THEN 0
              ELSE ROUND((total_value / grand_total * 100)::numeric, 2)
            END AS pct_of_total,
            ROUND((SUM(total_value) OVER (ORDER BY total_value DESC) / NULLIF(grand_total, 0) * 100)::numeric, 2) AS cumulative_pct
          FROM ranked
        )
        SELECT
          material_card_id,
          material_name,
          unit_of_measure,
          material_type,
          qty_on_hand,
          unit_price,
          total_value,
          pct_of_total,
          cumulative_pct,
          CASE
            WHEN cumulative_pct <= 80 THEN 'A'
            WHEN cumulative_pct <= 95 THEN 'B'
            ELSE 'C'
          END AS abc_class
        FROM cumulative
        ORDER BY total_value DESC
        LIMIT 500
      `);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getInactiveMaterials(inactiveDays: number, warehouseId?: string): Promise<Result<Row[]>> {
    try {
      const whereWh = warehouseId ? sql`AND cs.warehouse_id = ${warehouseId}` : sql``;
      return exec(sql`
        SELECT
          mc.id             AS material_card_id,
          mc.xom_ashyo      AS material_name,
          mc.unit_of_measure,
          mc.material_type,
          cs.warehouse_id,
          COALESCE(cs.quantity_on_hand, 0) AS qty_on_hand,
          cs.last_movement_at,
          EXTRACT(DAY FROM NOW() - cs.last_movement_at)::int AS days_inactive
        FROM current_stock cs
        JOIN material_cards mc ON mc.id = cs.material_id
        WHERE mc.is_active = true
          AND COALESCE(cs.quantity_on_hand, 0) > 0
          AND (cs.last_movement_at IS NULL OR cs.last_movement_at < NOW() - (${inactiveDays} || ' days')::interval)
          ${whereWh}
        ORDER BY days_inactive DESC NULLS FIRST
        LIMIT 200
      `);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
