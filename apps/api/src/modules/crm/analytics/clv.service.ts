/**
 * clv.service.ts — TZ-40: CLV — Customer Lifetime Value
 *
 * Oddiy (BG/NBD approximation):
 *   CLV = (AvgOrderValue × PurchaseFreq × GrossMargin) / ChurnRate
 *
 * Diskontlangan (DCF):
 *   CLV = Σ_{t=0}^{n}  (R_t − C_t) / (1 + r)^t
 *
 *   bu yerda:
 *     R_t = t-davrda kutilgan daromad
 *     C_t = t-davrda sarflar
 *     r   = diskont stavkasi (kapital narxi)
 *     n   = prognoz gorizonti (oy/yil)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface SimpleClvInput {
  avgOrderValue: number;
  purchaseFrequencyPerYear: number;
  grossMarginRate: number;
  churnRate: number;
}

export interface SimpleClvResult {
  clv: number;
  avgOrderValue: number;
  annualRevenue: number;
  annualMargin: number;
  churnRate: number;
  avgLifespanYears: number;
}

export interface DcfPeriod {
  revenue: number;
  cost: number;
}

export interface DcfClvInput {
  periods: DcfPeriod[];
  discountRate: number;
}

export interface DcfClvResult {
  clv: number;
  discountRate: number;
  periods: number;
  presentValues: number[];
}

@Injectable()
export class ClvService {
  @Calculation('crm.clv.simple')
  async calculateSimple(input: SimpleClvInput): Promise<Result<SimpleClvResult, AppError>> {
    const { avgOrderValue, purchaseFrequencyPerYear, grossMarginRate, churnRate } = input;

    if (safeNum(grossMarginRate) < 0 || safeNum(grossMarginRate) > 1) {
      return Err({ code: 'BAD_REQUEST', message: 'grossMarginRate 0..1 oralig\'ida bo\'lishi kerak' });
    }
    if (safeNum(churnRate) <= 0 || safeNum(churnRate) > 1) {
      return Err({ code: 'BAD_REQUEST', message: 'churnRate (0..1] oralig\'ida bo\'lishi kerak' });
    }
    if (safeNum(avgOrderValue) < 0 || safeNum(purchaseFrequencyPerYear) < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'avgOrderValue va purchaseFrequency musbat bo\'lishi kerak' });
    }

    const aov = safeNum(avgOrderValue);
    const freq = safeNum(purchaseFrequencyPerYear);
    const margin = safeNum(grossMarginRate);
    const churn = safeNum(churnRate);

    const annualRevenue = aov * freq;
    const annualMargin = annualRevenue * margin;
    const avgLifespanYears = safeDiv(1, churn);
    const clv = safeDiv(annualMargin, churn);

    return Ok({
      clv,
      avgOrderValue: aov,
      annualRevenue,
      annualMargin,
      churnRate: churn,
      avgLifespanYears,
    });
  }

  @Calculation('crm.clv.dcf')
  async calculateDcf(input: DcfClvInput): Promise<Result<DcfClvResult, AppError>> {
    const { periods, discountRate } = input;

    if (!periods || periods.length === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'DCF uchun kamida 1 ta davr kerak' });
    }
    const r = safeNum(discountRate);
    if (r < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'discountRate manfiy bo\'lishi mumkin emas' });
    }

    const presentValues: number[] = (Array.isArray(periods) ? periods : []).map((p, t) => {
      const netCashFlow = safeNum(p.revenue) - safeNum(p.cost);
      return safeDiv(netCashFlow, Math.pow(1 + r, t));
    });

    const clv = (Array.isArray(presentValues) ? presentValues : []).reduce((sum, pv) => sum + pv, 0);

    return Ok({
      clv,
      discountRate: r,
      periods: periods.length,
      presentValues,
    });
  }
}
