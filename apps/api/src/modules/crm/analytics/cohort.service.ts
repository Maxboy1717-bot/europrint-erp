/**
 * @module cohort.service
 * @description Customer-cohort retention analysis. Groups customers by the
 *   month of their first purchase ("cohort") and tracks how many remain
 *   active (or how much revenue they generate) in subsequent months.
 *
 *   Two flavours:
 *     - **count**   — % of cohort customers active in period N
 *                     (1.0 = 100% retained, 0 = all churned)
 *     - **revenue** — period N revenue ÷ cohort's first-month revenue
 *                     (>1.0 = expansion, <1.0 = compression)
 *
 *   Period 0 is the cohort itself (always 1.0 by definition).
 * @layer Service (CRM analytics — pure compute over DB read)
 *
 * WHY TWO MATRICES, NOT ONE
 *   Count retention answers "do customers come back?". Revenue retention
 *   answers "do they spend more or less when they come back?". A SaaS-style
 *   business cares about revenue retention (NDR > 100% is the signal of
 *   expansion). A transactional B2B business like ours uses both — count to
 *   flag churn, revenue to flag account compression.
 *
 * WHY FIRST-PURCHASE MONTH AS COHORT KEY
 *   The standard convention. Alternative would be "first signup" or "first
 *   contact" — those need event data we don't always have for legacy
 *   customers. Using first sales_order is universally available.
 *
 * WHY 5000-ROW SQL LIMIT
 *   We expect ~10-15k orders per year. 5k limits cap analysis at ~6 months
 *   of orders at full volume — fine for current data volume. If analysis
 *   horizon grows past 18 months we need pagination or a materialised view.
 *
 * WHY THE REVENUE BASELINE IS FIRST-MONTH SPEND, NOT MONTHLY AVERAGE
 *   Convention. NDR is conventionally measured against the cohort's *entry*
 *   revenue (what they spent when they joined). Choosing an average would
 *   smooth out signup-month promotions but obscure the "are they renewing
 *   at the same level" question.
 *
 * COMPLEXITY NOTE
 *   The two `build*RetentionMatrix` methods walk the order list 3-4 times.
 *   For 5000 orders this is ~20k iterations — fine in JS. If we hit 50k+
 *   orders, port to a single-pass with a `Map<cohortMonth, ActivityBucket>`.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface OrderRecord {
  customerId: string;
  completedAt: Date;
}

export interface CohortRow {
  cohortMonth: string;
  cohortSize: number;
  retentionByPeriod: Record<number, number>;
}

export interface CohortMatrix {
  rows: CohortRow[];
  maxPeriod: number;
}

function toYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthDiff(cohortMonth: string, activityMonth: string): number {
  const [cy, cm] = cohortMonth.split('-').map(Number);
  const [ay, am] = activityMonth.split('-').map(Number);
  return (ay - cy) * 12 + (am - cm);
}

@Injectable()
export class CohortService {
  /**
   * Unified entry point for both count- and revenue-based cohort analysis.
   * Controller delegates here; mode branching is encapsulated in the service.
   */
  async buildCohortResponse(months: number, mode: 'count' | 'revenue'): Promise<CohortMatrix & { mode: string }> {
    if (mode === 'revenue') {
      const orders = await this.getRevenueOrderData(months);
      if (!orders.length) return { rows: [], maxPeriod: 0, mode };
      const result = await this.buildRevenueRetentionMatrix(orders);
      return { ...(result.ok ? result.data : { rows: [], maxPeriod: 0 }), mode };
    }

    const orders = await this.getCountOrderData(months);
    if (!orders.length) return { rows: [], maxPeriod: 0, mode };
    const result = await this.buildRetentionMatrix(orders);
    return { ...(result.ok ? result.data : { rows: [], maxPeriod: 0 }), mode };
  }

  @Calculation('crm.cohort.buildMatrix')
  async buildRetentionMatrix(orders: OrderRecord[]): Promise<Result<CohortMatrix, AppError>> {
    if (!orders.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Buyurtmalar ro\'yxati bo\'sh' });
    }

    const firstPurchaseMap = new Map<string, string>();
    for (const o of orders) {
      const month = toYearMonth(o.completedAt);
      const existing = firstPurchaseMap.get(o.customerId);
      if (!existing || month < existing) {
        firstPurchaseMap.set(o.customerId, month);
      }
    }

    const cohortMap = new Map<string, Set<string>>();
    for (const [customerId, cohortMonth] of firstPurchaseMap) {
      if (!cohortMap.has(cohortMonth)) cohortMap.set(cohortMonth, new Set());
      cohortMap.get(cohortMonth)?.add(customerId);
    }

    const activityMap = new Map<string, Set<string>>();
    for (const o of orders) {
      const key = `${firstPurchaseMap.get(o.customerId)}::${toYearMonth(o.completedAt)}`;
      if (!activityMap.has(key)) activityMap.set(key, new Set());
      const activitySet = activityMap.get(key);
      if (activitySet) activitySet.add(o.customerId);
    }

    let maxPeriod = 0;

    const rows: CohortRow[] = [];
    const sortedCohorts = [...cohortMap.keys()].sort();

    for (const cohortMonth of sortedCohorts) {
      const cohortCustomers = cohortMap.get(cohortMonth);
      if (!cohortCustomers) continue;
      const cohortSize = cohortCustomers.size;
      const retentionByPeriod: Record<number, number> = {};

      const activityMonths = new Set<string>();
      for (const [key] of activityMap) {
        if (key.startsWith(`${cohortMonth}::`)) {
          activityMonths.add(key.replace(`${cohortMonth}::`, ''));
        }
      }

      for (const actMonth of activityMonths) {
        const period = monthDiff(cohortMonth, actMonth);
        if (period < 0) continue;
        const activeCustomers = activityMap.get(`${cohortMonth}::${actMonth}`);
        if (!activeCustomers) continue;
        const retained = ([...activeCustomers]).filter(id => cohortCustomers.has(id)).length;
        retentionByPeriod[period] = safeDiv(retained, cohortSize);
        if (period > maxPeriod) maxPeriod = period;
      }

      retentionByPeriod[0] = 1.0;

      rows.push({ cohortMonth, cohortSize, retentionByPeriod });
    }

    return Ok({ rows, maxPeriod });
  }

  async getCountOrderData(months: number): Promise<OrderRecord[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString();

    const rows = await runQuery<{ customer_id: string; completed_at: string }>(sql`
      SELECT customer_id::text, created_at::text AS completed_at
      FROM sales_orders
      WHERE customer_id IS NOT NULL
        AND created_at IS NOT NULL
        AND created_at >= ${cutoffStr}
      ORDER BY created_at ASC
      LIMIT 5000
    `);

    return rows.map(r => ({ customerId: r.customer_id, completedAt: new Date(r.completed_at) }));
  }

  async getRevenueOrderData(months: number): Promise<Array<OrderRecord & { revenue: number }>> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString();

    const rows = await runQuery<{ customer_id: string; completed_at: string; revenue: number }>(sql`
      SELECT customer_id::text,
             created_at::text AS completed_at,
             COALESCE(total_amount, 0)::float AS revenue
      FROM sales_orders
      WHERE customer_id IS NOT NULL
        AND created_at IS NOT NULL
        AND created_at >= ${cutoffStr}
      ORDER BY created_at ASC
      LIMIT 5000
    `);

    return rows.map(r => ({
      customerId:  r.customer_id,
      completedAt: new Date(r.completed_at),
      revenue:     r.revenue,
    }));
  }

  @Calculation('crm.cohort.buildRevenueMatrix')
  async buildRevenueRetentionMatrix(orders: Array<OrderRecord & { revenue: number }>): Promise<Result<CohortMatrix, AppError>> {
    if (!orders.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Buyurtmalar ro\'yxati bo\'sh' });
    }

    const firstPurchaseMap = new Map<string, string>();
    for (const o of orders) {
      const month = toYearMonth(o.completedAt);
      const existing = firstPurchaseMap.get(o.customerId);
      if (!existing || month < existing) firstPurchaseMap.set(o.customerId, month);
    }

    const cohortRevenueMap = new Map<string, number>();
    for (const [customerId, cohortMonth] of firstPurchaseMap) {
      const cohortOrders = orders.filter(o => o.customerId === customerId && toYearMonth(o.completedAt) === cohortMonth);
      const rev = cohortOrders.reduce((s, o) => s + (o.revenue ?? 0), 0);
      cohortRevenueMap.set(cohortMonth, (cohortRevenueMap.get(cohortMonth) ?? 0) + rev);
    }

    const cohortCustomers = new Map<string, Set<string>>();
    for (const [customerId, cohortMonth] of firstPurchaseMap) {
      if (!cohortCustomers.has(cohortMonth)) cohortCustomers.set(cohortMonth, new Set());
      cohortCustomers.get(cohortMonth)?.add(customerId);
    }

    const periodRevMap = new Map<string, number>();
    for (const o of orders) {
      const cohortMonth = firstPurchaseMap.get(o.customerId);
      if (!cohortMonth) continue;
      const actMonth = toYearMonth(o.completedAt);
      const key = `${cohortMonth}::${actMonth}`;
      periodRevMap.set(key, (periodRevMap.get(key) ?? 0) + (o.revenue ?? 0));
    }

    let maxPeriod = 0;
    const rows: CohortRow[] = [];

    for (const cohortMonth of [...cohortCustomers.keys()].sort()) {
      const baseRev = cohortRevenueMap.get(cohortMonth) ?? 1;
      const cohortSize = cohortCustomers.get(cohortMonth)?.size ?? 0;
      const retentionByPeriod: Record<number, number> = { 0: 1.0 };

      const periodKeys = ([...periodRevMap.keys()]).filter(k => k.startsWith(`${cohortMonth}::`));
      for (const key of periodKeys) {
        const actMonth = key.replace(`${cohortMonth}::`, '');
        const period = monthDiff(cohortMonth, actMonth);
        if (period < 0) continue;
        const rev = periodRevMap.get(key) ?? 0;
        retentionByPeriod[period] = safeDiv(rev, baseRev);
        if (period > maxPeriod) maxPeriod = period;
      }

      rows.push({ cohortMonth, cohortSize, retentionByPeriod });
    }

    return Ok({ rows, maxPeriod });
  }
}
