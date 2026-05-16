/**
 * test/pp/pp-crp.service.spec.ts
 *
 * PpCrpService — capacity-requirements rollup over a 4-week horizon.
 * Uses @shared/db.runQuery to load work-centres, routings and planned
 * orders, then computes utilisation% per work centre.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { PpCrpService } from '../../src/modules/pp/application/services/pp-crp.service';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.Mock;

function queueQueries(workCenters: unknown[], ops: unknown[], planned: unknown[]): void {
  mockRun
    .mockResolvedValueOnce({ rows: workCenters })
    .mockResolvedValueOnce({ rows: ops })
    .mockResolvedValueOnce({ rows: planned });
}

describe('PpCrpService.getCrp', () => {
  let svc: PpCrpService;

  beforeEach(() => {
    mockRun.mockReset();
    svc = new PpCrpService();
  });

  it('returns Ok with an empty rows array when no work centres exist', async () => {
    queueQueries([], [], []);
    const r = await svc.getCrp();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual([]);
  });

  it('computes utilizationPct=0 when no planned orders touch the work centre', async () => {
    queueQueries(
      [{ id: '1', name: 'WC1', machine_count: 1, hours_per_day: 8, efficiency_rate: 0.85, utilization_factor: 1 }],
      [],
      [],
    );
    const r = await svc.getCrp();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toHaveLength(1);
    expect(r.data[0].utilizationPct).toBe(0);
    expect(r.data[0].isBottleneck).toBe(false);
    expect(r.data[0].isOverloaded).toBe(false);
  });

  it('marks the single highest-utilisation centre as bottleneck once it crosses the warning threshold', async () => {
    // 1 machine × 8h × 20 working days × 0.85 efficiency × 1 = 136 hours available.
    // Required minutes: 60 setup + 1 min/unit × 8000 = 8060 min ≈ 134.3h → ~98.8% utilisation.
    queueQueries(
      [{ id: '1', name: 'HOT_WC', machine_count: 1, hours_per_day: 8, efficiency_rate: 0.85, utilization_factor: 1 }],
      [{ product_id: 'P1', work_center_id: '1', setup_time_min: 60, run_time_per_unit_min: 1 }],
      [{ product_id: 'P1', qty: 8000 }],
    );
    const r = await svc.getCrp();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data[0].utilizationPct).toBeGreaterThan(85);
    expect(r.data[0].isBottleneck).toBe(true);
  });

  it('flags isOverloaded when utilisation ≥ 100%', async () => {
    queueQueries(
      [{ id: '1', name: 'OVER_WC', machine_count: 1, hours_per_day: 1, efficiency_rate: 1, utilization_factor: 1 }],
      [{ product_id: 'P', work_center_id: '1', setup_time_min: 0, run_time_per_unit_min: 60 }],
      [{ product_id: 'P', qty: 100 }],
    );
    const r = await svc.getCrp();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data[0].isOverloaded).toBe(true);
  });

  it('returns Err with INTERNAL when the work-centres query throws', async () => {
    mockRun.mockRejectedValueOnce(new Error('db down'));
    const r = await svc.getCrp();
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INTERNAL');
    expect(r.error.message).toContain('db down');
  });
});
