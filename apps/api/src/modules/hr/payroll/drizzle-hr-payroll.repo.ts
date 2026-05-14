/**
 * @module drizzle-hr-payroll.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { salaryHistory } from '@europrint/schemas';
import { eq, and, count, desc, gte, lte } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IHrPayrollRepository } from './i-hr-payroll.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleHrPayrollRepository implements IHrPayrollRepository {
  async findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, userId, changeType, fromDate, toDate } = opts;
      const conditions = [];
      if (userId) conditions.push(eq(salaryHistory.userId, userId));
      if (changeType) conditions.push(eq(salaryHistory.changeType, changeType));
      if (fromDate) conditions.push(gte(salaryHistory.effectiveDate, new Date(String(fromDate))));
      if (toDate) conditions.push(lte(salaryHistory.effectiveDate, new Date(String(toDate))));
      const wh = conditions.length > 0 ? and(...conditions) : undefined;
      const [data, countResult] = await Promise.all([
        wh ? db.select().from(salaryHistory).where(wh).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset)
           : db.select().from(salaryHistory).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset),
        wh ? db.select({ count: count() }).from(salaryHistory).where(wh).limit(1).offset(0)
           : db.select({ count: count() }).from(salaryHistory).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Maosh tarixi topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(salaryHistory).values({ ...dto } as typeof salaryHistory.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }
}
