/**
 * @module schema-order-workflow
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, numeric, integer, boolean,
  timestamp, jsonb, index, uniqueIndex, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const owOrders = pgTable('ow_orders', {
  id:                  uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderNumber:         text('order_number').notNull().unique(),
  customerId:          integer('customer_id'),
  customerTier:        text('customer_tier').notNull().default('NEW'),
  status:              text('status').notNull().default('DRAFT'),
  stateVersion:        integer('state_version').notNull().default(0),
  totalAmount:         numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  currency:            text('currency').notNull().default('UZS'),
  assignedSalesManager: integer('assigned_sales_manager'),
  tenantId:            uuid('tenant_id'),
  estimatedDeliveryAt:   timestamp('estimated_delivery_at', { withTimezone: true }),
  actualDeliveryAt:      timestamp('actual_delivery_at', { withTimezone: true }),
  customerApproved:      boolean('customer_approved').notNull().default(false),
  techCardConfirmedAt:   timestamp('tech_card_confirmed_at', { withTimezone: true }),
  customerSignatureUrl:  text('customer_signature_url'),
  createdAt:             timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  index('ow_orders_status_idx2').on(t.status),
  index('ow_orders_tenant_idx').on(t.tenantId),
]);

export const owOrderStatusHistory = pgTable('ow_order_status_history', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:      uuid('order_id').notNull().references(() => owOrders.id),
  fromStatus:   text('from_status'),
  toStatus:     text('to_status').notNull(),
  changedBy:    integer('changed_by'),
  reason:       text('reason'),
  stateVersion: integer('state_version').notNull().default(0),
  changedAt:    timestamp('changed_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  index('ow_sh_order_idx2').on(t.orderId),
]);

export const owPaymentPlanEntries = pgTable('ow_payment_plan_entries', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:      uuid('order_id').notNull().references(() => owOrders.id),
  sequence:     integer('sequence').notNull(),
  dueType:      text('due_type').notNull(),
  dueCondition: jsonb('due_condition'),
  percent:      numeric('percent', { precision: 5, scale: 2 }).notNull(),
  amount:       numeric('amount',  { precision: 14, scale: 2 }).notNull(),
  paidAt:       timestamp('paid_at', { withTimezone: true }),
  paidRef:      text('paid_ref'),
  status:       text('status').notNull().default('PENDING'),
});

export const owMolds = pgTable('ow_molds', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:   uuid('order_id').notNull().references(() => owOrders.id),
  vendor:    text('vendor').notNull(),
  status:    text('status').notNull().default('ORDERED'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
});

export const owCliches = pgTable('ow_cliches', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:   uuid('order_id').notNull().references(() => owOrders.id),
  clicheType: text('cliche_type').notNull(),
  vendor:    text('vendor').notNull(),
  arrivedAt: timestamp('arrived_at', { withTimezone: true }),
  status:    text('status').notNull().default('ORDERED'),
});

export const owMaterialRequirements = pgTable('ow_material_requirements', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:    uuid('order_id').notNull().references(() => owOrders.id),
  materialId: text('material_id').notNull(),
  qtyRequired: numeric('qty_required', { precision: 14, scale: 3 }).notNull(),
  qtyReserved: numeric('qty_reserved', { precision: 14, scale: 3 }).notNull().default('0'),
  qtyIssued:   numeric('qty_issued',   { precision: 14, scale: 3 }).notNull().default('0'),
  labPassed:  boolean('lab_passed').notNull().default(false),
  status:     text('status').notNull().default('NEEDED'),
});

export type OwOrder            = typeof owOrders.$inferSelect;
export type OwOrderStatusHistory = typeof owOrderStatusHistory.$inferSelect;
export type OwPaymentPlanEntry = typeof owPaymentPlanEntries.$inferSelect;
export type OwMold             = typeof owMolds.$inferSelect;
export type OwCliche           = typeof owCliches.$inferSelect;
export type OwMaterialReq      = typeof owMaterialRequirements.$inferSelect;
