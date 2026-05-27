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

export const guidelines = pgTable('guidelines', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  content:     text('content').notNull(),
  category:    text('category').notNull().default('general'),
  isActive:    boolean('is_active').notNull().default(true),
  createdBy:   text('created_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('guidelines_category_idx').on(t.category)]);

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { contactSettings } from '@workspace/db';

export const systemSettings = pgTable('system_settings', {
  id:          integer('id').primaryKey().default(1),
  companyName: text('company_name'),
  timezone:    text('timezone').notNull().default('Asia/Tashkent'),
  language:    text('language').notNull().default('uz'),
  currency:    text('currency').notNull().default('UZS'),
  logoUrl:     text('logo_url'),
  config:      jsonb('config').default({}),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
