/**
 * @module invariants/constraints-data
 * @description CHECK constraint definitions for DB invariants.
 */

export interface ConstraintDef { name: string; table: string; check: string }

export const DB_CONSTRAINTS: Array<ConstraintDef> = [
  // ── Inventar ─────────────────────────────────────────────────
  {
    name: 'chk_inventory_qty_non_negative',
    table: 'wms_inventory_batches',
    check: 'quantity_on_hand >= 0',
  },
  {
    name: 'chk_stock_items_quantity_non_negative',
    table: 'stock_items',
    check: 'quantity::numeric >= 0',
  },
  {
    name: 'chk_stock_items_cost_non_negative',
    table: 'stock_items',
    check: 'cost_price::numeric >= 0',
  },
  // ── Ishlab chiqarish (PP/MES) ─────────────────────────────────
  {
    name: 'chk_bom_no_self_reference',
    table: 'pp_bom_components',
    check: 'parent_id != component_id',
  },
  {
    name: 'chk_production_orders_qty_positive',
    table: 'production_orders',
    check: 'planned_quantity::numeric > 0',
  },
  {
    name: 'chk_production_orders_qty_non_negative',
    table: 'production_orders',
    check: 'confirmed_quantity::numeric >= 0',
  },
  // ── Maosh (HR) ───────────────────────────────────────────────
  {
    name: 'chk_payroll_net_lte_gross',
    table: 'hr_payroll_records',
    check: 'net_salary <= gross_salary',
  },
  {
    name: 'chk_payroll_net_non_negative',
    table: 'hr_payroll_records',
    check: 'net_salary >= 0',
  },
  {
    name: 'chk_payroll_gross_non_negative',
    table: 'hr_payroll_records',
    check: 'gross_salary >= 0',
  },
  // ── Buyurtmalar (Sales / CRM) ────────────────────────────────
  {
    name: 'chk_sales_orders_total_non_negative',
    table: 'sales_orders',
    check: 'total_amount::numeric >= 0',
  },
  // ── Hisob-faktura (Finance) ──────────────────────────────────
  {
    name: 'chk_invoices_total_non_negative',
    table: 'invoices',
    check: 'total_amount::numeric >= 0',
  },
  {
    name: 'chk_invoices_paid_lte_total',
    table: 'invoices',
    check: 'paid_amount::numeric <= total_amount::numeric',
  },
  {
    name: 'chk_invoices_paid_non_negative',
    table: 'invoices',
    check: 'paid_amount::numeric >= 0',
  },
  // ── Budjet (Finance) ─────────────────────────────────────────
  {
    name: 'chk_budget_lines_planned_non_negative',
    table: 'budget_lines',
    check: 'planned_amount::numeric >= 0',
  },
  {
    name: 'chk_budget_lines_actual_non_negative',
    table: 'budget_lines',
    check: 'actual_amount::numeric >= 0',
  },
  // ── Xarid buyurtmalari (WMS) ─────────────────────────────────
  {
    name: 'chk_purchase_orders_qty_positive',
    table: 'purchase_orders',
    check: 'quantity::numeric > 0',
  },
  // ── Sensorlar (IoT) ──────────────────────────────────────────
  {
    name: 'chk_sensor_devices_latitude_range',
    table: 'sensor_devices',
    check: "latitude IS NULL OR (latitude::numeric BETWEEN -90 AND 90)",
  },
  {
    name: 'chk_sensor_devices_longitude_range',
    table: 'sensor_devices',
    check: "longitude IS NULL OR (longitude::numeric BETWEEN -180 AND 180)",
  },
  // ── HR ta'til (HR) ───────────────────────────────────────────
  {
    name: 'chk_leave_requests_end_gte_start',
    table: 'leave_requests',
    check: 'end_date >= start_date',
  },
  // ── Sifat nazorati (QC) ──────────────────────────────────────
  {
    name: 'chk_qc_defects_count_non_negative',
    table: 'qc_defects',
    check: 'defect_count >= 0',
  },
  // ── Paymentlar ───────────────────────────────────────────────
  {
    name: 'chk_payments_amount_positive',
    table: 'payments',
    check: 'amount::numeric > 0',
  },
];
