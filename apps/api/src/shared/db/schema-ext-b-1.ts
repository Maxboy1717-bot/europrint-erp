/**
 * @module schema-ext-b-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { mm_purchase_orders as canonicalMmPurchaseOrders } from './schema-business-b-1';
import { fi_invoices as canonicalFiInvoices } from './schema-business-b-2';

// ─── MM Extended: Receipt Lines & Materials ────────────────────────────────────

export const mm_goods_receipt_lines = pgTable('mm_goods_receipt_lines', {
  id:               serial('id').primaryKey(),
  goods_receipt_id: integer('goods_receipt_id'),
  material_id:      integer('material_id'),
  quantity:         numeric('quantity', { precision: 15, scale: 4 }),
  unit_cost:        numeric('unit_cost', { precision: 15, scale: 4 }),
  qc_status:        text('qc_status'),
  qc_notes:         text('qc_notes'),
  qc_by:            integer('qc_by'),
  qc_at:            timestamp('qc_at'),
  created_at:       timestamp('created_at').defaultNow(),
});

// mm_purchase_orders: re-exported from canonical definition in schema-business-b-1.ts
export const mm_purchase_orders_int = canonicalMmPurchaseOrders;

// ─── HR Core Tables ────────────────────────────────────────────────────────────

// ─── Finance Core Tables ───────────────────────────────────────────────────────

export const income_expense_transactions = pgTable('income_expense_transactions', {
  id:               serial('id').primaryKey(),
  transaction_type: text('transaction_type'),
  description:      text('description'),
  counterparty_name: text('counterparty_name'),
  amount:           numeric('amount', { precision: 15, scale: 2 }),
  transaction_date: date('transaction_date'),
  status:           text('status').default('pending'),
  created_at:       timestamp('created_at').defaultNow(),
});

export const gl_documents = pgTable('gl_documents', {
  id:              serial('id').primaryKey(),
  document_number: text('document_number'),
  document_type:   text('document_type'),
  document_date:   date('document_date'),
  posting_date:    date('posting_date'),
  description:     text('description'),
  currency:        text('currency').default('UZS'),
  total_debit:     numeric('total_debit', { precision: 15, scale: 2 }).default('0'),
  total_credit:    numeric('total_credit', { precision: 15, scale: 2 }).default('0'),
  reference_type:  text('reference_type'),
  reference_id:    integer('reference_id'),
  cost_center_id:  integer('cost_center_id'),
  profit_center_id: integer('profit_center_id'),
  status:          text('status').default('draft'),
  deleted_at:      timestamp('deleted_at'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id:           serial('id').primaryKey(),
  code:         text('code'),
  name:         text('name'),
  account_type: text('account_type'),
  parent_id:    integer('parent_id'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

export const stock_moves = pgTable('stock_moves', {
  id:           serial('id').primaryKey(),
  move_number:  text('move_number'),
  move_date:    date('move_date'),
  move_type:    text('move_type'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  unit_cost:    numeric('unit_cost', { precision: 15, scale: 4 }),
  total_cost:   numeric('total_cost', { precision: 15, scale: 4 }),
  reference:    text('reference'),
  warehouse_id: integer('warehouse_id'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const raw_materials = pgTable('raw_materials', {
  id:            serial('id').primaryKey(),
  code:          text('code'),
  name:          text('name'),
  category:      text('category'),
  unit:          text('unit'),
  current_stock: numeric('current_stock', { precision: 15, scale: 4 }).default('0'),
  unit_price:    numeric('unit_price', { precision: 15, scale: 2 }).default('0'),
  warehouse_id:  integer('warehouse_id'),
  is_active:     boolean('is_active').default(true),
  created_at:    timestamp('created_at').defaultNow(),
});

export const expense_reports = pgTable('expense_reports', {
  id:           text('id').primaryKey(),
  title:        text('title'),
  status:       text('status').default('draft'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).default('0'),
  currency:     text('currency').default('UZS'),
  submitted_at: timestamp('submitted_at'),
  approved_at:  timestamp('approved_at'),
  employee_id:  text('employee_id'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// fi_invoices: re-exported from canonical definition in schema-business-b-2.ts
export const fi_invoices = canonicalFiInvoices;

// ─── SD Extended Tables ────────────────────────────────────────────────────────

export const sd_customer_interactions = pgTable('sd_customer_interactions', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  type:        text('type'),
  notes:       text('notes'),
  employee_id: integer('employee_id'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const sd_customer_complaints = pgTable('sd_customer_complaints', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  status:      text('status').default('open'),
  resolution:  text('resolution'),
  resolved_by: integer('resolved_by'),
  resolved_at: timestamp('resolved_at'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Waste Management Tables ───────────────────────────────────────────────────

export const waste_records = pgTable('waste_records', {
  id:                  text('id').primaryKey(),
  production_order_id: text('production_order_id'),
  order_id:            text('order_id'),
  machine_id:          text('machine_id'),
  operator_id:         text('operator_id'),
  waste_type:          text('waste_type'),
  material_type:       text('material_type'),
  quantity:            numeric('quantity', { precision: 15, scale: 4 }),
  unit:                text('unit'),
  cost_per_unit:       numeric('cost_per_unit', { precision: 15, scale: 4 }),
  total_cost:          numeric('total_cost', { precision: 15, scale: 4 }),
  cause:               text('cause'),
  correction_action:   text('correction_action'),
  shift_number:        integer('shift_number'),
  date:                date('date'),
  notes:               text('notes'),
  is_recyclable:       boolean('is_recyclable').default(false),
  recycled_quantity:   numeric('recycled_quantity', { precision: 15, scale: 4 }).default('0'),
  created_at:          timestamp('created_at').defaultNow(),
  updated_at:          timestamp('updated_at').defaultNow(),
});

export const waste_targets = pgTable('waste_targets', {
  id:              serial('id').primaryKey(),
  waste_type:      text('waste_type'),
  target_quantity: numeric('target_quantity', { precision: 15, scale: 4 }),
  target_cost:     numeric('target_cost', { precision: 15, scale: 4 }),
  period:          text('period').default('monthly'),
  period_start:    date('period_start'),
  period_end:      date('period_end'),
  department:      text('department'),
  notes:           text('notes'),
  is_active:       boolean('is_active').default(true),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

// ─── AI Report Tables ──────────────────────────────────────────────────────────

export const ai_report_runs = pgTable('ai_report_runs', {
  id:           serial('id').primaryKey(),
  report_id:    integer('report_id'),
  status:       text('status').default('running'),
  triggered_by: integer('triggered_by'),
  started_at:   timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── QC Extended Tables ────────────────────────────────────────────────────────
// qc_standards: re-exported from canonical definition in schema-misc-qc.ts
export { qc_standards } from './schema-misc-qc';

export const qc_final_inspections = pgTable('qc_final_inspections', {
  id:           serial('id').primaryKey(),
  order_id:     integer('order_id'),
  inspector_id: integer('inspector_id'),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  passed:       boolean('passed').default(false),
  result:       text('result'),
  defect_count: integer('defect_count').default(0),
  completed_at: timestamp('completed_at'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const qc_in_process_inspections = pgTable('qc_in_process_inspections', {
  id:           serial('id').primaryKey(),
  session_id:   integer('session_id'),
  inspector_id: integer('inspector_id'),
  check_point:  text('check_point'),
  sample_size:  integer('sample_size'),
  defects_found: integer('defects_found').default(0),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── LMS Extended Tables ───────────────────────────────────────────────────────

export const lms_test_attempts = pgTable('lms_test_attempts', {
  id:         text('id').primaryKey(),
  user_id:    text('user_id'),
  test_id:    text('test_id'),
  course_id:  text('course_id'),
  score:      numeric('score', { precision: 5, scale: 2 }),
  passed:     boolean('passed').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const lms_certificates = pgTable('lms_certificates', {
  id:         text('id').primaryKey(),
  user_id:    text('user_id'),
  course_id:  text('course_id'),
  issued_at:  timestamp('issued_at'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── MES Extended ─────────────────────────────────────────────────────────────

export const mes_maintenance_requests = pgTable('mes_maintenance_requests', {
  id:           serial('id').primaryKey(),
  title:        text('title'),
  equipment_id: integer('equipment_id'),
  requested_by: integer('requested_by'),
  status:       text('status').default('pending'),
  priority:     text('priority').default('medium'),
  description:  text('description'),
  resolved_at:  timestamp('resolved_at'),
  resolved_by:  integer('resolved_by'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});
