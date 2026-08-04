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

/**
 * IoT tablet inline-QC → qc_defects bridge (SB0357): pass rate (%) below which
 * a defect surfaced from the floor-operator tablet is escalated from MINOR to
 * MAJOR severity when reported into QC's own qc_defects table.
 */
export const IOT_INLINE_QC_MAJOR_DEFECT_THRESHOLD_PCT = 50;

/** Sales / CRM forecast multipliers */
export const FORECAST = {
  optimistic:          1.3,
  pessimistic:         0.7,
  pipeline_conversion: 0.6,
} as const;

/** SLA first-response window in hours */
export const SLA_RESPONSE_HOURS = 4;

/**
 * SD sotuv-buyurtma avans (advance) standarti — egasi vizyoni: 70% oldindan to'lov.
 * Canonical yangi-buyurtma INSERT (queries-sd.ts execSdSalesOrderInsert) shu qiymatni
 * ishlatadi; kotirovka→buyurtma konversiyasi ham shu bilan mos bo'lishi shart
 * (ikki yo'l bir xil default berishi kerak — avval konversiya 30% ishlatib drift qilardi).
 */
export const DEFAULT_ADVANCE_PERCENT = 70;

/** Safety stock = demand_avg * SAFETY_STOCK_FACTOR */
export const SAFETY_STOCK_FACTOR = 0.5;

/**
 * §11-MM #23 — PO narx-variance ogohlantirish chegaralari (percent). Yangi PO satr
 * narxi material reference narxidan (supplier price-list bo'lsa shundan, aks holda
 * oxirgi PO satr narxidan) qancha YUQORI bo'lsa flag rangi:
 *   > RED%    → qizil (red)
 *   ≥ YELLOW% → sariq (yellow)
 * Chegaralar vizyonda ko'rsatilgan (vision-1000-answers/11-mm.md #23: 10%/25%) —
 * fabrikatsiya emas, DATA-qiymat egasidan talab qilinmaydi.
 */
export const PO_PRICE_VARIANCE_YELLOW_PCT = 10;
export const PO_PRICE_VARIANCE_RED_PCT = 25;

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

/**
 * Sprint8 inventory_policy seed — simple stock-fill-ratio ABC heuristic
 * (current_stock vs max_stock), distinct from the cumulative-value ABC_A/B
 * thresholds above. sprint8-migration.service.ts uses this at seed time only.
 */
export const STOCK_FILL_RATIO_A_THRESHOLD = 0.5;

/**
 * Davriy (rejalashtirilgan) cycle-count chastotasi — ABC segment bo'yicha (kun).
 * A (yuqori qiymat) tez-tez, C (past qiymat) kamroq sanaladi — standart ABC
 * cycle-counting nazariyasi. wms-cycle-count-generator.cron.ts ishlatadi.
 */
export const CYCLE_COUNT_FREQUENCY_DAYS_A = 7;
export const CYCLE_COUNT_FREQUENCY_DAYS_B = 30;
export const CYCLE_COUNT_FREQUENCY_DAYS_C = 90;

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

/**
 * Marketing lead-score recompute weights (marketing leads/recalculate-scores):
 * score = base + channel bonus (organic/referral) + status bonus, capped at MAX.
 * Values pinned from the pre-existing recalculateLeadScores SQL — do not change
 * without an owner decision (they drive the lead-warmth funnel).
 */
export const LEAD_SCORE = {
  base:          30,  // every lead starts here
  max:           100, // LEAST(100, ...) cap
  channelBonus:  10,  // channel IN ('organic','referral')
  statusHot:     15,
  statusWarm:    8,
  statusNew:     3,
} as const;

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
/** AI-fit (P36) score (0-100) below which a low-fit alert (`ai.fit.low_score`) fires (SB0504). */
export const AI_FIT_LOW_SCORE_THRESHOLD = 40;
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
// Director — EP-DIR-005 "Og'ish tezligi" (rate-of-change) decline detector
// Vision 05-director #3: 2 consecutive daily declines = worsening TREND flag;
// 3 consecutive daily declines = EP-DIR-005 alert. Vision-given thresholds
// (NOT owner-configurable), so they live here as named constants (Qoida 12).
// ---------------------------------------------------------------------------

