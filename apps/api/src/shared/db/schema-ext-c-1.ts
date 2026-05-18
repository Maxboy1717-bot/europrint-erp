/**
 * @module schema-ext-c-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employee_contracts as canonicalEmployeeContracts } from './schema-business-c-3';

// ─── MES: Equipment & Machines ────────────────────────────────────────────────

export const equipment = pgTable('equipment', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  type:        text('type'),
  location:    text('location'),
  status:      text('status').default('active'),
  last_maintenance_at: timestamp('last_maintenance_at'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const machine_tasks = pgTable('machine_tasks', {
  id:           serial('id').primaryKey(),
  machine_id:   integer('machine_id'),
  operator_id:  integer('operator_id'),
  order_id:     integer('order_id'),
  status:       text('status').default('pending'),
  started_at:   timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── HR PIP & Discipline ───────────────────────────────────────────────────────

export const pip_progress = pgTable('pip_progress', {
  id:          serial('id').primaryKey(),
  plan_id:     integer('plan_id'),
  period:      text('period'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const disciplinary_actions = pgTable('disciplinary_actions', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id'),
  type:         text('type'),
  reason:       text('reason'),
  severity:     text('severity').default('warning'),
  issued_by:    integer('issued_by'),
  appeal_status: text('appeal_status'),
  resolved_at:  timestamp('resolved_at'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const employee_org_departments = pgTable('employee_org_departments', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  department_id: integer('department_id'),
  role:        text('role'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Finance Extended Report Tables ───────────────────────────────────────────

export const erp_daily_reports = pgTable('erp_daily_reports', {
  id:          serial('id').primaryKey(),
  report_date: date('report_date'),
  department_id: integer('department_id'),
  data:        jsonb('data').default({}),
  created_at:  timestamp('created_at').defaultNow(),
});

export const erp_production_facts = pgTable('erp_production_facts', {
  id:           serial('id').primaryKey(),
  order_id:     integer('order_id'),
  machine_id:   integer('machine_id'),
  produced_qty: numeric('produced_qty', { precision: 15, scale: 4 }).default('0'),
  shift_date:   date('shift_date'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const erp_downtime_logs = pgTable('erp_downtime_logs', {
  id:            serial('id').primaryKey(),
  machine_id:    integer('machine_id'),
  reason:        text('reason'),
  started_at:    timestamp('started_at'),
  ended_at:      timestamp('ended_at'),
  duration_min:  integer('duration_min'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const erp_production_plans = pgTable('erp_production_plans', {
  id:          serial('id').primaryKey(),
  order_id:    integer('order_id'),
  plan_date:   date('plan_date'),
  planned_qty: numeric('planned_qty', { precision: 15, scale: 4 }),
  created_at:  timestamp('created_at').defaultNow(),
});

export const erp_shift_calendars = pgTable('erp_shift_calendars', {
  id:          serial('id').primaryKey(),
  shift_date:  date('shift_date'),
  shift_number: integer('shift_number'),
  is_working:  boolean('is_working').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const erp_mrp_runs = pgTable('erp_mrp_runs', {
  id:         serial('id').primaryKey(),
  run_date:   date('run_date'),
  status:     text('status').default('pending'),
  created_at: timestamp('created_at').defaultNow(),
});

export const erp_mrp_results = pgTable('erp_mrp_results', {
  id:          serial('id').primaryKey(),
  run_id:      integer('run_id'),
  material_id: integer('material_id'),
  required_qty: numeric('required_qty', { precision: 15, scale: 4 }),
  available_qty: numeric('available_qty', { precision: 15, scale: 4 }),
  created_at:  timestamp('created_at').defaultNow(),
});

export const erp_employee_work_centers = pgTable('erp_employee_work_centers', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id'),
  work_center_id:  integer('work_center_id'),
  role:            text('role'),
  created_at:      timestamp('created_at').defaultNow(),
});

export const erp_employees = pgTable('erp_employees', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  erp_role:    text('erp_role'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── LMS Extra ─────────────────────────────────────────────────────────────────

export const lms_modules = pgTable('lms_modules', {
  id:         text('id').primaryKey(),
  course_id:  text('course_id'),
  title:      text('title'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
});

export const lms_exams = pgTable('lms_exams', {
  id:         text('id').primaryKey(),
  module_id:  text('module_id'),
  title:      text('title'),
  pass_score: integer('pass_score').default(70),
  created_at: timestamp('created_at').defaultNow(),
});

export const lms_exam_attempts = pgTable('lms_exam_attempts', {
  id:         text('id').primaryKey(),
  exam_id:    text('exam_id'),
  user_id:    text('user_id'),
  score:      numeric('score', { precision: 5, scale: 2 }),
  passed:     boolean('passed').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const lms_assignments = pgTable('lms_assignments', {
  id:            text('id').primaryKey(),
  user_id:       text('user_id'),
  course_id:     text('course_id'),
  assigned_by:   text('assigned_by'),
  due_date:      timestamp('due_date'),
  status:        text('status').default('pending'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const lms_knowledge = pgTable('lms_knowledge', {
  id:          text('id').primaryKey(),
  title:       text('title'),
  content:     text('content'),
  category:    text('category'),
  is_published: boolean('is_published').default(false),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const lms_achievements = pgTable('lms_achievements', {
  id:          text('id').primaryKey(),
  name:        text('name'),
  description: text('description'),
  badge_url:   text('badge_url'),
  points:      integer('points').default(0),
  created_at:  timestamp('created_at').defaultNow(),
});

export const lms_user_achievements = pgTable('lms_user_achievements', {
  id:             text('id').primaryKey(),
  user_id:        text('user_id'),
  achievement_id: text('achievement_id'),
  earned_at:      timestamp('earned_at'),
  created_at:     timestamp('created_at').defaultNow(),
});

export const lms_tests_ext = pgTable('lms_tests_ext', {
  id:          text('id').primaryKey(),
  course_id:   text('course_id'),
  title:       text('title'),
  pass_score:  integer('pass_score').default(70),
  time_limit:  integer('time_limit'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR Adaptation ─────────────────────────────────────────────────────────────

export const adaptation_feedback = pgTable('adaptation_feedback', {
  id:          serial('id').primaryKey(),
  case_id:     integer('case_id'),
  from_id:     integer('from_id'),
  score:       integer('score'),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── KPI & Goals ───────────────────────────────────────────────────────────────

export const kpi_definitions = pgTable('kpi_definitions', {
  id:           serial('id').primaryKey(),
  name:         text('name'),
  description:  text('description'),
  unit:         text('unit'),
  target_value: numeric('target_value', { precision: 15, scale: 4 }),
  department_id: integer('department_id'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

export const kpi_values = pgTable('kpi_values', {
  id:            serial('id').primaryKey(),
  kpi_id:        integer('kpi_id'),
  employee_id:   integer('employee_id'),
  actual_value:  numeric('actual_value', { precision: 15, scale: 4 }),
  period:        text('period'),
  recorded_at:   timestamp('recorded_at'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const goals = pgTable('goals', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  title:       text('title'),
  description: text('description'),
  due_date:    date('due_date'),
  status:      text('status').default('in_progress'),
  progress:    integer('progress').default(0),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── Employee Benefits & Contracts ────────────────────────────────────────────

export const employee_benefits = pgTable('employee_benefits', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  benefit_type: text('benefit_type'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  start_date:  date('start_date'),
  end_date:    date('end_date'),
  status:      text('status').default('active'),
  created_at:  timestamp('created_at').defaultNow(),
});

// employee_contracts: re-exported from canonical definition in schema-business-c-3.ts
export const employee_contracts = canonicalEmployeeContracts;
