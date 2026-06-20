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
        accountCode: accounts.accountCode,
        accountName: accounts.accountName,
        accountType: accounts.accountType,
        debitBalance: sql<number>`COALESCE(SUM(CASE WHEN ${entries.debitAccountId} = ${accounts.id} THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
        creditBalance: sql<number>`COALESCE(SUM(CASE WHEN ${entries.creditAccountId} = ${accounts.id} THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
      })
        .from(accounts)
        .leftJoin(entries, sql`EXTRACT(YEAR FROM ${entries.createdAt}) = ${year}`)
        .where(eq(accounts.isActive, true))
        .groupBy(accounts.id, accounts.accountCode, accounts.accountName, accounts.accountType)
        .orderBy(accounts.accountCode);
      const totalDebit = rows.reduce((s, r) => s + Number(r.debitBalance), 0);
      const totalCredit = rows.reduce((s, r) => s + Number(r.creditBalance), 0);
      return Ok({
        accounts: rows,
        totals: { debitBalance: totalDebit, creditBalance: totalCredit },
        asOfDate: _time.now().toISOString(),
      } as unknown as object[]);
    } catch (e: unknown) { return Err((e as Error).message || 'Sinov balansi topilmadi'); }
  }

  async findProfitLoss(from?: string, to?: string): Promise<Result<Record<string, unknown>>> {
    try {
      const fromDate = from ?? `${_time.now().getFullYear()}-01-01`;
      const toDate = to ?? _time.now().toISOString().slice(0, 10);
      // FIX 1: UPPER(account_type) to handle DB stores 'REVENUE'/'EXPENSE' (uppercase)
      // FIX 2: GROUP BY account to return per-account rows for FE shape
      const [revenueRows, expenseRows] = await Promise.all([
        db.select({ accountName: accounts.accountName, total: sum(entries.amount) })
          .from(entries)
          .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
          .where(sql`UPPER(${accounts.accountType}) = 'REVENUE' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`)
          .groupBy(accounts.accountName),
        db.select({ accountName: accounts.accountName, total: sum(entries.amount) })
          .from(entries)
          .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
          .where(sql`UPPER(${accounts.accountType}) = 'EXPENSE' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`)
          .groupBy(accounts.accountName),
      ]);
      const revenues = revenueRows
        .filter(r => r.accountName != null)
        .map(r => ({ accountName: r.accountName as string, amount: Number(r.total || 0) }));
      const expenses = expenseRows
        .filter(r => r.accountName != null)
        .map(r => ({ accountName: r.accountName as string, amount: Number(r.total || 0) }));
      const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
      const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
      return Ok({
        period: { startDate: fromDate, endDate: toDate },
        revenues,
        expenses,
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        from: fromDate,
        to: toDate,
      });
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
