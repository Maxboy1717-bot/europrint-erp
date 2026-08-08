/**
 * test/hr/hr-rating.service.spec.ts
 * @description Unit tests for HrRatingService.computeRating (7-factor formula).
 *   Vision source: CHAT-TARIXI-YANGI-2026-06-08.md §1 "XODIM REYTINGI = 7 FAKTOR".
 *   Pure arithmetic + validation — no DB, no NestJS runtime required.
 *
 * Coverage:
 *   ✅ Known inputs → known score (deterministic math, hand-verified)
 *   ✅ Default weights applied when none supplied
 *   ✅ Custom weight override (partial + full)
 *   ✅ Breakdown items correct (factor/rawScore/weight/contribution)
 *   ✅ Label thresholds (excellent/good/average/poor)
 *   ✅ Edge: all zeros → score 0, label 'poor'
 *   ✅ Edge: all 100s → score 100, label 'excellent'
 *   ✅ Error: factor value NaN/Infinity/-1/101 → Err(VALIDATION)
 *   ✅ Error: weights sum ≠ 1.0 → Err(VALIDATION)
 *   ✅ Error: weight negative → Err(VALIDATION)
 *   ✅ Error: weight NaN → Err(VALIDATION)
 *   ✅ Floating-point clamp: score always in [0, 100]
 */

import {
  HrRatingService,
  HrRatingFactors,
  HrRatingWeights,
} from '../../src/modules/hr/domain/services/hr-rating.service';
import { HR_RATING_WEIGHTS } from '../../src/common/constants/business.constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A canonical "good employee" input set used across multiple tests.
 *
 * Hand-verified weighted score with default weights:
 *   norm       : 80   × 0.25 = 20.00
 *   attendance : 90   × 0.20 = 18.00
 *   quality    : 85   × 0.20 = 17.00
 *   seniority  : 66.7 × 0.10 =  6.67
 *   discipline : 100  × 0.10 = 10.00
 *   peer       : 75   × 0.10 =  7.50
 *   aiKpi      : 70   × 0.05 =  3.50
 *                              ------
 *                              82.67  → label = 'good' (≥70, <85)
 */
const GOOD_EMPLOYEE: HrRatingFactors = {
  norm:        80,
  attendance:  90,
  quality:     85,
  seniority:   66.7,
  discipline:  100,
  peer:        75,
  aiKpi:       70,
};
const GOOD_EMPLOYEE_EXPECTED_SCORE = 82.67;

const ZERO_FACTORS: HrRatingFactors = {
  norm: 0, attendance: 0, quality: 0, seniority: 0,
  discipline: 0, peer: 0, aiKpi: 0,
};

