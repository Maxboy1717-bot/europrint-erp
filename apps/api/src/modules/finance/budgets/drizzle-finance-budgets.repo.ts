import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { budgets, budget_lines } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceBudgetsRepository } from './i-finance-budgets.repo';

type BudgetRow = typeof budgets.$inferSelect;
type BudgetLineRow = typeof budget_lines.$inferSelect;

@Injectable()
export class DrizzleFinanceBudgetsRepository implements IFinanceBudgetsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: BudgetRow[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(budgets).where(isNull(budgets.deletedAt)).limit(1).offset(0),
        db.select().from(budgets).where(isNull(budgets.deletedAt)).orderBy(desc(budgets.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Byudjetlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const rows = await db.select().from(budgets).where(and(eq(budgets.id, id), isNull(budgets.deletedAt))).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Byudjet #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof budgets.$inferInsert, 'id'> = {
        departmentId: dto.departmentId as string | undefined,
        year: (dto.year as number | undefined) ?? _time.now().getFullYear(),
        month: dto.month as number | undefined,
        category: (dto.category as string | undefined) ?? '',
        plannedAmount: (dto.plannedAmount as string | undefined) ?? '0',
        actualAmount: '0',
        currency: (dto.currency as string | undefined) ?? 'UZS',
        status: 'draft',
      };
      const result = await db.insert(budgets).values(row as typeof budgets.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof budgets.$inferInsert> = {
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId as string } : {}),
        ...(dto.year !== undefined ? { year: dto.year as number } : {}),
        ...(dto.month !== undefined ? { month: dto.month as number } : {}),
        ...(dto.category !== undefined ? { category: dto.category as string } : {}),
        ...(dto.plannedAmount !== undefined ? { plannedAmount: dto.plannedAmount as string } : {}),
        ...(dto.actualAmount !== undefined ? { actualAmount: dto.actualAmount as string } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(budgets).set(patch).where(eq(budgets.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async approve(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(budgets).set({ status: 'approved' }).where(eq(budgets.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tasdiqlashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(budgets).set({ deletedAt: _time.now() }).where(eq(budgets.id, id));
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
