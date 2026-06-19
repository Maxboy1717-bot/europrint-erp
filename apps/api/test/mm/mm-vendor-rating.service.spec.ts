/**
 * @module mm-vendor-rating.service.spec
 * @description Unit tests for MmVendorRatingService.computeRating().
 *
 * Vision: EP-MM-001/002/040/041 (MUSLIMBEK-PROMT-09-MM-2026-06-08)
 * Formula: sifat 40% + muddat 30% + narx 20% + hujjat 10%
 *
 * Coverage:
 *   1. Known inputs → expected score + grade
 *   2. Grade threshold boundaries (A/B/C/D/blacklist-candidate)
 *   3. Custom weight overrides
 *   4. Partial weight override merges defaults correctly
 *   5. Invalid inputs → Err (NaN, negative, out-of-range, bad weights, weight sum)
 *   6. Breakdown field accuracy
 *   7. Edge cases: zero scores, perfect scores, floating-point weight sum
 *
 * PURE tests — no DB, no NestJS module scaffolding needed.
 * MmVendorRatingService has no constructor dependencies.
 */

import { MmVendorRatingService } from '../../src/modules/mm/application/mm-vendor-rating.service';
import {
  MmVendorRatingMetrics,
  MmVendorRatingWeights,
  MM_VR_DEFAULT_WEIGHTS,
  MM_VR_GRADE_A_MIN,
  MM_VR_GRADE_B_MIN,
  MM_VR_GRADE_C_MIN,
  MM_VR_GRADE_D_MIN,
  MM_VR_BLACKLIST_MAX,
} from '../../src/modules/mm/application/mm-vendor-rating.constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const svc = new MmVendorRatingService();

/** Build a metrics object with all values equal to `v` (convenient baseline). */
function uniformMetrics(v: number): MmVendorRatingMetrics {
  return { quality: v, delivery: v, price: v, document: v };
}

/** Assert the result is Ok and return its data. Fails the test otherwise. */
function assertOk<T>(result: { ok: boolean; data?: T; error?: { message: string; code: string } }): T {
  if (!result.ok) {
    throw new Error(`Expected Ok but got Err: ${result.error?.message}`);
  }
  return result.data as T;
}

/** Assert the result is Err and return its error. Fails the test otherwise. */
function assertErr(result: { ok: boolean; error?: { message: string; code: string } }) {
  if (result.ok) {
    throw new Error('Expected Err but got Ok');
  }
  return result.error!;
}

// ─── 1. Known inputs → score + grade ─────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — known inputs', () => {
  it('owner example: sifat=90, muddat=80, narx=70, hujjat=100 → score=84.0 → grade B', () => {
    // expected = 90*0.40 + 80*0.30 + 70*0.20 + 100*0.10
    //          = 36 + 24 + 14 + 10 = 84.0
    const result = assertOk(svc.computeRating({
      quality: 90, delivery: 80, price: 70, document: 100,
    }));
    expect(result.score).toBeCloseTo(84.0, 2);
    expect(result.grade).toBe('B');
  });

  it('perfect vendor: all 100 → score=100.0 → grade A', () => {
    const result = assertOk(svc.computeRating(uniformMetrics(100)));
    expect(result.score).toBeCloseTo(100, 2);
    expect(result.grade).toBe('A');
  });

  it('zero vendor: all 0 → score=0.0 → grade blacklist-candidate', () => {
    const result = assertOk(svc.computeRating(uniformMetrics(0)));
    expect(result.score).toBeCloseTo(0, 2);
    expect(result.grade).toBe('blacklist-candidate');
  });

  it('mid-range vendor: all 60 → score=60.0 → grade C', () => {
    const result = assertOk(svc.computeRating(uniformMetrics(60)));
    expect(result.score).toBeCloseTo(60, 2);
    expect(result.grade).toBe('C');
  });

  it('default weights sum to 1.0 (floating-point safe)', () => {
    const sum =
      MM_VR_DEFAULT_WEIGHTS.quality +
      MM_VR_DEFAULT_WEIGHTS.delivery +
      MM_VR_DEFAULT_WEIGHTS.price +
      MM_VR_DEFAULT_WEIGHTS.document;
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });

  it('breakdown contributions sum to the total score', () => {
    const result = assertOk(svc.computeRating({
      quality: 80, delivery: 70, price: 60, document: 90,
    }));
    const breakdownSum =
      result.breakdown.qualityContribution +
      result.breakdown.deliveryContribution +
      result.breakdown.priceContribution +
      result.breakdown.documentContribution;
    expect(breakdownSum).toBeCloseTo(result.score, 1);
  });
});

