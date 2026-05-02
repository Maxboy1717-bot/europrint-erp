import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { accountingPeriods, glDocuments } from '@europrint/schemas';
import { payments } from '@shared/db';
import { eq, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFiRepository } from './i-fi.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleFiRepository implements IFiRepository {
  async findAccountingPeriods(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(accountingPeriods).orderBy(desc(accountingPeriods.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(accountingPeriods),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Hisob davrlar topilmadi'); }
  }

  async createAccountingPeriod(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(accountingPeriods).values(dto as typeof accountingPeriods.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async closeAccountingPeriod(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(accountingPeriods)
        .set({ status: 'closed', closedAt: _time.now() })
        .where(eq(accountingPeriods.id, id))
        .returning();
      return Ok(result[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message || 'Yopishda xatolik'); }
  }

  async postGlDocument(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(glDocuments)
        .set({ status: 'posted' })
        .where(eq(glDocuments.id, id))
        .returning();
      return Ok(result[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message || 'Joylashtirishda xatolik'); }
  }

  async findPayments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(payments).orderBy(desc(payments.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(payments),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || "To'lovlar topilmadi"); }
  }

  async createPayment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(payments).values(dto as typeof payments.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }
}
