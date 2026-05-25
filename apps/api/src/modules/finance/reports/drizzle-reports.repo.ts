/**
 * @module drizzle-reports.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { entries, accounts, financialKPIs, dailyFinancialMetrics } from '@europrint/schemas';
import { eq, sql, desc, sum, count, gte } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceReportsRepository } from './i-reports.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class DrizzleFinanceReportsRepository implements IFinanceReportsRepository {
  async findTrialBalance(fiscalYear?: number): Promise<Result<object[]>> {
    try {
      const year = fiscalYear ?? _time.now().getFullYear();
      const rows = await db.select({
        code: accounts.accountCode,
        name: accounts.accountName,
        type: accounts.accountType,
        debit: sql<number>`COALESCE(SUM(CASE WHEN ${entries.debitAccountId} = ${accounts.id}::varchar THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
        credit: sql<number>`COALESCE(SUM(CASE WHEN ${entries.creditAccountId} = ${accounts.id}::varchar THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
      })
        .from(accounts)
        .leftJoin(entries, sql`EXTRACT(YEAR FROM ${entries.createdAt}) = ${year}`)
        .where(eq(accounts.isActive, true))
        .groupBy(accounts.id, accounts.accountCode, accounts.accountName, accounts.accountType)
        .orderBy(accounts.accountCode);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error).message || 'Sinov balansi topilmadi'); }
  }

  async findProfitLoss(from?: string, to?: string): Promise<Result<Record<string, unknown>>> {
    try {
      const fromDate = from ?? `${_time.now().getFullYear()}-01-01`;
      const toDate = to ?? _time.now().toISOString().slice(0, 10);
      const [revenue, expense] = await Promise.all([
        db.select({ total: sum(entries.amount) })
          .from(entries)
          .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
          .where(sql`${accounts.accountType} = 'revenue' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`),
        db.select({ total: sum(entries.amount) })
          .from(entries)
          .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
          .where(sql`${accounts.accountType} = 'expense' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`),
      ]);
      const totalRevenue = Number(revenue[0]?.total || 0);
      const totalExpense = Number(expense[0]?.total || 0);
      return Ok({ from: fromDate, to: toDate, totalRevenue, totalExpense, netProfit: totalRevenue - totalExpense });
    } catch (e: unknown) { return Err((e as Error).message || 'Foyda-zarar topilmadi'); }
  }

  async findWeeklySummary(): Promise<Result<Record<string, unknown>>> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY).toISOString().slice(0, 10);
      const rows = await db.select({
        date: dailyFinancialMetrics.metricDate,
        totalRevenue: dailyFinancialMetrics.totalRevenue,
        totalExpenses: dailyFinancialMetrics.totalExpenses,
        grossProfit: dailyFinancialMetrics.grossProfit,
      })
        .from(dailyFinancialMetrics)
        .where(gte(dailyFinancialMetrics.metricDate, sevenDaysAgo))
        .orderBy(dailyFinancialMetrics.metricDate);
      return Ok({ period: 'weekly', data: rows });
    } catch (e: unknown) { return Err((e as Error).message || 'Haftalik hisobot topilmadi'); }
  }

  async findMonthlySummary(year?: number): Promise<Result<object[]>> {
    try {
      const targetYear = year ?? _time.now().getFullYear();
      const rows = await db.select({
        date: dailyFinancialMetrics.metricDate,
        totalRevenue: dailyFinancialMetrics.totalRevenue,
        totalExpenses: dailyFinancialMetrics.totalExpenses,
        grossProfit: dailyFinancialMetrics.grossProfit,
      })
        .from(dailyFinancialMetrics)
        .where(sql`EXTRACT(YEAR FROM ${dailyFinancialMetrics.metricDate}::date) = ${targetYear}`)
        .orderBy(dailyFinancialMetrics.metricDate);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error).message || 'Oylik hisobot topilmadi'); }
  }

  async findKpiDashboard(): Promise<Result<Record<string, unknown>>> {
    try {
      const [kpis, total] = await Promise.all([
        db.select().from(financialKPIs).orderBy(desc(financialKPIs.kpiDate)).limit(10),
        db.select({ count: count() }).from(financialKPIs),
      ]);
      return Ok({ kpis, total: Number(total[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'KPI topilmadi'); }
  }
}