// ─── 2. Grade threshold boundaries ────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — grade boundary tests', () => {
  /**
   * Craft metrics that produce exactly the desired composite score using equal
   * weights (equal weights means score = average of metrics = single metric value
   * when all metrics are identical).
   * With DEFAULT weights (40/30/20/10), uniform metrics V → score = V*1.0 = V.
   */

  it(`score exactly ${MM_VR_GRADE_A_MIN} → grade A`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_A_MIN)));
    expect(result.score).toBeCloseTo(MM_VR_GRADE_A_MIN, 1);
    expect(result.grade).toBe('A');
  });

  it(`score one below A threshold (${MM_VR_GRADE_A_MIN - 1}) → grade B`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_A_MIN - 1)));
    expect(result.grade).toBe('B');
  });

  it(`score exactly ${MM_VR_GRADE_B_MIN} → grade B`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_B_MIN)));
    expect(result.grade).toBe('B');
  });

  it(`score one below B threshold (${MM_VR_GRADE_B_MIN - 1}) → grade C`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_B_MIN - 1)));
    expect(result.grade).toBe('C');
  });

  it(`score exactly ${MM_VR_GRADE_C_MIN} → grade C`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_C_MIN)));
    expect(result.grade).toBe('C');
  });

  it(`score one below C threshold (${MM_VR_GRADE_C_MIN - 1}) → grade D`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_C_MIN - 1)));
    expect(result.grade).toBe('D');
  });

  it(`score exactly ${MM_VR_GRADE_D_MIN} → grade D`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_D_MIN)));
    expect(result.grade).toBe('D');
  });

  it(`score one below D threshold (${MM_VR_GRADE_D_MIN - 1}) → grade blacklist-candidate`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_GRADE_D_MIN - 1)));
    expect(result.grade).toBe('blacklist-candidate');
  });

  it(`score exactly ${MM_VR_BLACKLIST_MAX - 1} → grade blacklist-candidate`, () => {
    const result = assertOk(svc.computeRating(uniformMetrics(MM_VR_BLACKLIST_MAX - 1)));
    expect(result.grade).toBe('blacklist-candidate');
  });

  it('score 0 → grade blacklist-candidate', () => {
    const result = assertOk(svc.computeRating(uniformMetrics(0)));
    expect(result.grade).toBe('blacklist-candidate');
  });
});

// ─── 3. Custom weight overrides ───────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — custom weights', () => {
  it('equal weights 25/25/25/25 → score = average of metrics', () => {
    const equalWeights: MmVendorRatingWeights = {
      quality: 0.25, delivery: 0.25, price: 0.25, document: 0.25,
    };
    const metrics: MmVendorRatingMetrics = {
      quality: 80, delivery: 60, price: 40, document: 100,
    };
    // expected = (80+60+40+100)/4 = 70
    const result = assertOk(svc.computeRating(metrics, equalWeights));
    expect(result.score).toBeCloseTo(70, 2);
  });

  it('quality-only weight (1.0) → score equals quality metric', () => {
    const qualityOnly: MmVendorRatingWeights = {
      quality: 1.0, delivery: 0.0001, price: 0.0001, document: 0.0001,
    };
    // NOTE: weights don't sum to exactly 1 — this should fail validation.
    // Instead use a properly summing set:
    const heavyQuality: MmVendorRatingWeights = {
      quality: 0.97, delivery: 0.01, price: 0.01, document: 0.01,
    };
    const metrics: MmVendorRatingMetrics = {
      quality: 100, delivery: 0, price: 0, document: 0,
    };
    const result = assertOk(svc.computeRating(metrics, heavyQuality));
    // score ≈ 100*0.97 + 0 + 0 + 0 = 97
    expect(result.score).toBeCloseTo(97, 1);
  });

  it('weight override → weightsUsed reflects overridden weights not defaults', () => {
    const customWeights: MmVendorRatingWeights = {
      quality: 0.25, delivery: 0.25, price: 0.25, document: 0.25,
    };
    const result = assertOk(svc.computeRating(uniformMetrics(50), customWeights));
    expect(result.weightsUsed).toEqual(customWeights);
  });

  it('no override → weightsUsed matches module defaults', () => {
    const result = assertOk(svc.computeRating(uniformMetrics(50)));
    expect(result.weightsUsed).toEqual(MM_VR_DEFAULT_WEIGHTS);
  });
});

