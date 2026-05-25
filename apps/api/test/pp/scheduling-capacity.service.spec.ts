/**
 * test/pp/scheduling-capacity.service.spec.ts
 *
 * TZ-16 TOC bottleneck detection. ρ = λ/μ, bottleneck = argmax ρ.
 * Pure compute — no DB.
 *
 * NOTE: detectBottleneck is decorated with @Calculation → must be awaited.
 */

import { SchedulingCapacityService } from '../../src/modules/pp/domain/services/scheduling-capacity.service';

describe('SchedulingCapacityService.detectBottleneck', () => {
  const svc = new SchedulingCapacityService();

  it('flags the highest-utilisation work centre as the bottleneck', async () => {
    const r = await svc.detectBottleneck([
      { workCenterId: 'WC-A', arrivalRate: 5, serviceRate: 10 },
      { workCenterId: 'WC-B', arrivalRate: 9, serviceRate: 10 },
      { workCenterId: 'WC-C', arrivalRate: 7, serviceRate: 10 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.bottleneck).toBe('WC-B');
    expect(r.data.utilization).toBeCloseTo(0.9, 4);
  });

  it('sorts allWorkCenters by utilisation descending', async () => {
    const r = await svc.detectBottleneck([
      { workCenterId: 'X', arrivalRate: 3, serviceRate: 10 },
      { workCenterId: 'Y', arrivalRate: 8, serviceRate: 10 },
      { workCenterId: 'Z', arrivalRate: 6, serviceRate: 10 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const utils = r.data.allWorkCenters.map(w => w.utilization);
    for (let i = 1; i < utils.length; i++) {
      expect(utils[i]).toBeLessThanOrEqual(utils[i - 1]);
    }
  });

  it('computes throughputIndex = 1 / bottleneck utilisation', async () => {
    const r = await svc.detectBottleneck([
      { workCenterId: 'A', arrivalRate: 5, serviceRate: 10 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.throughputIndex).toBeCloseTo(1 / 0.5, 4);
  });

  it('rejects an empty work-centre list', async () => {
    const r = await svc.detectBottleneck([]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });

  it('rejects a non-positive service rate (would divide by zero)', async () => {
    const r = await svc.detectBottleneck([
      { workCenterId: 'BAD', arrivalRate: 1, serviceRate: 0 },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });
});
