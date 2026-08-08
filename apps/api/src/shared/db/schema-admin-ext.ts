/**
 * @module schema-admin-ext
 * @description Source module. See exports for details.
 */

import { pgTable, serial, uuid, varchar, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { auditLogs } from './schema-rbac';

// ============================================================================
// Admin — Audit log (full schema, as used by admin-extra repository)
//
// Re-exported from schema-rbac.ts (canonical definition). The legacy name
// `audit_logs_ext` is preserved as an alias for backwards compatibility with
// the admin-extra repository which imports it via that alias.
// ============================================================================

export const audit_logs_ext = auditLogs;

export const system_alerts = pgTable('system_alerts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message'),
  level: varchar('level', { length: 20 }).notNull().default('info'),
  sourceType: varchar('source_type', { length: 50 }),
  sourceId: text('source_id'),
  isRead: boolean('is_read').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Item #119: `id` was declared uuid — live column is `integer` (serial, nextval sequence).
// title/content/category/isActive were declared notNull — live columns are all nullable
// (drift-fix-04a-missing-cols.sql added the compat-shim's generic fields onto what was
// originally a file/position-based table; file_path/version/orgFunctionId are the
// original model, now wired up alongside the compat fields — Q-46, not a new table).
export const guidelines = pgTable('guidelines', {
  id:            serial('id').primaryKey(),
  title:         text('title'),
  content:       text('content'),
  category:      text('category'),
  isActive:      boolean('is_active'),
  createdBy:     text('created_by'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow(),
  filePath:      text('file_path').notNull(),
  version:       varchar('version', { length: 20 }).notNull().default('1.0'),
  orgFunctionId: integer('org_function_id'),
  deletedAt:     timestamp('deleted_at'),
  deletedBy:     integer('deleted_by'),
}, (t) => [index('guidelines_category_idx').on(t.category)]);

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { contactSettings } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { systemSettings } from '@workspace/db';

export const adminFilters = pgTable('admin_filters', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  filterType:  text('filter_type').notNull().default('general'),
  config:      jsonb('config').default({}),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const calendarEvents = pgTable('calendar_events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  description: text('description'),
  startDate:   timestamp('start_date', { withTimezone: true }).notNull(),
  endDate:     timestamp('end_date', { withTimezone: true }),
  allDay:      boolean('all_day').notNull().default(false),
  eventType:   text('event_type').notNull().default('general'),
  location:    text('location'),
  attendees:   jsonb('attendees').default([]),
  createdBy:   text('created_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('calendar_events_start_idx').on(t.startDate)]);

// assetItems: canonical definition in lib/db (admin-assets.ts) — identical columns.
export { assetItems } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { assetMaintenance, assetDisposals, assetTransfers } from '@workspace/db';

export const saasTenants = pgTable('saas_tenants', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  domain:      text('domain'),
  plan:        text('plan').notNull().default('basic'),
  status:      text('status').notNull().default('active'),
  employeeLimit: integer('employee_limit').notNull().default(50),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
