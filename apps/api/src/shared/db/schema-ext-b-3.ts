/**
 * @module schema-ext-b-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

// vendor_performance pgTable export OLIB TASHLANDI (2026-07-02, Q-46 — dead/orfan kod):
// hech qanday repository/servis o'qimaydi/yozmaydi. DB jadvali DROP QILINMAGAN
// (loyiha qoidasi), faqat kod-darajasida uzildi. O'rniga: vendor_rating_unified VIEW
// (migrations/vendor-rating-unified-view-2026-07-02.sql) — mm_vendor_ratings +
// vendor_performance_metrics birlashtiradi (faol yozuvchiga ega ikkala jadval).

export const erp_purchase_requisitions = pgTable('erp_purchase_requisitions', {
  id:          serial('id').primaryKey(),
  material_id: integer('material_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  status:      text('status').default('pending'),
  requested_by: integer('requested_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Finance Payroll & Cycle ───────────────────────────────────────────────────

export const fp_cycles = pgTable('fp_cycles', {
  id:           serial('id').primaryKey(),
  period:       text('period'),
  status:       text('status').default('open'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).default('0'),
  closed_at:    timestamp('closed_at'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const payroll_entries = pgTable('payroll_entries', {
  id:           serial('id').primaryKey(),
  cycle_id:     integer('cycle_id'),
  employee_id:  integer('employee_id'),
  base_salary:  numeric('base_salary', { precision: 15, scale: 2 }),
  net_pay:      numeric('net_pay', { precision: 15, scale: 2 }),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Finance Invoice Extended ──────────────────────────────────────────────────

// finance_invoices = KANONIK invoice-manba (OWNER QARORI, Moliya-GL-Kassa, 2026-07-02).
// customer_name/supplier_name/notes — 2026-07-02 additiv migratsiyada qo'shildi
// (finance-invoices-canonical-backfill-2026-07-02.sql) AP/AR repository'lar uchun.
export const finance_invoices = pgTable('finance_invoices', {
  id:             serial('id').primaryKey(),
  invoice_number: text('invoice_number'),
  invoice_type:   text('invoice_type'),
  customer_id:    integer('customer_id'),
  vendor_id:      integer('vendor_id'),
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  paid_amount:    numeric('paid_amount', { precision: 15, scale: 2 }).default('0'),
  payment_status: text('payment_status').default('unpaid'),
  due_date:       date('due_date'),
  customer_name:  text('customer_name'),
  supplier_name:  text('supplier_name'),
  notes:          text('notes'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const finance_invoice_lines = pgTable('finance_invoice_lines', {
  id:          serial('id').primaryKey(),
  invoice_id:  integer('invoice_id'),
  description: text('description'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  unit_price:  numeric('unit_price', { precision: 15, scale: 2 }),
  total:       numeric('total', { precision: 15, scale: 2 }),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Reception & Visitor ──────────────────────────────────────────────────────

// ─── Cameras & Safety ─────────────────────────────────────────────────────────

export const camera_employee_reports = pgTable('camera_employee_reports', {
  id:          serial('id').primaryKey(),
  camera_id:   integer('camera_id'),
  employee_id: integer('employee_id'),
  activity:    text('activity'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const camera_logs = pgTable('camera_logs', {
  id:          serial('id').primaryKey(),
  camera_id:   integer('camera_id'),
  log_type:    text('log_type'),
  message:     text('message'),
  created_at:  timestamp('created_at').defaultNow(),
});

// face_embeddings: canonical definition in lib/db (hr-transfers.ts → hr-performance → hr-schema).
export { faceEmbeddings as face_embeddings } from '@workspace/db';

export const hr_tz2_security_alerts = pgTable('hr_tz2_security_alerts', {
  id:          serial('id').primaryKey(),
  camera_id:   text('camera_id'),
  room_code:   text('room_code'),
  event_type:  text('event_type'),
  confidence:  text('confidence'),
  ts:          timestamp('ts').notNull(),
  resolved:    boolean('resolved').default(false),
  created_at:  timestamp('created_at').defaultNow(),
});

export const zone_tracking_logs = pgTable('zone_tracking_logs', {
  id:          serial('id').primaryKey(),
  zone_id:     integer('zone_id'),
  employee_id: integer('employee_id'),
  entered_at:  timestamp('entered_at'),
  exited_at:   timestamp('exited_at'),
  created_at:  timestamp('created_at').defaultNow(),
});
