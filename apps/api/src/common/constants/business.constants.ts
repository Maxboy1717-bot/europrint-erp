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

// ---------------------------------------------------------------------------
// T18-C4 — Tushum 4-hisob (income) auto-split default shares (EP-FIN-004)
// ---------------------------------------------------------------------------
/**
 * Default percentage split of incoming revenue (tushum) into the 4 funds.
 * MAIN    = asosiy fond (operatsion / P&L) — biggest share
 * TAX     = soliq zaxirasi (QQS/foyda solig'i ehtiyoti)
 * HEAD    = bosh fond (kapital / rivojlanish zaxirasi)
 * WORKING = aylanma kapital (kassa/bank operatsion likvidlik)
 *
 * ⚠️ DATA-QIYMAT egasidan keladi (Q-40). Bu KOD-DEFAULT (graceful) — egasi
 *  `income_split_config` jadval/PATCH orqali override qiladi. Yig'indi = 1.0.
 *  Qiymat yo'q joyda mexanizm shu defaultni ishlatadi (soxta emas — ko'rsatilgan default).
 */
export const INCOME_SPLIT_DEFAULT = {
  MAIN:    0.50,
  TAX:     0.20,
  HEAD:    0.15,
  WORKING: 0.15,
} as const;

// ---------------------------------------------------------------------------
// T18-C4 — Customer ABC segmentation thresholds (cumulative-revenue Pareto)
// ---------------------------------------------------------------------------
/**
 * ABC class boundaries by cumulative share of total annual purchase revenue
 * (Pareto 80/15/5). A = top customers up to 80% cumulative, B = next up to 95%,
 * C = the rest. Owner-tunable later via master-data; kept as named constants
 * (Qoida 12) so the compute never hardcodes the numbers inline.
 */
export const CUSTOMER_ABC_CUMULATIVE = {
  A: 0.80,
  B: 0.95,
} as const;

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

/**
 * ATP (Available-To-Promise) — fallback procurement lead time, in days, used when
 * a material has NO `inventory_policy.lead_time_days` row. EP-PP-065/EP-PP-066:
 * each material is supposed to carry its own lead time; until a policy exists,
 * the SD order-entry availability estimate must still return a conservative date
 * rather than pretend the material is in stock. Conservative > optimistic.
 */
export const ATP_DEFAULT_LEAD_TIME_DAYS = 7;

/**
 * ATP — replenishment is sized in whole production/working days; an in-stock line
 * promises immediate availability (0 days), a short line promises today + lead time.
 */
export const ATP_IN_STOCK_DAYS = 0;

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

// NOTE: payroll-tax rate constants (INPS/JSHD/income-tax) were removed — the ERP
// is gross-only and does NOT compute tax (JSHD/INPS/pension live in 1C).

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

/**
 * T21-B1 #28 owner-summary 5-raqam thresholds (director daily digest).
 *  - OWNER_NEW_CUSTOMER_WINDOW_DAYS: "yangi mijoz" = created_at oxirgi shu kun ichida.
 *  - OWNER_LOST_CUSTOMER_DAYS: "yo'qolgan mijoz" = last_order_date shu kundan eski (CHURN_HIGH bilan mos).
 *  - OWNER_SMALL_CUSTOMER_REVENUE_UZS: "kichik mijoz" = total_revenue shu chegaradan past.
 *  - OWNER_SALES_TREND_WINDOW_DAYS: savdo-trend taqqoslash oynasi (joriy ╳ oldingi).
 */
export const OWNER_NEW_CUSTOMER_WINDOW_DAYS  = 30;
export const OWNER_LOST_CUSTOMER_DAYS        = CHURN_HIGH_DAYS;
export const OWNER_SMALL_CUSTOMER_REVENUE_UZS = 5_000_000;
export const OWNER_SALES_TREND_WINDOW_DAYS   = 30;

/** RFM customer segmentation (marketing-agent.segmentCustomers): VIP = lifetime deal
 *  value above the threshold AND last order within the active window; at-risk reuses CHURN_MED_DAYS. */
export const VIP_REVENUE_THRESHOLD_UZS = 100_000_000;
export const VIP_ACTIVE_WINDOW_DAYS    = 30;

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

// ---------------------------------------------------------------------------
// HR — Employee rating score thresholds (0–100 scale) P3.2
// ---------------------------------------------------------------------------

