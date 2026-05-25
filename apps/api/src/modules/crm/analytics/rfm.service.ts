/**
 * @module rfm.service
 * @description RFM (Recency / Frequency / Monetary) customer segmentation.
 *   Classifies every active customer into one of nine standard RFM segments
 *   that drive downstream marketing automation and CRM dashboards.
 * @layer Service (CRM analytics — pure compute, no I/O)
 *
 * WHY THIS EXISTS
 *   Marketing needs a stable, explainable customer segmentation that survives
 *   day-to-day order swings. Raw recency/frequency/monetary numbers are noisy
 *   and incomparable across customer cohorts. Quintile scoring (1..5) normalises
 *   each axis against the current customer base so a "5" is always "top 20%
 *   right now" — letting downstream rules ("re-engage At-Risk") stay invariant
 *   to absolute revenue growth.
 *
 *   Reference: Hughes (1994), the classic RFM framework. Our 9-segment cut is
 *   the most widely-used variant; segment definitions match Adobe / Klaviyo /
 *   Shopify conventions so consultants can use familiar terminology.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

/** Nine standard RFM marketing segments. Order is informational, not ranked. */
export type RfmSegment =
  | 'Champions'           // Bought recently, often, high spend — protect / VIP
  | 'Loyal'               // Bought often, recent — upsell candidates
  | 'Potential Loyalists' // Recent, low-frequency — convert with onboarding
  | 'Recent Customers'    // Very recent, single purchase — first-90-days flow
  | 'Promising'           // Mid-tier across all axes — nurture
  | 'Need Attention'      // Mid-recency, mid-frequency — drift risk
  | 'At-Risk'             // Long inactive, low frequency — win-back campaign
  | "Can't Lose"          // High historical frequency but slipping — urgent re-engage
  | 'Lost';               // Bottom quintile R + F — likely churned, deprioritise

export interface RfmCustomer {
  customerId: string;
  /** Days since the customer's most recent order. Lower = more recent. */
  recencyDays: number;
  /** Total order count in the analysis window (typically 12 months). */
  frequency: number;
  /** Total spend in the analysis window, in base currency (UZS). */
  monetary: number;
}

export interface RfmResult {
  customerId: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  /** 1..5 quintile, **5 = most recent**. Inverted from raw recencyDays sort. */
  rScore: number;
  /** 1..5 quintile, 5 = most frequent. */
  fScore: number;
  /** 1..5 quintile, 5 = highest spend. */
  mScore: number;
  /** Combined RFM code, e.g. 543 = R5/F4/M3. Used as a sort key in dashboards. */
  rfmScore: number;
  segment: RfmSegment;
}

/**
 * @description Bucket an array of numbers into quintiles 1..5 based on rank.
 *   Returns scores in the original input order (NOT sorted order).
 *
 * WHY quintiles rather than absolute thresholds:
 *   Marketing wants the segmentation to auto-adjust as the customer base
 *   grows. A fixed "spend > 1M UZS = high" threshold drifts with inflation
 *   and biases away small-but-active accounts.
 *
 *   `Math.min(5, ...)` caps at 5 because `rank / n * 5` reaches 5.0 only at
 *   the last element — without the cap we'd produce a 6th bucket of size 1.
 */
function assignQuintile(values: number[]): number[] {
  const n = values.length;
  const indexed = values.map((v, i) => ({ v, i }));
  const sorted = [...indexed].sort((a, b) => a.v - b.v);

  const scores = new Array(n).fill(0);
  sorted.forEach((item, rank) => {
    const quintile = Math.min(5, Math.floor((rank / n) * 5) + 1);
    scores[item.i] = quintile;
  });
  return scores;
}

/**
 * @description Map RFM scores → marketing segment label.
 *
 * Order matters — earlier rules override later ones. The hierarchy encodes
 * marketing priority: Champions/Loyal beat all; Lost is a tight definition
 * (both R and F at the bottom) so it cannot accidentally absorb mid-tier
 * customers. "Promising" is the catch-all fallthrough.
 *
 * Monetary (m) only gates the Champions tier — once you've earned Champion
 * status you must also spend in the top 20%. For every other segment the
 * marketing playbook treats spend as a tie-breaker, not a classifier.
 */
