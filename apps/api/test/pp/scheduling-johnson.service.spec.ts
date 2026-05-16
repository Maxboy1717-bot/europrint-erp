/**
 * test/pp/scheduling-johnson.service.spec.ts
 *
 * TZ-13 Johnson's rule for 2-machine flowshop. Pure compute.
 *   min(t1,t2) on M1 → goes to front of order
 *   min(t1,t2) on M2 → goes to back of order
 *   makespan derived by walking M1/M2 with the constraint M2 cannot start until M1 finishes.
 */

import { SchedulingJohnsonService } from '../../src/modules/pp/domain/services/scheduling-johnson.service';

describe('SchedulingJohnsonService', () => {
  const svc = new SchedulingJohnsonService();

  it('returns empty result for an empty job list', () => {
    const r = svc.johnsonRule([]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.order).toEqual([]);
    expect(r.data.makespan).toBe(0);
    expect(r.data.machine1Timeline).toEqual([]);
    expect(r.data.machine2Timeline).toEqual([]);
  });

  it('places fast-on-M1 jobs at the front and fast-on-M2 jobs at the back', () => {
    const r = svc.johnsonRule([
      { id: 'A', t1: 1, t2: 9 }, // min on M1 → front
      { id: 'B', t1: 9, t2: 1 }, // min on M2 → back
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.order[0]).toBe('A');
    expect(r.data.order[1]).toBe('B');
  });

  it('computes makespan = t1 + t2 for a single job', () => {
    const r = svc.johnsonRule([{ id: 'only', t1: 3, t2: 4 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.makespan).toBe(7);
    expect(r.data.machine1Timeline[0]).toEqual({ jobId: 'only', start: 0, end: 3 });
    expect(r.data.machine2Timeline[0]).toEqual({ jobId: 'only', start: 3, end: 7 });
  });

  it('rejects jobs with negative processing times', () => {
    const r = svc.johnsonRule([{ id: 'bad', t1: -1, t2: 2 }]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });

  it('produces a non-decreasing M2 timeline (M2 waits for M1)', () => {
    const r = svc.johnsonRule([
      { id: 'J1', t1: 3, t2: 2 },
      { id: 'J2', t1: 2, t2: 6 },
      { id: 'J3', t1: 5, t2: 4 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m2 = r.data.machine2Timeline;
    for (let i = 1; i < m2.length; i++) {
      expect(m2[i].start).toBeGreaterThanOrEqual(m2[i - 1].end);
    }
    // M2 of first scheduled job cannot start before its M1 finishes
    expect(m2[0].start).toBe(r.data.machine1Timeline[0].end);
  });

  it('keeps the order length identical to input job count', () => {
    const jobs = [
      { id: 'A', t1: 2, t2: 8 },
      { id: 'B', t1: 6, t2: 3 },
      { id: 'C', t1: 4, t2: 5 },
      { id: 'D', t1: 9, t2: 7 },
    ];
    const r = svc.johnsonRule(jobs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.order).toHaveLength(jobs.length);
    expect(new Set(r.data.order)).toEqual(new Set(jobs.map(j => j.id)));
  });
});