/** Consecutive daily declines that mark a worsening TREND (early warning). */
export const DIR_DECLINE_TREND_DAYS = 2;

/** Consecutive daily declines that fire the EP-DIR-005 alert event. */
export const DIR_DECLINE_ALERT_DAYS = 3;

/** Daily snapshots to read back when measuring the current decline run
 *  (needs ALERT_DAYS + 1 points to count ALERT_DAYS day-over-day drops). */
export const DIR_DECLINE_LOOKBACK_DAYS = 4;

// ---------------------------------------------------------------------------
// MM — 3-Way Match (PO ↔ Goods Receipt ↔ Invoice)
// The match passes only when the largest pairwise spread between the PO total,
// the received goods value and the invoice amount stays within this fraction
// of the PO total. 0.02 = ±2%.
// ---------------------------------------------------------------------------

/** Allowed relative spread (fraction of PO total) for a passing 3-way match */
export const MM_THREE_WAY_MATCH_TOLERANCE = 0.02;

// ---------------------------------------------------------------------------
// POS Monitor — Anomaliya aniqlash (qoida-asosli) chegaralari
// AI-kalit yo'q → quyidagi qoidalar ishlaydi (graceful). Egasi real qiymat
// bersa (norma/og'irlik) bu chegaralar moslashtiriladi — fabrikatsiya yo'q (Q-40).
// ---------------------------------------------------------------------------

/** Tungi smena oynasi: [boshlanish soati, tugash soati) — yarim tunni o'rab oladi (22:00–06:00). */
export const POS_NIGHT_SHIFT_START_HOUR = 22;
export const POS_NIGHT_SHIFT_END_HOUR   = 6;

/** Tungi smenada "katta miqdor" deb hisoblanadigan bir harakat jami miqdori (dona/birlik). */
export const POS_NIGHT_LARGE_QTY_THRESHOLD = 1000;

/** Tungi smenada "katta qiymat" deb hisoblanadigan bir harakat jami summasi (baza valyuta). */
export const POS_NIGHT_LARGE_VALUE_THRESHOLD = 50_000_000;

/**
 * Topshir↔qabul nomuvofiqligi: e'lon qilingan miqdor bilan stock-ledgerga
 * yozilgan haqiqiy miqdor orasidagi ruxsat etilgan nisbiy farq (0.001 = 0.1%).
 * Suzuvchi nuqta yaxlitlash xatosidan kattaroq farq = anomaliya.
 */
export const POS_SEND_RECEIVE_TOLERANCE = 0.001;

/**
 * Norma-fakt ortiqcha-sarf: haqiqiy sarf normadan necha barobar oshsa
 * ogohlantirish (1.10 = +10%). material_norms bo'sh bo'lsa qoida skip (Q-40).
 */
export const POS_OVER_NORM_FACTOR = 1.10;

/**
 * AI-norma hisoblash (material_norms.calculatedByAI) — haqiqiy tarixiy
 * INTERNAL_ISSUE harakatlardan hisoblanadi (FAZA J, 2026-07-01).
 * Minimal namuna soni — bundan kam bo'lsa AI hisoblamaydi (fabrikatsiya yo'q, Q-40).
 */
export const POS_AI_NORM_MIN_SAMPLE_SIZE = 3;

/** AI-norma hisoblashda ko'riladigan so'nggi tugallangan harakatlar soni chegarasi. */
export const POS_AI_NORM_LOOKBACK_LIMIT = 200;