function classify(r: number, f: number, m: number): RfmSegment {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 4) return 'Loyal';
  if (r <= 1 && f <= 1) return 'Lost';
  if (r <= 2 && f >= 4) return "Can't Lose";
  if (r === 5 && f < 3) return 'Recent Customers';
  if (r >= 4 && f < 4) return 'Potential Loyalists';
  if (r <= 2 && f <= 2) return 'At-Risk';
  if (r >= 2 && r <= 3 && f >= 2 && f <= 3) return 'Need Attention';
  return 'Promising';
}

@Injectable()
export class RfmService {
  /**
   * @description Segment a customer cohort with RFM in one pass.
   *   Quintiles are computed *across the input array* — so the same customer
   *   may land in a different segment depending on which cohort you pass in
   *   (e.g. all-time vs last-quarter). Callers must scope the cohort
   *   intentionally.
   * @param customers - cohort to segment. Empty arrays are rejected because
   *   quintile math is undefined for n=0.
   * @returns Ok(results) with one RfmResult per input in original order.
   *   Returns Err(BAD_REQUEST) when the cohort is empty.
   * @example
   *   const r = await rfm.segmentCustomers([{ customerId: 'c1', recencyDays: 12, frequency: 8, monetary: 4_500_000 }, ...]);
   *   if (r.ok) return r.data; // each entry has .segment populated
   */
  @Calculation('crm.rfm.segment')
  async segmentCustomers(customers: RfmCustomer[]): Promise<Result<RfmResult[], AppError>> {
    if (!customers.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Mijozlar ro\'yxati bo\'sh' });
    }
    const { rScores, fScores, mScores } = this.computeAxisScores(customers);
    const results = customers.map((c, i) => this.buildSingleResult(c, rScores[i], fScores[i], mScores[i]));
    return Ok(results);
  }

  private computeAxisScores(customers: RfmCustomer[]): { rScores: number[]; fScores: number[]; mScores: number[] } {
    const recencies   = customers.map(c => safeNum(c.recencyDays));
    const frequencies = customers.map(c => safeNum(c.frequency));
    const monetaries  = customers.map(c => safeNum(c.monetary));
    // WHY `6 - s`: assignQuintile sorts ascending — for recencyDays that means
    // "smallest days = quintile 1". But marketing wants "most-recent = 5", so
    // we invert the recency axis here only.
    return {
      rScores: assignQuintile(recencies).map(s => 6 - s),
      fScores: assignQuintile(frequencies),
      mScores: assignQuintile(monetaries),
    };
  }

  private buildSingleResult(c: RfmCustomer, r: number, f: number, ms: number): RfmResult {
    return {
      customerId: c.customerId,
      recencyDays: safeNum(c.recencyDays),
      frequency: safeNum(c.frequency),
      monetary: safeNum(c.monetary),
      rScore: r,
      fScore: f,
      mScore: ms,
      rfmScore: r * 100 + f * 10 + ms,
      segment: classify(r, f, ms),
    };
  }

  /**
   * @description Build an RfmResult for a single customer when caller has
   *   *already computed* the quintile scores externally (e.g. from a cached
   *   cohort segmentation). Use this when you need just one customer's segment
   *   and the cohort scores were precomputed nightly.
   * @param customer - raw RFM inputs (kept on the result for traceability)
   * @param rScore - 1..5 quintile, 5 = most recent
   * @param fScore - 1..5 quintile, 5 = most frequent
   * @param mScore - 1..5 quintile, 5 = highest spend
   * @returns Err(BAD_REQUEST) if any score is non-integer or outside 1..5.
   */
  @Calculation('crm.rfm.single')
  async scoreOne(
    customer: RfmCustomer,
    rScore: number,
    fScore: number,
    mScore: number,
  ): Promise<Result<RfmResult, AppError>> {
    // IMPORTANT: scores must come from `segmentCustomers` over the same cohort
    // that callers reason about — passing arbitrary integers will produce a
    // valid Result but a meaningless segment label.
    for (const [name, v] of [['rScore', rScore], ['fScore', fScore], ['mScore', mScore]] as const) {
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        return Err({ code: 'BAD_REQUEST', message: `${name} 1..5 oralig'ida bo'lishi kerak` });
      }
    }
    return Ok({
      customerId: customer.customerId,
      recencyDays: customer.recencyDays,
      frequency: customer.frequency,
      monetary: customer.monetary,
      rScore,
      fScore,
      mScore,
      rfmScore: rScore * 100 + fScore * 10 + mScore,
      segment: classify(rScore, fScore, mScore),
    });
  }
}
