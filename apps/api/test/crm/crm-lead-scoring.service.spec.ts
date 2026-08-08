/**
 * @module test/crm/crm-lead-scoring.service.spec
 * @description Unit tests for CrmLeadScoringService — pure weighted-sum scorer.
 *
 *   Test strategy:
 *     • CrmLeadScoringService has NO injected dependencies — plain `new` is enough.
 *     • Covers: known signals → score + tier; tier boundary exactness;
 *       valid + invalid weight overrides; partial/missing signals; NaN/edge guards;
 *       determinism; breakdown range.
 *
 * @see apps/api/src/modules/crm/domain/services/crm-lead-scoring.service.ts
 * @see apps/api/src/modules/crm/domain/services/crm-lead-scoring.constants.ts
 */

import { CrmLeadScoringService, LeadScoringSignals, LeadScoringWeights } from '../../src/modules/crm/domain/services/crm-lead-scoring.service';
import {
  BUDGET_HIGH_UZS,
  ENGAGEMENT_CAP,
  RECENCY_DECAY_DAYS,
  TIER_HOT_MIN,
  TIER_WARM_MIN,
  FIT_MAX_POINTS,
  FIT_POINTS_COMPANY,
  SCORING_W_BUDGET,
  SCORING_W_ENGAGEMENT,
  SCORING_W_RECENCY,
  SCORING_W_SOURCE,
  SCORING_W_FIT,
} from '../../src/modules/crm/domain/services/crm-lead-scoring.constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A "perfect" signal set — every criterion scores 1.0 → aggregate 100. */
const PERFECT_SIGNALS: LeadScoringSignals = {
  budgetUzs:             BUDGET_HIGH_UZS,
  activityCount:         ENGAGEMENT_CAP,
  daysSinceLastActivity: 0,
  source:                'referral',
  hasCompany:            true,
  hasWebsite:            true,
  hasEmail:              true,
  hasPhone:              true,
  employeeCount:         100,
};

