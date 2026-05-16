/**
 * test/marketing/get-campaign.handler.spec.ts
 * Unit tests for GetCampaignHandler. ICampaignRepo is mocked; Campaign aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetCampaignHandler } from '../../src/modules/marketing/application/queries/get-campaign.handler';
import { GetCampaignQuery } from '../../src/modules/marketing/application/queries/get-campaign.query';
import { CAMPAIGN_REPO } from '../../src/modules/marketing/domain/repositories/i-campaign.repo';
import { Campaign } from '../../src/modules/marketing/domain/aggregates/campaign.aggregate';
import { CampaignType } from '../../src/modules/marketing/domain/enums/campaign-status.enum';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findActive: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findActive: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeCampaign(): Campaign {
  return Campaign.create(
    'Test', CampaignType.EMAIL, 'desc', 'aud', 1_000_000,
    new Date('2026-04-01'), new Date('2026-04-30'), 1,
  );
}

describe('GetCampaignHandler', () => {
  let handler: GetCampaignHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetCampaignHandler,
        { provide: CAMPAIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetCampaignHandler);
  });

  it('returns Ok with the campaign aggregate when repo returns the row', async () => {
    const c = makeCampaign();
    repo.findById.mockResolvedValue(Ok(c));

    const r = await handler.execute(new GetCampaignQuery('id-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(c);
  });

  it('returns NOT_FOUND when repo returns null data', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new GetCampaignQuery('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('propagates repo error when findById fails', async () => {
    repo.findById.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetCampaignQuery('id-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('queries repo with exactly the id passed in the query', async () => {
    repo.findById.mockResolvedValue(Ok(makeCampaign()));

    await handler.execute(new GetCampaignQuery('exact-id-42'));

    expect(repo.findById).toHaveBeenCalledWith('exact-id-42');
  });
});
