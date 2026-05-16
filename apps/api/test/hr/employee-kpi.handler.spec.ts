/**
 * test/hr/employee-kpi.handler.spec.ts
 *
 * Unit tests for EmployeeKpiHandler. HrRepository.getFeedbackByPeriod is
 * mocked; the real KpiService is used so the formula is exercised end-to-end.
 */

import {
  EmployeeKpiHandler,
  EmployeeKpiQuery,
} from '../../src/modules/hr/application/queries/employee-kpi.handler';
import { KpiService } from '../../src/modules/hr/domain/services/kpi.service';
import type { HrRepository } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr.repo';

interface FbRow { quantity: number; defectRate: number; oee: number; recordedAt: Date }

function makeRepo(rows: FbRow[] | null): jest.Mocked<HrRepository> {
  return {
    getFeedbackByPeriod: jest.fn().mockResolvedValue(rows),
  } as unknown as jest.Mocked<HrRepository>;
}

const PERIOD_START = new Date('2026-06-01');
const PERIOD_END = new Date('2026-06-30');

describe('EmployeeKpiHandler', () => {
  it('returns Err when no feedback data is available for the period', async () => {
    const repo = makeRepo([]);
    const handler = new EmployeeKpiHandler(repo, new KpiService());

    const r = await handler.execute(new EmployeeKpiQuery(42, PERIOD_START, PERIOD_END));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/No feedback/i);
  });

  it('returns Err when repo yields null feedback list', async () => {
    const repo = makeRepo(null);
    const handler = new EmployeeKpiHandler(repo, new KpiService());

    const r = await handler.execute(new EmployeeKpiQuery(42, PERIOD_START, PERIOD_END));

    expect(r.ok).toBe(false);
  });

  it('computes KPI metrics from a single feedback row matching the target', async () => {
    // target 5000, actual 5000 → achievement = 100, quality (defect=0) = 100
    const repo = makeRepo([
      { quantity: 5000, defectRate: 0, oee: 80, recordedAt: PERIOD_START },
    ]);
    const handler = new EmployeeKpiHandler(repo, new KpiService());

    const r = await handler.execute(new EmployeeKpiQuery(42, PERIOD_START, PERIOD_END));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.metrics.achievement).toBeCloseTo(100, 5);
      expect(r.data.metrics.quality).toBeCloseTo(100, 5);
      expect(r.data.metrics.oee).toBeCloseTo(80, 5);
    }
  });

  it('averages defectRate and OEE across multiple feedback rows', async () => {
    const repo = makeRepo([
      { quantity: 2000, defectRate: 2, oee: 70, recordedAt: PERIOD_START },
      { quantity: 3000, defectRate: 4, oee: 90, recordedAt: PERIOD_END },
    ]);
    const handler = new EmployeeKpiHandler(repo, new KpiService());

    const r = await handler.execute(new EmployeeKpiQuery(42, PERIOD_START, PERIOD_END));

    expect(r.ok).toBe(true);
    if (r.ok) {
      // avg defect = 3%, avg oee = 80
      expect(r.data.metrics.oee).toBeCloseTo(80, 5);
      // quality = (1 - 3/100)*100 = 97
      expect(r.data.metrics.quality).toBeCloseTo(97, 5);
    }
  });

  it('returns a stable trend when only a single datapoint is supplied', async () => {
    const repo = makeRepo([
      { quantity: 4500, defectRate: 1, oee: 75, recordedAt: PERIOD_START },
    ]);
    const handler = new EmployeeKpiHandler(repo, new KpiService());

    const r = await handler.execute(new EmployeeKpiQuery(42, PERIOD_START, PERIOD_END));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.trend).toBe('stable');
  });
});
