import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { cashFlowTransactions } from '@europrint/schemas';
import { eq, count, desc, sql, sum, gte, lte, and } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICashflowRepository } from './i-cashflow.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleCashflowRepository implements ICashflowRepository {
  async findTransactions(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(cashFlowTransactions).orderBy(desc(cashFlowTransactions.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(cashFlowTransactions),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Tranzaksiyalar topilmadi'); }
  }

  async createTransaction(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(cashFlowTransactions).values(dto as typeof cashFlowTransactions.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async findDailySummary(date?: string): Promise<Result<Record<string, unknown>>> {
    try {
      const targetDate = date ?? _time.now().toISOString().slice(0, 10);
      const [inflow, outflow] = await Promise.all([
        db.select({ total: sum(cashFlowTransactions.amount) })
          .from(cashFlowTransactions)
          .where(and(
            eq(cashFlowTransactions.transactionDate, targetDate),
            sql`${cashFlowTransactions.transactionType} = 'inflow'`,
          )),
        db.select({ total: sum(cashFlowTransactions.amount) })
          .from(cashFlowTransactions)
          .where(and(
            eq(cashFlowTransactions.transactionDate, targetDate),
            sql`${cashFlowTransactions.transactionType} = 'outflow'`,
          )),
      ]);
      const totalInflow = Number(inflow[0]?.total || 0);
      const totalOutflow = Number(outflow[0]?.total || 0);
      return Ok({ date: targetDate, totalInflow, totalOutflow, net: totalInflow - totalOutflow });
    } catch (e: unknown) { return Err((e as Error).message || 'Kunlik hisobot topilmadi'); }
  }

  async findForecast(days = 7): Promise<Result<object[]>> {
    try {
      const safeDays = Math.min(Math.max(1, days), 90);
      const rows = await db.select({
        date: cashFlowTransactions.transactionDate,
        inflow: sql<number>`SUM(CASE WHEN ${cashFlowTransactions.transactionType} = 'inflow' THEN ${cashFlowTransactions.amount}::numeric ELSE 0 END)`,
        outflow: sql<number>`SUM(CASE WHEN ${cashFlowTransactions.transactionType} = 'outflow' THEN ${cashFlowTransactions.amount}::numeric ELSE 0 END)`,
      })
        .from(cashFlowTransactions)
        .where(gte(cashFlowTransactions.transactionDate, _time.now().toISOString().slice(0, 10)))
        .groupBy(cashFlowTransactions.transactionDate)
        .orderBy(cashFlowTransactions.transactionDate)
        .limit(safeDays);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error).message || 'Prognoz topilmadi'); }
  }
}
