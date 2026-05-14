/**
 * @module schema-compat-5
 * @description Source module. See exports for details.
 */

import { pgTable, text, decimal, integer, ts, stub, serial, varchar } from './schema-compat-helpers';
import { numeric } from 'drizzle-orm/pg-core';

export const customer_payments = pgTable('customer_payments', {
  id:               serial('id').primaryKey(),
  payment_number:   varchar('payment_number', { length: 50 }),
  payment_date:     varchar('payment_date', { length: 10 }),
  customer_id:      varchar('customer_id'),
  sales_invoice_id: varchar('sales_invoice_id'),
  payment_method:   varchar('payment_method', { length: 30 }).default('bank_transfer'),
  bank_account:     varchar('bank_account', { length: 50 }),
  amount:           numeric('amount').default('0'),
  currency:         varchar('currency', { length: 10 }).default('UZS'),
  exchange_rate:    numeric('exchange_rate').default('1'),
  reference:        varchar('reference', { length: 100 }),
  status:           varchar('status', { length: 20 }).default('received'),
  applied_at:       ts('applied_at'),
  approved_by:      varchar('approved_by'),
  approved_at:      ts('approved_at'),
  notes:            text('notes'),
  created_by:       integer('created_by'),
  created_at:       ts('created_at').defaultNow(),
});

export const wms_stock = pgTable('wms_stock', {
  id:         serial('id').primaryKey(),
  qty:        numeric('qty', { precision: 15, scale: 3 }),
  batch_no:   varchar('batch_no', { length: 100 }),
  notes:      text('notes'),
  created_at: ts('created_at').defaultNow(),
  created_by: integer('created_by'),
  updated_at: ts('updated_at'),
  deleted_at: ts('deleted_at'),
  deleted_by: integer('deleted_by'),
});

export const salaryHistory = stub(pgTable('salary_history', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  employeeId: integer('employee_id').notNull(),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').default('UZS'),
  effectiveDate: ts('effective_date'),
  reason: text('reason'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  changeType: text('change_type'),
}));
