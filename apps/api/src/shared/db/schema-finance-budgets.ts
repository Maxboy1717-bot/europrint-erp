/**
 * @module schema-finance-budgets
 * @description Budgets, budget lines, and director HITL approval requests.
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
