/**
 * @module crm-lead-scoring.service
 * @description Pure, unit-testable lead-scoring formula.
 *
 *   EP-CRM-012 mandates a weighted, configurable scoring formula across 5
 *   criteria (budget, engagement/activity, recency, source quality, fit).
 *   This service owns the computation; it has NO DB access, NO I/O, and
 *   NO NestJS lifecycle beyond @Injectable(). Every input is a plain
 *   value-object; every output is a Result<LeadScoreOutput>.
 *
 *   Design decisions
 *   ────────────────
 *   PURE VS DB-READING:
 *     Lead-scorer-v2.service reads model weights from an in-memory SGD
 *     model trained nightly. This scorer is the heuristic complement
 *     (see lead-scorer.service.ts WHY HEURISTIC section): deterministic,
 *     explainable, works day-1 without training data.
 *
 *     The DB-reading "score after each activity" path (lead-scorer-agent)
 *     can call this.score(signals) and write the returned number back —
 *     keeping DB coupling OUT of this service.
 *
 *   FORMULA:
 *     Each criterion produces a normalised value in [0, 1].
 *     weighted_sum = Σ(weight_i × criterion_i)   ← in [0, 1]
 *     score        = round(weighted_sum × 100)    ← integer in [0, 100]
 *
 *   TIER BANDS (hot/warm/cold):
 *     hot  ≥ TIER_HOT_MIN  (70) — contact immediately
 *     warm ≥ TIER_WARM_MIN (40) — nurture & enrich
 *     cold < TIER_WARM_MIN      — drip campaign
 *     Consistent with LeadScorerService and LeadScorerV2's segmentize().
 *
 *   NaN / RANGE GUARD:
 *     Every numeric input passes through safeNum(); every division through
 *     safeDiv(). If the caller provides all-zero or all-NaN signals the
 *     formula still returns a valid score (0). NaN can only enter the
 *     result path if weight validation passes unexpectedly — the guard at
 *     the end catches that with an Err('VALIDATION').
 *
 *   WEIGHT OVERRIDE:
 *     The caller may pass a `weights` argument to override the default
 *     constants. The service validates that all five keys are present,
 *     all values are finite ≥ 0, and the sum is ≈ 1 (±WEIGHT_SUM_TOLERANCE).
 *     Invalid weights → Err('VALIDATION') before any computation.
 *
 * @layer Domain Service (CRM — pure compute, no I/O)
 *
 * @see crm-lead-scoring.constants.ts — all tunable numbers
 * @see lead-scorer.service.ts       — heuristic breakdown scorer (V1)
 * @see lead-scorer-v2.service.ts    — probabilistic SGD scorer (V2)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { safeNum, safeDiv, clamp } from '@common/math/math-utils';
import {
  SCORING_W_BUDGET,
  SCORING_W_ENGAGEMENT,
  SCORING_W_RECENCY,
  SCORING_W_SOURCE,
  SCORING_W_FIT,
  BUDGET_HIGH_UZS,
  ENGAGEMENT_CAP,
  RECENCY_DECAY_DAYS,
  SOURCE_QUALITY_MAP,
  SOURCE_QUALITY_FALLBACK,
  FIT_POINTS_COMPANY,
  FIT_POINTS_WEBSITE,
  FIT_POINTS_EMAIL,
  FIT_POINTS_PHONE,
  FIT_EMPLOYEE_THRESHOLD,
  FIT_POINTS_EMPLOYEES,
  FIT_MAX_POINTS,
  TIER_HOT_MIN,
  TIER_WARM_MIN,
  WEIGHT_SUM_TOLERANCE,
} from './crm-lead-scoring.constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Tier band — aligns with LeadScorerService and LeadScorerV2 naming. */
export type LeadTier = 'hot' | 'warm' | 'cold';

/**
 * All signals that feed into the 5-criterion formula.
 * Every field is optional; missing/null/NaN fields score 0 on that dimension.
 */
export interface LeadScoringSignals {
  /** Lead budget / expected deal size in UZS (≥ 0). */
  budgetUzs?: number | null;

  /**
   * Number of CRM activity log entries for this lead (calls, emails, visits,
   * Telegram messages, etc.). Capped at ENGAGEMENT_CAP before normalising.
   */
  activityCount?: number | null;

