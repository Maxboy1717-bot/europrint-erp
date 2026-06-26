/**
 * @module schema-ext-c-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date, varchar,
} from 'drizzle-orm/pg-core';
import { employee_contracts as canonicalEmployeeContracts } from './schema-business-c-3';
// NOTE: `import { sql } from 'drizzle-orm'` removed — no longer used after dedup.

// ─── MES: Equipment & Machines ────────────────────────────────────────────────
// [2026-05-22 dedup] equipment: re-exported from canonical definition in
// lib/db (pp/pp-production.ts, in barrel via pp-schema.ts). Previous local
// pgTable (8 cols) removed.
export { equipment } from '@workspace/db/schema/pp-schema';

// [2026-05-22 dedup] machine_tasks: re-exported from canonical definition in
// lib/db (pp/pp-papka.ts: machineTasks, in barrel via pp-schema.ts). Previous
// local pgTable (8 cols) removed.
export { machineTasks as machine_tasks } from '@workspace/db/schema/pp-schema';

// ─── HR PIP & Discipline ───────────────────────────────────────────────────────
// lib/db da bor lekin barrel da eksport yo'q yoki nomi farqli:
// pipProgressUpdates → `pip_progress_updates` (boshqa jadval nomi)
// disciplineRecords → `discipline_records` (boshqa jadval nomi)
// Shuning uchun saqlab qolindi.

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

// Canonical: schema-misc-app-a.ts (user_id/org_department_id/is_primary/assigned_at).
// All callers use the canonical snake-case shape — this duplicate had no column-level
// callers (employee_id/department_id/role were unused). Shim to canon to remove drift.
export { employeeOrgDepartments as employee_org_departments } from './schema-misc-app-a';

// ─── Finance Extended Report Tables ───────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

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
// Canonical definitions live in `@workspace/db/schema/lms-extended`.
// These local snake_case aliases are kept for backward-compatible imports only.

export { lmsModules as lms_modules } from '@workspace/db/schema/lms-extended';
export { lmsExams as lms_exams } from '@workspace/db/schema/lms-extended';
// lms_exam_attempts: aiExamAttempts in schema-ai.ts is the live definition (uuid PK, employeeId,
// questions/answers JSONB). The stale lib/db version (serial PK, examId FK) was removed.

// lms_assignments: duplicate of schema-compat-4.ts `assignments` export; 0 Drizzle consumers → removed.
// Consumers use raw SQL INSERT INTO lms_assignments — unaffected by Drizzle object removal.

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

// EP-ORG-116 (T10-09): KARTAga mentor (PHASE-07 darslik item 4). Karta-markazli link-jadval:
// card_id -> org_departments (kanonik karta), mentor_user_id -> users. Onboarding mentorligi.
export const lms_card_mentors = pgTable('lms_card_mentors', {
  id:             serial('id').primaryKey(),
  card_id:        integer('card_id').notNull(),
  mentor_user_id: integer('mentor_user_id').notNull(),
  course_id:      integer('course_id'),
  is_active:      boolean('is_active').notNull().default(true),
  notes:          text('notes'),
  assigned_by:    integer('assigned_by'),
  assigned_at:    timestamp('assigned_at').notNull().defaultNow(),
  revoked_at:     timestamp('revoked_at'),
  created_at:     timestamp('created_at').notNull().defaultNow(),
  updated_at:     timestamp('updated_at').notNull().defaultNow(),
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
// [2026-05-22 dedup] adaptation_feedback: re-exported from canonical definition in
// lib/db (hr-performance-core.ts: adaptationFeedback, in barrel via
// hr-performance → hr-schema → index). Previous local pgTable (5 cols) removed.
export { adaptationFeedback as adaptation_feedback } from '@workspace/db';

// ─── KPI & Goals ───────────────────────────────────────────────────────────────
// kpiDefinitions / kpiValues were removed from lib/db as orphans; local
// definitions retained here so @shared/db consumers continue to work.
export const kpi_definitions = pgTable('kpi_definitions', {
  id:          serial('id').primaryKey(),
  code:        varchar('code', { length: 50 }).notNull().unique(),
  name:        text('name').notNull(),
  description: text('description'),
  unit:        varchar('unit', { length: 20 }),
  isActive:    boolean('is_active').default(true),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const kpi_values = pgTable('kpi_values', {
  id:              serial('id').primaryKey(),
  kpiDefinitionId: integer('kpi_definition_id').references(() => kpi_definitions.id),
  employeeId:      integer('employee_id'),
  value:           numeric('value', { precision: 14, scale: 4 }),
  period:          varchar('period', { length: 20 }),
  recordedAt:      timestamp('recorded_at').defaultNow().notNull(),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
});

// [2026-05-22 dedup] goals: re-exported from canonical definition in
// lib/db (core/core-ai.ts: goals, in barrel via core-schema → index).
export { goals } from '@workspace/db';

// ─── Employee Benefits & Contracts ────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

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
