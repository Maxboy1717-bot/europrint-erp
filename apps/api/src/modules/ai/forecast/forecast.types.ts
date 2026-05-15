/**
 * @module forecast.types
 * @description Shared interfaces for ForecastService (extracted from forecast.service.ts to keep < 300 lines).
 */

import type { AppError } from '@common/result';

export interface ErrorMetrics {
  mape: number;
  rmse: number;
  mae: number;
}

export interface SmaResult {
  values: number[];
  metrics: ErrorMetrics;
}

export interface EmaResult {
  smoothed: number[];
  alpha: number;
  metrics: ErrorMetrics;
}

export interface GridSearchResult {
  alpha: number;
  rmse: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predicted: number[];
  metrics: ErrorMetrics;
}

export function makeErr(msg: string, code: AppError['code'] = 'VALIDATION'): AppError {
  return { code, message: msg };
}
