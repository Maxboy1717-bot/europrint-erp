/**
 * @module director-holat.service
 * @description Pure, unit-testable Director "Holat Formula" service.
 *
 * Vision (EP-DIR-001 / EP-DIR-029):
 *   - 5 weighted metrics, each normalised 0-100
 *   - Configurable weights (passed in or default from constants)
 *   - Configurable 5-level band thresholds (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ)
 *   - Result<T> pattern — never throws
 *   - NaN / missing metric → Err (no silent fallback to 0)
 *
 * Qoida 12: zero magic numbers — all coefficients come from constants or caller.
 * Qoida 1: returns Result<T>; never throws raw Error.
 * Q-40: real math only; no echo / hardcoded answers.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, type Result } from '@common/result';
import {
  HOLAT_METRIC_KEYS,
  HOLAT_SCORE_MIN,
  HOLAT_SCORE_MAX,
  HOLAT_WEIGHT_SUM_EPSILON,
  DEFAULT_HOLAT_WEIGHTS,
  DEFAULT_HOLAT_THRESHOLDS,
  HOLAT_LEVELS,
  type HolatMetricKey,
  type HolatLevel,
} from './director-holat.constants';

// ---------------------------------------------------------------------------
// Public-facing types
// ---------------------------------------------------------------------------

/**
 * Raw metric inputs.  Each value must be a finite number in [0, 100].
 * Partial<> is intentional — missing keys produce Err (guard is strict).
 */
export type HolatMetrics = Record<HolatMetricKey, number>;

/** Per-metric weight overrides.  Must sum to 1.0 ± ε (validated). */
export type WeightMap = Record<HolatMetricKey, number>;

/** Per-level threshold overrides. */
export type ThresholdMap = Record<HolatLevel, number>;

/** Per-metric detail exposed in the breakdown. */
export interface HolatMetricDetail {
  /** Raw normalised score (0-100) passed in by caller. */
  raw:  number;
  /** Weight applied to this metric. */
  weight: number;
  /** Weighted contribution to the total score (raw * weight). */
  weighted: number;
}

/** The successful return value of computeHolat(). */
export interface HolatResult {
  /** Weighted total score, 0-100 (rounded to 2 decimal places). */
  score: number;
  /** Holat level band that the score falls into. */
  level: HolatLevel;
  /** Per-metric breakdown for UI display / audit. */
  breakdown: Record<HolatMetricKey, HolatMetricDetail>;
}

// ---------------------------------------------------------------------------
// Options bag for overrides (Q: Qoida 13 — configurable, not hardcoded)
// ---------------------------------------------------------------------------