// ---------------------------------------------------------------------------
// FAZA Q — Ombor AI-kamera nazorati (noqonuniy olib chiqish / ruxsatsiz kirish).
// APPROVED: egasi vizyon-qurish 2026-07-01, FAZA Q.
// Mavjud HR yuz-tanish (FaceRecognitionService, cosine 0.85) reuse qilinadi —
// bu chegara o'sha servisning threshold'i bilan bir xil (Q-46 dublikat emas).
// ---------------------------------------------------------------------------

/** Ombor chiqish darvozasida yuz-tanish moslik chegarasi (HR face-recognition bilan bir xil). */
export const WAREHOUSE_EXIT_FACE_MATCH_THRESHOLD = 0.85;

/**
 * ai_camera_cross_check.match_score ustunida saqlanadigan aniqlik (0 raqamdan keyin).
 * ⭐ Ustun DB'da `NUMERIC(5,2)` (faqat 2 xona) — shuning uchun 2 qilib qo'yilgan
 * (avval 4 edi: JS 4 xonagacha yaxlitlagan bo'lsa ham, Postgres baribir 2 xonaga
 * kesib tashlar edi — soxta aniqlik, live-tekshiruv bilan tasdiqlandi: 0.9123 →
 * saqlanganda "0.91"). Ustun kengaytirilsa (migratsiya, egasi ruxsati bilan) —
 * shu konstanta ham yangilanadi.
 */
export const WAREHOUSE_EXIT_MATCH_SCORE_DECIMALS = 2;

// ---------------------------------------------------------------------------
// IoT — Kamera AI vizyon tahlili (2.11-soxta-vlm-endpoint fix)
// ---------------------------------------------------------------------------

/** analyze-by-missions VLM javobi uchun maksimal token (JSON findings ro'yxati). */
export const CAMERA_VISION_MAX_TOKENS = 1024;

/** VLM aniqlik darajasi berilmasa ishlatiladigan standart ai_confidence. */
export const CAMERA_VISION_DEFAULT_CONFIDENCE = 0.6;

// ---------------------------------------------------------------------------
// HR — Adaptatsiya (moslashuv) checklist bosqichlari (3.14)
// ---------------------------------------------------------------------------

/**
 * Yangi xodim adaptatsiya jarayoni checklist bosqichlari: kun1/hafta1/oy1/oy3.
 * `adaptation_records.start_date` dan boshlab necha kundan keyin muddat kelishi
 * (`adaptation_milestones.due_date`). Tartib = milestone_number (1..4).
 */
export const ADAPTATION_MILESTONE_STEPS = [
  { number: 1, dayOffset: 1,  title: 'Kun 1',   titleRu: 'День 1' },
  { number: 2, dayOffset: 7,  title: 'Hafta 1', titleRu: 'Неделя 1' },
  { number: 3, dayOffset: 30, title: 'Oy 1',    titleRu: 'Месяц 1' },
  { number: 4, dayOffset: 90, title: 'Oy 3',    titleRu: 'Месяц 3' },
] as const;

// ---------------------------------------------------------------------------
// HR — Mentorlik (mentors.card_id, hr-card-links-2026-07-04.sql)
// ---------------------------------------------------------------------------

/**
 * Bitta kartaga (org_departments.id) biriktirilishi mumkin bo'lgan faol
 * mentorlar soni chegarasi. `mentors.card_id` NULL bo'lgan (kartaga
 * bog'lanmagan) yozuvlar bu chegaraga kirmaydi.
 */
export const MENTORS_PER_CARD_CAP = 2;

// ---------------------------------------------------------------------------
// IoT — Anomaly detection severity / MES auto-pause (VISION-3340 #20)
// ---------------------------------------------------------------------------

/**
 * AnomalyDetectedHandler severity escalation: when the measured sensor value
 * is at/above this ratio over the sensor's own configured `iot_sensors
 * .max_threshold` (1.5 = value is >= 50% over the limit), the anomaly is
 * classified 'critical' (iot_alerts.severity) instead of the default 'high',
 * and the handler additionally dispatches MES's PauseSessionCommand to pause
 * the related production_sessions row (fail-safe: an off-spec/unsafe machine
 * should not keep running unattended). No threshold configured on the sensor
 * (or threshold <= 0) => ratio cannot be computed => stays 'high', no auto-pause
 * (Q-40 — never fabricate a severity without real threshold data).
 */
