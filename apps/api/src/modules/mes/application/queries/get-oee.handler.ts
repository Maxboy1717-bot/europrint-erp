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
 *
 *   VISION-3340 #46 — 4-level OEE cascade (groupBy):
 *     machine (default) — per work center from `mes_sessions` (legacy behavior,
 *                          output shape unchanged; `groupBy`/`groupKey` fields added).
 *     shift             — per `production_sessions.shift_id`, read through the
 *                          canonical `mes_production_sessions` VIEW binding.
 *                          Rows with NULL shift_id are skipped, so this level
 *                          returns [] until shift_id data is populated
 *                          (owner-DATA gap, expected — not a bug).
 *     shop              — per `work_centers.org_department_id` (T12-04 KARTA link),
 *                          resolved from `mes_sessions.work_center_id`. Work
 *                          centers with NULL org_department_id are skipped, so
 *                          this level returns [] until the owner links work
 *                          centers to org KARTAs (owner-DATA gap, expected).
 *     brigade           — BLOCKED: neither `production_sessions` nor
 *                          `mes_sessions` (nor any related MES table) has a
 *                          crew/brigade column (`work_centers.min/max_crew_size`
 *                          are sizing params, not a grouping key). Returns
 *                          Err(NOT_IMPLEMENTED) until the schema gains one.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { db, mes_sessions, downtime_events, mes_production_sessions, ppWorkCenters, mes_downtime_reasons } from '@shared/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { GetOeeQuery } from './get-oee.query';

import { MS_PER_MINUTE } from '@common/constants/app.constants';

const PERCENT = 100;

/**
 * #86: mes_downtime_reasons.category value marking operator-not-at-fault idle
 * time ("ish yo'q" / no-work). No-work minutes are booked to their own bucket
 * and kept OUT of the OEE availability penalty — they are neither a planned
 * stoppage nor an unplanned breakdown, so they must not skew availability.
 */
const NO_WORK_CATEGORY = 'no-work';

/** VISION-3340 #46: accepted cascade levels. Default = legacy machine level. */
const OeeGroupBySchema = z.enum(['machine', 'shift', 'brigade', 'shop']).default('machine');

/** runTime, plannedTime, downtime in minutes; counts are whole sessions. */
interface OeeAccumulator {
  plannedTime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  /** #86: no-work (ish yo'q) idle minutes — tracked apart from downtime. */
  noWorkTime: number;
  totalSessions: number;
  completedSessions: number;
  defectiveSessions: number;
}

/** Normalized per-session input consumed by the shared accumulator. */
interface SessionSample {
  /** Key used to look up this session's downtime rows (downtime_events.session_id). */
  sessionKey: string;
  startMs: number | null;
  endMs: number | null;
  isCompleted: boolean;
  isDefective: boolean;
}

interface DowntimeMaps {
  planned: Map<string, number>;
  unplanned: Map<string, number>;
  /** #86: no-work (ish yo'q) minutes keyed by session id — excluded from availability. */
  noWork: Map<string, number>;
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
    const parsedGroupBy = OeeGroupBySchema.safeParse(query.filters.groupBy);
    if (!parsedGroupBy.success) {
      return Err(AppErr(
        'VALIDATION',
        `groupBy noto'g'ri: '${String(query.filters.groupBy)}'. Ruxsat etilgan: machine | shift | brigade | shop`,
      ));
    }
    const groupBy = parsedGroupBy.data;

    if (groupBy === 'brigade') {
      // Blocked-on-missing-column: no crew/brigade grouping key exists on
      // production_sessions / mes_sessions (verified 2026-07-08 — only
      // work_centers.min_crew_size/max_crew_size sizing params exist). Adding
      // the column is DDL = owner decision (Q-35); until then this level is
      // honestly unavailable rather than silently empty.
      return Err(AppErr(
        'NOT_IMPLEMENTED',
        "OEE brigada darajasi hali mavjud emas: production_sessions jadvalida crew/brigada ustuni yo'q (schema gap — egasi qarori). machine | shift | shop ishlating.",
      ));
    }

    const downtime = await this.loadDowntimeMaps();

    const oeeResults = groupBy === 'shift'
      ? await this.aggregateByShift(query, downtime)
      : await this.aggregateMesSessions(query, groupBy, downtime);

    this.logger.debug(`OEE calculated for ${oeeResults.length} ${groupBy} groups`);

