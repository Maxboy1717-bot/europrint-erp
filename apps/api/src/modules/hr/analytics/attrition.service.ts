/**
 * attrition.service.ts — TZ-44: Attrition va Turnover Rate
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export type TurnoverStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
export type TenureRisk = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AttritionInput {
  hcBegin: number;
  hcEnd: number;
  separations: number;
  resignations: number;
  regretted: number;
  separationsByTenureMonths?: number[];
}

export interface TenureDistribution {
  riskHigh: number;
  riskMed: number;
  riskLow: number;
  riskHighPct: number;
  riskMedPct: number;
  riskLowPct: number;
}

export interface TurnoverReport {
  hcBegin: number;
  hcEnd: number;
  hcAvg: number;
  separations: number;
  resignations: number;
  regretted: number;
  annualTurnover: number;
  voluntaryAttrition: number;
  regrettedRate: number;
  status: TurnoverStatus;
  benchmark: { healthy: boolean; critical: boolean };
  tenureDistribution: TenureDistribution;
}

export interface SurvivalInput {
  initialHeadcount: number;
  cumulativeAttritionByPeriod: number[];
}

export interface SurvivalResult {
  survivalRates: number[];
  periods: number;
}

@Injectable()
export class AttritionService {
  private round1(n: number): number {
    return Math.round(n * 10) / 10;
  }

  private getTenureRisk(months: number): TenureRisk {
    if (months < 6) return 'HIGH';
    if (months < 24) return 'MEDIUM';
    return 'LOW';
  }

  @Calculation('hr.attrition.calculate')
  async calculateAttrition(input: AttritionInput): Promise<Result<TurnoverReport, AppError>> {
    const hcBegin = safeNum(input.hcBegin);
    const hcEnd = safeNum(input.hcEnd);
    const separations = safeNum(input.separations);
    const resignations = safeNum(input.resignations);
    const regretted = safeNum(input.regretted);

    if (hcBegin < 0 || hcEnd < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'HC qiymatlari manfiy bo\'lishi mumkin emas' });
    }
    if (separations < 0 || resignations < 0 || regretted < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Separation/resignation/regretted manfiy bo\'lishi mumkin emas' });
    }
    if (resignations > separations) {
      return Err({ code: 'BAD_REQUEST', message: 'Resignations separations dan ko\'p bo\'lishi mumkin emas' });
    }
    if (regretted > separations) {
      return Err({ code: 'BAD_REQUEST', message: 'Regretted separations dan ko\'p bo\'lishi mumkin emas' });
    }

    const hcAvg = safeDiv(hcBegin + hcEnd, 2);
    if (hcAvg === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'O\'rtacha HC nol — hisoblash mumkin emas' });
    }

    const annualTurnover = this.round1(safeDiv(separations, hcAvg) * 100);
    const voluntaryAttrition = this.round1(safeDiv(resignations, hcAvg) * 100);
    const regrettedRate = this.round1(safeDiv(regretted, separations) * 100);

    const status: TurnoverStatus =
      annualTurnover > 30 ? 'CRITICAL' :
      annualTurnover > 15 ? 'WARNING' : 'HEALTHY';

    const tenures = Array.isArray(input.separationsByTenureMonths) ? input.separationsByTenureMonths : [];
    const total = tenures.length;
    const riskHigh = (Array.isArray(tenures) ? tenures : []).filter(m => m < 6).length;
    const riskMed = (Array.isArray(tenures) ? tenures : []).filter(m => m >= 6 && m < 24).length;
    const riskLow = (Array.isArray(tenures) ? tenures : []).filter(m => m >= 24).length;

    return Ok({
      hcBegin, hcEnd, hcAvg,
      separations, resignations, regretted,
      annualTurnover, voluntaryAttrition, regrettedRate,
      status,
      benchmark: { healthy: annualTurnover < 15, critical: annualTurnover > 30 },
      tenureDistribution: {
        riskHigh, riskMed, riskLow,
        riskHighPct: this.round1(safeDiv(riskHigh, total) * 100),
        riskMedPct:  this.round1(safeDiv(riskMed, total) * 100),
        riskLowPct:  this.round1(safeDiv(riskLow, total) * 100),
      },
    });
  }

  @Calculation('hr.attrition.survival')
  async calculateSurvival(input: SurvivalInput): Promise<Result<SurvivalResult, AppError>> {
    const { initialHeadcount, cumulativeAttritionByPeriod } = input;

    if (safeNum(initialHeadcount) <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'initialHeadcount musbat bo\'lishi kerak' });
    }
    if (!cumulativeAttritionByPeriod.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Davrlar bo\'sh' });
    }

    const n = safeNum(initialHeadcount);
    const safePeriods = Array.isArray(cumulativeAttritionByPeriod) ? cumulativeAttritionByPeriod : [];
    const survivalRates = (safePeriods ?? []).map(cumAttrition => {
      const s = 1 - safeDiv(safeNum(cumAttrition), n);
      return Math.round(Math.max(0, s) * 1000) / 1000;
    });

    return Ok({ survivalRates, periods: cumulativeAttritionByPeriod.length });
  }
}
