/**
 * test/crm/mark-deal-won.handler.spec.ts
 *
 * Unit tests for MarkDealWonHandler. EventBus + IDealRepository are mocked;
 * a real Deal aggregate is mutated through markAsWon().
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';

import { MarkDealWonHandler, MarkDealWonCommand } from '../../src/modules/crm/application/commands/mark-deal-won.handler';
import { Deal } from '../../src/modules/crm/domain/aggregates/deal.aggregate';
import { DealStatus } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { Money } from '../../src/modules/shared/domain/value-objects/money.vo';
import { DealWonEvent } from '../../src/modules/crm/domain/events/deal-won.event';
import { Ok, Err, type Result } from '../../src/common/result';
import { dealFactory } from '../_fixtures/factories';
import { DEAL_REPO } from '../../src/modules/crm/domain/repositories/i-deal.repo';

interface RepoMock {
  findById: jest.Mock<Promise<Result<Deal | null>>, [number]>;
  update: jest.Mock<Promise<Result<void>>, [Deal]>;
  save: jest.Mock;
  findByLeadId: jest.Mock;
  findByCompanyId: jest.Mock;
  findByStatus: jest.Mock;
  delete: jest.Mock;
  countByStatus: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(Ok(undefined)),
    save: jest.fn(),
    findByLeadId: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
  };
}

function makeDeal(status: 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'): Deal {
  const f = dealFactory();
  const s = DealStatus.create(status);
  if (!s.ok) throw new Error('bad status');
  const moneyR = Money.of(f.amount, 'UZS');
  if (!moneyR.ok) throw new Error('bad amount');
  return Deal.create({
    leadId: f.leadId,
    companyId: f.companyId,
    dealNumber: `D-${f.id}`,
    status: s.data,
    totalAmount: moneyR.data,
    currency: 'UZS',
    assignedTo: 3,
    createdBy: 1,
    expectedClosureDate: f.expectedCloseDate,
  });
}

describe('MarkDealWonHandler', () => {
  let handler: MarkDealWonHandler;
  let repo: RepoMock;
  let eventBus: EventBus;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkDealWonHandler,
        { provide: DEAL_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = module.get(MarkDealWonHandler);
    eventBus = module.get(EventBus);
    publishSpy = jest.spyOn(eventBus, 'publish');
  });

  it('returns NOT_FOUND when deal does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new MarkDealWonCommand(123));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns VALIDATION when deal cannot transition to won', async () => {
    repo.findById.mockResolvedValue(Ok(makeDeal('qualification')));

    const r = await handler.execute(new MarkDealWonCommand(1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns Err when repo.update fails after status transition', async () => {
    repo.findById.mockResolvedValue(Ok(makeDeal('negotiation')));
    repo.update.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new MarkDealWonCommand(1));

    expect(r.ok).toBe(false);
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and publishes DealWonEvent when transition succeeds', async () => {
    const deal = makeDeal('proposal');
    repo.findById.mockResolvedValue(Ok(deal));

    const r = await handler.execute(new MarkDealWonCommand(1));

    expect(r.ok).toBe(true);
    expect(deal.getStatus()).toBe('won');
    expect(publishSpy).toHaveBeenCalledTimes(1);
    const ev = publishSpy.mock.calls[0][0] as DealWonEvent;
    expect(ev).toBeInstanceOf(DealWonEvent);
    expect(ev.companyId).toBe(deal.getCompanyId());
    expect(ev.totalAmount).toBe(deal.getTotalAmount());
  });
});
