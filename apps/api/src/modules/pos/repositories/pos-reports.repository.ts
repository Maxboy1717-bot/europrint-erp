import { sql, db } from '@workspace/db';
import { Ok, Err, Result, safeCall } from '@common/result';

import { Injectable } from '@nestjs/common';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

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
        ? exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_card_id WHERE cs.warehouse_id = ${warehouseId} AND mc.material_type = ${category} ORDER BY w.name, mc.xom_ashyo`)
        : warehouseId
        ? exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_card_id WHERE cs.warehouse_id = ${warehouseId} ORDER BY w.name, mc.xom_ashyo`)
        : exec(sql`SELECT cs.warehouse_id, w.name AS warehouse_name, mc.id AS material_card_id, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.material_type, cs.quantity_on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS reserved_qty, cs.quantity_on_hand - COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations sr WHERE sr.material_card_id = cs.material_card_id AND sr.warehouse_id = cs.warehouse_id AND sr.status = 'ACTIVE'), 0) AS available_qty, cs.last_movement_at FROM current_stock cs JOIN warehouses w ON w.id = cs.warehouse_id JOIN material_cards mc ON mc.id = cs.material_card_id ORDER BY w.name, mc.xom_ashyo`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMovementStats(interval: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pmt.code AS movement_type, pmt.name AS movement_type_name, COUNT(*) AS count, SUM(CASE WHEN pm.status = 'completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN pm.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled FROM pos_movements pm JOIN pos_movement_types pmt ON pmt.id = pm.movement_type_id WHERE pm.created_at >= NOW() - (${interval})::interval GROUP BY pmt.code, pmt.name ORDER BY count DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTopMaterials(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.id, mc.xom_ashyo AS material_name, mc.unit_of_measure, SUM(pml.quantity::numeric) AS total_issued_qty, COUNT(DISTINCT pm.id) AS movement_count FROM pos_movement_lines pml JOIN pos_movements pm ON pm.id = pml.movement_id JOIN pos_movement_types pmt ON pmt.id = pm.movement_type_id JOIN material_cards mc ON mc.id = pml.material_card_id WHERE pm.created_at >= NOW() - INTERVAL '30 days' AND pmt.code = 'INTERNAL_ISSUE' AND pm.status = 'completed' GROUP BY mc.id, mc.xom_ashyo, mc.unit_of_measure ORDER BY total_issued_qty DESC LIMIT 20`);  } catch (_e) {
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
      return exec(sql`SELECT elc.*, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, u.department_code, mc.xom_ashyo AS material_name, mc.unit_of_measure FROM employee_liability_cases elc JOIN users u ON u.id = elc.user_id JOIN material_cards mc ON mc.id = elc.material_card_id WHERE elc.status IN ('OPEN', 'UNDER_REVIEW') ORDER BY elc.assessed_value::numeric DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
