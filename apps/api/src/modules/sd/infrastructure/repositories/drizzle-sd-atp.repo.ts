/**
 * @module drizzle-sd-atp.repo
 * @description Read-only data access for the SD order-entry ATP (Available-To-Promise) check.
 *
 * Reads LIVE canonical tables only — no writes, no DDL:
 *   - sales_order_items  : demand lines of a saved order (sales_order_id → sd_sales_orders view id)
 *   - warehouse_stock    : real free stock (SUM of available_quantity per material)
 *   - material_cards     : canonical material card (name, unit) + available_stock fallback
 *   - inventory_policy   : per-material lead_time_days (EP-PP-065)
 *
 * Returns Result<T>; raw SQL targets live columns (the drizzle stubs drift types).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Err } from '@common/result';

/** One demand line as supplied by the caller (preview mode) or read from an order. */
export interface AtpDemandLine {
  materialId: number;
  quantity: number;
}

/** Per-material supply facts resolved from live tables. */
export interface AtpSupplyRow {
  materialId: number;
  materialName: string | null;
  unit: string | null;
  /** Free stock now: SUM(warehouse_stock.available_quantity), fallback material_cards.available_stock. */
  available: number;
  /** Per-material lead time in days, or null when no inventory_policy row exists. */
  leadTimeDays: number | null;
  /** Whether a material_cards row exists for this id (false ⇒ unknown material). */
  materialExists: boolean;
}

@Injectable()
export class DrizzleSdAtpRepository {
  /** Read demand lines (material + qty) for a saved order from sales_order_items. */
  async findOrderDemandLines(orderId: number): Promise<Result<AtpDemandLine[]>> {
    try {
      const r = await runQuery<{ material_id: number | null; order_quantity: string | number }>(sql`
        SELECT material_id, order_quantity
        FROM sales_order_items
        WHERE sales_order_id = ${orderId}
          AND material_id IS NOT NULL`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      const lines = rows
        .filter((x) => x.material_id != null)
        .map((x) => ({ materialId: Number(x.material_id), quantity: Number(x.order_quantity) }));
      return { ok: true as const, data: lines };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  /**
   * Resolve real supply facts (free stock + lead time + existence) for the given material ids.
   * Uses an IN-list built with sql.join (never `= ANY(${jsArray})`, which mis-binds as a tuple).
   */
  async findSupply(materialIds: number[]): Promise<Result<AtpSupplyRow[]>> {
    try {
      const unique = Array.from(new Set(materialIds.filter((id) => Number.isInteger(id) && id > 0)));
      if (unique.length === 0) return { ok: true as const, data: [] };
      const idList = sql.join(
        unique.map((id) => sql`${id}`),
        sql`, `,
      );
      const r = await runQuery<{
        material_id: number;
        material_name: string | null;
        unit: string | null;
        available: string | number | null;
        lead_time_days: number | null;
        material_exists: boolean;
      }>(sql`
        WITH ids AS (SELECT unnest(ARRAY[${idList}]::int[]) AS material_id),
        stock AS (
          SELECT material_id, SUM(available_quantity) AS available
          FROM warehouse_stock
          GROUP BY material_id
        )
        SELECT
          ids.material_id,
          mc.xom_ashyo AS material_name,
          mc.unit_of_measure AS unit,
          COALESCE(stock.available, mc.available_stock, 0) AS available,
          ip.lead_time_days,
          (mc.id IS NOT NULL) AS material_exists
        FROM ids
        LEFT JOIN material_cards mc ON mc.id = ids.material_id
        LEFT JOIN stock ON stock.material_id = ids.material_id
        LEFT JOIN inventory_policy ip ON ip.material_id = ids.material_id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      const mapped: AtpSupplyRow[] = rows.map((x) => ({
        materialId: Number(x.material_id),
        materialName: x.material_name ?? null,
        unit: x.unit ?? null,
        available: Number(x.available ?? 0),
        leadTimeDays: x.lead_time_days == null ? null : Number(x.lead_time_days),
        materialExists: Boolean(x.material_exists),
      }));
      return { ok: true as const, data: mapped };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }
}
