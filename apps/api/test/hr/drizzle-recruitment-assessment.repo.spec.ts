/**
 * test/hr/drizzle-recruitment-assessment.repo.spec.ts
 *
 * Unit tests for DrizzleRecruitmentAssessmentRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  candidates: { id: 'id' },
  hrCandidateFunnels: { id: 'id', funnelStage: 'funnelStage' },
  hrToolTestResults: { id: 'id', candidateId: 'candidateId', testDate: 'testDate' },
  hrProductivityInterviews: { id: 'id', candidateId: 'candidateId', conductedAt: 'conductedAt' },
  hrReferencesChecks: { id: 'id', funnelId: 'funnelId', createdAt: 'createdAt' },
  hrJobOffers: { id: 'id', candidateId: 'candidateId', createdAt: 'createdAt' },
}));

import { DrizzleRecruitmentAssessmentRepository } from '../../src/modules/hr/recruitment/repos/drizzle-recruitment-assessment.repo';

describe('DrizzleRecruitmentAssessmentRepository', () => {
  let repo: DrizzleRecruitmentAssessmentRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleRecruitmentAssessmentRepository();
  });

  describe('insertToolTest', () => {
    it('returns the first inserted row when array', async () => {
      kit.queueInsert([{ id: 1, score: 85 }]);
      const r = await repo.insertToolTest({ candidateId: 1 } as never);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, score: 85 });
    });

    it('returns Ok with undefined when array is empty', async () => {
      kit.queueInsert([]);
      const r = await repo.insertToolTest({ candidateId: 1 } as never);
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert rejects', async () => {
      kit.queueInsert(new Error('locked'));
      const r = await repo.insertToolTest({ candidateId: 1 } as never);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateFunnelProductivityCategory', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      const r = await repo.updateFunnelProductivityCategory(1, 'A');
      expect(r.ok).toBe(true);
    });

    it('completes silently when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.updateFunnelProductivityCategory(1, 'B');
      expect(r.ok).toBe(true);
    });

    it('returns Err when update rejects', async () => {
      kit.queueUpdate(new Error('locked'));
      const r = await repo.updateFunnelProductivityCategory(1, 'A');
      expect(r.ok).toBe(false);
    });
  });

  describe('findToolTestById', () => {
    it('returns the tool test when found', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findToolTestById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5 });
    });

    it('returns Err when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findToolTestById(99);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/topilmadi/);
    });

    it('returns Err when select rejects', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findToolTestById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateToolTestMatchScore', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      const r = await repo.updateToolTestMatchScore(1, 75, 'note');
      expect(r.ok).toBe(true);
    });

    it('completes silently when no row', async () => {
      kit.queueUpdate([]);
      const r = await repo.updateToolTestMatchScore(99, 50, 'x');
      expect(r.ok).toBe(true);
    });

    it('returns Err when update fails', async () => {
      kit.queueUpdate(new Error('boom'));
      const r = await repo.updateToolTestMatchScore(1, 75, 'note');
      expect(r.ok).toBe(false);
    });
  });

  describe('findToolTestsByCandidate', () => {
    it('returns rows when present', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findToolTestsByCandidate(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns empty array when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findToolTestsByCandidate(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when query fails', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findToolTestsByCandidate(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findCandidateById', () => {
    it('returns candidate when found', async () => {
      kit.queueSelect([{ id: 7 }]);
      const r = await repo.findCandidateById(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7 });
    });

    it('returns Err when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findCandidateById(99);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/topilmadi/);
    });

    it('returns Err when db rejects', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findCandidateById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('insertJobOffer', () => {
    it('returns the inserted job offer', async () => {
      kit.queueInsert([{ id: 1, status: 'DRAFT' }]);
      const r = await repo.insertJobOffer({ candidateId: 7 } as never, 1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'DRAFT' });
    });

    it('returns Ok with undefined when no row returned', async () => {
      kit.queueInsert([]);
      const r = await repo.insertJobOffer({ candidateId: 7 } as never, 1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert rejects', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.insertJobOffer({ candidateId: 7 } as never, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findJobOfferById', () => {
    it('returns offer when present', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.findJobOfferById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Err when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findJobOfferById(99);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/topilmadi/);
    });

    it('returns Err when query rejects', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findJobOfferById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('markFunnelAsHired', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      const r = await repo.markFunnelAsHired(1);
      expect(r.ok).toBe(true);
    });

    it('completes silently when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.markFunnelAsHired(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update rejects', async () => {
      kit.queueUpdate(new Error('locked'));
      const r = await repo.markFunnelAsHired(1);
      expect(r.ok).toBe(false);
    });
  });
});
