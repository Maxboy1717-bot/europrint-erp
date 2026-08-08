/**
 * @module crm-lead-scoring.constants
 * @description Configurable weights and tier-band boundaries for the pure
 *   CRM lead-scoring formula. All numbers live here so:
 *     1. Product owners can tune thresholds without touching service logic.
 *     2. Tests override weights by passing the optional second argument to
 *        CrmLeadScoringService.score(); no monkey-patching required.
 *     3. Magic-number ban (CLAUDE.md Qoida 12) is satisfied — zero inline
 *        literals in the computation layer.
 *
 * These are DEFAULT weights; the owner can set per-tenant overrides via the
 * admin panel (stored as JSON, passed as `weights` at call-time).
 *
 * --- CRITERIA MAP (EP-CRM-012 "interest/activity/response_speed/deal_size") ---
 *
 *   1. budget        — deal_size proxy: bigger budget → higher ICP fit.
 *                      Budget is log1p-normalised against BUDGET_HIGH_UZS so
 *                      the 100-x range is not dominated by outliers.
 *
 *   2. engagement    — activity-count proxy: interactions logged in CRM.
 *                      Capped at ENGAGEMENT_CAP to prevent a single chatty
 *                      lead from dominating; normalised to [0, 1].
 *
 *   3. recency       — inverse of days-since-last-activity (response_speed
 *                      & freshness combined). Score = max(0, 1 − days/RECENCY_DECAY_DAYS).
 *                      Falls to 0 when lead has been dark for RECENCY_DECAY_DAYS.
 *
 *   4. sourceQuality — categorical quality of acquisition channel (referral
 *                      is highest-trust, cold outbound is lowest).
 *
 *   5. fit           — firmographic fit: company size, industry match,
 *                      website presence. Additive sub-score normalised to [0,1].
 *
 * Weights default to EP-CRM-012 defaults; they MUST sum to 1.0.
 * Tier boundaries follow the existing LeadScorerService convention
 * (hot ≥ 70, warm ≥ 40) to keep the UX consistent.
 *
 * @layer Domain constants (CRM-only; DO NOT modify business.constants.ts)
 */

// ---------------------------------------------------------------------------
// Criterion weights — must sum to 1.0
// ---------------------------------------------------------------------------

/** Weight given to the budget/deal-size signal (0..1) */
export const SCORING_W_BUDGET = 0.30 as const;

/** Weight given to the engagement/activity-count signal (0..1) */
export const SCORING_W_ENGAGEMENT = 0.25 as const;

/** Weight given to the recency/freshness signal (0..1) */
export const SCORING_W_RECENCY = 0.20 as const;

/** Weight given to the lead-source quality signal (0..1) */
export const SCORING_W_SOURCE = 0.15 as const;

/** Weight given to the firmographic-fit signal (0..1) */
export const SCORING_W_FIT = 0.10 as const;

/**
 * Sum of the five default weights — must equal exactly 1.0.
 * Exported so the service can validate caller-supplied weight overrides.
 */
export const SCORING_WEIGHT_SUM = SCORING_W_BUDGET + SCORING_W_ENGAGEMENT +
  SCORING_W_RECENCY + SCORING_W_SOURCE + SCORING_W_FIT; // 1.00

// ---------------------------------------------------------------------------
// Budget normalisation
// ---------------------------------------------------------------------------

/**
 * Budget value (UZS) that maps to a normalised budget score of 1.0.
 * Leads with budget >= this are treated as "full" on the budget dimension.
 * Aligns with the existing heuristic scorer's "100M = top tier" threshold.
 */
export const BUDGET_HIGH_UZS = 100_000_000 as const;

// ---------------------------------------------------------------------------
// Engagement normalisation
// ---------------------------------------------------------------------------

/**
 * Interaction-count cap before normalisation.
 * A lead with ≥ this many CRM touches scores 1.0 on engagement.
 * WHY 20: consistent with LeadScorerV2's feature cap; prevents one noisy
 * lead from skewing the normalised range.
 */
export const ENGAGEMENT_CAP = 20 as const;

// ---------------------------------------------------------------------------
// Recency decay
// ---------------------------------------------------------------------------

/**
 * Days of inactivity at which the recency score reaches 0.
 * Consistent with EP-CRM-063 "~60 days" abandonment rule:
 * after 60 days of silence the lead is fully cold on this dimension.
 */
export const RECENCY_DECAY_DAYS = 60 as const;

// ---------------------------------------------------------------------------
// Source quality encoding (0..1)
// ---------------------------------------------------------------------------

/**
 * Per-channel quality scores (normalised 0..1).
 * Higher = higher conversion prior. Matches the heuristic scorer's
 * referral > direct > social ordering; adds 'visit', 'telegram',
 * 'whatsapp', 'email', 'sms' per EP-CRM-007 channel list.
 */
export const SOURCE_QUALITY_MAP: Readonly<Record<string, number>> = {
  referral:  1.00,
  visit:     0.80,   // EP-CRM-007 — field/outbound manager visit
  direct:    0.70,
  telegram:  0.50,
  whatsapp:  0.50,
  email:     0.40,
  sms:       0.30,
  social:    0.25,
  web:       0.20,
  unknown:   0.10,
} as const;

/** Fallback quality when the source string is not in SOURCE_QUALITY_MAP */
export const SOURCE_QUALITY_FALLBACK = 0.05 as const;

// ---------------------------------------------------------------------------
// Firmographic fit sub-scores (each contributes to a 0..1 aggregate)
// ---------------------------------------------------------------------------

/**
 * Points awarded for having a company name present.
 * Sub-scores are added then normalised by FIT_MAX_POINTS.
 */
export const FIT_POINTS_COMPANY   = 3 as const;
export const FIT_POINTS_WEBSITE   = 2 as const;
export const FIT_POINTS_EMAIL     = 2 as const;
export const FIT_POINTS_PHONE     = 1 as const;

/**
 * Employee count threshold for "mid-market or larger" bonus.
 * Consistent with LeadScorerService's "50+ employees" heuristic.
 */
export const FIT_EMPLOYEE_THRESHOLD = 50 as const;
export const FIT_POINTS_EMPLOYEES   = 2 as const;

/**
 * Denominator for fit normalisation: maximum achievable fit points.
 * Update this constant whenever FIT_POINTS_* constants change.
 */
export const FIT_MAX_POINTS =
  FIT_POINTS_COMPANY +
  FIT_POINTS_WEBSITE +
  FIT_POINTS_EMAIL +
  FIT_POINTS_PHONE +
  FIT_POINTS_EMPLOYEES; // 10

// ---------------------------------------------------------------------------
// Tier band boundaries (0..100 score)
// ---------------------------------------------------------------------------

/**
 * Minimum score to be classified as HOT.
 * Matches the LeadScorerService convention for UI consistency.
 */
export const TIER_HOT_MIN  = 70 as const;

/**
 * Minimum score to be classified as WARM.
 * Matches the LeadScorerService convention.
 */
export const TIER_WARM_MIN = 40 as const;

// ---------------------------------------------------------------------------
// Validation tolerance
// ---------------------------------------------------------------------------

/**
 * Maximum allowed absolute deviation from 1.0 when validating caller-supplied
 * weights. Floats can't be exactly 1.0 — allow a small epsilon.
 */
export const WEIGHT_SUM_TOLERANCE = 1e-9 as const;
