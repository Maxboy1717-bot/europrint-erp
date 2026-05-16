/**
 * test/marketing/get-campaigns.handler.spec.ts
 * Unit tests for GetCampaignsHandler. ICampaignRepo is mocked; Campaign aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetCampaignsHandler } from '../../src/modules/marketing/application/queries/get-campaigns.handler';
import { GetCampaignsQuery } from '../../src/modules/marketing/application/queries/get-campaigns.query';
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
  return Campaign.create('Test', CampaignType.EMAIL, 'desc', 'aud', 1_000_000,
    new Date('2026-04-01'), new Date('2026-04-30'), 1);
}

describe('GetCampaignsHandler', () => {
  let handler: GetCampaignsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetCampaignsHandler,
        { provide: CAMPAIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetCampaignsHandler);
  });

  it('returns Ok with PaginatedResult when repo returns campaigns', async () => {
    const items = [makeCampaign(), makeCampaign()];
    repo.findAll.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetCampaignsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetCampaignsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes status filter through to repo unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetCampaignsQuery({ status: 'active', page: 3, limit: 25 }));

    expect(repo.findAll).toHaveBeenCalledWith({ status: 'active', page: 3, limit: 25 });
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetCampaignsQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
