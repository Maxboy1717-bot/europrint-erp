/**
 * test/crm/create-lead.handler.spec.ts
 *
 * Unit tests for CreateLeadHandler. Repository is mocked; real Lead aggregate
 * + AIScore / LeadStatus value objects are constructed inside the handler.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CreateLeadHandler, CreateLeadCommand } from '../../src/modules/crm/application/commands/create-lead.handler';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { leadFactory } from '../_fixtures/factories';
import { LEAD_REPO } from '../../src/modules/crm/domain/repositories/i-lead.repo';

interface RepoMock {
  save: jest.Mock<Promise<Result<Lead>>, [Lead]>;
  findByEmail: jest.Mock<Promise<Result<Lead | null>>, [string]>;
  findById: jest.Mock;
  findByCompanyId: jest.Mock;
  findByStatus: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    save: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(Ok(null)),
    findById: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

function makeLead(): Lead {
  const f = leadFactory({ companyId: 7, status: 'new' });
  const aiScore = AIScore.create(55);
  const status = LeadStatus.create('new');
  if (!aiScore.ok || !status.ok) throw new Error('test setup failed');
  return Lead.create({
    companyId: f.companyId,
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email,
    phone: f.phone,
    status: status.data,
    aiScore: aiScore.data,
    createdBy: f.createdBy,
    source: f.source,
  });
}

function makeCmd(): CreateLeadCommand {
  const f = leadFactory();
  return new CreateLeadCommand(f.companyId, f.firstName, f.lastName, f.email, f.phone, f.source, f.createdBy);
}

describe('CreateLeadHandler', () => {
  let handler: CreateLeadHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLeadHandler,
        { provide: LEAD_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(CreateLeadHandler);
  });

  it('returns Err when lead with same email exists', async () => {
    repo.findByEmail.mockResolvedValue(Ok(makeLead()));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/already exists/i);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns Err when repo save fails', async () => {
    repo.save.mockResolvedValue(Err('db down'));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/save/i);
  });

  it('returns Ok with persisted lead when email is free and save succeeds', async () => {
    const persisted = makeLead();
    repo.save.mockResolvedValue(Ok(persisted));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(persisted);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('passes a Lead built from command fields when saving', async () => {
    const cmd = new CreateLeadCommand(11, 'Ali', 'Karimov', 'ali@x.uz', '+998901234567', 'website', 99, 'note');
    repo.save.mockImplementation(async (l) => Ok(l));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.getEmail()).toBe('ali@x.uz');
    expect(saved.getCompanyId()).toBe(11);
    expect(saved.getStatus()).toBe('new');
    expect(saved.getCreatedBy()).toBe(99);
  });

  it('skips findByEmail Err branch and still attempts save when lookup errors', async () => {
    repo.findByEmail.mockResolvedValue(Err('lookup failed'));
    repo.save.mockResolvedValue(Ok(makeLead()));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
