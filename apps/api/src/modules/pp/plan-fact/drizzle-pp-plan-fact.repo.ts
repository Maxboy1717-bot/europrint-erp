/**
 * @module drizzle-pp-plan-fact.repo
 * @description Drizzle implementation of the PP plan-fact port. Reads/writes
 *   pp_plan_fact_entries through parameterised runQuery (Rule B: every value is bound,
 *   no sql.raw of a variable), mirroring the sibling drizzle-pp-reason-codes.repo.ts. All
 *   methods return Result<T> and guard rows with Array.isArray. The Drizzle table def
 *   (lib/db pp-production.ts ppPlanFactEntries) matches these columns exactly so the
 *   schema barrel and runtime agree.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpPlanFactRepo,
  PlanFactEntryRow,
  LogPlanFactInput,
  RecommendationInputs,
} from './i-pp-plan-fact.repo';

/** Raw DB row shape (snake_case) before mapping to the camelCase API view. */
interface PlanFactDbRow {
  id: number | string;
  production_order_id: number | string | null;
  product_id: number | string | null;
  entry_date: string | Date;
  planned_qty: number | string | null;
  actual_qty: number | string | null;
  created_at: string | Date;
}

function mapRow(row: PlanFactDbRow): PlanFactEntryRow {
  return {
    id: Number(row.id),
    productionOrderId: row.production_order_id != null ? Number(row.production_order_id) : null,
    productId: row.product_id != null ? Number(row.product_id) : null,
    entryDate: String(row.entry_date),
    plannedQty: row.planned_qty != null ? Number(row.planned_qty) : null,
    actualQty: row.actual_qty != null ? Number(row.actual_qty) : null,
    createdAt: String(row.created_at),
  };
}

@Injectable()
export class DrizzlePpPlanFactRepository implements IPpPlanFactRepo {
  async logEntry(input: LogPlanFactInput): Promise<Result<PlanFactEntryRow>> {
    try {
      const poId = input.productionOrderId ?? null;
      const pid = input.productId ?? null;
      const entryDate = input.entryDate ?? null;
      const planned = input.plannedQty ?? null;
      const actual = input.actualQty ?? null;
      // product_id = supplied productId, else backfilled from the order (single statement,
      // Rule B bound params). entry_date falls back to CURRENT_DATE when omitted.
      const r = await runQuery<PlanFactDbRow>(sql`
        INSERT INTO pp_plan_fact_entries (production_order_id, product_id, entry_date, planned_qty, actual_qty)
        VALUES (
          ${poId},
          COALESCE(${pid}, (SELECT product_id FROM production_orders WHERE id = ${poId})),
          COALESCE(${entryDate}::date, CURRENT_DATE),
          ${planned},
          ${actual}
        )
        RETURNING id, production_order_id, product_id, entry_date, planned_qty, actual_qty, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Reja-fakt yozuvi yaratilmadi'));
      return Ok(mapRow(row));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Reja-fakt yozuvini saqlashda xatolik"));
    }
  }

  async recommendationInputs(productId: number): Promise<Result<RecommendationInputs>> {
    try {
      // Trailing 1-year window (median + best-20%), oldest->newest.
      const win = await runQuery<{ actual_qty: number | string | null }>(sql`
        SELECT actual_qty FROM pp_plan_fact_entries
        WHERE product_id = ${productId} AND actual_qty IS NOT NULL
          AND entry_date >= (CURRENT_DATE - INTERVAL '1 year')
        ORDER BY entry_date, id`);
      // Last 5 occurrences overall (last-5 mean), newest->oldest.
      const last5 = await runQuery<{ actual_qty: number | string | null }>(sql`
        SELECT actual_qty FROM pp_plan_fact_entries
        WHERE product_id = ${productId} AND actual_qty IS NOT NULL
        ORDER BY entry_date DESC, id DESC
        LIMIT 5`);
      const toNums = (rows: unknown): number[] =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => Number((r as { actual_qty: number | string | null }).actual_qty))
          .filter((n) => Number.isFinite(n));
      return Ok({ windowActuals: toNums(win.rows), last5Actuals: toNums(last5.rows) });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Tavsiya ma'lumotlarini o'qishda xatolik"));
    }
  }
}
