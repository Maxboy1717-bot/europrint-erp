/**
 * test/crm/qualify-lead.handler.spec.ts
 *
 * Unit tests for QualifyLeadHandler. Both ILeadRepository and IDealRepository
 * are mocked; real Lead aggregate is qualified through its domain rules.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { QualifyLeadHandler, QualifyLeadCommand } from '../../src/modules/crm/application/commands/qualify-lead.handler';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { Deal } from '../../src/modules/crm/domain/aggregates/deal.aggregate';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { DealStatus } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { Money } from '../../src/modules/shared/domain/value-objects/money.vo';
import { Ok, Err, type Result } from '../../src/common/result';
import { leadFactory } from '../_fixtures/factories';
import { LEAD_REPO } from '../../src/modules/crm/domain/repositories/i-lead.repo';
import { DEAL_REPO } from '../../src/modules/crm/domain/repositories/i-deal.repo';

interface LeadRepoMock {
  findById: jest.Mock<Promise<Result<Lead | null>>, [number]>;
  update: jest.Mock<Promise<Result<void>>, [Lead]>;
  save: jest.Mock; findByEmail: jest.Mock; findByCompanyId: jest.Mock; findByStatus: jest.Mock; delete: jest.Mock; count: jest.Mock;
}
interface DealRepoMock {
  save: jest.Mock<Promise<Result<Deal>>, [Deal]>;
  findById: jest.Mock; findByLeadId: jest.Mock; findByCompanyId: jest.Mock; findByStatus: jest.Mock; update: jest.Mock; delete: jest.Mock; countByStatus: jest.Mock;
}

function makeLeadRepo(): LeadRepoMock {
  return {
    findById: jest.fn(), update: jest.fn().mockResolvedValue(Ok(undefined)),
    save: jest.fn(), findByEmail: jest.fn(), findByCompanyId: jest.fn(), findByStatus: jest.fn(), delete: jest.fn(), count: jest.fn(),
  };
}
function makeDealRepo(): DealRepoMock {
  return {
    save: jest.fn(), findById: jest.fn(), findByLeadId: jest.fn(), findByCompanyId: jest.fn(), findByStatus: jest.fn(), update: jest.fn(), delete: jest.fn(), countByStatus: jest.fn(),
  };
}

function makeLead(status: 'new' | 'contacted' | 'qualified' | 'lost' = 'new'): Lead {
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
function makeDeal(): Deal {
  const s = DealStatus.create('qualification');
  if (!s.ok) throw new Error('setup');
  return Deal.create({
    leadId: 1, companyId: 1, dealNumber: 'D-1', status: s.data,
    totalAmount: Money.of(1000, 'USD'), currency: 'USD', assignedTo: 1,
    createdBy: 1, expectedClosureDate: new Date('2026-12-31'),
  });
}

describe('QualifyLeadHandler', () => {
  let handler: QualifyLeadHandler;
  let leadRepo: LeadRepoMock;
  let dealRepo: DealRepoMock;

  beforeEach(async () => {
    leadRepo = makeLeadRepo();
    dealRepo = makeDealRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualifyLeadHandler,
        { provide: LEAD_REPO, useValue: leadRepo },
        { provide: DEAL_REPO, useValue: dealRepo },
      ],
    }).compile();
    handler = module.get(QualifyLeadHandler);
  });

  const cmd = new QualifyLeadCommand(42, 1000, new Date('2026-12-31'));

  it('returns NOT_FOUND when lead missing', async () => {
    leadRepo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns VALIDATION when lead is in non-qualifiable state', async () => {
    leadRepo.findById.mockResolvedValue(Ok(makeLead('lost')));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    expect(dealRepo.save).not.toHaveBeenCalled();
  });

  it('returns INTERNAL when lead update repo fails', async () => {
    leadRepo.findById.mockResolvedValue(Ok(makeLead('new')));
    leadRepo.update.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
  });

  it('returns Ok with lead id when lead qualifies (handler no longer creates a deal)', async () => {
    // QualifyLeadHandler was updated to only transition lead status — deal creation
    // was removed (it caused crm_deals.assigned_by_id NOT NULL → 500). The deal
    // repo is no longer called by this handler; deal creation is done by
    // ConvertLeadToDealCommand instead.
    leadRepo.findById.mockResolvedValue(Ok(makeLead('new')));
    dealRepo.save.mockResolvedValue(Err('db gone'));  // irrelevant — not called

    const r = await handler.execute(cmd);

    // Handler succeeds with lead id; dealRepo.save is never invoked
    expect(r.ok).toBe(true);
    expect(dealRepo.save).not.toHaveBeenCalled();
  });

  it('returns Ok with lead id when lead qualifies and lead update succeeds', async () => {
    // Handler now returns Ok(lead.getId()) — deal creation was removed from this
    // handler (moved to ConvertLeadToDealCommand). dealRepo.save is not called.
    const lead = makeLead('contacted');
    leadRepo.findById.mockResolvedValue(Ok(lead));
    // dealRepo.save is irrelevant here but kept in the mock setup for completeness

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(lead.getId());
    expect(lead.getStatus()).toBe('qualified');
    expect(dealRepo.save).not.toHaveBeenCalled();
  });
});
