/**
 * test/marketing/drizzle-marketing-ext.repo.spec.ts
 *
 * Unit tests for DrizzleMarketingExtRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  marketingContentPosts: { id: 'id', createdAt: 'createdAt', scheduledAt: 'scheduledAt' },
  marketingSocialAccounts: { id: 'id' },
  marketingSocialPosts: { id: 'id', createdAt: 'createdAt' },
  marketingEmailTemplates: { id: 'id' },
  marketingCampaigns: { id: 'id', deletedAt: 'deletedAt' },
  marketingLeads: { id: 'id', deletedAt: 'deletedAt', status: 'status' },
}));

import { DrizzleMarketingExtRepository } from '../../src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo';

describe('DrizzleMarketingExtRepository', () => {
  let repo: DrizzleMarketingExtRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleMarketingExtRepository();
  });

  describe('getCampaignStats', () => {
    it('returns Ok with stats when campaign found', async () => {
      kit.queueSelect([{ id: 1, name: 'Camp' }]);
      const r = await repo.getCampaignStats(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.id).toBe(1);
    });

    it('returns Ok with zero stats when campaign missing', async () => {
      kit.queueSelect([]);
      const r = await repo.getCampaignStats(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.impressions).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.getCampaignStats(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getDashboardStats', () => {
    it('returns Ok with aggregated stats', async () => {
      kit.queueSelect([{ id: 1, status: 'active' }, { id: 2, status: 'paused' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.totalCampaigns).toBe(2);
        expect(r.data.activeCampaigns).toBe(1);
        expect(r.data.totalLeads).toBe(3);
      }
    });

    it('returns Ok with zeros when empty', async () => {
      kit.queueSelect([]);
      kit.queueSelect([]);
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.totalCampaigns).toBe(0);
    });

    it('returns Err when query fails', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getDashboardStats();
      expect(r.ok).toBe(false);
    });
  });

  describe('getContentPosts', () => {
    it('returns Ok with paginated posts', async () => {
      kit.queueSelect([{ id: '1' }, { id: '2' }]);
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(2);
    });

    it('returns Ok with empty when no posts', async () => {
      kit.queueSelect([]);
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getContentPosts(1, 10);
      expect(r.ok).toBe(false);
    });
  });

  describe('createContentPost', () => {
    it('returns Ok with created post', async () => {
      kit.queueInsert([{ id: '1', title: 'Hello' }]);
      const r = await repo.createContentPost({ title: 'Hello', content: 'X' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when no row returned', async () => {
      kit.queueInsert([]);
      const r = await repo.createContentPost({ title: 'X', content: 'Y' });
      expect(r.ok).toBe(false);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createContentPost({});
      expect(r.ok).toBe(false);
    });
  });

  describe('deleteContentPost', () => {
    it('returns Ok void on success', async () => {
      kit.queueDelete(undefined);
      const r = await repo.deleteContentPost('p-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err on delete failure', async () => {
      kit.queueDelete(new Error('FK'));
      const r = await repo.deleteContentPost('p-1');
      expect(r.ok).toBe(false);
    });

    it('completes without error when nothing to delete', async () => {
      kit.queueDelete([]);
      const r = await repo.deleteContentPost('missing');
      expect(r.ok).toBe(true);
    });
  });

  describe('publishContentPost', () => {
    it('returns Ok with published post', async () => {
      kit.queueUpdate([{ id: 'p-1', status: 'published' }]);
      const r = await repo.publishContentPost('p-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err when not found', async () => {
      kit.queueUpdate([]);
      const r = await repo.publishContentPost('missing');
      expect(r.ok).toBe(false);
    });

    it('returns Err on db failure', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.publishContentPost('p-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('getSocialAccounts', () => {
    it('returns Ok with accounts', async () => {
      kit.queueSelect([{ id: '1', platform: 'instagram' }]);
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getSocialAccounts();
      expect(r.ok).toBe(false);
    });
  });

  describe('createSocialAccount', () => {
    it('returns Ok with created account', async () => {
      kit.queueInsert([{ id: '1', platform: 'instagram' }]);
      const r = await repo.createSocialAccount({ platform: 'instagram', accountName: '@x' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when no row returned', async () => {
      kit.queueInsert([]);
      const r = await repo.createSocialAccount({});
      expect(r.ok).toBe(false);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createSocialAccount({});
      expect(r.ok).toBe(false);
    });
  });

  describe('getMarketingFunnel', () => {
    it('returns Ok with funnel stages', async () => {
      kit.queueSelect([{ count: 100 }]);
      kit.queueSelect([{ count: 5 }]);
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const data = r.data as { stages: Array<{ count: number }> };
        expect(data.stages[0].count).toBe(100);
        expect(data.stages[1].count).toBe(5);
      }
    });

    it('returns Ok with zeros when no leads', async () => {
      kit.queueSelect([{ count: 0 }]);
      kit.queueSelect([{ count: 0 }]);
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getMarketingFunnel();
      expect(r.ok).toBe(false);
    });
  });
});
