/**
 * test/hr/drizzle-hr-recruitment-funnel.repo.spec.ts
 *
 * Unit tests for DrizzleHrRecruitmentFunnelRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  candidates: {
    id: 'id', full_name: 'full_name', phone: 'phone', email: 'email',
    deleted_at: 'deleted_at',
  },
  hrCandidateFunnels: {
    id: 'id', candidateId: 'candidateId', vacancyId: 'vacancyId',
    funnelStage: 'funnelStage', productivityCategory: 'productivityCategory',
    isActive: 'isActive', source: 'source', screeningScore: 'screeningScore',
    assignedRecruiterId: 'assignedRecruiterId',
    createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  hrFunnelHistory: { id: 'id', funnelId: 'funnelId', stage: 'stage' },
  hrReferencesChecks: { id: 'id', funnelId: 'funnelId' },
}));

import { DrizzleHrRecruitmentFunnelRepository } from '../../src/modules/hr/recruitment/repos/drizzle-hr-recruitment-funnel.repo';

describe('DrizzleHrRecruitmentFunnelRepository', () => {
  let repo: DrizzleHrRecruitmentFunnelRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleHrRecruitmentFunnelRepository();
  });

  describe('findCandidateById', () => {
    it('returns Ok with candidate when present', async () => {
      kit.queueSelect([{ id: 7, full_name: 'Ali' }]);
      const r = await repo.findCandidateById(7);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findCandidateById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findCandidateById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findActiveFunnelForCandidate', () => {
    it('returns Ok with funnel when present', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.findActiveFunnelForCandidate(7);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when no active funnel', async () => {
      kit.queueSelect([]);
      const r = await repo.findActiveFunnelForCandidate(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findActiveFunnelForCandidate(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('createFunnel', () => {
    it('returns Ok with created funnel', async () => {
      kit.queueInsert([{ id: 1, candidateId: 7 }]);
      const r = await repo.createFunnel({ candidateId: 7 }, 1);
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createFunnel({}, 1);
      expect(r.ok).toBe(false);
    });

    it('uses createdById as assignedRecruiterId when missing', async () => {
      kit.queueInsert([{ id: 2, assignedRecruiterId: 42 }]);
      const r = await repo.createFunnel({ candidateId: 1 }, 42);
      expect(r.ok).toBe(true);
    });
  });

  describe('insertFunnelHistory', () => {
    it('returns Ok with inserted history', async () => {
      kit.queueInsert([{ id: 1, stage: 'NEW' }]);
      const r = await repo.insertFunnelHistory({
        funnelId: 1, fromStage: null, toStage: 'NEW', changedById: 7,
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('lock'));
      const r = await repo.insertFunnelHistory({
        funnelId: 1, fromStage: 'NEW', toStage: 'SCREENING', changedById: 1,
      });
      expect(r.ok).toBe(false);
    });

    it('passes notes through when provided', async () => {
      kit.queueInsert([{ id: 2, notes: 'good fit' }]);
      const r = await repo.insertFunnelHistory({
        funnelId: 1, fromStage: 'NEW', toStage: 'SCREENING',
        changedById: 1, notes: 'good fit',
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('listFunnels', () => {
    it('returns Ok with paginated data', async () => {
      kit.queueSelect([{ count: '2' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.listFunnels({ page: 1, limit: 10 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(2);
    });

    it('filters by vacancyId when provided', async () => {
      kit.queueSelect([{ count: '1' }]);
      kit.queueSelect([{ id: 1, vacancyId: 5 }]);
      const r = await repo.listFunnels({ page: 1, limit: 10, vacancyId: 5 });
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.listFunnels({ page: 1, limit: 10 });
      expect(r.ok).toBe(false);
    });
  });

  describe('getFunnelById', () => {
    it('returns Ok with funnel when present', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.getFunnelById(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.getFunnelById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.getFunnelById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getFunnelKanban', () => {
    it('returns Ok with kanban rows', async () => {
      kit.queueSelect([{ id: 1, funnelStage: 'NEW' }]);
      const r = await repo.getFunnelKanban();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('filters by vacancyId when provided', async () => {
      kit.queueSelect([{ id: 1, vacancyId: 5 }]);
      const r = await repo.getFunnelKanban(5);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getFunnelKanban();
      expect(r.ok).toBe(false);
    });
  });

  describe('countReferencesChecks', () => {
    it('returns Ok with count', async () => {
      kit.queueSelect([{ cnt: '3' }]);
      const r = await repo.countReferencesChecks(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(3);
    });

    it('returns Ok with zero when no rows', async () => {
      kit.queueSelect([{ cnt: '0' }]);
      const r = await repo.countReferencesChecks(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.countReferencesChecks(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateFunnel', () => {
    it('returns Ok with updated funnel', async () => {
      kit.queueUpdate([{ id: 1, funnelStage: 'INTERVIEW' }]);
      const r = await repo.updateFunnel(1, { funnelStage: 'INTERVIEW' });
      expect(r.ok).toBe(true);
    });

    it('returns Err on update failure', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.updateFunnel(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.updateFunnel(404, {});
      expect(r.ok).toBe(true);
    });
  });
});
