/**
 * @module pp-plan-fact.service
 * @description Vision 07-pp#20 (EP-PP-106) recommendation service. Delegates persistence to
 *   the repository (Rule 15 — no db.* here) and owns only the pure statistics: the median
 *   (primary recommendation, robust to extremes), the best-20% mean, and the last-5 mean.
 *   The technologist decides which statistic to apply (E1: AI recommends, human confirms).
 *   An empty history yields hasRecommendation=false with null statistics (honest default).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, type Result } from '@common/result';
import {
  PP_PLAN_FACT_REPO,
  type IPpPlanFactRepo,
  type PlanFactEntryRow,
  type LogPlanFactInput,
} from './i-pp-plan-fact.repo';

/** Per-product last-year-fact recommendation (vision 07-pp#20). */
export interface PlanFactRecommendation {
  productId: number;
  /** Count of in-window (trailing 1-year) facts backing the median/best-20% figures. */
  sampleCount: number;
  /** Median of the in-window actuals — the primary recommendation. Null when no facts. */
  median: number | null;
  /** Mean of the best 20% of in-window actuals. Null when no facts. */
  top20Mean: number | null;
  /** Mean of the last 5 actual occurrences overall. Null when no facts. */
  last5Mean: number | null;
  /** True once at least one in-window fact exists (otherwise no recommendation yet). */
  hasRecommendation: boolean;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return round4(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}
function top20Mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => b - a);
  const k = Math.max(1, Math.ceil(s.length * 0.2));
  const top = s.slice(0, k);
  return round4(top.reduce((a, b) => a + b, 0) / top.length);
}
function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return round4(nums.reduce((a, b) => a + b, 0) / nums.length);
}

@Injectable()
export class PpPlanFactService {
  constructor(
    @Inject(PP_PLAN_FACT_REPO) private readonly repo: IPpPlanFactRepo,
  ) {}

  /** Append a plan-fact snapshot row. */
  log(input: LogPlanFactInput): Promise<Result<PlanFactEntryRow>> {
    return this.repo.logEntry(input);
  }

  /**
   * Compute the last-year-fact recommendation for a product: median (primary),
   * best-20% mean, and last-5 mean. Empty history -> zeroed/null honest default.
   */
  async recommend(productId: number): Promise<Result<PlanFactRecommendation>> {
    const res = await this.repo.recommendationInputs(productId);
    if (!res.ok) return Err(res.error);
    const { windowActuals, last5Actuals } = res.data;
    return Ok({
      productId,
      sampleCount: windowActuals.length,
      median: median(windowActuals),
      top20Mean: top20Mean(windowActuals),
      last5Mean: mean(last5Actuals),
      hasRecommendation: windowActuals.length > 0,
    });
  }
}
