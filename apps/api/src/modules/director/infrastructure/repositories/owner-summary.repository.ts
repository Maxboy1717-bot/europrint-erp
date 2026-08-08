/**
 * @module owner-summary.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 *
 * T21-B1 #27/#28 — owner daily digest: real SD/CRM compute for the 5 owner numbers
 * (new / lost / small customers + sales-trend + top-risk). Read-only; never writes.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result, AppError } from '@common/result';
import {
  OWNER_NEW_CUSTOMER_WINDOW_DAYS,
  OWNER_LOST_CUSTOMER_DAYS,
  OWNER_SMALL_CUSTOMER_REVENUE_UZS,
  OWNER_SALES_TREND_WINDOW_DAYS,
} from '@common/constants/business.constants';

export interface OwnerHolatSnapshot {
  level: string;
  score: number;
  detectedAt: string | null;
}

export interface OwnerSummaryNumbers {
  newCustomers: number;
  lostCustomers: number;
  smallCustomers: number;
  salesTrend: {
    currentWindow: number;
    previousWindow: number;
    deltaPct: number | null;
    windowDays: number;
  };
  topRisk: {
    customerId: number | null;
    customerName: string | null;
    churnRiskPct: number | null;
    openDebt: number | null;
  } | null;
}

@Injectable()
export class OwnerSummaryRepository {
  /**
   * Latest company holat snapshot from company_state_log (written daily by the
   * CompanyStateSnapshotCron). Graceful: no rows → NORMAL/0 (no fabrication).
   * Read-only; keeps DirectorModule decoupled from RemainingModule.
   */
  async getLatestHolat(): Promise<Result<OwnerHolatSnapshot, AppError>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ state_code: string | null; score_total: number | null; detected_at: string | null }>(sql`
        SELECT state_code, score_total, detected_at
        FROM company_state_log
        ORDER BY detected_at DESC
        LIMIT 1
      `);
      const r = rows[0];
      return {
        level: String(r?.state_code ?? 'NORMAL'),
        score: Number(r?.score_total ?? 0),
        detectedAt: r?.detected_at ?? null,
      };
    }, 'DB_ERROR');
  }

  /**
   * Compute the 5 owner numbers from live sd_customers + sales_orders.
   * Each metric is graceful: empty tables → zeros (no fabrication, Q-40).
   */
  async computeNumbers(): Promise<Result<OwnerSummaryNumbers, AppError>> {
    return safeCall(async () => {
      // (1) New customers — created within the window.
      const newRows = await typedExecute<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM sd_customers
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - (${OWNER_NEW_CUSTOMER_WINDOW_DAYS}::int * INTERVAL '1 day')
      `);

      // (2) Lost customers — had an order historically but none recently (churned).
      //     last_order_date is VARCHAR (legacy); guard the cast: only rows that look
      //     like an ISO date/datetime are compared, malformed/empty values are skipped.
      const lostRows = await typedExecute<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM sd_customers
        WHERE deleted_at IS NULL
          AND last_order_date ~ '^\d{4}-\d{2}-\d{2}'
          AND last_order_date::timestamptz < NOW() - (${OWNER_LOST_CUSTOMER_DAYS}::int * INTERVAL '1 day')
      `);

      // (3) Small customers — lifetime revenue below the small threshold (active only).
      const smallRows = await typedExecute<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM sd_customers
        WHERE deleted_at IS NULL
          AND COALESCE(total_revenue, 0) < ${OWNER_SMALL_CUSTOMER_REVENUE_UZS}::numeric
      `);

      // (4) Sales trend — current window vs previous window order value (sales_orders).
      const trendRows = await typedExecute<{ current_window: number; previous_window: number }>(sql`
        SELECT
          COALESCE(SUM(CASE
            WHEN created_at >= NOW() - (${OWNER_SALES_TREND_WINDOW_DAYS}::int * INTERVAL '1 day')
            THEN COALESCE(total_amount, total_value, 0) ELSE 0 END), 0)::numeric AS current_window,
          COALESCE(SUM(CASE
            WHEN created_at <  NOW() - (${OWNER_SALES_TREND_WINDOW_DAYS}::int * INTERVAL '1 day')
             AND created_at >= NOW() - (${OWNER_SALES_TREND_WINDOW_DAYS * 2}::int * INTERVAL '1 day')
            THEN COALESCE(total_amount, total_value, 0) ELSE 0 END), 0)::numeric AS previous_window
        FROM sales_orders
        WHERE deleted_at IS NULL
      `);

      // (5) Top risk customer — highest churn_risk_pct (tie-break by open_debt).
      const riskRows = await typedExecute<{
        id: number; name: string | null; churn_risk_pct: number | null; open_debt: number | null;
      }>(sql`
        SELECT id, name, churn_risk_pct, open_debt
        FROM sd_customers
        WHERE deleted_at IS NULL
          AND churn_risk_pct IS NOT NULL
        ORDER BY churn_risk_pct DESC, COALESCE(open_debt, 0) DESC
        LIMIT 1
      `);

      const cur = Number(trendRows[0]?.current_window ?? 0);
      const prev = Number(trendRows[0]?.previous_window ?? 0);
      const deltaPct = prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;

      const risk = riskRows[0];

      return {
        newCustomers: Number(newRows[0]?.cnt ?? 0),
        lostCustomers: Number(lostRows[0]?.cnt ?? 0),
        smallCustomers: Number(smallRows[0]?.cnt ?? 0),
        salesTrend: {
          currentWindow: cur,
          previousWindow: prev,
          deltaPct,
          windowDays: OWNER_SALES_TREND_WINDOW_DAYS,
        },
        topRisk: risk
          ? {
              customerId: risk.id,
              customerName: risk.name,
              churnRiskPct: risk.churn_risk_pct != null ? Number(risk.churn_risk_pct) : null,
              openDebt: risk.open_debt != null ? Number(risk.open_debt) : null,
            }
          : null,
      };
    }, 'DB_ERROR');
  }
}
