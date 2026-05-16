/**
 * test/qc/defect-detector.service.spec.ts
 *
 * TZ-D11 p-chart with Western Electric rules. Pure compute.
 *   pBar  = Σ defects / Σ sampleSize  over a rolling 25-sample window
 *   sigma = sqrt(pBar (1 − pBar) / nBar)
 *   UCL   = pBar + 3σ ; LCL = max(0, pBar − 3σ)
 */

import { DefectDetectorService } from '../../src/modules/qc/domain/services/defect-detector.service';

describe('DefectDetectorService.computePChart', () => {
  const svc = new DefectDetectorService();

  it('rejects defects greater than sample size', async () => {
    const r = await svc.computePChart([], 50, 60);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('rejects non-positive sample size', async () => {
    const r = await svc.computePChart([], 0, 0);
    expect(r.ok).toBe(false);
  });

  it('computes pBar, UCL and LCL from rolling history', async () => {
    const history = Array.from({ length: 5 }, () => ({ sampleSize: 100, defects: 5 }));
    const r = await svc.computePChart(history, 100, 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Total defects = 5×6 = 30 (history + current); samples = 600; pBar = 0.05
    expect(r.data.pBar).toBeCloseTo(0.05, 4);
    expect(r.data.ucl).toBeGreaterThan(r.data.pBar);
    expect(r.data.lcl).toBeGreaterThanOrEqual(0);
  });

  it('floors LCL at zero (defect rates cannot be negative)', async () => {
    // very low pBar makes pBar - 3σ negative
    const history = Array.from({ length: 10 }, () => ({ sampleSize: 1000, defects: 1 }));
    const r = await svc.computePChart(history, 1000, 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lcl).toBe(0);
  });

  it('detects 3-sigma single point violation (RULE_1_3SIGMA)', async () => {
    const baseline = Array.from({ length: 20 }, () => ({ sampleSize: 100, defects: 5 }));
    // last point will be massively higher than the rest
    const r = await svc.computePChart(baseline, 100, 95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.violations).toContain('RULE_1_3SIGMA');
    expect(r.data.isOutOfControl).toBe(true);
  });

  it('flags a sustained run of 8 points on one side of the centerline (RULE_4_8_RUN)', async () => {
    // Build a history of 24 points where the last 8 are all above the average defect rate
    const lowHalf = Array.from({ length: 16 }, () => ({ sampleSize: 100, defects: 2 }));
    const highHalf = Array.from({ length: 8 }, () => ({ sampleSize: 100, defects: 6 }));
    const history = [...lowHalf, ...highHalf];
    const r = await svc.computePChart(history, 100, 6);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.violations.length).toBeGreaterThan(0);
  });

  it('reports currentP as defects / sampleSize independent of history', async () => {
    const r = await svc.computePChart([], 100, 4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.currentP).toBeCloseTo(0.04, 6);
  });
});
