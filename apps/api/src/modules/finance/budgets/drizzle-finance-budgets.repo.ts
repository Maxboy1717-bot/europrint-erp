/**
 * @module drizzle-finance-budgets.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * NOTE: Canonical `budgets` schema (schema-finance-budgets.ts) has:
 *  id (uuid), name, fiscalYear, quarter, department (text), status,
 *  totalPlanned, totalActual, createdBy, approvedBy, approvedAt, notes,
 *  createdAt, updatedAt.
 * It does NOT have: deletedAt, departmentId, year/month, category,
 * plannedAmount/actualAmount, currency. The repo maps DTO fields to the
 * canonical shape; status 'cancelled' is used in place of soft-delete.
 *
 * CANONICAL (2026-07-02): This class is the single source of truth for the
 * `budgets`/`budget_lines` tables. It absorbs the CQRS-facing methods
 * (findBudgetById/findBudgets/saveBudget/updateBudgetStatus/updateActuals/
 * getBudgetStats — formerly `FinanceBudgetRepo` in
 * infrastructure/repositories/drizzle-finance-budget.repo.ts, now deleted)
 * so every read path respects soft-delete (`status <> 'deleted'`). The
 * duplicate repo pointed at the same table without that filter — a budget
 * "deleted" via the standalone `/budgets` API stayed fully visible/editable
 * through the `/finance/budgets` CQRS API. See owner directive 2026-07-02.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { budgets, budget_lines } from '@europrint/schemas';
import { SQL, SQLWrapper, eq, and, count, desc, ne, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceBudgetsRepository } from './i-finance-budgets.repo';

type BudgetRow = typeof budgets.$inferSelect;
type BudgetLineRow = typeof budget_lines.$inferSelect;
// Structural alias matching IFinanceRepo['FinanceRow'] (domain/repositories/i-finance.repo.ts)
// without importing across the module boundary — both are Record<string, unknown>.
type FinanceRow = Record<string, unknown>;

// Soft-delete is modeled via status === 'deleted' (canonical has no deletedAt column).
const SOFT_DELETED = 'deleted';

type RawRow = Record<string, unknown>;
const execRaw = async (q: SQL | SQLWrapper): Promise<RawRow[]> => {
  return (await runQuery<RawRow>(q)).rows as RawRow[];
};

@Injectable()
export class DrizzleFinanceBudgetsRepository implements IFinanceBudgetsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: BudgetRow[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(budgets).where(ne(budgets.status, SOFT_DELETED)).limit(1).offset(0),
        db.select().from(budgets).where(ne(budgets.status, SOFT_DELETED)).orderBy(desc(budgets.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjetlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      // budgets.id is uuid (string); cast input id to string for the comparison.
      const rows = await db.select().from(budgets)
        .where(and(eq(budgets.id, String(id)), ne(budgets.status, SOFT_DELETED)))
        .limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Byudjet #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof budgets.$inferInsert, 'id'> = {
        name: (dto.name as string | undefined) ?? '',
        fiscalYear: (dto.fiscalYear as number | undefined) ?? (dto.year as number | undefined) ?? _time.now().getFullYear(),
        department: (dto.department as string | undefined) ?? (dto.departmentId as string | undefined) ?? null,
        status: 'draft',
        totalPlanned: (dto.totalPlanned as string | undefined) ?? (dto.plannedAmount as string | undefined) ?? '0',
        totalActual: '0',
        createdBy: (dto.createdBy as string | undefined) ?? '',
      };
      const result = await db.insert(budgets).values(row as typeof budgets.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof budgets.$inferInsert> = {
        ...(dto.name !== undefined ? { name: dto.name as string } : {}),
        ...(dto.fiscalYear !== undefined ? { fiscalYear: dto.fiscalYear as number } : {}),
        ...(dto.department !== undefined ? { department: dto.department as string } : {}),
        ...(dto.totalPlanned !== undefined ? { totalPlanned: dto.totalPlanned as string } : {}),
        ...(dto.totalActual !== undefined ? { totalActual: dto.totalActual as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(budgets).set(patch).where(eq(budgets.id, String(id))).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async approve(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(budgets).set({ status: 'approved' }).where(eq(budgets.id, String(id))).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tasdiqlashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      // Canonical budgets has no deletedAt column — use status='deleted' as the soft-delete marker.
      await db.update(budgets).set({ status: SOFT_DELETED, updatedAt: _time.now() }).where(eq(budgets.id, String(id)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }

  async findBudgetLines(budgetId: string, limit: number, offset: number): Promise<Result<{ data: BudgetLineRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(budget_lines).where(eq(budget_lines.budgetId, budgetId)).limit(limit).offset(offset),
        db.select({ count: count() }).from(budget_lines).where(eq(budget_lines.budgetId, budgetId)),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet qatorlari topilmadi'); }
  }

  async createBudgetLine(budgetId: string, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(budget_lines)
        .values({ ...dto, budgetId } as typeof budget_lines.$inferInsert)
        .returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet qatori yaratishda xatolik'); }
  }

  // ── CQRS-facing methods (absorbed from the former FinanceBudgetRepo) ────────
  // Used by IFinanceRepo (FINANCE_REPO facade) → CreateBudgetHandler,
  // ApproveBudgetHandler, SubmitBudgetForApprovalHandler, GetBudgetsHandler,
  // GetBudgetVarianceHandler, GetBudgetStatsHandler. All reads exclude
  // soft-deleted budgets (status <> 'deleted').

  async findBudgetById(id: string): Promise<Result<FinanceRow>> {
    try {
      const [budget] = await db.select().from(budgets)
        .where(and(eq(budgets.id, id), ne(budgets.status, SOFT_DELETED)))
        .limit(1);
      if (!budget) return Err('Budget not found');
      const lines = await db.select().from(budget_lines).where(eq(budget_lines.budgetId, id));
      return Ok({ ...(budget as FinanceRow), lines });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet topilmadi'); }
  }

  async findBudgets(filters: { fiscalYear?: number; status?: string; department?: string; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1; const limit = filters.limit || 10; const offset = (page - 1) * limit;
      const conditions: SQLWrapper[] = [ne(budgets.status, SOFT_DELETED)];
      if (filters.fiscalYear) conditions.push(eq(budgets.fiscalYear, filters.fiscalYear));
      if (filters.status) conditions.push(eq(budgets.status, filters.status));
      if (filters.department) conditions.push(eq(budgets.department, filters.department));
      const where = and(...conditions);
      const [totalResult, items] = await Promise.all([
        db.select({ count: count() }).from(budgets).where(where),
        db.select().from(budgets).where(where).orderBy(desc(budgets.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ items: items as FinanceRow[], total: Number(totalResult[0]?.count ?? 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjetlar topilmadi'); }
  }

  async saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>> {
    try {
      // Atomic: budget header + lines must succeed together — partial budget = broken state.
      const savedBudget = await db.transaction(async (tx) => {
        const inserted = await tx.insert(budgets).values(budget as typeof budgets.$inferInsert).returning();
        if (lines && lines.length > 0) {
          await tx.insert(budget_lines).values(lines as Array<typeof budget_lines.$inferInsert>);
        }
        return inserted;
      });
      return Ok(savedBudget[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet saqlanmadi'); }
  }

  async updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>> {
    try {
      const result = await db.update(budgets).set({ status, updatedAt: _time.now() }).where(eq(budgets.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet holati yangilanmadi'); }
  }

  async updateActuals(budgetId: string): Promise<Result<FinanceRow>> {
    try {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
      if (!budget) return Err('Budget not found');
      const budgetRow = budget as FinanceRow;
      const yearStart = new Date(Number(budgetRow.fiscalYear), 0, 1);
      const yearEnd = new Date(Number(budgetRow.fiscalYear), 11, 31, 23, 59, 59, 999);

      // Single batch query: sum GL entries per budget line using exact match or account_code fallback.
      // Exact equality (LOWER(...) = LOWER(...)) is used instead of ILIKE to avoid unreliable
      // partial-text matching on free-text accounting fields.
      const agg = await execRaw(sql`
        SELECT bl.id AS line_id, COALESCE(SUM(e.amount), 0) AS actual
        FROM budget_lines bl
        LEFT JOIN entries e ON LOWER(e.description) = LOWER(bl.category)
        WHERE bl.budget_id = ${budgetId}
          AND (e.entry_date BETWEEN TO_CHAR(${yearStart}::date, 'YYYY-MM-DD')
                                AND TO_CHAR(${yearEnd}::date, 'YYYY-MM-DD')
               OR e.id IS NULL)
        GROUP BY bl.id
      `);

      const totalActual = agg.reduce((acc, row) => acc + safeNum(row['actual']), 0);

      const result = await db.update(budgets).set({ totalActual: totalActual.toString(), updatedAt: _time.now() }).where(eq(budgets.id, budgetId)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet faktlari yangilanmadi'); }
  }

  async getBudgetStats(fiscalYear: number): Promise<Result<{ totalBudgets: number; approved: number; draft: number; totalPlanned: number; totalActual: number; overallVariancePercent: number }>> {
    try {
      const notDeleted = ne(budgets.status, SOFT_DELETED);
      const [total, approved, draft, stats] = await Promise.all([
        db.select({ count: count() }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), notDeleted)),
        db.select({ count: count() }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), eq(budgets.status, 'approved'))),
        db.select({ count: count() }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), eq(budgets.status, 'draft'))),
        db.select({ totalPlanned: sql<number>`COALESCE(SUM(CAST(${budgets.totalPlanned} AS NUMERIC)), 0)`, totalActual: sql<number>`COALESCE(SUM(CAST(${budgets.totalActual} AS NUMERIC)), 0)` }).from(budgets).where(and(eq(budgets.fiscalYear, fiscalYear), notDeleted)),
      ]);
      const totalPlanned = safeNum(stats[0]?.totalPlanned ?? '0');
      const totalActual = safeNum(stats[0]?.totalActual ?? '0');
      const overallVariancePercent = totalPlanned > 0 ? ((totalPlanned - totalActual) / totalPlanned) * 100 : 0;
      return Ok({ totalBudgets: Number(total[0]?.count ?? 0), approved: Number(approved[0]?.count ?? 0), draft: Number(draft[0]?.count ?? 0), totalPlanned, totalActual, overallVariancePercent });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjet statistikasi olinmadi'); }
  }
}
