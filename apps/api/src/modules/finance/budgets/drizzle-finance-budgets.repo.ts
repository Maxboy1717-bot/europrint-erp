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
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { budgets, budget_lines } from '@europrint/schemas';
import { eq, and, count, desc, ne } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceBudgetsRepository } from './i-finance-budgets.repo';

type BudgetRow = typeof budgets.$inferSelect;
type BudgetLineRow = typeof budget_lines.$inferSelect;

// Soft-delete is modeled via status === 'deleted' (canonical has no deletedAt column).
const SOFT_DELETED = 'deleted';

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
}