export const IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO = 1.5;

// ---------------------------------------------------------------------------
// QC — Final inspection sign-off razryad gate (VISION-3340 #37)
// ---------------------------------------------------------------------------

/**
 * `qc_inspections.reference_type` value that marks an inspection as a FINAL
 * QC sign-off (as opposed to `'batch'` / `'order'` / `'production_order'` —
 * interim/in-process checks). SubmitInspectionHandler gates on this literal.
 * `reference_type` is an unconstrained TEXT column (live DB verified), so no
 * migration is required to introduce this new value — upstream creators can
 * start stamping it whenever the 'final QC' workflow needs it.
 */
export const QC_FINAL_INSPECTION_REFERENCE_TYPE = 'final';

/**
 * Minimum `razryad_levels.level` (1..6, seeded scale) the INSPECTOR's card
 * (`qc_inspections.inspector_card_id` → `org_departments.razryad_level_id`)
 * must meet to submit a decision on a FINAL QC inspection. Below this level
 * (or no razryad/card at all) → Err(BUSINESS_RULE_VIOLATION), no sign-off.
 * Does not apply to non-final (in-process/batch) inspections.
 */
export const QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL = 3;

/**
 * Default `qc_reclamations.deadline_days` — matches the live DB column's own
 * DEFAULT 5 (lib/db/src/schema/qc-schema.ts:193). Used by
 * CreateReclamationHandler to compute `sla_due_at` (reportedDate +
 * N business days, weekends skipped via TashkentTimeService.addBusinessDays)
 * when the aggregate is constructed. Named here instead of re-hardcoding the
 * literal so the business-day SLA calc and the DB default stay in one place.
 */
export const QC_RECLAMATION_DEFAULT_SLA_DAYS = 5;

/**
 * Default `certificates.expiry_date` validity window (calendar days from issue),
 * applied when a QC quality certificate is issued without an explicit expiry
 * (both the auto-issue path — QcPassedCertificateListener → QcCertificatePdfService
 * — and the manual `POST /qc/certificates` CRUD path). Discovery sweep 2026-08-03
 * fix ("QC mahsulot sertifikati muddati tekshirilmaydi, SD blok yo'q" — vision
 * 09-qc.md #28): certificates previously never had an expiry set at all, so the
 * nightly expiry-check cron (CertificateExpiryCron) had nothing to find. 365 days
 * (1 year) is the standard quality-certificate validity default; adjust per
 * `qc_certificate_templates.validityDays` once a caller supplies a template.
 */
export const QC_CERTIFICATE_DEFAULT_VALIDITY_DAYS = 365;

// ---------------------------------------------------------------------------
// CRM — Lead-aging avtomatik qayta biriktirish (VISION-3340 #33)
// ---------------------------------------------------------------------------

/**
 * `crm_leads` uchun: COALESCE(last_activity_at, created_at) shu kunlar sonidan
 * ko'proq oldin bo'lsa, lead "sovigan" (cold) hisoblanadi va
 * `lead-aging-reassign.cron.ts` uni boshqa faol sotuv menejeriga qayta
 * biriktiradi (agar joriy holati terminal bo'lmasa).
 */
export const CRM_LEAD_AGING_REASSIGN_DAYS = 60;

/**
 * `crm_leads.status` ning "yakunlangan" (terminal) qiymatlari — bu holatdagi
 * lead'lar lead-aging cron tomonidan chetlab o'tiladi (qayta biriktirilmaydi).
 * 'converted' — SD oqimi orqali (queries-sd.ts execSdLeadConvert / sd-leads
 * repository); 'won'/'lost' — LEAD_STATUS lug'atidagi (lead-sources.constants.ts)
 * yakuniy holatlar.
 */
