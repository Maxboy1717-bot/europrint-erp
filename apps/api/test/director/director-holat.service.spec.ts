/**
 * test/director/director-holat.service.spec.ts
 *
 * Unit tests for DirectorHolatService.computeHolat().
 *
 * Coverage:
 *   TC-01  Happy path — known 5 inputs → score 74.5, level NORMAL
 *   TC-02  Breakdown contains all 5 keys with correct weighted values
 *   TC-03  Score exactly at OSISH threshold (85) → OSISH
 *   TC-04  Score just below OSISH (84.99) → NORMAL
 *   TC-05  Score exactly at NORMAL threshold (65) → NORMAL
 *   TC-06  Score just below NORMAL (64.9) → EHTIYOT
 *   TC-07  Score at EHTIYOT lower boundary (45) → EHTIYOT
 *   TC-08  Score at XAVF lower boundary (25) → XAVF
 *   TC-09  Custom equal weights produce different score classification
 *   TC-10  Single-metric weight of 1.0 ignores other metrics
 *   TC-11  Missing metric → Err with VALIDATION code
 *   TC-12  Empty metrics object → Err
 *   TC-13  NaN metric value → Err
 *   TC-14  Infinity metric value → Err
 *   TC-15  -Infinity metric value → Err
 *   TC-16  Metric > 100 → Err
 *   TC-17  Metric < 0 → Err
 *   TC-18  Weights summing to 0.9 → Err
 *   TC-19  Weights summing to 1.1 → Err
 *   TC-20  Negative weight → Err
 *   TC-21  Non-descending thresholds → Err
 *   TC-22  Custom thresholds change level band for same score
 *   TC-23  Very low metrics (10) → INQIROZ
 *   TC-24  All metrics at 100 → score 100, level OSISH
 *   TC-25  All metrics at 0 → score 0, level INQIROZ
 *   TC-26  Sum of breakdown weighted values equals total score
 *   TC-27  Custom weights AND thresholds both applied correctly
 *   TC-28  Score in XAVF band (30) → XAVF level
 */

import {
  DirectorHolatService,
  type HolatMetrics,
  type WeightMap,
  type ThresholdMap,
} from '../../src/modules/director/application/director-holat.service';

// ---------------------------------------------------------------------------
// Helper: full metrics fixture with known defaults
// ---------------------------------------------------------------------------