/** A "cold" signal set — every criterion scores 0 → aggregate 0. */
const COLD_SIGNALS: LeadScoringSignals = {
  budgetUzs:             0,
  activityCount:         0,
  daysSinceLastActivity: RECENCY_DECAY_DAYS + 1,
  source:                null,
  hasCompany:            false,
  hasWebsite:            false,
  hasEmail:              false,
  hasPhone:              false,
  employeeCount:         0,
};

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('CrmLeadScoringService', () => {
  let svc: CrmLeadScoringService;

  beforeEach(() => {
    svc = new CrmLeadScoringService();
  });

  // ── 1. Basic shape ─────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('returns ok:true for valid signals', () => {
      const result = svc.score(PERFECT_SIGNALS);
      expect(result.ok).toBe(true);
    });

    it('result.data has score, tier, breakdown, weights', () => {
      const result = svc.score(PERFECT_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(typeof result.data.score).toBe('number');
      expect(['hot', 'warm', 'cold']).toContain(result.data.tier);
      expect(result.data.breakdown).toMatchObject({
        budgetNorm:     expect.any(Number),
        engagementNorm: expect.any(Number),
        recencyNorm:    expect.any(Number),
        sourceNorm:     expect.any(Number),
        fitNorm:        expect.any(Number),
      });
      expect(result.data.weights).toMatchObject({
        budget:     SCORING_W_BUDGET,
        engagement: SCORING_W_ENGAGEMENT,
        recency:    SCORING_W_RECENCY,
        source:     SCORING_W_SOURCE,
        fit:        SCORING_W_FIT,
      });
    });

    it('score is an integer', () => {
      const result = svc.score(PERFECT_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(Math.round(result.data.score));
    });

    it('score is in [0, 100] for perfect signals', () => {
      const result = svc.score(PERFECT_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('score is in [0, 100] for cold signals', () => {
      const result = svc.score(COLD_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('score is in [0, 100] for empty signals', () => {
      const result = svc.score({});
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(100);
    });
  });

  // ── 2. Known signals → known score + tier ──────────────────────────────────

  describe('known signals → score + tier', () => {
    it('perfect signals → score 100 and tier "hot"', () => {
      const result = svc.score(PERFECT_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(100);
      expect(result.data.tier).toBe('hot');
    });

    it('cold signals → score 0 and tier "cold"', () => {
      const result = svc.score(COLD_SIGNALS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(0);
      expect(result.data.tier).toBe('cold');
    });

    it('referral source → sourceNorm = 1.0', () => {
      const result = svc.score({ ...COLD_SIGNALS, source: 'referral' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBeCloseTo(1.0, 5);
    });

    it('visit source → sourceNorm = 0.80', () => {
      const result = svc.score({ source: 'visit' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBeCloseTo(0.80, 5);
    });

    it('social source → sourceNorm = 0.25', () => {
      const result = svc.score({ source: 'social' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBeCloseTo(0.25, 5);
    });

    it('unknown source → sourceNorm = 0.05 (fallback)', () => {
      const result = svc.score({ ...COLD_SIGNALS, source: 'fax_machine' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBeCloseTo(0.05, 5);
    });

    it('null source → sourceNorm = 0', () => {
      const result = svc.score({ source: null });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBe(0);
    });

    it('budget at BUDGET_HIGH_UZS → budgetNorm ≈ 1.0', () => {
      const result = svc.score({ budgetUzs: BUDGET_HIGH_UZS });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.budgetNorm).toBeCloseTo(1.0, 5);
    });

    it('budget 2× BUDGET_HIGH_UZS → budgetNorm clamped to 1.0', () => {
      const result = svc.score({ budgetUzs: BUDGET_HIGH_UZS * 2 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.budgetNorm).toBe(1.0);
    });

    it('budget 0 → budgetNorm = 0', () => {
      const result = svc.score({ budgetUzs: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.budgetNorm).toBe(0);
    });

    it('activityCount at ENGAGEMENT_CAP → engagementNorm ≈ 1.0', () => {
      const result = svc.score({ activityCount: ENGAGEMENT_CAP });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.engagementNorm).toBeCloseTo(1.0, 5);
    });

    it('activityCount 10× cap → engagementNorm clamped to 1.0', () => {
      const result = svc.score({ activityCount: ENGAGEMENT_CAP * 10 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.engagementNorm).toBe(1.0);
    });

    it('0 days inactive → recencyNorm = 1.0', () => {
      const result = svc.score({ daysSinceLastActivity: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.recencyNorm).toBe(1.0);
    });

    it('RECENCY_DECAY_DAYS days → recencyNorm = 0.0', () => {
      const result = svc.score({ daysSinceLastActivity: RECENCY_DECAY_DAYS });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.recencyNorm).toBeCloseTo(0.0, 5);
    });

    it('over RECENCY_DECAY_DAYS → recencyNorm clamped to 0', () => {
      const result = svc.score({ daysSinceLastActivity: RECENCY_DECAY_DAYS + 999 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.recencyNorm).toBe(0);
    });

    it('half decay point → recencyNorm ≈ 0.5', () => {
      const result = svc.score({ daysSinceLastActivity: RECENCY_DECAY_DAYS / 2 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.recencyNorm).toBeCloseTo(0.5, 5);
    });

    it('all fit flags + large company → fitNorm ≈ 1.0', () => {
      const result = svc.score({
        hasCompany: true, hasWebsite: true, hasEmail: true,
        hasPhone: true, employeeCount: 50,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.fitNorm).toBeCloseTo(1.0, 5);
    });

    it('no fit signals → fitNorm = 0', () => {
      const result = svc.score({
        hasCompany: false, hasWebsite: false, hasEmail: false,
        hasPhone: false, employeeCount: 0,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.fitNorm).toBe(0);
    });

    it('company only → fitNorm = FIT_POINTS_COMPANY / FIT_MAX_POINTS', () => {
      const expected = FIT_POINTS_COMPANY / FIT_MAX_POINTS;
      const result = svc.score({ hasCompany: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.fitNorm).toBeCloseTo(expected, 5);
    });
  });

  // ── 3. Tier boundary exactness ─────────────────────────────────────────────

  describe('tier boundary exactness', () => {
    /**
     * Weight override: all weight on recency, others zero.
     * score = round((1 - days/RECENCY_DECAY_DAYS) × 100)
     * This lets us hit precise integer scores to test boundary conditions.
     */
    const recencyOnly: LeadScoringWeights = {
      budget: 0, engagement: 0, recency: 1, source: 0, fit: 0,
    };

    it(`score = TIER_HOT_MIN (${TIER_HOT_MIN}) → tier "hot"`, () => {
      const days = RECENCY_DECAY_DAYS * (1 - TIER_HOT_MIN / 100);
      const result = svc.score({ daysSinceLastActivity: days }, recencyOnly);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(TIER_HOT_MIN);
      expect(result.data.tier).toBe('hot');
    });

    it(`score = TIER_HOT_MIN - 1 (${TIER_HOT_MIN - 1}) → tier "warm"`, () => {
      const days = RECENCY_DECAY_DAYS * (1 - (TIER_HOT_MIN - 1) / 100);
      const result = svc.score({ daysSinceLastActivity: days }, recencyOnly);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(TIER_HOT_MIN - 1);
      expect(result.data.tier).toBe('warm');
    });

    it(`score = TIER_WARM_MIN (${TIER_WARM_MIN}) → tier "warm"`, () => {
      const days = RECENCY_DECAY_DAYS * (1 - TIER_WARM_MIN / 100);
      const result = svc.score({ daysSinceLastActivity: days }, recencyOnly);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(TIER_WARM_MIN);
      expect(result.data.tier).toBe('warm');
    });

    it(`score = TIER_WARM_MIN - 1 (${TIER_WARM_MIN - 1}) → tier "cold"`, () => {
      const days = RECENCY_DECAY_DAYS * (1 - (TIER_WARM_MIN - 1) / 100);
      const result = svc.score({ daysSinceLastActivity: days }, recencyOnly);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(TIER_WARM_MIN - 1);
      expect(result.data.tier).toBe('cold');
    });
  });

  // ── 4. Weight override ─────────────────────────────────────────────────────

  describe('weight override — valid cases', () => {
    it('valid full override is accepted and reflected in result.weights', () => {
      const override: LeadScoringWeights = {
        budget: 0.4, engagement: 0.2, recency: 0.2, source: 0.1, fit: 0.1,
      };
      const result = svc.score(PERFECT_SIGNALS, override);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.weights).toEqual(override);
    });

    it('budget-only weight = 1 → perfect budget signals score 100', () => {
      const budgetOnly: LeadScoringWeights = {
        budget: 1, engagement: 0, recency: 0, source: 0, fit: 0,
      };
      const result = svc.score({ budgetUzs: BUDGET_HIGH_UZS }, budgetOnly);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBe(100);
    });

    it('partial override (only budget key) merges with defaults → ok', () => {
      const partial: Partial<LeadScoringWeights> = { budget: SCORING_W_BUDGET };
      const result = svc.score(PERFECT_SIGNALS, partial);
      expect(result.ok).toBe(true);
    });

    it('weight sum exactly 1 after floating-point arithmetic → ok', () => {
      // 0.1 + 0.1 + 0.1 + 0.1 + 0.6 can have floating-point issues; service must tolerate
      const weights: LeadScoringWeights = {
        budget: 0.1, engagement: 0.1, recency: 0.1, source: 0.1, fit: 0.6,
      };
      const result = svc.score({}, weights);
      expect(result.ok).toBe(true);
    });
  });

  describe('weight override — invalid cases → Err VALIDATION', () => {
    it('weight sum > 1 → Err VALIDATION', () => {
      const bad: LeadScoringWeights = {
        budget: 0.5, engagement: 0.5, recency: 0.5, source: 0.5, fit: 0.5,
      };
      const result = svc.score(PERFECT_SIGNALS, bad);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('weight sum < 1 → Err VALIDATION', () => {
      const bad: LeadScoringWeights = {
        budget: 0.1, engagement: 0.1, recency: 0.1, source: 0.1, fit: 0.1,
      };
      const result = svc.score(PERFECT_SIGNALS, bad);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('negative weight → Err VALIDATION', () => {
      const bad: LeadScoringWeights = {
        budget: -0.1, engagement: 0.5, recency: 0.3, source: 0.15, fit: 0.15,
      };
      const result = svc.score(PERFECT_SIGNALS, bad);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('NaN weight → Err VALIDATION', () => {
      const bad: LeadScoringWeights = {
        budget: NaN, engagement: 0.25, recency: 0.25, source: 0.25, fit: 0.25,
      };
      const result = svc.score(PERFECT_SIGNALS, bad);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('Infinity weight → Err VALIDATION', () => {
      const bad: LeadScoringWeights = {
        budget: Infinity, engagement: 0, recency: 0, source: 0, fit: 0,
      };
      const result = svc.score(PERFECT_SIGNALS, bad);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });
  });

  // ── 5. Missing / null / undefined signals → no crash ──────────────────────

  describe('missing / null / undefined signals → always ok', () => {
    it('empty signals object → ok:true', () => {
      const result = svc.score({});
      expect(result.ok).toBe(true);
    });

    it('all fields explicitly null → ok:true', () => {
      const nullSignals: LeadScoringSignals = {
        budgetUzs:             null,
        activityCount:         null,
        daysSinceLastActivity: null,
        source:                null,
        hasCompany:            null,
        hasWebsite:            null,
        hasEmail:              null,
        hasPhone:              null,
        employeeCount:         null,
      };
      expect(svc.score(nullSignals).ok).toBe(true);
    });

    it('NaN budget → budgetNorm = 0', () => {
      const result = svc.score({ budgetUzs: NaN });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.budgetNorm).toBe(0);
    });

    it('negative budget → budgetNorm = 0', () => {
      const result = svc.score({ budgetUzs: -5_000_000 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.budgetNorm).toBe(0);
    });

    it('NaN activityCount → engagementNorm = 0', () => {
      const result = svc.score({ activityCount: NaN });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.engagementNorm).toBe(0);
    });

    it('negative activityCount → engagementNorm = 0', () => {
      const result = svc.score({ activityCount: -10 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.engagementNorm).toBe(0);
    });

    it('undefined source → sourceNorm = 0', () => {
      const result = svc.score({ source: undefined });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBe(0);
    });

    it('whitespace-only source → sourceNorm = 0', () => {
      const result = svc.score({ source: '   ' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.sourceNorm).toBe(0);
    });

    it('extreme-large budget → ok and score capped at 100', () => {
      const result = svc.score({ budgetUzs: 1e18 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('extreme-large activityCount → ok and score capped at 100', () => {
      const result = svc.score({ activityCount: 1e9 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('negative daysSinceLastActivity → recencyNorm = 1.0 (treated as 0)', () => {
      const result = svc.score({ daysSinceLastActivity: -5 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakdown.recencyNorm).toBe(1.0);
    });
  });

  // ── 6. Breakdown sub-scores always in [0, 1] ──────────────────────────────

  describe('breakdown sub-scores always in [0, 1]', () => {
    const scenarios: Array<[string, LeadScoringSignals]> = [
      ['perfect signals', PERFECT_SIGNALS],
      ['cold signals',    COLD_SIGNALS],
      ['empty signals',   {}],
      ['extreme values',  { budgetUzs: 1e15, activityCount: 1e6, daysSinceLastActivity: -5 }],
    ];

    scenarios.forEach(([label, signals]) => {
      it(`${label}: all breakdown sub-scores ∈ [0, 1]`, () => {
        const result = svc.score(signals);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        const { budgetNorm, engagementNorm, recencyNorm, sourceNorm, fitNorm } = result.data.breakdown;
        expect(budgetNorm).toBeGreaterThanOrEqual(0);
        expect(budgetNorm).toBeLessThanOrEqual(1);
        expect(engagementNorm).toBeGreaterThanOrEqual(0);
        expect(engagementNorm).toBeLessThanOrEqual(1);
        expect(recencyNorm).toBeGreaterThanOrEqual(0);
        expect(recencyNorm).toBeLessThanOrEqual(1);
        expect(sourceNorm).toBeGreaterThanOrEqual(0);
        expect(sourceNorm).toBeLessThanOrEqual(1);
        expect(fitNorm).toBeGreaterThanOrEqual(0);
        expect(fitNorm).toBeLessThanOrEqual(1);
      });
    });
  });

  // ── 7. Determinism ────────────────────────────────────────────────────────

  describe('determinism', () => {
    it('two calls with identical signals yield identical results', () => {
      const signals: LeadScoringSignals = {
        budgetUzs:             50_000_000,
        activityCount:         10,
        daysSinceLastActivity: 15,
        source:                'direct',
        hasCompany:            true,
        hasEmail:              true,
        hasPhone:              false,
        hasWebsite:            false,
        employeeCount:         30,
      };
      const r1 = svc.score(signals);
      const r2 = svc.score(signals);
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;
      expect(r1.data.score).toBe(r2.data.score);
      expect(r1.data.tier).toBe(r2.data.tier);
    });
  });

  // ── 8. Realistic mid-market scenario ──────────────────────────────────────

  describe('realistic mid-market scenario', () => {
    it('typical warm lead (packaging company, direct channel) lands in warm tier', () => {
      /**
       * Scenario: 20M UZS budget, 3 activities 20 days ago, direct channel,
       * company + email on record, 30 employees. Expected tier: warm.
       *
       * Rough math (default weights):
       *   budget:     log1p(20M)/log1p(100M) ≈ 0.86 → 0.30×0.86 ≈ 0.258
       *   engagement: 3/20 = 0.15           → 0.25×0.15 ≈ 0.038
       *   recency:    1-20/60 ≈ 0.667       → 0.20×0.667 ≈ 0.133
       *   source:     direct = 0.70         → 0.15×0.70  ≈ 0.105
       *   fit:        (3+2)/10 = 0.5        → 0.10×0.5   ≈ 0.050
       *   total ≈ 0.584 → score ≈ 58 → warm ✓
       */
      const result = svc.score({
        budgetUzs:             20_000_000,
        activityCount:         3,
        daysSinceLastActivity: 20,
        source:                'direct',
        hasCompany:            true,
        hasEmail:              true,
        employeeCount:         30,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeGreaterThanOrEqual(TIER_WARM_MIN);
      expect(result.data.score).toBeLessThan(TIER_HOT_MIN);
      expect(result.data.tier).toBe('warm');
    });
  });
});
