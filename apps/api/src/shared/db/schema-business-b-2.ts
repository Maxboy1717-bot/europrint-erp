/**
 * @module schema-business-b-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

export const mro_budgets = pgTable('mro_budgets', {
  id:          serial('id').primaryKey(),
  year:        integer('year'),
  month:       integer('month'),
  category:    text('category'),
  budget_amount: numeric('budget_amount', { precision: 15, scale: 2 }),
  spent_amount:  numeric('spent_amount', { precision: 15, scale: 2 }),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Finance: GL Postings & Vendor Invoices ──────────────────────────────────

export const stock_gl_postings = pgTable('stock_gl_postings', {
  id:             serial('id').primaryKey(),
  type:           text('type'),
  reference_id:   integer('reference_id'),
  debit_account:  text('debit_account'),
  credit_account: text('credit_account'),
  amount:         numeric('amount', { precision: 15, scale: 2 }),
  status:         text('status').default('pending'),
  posted_at:      timestamp('posted_at'),
  error_msg:      text('error_msg'),
  created_at:     timestamp('created_at').defaultNow(),
});

export const vendor_invoices = pgTable('vendor_invoices', {
  id:            serial('id').primaryKey(),
  vendor_id:     integer('vendor_id'),
  invoice_no:    text('invoice_no'),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  match_status:  text('match_status').default('unmatched'),
  po_id:         integer('po_id'),
  gr_id:         integer('gr_id'),
  invoice_date:  date('invoice_date'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const three_way_match_results = pgTable('three_way_match_results', {
  id:                serial('id').primaryKey(),
  invoice_id:        integer('invoice_id').unique(),
  tolerance_percent: numeric('tolerance_percent', { precision: 5, scale: 2 }),
  status:            text('status').default('pending'),
  match_details:     jsonb('match_details'),
  matched_at:        timestamp('matched_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

// ─── Finance: FI Invoices, AP/AR ─────────────────────────────────────────────

export const fi_invoices = pgTable('fi_invoices', {
  id:            serial('id').primaryKey(),
  invoice_no:    text('invoice_no'),
  vendor_id:     integer('vendor_id'),
  customer_id:   integer('customer_id'),
  type:          text('type').default('payable'),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  currency:      text('currency').default('UZS'),
  due_date:      date('due_date'),
  invoice_date:  date('invoice_date'),
  status:        text('status').default('pending'),
  notes:         text('notes'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const ap_aging_buckets = pgTable('ap_aging_buckets', {
  id:                serial('id').primaryKey(),
  vendor_id:         text('vendor_id'),
  current_amount:    numeric('current', { precision: 15, scale: 2 }),
  days_31_60:        numeric('days_31_to_60', { precision: 15, scale: 2 }),
  days_61_90:        numeric('days_61_to_90', { precision: 15, scale: 2 }),
  days_91_120:       numeric('days_91_to_120', { precision: 15, scale: 2 }),
  over_120:          numeric('over_120', { precision: 15, scale: 2 }),
  total_outstanding: numeric('total_outstanding', { precision: 15, scale: 2 }),
  updated_at:        timestamp('updated_at').defaultNow(),
});

export const ar_aging_buckets = pgTable('ar_aging_buckets', {
  id:                serial('id').primaryKey(),
  customer_id:       text('customer_id'),
  customer_type:     text('customer_type'),
  current_amount:    numeric('current', { precision: 15, scale: 2 }),
  days_31_60:        numeric('days_31_to_60', { precision: 15, scale: 2 }),
  days_61_90:        numeric('days_61_to_90', { precision: 15, scale: 2 }),
  days_91_120:       numeric('days_91_to_120', { precision: 15, scale: 2 }),
  over_120:          numeric('over_120', { precision: 15, scale: 2 }),
  total_outstanding: numeric('total_outstanding', { precision: 15, scale: 2 }),
  updated_at:        timestamp('updated_at').defaultNow(),
});

// ─── CRM Activities ───────────────────────────────────────────────────────────

export const crm_activities = pgTable('crm_activities', {
  id:          serial('id').primaryKey(),
  entity_type: text('entity_type'),
  entity_id:   integer('entity_id'),
  type:        text('type'),
  subject:     text('subject'),
  notes:       text('notes'),
  outcome:     text('outcome'),
  communication_data: jsonb('communication_data'),
  scheduled_at: timestamp('scheduled_at'),
  completed_at: timestamp('completed_at'),
  due_date:    timestamp('due_date'),
  lead_id:     integer('lead_id'),
  deal_id:     integer('deal_id'),
  assigned_to: integer('assigned_to'),
  created_by:  integer('created_by'),
  assignee_id: integer('assignee_id'),
  status:      text('status').default('scheduled'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const crm_custom_fields = pgTable('crm_custom_fields', {
  id:           serial('id').primaryKey(),
  entity_type:  text('entity_type'),
  field_name:   text('field_name'),
  field_label:  text('field_label'),
  field_type:   text('field_type').default('text'),
  is_required:  boolean('is_required').default(false),
  options:      jsonb('options'),
  is_active:    boolean('is_active').default(true),
  order_index:  integer('order_index').default(0),
  created_at:   timestamp('created_at').defaultNow(),
});

export const crm_lead_stages = pgTable('crm_lead_stages', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  order_index: integer('order_index').default(0),
  color:       text('color'),
  is_active:   boolean('is_active').default(true),
});

export const crm_robots = pgTable('crm_robots', {
  id:           serial('id').primaryKey(),
  name:         text('name'),
  trigger_type: text('trigger_type'),
  action_type:  text('action_type'),
  config:       jsonb('config'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── CRM Comments / History / Tasks / Proposals / Invoices ───────────────────

export const crm_comments = pgTable('crm_comments', {
  id:         serial('id').primaryKey(),
  lead_id:    integer('lead_id'),
  deal_id:    integer('deal_id'),
  text:       text('text'),
  author_id:  integer('author_id'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const crm_history = pgTable('crm_history', {
  id:          serial('id').primaryKey(),
  entity_type: text('entity_type'),
  entity_id:   integer('entity_id'),
  action:      text('action'),
  changes:     jsonb('changes'),
  actor_id:    integer('actor_id'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const crm_tasks = pgTable('crm_tasks', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  lead_id:     integer('lead_id'),
  deal_id:     integer('deal_id'),
  assigned_to: integer('assigned_to'),
  due_date:    timestamp('due_date'),
  status:      text('status').default('pending'),
  priority:    text('priority').default('medium'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const crm_proposals = pgTable('crm_proposals', {
  id:         serial('id').primaryKey(),
  contact_id: integer('contact_id'),
  title:      text('title'),
  status:     text('status').default('draft'),
  amount:     numeric('amount', { precision: 15, scale: 2 }),
  valid_until: date('valid_until'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  // CRM-13#5: KP email-pixel birinchi ochilgan vaqt (idempotent — CC #47 markViewed naqshi).
  viewed_at:  timestamp('viewed_at'),
});

export const crm_invoices = pgTable('crm_invoices', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  status:      text('status').default('draft'),
  due_date:    date('due_date'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// sd_customers: canonical Drizzle declaration lives in lib/db (@workspace/db `sdCustomers`,
// exported here under the snake_case alias this package's callers already use). This used to be
// a SECOND, divergent pgTable('sd_customers', ...) declaration (id/full_name/email/phone/company/
// status only) — a two-world drift vs. the richer `sdCustomers` used by drizzle-marketing-ext.repo.ts
// (id/name/... 25+ cols). DB-proof (2026-07-02): `name` is populated on 15/15 live rows and is the
// column read/written by ~20 SD/CRM/Director repositories; `full_name` was always NULL and unused —
// see `fullName` deprecation note on the canonical table. Merged to the single source of truth.
export { sdCustomers as sd_customers } from '@workspace/db';
