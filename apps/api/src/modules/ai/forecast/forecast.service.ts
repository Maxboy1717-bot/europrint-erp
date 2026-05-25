/**
 * @module forecast.service
 * @description Time-series forecasting toolkit. Provides three baseline
 *   methods plus error-metric reporting so callers can compare quality:
 *
 *     - **SMA** (Simple Moving Average) — flat smoothing, good for noisy
 *       but trend-free series
 *     - **EMA** (Exponential Moving Average) — weighted toward recent
 *       observations; α-tunable
 *     - **Linear regression** — captures trend; returns slope, intercept,
 *       R² + per-point fitted values
 *
 *   Grid-search helper finds the optimal α for EMA by RMSE.
 *
 *   Three error metrics returned with every fit:
 *     MAPE = (1/n) × Σ |yᵢ − ŷᵢ| / |yᵢ| × 100%     scale-free, %-style
 *     RMSE = √((1/n) × Σ (yᵢ − ŷᵢ)²)               penalises large errors
 *     MAE  = (1/n) × Σ |yᵢ − ŷᵢ|                   linear, interpretable
 * @layer Domain Service (AI module — pure math)
 *
 * Type definitions live in `./forecast.types.ts`.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeAvg, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  ErrorMetrics,
  SmaResult,
  EmaResult,
  GridSearchResult,
  LinearRegressionResult,
  makeErr,
} from './forecast.types';

export type {
  ErrorMetrics,
  SmaResult,
  EmaResult,
  GridSearchResult,
  LinearRegressionResult,
};

/**
 * TZ-06: SMA (Oddiy Ko'chma O'rtacha) + EMA (Eksponensial Silliqlash)
 *
 * SMA_t = (1/n) × Σ_{i=t-n+1}^{t} y_i
 *
 * EMA: ŷ_{t+1} = α × y_t + (1−α) × ŷ_t
 *   Boshlanish: ŷ_1 = y_1
 *
 * Optimal α: argmin_α Σ(y_t − ŷ_t)²
 *   Grid search: α ∈ {0.05, 0.10, ..., 0.95}
 *
 * Xato metrikalari:
 *   MAPE = (1/n) × Σ |y_t − ŷ_t| / |y_t| × 100%
 *   RMSE = √((1/n) × Σ (y_t − ŷ_t)²)
 *   MAE  = (1/n) × Σ |y_t − ŷ_t|
 */
@Injectable()
export class ForecastService {
  /**
   * Xato metrikalarini hisoblash: MAPE, RMSE, MAE
   */
  calculateMetrics(actual: readonly number[], predicted: readonly number[]): ErrorMetrics {
    if (actual.length === 0 || actual.length !== predicted.length) {
      return { mape: 0, rmse: 0, mae: 0 };
    }
    const n = actual.length;

    let sumMape = 0;
    let sumSqErr = 0;
    let sumAbsErr = 0;

    for (let i = 0; i < n; i++) {
      const err = safeNum(actual[i]) - safeNum(predicted[i]);
      const absErr = Math.abs(err);
      sumAbsErr += absErr;
      sumSqErr += err * err;
      if (safeNum(actual[i]) !== 0) {
        sumMape += absErr / Math.abs(safeNum(actual[i])) * 100;
      }
    }

    return {
      mape: safeDiv(sumMape, n),
      rmse: Math.sqrt(safeDiv(sumSqErr, n)),
      mae: safeDiv(sumAbsErr, n),
    };
  }

  /** EMA hisoblashning ichki yordamchi metodi (dekoratsiyasiz) */
  private _emaCore(series: readonly number[], alpha: number): number[] {
    const smoothed: number[] = [safeNum(series[0])];
    for (let t = 1; t < series.length; t++) {
      smoothed.push(alpha * safeNum(series[t]) + (1 - alpha) * smoothed[t - 1]);
    }
    return smoothed;
  }

  /**
   * TZ-06a: SMA — Oddiy Ko'chma O'rtacha
   */
  @Calculation('forecast.sma')
  async sma(series: readonly number[], n: number): Promise<Result<SmaResult, AppError>> {
    if (n <= 0) return Err(makeErr('n musbat butun son bo\'lishi kerak'));
    if (!series.length || series.length < n) {
      return Err(makeErr(`SMA uchun kamida ${n} ta ma'lumot kerak (n=${n})`));
    }

    const values: number[] = [];
    for (let i = n - 1; i < series.length; i++) {
      const window = series.slice(i - n + 1, i + 1);
      values.push(safeAvg(window));
    }

    const actual = series.slice(n - 1);
    const metrics = this.calculateMetrics(actual, values);

    return Ok({ values, metrics });
  }

