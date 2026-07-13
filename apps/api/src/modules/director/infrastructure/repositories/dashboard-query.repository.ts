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
          d.name AS department,
          COUNT(po.id)::int AS total,
          COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed,
          COUNT(po.id) FILTER (WHERE po.status = 'in_progress')::int AS in_progress,
          COUNT(po.id) FILTER (WHERE po.status NOT IN ('completed','cancelled'))::int AS remaining
        FROM org_departments d
        -- org_departments is canonical (owner decision 2026-07-11/13): production_orders.org_department_id
        -- FKs to org_departments(id) (verified live via \d production_orders), never to the legacy
        -- departments(id) space -- mirror-sync (org-structure/sync-helper.ts) inserts departments rows
        -- with their OWN auto-generated serial id (code = 'ORG-'+orgId), unrelated to org_departments.id,
        -- so the previous 'FROM departments d' join could never match. Same join-shape as
        -- director-data.repository.ts's getCkpDeadlineComplianceRate (FROM org_departments d ... f.card_id = d.id).
        LEFT JOIN production_orders po ON po.org_department_id = d.id
          AND DATE(po.created_at) = CURRENT_DATE
        GROUP BY d.id, d.name
        ORDER BY d.name
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
            -- org_departments canonical (owner decision 2026-07-11/13) -- see getPlanFact comment above.
            SELECT d.name FROM production_orders pp
            LEFT JOIN org_departments d ON d.id = pp.org_department_id
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

  /**
   * Buyurtma sikl-vaqt (reja vs fakt) — item #113: har buyurtma uchun ketgan/qolgan kun.
   * reja  = planned_cycle_days (start→delivery rejalashtirilgan davomiylik)
   * fakt  = days_elapsed (start→bugun); days_remaining = delivery−bugun (manfiy = kechikkan).
   * order_date jonli DB'da ko'p qatorda NULL → COALESCE(..., created_at::date) bilan real
   * start sanaga tushamiz (getPlanFact'dagi NULL-xavfsizlik uslubi bilan bir xil). Bekor
   * qilingan buyurtma (delivery_date NULL) status filtri + IS NOT NULL bilan chiqib ketadi.
   */
  async getOrderCycleTime(limit = 20): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`
        SELECT
          so.id,
          so.order_number,
          so.status,
          COALESCE(so.order_date, so.created_at::date)                                AS start_date,
          so.delivery_date::date                                                      AS delivery_date,
          (so.delivery_date::date - COALESCE(so.order_date, so.created_at::date))::int AS planned_cycle_days,
          (CURRENT_DATE - COALESCE(so.order_date, so.created_at::date))::int           AS days_elapsed,
          (so.delivery_date::date - CURRENT_DATE)::int                                AS days_remaining,
          (so.delivery_date::date < CURRENT_DATE)                                     AS is_overdue
        FROM sales_orders so
        WHERE so.status NOT IN ('cancelled','completed')
          AND so.delivery_date IS NOT NULL
        ORDER BY days_remaining ASC NULLS LAST
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

  /**
   * Priladka/setup vaqti sozlash-yo'qotish panel (EP-DIR-064 · vision 05-director#114).
   * Fleet-darajasidagi setup vs samarali vaqt va yo'qotish % (oxirgi N kun).
   * setup_seconds/main_seconds/teardown_seconds ustunlari MES/IoT bosqich
   * o'tishlari orqali yoziladi (iot-tablet.controller / drizzle-mes.repo) va
   * drizzle-iot-oee.repo tomonidan iste'mol qilinadi. Aggregate har doim bitta
   * qator qaytaradi (bo'sh to'plamda ham 0/NULL) — soxta javob emas.
   */
  async getSetupLoss(days = 30): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        SELECT
          COUNT(*)::int                                AS session_count,
          COALESCE(SUM(setup_seconds), 0)::int         AS total_setup_seconds,
          COALESCE(SUM(main_seconds), 0)::int          AS total_main_seconds,
          COALESCE(SUM(teardown_seconds), 0)::int      AS total_teardown_seconds,
          ROUND(
            100.0 * COALESCE(SUM(setup_seconds), 0)
            / NULLIF(COALESCE(SUM(setup_seconds + main_seconds + teardown_seconds), 0), 0)
          , 1)                                         AS setup_loss_pct
        FROM mes_production_sessions
        WHERE started_at >= CURRENT_DATE - ${days}::int
      `);
      return (r[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }
}
