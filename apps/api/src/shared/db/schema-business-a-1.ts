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
  pgTable, serial, text, integer, boolean, timestamp, jsonb, date,
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

// ─── Notifications ────────────────────────────────────────────────────────────
// notifications → lib/db (core/core-users.ts), re-exported under legacy alias
export { notifications as notificationsApp } from '@workspace/db';
