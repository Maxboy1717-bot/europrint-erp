/**
 * @module hr-rating.service
 * @description Pure, fully unit-testable 7-factor employee rating formula.
 *   Vision source: CHAT-TARIXI-YANGI-2026-06-08.md §1 "XODIM REYTINGI = 7 FAKTOR".
 *
 * ## 7 Factors (each 0–100):
 *   1. norm        — Norma %   (production / target completion)
 *   2. attendance  — Davomat   (shift presence %)
 *   3. quality     — Sifat/brak (100 − defect_rate; higher = better)
 *   4. seniority   — Staj / razryad level mapped to 0–100
 *   5. discipline  — Intizom   (100 = no infractions; each infraction reduces)
 *   6. peer        — O'zaro baho (only from the direct service chain)
 *   7. aiKpi       — AI kunlik KPI (AI-generated daily KPI score)
 *
 * ## Weights
 *   Default weights live in `HR_RATING_WEIGHTS` (business.constants.ts).
 *   Owner/super-admin can pass a custom weights map; weights must sum to 1.0.
 *   The formula itself never references the default weights directly — it always
 *   receives them as a parameter so tests can inject any distribution.
 *
 * ## Thin reader note
 *   This service is intentionally pure (no DB access, no NestJS injection
 *   needed). A thin adapter can later pull factor values from:
 *     - norm:       mes_production_sessions / hr_feedback (actualQty / targetQty)
 *     - attendance: hr_attendance (checkIn/checkOut records)
 *     - quality:    qc_defect_records (defect_rate column)
 *     - seniority:  razryad_levels.coefficient × 100/6 mapping
 *     - discipline: hr_discipline_records (tardiness + infraction counts)
 *     - peer:       hr_feedback.peerScore (service-chain peer rows)
 *     - aiKpi:      hr_daily_reports.ai_kpi_score
 *   All of those reads stay in a separate adapter/handler; this file stays pure.
 *
 * @layer Domain Service (HR) — no I/O, no DI required
 */

import { Injectable } from '@nestjs/common';
import {
  HR_RATING_WEIGHTS,
  HR_RATING_WEIGHT_TOLERANCE,
  HR_RATING_THRESHOLDS,
} from '@common/constants/business.constants';
import { Result, Ok, Err, AppErr } from '@common/result';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The 7 factor inputs, each a number in the range [0, 100].
 * All fields are required so that a missing factor is a compilation or
 * runtime error rather than a silent "treated as 0".
 */
export interface HrRatingFactors {
  /** Norma %: production completion relative to target (0–100). */
  norm: number;
  /** Davomat: shift presence percentage (0–100). */
  attendance: number;
  /**
   * Sifat / brak: quality score (0–100).
   * Convention: 100 − defect_rate_percent.
   * Caller must convert before passing (e.g. defectRate=5 → quality=95).
   */
  quality: number;
  /**
   * Staj / razryad: seniority tier mapped to 0–100.
   * Mapping guidance: razryad_levels.coefficient (1–6) → (coefficient / 6) × 100.
   * Caller owns the mapping; this service accepts the pre-scaled value.
   */
  seniority: number;
  /**
   * Intizom: discipline score (0–100).
   * 100 = no infractions. Each violation reduces by a configurable amount
   * (managed in the caller/adapter, not in this pure formula).
   */
  discipline: number;
  /**
   * O'zaro baho: peer review score (0–100).
   * ONLY from the direct service chain (the person you hand work to reviews you).
   */
  peer: number;
  /**
   * AI kunlik KPI: AI-computed daily KPI score (0–100).
   * Sourced from hr_daily_reports.ai_kpi_score or equivalent AI pipeline.
   */
  aiKpi: number;
}

/** Named keys that match HrRatingFactors to keep the weights map type-safe. */
export type HrRatingFactorKey = keyof HrRatingFactors;

/**
 * Custom weight map.  All 7 keys must be present; values must sum to 1.0
 * (within HR_RATING_WEIGHT_TOLERANCE).
 */
export type HrRatingWeights = Record<HrRatingFactorKey, number>;

/** Per-factor breakdown included in the success payload. */
export interface HrRatingBreakdownItem {
  /** Factor name (same as HrRatingFactorKey). */
  factor: HrRatingFactorKey;
  /** Raw 0–100 input score. */
  rawScore: number;
  /** Weight applied (0–1). */
  weight: number;
  /** Weighted contribution to the final score (rawScore × weight). */
  contribution: number;
}

/** Success payload returned by computeRating. */
export interface HrRatingResult {
  /**
   * Final composite score, 0–100, rounded to 2 decimal places.
   * Drives pay-queue ordering (oylik/avans navbati, KASSIR).
   */
  score: number;
  /** Human-readable label derived from HR_RATING_THRESHOLDS. */
  label: 'excellent' | 'good' | 'average' | 'poor';
  /** Per-factor breakdown for transparency / audit UI. */
  breakdown: HrRatingBreakdownItem[];
  /** The weights that were actually applied (custom or default). */
  appliedWeights: HrRatingWeights;
}

// ---------------------------------------------------------------------------
// Factor validation bounds
// ---------------------------------------------------------------------------

/** All factor values must be in [FACTOR_MIN, FACTOR_MAX]. */
const FACTOR_MIN = 0;
const FACTOR_MAX = 100;

