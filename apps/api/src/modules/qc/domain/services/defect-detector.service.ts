import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv, safeNum, safeAvg } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface SamplePoint {
  sampleSize: number;
  defects: number;
}

export interface PChartResult {
  pBar: number;
  ucl: number;
  lcl: number;
  sigma: number;
  currentP: number;
  isOutOfControl: boolean;
  violations: string[];
}

/**
 * TZ-D11: p-chart + Western Electric 4 qoidasi
 */
@Injectable()
export class DefectDetectorService {
  @Calculation('qc.pChart.compute')
  async computePChart(
    history: readonly SamplePoint[],
    sampleSize: number,
    defects: number,
  ): Promise<Result<PChartResult, AppError>> {
    if (defects > sampleSize) {
      return Err({ code: 'BAD_REQUEST', message: 'defects > sampleSize' });
    }
    if (sampleSize <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'sampleSize > 0 bo\'lishi kerak' });
    }

    const last25 = [...history.slice(-24), { sampleSize, defects }];

    const totalDefects = last25.reduce((s, p) => s + safeNum(p.defects), 0);
    const totalSamples = last25.reduce((s, p) => s + safeNum(p.sampleSize), 0);
    const pBar    = safeDiv(totalDefects, totalSamples);
    const nBar    = safeAvg(last25.map(p => safeNum(p.sampleSize)));
    const sigma   = Math.sqrt(safeDiv(pBar * (1 - pBar), nBar));
    const ucl     = pBar + 3 * sigma;
    const lcl     = Math.max(0, pBar - 3 * sigma);
    const currentP = safeDiv(defects, sampleSize);

    const points = last25.map(p => safeDiv(safeNum(p.defects), safeNum(p.sampleSize)));
    const violations = this._westernElectricRules(points, pBar, sigma);

    const isOutOfControl = currentP > ucl || violations.length > 0;

    return Ok({ pBar, ucl, lcl, sigma, currentP, isOutOfControl, violations });
  }

  _westernElectricRules(
    points: readonly number[],
    center: number,
    sigma: number,
  ): string[] {
    const violations: string[] = [];
    const n = points.length;

    const last = points[n - 1] ?? 0;
    if (last > center + 3 * sigma || last < center - 3 * sigma) {
      violations.push('RULE_1_3SIGMA');
    }

    if (n >= 3) {
      const last3 = points.slice(-3);
      const aboveUpper = last3.filter(p => p > center + 2 * sigma).length;
      const belowLower = last3.filter(p => p < center - 2 * sigma).length;
      if (aboveUpper >= 2 || belowLower >= 2) violations.push('RULE_2_2OF3_2SIGMA');
    }

    if (n >= 5) {
      const last5 = points.slice(-5);
      const aboveUpper = last5.filter(p => p > center + sigma).length;
      const belowLower = last5.filter(p => p < center - sigma).length;
      if (aboveUpper >= 4 || belowLower >= 4) violations.push('RULE_3_4OF5_1SIGMA');
    }

    if (n >= 8) {
      const last8 = points.slice(-8);
      const allAbove = last8.every(p => p > center);
      const allBelow = last8.every(p => p < center);
      if (allAbove || allBelow) violations.push('RULE_4_8_RUN');
    }

    return violations;
  }
}
