/**
 * crm-extras.service.spec.ts
 *
 * Unit tests for CrmExtrasService. CrmExtrasRepository is mocked; the
 * dashboard aggregation (parallel Promise.all + Record-flatten) runs for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmExtrasService } from '../../src/modules/crm/application/crm-extras.service';
import { CrmExtrasRepository } from '../../src/modules/crm/application/crm-extras.repository';
import { Ok } from '../../src/common/result';

type RepoMock = {
  listComments: jest.Mock;
  createComment: jest.Mock;
  getHistory: jest.Mock;
  getDashboardLeads: jest.Mock;
  getDashboardDeals: jest.Mock;
  getDashboardActivities: jest.Mock;
  getPipeline: jest.Mock;
  listTasks: jest.Mock;
  createTask: jest.Mock;
  listInvoices: jest.Mock;
  listProposals: jest.Mock;
  getLeadStages: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listComments: jest.fn(),
    createComment: jest.fn(),
    getHistory: jest.fn(),
    getDashboardLeads: jest.fn(),
    getDashboardDeals: jest.fn(),
    getDashboardActivities: jest.fn(),
    getPipeline: jest.fn(),
    listTasks: jest.fn(),
    createTask: jest.fn(),
    listInvoices: jest.fn(),
    listProposals: jest.fn(),
    getLeadStages: jest.fn(),
  };
}

describe('CrmExtrasService', () => {
  let svc: CrmExtrasService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmExtrasService,
        { provide: CrmExtrasRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmExtrasService);
  });

  it('returns dashboard merge when all repos succeed', async () => {
    repo.getDashboardLeads.mockResolvedValue([{ status: 'new', count: 5 }]);
    repo.getDashboardDeals.mockResolvedValue({ pipeline: 100000, total: 10 });
    repo.getDashboardActivities.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const r = await svc.getDashboard();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        pipeline_total: number;
        open_deals: number;
        today_activities: unknown[];
      };
      expect(data.pipeline_total).toBe(100000);
      expect(data.open_deals).toBe(10);
      expect(data.today_activities).toHaveLength(2);
    }
  });

  it('falls back to zero when dashboard deals row missing pipeline', async () => {
    repo.getDashboardLeads.mockResolvedValue([]);
    repo.getDashboardDeals.mockResolvedValue({});
    repo.getDashboardActivities.mockResolvedValue([]);
    const r = await svc.getDashboard();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { pipeline_total: number; open_deals: number };
      expect(data.pipeline_total).toBe(0);
      expect(data.open_deals).toBe(0);
    }
  });

  it('returns recommendation list when getNba called', async () => {
    const r = await svc.getNba('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        entity_type: string;
        entity_id: number;
        recommendations: Array<{ action: string; priority: number }>;
      };
      expect(data.entity_type).toBe('lead');
      expect(data.entity_id).toBe(7);
      expect(data.recommendations).toHaveLength(3);
      expect(data.recommendations[0].priority).toBe(1);
    }
  });

  it('forwards filter args to listComments repo', async () => {
    repo.listComments.mockResolvedValue(Ok([]));
    await svc.listComments(1, 2, 25, 10);
    expect(repo.listComments).toHaveBeenCalledWith(1, 2, 25, 10);
  });

  it('forwards body to createTask repository', async () => {
    repo.createTask.mockResolvedValue(Ok({ id: 1 }));
    await svc.createTask({ title: 'T' });
    expect(repo.createTask).toHaveBeenCalledWith({ title: 'T' });
  });

  it('forwards stage filter to getPipeline repository', async () => {
    repo.getPipeline.mockResolvedValue(Ok([]));
    await svc.getPipeline(42);
    expect(repo.getPipeline).toHaveBeenCalledWith(42);
  });

  it('returns history when getHistory succeeds', async () => {
    repo.getHistory.mockResolvedValue(Ok([{ id: 1, action: 'created' }]));
    const r = await svc.getHistory('lead', 7, 10, 0);
    expect(r.ok).toBe(true);
  });
});
