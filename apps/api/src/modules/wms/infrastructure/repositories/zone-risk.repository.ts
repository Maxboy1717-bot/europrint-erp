/**
 * @module zone-risk.repository
 * @description Repository / data-access layer. Wraps raw SQL; returns Result<T>.
 *   Vision 10-warehouse #6 — "IoT signalda o'sha zonadagi barcha zaxira 'xavf ostida'".
 *   Zone membership is resolved via warehouse_stock.bin_location_id -> warehouse_bins.zone_id
 *   (canonical topology; STANDARTLAR.md §15). The flag write is a single atomic CTE so the stock
 *   UPDATE and the qc_review_queue INSERT cannot diverge; re-signalling a zone is idempotent because
 *   only rows currently at_risk = false are (re)flagged / (re)queued.
 * @layer Infrastructure (WMS)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';
import type {
  IZoneRiskRepo,
  ZoneRiskCounts,
  ZoneClearCounts,
} from '../../domain/repositories/i-zone-risk.repo';

type Row = Record<string, unknown>;

@Injectable()
export class ZoneRiskRepository implements IZoneRiskRepo {
  async flagZoneAtRisk(zoneId: number, reason: string): Promise<Result<ZoneRiskCounts>> {
    return safeCall(async () => {
      const r = await runQuery<{ flagged_count: number; queued_count: number }>(sql`
        WITH flagged AS (
          UPDATE warehouse_stock ws
             SET at_risk = true, at_risk_reason = ${reason}, at_risk_at = now()
           WHERE ws.bin_location_id IN (SELECT id FROM warehouse_bins WHERE zone_id = ${zoneId})
             AND ws.at_risk = false
          RETURNING ws.id, ws.warehouse_id, ws.material_id
        ),
        queued AS (
          INSERT INTO qc_review_queue (stock_id, warehouse_id, zone_id, material_id, reason, source, status)
          SELECT f.id, f.warehouse_id, ${zoneId}, f.material_id, ${reason}, 'iot_signal', 'pending' FROM flagged f
          RETURNING id
        )
        SELECT (SELECT count(*)::int FROM flagged) AS flagged_count,
               (SELECT count(*)::int FROM queued)  AS queued_count
      `);
      const row = r.rows[0];
      return {
        flaggedCount: Number(row?.flagged_count ?? 0),
        queuedCount: Number(row?.queued_count ?? 0),
      };
    }, 'DB_ERROR');
  }

  async clearZoneAtRisk(zoneId: number, resolvedBy: number | null): Promise<Result<ZoneClearCounts>> {
    return safeCall(async () => {
      const r = await runQuery<{ cleared_count: number; resolved_count: number }>(sql`
        WITH cleared AS (
          UPDATE warehouse_stock ws
             SET at_risk = false, at_risk_reason = NULL, at_risk_at = NULL
           WHERE ws.bin_location_id IN (SELECT id FROM warehouse_bins WHERE zone_id = ${zoneId})
             AND ws.at_risk = true
          RETURNING ws.id
        ),
        resolved AS (
          UPDATE qc_review_queue
             SET status = 'resolved', resolved_at = now(), resolved_by = ${resolvedBy}
           WHERE zone_id = ${zoneId} AND status = 'pending'
          RETURNING id
        )
        SELECT (SELECT count(*)::int FROM cleared)  AS cleared_count,
               (SELECT count(*)::int FROM resolved) AS resolved_count
      `);
      const row = r.rows[0];
      return {
        clearedCount: Number(row?.cleared_count ?? 0),
        resolvedCount: Number(row?.resolved_count ?? 0),
      };
    }, 'DB_ERROR');
  }

  async listReviewQueue(zoneId: number | null, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = zoneId
        ? await runQuery<Row>(sql`
            SELECT q.id, q.stock_id, q.warehouse_id, q.zone_id, q.material_id,
                   q.reason, q.source, q.status, q.created_at
            FROM qc_review_queue q
            WHERE q.status = 'pending' AND q.zone_id = ${zoneId}
            ORDER BY q.created_at DESC LIMIT ${limit}`)
        : await runQuery<Row>(sql`
            SELECT q.id, q.stock_id, q.warehouse_id, q.zone_id, q.material_id,
                   q.reason, q.source, q.status, q.created_at
            FROM qc_review_queue q
            WHERE q.status = 'pending'
            ORDER BY q.created_at DESC LIMIT ${limit}`);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }

  async listAtRiskStock(limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT ws.id, ws.warehouse_id, ws.material_id, ws.bin_location_id,
               ws.at_risk_reason, ws.at_risk_at, b.zone_id
        FROM warehouse_stock ws
        LEFT JOIN warehouse_bins b ON b.id = ws.bin_location_id
        WHERE ws.at_risk = true
        ORDER BY ws.at_risk_at DESC NULLS LAST LIMIT ${limit}`);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }
}