export const CRM_LEAD_TERMINAL_STATUSES = ['won', 'lost', 'converted'] as const;

/**
 * Modul 14 Marketing — win-back avto-start (vision 14-marketing #46): mijoz oxirgi
 * buyurtmasidan shu OY sonidan ko'proq o'tgan bo'lsa "faol emas" hisoblanadi va
 * `win-back.cron.ts` unga qaytarish (win-back) kanban vazifasini avtomatik yaratadi —
 * agar SD'da ochiq (terminal bo'lmagan) lead bo'lmasa. Qiymat vision sarlavhasida
 * belgilangan (3 oy), egasi-qarori EMAS.
 */
export const MARKETING_WINBACK_INACTIVE_MONTHS = 3;

/**
 * Kengash (council) kvorumi — modul 04 Coordination, egasi qarori (decisions/04-coordination.md
 * BO'LIM 1: "2/3 (66%) shart; kvorum yetmasa maslahat majlisi = qaror kuchsiz").
 * Ovoz beruvchi a'zolarning kamida 2/3 qismi hozir bo'lsa kvorum bor; aks holda qaror
 * "maslahat" (advisory) — majburiy emas. Qaror oddiy ko'pchilik bilan; teng bo'lsa Rais hal qiladi.
 * (Batch 5 Item 8)
 */
export const COUNCIL_QUORUM_NUMERATOR = 2;
export const COUNCIL_QUORUM_DENOMINATOR = 3;
/** Ovoz beradigan (kvorumga sanaladigan) rollar — 'guest' ovoz bermaydi. */
export const COUNCIL_VOTING_ROLES = ['chair', 'secretary', 'member'] as const;

/**
 * Kommunikatsiya Markazi (CC) arxiv-saqlash muddati — egasi qarori (decisions/20-cc.md EP-CC-016, Q73):
 * tasdiqlangan hujjat immutable, o'chmaydi — arxivga ko'chadi; muddat lavozimga qarab:
 * RAHBAR (leader — kengash/direktor/menejer roli) 10 yil, ISHCHI (worker) 3 yil. (Batch 5 Item 3)
 */
export const CC_RETENTION_LEADER_YEARS = 10;
export const CC_RETENTION_WORKER_YEARS = 3;
/** "Rahbar" (leader) deb hisoblanadigan rollar — kengash/boshqaruv darajasi (10 yil saqlash). */
export const CC_LEADER_ROLES = ['super_admin', 'admin', 'director', 'ceo', 'manager', 'supervisor'] as const;

/**
 * Kanban — kunlik "Shoshilinch" (urgent) karta limiti (modul 15 Kanban, vizyon
 * TASDIQ-2146 §15 #29 / vision-1000-answers/15-kanban.md #15:
 * "Bir kunda ko'pi bilan 2 Shoshilinch"). Bir foydalanuvchi (topshiruvchi/assigner)
 * bir kunda ko'pi bilan shuncha 'urgent' prioritetli karta yarata oladi; keyingisi
 * rad etiladi. (Item C29)
 */
export const KANBAN_MAX_URGENT_PER_DAY = 2;

/**
 * WMS — GTD (bojxona yuk deklaratsiyasi) yetishmovchilik eskalatsiya oynasi (modul 10 Ombor,
 * vizyon vision-1000-answers/10-warehouse.md #10: "GTD yo'q bo'lsa ogohlantirish + bayroq…
 * ~14 kun ichida"). Import qabulida GTD raqami kiritilmasa, receipt_date + shuncha kundan
 * keyin Klassifikatsiya + Moliyaga eskalatsiya (qabulni bloklamaydi). Egasi keyin toraytirishi
 * mumkin (Q-35/Izoh: "Muddat konfiguratsiya"). (Item 10-wms#10)
 */
export const WMS_GTD_ESCALATION_DAYS = 14;

