/**
 * @module schema-finance
 * @description Source module. See exports for details.
 */

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
import { invoiceStatusEnum } from './schema-enums';
import { users, sales_orders } from './schema-core';

// ============================================================================
// FINANCE
// ============================================================================

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    invoice_number: text('invoice_number').notNull().unique(),
    sales_order_id: uuid('sales_order_id').references(() => sales_orders.id, {
      onDelete: 'set null',
    }),
    customer_name: text('customer_name').notNull(),
    customer_id: uuid('customer_id'),
    items: text('items').notNull().default('[]'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
    tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull(),
    total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    paid_amount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    due_date: timestamp('due_date', { withTimezone: true }),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('invoices_invoice_number_idx').on(table.invoice_number),
    index('invoices_sales_order_id_idx').on(table.sales_order_id),
    index('invoices_status_idx').on(table.status),
    index('invoices_created_by_idx').on(table.created_by),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('UZS'),
    payment_method: text('payment_method').notNull(),
    reference_number: text('reference_number'),
    paid_at: timestamp('paid_at', { withTimezone: true }).notNull(),
    recorded_by: uuid('recorded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoice_id),
    index('payments_paid_at_idx').on(table.paid_at),
  ],
);

export const gl_entries = pgTable(
  'gl_entries',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    entry_number: text('entry_number').notNull().unique(),
    debit_account: text('debit_account').notNull(),
    credit_account: text('credit_account').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    description: text('description'),
    reference_id: uuid('reference_id'),
    reference_type: text('reference_type'),
    posted_by: uuid('posted_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    posted_at: timestamp('posted_at', { withTimezone: true }).defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('gl_entries_entry_number_idx').on(table.entry_number),
    index('gl_entries_debit_account_idx').on(table.debit_account),
    index('gl_entries_credit_account_idx').on(table.credit_account),
    index('gl_entries_posted_at_idx').on(table.posted_at),
  ],
);

// ============================================================================
// Finance — Budgets
// ============================================================================

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  quarter: integer('quarter'),
  department: text('department'),
  status: text('status').notNull().default('draft'),
  totalPlanned: decimal('total_planned', { precision: 18, scale: 2 }).notNull().default('0'),
  totalActual: decimal('total_actual', { precision: 18, scale: 2 }).notNull().default('0'),
  createdBy: text('created_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const budget_lines = pgTable('budget_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  budgetId: uuid('budget_id').references(() => budgets.id),
  category: text('category').notNull(),
  description: text('description').notNull(),
  plannedAmount: decimal('planned_amount', { precision: 18, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 18, scale: 2 }).notNull().default('0'),
});

// ============================================================================
// DIRECTOR — HITL Approval Requests
// ============================================================================

export const approval_requests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  documentType: text('document_type').notNull(),
  documentId: text('document_id').notNull(),
  documentNumber: text('document_number'),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull().default('0'),
  currency: text('currency').notNull().default('UZS'),
  status: text('status').notNull().default('pending'),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectedBy: text('rejected_by'),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// Finance — Extended stubs (used by finance repos)
// ============================================================================

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

// ============================================================================
// Finance — Kassa / Warehouse / AR / AP stubs (for financial-reports queries)
// ============================================================================

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

// ============================================================================
// Financial Reports — Snapshot tables (rpt_* prefix)
// ============================================================================

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

// ============================================================================
// AI — Usage Logs
// ============================================================================

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
