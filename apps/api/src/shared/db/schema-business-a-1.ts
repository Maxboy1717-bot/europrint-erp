/**
 * @module schema-business-a-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

// ─── HR: Absence & Discipline ───────────────────────────────────────────────

export const absence_tracking = pgTable('absence_tracking', {
  id:                   serial('id').primaryKey(),
  employee_id:          integer('employee_id').notNull(),
  absence_date:         date('absence_date').notNull(),
  consecutive_day_count: integer('consecutive_day_count').default(1),
  auto_blocked:         boolean('auto_blocked').default(false),
  is_excused:           boolean('is_excused').default(false),
  excuse_reason:        text('excuse_reason'),
  excuse_document_url:  text('excuse_document_url'),
  excused_by:           integer('excused_by'),
  excused_at:           timestamp('excused_at'),
  created_at:           timestamp('created_at').defaultNow(),
});

export const employee_blocks = pgTable('employee_blocks', {
  id:                 serial('id').primaryKey(),
  employee_id:        integer('employee_id').notNull(),
  reason:             text('reason'),
  blocked_by:         integer('blocked_by'),
  unblocked_by:       integer('unblocked_by'),
  is_active:          boolean('is_active').default(true),
  block_erp_access:   boolean('block_erp_access').default(true),
  block_payroll:      boolean('block_payroll').default(false),
  block_physical_access: boolean('block_physical_access').default(false),
  blocked_at:         timestamp('blocked_at').defaultNow(),
  unblocked_at:       timestamp('unblocked_at'),
  created_at:         timestamp('created_at').defaultNow(),
});

export const discipline_records = pgTable('discipline_records', {
  id:                           serial('id').primaryKey(),
  employee_id:                  integer('employee_id').notNull(),
  catalog_code:                 text('catalog_code'),
  violation_type:               text('violation_type'),
  discipline_type:              text('discipline_type'),
  violation_name:               text('violation_name'),
  description:                  text('description'),
  violation_date:               date('violation_date'),
  issued_date:                  date('issued_date'),
  severity:                     text('severity').default('low'),
  issued_by:                    integer('issued_by'),
  fine_amount:                  numeric('fine_amount', { precision: 12, scale: 2 }),
  fine_percent:                 numeric('fine_percent', { precision: 5, scale: 2 }),
  violation_count_this_category: integer('violation_count_this_category').default(1),
  is_first_warning:             boolean('is_first_warning').default(false),
  status:                       text('status').default('pending'),
  acknowledged_at:              timestamp('acknowledged_at'),
  approved_by:                  integer('approved_by'),
  approved_at:                  timestamp('approved_at'),
  is_expired:                   boolean('is_expired').default(false),
  is_soft_deleted:              boolean('is_soft_deleted').default(false),
  notes:                        text('notes'),
  deleted_at:                   timestamp('deleted_at'),
  created_at:                   timestamp('created_at').defaultNow(),
  updated_at:                   timestamp('updated_at').defaultNow(),
});

export const violation_catalog = pgTable('violation_catalog', {
  id:                   serial('id').primaryKey(),
  code:                 text('code').unique().notNull(),
  category:             text('category'),
  name:                 text('name'),
  name_ru:              text('name_ru'),
  severity:             text('severity'),
  default_fine_percent: numeric('default_fine_percent', { precision: 5, scale: 2 }),
  default_fine_amount:  numeric('default_fine_amount', { precision: 12, scale: 2 }),
  points_deducted:      integer('points_deducted').default(0),
  description:          text('description'),
  is_active:            boolean('is_active').default(true),
});

export const badge_catalog = pgTable('badge_catalog', {
  id:           serial('id').primaryKey(),
  code:         text('code').unique().notNull(),
  name:         text('name'),
  name_ru:      text('name_ru'),
  icon:         text('icon'),
  description:  text('description'),
  criteria:     text('criteria'),
  category:     text('category'),
  point_value:  integer('point_value').default(0),
  is_auto_award: boolean('is_auto_award').default(false),
  is_active:    boolean('is_active').default(true),
});

// ─── HR: eNPS Surveys ───────────────────────────────────────────────────────

export const enps_surveys = pgTable('enps_surveys', {
  id:          serial('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  questions:   jsonb('questions'),
  period:      text('period').default('quarterly'),
  status:      text('status').default('draft'),
  start_date:  date('start_date'),
  end_date:    date('end_date'),
  created_by:  integer('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const enps_survey_responses = pgTable('enps_survey_responses', {
  id:          serial('id').primaryKey(),
  survey_id:   integer('survey_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  score:       integer('score'),
  answers:     jsonb('answers'),
  submitted_at: timestamp('submitted_at').defaultNow(),
});

// ─── HR: Daily Reports ───────────────────────────────────────────────────────

export const hr_daily_reports = pgTable('hr_daily_reports', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id').notNull(),
  report_date:     date('report_date').notNull(),
  tasks_completed: text('tasks_completed'),
  metrics:         text('metrics'),
  tomorrow_plan:   text('tomorrow_plan'),
  status:          text('status').default('submitted'),
  is_auto_absent:  boolean('is_auto_absent').default(false),
  submitted_at:    timestamp('submitted_at'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const hr_daily_report_audit = pgTable('hr_daily_report_audit', {
  id:              serial('id').primaryKey(),
  report_id:       integer('report_id').notNull(),
  hr_user_id:      integer('hr_user_id').notNull(),
  previous_status: text('previous_status'),
  new_status:      text('new_status'),
  reason:          text('reason'),
  created_at:      timestamp('created_at').defaultNow(),
});

// ─── HR: Documents ───────────────────────────────────────────────────────────

export const hr_documents = pgTable('hr_documents', {
  id:            serial('id').primaryKey(),
  employee_id:   integer('employee_id'),
  document_type: text('document_type'),
  doc_type:      text('doc_type'),
  doc_number:    text('doc_number'),
  title:         text('title'),
  content:       jsonb('content'),
  pdf_url:       text('pdf_url'),
  status:        text('status').default('draft'),
  initiated_by:    integer('initiated_by'),
  metadata:        jsonb('metadata'),
  total_steps:     integer('total_steps').default(0),
  completed_steps: integer('completed_steps').default(0),
  acknowledged_at: timestamp('acknowledged_at'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

export const document_approval_steps = pgTable('document_approval_steps', {
  id:          serial('id').primaryKey(),
  document_id: integer('document_id').notNull(),
  step_number: integer('step_number').notNull(),
  approver_id: integer('approver_id'),
  status:      text('status').default('pending'),
  approved_at: timestamp('approved_at'),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: PIP & Career ────────────────────────────────────────────────────────

export const pip_plans = pgTable('pip_plans', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').notNull(),
  created_by:       integer('created_by'),
  supervisor_id:    integer('supervisor_id'),
  duration_days:    integer('duration_days'),
  start_date:       date('start_date'),
  end_date:         date('end_date'),
  goals:            text('goals'),
  success_criteria: text('success_criteria'),
  status:           text('status').default('active'),
  outcome:          text('outcome'),
  progress_percent: integer('progress_percent').default(0),
  acknowledged_at:  timestamp('acknowledged_at'),
  completed_at:     timestamp('completed_at'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

export const pip_progress_updates = pgTable('pip_progress_updates', {
  id:          serial('id').primaryKey(),
  pip_id:      integer('pip_id').notNull(),
  updated_by:  integer('updated_by'),
  notes:       text('notes'),
  status:      text('status'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const career_paths = pgTable('career_paths', {
  id:                  serial('id').primaryKey(),
  employee_id:         integer('employee_id').notNull(),
  current_position_id: integer('current_position_id'),
  target_position_id:  integer('target_position_id'),
  created_by:          integer('created_by'),
  estimated_months:    integer('estimated_months'),
  progress_percent:    integer('progress_percent').default(0),
  status:              text('status').default('active'),
  created_at:          timestamp('created_at').defaultNow(),
  updated_at:          timestamp('updated_at').defaultNow(),
});

export const career_path_steps = pgTable('career_path_steps', {
  id:              serial('id').primaryKey(),
  career_path_id:  integer('career_path_id').notNull(),
  step_order:      integer('step_order'),
  position_title:  text('position_title'),
  required_skills: text('required_skills'),
  required_months: integer('required_months'),
  is_completed:    boolean('is_completed').default(false),
  completed_at:    timestamp('completed_at'),
});

// ─── OTP & Auth ─────────────────────────────────────────────────────────────

export const otp_sessions = pgTable('otp_sessions', {
  id:           serial('id').primaryKey(),
  session_id:   text('session_id'),
  identifier:   text('identifier'),
  phone:        text('phone'),
  otp_code:     text('otp_code'),
  code:         text('code'),
  is_used:      boolean('is_used').default(false),
  used:         boolean('used').default(false),
  expires_at:   timestamp('expires_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

export const notification_preferences = pgTable('notification_preferences', {
  id:                  serial('id').primaryKey(),
  user_id:             integer('user_id').notNull(),
  channel:             text('channel').default('all'),
  enabled:             boolean('enabled').default(true),
  email_enabled:       boolean('email_enabled').default(true),
  telegram_enabled:    boolean('telegram_enabled').default(true),
  push_enabled:        boolean('push_enabled').default(true),
  order_updates:       boolean('order_updates').default(true),
  production_alerts:   boolean('production_alerts').default(true),
  hr_alerts:           boolean('hr_alerts').default(true),
  qc_alerts:           boolean('qc_alerts').default(true),
  finance_alerts:      boolean('finance_alerts').default(true),
  system_alerts:       boolean('system_alerts').default(true),
  quiet_hours:         jsonb('quiet_hours'),
  updated_at:          timestamp('updated_at').defaultNow(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApp = pgTable('notifications', {
  id:         serial('id').primaryKey(),
  user_id:    integer('user_id').notNull(),
  title:      text('title'),
  message:    text('message'),
  type:       text('type').default('info'),
  is_read:    boolean('is_read').default(false),
  entity_type: text('entity_type'),
  entity_id:  integer('entity_id'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Director: Strategic, OKR, Coordination ─────────────────────────────────
