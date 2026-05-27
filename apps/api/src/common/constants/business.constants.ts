/**
 * Business constants — magic numbers extracted from domain services.
 * Import from here instead of hardcoding inline.
 */

/** KPI weighting factors (must sum to 1.0) */
export const KPI_WEIGHTS = {
  attendance:  0.5,
  performance: 0.3,
  tasks:       0.2,
} as const;

/** KPI score → rating label thresholds (0–1 scale) */
export const KPI_RATING_THRESHOLDS = {
  excellent: 0.9,
  good:      0.75,
  average:   0.6,
} as const;

/** Sales / CRM forecast multipliers */
export const FORECAST = {
  optimistic:          1.3,
  pessimistic:         0.7,
  pipeline_conversion: 0.6,
} as const;

/** SLA first-response window in hours */
export const SLA_RESPONSE_HOURS = 4;

/** Safety stock = demand_avg * SAFETY_STOCK_FACTOR */
export const SAFETY_STOCK_FACTOR = 0.5;

/** POS / queue status poll interval */
export const QUEUE_POLL_INTERVAL_MS = 2_000;

/** SMS token / session TTL (29 days in ms) */
export const SMS_TOKEN_TTL_MS = 29 * 24 * 60 * 60 * 1_000;

/** Expiry-warning window for assets / certificates (30 days in ms) */
export const ASSET_EXPIRY_WINDOW_MS = 30 * 24 * 60 * 60 * 1_000;

/** Industry-standard print-job cost split: paper 40%, ink 35%, labor 25% */
export const COST_SPLIT_PAPER = 0.40;
export const COST_SPLIT_INK   = 0.35;
export const COST_SPLIT_LABOR = 0.25;

/** CFO COGS analysis: default material share of cost-of-goods when raw material data missing */
export const COGS_MATERIAL_RATIO = 0.6;

/** Sales forecast model default confidence score */
export const FORECAST_CONFIDENCE_DEFAULT = 0.72;

// ---------------------------------------------------------------------------
// Time (re-exported from app.constants for backward compatibility)
// ---------------------------------------------------------------------------
export { MS_PER_DAY, SECONDS_PER_DAY } from './app.constants';

// ---------------------------------------------------------------------------
// AI / forecast parameters
// ---------------------------------------------------------------------------

/** Holt-Winters smoothing bounds (must be in (0,1)) */
export const HW_ALPHA_MIN = 0.01;
export const HW_ALPHA_MAX = 0.99;

/** Hold-out fraction for backtesting forecast models */
export const FORECAST_HOLDOUT_FRACTION = 0.2;

/** EMA alpha for ensemble smoothing */
export const ENSEMBLE_EMA_ALPHA = 0.3;

/** Confidence interval bounds (95%) */
export const CI_LOWER = 0.025;
export const CI_UPPER = 0.975;

/** ABC inventory classification thresholds (cumulative % of value) */
export const ABC_A_THRESHOLD = 0.80;
export const ABC_B_THRESHOLD = 0.95;

// ---------------------------------------------------------------------------
// Agent confidence thresholds
// ---------------------------------------------------------------------------
export const CONFIDENCE_HIGH   = 0.90;
export const CONFIDENCE_MEDIUM = 0.75;
export const CONFIDENCE_LOW    = 0.50;

// ---------------------------------------------------------------------------
// AI temperature presets
// ---------------------------------------------------------------------------
export const AI_TEMP_CONSERVATIVE = 0.3;
export const AI_TEMP_BALANCED     = 0.5;
export const AI_TEMP_CREATIVE     = 0.7;

// ---------------------------------------------------------------------------
// Business thresholds
// ---------------------------------------------------------------------------

/** Fraud-detection threshold: transactions above this amount are flagged (UZS) */
export const LARGE_TX_THRESHOLD_UZS = 50_000_000;

/** Sentinel value when days-until-stockout cannot be calculated (zero demand) */
export const MAX_FALLBACK_DAYS = 9_999;

// ---------------------------------------------------------------------------
// Time durations (ms)
// ---------------------------------------------------------------------------
export const SEVEN_DAYS_MS  = 7  * 24 * 60 * 60 * 1_000;
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1_000;

/** Calendar months in a year — for monthly depreciation calculations */
export const MONTHS_PER_YEAR = 12;

// ---------------------------------------------------------------------------
// HR Payroll — Uzbek statutory taxes / monthly hours
// ---------------------------------------------------------------------------

/** Standard monthly working hours (Uzbekistan, 40h x ~4.4 weeks). */
export const PAYROLL_MONTHLY_HOURS = 176;

/** Overtime rate multiplier — 1.5x base hourly rate (statutory minimum). */
export const PAYROLL_OVERTIME_MULTIPLIER = 1.5;

/** INPS (pension fund) default contribution rate, employee share (1%). */
export const PAYROLL_INPS_RATE_DEFAULT = 0.01;

/** JSHD (income tax) default flat rate (12%). */
export const PAYROLL_JSHD_RATE_DEFAULT = 0.12;

// ---------------------------------------------------------------------------
// Sales / CRM
// ---------------------------------------------------------------------------

/** Sales rep commission rate on closed deals */
export const COMMISSION_RATE = 0.05;

/** Bulk-discount thresholds (quantity → discount rate) */
export const BULK_DISCOUNT_LARGE = { minQty: 100, rate: 0.10 } as const;
export const BULK_DISCOUNT_SMALL = { minQty: 50,  rate: 0.05 } as const;

/** Customer churn risk: days since last order */
export const CHURN_HIGH_DAYS = 180;
export const CHURN_MED_DAYS  = 90;

// ---------------------------------------------------------------------------
// ABC score weighting (customer value ranking)
// ---------------------------------------------------------------------------
export const ABC_SCORE_WEIGHT = {
  revenue:    0.35,
  frequency:  0.25,
  recency:    0.20,
  margin:     0.15,
  longevity:  0.05,
} as const;

// ---------------------------------------------------------------------------
// Multi-tenancy (see docs/multi-tenancy-decision.md, ADR-006)
// ---------------------------------------------------------------------------

/**
 * Sentinel tenant id used by `tenant.middleware.ts` when the inbound JWT has
 * no `tenant_id` claim — i.e., the single-org install today. Once the SaaS
 * launch issues per-tenant JWTs (rollout phase P4), this default should
 * become reachable only for unauthenticated public endpoints, and a warning
 * log fires when the middleware falls back to it.
 *
 * Distinct from `shared/db/tenant-context.ts`'s integer `DEFAULT_TENANT_ID = 1`
 * (legacy HR module). The UUID form here is the canonical SaaS-future
 * identifier; the integer form is retained for HR backward compatibility
 * until rollout phase P3 unifies the two systems.
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
