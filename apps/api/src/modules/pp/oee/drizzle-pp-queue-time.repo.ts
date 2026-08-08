/**
 * @module drizzle-pp-queue-time.repo
 * @description Drizzle/SQL implementation of the operation queue-time port (vision 07-pp#46).
 *   production_order_operations gained queued_at via migration
 *   pp-op-queued-at-oee-2026-07-11.sql. Reads/writes go through parameterised runQuery
 *   (Rule B: no sql.raw of a variable; every value is bound). All methods return Result<T> and
 *   guard rows with Array.isArray. Raw minute aggregation only -- the OEE arithmetic lives in
 *   the service (Rule 15).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpQueueTimeRepo,
  QueuedOperationRow,
  WorkCenterQueueRow,
} from './i-pp-queue-time.repo';

/** Raw DB row after a queued_at stamp (snake_case, pre-map). */
interface QueuedOpDbRow {
  id: number | string;
  production_order_id: number | string | null;
  work_center_id: number | string | null;
  queued_at: string | null;
  started_at: string | null;
}

/** Raw per-work-center aggregation row (snake_case, pre-map). */
interface WorkCenterQueueDbRow {
  work_center_id: number | string | null;
  queued_ops: number | string;
  queue_minutes: number | string;
  active_work_minutes: number | string;
}

@Injectable()
export class DrizzlePpQueueTimeRepository implements IPpQueueTimeRepo {
  async markQueued(operationId: number): Promise<Result<QueuedOperationRow | null>> {
    try {
      // COALESCE(queued_at, now()): sets the stamp only when currently NULL, so re-queue
      // calls are idempotent (the first-queue moment is preserved). 0 rows -> id not found.
      const r = await runQuery<QueuedOpDbRow>(sql`
        UPDATE production_order_operations
        SET queued_at = COALESCE(queued_at, now())
        WHERE id = ${operationId}
        RETURNING id, production_order_id, work_center_id, queued_at, started_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Ok(null);
      return Ok({
        id: Number(row.id),
        productionOrderId: row.production_order_id != null ? Number(row.production_order_id) : null,
        workCenterId: row.work_center_id != null ? Number(row.work_center_id) : null,
        queuedAt: row.queued_at != null ? String(row.queued_at) : null,
        startedAt: row.started_at != null ? String(row.started_at) : null,
      });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "queued_at belgilashda xatolik"));
    }
  }

  async getQueueExclusionByWorkCenter(
    fromInclusive: string,
    toExclusive: string,
  ): Promise<Result<WorkCenterQueueRow[]>> {
    try {
      // queue_minutes = Sum(started_at - queued_at) -> WAITING time (excluded from OEE).
      // active_work_minutes = Sum(completed_at - started_at) -> machine work = the OEE
      // availability denominator. FILTERs drop untracked / inverted intervals, so queue time
      // is 0 when queued_at is NULL (current OEE behavior preserved, no regression).
      const r = await runQuery<WorkCenterQueueDbRow>(sql`
        SELECT work_center_id,
               COUNT(*) FILTER (WHERE queued_at IS NOT NULL AND started_at IS NOT NULL AND started_at >= queued_at) AS queued_ops,
               COALESCE(SUM(EXTRACT(EPOCH FROM (started_at - queued_at)) / 60.0)
                 FILTER (WHERE queued_at IS NOT NULL AND started_at IS NOT NULL AND started_at >= queued_at), 0) AS queue_minutes,
               COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60.0)
                 FILTER (WHERE started_at IS NOT NULL AND completed_at IS NOT NULL AND completed_at >= started_at), 0) AS active_work_minutes
        FROM production_order_operations
        WHERE started_at >= ${fromInclusive} AND started_at < ${toExclusive}
        GROUP BY work_center_id
        ORDER BY work_center_id NULLS LAST`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(
        rows.map((row) => ({
          workCenterId: row.work_center_id != null ? Number(row.work_center_id) : null,
          queuedOps: Number(row.queued_ops ?? 0),
          queueMinutes: Math.round(Number(row.queue_minutes ?? 0) * 100) / 100,
          activeWorkMinutes: Math.round(Number(row.active_work_minutes ?? 0) * 100) / 100,
        })),
      );
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Navbat vaqtini hisoblashda xatolik"));
    }
  }
}
