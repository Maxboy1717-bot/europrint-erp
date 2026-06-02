/**
 * @module schema-business-c-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

// ─── LMS Extended ─────────────────────────────────────────────────────────────
// lms_tests / lms_questions: NOT in lib/db barrel — kept as local stubs.

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
// hr_interview_sessions: used with snake_case column access in ai-interview.cron.ts — kept as local stub.

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
// employee_badges / gamification_points / gamification_totals: used with snake_case
// column access in gamification.repository.ts — kept as local stubs.

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
// position_folders: NOT in lib/db barrel — kept as local stub.

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

// ─── Org-node Portret (lavozim kartochkasi) ──────────────────────────────────
// org_node_portret: position "portret" wizard payload (Blok A–E + III/IV + TOOL
// TEST). One row per org node (UNIQUE node_id → upsert). portret_data JSONB holds
// the FE shape { portret, tool_test_requirements }. NOT in lib/db barrel — local stub.

export const org_node_portret = pgTable('org_node_portret', {
  id:           serial('id').primaryKey(),
  node_id:      integer('node_id').notNull(),
  portret_data: jsonb('portret_data').notNull().default({}),
  creator_id:   integer('creator_id'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// node_hr_requests: HR requests raised from a position portret ("HR ga so'rov").
// request_type/priority/status + optional link to org_node_portret. NOT in lib/db
// barrel — local stub.

export const node_hr_requests = pgTable('node_hr_requests', {
  id:           serial('id').primaryKey(),
  node_id:      integer('node_id').notNull(),
  portret_id:   integer('portret_id'),
  request_type: varchar('request_type', { length: 40 }).notNull().default('new_hire'),
  priority:     varchar('priority', { length: 20 }).notNull().default('normal'),
  status:       varchar('status', { length: 20 }).notNull().default('new'),
  comment:      text('comment'),
  node_name:    text('node_name'),
  requester_id: integer('requester_id'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Papka orders ─────────────────────────────────────────────────────────────
// papka_orders: used as messaging table (from_user_id/to_user_ids/subject/body/files).
// Canonical papkaOrders in lib/db is the production order master (different schema) — kept as local stub.

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
// [dedup] qc_root_causes: no Drizzle column access anywhere (only in raw SQL migrations).
// → re-exported from canonical qcRootCauses in @workspace/db (qc-schema → index).
export { qcRootCauses as qc_root_causes } from '@workspace/db';

// ─── HR: AI Interview v2 ──────────────────────────────────────────────────────
// ai_report_categories / ai_report_definitions: only referenced in raw SQL migrations — kept as local stubs
// because canonical uses camelCase and queries-sd.ts accesses ai_report_subscriptions.user_id (snake_case).
// Note: ai_report_subscriptions.user_id used in queries-sd.ts — kept as local stub.

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
// asset_items: queries-hr-assets.ts accesses it via asset_items_ext alias with snake_case columns
// (serial_number, purchase_date, department_id etc.) — kept as local stub to avoid breakage.

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
// questionnaire_questions: used in queries-questionnaire.ts with .id column access.
// Both stub and canonical share .id — but to keep safe, re-export from canonical
// (queries-questionnaire.ts only uses .id which exists in both).
// [2026-05-22 dedup] re-exported from canonical definition in @workspace/db/schema/recruitment.
export { questionnaireQuestions as questionnaire_questions } from '@workspace/db/schema/recruitment';

// ─── MES ─────────────────────────────────────────────────────────────────────
// mes_downtime_reasons: NOT in lib/db barrel — kept as local stub.

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
// purchase_invoices: used with snake_case columns (vendor_id, payment_status, due_date etc.)
// in finance-ap.repository.ts and queries-mm-goods.ts — kept as local stub.

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
