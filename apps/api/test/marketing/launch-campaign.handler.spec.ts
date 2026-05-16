/**
 * test/marketing/launch-campaign.handler.spec.ts
 * Unit tests for LaunchCampaignHandler. ICampaignRepo is mocked; Campaign aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { LaunchCampaignHandler } from '../../src/modules/marketing/application/commands/launch-campaign.handler';
import { LaunchCampaignCommand } from '../../src/modules/marketing/application/commands/launch-campaign.command';
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

describe('LaunchCampaignHandler', () => {
  let handler: LaunchCampaignHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LaunchCampaignHandler,
        { provide: CAMPAIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(LaunchCampaignHandler);
  });

  it('returns NOT_FOUND when campaign does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new LaunchCampaignCommand('missing', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns FORBIDDEN when campaign is not in draft status', async () => {
    repo.findById.mockResolvedValue(Ok(makeCampaign(CampaignStatus.ACTIVE)));

    const r = await handler.execute(new LaunchCampaignCommand('id', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
  });

  it('sets status to active and persists via repo.update when campaign is in draft', async () => {
    const c = makeCampaign();
    repo.findById.mockResolvedValue(Ok(c));
    repo.update.mockResolvedValue(Ok(c));

    const r = await handler.execute(new LaunchCampaignCommand('id', 'u1'));

    expect(r.ok).toBe(true);
    expect(c.status).toBe('active');
    expect(repo.update).toHaveBeenCalledWith('id', c);
  });

  it('propagates repo error when update fails', async () => {
    repo.findById.mockResolvedValue(Ok(makeCampaign()));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new LaunchCampaignCommand('id', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
