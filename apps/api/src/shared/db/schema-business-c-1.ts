/**
 * @module schema-business-c-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

// ─── LMS Extended ─────────────────────────────────────────────────────────────

export const lms_tests = pgTable('lms_tests', {
  id:          serial('id').primaryKey(),
  course_id:   integer('course_id'),
  title:       text('title'),
  description: text('description'),
  pass_score:  integer('pass_score').default(70),
  time_limit:  integer('time_limit'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const lms_questions = pgTable('lms_questions', {
  id:          serial('id').primaryKey(),
  test_id:     integer('test_id').notNull(),
  text:        text('text'),
  type:        text('type').default('multiple_choice'),
  options:     jsonb('options'),
  correct_ans: jsonb('correct_ans'),
  points:      integer('points').default(1),
  order_index: integer('order_index').default(0),
});

// ─── AI Interview ─────────────────────────────────────────────────────────────

export const hr_interview_sessions = pgTable('hr_interview_sessions', {
  id:                           serial('id').primaryKey(),
  candidate_id:                 integer('candidate_id'),
  vacancy_id:                   integer('vacancy_id'),
  interviewer_id:               integer('interviewer_id'),
  session_type:                 text('session_type'),
  status:                       text('status').default('scheduled'),
  scheduled_at:                 timestamp('scheduled_at'),
  started_at:                   timestamp('started_at'),
  completed_at:                 timestamp('completed_at'),
  score:                        integer('score'),
  overall_score:                integer('overall_score'),
  communication_score:          integer('communication_score'),
  confidence_score:             integer('confidence_score'),
  problem_solving_score:        integer('problem_solving_score'),
  body_language_score:          integer('body_language_score'),
  emotional_state_score:        integer('emotional_state_score'),
  professional_appearance_score: integer('professional_appearance_score'),
  recommendation:               text('recommendation'),
  ai_summary:                   text('ai_summary'),
  notes:                        text('notes'),
  transcript:                   jsonb('transcript'),
  token:                        text('token'),
  expires_at:                   timestamp('expires_at'),
  candidate_name:               text('candidate_name'),
  candidate_language:           text('candidate_language'),
  camera_rejections:            integer('camera_rejections').default(0),
  created_by:                   integer('created_by'),
  created_at:                   timestamp('created_at').defaultNow(),
});

// ─── Gamification ─────────────────────────────────────────────────────────────

export const employee_badges = pgTable('employee_badges', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  badge_id:    integer('badge_id'),
  badge_code:  text('badge_code'),
  awarded_by:  integer('awarded_by'),
  reason:      text('reason'),
  awarded_at:  timestamp('awarded_at').defaultNow(),
});

export const gamification_points = pgTable('gamification_points', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id').notNull(),
  points:       integer('points').default(0),
  event_type:   text('event_type'),
  description:  text('description'),
  reference_id: integer('reference_id'),
  reason:       text('reason'),
  given_by:     integer('given_by'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const gamification_totals = pgTable('gamification_totals', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').unique().notNull(),
  total_points:     integer('total_points').default(0),
  monthly_points:   integer('monthly_points').default(0),
  quarterly_points: integer('quarterly_points').default(0),
  badge_count:      integer('badge_count').default(0),
  rank:             integer('rank'),
  updated_at:       timestamp('updated_at').defaultNow(),
});

// ─── Position Folders & Permissions ──────────────────────────────────────────

export const position_folders = pgTable('position_folders', {
  id:            serial('id').primaryKey(),
  position_id:   integer('position_id'),
  node_id:       integer('node_id'),
  item_type:     varchar('item_type', { length: 20 }),
  title:         varchar('title', { length: 255 }),
  url:           text('url'),
  folder_name:   text('folder_name'),
  description:   text('description'),
  lms_course_id: integer('lms_course_id'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

// ─── Papka orders ─────────────────────────────────────────────────────────────

export const papka_orders = pgTable('papka_orders', {
  id:           serial('id').primaryKey(),
  from_user_id: integer('from_user_id'),
  to_user_ids:  jsonb('to_user_ids'),
  subject:      text('subject'),
  body:         text('body'),
  files:        jsonb('files'),
  is_deleted:   boolean('is_deleted').default(false),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Analytics & QC ─────────────────────────────────────────────────────────

export const qc_root_causes = pgTable('qc_root_causes', {
  id:          serial('id').primaryKey(),
  code:        text('code').unique(),
  name:        text('name'),
  category:    text('category'),
  description: text('description'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: AI Interview v2 ──────────────────────────────────────────────────────

export const ai_report_categories = pgTable('ai_report_categories', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  slug:        text('slug'),
  description: text('description'),
  is_active:   boolean('is_active').default(true),
  order_index: integer('order_index').default(0),
  created_at:  timestamp('created_at').defaultNow(),
});

export const ai_report_definitions = pgTable('ai_report_definitions', {
  id:          serial('id').primaryKey(),
  category_id: integer('category_id'),
  name:        text('name').notNull(),
  slug:        text('slug'),
  description: text('description'),
  prompt_template: text('prompt_template'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

export const ai_report_subscriptions = pgTable('ai_report_subscriptions', {
  id:            serial('id').primaryKey(),
  user_id:       integer('user_id').notNull(),
  definition_id: integer('definition_id').notNull(),
  frequency:     text('frequency').default('weekly'),
  is_active:     boolean('is_active').default(true),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── Assets ──────────────────────────────────────────────────────────────────

export const asset_items = pgTable('asset_items', {
  id:              serial('id').primaryKey(),
  name:            text('name').notNull(),
  category:        text('category'),
  assigned_to:     integer('assigned_to'),
  department_id:   integer('department_id'),
  serial_number:   text('serial_number'),
  purchase_date:   date('purchase_date'),
  purchase_price:  numeric('purchase_price', { precision: 15, scale: 2 }),
  status:          text('status').default('in_use'),
  location:        text('location'),
  is_active:       boolean('is_active').default(true),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

// ─── Questionnaires ───────────────────────────────────────────────────────────

export const questionnaire_questions = pgTable('questionnaire_questions', {
  id:           serial('id').primaryKey(),
  template_id:  integer('template_id'),
  text:         text('text'),
  type:         text('type').default('text'),
  options:      jsonb('options'),
  order_index:  integer('order_index').default(0),
  is_required:  boolean('is_required').default(false),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── MES ─────────────────────────────────────────────────────────────────────

export const mes_downtime_reasons = pgTable('mes_downtime_reasons', {
  id:          serial('id').primaryKey(),
  code:        text('code').unique(),
  name:        text('name'),
  category:    text('category'),
  is_planned:  boolean('is_planned').default(false),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Purchase Invoices ────────────────────────────────────────────────────────

export const purchase_invoices = pgTable('purchase_invoices', {
  id:             serial('id').primaryKey(),
  vendor_id:      integer('vendor_id'),
  supplier_name:  text('supplier_name'),
  invoice_no:     text('invoice_no'),
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  paid_amount:    numeric('paid_amount', { precision: 15, scale: 2 }).default('0'),
  amount:         numeric('amount', { precision: 15, scale: 2 }),
  currency:       text('currency').default('UZS'),
  invoice_date:   date('invoice_date'),
  due_date:       date('due_date'),
  status:         text('status').default('pending'),
  payment_status: text('payment_status').default('unpaid'),
  notes:          text('notes'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── Sales Invoices ───────────────────────────────────────────────────────────
