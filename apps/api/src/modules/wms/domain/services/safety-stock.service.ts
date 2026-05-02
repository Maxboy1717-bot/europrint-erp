import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv, safeAvg, stddev, safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

const EWM_ALPHA = 0.2;

export type AbcClass = 'A' | 'B' | 'C';

const ABC_Z_TABLE: Record<AbcClass, number> = {
  A: 2.326,
  B: 1.645,
  C: 1.282,
};

const Z_TABLE: Record<number, number> = {
  0.90: 1.282,
  0.95: 1.645,
  0.99: 2.326,
  0.999: 3.090,
};

export interface SafetyStockParams {
  dailyDemandSeries: number[];
  leadTimeDays: number;
  leadTimeSeries?: number[];
  serviceLevel?: number;
  abcClass?: AbcClass;
  useEwm?: boolean;
}

export interface EwmStats {
  ewmMean: number;
  ewmStdDev: number;
}

export interface SafetyStockResult {
  safetyStock: number;
  zScore: number;
  avgDailyDemand: number;
  demandStdDev: number;
  ewmMean?: number;
  ewmStdDev?: number;
}

function makeSSErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

/**
 * EWM: Exponentially Weighted Mean + Variance
 * alpha = 0.2 — yangi kuzatuvlar ko'proq og'irlik
 */
function computeEwm(series: number[]): EwmStats {
  const alpha = EWM_ALPHA;
  const mu0 = safeAvg(series);
  let mu = mu0;
  let variance = 0;

  for (const d of series) {
    const prevMu = mu;
    mu = alpha * d + (1 - alpha) * prevMu;
    variance = alpha * (d - mu) ** 2 + (1 - alpha) * variance;
  }

  return { ewmMean: mu, ewmStdDev: Math.sqrt(variance) };
}

@Injectable()
export class SafetyStockService {
  /**
   * TZ-02: Safety Stock — EWM + ABC Z-score yoki serviceLevel bilan
   *
   * SS = Z × sqrt(L̄ × σ_d² + d̄² × σ_L²)
   */
  @Calculation('wms.safetyStock.calculate')
  calculate(params: SafetyStockParams): Result<SafetyStockResult, AppError> {
    const {
      dailyDemandSeries,
      leadTimeDays,
      leadTimeSeries,
      serviceLevel = 0.95,
      abcClass,
      useEwm = false,
    } = params;

    if (!dailyDemandSeries || dailyDemandSeries.length < 7) {
      return Err(makeSSErr('Kamida 7 kun talab tarixi kerak'));
    }
    if (leadTimeDays <= 0) {
      return Err(makeSSErr('leadTimeDays musbat bo\'lishi kerak'));
    }

    const Z = abcClass ? ABC_Z_TABLE[abcClass] : (Z_TABLE[serviceLevel] ?? 1.645);

    let dBar: number;
    let sigmaD: number;
    let ewmResult: EwmStats | undefined;

    if (useEwm) {
      ewmResult = computeEwm(dailyDemandSeries ?? []);
      dBar = ewmResult.ewmMean;
      sigmaD = ewmResult.ewmStdDev;
    } else {
      dBar = safeAvg(dailyDemandSeries);
      sigmaD = stddev(dailyDemandSeries);
    }

    let ss: number;
    if (leadTimeSeries && leadTimeSeries.length >= 3) {
      const sigmaL = stddev(leadTimeSeries);
      const avgL = safeAvg(leadTimeSeries);
      ss = Z * Math.sqrt(avgL * sigmaD ** 2 + dBar ** 2 * sigmaL ** 2);
    } else {
      ss = Z * sigmaD * Math.sqrt(safeNum(leadTimeDays));
    }

    return Ok({
      safetyStock: Math.ceil(ss),
      zScore: Z,
      avgDailyDemand: dBar,
      demandStdDev: sigmaD,
      ewmMean: ewmResult?.ewmMean,
      ewmStdDev: ewmResult?.ewmStdDev,
    });
  }

  @Calculation('wms.safetyStock.computeEwm')
  computeEwmStats(series: number[]): EwmStats {
    return computeEwm(series ?? []);
  }

  getZScore(serviceLevel: number): number {
    return Z_TABLE[serviceLevel] ?? 1.645;
  }

  getAbcZScore(abcClass: AbcClass): number {
    return ABC_Z_TABLE[abcClass];
  }
}
