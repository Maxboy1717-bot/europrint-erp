import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv, safeAvg, stddev } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { NelderMeadService } from './nelder-mead.service';

export interface CrostonResult {
  fitted: number[];
  predicted: number[];
  params: { alpha: number; beta: number };
  mape: number;
  mase: number;
  rmse: number;
  demandProbability: number;
  avgDemandSize: number;
}

const DEFAULT_ALPHA = 0.1;
const DEFAULT_BETA  = 0.1;
const CV_THRESHOLD  = 0.5;
const NM_BOUNDS     = [{ min: 0.01, max: 0.99 }, { min: 0.01, max: 0.99 }];

function computeMase(actual: number[], fitted: number[]): number {
  const n = actual.length;
  let sumErr = 0;
  let sumNaive = 0;
  for (let i = 0; i < n; i++) sumErr += Math.abs(actual[i] - fitted[i]);
  for (let i = 1; i < n; i++) sumNaive += Math.abs(actual[i] - actual[i - 1]);
  const meanErr   = safeDiv(sumErr,   n);
  const meanNaive = safeDiv(sumNaive, n - 1);
  return safeDiv(meanErr, meanNaive);
}

function computeRmse(actual: number[], fitted: number[]): number {
  const n = actual.length;
  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += (actual[i] - fitted[i]) ** 2;
  return Math.sqrt(safeDiv(sumSq, n));
}

/** Masked MAPE — only periods where actual > 0 (handles sporadic zeros) */
function computeMape(actual: number[], fitted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] ?? 0) > 0) {
      sum += Math.abs(((actual[i] ?? 0) - (fitted[i] ?? 0)) / Math.abs(actual[i] ?? 0));
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * TSB (Teunter-Syntetos-Babai) core — correct parametrization:
 *   alpha — smooths demand occurrence probability (lambda)
 *   beta  — smooths mean demand size (mu)
 *
 *   y_t > 0:  lambda_t = alpha·1 + (1-alpha)·lambda_{t-1}
 *             mu_t     = beta·y_t + (1-beta)·mu_{t-1}
 *   y_t = 0:  lambda_t = alpha·0 + (1-alpha)·lambda_{t-1}  (probability decays)
 *             mu_t     = (1-beta)·mu_{t-1}                 (size decays)
 *   forecast = lambda · mu
 */
function tsbCore(series: number[], alpha: number, beta: number, horizon: number) {
  const n = series.length;
  const fitted: number[] = [];

  let lambda = series[0] > 0 ? 1.0 : 0.0;
  let mu     = series[0] > 0 ? series[0] : 0.0;

  for (let t = 0; t < n; t++) {
    fitted.push(lambda * mu);
    if (series[t] > 0) {
      lambda = alpha * 1.0        + (1 - alpha) * lambda;
      mu     = beta  * series[t]  + (1 - beta)  * mu;
    } else {
      lambda = (1 - alpha) * lambda;
      mu     = (1 - beta)  * mu;
    }
  }

  const predicted: number[] = [];
  for (let h = 0; h < horizon; h++) predicted.push(lambda * mu);

  return { fitted, predicted, lambda, mu };
}

/** TZ-30: TSB (Teunter-Syntetos-Babai) — sporadic demand */
@Injectable()
export class CrostonService {
  constructor(private readonly nmSvc: NelderMeadService) {}

  /**
   * When alpha/beta not supplied, optimise via Nelder-Mead minimising
   * RMSE on a 20% hold-out tail (rolling evaluation).
   */
  private optimizeParams(series: number[]): { alpha: number; beta: number } {
    const holdLen = Math.max(1, Math.floor(series.length * 0.2));
    const train   = series.slice(0, series.length - holdLen);
    const test    = series.slice(series.length - holdLen);

    const { params } = this.nmSvc.optimize(
      ([a, b]: number[]) => {
        const { predicted: pred } = tsbCore(train, safeNum(a), safeNum(b), holdLen);
        return computeRmse(test, pred);
      },
      [DEFAULT_ALPHA, DEFAULT_BETA],
      NM_BOUNDS,
    );

    return { alpha: params[0] ?? DEFAULT_ALPHA, beta: params[1] ?? DEFAULT_BETA };
  }

  @Calculation('forecast.croston')
  async forecast(
    series: number[],
    horizon: number,
    alpha?: number,
    beta?: number,
  ): Promise<Result<CrostonResult, AppError>> {
    if (!Array.isArray(series) || series.length < 4) {
      return Err({ code: 'VALIDATION', message: 'Croston uchun kamida 4 ta kuzatuv kerak' });
    }
    if (horizon <= 0) {
      return Err({ code: 'VALIDATION', message: 'horizon musbat bo\'lishi kerak' });
    }

    const safe = (series ?? []).map(safeNum);

    let usedAlpha: number;
    let usedBeta:  number;

    if (alpha !== undefined && beta !== undefined) {
      usedAlpha = alpha;
      usedBeta  = beta;
    } else {
      const opt = this.optimizeParams(safe);
      usedAlpha = alpha ?? opt.alpha;
      usedBeta  = beta  ?? opt.beta;
    }

    const { fitted, predicted, lambda, mu } = tsbCore(safe, usedAlpha, usedBeta, horizon);
    const mape = computeMape(safe, fitted);
    const mase = computeMase(safe, fitted);
    const rmse = computeRmse(safe, fitted);

    return Ok({
      fitted,
      predicted,
      params: { alpha: usedAlpha, beta: usedBeta },
      mape,
      mase,
      rmse,
      demandProbability: lambda,
      avgDemandSize: mu,
    });
  }

  /** Check if CV > threshold → recommend Croston */
  isSporadic(series: number[]): boolean {
    const safe = (series ?? []).map(safeNum);
    const avg  = safeAvg(safe);
    const sd   = stddev(safe);
    return safeDiv(sd, Math.abs(avg)) > CV_THRESHOLD;
  }
}
