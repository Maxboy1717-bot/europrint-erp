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

export const hrReferencesChecks = pgTable('hr_references_checks', {
  id: integer('id').primaryKey(),
  funnelId: integer('funnel_id').notNull(),
  candidateId: integer('candidate_id').notNull(),
  previousCompany: text('previous_company').notNull(),
  contactPerson: text('contact_person').notNull(),
  contactPhone: text('contact_phone'),
  contactPosition: text('contact_position'),
  result: text('result'),
  wouldRehire: boolean('would_rehire'),
  notes: text('notes'),
  rating: integer('rating'),
  checkedById: integer('checked_by_id'),
  checkedAt: ts('checked_at'),
  createdAt: ts('created_at').defaultNow(),
});

export const hrToolTestResults = pgTable('hr_tool_test_results', {
  id: integer('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  vacancyId: integer('vacancy_id'),
  funnelId: integer('funnel_id'),
  pointA: integer('point_a'),
  pointB: integer('point_b'),
  pointC: integer('point_c'),
  pointD: integer('point_d'),
  pointE: integer('point_e'),
  pointF: integer('point_f'),
  pointG: integer('point_g'),
  pointH: integer('point_h'),
  pointI: integer('point_i'),
  pointJ: integer('point_j'),
  compulsivePoints: text('compulsive_points').array(),
  totalScore: integer('total_score'),
  categoryResult: text('category_result').default('UNKNOWN'),
  positionMatchScore: integer('position_match_score'),
  positionMatchNotes: text('position_match_notes'),
  testedById: integer('tested_by_id'),
  testDate: ts('test_date').notNull().defaultNow(),
  isValid: boolean('is_valid').notNull().default(true),
  invalidReason: text('invalid_reason'),
  createdAt: ts('created_at').defaultNow(),
});

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

export const hrJobDescriptions = pgTable('hr_job_descriptions', {
  id: integer('id').primaryKey(),
  positionId: integer('position_id'),
  version: integer('version').notNull().default(1),
  title: text('title').notNull(),
  content: text('content'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  isCurrentVersion: boolean('is_current_version').default(false),
  createdById: integer('created_by_id'),
});

export const hrJobOffers = pgTable('hr_job_offers', {
  id: integer('id').primaryKey(),
  vacancyId: integer('vacancy_id'),
  candidateId: integer('candidate_id').notNull(),
  funnelId: integer('funnel_id'),
  position: text('position').notNull(),
  department: text('department'),
  startDate: ts('start_date'),
  probationMonths: integer('probation_months').default(3),
  salaryProbation: integer('salary_probation'),
  salaryAfter: integer('salary_after'),
  workSchedule: text('work_schedule'),
  additionalBenefits: text('additional_benefits'),
  status: text('status').notNull().default('DRAFT'),
  offerExpiresAt: ts('offer_expires_at'),
  sentAt: ts('sent_at'),
  respondedAt: ts('responded_at'),
  declineReason: text('decline_reason'),
  createdById: integer('created_by_id'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

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