/**
 * Modul 14 Marketing -- promo-kod standart cheklash (vision-1000-answers/14-marketing.md #20):
 * "Promo-kod 1 mijoz / 1 kampaniya bo'yicha cheklangan (default); cheklash qoidasini
 * marketing boshliq kampaniya sozlamalarida belgilaydi -- yangi kampaniyada boshqa limit
 * qo'yish mumkin." Qiymat vision matnida aniq berilgan (1), egasi-qarori EMAS; promo-kod
 * yaratishda boshqa limit uzatilsa shu default override qilinadi (promo-codes.service.ts).
 */
export const MARKETING_PROMO_CODE_DEFAULT_USAGE_LIMIT = 1;

/**
 * Kanban — "bekor qilingan" (cancelled) ustunni tanish uchun kalit so'zlar
 * (modul 15 Kanban, Kanban-15 A17). Buyurtma bekor qilinganda
 * `moveOrderCardToCancelled` (kanban-cards.repo.ts) unga bog'liq kartalarni
 * shu kalit so'zlardan biriga mos "bekor"/"cancel" ustuniga ko'chiradi (mavjud
 * ilike('%bekor%')/ilike('%cancel%') konvensiyasi shu yerda nomlanadi).
 * KPI agregatsiyasida (drizzle-kanban-stats.repo.ts → getTaskStats,
 * bajarilish foizi) bunday kartalar NEYTRAL — muvaffaqiyatsizlik/bajarilmagan
 * vazifa sifatida hisoblanmaydi, balki maxrajdan (va suratdan) butunlay
 * chiqarib tashlanadi; alohida `cancelledTasks` sonida ko'rsatiladi.
 */
export const KANBAN_CANCELLED_COLUMN_KEYWORDS = ['bekor', 'cancel'] as const;

// ---------------------------------------------------------------------------
// Kanban — Karta-egasi reyting formulasi (VISION-3340 #39 / Item A39)
// ---------------------------------------------------------------------------

/**
 * Kanban karta-egasi (ijrochi) reyting formulasi og'irliklari — modul 15 Kanban,
 * vizyon vision-1000-answers/15-kanban.md #39 / FULL-ITEM-LEVEL-MASTER-PLAN Item A39:
 * "Bajarilish reytingi (COR-073) va eskalatsiya soni (EP-KAN-045) birlashtirilgan
 * formula: KPI_score = achievement * 0.7 - escalation_penalty * 0.3; og'irlik
 * koeffitsientlari business.constants.ts da; formula HR tomonidan inson tasdig'i
 * (E1) bilan tasdiqlangan; quarter sayin qayta ko'rib chiqiladi."
 * achievement = shu owner bajargan kartalar foizi (0-100 shkala — DrizzleKanbanStatsRepository
 * .getTeamMetrics() dagi mavjud `rate` bilan bir xil hisoblash); escalation_penalty = shu
 * owner'ga `kanban-overdue-escalation.cron.ts` yuborgan 'kanban_overdue' bildirishnomalari
 * soni (EP-KAN-045, notifications jadvalidan). Natija (`ratingScore`) faqat ko'rsatkich —
 * E1 bo'yicha avtomatik jazo/bonus emas, HR/boshliq tasdig'i bilan ishlatiladi.
 */
export const KANBAN_RATING_WEIGHT_ACHIEVEMENT = 0.7;
export const KANBAN_RATING_WEIGHT_ESCALATION = 0.3;

// ---------------------------------------------------------------------------
// PP — Quvvat rejasi / Load Analysis (Capacity Planning)
// ---------------------------------------------------------------------------

/** loadPercentage shu chegaradan oshsa work-center "bottleneck" (kritik) deb belgilanadi. */
export const CAPACITY_BOTTLENECK_THRESHOLD_PCT = 90;

/** loadPercentage shu chegaradan oshsa work-center "overloaded" (ortiqcha yuklangan) holatga o'tadi. */
export const CAPACITY_OVERLOAD_THRESHOLD_PCT = 100;
