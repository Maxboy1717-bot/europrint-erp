/**
 * test/crm/create-deal.handler.spec.ts
 *
 * Unit tests for CreateDealHandler. The IDealRepository is mocked; the Deal
 * aggregate and Money/DealStatus VOs are exercised for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CreateDealHandler, CreateDealCommand } from '../../src/modules/crm/application/commands/create-deal.handler';
import { Deal } from '../../src/modules/crm/domain/aggregates/deal.aggregate';
import { DealStatus } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { Money } from '../../src/modules/shared/domain/value-objects/money.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { dealFactory } from '../_fixtures/factories';
import { DEAL_REPO } from '../../src/modules/crm/domain/repositories/i-deal.repo';

interface RepoMock {
  save: jest.Mock<Promise<Result<Deal>>, [Deal]>;
  findById: jest.Mock;
  findByLeadId: jest.Mock;
  findByCompanyId: jest.Mock;
  findByStatus: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  countByStatus: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findByLeadId: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
  };
}

function makeDeal(): Deal {
  const f = dealFactory();
  const status = DealStatus.create('qualification');
  if (!status.ok) throw new Error('test setup failed');
  return Deal.create({
    leadId: f.leadId,
    companyId: f.companyId,
    dealNumber: `DEAL-${f.id}`,
    status: status.data,
    totalAmount: Money.of(f.amount, 'UZS'),
    currency: 'UZS',
    assignedTo: 1,
    createdBy: 1,
    expectedClosureDate: f.expectedCloseDate,
  });
}

function makeCmd(over: Partial<{ totalAmount: number; currency: string }> = {}): CreateDealCommand {
  return new CreateDealCommand(
    7, 11,
    over.totalAmount ?? 5_000_000,
    over.currency ?? 'UZS',
    new Date('2026-12-31'),
    3, 1, 'note',
  );
}

describe('CreateDealHandler', () => {
  let handler: CreateDealHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDealHandler,
        { provide: DEAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(CreateDealHandler);
  });

  it('returns VALIDATION when totalAmount is negative', async () => {
    const r = await handler.execute(makeCmd({ totalAmount: -1 }));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('VALIDATION');
      expect(r.error.message).toMatch(/invalid deal amount/i);
    }
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns INTERNAL when repo save fails', async () => {
    repo.save.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('INTERNAL');
      expect(r.error.message).toMatch(/save/i);
    }
  });

  it('returns Ok with the persisted deal when save succeeds', async () => {
    const persisted = makeDeal();
    repo.save.mockResolvedValue(Ok(persisted));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(persisted);
  });

  it('saves a Deal in qualification status with money matching the command', async () => {
    repo.save.mockImplementation(async (d) => Ok(d));

    const r = await handler.execute(makeCmd({ totalAmount: 9_000_000 }));

    expect(r.ok).toBe(true);
    const passed = repo.save.mock.calls[0][0];
    expect(passed.getStatus()).toBe('qualification');
    expect(passed.getTotalAmount()).toBe(9_000_000);
    expect(passed.getCompanyId()).toBe(7);
    expect(passed.getLeadId()).toBe(11);
  });
});
