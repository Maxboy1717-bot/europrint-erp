/**
 * @module sprint2-migration.constants
 * @description Static constraint definitions extracted from sprint2-migration.service.ts
 *   to keep the service file <300 lines (Rule 16).
 */

export interface Sprint2ConstraintDef {
  table: string;
  name: string;
  definition: string;
}

/**
 * ALTER TABLE ADD CONSTRAINT definitions, applied idempotently via DO $$ ... EXCEPTION
 * WHEN duplicate_object END $$ wrapper. Safe to run repeatedly on existing tables.
 */
export const SPRINT2_CONSTRAINT_DEFINITIONS: ReadonlyArray<Sprint2ConstraintDef> = [
  { table: 'supplier_price_tiers',    name: 'spt_unit_price_pos',          definition: 'CHECK (unit_price > 0)' },
  { table: 'supplier_price_tiers',    name: 'spt_min_qty_nonneg',          definition: 'CHECK (min_qty >= 0)' },
  { table: 'inventory_policy',        name: 'ip_safety_stock_nonneg',      definition: 'CHECK (safety_stock >= 0)' },
  { table: 'inventory_policy',        name: 'ip_reorder_point_nonneg',     definition: 'CHECK (reorder_point >= 0)' },
  { table: 'inventory_policy',        name: 'ip_lead_time_pos',            definition: 'CHECK (lead_time_days IS NULL OR lead_time_days > 0)' },
  { table: 'inventory_policy',        name: 'ip_service_level_range',      definition: 'CHECK (service_level IS NULL OR (service_level > 0 AND service_level < 1))' },
  { table: 'inventory_policy',        name: 'ip_abc_class_enum',           definition: "CHECK (abc_class IN ('A','B','C'))" },
  { table: 'material_recommendation', name: 'mr_eoq_qty_pos',              definition: 'CHECK (eoq_qty > 0)' },
  { table: 'pp_mrp_run_lines',        name: 'mrpl_gross_req_nonneg',       definition: 'CHECK (gross_req >= 0)' },
  { table: 'pp_mrp_run_lines',        name: 'mrpl_net_req_nonneg',         definition: 'CHECK (net_req >= 0)' },
  { table: 'pp_mrp_run_lines',        name: 'mrpl_planned_order_nonneg',   definition: 'CHECK (planned_order >= 0)' },
  { table: 'mps_periods',             name: 'mps_quantity_nonneg',         definition: 'CHECK (quantity >= 0)' },
  { table: 'product_learning_curves', name: 'plc_t1_hours_pos',            definition: 'CHECK (t1_hours > 0)' },
  { table: 'product_learning_curves', name: 'plc_learning_rate_range',     definition: 'CHECK (learning_rate > 0 AND learning_rate < 1)' },
  { table: 'pp_routing_operations',   name: 'pro_run_time_pos',            definition: 'CHECK (run_time_per_unit_min > 0)' },
  { table: 'pp_routing_operations',   name: 'pro_sequence_pos',            definition: 'CHECK (sequence > 0)' },
];