  /**
   * Days since the last recorded CRM activity on this lead.
   * 0 = activity today (max recency); RECENCY_DECAY_DAYS+ = fully cold.
   */
  daysSinceLastActivity?: number | null;

  /**
   * Acquisition channel. Matched against SOURCE_QUALITY_MAP.
   * Unknown strings fall back to SOURCE_QUALITY_FALLBACK.
   */
  source?: string | null;

  /** True when a company/organisation name is on record. */
  hasCompany?: boolean | null;

  /** True when a verified email address is on record. */
  hasEmail?: boolean | null;

  /** True when a phone number is on record. */
  hasPhone?: boolean | null;

  /** True when the lead's company has a website on record. */
  hasWebsite?: boolean | null;

  /** Number of employees at the lead's company (for mid-market flag). */
  employeeCount?: number | null;
}

/**
 * Five normalised sub-scores plus the aggregate.
 * Surfaces are in [0, 1]; the aggregate `score` is in [0, 100] (integer).
 */
export interface LeadScoreCriteriaBreakdown {
  /** Normalised budget contribution (0..1). */
  budgetNorm: number;
  /** Normalised engagement contribution (0..1). */
  engagementNorm: number;
  /** Normalised recency contribution (0..1). */
  recencyNorm: number;
  /** Normalised source-quality contribution (0..1). */
  sourceNorm: number;
  /** Normalised firmographic-fit contribution (0..1). */
  fitNorm: number;
}

/** Return type of CrmLeadScoringService.score(). */
export interface LeadScoreOutput {
  /** Aggregate score — integer in [0, 100]. */
  score: number;
  /** Tier classification derived from the score. */
  tier: LeadTier;
  /** Per-criterion normalised scores for explainability / SDR coaching. */
  breakdown: LeadScoreCriteriaBreakdown;
  /** The weight set used for this computation (defaults or caller override). */
  weights: LeadScoringWeights;
}

/**
 * Optional weight override. When provided, ALL five keys must be present and
 * their sum must equal 1 (±WEIGHT_SUM_TOLERANCE). Missing or NaN weights
 * return Err('VALIDATION').
 */
export interface LeadScoringWeights {
  budget: number;
  engagement: number;
  recency: number;
  source: number;
  fit: number;
}

// ---------------------------------------------------------------------------
// Default weights object (derived from constants — not inlined)
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: Readonly<LeadScoringWeights> = {
  budget:     SCORING_W_BUDGET,
  engagement: SCORING_W_ENGAGEMENT,
  recency:    SCORING_W_RECENCY,
  source:     SCORING_W_SOURCE,
  fit:        SCORING_W_FIT,
} as const;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * CrmLeadScoringService — pure weighted-sum lead scorer.
 *
 * Usage (from the DB-writing orchestrator):
 *   const result = this.scoringService.score(signals);
 *   if (result.ok) await this.leadRepo.updateScore(leadId, result.data.score);
 *
 * Usage (with weight override from admin panel):
 *   const weights = { budget: 0.4, engagement: 0.2, recency: 0.2, source: 0.1, fit: 0.1 };
 *   const result = this.scoringService.score(signals, weights);
 *
 * @op EP-CRM-012 — configurable scoring formula (interest/activity/response_speed/deal_size)
 */
