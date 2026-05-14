/**
 * @module schema-business-c-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

export const sales_invoices = pgTable('sales_invoices', {
  id:             serial('id').primaryKey(),
  customer_id:    text('customer_id'),
  customer_name:  text('customer_name'),
  invoice_number: text('invoice_number'),
  sales_order_id: text('sales_order_id'),
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  paid_amount:    numeric('paid_amount', { precision: 15, scale: 2 }).default('0'),
  currency:       text('currency').default('UZS'),
  status:         text('status').default('draft'),
  payment_status: text('payment_status').default('unpaid'),
  due_date:       date('due_date'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── HR: Safety, Documents, Workflows, Assets, Shift, Adaptation ─────────────

export const hr_brand_settings = pgTable('hr_brand_settings', {
  id:         serial('id').primaryKey(),
  company_id: text('company_id').unique().notNull(),
  brand_data: jsonb('brand_data'),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const safety_incidents = pgTable('safety_incidents', {
  id:                   serial('id').primaryKey(),
  incident_type:        text('incident_type'),
  severity:             text('severity').default('low'),
  description:          text('description'),
  location_description: text('location_description'),
  department_id:        integer('department_id'),
  incident_date:        date('incident_date'),
  investigation_status: text('investigation_status').default('open'),
  status:               text('status').default('reported'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

export const safety_training_records = pgTable('safety_training_records', {
  id:              serial('id').primaryKey(),
  training_id:     integer('training_id'),
  employee_id:     integer('employee_id'),
  completed_date:  date('completed_date'),
  expiry_date:     date('expiry_date'),
  score:           numeric('score', { precision: 5, scale: 2 }),
  is_passed:       boolean('is_passed').default(false),
  certificate_url: text('certificate_url'),
  created_at:      timestamp('created_at').defaultNow(),
});

export const hazard_zones = pgTable('hazard_zones', {
  id:                    serial('id').primaryKey(),
  zone_name:             text('zone_name').notNull(),
  zone_code:             text('zone_code'),
  department_id:         integer('department_id'),
  hazard_level:          text('hazard_level').default('low'),
  required_ppe:          text('required_ppe'),
  max_occupancy:         integer('max_occupancy'),
  is_active:             boolean('is_active').default(true),
  last_inspection_date:  date('last_inspection_date'),
  next_inspection_date:  date('next_inspection_date'),
  created_at:            timestamp('created_at').defaultNow(),
});

export const ppe_compliance = pgTable('ppe_compliance', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  ppe_type:    text('ppe_type'),
  issue_date:  date('issue_date'),
  expiry_date: date('expiry_date'),
  is_compliant: boolean('is_compliant').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const hr_leave_requests = pgTable('hr_leave_requests', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id'),
  start_date:   date('start_date'),
  end_date:     date('end_date'),
  reason:       text('reason'),
  status:       text('status').default('pending'),
  requested_at: timestamp('requested_at').defaultNow(),
  reviewed_at:  timestamp('reviewed_at'),
  notes:        text('notes'),
});

export const shift_schedules = pgTable('shift_schedules', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  shift_date:  date('shift_date'),
  shift_type:  text('shift_type'),
  start_time:  text('start_time'),
  end_time:    text('end_time'),
  status:      text('status').default('scheduled'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const document_templates = pgTable('document_templates', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  description: text('description'),
  steps:       jsonb('steps'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const workflow_route_configs = pgTable('workflow_route_configs', {
  id:            serial('id').primaryKey(),
  document_type: text('document_type').notNull(),
  steps:         jsonb('steps'),
  is_active:     boolean('is_active').default(true),
  created_at:    timestamp('created_at').defaultNow(),
});

export const adaptation_programs = pgTable('adaptation_programs', {
  id:           serial('id').primaryKey(),
  program_name: text('program_name').notNull(),
  description:  text('description'),
  duration_days: integer('duration_days'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

export const adaptation_records = pgTable('adaptation_records', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  program_id:  integer('program_id'),
  status:      text('status').default('active'),
  started_at:  timestamp('started_at').defaultNow(),
  completed_at: timestamp('completed_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const adaptation_milestones = pgTable('adaptation_milestones', {
  id:               serial('id').primaryKey(),
  record_id:        integer('record_id'),
  milestone_number: integer('milestone_number'),
  milestone_title:  text('milestone_title'),
  description:      text('description'),
  due_date:         date('due_date'),
  status:           text('status').default('pending'),
  created_at:       timestamp('created_at').defaultNow(),
});

// ─── HR: Salary History / Payroll Periods / Attendance / Checkups ────────────

export const salary_history = pgTable('salary_history', {
  id:                    serial('id').primaryKey(),
  employee_id:           integer('employee_id').notNull(),
  salary_period_start:   date('salary_period_start'),
  salary_period_end:     date('salary_period_end'),
  base_salary:           numeric('base_salary', { precision: 15, scale: 2 }),
  salary_earned:         numeric('salary_earned', { precision: 15, scale: 2 }),
  total_bonuses:         numeric('total_bonuses', { precision: 15, scale: 2 }).default('0'),
  other_bonuses:         numeric('other_bonuses', { precision: 15, scale: 2 }).default('0'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

export const payroll_periods_hr = pgTable('payroll_periods', {
  id:                    serial('id').primaryKey(),
  period_name:           text('period_name'),
  period_start_date:     date('period_start_date'),
  period_end_date:       date('period_end_date'),
  status:                text('status').default('open'),
  total_payroll_amount:  numeric('total_payroll_amount', { precision: 15, scale: 2 }),
  employee_count:        integer('employee_count').default(0),
  closed_at:             timestamp('closed_at'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

export const hr_attendance = pgTable('attendance', {
  id:                   serial('id').primaryKey(),
  employee_id:          integer('employee_id'),
  attendance_date:      date('attendance_date'),
  check_in_time:        text('check_in_time'),
  check_out_time:       text('check_out_time'),
  status:               text('status').default('present'),
  late_minutes:         integer('late_minutes').default(0),
  early_leave_minutes:  integer('early_leave_minutes').default(0),
  overtime_minutes:     integer('overtime_minutes').default(0),
  source:               text('source'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

export const hr_360_feedback = pgTable('hr_360_feedback', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id'),
  order_id:     integer('order_id'),
  session_id:   text('session_id'),
  quantity:     numeric('quantity', { precision: 10, scale: 2 }),
  defect_rate:  numeric('defect_rate', { precision: 7, scale: 4 }),
  oee:          numeric('oee', { precision: 7, scale: 4 }),
  recorded_at:  timestamp('recorded_at').defaultNow(),
});

export const hr_health_checkups = pgTable('hr_health_checkups', {
  id:                serial('id').primaryKey(),
  department_id:     integer('department_id'),
  department_name:   text('department_name'),
  total_employees:   integer('total_employees').default(0),
  examined_count:    integer('examined_count').default(0),
  last_checkup_date: date('last_checkup_date'),
  next_checkup_date: date('next_checkup_date'),
  status:            text('status').default('pending'),
  updated_at:        timestamp('updated_at').defaultNow(),
});

export const hr_conflict_reports = pgTable('hr_conflict_reports', {
  id:          serial('id').primaryKey(),
  party1:      text('party1'),
  party2:      text('party2'),
  description: text('description'),
  severity:    text('severity').default('low'),
  status:      text('status').default('open'),
  resolved_at: timestamp('resolved_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const employee_360_assessments = pgTable('employee_360_assessments', {
  id:                    serial('id').primaryKey(),
  employee_id:           integer('employee_id'),
  assessment_period:     text('assessment_period'),
  assessment_year:       integer('assessment_year'),
  self_rating:           numeric('self_rating', { precision: 4, scale: 2 }),
  manager_rating:        numeric('manager_rating', { precision: 4, scale: 2 }),
  peer_rating:           numeric('peer_rating', { precision: 4, scale: 2 }),
  average_rating:        numeric('average_rating', { precision: 4, scale: 2 }),
  strengths:             text('strengths'),
  areas_for_improvement: text('areas_for_improvement'),
  status:                text('status').default('pending'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

// ─── HR: Visitor Log / Reception ─────────────────────────────────────────────

export const visitor_log = pgTable('visitor_log', {
  id:               serial('id').primaryKey(),
  visitor_name:     text('visitor_name').notNull(),
  visitor_phone:    text('visitor_phone'),
  visitor_company:  text('visitor_company'),
  purpose:          text('purpose'),
  host_employee_id: integer('host_employee_id'),
  badge_number:     text('badge_number'),
  check_in_at:      timestamp('check_in_at').defaultNow(),
  check_out_at:     timestamp('check_out_at'),
  registered_by:    integer('registered_by'),
  id_document:      text('id_document'),
  id_document_type: text('id_document_type').default('passport'),
  notes:            text('notes'),
  status:           text('status').default('active'),
});

// ─── HR: eNPS Responses ───────────────────────────────────────────────────────

export const enps_responses = pgTable('enps_responses', {
  id:          serial('id').primaryKey(),
  survey_id:   integer('survey_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  score:       integer('score'),
  comment:     text('comment'),
  answers:     jsonb('answers'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: Skills Matrix ────────────────────────────────────────────────────────

export const skill_catalog = pgTable('skill_catalog', {
  id:          serial('id').primaryKey(),
  code:        text('code').unique().notNull(),
  name:        text('name').notNull(),
  name_ru:     text('name_ru'),
  category:    text('category'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── SD Contracts ─────────────────────────────────────────────────────────────

export const sd_contracts = pgTable('sd_contracts', {
  id:              serial('id').primaryKey(),
  contract_number: text('contract_number'),
  order_id:        integer('order_id'),
  order_number:    text('order_number'),
  customer_id:     integer('customer_id'),
  template_type:   text('template_type').default('standard'), // standard | vip | oneTime
  papka_no:        text('papka_no'),
  status:          text('status').default('draft'), // draft | sent | signed | cancelled
  signed_at:       timestamp('signed_at'),
  notes:           text('notes'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});
