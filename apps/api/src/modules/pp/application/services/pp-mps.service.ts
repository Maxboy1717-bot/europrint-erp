/**
 * @module pp-mps.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { MpsAtpHandler } from '../queries/mps-atp.handler';

export interface MpsRow2 {
  productId: string;
  period: string;
  quantity: number;
  dueDate: string;
  source: string;
  atp?: number;
  canPromise?: boolean;
}

@Injectable()
export class PpMpsService {
  private readonly logger = new Logger(PpMpsService.name);

  constructor(private readonly atpHandler: MpsAtpHandler) {}

  async getMps(productId?: string): Promise<Result<MpsRow2[], AppError>> {
    try {
      const rawItems = await this.loadRows(productId);
      const onHandMap = await this.loadOnHand();
      const committedByProduct = await this.loadCommittedDemand();
      const atpByProduct = await this.buildAtpMap(rawItems, onHandMap, committedByProduct);
      return Ok(this.buildResult(rawItems, atpByProduct));
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  private async loadRows(productId?: string): Promise<Record<string, unknown>[]> {
    // Primary source: mps_periods table (Sprint-2 schema: period, quantity, due_date, source).
    // Migration ensures these columns exist on pre-existing tables via ALTER TABLE + backfill.
    // Errors propagate; empty result triggers legitimate fallback to production_orders.
    const mpsQuery = await runQuery(sql`
      SELECT product_id::text AS product_id,
             COALESCE(period, '')  AS period,
             COALESCE(quantity, 0)::numeric AS quantity,
             COALESCE(due_date, '') AS due_date,
             COALESCE(source, 'manual') AS source,
             CASE WHEN due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                  THEN EXTRACT(WEEK FROM due_date::date)::integer
                  ELSE 0
             END AS week_num
      FROM mps_periods
      WHERE TRUE
        ${productId ? sql`AND product_id::text = ${productId}` : sql``}
      ORDER BY due_date NULLS LAST
      LIMIT 200
    `);

    if (mpsQuery.rows && mpsQuery.rows.length > 0) return mpsQuery.rows;

    const fallback = await runQuery(sql`
      SELECT product_id::text AS product_id,
             CONCAT('Hafta ', EXTRACT(WEEK FROM planned_start_date::date)::integer) AS period,
             planned_quantity::numeric AS quantity,
             planned_start_date AS due_date,
             status AS source,
             EXTRACT(WEEK FROM planned_start_date::date)::integer AS week_num
      FROM production_orders
      WHERE status NOT IN ('completed', 'cancelled')
        AND planned_start_date IS NOT NULL
        ${productId ? sql`AND product_id::text = ${productId}` : sql``}
      ORDER BY planned_start_date
      LIMIT 200
    `);
    return fallback.rows ?? [];
  }

  private async loadOnHand(): Promise<Record<string, number>> {
    const rows = await runQuery(sql`
      SELECT id::text AS product_id,
             GREATEST(current_stock, 0)::numeric AS on_hand
      FROM material_cards WHERE is_active = true
    `);
    const map: Record<string, number> = {};
    for (const r of rows.rows ?? []) map[String(r['product_id'])] = safeNum(r['on_hand']);
    return map;
  }

  private async loadCommittedDemand(): Promise<Map<string, Map<number, number>>> {
    // Errors propagate: a failed committed-demand query produces incorrect ATP; fail fast.
    // Order line-items bind to product_id (finished goods the customer orders, owner 2026-06-05);
    // COALESCE falls back to legacy material_id for any pre-existing rows. Integer join to
    // sales_orders.id; delivery_date is timestamptz so cast ::date (NULL falls back to created_at).
    const rows = await runQuery(sql`
      SELECT COALESCE(soi.product_id, soi.material_id)::text AS product_id,
             COALESCE(soi.order_quantity, 0)::numeric AS qty,
             EXTRACT(WEEK FROM COALESCE(so.delivery_date::date, so.created_at::date))::integer AS week_num
      FROM sales_order_items soi
      JOIN sales_orders so ON so.id = soi.sales_order_id
      WHERE so.status NOT IN ('cancelled', 'delivered')
        AND COALESCE(so.delivery_date::date, so.created_at::date) >= CURRENT_DATE - 28
      ORDER BY so.delivery_date NULLS LAST
      LIMIT 500
    `);

    const map = new Map<string, Map<number, number>>();
    for (const r of rows.rows ?? []) {
      const pid = String(r['product_id']);
      let pidMap = map.get(pid);
      if (!pidMap) { pidMap = new Map(); map.set(pid, pidMap); }
      const wk = safeNum(r['week_num']);
      pidMap.set(wk, (pidMap.get(wk) ?? 0) + safeNum(r['qty']));
    }
    return map;
  }

  private async buildAtpMap(
    rawItems: Record<string, unknown>[],
    onHandMap: Record<string, number>,
    committedByProduct: Map<string, Map<number, number>>,
  ): Promise<Map<string, { atp: number; canPromise: boolean }[]>> {
    const groups = new Map<string, Array<{ weekNum: number; qty: number }>>();
    for (const r of rawItems) {
      const pid = String(r['product_id']);
      let pidGroup = groups.get(pid);
      if (!pidGroup) { pidGroup = []; groups.set(pid, pidGroup); }
      pidGroup.push({ weekNum: safeNum(r['week_num']), qty: safeNum(r['quantity']) });
    }
    const result = new Map<string, { atp: number; canPromise: boolean }[]>();
    for (const [pid, entries] of groups) {
      // period = 0-based index relative to earliest week; weekNum drives committed-demand lookup
      const mpsEntries = (Array.isArray(entries) ? entries : []).map((e, i) => ({ period: i, quantity: e.qty }));
      const committedMap = committedByProduct.get(pid) ?? new Map<number, number>();
      // Map committed demand using actual week numbers (not sequential index)
      const committedOrders = entries
        .map((e, i) => ({ period: i, qty: committedMap.get(e.weekNum) ?? 0 }))
        .filter((o) => o.qty > 0);
      const atpResult = await this.atpHandler.calculateAtp({
        productId: pid, onHand: onHandMap[pid] ?? 0, mpsEntries, committedOrders,
        periods: Math.max(mpsEntries.length, 1),
      });
      result.set(pid, atpResult.ok ? (Array.isArray(atpResult?.data?.periods) ? atpResult?.data?.periods : []).map((p) => ({ atp: p.atp, canPromise: p.canPromise })) : []);
    }
    return result;
  }

  private buildResult(
    rawItems: Record<string, unknown>[],
    atpByProduct: Map<string, { atp: number; canPromise: boolean }[]>,
  ): MpsRow2[] {
    const productIdx = new Map<string, number>();
    return (Array.isArray(rawItems) ? rawItems : []).map((r) => {
      const pid = String(r['product_id']);
      const idx = productIdx.get(pid) ?? 0;
      productIdx.set(pid, idx + 1);
      const atpPeriod = (atpByProduct.get(pid) ?? [])[idx];
      return {
        productId: pid,
        period: String(r['period']),
        quantity: safeNum(r['quantity']),
        dueDate: String(r['due_date'] ?? ''),
        source: String(r['source'] ?? 'production_order'),
        atp: atpPeriod?.atp,
        canPromise: atpPeriod?.canPromise,
      };
    });
  }
}