function makeMetrics(overrides: Partial<HolatMetrics> = {}): HolatMetrics {
  return {
    cash_flow:       80,
    production_plan: 70,
    orders:          60,
    hr:              90,
    quality:         75,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('DirectorHolatService', () => {
  let svc: DirectorHolatService;

  beforeEach(() => {
    svc = new DirectorHolatService();
  });

  // -------------------------------------------------------------------------
  // TC-01 / TC-02: Happy path
  // -------------------------------------------------------------------------

  it('TC-01: computes weighted score and returns correct level for representative inputs', () => {
    /**
     * Expected (default weights):
     *   cash_flow 80 × 0.30 = 24.00
     *   production_plan 70 × 0.25 = 17.50
     *   orders 60 × 0.20 = 12.00
     *   hr 90 × 0.15 = 13.50
     *   quality 75 × 0.10 =  7.50
     *   total = 74.50 → NORMAL (≥65, <85)
     */
    const result = svc.computeHolat(makeMetrics());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(74.5, 1);
    expect(result.data.level).toBe('NORMAL');
  });

  it('TC-02: breakdown contains all 5 metric keys with correct weighted values', () => {
    const result = svc.computeHolat(makeMetrics());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bd = result.data.breakdown;
    expect(Object.keys(bd)).toEqual(expect.arrayContaining([
      'cash_flow', 'production_plan', 'orders', 'hr', 'quality',
    ]));
    expect(bd.cash_flow.raw).toBe(80);
    expect(bd.cash_flow.weight).toBeCloseTo(0.30, 5);
    expect(bd.cash_flow.weighted).toBeCloseTo(24, 5);
    expect(bd.hr.weighted).toBeCloseTo(13.5, 5);
  });

  // -------------------------------------------------------------------------
  // TC-03 to TC-08: Threshold boundary conditions
  // -------------------------------------------------------------------------

  it('TC-03: score exactly at OSISH threshold → OSISH', () => {
    // All metrics = 85 → score = 85 (sum of weights = 1.0)
    const m = makeMetrics({ cash_flow: 85, production_plan: 85, orders: 85, hr: 85, quality: 85 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(85, 1);
    expect(result.data.level).toBe('OSISH');
  });

  it('TC-04: score just below OSISH threshold (84.99) → NORMAL', () => {
    const m = makeMetrics({ cash_flow: 84.99, production_plan: 84.99, orders: 84.99, hr: 84.99, quality: 84.99 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(84.99, 1);
    expect(result.data.level).toBe('NORMAL');
  });

  it('TC-05: score exactly at NORMAL threshold (65) → NORMAL', () => {
    const m = makeMetrics({ cash_flow: 65, production_plan: 65, orders: 65, hr: 65, quality: 65 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(65, 1);
    expect(result.data.level).toBe('NORMAL');
  });

  it('TC-06: score just below NORMAL threshold → EHTIYOT', () => {
    const m = makeMetrics({ cash_flow: 64.9, production_plan: 64.9, orders: 64.9, hr: 64.9, quality: 64.9 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.level).toBe('EHTIYOT');
  });

  it('TC-07: score at EHTIYOT lower boundary (45) → EHTIYOT', () => {
    const m = makeMetrics({ cash_flow: 45, production_plan: 45, orders: 45, hr: 45, quality: 45 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(45, 1);
    expect(result.data.level).toBe('EHTIYOT');
  });

  it('TC-08: score at XAVF lower boundary (25) → XAVF', () => {
    const m = makeMetrics({ cash_flow: 25, production_plan: 25, orders: 25, hr: 25, quality: 25 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(25, 1);
    expect(result.data.level).toBe('XAVF');
  });

  // -------------------------------------------------------------------------
  // TC-09 / TC-10: Weight override
  // -------------------------------------------------------------------------

  it('TC-09: custom equal weights produce different score classification', () => {
    /**
     * With DEFAULT weights: cash_flow=100, rest=50
     *   score = 100×0.30 + 50×0.25 + 50×0.20 + 50×0.15 + 50×0.10
     *         = 30 + 12.5 + 10 + 7.5 + 5 = 65 → NORMAL (≥65)
     *
     * With EQUAL weights (0.2 each): 100×0.2 + 50×0.2 + 50×0.2 + 50×0.2 + 50×0.2
     *   = 20 + 10 + 10 + 10 + 10 = 60 → EHTIYOT (≥45, <65)
     */
    const equalWeights: WeightMap = {
      cash_flow:       0.2,
      production_plan: 0.2,
      orders:          0.2,
      hr:              0.2,
      quality:         0.2,
    };
    const m = makeMetrics({ cash_flow: 100, production_plan: 50, orders: 50, hr: 50, quality: 50 });

    const defaultResult = svc.computeHolat(m);
    expect(defaultResult.ok).toBe(true);
    if (!defaultResult.ok) return;
    expect(defaultResult.data.level).toBe('NORMAL');

    const overrideResult = svc.computeHolat(m, { weights: equalWeights });
    expect(overrideResult.ok).toBe(true);
    if (!overrideResult.ok) return;
    expect(overrideResult.data.score).toBeCloseTo(60, 1);
    expect(overrideResult.data.level).toBe('EHTIYOT');
  });

  it('TC-10: single-metric weight of 1.0 produces score equal to that metric only', () => {
    const singleWeights: WeightMap = {
      cash_flow:       1.0,
      production_plan: 0.0,
      orders:          0.0,
      hr:              0.0,
      quality:         0.0,
    };
    const m = makeMetrics({ cash_flow: 90, production_plan: 10, orders: 10, hr: 10, quality: 10 });
    const result = svc.computeHolat(m, { weights: singleWeights });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(90, 1);
    expect(result.data.level).toBe('OSISH');
  });

  // -------------------------------------------------------------------------
  // TC-11 / TC-12: Missing metric → Err
  // -------------------------------------------------------------------------

  it('TC-11: missing metric returns Err with VALIDATION code mentioning the key', () => {
    const incomplete = {
      cash_flow:       80,
      production_plan: 70,
      orders:          60,
      // hr missing intentionally
      quality:         75,
    } as Partial<HolatMetrics>;

    const result = svc.computeHolat(incomplete);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('hr');
  });

  it('TC-12: completely empty metrics object returns Err', () => {
    const result = svc.computeHolat({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  // -------------------------------------------------------------------------
  // TC-13 to TC-15: NaN / Infinity → Err
  // -------------------------------------------------------------------------

  it('TC-13: NaN metric value returns Err mentioning the metric key', () => {
    const result = svc.computeHolat(makeMetrics({ cash_flow: NaN }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('cash_flow');
  });

  it('TC-14: Infinity metric value returns Err', () => {
    const result = svc.computeHolat(makeMetrics({ quality: Infinity }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('quality');
  });

  it('TC-15: -Infinity metric value returns Err', () => {
    const result = svc.computeHolat(makeMetrics({ hr: -Infinity }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  // -------------------------------------------------------------------------
  // TC-16 / TC-17: Out-of-range metric → Err
  // -------------------------------------------------------------------------

  it('TC-16: metric > 100 returns Err mentioning the metric key', () => {
    const result = svc.computeHolat(makeMetrics({ orders: 101 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('orders');
  });

  it('TC-17: metric < 0 returns Err mentioning the metric key', () => {
    const result = svc.computeHolat(makeMetrics({ production_plan: -1 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('production_plan');
  });

  // -------------------------------------------------------------------------
  // TC-18 to TC-20: Bad weight sum → Err
  // -------------------------------------------------------------------------

  it('TC-18: weights summing to 0.9 (not 1.0) returns Err mentioning sum', () => {
    const badWeights: WeightMap = {
      cash_flow:       0.20,
      production_plan: 0.20,
      orders:          0.20,
      hr:              0.15,
      quality:         0.15,
      // sum = 0.90
    };
    const result = svc.computeHolat(makeMetrics(), { weights: badWeights });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('sum');
  });

  it('TC-19: weights summing to 1.1 returns Err', () => {
    const badWeights: WeightMap = {
      cash_flow:       0.30,
      production_plan: 0.30,
      orders:          0.20,
      hr:              0.15,
      quality:         0.15,
      // sum = 1.10
    };
    const result = svc.computeHolat(makeMetrics(), { weights: badWeights });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('TC-20: negative weight returns Err mentioning the key', () => {
    const badWeights: WeightMap = {
      cash_flow:       0.50,
      production_plan: 0.30,
      orders:          0.30,
      hr:              0.00,
      quality:         -0.10, // negative
    };
    const result = svc.computeHolat(makeMetrics(), { weights: badWeights });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('quality');
  });

  // -------------------------------------------------------------------------
  // TC-21: Non-descending thresholds → Err
  // -------------------------------------------------------------------------

  it('TC-21: thresholds not strictly descending returns Err mentioning descending', () => {
    const badThresholds: ThresholdMap = {
      OSISH:   85,
      NORMAL:  85, // equal to OSISH — not strictly less
      EHTIYOT: 45,
      XAVF:    25,
      INQIROZ:  0,
    };
    const result = svc.computeHolat(makeMetrics(), { thresholds: badThresholds });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('descending');
  });

  // -------------------------------------------------------------------------
  // TC-22: Custom threshold override changes classification
  // -------------------------------------------------------------------------

  it('TC-22: lowered OSISH threshold (70) re-classifies score 74.5 as OSISH', () => {
    const raisedThresholds: ThresholdMap = {
      OSISH:   70,   // lowered from default 85
      NORMAL:  50,
      EHTIYOT: 30,
      XAVF:    15,
      INQIROZ:  0,
    };
    // TC-01 score = 74.5 → with default thresholds → NORMAL
    // with new thresholds (OSISH ≥ 70) → 74.5 >= 70 → OSISH
    const result = svc.computeHolat(makeMetrics(), { thresholds: raisedThresholds });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(74.5, 1);
    expect(result.data.level).toBe('OSISH');
  });

  // -------------------------------------------------------------------------
  // TC-23: INQIROZ (very low score)
  // -------------------------------------------------------------------------

  it('TC-23: very low metrics (all=10) → score 10, level INQIROZ', () => {
    const m = makeMetrics({ cash_flow: 10, production_plan: 10, orders: 10, hr: 10, quality: 10 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(10, 1);
    expect(result.data.level).toBe('INQIROZ');
  });

  // -------------------------------------------------------------------------
  // TC-24: Perfect score → OSISH
  // -------------------------------------------------------------------------

  it('TC-24: all metrics at 100 → score 100, level OSISH', () => {
    const m = makeMetrics({ cash_flow: 100, production_plan: 100, orders: 100, hr: 100, quality: 100 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(100, 1);
    expect(result.data.level).toBe('OSISH');
  });

  // -------------------------------------------------------------------------
  // TC-25: Zero scores → INQIROZ
  // -------------------------------------------------------------------------

  it('TC-25: all metrics at 0 → score 0, level INQIROZ', () => {
    const m = makeMetrics({ cash_flow: 0, production_plan: 0, orders: 0, hr: 0, quality: 0 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(0, 5);
    expect(result.data.level).toBe('INQIROZ');
  });

  // -------------------------------------------------------------------------
  // TC-26: Breakdown sum equals total score (floating-point consistency)
  // -------------------------------------------------------------------------

  it('TC-26: sum of breakdown weighted values equals total score within 0.01', () => {
    const result = svc.computeHolat(makeMetrics());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sumOfWeighted = Object.values(result.data.breakdown)
      .reduce((acc, d) => acc + d.weighted, 0);
    expect(Math.abs(sumOfWeighted - result.data.score)).toBeLessThan(0.01);
  });

  // -------------------------------------------------------------------------
  // TC-27: Both custom weights + custom thresholds simultaneously
  // -------------------------------------------------------------------------

  it('TC-27: custom weights AND custom thresholds both applied correctly', () => {
    const weights: WeightMap = {
      cash_flow:       0.40,
      production_plan: 0.30,
      orders:          0.15,
      hr:              0.10,
      quality:         0.05,
    };
    const thresholds: ThresholdMap = {
      OSISH:   90,
      NORMAL:  70,
      EHTIYOT: 50,
      XAVF:    30,
      INQIROZ:  0,
    };
    // All metrics = 80: score = 80 (weights sum to 1 × 80 = 80)
    // custom thresholds: NORMAL >= 70, OSISH >= 90 → 80 is NORMAL
    const m = makeMetrics({ cash_flow: 80, production_plan: 80, orders: 80, hr: 80, quality: 80 });
    const result = svc.computeHolat(m, { weights, thresholds });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(80, 1);
    expect(result.data.level).toBe('NORMAL');
  });

  // -------------------------------------------------------------------------
  // TC-28: XAVF band
  // -------------------------------------------------------------------------

  it('TC-28: score in XAVF band (30) → XAVF level', () => {
    // All metrics = 30 → score = 30 (≥25, <45) → XAVF
    const m = makeMetrics({ cash_flow: 30, production_plan: 30, orders: 30, hr: 30, quality: 30 });
    const result = svc.computeHolat(m);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBeCloseTo(30, 1);
    expect(result.data.level).toBe('XAVF');
  });
});
