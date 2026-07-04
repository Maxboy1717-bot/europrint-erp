/**
 * @module get-oee.handler
 * @description CQRS query handler — computes **real** OEE per work center from
 *   `mes_sessions` (NOT a sensor proxy). Returns Result<T>.
 *
 *   OEE = Availability × Performance × Quality, each factor in [0, 1].
 *
 *     Availability = runTime / plannedProductionTime          (SB0430)
 *        totalTime             = scheduled session span (started_at..completed_at).
 *        plannedDowntime       = downtime_events with is_planned = true
 *                                 (changeover / scheduled maintenance / shift-end —
 *                                 EXCLUDED from the denominator, world-standard OEE:
 *                                 planned stoppages are not a productivity loss).
 *        plannedProductionTime = totalTime − plannedDowntime.
 *        unplannedDowntime     = downtime_events with is_planned = false/NULL
 *                                 (breakdown / material shortage / unplanned stop —
 *                                 the real availability loss).
 *        runTime               = plannedProductionTime − unplannedDowntime.
 *        Before SB0430 this handler subtracted ALL downtime (planned + unplanned)
 *        from the SAME totalTime denominator, so a scheduled changeover counted
 *        identically to an unplanned breakdown — inflating the "loss" and
 *        conflating two different management actions (rejali/rejasiz).
 *        NOTE (#9): this handler aggregates the `mes_sessions` world (downtime_events).
 *                   The GSD 3-stage availability (main / setup+main+teardown) lives on the
 *                   canonical `production_sessions` table and is exposed separately via
 *                   MesProductionSessionsRepository.getStageBasedAvailability — same
 *                   "exclude setup/teardown" principle, sourced from real per-stage seconds.
 *     Performance  = completedSessions / totalSessions
 *        PROXY. The canonical Performance is (idealCycleTime × producedQty) /
 *        runTime, but `mes_sessions` has neither an ideal-cycle-time column nor
 *        a per-session produced-quantity column, and there is no cycle-time
 *        column anywhere in the manufacturing schema. The closest REAL signal
 *        is the share of sessions that actually reached `completed` status —
 *        a true fraction that drops below 1 when runs are abandoned / paused /
 *        cancelled. (Replace with idealCycleTime once a routing standard-time
 *        column exists — no DDL in this slice.)
 *     Quality      = goodCount / totalCount
 *        = (totalSessions − defectiveSessions) / totalSessions, where a session
 *        is defective when `quality_passed === false` OR `defect_qty > 0`.
 *        A real numeric fraction — NOT the previous boolean cast.
 *
 *   WHY THIS REPLACES THE OLD CODE (it was a "green lie", always ≈100%):
 *     - Availability was actualTime / actualTime  → always 1.0.
 *     - Performance was actualOutput / plannedOutput where both incremented by
 *       1 per session → always 1.0 (session-count based).
 *     - Quality was (quality_passed ? 1 : 0) − defect_qty → a boolean cast, not
 *       a ratio.
 *
 *   Divide-by-zero is guarded everywhere: a missing denominator yields 0, never
 *   NaN and never 100. An empty `mes_sessions` table therefore returns [] (no
 *   work centers), and a work center with zero planned time scores 0.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, mes_sessions, downtime_events } from '@shared/db';
import { and, gte, lte } from 'drizzle-orm';
import { Result, Ok } from '@common/types/result.type';
import { GetOeeQuery } from './get-oee.query';

import { MS_PER_MINUTE } from '@common/constants/app.constants';

const PERCENT = 100;

/** runTime, plannedTime, downtime in minutes; counts are whole sessions. */
interface WorkCenterAccumulator {
  plannedTime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  totalSessions: number;
  completedSessions: number;
  defectiveSessions: number;
}

@Injectable()
@QueryHandler(GetOeeQuery)
export class GetOeeHandler implements IQueryHandler<GetOeeQuery> {
  private readonly logger = new Logger(GetOeeHandler.name);

