/**
 * @module i-pp-gang-runs.repo
 * @description Port for the gang-run grouping + per-order acceptance/brak-split tables
 *   (pp_gang_runs / pp_gang_run_orders — vision 07-pp#37). A gang run groups several
 *   production orders printed on one physical sheet; on acceptance the whole run's brak is
 *   split proportionally by each order's quantity and every order gets its own generated
 *   acceptance-act reference. Kept as a port so the service/controller stay DB-free (Rule
 *   15). Mechanism-only: no owner master-data (Q-40) — the split weight is the order's own
 *   quantity, snapshotted from production_orders at create time.
 */

import type { Result } from '@common/result';

/** Header row (camelCase view of pp_gang_runs). */
export interface GangRunHeaderRow {
  id: number;
  printJobRef: string;
  status: string; // 'open' | 'accepted'
  totalBrakQty: number;
  createdBy: number | null;
  acceptedAt: string | null;
  createdAt: string | null;
}

/** Member row (camelCase view of pp_gang_run_orders). */
export interface GangRunMemberRow {
  productionOrderId: number;
  orderQuantity: number;
  brakQty: number;
  acceptanceActId: string | null;
}

/** Snapshot of one order's split weight, read from production_orders at create time. */
export interface OrderQtyRow {
  id: number;
  quantity: number;
}

/** One member to insert into a new gang run (order id + its snapshotted quantity). */
export interface GangRunMemberInput {
  productionOrderId: number;
  orderQuantity: number;
}

/** One computed per-order acceptance allocation (service output applied by the repo). */
export interface GangRunAllocation {
  productionOrderId: number;
  brakQty: number;
  acceptanceActId: string;
}

export interface IPpGangRunsRepo {
  /** Existing (non-deleted) orders among the given ids, with their split-weight quantity. */
  orderQuantities(orderIds: number[]): Promise<Result<OrderQtyRow[]>>;

  /** Atomically insert the run header + member rows; returns the created header. */
  insertGangRun(
    printJobRef: string,
    createdBy: number | null,
    members: GangRunMemberInput[],
  ): Promise<Result<GangRunHeaderRow>>;

  /** Header by id, or Ok(null) when not found. */
  findHeader(gangRunId: number): Promise<Result<GangRunHeaderRow | null>>;

  /** Members of a run, ordered by production_order_id. */
  findMembers(gangRunId: number): Promise<Result<GangRunMemberRow[]>>;

  /** All headers, newest first. */
  listHeaders(): Promise<Result<GangRunHeaderRow[]>>;

  /**
   * Atomically apply the computed per-order allocations and finalize the header
   * (status='accepted', total_brak_qty, accepted_at). Ok(null) when the run id was not
   * found, so the controller can raise a 404.
   */
  applyAcceptance(
    gangRunId: number,
    totalBrakQty: number,
    allocations: GangRunAllocation[],
  ): Promise<Result<GangRunHeaderRow | null>>;
}

export const PP_GANG_RUNS_REPO = Symbol('IPpGangRunsRepo');
