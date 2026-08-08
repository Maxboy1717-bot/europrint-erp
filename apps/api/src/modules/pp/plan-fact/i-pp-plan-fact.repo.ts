/**
 * @module i-pp-plan-fact.repo
 * @description Port for the PP plan-vs-actual snapshot store (pp_plan_fact_entries) that
 *   feeds the vision 07-pp#20 (EP-PP-106) "last-year fact" recommendation. The table is a
 *   new grain (per-order plan/actual, grouped by product, windowed by date) — distinct
 *   from the papka/shift telemetry in production_facts_sm72. Kept as a small port so the
 *   controller/service stay DB-free (Rule 15). The store starts empty and the calculator
 *   honestly returns no recommendation until facts accumulate (no fabrication).
 */

import type { Result } from '@common/result';

/** One plan-fact row for the API (camelCase view of the pp_plan_fact_entries columns). */
export interface PlanFactEntryRow {
  id: number;
  productionOrderId: number | null;
  productId: number | null;
  entryDate: string;
  plannedQty: number | null;
  actualQty: number | null;
  createdAt: string;
}

/**
 * Log payload. Either productionOrderId or productId must be supplied so product_id
 * resolves (when only the order is given the repo backfills product_id from the order).
 * entryDate defaults to CURRENT_DATE; planned/actual are optional (a row may be logged
 * at plan time and completed later).
 */
export interface LogPlanFactInput {
  productionOrderId?: number;
  productId?: number;
  entryDate?: string; // 'YYYY-MM-DD'
  plannedQty?: number;
  actualQty?: number;
}

/**
 * Raw statistic inputs for the recommendation calculator (arithmetic stays in the
 * service, Rule 15). windowActuals = actuals within the trailing 1-year window ordered
 * oldest->newest (median + best-20%); last5Actuals = the 5 most recent actuals
 * newest->oldest (last-5 mean). Both empty for a product with no facts.
 */
export interface RecommendationInputs {
  windowActuals: number[];
  last5Actuals: number[];
}

export interface IPpPlanFactRepo {
  /** Append a plan-fact snapshot row; returns the created row. */
  logEntry(input: LogPlanFactInput): Promise<Result<PlanFactEntryRow>>;

  /**
   * Fetch the raw actual-quantity samples for a product's recommendation: the trailing
   * 1-year window and the last-5 occurrences. Returns Ok({ [], [] }) when the product has
   * no facts yet (no fabrication).
   */
  recommendationInputs(productId: number): Promise<Result<RecommendationInputs>>;
}

export const PP_PLAN_FACT_REPO = Symbol('IPpPlanFactRepo');
