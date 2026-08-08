/**
 * @module mm-vendor-rating.service
 * @description Pure, fully unit-testable weighted vendor-rating calculator.
 *
 * Vision reference (EP-MM-001/002/040/041, MUSLIMBEK-PROMT-09-MM):
 *   Formula = sifat 40% + muddat 30% + narx 20% + hujjat 10%
 *   (weights configurable — owner/admin can supply overrides).
 *
 * Design principles:
 *   - PURE: no DB access, no HTTP calls, no side-effects — every path is
 *     deterministic from inputs; suitable for isolated unit testing.
 *   - Result<T>: all failure paths return Err(AppErr(...)); never throws.
 *   - Guards: NaN, negative values, out-of-range factors, invalid weights,
 *     divide-by-zero — all caught and reported as VALIDATION errors.
 *   - Configurable: weights come from MM_VR_DEFAULT_WEIGHTS (own-module
 *     constants) and can be fully overridden by callers (e.g. admin settings).
 *     No magic numbers live in formula logic.
 *   - Injectable: decorated with @Injectable() so NestJS DI works; but the
 *     constructor has NO required dependencies so it can be instantiated as
 *     `new MmVendorRatingService()` in unit tests without a module scaffold.
 *
 * E1 principle (AI observes → human confirms):
 *   This service ONLY computes and grades — it never writes to DB or triggers
 *   status changes. Blacklist/block decisions require a separate human-approval
 *   step orchestrated by the caller.
 *
 * @layer Application (MM)
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  MmVendorRatingMetrics,
  MmVendorRatingWeights,
  MmVendorRatingResult,
  MmVendorGrade,
  MM_VR_DEFAULT_WEIGHTS,
  MM_VR_FACTOR_MIN,
  MM_VR_FACTOR_MAX,
  MM_VR_WEIGHT_MIN,
  MM_VR_WEIGHT_MAX,
  MM_VR_WEIGHT_SUM_TOLERANCE,
  MM_VR_GRADE_A_MIN,
  MM_VR_GRADE_B_MIN,
  MM_VR_GRADE_C_MIN,
  MM_VR_GRADE_D_MIN,
} from './mm-vendor-rating.constants';

@Injectable()
export class MmVendorRatingService {
  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Compute a weighted vendor score and derive a grade band.
   *
   * @param metrics - raw factor scores (each 0–100); see MmVendorRatingMetrics
   * @param weights - optional full weight override; must sum to 1.0 (±0.001).
   *                  When omitted, MM_VR_DEFAULT_WEIGHTS is used (owner override:
   *                  sifat 40% + muddat 30% + narx 20% + hujjat 10%).
   * @returns Ok<MmVendorRatingResult> on success,
   *          Err<AppError VALIDATION> for any bad input.
   *
   * @pure No DB access, no side-effects, same inputs → same output.
   */
  computeRating(
    metrics: MmVendorRatingMetrics,
    weights?: Partial<MmVendorRatingWeights>,
  ): Result<MmVendorRatingResult> {
    // 1. Merge weights: caller overrides take precedence over defaults.
    const resolvedWeights = this._mergeWeights(weights);

    // 2. Validate merged weights.
    const weightErr = this._validateWeights(resolvedWeights);
    if (weightErr !== null) return Err(AppErr('VALIDATION', weightErr));

    // 3. Validate metric inputs.
    const metricErr = this._validateMetrics(metrics);
    if (metricErr !== null) return Err(AppErr('VALIDATION', metricErr));

    // 4. Compute weighted contributions (cannot divide-by-zero: weights validated > 0).
    const qualityContribution  = metrics.quality  * resolvedWeights.quality;
    const deliveryContribution = metrics.delivery * resolvedWeights.delivery;
    const priceContribution    = metrics.price    * resolvedWeights.price;
    const documentContribution = metrics.document * resolvedWeights.document;

    const rawScore =
      qualityContribution +
      deliveryContribution +
      priceContribution +
      documentContribution;

    // 5. Guard the output score — should always be in [0,100] given valid inputs,
    //    but clamp defensively and check for NaN (floating-point paranoia).
    if (!isFinite(rawScore)) {
      return Err(AppErr('VALIDATION', 'Hisoblangan reyting NaN yoki cheksiz — kiritilgan ma\'lumotlarni tekshiring'));
    }

    const score = Math.round(rawScore * 100) / 100; // 2 decimal places

    // 6. Derive grade.
    const grade = this._scoreToGrade(score);

    return Ok({
      score,
      grade,
      breakdown: {
        qualityContribution:  Math.round(qualityContribution  * 100) / 100,
        deliveryContribution: Math.round(deliveryContribution * 100) / 100,
        priceContribution:    Math.round(priceContribution    * 100) / 100,
        documentContribution: Math.round(documentContribution * 100) / 100,
      },
      weightsUsed: resolvedWeights,
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Merge caller-supplied partial weight overrides onto the module defaults.
   * Returns a full MmVendorRatingWeights object (all 4 keys present).
   */
  private _mergeWeights(partial?: Partial<MmVendorRatingWeights>): MmVendorRatingWeights {
    if (!partial) return { ...MM_VR_DEFAULT_WEIGHTS };
    return {
      quality:  partial.quality  ?? MM_VR_DEFAULT_WEIGHTS.quality,
      delivery: partial.delivery ?? MM_VR_DEFAULT_WEIGHTS.delivery,
      price:    partial.price    ?? MM_VR_DEFAULT_WEIGHTS.price,
      document: partial.document ?? MM_VR_DEFAULT_WEIGHTS.document,
    };
  }

  /**
   * Validate that all weights are finite, in (0, 1], and sum to ~1.0.
   * Returns null on success; an Uzbek error message string on failure.
   */
  private _validateWeights(w: MmVendorRatingWeights): string | null {
    const entries: Array<[string, number]> = [
      ['quality (sifat)',   w.quality],
      ['delivery (muddat)', w.delivery],
      ['price (narx)',      w.price],
      ['document (hujjat)', w.document],
    ];

    for (const [name, value] of entries) {
      if (!isFinite(value) || isNaN(value)) {
        return `Og'irlik "${name}" NaN yoki cheksiz`;
      }
      if (value <= MM_VR_WEIGHT_MIN) {
        return `Og'irlik "${name}" noldan katta bo'lishi kerak, lekin ${value} berildi`;
      }
      if (value > MM_VR_WEIGHT_MAX) {
        return `Og'irlik "${name}" 1 dan oshmasligi kerak, lekin ${value} berildi`;
      }
    }

    const sum = w.quality + w.delivery + w.price + w.document;
    if (Math.abs(sum - 1.0) > MM_VR_WEIGHT_SUM_TOLERANCE) {
      return `Og'irliklar yig'indisi 1.0 ga teng bo'lishi kerak, lekin ${sum.toFixed(6)} berildi`;
    }

    return null;
  }

  /**
   * Validate that all metrics are finite numbers in [0, 100].
   * Returns null on success; an Uzbek error message string on failure.
   */
  private _validateMetrics(m: MmVendorRatingMetrics): string | null {
    const entries: Array<[string, number]> = [
      ['quality (sifat)',   m.quality],
      ['delivery (muddat)', m.delivery],
      ['price (narx)',      m.price],
      ['document (hujjat)', m.document],
    ];

    for (const [name, value] of entries) {
      if (value === null || value === undefined) {
        return `Ko'rsatkich "${name}" mavjud emas`;
      }
      if (!isFinite(value) || isNaN(value)) {
        return `Ko'rsatkich "${name}" NaN yoki cheksiz`;
      }
      if (value < MM_VR_FACTOR_MIN) {
        return `Ko'rsatkich "${name}" 0 dan kichik bo'lishi mumkin emas, lekin ${value} berildi`;
      }
      if (value > MM_VR_FACTOR_MAX) {
        return `Ko'rsatkich "${name}" 100 dan oshishi mumkin emas, lekin ${value} berildi`;
      }
    }

    return null;
  }

  /**
   * Map a numeric score to a grade band using the module's configured thresholds.
   * Thresholds are inclusive lower bounds tested from highest to lowest.
   */
  private _scoreToGrade(score: number): MmVendorGrade {
    if (score >= MM_VR_GRADE_A_MIN) return 'A';
    if (score >= MM_VR_GRADE_B_MIN) return 'B';
    if (score >= MM_VR_GRADE_C_MIN) return 'C';
    if (score >= MM_VR_GRADE_D_MIN) return 'D';
    return 'blacklist-candidate';
  }
}
