import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import {
  userRoleEnum,
  dealStatusEnum,
  salesOrderStatusEnum,
} from './schema-enums';

// ============================================================================
// AUTH & USERS
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    full_name: text('full_name').notNull(),
    role: userRoleEnum('role').notNull().default('employee'),
    is_active: boolean('is_active').notNull().default(true),
    phone: text('phone'),
    department: text('department'),
    last_login_at: timestamp('last_login_at'),
    failed_login_attempts: integer('failed_login_attempts').default(0),
    locked_until: timestamp('locked_until'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    index('users_is_active_idx').on(table.is_active),
    index('users_role_idx').on(table.role),
  ],
);

export const refresh_tokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    is_revoked: boolean('is_revoked').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.user_id),
    index('refresh_tokens_expires_at_idx').on(table.expires_at),
  ],
);

export const audit_logs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    module: text('module').notNull(),
    entity_id: text('entity_id'),
    before_value: text('before_value'),
    after_value: text('after_value'),
    ip_address: text('ip_address'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.user_id),
    index('audit_logs_module_idx').on(table.module),
    index('audit_logs_created_at_idx').on(table.created_at),
  ],
);

// ============================================================================
// SETTINGS
// ============================================================================

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    updated_by: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('settings_key_idx').on(table.key)],
);

// ============================================================================
// CRM
// ============================================================================

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    full_name: text('full_name').notNull(),
    phone: text('phone'),
    email: text('email'),
    source: text('source'),
    status: text('status').notNull().default('new'),
    ai_score: decimal('ai_score', { precision: 5, scale: 2 }),
    assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('leads_assigned_to_idx').on(table.assigned_to),
    index('leads_status_idx').on(table.status),
    index('leads_created_at_idx').on(table.created_at),
  ],
);

export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    lead_id: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('UZS'),
    status: dealStatusEnum('status').notNull().default('new'),
    probability: integer('probability').default(0),
    won_at: timestamp('won_at', { withTimezone: true }),
    lost_reason: text('lost_reason'),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('deals_lead_id_idx').on(table.lead_id),
    index('deals_status_idx').on(table.status),
    index('deals_created_by_idx').on(table.created_by),
  ],
);

// ============================================================================
// SALES (SD)
// ============================================================================

export const sales_orders = pgTable(
  'sales_orders',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    deal_id: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
    order_number: text('order_number').notNull().unique(),
    customer_name: text('customer_name').notNull(),
    customer_id: uuid('customer_id'),
    status: salesOrderStatusEnum('status').notNull().default('draft'),
    advance_percent: decimal('advance_percent', { precision: 5, scale: 2 }).default('0'),
    advance_bypass_by: uuid('advance_bypass_by').references(() => users.id, { onDelete: 'set null' }),
    advance_bypass_reason: text('advance_bypass_reason'),
    bom_checked: boolean('bom_checked').default(false),
    routing_checked: boolean('routing_checked').default(false),
    tech_card_checked: boolean('tech_card_checked').default(false),
    total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('UZS'),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('sales_orders_order_number_idx').on(table.order_number),
    index('sales_orders_deal_id_idx').on(table.deal_id),
    index('sales_orders_status_idx').on(table.status),
    index('sales_orders_created_by_idx').on(table.created_by),
    index('sales_orders_assigned_to_idx').on(table.assigned_to),
  ],
);
