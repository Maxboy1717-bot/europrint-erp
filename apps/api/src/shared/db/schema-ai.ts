/**
 * @module schema-ai
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { stub } from './schema-compat-helpers';

export const aiExamAttempts = stub(pgTable('lms_exam_attempts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  employeeId:   text('employee_id').notNull(),
  status:       text('status').notNull().default('assigned'),
  questions:    jsonb('questions').default([]),
  answers:      jsonb('answers'),
  score:        integer('score'),
  evaluation:   jsonb('evaluation'),
  gptAnalysis:  text('gpt_analysis'),
  submittedAt:  timestamp('submitted_at', { withTimezone: true }),
  analyzedAt:   timestamp('analyzed_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('ai_exam_attempts_employee_idx').on(t.employeeId)]));

export const aiInsights = stub(pgTable('ai_insights', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      integer('user_id'),
  module:      text('module').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  insightType: text('insight_type').notNull().default('ai_generated'),
  priority:    text('priority').notNull().default('medium'),
  isRead:      boolean('is_read').notNull().default(false),
  readAt:      timestamp('read_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('ai_insights_user_idx').on(t.userId)]));

export const aiPlanningPlans = stub(pgTable('ai_planning_plans', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  planNumber:            text('plan_number').notNull(),
  planDate:              text('plan_date').notNull(),
  planType:              text('plan_type').notNull().default('daily'),
  status:                text('status').notNull().default('draft'),
  confidenceScore:       integer('confidence_score').notNull().default(87),
  autoApproved:          boolean('auto_approved').notNull().default(false),
  autoApprovalThreshold: integer('auto_approval_threshold'),
  totalOrders:           integer('total_orders'),
  totalMachineHours:     integer('total_machine_hours'),
  estimatedCompletion:   timestamp('estimated_completion', { withTimezone: true }),
  planData:              jsonb('plan_data').default([]),
  optimizationMetrics:   jsonb('optimization_metrics').default({}),
  aiRecommendations:     jsonb('ai_recommendations').default([]),
  createdAt:             timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('ai_planning_plans_status_idx').on(t.status)]));

export const aiPlanningConfig = stub(pgTable('ai_planning_config', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  autoApprovalThreshold:    integer('auto_approval_threshold').notNull().default(90),
  maxShiftHours:            integer('max_shift_hours').notNull().default(8),
  batchGroupingEnabled:     boolean('batch_grouping_enabled').notNull().default(true),
  energyOptimizationWeight: integer('energy_optimization_weight').notNull().default(30),
  changeoverMinutes:        integer('changeover_minutes').notNull().default(15),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const aiReservationRequests = stub(pgTable('ai_reservation_requests', {
  id:           uuid('id').primaryKey().defaultRandom(),
  materialType: text('material_type').notNull(),
  quantity:     integer('quantity').notNull(),
  unit:         text('unit').notNull().default('dona'),
  neededBy:     text('needed_by'),
  priority:     text('priority').notNull().default('medium'),
  status:       text('status').notNull().default('pending'),
  notes:        text('notes'),
  optimization: jsonb('optimization'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('ai_reservation_requests_status_idx').on(t.status)]));

export const aiReservationBatches = stub(pgTable('ai_reservation_batches', {
  id:           uuid('id').primaryKey().defaultRandom(),
  materialType: text('material_type').notNull(),
  items:        jsonb('items').default([]),
  scheduledAt:  timestamp('scheduled_at', { withTimezone: true }),
  status:       text('status').notNull().default('scheduled'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const aiHrInterviews = stub(pgTable('ai_hr_interviews', {
  id:            uuid('id').primaryKey().defaultRandom(),
  candidateId:   text('candidate_id').notNull(),
  positionTitle: text('position_title').notNull(),
  interviewType: text('interview_type').notNull().default('screening'),
  status:        text('status').notNull().default('scheduled'),
  scheduledAt:   text('scheduled_at'),
  notes:         text('notes'),
  createdBy:     text('created_by'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('ai_hr_interviews_status_idx').on(t.status)]));