/** Employee performance score → rating label (0–100 scale) */
export const EMPLOYEE_RATING_EXCELLENT = 90;
export const EMPLOYEE_RATING_GOOD      = 75;
export const EMPLOYEE_RATING_AVERAGE   = 50;

/** KPI weighting factors for achievement-based scoring (must sum to 1.0) */
export const KPI_WEIGHT_ACHIEVEMENT = 0.4;
export const KPI_WEIGHT_QUALITY     = 0.3;
export const KPI_WEIGHT_OEE         = 0.2;
export const KPI_WEIGHT_ATTENDANCE  = 0.1;

// ---------------------------------------------------------------------------
// HR — 7-Factor Employee Rating (reyting-7-faktor, CHAT-TARIXI-YANGI §1)
// ---------------------------------------------------------------------------
/**
 * Default weights for the 7-factor employee rating formula.
 * All values MUST sum to exactly 1.0.
 * Owner can override per-org via HrRatingService.computeRating(factors, weights).
 *
 * Factor semantics (each input is a 0-100 score):
 *   norm        — Norma % (bajarilgan ish / target norm completion)
 *   attendance  — Davomat (shift presence %)
 *   quality     — Sifat / brak (100 − defect_rate)
 *   seniority   — Staj / razryad level (scaled 0-100 by razryad_levels table)
 *   discipline  — Intizom (no-penalty = 100; each infraction reduces score)
 *   peer        — O'zaro baho (only from the direct service chain, 0-100)
 *   aiKpi       — AI kunlik KPI (daily AI-computed KPI score, 0-100)
 */
export const HR_RATING_WEIGHTS = {
  norm:        0.25,   // production volume completion is the primary driver
  attendance:  0.20,   // physical presence / shift coverage
  quality:     0.20,   // sifat / brak — defect rate inversely penalises
  seniority:   0.10,   // razryad level (experience / skill tier)
  discipline:  0.10,   // intizom — tardiness, infractions
  peer:        0.10,   // o'zaro baho (service-chain peer review)
  aiKpi:       0.05,   // AI kunlik KPI (automated daily target score)
} as const satisfies Record<string, number>;

/** Minimum acceptable total weight deviation from 1.0 (floating-point tolerance) */
export const HR_RATING_WEIGHT_TOLERANCE = 1e-9;

/** 7-factor rating score → label thresholds (0–100 scale) */
export const HR_RATING_THRESHOLDS = {
  excellent: 85,
  good:      70,
  average:   50,
} as const;

// ---------------------------------------------------------------------------
// HR — Discipline thresholds (kech kelganlik, oylik hisob) — skill spec
// ---------------------------------------------------------------------------
/** Monthly late arrivals before a warning is issued (3 = first threshold) */
export const DISCIPLINE_LATE_WARNING_THRESHOLD   = 3;
/** Monthly late arrivals before a reprimand is issued */
export const DISCIPLINE_LATE_REPRIMAND_THRESHOLD = 5;
/** Monthly late arrivals before a discharge notice is issued */
export const DISCIPLINE_LATE_DISCHARGE_THRESHOLD = 8;
/** Minutes after scheduled start before a check-in is classified as late */
export const ATTENDANCE_LATE_GRACE_MINUTES       = 15;

// ---------------------------------------------------------------------------
// Director — Holat Formula (EP-DIR-001 / EP-DIR-029)
// Default coefficients live in the module-specific constants file so the
// director module can own them without coupling all services to this file.
// The values below are re-exported for cross-module consumers that only
// need the numeric constants, not the full type definitions.
// ---------------------------------------------------------------------------

/** Floating-point tolerance for holat weight-sum check (|sum - 1.0| < ε) */
export const HOLAT_WEIGHT_SUM_EPSILON = 0.001;

/** Normalised score scale for each holat metric (0–100) */
export const HOLAT_SCORE_MIN = 0;
export const HOLAT_SCORE_MAX = 100;

// ---------------------------------------------------------------------------
// MM — 3-Way Match (PO ↔ Goods Receipt ↔ Invoice)
// The match passes only when the largest pairwise spread between the PO total,
// the received goods value and the invoice amount stays within this fraction
// of the PO total. 0.02 = ±2%.
// ---------------------------------------------------------------------------

/** Allowed relative spread (fraction of PO total) for a passing 3-way match */
export const MM_THREE_WAY_MATCH_TOLERANCE = 0.02;
