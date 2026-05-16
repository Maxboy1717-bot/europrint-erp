/**
 * test/crm/crm-pipeline.handler.spec.ts
 *
 * Unit tests for CrmPipelineHandler. Lead repository is mocked; the handler
 * fans out one findByStatus call per pipeline stage and aggregates the
 * results into a summary.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmPipelineHandler, CrmPipelineQuery } from '../../src/modules/crm/application/queries/crm-pipeline.handler';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { leadFactory } from '../_fixtures/factories';
import { LEAD_REPO } from '../../src/modules/crm/domain/repositories/i-lead.repo';

interface LeadRepoMock {
  findByStatus: jest.Mock<Promise<Result<Lead[]>>, [string, number, number]>;
  save: jest.Mock; findById: jest.Mock; findByEmail: jest.Mock; findByCompanyId: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock;
}

function makeRepo(): LeadRepoMock {
  return {
    findByStatus: jest.fn(),
    save: jest.fn(), findById: jest.fn(), findByEmail: jest.fn(),
    findByCompanyId: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(),
  };
}

function makeLead(status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost'): Lead {
  const f = leadFactory();
  const s = LeadStatus.create(status);
  const ai = AIScore.create(50);
  if (!s.ok || !ai.ok) throw new Error('setup');
  return Lead.create({
    companyId: f.companyId, firstName: f.firstName, lastName: f.lastName,
    email: f.email, phone: f.phone, status: s.data, aiScore: ai.data,
    createdBy: f.createdBy, source: f.source,
  });
}

describe('CrmPipelineHandler', () => {
  let handler: CrmPipelineHandler;
  let repo: LeadRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmPipelineHandler,
        { provide: LEAD_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(CrmPipelineHandler);
  });

  it('returns empty pipeline buckets when no leads exist', async () => {
    repo.findByStatus.mockResolvedValue(Ok([]));

    const r = await handler.execute(new CrmPipelineQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const summary = r.data.summary as { total: number; converted: number; lost: number };
      expect(summary.total).toBe(0);
      expect(summary.converted).toBe(0);
    }
  });

  it('queries findByStatus once per pipeline stage', async () => {
    repo.findByStatus.mockResolvedValue(Ok([]));

    await handler.execute(new CrmPipelineQuery(7, 50));

    expect(repo.findByStatus).toHaveBeenCalledTimes(7);
    const statuses = repo.findByStatus.mock.calls.map((c) => c[0]);
    expect(statuses).toEqual(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost']);
  });

  it('passes the configured limit through to repo.findByStatus', async () => {
    repo.findByStatus.mockResolvedValue(Ok([]));

    await handler.execute(new CrmPipelineQuery(7, 250));

    expect(repo.findByStatus).toHaveBeenCalledWith('new', 250, 0);
  });

  it('aggregates per-status counts into a total summary', async () => {
    repo.findByStatus.mockImplementation(async (status) => {
      if (status === 'new') return Ok([makeLead('new'), makeLead('new')]);
      if (status === 'converted') return Ok([makeLead('converted')]);
      if (status === 'lost') return Ok([makeLead('lost'), makeLead('lost'), makeLead('lost')]);
      return Ok([]);
    });

    const r = await handler.execute(new CrmPipelineQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const summary = r.data.summary as { total: number; converted: number; lost: number };
      expect(summary.total).toBe(6);
      expect(summary.converted).toBe(1);
      expect(summary.lost).toBe(3);
    }
  });

  it('skips stages where repo returns Err but still completes', async () => {
    repo.findByStatus.mockImplementation(async (status) => (status === 'qualified' ? Err('db') : Ok([makeLead('new')])));

    const r = await handler.execute(new CrmPipelineQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const summary = r.data.summary as { total: number };
      expect(summary.total).toBe(6); // 7 stages - 1 erroring = 6
    }
  });
});
