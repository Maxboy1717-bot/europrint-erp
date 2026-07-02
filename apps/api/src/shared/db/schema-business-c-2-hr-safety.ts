/**
 * @module schema-business-c-2-hr-safety
 * @description HR safety, brand settings, leave, shift, document/workflow,
 *   adaptation. Split out of schema-business-c-2 to respect the 300-line budget.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

// hr_brand_settings: NOT in lib/db barrel — kept as local stub.
export const hr_brand_settings = pgTable('hr_brand_settings', {
  id:         serial('id').primaryKey(),
  company_id: text('company_id').unique().notNull(),
  brand_data: jsonb('brand_data'),
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
export const adaptation_programs = pgTable('adaptation_programs', {
  id:           serial('id').primaryKey(),
  program_name: text('program_name').notNull(),
  description:  text('description'),
  duration_days: integer('duration_days'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

// adaptation_records: used with snake_case columns in hr-compat-safety.repository.ts
// Canonical adaptationRecords uses camelCase — kept as local stub.
export const adaptation_records = pgTable('adaptation_records', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  program_id:  integer('program_id'),
  status:      text('status').default('active'),
  started_at:  timestamp('started_at').defaultNow(),
  completed_at: timestamp('completed_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

// adaptation_milestones: only in adaptation.ts which is NOT in barrel — kept as local stub.
export const adaptation_milestones = pgTable('adaptation_milestones', {
  id:               serial('id').primaryKey(),
  record_id:        integer('record_id'),
  milestone_number: integer('milestone_number'),
  milestone_title:  text('milestone_title'),
  description:      text('description'),
  due_date:         date('due_date'),
  status:           text('status').default('pending'),
  created_at:       timestamp('created_at').defaultNow(),
});
