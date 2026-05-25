/**
 * @module elo-rating.service
 * @description ELO rating system adapted for supplier reliability and
 *   employee performance ranking. Same chess-rating math, applied to
 *   delivery/task outcomes:
 *
 *     R'_A = R_A + K × (S_A − E_A)
 *     E_A  = 1 / (1 + 10^((R̄ − R_A) / 400))
 *
 *   - `R̄ = 1500` is the system mean — every new entity starts here, and
 *     beating "the average" increases your rating, failing it decreases.
 *   - `K` is the volatility factor — higher = ratings move faster.
 *     Decreases with experience so seasoned entities don't bounce around.
 *   - `S_A` is the observed outcome score (1.0 perfect → 0.0 failed).
 *
 *   K-factor by experience:
 *     ≤  20 games   → K = 40  (rookie, high movement)
 *     ≤  50 games   → K = 24  (intermediate)
 *     >  50 games   → K = 16  (veteran, stable)
 *
 *   Outcome scores:
 *     perfect    → 1.0   on-time + within spec
 *     late_1day  → 0.7   minor slip, manageable
 *     late_3plus → 0.3   significant slip, business impact
 *     failed     → 0.0   total miss (no delivery / rejected QC / no-show)
 * @layer Domain Service (CRM — applied to suppliers + employees)
 *
 * WHY ELO INSTEAD OF SIMPLE AVERAGES OR % METRICS
 *   Two reasons ELO beats simple "% on-time" tracking:
 *     1. **Context-aware**: ELO weights outcomes against expected performance.
 *        A high-rated supplier missing once costs them more rating than a
 *        low-rated supplier missing once. This matches intuition — we expect
 *        more from the top-tier.
 *     2. **Self-stabilising**: K-factor decay means experienced entities
 *        accumulate rating slowly, preventing volatile leaderboards. A new
 *        supplier with 3 perfect deliveries can rapidly climb (K=40); after
 *        50+ deliveries each new one shifts rating only ±16 max.
 *
 *   ELO is also intuitive to non-engineers — most know it from chess /
 *   competitive games. "1700 rating" is more communicable than
 *   "94% on-time, 2.3σ variance".
 *
 * WHY BASE = 1500
 *   FIDE chess convention. Picking it has no mathematical significance;
 *   the deltas matter, not the absolute level. Sticking with 1500 keeps
 *   our supplier ratings comparable to public benchmarks (some industry
 *   reports publish "ELO-style" supplier ratings using the same scale).
 *
 * WHY K=40 / 24 / 16 INSTEAD OF FLAT K=32
 *   Flat K (the basic ELO) overweights rookies — a single bad delivery
 *   can wipe out half their rating. The three-tier K matches FIDE's
 *   "junior/standard/master" tiering and gives newcomers room to learn
 *   without permanent damage to their score.
 *
 * WHY 4 OUTCOME BUCKETS INSTEAD OF A CONTINUOUS SCORE
 *   "Was delivery 0.85 perfect?" is unanswerable. Categorical outcomes
 *   are observable by inspectors without judgement calls. The 0/0.3/0.7/1
 *   spacing matches the "S-curve" intuition: minor slips don't tank the
 *   score, but failures hurt a lot.
 *
 * WHY USED FOR BOTH SUPPLIERS AND EMPLOYEES
 *   The math doesn't care about the entity type. Both produce outcomes
 *   that can be scored (delivery on-time vs. task on-time, QC pass vs.
 *   inspection pass). `entityType` is stored alongside but isn't used
 *   in the formula — different leaderboards filter on the type.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';

export type EloOutcome = 'perfect' | 'late_1day' | 'late_3plus' | 'failed';
export type EloEntityType = 'supplier' | 'employee';

export interface EloUpdateInput {
  currentRating: number;
  gamesPlayed: number;
  outcome: EloOutcome;
}

export interface EloUpdateResult {
  previousRating: number;
  newRating: number;
  change: number;
  K: number;
  expectedScore: number;
  actualScore: number;
}

const BASE_RATING = 1500;

const OUTCOME_SCORE: Record<EloOutcome, number> = {
  perfect: 1.0,
  late_1day: 0.7,
  late_3plus: 0.3,
  failed: 0.0,
};

@Injectable()
export class EloRatingService {
  private getK(gamesPlayed: number): number {
    if (gamesPlayed <= 20) return 40;
    if (gamesPlayed <= 50) return 24;
    return 16;
  }

  @Calculation('crm.elo.update')
  async updateRating(input: EloUpdateInput): Promise<Result<EloUpdateResult, AppError>> {
    const { currentRating, gamesPlayed, outcome } = input;

    if (!Number.isFinite(currentRating) || currentRating < 0) {
      return Err({ code: 'BAD_REQUEST', message: `Reyting musbat son bo'lishi kerak` });
    }
    if (gamesPlayed < 0 || !Number.isInteger(gamesPlayed)) {
      return Err({ code: 'BAD_REQUEST', message: `gamesPlayed manfiy bo'lishi mumkin emas` });
    }

    const K = this.getK(gamesPlayed);
    const S = OUTCOME_SCORE[outcome];
    const E = 1 / (1 + Math.pow(10, (BASE_RATING - currentRating) / 400));
    const newRating = Math.round(currentRating + K * (S - E));

    return Ok({
      previousRating: currentRating,
      newRating,
      change: newRating - currentRating,
      K,
      expectedScore: E,
      actualScore: S,
    });
  }

  @Calculation('crm.elo.bulkUpdate')
  async bulkUpdate(
    ratings: Array<EloUpdateInput & { entityId: string }>,
  ): Promise<Result<Array<EloUpdateResult & { entityId: string }>, AppError>> {
    if (!ratings.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Reyting ro\'yxati bo\'sh' });
    }

    const results: Array<EloUpdateResult & { entityId: string }> = [];
    for (const item of ratings) {
      const r = await this.updateRating(item);
      if (!r.ok) return Err(r.error);
      results.push({ ...r.data, entityId: item.entityId });
    }

    return Ok(results);
  }
}
