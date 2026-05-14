/**
 * @module ensemble-forecast.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv, safeAvg } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { ForecastService } from './forecast.service';
import { HoltWintersService } from './holt-winters.service';
import { CrostonService } from './croston.service';
import { CI_LOWER, CI_UPPER, ENSEMBLE_EMA_ALPHA, FORECAST_HOLDOUT_FRACTION } from '../../../common/constants/business.constants';

const EPSILON = 1e-10;
const BOOTSTRAP_SAMPLES = 200;
const CI_LOW_10 = 0.10;
const CI_HIGH_90 = 0.90;

export interface EnsembleResult {
  predicted: number[];
  ci80Lower: number[];
  ci80Upper: number[];
  ci95Lower: number[];
  ci95Upper: number[];
  modelWeights: { ema: number; hw: number; croston: number };
  modelMapes: { ema: number; hw: number; croston: number };
  confidence: number;
  hitlRequired: boolean;
  ciWidthRatio: number;
  hitlReason: string | null;
}

const CI_WIDTH_HITL_THRESHOLD = 2.0;
const HITL_CONFIDENCE_THRESHOLD = 0.70;

function quantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo] ?? 0;
  return (sorted[lo] ?? 0) * (hi - pos) + (sorted[hi] ?? 0) * (pos - lo);
}

function mapeOf(actual: number[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    const denom = Math.max(Math.abs(actual[i] ?? 0), EPSILON);
    sum += Math.abs((actual[i] ?? 0) - (predicted[i] ?? 0)) / denom;
  }
  return safeDiv(sum, actual.length) * 100;
}

const A_BOOT = ENSEMBLE_EMA_ALPHA;

/**
 * Bootstrap CI using residual resampling on in-sample EMA fitted values:
 * 1. Compute one-step-ahead EMA predictions for the full training series
 * 2. Compute residuals = actual - fitted (in-sample)
 * 3. Build bootstrap series = fitted + resampled residuals
 * 4. Run full weighted-ensemble on each bootstrap sample
 * 5. CI bounds are quantiles of the bootstrap forecast distribution
 */
function bootstrapForecast(
  series: number[],
  horizon: number,
  forecastFn: (s: number[]) => number[],
): number[][] {
  const results: number[][] = [];
  const n = series.length;

  // In-sample one-step-ahead EMA predictions (properly aligned)
  const fitted: number[] = new Array(n).fill(0) as number[];
  fitted[0] = series[0] ?? 0;
  let ema = series[0] ?? 0;
  for (let i = 1; i < n; i++) {
    fitted[i] = ema;
    ema = A_BOOT * (series[i] ?? 0) + (1 - A_BOOT) * ema;
  }

  const residuals = (Array.isArray(series) ? series : []).map((v, i) => v - (fitted[i] ?? 0));

  for (let b = 0; b < BOOTSTRAP_SAMPLES; b++) {
    const bootstrapSeries = (Array.isArray(fitted) ? fitted : []).map((f) => {
      const r = residuals[Math.floor(Math.random() * residuals.length)] ?? 0;
      return f + r;
    });
    results.push(forecastFn(bootstrapSeries));
  }
  return results;
}

/** MAPE-weighted ensemble: HW + EMA + Croston */
@Injectable()
export class EnsembleForecastService {
  constructor(
    private readonly forecastSvc: ForecastService,
    private readonly hwSvc: HoltWintersService,
    private readonly crostonSvc: CrostonService,
  ) {}

