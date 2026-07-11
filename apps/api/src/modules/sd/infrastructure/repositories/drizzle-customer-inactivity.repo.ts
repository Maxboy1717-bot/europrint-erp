/**
 * @module drizzle-customer-inactivity.repo
 * @description 06-sd #27 — nightly inactive-customer sweep. Reads the per-ABC
 *   inactivity thresholds from crm_inactivity_rules (A=90/B=60/C=30) and flags
 *   sd_customers whose most-recent non-cancelled sales_orders.created_at is older
 *   than their class threshold. Raw SQL via runQuery (RULE4_EXCEPTION: multi-CTE
 *   set-based sweep, no Drizzle builder equivalent) — no table-object imports.
 *   Result<T> throughout (Qoida 1); repo owns DB (Qoida 15); one round-trip.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result, AppError } from '@common/result';

export interface InactivityRule {
  abcClass: string;
  inactiveDays: number;
}

export interface InactivityRefresh {
  evaluated: number; // customers swept this run
  flagged: number;   // customers currently is_inactive = true after the sweep
}

@Injectable()
export class DrizzleCustomerInactivityRepository {
  /** The seeded per-ABC thresholds (empty only if the seed migration never ran). */
  async listRules(): Promise<Result<InactivityRule[], AppError>> {
    return safeCall(async () => {
      const res = await runQuery<{ abc_class: string; inactive_days: number }>(sql`
        SELECT abc_class, inactive_days
          FROM crm_inactivity_rules
         ORDER BY abc_class
      `);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      return rows.map((r) => ({
        abcClass: String(r.abc_class),
        inactiveDays: Number(r.inactive_days) || 0,
      }));
    }, 'DB_ERROR');
  }

  /**
   * Set-based nightly sweep. For every non-deleted customer, flag is_inactive when
   * the last non-cancelled order predates (now - class_threshold_days); clear the
   * flag otherwise. Idempotent (same inputs -> same flags) and reversible (a fresh
   * order clears the flag on the next run). Customers with no orders are never
   * flagged (no "last order" to age).
   */
  async refreshInactivity(): Promise<Result<InactivityRefresh, AppError>> {
    return safeCall(async () => {
      const res = await runQuery<{ id: number; is_inactive: boolean }>(sql`
        WITH last_order AS (
          SELECT c.id AS customer_id,
                 MAX(o.created_at) FILTER (WHERE o.status IS DISTINCT FROM 'cancelled') AS last_order_at
            FROM sd_customers c
            LEFT JOIN sales_orders o ON o.customer_id = c.id
           WHERE c.deleted_at IS NULL
           GROUP BY c.id
        ),
        evaluated AS (
          SELECT lo.customer_id,
                 (lo.last_order_at IS NOT NULL
                  AND lo.last_order_at < (now() - make_interval(days => r.inactive_days))
                 ) AS should_flag
            FROM last_order lo
            JOIN sd_customers c ON c.id = lo.customer_id
            JOIN crm_inactivity_rules r ON r.abc_class = COALESCE(c.abc_class, 'C')
        )
        UPDATE sd_customers sc
           SET is_inactive           = e.should_flag,
               inactive_since        = CASE
                                         WHEN e.should_flag AND sc.inactive_since IS NULL THEN now()
                                         WHEN NOT e.should_flag THEN NULL
                                         ELSE sc.inactive_since
                                       END,
               inactivity_checked_at = now()
          FROM evaluated e
         WHERE sc.id = e.customer_id
        RETURNING sc.id, sc.is_inactive
      `);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      const flagged = rows.filter((r) => r.is_inactive === true).length;
      return { evaluated: rows.length, flagged };
    }, 'DB_ERROR');
  }
}