@Injectable()
export class CrmLeadScoringService {
  /**
   * Score a lead against 5 criteria.
   *
   * @param signals - All input signals. Every field is optional; missing /
   *   null / NaN values score 0 on that criterion without causing an error.
   * @param weights - Optional weight override. When omitted, the module-level
   *   defaults from crm-lead-scoring.constants.ts are used. When provided,
   *   ALL five keys must be present and their sum must be ≈ 1.
   * @returns Result<LeadScoreOutput> — always synchronous (no async needed).
   *   Returns Err('VALIDATION') when:
   *     • weights are provided but invalid (missing key, NaN, negative, sum ≠ 1)
   *     • the computed weighted sum is NaN (should not happen in practice —
   *       the NaN guard is a belt-and-suspenders final check)
   */
  score(
    signals: LeadScoringSignals,
    weights?: Partial<LeadScoringWeights>,
  ): Result<LeadScoreOutput, AppError> {
    // ── 1. Resolve and validate weights ────────────────────────────────────
    const resolvedWeightsResult = this.resolveWeights(weights);
    if (!resolvedWeightsResult.ok) {
      return Err(resolvedWeightsResult.error);
    }
    const w = resolvedWeightsResult.data;

    // ── 2. Compute each normalised sub-score ───────────────────────────────
    const budgetNorm     = this.normaliseBudget(signals.budgetUzs);
    const engagementNorm = this.normaliseEngagement(signals.activityCount);
    const recencyNorm    = this.normaliseRecency(signals.daysSinceLastActivity);
    const sourceNorm     = this.normaliseSource(signals.source);
    const fitNorm        = this.normaliseFit(signals);

    // ── 3. Weighted sum ────────────────────────────────────────────────────
    const weightedSum =
      w.budget     * budgetNorm     +
      w.engagement * engagementNorm +
      w.recency    * recencyNorm    +
      w.source     * sourceNorm     +
      w.fit        * fitNorm;

    // ── 4. NaN guard — belt-and-suspenders ────────────────────────────────
    if (!Number.isFinite(weightedSum)) {
      return Err(AppErr(
        'VALIDATION',
        'Lead scoring: hisoblangan ball cheksiz/NaN — signallar va og\'irliklarni tekshiring',
        { budgetNorm, engagementNorm, recencyNorm, sourceNorm, fitNorm, weights: w },
      ));
    }

    // ── 5. Final score ─────────────────────────────────────────────────────
    const clamped = clamp(weightedSum, 0, 1);
    const score   = Math.round(clamped * 100);   // integer 0..100

    return Ok({
      score,
      tier: this.deriveTier(score),
      breakdown: { budgetNorm, engagementNorm, recencyNorm, sourceNorm, fitNorm },
      weights: w,
    });
  }

  // ---------------------------------------------------------------------------
  // Private — criterion normalisers
  // ---------------------------------------------------------------------------

  /**
   * Budget normalisation: log1p scaled against BUDGET_HIGH_UZS.
   *
   * WHY log1p: budgets span 4 orders of magnitude (100k .. 1B+ UZS).
   * Linear normalisation would make any sub-50M budget nearly invisible.
   * log1p compresses the range while keeping 0 budget = 0 score.
   *
   * Formula: min(log1p(budget) / log1p(BUDGET_HIGH_UZS), 1)
   * At budget = BUDGET_HIGH_UZS (100M) → exactly 1.0
   * At budget = 0                      → 0.0
   * At budget = 10M                    → ≈ 0.77 (good signal)
   */
  private normaliseBudget(budgetUzs: number | null | undefined): number {
    const b = safeNum(budgetUzs, 0);
    if (b <= 0) return 0;
    const top = Math.log1p(BUDGET_HIGH_UZS);
    return clamp(safeDiv(Math.log1p(b), top), 0, 1);
  }

  /**
   * Engagement normalisation: activity count capped and divided.
   *
   * Cap at ENGAGEMENT_CAP (20) prevents a single chatty lead from
   * saturating the score; normalised to [0, 1] by dividing by the cap.
   */
  private normaliseEngagement(activityCount: number | null | undefined): number {
    const n = safeNum(activityCount, 0);
    if (n <= 0) return 0;
    const capped = Math.min(n, ENGAGEMENT_CAP);
    return clamp(safeDiv(capped, ENGAGEMENT_CAP), 0, 1);
  }

  /**
   * Recency normalisation: linear decay from 1.0 (today) to 0 (≥ RECENCY_DECAY_DAYS).
   *
   * Formula: max(0, 1 − daysSinceLastActivity / RECENCY_DECAY_DAYS)
   * At 0 days  → 1.0 (freshest possible)
   * At 30 days → 0.5
   * At 60 days → 0.0 (EP-CRM-063 abandonment threshold)
   * >60 days   → 0.0 (clamped, not negative)
   *
   * WHY linear (not exponential): simpler to explain to SDRs ("every day
   * inactive removes 1/60 of the recency score"). V2 uses exponential
   * decay for the probabilistic model; heuristic prefers interpretability.
   */
  private normaliseRecency(daysSinceLastActivity: number | null | undefined): number {
    const d = safeNum(daysSinceLastActivity, 0);
    if (d <= 0) return 1;
    return clamp(1 - safeDiv(d, RECENCY_DECAY_DAYS), 0, 1);
  }

