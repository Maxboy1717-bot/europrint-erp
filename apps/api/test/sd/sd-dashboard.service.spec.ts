/**
 * sd-dashboard.service.spec.ts
 *
 * Unit tests for SdDashboardService. The repository is mocked; the service
 * runs its real aggregation logic (Promise.all + result merging).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdDashboardService } from '../../src/modules/sd/application/sd-dashboard.service';
import { SD_DASHBOARD_REPO } from '../../src/modules/sd/domain/repositories/i-sd-dashboard.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  getOverview: jest.Mock;
  getTopCustomers: jest.Mock;
  getPendingAdvanceOrders: jest.Mock;
  getPendingTechCheckpoints: jest.Mock;
  getQuotaStats: jest.Mock;
  getExtendedStats: jest.Mock;
  getLeadFunnelStats: jest.Mock;
  getDebitorStats: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    getOverview: jest.fn(),
    getTopCustomers: jest.fn(),
    getPendingAdvanceOrders: jest.fn(),
    getPendingTechCheckpoints: jest.fn(),
    getQuotaStats: jest.fn(),
    getExtendedStats: jest.fn().mockResolvedValue(Ok({})),
    getLeadFunnelStats: jest.fn().mockResolvedValue(Ok([])),
    getDebitorStats: jest.fn().mockResolvedValue(Ok({})),
  };
}

describe('SdDashboardService', () => {
  let svc: SdDashboardService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdDashboardService,
        { provide: SD_DASHBOARD_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(SdDashboardService);
  });

  it('merges stats and top_customers when both repositories succeed', async () => {
    repo.getOverview.mockResolvedValue(Ok({ total_orders: 50 }));
    repo.getTopCustomers.mockResolvedValue(Ok([{ id: 1, name: 'Acme' }]));
    const r = await svc.getOverview();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { stats: Record<string, number>; top_customers: unknown[] };
      expect(data.stats.total_orders).toBe(50);
      expect(data.top_customers).toHaveLength(1);
    }
  });

  it('falls back to empty containers when stats repo errors', async () => {
    repo.getOverview.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    repo.getTopCustomers.mockResolvedValue(Ok([{ id: 1 }]));
    const r = await svc.getOverview();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { stats: Record<string, unknown>; top_customers: unknown[] };
      expect(data.stats).toEqual({});
      expect(data.top_customers).toHaveLength(1);
    }
  });

  it('falls back to empty array when top customers repo errors', async () => {
    repo.getOverview.mockResolvedValue(Ok({ total: 1 }));
    repo.getTopCustomers.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.getOverview();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { top_customers: unknown[] };
      expect(data.top_customers).toEqual([]);
    }
  });

  it('returns manager actions totals when both queries succeed', async () => {
    repo.getPendingAdvanceOrders.mockResolvedValue(Ok([{ id: 1 }, { id: 2 }]));
    repo.getPendingTechCheckpoints.mockResolvedValue(Ok([{ id: 3 }]));
    const r = await svc.getManagerActions(5, 50);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        pending_advance: unknown[];
        tech_checkpoints: unknown[];
        total: number;
      };
      expect(data.pending_advance).toHaveLength(2);
      expect(data.tech_checkpoints).toHaveLength(1);
      expect(data.total).toBe(3);
    }
  });

  it('returns zero total when manager actions repos all error', async () => {
    repo.getPendingAdvanceOrders.mockResolvedValue(Err(AppErr('DB_ERROR', 'a')));
    repo.getPendingTechCheckpoints.mockResolvedValue(Err(AppErr('DB_ERROR', 'b')));
    const r = await svc.getManagerActions(null, 10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { total: number };
      expect(data.total).toBe(0);
    }
  });

  it('forwards getQuotaStats manager filter to repository', async () => {
    repo.getQuotaStats.mockResolvedValue(Ok({ quota: 100 }));
    await svc.getQuotaStats(7);
    expect(repo.getQuotaStats).toHaveBeenCalledWith(7);
  });
});
