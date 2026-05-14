/**
 * @module dashboard-query.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DashboardQueryRepository {
  private readonly logger = new Logger(DashboardQueryRepository.name);

  async getActivePoCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM sales_orders WHERE status NOT IN ('cancelled', 'completed')`);
      return Number(r[0]?.count ?? 0);
      }, 'DB_ERROR');
  }

  async getCompletedTodayCount(today: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM production_orders WHERE status = 'completed' AND updated_at >= ${today}::timestamp`);
      return Number(r[0]?.count ?? 0);
      }, 'DB_ERROR');
  }

  async getAverageOee(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE quality_passed = true) / NULLIF(COUNT(*), 0), 1) AS avg_oee FROM mes_sessions WHERE DATE(created_at) = CURRENT_DATE`);
      return safeNum(r[0]?.avg_oee ?? '0');
      }, 'DB_ERROR');
  }

  async getMonthlyRevenue(startDate: Date, endDate: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT SUM(CAST(amount AS DECIMAL)) AS total FROM invoices WHERE created_at >= ${startDate}::timestamp AND created_at <= ${endDate}::timestamp AND status = 'paid'`);
      return safeNum(r[0]?.total ?? '0');
      }, 'DB_ERROR');
  }

  async getTopUnpaidInvoices(): Promise<Result<Array<{ invoiceId: string; amount: number; daysOverdue: number }>>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id AS invoice_id, CAST(amount AS DECIMAL) AS amount, DATE_PART('day', NOW() - due_date)::INT AS days_overdue FROM invoices WHERE status != 'paid' AND due_date < NOW() ORDER BY due_date ASC LIMIT 5`);
      return (Array.isArray(r) ? r : []).map((row) => ({ invoiceId: String(row.invoice_id), amount: safeNum(row.amount), daysOverdue: Number(row.days_overdue) }));
      }, 'DB_ERROR');
  }

  async getAdvancePending(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM advances WHERE status = 'pending'`);
      return Number(r[0]?.count ?? 0);
      }, 'DB_ERROR');
  }

  async getAttendanceToday(today: Date): Promise<Result<{ attended: number; total: number }>> {
    return safeCall(async () => {
      const [attR, totR] = await Promise.all([
        exec(sql`SELECT COUNT(DISTINCT employee_id) AS attended FROM attendance WHERE DATE(check_in_time) = ${today}::date`),
        exec(sql`SELECT COUNT(*) AS total FROM employees WHERE deleted_at IS NULL`),
      ]);
      return { attended: Number(attR[0]?.attended ?? 0), total: Number(totR[0]?.total ?? 0) };
      }, 'DB_ERROR');
  }

  async getOpenPayrollCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM payroll WHERE status = 'open'`);
      return Number(r[0]?.count ?? 0);
      }, 'DB_ERROR');
  }
}