  /**
   * Source quality normalisation: lookup against SOURCE_QUALITY_MAP.
   * Unknown strings fall back to SOURCE_QUALITY_FALLBACK (0.05).
   * null/undefined → 0.
   */
  private normaliseSource(source: string | null | undefined): number {
    if (source == null || source.trim() === '') return 0;
    const key = source.trim().toLowerCase();
    const quality = SOURCE_QUALITY_MAP[key] ?? SOURCE_QUALITY_FALLBACK;
    return clamp(safeNum(quality, 0), 0, 1);
  }

  /**
   * Firmographic fit normalisation: additive point scoring / FIT_MAX_POINTS.
   *
   * Points table:
   *   company  +3
   *   website  +2
   *   email    +2
   *   phone    +1
   *   ≥50 emp  +2
   *   ─────────────
   *   max      10
   *
   * Result in [0, 1].
   */
  private normaliseFit(signals: LeadScoringSignals): number {
    let pts = 0;
    if (signals.hasCompany) pts += FIT_POINTS_COMPANY;
    if (signals.hasWebsite) pts += FIT_POINTS_WEBSITE;
    if (signals.hasEmail)   pts += FIT_POINTS_EMAIL;
    if (signals.hasPhone)   pts += FIT_POINTS_PHONE;
    const empCount = safeNum(signals.employeeCount, 0);
    if (empCount >= FIT_EMPLOYEE_THRESHOLD) pts += FIT_POINTS_EMPLOYEES;
    return clamp(safeDiv(pts, FIT_MAX_POINTS), 0, 1);
  }

  // ---------------------------------------------------------------------------
  // Private — tier derivation
  // ---------------------------------------------------------------------------

  /**
   * Convert a 0..100 score to a tier label.
   * Thresholds match LeadScorerService for UX consistency.
   */
  private deriveTier(score: number): LeadTier {
    if (score >= TIER_HOT_MIN)  return 'hot';
    if (score >= TIER_WARM_MIN) return 'warm';
    return 'cold';
  }

  // ---------------------------------------------------------------------------
  // Private — weight resolution and validation
  // ---------------------------------------------------------------------------

  /**
   * Merge caller-supplied weight overrides with defaults, then validate.
   *
   * Rules:
   *   • All five keys must be present (after merge with defaults).
   *   • Every weight must be a finite number ≥ 0.
   *   • The sum must equal 1.0 ± WEIGHT_SUM_TOLERANCE.
   */
  private resolveWeights(
    override?: Partial<LeadScoringWeights>,
  ): Result<LeadScoringWeights, AppError> {
    if (override == null) {
      return Ok({ ...DEFAULT_WEIGHTS });
    }

    const w: LeadScoringWeights = {
      budget:     override.budget     ?? DEFAULT_WEIGHTS.budget,
      engagement: override.engagement ?? DEFAULT_WEIGHTS.engagement,
      recency:    override.recency    ?? DEFAULT_WEIGHTS.recency,
      source:     override.source     ?? DEFAULT_WEIGHTS.source,
      fit:        override.fit        ?? DEFAULT_WEIGHTS.fit,
    };

    // All values must be finite and non-negative
    const keys = Object.keys(w) as Array<keyof LeadScoringWeights>;
    for (const key of keys) {
      const v = w[key];
      if (!Number.isFinite(v) || v < 0) {
        return Err(AppErr(
          'VALIDATION',
          `Lead scoring: og'irlik "${key}" = ${v} noto'g'ri (manfiy yoki NaN)`,
          { key, value: v },
        ));
      }
    }

    // Sum must be ≈ 1
    const sum = w.budget + w.engagement + w.recency + w.source + w.fit;
    if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
      return Err(AppErr(
        'VALIDATION',
        `Lead scoring: og'irliklar yig'indisi 1 bo'lishi kerak, lekin ${sum.toFixed(10)} berildi`,
        { sum, weights: w },
      ));
    }

    return Ok(w);
  }
}
