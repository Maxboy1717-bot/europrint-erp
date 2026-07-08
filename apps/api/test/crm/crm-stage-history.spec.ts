/**
 * test/crm/crm-stage-history.spec.ts
 *
 * VISION-3340 #34 — CRM stage-transition audit trail (crm_stage_history).
 *   (a) UpdateDealStageHandler records ONE history row with the correct
 *       from/to/entity fields on a successful transition, using the "before"
 *       stage it read via findById.
 *   (b) UpdateLeadStageHandler records ONE history row with the correct
 *       from/to/entity fields, using the "before" stage it read via getLeadStage.
 *   (c) The history write is BEST-EFFORT: a recordStageHistory failure logs but
 *       never rolls back or fails the stage transition that already succeeded.
 *
 * Both handlers persist through a mocked repository (per mark-deal-won.handler.spec.ts /
 * create-deal.handler.spec.ts) — the handler import graph never touches @shared/db, so no
 * DB mock is needed.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Ok, Err } from '../../src/common/result';

import {
  UpdateDealStageHandler,
  UpdateDealStageCommand,
} from '../../src/modules/crm/application/commands/update-deal-stage.handler';
import { CRM_DEALS_REPO } from '../../src/modules/crm/deals/i-crm-deals.repo';

import {
  UpdateLeadStageHandler,
  UpdateLeadStageCommand,
} from '../../src/modules/crm/application/commands/update-lead-stage.handler';
import { CRM_LEADS_OPS_REPO } from '../../src/modules/crm/domain/repositories/i-crm-leads-ops.repo';

// ── Deal repo mock ─────────────────────────────────────────────────────────────
type DealRepoMock = {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
  recordStageHistory: jest.Mock;
};

function makeDealRepo(): DealRepoMock {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    recordStageHistory: jest.fn().mockResolvedValue(Ok(undefined)),
  };
}

// ── Lead-ops repo mock ─────────────────────────────────────────────────────────
type LeadRepoMock = {
  updateLead: jest.Mock;
  findStage: jest.Mock;
  getLeadStage: jest.Mock;
  updateLeadStage: jest.Mock;
  insertActivityNote: jest.Mock;
  findLead: jest.Mock;
  insertDeal: jest.Mock;
  convertLead: jest.Mock;
  leadExists: jest.Mock;
  deleteLead: jest.Mock;
  recordStageHistory: jest.Mock;
};

function makeLeadRepo(): LeadRepoMock {
  return {
    updateLead: jest.fn(),
    findStage: jest.fn(),
    getLeadStage: jest.fn(),
    updateLeadStage: jest.fn(),
    insertActivityNote: jest.fn().mockResolvedValue(undefined),
    findLead: jest.fn(),
    insertDeal: jest.fn(),
    convertLead: jest.fn(),
    leadExists: jest.fn(),
    deleteLead: jest.fn(),
    recordStageHistory: jest.fn().mockResolvedValue(Ok(undefined)),
  };
}

describe('VISION-3340 #34 — UpdateDealStageHandler stage-history audit', () => {
  let handler: UpdateDealStageHandler;
  let repo: DealRepoMock;

  beforeEach(async () => {
    repo = makeDealRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDealStageHandler,
        { provide: CRM_DEALS_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(UpdateDealStageHandler);
  });

  it('records ONE history row with correct from/to/entity on a successful transition', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 'uuid-deal-1', stage_id: 'qualification' }));
    repo.update.mockResolvedValue(Ok({ id: 'uuid-deal-1', stage_id: 'proposal' }));

    const r = await handler.execute(new UpdateDealStageCommand('uuid-deal-1', 'proposal'));

    expect(r.ok).toBe(true);
    expect(repo.update).toHaveBeenCalledWith('uuid-deal-1', { stage_id: 'proposal' });
    expect(repo.recordStageHistory).toHaveBeenCalledTimes(1);
    expect(repo.recordStageHistory).toHaveBeenCalledWith({
      entityType: 'deal',
      entityId: 'uuid-deal-1',
      fromStage: 'qualification',
      toStage: 'proposal',
      changedBy: null,
    });
  });

  it('does NOT record history and returns NOT_FOUND when the deal is missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new UpdateDealStageCommand('uuid-missing', 'proposal'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.update).not.toHaveBeenCalled();
    expect(repo.recordStageHistory).not.toHaveBeenCalled();
  });

  it('best-effort: a history-write failure does NOT break the stage update', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 'uuid-deal-1', stage_id: 'qualification' }));
    repo.update.mockResolvedValue(Ok({ id: 'uuid-deal-1', stage_id: 'proposal' }));
    repo.recordStageHistory.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new UpdateDealStageCommand('uuid-deal-1', 'proposal'));

    // transition succeeded and was NOT rolled back despite the failed audit write
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as Record<string, unknown>).stage_id).toBe('proposal');
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.recordStageHistory).toHaveBeenCalledTimes(1);
  });
});

describe('VISION-3340 #34 — UpdateLeadStageHandler stage-history audit', () => {
  let handler: UpdateLeadStageHandler;
  let repo: LeadRepoMock;

  beforeEach(async () => {
    repo = makeLeadRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLeadStageHandler,
        { provide: CRM_LEADS_OPS_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(UpdateLeadStageHandler);
  });

  it('records ONE history row with correct from/to/entity on a successful transition', async () => {
    repo.findStage.mockResolvedValue(Ok(true));
    repo.getLeadStage.mockResolvedValue(Ok('5'));
    repo.updateLeadStage.mockResolvedValue(Ok([{ id: 1, stage_id: 7 }]));

    const r = await handler.execute(new UpdateLeadStageCommand(1, 7));

    expect(r.ok).toBe(true);
    expect(repo.updateLeadStage).toHaveBeenCalledWith(1, 7);
    expect(repo.recordStageHistory).toHaveBeenCalledTimes(1);
    expect(repo.recordStageHistory).toHaveBeenCalledWith({
      entityType: 'lead',
      entityId: '1',
      fromStage: '5',
      toStage: '7',
      changedBy: null,
    });
  });

  it('does NOT record history and returns NOT_FOUND when the target stage is missing', async () => {
    repo.findStage.mockResolvedValue(Ok(false));

    const r = await handler.execute(new UpdateLeadStageCommand(1, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.updateLeadStage).not.toHaveBeenCalled();
    expect(repo.recordStageHistory).not.toHaveBeenCalled();
  });

  it('records from_stage=null (still succeeds) when the pre-update stage read fails', async () => {
    repo.findStage.mockResolvedValue(Ok(true));
    repo.getLeadStage.mockResolvedValue(Err('read fail'));
    repo.updateLeadStage.mockResolvedValue(Ok([{ id: 1, stage_id: 7 }]));

    const r = await handler.execute(new UpdateLeadStageCommand(1, 7));

    expect(r.ok).toBe(true);
    expect(repo.recordStageHistory).toHaveBeenCalledTimes(1);
    expect(repo.recordStageHistory).toHaveBeenCalledWith({
      entityType: 'lead',
      entityId: '1',
      fromStage: null,
      toStage: '7',
      changedBy: null,
    });
  });

  it('best-effort: a history-write failure does NOT break the stage update', async () => {
    repo.findStage.mockResolvedValue(Ok(true));
    repo.getLeadStage.mockResolvedValue(Ok('5'));
    repo.updateLeadStage.mockResolvedValue(Ok([{ id: 1, stage_id: 7 }]));
    repo.recordStageHistory.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new UpdateLeadStageCommand(1, 7));

    expect(r.ok).toBe(true);
    expect(repo.updateLeadStage).toHaveBeenCalledTimes(1);
    expect(repo.recordStageHistory).toHaveBeenCalledTimes(1);
  });
});
