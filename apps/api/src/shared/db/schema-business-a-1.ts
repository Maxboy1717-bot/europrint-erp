/**
 * @module schema-business-a-1
 * @description Source module. See exports for details.
 */

// ─── HR: Absence & Discipline ─────────────────────────────────────────────────
// absenceTracking, employeeBlocks, disciplineRecords, violationCatalog, badgeCatalog
// → all defined in lib/db (hr-v2-schema.ts / hr-personal-core.ts)
export { absenceTracking as absence_tracking }         from '@workspace/db';
export { employeeBlocks  as employee_blocks }          from '@workspace/db';
export { disciplineRecords as discipline_records }      from '@workspace/db';
export { violationCatalog  as violation_catalog }       from '@workspace/db';
export { badgeCatalog      as badge_catalog }           from '@workspace/db';

// ─── HR: eNPS Surveys ────────────────────────────────────────────────────────
// enpsSurveys → lib/db (hr-v2-schema.ts)
export { enpsSurveys as enps_surveys } from '@workspace/db';

// TODO: Move to lib/db/src/schema/
// enps_survey_responses — NOT yet in lib/db

import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, date, unique, numeric, varchar,
} from 'drizzle-orm/pg-core';

export const enps_survey_responses = pgTable('enps_survey_responses', {
  id:          serial('id').primaryKey(),
  survey_id:   integer('survey_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  score:       integer('score'),
  answers:     jsonb('answers'),
  submitted_at: timestamp('submitted_at').defaultNow(),
});

// ─── HR: Daily Reports ────────────────────────────────────────────────────────
// hrDailyReports, hrDailyReportAudit → lib/db (hr-v2-schema.ts)
export { hrDailyReports    as hr_daily_reports }       from '@workspace/db';
export { hrDailyReportAudit as hr_daily_report_audit } from '@workspace/db';

// ─── HR: Documents ────────────────────────────────────────────────────────────
// hrDocuments, documentApprovalSteps → lib/db (hr-v2-schema.ts)
export { hrDocuments          as hr_documents }           from '@workspace/db';
export { documentApprovalSteps as document_approval_steps } from '@workspace/db';

// ─── HR: PIP & Career ─────────────────────────────────────────────────────────
// pipPlans, pipProgressUpdates, careerPaths, careerPathSteps → lib/db (hr-v2-schema.ts)
export { pipPlans          as pip_plans }           from '@workspace/db';
export { pipProgressUpdates as pip_progress_updates } from '@workspace/db';
export { careerPaths       as career_paths }         from '@workspace/db';
export { careerPathSteps   as career_path_steps }    from '@workspace/db';

// ─── OTP & Auth ──────────────────────────────────────────────────────────────
// TODO: Move to lib/db/src/schema/
// otp_sessions — NOT yet in lib/db
// notification_preferences — NOT yet in lib/db

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

// Granular per-type × per-channel notification preferences (owner-decisions
// batch item 7, 2026-07-09). Complements the flat `notification_preferences`
// row above: one row per (user, notification_type, channel). The NotificationSettings
// page renders a matrix (10 types × {email, telegram, inApp}); this is where it persists.
export const notification_type_preferences = pgTable('notification_type_preferences', {
  id:                serial('id').primaryKey(),
  user_id:           integer('user_id').notNull(),
  notification_type: text('notification_type').notNull(),
  channel:           text('channel').notNull(),
  enabled:           boolean('enabled').notNull().default(true),
  updated_at:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uq_user_type_channel: unique('uq_ntp_user_type_channel').on(t.user_id, t.notification_type, t.channel),
}));

// ─── Notifications ────────────────────────────────────────────────────────────
// notifications → lib/db (core/core-users.ts), re-exported under legacy alias
export { notifications as notificationsApp } from '@workspace/db';

// ─── Alert thresholds (per-module configurable trigger values) ────────────────
// Schema-gap close (Q-35): NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md
// §1.3/§6 P0-4 confirmed live `alert_thresholds` did not exist (to_regclass NULL).
// business_settings-style CRUD-with-defaults convention: threshold numbers are
// NEVER hardcoded or asked of the owner in chat — this table ships with ONE
// sensible default row per known alert_type (see migration
// alert-thresholds-2026-08-03.sql), matching the `notification_routing_rules
// .event_type` vocabulary (notification-routing-rules-2026-07-01.sql). Owner
// tunes values later via CRUD; no consumer wiring included in this change.
export const alert_thresholds = pgTable('alert_thresholds', {
  id:              serial('id').primaryKey(),
  alert_type:      text('alert_type').notNull().unique(),
  threshold_value: numeric('threshold_value').notNull(),
  unit:            varchar('unit', { length: 20 }).notNull(),
  is_active:       boolean('is_active').notNull().default(true),
  description:     text('description'),
  created_at:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at:      timestamp('deleted_at', { withTimezone: true }),
});