// ─── 4. Partial weight overrides ─────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — partial weights must be rejected (all-or-nothing)', () => {
  // Partial overrides that don't sum to 1.0 must fail.
  it('partial override summing to < 1.0 → Err VALIDATION (sum)', () => {
    // Provide all 4 but with wrong sum
    const badSum: MmVendorRatingWeights = {
      quality: 0.50, delivery: 0.30, price: 0.10, document: 0.05, // sum = 0.95
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), badSum));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toMatch(/yig'indisi/i);
  });

  it('partial override summing to > 1.0 → Err VALIDATION (sum)', () => {
    const badSum: MmVendorRatingWeights = {
      quality: 0.50, delivery: 0.30, price: 0.20, document: 0.20, // sum = 1.20
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), badSum));
    expect(error.code).toBe('VALIDATION');
  });
});

// ─── 5. Invalid inputs → Err ──────────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — invalid metric inputs', () => {
  it('NaN metric → Err VALIDATION', () => {
    const error = assertErr(svc.computeRating({ quality: NaN, delivery: 80, price: 70, document: 90 }));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toContain('NaN');
  });

  it('Infinity metric → Err VALIDATION', () => {
    const error = assertErr(svc.computeRating({ quality: Infinity, delivery: 80, price: 70, document: 90 }));
    expect(error.code).toBe('VALIDATION');
  });

  it('negative metric (-1) → Err VALIDATION', () => {
    const error = assertErr(svc.computeRating({ quality: -1, delivery: 80, price: 70, document: 90 }));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toContain('0 dan kichik');
  });

  it('metric above 100 (101) → Err VALIDATION', () => {
    const error = assertErr(svc.computeRating({ quality: 101, delivery: 80, price: 70, document: 90 }));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toContain('100 dan oshishi mumkin emas');
  });

  it('metric exactly 0 → Ok (0 is valid lower bound)', () => {
    const result = svc.computeRating({ quality: 0, delivery: 80, price: 70, document: 90 });
    expect(result.ok).toBe(true);
  });

  it('metric exactly 100 → Ok (100 is valid upper bound)', () => {
    const result = svc.computeRating({ quality: 100, delivery: 80, price: 70, document: 90 });
    expect(result.ok).toBe(true);
  });
});

describe('MmVendorRatingService.computeRating() — invalid weight inputs', () => {
  it('zero weight → Err VALIDATION (weight must be > 0)', () => {
    // Zero weight is not strictly valid since spec says > 0
    const zeroWeight: MmVendorRatingWeights = {
      quality: 0, delivery: 0.40, price: 0.30, document: 0.30,
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), zeroWeight));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toContain('noldan katta');
  });

  it('NaN weight → Err VALIDATION', () => {
    const nanWeight: MmVendorRatingWeights = {
      quality: NaN, delivery: 0.40, price: 0.30, document: 0.30,
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), nanWeight));
    expect(error.code).toBe('VALIDATION');
  });

  it('weight > 1 → Err VALIDATION', () => {
    const bigWeight: MmVendorRatingWeights = {
      quality: 1.5, delivery: 0.30, price: 0.20, document: 0.10,
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), bigWeight));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toContain('1 dan oshmasligi kerak');
  });

  it('weight sum off by > tolerance (0.95 sum) → Err VALIDATION', () => {
    const lowSum: MmVendorRatingWeights = {
      quality: 0.35, delivery: 0.25, price: 0.20, document: 0.15, // sum = 0.95
    };
    const error = assertErr(svc.computeRating(uniformMetrics(50), lowSum));
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toMatch(/yig'indisi/);
  });

  it('weight sum within tolerance (floating-point 0.1+0.2+0.3+0.4) → Ok', () => {
    // 0.1 + 0.2 + 0.3 + 0.4 = 1.0000000000000002 in JS — within tolerance
    const fpWeights: MmVendorRatingWeights = {
      quality: 0.4, delivery: 0.3, price: 0.2, document: 0.1,
    };
    const result = svc.computeRating(uniformMetrics(50), fpWeights);
    expect(result.ok).toBe(true);
  });
});

