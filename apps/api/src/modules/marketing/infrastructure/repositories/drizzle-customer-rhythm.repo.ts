/**
 * @module drizzle-customer-rhythm.repo
 * @description Repository / data-access layer for customer purchase-rhythm (vision 14-marketing #11).
 *   Reads sales_orders + marketing_settings; returns Result<T> from @common/result; never throws.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Ok, Err, Result, AppErr } from '@common/result';

/** marketing_settings.key under which the configurable N (min orders) is stored. */
export const RHYTHM_MIN_ORDERS_KEY = 'rhythm_min_orders';
/** Vision 14-marketing #11 default: rhythm is computed after the first 3 orders. */
export const RHYTHM_MIN_ORDERS_DEFAULT = 3;

/** Raw per-customer order-interval aggregate over COALESCE(order_date, created_at). */
export interface CustomerOrderRhythmRow {
  orderCount: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  /** Mean days between consecutive orders = span / (orderCount - 1); null when < 2 orders. */
  avgIntervalDays: number | null;
  /** CURRENT_DATE - lastOrderDate; null when the customer has no orders. */
  daysSinceLastOrder: number | null;
}

@Injectable()
export class DrizzleCustomerRhythmRepository {
  private readonly logger = new Logger(DrizzleCustomerRhythmRepository.name);

  /**
   * Configurable N (minimum orders before rhythm is meaningful).
   * Reads marketing_settings key='rhythm_min_orders'; falls back to the vision
   * default (3) when unset or non-numeric. Owner sets it via POST /marketing/settings.
   */
  async getRhythmMinOrders(): Promise<Result<number>> {
    try {
      const rows = await typedExecute<{ value: string | null }>(sql`
        SELECT value FROM marketing_settings WHERE key = ${RHYTHM_MIN_ORDERS_KEY} LIMIT 1
      `);
      const raw = Array.isArray(rows) && rows[0] ? rows[0].value : null;
      const parsed = raw != null ? Number.parseInt(String(raw), 10) : NaN;
      const n = Number.isFinite(parsed) && parsed >= 1 ? parsed : RHYTHM_MIN_ORDERS_DEFAULT;
      return Ok(n);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  /**
   * Per-customer purchase rhythm from sales_orders. Uses COALESCE(order_date,
   * created_at::date) because order_date is not always populated in this build.
   * avgIntervalDays = (last - first) / (count - 1) — the mean gap between orders.
   */
  async getCustomerOrderRhythm(customerId: number): Promise<Result<CustomerOrderRhythmRow>> {
    try {
      const rows = await typedExecute<{
        order_count: number;
        first_order: string | null;
        last_order: string | null;
        avg_interval_days: string | null;
        days_since_last: number | null;
      }>(sql`
        WITH o AS (
          SELECT COALESCE(order_date, created_at::date) AS d
          FROM sales_orders
          WHERE customer_id = ${customerId} AND deleted_at IS NULL
        )
        SELECT
          count(*)::int AS order_count,
          min(d) AS first_order,
          max(d) AS last_order,
          CASE WHEN count(*) > 1
            THEN round((max(d) - min(d))::numeric / (count(*) - 1), 1)
            ELSE NULL END AS avg_interval_days,
          CASE WHEN count(*) > 0
            THEN (CURRENT_DATE - max(d))
            ELSE NULL END AS days_since_last
        FROM o
      `);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      const orderCount = row ? Number(row.order_count) : 0;
      return Ok({
        orderCount,
        firstOrderDate: row?.first_order ?? null,
        lastOrderDate: row?.last_order ?? null,
        avgIntervalDays: row?.avg_interval_days != null ? Number(row.avg_interval_days) : null,
        daysSinceLastOrder: row?.days_since_last != null ? Number(row.days_since_last) : null,
      });
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
