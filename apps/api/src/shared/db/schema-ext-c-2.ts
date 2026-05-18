/**
 * @module schema-ext-c-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
import { employee_badges as canonicalEmployeeBadges } from './schema-business-c-1';

export const employee_transfers_ext = pgTable('employee_transfers', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id'),
  from_department: integer('from_department'),
  to_department:   integer('to_department'),
  from_position:   integer('from_position'),
  to_position:     integer('to_position'),
  effective_date:  date('effective_date'),
  reason:          text('reason'),
  created_at:      timestamp('created_at').defaultNow(),
});

export const employee_files = pgTable('employee_files', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  file_type:   text('file_type'),
  file_name:   text('file_name'),
  file_url:    text('file_url'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_ratings = pgTable('employee_ratings', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  rater_id:    integer('rater_id'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  period:      text('period'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_rating_goals = pgTable('employee_rating_goals', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  goal_id:     integer('goal_id'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  created_at:  timestamp('created_at').defaultNow(),
});

// employee_badges: re-exported from canonical definition in schema-business-c-1.ts
export const employee_badges_ext = canonicalEmployeeBadges;

export const employee_daily_reports = pgTable('employee_daily_reports', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  report_date: date('report_date'),
  data:        jsonb('data').default({}),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_daily_kpi = pgTable('employee_daily_kpi', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  kpi_date:    date('kpi_date'),
  value:       numeric('value', { precision: 15, scale: 4 }),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_inventory_ledger = pgTable('employee_inventory_ledger', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  item_id:     integer('item_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  type:        text('type'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_liability_cases = pgTable('employee_liability_cases', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  reason:      text('reason'),
  status:      text('status').default('open'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const employee_360_responses = pgTable('employee_360_responses', {
  id:            serial('id').primaryKey(),
  assessment_id: integer('assessment_id'),
  rater_id:      integer('rater_id'),
  scores:        jsonb('scores').default({}),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── HR Succession & Career ────────────────────────────────────────────────────

export const succession_plans = pgTable('succession_plans', {
  id:             serial('id').primaryKey(),
  position_id:    integer('position_id'),
  candidate_id:   integer('candidate_id'),
  readiness:      text('readiness').default('medium'),
  notes:          text('notes'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── Strategic OKR ─────────────────────────────────────────────────────────────

// ─── HR: Applications & Interviews ────────────────────────────────────────────

export const hr_application_responses = pgTable('hr_application_responses', {
  id:             serial('id').primaryKey(),
  application_id: integer('application_id'),
  question_id:    integer('question_id'),
  answer:         text('answer'),
  created_at:     timestamp('created_at').defaultNow(),
});

export const hr_candidate_funnels = pgTable('hr_candidate_funnels', {
  id:           serial('id').primaryKey(),
  vacancy_id:   integer('vacancy_id'),
  candidate_id: integer('candidate_id'),
  stage:        text('stage').default('applied'),
  notes:        text('notes'),
  moved_at:     timestamp('moved_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── HR Capital ────────────────────────────────────────────────────────────────

export const hr_capital_courses = pgTable('hr_capital_courses', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  provider:    text('provider'),
  cost:        numeric('cost', { precision: 15, scale: 2 }),
  duration:    integer('duration'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── WMS Exit & Production Supply ─────────────────────────────────────────────

export const wms_exit_logs = pgTable('wms_exit_logs', {
  id:          serial('id').primaryKey(),
  material_id: integer('material_id'),
  warehouse_id: integer('warehouse_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  reason:      text('reason'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const wms_production_supply = pgTable('wms_production_supply', {
  id:           serial('id').primaryKey(),
  order_id:     integer('order_id'),
  material_id:  integer('material_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  supplied_at:  timestamp('supplied_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── Customs & Trade ───────────────────────────────────────────────────────────

export const customs_declarations = pgTable('customs_declarations', {
  id:             serial('id').primaryKey(),
  declaration_number: text('declaration_number'),
  type:           text('type'),
  status:         text('status').default('draft'),
  total_value:    numeric('total_value', { precision: 15, scale: 2 }),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── SD Rentals & Price Formulas ───────────────────────────────────────────────

export const sd_rentals = pgTable('sd_rentals', {
  id:           serial('id').primaryKey(),
  customer_id:  integer('customer_id'),
  equipment_id: integer('equipment_id'),
  start_date:   date('start_date'),
  end_date:     date('end_date'),
  daily_rate:   numeric('daily_rate', { precision: 15, scale: 2 }),
  status:       text('status').default('active'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const sd_price_formulas = pgTable('sd_price_formulas', {
  id:         serial('id').primaryKey(),
  name:       text('name'),
  formula:    text('formula'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── HR Conflict & Sick Reports ───────────────────────────────────────────────

// ─── Finance: Exception Logs ───────────────────────────────────────────────────

export const exception_logs = pgTable('exception_logs', {
  id:          serial('id').primaryKey(),
  module:      text('module'),
  error_msg:   text('error_msg'),
  stack:       text('stack'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── MM: Design Orders ─────────────────────────────────────────────────────────

export const design_order_revisions = pgTable('design_order_revisions', {
  id:          serial('id').primaryKey(),
  order_id:    integer('order_id'),
  version:     integer('version').default(1),
  notes:       text('notes'),
  created_by:  integer('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: Shift & Attendance ────────────────────────────────────────────────────

export const shift_swap_requests = pgTable('shift_swap_requests', {
  id:             serial('id').primaryKey(),
  requester_id:   integer('requester_id'),
  target_id:      integer('target_id'),
  shift_date:     date('shift_date'),
  status:         text('status').default('pending'),
  created_at:     timestamp('created_at').defaultNow(),
});

export const attendance_logs = pgTable('attendance_logs', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  type:        text('type'),
  logged_at:   timestamp('logged_at'),
  source:      text('source'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Kaizen & Improvement ─────────────────────────────────────────────────────

// ─── Warehouse Rental ──────────────────────────────────────────────────────────

export const warehouse_rental_records = pgTable('warehouse_rental_records', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  customer_id:  integer('customer_id'),
  start_date:   date('start_date'),
  end_date:     date('end_date'),
  monthly_rate: numeric('monthly_rate', { precision: 15, scale: 2 }),
  status:       text('status').default('active'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const warehouse_rental_settings = pgTable('warehouse_rental_settings', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  free_days:    integer('free_days').default(30),
  daily_rate:   numeric('daily_rate', { precision: 15, scale: 2 }),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const warehouse_access_grants = pgTable('warehouse_access_grants', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  employee_id:  integer('employee_id'),
  access_level: text('access_level').default('read'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const warehouse_stock = pgTable('warehouse_stock', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  item_id:      integer('item_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }).default('0'),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const warehouse_batches = pgTable('warehouse_batches', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  item_id:      integer('item_id'),
  batch_number: text('batch_number'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  received_at:  timestamp('received_at'),
  created_at:   timestamp('created_at').defaultNow(),
});
