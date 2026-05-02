import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// ============================================================================
// POS — Warehouse Movements
// ============================================================================

export const pos_movement_types = pgTable('pos_movement_types', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  direction: text('direction').notNull(),
  requiresDocument: boolean('requires_document').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pos_movements = pgTable('pos_movements', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  movementTypeId: uuid('movement_type_id').references(() => pos_movement_types.id),
  warehouseId: uuid('warehouse_id').notNull(),
  status: text('status').notNull().default('draft'),
  direction: text('direction').notNull(),
  documentRef: text('document_ref'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  completedBy: text('completed_by'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const pos_movement_lines = pgTable('pos_movement_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  movementId: uuid('movement_id').references(() => pos_movements.id),
  stockItemId: uuid('stock_item_id').notNull(),
  stockItemName: text('stock_item_name').notNull(),
  sku: text('sku').notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  unitPrice: decimal('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
  lotNumber: text('lot_number'),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  notes: text('notes'),
});

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

export const inventory_counts = pgTable('inventory_counts', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  warehouseId: uuid('warehouse_id').notNull(),
  countNumber: text('count_number').unique().notNull(),
  status: text('status').notNull().default('draft'),
  startedBy: text('started_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const inventory_count_lines = pgTable('inventory_count_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  countId: uuid('count_id').references(() => inventory_counts.id),
  stockItemId: uuid('stock_item_id').notNull(),
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
