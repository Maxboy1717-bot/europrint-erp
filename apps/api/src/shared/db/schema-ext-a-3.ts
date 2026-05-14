/**
 * @module schema-ext-a-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

export const boms_int = pgTable('boms', {
  id:           serial('id').primaryKey(),
  product_name: text('product_name'),
  version:      text('version').default('1.0'),
  is_active:    boolean('is_active').default(true),
  created_by:   text('created_by'),
  items:        jsonb('items').default([]),
  created_at:   timestamp('created_at').defaultNow(),
});

export const routings_int = pgTable('routings', {
  id:           serial('id').primaryKey(),
  name:         text('name'),
  is_active:    boolean('is_active').default(true),
  created_by:   text('created_by'),
  steps:        jsonb('steps').default([]),
  work_centers: jsonb('work_centers').default([]),
  created_at:   timestamp('created_at').defaultNow(),
});

export const production_orders_int = pgTable('production_orders', {
  id:              serial('id').primaryKey(),
  sales_order_id:  integer('sales_order_id'),
  status:          text('status').default('pending'),
  bom_id:          integer('bom_id'),
  routing_id:      integer('routing_id'),
  scheduled_start: timestamp('scheduled_start'),
  scheduled_end:   timestamp('scheduled_end'),
  order_number:    text('order_number'),
  product_name:    text('product_name'),
  quantity:        integer('quantity'),
  unit:            text('unit'),
  created_by:      text('created_by'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const routing_operations_int = pgTable('routing_operations', {
  id:             serial('id').primaryKey(),
  routing_id:     integer('routing_id'),
  work_center_id: integer('work_center_id'),
  name:           text('name'),
  sequence:       integer('sequence').default(0),
  created_at:     timestamp('created_at').defaultNow(),
});

// ─── WMS Extended Tables ──────────────────────────────────────────────────────

export const wms_warehouses = pgTable('wms_warehouses', {
  id:         serial('id').primaryKey(),
  name:       text('name').notNull(),
  location:   text('location'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const wms_transfers = pgTable('wms_transfers', {
  id:                serial('id').primaryKey(),
  from_warehouse_id: integer('from_warehouse_id'),
  to_warehouse_id:   integer('to_warehouse_id'),
  material_id:       integer('material_id'),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }),
  requested_by:      integer('requested_by'),
  notes:             text('notes'),
  status:            text('status').default('pending'),
  created_at:        timestamp('created_at').defaultNow(),
});

export const wms_internal_requests = pgTable('wms_internal_requests', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  material_id:  integer('material_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  requested_by: integer('requested_by'),
  notes:        text('notes'),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const wms_inventory_counts = pgTable('wms_inventory_counts', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  status:       text('status'),
  created_at:   timestamp('created_at').defaultNow(),
});
