/**
 * @module drizzle-finance-payroll.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { payrollPeriods, payrollRows } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinancePayrollRepository } from './i-finance-payroll.repo';

type PayrollPeriodRow = typeof payrollPeriods.$inferSelect;

@Injectable()
export class DrizzleFinancePayrollRepository implements IFinancePayrollRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: PayrollPeriodRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(payrollPeriods).orderBy(desc(payrollPeriods.id)).limit(limit).offset(offset),
        db.select({ count: count() }).from(payrollPeriods).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Oylik davrlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Oylik davri #${id} topilmadi`); }
  }

  async findRowsByPeriodId(periodId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(payrollRows).where(eq(payrollRows.periodId, periodId));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Oylik qatorlar topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const { status: _s, ...safeDto } = dto as Record<string, unknown>;
      const result = await db.insert(payrollPeriods).values(safeDto as typeof payrollPeriods.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(payrollPeriods).set({ status }).where(eq(payrollPeriods.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }
}
