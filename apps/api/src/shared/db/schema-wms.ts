/**
 * @module schema-wms
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
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { stockMovementTypeEnum, purchaseOrderStatusEnum, qcStatusEnum } from './schema-enums';
import { users } from './schema-core';

// ============================================================================
// WMS (Warehouse Management System)
// ============================================================================

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    address: text('address'),
    is_free_storage: boolean('is_free_storage').default(false),
    free_storage_days: integer('free_storage_days').default(30),
    monthly_rate: decimal('monthly_rate', { precision: 15, scale: 2 }),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    deleted_by: integer('deleted_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('warehouses_name_idx').on(table.name)],
);

export const stock_items = pgTable(
  'stock_items',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    sku: text('sku').notNull().unique(),
    name: text('name').notNull(),
    category: text('category'),
    location: text('location'),
    quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    cost_price: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
    sell_price: decimal('sell_price', { precision: 15, scale: 2 }),
    expiry_date: timestamp('expiry_date', { withTimezone: true }),
    received_at: timestamp('received_at', { withTimezone: true }).defaultNow(),
    lot_number: text('lot_number'),
    supplier_id: uuid('supplier_id'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('stock_items_sku_idx').on(table.sku),
    index('stock_items_category_idx').on(table.category),
    index('stock_items_location_idx').on(table.location),
    index('stock_items_is_active_idx').on(table.is_active),
  ],
);

export const stock_movements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    stock_item_id: uuid('stock_item_id')
      .notNull()
      .references(() => stock_items.id, { onDelete: 'cascade' }),
    movement_type: stockMovementTypeEnum('movement_type').notNull(),
    quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
    reference_id: uuid('reference_id'),
    reference_type: text('reference_type'),
    performed_by: uuid('performed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('stock_movements_stock_item_id_idx').on(table.stock_item_id),
    index('stock_movements_movement_type_idx').on(table.movement_type),
    index('stock_movements_reference_id_idx').on(table.reference_id),
    index('stock_movements_created_at_idx').on(table.created_at),
  ],
);

// ============================================================================
// MM (Materials Management)
// ============================================================================

export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    tin: text('tin').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    payment_terms: integer('payment_terms').default(30),
    rating: decimal('rating', { precision: 3, scale: 2 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('vendors_name_idx').on(table.name),
    index('vendors_is_active_idx').on(table.is_active),
  ],
);

export const purchase_orders = pgTable(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    po_number: text('po_number').notNull().unique(),
    vendor_name: text('vendor_name').notNull(),
    vendor_id: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    items: text('items').notNull().default('[]'),
    total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('UZS'),
    status: purchaseOrderStatusEnum('status').notNull().default('draft'),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    approved_by: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    goods_received_by: uuid('goods_received_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    goods_received_at: timestamp('goods_received_at', { withTimezone: true }),
    invoice_matched: boolean('invoice_matched').default(false),
    three_way_matched: boolean('three_way_matched').default(false),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('purchase_orders_po_number_idx').on(table.po_number),
    index('purchase_orders_vendor_id_idx').on(table.vendor_id),
    index('purchase_orders_status_idx').on(table.status),
    index('purchase_orders_created_by_idx').on(table.created_by),
  ],
);

// ============================================================================
// QC (Quality Control)
// ============================================================================

export const qc_inspections = pgTable(
  'qc_inspections',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    reference_id: uuid('reference_id').notNull(),
    reference_type: text('reference_type').notNull(),
    inspector_id: uuid('inspector_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: qcStatusEnum('status').notNull().default('pending'),
    items_checked: integer('items_checked').notNull(),
    items_passed: integer('items_passed').notNull(),
    items_failed: integer('items_failed').notNull(),
    notes: text('notes'),
    attachments: text('attachments').default('[]'),
    // T21-A2 — sifat-saralash navi (first|second|third|scrap); NULL = saralanmagan.
    // Narx-koeffitsienti qc_sort_price_config / qc_grade_price_coefficients dan keladi.
    sort_grade: text('sort_grade'),
    // 09-qc #34 — QC gate stage classifier for per-stage FTQ weakest-link auto-flag.
    // text+CHECK in live DB (matches status varchar convention); NULL = unclassified.
    stage: text('stage', { enum: ['incoming', 'in_process', 'final', 'dispatch'] }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('qc_inspections_reference_id_idx').on(table.reference_id),
    index('qc_inspections_inspector_id_idx').on(table.inspector_id),
    index('qc_inspections_status_idx').on(table.status),
    index('qc_inspections_stage_idx').on(table.stage),
  ],
);
