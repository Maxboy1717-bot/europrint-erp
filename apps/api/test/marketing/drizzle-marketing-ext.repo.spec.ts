/**
 * test/marketing/drizzle-marketing-ext.repo.spec.ts
 *
 * Unit tests for DrizzleMarketingExtRepository.
 *
 * NOTE (2026-07-09): the mock kit is named `mockKit` on purpose. babel-jest hoists
 * jest.mock() factories above imports and forbids referencing out-of-scope variables
 * that are NOT prefixed with `mock` — the previous `kit` name made this whole suite
 * fail to run (0 tests). Renamed so it actually executes.
 *
 * getCampaignStats coverage below also pins Marketing A2 (vision 14-marketing): campaign
 * ids are varchar slugs; the controllers used to do Number(id) -> NaN which 500'd the
 * lookup. The repo now takes the raw string id and only aggregates marketing_ads (an
 * INTEGER campaign_id column) when the id is numeric-shaped, returning honest-zero ad
 * stats for slug ids instead of crashing on the int cast.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const mockKit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: mockKit.db,
  runQuery: mockKit.runQuery,
  rawSql: mockKit.rawSql,
}));

// getAttributedRevenueByCampaign() reaches the DB via typedExecute (imports db from
// ./schema, a different module instance than the @shared/db mock). Stub it so the ROI
// path is hermetic and never touches a live DB.
jest.mock('@shared/db/typed-execute', () => ({
  typedExecute: jest.fn().mockResolvedValue([]),
}));

jest.mock('@europrint/schemas', () => ({
  marketingContentPosts: { id: 'id', createdAt: 'createdAt', scheduledAt: 'scheduledAt' },
  marketingSocialAccounts: { id: 'id' },
  marketingSocialPosts: { id: 'id', createdAt: 'createdAt' },
  marketingEmailTemplates: { id: 'id' },
  marketingCampaigns: { id: 'id', deletedAt: 'deletedAt', budget: 'budget', status: 'status' },
  marketingLeads: { id: 'id', deletedAt: 'deletedAt', status: 'status', createdAt: 'createdAt' },
}));

jest.mock('@workspace/db', () => ({
  npsResponses: { id: 'id', score: 'score', createdAt: 'created_at' },
  socialConversations: { id: 'id' },
  sdCustomers: { id: 'id' },
  marketingLeads: { id: 'id', deletedAt: 'deletedAt', status: 'status' },
  marketingAds: {
    id: 'id', campaignId: 'campaign_id', impressions: 'impressions',
    clicks: 'clicks', conversions: 'conversions', spentAmount: 'spent_amount', budget: 'budget',
  },
}));

import { DrizzleMarketingExtRepository } from '../../src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo';

describe('DrizzleMarketingExtRepository', () => {
  let repo: DrizzleMarketingExtRepository;

  beforeEach(() => {
    mockKit.reset();
    repo = new DrizzleMarketingExtRepository();
  });

  describe('getCampaignStats (Marketing A2 — varchar slug id + int-vs-varchar ads guard)', () => {
    it('reads a varchar slug id and SKIPS the ads aggregate (only one select: campaign lookup)', async () => {
      // slug id is not numeric-shaped -> the int ads.campaign_id join would 500, so it is skipped.
      mockKit.queueSelect([{ id: 'demo-camp-001', name: 'Demo' }]);
      const r = await repo.getCampaignStats('demo-camp-001');
      expect(r.ok).toBe(true);
      // campaign lookup only; ads aggregate not attempted for a slug id.
      expect(mockKit.db.select).toHaveBeenCalledTimes(1);
      if (r.ok) {
        expect(r.data.id).toBe('demo-camp-001');
        expect(r.data.impressions).toBe(0); // honest zero, not a crash
        expect(r.data.clicks).toBe(0);
      }
    });

    it('aggregates ads for a numeric-shaped id (two selects: campaign + ads)', async () => {
      mockKit.queueSelect([{ id: '5', name: 'Numeric' }]); // campaign lookup
      mockKit.queueSelect([{ impressions: 100, clicks: 10, conversions: 2, totalSpent: '50', totalBudget: '200' }]); // ads
      const r = await repo.getCampaignStats('5');
      expect(r.ok).toBe(true);
      expect(mockKit.db.select).toHaveBeenCalledTimes(2);
      if (r.ok) {
        expect(r.data.impressions).toBe(100);
        expect(r.data.clicks).toBe(10);
        expect(r.data.conversions).toBe(2);
      }
    });

    it('returns Ok with zero stats + the slug echoed when campaign missing', async () => {
      mockKit.queueSelect([]); // no campaign row
      const r = await repo.getCampaignStats('ghost-slug');
      expect(r.ok).toBe(true);
      expect(mockKit.db.select).toHaveBeenCalledTimes(1); // ads still skipped for slug
      if (r.ok) {
        expect(r.data.id).toBe('ghost-slug');
        expect(r.data.impressions).toBe(0);
      }
    });

    it('returns Err on db failure', async () => {
      mockKit.queueSelect(new Error('boom'));
      const r = await repo.getCampaignStats('demo-camp-001');
      expect(r.ok).toBe(false);
    });
  });

  describe('getDashboardStats', () => {
    it('returns Ok with aggregated stats', async () => {
      mockKit.queueSelect([{ id: 1, status: 'active' }, { id: 2, status: 'paused' }]);
      mockKit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.totalCampaigns).toBe(2);
        expect(r.data.activeCampaigns).toBe(1);
        expect(r.data.totalLeads).toBe(3);
      }
    });

    it('returns Ok with zeros when empty', async () => {
      mockKit.queueSelect([]);
      mockKit.queueSelect([]);
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.totalCampaigns).toBe(0);
    });

    it('returns Err when query fails', async () => {
      mockKit.queueSelect(new Error('x'));
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(false);
    });
  });

  describe('getContentPosts', () => {
    it('returns Ok with paginated posts', async () => {
      mockKit.queueSelect([{ id: '1' }, { id: '2' }]);
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(2);
    });

    it('returns Ok with empty when no posts', async () => {
      mockKit.queueSelect([]);
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      mockKit.queueSelect(new Error('x'));
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(false);
    });
  });

  describe('createContentPost', () => {
    it('returns Ok with created post', async () => {
      mockKit.queueInsert([{ id: '1', title: 'Hello' }]);
      const r = await repo.createContentPost({ title: 'Hello', content: 'X' });
      expect(r.ok).toBe(true);
    });

    it('returns Ok wrapping Err-string when no row returned (safeCall wraps fn return)', async () => {
      // Inside safeCall the fn returns Err('...') — a string-based Err from @common/result.
      // safeCall wraps that return value in Ok(), so r.ok is true and r.data is the Err object.
      mockKit.queueInsert([]);
      const r = await repo.createContentPost({ title: 'X', content: 'Y' });
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      mockKit.queueInsert(new Error('dup'));
      const r = await repo.createContentPost({});
      expect(r.ok).toBe(false);
    });
  });

  describe('deleteContentPost', () => {
    it('returns Ok void on success', async () => {
      mockKit.queueDelete(undefined);
      const r = await repo.deleteContentPost('p-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err on delete failure', async () => {
      mockKit.queueDelete(new Error('FK'));
      const r = await repo.deleteContentPost('p-1');
      expect(r.ok).toBe(false);
    });

    it('completes without error when nothing to delete', async () => {
      mockKit.queueDelete([]);
      const r = await repo.deleteContentPost('missing');
      expect(r.ok).toBe(true);
    });
  });

  describe('publishContentPost', () => {
    it('returns Ok with published post', async () => {
      mockKit.queueUpdate([{ id: 'p-1', status: 'published' }]);
      const r = await repo.publishContentPost('p-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err when not found', async () => {
      mockKit.queueUpdate([]);
      const r = await repo.publishContentPost('missing');
      expect(r.ok).toBe(false);
    });

    it('returns Err on db failure', async () => {
      mockKit.queueUpdate(new Error('lock'));
      const r = await repo.publishContentPost('p-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('getSocialAccounts', () => {
    it('returns Ok with accounts', async () => {
      mockKit.queueSelect([{ id: '1', platform: 'instagram' }]);
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when none', async () => {
      mockKit.queueSelect([]);
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      mockKit.queueSelect(new Error('x'));
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(false);
    });
  });

  describe('createSocialAccount', () => {
    it('returns Ok with created account', async () => {
      mockKit.queueInsert([{ id: '1', platform: 'instagram' }]);
      const r = await repo.createSocialAccount({ platform: 'instagram', accountName: '@x' });
      expect(r.ok).toBe(true);
    });

    it('returns Ok wrapping Err-string when no row returned (safeCall wraps fn return)', async () => {
      // Same safeCall wrapping pattern as createContentPost: fn returns Err('...') → Ok(Err(...)).
      mockKit.queueInsert([]);
      const r = await repo.createSocialAccount({});
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      mockKit.queueInsert(new Error('dup'));
      const r = await repo.createSocialAccount({});
      expect(r.ok).toBe(false);
    });
  });

  describe('getMarketingFunnel', () => {
    // Current impl: ONE grouped select returning per-status {status, cnt} rows,
    // mapped onto the canonical new→warm→hot→converted→lost funnel order.
    it('returns Ok with funnel stages grouped by lead status', async () => {
      mockKit.queueSelect([
        { status: 'new', cnt: 100 },
        { status: 'converted', cnt: 5 },
      ]);
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const data = r.data as { stages: Array<{ name: string; count: number }>; total: number; conversionRate: number };
        expect(data.stages.find(s => s.name === 'new')?.count).toBe(100);
        expect(data.stages.find(s => s.name === 'converted')?.count).toBe(5);
        expect(data.total).toBe(105);
      }
    });

    it('returns Ok with zeros when no leads', async () => {
      mockKit.queueSelect([]);
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { total: number }).total).toBe(0);
    });

    it('returns Err on db failure', async () => {
      mockKit.queueSelect(new Error('x'));
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(false);
    });
  });
});
