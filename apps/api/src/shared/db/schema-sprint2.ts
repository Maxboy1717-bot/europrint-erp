/**
 * @module schema-sprint2
 * @description Source module. See exports for details.
 */

import {
  pgTable,
  serial,
  integer,
  numeric,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── WMS: Supplier Price Tiers (EOQ All-Units Quantity Discounts) ─────────────

export const supplier_price_tiers = pgTable(
  'supplier_price_tiers',
  {
    id: serial('id').primaryKey(),
    supplier_id: integer('supplier_id'),
    material_id: integer('material_id').notNull(),
    min_qty: numeric('min_qty', { precision: 12, scale: 2 }).notNull().default('0'),
    max_qty: numeric('max_qty', { precision: 12, scale: 2 }),
    unit_price: numeric('unit_price', { precision: 18, scale: 4 }).notNull(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('spt_material_idx').on(t.material_id),
  ],
);

// ─── WMS: Inventory Policy (Safety Stock, ROP, EOQ, Lead Time) ────────────────

export const inventory_policy = pgTable(
  'inventory_policy',
  {
    id: serial('id').primaryKey(),
    material_id: integer('material_id').notNull().unique(),
    eoq: numeric('eoq', { precision: 12, scale: 2 }).default('0'),
    safety_stock: numeric('safety_stock', { precision: 12, scale: 2 }).notNull().default('0'),
    reorder_point: numeric('reorder_point', { precision: 12, scale: 2 }).notNull().default('0'),
    lead_time_days: integer('lead_time_days').default(1),
    // 10-wms #39: event-driven reorder recompute audit timestamp (NULL until first lead-time-change recompute)
    reorder_recomputed_at: timestamp('reorder_recomputed_at', { withTimezone: true }),
    review_period_days: integer('review_period_days').default(7),
    abc_class: text('abc_class').default('C'),
    service_level: numeric('service_level', { precision: 5, scale: 4 }).default('0.95'),
    lot_sizing_method: text('lot_sizing_method').default('EOQ'),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('inv_policy_material_idx').on(t.material_id)],
);

// ─── WMS: Material Recommendation (EOQ calculation results) ───────────────────

export const material_recommendation = pgTable(
  'material_recommendation',
  {
    id: serial('id').primaryKey(),
    material_id: integer('material_id').notNull().unique(),
    eoq_qty: numeric('eoq_qty', { precision: 12, scale: 2 }).notNull(),
    total_cost: numeric('total_cost', { precision: 18, scale: 2 }),
    order_frequency: numeric('order_frequency', { precision: 8, scale: 4 }),
    cycle_time_days: numeric('cycle_time_days', { precision: 8, scale: 2 }),
    calculated_at: timestamp('calculated_at').defaultNow(),
    lot_sizing_method: text('lot_sizing_method').default('EOQ'),
  },
  (t) => [index('mat_rec_material_idx').on(t.material_id)],
);

// ─── PP: MPS Periods ──────────────────────────────────────────────────────────

export const mps_periods = pgTable(
  'mps_periods',
  {
    id: serial('id').primaryKey(),
    product_id: text('product_id').notNull(),
    period: text('period').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull().default('0'),
    due_date: text('due_date').notNull(),
    source: text('source').notNull().default('manual'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('mps_period_product_period_idx').on(t.product_id, t.period),
    index('mps_period_product_idx').on(t.product_id),
  ],
);

// ─── PP: MRP Run Log ──────────────────────────────────────────────────────────

export const pp_mrp_runs = pgTable('pp_mrp_runs', {
  id: serial('id').primaryKey(),
  run_at: timestamp('run_at').defaultNow(),
  lot_sizing_method: text('lot_sizing_method').notNull().default('L4L'),
  status: text('status').notNull().default('completed'),
  run_by: text('run_by'),
  notes: text('notes'),
  horizon_periods: integer('horizon_periods').notNull().default(6),
});

export const pp_mrp_run_lines = pgTable(
  'pp_mrp_run_lines',
  {
    id: serial('id').primaryKey(),
    run_id: integer('run_id').notNull(),
    material_id: text('material_id').notNull(),
    period: text('period').notNull(),
    gross_req: numeric('gross_req', { precision: 12, scale: 2 }).notNull().default('0'),
    on_hand: numeric('on_hand', { precision: 12, scale: 2 }).notNull().default('0'),
    scheduled_receipts: numeric('scheduled_receipts', { precision: 12, scale: 2 }).notNull().default('0'),
    net_req: numeric('net_req', { precision: 12, scale: 2 }).notNull().default('0'),
    planned_order: numeric('planned_order', { precision: 12, scale: 2 }).notNull().default('0'),
    release_date: text('release_date'),
  },
  (t) => [
    index('mrp_line_run_idx').on(t.run_id),
    index('mrp_line_material_idx').on(t.material_id),
  ],
);

// ─── PP: Product Learning Curves ──────────────────────────────────────────────

export const product_learning_curves = pgTable('product_learning_curves', {
  id: serial('id').primaryKey(),
  product_id: text('product_id').notNull().unique(),
  operation_name: text('operation_name'),
  t1_hours: numeric('t1_hours', { precision: 8, scale: 4 }).notNull(),
  learning_rate: numeric('learning_rate', { precision: 5, scale: 4 }).notNull().default('0.800'),
  units_produced: integer('units_produced').default(0),
  current_unit_hours: numeric('current_unit_hours', { precision: 8, scale: 4 }),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── PP: Routing Operations ────────────────────────────────────────────────────

export const pp_routing_operations = pgTable(
  'pp_routing_operations',
  {
    id: serial('id').primaryKey(),
    product_id: text('product_id').notNull(),
    work_center_id: text('work_center_id').notNull(),
    sequence: integer('sequence').notNull().default(10),
    setup_time_min: numeric('setup_time_min', { precision: 8, scale: 2 }).notNull().default('0'),
    run_time_per_unit_min: numeric('run_time_per_unit_min', { precision: 8, scale: 4 }).notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('pp_routing_op_product_idx').on(t.product_id),
    index('pp_routing_op_wc_idx').on(t.work_center_id),
  ],
);
