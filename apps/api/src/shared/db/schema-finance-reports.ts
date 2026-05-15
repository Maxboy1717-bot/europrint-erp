/**
 * @module schema-finance-reports
 * @description Financial reports snapshot tables (rpt_* prefix) and AI usage logs.
 * Split out of schema-finance to respect the 300-line file budget.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const kassaTransactions = pgTable('rpt_kassa_transactions', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  totalInflow: decimal('total_inflow', { precision: 18, scale: 4 }).notNull().default('0'),
  totalOutflow: decimal('total_outflow', { precision: 18, scale: 4 }).notNull().default('0'),
  netCashFlow: decimal('net_cash_flow', { precision: 18, scale: 4 }).notNull().default('0'),
  openingBalance: decimal('opening_balance', { precision: 18, scale: 4 }).notNull().default('0'),
  closingBalance: decimal('closing_balance', { precision: 18, scale: 4 }).notNull().default('0'),
  currency: text('currency').notNull().default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const omborQoldiq = pgTable('rpt_ombor_qoldiq', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  warehouseId: integer('warehouse_id'),
  warehouseName: text('warehouse_name'),
  totalItems: integer('total_items').notNull().default(0),
  totalQuantity: decimal('total_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  totalValue: decimal('total_value', { precision: 18, scale: 4 }).notNull().default('0'),
  averageValue30d: decimal('average_value_30d', { precision: 18, scale: 4 }).notNull().default('0'),
  overstockFlag: text('overstock_flag').default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const debitorlar = pgTable('rpt_debitorlar', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  customerId: integer('customer_id'),
  customerName: text('customer_name'),
  totalReceivable: decimal('total_receivable', { precision: 18, scale: 4 }).notNull().default('0'),
  current: decimal('current', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue30: decimal('overdue_30', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue60: decimal('overdue_60', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue90plus: decimal('overdue_90_plus', { precision: 18, scale: 4 }).notNull().default('0'),
  currency: text('currency').notNull().default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const kreditorlar = pgTable('rpt_kreditorlar', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  vendorId: integer('vendor_id'),
  vendorName: text('vendor_name'),
  totalPayable: decimal('total_payable', { precision: 18, scale: 4 }).notNull().default('0'),
  current: decimal('current', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue30: decimal('overdue_30', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue60: decimal('overdue_60', { precision: 18, scale: 4 }).notNull().default('0'),
  overdue90plus: decimal('overdue_90_plus', { precision: 18, scale: 4 }).notNull().default('0'),
  currency: text('currency').notNull().default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const balans = pgTable('rpt_balans', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  totalAssets: decimal('total_assets', { precision: 18, scale: 4 }).notNull().default('0'),
  currentAssets: decimal('current_assets', { precision: 18, scale: 4 }).notNull().default('0'),
  nonCurrentAssets: decimal('non_current_assets', { precision: 18, scale: 4 }).notNull().default('0'),
  totalLiabilities: decimal('total_liabilities', { precision: 18, scale: 4 }).notNull().default('0'),
  currentLiabilities: decimal('current_liabilities', { precision: 18, scale: 4 }).notNull().default('0'),
  nonCurrentLiabilities: decimal('non_current_liabilities', { precision: 18, scale: 4 }).notNull().default('0'),
  equity: decimal('equity', { precision: 18, scale: 4 }).notNull().default('0'),
  retainedEarnings: decimal('retained_earnings', { precision: 18, scale: 4 }).notNull().default('0'),
  currency: text('currency').notNull().default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ishlabChiqarish = pgTable('rpt_ishlab_chiqarish', {
  id: text('id').primaryKey(),
  reportDate: text('report_date').notNull(),
  plannedQuantity: decimal('planned_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  actualQuantity: decimal('actual_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  goodQuantity: decimal('good_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  scrapQuantity: decimal('scrap_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  efficiencyPct: decimal('efficiency_pct', { precision: 18, scale: 4 }).notNull().default('0'),
  scrapRatePct: decimal('scrap_rate_pct', { precision: 18, scale: 4 }).notNull().default('0'),
  downtimeMinutes: integer('downtime_minutes').notNull().default(0),
  workCenterId: integer('work_center_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ai_usage_logs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  provider: text('provider').notNull(),
  taskType: text('task_type').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 6 }).notNull().default('0'),
  userId: text('user_id'),
  sessionId: text('session_id'),
  requestSummary: text('request_summary'),
  responseSummary: text('response_summary'),
  latencyMs: integer('latency_ms'),
  status: text('status').notNull().default('success'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
