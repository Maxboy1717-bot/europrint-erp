/**
 * @module i-pp-plan-snapshots.repo
 * @description Port for the Director PP plan% snapshot store (pp_plan_snapshots, vision
 *   07-pp#49). The Director "holat formulasi" reads the plan% from a FROZEN shift/daily
 *   snapshot — not a live aggregate — so that when MES is offline the dashboard can still
 *   serve the last confirmed snapshot with an "offline" badge (A5). Kept DB-free so the
 *   service/controller stay transport/arithmetic only (Rule 15). Distinct from
 *   pp_plan_fact_entries (#20, per-order plan/fact log): this is the aggregated,
 *   offline-safe Director view.
 */

import type { Result } from '@common/result';

/** Snapshot granularity: one closed shift, or a whole day. */
export type PlanSnapshotPeriod = 'shift' | 'daily';

/** Raw plan/fact roll-up over production_sessions in a window. % is computed by the service. */
export interface PlanFactAggregate {
  plannedQty: number;
  actualQty: number;
  sessionCount: number;
}

/** One stored snapshot row (camelCase view of pp_plan_snapshots). */
export interface PlanSnapshotRow {
  id: number;
  snapshotDate: string;      // 'YYYY-MM-DD'
  periodType: string;
  shiftLabel: string | null;
  workCenterId: number | null;
  plannedQty: number;
  actualQty: number;
  planPercent: number;       // frozen at capture time
  sessionCount: number;
  source: string;
  capturedAt: string;        // ISO timestamp
}

/** Insert payload for a frozen snapshot. planPercent is pre-computed by the service. */
export interface CreatePlanSnapshotInput {
  snapshotDate: string;
  periodType: PlanSnapshotPeriod;
  shiftLabel?: string | null;
  workCenterId?: number | null;
  plannedQty: number;
  actualQty: number;
  planPercent: number;
  sessionCount: number;
  source?: string;
}

/** Service-layer capture request (window is resolved by the service, Rule 6). */
export interface CaptureSnapshotInput {
  periodType: PlanSnapshotPeriod;
  snapshotDate?: string;   // 'YYYY-MM-DD'; defaults to today (UTC) when omitted
  shiftLabel?: string | null;
  fromTs?: string;         // ISO; explicit window override (e.g. a real shift boundary)
  toTs?: string;           // ISO
  source?: string;
}

export interface IPpPlanSnapshotsRepo {
  /**
   * Raw plan/fact roll-up over production_sessions whose started_at falls in
   * [fromInclusive, toExclusive) — factory-wide. Returns zeros for an empty window
   * (no fabrication): the service turns that into the 0%/no-data Director default.
   */
  aggregatePlanFact(fromInclusive: string, toExclusive: string): Promise<Result<PlanFactAggregate>>;

  /** Append one frozen snapshot row; returns the stored row. */
  insertSnapshot(input: CreatePlanSnapshotInput): Promise<Result<PlanSnapshotRow>>;

  /**
   * The latest factory-wide snapshot for a period (work_center_id IS NULL), newest
   * captured_at first. Ok(null) when none exists yet (Director then shows no-data).
   */
  latestSnapshot(periodType: PlanSnapshotPeriod): Promise<Result<PlanSnapshotRow | null>>;
}

export const PP_PLAN_SNAPSHOTS_REPO = Symbol('IPpPlanSnapshotsRepo');
