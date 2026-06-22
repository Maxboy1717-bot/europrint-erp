/**
 * @module company-state.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * EP-DIR-001 wiring: this repo now also exposes the configurable holat inputs
 *   - state_thresholds   (per-metric weights + per-level value bands, 25 rows)
 *   - company_state_levels (5 level labels/colors)
 *   - the 5 live raw metric values (cash_flow / production_plan / orders / hr / quality)
 * so CompanyStateService can delegate scoring to DirectorHolatService instead of
 * the legacy 3-metric hardcoded formula.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

/** One row of state_thresholds: a per-metric, per-level configurable band. */
export interface StateThresholdRow {
  metric_key: string;
  level_code: string;
  min_value: number | null;
  max_value: number | null;
  weight: number;
}

/** One row of company_state_levels: display metadata for a holat level. */
export interface StateLevelRow {
  code: string;
  label_uz: string;
  label_ru: string;
  color_hex: string;
  rank: number;
}

/** Live raw metric values, in the units the state_thresholds bands expect. */
export interface RawMetricValues {
  /** Month net cash (paid revenue − paid/partial purchases), absolute so'm. */
  cash_flow: number;
  /** Production plan attainment %, produced / target * 100 (0 when no target). */
  production_plan: number;
  /** Order completion %, done / total * 100 (0 when no orders). */
  orders: number;
  /** Workforce availability %, active / total employees * 100. */
  hr: number;
  /** Output quality %, (produced − defect) / produced * 100 (100 when no output). */
  quality: number;
  /** Supporting figures the FE KPI cards consume (preserve legacy shape). */
  revenue: number;
  expenses: number;
  totalEmployees: number;
  activeEmployees: number;
  activeOrders: number;
}

@Injectable()
export class CompanyStateRepository {
  // -------------------------------------------------------------------------
  // Configurable holat inputs (EP-DIR-001) — read from DB, never hardcoded
  // -------------------------------------------------------------------------

  /** Read all 25 state_thresholds rows (weights + per-level value bands). */
  async getStateThresholds(): Promise<Result<StateThresholdRow[]>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT metric_key, level_code, min_value, max_value, weight FROM state_thresholds`);
      return (Array.isArray(r) ? r : []).map((row) => ({
        metric_key: String(row.metric_key ?? ''),
        level_code: String(row.level_code ?? ''),
        min_value: row.min_value == null ? null : Number(row.min_value),
        max_value: row.max_value == null ? null : Number(row.max_value),
        weight: Number(row.weight ?? 0),
      }));
    }, 'DB_ERROR');
  }

  /** Read the 5 company_state_levels rows (display labels/colors). */
  async getStateLevels(): Promise<Result<StateLevelRow[]>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT code, label_uz, label_ru, color_hex, rank FROM company_state_levels ORDER BY rank DESC`);
      return (Array.isArray(r) ? r : []).map((row) => ({
        code: String(row.code ?? ''),
        label_uz: String(row.label_uz ?? ''),
        label_ru: String(row.label_ru ?? ''),
        color_hex: String(row.color_hex ?? ''),
        rank: Number(row.rank ?? 0),
      }));
    }, 'DB_ERROR');
  }

  // -------------------------------------------------------------------------
  // Live raw metric values — real data, one round trip
  // -------------------------------------------------------------------------

  /**
   * Compute the 5 raw metric values (plus FE KPI support figures) from live data.
   * Uses COALESCE / guards so an empty build-stage DB yields finite numbers.
   */
  async getRawMetrics(): Promise<Result<RawMetricValues>> {
    return safeCall(async () => {
      const r = await exec(sql`
        WITH cash AS (
          SELECT
            COALESCE((SELECT SUM(total_amount) FROM sales_invoices
                      WHERE payment_status = 'paid'
                        AND created_at >= date_trunc('month', CURRENT_DATE)), 0) AS revenue,
            COALESCE((SELECT SUM(total_amount) FROM purchase_invoices
                      WHERE payment_status IN ('paid','partial')
                        AND created_at >= date_trunc('month', CURRENT_DATE)), 0) AS expenses
        ),
        emp AS (
          SELECT COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE status = 'active') AS active
          FROM employees
        ),
        ord AS (
          SELECT
            COUNT(*) FILTER (WHERE status IN ('completed','delivered','closed','fully_paid')) AS done,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status NOT IN ('cancelled','fully_paid','delivered')) AS open_cnt
          FROM sales_orders
        ),
        prod AS (
          SELECT
            COALESCE(SUM(target_quantity), 0) AS target,
            COALESCE(SUM(COALESCE(produced_qty, actual_quantity, 0)), 0) AS produced,
            COALESCE(SUM(COALESCE(defect_qty, defect_quantity, 0)), 0) AS defect
          FROM production_sessions
          WHERE deleted_at IS NULL
        )
        SELECT
          cash.revenue, cash.expenses,
          emp.total AS emp_total, emp.active AS emp_active,
          ord.done AS ord_done, ord.total AS ord_total, ord.open_cnt AS ord_open,
          prod.target AS prod_target, prod.produced AS prod_produced, prod.defect AS prod_defect
        FROM cash, emp, ord, prod
      `);
      const row = (Array.isArray(r) ? r[0] : undefined) ?? {};
      const num = (v: unknown): number => {
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const revenue = num(row.revenue);
      const expenses = num(row.expenses);
      const empTotal = num(row.emp_total);
      const empActive = num(row.emp_active);
      const ordDone = num(row.ord_done);
      const ordTotal = num(row.ord_total);
      const ordOpen = num(row.ord_open);
      const prodTarget = num(row.prod_target);
      const prodProduced = num(row.prod_produced);
      const prodDefect = num(row.prod_defect);

      const cash_flow = revenue - expenses;
      const production_plan = prodTarget > 0
        ? Math.min(100, (prodProduced / prodTarget) * 100)
        : 0;
      const orders = ordTotal > 0 ? (ordDone / ordTotal) * 100 : 0;
      const hr = empTotal > 0 ? (empActive / empTotal) * 100 : 0;
      const quality = prodProduced > 0
        ? Math.max(0, ((prodProduced - prodDefect) / prodProduced) * 100)
        : 100;

      return {
        cash_flow,
        production_plan,
        orders,
        hr,
        quality,
        revenue,
        expenses,
        totalEmployees: empTotal,
        activeEmployees: empActive,
        activeOrders: ordOpen,
      };
    }, 'DB_ERROR');
  }
}
