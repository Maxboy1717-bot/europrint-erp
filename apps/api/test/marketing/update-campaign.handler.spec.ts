/**
 * test/marketing/update-campaign.handler.spec.ts
 * Unit tests for UpdateCampaignHandler. ICampaignRepo is mocked; Campaign aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCampaignHandler } from '../../src/modules/marketing/application/commands/update-campaign.handler';
import { UpdateCampaignCommand } from '../../src/modules/marketing/application/commands/update-campaign.command';
import { CAMPAIGN_REPO } from '../../src/modules/marketing/domain/repositories/i-campaign.repo';
import { Campaign } from '../../src/modules/marketing/domain/aggregates/campaign.aggregate';
import { CampaignStatus, CampaignType } from '../../src/modules/marketing/domain/enums/campaign-status.enum';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findActive: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findActive: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeCampaign(status: CampaignStatus = CampaignStatus.DRAFT): Campaign {
  const c = Campaign.create(
    'Test', CampaignType.EMAIL, 'desc', 'aud', 1_000_000,
    new Date('2026-04-01'), new Date('2026-04-30'), 1,
  );
  c.status = status;
  return c;
}

describe('UpdateCampaignHandler', () => {
  let handler: UpdateCampaignHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCampaignHandler,
        { provide: CAMPAIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(UpdateCampaignHandler);
  });

  it('returns NOT_FOUND when campaign does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new UpdateCampaignCommand('missing', 'name'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns INTERNAL when status transition is invalid for current state', async () => {
    repo.findById.mockResolvedValue(Ok(makeCampaign(CampaignStatus.COMPLETED)));

    const r = await handler.execute(
      new UpdateCampaignCommand('id', undefined, undefined, 'active'),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/cannot transition/i);
  });

  it('applies name + description + budget patches when fields are provided', async () => {
    const c = makeCampaign();
    repo.findById.mockResolvedValue(Ok(c));
    repo.update.mockResolvedValue(Ok(c));

    await handler.execute(
      new UpdateCampaignCommand('id', 'New Name', 'New desc', undefined, 5_000_000),
    );

    expect(c.name).toBe('New Name');
    expect(c.description).toBe('New desc');
    expect(c.budget).toBe(5_000_000);
  });

  it('allows draft → active transition and updates status when transition is allowed', async () => {
    const c = makeCampaign(CampaignStatus.DRAFT);
    repo.findById.mockResolvedValue(Ok(c));
    repo.update.mockResolvedValue(Ok(c));

    const r = await handler.execute(
      new UpdateCampaignCommand('id', undefined, undefined, 'active'),
    );

    expect(r.ok).toBe(true);
    expect(c.status).toBe('active');
  });

  it('propagates repo error when update fails', async () => {
    repo.findById.mockResolvedValue(Ok(makeCampaign()));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new UpdateCampaignCommand('id', 'new'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
