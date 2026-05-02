import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

export interface ActualCostInput {
  materialPricePerUnit: number;
  materialQtyUsed: number;
  laborRatePerHour: number;
  laborHours: number;
  goodQty: number;
  overheadActual?: number;
}

export interface StandardCostInput {
  materialPricePerUnit: number;
  materialQtyPerUnit: number;
  laborRatePerHour: number;
  laborHoursPerUnit: number;
  overheadAppliedPerUnit?: number;
}

export interface VarianceReport {
  mpv: number;
  mqv: number;
  lrv: number;
  lev: number;
  overheadVariance: number;
  totalVariance: number;
  mpvLabel: string;
  mqvLabel: string;
  lrvLabel: string;
  levLabel: string;
  summary: string;
}

function fLabel(value: number): string {
  if (value < -1e-9) return 'Favorable (F)';
  if (value > 1e-9) return 'Unfavorable (U)';
  return 'Neytral';
}

function makeCostErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class CostingService {
  /**
   * TZ-17: Standart Tannarx + Variance Tahlili
   *
   * MPV = (AP - SP) × AQ       Material Price Variance
   * MQV = (AQ - SQ) × SP       Material Quantity Variance
   * LRV = (AR - SR) × AH       Labor Rate Variance
   * LEV = (AH - SH) × SR       Labor Efficiency Variance
   * OV  = Applied_OH - Actual_OH
   *
   * < 0 = Favorable (F): actual < standard (tejash)
   * > 0 = Unfavorable (U): actual > standard (ortiqcha xarajat)
   */
  @Calculation('pp.costing.variance')
  calculateVariance(
    actual: ActualCostInput,
    standard: StandardCostInput,
  ): Result<VarianceReport, AppError> {
    const goodQty = safeNum(actual.goodQty);
    if (goodQty < 0) return Err(makeCostErr('goodQty manfiy bo\'lmasin'));

    const AP = safeNum(actual.materialPricePerUnit);
    const SP = safeNum(standard.materialPricePerUnit);
    const AQ = safeNum(actual.materialQtyUsed);
    const SQ = safeNum(standard.materialQtyPerUnit) * goodQty;
    const AR = safeNum(actual.laborRatePerHour);
    const SR = safeNum(standard.laborRatePerHour);
    const AH = safeNum(actual.laborHours);
    const SH = safeNum(standard.laborHoursPerUnit) * goodQty;

    const appliedOverhead = safeNum(standard.overheadAppliedPerUnit, 0) * goodQty;
    const actualOverhead = safeNum(actual.overheadActual, 0);

    const mpv = (AP - SP) * AQ;
    const mqv = (AQ - SQ) * SP;
    const lrv = (AR - SR) * AH;
    const lev = (AH - SH) * SR;
    const overheadVariance = appliedOverhead - actualOverhead;
    const totalVariance = mpv + mqv + lrv + lev + overheadVariance;

    const unfavorableCount = ([mpv, mqv, lrv, lev]).filter((v) => v > 1e-9).length;
    const summary =
      unfavorableCount === 0
        ? 'Barcha variances Favorable — xarajatlar nazorat ostida'
        : `${unfavorableCount} ta Unfavorable variance — tekshiruv talab etiladi`;

    return Ok({
      mpv,
      mqv,
      lrv,
      lev,
      overheadVariance,
      totalVariance,
      mpvLabel: fLabel(mpv),
      mqvLabel: fLabel(mqv),
      lrvLabel: fLabel(lrv),
      levLabel: fLabel(lev),
      summary,
    });
  }

  /**
   * Standart mahsulot tannarxini hisoblash
   * StandardCost = materialCost + laborCost + overhead
   */
  @Calculation('pp.costing.standard')
  calculateStandardCost(standard: StandardCostInput, qty: number = 1): Result<{
    materialCost: number;
    laborCost: number;
    overhead: number;
    totalPerUnit: number;
    totalForQty: number;
  }, AppError> {
    if (safeNum(qty) <= 0) return Err(makeCostErr('qty musbat bo\'lishi kerak'));

    const materialCost = safeNum(standard.materialPricePerUnit) * safeNum(standard.materialQtyPerUnit);
    const laborCost = safeNum(standard.laborRatePerHour) * safeNum(standard.laborHoursPerUnit);
    const overhead = safeNum(standard.overheadAppliedPerUnit, 0);
    const totalPerUnit = materialCost + laborCost + overhead;
    const totalForQty = totalPerUnit * qty;

    return Ok({ materialCost, laborCost, overhead, totalPerUnit, totalForQty });
  }
}
