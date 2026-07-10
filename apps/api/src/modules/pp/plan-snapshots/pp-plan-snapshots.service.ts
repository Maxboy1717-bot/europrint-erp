/**
 * @module pp-plan-snapshots.service
 * @description Director PP plan% snapshot service (vision 07-pp#49). Two responsibilities,
 *   both DB-delegated to the repo (Rule 15):
 *     - captureSnapshot: resolve the window, roll up production_sessions plan/fact, compute
 *       the fixed plan% (actual/planned*100), and FREEZE it as a snapshot row.
 *     - getDirectorStatus: read the latest snapshot and derive the "offline" flag from its
 *       age — when MES stops feeding, the Director keeps the last confirmed snapshot marked
 *       offline instead of showing an uncertain live value (A5). Empty store -> 0%/no-data.
 *   The plan% is a fixed ratio, so no owner data is required to function.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, type Result } from '@common/result';
import {
  PP_PLAN_SNAPSHOTS_REPO,
  type IPpPlanSnapshotsRepo,
  type PlanSnapshotRow,
  type PlanSnapshotPeriod,
  type CaptureSnapshotInput,
} from './i-pp-plan-snapshots.repo';

/** A snapshot older than this (per period) is treated as stale -> "offline" badge. Mechanism
 *  defaults (not owner data), owner-tunable later: a daily snapshot goes offline after ~1 day,
 *  a shift snapshot after ~14h (a shift is ~8-12h + grace). */
const SNAPSHOT_STALE_MS: Record<string, number> = {
  daily: 26 * 60 * 60 * 1000,
  shift: 14 * 60 * 60 * 1000,
};
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Director-facing plan% status envelope. */
export interface DirectorPlanStatus {
  /** False when no snapshot has ever been captured (Director shows "ma'lumot yo'q"). */
  hasData: boolean;
  /** True when the latest snapshot is stale (MES offline) — dashboard shows the "offline" badge. */
  isOffline: boolean;
  /** Plan fulfilment %, 0 when there is no data. */
  planPercent: number;
  periodType: string;
  /** The frozen snapshot the value came from, or null when none exists. */
  snapshot: PlanSnapshotRow | null;
}

@Injectable()
export class PpPlanSnapshotsService {
  constructor(
    @Inject(PP_PLAN_SNAPSHOTS_REPO) private readonly repo: IPpPlanSnapshotsRepo,
  ) {}

  /**
   * Freeze a shift/daily snapshot: roll up production_sessions in the window, compute the
   * fixed plan% (0 when nothing planned), and store it. Called by the shift-close endpoint
   * and the daily cron.
   */
  async captureSnapshot(input: CaptureSnapshotInput): Promise<Result<PlanSnapshotRow>> {
    const { fromInclusive, toExclusive, snapshotDate } = this.resolveWindow(input);
    const aggRes = await this.repo.aggregatePlanFact(fromInclusive, toExclusive);
    if (!aggRes.ok) return Err(aggRes.error);
    const { plannedQty, actualQty, sessionCount } = aggRes.data;
    const planPercent = plannedQty > 0 ? Math.round((actualQty / plannedQty) * 10000) / 100 : 0;
    return this.repo.insertSnapshot({
      snapshotDate,
      periodType: input.periodType,
      shiftLabel: input.shiftLabel ?? null,
      workCenterId: null,
      plannedQty,
      actualQty,
      planPercent,
      sessionCount,
      source: input.source ?? 'shift_close',
    });
  }

  /** The Director "holat formulasi" read: latest snapshot + offline flag, or no-data default. */
  async getDirectorStatus(periodType: PlanSnapshotPeriod): Promise<Result<DirectorPlanStatus>> {
    const res = await this.repo.latestSnapshot(periodType);
    if (!res.ok) return Err(res.error);
    const snap = res.data;
    if (!snap) {
      return Ok({ hasData: false, isOffline: false, planPercent: 0, periodType, snapshot: null });
    }
    const staleMs = SNAPSHOT_STALE_MS[periodType] ?? SNAPSHOT_STALE_MS.daily;
    const ageMs = Date.now() - new Date(snap.capturedAt).getTime();
    return Ok({
      hasData: true,
      isOffline: ageMs > staleMs,
      planPercent: snap.planPercent,
      periodType,
      snapshot: snap,
    });
  }

  /** Resolve the aggregation window (Rule 6 date arithmetic lives here, not the controller). */
  private resolveWindow(
    input: CaptureSnapshotInput,
  ): { fromInclusive: string; toExclusive: string; snapshotDate: string } {
    if (input.fromTs && input.toTs) {
      const d = input.snapshotDate ?? input.fromTs.slice(0, 10);
      return { fromInclusive: input.fromTs, toExclusive: input.toTs, snapshotDate: d };
    }
    const day = input.snapshotDate ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(start.getTime() + ONE_DAY_MS);
    return { fromInclusive: start.toISOString(), toExclusive: end.toISOString(), snapshotDate: day };
  }
}
