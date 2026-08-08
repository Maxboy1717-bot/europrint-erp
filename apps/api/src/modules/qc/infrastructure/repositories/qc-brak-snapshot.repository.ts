/**
 * @module qc-brak-snapshot.repository
 * @description Repository / data-access for the QC brak-statistics snapshot
 * (Vision 09-qc #48). Durable read-model the Director panel falls back to when
 * the live QC stream is momentarily unavailable. Returns Result<T> (Qoida 1/15).
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface QcBrakSnapshot {
  scope: string;
  totalBraks: number;
  totalBrakQty: number;
  openDefects: number;
  scrap7daysQty: number;
  topReason: string | null;
  byStage: Array<{ stage: string; count: number }>;
  byReason: Array<{ reason: string; count: number }>;
  computedAt: string | null;
}

/** Null-safe jsonb array coercer for the by_stage / by_reason rollups. */
function jsonArr(v: unknown): Array<{ stage?: unknown; reason?: unknown; count?: unknown }> {
  return Array.isArray(v) ? (v as Array<{ stage?: unknown; reason?: unknown; count?: unknown }>) : [];
}

function mapRow(r: Row | undefined): QcBrakSnapshot | null {
  if (!r) return null;
  return {
    scope: String(r['scope'] ?? 'global'),
    totalBraks: Number(r['total_braks'] ?? 0),
    totalBrakQty: Number(r['total_brak_qty'] ?? 0),
    openDefects: Number(r['open_defects'] ?? 0),
    scrap7daysQty: Number(r['scrap_7days_qty'] ?? 0),
    topReason: r['top_reason'] == null ? null : String(r['top_reason']),
    byStage: jsonArr(r['by_stage']).map((x) => ({ stage: String(x.stage ?? 'unknown'), count: Number(x.count ?? 0) })),
    byReason: jsonArr(r['by_reason']).map((x) => ({ reason: String(x.reason ?? 'other'), count: Number(x.count ?? 0) })),
    computedAt: r['computed_at'] == null ? null : String(r['computed_at']),
  };
}

@Injectable()
export class QcBrakSnapshotRepository {
  /**
   * Recompute brak statistics from qc_braks + qc_defects (same UNION source as
   * qc-new.repository.ts) and UPSERT the durable snapshot for `scope`
   * (single row per scope). Sets computed_at = now().
   *
   * RULE4_EXCEPTION: the aggregate + jsonb rollups (FILTER, jsonb_agg, CTEs) are
   * not expressible via the Drizzle query builder — parametrised raw SQL,
   * DB-proven on the live europrint schema (rollback-tx).
   */
  async refreshSnapshot(scope = 'global'): Promise<Result<QcBrakSnapshot | null>> {
    return safeCall(async () => {
      const r = await db.execute(sql`
        WITH brak_union AS (
          SELECT quantity::numeric AS quantity, reason, stage, created_at::timestamptz AS created_at FROM qc_braks
          UNION ALL
          SELECT quantity::numeric AS quantity, defect_code AS reason, stage, created_at::timestamptz AS created_at
          FROM qc_defects
          WHERE papka_order_id IS NOT NULL OR brak_date IS NOT NULL OR stage IS NOT NULL
        ),
        agg AS (
          SELECT
            COUNT(*)::int AS total_braks,
            COALESCE(SUM(quantity),0)::numeric(18,4) AS total_brak_qty,
            COALESCE(SUM(quantity) FILTER (WHERE created_at >= now() - interval '7 days'),0)::numeric(18,4) AS scrap_7days_qty
          FROM brak_union
        ),
        open_d AS (
          SELECT COUNT(*)::int AS open_defects FROM qc_defects WHERE status IS DISTINCT FROM 'resolved'
        ),
        by_stage AS (
          SELECT COALESCE(jsonb_agg(jsonb_build_object('stage', COALESCE(stage,'unknown'), 'count', c) ORDER BY c DESC), '[]'::jsonb) AS j
          FROM (SELECT COALESCE(stage,'unknown') AS stage, COUNT(*)::int AS c FROM brak_union GROUP BY 1) s
        ),
        by_reason AS (
          SELECT COALESCE(jsonb_agg(jsonb_build_object('reason', COALESCE(reason,'other'), 'count', c) ORDER BY c DESC), '[]'::jsonb) AS j
          FROM (SELECT COALESCE(reason,'other') AS reason, COUNT(*)::int AS c FROM brak_union GROUP BY 1 ORDER BY 2 DESC LIMIT 10) rr
        ),
        top_r AS (
          SELECT reason FROM (SELECT COALESCE(reason,'other') AS reason, COUNT(*) c FROM brak_union GROUP BY 1 ORDER BY 2 DESC LIMIT 1) x
        )
        INSERT INTO qc_brak_snapshot
          (scope, total_braks, total_brak_qty, open_defects, scrap_7days_qty, top_reason, by_stage, by_reason, computed_at, updated_at)
        SELECT ${scope}, agg.total_braks, agg.total_brak_qty, open_d.open_defects, agg.scrap_7days_qty,
               (SELECT reason FROM top_r), by_stage.j, by_reason.j, now(), now()
        FROM agg, open_d, by_stage, by_reason
        ON CONFLICT (scope) DO UPDATE SET
          total_braks     = EXCLUDED.total_braks,
          total_brak_qty  = EXCLUDED.total_brak_qty,
          open_defects    = EXCLUDED.open_defects,
          scrap_7days_qty = EXCLUDED.scrap_7days_qty,
          top_reason      = EXCLUDED.top_reason,
          by_stage        = EXCLUDED.by_stage,
          by_reason       = EXCLUDED.by_reason,
          computed_at     = EXCLUDED.computed_at,
          updated_at      = now()
        RETURNING scope, total_braks, total_brak_qty, open_defects, scrap_7days_qty, top_reason, by_stage, by_reason, computed_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return mapRow(rows[0]);
    }, 'DB_ERROR');
  }

  /** Read the durable snapshot for `scope` (Director-panel fallback source). */
  async getSnapshot(scope = 'global'): Promise<Result<QcBrakSnapshot | null>> {
    return safeCall(async () => {
      const r = await db.execute(sql`
        SELECT scope, total_braks, total_brak_qty, open_defects, scrap_7days_qty,
               top_reason, by_stage, by_reason, computed_at
        FROM qc_brak_snapshot WHERE scope = ${scope} LIMIT 1
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return mapRow(rows[0]);
    }, 'DB_ERROR');
  }
}
