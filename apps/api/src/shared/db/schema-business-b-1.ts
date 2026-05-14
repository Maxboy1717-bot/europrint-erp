/**
 * @module schema-business-b-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';
import { PRINTER_DEFAULT_PORT } from '@common/constants/app.constants';

// ─── WMS Extended ────────────────────────────────────────────────────────────

export const wms_transactions = pgTable('wms_transactions', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id').notNull(),
  material_id:  integer('material_id').notNull(),
  type:         text('type').notNull(),
  quantity:     numeric('quantity', { precision: 15, scale: 3 }),
  unit_cost:    numeric('unit_cost', { precision: 12, scale: 2 }),
  batch_number: text('batch_number'),
  reference_id: integer('reference_id'),
  created_by:   integer('created_by'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const wms_alerts = pgTable('wms_alerts', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  material_id:  integer('material_id'),
  type:         text('type').notNull(),
  severity:     text('severity').default('medium'),
  message:      text('message'),
  is_resolved:  boolean('is_resolved').default(false),
  resolved_at:  timestamp('resolved_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const wms_stock_levels = pgTable('wms_stock_levels', {
  id:               serial('id').primaryKey(),
  warehouse_id:     integer('warehouse_id').notNull(),
  material_id:      integer('material_id').notNull(),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 3 }),
  min_stock:        numeric('min_stock', { precision: 15, scale: 3 }),
  max_stock:        numeric('max_stock', { precision: 15, scale: 3 }),
  unit_cost:        numeric('unit_cost', { precision: 12, scale: 2 }),
  updated_at:       timestamp('updated_at').defaultNow(),
});

export const wms_stock_batches = pgTable('wms_stock_batches', {
  id:               serial('id').primaryKey(),
  warehouse_id:     integer('warehouse_id').notNull(),
  material_id:      integer('material_id').notNull(),
  batch_number:     text('batch_number'),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 3 }),
  unit_cost:        numeric('unit_cost', { precision: 12, scale: 2 }),
  received_at:      timestamp('received_at').defaultNow(),
  expiry_date:      date('expiry_date'),
});

// ─── Finance: Cost/Profit Centers, Advances ──────────────────────────────────

export const cost_centers = pgTable('cost_centers', {
  id:          serial('id').primaryKey(),
  code:        varchar('code', { length: 50 }).unique(),
  name:        text('name'),
  name_ru:     text('name_ru'),
  description: text('description'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
  deleted_at:  timestamp('deleted_at'),
});

export const profit_centers = pgTable('profit_centers', {
  id:          serial('id').primaryKey(),
  code:        varchar('code', { length: 50 }).unique(),
  name:        text('name'),
  name_ru:     text('name_ru'),
  description: text('description'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
  deleted_at:  timestamp('deleted_at'),
});

export const advance_payments = pgTable('advance_payments', {
  id:            serial('id').primaryKey(),
  employee_id:   integer('employee_id'),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  request_date:  date('request_date'),
  status:        text('status').default('pending'),
  document_id:   integer('document_id'),
  approved_at:   timestamp('approved_at'),
  notes:         text('notes'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const payroll_advances = pgTable('payroll_advances', {
  id:            serial('id').primaryKey(),
  employee_id:   integer('employee_id').notNull(),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  request_date:  date('request_date'),
  status:        text('status').default('pending'),
  document_id:   integer('document_id'),
  approved_at:   timestamp('approved_at'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const payroll_deductions = pgTable('payroll_deductions', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').notNull(),
  deduction_type:   text('deduction_type'),
  amount:           numeric('amount', { precision: 15, scale: 2 }),
  fine_percent:     numeric('fine_percent', { precision: 5, scale: 2 }),
  reason:           text('reason'),
  document_id:      integer('document_id'),
  status:           text('status').default('pending'),
  deduction_month:  date('deduction_month'),
  created_at:       timestamp('created_at').defaultNow(),
});

export const gl_account_mappings = pgTable('gl_account_mappings', {
  id:               serial('id').primaryKey(),
  transaction_type: text('transaction_type'),
  account_code:     text('account_code'),
  debit_account:    text('debit_account'),
  credit_account:   text('credit_account'),
  description:      text('description'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

export const gl_journal_entries = pgTable('gl_journal_entries', {
  id:              serial('id').primaryKey(),
  document_id:     integer('document_id'),
  document_type:   text('document_type'),
  debit_account:   text('debit_account'),
  credit_account:  text('credit_account'),
  amount:          numeric('amount', { precision: 15, scale: 2 }),
  currency:        text('currency').default('UZS'),
  description:     text('description'),
  posted_at:       timestamp('posted_at').defaultNow(),
  created_at:      timestamp('created_at').defaultNow(),
});

export const accounting_periods = pgTable('accounting_periods', {
  id:         serial('id').primaryKey(),
  year:       integer('year').notNull(),
  month:      integer('month').notNull(),
  is_closed:  boolean('is_closed').default(false),
  closed_at:  timestamp('closed_at'),
  closed_by:  integer('closed_by'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── MM: Vendors & Purchase ───────────────────────────────────────────────────

export const mm_purchase_orders = pgTable('mm_purchase_orders', {
  id:              serial('id').primaryKey(),
  vendor_id:       integer('vendor_id'),
  status:          text('status').default('draft'),
  total_amount:    numeric('total_amount', { precision: 15, scale: 2 }),
  currency:        text('currency').default('UZS'),
  order_date:      date('order_date'),
  expected_date:   date('expected_date'),
  notes:           text('notes'),
  created_by:      integer('created_by'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const mm_purchase_requisitions = pgTable('mm_purchase_requisitions', {
  id:           serial('id').primaryKey(),
  title:        text('title'),
  requested_by: integer('requested_by'),
  needed_by:    date('needed_by'),
  notes:        text('notes'),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const mm_purchase_requisition_items = pgTable('mm_purchase_requisition_items', {
  id:               serial('id').primaryKey(),
  requisition_id:   integer('requisition_id').notNull(),
  material_id:      integer('material_id'),
  quantity:         numeric('quantity', { precision: 15, scale: 3 }),
  unit_price:       numeric('unit_price', { precision: 12, scale: 2 }),
});

export const mm_goods_receipts = pgTable('mm_goods_receipts', {
  id:           serial('id').primaryKey(),
  po_id:        integer('po_id'),
  warehouse_id: integer('warehouse_id'),
  received_by:  integer('received_by'),
  receipt_date: date('receipt_date'),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const mm_goods_issues = pgTable('mm_goods_issues', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  issued_to:    integer('issued_to'),
  issue_date:   date('issue_date'),
  reference_id: integer('reference_id'),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── POS: Printer Config ─────────────────────────────────────────────────────

export const pos_printer_config = pgTable('pos_printer_config', {
  id:           serial('id').primaryKey(),
  name:         text('name').default('Printer'),
  printer_ip:   text('printer_ip').notNull(),
  printer_port: integer('printer_port').default(PRINTER_DEFAULT_PORT),
  print_format: text('print_format').default('ZPL'),
  notes:        text('notes'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Offboarding ─────────────────────────────────────────────────────────────

export const offboarding_cases = pgTable('offboarding_cases', {
  id:                   serial('id').primaryKey(),
  employee_id:          integer('employee_id').notNull(),
  dismissal_type:       text('dismissal_type'),
  last_working_day:     date('last_working_day'),
  dismiss_order_doc_id: integer('dismiss_order_doc_id'),
  status:               text('status').default('active'),
  total_items:          integer('total_items').default(8),
  completed_items:      integer('completed_items').default(0),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

export const offboarding_checklist_items = pgTable('offboarding_checklist_items', {
  id:        serial('id').primaryKey(),
  case_id:   integer('case_id').notNull(),
  item_key:  text('item_key'),
  label:     text('label'),
  done:      boolean('done').default(false),
  order_num: integer('order_num').default(0),
});

// ─── Shifts ────────────────────────────────────────────────────────────────

export const shifts = pgTable('shifts', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  start_time:  text('start_time'),
  end_time:    text('end_time'),
  department:  text('department'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Expense & Budget Requests ────────────────────────────────────────────

export const expense_requests = pgTable('expense_requests', {
  id:           serial('id').primaryKey(),
  title:        text('title'),
  amount:       numeric('amount', { precision: 15, scale: 2 }),
  category:     text('category'),
  description:  text('description'),
  requested_by: integer('requested_by'),
  status:       text('status').default('pending'),
  comments:     text('comments'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});