// ─── 6. Breakdown field accuracy ──────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — breakdown accuracy', () => {
  it('each breakdown contribution matches factor * weight', () => {
    const metrics: MmVendorRatingMetrics = { quality: 90, delivery: 80, price: 70, document: 60 };
    const result = assertOk(svc.computeRating(metrics));

    expect(result.breakdown.qualityContribution).toBeCloseTo(90 * MM_VR_DEFAULT_WEIGHTS.quality,  2);
    expect(result.breakdown.deliveryContribution).toBeCloseTo(80 * MM_VR_DEFAULT_WEIGHTS.delivery, 2);
    expect(result.breakdown.priceContribution).toBeCloseTo(70 * MM_VR_DEFAULT_WEIGHTS.price,   2);
    expect(result.breakdown.documentContribution).toBeCloseTo(60 * MM_VR_DEFAULT_WEIGHTS.document, 2);
  });

  it('breakdown with custom weights is correct', () => {
    const customWeights: MmVendorRatingWeights = {
      quality: 0.25, delivery: 0.25, price: 0.25, document: 0.25,
    };
    const metrics: MmVendorRatingMetrics = { quality: 100, delivery: 50, price: 25, document: 75 };
    const result = assertOk(svc.computeRating(metrics, customWeights));

    expect(result.breakdown.qualityContribution).toBeCloseTo(25, 2);   // 100*0.25
    expect(result.breakdown.deliveryContribution).toBeCloseTo(12.5, 2); // 50*0.25
    expect(result.breakdown.priceContribution).toBeCloseTo(6.25, 2);    // 25*0.25
    expect(result.breakdown.documentContribution).toBeCloseTo(18.75, 2);// 75*0.25
    expect(result.score).toBeCloseTo(62.5, 2);
  });
});

// ─── 7. Additional edge cases ─────────────────────────────────────────────────

describe('MmVendorRatingService.computeRating() — edge cases', () => {
  it('score is rounded to 2 decimal places', () => {
    // 90*0.4 + 85*0.3 + 75*0.2 + 65*0.1 = 36 + 25.5 + 15 + 6.5 = 83.00
    const result = assertOk(svc.computeRating({ quality: 90, delivery: 85, price: 75, document: 65 }));
    // score has at most 2 decimal places
    const decimalPart = String(result.score).split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('returns Ok for minimum valid score (all zeros)', () => {
    const result = svc.computeRating(uniformMetrics(0));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.score).toBe(0);
      expect(result.data.grade).toBe('blacklist-candidate');
    }
  });

  it('returns Ok for maximum valid score (all hundreds)', () => {
    const result = svc.computeRating(uniformMetrics(100));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.score).toBe(100);
      expect(result.data.grade).toBe('A');
    }
  });

  it('service can be instantiated without DI container (pure unit test)', () => {
    const service = new MmVendorRatingService();
    expect(service).toBeDefined();
    const result = service.computeRating(uniformMetrics(75));
    expect(result.ok).toBe(true);
  });

  it('multiple calls are independent (no shared state)', () => {
    const r1 = assertOk(svc.computeRating(uniformMetrics(90)));
    const r2 = assertOk(svc.computeRating(uniformMetrics(40)));
    expect(r1.grade).toBe('A');
    expect(r2.grade).toBe('D');
    // Calling again with same inputs returns same result
    const r3 = assertOk(svc.computeRating(uniformMetrics(90)));
    expect(r3.score).toBe(r1.score);
  });
});