const PERFECT_FACTORS: HrRatingFactors = {
  norm: 100, attendance: 100, quality: 100, seniority: 100,
  discipline: 100, peer: 100, aiKpi: 100,
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('HrRatingService', () => {
  let service: HrRatingService;

  beforeEach(() => {
    // Pure service — no NestJS TestingModule needed.
    service = new HrRatingService();
  });

  // -------------------------------------------------------------------------
  // 1. Known inputs → known score (deterministic math)
  // -------------------------------------------------------------------------

  describe('computeRating — deterministic score', () => {
    it('produces the correct weighted score for GOOD_EMPLOYEE with default weights', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.score).toBe(GOOD_EMPLOYEE_EXPECTED_SCORE);
      expect(result.data.label).toBe('good');
    });

    it('all-zero inputs → score 0, label poor', () => {
      const result = service.computeRating(ZERO_FACTORS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.score).toBe(0);
      expect(result.data.label).toBe('poor');
    });

    it('all-100 inputs → score 100, label excellent', () => {
      const result = service.computeRating(PERFECT_FACTORS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.score).toBe(100);
      expect(result.data.label).toBe('excellent');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Breakdown items
  // -------------------------------------------------------------------------

  describe('computeRating — breakdown', () => {
    it('returns exactly 7 breakdown items', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.breakdown).toHaveLength(7);
    });

    it('norm breakdown item has correct rawScore, weight, and contribution', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const normItem = result.data.breakdown.find(b => b.factor === 'norm');
      expect(normItem).toBeDefined();
      if (!normItem) return;
      expect(normItem.rawScore).toBe(GOOD_EMPLOYEE.norm);
      expect(normItem.weight).toBe(HR_RATING_WEIGHTS.norm);
      expect(normItem.contribution).toBeCloseTo(
        GOOD_EMPLOYEE.norm * HR_RATING_WEIGHTS.norm, 10,
      );
    });

    it('aiKpi breakdown item has correct values (smallest weight)', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const aiItem = result.data.breakdown.find(b => b.factor === 'aiKpi');
      expect(aiItem).toBeDefined();
      if (!aiItem) return;
      expect(aiItem.rawScore).toBe(GOOD_EMPLOYEE.aiKpi);
      expect(aiItem.weight).toBe(HR_RATING_WEIGHTS.aiKpi);
      expect(aiItem.contribution).toBeCloseTo(
        GOOD_EMPLOYEE.aiKpi * HR_RATING_WEIGHTS.aiKpi, 10,
      );
    });

    it('sum of contributions ≈ final score', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const sumOfContributions = result.data.breakdown.reduce(
        (s, b) => s + b.contribution, 0,
      );
      // The score is rounded to 2dp; contributions are raw — allow 0.01 delta.
      expect(sumOfContributions).toBeCloseTo(result.data.score, 1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Label thresholds
  // -------------------------------------------------------------------------

  describe('computeRating — label thresholds', () => {
    /** Equal-weight override so score ≈ the uniform input value. */
    const equalWeights: HrRatingWeights = {
      norm: 1/7, attendance: 1/7, quality: 1/7,
      seniority: 1/7, discipline: 1/7, peer: 1/7, aiKpi: 1/7,
    };

    function uniformScore(target: number): HrRatingFactors {
      return {
        norm: target, attendance: target, quality: target,
        seniority: target, discipline: target, peer: target, aiKpi: target,
      };
    }

    it('score 85 → excellent', () => {
      const result = service.computeRating(uniformScore(85), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('excellent');
    });

    it('score 70 → good (at good threshold)', () => {
      const result = service.computeRating(uniformScore(70), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('good');
    });

    it('score 84.99 → good (just below excellent)', () => {
      const result = service.computeRating(uniformScore(84.99), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('good');
    });

    it('score 50 → average (at average threshold)', () => {
      const result = service.computeRating(uniformScore(50), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('average');
    });

    it('score 49.99 → poor (just below average)', () => {
      const result = service.computeRating(uniformScore(49.99), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('poor');
    });

    it('score 0 → poor', () => {
      const result = service.computeRating(uniformScore(0), equalWeights);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.label).toBe('poor');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Custom weight overrides
  // -------------------------------------------------------------------------

  describe('computeRating — custom weights', () => {
    it('balanced custom equal-weights produce score ≈ average of factors', () => {
      const equalWeights: HrRatingWeights = {
        norm: 1/7, attendance: 1/7, quality: 1/7,
        seniority: 1/7, discipline: 1/7, peer: 1/7, aiKpi: 1/7,
      };
      const allSeventy: HrRatingFactors = {
        norm: 70, attendance: 70, quality: 70,
        seniority: 70, discipline: 70, peer: 70, aiKpi: 70,
      };

      const result = service.computeRating(allSeventy, equalWeights);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeCloseTo(70, 1);
      expect(result.data.label).toBe('good');
    });

    it('appliedWeights in result reflects the custom weights actually used', () => {
      const customWeights: HrRatingWeights = {
        norm: 0.30, attendance: 0.20, quality: 0.20,
        seniority: 0.10, discipline: 0.10, peer: 0.05, aiKpi: 0.05,
      };

      const result = service.computeRating(GOOD_EMPLOYEE, customWeights);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.appliedWeights).toEqual(customWeights);
    });

    it('default appliedWeights match HR_RATING_WEIGHTS when no override given', () => {
      const result = service.computeRating(GOOD_EMPLOYEE);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.appliedWeights).toEqual(HR_RATING_WEIGHTS);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error: factor validation
  // -------------------------------------------------------------------------

  describe('computeRating — factor validation errors', () => {
    function withFactor(
      key: keyof HrRatingFactors,
      value: number,
    ): HrRatingFactors {
      return { ...GOOD_EMPLOYEE, [key]: value };
    }

    const invalidFactorCases: Array<[string, keyof HrRatingFactors, number]> = [
      ['NaN for norm',           'norm',        NaN],
      ['Infinity for norm',      'norm',        Infinity],
      ['-Infinity for norm',     'norm',        -Infinity],
      ['-1 for attendance',      'attendance',  -1],
      ['101 for quality',        'quality',     101],
      ['-0.001 for seniority',   'seniority',   -0.001],
      ['100.001 for discipline',  'discipline',  100.001],
      ['NaN for peer',           'peer',        NaN],
      ['101 for aiKpi',          'aiKpi',       101],
    ];

    it.each(invalidFactorCases)(
      'returns Err(VALIDATION) when %s',
      (_label, key, value) => {
        const result = service.computeRating(withFactor(key, value));

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.code).toBe('VALIDATION');
      },
    );
  });

  // -------------------------------------------------------------------------
  // 6. Error: weight validation
  // -------------------------------------------------------------------------

  describe('computeRating — weight validation errors', () => {
    it('returns Err(VALIDATION) when weights sum exceeds 1.0', () => {
      // Override norm 0.25→0.55; total becomes 1.30.
      const badWeights: Partial<HrRatingWeights> = { norm: 0.55 };

      const result = service.computeRating(GOOD_EMPLOYEE, badWeights);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/sum/i);
    });

    it('returns Err(VALIDATION) when weights sum is below 1.0', () => {
      // Override norm 0.25→0.01; total becomes 0.76.
      const badWeights: Partial<HrRatingWeights> = { norm: 0.01 };

      const result = service.computeRating(GOOD_EMPLOYEE, badWeights);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('returns Err(VALIDATION) when a weight is negative', () => {
      const badWeights: HrRatingWeights = {
        ...HR_RATING_WEIGHTS,
        norm: -0.25,
        attendance: 0.45, // compensate so sum would be 1.0, but negative is caught first
      };

      const result = service.computeRating(GOOD_EMPLOYEE, badWeights);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/non-negative/i);
    });

    it('returns Err(VALIDATION) when a weight is NaN', () => {
      const badWeights: HrRatingWeights = {
        ...HR_RATING_WEIGHTS,
        norm: NaN,
      };

      const result = service.computeRating(GOOD_EMPLOYEE, badWeights);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Internal helper: _resolveWeights
  // -------------------------------------------------------------------------

  describe('_resolveWeights (internal helper)', () => {
    it('default weights from constants sum to 1.0', () => {
      const result = service._resolveWeights();

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const total = Object.values(result.data).reduce((s, w) => s + w, 0);
      expect(total).toBeCloseTo(1.0, 10);
    });

    it('merged result contains all 7 factor keys', () => {
      const result = service._resolveWeights();

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(Object.keys(result.data)).toHaveLength(7);
      expect(Object.keys(result.data)).toEqual(
        expect.arrayContaining([
          'norm', 'attendance', 'quality', 'seniority',
          'discipline', 'peer', 'aiKpi',
        ]),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 8. Internal helper: _validateFactors
  // -------------------------------------------------------------------------

  describe('_validateFactors (internal helper)', () => {
    it('returns Ok(void) for valid GOOD_EMPLOYEE factors', () => {
      const result = service._validateFactors(GOOD_EMPLOYEE);
      expect(result.ok).toBe(true);
    });

    it('boundary 0 is valid', () => {
      const result = service._validateFactors(ZERO_FACTORS);
      expect(result.ok).toBe(true);
    });

    it('boundary 100 is valid', () => {
      const result = service._validateFactors(PERFECT_FACTORS);
      expect(result.ok).toBe(true);
    });

    it('returns Err for quality = 100.001', () => {
      const result = service._validateFactors({ ...GOOD_EMPLOYEE, quality: 100.001 });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });
  });

  // -------------------------------------------------------------------------
  // 9. Internal helper: _scoreToLabel
  // -------------------------------------------------------------------------

  describe('_scoreToLabel (internal helper)', () => {
    const cases: Array<[number, 'excellent' | 'good' | 'average' | 'poor']> = [
      [100,   'excellent'],
      [85,    'excellent'],
      [84.99, 'good'],
      [70,    'good'],
      [69.99, 'average'],
      [50,    'average'],
      [49.99, 'poor'],
      [0,     'poor'],
    ];

    it.each(cases)('score %d → %s', (score, expected) => {
      expect(service._scoreToLabel(score)).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Floating-point clamp safety
  // -------------------------------------------------------------------------

  describe('floating-point edge cases', () => {
    it('score never exceeds 100 for perfect factors', () => {
      const result = service.computeRating(PERFECT_FACTORS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeLessThanOrEqual(100);
      expect(result.data.score).toBeGreaterThanOrEqual(0);
    });

    it('score never goes below 0 for all-zero factors', () => {
      const result = service.computeRating(ZERO_FACTORS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.score).toBeGreaterThanOrEqual(0);
    });
  });
});
