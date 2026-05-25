/**
 * @module hr-goals
 * @description Drizzle ORM schema for HR goals, late arrivals, health alerts, user blocks, 1-on-1s, onboarding.
 * Promoted from schema-db-only-generated.ts — tables exist in DB, now have proper Drizzle definitions.
 */

import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp, date, numeric, jsonb, smallint, index,
} from 'drizzle-orm/pg-core';

// ── AI Attendance ─────────────────────────────────────────────────────────────
export const hrAiAttendance = pgTable('hr_ai_attendance', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          integer('user_id').notNull(),
  eventType:       varchar('event_type', { length: 20 }).notNull(),
  cameraId:        varchar('camera_id', { length: 80 }),
  location:        varchar('location', { length: 200 }),
  capturedAt:      timestamp('captured_at').notNull(),
  faceConfidence:  numeric('face_confidence', { precision: 5, scale: 2 }),
  snapshotUrl:     varchar('snapshot_url', { length: 500 }),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('hr_ai_attendance_user_idx').on(t.userId)]);

// ── Employee Goals ────────────────────────────────────────────────────────────
export const hrEmployeeGoals = pgTable('hr_employee_goals', {
  id:          integer('id').primaryKey(),
  employeeId:  integer('employee_id').notNull(),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetDate:  date('target_date'),
  targetValue: numeric('target_value', { precision: 10, scale: 2 }),
  currentValue: numeric('current_value', { precision: 10, scale: 2 }),
  progressPct: numeric('progress_pct', { precision: 5, scale: 2 }),
  status:      varchar('status', { length: 50 }).default('active'),
  createdBy:   integer('created_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('hr_employee_goals_emp_idx').on(t.employeeId)]);

// ── Late Arrivals ─────────────────────────────────────────────────────────────
export const hrLateArrivals = pgTable('hr_late_arrivals', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           integer('user_id').notNull(),
  arrivalAt:        timestamp('arrival_at').notNull(),
  expectedAt:       timestamp('expected_at').notNull(),
  minutesLate:      integer('minutes_late').notNull(),
  reason:           text('reason'),
  fineAmount:       numeric('fine_amount', { precision: 12, scale: 2 }),
  fineApproved:     boolean('fine_approved').notNull().default(false),
  approvedByUserId: integer('approved_by_user_id'),
  approvedAt:       timestamp('approved_at'),
  ccDocumentId:     uuid('cc_document_id'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('hr_late_arrivals_user_idx').on(t.userId)]);

// ── Health Alerts ─────────────────────────────────────────────────────────────
export const hrHealthAlerts = pgTable('hr_health_alerts', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             integer('user_id').notNull(),
  alertType:          varchar('alert_type', { length: 40 }).notNull(),
  severity:           varchar('severity', { length: 10 }).notNull(),
  aiConfidence:       numeric('ai_confidence', { precision: 5, scale: 2 }),
  details:            jsonb('details'),
  snapshotUrl:        varchar('snapshot_url', { length: 500 }),
  capturedAt:         timestamp('captured_at').notNull(),
  reviewedByUserId:   integer('reviewed_by_user_id'),
  reviewedAt:         timestamp('reviewed_at'),
  actionTaken:        text('action_taken'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('hr_health_alerts_user_idx').on(t.userId)]);

// ── User Blocks ───────────────────────────────────────────────────────────────
export const hrUserBlocks = pgTable('hr_user_blocks', {
  userId:              integer('user_id').notNull(),
  blockedAt:           timestamp('blocked_at').notNull(),
  reason:              varchar('reason', { length: 200 }).notNull(),
  blockedByUserId:     integer('blocked_by_user_id'),
  unblockedAt:         timestamp('unblocked_at'),
  unblockedByUserId:   integer('unblocked_by_user_id'),
  unblockDalolatnoma:  text('unblock_dalolatnoma'),
  isActive:            boolean('is_active').notNull().default(true),
});

// ── Employee 1-on-1 Meetings ──────────────────────────────────────────────────
export const hrEmployeeOneOnOnes = pgTable('hr_employee_one_on_ones', {
  id:          integer('id').primaryKey(),
  employeeId:  integer('employee_id').notNull(),
  managerId:   integer('manager_id'),
  meetingDate: timestamp('meeting_date', { withTimezone: true }).notNull(),
  topics:      text('topics'),
  actionItems: text('action_items'),
  mood:        smallint('mood'),
  notes:       text('notes'),
  createdBy:   integer('created_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('hr_one_on_ones_emp_idx').on(t.employeeId)]);

// ── Onboarding Processes ──────────────────────────────────────────────────────
export const hrOnboardingProcesses = pgTable('hr_onboarding_processes', {
  id:                   integer('id').primaryKey(),
  employeeId:           integer('employee_id'),
  planId:               integer('plan_id'),
  adaptationProgramId:  integer('adaptation_program_id'),
  mentorId:             integer('mentor_id'),
  status:               varchar('status', { length: 30 }).default('active'),
  startDate:            date('start_date').notNull(),
  expectedEndDate:      date('expected_end_date'),
  actualEndDate:        date('actual_end_date'),
  currentMilestone:     varchar('current_milestone', { length: 20 }),
  progressPercent:      integer('progress_percent').default(0),
  weeklyEvaluations:    jsonb('weekly_evaluations'),
  checklist:            jsonb('checklist'),
  notes:                text('notes'),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Onboarding Milestones ─────────────────────────────────────────────────────
export const hrOnboardingMilestones = pgTable('hr_onboarding_milestones', {
  id:                 integer('id').primaryKey(),
  processId:          integer('process_id'),
  milestoneType:      varchar('milestone_type', { length: 20 }).notNull(),
  targetDate:         date('target_date').notNull(),
  actualDate:         date('actual_date'),
  evaluationScores:   jsonb('evaluation_scores'),
  evaluationAverage:  numeric('evaluation_average', { precision: 3, scale: 2 }),
  evaluatorId:        integer('evaluator_id'),
  status:             varchar('status', { length: 20 }).default('pending'),
  feedback:           text('feedback'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Employee Balances ─────────────────────────────────────────────────────────
export const employeeBalances = pgTable('employee_balances', {
  id:               integer('id').primaryKey(),
  userId:           integer('user_id').notNull(),
  materialId:       integer('material_id').notNull(),
  issuedQuantity:   numeric('issued_quantity', { precision: 15, scale: 4 }).notNull(),
  returnedQuantity: numeric('returned_quantity', { precision: 15, scale: 4 }).notNull(),
  currentBalance:   numeric('current_balance', { precision: 15, scale: 4 }),
  totalValue:       numeric('total_value', { precision: 15, scale: 2 }).notNull(),
  status:           varchar('status', { length: 20 }).notNull(),
  lastMovementAt:   timestamp('last_movement_at'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
});

// ── Employee Monthly Cards ────────────────────────────────────────────────────
export const employeeMonthlyCards = pgTable('employee_monthly_cards', {
  id:            integer('id').primaryKey(),
  employeeId:    integer('employee_id').notNull(),
  periodYear:    integer('period_year').notNull(),
  periodMonth:   integer('period_month').notNull(),
  daysPresent:   integer('days_present').notNull().default(0),
  daysLate:      integer('days_late').notNull().default(0),
  daysAbsent:    integer('days_absent').notNull().default(0),
  bonusUzs:      numeric('bonus_uzs', { precision: 14, scale: 2 }).notNull().default('0'),
  fineUzs:       numeric('fine_uzs', { precision: 14, scale: 2 }).notNull().default('0'),
  kpiScore:      numeric('kpi_score', { precision: 5, scale: 2 }),
  abcCategory:   varchar('abc_category', { length: 10 }),
  posBalance:    numeric('pos_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  netSalaryUzs:  numeric('net_salary_uzs', { precision: 14, scale: 2 }).notNull().default('0'),
  summaryText:   text('summary_text'),
  generatedAt:   timestamp('generated_at').notNull().defaultNow(),
}, (t) => [index('emp_monthly_cards_period_idx').on(t.employeeId, t.periodYear, t.periodMonth)]);
