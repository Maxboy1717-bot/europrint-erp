/**
 * @module schema-business-c-2-hr-safety
 * @description HR safety, brand settings, leave, shift, document/workflow,
 *   adaptation. Split out of schema-business-c-2 to respect the 300-line budget.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

// hr_brand_settings: NOT in lib/db barrel — kept as local stub.
// SINGLE-TENANT SINGLETON (fixed 2026-07-13): `company_id` used to be
// declared `.unique().notNull()` here, implying a real multi-tenant scoping
// column. It never was one — EuroPrint is a single print-shop, single-company
// ERP with no `companies`/`tenants` table anywhere in the schema, and the
// live DB never actually had a unique constraint on this column (schema
// drift: `.unique()` was aspirational, not applied). Every writer hardcoded
// company_id='default' and every reader filtered on the same literal, so it
// was a no-op scoping key — but repositories still called
// `onConflictDoUpdate({ target: company_id })`, which requires a REAL unique
// constraint to exist; since none did, every save threw "no unique or
// exclusion constraint matching ON CONFLICT specification" (confirmed live
// via psql). Fix: stop treating company_id as a scoping/conflict key — there
// is at most one row, fetched/updated by `id` (see
// hr-compat-safety.repository.ts + queries-remaining-b.ts). company_id stays
// as a legacy nullable column (DB default 'default'::text) so old rows and
// any stray reference to it don't break; it is no longer read for filtering.
export const hr_brand_settings = pgTable('hr_brand_settings', {
  id:         serial('id').primaryKey(),
  company_id: text('company_id').default('default'),
  brand_data: jsonb('brand_data'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// safety_incidents: used with snake_case columns in hr-dashboard-extra.repository.ts
// Canonical safetyIncidents uses camelCase — kept as local stub.
export const safety_incidents = pgTable('safety_incidents', {
  id:                   serial('id').primaryKey(),
  incident_type:        text('incident_type'),
  severity:             text('severity').default('low'),
  description:          text('description'),
  location_description: text('location_description'),
  department_id:        integer('department_id'),
  incident_date:        date('incident_date'),
  investigation_status: text('investigation_status').default('open'),
  status:               text('status').default('reported'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

// safety_training_records: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical safetyTrainingRecords uses camelCase — kept as local stub.
export const safety_training_records = pgTable('safety_training_records', {
  id:              serial('id').primaryKey(),
  training_id:     integer('training_id'),
  employee_id:     integer('employee_id'),
  completed_date:  date('completed_date'),
  expiry_date:     date('expiry_date'),
  score:           numeric('score', { precision: 5, scale: 2 }),
  is_passed:       boolean('is_passed').default(false),
  certificate_url: text('certificate_url'),
  // HR Nazorat fix (2026-07-13): HRSafetyDialogs.tsx TrainingDialog falls back to a
  // free-text training name when no LMS course exists yet (training_id stays NULL) —
  // this column was missing so the free-text name was silently dropped on submit
  // (Q-40/Q-43 fake-save). See hr-compat-safety.controller.ts createSafetyTraining.
  training_name:   text('training_name'),
  created_at:      timestamp('created_at').defaultNow(),
});

// hazard_zones: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical hazardZones uses camelCase — kept as local stub.
export const hazard_zones = pgTable('hazard_zones', {
  id:                    serial('id').primaryKey(),
  zone_name:             text('zone_name').notNull(),
  zone_code:             text('zone_code'),
  department_id:         integer('department_id'),
  hazard_level:          text('hazard_level').default('low'),
  required_ppe:          text('required_ppe'),
  max_occupancy:         integer('max_occupancy'),
  is_active:             boolean('is_active').default(true),
  last_inspection_date:  date('last_inspection_date'),
  next_inspection_date:  date('next_inspection_date'),
  // HR Nazorat fix (2026-07-13): HRSafetyDialogs.tsx ZoneDialog collects `location`
  // (required) and `hazardType` (required, distinct from hazard_level's low/medium/high/
  // critical severity — this is a free-text hazard category e.g. "electrical"/"chemical")
  // and `description` (optional) — none had a column, so createHazardZone() silently
  // dropped them on submit (Q-40/Q-43 fake-save). See hr-compat-safety.controller.ts
  // createHazardZone.
  location:              text('location'),
  hazard_type:           text('hazard_type'),
  description:           text('description'),
  created_at:            timestamp('created_at').defaultNow(),
});

// ppe_compliance: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical ppeCompliance uses camelCase — kept as local stub.
export const ppe_compliance = pgTable('ppe_compliance', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  ppe_type:    text('ppe_type'),
  issue_date:  date('issue_date'),
  expiry_date: date('expiry_date'),
  is_compliant: boolean('is_compliant').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// hr_leave_requests: NOT in lib/db barrel (canonical is leave_requests, different table name) — kept as local stub.
export const hr_leave_requests = pgTable('hr_leave_requests', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id'),
  start_date:   date('start_date'),
  end_date:     date('end_date'),
  reason:       text('reason'),
  status:       text('status').default('pending'),
  requested_at: timestamp('requested_at').defaultNow(),
  reviewed_at:  timestamp('reviewed_at'),
  notes:        text('notes'),
});

// shift_schedules compat stub REMOVED (2026-07-02): its only consumer,
// hr-employees-ext.repository.ts, now proxies to the canonical
// ShiftRepository (modules/hr/shift/shift.repository.ts, table =
// lib/db hr-v2-schema.ts `shiftSchedules`) instead of duplicating the query
// against a second Drizzle object for the same physical table.

// document_templates: NOT in lib/db barrel (cc_document_templates is a different table) — kept as local stub.
export const document_templates = pgTable('document_templates', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  description: text('description'),
  steps:       jsonb('steps'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// workflow_route_configs: used with snake_case columns in document-workflow.repository.ts
// Canonical documentWorkflowRoutes uses camelCase — kept as local stub.
export const workflow_route_configs = pgTable('workflow_route_configs', {
  id:            serial('id').primaryKey(),
  document_type: text('document_type').notNull(),
  steps:         jsonb('steps'),
  is_active:     boolean('is_active').default(true),
  created_at:    timestamp('created_at').defaultNow(),
});

// adaptation_programs: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical adaptationPrograms uses camelCase — kept as local stub.
// 3.14: title/title_ru/duration/duration_type/tasks/mentor_required added — live columns
// already exist (NOT NULL on title/title_ru/duration/duration_type/tasks; see
// migrations/onboarding-adaptation-merge.sql context), this is additive column mapping only.
export const adaptation_programs = pgTable('adaptation_programs', {
  id:            serial('id').primaryKey(),
  title:         text('title'),
  title_ru:      text('title_ru'),
  program_name:  text('program_name'),
  description:   text('description'),
  position_id:   integer('position_id'),
  department_id: integer('department_id'),
  duration:      integer('duration'),
  duration_type: text('duration_type'),
  duration_days: integer('duration_days'),
  tasks:         jsonb('tasks'),
  mentor_required: boolean('mentor_required').default(true),
  status:        text('status').default('active'),
  is_active:     boolean('is_active').default(true),
  created_by:    integer('created_by'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
  deleted_at:    timestamp('deleted_at'),
});

// adaptation_records: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical adaptationRecords uses camelCase — kept as local stub.
// 3.14: mentor/professional_master/progress columns added (additive, columns already live).
export const adaptation_records = pgTable('adaptation_records', {
  id:                       serial('id').primaryKey(),
  employee_id:              integer('employee_id'),
  user_id:                  integer('user_id'),
  program_id:               integer('program_id'),
  mentor_id:                integer('mentor_id'),
  professional_master_id:   integer('professional_master_id'),
  start_date:               text('start_date'),
  end_date:                 text('end_date'),
  status:                   text('status').default('active'),
  progress:                 integer('progress').default(0),
  progress_percent:         integer('progress_percent').default(0),
  current_milestone:        integer('current_milestone').default(1),
  total_milestones:         integer('total_milestones'),
  tasks_completed:          integer('tasks_completed').default(0),
  current_phase:            text('current_phase'),
  mentor_feedback:          text('mentor_feedback'),
  employee_feedback:        text('employee_feedback'),
  hr_notes:                 text('hr_notes'),
  notes:                    text('notes'),
  completed_date:           date('completed_date'),
  is_extended:              boolean('is_extended').default(false),
  extension_reason:         text('extension_reason'),
  created_by:               integer('created_by'),
  started_at:               timestamp('started_at').defaultNow(),
  completed_at:             timestamp('completed_at'),
  created_at:               timestamp('created_at').defaultNow(),
  updated_at:               timestamp('updated_at').defaultNow(),
  deleted_at:               timestamp('deleted_at'),
});

// adaptation_milestones: only in adaptation.ts which is NOT in barrel — kept as local stub.
// 3.14: completed_date/verified_by/notes added (additive, columns already live).
export const adaptation_milestones = pgTable('adaptation_milestones', {
  id:               serial('id').primaryKey(),
  record_id:        integer('record_id'),
  milestone_number: integer('milestone_number'),
  milestone_title:  text('milestone_title'),
  description:      text('description'),
  due_date:         date('due_date'),
  status:           text('status').default('pending'),
  completed_date:   date('completed_date'),
  verified_by:      integer('verified_by'),
  notes:            text('notes'),
  created_at:       timestamp('created_at').defaultNow(),
});
