/**
 * @module schema-admin-ext
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { stub } from './schema-compat-helpers';

export const guidelines = stub(pgTable('guidelines', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  content:     text('content').notNull(),
  category:    text('category').notNull().default('general'),
  isActive:    boolean('is_active').notNull().default(true),
  createdBy:   text('created_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('guidelines_category_idx').on(t.category)]));

export const contactSettings = stub(pgTable('contact_settings', {
  id:          integer('id').primaryKey().default(1),
  phone:       text('phone'),
  email:       text('email'),
  address:     text('address'),
  telegram:    text('telegram'),
  website:     text('website'),
  workingHours: text('working_hours'),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const systemSettings = stub(pgTable('system_settings', {
  id:          integer('id').primaryKey().default(1),
  companyName: text('company_name'),
  timezone:    text('timezone').notNull().default('Asia/Tashkent'),
  language:    text('language').notNull().default('uz'),
  currency:    text('currency').notNull().default('UZS'),
  logoUrl:     text('logo_url'),
  config:      jsonb('config').default({}),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const adminFilters = stub(pgTable('admin_filters', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  filterType:  text('filter_type').notNull().default('general'),
  config:      jsonb('config').default({}),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const calendarEvents = stub(pgTable('calendar_events', {
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
}, (t) => [index('calendar_events_start_idx').on(t.startDate)]));

export const assetItems = stub(pgTable('asset_items', {
  id:            uuid('id').primaryKey().defaultRandom(),
  name:          text('name').notNull(),
  assetCode:     text('asset_code'),
  category:      text('category').notNull().default('equipment'),
  status:        text('status').notNull().default('active'),
  purchaseDate:  timestamp('purchase_date', { withTimezone: true }),
  purchaseValue: text('purchase_value'),
  currentValue:  text('current_value'),
  location:      text('location'),
  assignedTo:    text('assigned_to'),
  departmentId:  integer('department_id'),
  serialNumber:  text('serial_number'),
  notes:         text('notes'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('asset_items_status_idx').on(t.status), index('asset_items_category_idx').on(t.category)]));

export const assetMaintenance = stub(pgTable('asset_maintenance', {
  id:          uuid('id').primaryKey().defaultRandom(),
  assetId:     uuid('asset_id').notNull(),
  maintenanceType: text('maintenance_type').notNull().default('routine'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cost:        text('cost'),
  notes:       text('notes'),
  status:      text('status').notNull().default('scheduled'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const assetDisposals = stub(pgTable('asset_disposals', {
  id:          uuid('id').primaryKey().defaultRandom(),
  assetId:     uuid('asset_id').notNull(),
  disposalType: text('disposal_type').notNull().default('retired'),
  disposalDate: timestamp('disposal_date', { withTimezone: true }),
  saleValue:   text('sale_value'),
  reason:      text('reason'),
  approvedBy:  text('approved_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const assetTransfers = stub(pgTable('asset_transfers', {
  id:            uuid('id').primaryKey().defaultRandom(),
  assetId:       uuid('asset_id').notNull(),
  fromDeptId:    integer('from_dept_id'),
  toDeptId:      integer('to_dept_id'),
  transferDate:  timestamp('transfer_date', { withTimezone: true }),
  reason:        text('reason'),
  approvedBy:    text('approved_by'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const saasTenants = stub(pgTable('saas_tenants', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  domain:      text('domain'),
  plan:        text('plan').notNull().default('basic'),
  status:      text('status').notNull().default('active'),
  employeeLimit: integer('employee_limit').notNull().default(50),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));
