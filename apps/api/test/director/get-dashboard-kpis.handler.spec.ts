/**
 * test/director/get-dashboard-kpis.handler.spec.ts
 *
 * Unit tests for GetDashboardKpisHandler. `@shared/db` is mocked so we can
 * stub each KPI's raw-SQL counter/sum independently. IApprovalRepo is also
 * mocked for the pending-approvals total and stats block.
 */

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardKpisHandler } from '../../src/modules/director/application/queries/get-dashboard-kpis.handler';
import { GetDashboardKpisQuery } from '../../src/modules/director/application/queries/get-dashboard-kpis.query';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { Ok } from '../../src/common/result';

interface RepoMock {
  findPending: jest.Mock; getStats: jest.Mock;
  findById: jest.Mock; findHistory: jest.Mock; findExistingPending: jest.Mock; save: jest.Mock; update: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findPending: jest.fn().mockResolvedValue(Ok({ items: [], total: 0 })),
    getStats: jest.fn().mockResolvedValue(Ok({
      pending: 0, approvedToday: 0, rejectedToday: 0, avgApprovalTimeHours: 0,
    })),
    findById: jest.fn(), findHistory: jest.fn(), findExistingPending: jest.fn(),
    save: jest.fn(), update: jest.fn(),
  };
}

describe('GetDashboardKpisHandler', () => {
  let handler: GetDashboardKpisHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDashboardKpisHandler,
        { provide: APPROVAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetDashboardKpisHandler);
    const { runQuery } = jest.requireMock('@shared/db');
    (runQuery as jest.Mock).mockReset();
    (runQuery as jest.Mock).mockResolvedValue({ rows: [{ count: '0', total: '0', pass_rate: '0' }] });
  });

  it('returns Ok with zeroed KPIs when all underlying counters are empty', async () => {
    const r = await handler.execute(new GetDashboardKpisQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.salesOrders).toBe(0);
      expect(r.data.revenue).toBe(0);
      expect(r.data.pendingApprovals).toBe(0);
    }
  });

  it('aggregates pendingApprovals from approvalRepo.findPending.total', async () => {
    repo.findPending.mockResolvedValue(Ok({ items: [], total: 17 }));

    const r = await handler.execute(new GetDashboardKpisQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pendingApprovals).toBe(17);
  });

  it('parses raw-SQL counts into numeric KPIs', async () => {
    const { runQuery } = jest.requireMock('@shared/db');
    let call = 0;
    (runQuery as jest.Mock).mockImplementation(async () => {
      call += 1;
      // Order in handler: salesOrders, revenue, activeProduction, qcPassRate, lowStock
      const rows = [
        [{ count: '42' }],       // salesOrders
        [{ total: '5000000' }],  // revenue
        [{ count: '3' }],        // activeProduction
        [{ pass_rate: '97.5' }], // qcPassRate
        [{ count: '8' }],        // lowStock
      ];
      return { rows: rows[call - 1] ?? [{}] };
    });

    const r = await handler.execute(new GetDashboardKpisQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.salesOrders).toBe(42);
      expect(r.data.revenue).toBe(5_000_000);
      expect(r.data.activeProduction).toBe(3);
      expect(r.data.qcPassRate).toBeCloseTo(97.5);
      expect(r.data.lowStockCount).toBe(8);
    }
  });

  it('attaches approval stats block when getStats succeeds', async () => {
    repo.getStats.mockResolvedValue(Ok({
      pending: 4, approvedToday: 9, rejectedToday: 1, avgApprovalTimeHours: 12.5,
    }));

    const r = await handler.execute(new GetDashboardKpisQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.stats).toEqual({
        pending: 4, approvedToday: 9, rejectedToday: 1, avgApprovalTimeHours: 12.5,
      });
    }
  });

  it('stamps a generatedAt timestamp on the response', async () => {
    const r = await handler.execute(new GetDashboardKpisQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.generatedAt).toBeInstanceOf(Date);
  });
});
