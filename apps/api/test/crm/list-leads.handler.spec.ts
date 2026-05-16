/**
 * test/crm/list-leads.handler.spec.ts
 *
 * Unit tests for ListLeadsHandler. ILeadRepository is mocked; the handler
 * branches on status presence to choose findByStatus vs findByCompanyId.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ListLeadsHandler, ListLeadsQuery } from '../../src/modules/crm/application/queries/list-leads.handler';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { leadFactory, many } from '../_fixtures/factories';
import { LEAD_REPO } from '../../src/modules/crm/domain/repositories/i-lead.repo';

interface RepoMock {
  findByCompanyId: jest.Mock<Promise<Result<Lead[]>>, [number, number, number]>;
  findByStatus: jest.Mock<Promise<Result<Lead[]>>, [string, number, number]>;
  count: jest.Mock<Promise<Result<number>>, []>;
  save: jest.Mock; findById: jest.Mock; findByEmail: jest.Mock; update: jest.Mock; delete: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findByCompanyId: jest.fn(), findByStatus: jest.fn(), count: jest.fn(),
    save: jest.fn(), findById: jest.fn(), findByEmail: jest.fn(), update: jest.fn(), delete: jest.fn(),
  };
}

function makeLead(): Lead {
  const f = leadFactory();
  const s = LeadStatus.create('new');
  const ai = AIScore.create(50);
  if (!s.ok || !ai.ok) throw new Error('setup');
  return Lead.create({
    companyId: f.companyId, firstName: f.firstName, lastName: f.lastName,
    email: f.email, phone: f.phone, status: s.data, aiScore: ai.data,
    createdBy: f.createdBy, source: f.source,
  });
}

describe('ListLeadsHandler', () => {
  let handler: ListLeadsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListLeadsHandler,
        { provide: LEAD_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(ListLeadsHandler);
  });

  it('returns INTERNAL when underlying repo call errors', async () => {
    repo.findByCompanyId.mockResolvedValue(Err('db gone'));
    repo.count.mockResolvedValue(Ok(0));

    const r = await handler.execute(new ListLeadsQuery(7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
  });

  it('uses findByCompanyId when no status filter is supplied', async () => {
    repo.findByCompanyId.mockResolvedValue(Ok([]));
    repo.count.mockResolvedValue(Ok(0));

    await handler.execute(new ListLeadsQuery(7, 25, 5));

    expect(repo.findByCompanyId).toHaveBeenCalledWith(7, 25, 5);
    expect(repo.findByStatus).not.toHaveBeenCalled();
  });

  it('uses findByStatus when status filter is supplied', async () => {
    repo.findByStatus.mockResolvedValue(Ok([]));
    repo.count.mockResolvedValue(Ok(0));

    await handler.execute(new ListLeadsQuery(7, 25, 5, 'qualified'));

    expect(repo.findByStatus).toHaveBeenCalledWith('qualified', 25, 5);
    expect(repo.findByCompanyId).not.toHaveBeenCalled();
  });

  it('returns Ok with data + pagination total from count()', async () => {
    const leads = many(makeLead, 3);
    repo.findByCompanyId.mockResolvedValue(Ok(leads));
    repo.count.mockResolvedValue(Ok(57));

    const r = await handler.execute(new ListLeadsQuery(7, 10, 0));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.data).toHaveLength(3);
      expect(r.data.pagination.total).toBe(57);
      expect(r.data.pagination.limit).toBe(10);
      expect(r.data.pagination.offset).toBe(0);
    }
  });

  it('treats failing count() as total=0 but still returns Ok', async () => {
    repo.findByCompanyId.mockResolvedValue(Ok([]));
    repo.count.mockResolvedValue(Err('boom'));

    const r = await handler.execute(new ListLeadsQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pagination.total).toBe(0);
  });
});
