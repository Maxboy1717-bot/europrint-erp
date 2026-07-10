/**
 * @module i-pp-queue-time.repo
 * @description Port for the operation queue-time tracker (vision 07-pp#46). A production
 *   operation enters its work-center queue at queued_at and the operator starts it at
 *   started_at; the gap (started_at - queued_at) is WAITING time -- not machine work -- and
 *   must NOT count toward OEE. This port exposes:
 *     - markQueued(): stamp queued_at when the op enters the queue (idempotent).
 *     - getQueueExclusionByWorkCenter(): per-work-center active-work vs queue minutes over a
 *       window, so the OEE availability denominator can use active work (queue excluded).
 *   Kept DB-free at the service/controller layer (Rule 15). Empty windows return Ok([]) -- no
 *   fabrication; untracked ops (queued_at NULL) contribute 0 queue time (no regression).
 */

import type { Result } from '@common/result';

/** One operation row after a queued_at stamp (camelCase view of the touched columns). */
export interface QueuedOperationRow {
  id: number;
  productionOrderId: number | null;
  workCenterId: number | null;
  queuedAt: string | null;
  startedAt: string | null;
}

/** Per-work-center queue-vs-work split over the reporting window (raw minutes, pre-arithmetic). */
export interface WorkCenterQueueRow {
  workCenterId: number | null;
  /** Ops whose queued_at -> started_at gap is a valid queue interval. */
  queuedOps: number;
  /** Sum(started_at - queued_at) minutes -- WAITING time, excluded from OEE. */
  queueMinutes: number;
  /** Sum(completed_at - started_at) minutes -- active machine work = OEE availability denominator. */
  activeWorkMinutes: number;
}

export interface IPpQueueTimeRepo {
  /**
   * Idempotently stamp queued_at for an operation entering the work-center queue.
   * COALESCE keeps an existing stamp (re-queue calls do not move the clock). Returns
   * Ok(null) when no operation matched the id so the controller can raise a 404.
   */
  markQueued(operationId: number): Promise<Result<QueuedOperationRow | null>>;

  /**
   * Per-work-center active-work vs queue minutes for ops whose started_at falls in
   * [fromInclusive, toExclusive). Queue time is reported separately and never folded into
   * activeWorkMinutes. Ok([]) for an empty window.
   */
  getQueueExclusionByWorkCenter(
    fromInclusive: string,
    toExclusive: string,
  ): Promise<Result<WorkCenterQueueRow[]>>;
}

export const PP_QUEUE_TIME_REPO = Symbol('IPpQueueTimeRepo');
