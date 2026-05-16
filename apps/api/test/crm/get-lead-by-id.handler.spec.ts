/**
 * test/crm/get-lead-by-id.handler.spec.ts
 *
 * Unit tests for GetLeadByIdHandler. ILeadRepository is mocked; real Lead
 * aggregate (constructed via Lead.create) is returned from findById.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetLeadByIdHandler, GetLeadByIdQuery } from '../../src/modules/crm/application/queries/get-lead-by-id.handler';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { leadFactory } from '../_fixtures/factories';
import { LEAD_REPO } from '../../src/modules/crm/domain/repositories/i-lead.repo';

interface RepoMock {
  findById: jest.Mock<Promise<Result<Lead | null>>, [number]>;
  save: jest.Mock; findByEmail: jest.Mock; findByCompanyId: jest.Mock; findByStatus: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    save: jest.fn(), findByEmail: jest.fn(), findByCompanyId: jest.fn(),
    findByStatus: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(),
  };
}

function makeLead(companyId = 7, score = 72): Lead {
  const f = leadFactory({ companyId });
  const s = LeadStatus.create('qualified');
  const ai = AIScore.create(score);
  if (!s.ok || !ai.ok) throw new Error('setup');
  return Lead.create({
    companyId: f.companyId, firstName: f.firstName, lastName: f.lastName,
    email: f.email, phone: f.phone, status: s.data, aiScore: ai.data,
    createdBy: f.createdBy, source: f.source,
  });
}

describe('GetLeadByIdHandler', () => {
  let handler: GetLeadByIdHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLeadByIdHandler,
        { provide: LEAD_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetLeadByIdHandler);
  });

  it('returns NOT_FOUND when repo returns Err', async () => {
    repo.findById.mockResolvedValue(Err('boom'));

    const r = await handler.execute(new GetLeadByIdQuery(1));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns NOT_FOUND when repo returns Ok(null)', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new GetLeadByIdQuery(1));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Ok with a flat DTO when lead exists', async () => {
    repo.findById.mockResolvedValue(Ok(makeLead(7, 72)));

    const r = await handler.execute(new GetLeadByIdQuery(1));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe('qualified');
      expect(r.data.aiScore).toBe(72);
      expect(r.data.companyId).toBe(7);
    }
  });

  it('passes the requested id through to the repository', async () => {
    repo.findById.mockResolvedValue(Ok(makeLead()));

    await handler.execute(new GetLeadByIdQuery(424242));

    expect(repo.findById).toHaveBeenCalledWith(424242);
    expect(repo.findById).toHaveBeenCalledTimes(1);
  });
});
