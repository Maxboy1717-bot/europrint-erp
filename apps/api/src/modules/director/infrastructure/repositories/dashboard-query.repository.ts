/**
 * @module dashboard-query.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import type { IDashboardQueryRepo } from '../../domain/repositories/i-dashboard-query.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DashboardQueryRepository implements IDashboardQueryRepo {
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
      const r = await exec(sql`SELECT COUNT(*) AS count FROM payroll_periods WHERE status = 'open'`);
      return Number(r[0]?.count ?? 0);
      }, 'DB_ERROR');
  }

  // ── P30 EP-DIR-025/036/053/073: dashboard kengaytma ────────────────────────

  /** Bo'limlar kesimida bugungi reja-fakt (total/completed/remaining). */
  async getPlanFact(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          d.name_uz AS department,
          COUNT(po.id)::int AS total,
          COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed,
          COUNT(po.id) FILTER (WHERE po.status NOT IN ('completed','cancelled'))::int AS remaining
        FROM departments d
        LEFT JOIN production_orders po ON po.department_id = d.id
          AND DATE(po.created_at) = CURRENT_DATE
        GROUP BY d.id, d.name_uz
        ORDER BY d.name_uz
      `), 'DB_ERROR');
  }

  /** Eng kam tayyor buyurtmalar (readiness_pct) — joriy bo'lim bilan. */
  async getOrderProgress(limit = 5): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          so.id, so.order_number,
          ROUND(100.0 * COUNT(po.id) FILTER (WHERE po.status='completed')
                / NULLIF(COUNT(po.id), 0), 1) AS readiness_pct,
          (
            SELECT d.name_uz FROM production_orders pp
            LEFT JOIN departments d ON d.id = pp.department_id
            WHERE pp.sales_order_id = so.id AND pp.status = 'in_progress'
            ORDER BY pp.created_at DESC LIMIT 1
          ) AS current_department
        FROM sales_orders so
        LEFT JOIN production_orders po ON po.sales_order_id = so.id
        WHERE so.status NOT IN ('cancelled','completed')
        GROUP BY so.id, so.order_number
        ORDER BY readiness_pct ASC NULLS FIRST
        LIMIT ${limit}
      `), 'DB_ERROR');
  }

  /** Aktiv stat-reglamentlar uchun N-kunlik trend skeleti (UI to'ldiradi). */
  async getStatTrends(days = 7): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          sr.name_uz AS metric,
          sr.unit AS unit,
          json_agg(json_build_object(
            'date', to_char(d::date, 'YYYY-MM-DD'),
            'value', 0
          ) ORDER BY d ASC) AS trend_points
        FROM stat_regulations sr
        CROSS JOIN generate_series(
          CURRENT_DATE - ${days}::int,
          CURRENT_DATE,
          interval '1 day'
        ) d
        WHERE sr.is_active = TRUE
        GROUP BY sr.id, sr.name_uz, sr.unit
        ORDER BY sr.name_uz
      `), 'DB_ERROR');
  }

  /** Bugungi hal qilinmagan (draft) kundalik muammolar. */
  async getOpenIssues(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT author_card_id, date, main_issue
        FROM diary_entries
        WHERE status = 'draft' AND main_issue IS NOT NULL
          AND date = CURRENT_DATE
        ORDER BY author_card_id
      `), 'DB_ERROR');
  }
}
