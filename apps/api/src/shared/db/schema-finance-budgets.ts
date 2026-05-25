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

// approval_requests: re-exported from schema-compat-4.ts (integer PK, matches DB migration).
// The uuid PK version here was incorrect — DB migration shows integer PK.
export { approvalRequests as approval_requests } from './schema-compat-4';
