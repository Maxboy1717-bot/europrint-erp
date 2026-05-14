/**
 * @module schema-ext-b-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

export const mes_maintenance_tasks = pgTable('mes_maintenance_tasks', {
  id:             serial('id').primaryKey(),
  request_id:     integer('request_id'),
  assigned_to:    integer('assigned_to'),
  title:          text('title'),
  status:         text('status').default('pending'),
  reason:         text('reason'),
  result:         text('result'),
  completed_at:   timestamp('completed_at'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const mes_production_sessions = pgTable('mes_production_sessions', {
  id:             serial('id').primaryKey(),
  order_id:       integer('order_id'),
  operator_id:    integer('operator_id'),
  machine_id:     integer('machine_id'),
  shift_id:       integer('shift_id'),
  session_date:   date('session_date'),
  status:         text('status').default('active'),
  produced_qty:   numeric('produced_qty', { precision: 15, scale: 4 }).default('0'),
  defect_qty:     numeric('defect_qty', { precision: 15, scale: 4 }).default('0'),
  start_time:     timestamp('start_time'),
  end_time:       timestamp('end_time'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const mes_shift_stats = pgTable('mes_shift_stats', {
  id:             serial('id').primaryKey(),
  shift_date:     date('shift_date'),
  shift_number:   integer('shift_number'),
  machine_id:     integer('machine_id'),
  produced_qty:   numeric('produced_qty', { precision: 15, scale: 4 }).default('0'),
  defect_qty:     numeric('defect_qty', { precision: 15, scale: 4 }).default('0'),
  downtime_min:   integer('downtime_min').default(0),
  oee:            numeric('oee', { precision: 5, scale: 2 }),
  created_at:     timestamp('created_at').defaultNow(),
});

// ─── Security/RACI Extended ────────────────────────────────────────────────────

export const raci_matrix = pgTable('raci_matrix', {
  id:          serial('id').primaryKey(),
  task_id:     integer('task_id'),
  employee_id: integer('employee_id'),
  role_type:   text('role_type'),
  stage_id:    integer('stage_id'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR Recruitment ────────────────────────────────────────────────────────────

// ─── POS Extended ─────────────────────────────────────────────────────────────

export const pos_categories = pgTable('pos_categories', {
  id:         serial('id').primaryKey(),
  name:       text('name'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const pos_products = pgTable('pos_products', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  category_id: integer('category_id'),
  barcode:     text('barcode'),
  price:       numeric('price', { precision: 15, scale: 2 }).default('0'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const pos_orders = pgTable('pos_orders', {
  id:           serial('id').primaryKey(),
  cashier_id:   integer('cashier_id'),
  status:       text('status').default('open'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).default('0'),
  payment_method: text('payment_method'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const pos_order_items = pgTable('pos_order_items', {
  id:         serial('id').primaryKey(),
  order_id:   integer('order_id'),
  product_id: integer('product_id'),
  quantity:   numeric('quantity', { precision: 15, scale: 4 }),
  price:      numeric('price', { precision: 15, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const pos_movements = pgTable('pos_movements', {
  id:          serial('id').primaryKey(),
  product_id:  integer('product_id'),
  type:        text('type'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  reference_id: integer('reference_id'),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const pos_printer_configs = pgTable('pos_printer_configs', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  type:        text('type'),
  ip_address:  text('ip_address'),
  port:        integer('port'),
  is_active:   boolean('is_active').default(true),
  is_default:  boolean('is_default').default(false),
  settings:    jsonb('settings').default({}),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── CRM Extended ─────────────────────────────────────────────────────────────

export const crm_leads = pgTable('crm_leads', {
  id:          serial('id').primaryKey(),
  full_name:   text('full_name'),
  phone:       text('phone'),
  email:       text('email'),
  source:      text('source'),
  status:      text('status').default('new'),
  stage_id:    integer('stage_id'),
  assigned_to: integer('assigned_to'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const crm_deals = pgTable('crm_deals', {
  id:          serial('id').primaryKey(),
  lead_id:     integer('lead_id'),
  title:       text('title'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  status:      text('status').default('new'),
  closed_at:   timestamp('closed_at'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const crm_contacts = pgTable('crm_contacts', {
  id:         serial('id').primaryKey(),
  lead_id:    integer('lead_id'),
  full_name:  text('full_name'),
  phone:      text('phone'),
  email:      text('email'),
  position:   text('position'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── MM Extended: SD Leads, Payments, etc. ────────────────────────────────────

export const sd_payments = pgTable('sd_payments', {
  id:             serial('id').primaryKey(),
  order_id:       integer('order_id'),
  amount:         numeric('amount', { precision: 15, scale: 2 }),
  payment_method: text('payment_method'),
  status:         text('status').default('pending'),
  created_at:     timestamp('created_at').defaultNow(),
});

export const sd_leads = pgTable('sd_leads', {
  id:            serial('id').primaryKey(),
  full_name:     text('full_name'),
  phone:         text('phone'),
  email:         text('email'),
  status:        text('status').default('new'),
  assigned_to:   integer('assigned_to'),
  source:        text('source'),
  notes:         text('notes'),
  budget:        numeric('budget', { precision: 15, scale: 2 }),
  closed_at:     timestamp('closed_at'),
  lost_reason:   text('lost_reason'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const sd_quotations = pgTable('sd_quotations', {
  id:           serial('id').primaryKey(),
  lead_id:      integer('lead_id'),
  order_id:     integer('order_id'),
  status:       text('status').default('draft'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Finance Extended: Payroll, Budgets ───────────────────────────────────────

export const budgets = pgTable('budgets', {
  id:              serial('id').primaryKey(),
  name:            text('name'),
  fiscal_year:     integer('fiscal_year'),
  department_id:   integer('department_id'),
  total_amount:    numeric('total_amount', { precision: 15, scale: 2 }).default('0'),
  spent_amount:    numeric('spent_amount', { precision: 15, scale: 2 }).default('0'),
  status:          text('status').default('draft'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const budget_lines = pgTable('budget_lines', {
  id:          serial('id').primaryKey(),
  budget_id:   integer('budget_id'),
  account_id:  integer('account_id'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  spent:       numeric('spent', { precision: 15, scale: 2 }).default('0'),
  description: text('description'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const advances = pgTable('advances', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  status:      text('status').default('pending'),
  purpose:     text('purpose'),
  approved_by: integer('approved_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── HR Leave & Attendance ─────────────────────────────────────────────────────

export const hr_leave_balances = pgTable('hr_leave_balances', {
  id:            serial('id').primaryKey(),
  employee_id:   integer('employee_id'),
  leave_type:    text('leave_type'),
  year:          integer('year'),
  total_days:    integer('total_days').default(0),
  used_days:     integer('used_days').default(0),
  remaining_days: integer('remaining_days').default(0),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const attendance_records = pgTable('attendance_records', {
  id:            serial('id').primaryKey(),
  employee_id:   integer('employee_id'),
  check_in:      timestamp('check_in'),
  check_out:     timestamp('check_out'),
  date:          date('date'),
  status:        text('status').default('present'),
  notes:         text('notes'),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── IoT Tables ────────────────────────────────────────────────────────────────

export const iot_sensors = pgTable('iot_sensors', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  type:        text('type'),
  machine_id:  integer('machine_id'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const iot_sensor_readings = pgTable('iot_sensor_readings', {
  id:          serial('id').primaryKey(),
  sensor_id:   integer('sensor_id'),
  value:       numeric('value', { precision: 15, scale: 4 }),
  unit:        text('unit'),
  recorded_at: timestamp('recorded_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const iot_alerts = pgTable('iot_alerts', {
  id:          serial('id').primaryKey(),
  sensor_id:   integer('sensor_id'),
  alert_type:  text('alert_type'),
  message:     text('message'),
  severity:    text('severity').default('info'),
  is_resolved: boolean('is_resolved').default(false),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Skills & Competency ───────────────────────────────────────────────────────

// ─── MM Vendor & Requisition ───────────────────────────────────────────────────
