import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

export const vendor_performance = pgTable('vendor_performance', {
  id:          serial('id').primaryKey(),
  vendor_id:   integer('vendor_id'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  on_time_rate: numeric('on_time_rate', { precision: 5, scale: 2 }),
  quality_rate: numeric('quality_rate', { precision: 5, scale: 2 }),
  period:      text('period'),
  created_at:  timestamp('created_at').defaultNow(),
});

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

export const face_embeddings = pgTable('face_embeddings', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  embedding:   jsonb('embedding'),
  is_active:   boolean('is_active').default(true),
  confidence:  text('confidence'),
  image_url:   text('image_url'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

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
