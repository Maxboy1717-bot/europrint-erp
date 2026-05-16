/**
 * crm-auto-lead.service.spec.ts
 *
 * Unit tests for CrmAutoLeadService. The repository is mocked; the rescue-plan
 * builder (risk level / risk score / retention offer logic) runs for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmAutoLeadService } from '../../src/modules/crm/application/crm-auto-lead.service';
import { CrmAutoLeadRepository } from '../../src/modules/crm/application/crm-auto-lead.repository';
import { Ok } from '../../src/common/result';

type RepoMock = {
  findLeadScore: jest.Mock;
  findDeal: jest.Mock;
  getSupervisorDashboard: jest.Mock;
  getAutoLeadSources: jest.Mock;
  ingestCallLead: jest.Mock;
  ingestFormLead: jest.Mock;
  ingestTelegramLead: jest.Mock;
  ingestWebsiteLead: jest.Mock;
  getChurnRisk: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    findLeadScore: jest.fn(),
    findDeal: jest.fn(),
    getSupervisorDashboard: jest.fn(),
    getAutoLeadSources: jest.fn(),
    ingestCallLead: jest.fn(),
    ingestFormLead: jest.fn(),
    ingestTelegramLead: jest.fn(),
    ingestWebsiteLead: jest.fn(),
    getChurnRisk: jest.fn(),
  };
}

describe('CrmAutoLeadService', () => {
  let svc: CrmAutoLeadService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmAutoLeadService,
        { provide: CrmAutoLeadRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmAutoLeadService);
  });

  it('returns lead score envelope when quickScore called with lead', async () => {
    repo.findLeadScore.mockResolvedValue(Ok({ ai_score: 80, status: 'qualified' }));
    const r = await svc.quickScore('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { entity_type: string; id: number; score: number };
      expect(data.entity_type).toBe('lead');
      expect(data.score).toBe(80);
    }
  });

  it('returns null when quickScore lead missing', async () => {
    repo.findLeadScore.mockResolvedValue(Ok(null));
    const r = await svc.quickScore('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeNull();
  });

  it('returns deal score envelope when quickScore called with deal', async () => {
    repo.findDeal.mockResolvedValue(Ok({ status: 'open' }));
    const r = await svc.quickScore('deal', 9);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { entity_type: string; score: number };
      expect(data.entity_type).toBe('deal');
      expect(data.score).toBe(50);
    }
  });

  it('returns null when churnRescue source row missing', async () => {
    repo.getChurnRisk.mockResolvedValue(Ok(null));
    const r = await svc.churnRescue('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeNull();
  });

  it('builds high-risk rescue plan when lead is stale > 30 days', async () => {
    const oldDate = new Date(Date.now() - 45 * 86_400_000).toISOString();
    repo.getChurnRisk.mockResolvedValue(
      Ok({ updated_at: oldDate, status: 'stalled' }),
    );
    const r = await svc.churnRescue('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { riskLevel: string; retentionOffer: string | null };
      expect(data.riskLevel).toBe('yuqori');
      expect(data.retentionOffer).not.toBeNull();
    }
  });

  it('builds low-risk plan with no retention offer when fresh', async () => {
    const recent = new Date(Date.now() - 5 * 86_400_000).toISOString();
    repo.getChurnRisk.mockResolvedValue(Ok({ updated_at: recent, status: 'active' }));
    const r = await svc.churnRescue('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { riskLevel: string; retentionOffer: string | null };
      expect(data.riskLevel).toBe('past');
      expect(data.retentionOffer).toBeNull();
    }
  });

  it('forwards ingest call lead arguments verbatim', async () => {
    repo.ingestCallLead.mockResolvedValue(Ok({ id: 1 }));
    await svc.ingestCallLead('+998', 'A', 'B', 'note', { ip: '1' });
    expect(repo.ingestCallLead).toHaveBeenCalledWith('+998', 'A', 'B', 'note', { ip: '1' });
  });
});
