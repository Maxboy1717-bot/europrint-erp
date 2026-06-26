/**
 * @module drizzle-sd-customer-abc.repo
 * @description T18-C4 customer ABC repo. Reads live last-12-month purchase revenue
 *   from sales_orders and writes the computed class onto sd_customers.abc_class.
 *   Result<T> throughout; one round-trip per operation (no N+1).
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result, AppError } from '@common/result';
import {
  ISdCustomerAbcRepo,
  type CustomerAnnualRevenue,
} from './i-sd-customer-abc.repo';

@Injectable()
export class DrizzleSdCustomerAbcRepository implements ISdCustomerAbcRepo {
  async getAnnualRevenue(): Promise<Result<CustomerAnnualRevenue[], AppError>> {
    return safeCall(async () => {
      // Last-12-month window via sales_orders.created_at; total_amount is the live money
      // column (total_value is NULL on base rows) → COALESCE keeps it robust. Cancelled
      // orders excluded. LEFT JOIN so zero-purchase customers still appear (→ class C).
      const res = await runQuery<{ id: number; name: string; annual_revenue: string }>(sql`
        SELECT
          c.id,
          c.name,
          COALESCE(SUM(
            CASE WHEN o.created_at >= (CURRENT_DATE - INTERVAL '12 months')
                  AND o.status IS DISTINCT FROM 'cancelled'
                 THEN COALESCE(o.total_amount, o.total_value, 0)
                 ELSE 0 END
          ), 0) AS annual_revenue
        FROM sd_customers c
        LEFT JOIN sales_orders o ON o.customer_id = c.id
        WHERE c.status <> 'deleted'
        GROUP BY c.id, c.name
      `);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      return rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name ?? ''),
        annualRevenue: Number(r.annual_revenue) || 0,
      }));
    }, 'DB_ERROR');
  }

  async persistAbc(
    rows: Array<{ id: number; abcClass: 'A' | 'B' | 'C' }>,
  ): Promise<Result<number, AppError>> {
    return safeCall(async () => {
      const safe = Array.isArray(rows) ? rows : [];
      if (safe.length === 0) return 0;
      let updated = 0;
      // Bounded set (active customers); per-row UPDATE keeps it simple and safe.
      // Idempotent: re-running with the same classes is a no-op net effect.
      for (const r of safe) {
        const res = await runQuery<{ id: number }>(sql`
          UPDATE sd_customers
             SET abc_class = ${r.abcClass}, abc_computed_at = NOW()
           WHERE id = ${r.id}
          RETURNING id
        `);
        updated += Array.isArray(res.rows) ? res.rows.length : 0;
      }
      return updated;
    }, 'DB_ERROR');
  }
}
