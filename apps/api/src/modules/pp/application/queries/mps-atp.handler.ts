import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

export interface MpsEntry {
  period: number;
  quantity: number;
}

export interface CommittedOrder {
  period: number;
  qty: number;
}

export interface AtpPeriod {
  period: number;
  mps: number;
  committedOrders: number;
  cumulativeMps: number;
  cumulativeCo: number;
  atp: number;
  canPromise: boolean;
}

export interface AtpResult {
  productId: string;
  periods: AtpPeriod[];
  totalAtp: number;
  firstNegativePeriod: number | null;
}

function makeAtpErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class MpsAtpHandler {
  /**
   * TZ-11: MPS — Available to Promise (ATP)
   *
   * Kümülatif proyeksion balans usuli:
   *   cumulativeMPS_t = OH + Σ_{k=0}^{t} MPS_k
   *   cumulativeCO_t  = Σ_{k=0}^{t} CO_k
   *   ATP_t = cumulativeMPS_t - cumulativeCO_t
   *
   * ATP_t < 0 → bu davrda va'da qilib bo'lmaydi (zaxira yetarli emas)
   * ATP_t ≥ 0 → canPromise = true
   *
   * Bu usul:
   *   - Orqaga qolgan (backlog) talabni to'g'ri hisobga oladi
   *   - Har davr uchun umumiy mavjud balansni ko'rsatadi
   *   - Double-counting yo'q (har qadamda qo'shilib boradi)
   */
  @Calculation('pp.mps.atp')
  calculateAtp(input: {
    productId: string;
    onHand: number;
    mpsEntries: MpsEntry[];
    committedOrders: CommittedOrder[];
    periods: number;
  }): Result<AtpResult, AppError> {
    const { productId, onHand, mpsEntries, committedOrders, periods } = input;

    if (!productId) return Err(makeAtpErr('productId bo\'sh bo\'lmasin'));
    if (periods <= 0) return Err(makeAtpErr('periods musbat bo\'lishi kerak'));
    if (safeNum(onHand) < 0) return Err(makeAtpErr('onHand manfiy bo\'lmasin'));

    const mpsMap = new Map<number, number>();
    for (const m of mpsEntries) {
      mpsMap.set(m.period, (mpsMap.get(m.period) ?? 0) + safeNum(m.quantity));
    }

    const coMap = new Map<number, number>();
    for (const co of committedOrders) {
      coMap.set(co.period, (coMap.get(co.period) ?? 0) + safeNum(co.qty));
    }

    // Kümülatif balans: OH + Σ MPS_k - Σ CO_k
    let cumulativeMps = safeNum(onHand);
    let cumulativeCo = 0;
    let firstNegativePeriod: number | null = null;
    const atpPeriods: AtpPeriod[] = [];

    for (let t = 0; t < periods; t++) {
      const mps = mpsMap.get(t) ?? 0;
      const co = coMap.get(t) ?? 0;

      cumulativeMps += mps;
      cumulativeCo += co;

      // ATP_t = kümülatif MPS - kümülatif CO
      const atp = cumulativeMps - cumulativeCo;

      if (firstNegativePeriod === null && atp < 0) {
        firstNegativePeriod = t;
      }

      atpPeriods.push({
        period: t,
        mps,
        committedOrders: co,
        cumulativeMps,
        cumulativeCo,
        atp,
        canPromise: atp >= 0,
      });
    }

    // totalAtp: so'nggi davrning ATP qiymati (umumiy balans)
    const totalAtp = atpPeriods.length > 0 ? atpPeriods[atpPeriods.length - 1].atp : 0;

    return Ok({ productId, periods: atpPeriods, totalAtp, firstNegativePeriod });
  }
}