  /**
   * TZ-06b: EMA — Eksponensial Silliqlash (SES)
   * ŷ_{t+1} = α × y_t + (1−α) × ŷ_t
   */
  @Calculation('forecast.ema')
  async ema(series: readonly number[], alpha: number): Promise<Result<EmaResult, AppError>> {
    if (series.length < 2) {
      return Err(makeErr('EMA uchun kamida 2 ta ma\'lumot kerak'));
    }
    if (alpha <= 0 || alpha > 1) {
      return Err(makeErr(`Alpha 0 < α ≤ 1 bo'lishi shart, berildi: ${alpha}`));
    }

    const smoothed = this._emaCore(series, alpha);
    const metrics = this.calculateMetrics(series, smoothed);
    return Ok({ smoothed, alpha, metrics });
  }

  /**
   * TZ-06c: EMA uchun optimal alpha grid search
   *
   * α* = argmin_{α ∈ {0.05..0.95}} Σ (y_t − ŷ_t)²
   */
  @Calculation('forecast.gridSearchAlpha')
  async gridSearchAlpha(series: readonly number[]): Promise<Result<GridSearchResult, AppError>> {
    if (series.length < 4) {
      return Err(makeErr('Grid search uchun kamida 4 ta ma\'lumot kerak'));
    }

    let bestAlpha = 0.05;
    let bestMse = Infinity;

    for (let a = 5; a <= 95; a += 5) {
      const alpha = a / 100;
      if (series.length < 2) continue;

      const smoothed = this._emaCore(series, alpha);
      const mse = safeAvg(
        (Array.isArray(series) ? series : []).map((y, i) => (safeNum(y) - smoothed[i]) ** 2),
      );

      if (mse < bestMse) {
        bestMse = mse;
        bestAlpha = alpha;
      }
    }

    return Ok({ alpha: bestAlpha, rmse: Math.sqrt(bestMse) });
  }

  /**
   * TZ-08: OLS Chiziqli Regressiya
   *
   * β₁ = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)²
   * β₀ = ȳ − β₁x̄
   * R² = 1 − SSres/SStot
   */
  @Calculation('forecast.linearRegression')
  async fitLinear(
    x: readonly number[],
    y: readonly number[],
  ): Promise<Result<LinearRegressionResult, AppError>> {
    if (x.length !== y.length || x.length < 2) {
      return Err(makeErr('x va y uzunliklari teng va ≥2 bo\'lishi shart'));
    }

    const safeX = Array.isArray(x) ? x : [];
    const safeY = Array.isArray(y) ? y : [];
    const xArr = (Array.isArray(safeX) ? safeX : []).map(safeNum);
    const yArr = (Array.isArray(safeY) ? safeY : []).map(safeNum);

    const xBar = safeAvg(xArr);
    const yBar = safeAvg(yArr);

    let ssXY = 0;
    let ssXX = 0;
    for (let i = 0; i < xArr.length; i++) {
      ssXY += (xArr[i] - xBar) * (yArr[i] - yBar);
      ssXX += (xArr[i] - xBar) ** 2;
    }

    const slope = safeDiv(ssXY, ssXX);
    const intercept = yBar - slope * xBar;

    const predicted = (Array.isArray(safeX) ? safeX : []).map((xi) => slope * safeNum(xi) + intercept);

    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < yArr.length; i++) {
      ssRes += (yArr[i] - predicted[i]) ** 2;
      ssTot += (yArr[i] - yBar) ** 2;
    }
    const r2 = ssTot === 0 ? 1 : 1 - safeDiv(ssRes, ssTot);

    const metrics = this.calculateMetrics(yArr, predicted);

    return Ok({ slope, intercept, r2, predicted, metrics });
  }

  /**
   * EMA forecast: optimal alpha topib, keyingi horizon ta qiymat bashorat
   */
  @Calculation('forecast.emaForecast')
  async forecastEma(
    series: readonly number[],
    horizon: number,
  ): Promise<Result<{ predicted: number[]; alpha: number; metrics: ErrorMetrics }, AppError>> {
    if (horizon <= 0) return Err(makeErr('horizon musbat bo\'lishi kerak'));

    const gridRes = await this.gridSearchAlpha(series);
    if (!gridRes.ok) return Err(gridRes.error);

    const alpha = gridRes.data.alpha;
    const emaRes = await this.ema(series, alpha);
    if (!emaRes.ok) return Err(emaRes.error);

    const lastSmoothed = emaRes.data.smoothed[emaRes.data.smoothed.length - 1];
    const predicted: number[] = [];
    let prev = lastSmoothed;
    for (let h = 0; h < horizon; h++) {
      const next = alpha * prev + (1 - alpha) * prev;
      predicted.push(next);
      prev = next;
    }

    return Ok({ predicted, alpha, metrics: emaRes.data.metrics });
  }
}
