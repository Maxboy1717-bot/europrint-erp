/**
 * @module schema-pos-ext
 * @description Source module. See exports for details.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  serial,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// ============================================================================
// POS — Warehouse Movements
// ============================================================================
// pos_movement_types, pos_movements, pos_movement_lines are canonically defined
// in lib/db and re-exported here (with snake_case aliases) for backwards compat.
export {
  posMovementTypes as pos_movement_types,
  posMovements as pos_movements,
  posMovementLines as pos_movement_lines,
} from '@workspace/db';

export const pos_warehouse_access = pgTable('pos_warehouse_access', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  warehouseId: uuid('warehouse_id').notNull(),
  canRead: boolean('can_read').default(true),
  canWrite: boolean('can_write').default(false),
  canApprove: boolean('can_approve').default(false),
  grantedBy: text('granted_by').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// POS v2 — Inventory Counts
// ============================================================================

// NOTE: id/warehouseId/countId corrected 2026-07-02 — this table was declared
// uuid here but the live DB column (`information_schema.columns`, verified via
// _audit/q.cjs) is `integer` (id = serial, warehouse_id/count_id = integer).
// This pgTable is not used as a Drizzle query builder anywhere (all real reads/
// writes go through parameterised raw SQL — see wms-gateway-inventory.controller.ts,
// wms-cycle-count-generator.cron.ts, inventory-advanced.repo.ts); it only feeds
// the `schema` barrel object, so this is a type-correctness fix, not a migration.
export const inventory_counts = pgTable('inventory_counts', {
  id: serial('id').primaryKey(),
  warehouseId: integer('warehouse_id'),
  countNumber: text('count_number').unique().notNull(),
  status: text('status').notNull().default('draft'),
  startedBy: text('started_by'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const inventory_count_lines = pgTable('inventory_count_lines', {
  id: serial('id').primaryKey(),
  countId: integer('count_id').notNull().references(() => inventory_counts.id),
  stockItemId: uuid('stock_item_id'),
  sku: text('sku').notNull(),
  itemName: text('item_name').notNull(),
  systemQuantity: decimal('system_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  countedQuantity: decimal('counted_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  variance: decimal('variance', { precision: 12, scale: 3 }).notNull().default('0'),
  unit: text('unit').notNull().default('pcs'),
  location: text('location'),
  notes: text('notes'),
});

export const transfer_requests = pgTable('transfer_requests', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  requestNumber: text('request_number').unique().notNull(),
  fromWarehouseId: uuid('from_warehouse_id').notNull(),
  toWarehouseId: uuid('to_warehouse_id').notNull(),
  status: text('status').notNull().default('pending'),
  reason: text('reason').notNull(),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const transfer_request_lines = pgTable('transfer_request_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  requestId: uuid('request_id').references(() => transfer_requests.id),
  stockItemId: uuid('stock_item_id').notNull(),
  itemName: text('item_name').notNull(),
  sku: text('sku').notNull(),
  requestedQty: decimal('requested_qty', { precision: 12, scale: 3 }).notNull(),
  approvedQty: decimal('approved_qty', { precision: 12, scale: 3 }),
  unit: text('unit').notNull().default('pcs'),
});

// ============================================================================
// MM — Materials Master Data
// ============================================================================

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  materialCode: text('material_code').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('raw_material'),
  unitOfMeasure: text('unit_of_measure').notNull().default('kg'),
  minStock: decimal('min_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  maxStock: decimal('max_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  unitCost: decimal('unit_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
