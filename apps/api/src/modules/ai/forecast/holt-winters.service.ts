/**
 * @module holt-winters.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeAvg, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { ForecastService, ErrorMetrics } from './forecast.service';
import { NelderMeadService } from './nelder-mead.service';
import { HW_ALPHA_MIN, HW_ALPHA_MAX, FORECAST_HOLDOUT_FRACTION } from '../../../common/constants/business.constants';

export interface HwParams {
  alpha: number;
  beta: number;
  gamma: number;
  seasonLength: number;
}

export interface HwForecastResult {
  fitted: number[];
  predicted: number[];
  params: HwParams;
  metrics: ErrorMetrics;
}

function makeErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

/**
 * TZ-07: Holt-Winters Triple Exponential Smoothing (Additive model)
 */
const HW_NM_BOUNDS = [
  { min: HW_ALPHA_MIN, max: HW_ALPHA_MAX },
  { min: HW_ALPHA_MIN, max: HW_ALPHA_MAX },
  { min: HW_ALPHA_MIN, max: HW_ALPHA_MAX },
];
const HW_NM_INIT = [0.3, 0.1, 0.3];

@Injectable()
export class HoltWintersService {
  private readonly nmSvc: NelderMeadService;

  constructor(
    private readonly forecastSvc:  ForecastService,
    nmSvc?: NelderMeadService,
  ) {
    // NelderMeadService is stateless; if DI did not provide one (e.g. legacy
    // construction sites or focused unit tests that only need forecasting),
    // instantiate a local copy. Safe in production: the optimizer has no
    // side effects and identical instances are interchangeable.
    this.nmSvc = nmSvc ?? new NelderMeadService();
  }

  private _hwCore(
    series: readonly number[],
    horizon: number,
    params: HwParams,
  ): { fitted: number[]; predicted: number[]; metrics: ErrorMetrics } | null {
    const { alpha, beta, gamma, seasonLength: s } = params;
    const safeSeries = Array.isArray(series) ? series : [];
    const y = (Array.isArray(safeSeries) ? safeSeries : []).map(safeNum);

    const firstSeason = y.slice(0, s);
    const secondSeason = y.slice(s, 2 * s);

    let L = safeAvg(firstSeason);
    let T = safeDiv(safeAvg(secondSeason) - safeAvg(firstSeason), s);
    const seasonal: number[] = (Array.isArray(firstSeason) ? firstSeason : []).map((yi) => yi - L);

    const fitted: number[] = [];

    for (let t = 0; t < y.length; t++) {
      const si = t % s;
      const prevL = L;

      const newL = alpha * (y[t] - seasonal[si]) + (1 - alpha) * (prevL + T);
      T = beta * (newL - prevL) + (1 - beta) * T;
      seasonal[si] = gamma * (y[t] - newL) + (1 - gamma) * seasonal[si];
      L = newL;

      fitted.push(L + T + seasonal[si]);
    }

    const predicted: number[] = [];
    for (let h = 1; h <= horizon; h++) {
      const si = (y.length + h - 1) % s;
      predicted.push(L + h * T + seasonal[si]);
    }

    const metrics = this.forecastSvc.calculateMetrics(y, fitted);
    return { fitted, predicted, metrics };
  }

  @Calculation('forecast.holtWinters')
  async forecast(
    series: readonly number[],
    horizon: number,
    params: HwParams,
  ): Promise<Result<HwForecastResult, AppError>> {
    const { alpha, beta, gamma, seasonLength: s } = params;

    if (series.length < 2 * s) {
      return Err(makeErr(`HW uchun kamida ${2 * s} ta ma'lumot kerak (2×s=${2 * s})`));
    }
    if (s < 2) {
      return Err(makeErr('seasonLength kamida 2 bo\'lishi kerak'));
    }
    if (alpha <= 0 || alpha >= 1) {
      return Err(makeErr(`alpha 0 < α < 1 bo'lishi shart, berildi: ${alpha}`));
    }
    if (beta <= 0 || beta >= 1) {
      return Err(makeErr(`beta 0 < β < 1 bo'lishi shart, berildi: ${beta}`));
    }
    if (gamma <= 0 || gamma >= 1) {
      return Err(makeErr(`gamma 0 < γ < 1 bo'lishi shart, berildi: ${gamma}`));
    }
    if (horizon <= 0) {
      return Err(makeErr('horizon musbat bo\'lishi kerak'));
    }

    const result = this._hwCore(series, horizon, params);
    if (!result) {
      return Err(makeErr('HW hisoblashda ichki xato'));
    }

    return Ok({ ...result, params });
  }

  @Calculation('forecast.holtWinters.optimizeParams')
  async optimizeParams(
    series: readonly number[],
    seasonLength: number,
  ): Promise<Result<HwParams, AppError>> {
    if (series.length < 2 * seasonLength) {
      return Err(makeErr(
        `Param optimizatsiya uchun kamida ${2 * seasonLength} ta nuqta kerak`,
      ));
    }

    const holdLen = Math.max(1, Math.floor(series.length * FORECAST_HOLDOUT_FRACTION));
    const train   = series.slice(0, series.length - holdLen);
    const test    = series.slice(series.length - holdLen);

    const { params: nmParams } = this.nmSvc.optimize(
      ([a, b, g]: number[]) => {
        const p: HwParams = {
          alpha: safeNum(a),
          beta:  safeNum(b),
          gamma: safeNum(g),
          seasonLength,
        };
        const result = this._hwCore(train, holdLen, p);
        if (!result) return Infinity;
        const residuals = (Array.isArray(test) ? test : []).map((v, i) => v - (result.predicted[i] ?? 0));
        const sumSq = (Array.isArray(residuals) ? residuals : []).reduce((s, r) => s + r * r, 0);
        return Math.sqrt(safeDiv(sumSq, test.length));
      },
      HW_NM_INIT,
      HW_NM_BOUNDS,
    );

    const alpha = nmParams[0] ?? 0.3;
    const beta  = nmParams[1] ?? 0.1;
    const gamma = nmParams[2] ?? 0.3;

    return Ok({ alpha, beta, gamma, seasonLength });
  }

  @Calculation('forecast.holtWinters.auto')
  async autoForecast(
    series: readonly number[],
    horizon: number,
    seasonLength: number,
  ): Promise<Result<HwForecastResult & { optimizedParams: HwParams }, AppError>> {
    const paramRes = await this.optimizeParams(series, seasonLength);
    if (!paramRes.ok) return Err(paramRes.error);

    const forecastRes = await this.forecast(series, horizon, paramRes.data);
    if (!forecastRes.ok) return Err(forecastRes.error);

    return Ok({
      ...forecastRes.data,
      optimizedParams: paramRes.data,
    });
  }
}