export interface ComputeHolatOptions {
  /**
   * Custom weight map.  If omitted, DEFAULT_HOLAT_WEIGHTS is used.
   * Must sum to 1.0 ± HOLAT_WEIGHT_SUM_EPSILON.
   */
  weights?: WeightMap;
  /**
   * Custom threshold map.  If omitted, DEFAULT_HOLAT_THRESHOLDS is used.
   * Each entry is the minimum score (inclusive) for that level.
   * Must be in strictly descending order (OSISH highest → INQIROZ lowest).
   */
  thresholds?: ThresholdMap;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DirectorHolatService {
  /**
   * Compute the company holat (state) score from 5 normalised metric values.
   *
   * Pure function — no DB, no side effects.  Suitable for:
   *   • Direct unit testing
   *   • Phase-2 cron job (reads KPIs from DB, passes them in)
   *   • Dashboard widget (recalculates on demand)
   *
   * @param metrics - 5 metric values, each in [0, 100]
   * @param options - optional weight/threshold overrides (owner-tunable)
   * @returns Result<HolatResult> — Err if any input is invalid
   */
  computeHolat(
    metrics: Partial<HolatMetrics>,
    options: ComputeHolatOptions = {},
  ): Result<HolatResult> {
    const weights    = options.weights    ?? DEFAULT_HOLAT_WEIGHTS;
    const thresholds = options.thresholds ?? DEFAULT_HOLAT_THRESHOLDS;

    // Guard 1: validate weights
    const weightValidation = this._validateWeights(weights);
    if (!weightValidation.ok) return Err(weightValidation.error);

    // Guard 2: validate thresholds
    const thresholdValidation = this._validateThresholds(thresholds);
    if (!thresholdValidation.ok) return Err(thresholdValidation.error);

    // Guard 3: validate each metric value
    const metricValidation = this._validateMetrics(metrics);
    if (!metricValidation.ok) return Err(metricValidation.error);
    const validatedMetrics = metricValidation.data;

    // Compute breakdown
    const breakdown = {} as Record<HolatMetricKey, HolatMetricDetail>;
    let totalScore = 0;

    for (const key of HOLAT_METRIC_KEYS) {
      const raw    = validatedMetrics[key];
      const weight = weights[key];
      // Guard: divide-by-zero is impossible here (weights validated ≥ 0, no division needed)
      // but we still protect against NaN propagation
      const weighted = raw * weight;
      if (!Number.isFinite(weighted)) {
        return Err({
          code: 'VALIDATION',
          message: `Metric "${key}": weighted contribution is not finite (raw=${raw}, weight=${weight})`,
        });
      }
      breakdown[key] = { raw, weight, weighted };
      totalScore    += weighted;
    }

    // Round to 2 decimal places (avoid floating-point display noise)
    const score = Math.round(totalScore * 100) / 100;

    // Guard: final score must be finite and in valid range
    if (!Number.isFinite(score)) {
      return Err({ code: 'VALIDATION', message: 'Computed holat score is not finite' });
    }
    if (score < HOLAT_SCORE_MIN - HOLAT_WEIGHT_SUM_EPSILON || score > HOLAT_SCORE_MAX + HOLAT_WEIGHT_SUM_EPSILON) {
      return Err({
        code: 'VALIDATION',
        message: `Computed score ${score} is outside valid range [${HOLAT_SCORE_MIN}, ${HOLAT_SCORE_MAX}]`,
      });
    }

    const level = this._classifyLevel(score, thresholds);

    return Ok({ score, level, breakdown });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Classify a total score into a holat level using the threshold map.
   * Iterates HOLAT_LEVELS in order (best→worst) and returns the first
   * level whose minimum threshold the score meets.
   */
  private _classifyLevel(score: number, thresholds: ThresholdMap): HolatLevel {
    for (const level of HOLAT_LEVELS) {
      if (score >= thresholds[level]) {
        return level;
      }
    }
    // Fallback: INQIROZ (should never be reached given INQIROZ threshold = 0)
    return 'INQIROZ';
  }

  /**
   * Validate the weight map:
   *   - All 5 keys present
   *   - Each weight is a finite number ≥ 0
   *   - Sum is 1.0 ± HOLAT_WEIGHT_SUM_EPSILON
   */
  private _validateWeights(weights: WeightMap): Result<void> {
    let sum = 0;
    for (const key of HOLAT_METRIC_KEYS) {
      const w = weights[key];
      if (w === undefined || w === null) {
        return Err({ code: 'VALIDATION', message: `Weight for metric "${key}" is missing` });
      }
      if (!Number.isFinite(w) || w < 0) {
        return Err({
          code: 'VALIDATION',
          message: `Weight for metric "${key}" must be a non-negative finite number, got ${w}`,
        });
      }
      sum += w;
    }
    if (Math.abs(sum - 1.0) > HOLAT_WEIGHT_SUM_EPSILON) {
      return Err({
        code: 'VALIDATION',
        message: `Weights must sum to 1.0 (got ${sum.toFixed(6)}; tolerance ±${HOLAT_WEIGHT_SUM_EPSILON})`,
      });
    }
    return Ok();
  }

  /**
   * Validate the threshold map:
   *   - All 5 level keys present
   *   - Each threshold is a finite number
   *   - Thresholds are in strictly descending order (OSISH > NORMAL > ... > INQIROZ)
   */
  private _validateThresholds(thresholds: ThresholdMap): Result<void> {
    let previous: number | null = null;
    for (const level of HOLAT_LEVELS) {
      const t = thresholds[level];
      if (t === undefined || t === null) {
        return Err({ code: 'VALIDATION', message: `Threshold for level "${level}" is missing` });
      }
      if (!Number.isFinite(t)) {
        return Err({
          code: 'VALIDATION',
          message: `Threshold for level "${level}" must be finite, got ${t}`,
        });
      }
      if (previous !== null && t >= previous) {
        return Err({
          code: 'VALIDATION',
          message: `Thresholds must be strictly descending. Level "${level}" threshold ${t} is not less than previous ${previous}`,
        });
      }
      previous = t;
    }
    return Ok();
  }

  /**
   * Validate raw metric inputs:
   *   - All 5 keys are present (Partial<> caller — missing = Err)
   *   - Each value is a finite number in [0, 100]
   */
  private _validateMetrics(
    metrics: Partial<HolatMetrics>,
  ): Result<HolatMetrics> {
    const validated = {} as HolatMetrics;
    for (const key of HOLAT_METRIC_KEYS) {
      const v = metrics[key];
      if (v === undefined || v === null) {
        return Err({
          code: 'VALIDATION',
          message: `Metric "${key}" is missing. All 5 metrics are required.`,
        });
      }
      if (!Number.isFinite(v)) {
        return Err({
          code: 'VALIDATION',
          message: `Metric "${key}" must be a finite number (got ${v})`,
        });
      }
      if (v < HOLAT_SCORE_MIN || v > HOLAT_SCORE_MAX) {
        return Err({
          code: 'VALIDATION',
          message: `Metric "${key}" value ${v} is outside the valid range [${HOLAT_SCORE_MIN}, ${HOLAT_SCORE_MAX}]`,
        });
      }
      validated[key] = v;
    }
    return Ok(validated);
  }
}
