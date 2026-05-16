/**
 * test/pp/learning-curve.service.spec.ts
 *
 * Wright Learning Curve (TZ-D09). Pure math — no DB.
 *   T̄_n  = t1 × n^(log₂ rate)
 *   Calibrate: rate = 2^slope where slope = (ln t2 - ln t1) / (ln n2 - ln n1)
 */

import { LearningCurveService } from '../../src/modules/pp/domain/services/learning-curve.service';

describe('LearningCurveService', () => {
  const svc = new LearningCurveService();

  describe('calculate()', () => {
    it('produces avg-time curve descending at the 80% default rate', () => {
      const r = svc.calculate({ t1Minutes: 100, cumulativeUnits: 16 });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const points = r.data.points;
      // First checkpoint is unit 1 with avgTime = t1
      expect(points[0].n).toBe(1);
      expect(points[0].avgTimeMinutes).toBeCloseTo(100, 2);
      // At unit 2 with 80% rate: avg = 100 × 2^log2(0.8) = 80
      const at2 = points.find(p => p.n === 2);
      expect(at2?.avgTimeMinutes).toBeCloseTo(80, 2);
      // At unit 16: avg = 100 × 0.8^4 = 40.96
      const at16 = points.find(p => p.n === 16);
      expect(at16?.avgTimeMinutes).toBeCloseTo(40.96, 1);
    });

    it('respects a custom rate within bounds and exposes slope = log2(rate)', () => {
      const r = svc.calculate({ t1Minutes: 60, rate: 0.90, cumulativeUnits: 8 });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.rate).toBe(0.90);
      expect(r.data.slope).toBeCloseTo(Math.log2(0.90), 6);
    });

    it('rejects t1Minutes ≤ 0 with VALIDATION', () => {
      const r = svc.calculate({ t1Minutes: 0, cumulativeUnits: 10 });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects cumulativeUnits ≤ 0 with VALIDATION', () => {
      const r = svc.calculate({ t1Minutes: 50, cumulativeUnits: 0 });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects rate outside the [0.60, 1.00] envelope', () => {
      const low = svc.calculate({ t1Minutes: 50, rate: 0.50, cumulativeUnits: 10 });
      const high = svc.calculate({ t1Minutes: 50, rate: 1.10, cumulativeUnits: 10 });
      expect(low.ok).toBe(false);
      expect(high.ok).toBe(false);
    });

    it('ends the checkpoint series exactly at maxN (no overshoot)', () => {
      const r = svc.calculate({ t1Minutes: 30, cumulativeUnits: 47 });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const last = r.data.points[r.data.points.length - 1];
      expect(last.n).toBe(47);
    });
  });

  describe('calibrate()', () => {
    it('derives an 80% rate from t1=100 at n=1 and t2=80 at n=2', () => {
      const r = svc.calibrate(1, 100, 2, 80);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data).toBeCloseTo(0.80, 2);
    });

    it('rejects n1 ≥ n2 with VALIDATION', () => {
      const r = svc.calibrate(5, 100, 5, 80);
      expect(r.ok).toBe(false);
    });

    it('rejects non-positive times', () => {
      const r = svc.calibrate(1, 0, 2, 80);
      expect(r.ok).toBe(false);
    });

    it('rejects calibrated rate outside the [0.60, 1.00] band', () => {
      // t2 hugely smaller than t1 → very low rate → out of band
      const r = svc.calibrate(1, 100, 4, 1);
      expect(r.ok).toBe(false);
    });
  });
});
