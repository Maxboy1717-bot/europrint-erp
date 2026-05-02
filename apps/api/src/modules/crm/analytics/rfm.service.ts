/**
 * rfm.service.ts — TZ-39: RFM Segmentatsiya (9 toifa)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export type RfmSegment =
  | 'Champions'
  | 'Loyal'
  | 'Potential Loyalists'
  | 'Recent Customers'
  | 'Promising'
  | 'Need Attention'
  | 'At-Risk'
  | "Can't Lose"
  | 'Lost';

export interface RfmCustomer {
  customerId: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
}

export interface RfmResult {
  customerId: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: RfmSegment;
}

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
  @Calculation('crm.rfm.segment')
  async segmentCustomers(customers: RfmCustomer[]): Promise<Result<RfmResult[], AppError>> {
    if (!customers.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Mijozlar ro\'yxati bo\'sh' });
    }

    const recencies  = customers.map(c => safeNum(c.recencyDays));
    const frequencies = customers.map(c => safeNum(c.frequency));
    const monetaries  = customers.map(c => safeNum(c.monetary));

    const rScores = assignQuintile(recencies).map(s => 6 - s);
    const fScores = assignQuintile(frequencies);
    const mScores = assignQuintile(monetaries);

    const results: RfmResult[] = customers.map((c, i) => {
      const r = rScores[i];
      const f = fScores[i];
      const ms = mScores[i];
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
    });

    return Ok(results);
  }

  @Calculation('crm.rfm.single')
  async scoreOne(
    customer: RfmCustomer,
    rScore: number,
    fScore: number,
    mScore: number,
  ): Promise<Result<RfmResult, AppError>> {
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
