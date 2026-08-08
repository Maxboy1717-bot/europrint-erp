/**
 * @module schema-compat-1b
 * @description Source module. See exports for details.
 */

import { date } from 'drizzle-orm/pg-core';
import { pgTable, uuid, text, boolean, decimal, integer, jsonb, createId, ts } from './schema-compat-helpers';


export const hrFunnelHistory = pgTable('hr_funnel_history', {
  id: integer('id').primaryKey(),
  candidateId: integer('candidate_id'),
  funnelId: text('funnel_id'),
  stage: text('stage').notNull(),
  changedBy: text('changed_by'),
  fromStage: text('from_stage'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
});

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { hrReferencesChecks } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { hrToolTestResults } from '@workspace/db';

export const hrOnboardingPlans = pgTable('hr_onboarding_plans', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  tasks: text('tasks').default('[]'),
  durationDays: integer('duration_days').default(30),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  departmentId: text('department_id'),
  positionId: integer('position_id'),
  createdById: integer('created_by_id'),
  // FIX 2026-07-13 (HR onboarding→karta wiring audit): these 7 columns are REAL on the live
  // table (confirmed via information_schema.columns + pg_constraint — `fk_hr_onboard_org_dept`
  // FKs org_department_id → org_departments(id), the CANONICAL karta table) but were NEVER
  // declared here, so `createPlan`/`listPlans`/`getPlanById` silently dropped `nameRu` and
  // `successCriteria` (data loss) and wrote `weeklyPlan`/`probationDays` into the LEGACY
  // `tasks`/`duration_days` columns instead of these dedicated ones — and there was NO way,
  // even manually, to bind a plan to a card (org_department_id was unreachable from any
  // repo/DTO). This is the root cause of "reja↔karta binding ishlamagan" from the 2026-07-13
  // onboarding audit — DRIFT-NN class bug, same pattern as the hr_employee_onboardings
  // end_date/progress fix in this same file. Added, not migrated (columns already exist).
  updatedAt: ts('updated_at').defaultNow(),
  orgDepartmentId: integer('org_department_id'),
  orgFunctionId: integer('org_function_id'),
  name: text('name'),
  nameRu: text('name_ru'),
  weeklyPlan: jsonb('weekly_plan'),
  probationDays: integer('probation_days'),
  successCriteria: jsonb('success_criteria'),
});

export const hrEmployeeOnboardings = pgTable('hr_employee_onboardings', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  planId: text('plan_id'),
  status: text('status').notNull().default('in_progress'),
  // FIX 2026-07-04 (found while live-verifying SB0072/SB0101): `progress` (integer) and `endDate`
  // (`end_date`) do NOT exist on the live table (confirmed via information_schema.columns) and are
  // never read/written by any onboarding code (which uses expectedEndDate/actualEndDate/
  // weeklyProgress instead) — a phantom-column drift that made every `startOnboarding()` INSERT
  // throw ("column end_date does not exist"), so this endpoint had 0 successful inserts ever
  // (DRIFT-NN class bug, same as the hr-card-links-2026-07-04.sql created_at/updated_at fix in
  // this same file's sibling table). Removed rather than added to DB — dead fields, not a design gap.
  startDate: ts('start_date'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  mentorId: integer('mentor_id'),
  expectedEndDate: ts('expected_end_date'),
  actualEndDate: ts('actual_end_date'),
  weeklyProgress: text('weekly_progress'),
  probationScore: decimal('probation_score', { precision: 5, scale: 2 }),
  probationNotes: text('probation_notes'),
  isProbationPassed: boolean('is_probation_passed'),
  // SB0072/SB0101 (hr-card-links-2026-07-04.sql): onboarding nishon-kartasi (org_departments.id) —
  // probation o'tgach shu karta employee_cards'ga faollashtiriladi (CardService.assignEmployeeToCard).
  cardId: integer('card_id'),
});

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { hrJobDescriptions } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { hrJobOffers } from '@workspace/db';

export const hrMotivationPlans = pgTable('hr_motivation_plans', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  title: text('title').notNull(),
  targets: text('targets').default('[]'),
  status: text('status').notNull().default('active'),
  startDate: ts('start_date'),
  endDate: ts('end_date'),
  createdAt: ts('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

export const hrProductivityInterviews = pgTable('hr_productivity_interviews', {
  id: integer('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  funnelId: integer('funnel_id'),
  interviewerId: integer('interviewer_id'),
  productivityInterview: text('productivity_interview'),
  referenceCheck: text('reference_check'),
  finalDecision: text('final_decision'),
  finalNotes: text('final_notes'),
  conductedAt: ts('conducted_at').notNull().defaultNow(),
  createdAt: ts('created_at').defaultNow(),
});


