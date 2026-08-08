/**
 * @module schema-business-b-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, varchar, date,
} from 'drizzle-orm/pg-core';

export { posPrinterConfig } from '@workspace/db';

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

// NOTE: gl_journal_entries pgTable declaration removed 2026-07-02 — orphan
// (0 rows, never queried/inserted anywhere in code). Canonical GL ledger is
// `entries` (ADR-003). DB table itself is left untouched (no DROP, per rule);
// only the unused Drizzle-level declaration was removed. See gl-posting.service.ts.

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
  // MM-11 #11.25 — Incoterms/delivery-terms free-text note (additive; see
  // migrations/mm-11-po-delivery-terms-2026-07-11.sql).
  delivery_terms:  text('delivery_terms'),
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

// ─── POS: Printer Config — re-exported from @workspace/db ───────────────────
// (posPrinterConfig is declared at the top of this file)

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
  // Columns physically present on the live table (added by the
  // migrations-drift.ts healer) but previously unmapped here — the
  // repository silently discarded writes to them. Wired up 2026-07-13
  // (HR Offboarding page completion): exit-interview persistence,
  // turnover "reason" category, and the case-level status badges the
  // frontend (HROffboardingDialogs/OffboardingTab) already renders.
  reason:               text('reason'),
  initiated_by:         integer('initiated_by'),
  exit_interview_notes: text('exit_interview_notes'),
  exit_interview_done:  boolean('exit_interview_done').default(false),
  blocks_settlement:    boolean('blocks_settlement').default(false),
  settlement_done:      boolean('settlement_done').default(false),
  equipment_returned:   boolean('equipment_returned').default(false),
  nda_signed:           boolean('nda_signed').default(false),
  access_revoked:       boolean('access_revoked').default(false),
});

export const offboarding_checklist_items = pgTable('offboarding_checklist_items', {
  id:            serial('id').primaryKey(),
  case_id:       integer('case_id').notNull(),
  item_key:      text('item_key'),
  label:         text('label'),
  done:          boolean('done').default(false),
  order_num:     integer('order_num').default(0),
  // Columns physically present on the live table (migrations-drift.ts
  // healer) but previously unmapped — wired up 2026-07-13 (HR Offboarding
  // page completion) so `done_at`/`notes`/`return_status` (rendered by
  // HROffboardingSteps.tsx and employee-profile OffboardingTab.tsx) persist.
  done_by:       integer('done_by'),
  done_at:       timestamp('done_at'),
  notes:         text('notes'),
  return_status: varchar('return_status', { length: 20 }),
  created_at:    timestamp('created_at').defaultNow(),
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
