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
      // NOTE: `advances` table is deprecated (no writer in codebase — seed-only rows).
      // `payroll_advances` is the real writer (finance/advances flow: check-advance.handler
      // → FinanceOpsRepo.recordAdvance / FinanceActionsRepository.listAdvances).
      const r = await exec(sql`SELECT COUNT(*) AS count FROM payroll_advances WHERE status = 'pending'`);
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

  /**
   * Bo'limlar kesimida bugungi reja-fakt.
   * vision 05-director#48: faqat to'liq tugagan ishlar "fakt" (completed);
   * jarayondagi ishlar alohida ustunda (in_progress) — ikkalasi ajratilgan bucket.
   */
  async getPlanFact(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          d.name_uz AS department,
          COUNT(po.id)::int AS total,
          COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed,
          COUNT(po.id) FILTER (WHERE po.status = 'in_progress')::int AS in_progress,
          COUNT(po.id) FILTER (WHERE po.status NOT IN ('completed','cancelled'))::int AS remaining
        FROM departments d
        -- Join on org_department_id: production_orders has no plain department_id column, so
        -- the old join threw a nonexistent-column error that safeCall swallowed into []
        -- (green-lie) -- same class as the sales_orders status -> overall_status fix in
        -- get-dashboard-kpis.handler. NB: org_department_id references the org-structure world
        -- and is NULL on all rows today, so this makes the reader schema-correct (no more
        -- swallowed error) though the widget stays empty until PP writes it; the
        -- departments-vs-org_departments join target is an owner two-world call.
        LEFT JOIN production_orders po ON po.org_department_id = d.id
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
            LEFT JOIN departments d ON d.id = pp.org_department_id
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

  /** Aktiv KPI definitsiyalar uchun N-kunlik haqiqiy trend (kpi_values dan). */
  async getStatTrends(days = 7): Promise<Result<Row[]>> {
    // period_date = varchar 'YYYY-MM-DD' — text taqqoslash to_char orqali
    const cutoff = sql`to_char(CURRENT_DATE - ${days}::int, 'YYYY-MM-DD')`;
    return safeCall(async () =>
      exec(sql`
        SELECT
          kd.kpi_name AS metric,
          kd.unit,
          json_agg(json_build_object(
            'date',   kv.period_date,
            'value',  kv.actual_value::float,
            'target', kv.target_value::float,
            'status', kv.status
          ) ORDER BY kv.period_date ASC) AS trend_points
        FROM kpi_definitions kd
        JOIN kpi_values kv ON kv.kpi_id = kd.id
        WHERE kd.is_active = TRUE
          AND kv.period_date >= ${cutoff}
        GROUP BY kd.id, kd.kpi_name, kd.unit
        ORDER BY kd.kpi_name
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

  /** EP-DIR-087: 'Kechikishlar soni' + 'plan-og'ish soni' alohida (xom ikki son;
   *  sabab-kategoriya taqsimoti owner-gated, shu sababli bu yerda faqat sonlar). */
  async getPlanDeviationCounts(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          -- Kechikish soni: haqiqiy tugash sanasi rejadan kech.
          -- actual/planned_end_date = varchar (YYYY-MM-DD yoki NULL); CASE-guard
          -- ISO formatni tekshirib keyin xavfsiz ::date cast qiladi. Buzuq/bosh
          -- matn cast-crash bermaydi (Postgres CASE kafolatlangan short-circuit).
          COUNT(*) FILTER (
            WHERE CASE
              WHEN actual_end_date  ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
               AND planned_end_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN actual_end_date::date > planned_end_date::date
              ELSE false
            END
          )::int AS delay_count,
          -- Plan-ogish soni: tasdiqlangan miqdor rejadan farq qiladi (kam/kop).
          COUNT(*) FILTER (
            WHERE confirmed_quantity IS NOT NULL
              AND planned_quantity  IS NOT NULL
              AND confirmed_quantity <> planned_quantity
          )::int AS deviation_count,
          COUNT(*)::int AS total_orders
        FROM production_orders
        WHERE status <> 'cancelled'
      `), 'DB_ERROR');
  }
}
