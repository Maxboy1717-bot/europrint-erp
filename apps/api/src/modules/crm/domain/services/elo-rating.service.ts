/**
 * elo-rating.service.ts — TZ-D13: Supplier/Employee Elo Reyting Tizimi
 *
 * Formula:
 *   R'_A = R_A + K × (S_A − E_A)
 *
 *   E_A = 1 / (1 + 10^((R̄ − R_A) / 400))
 *   R̄ = 1500 (tizim o'rtacha reyting)
 *
 *   K-faktor:
 *     K = 40   (yangi: 0–20 ta o'yin)
 *     K = 24   (o'rta: 21–50 ta o'yin)
 *     K = 16   (tajribali: 50+ ta o'yin)
 *
 *   S_A natija:
 *     perfect    → 1.0
 *     late_1day  → 0.7
 *     late_3plus → 0.3
 *     failed     → 0.0
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