    return Ok(oeeResults);
  }

  /**
   * machine (legacy, default) and shop levels — both aggregate `mes_sessions`.
   *   machine: key = workCenterId filter override | session.work_center_id | 'unknown'.
   *   shop:    key = work_centers.org_department_id resolved via the session's
   *            work center; unresolved sessions are skipped (owner-DATA gap).
   */
  private async aggregateMesSessions(
    query: GetOeeQuery,
    groupBy: 'machine' | 'shop',
    downtime: DowntimeMaps,
  ): Promise<object[]> {
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

    const shopByWorkCenter = groupBy === 'shop' ? await this.loadWorkCenterShopMap() : null;

    const byGroup = new Map<string, OeeAccumulator>();

    for (const session of sessionRows) {
      let key: string | null;
      if (shopByWorkCenter) {
        const workCenterId = session.work_center_id;
        key = workCenterId ? (shopByWorkCenter.get(String(workCenterId)) ?? null) : null;
        // Owner-DATA gap: work center not linked to an org KARTA yet → no shop bucket.
        if (key === null) continue;
      } else {
        key = query.filters.workCenterId || session.work_center_id || 'unknown';
      }

      const defects = session.defect_qty ?? 0;
      this.accumulateSession(byGroup, key, {
        sessionKey: session.id,
        startMs: new Date(session.started_at).getTime(),
        endMs: session.completed_at ? new Date(session.completed_at).getTime() : null,
        isCompleted: session.status === 'completed',
        isDefective: session.quality_passed === false || defects > 0,
      }, downtime);
    }

    return this.summarize(byGroup, groupBy, query.filters);
  }

  /**
   * shift level — aggregates the canonical `production_sessions` world through
   * the `mes_production_sessions` VIEW binding (the only session source that
   * carries shift_id). Rows with NULL shift_id are skipped → [] until the
   * owner/MES actually populates shift data (expected, not a bug).
   */
  private async aggregateByShift(query: GetOeeQuery, downtime: DowntimeMaps): Promise<object[]> {
    const conditions = [];

    if (query.filters.from) {
      conditions.push(gte(mes_production_sessions.startTime, query.filters.from));
    }

    if (query.filters.to) {
      conditions.push(lte(mes_production_sessions.startTime, query.filters.to));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sessions = await db.select().from(mes_production_sessions).where(where);
    const sessionRows = Array.isArray(sessions) ? sessions : [];

    const byShift = new Map<string, OeeAccumulator>();

    for (const session of sessionRows) {
      if (session.shiftId === null || session.shiftId === undefined) continue; // owner-DATA gap

      this.accumulateSession(byShift, String(session.shiftId), {
        sessionKey: String(session.id),
        startMs: session.startTime ? new Date(session.startTime).getTime() : null,
        endMs: session.endTime ? new Date(session.endTime).getTime() : null,
        isCompleted: session.status === 'completed',
        isDefective: Number(session.defectQty ?? 0) > 0,
      }, downtime);
    }

    return this.summarize(byShift, 'shift', query.filters);
  }

  /**
   * Shared accumulator step (all cascade levels) — same minute math the machine
   * level has always used: span minus planned downtime = planned production
   * time; unplanned downtime capped by what remains (SB0430 invariants hold at
   * every grouping level).
   */
  private accumulateSession(
    map: Map<string, OeeAccumulator>,
    key: string,
    sample: SessionSample,
    downtime: DowntimeMaps,
  ): void {
    let acc = map.get(key);
    if (!acc) {
      acc = { plannedTime: 0, plannedDowntime: 0, unplannedDowntime: 0, noWorkTime: 0, totalSessions: 0, completedSessions: 0, defectiveSessions: 0 };
      map.set(key, acc);
    }

    const endMs = sample.endMs ?? Date.now();
    const totalMinutes = sample.startMs === null ? 0 : Math.max(0, (endMs - sample.startMs) / MS_PER_MINUTE);
    // #86: 'ish yo'q' (no-work) idle time is peeled off the span FIRST — it is
    // not a productivity loss, so it must not sit in the availability
    // denominator nor be mistaken for a planned/unplanned stoppage.
    const noWorkMin = Math.min(totalMinutes, downtime.noWork.get(sample.sessionKey) ?? 0);
    const spanAfterNoWork = Math.max(0, totalMinutes - noWorkMin);
    const plannedDowntimeMin = Math.min(spanAfterNoWork, downtime.planned.get(sample.sessionKey) ?? 0);
    const unplannedDowntimeMin = Math.min(
      Math.max(0, spanAfterNoWork - plannedDowntimeMin),
      downtime.unplanned.get(sample.sessionKey) ?? 0,
    );

    acc.plannedTime += Math.max(0, spanAfterNoWork - plannedDowntimeMin);
    acc.plannedDowntime += plannedDowntimeMin;
    acc.unplannedDowntime += unplannedDowntimeMin;
    acc.noWorkTime += noWorkMin;
    acc.totalSessions += 1;

    if (sample.isCompleted) acc.completedSessions += 1;
    if (sample.isDefective) acc.defectiveSessions += 1;
  }

  /** Shared A×P×Q roll-up for every cascade level — single home for the OEE math. */
  private summarize(
    map: Map<string, OeeAccumulator>,
    groupBy: 'machine' | 'shift' | 'shop',
    filters: { from?: Date; to?: Date },
  ): object[] {
    // machine keeps the legacy `workCenterId` field name (live FE/dashboard
    // contract — Q-39 no-regress); shift/shop get dimension-true field names.
    const keyField = groupBy === 'machine' ? 'workCenterId' : groupBy === 'shift' ? 'shiftId' : 'orgDepartmentId';

    const oeeResults = [];

    for (const [groupKey, acc] of map.entries()) {
      const runTime = Math.max(0, acc.plannedTime - acc.unplannedDowntime);

      const availability = this.ratio(runTime, acc.plannedTime);
      const performance = this.ratio(acc.completedSessions, acc.totalSessions);
      const goodSessions = acc.totalSessions - acc.defectiveSessions;
      const quality = this.ratio(goodSessions, acc.totalSessions);

      const oee = availability * performance * quality;

      oeeResults.push({
        [keyField]: groupKey,
        groupBy,
        groupKey,
        availability: this.toPercent(availability),
        performance: this.toPercent(performance),
        quality: this.toPercent(quality),
        oee: this.toPercent(oee),
        sessionCount: acc.totalSessions,
        plannedMinutes: Math.round(acc.plannedTime),
        plannedDowntimeMinutes: Math.round(acc.plannedDowntime),
        downtimeMinutes: Math.round(acc.unplannedDowntime),
        noWorkMinutes: Math.round(acc.noWorkTime),
        runMinutes: Math.round(runTime),
        from: filters.from,
        to: filters.to,
      });
    }

    return oeeResults;
  }

  /**
   * Real downtime (setup / changeover / stoppage) keyed by session id. Pulled
   * once and indexed, split by is_planned (SB0430) so Availability excludes
   * planned stoppages from the denominator and only unplanned loss from the
   * numerator — instead of pretending runTime == plannedTime OR conflating
   * planned + unplanned into one undifferentiated "downtime" bucket.
   */
  private async loadDowntimeMaps(): Promise<DowntimeMaps> {
    const noWorkCodes = await this.loadNoWorkReasonCodes();
    const downtimeRows = await db.select().from(downtime_events);
    const planned = new Map<string, number>();
    const unplanned = new Map<string, number>();
    const noWork = new Map<string, number>();
    for (const dt of Array.isArray(downtimeRows) ? downtimeRows : []) {
      const sessionKey = dt.sessionId ?? '';
      if (!sessionKey) continue;
      const minutes = this.downtimeMinutes(dt);
      // #86: no-work idle time gets its own bucket (checked BEFORE the
      // planned/unplanned split) so it is excluded from the availability
      // penalty and reported separately — "ish yo'q" is not downtime.
      if (dt.reasonCode && noWorkCodes.has(dt.reasonCode)) {
        noWork.set(sessionKey, (noWork.get(sessionKey) ?? 0) + minutes);
        continue;
      }
      const bucket = dt.isPlanned === true ? planned : unplanned;
      bucket.set(sessionKey, (bucket.get(sessionKey) ?? 0) + minutes);
    }
    return { planned, unplanned, noWork };
  }

  /**
   * #86: reason codes classified as no-work (category = 'no-work') in the
   * mes_downtime_reasons catalog. Data-driven so НО can add further no-work
   * codes without a code change; an empty set (catalog lacks the category)
   * leaves availability math unchanged (no regression).
   */
  private async loadNoWorkReasonCodes(): Promise<Set<string>> {
    const rows = await db
      .select({ code: mes_downtime_reasons.code })
      .from(mes_downtime_reasons)
      .where(eq(mes_downtime_reasons.category, NO_WORK_CATEGORY));
    const codes = new Set<string>();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row.code) codes.add(row.code);
    }
    return codes;
  }

  /**
   * shop level lookup: work_centers.id → org_department_id (T12-04 KARTA FK).
   * Keys are stringified so the uuid-typed mes_sessions.work_center_id binding
   * and the serial-int ppWorkCenters binding (same physical table, two Drizzle
   * bindings) compare consistently. NULL org_department_id → omitted.
   */
  private async loadWorkCenterShopMap(): Promise<Map<string, string>> {
    const rows = await db
      .select({ id: ppWorkCenters.id, orgDepartmentId: ppWorkCenters.orgDepartmentId })
      .from(ppWorkCenters);
    const map = new Map<string, string>();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row.orgDepartmentId === null || row.orgDepartmentId === undefined) continue;
      map.set(String(row.id), String(row.orgDepartmentId));
    }
    return map;
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