  @Calculation('forecast.ensemble')
  async ensemble(
    series: number[],
    horizon: number,
    seasonLength = 13,
  ): Promise<Result<EnsembleResult, AppError>> {
    if (!Array.isArray(series) || series.length < 2 * seasonLength) {
      return Err({ code: 'VALIDATION', message: `Ensemble uchun kamida ${2 * seasonLength} nuqta kerak` });
    }
    if (horizon <= 0) {
      return Err({ code: 'VALIDATION', message: 'horizon musbat bo\'lishi kerak' });
    }

    const safe = (Array.isArray(series) ? series : []).map(safeNum);
    const avg  = safeAvg(safe);

    const holdLen = Math.max(1, Math.min(Math.floor(safe.length * FORECAST_HOLDOUT_FRACTION), horizon));
    const train   = safe.slice(0, safe.length - holdLen);
    const holdOut = safe.slice(safe.length - holdLen);
    const trainAvg = safeAvg(train);

    const [holdEmaRes, holdHwRes, holdCrostonRes] = await Promise.all([
      this.forecastSvc.forecastEma(train, holdLen),
      this.hwSvc.autoForecast(train, holdLen, seasonLength),
      this.crostonSvc.forecast(train, holdLen),
    ]);

    const holdEmaFc     = holdEmaRes.ok     ? holdEmaRes.data.predicted     : new Array(holdLen).fill(trainAvg);
    const holdHwFc      = holdHwRes.ok      ? holdHwRes.data.predicted      : new Array(holdLen).fill(trainAvg);
    const holdCrostonFc = holdCrostonRes.ok ? holdCrostonRes.data.predicted : new Array(holdLen).fill(trainAvg);

    const emaMape    = mapeOf(holdOut, holdEmaFc);
    const hwMape     = mapeOf(holdOut, holdHwFc);
    const crostonMape = mapeOf(holdOut, holdCrostonFc);

    const invEma     = safeDiv(1, Math.max(emaMape, EPSILON));
    const invHw      = safeDiv(1, Math.max(hwMape, EPSILON));
    const invCroston = safeDiv(1, Math.max(crostonMape, EPSILON));
    const total      = invEma + invHw + invCroston;

    const wEma     = safeDiv(invEma,     total);
    const wHw      = safeDiv(invHw,      total);
    const wCroston = safeDiv(invCroston, total);

    const [fullEmaRes, fullHwRes, fullCrostonRes] = await Promise.all([
      this.forecastSvc.forecastEma(safe, horizon),
      this.hwSvc.autoForecast(safe, horizon, seasonLength),
      this.crostonSvc.forecast(safe, horizon),
    ]);

    const fullEmaFc     = fullEmaRes.ok     ? fullEmaRes.data.predicted     : new Array(horizon).fill(avg);
    const fullHwFc      = fullHwRes.ok      ? fullHwRes.data.predicted      : new Array(horizon).fill(avg);
    const fullCrostonFc = fullCrostonRes.ok ? fullCrostonRes.data.predicted : new Array(horizon).fill(avg);

    const predicted = Array.from({ length: horizon }, (_, i) =>
      wEma * (fullEmaFc[i] ?? 0) + wHw * (fullHwFc[i] ?? 0) + wCroston * (fullCrostonFc[i] ?? 0),
    );

    const bootstraps = bootstrapForecast(safe, horizon, (s) => {
      const n = s.length;
      const A_EMA = ENSEMBLE_EMA_ALPHA;
      let emaVal = s[0] ?? 0;
      for (let i = 1; i < n; i++) emaVal = A_EMA * (s[i] ?? 0) + (1 - A_EMA) * emaVal;

      const A_H = 0.3; const B_H = 0.1;
      let hLevel = s[0] ?? 0;
      let hTrend = n > 1 ? (s[1] ?? 0) - (s[0] ?? 0) : 0;
      for (let i = 1; i < n; i++) {
        const prev = hLevel;
        hLevel = A_H * (s[i] ?? 0) + (1 - A_H) * (hLevel + hTrend);
        hTrend = B_H * (hLevel - prev) + (1 - B_H) * hTrend;
      }
      const hwForecast = Array.from({ length: horizon }, (_, h) => hLevel + (h + 1) * hTrend);

      const A_C = 0.1; const B_C = 0.1;
      let lambda = (s[0] ?? 0) > 0 ? 1.0 : 0.0;
      let mu     = (s[0] ?? 0) > 0 ? (s[0] ?? 0) : 0.0;
      for (let i = 1; i < n; i++) {
        if ((s[i] ?? 0) > 0) { lambda = A_C + (1 - A_C) * lambda; mu = B_C * (s[i] ?? 0) + (1 - B_C) * mu; }
        else { lambda = (1 - A_C) * lambda; mu = (1 - B_C) * mu; }
      }
      const crostonVal = lambda * mu;

      return Array.from({ length: horizon }, (_, i) =>
        wEma * emaVal + wHw * (hwForecast[i] ?? hLevel) + wCroston * crostonVal,
      );
    });

    const ci80Lower = Array.from({ length: horizon }, (_, i) =>
      quantile((Array.isArray(bootstraps) ? bootstraps : []).map(b => b[i] ?? 0), CI_LOW_10),
    );
    const ci80Upper = Array.from({ length: horizon }, (_, i) =>
      quantile((Array.isArray(bootstraps) ? bootstraps : []).map(b => b[i] ?? 0), CI_HIGH_90),
    );
    const ci95Lower = Array.from({ length: horizon }, (_, i) =>
      quantile((Array.isArray(bootstraps) ? bootstraps : []).map(b => b[i] ?? 0), CI_LOWER),
    );
    const ci95Upper = Array.from({ length: horizon }, (_, i) =>
      quantile((Array.isArray(bootstraps) ? bootstraps : []).map(b => b[i] ?? 0), CI_UPPER),
    );

    const avgForecast  = safeAvg(predicted);
    const avgCiWidth   = safeAvg(
      Array.from({ length: horizon }, (_, i) => (ci95Upper[i] ?? 0) - (ci95Lower[i] ?? 0)),
    );
    const ciWidthRatio = safeDiv(avgCiWidth, Math.max(Math.abs(avgForecast), EPSILON));
    const confidence   = safeDiv(1, 1 + ciWidthRatio);
    const hitlRequired = ciWidthRatio > CI_WIDTH_HITL_THRESHOLD || confidence < HITL_CONFIDENCE_THRESHOLD;
    const hitlReason   = hitlRequired
      ? (ciWidthRatio > CI_WIDTH_HITL_THRESHOLD
          ? `CI 95% kengligi (${avgCiWidth.toFixed(2)}) prognoz o'rtachasidan ${ciWidthRatio.toFixed(2)}x katta`
          : `Ishonchlilik darajasi ${(confidence * 100).toFixed(0)}% — minimal talabdan (70%) past`)
      : null;

    return Ok({
      predicted,
      ci80Lower,
      ci80Upper,
      ci95Lower,
      ci95Upper,
      modelWeights: { ema: wEma, hw: wHw, croston: wCroston },
      modelMapes: { ema: emaMape, hw: hwMape, croston: crostonMape },
      confidence: Math.round(confidence * 1000) / 1000,
      hitlRequired,
      ciWidthRatio: Math.round(ciWidthRatio * 1000) / 1000,
      hitlReason,
    });
  }
}
