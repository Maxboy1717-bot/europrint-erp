/**
 * @module schema-finance-extended
 * @description Finance extended stubs (entries, cash flow, periods, categories,
 *   income/expense, order costings, KPIs, daily metrics, inventory counts).
 * Split out of schema-finance to respect the 300-line file budget.
 */

import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
} from 'drizzle-orm/pg-core';

export const entries = pgTable('entries', {
  id: integer('id').primaryKey(),
  debitAccountId: text('debit_account_id'),
  creditAccountId: text('credit_account_id'),
  amount: decimal('amount', { precision: 18, scale: 2 }),
  entryDate: text('entry_date'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const cashFlowTransactions = pgTable('cash_flow_transactions', {
  id: integer('id').primaryKey(),
  transactionDate: text('transaction_date'),
  transactionType: text('transaction_type'),
  amount: decimal('amount', { precision: 18, scale: 2 }),
  category: text('category'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const accountingPeriods = pgTable('accounting_periods', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').default('open'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const financeCategories = pgTable('finance_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const incomeExpenseTransactions = pgTable('income_expense_transactions', {
  id: integer('id').primaryKey(),
  transactionType: text('transaction_type').notNull(),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  categoryId: integer('category_id'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const orderCostings = pgTable('order_costings', {
  id: integer('id').primaryKey(),
  orderId: text('order_id'),
  orderType: text('order_type'),
  materialCost: decimal('material_cost', { precision: 18, scale: 2 }).default('0'),
  laborCost: decimal('labor_cost', { precision: 18, scale: 2 }).default('0'),
  overheadCost: decimal('overhead_cost', { precision: 18, scale: 2 }).default('0'),
  totalCost: decimal('total_cost', { precision: 18, scale: 2 }).default('0'),
  sellingPrice: decimal('selling_price', { precision: 18, scale: 2 }),
  marginPercent: decimal('margin_percent', { precision: 10, scale: 4 }),
  currency: text('currency').default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const orderCostingLines = pgTable('order_costing_lines', {
  id: integer('id').primaryKey(),
  orderCostingId: integer('order_costing_id'),
  type: text('type').notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
});

export const financialKPIs = pgTable('financial_kpis', {
  id:                integer('id').primaryKey(),
  kpiDate:           text('kpi_date').notNull(),
  kpiPeriod:         text('kpi_period'),
  currentRatio:      decimal('current_ratio', { precision: 18, scale: 4 }),
  quickRatio:        decimal('quick_ratio', { precision: 18, scale: 4 }),
  debtToEquity:      decimal('debt_to_equity', { precision: 18, scale: 4 }),
  grossProfitMargin: decimal('gross_profit_margin', { precision: 18, scale: 4 }),
});

export const dailyFinancialMetrics = pgTable('daily_financial_metrics', {
  id: integer('id').primaryKey(),
  metricDate: text('metric_date').notNull(),
  totalRevenue: decimal('total_revenue', { precision: 18, scale: 2 }).default('0'),
  totalExpenses: decimal('total_expenses', { precision: 18, scale: 2 }).default('0'),
  grossProfit: decimal('gross_profit', { precision: 18, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inventoryCounts = pgTable('inventory_counts', {
  id: integer('id').primaryKey(),
  warehouseId: text('warehouse_id'),
  materialId: text('material_id'),
  countedQty: decimal('counted_qty', { precision: 18, scale: 2 }),
  systemQty: decimal('system_qty', { precision: 18, scale: 2 }),
  status: text('status').default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// AR/AP/Kassa stubs (for financial-reports queries)
export const cashTransactions = pgTable('cash_transactions', {
  id: integer('id').primaryKey(),
  transactionDate: timestamp('transaction_date', { withTimezone: true }),
  transactionType: text('transaction_type'),
  amount: decimal('amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('UZS'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const warehouseTransactions = pgTable('warehouse_transactions', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id'),
  transactionType: text('transaction_type'),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).default('0'),
  balanceBefore: decimal('balance_before', { precision: 18, scale: 4 }).default('0'),
  balanceAfter: decimal('balance_after', { precision: 18, scale: 4 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const customerPayments = pgTable('customer_payments', {
  id: integer('id').primaryKey(),
  customerId: integer('customer_id'),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  status: text('status').default('pending'),
  currency: text('currency').default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const invoicePayments = pgTable('invoice_payments', {
  id: integer('id').primaryKey(),
  vendorId: integer('vendor_id'),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  status: text('status').default('pending'),
  currency: text('currency').default('UZS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
