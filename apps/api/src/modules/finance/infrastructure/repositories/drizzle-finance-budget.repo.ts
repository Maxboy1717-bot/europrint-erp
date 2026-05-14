/**
 * @module drizzle-finance-budget.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, and, desc, eq, sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { Result, Err, Ok } from '@common/types/result.type';
import { FinanceRow } from '../../domain/repositories/i-finance.repo';

const budgets = pgTable('budgets', {
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

const budgetLines = pgTable('budget_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  budgetId: uuid('budget_id').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  plannedAmount: decimal('planned_amount', { precision: 18, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 18, scale: 2 }).notNull().default('0'),
});

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class FinanceBudgetRepo {
  private readonly logger = new Logger(FinanceBudgetRepo.name);

  async findBudgetById(id: string): Promise<Result<FinanceRow>> {
    try {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
      if (!budget) return Err('Budget not found');
      const lines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, id));
      return { ok: true, data: { ...(budget as Record<string, unknown>), lines } };
    } catch (error: unknown) { this.logger.error(`Error finding budget: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findBudgets(filters: { fiscalYear?: number; status?: string; department?: string; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1; const limit = filters.limit || 10; const offset = (page - 1) * limit;
      const conditions: ReturnType<typeof eq>[] = [];
      if (filters.fiscalYear) conditions.push(eq(budgets.fiscalYear, filters.fiscalYear));
      if (filters.status) conditions.push(eq(budgets.status, filters.status));
      if (filters.department) conditions.push(eq(budgets.department, filters.department));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const total = await db.select({ count: sql<number>`count(*)` }).from(budgets).where(where);
      const items = await db.select().from(budgets).where(where).orderBy(desc(budgets.createdAt)).limit(limit).offset(offset);
      return { ok: true, data: { items: items as FinanceRow[], total: parseInt(String(total[0]?.count ?? '0'), 10) } };
    } catch (error: unknown) { this.logger.error(`Error finding budgets: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>> {
    try {
      const savedBudget = await db.insert(budgets).values(budget as typeof budgets.$inferInsert).returning();
      if (lines && lines.length > 0) await db.insert(budgetLines).values(lines as Array<typeof budgetLines.$inferInsert>);
      return Ok(savedBudget[0]);
    } catch (error: unknown) { this.logger.error(`Error saving budget: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>> {
    try {
      const result = await db.update(budgets).set({ status, updatedAt: _time.now() }).where(eq(budgets.id, id)).returning();
      return Ok(result[0]);
    } catch (error: unknown) { this.logger.error(`Error updating budget status: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async updateActuals(budgetId: string): Promise<Result<FinanceRow>> {
    try {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
      if (!budget) return Err('Budget not found');
      const budgetRow = budget as Record<string, unknown>;
      const yearStart = new Date(Number(budgetRow.fiscalYear), 0, 1);
      const yearEnd   = new Date(Number(budgetRow.fiscalYear), 11, 31, 23, 59, 59, 999);

      // Single batch query: sum GL entries per budget line using exact match or account_code fallback.
      // Exact equality (LOWER(...) = LOWER(...)) is used instead of ILIKE to avoid unreliable
      // partial-text matching on free-text accounting fields.
      const agg = await exec(sql`
        SELECT bl.id AS line_id, COALESCE(SUM(gje.amount), 0) AS actual
        FROM budget_lines bl
        LEFT JOIN gl_journal_entries gje ON (
          LOWER(gje.description) = LOWER(bl.category)
          OR gje.account_code = bl.account_code
        )
        WHERE bl.budget_id = ${budgetId}
          AND (gje.entry_date BETWEEN ${yearStart} AND ${yearEnd} OR gje.id IS NULL)
        GROUP BY bl.id
      `);

      const totalActual = agg.reduce((acc, row) => acc + safeNum(row['actual']), 0);

      const result = await db.update(budgets).set({ totalActual: totalActual.toString(), updatedAt: _time.now() }).where(eq(budgets.id, budgetId)).returning();
      return Ok(result[0]);
    } catch (error: unknown) { this.logger.error(`Error updating actuals: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async getBudgetStats(fiscalYear: number): Promise<Result<{ totalBudgets: number; approved: number; draft: number; totalPlanned: number; totalActual: number; overallVariancePercent: number }>> {
    try {
      const [total, approved, draft, stats] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)` }).from(budgets).where(eq(budgets.fiscalYear, fiscalYear)),
        db.select({ count: sql<number>`COUNT(*)` }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), eq(budgets.status, 'approved'))),
        db.select({ count: sql<number>`COUNT(*)` }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), eq(budgets.status, 'draft'))),
        db.select({ totalPlanned: sql<number>`COALESCE(SUM(CAST(${budgets.totalPlanned} AS NUMERIC)), 0)`, totalActual: sql<number>`COALESCE(SUM(CAST(${budgets.totalActual} AS NUMERIC)), 0)` }).from(budgets).where(eq(budgets.fiscalYear, fiscalYear)),
      ]);
      const totalPlanned = safeNum(stats[0]?.totalPlanned ?? '0');
      const totalActual = safeNum(stats[0]?.totalActual ?? '0');
      const overallVariancePercent = totalPlanned > 0 ? ((totalPlanned - totalActual) / totalPlanned) * 100 : 0;
      return { ok: true, data: { totalBudgets: Number(total[0]?.count ?? 0), approved: Number(approved[0]?.count ?? 0), draft: Number(draft[0]?.count ?? 0), totalPlanned, totalActual, overallVariancePercent } };
    } catch (error: unknown) { this.logger.error(`Error getting budget stats: ${(error as Error).message}`); return Err((error as Error).message); }
  }
}