/** Ordered list of the 7 canonical factor keys. */
const FACTOR_KEYS: HrRatingFactorKey[] = [
  'norm',
  'attendance',
  'quality',
  'seniority',
  'discipline',
  'peer',
  'aiKpi',
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class HrRatingService {
  /**
   * Compute the composite 7-factor employee rating.
   *
   * @param factors  - Raw 0–100 scores for each of the 7 factors.
   * @param weights  - Optional custom weight map (must sum to 1.0).
   *                   Defaults to HR_RATING_WEIGHTS from business.constants.ts.
   *
   * @returns Ok({ score, label, breakdown, appliedWeights }) on success.
   *
   * @returns Err(VALIDATION) when:
   *   - Any factor value is outside [0, 100] or is NaN / Infinity.
   *   - A weight is negative or NaN.
   *   - The weights do not sum to 1.0 (within HR_RATING_WEIGHT_TOLERANCE).
   *
   * Pure function (no I/O, no DB).  Safe to call in any context.
   */
  computeRating(
    factors: HrRatingFactors,
    weights?: Partial<HrRatingWeights>,
  ): Result<HrRatingResult> {
    // 1. Build the resolved weight map (default + optional overrides).
    const resolvedWeights = this._resolveWeights(weights);
    // Re-wrap error so the data? type matches Result<HrRatingResult>.
    if (!resolvedWeights.ok) return Err(resolvedWeights.error);
    const appliedWeights = resolvedWeights.data;

    // 2. Validate all factor values.
    const factorValidation = this._validateFactors(factors);
    // Re-wrap error so the data? type matches Result<HrRatingResult>.
    if (!factorValidation.ok) return Err(factorValidation.error);

    // 3. Compute weighted sum — pure arithmetic only.
    const breakdown: HrRatingBreakdownItem[] = [];
    let weightedSum = 0;

    for (const key of FACTOR_KEYS) {
      const rawScore = factors[key];
      const weight   = appliedWeights[key];
      const contribution = rawScore * weight;

      // Guard: should never happen after validation, but be explicit.
      if (!Number.isFinite(contribution)) {
        return Err(
          AppErr(
            'VALIDATION',
            `hr-rating: NaN/Infinity detected during computation for factor "${key}"`,
            { rawScore, weight },
          ),
        );
      }

      weightedSum += contribution;
      breakdown.push({ factor: key, rawScore, weight, contribution });
    }

    // 4. Clamp to [0, 100] (floating-point edge-case safety).
    const score = Math.min(
      FACTOR_MAX,
      Math.max(FACTOR_MIN, Math.round(weightedSum * 100) / 100),
    );

    // 5. Assign label.
    const label = this._scoreToLabel(score);

    return Ok({ score, label, breakdown, appliedWeights });
  }

  // ---------------------------------------------------------------------------
  // Private helpers (exposed with _ prefix for testability without reflection)
  // ---------------------------------------------------------------------------

  /**
   * Merges custom weight overrides on top of the default HR_RATING_WEIGHTS,
   * then validates that all 7 keys exist, all values are finite & non-negative,
   * and the sum equals 1.0 within HR_RATING_WEIGHT_TOLERANCE.
   */
  _resolveWeights(
    customWeights?: Partial<HrRatingWeights>,
  ): Result<HrRatingWeights> {
    // Spread: defaults first, then any custom overrides.
    const merged: HrRatingWeights = {
      ...HR_RATING_WEIGHTS,
      ...(customWeights ?? {}),
    };

    // Verify all 7 keys are present and valid.
    for (const key of FACTOR_KEYS) {
      const w = merged[key];
      if (w === undefined || w === null) {
        return Err(
          AppErr(
            'VALIDATION',
            `hr-rating: weight for factor "${key}" is missing`,
          ),
        );
      }
      if (!Number.isFinite(w) || w < 0) {
        return Err(
          AppErr(
            'VALIDATION',
            `hr-rating: weight for factor "${key}" must be a non-negative finite number, got ${w}`,
          ),
        );
      }
    }

    // Verify weights sum to 1.0 (guard against divide-by-zero / silent drift).
    const total = FACTOR_KEYS.reduce((s, k) => s + merged[k], 0);
    if (Math.abs(total - 1.0) > HR_RATING_WEIGHT_TOLERANCE) {
      return Err(
        AppErr(
          'VALIDATION',
          `hr-rating: weights must sum to 1.0, got ${total.toFixed(10)}`,
          { total, tolerance: HR_RATING_WEIGHT_TOLERANCE },
        ),
      );
    }

    return Ok(merged);
  }

  /**
   * Validates all 7 factor values are finite numbers in [0, 100].
   */
  _validateFactors(factors: HrRatingFactors): Result<void> {
    for (const key of FACTOR_KEYS) {
      const v = factors[key];
      if (!Number.isFinite(v)) {
        return Err(
          AppErr(
            'VALIDATION',
            `hr-rating: factor "${key}" must be a finite number, got ${v}`,
          ),
        );
      }
      if (v < FACTOR_MIN || v > FACTOR_MAX) {
        return Err(
          AppErr(
            'VALIDATION',
            `hr-rating: factor "${key}" must be in [0, 100], got ${v}`,
          ),
        );
      }
    }
    return Ok();
  }

  /**
   * Maps a 0–100 score to a rating label using HR_RATING_THRESHOLDS.
   *
   *   ≥ excellent (85) → 'excellent'
   *   ≥ good      (70) → 'good'
   *   ≥ average   (50) → 'average'
   *   else             → 'poor'
   */
  _scoreToLabel(score: number): HrRatingResult['label'] {
    if (score >= HR_RATING_THRESHOLDS.excellent) return 'excellent';
    if (score >= HR_RATING_THRESHOLDS.good)      return 'good';
    if (score >= HR_RATING_THRESHOLDS.average)   return 'average';
    return 'poor';
  }
}
