/**
 * @module schema-ext-a-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
// Canonical imports from lib/db (@workspace/db barrel via pp-schema → pp/pp-production)
import {
  routings as canonicalRoutings,
  productionOrders as canonicalProductionOrders,
  routingOperations as canonicalRoutingOperations,
} from '@workspace/db';

// TODO: boms not found in lib/db (only bom_headers/bom_items exist) — kept as local stub
export const boms_int = pgTable('boms', {
  id:           serial('id').primaryKey(),
  product_name: text('product_name'),
  version:      text('version').default('1.0'),
  is_active:    boolean('is_active').default(true),
  created_by:   text('created_by'),
  items:        jsonb('items').default([]),
  created_at:   timestamp('created_at').defaultNow(),
});

// routings: re-exported from canonical definition in @workspace/db (pp/pp-production.ts)
export const routings_int = canonicalRoutings;

// production_orders: re-exported from canonical definition in @workspace/db (pp/pp-production.ts)
export const production_orders_int = canonicalProductionOrders;

// routing_operations: re-exported from canonical definition in @workspace/db (pp/pp-production.ts)
export const routing_operations_int = canonicalRoutingOperations;

// ─── WMS Extended Tables ──────────────────────────────────────────────────────
// TODO: wms_warehouses not found in lib/db (only 'warehouses' exists) — kept as local stub
export const wms_warehouses = pgTable('wms_warehouses', {
  id:         serial('id').primaryKey(),
  name:       text('name').notNull(),
  location:   text('location'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// TODO: wms_transfers not found in lib/db — kept as local stub
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

// TODO: wms_internal_requests not found in lib/db — kept as local stub
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

// TODO: wms_inventory_counts not found in lib/db — kept as local stub
export const wms_inventory_counts = pgTable('wms_inventory_counts', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  status:       text('status'),
  created_at:   timestamp('created_at').defaultNow(),
});
