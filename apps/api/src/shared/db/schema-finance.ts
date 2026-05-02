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
