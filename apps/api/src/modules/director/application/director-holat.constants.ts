/**
 * @module director-holat.constants
 * @description Configurable defaults for the Director "Holat Formula" (company state calc).
 *
 * EP-DIR-001: 5 weighted metrics — cash_flow / production_plan / orders / hr / quality.
 * EP-DIR-029: 5 levels — OSISH / NORMAL / EHTIYOT / XAVF / INQIROZ.
 *
 * DESIGN INTENT (Qoida 12 — no magic numbers in formula logic):
 *   - Weights and thresholds live HERE, not inside the calc function.
 *   - The service accepts these as optional parameters so owners can override at runtime
 *     (e.g. loaded from DB master-data in Phase 1, passed in as plain objects).
 *   - Change defaults here; the formula function never hardcodes them.
 *
 * Weight invariant: sum(weights) === 1.0 exactly (validated at call time).
 */

// ---------------------------------------------------------------------------
// Metric keys — canonical set (EP-DIR-001)
// ---------------------------------------------------------------------------

/**
 * The 5 metrics that feed into the holat formula.
 * Matches the owner-confirmed list from OCHIQ-JAVOBLAR-2026-06-08 lines 187-204.
 */
export const HOLAT_METRIC_KEYS = [
  'cash_flow',
  'production_plan',
  'orders',
  'hr',
  'quality',
] as const;

export type HolatMetricKey = (typeof HOLAT_METRIC_KEYS)[number];

// ---------------------------------------------------------------------------
// Default weights (EP-DIR-001 — configurable by owner)
// ---------------------------------------------------------------------------

/**
 * Default per-metric weights. Must sum to 1.0.
 * Owner can override via DB master-data (state_thresholds table) —
 * pass a custom WeightMap into computeHolat() instead.
 *
 * Rationale (ShVB model):
 *   cash_flow       0.30 — survival signal; top priority
 *   production_plan 0.25 — core operational delivery
 *   orders          0.20 — demand / revenue pipeline
 *   hr              0.15 — workforce availability
 *   quality         0.10 — output quality / defect rate
 */
export const DEFAULT_HOLAT_WEIGHTS: Record<HolatMetricKey, number> = {
  cash_flow:       0.30,
  production_plan: 0.25,
  orders:          0.20,
  hr:              0.15,
  quality:         0.10,
} as const;

// ---------------------------------------------------------------------------
// 5-level band classification (EP-DIR-029)
// ---------------------------------------------------------------------------

/**
 * The 5 holat levels in descending health order.
 * Owner-confirmed (OCHIQ-JAVOBLAR, EP-DIR-029).
 */
export const HOLAT_LEVELS = [
  'OSISH',
  'NORMAL',
  'EHTIYOT',
  'XAVF',
  'INQIROZ',
] as const;

export type HolatLevel = (typeof HOLAT_LEVELS)[number];

/**
 * Default score thresholds (0-100 scale, inclusive lower bound).
 *
 *   OSISH    >= 85  — excellent, exceeding targets
 *   NORMAL   >= 65  — healthy, on track
 *   EHTIYOT  >= 45  — caution, minor issues
 *   XAVF     >= 25  — at risk, action required
 *   INQIROZ  >=  0  — crisis, immediate intervention
 *
 * Owner can override by passing a custom ThresholdMap into computeHolat().
 * Thresholds must be in strictly descending order (OSISH > NORMAL > ... > INQIROZ).
 */
export const DEFAULT_HOLAT_THRESHOLDS: Record<HolatLevel, number> = {
  OSISH:   85,
  NORMAL:  65,
  EHTIYOT: 45,
  XAVF:    25,
  INQIROZ:  0,
} as const;

// ---------------------------------------------------------------------------
// Numeric bounds
// ---------------------------------------------------------------------------

/** Each raw metric value is expected on a 0-100 normalised scale. */
export const HOLAT_SCORE_MIN = 0;
export const HOLAT_SCORE_MAX = 100;

/** Tolerance for floating-point weight-sum check (|sum - 1.0| < ε). */
export const HOLAT_WEIGHT_SUM_EPSILON = 0.001;
