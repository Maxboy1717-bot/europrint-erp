/**
 * test/crm/crm-loss-reasons.spec.ts
 *
 * VISION-3340 #31 — loss-reason taxonomy.
 *  (a) MarkDealLostHandler persists lostReasonId → crm_deals.lost_reason_id when supplied,
 *      and OMITS the write (repo method never called) when it is not.
 *  (b) DrizzleCrmAnalyticsRepository.getLossReasonRollup groups lost deals by loss-reason,
 *      returns Result<T>, and is Array.isArray-guarded.
 *
 * `@shared/db` is mocked at module level (drizzle-db-mock kit) — no real DB. The handler
 * half uses a mocked IDealRepository (never touches @shared/db); the analytics half drives
 * the mocked `runQuery`.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';

import { MarkDealLostHandler, MarkDealLostCommand } from '../../src/modules/crm/application/commands/mark-deal-lost.handler';
import { Deal } from '../../src/modules/crm/domain/aggregates/deal.aggregate';
import { DealStatus } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { Money } from '../../src/modules/shared/domain/value-objects/money.vo';
import { DealLostEvent } from '../../src/modules/crm/domain/events/deal-lost.event';
import { Ok, Err, type Result } from '../../src/common/result';
import { dealFactory } from '../_fixtures/factories';
import { DEAL_REPO } from '../../src/modules/crm/domain/repositories/i-deal.repo';
import { DrizzleCrmAnalyticsRepository } from '../../src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo';
import type { LossReasonRollupRow } from '../../src/modules/crm/analytics/repositories/i-crm-analytics.repo';

interface RepoMock {
  findById: jest.Mock<Promise<Result<Deal | null>>, [number]>;
  update: jest.Mock<Promise<Result<void>>, [Deal]>;
  updateLostReasonId: jest.Mock<Promise<Result<void>>, [number, number]>;
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
    updateLostReasonId: jest.fn().mockResolvedValue(Ok(undefined)),
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

describe('VISION-3340 #31 — MarkDealLostHandler loss-reason taxonomy', () => {
  let handler: MarkDealLostHandler;
  let repo: RepoMock;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkDealLostHandler,
        { provide: DEAL_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = module.get(MarkDealLostHandler);
    publishSpy = jest.spyOn(module.get(EventBus), 'publish');
  });

  it('persists lostReasonId to crm_deals.lost_reason_id when supplied', async () => {
    const deal = makeDeal('proposal');
    repo.findById.mockResolvedValue(Ok(deal));

    const r = await handler.execute(new MarkDealLostCommand(42, 'Narx yuqori', 7));

    expect(r.ok).toBe(true);
    expect(deal.getStatus()).toBe('lost');
    // (a) taxonomy id persisted via the dedicated repo method
    expect(repo.updateLostReasonId).toHaveBeenCalledTimes(1);
    expect(repo.updateLostReasonId).toHaveBeenCalledWith(42, 7);
    // free-text reason still carried on the DealLostEvent (kept working)
    expect(publishSpy).toHaveBeenCalledTimes(1);
    const ev = publishSpy.mock.calls[0][0] as DealLostEvent;
    expect(ev).toBeInstanceOf(DealLostEvent);
    expect(ev.reason).toBe('Narx yuqori');
  });

  it('OMITS the lost_reason_id write when lostReasonId is not supplied', async () => {
    const deal = makeDeal('negotiation');
    repo.findById.mockResolvedValue(Ok(deal));

    const r = await handler.execute(new MarkDealLostCommand(42, 'Raqobatchiga ketdi'));

    expect(r.ok).toBe(true);
    expect(deal.getStatus()).toBe('lost');
    // (a) omitted → dedicated repo method never called
    expect(repo.updateLostReasonId).not.toHaveBeenCalled();
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it('returns INTERNAL and does not publish when the loss-reason write fails', async () => {
    const deal = makeDeal('proposal');
    repo.findById.mockResolvedValue(Ok(deal));
    repo.updateLostReasonId.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new MarkDealLostCommand(42, 'Narx', 3));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND (no reason write) when the deal does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new MarkDealLostCommand(999, 'Narx', 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.updateLostReasonId).not.toHaveBeenCalled();
  });
});

describe('VISION-3340 #31 — DrizzleCrmAnalyticsRepository.getLossReasonRollup', () => {
  let repo: DrizzleCrmAnalyticsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleCrmAnalyticsRepository();
  });

  it('(b) returns Ok with the lost-deal rollup grouped by loss reason', async () => {
    const rows: LossReasonRollupRow[] = [
      { lost_reason_id: 1, code: 'PRICE', label_uz: 'Narx yuqori', label_ru: 'Высокая цена', deal_count: 5 },
      { lost_reason_id: 2, code: 'TIMING', label_uz: 'Muddat', label_ru: 'Сроки', deal_count: 3 },
      { lost_reason_id: null, code: null, label_uz: null, label_ru: null, deal_count: 2 },
    ];
    kit.runQuery.mockResolvedValueOnce(rows);

    const r = await repo.getLossReasonRollup();

    expect(kit.runQuery).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(3);
      expect(r.data[0]).toEqual({ lost_reason_id: 1, code: 'PRICE', label_uz: 'Narx yuqori', label_ru: 'Высокая цена', deal_count: 5 });
      // NULL lost_reason_id (unspecified) is still counted via the LEFT JOIN
      expect(r.data[2].lost_reason_id).toBeNull();
      expect(r.data[2].deal_count).toBe(2);
    }
  });

  it('(b) Array.isArray-guards a non-array runQuery result → Ok([])', async () => {
    kit.runQuery.mockResolvedValueOnce(null);

    const r = await repo.getLossReasonRollup();

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('(b) returns Err when the query throws', async () => {
    kit.runQuery.mockRejectedValueOnce(new Error('boom'));

    const r = await repo.getLossReasonRollup();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('boom');
  });
});
