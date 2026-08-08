/**
 * @module schema-misc
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, boolean, timestamp, decimal, integer, serial,
  index, uniqueIndex, date, jsonb,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import {
  deliveryStatusEnum,
  maintenanceStatusEnum, maintenancePriorityEnum,
  campaignStatusEnum, campaignTypeEnum,
  securityIncidentSeverityEnum, securityIncidentStatusEnum,
} from './schema-enums';
import { users, sales_orders } from './schema-core';

// SD-CRM audit §5.2(b)/§5.4 item 7 bonus (2026-08-06): the live `deliveries.id` is a plain
// integer identity (nextval sequence), never a uuid — this table predates the uuid-cuid2
// convention used elsewhere and was declared wrong here. The old `uuid().$defaultFn(createId)`
// made every typed `db.insert(deliveries).values(...)` generate a CUID string client-side and
// try to write it into an integer column, failing every POST /sd/deliveries outright
// ("invalid input syntax for type integer"). `sales_order_id`/`driver_id`/`customer_id` are
// integer FKs live too, not uuid. Column keys below are added/renamed to match what
// drizzle-sd-deliveries.repo.ts's create() actually persists from SdCreateDeliverySchema.
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  sales_order_id: integer('sales_order_id'),
  customer_id: integer('customer_id'),
  delivery_number: text('delivery_number').notNull().unique(),
  customer_name: text('customer_name'),
  delivery_address: text('delivery_address'),
  planned_goods_movement_date: text('planned_goods_movement_date'),
  status: deliveryStatusEnum('status').notNull().default('pending'),
  driver_id: integer('driver_id'),
  driver_name: text('driver_name'),
  vehicle_number: text('vehicle_number'),
  dispatched_at: timestamp('dispatched_at', { withTimezone: true }),
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  notes: text('notes'),
  created_by: integer('created_by'),
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

// notifications: re-exported from schema-compat-3.ts (integer PK, camelCase, matches DB migration).
// The uuid PK version in this file was incorrect — DB migration shows serial integer PK.
export { notifications } from './schema-compat-3';

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