  /** Divide-by-zero-safe ratio clamped to [0, 1]; empty/invalid → 0 (never NaN/100). */
  private ratio(numerator: number, denominator: number): number {
    if (!denominator || denominator <= 0) return 0;
    const value = numerator / denominator;
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value));
  }

  private toPercent(fraction: number): number {
    return Math.round(fraction * PERCENT);
  }

  async execute(query: GetOeeQuery): Promise<Result<object[]>> {
    const conditions = [];

    if (query.filters.from) {
      conditions.push(gte(mes_sessions.started_at, query.filters.from));
    }

    if (query.filters.to) {
      conditions.push(lte(mes_sessions.started_at, query.filters.to));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sessions = await db.select().from(mes_sessions).where(where);
    const sessionRows = Array.isArray(sessions) ? sessions : [];

    // Real downtime (setup / changeover / stoppage) keyed by session id. Pulled
    // once and indexed, split by is_planned (SB0430) so Availability excludes
    // planned stoppages from the denominator and only unplanned loss from the
    // numerator — instead of pretending runTime == plannedTime OR conflating
    // planned + unplanned into one undifferentiated "downtime" bucket.
    const downtimeRows = await db.select().from(downtime_events);
    const plannedDowntimeBySession = new Map<string, number>();
    const unplannedDowntimeBySession = new Map<string, number>();
    for (const dt of Array.isArray(downtimeRows) ? downtimeRows : []) {
      const sessionKey = dt.sessionId ?? '';
      if (!sessionKey) continue;
      const minutes = this.downtimeMinutes(dt);
      const bucket = dt.isPlanned === true ? plannedDowntimeBySession : unplannedDowntimeBySession;
      bucket.set(sessionKey, (bucket.get(sessionKey) ?? 0) + minutes);
    }

    const byWorkCenter = new Map<string, WorkCenterAccumulator>();

    for (const session of sessionRows) {
      const workCenterId = query.filters.workCenterId || session.work_center_id || 'unknown';

      let acc = byWorkCenter.get(workCenterId);
      if (!acc) {
        acc = { plannedTime: 0, plannedDowntime: 0, unplannedDowntime: 0, totalSessions: 0, completedSessions: 0, defectiveSessions: 0 };
        byWorkCenter.set(workCenterId, acc);
      }

      const startTime = new Date(session.started_at).getTime();
      const endTime = session.completed_at ? new Date(session.completed_at).getTime() : Date.now();
      const totalMinutes = Math.max(0, (endTime - startTime) / MS_PER_MINUTE);
      const plannedDowntimeMin = Math.min(totalMinutes, plannedDowntimeBySession.get(session.id) ?? 0);
      const unplannedDowntimeMin = Math.min(
        Math.max(0, totalMinutes - plannedDowntimeMin),
        unplannedDowntimeBySession.get(session.id) ?? 0,
      );

      acc.plannedTime += Math.max(0, totalMinutes - plannedDowntimeMin);
      acc.plannedDowntime += plannedDowntimeMin;
      acc.unplannedDowntime += unplannedDowntimeMin;
      acc.totalSessions += 1;

      if (session.status === 'completed') acc.completedSessions += 1;

      const defects = session.defect_qty ?? 0;
      const isDefective = session.quality_passed === false || defects > 0;
      if (isDefective) acc.defectiveSessions += 1;
    }

    const oeeResults = [];

    for (const [workCenterId, acc] of byWorkCenter.entries()) {
      const runTime = Math.max(0, acc.plannedTime - acc.unplannedDowntime);

      const availability = this.ratio(runTime, acc.plannedTime);
      const performance = this.ratio(acc.completedSessions, acc.totalSessions);
      const goodSessions = acc.totalSessions - acc.defectiveSessions;
      const quality = this.ratio(goodSessions, acc.totalSessions);

      const oee = availability * performance * quality;

      oeeResults.push({
        workCenterId,
        availability: this.toPercent(availability),
        performance: this.toPercent(performance),
        quality: this.toPercent(quality),
        oee: this.toPercent(oee),
        sessionCount: acc.totalSessions,
        plannedMinutes: Math.round(acc.plannedTime),
        plannedDowntimeMinutes: Math.round(acc.plannedDowntime),
        downtimeMinutes: Math.round(acc.unplannedDowntime),
        runMinutes: Math.round(runTime),
        from: query.filters.from,
        to: query.filters.to,
      });
    }

    this.logger.debug(`OEE calculated for ${oeeResults.length} work centers`);

    return Ok(oeeResults);
  }

  /** Resolve a downtime event's duration in minutes from the real columns. */
  private downtimeMinutes(dt: typeof downtime_events.$inferSelect): number {
    if (dt.durationMin != null) {
      const parsed = Number(dt.durationMin);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (dt.durationMinutes != null && dt.durationMinutes > 0) return dt.durationMinutes;
    if (dt.startedAt && dt.endedAt) {
      const span = (new Date(dt.endedAt).getTime() - new Date(dt.startedAt).getTime()) / MS_PER_MINUTE;
      return span > 0 ? span : 0;
    }
    return 0;
  }
}
