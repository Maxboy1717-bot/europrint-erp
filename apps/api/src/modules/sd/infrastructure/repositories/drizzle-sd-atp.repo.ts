/**
 * @module drizzle-sd-atp.repo
 * @description Read-only data access for the SD order-entry ATP (Available-To-Promise) check.
 *
 * Reads LIVE canonical tables only — no writes, no DDL:
 *   - sales_order_items  : demand lines of a saved order (sales_order_id → sd_sales_orders view id).
 *                          Orders bind to FINISHED-GOOD products only (product_id — owner 2026-06-05,
 *                          FK sales_order_items_product_id_fkey → products(id)). material_id is a
 *                          legacy/unused column on this table (no FK, drizzle-sales-order.repo never
 *                          writes it) — reading it here previously made every real order look like
 *                          "no lines" to ATP.
 *   - products           : canonical finished-good catalog (name, unit) + stock_quantity fallback.
 *
 * Finished goods are made-to-order via production, not replenished from a supplier lead time like
 * raw materials — there is no per-product inventory_policy row. Every short/unknown line therefore
 * falls back to ATP_DEFAULT_LEAD_TIME_DAYS (handler-side), which is the same conservative default
 * already used when a raw-material's own lead time is missing.
 *
 * Returns Result<T>; raw SQL targets live columns (the drizzle stubs drift types).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Err } from '@common/result';

/** One demand line as supplied by the caller (preview mode) or read from an order. */
export interface AtpDemandLine {
  productId: number;
  quantity: number;
}

/** Per-product supply facts resolved from live tables. */
export interface AtpSupplyRow {
  productId: number;
  productName: string | null;
  unit: string | null;
  /** Free stock now: products.stock_quantity (finished-good on-hand quantity). */
  available: number;
  /** Whether a products row exists for this id (false ⇒ unknown product). */
  productExists: boolean;
}

@Injectable()
export class DrizzleSdAtpRepository {
  /** Read demand lines (product + qty) for a saved order from sales_order_items. */
  async findOrderDemandLines(orderId: number): Promise<Result<AtpDemandLine[]>> {
    try {
      const r = await runQuery<{ product_id: number | null; order_quantity: string | number }>(sql`
        SELECT product_id, order_quantity
        FROM sales_order_items
        WHERE sales_order_id = ${orderId}
          AND product_id IS NOT NULL`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      const lines = rows
        .filter((x) => x.product_id != null)
        .map((x) => ({ productId: Number(x.product_id), quantity: Number(x.order_quantity) }));
      return { ok: true as const, data: lines };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  /**
   * Resolve real supply facts (free stock + existence) for the given product ids.
   * Uses an IN-list built with sql.join (never `= ANY(${jsArray})`, which mis-binds as a tuple).
   */
  async findSupply(productIds: number[]): Promise<Result<AtpSupplyRow[]>> {
    try {
      const unique = Array.from(new Set(productIds.filter((id) => Number.isInteger(id) && id > 0)));
      if (unique.length === 0) return { ok: true as const, data: [] };
      const idList = sql.join(
        unique.map((id) => sql`${id}`),
        sql`, `,
      );
      const r = await runQuery<{
        product_id: number;
        product_name: string | null;
        unit: string | null;
        available: string | number | null;
        product_exists: boolean;
      }>(sql`
        WITH ids AS (SELECT unnest(ARRAY[${idList}]::int[]) AS product_id)
        SELECT
          ids.product_id,
          p.name AS product_name,
          p.unit AS unit,
          COALESCE(p.stock_quantity, 0) AS available,
          (p.id IS NOT NULL) AS product_exists
        FROM ids
        LEFT JOIN products p ON p.id = ids.product_id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      const mapped: AtpSupplyRow[] = rows.map((x) => ({
        productId: Number(x.product_id),
        productName: x.product_name ?? null,
        unit: x.unit ?? null,
        available: Number(x.available ?? 0),
        productExists: Boolean(x.product_exists),
      }));
      return { ok: true as const, data: mapped };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }
}
