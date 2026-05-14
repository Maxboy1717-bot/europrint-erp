/**
 * @module schema-misc
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, boolean, timestamp, decimal, integer,
  index, uniqueIndex, date, jsonb,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import {
  deliveryStatusEnum,
  maintenanceStatusEnum, maintenancePriorityEnum,
  kanbanTaskStatusEnum, kanbanPriorityEnum,
  campaignStatusEnum, campaignTypeEnum,
  securityIncidentSeverityEnum, securityIncidentStatusEnum,
  notificationTypeEnum,
} from './schema-enums';
import { users, sales_orders } from './schema-core';

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  sales_order_id: uuid('sales_order_id').references(() => sales_orders.id, { onDelete: 'set null' }),
  delivery_number: text('delivery_number').notNull().unique(),
  customer_name: text('customer_name').notNull(),
  delivery_address: text('delivery_address').notNull(),
  status: deliveryStatusEnum('status').notNull().default('pending'),
  driver_id: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
  vehicle_number: text('vehicle_number'),
  dispatched_at: timestamp('dispatched_at', { withTimezone: true }),
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('deliveries_delivery_number_idx').on(table.delivery_number),
  index('deliveries_sales_order_id_idx').on(table.sales_order_id),
  index('deliveries_status_idx').on(table.status),
  index('deliveries_driver_id_idx').on(table.driver_id),
]);

export const design_orders = pgTable('design_orders', {
  id:             integer('id').primaryKey(),
  order_number:   text('order_number').notNull(),
  client_name:    text('client_name'),
  product_type:   text('product_type'),
  status:         text('status').default('draft'),
  priority:       text('priority').default('normal'),
  deadline:       date('deadline'),
  assigned_to:    text('assigned_to'),
  description:    text('description'),
  ai_prompt:      text('ai_prompt'),
  file_urls:      jsonb('file_urls').default('[]'),
  created_by:     text('created_by'),
  approved_by:    text('approved_by'),
  approved_at:    timestamp('approved_at'),
  deal_id:        text('deal_id'),
  papka_order_id: text('papka_order_id'),
  client_company: text('client_company'),
  client_phone:   text('client_phone'),
  client_email:   text('client_email'),
  product_name:   text('product_name'),
  created_at:     timestamp('created_at').defaultNow().notNull(),
  updated_at:     timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('design_orders_status_idx').on(table.status),
  index('design_orders_assigned_to_idx').on(table.assigned_to),
]);

export const maintenance_orders = pgTable('maintenance_orders', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  equipment_id: uuid('equipment_id'),
  equipment_name: text('equipment_name').notNull(),
  issue_description: text('issue_description').notNull(),
  status: maintenanceStatusEnum('status').notNull().default('open'),
  priority: maintenancePriorityEnum('priority').notNull().default('medium'),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  production_order_affected: uuid('production_order_affected'),
  created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('maintenance_orders_equipment_id_idx').on(table.equipment_id),
  index('maintenance_orders_status_idx').on(table.status),
  index('maintenance_orders_priority_idx').on(table.priority),
  index('maintenance_orders_assigned_to_idx').on(table.assigned_to),
]);

export const kanban_tasks = pgTable('kanban_tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  status: kanbanTaskStatusEnum('status').notNull().default('todo'),
  priority: kanbanPriorityEnum('priority').notNull().default('medium'),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  due_date: timestamp('due_date', { withTimezone: true }),
  tags: text('tags').default('[]'),
  created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('kanban_tasks_status_idx').on(table.status),
  index('kanban_tasks_assigned_to_idx').on(table.assigned_to),
  index('kanban_tasks_priority_idx').on(table.priority),
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  start_date: timestamp('start_date', { withTimezone: true }),
  end_date: timestamp('end_date', { withTimezone: true }),
  target_audience: text('target_audience').default('{}'),
  created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('campaigns_type_idx').on(table.type),
  index('campaigns_status_idx').on(table.status),
  index('campaigns_created_by_idx').on(table.created_by),
]);

export const security_incidents = pgTable('security_incidents', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: securityIncidentSeverityEnum('severity').notNull(),
  status: securityIncidentStatusEnum('status').notNull().default('open'),
  reported_by: uuid('reported_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  resolution_notes: text('resolution_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('security_incidents_severity_idx').on(table.severity),
  index('security_incidents_status_idx').on(table.status),
  index('security_incidents_reported_by_idx').on(table.reported_by),
  index('security_incidents_assigned_to_idx').on(table.assigned_to),
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: notificationTypeEnum('type').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  reference_id: uuid('reference_id'),
  reference_type: text('reference_type'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('notifications_user_id_idx').on(table.user_id),
  index('notifications_is_read_idx').on(table.is_read),
  index('notifications_created_at_idx').on(table.created_at),
]);

export const employee_assets = pgTable('employee_assets', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  asset_id: text('asset_id').notNull(),
  employee_id: uuid('employee_id').references(() => users.id, { onDelete: 'set null' }),
  assigned_date: text('assigned_date').notNull(),
  return_date: text('return_date'),
  condition_on_assign: text('condition_on_assign').notNull().default('good'),
  condition_on_return: text('condition_on_return'),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('employee_assets_asset_id_idx').on(table.asset_id),
  index('employee_assets_employee_id_idx').on(table.employee_id),
]);

export const technology_approvals = pgTable('technology_approvals', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  papka_order_id: text('papka_order_id').notNull().unique(),
  action: text('action').notNull().default('pending'),
  bom_approved: boolean('bom_approved').notNull().default(false),
  routing_approved: boolean('routing_approved').notNull().default(false),
  tech_card_approved: boolean('tech_card_approved').notNull().default(false),
  notes: text('notes'),
  approved_by_id: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
  approved_at: timestamp('approved_at', { withTimezone: true }),
  is_rejected: boolean('is_rejected').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('technology_approvals_papka_order_id_idx').on(table.papka_order_id),
]);
