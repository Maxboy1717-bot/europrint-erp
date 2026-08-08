/**
 * @module mm-vendor-rating.constants
 * @description Configurable defaults for the MM vendor-rating formula.
 *
 * Owner-confirmed formula (EP-MM-002/040, OCHIQ-JAVOBLAR-2026-06-08 override):
 *   sifat 40% + muddat 30% + narx 20% + hujjat 10%
 *
 * WHY own-module file:
 *   - business.constants.ts must NOT be edited (project rule Q-12/CLAUDE.md Qoida 12)
 *   - These weights are MM-specific and configurable by admin/owner
 *   - Keeping them here makes the module self-contained and weights overridable
 *     by callers (e.g. per-admin settings or test scenarios)
 *
 * HOW to override at runtime:
 *   Pass a `weights` argument to MmVendorRatingService.computeRating().
 *   The service merges caller-supplied weights over these defaults.
 *
 * GRADE thresholds (A / B / C / D / blacklist):
 *   Defined as inclusive lower bounds for each grade.
 *   Score ∈ [0, 100]; grade is assigned to the HIGHEST threshold the score meets.
 *
 * @layer Application (MM)
 */

// ─── Factor weight defaults ────────────────────────────────────────────────────
// Each weight is a fraction in (0, 1]; weights MUST sum to 1.0.
// These match the owner override in EP-MM-002/040.

/** sifat (quality): lab pass rate, brak% — owner weight 40% */
export const MM_VR_WEIGHT_QUALITY = 0.40;

/** muddat (on-time delivery): promised date vs actual date — owner weight 30% */
export const MM_VR_WEIGHT_DELIVERY = 0.30;

/** narx (price competitiveness): vendor price vs market benchmark — owner weight 20% */
export const MM_VR_WEIGHT_PRICE = 0.20;

/** hujjat (document completeness): contracts, certs, licenses — owner weight 10% */
export const MM_VR_WEIGHT_DOCUMENT = 0.10;

/**
 * Canonical default weight set, assembled from the constants above.
 * Passed to computeRating() when the caller does not supply custom weights.
 */
export const MM_VR_DEFAULT_WEIGHTS: Readonly<MmVendorRatingWeights> = {
  quality:  MM_VR_WEIGHT_QUALITY,
  delivery: MM_VR_WEIGHT_DELIVERY,
  price:    MM_VR_WEIGHT_PRICE,
  document: MM_VR_WEIGHT_DOCUMENT,
} as const;

// ─── Grade thresholds ─────────────────────────────────────────────────────────
// Inclusive lower bounds.  score >= threshold → that grade (or higher).
// Grade assignment: test thresholds from highest to lowest.

/** Grade A: excellent vendor — score >= 85 */
export const MM_VR_GRADE_A_MIN = 85;

/** Grade B: good vendor — score >= 70 */
export const MM_VR_GRADE_B_MIN = 70;

/** Grade C: acceptable, monitored — score >= 50 */
export const MM_VR_GRADE_C_MIN = 50;

/** Grade D: poor — score >= MM_VR_BLACKLIST_MAX (but < C threshold) */
export const MM_VR_GRADE_D_MIN = 30;

/**
 * Below this score the vendor is flagged "blacklist-candidate".
 * Full blacklist status (Qora-ro'yxat) requires human approval (E1 principle).
 * This score only drives the rating output; the actual status change is
 * gated by ta'minot boshlig'i + QC approval (EP-MM-039).
 */
export const MM_VR_BLACKLIST_MAX = 30;

// ─── Validation constraints ───────────────────────────────────────────────────

/** Each factor score must be in this range (inclusive). */
export const MM_VR_FACTOR_MIN = 0;
export const MM_VR_FACTOR_MAX = 100;

/** Each weight must be positive and <= 1. */
export const MM_VR_WEIGHT_MIN = 0;    // exclusive (> 0 required)
export const MM_VR_WEIGHT_MAX = 1;

/**
 * Maximum allowed deviation from 1.0 when summing all weights.
 * Accounts for floating-point arithmetic (e.g. 0.1 + 0.2 + 0.3 + 0.4 = 1.0000000000000002).
 */
export const MM_VR_WEIGHT_SUM_TOLERANCE = 0.001;

// ─── Types (co-located for import ergonomics) ─────────────────────────────────

/**
 * Raw metric inputs — each 0–100 representing a percentage or normalised score.
 *
 * | field    | EP-MM ref   | meaning                                              |
 * |----------|-------------|------------------------------------------------------|
 * | quality  | EP-MM-041   | lab pass% minus brak% (0=all failed, 100=all passed) |
 * | delivery | EP-MM-133   | on-time delivery % (0=always late, 100=always on-time)|
 * | price    | EP-MM-007   | price competitiveness (0=most expensive, 100=cheapest)|
 * | document | EP-MM-030   | document completeness % (0=none, 100=all docs present)|
 */
export interface MmVendorRatingMetrics {
  /** sifat — quality/lab pass rate. Range [0, 100]. */
  quality: number;
  /** muddat — on-time delivery %. Range [0, 100]. */
  delivery: number;
  /** narx — price competitiveness score. Range [0, 100]. */
  price: number;
  /** hujjat — document completeness %. Range [0, 100]. */
  document: number;
}

/**
 * Configurable factor weights. Must sum to 1.0 (±MM_VR_WEIGHT_SUM_TOLERANCE).
 * All fields are required to prevent accidental partial overrides.
 */
export interface MmVendorRatingWeights {
  quality: number;
  delivery: number;
  price: number;
  document: number;
}

/** Vendor grade values, ordered from best to worst. */
export type MmVendorGrade = 'A' | 'B' | 'C' | 'D' | 'blacklist-candidate';

/** Successful computation result. */
export interface MmVendorRatingResult {
  /** Weighted composite score, rounded to 2 decimal places. Range [0, 100]. */
  score: number;
  /** Grade band derived from score thresholds. */
  grade: MmVendorGrade;
  /** Individual weighted contributions, for audit/display. */
  breakdown: {
    qualityContribution:  number;
    deliveryContribution: number;
    priceContribution:    number;
    documentContribution: number;
  };
  /** Weights actually used in this computation (merged defaults + overrides). */
  weightsUsed: MmVendorRatingWeights;
}
