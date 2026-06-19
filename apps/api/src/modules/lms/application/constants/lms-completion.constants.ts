/**
 * @module lms-completion.constants
 * @description Configurable thresholds for the 3-condition LMS completion gate
 * (EP-LMS-070). All numeric thresholds live here — never hardcoded in service
 * logic. Mirrors the pattern of business.constants.ts but scoped to this module
 * so it can evolve independently.
 *
 * Owner overrides from OCHIQ-JAVOBLAR-2026-06-08 -> LMS section:
 *   EP-LMS-009: pass threshold is per-course-type (TX/safety = 100%, general = 60-80%)
 *   EP-LMS-070: all 3 conditions must pass simultaneously for completed=true
 */

/**
 * Default pass threshold (percentage 0-100) for general courses.
 * TX/safety courses use LMS_TX_PASS_THRESHOLD_PCT below (owner override EP-LMS-009).
 */
export const LMS_GENERAL_PASS_THRESHOLD_PCT = 70;

/**
 * Pass threshold for TX / safety courses (EP-LMS-009 owner override: must be 100%).
 */
export const LMS_TX_PASS_THRESHOLD_PCT = 100;

/**
 * Minimum pass threshold accepted as valid (guards divide-by-zero / NaN edge).
 * A course configured below this value is rejected as misconfigured.
 */
export const LMS_MIN_PASS_THRESHOLD_PCT = 0;

/**
 * Maximum pass threshold accepted as valid.
 */
export const LMS_MAX_PASS_THRESHOLD_PCT = 100;

/**
 * Required fraction of nazorat varaqasi topics that must be confirmed
 * (condition 3 of EP-LMS-070). 1.0 = 100% of all topics.
 */
export const LMS_TOPIC_CONFIRM_REQUIRED_FRACTION = 1.0;

/**
 * Minimum total topics required for a valid varaqa (guards zero-total division).
 */
export const LMS_MIN_TOPIC_COUNT = 1;

/**
 * Maximum allowed score_pct value (percentage, inclusive upper bound).
 */
export const LMS_MAX_SCORE_PCT = 100;

/**
 * Minimum allowed score_pct value (percentage, inclusive lower bound).
 */
export const LMS_MIN_SCORE_PCT = 0;
