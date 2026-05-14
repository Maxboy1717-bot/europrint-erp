/**
 * @module schema-ext-c-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

export const warehouse_transactions = pgTable('warehouse_transactions', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  item_id:      integer('item_id'),
  type:         text('type'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  reference_id: integer('reference_id'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const warehouse_transfers = pgTable('warehouse_transfers', {
  id:                serial('id').primaryKey(),
  from_warehouse_id: integer('from_warehouse_id'),
  to_warehouse_id:   integer('to_warehouse_id'),
  item_id:           integer('item_id'),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }),
  status:            text('status').default('pending'),
  created_at:        timestamp('created_at').defaultNow(),
});

export const internal_requests = pgTable('internal_requests', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  item_id:      integer('item_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const goods_receipts = pgTable('goods_receipts', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  received_by:       integer('received_by'),
  status:            text('status').default('draft'),
  notes:             text('notes'),
  received_at:       timestamp('received_at'),
  completed_by:      integer('completed_by'),
  completed_at:      timestamp('completed_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

export const inventory_counts = pgTable('inventory_counts', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  status:       text('status').default('draft'),
  counted_by:   integer('counted_by'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const stock_reservations = pgTable('stock_reservations', {
  id:           serial('id').primaryKey(),
  item_id:      integer('item_id'),
  warehouse_id: integer('warehouse_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  order_id:     integer('order_id'),
  status:       text('status').default('reserved'),
  expires_at:   timestamp('expires_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const department_warehouse_map = pgTable('department_warehouse_map', {
  id:            serial('id').primaryKey(),
  department_id: integer('department_id'),
  warehouse_id:  integer('warehouse_id'),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── Assessment & Gamification ────────────────────────────────────────────────

export const assessment_skips = pgTable('assessment_skips', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  reason:      text('reason'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Weekly Plans ──────────────────────────────────────────────────────────────

export const weekly_plans = pgTable('weekly_plans', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  week_start:  date('week_start'),
  status:      text('status').default('draft'),
  items:       jsonb('items').default([]),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Dokla & Rasporyazhenie ────────────────────────────────────────────────────

export const dokla_ext = pgTable('dokla', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  employee_id: integer('employee_id'),
  status:      text('status').default('draft'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const rasporyazhenie_ext = pgTable('rasporyazhenie', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  issued_by:   integer('issued_by'),
  status:      text('status').default('draft'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Deficit & Monitoring ─────────────────────────────────────────────────────

export const mm_vendors_ext2 = pgTable('mm_vendors', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  tin:         text('tin'),
  phone:       text('phone'),
  email:       text('email'),
  is_active:   boolean('is_active').default(true),
  rating:      numeric('rating', { precision: 3, scale: 2 }),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const mm_materials_int = pgTable('mm_materials', {
  id:             serial('id').primaryKey(),
  name:           text('name'),
  code:           text('code'),
  category:       text('category'),
  unit_of_measure: text('unit_of_measure'),
  barcode:        text('barcode'),
  sku:            text('sku'),
  is_active:      boolean('is_active').default(true),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const mm_goods_receipts_int = pgTable('mm_goods_receipts', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  received_by:       integer('received_by'),
  status:            text('status').default('draft'),
  notes:             text('notes'),
  received_at:       timestamp('received_at'),
  completed_by:      integer('completed_by'),
  completed_at:      timestamp('completed_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

export const mm_purchase_orders_ext = pgTable('mm_purchase_orders', {
  id:               serial('id').primaryKey(),
  reference_number: text('reference_number'),
  vendor_id:        integer('vendor_id'),
  status:           text('status').default('draft'),
  total_amount:     numeric('total_amount', { precision: 15, scale: 2 }),
  received_by:      integer('received_by'),
  notes:            text('notes'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

// ─── Agent (AI) Interview ──────────────────────────────────────────────────────

export const ai_interview_sessions = pgTable('ai_interview_sessions', {
  id:             text('id').primaryKey(),
  application_id: integer('application_id'),
  status:         text('status').default('in_progress'),
  score:          integer('score'),
  transcript:     jsonb('transcript').default([]),
  completed_at:   timestamp('completed_at'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── Enps ──────────────────────────────────────────────────────────────────────

export const enps_survey_responses_ext = pgTable('enps_survey_responses', {
  id:          serial('id').primaryKey(),
  survey_id:   integer('survey_id'),
  employee_id: integer('employee_id'),
  score:       integer('score'),
  comment:     text('comment'),
  submitted_at: timestamp('submitted_at'),
  created_at:  timestamp('created_at').defaultNow(),
});
