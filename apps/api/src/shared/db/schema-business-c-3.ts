/**
 * @module schema-business-c-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, timestamp, jsonb, date,
} from 'drizzle-orm/pg-core';

// [dedup] employee_skill_scores → canonical employeeSkillScores in @workspace/db (hr-v2-schema → index)
export { employeeSkillScores as employee_skill_scores } from '@workspace/db';

// [dedup] position_skill_requirements → canonical positionSkillRequirements in @workspace/db
//   (hr-performance-ext → hr-extended → hr-schema → index)
export { positionSkillRequirements as position_skill_requirements } from '@workspace/db';

// [2026-05-22 dedup] employee_skills: re-exported from canonical definition in
// lib/db (hr-performance-ext.ts: 19 cols with certifications/status/CHECK constraints,
// in barrel chain). Previous local pgTable (11 cols, minimal stub) removed.
import { employeeSkills as _employeeSkills_canon } from '@workspace/db';
export const employee_skills = _employeeSkills_canon;

// ─── HR: AI Interview / Test Questions ───────────────────────────────────────
// hrc_iq_questions: NOT in lib/db barrel — kept as local stub.
export const hrc_iq_questions = pgTable('hrc_iq_questions', {
  id:         serial('id').primaryKey(),
  text_uz:    text('text_uz'),
  text_ru:    text('text_ru'),
  options:    jsonb('options'),
  category:   text('category'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── HR: Adaptation Cases ─────────────────────────────────────────────────────
// hr_adaptation_cases: NOT in lib/db barrel — kept as local stub.
export const hr_adaptation_cases = pgTable('hr_adaptation_cases', {
  id:             serial('id').primaryKey(),
  employee_id:    integer('employee_id').notNull(),
  status:         text('status').default('active'),
  risk_level:     text('risk_level').default('low'),
  adaptation_day: integer('adaptation_day').default(0),
  risk_reason:    text('risk_reason'),
  notified_at:    timestamp('notified_at'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── HR: Employee Contracts ───────────────────────────────────────────────────
// employee_contracts: NOT in lib/db barrel (canonical is employment_contracts, different table name) — kept as local stub.
export const employee_contracts = pgTable('employee_contracts', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id').notNull(),
  contract_number: text('contract_number'),
  contract_type:   text('contract_type').default('permanent'),
  start_date:      date('start_date'),
  end_date:        date('end_date'),
  status:          text('status').default('active'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

// ─── PIP Goals ────────────────────────────────────────────────────────────────
// pip_goals: NOT in lib/db barrel (canonical is pipPlans/pipProgressUpdates, different structure) — kept as local stub.
export const pip_goals = pgTable('pip_goals', {
  id:          serial('id').primaryKey(),
  pip_plan_id: integer('pip_plan_id').notNull(),
  title:       text('title'),
  description: text('description'),
  status:      text('status').default('pending'),
  due_date:    date('due_date'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Currencies ───────────────────────────────────────────────────────────────
// [dedup] currencies → canonical currencies in @workspace/db (core-schema → core/core-ai-reports → index)
export { currencies } from '@workspace/db';
