/**
 * @module schema-compat-1b
 * @description Source module. See exports for details.
 */

import { date } from 'drizzle-orm/pg-core';
import { pgTable, uuid, text, boolean, decimal, integer, createId, ts } from './schema-compat-helpers';


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
});

export const hrEmployeeOnboardings = pgTable('hr_employee_onboardings', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  planId: text('plan_id'),
  status: text('status').notNull().default('in_progress'),
  progress: integer('progress').default(0),
  startDate: ts('start_date'),
  endDate: ts('end_date'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  mentorId: integer('mentor_id'),
  expectedEndDate: ts('expected_end_date'),
  actualEndDate: ts('actual_end_date'),
  weeklyProgress: text('weekly_progress'),
  probationScore: decimal('probation_score', { precision: 5, scale: 2 }),
  probationNotes: text('probation_notes'),
  isProbationPassed: boolean('is_probation_passed'),
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


