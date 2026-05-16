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
      expect(r).toEqual({ id: 1, score: 85 });
    });

    it('returns undefined when array is empty', async () => {
      kit.queueInsert([]);
      const r = await repo.insertToolTest({ candidateId: 1 } as never);
      expect(r).toBeUndefined();
    });

    it('throws when insert rejects', async () => {
      kit.queueInsert(new Error('locked'));
      await expect(repo.insertToolTest({ candidateId: 1 } as never)).rejects.toThrow(/locked/);
    });
  });

  describe('updateFunnelProductivityCategory', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      await expect(repo.updateFunnelProductivityCategory(1, 'A')).resolves.toBeUndefined();
    });

    it('completes silently when no row matched', async () => {
      kit.queueUpdate([]);
      await expect(repo.updateFunnelProductivityCategory(1, 'B')).resolves.toBeUndefined();
    });

    it('throws when update rejects', async () => {
      kit.queueUpdate(new Error('locked'));
      await expect(repo.updateFunnelProductivityCategory(1, 'A')).rejects.toThrow(/locked/);
    });
  });

  describe('findToolTestById', () => {
    it('returns the tool test when found', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findToolTestById(5);
      expect(r).toEqual({ id: 5 });
    });

    it('throws NotFoundException when missing', async () => {
      kit.queueSelect([]);
      await expect(repo.findToolTestById(99)).rejects.toThrow(/topilmadi/);
    });

    it('throws when select rejects', async () => {
      kit.queueSelect(new Error('x'));
      await expect(repo.findToolTestById(1)).rejects.toThrow();
    });
  });

  describe('updateToolTestMatchScore', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      await expect(repo.updateToolTestMatchScore(1, 75, 'note')).resolves.toBeUndefined();
    });

    it('completes silently when no row', async () => {
      kit.queueUpdate([]);
      await expect(repo.updateToolTestMatchScore(99, 50, 'x')).resolves.toBeUndefined();
    });

    it('throws when update fails', async () => {
      kit.queueUpdate(new Error('boom'));
      await expect(repo.updateToolTestMatchScore(1, 75, 'note')).rejects.toThrow();
    });
  });

  describe('findToolTestsByCandidate', () => {
    it('returns rows when present', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findToolTestsByCandidate(7);
      expect(r).toHaveLength(2);
    });

    it('returns empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findToolTestsByCandidate(99);
      expect(r).toEqual([]);
    });

    it('throws when query fails', async () => {
      kit.queueSelect(new Error('x'));
      await expect(repo.findToolTestsByCandidate(1)).rejects.toThrow();
    });
  });

  describe('findCandidateById', () => {
    it('returns candidate when found', async () => {
      kit.queueSelect([{ id: 7 }]);
      const r = await repo.findCandidateById(7);
      expect(r).toEqual({ id: 7 });
    });

    it('throws NotFoundException when missing', async () => {
      kit.queueSelect([]);
      await expect(repo.findCandidateById(99)).rejects.toThrow(/topilmadi/);
    });

    it('throws when db rejects', async () => {
      kit.queueSelect(new Error('x'));
      await expect(repo.findCandidateById(1)).rejects.toThrow();
    });
  });

  describe('insertJobOffer', () => {
    it('returns the inserted job offer', async () => {
      kit.queueInsert([{ id: 1, status: 'DRAFT' }]);
      const r = await repo.insertJobOffer({ candidateId: 7 } as never, 1);
      expect(r).toEqual({ id: 1, status: 'DRAFT' });
    });

    it('returns undefined when no row returned', async () => {
      kit.queueInsert([]);
      const r = await repo.insertJobOffer({ candidateId: 7 } as never, 1);
      expect(r).toBeUndefined();
    });

    it('throws when insert rejects', async () => {
      kit.queueInsert(new Error('dup'));
      await expect(repo.insertJobOffer({ candidateId: 7 } as never, 1)).rejects.toThrow();
    });
  });

  describe('findJobOfferById', () => {
    it('returns offer when present', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.findJobOfferById(1);
      expect(r).toEqual({ id: 1 });
    });

    it('throws NotFoundException when missing', async () => {
      kit.queueSelect([]);
      await expect(repo.findJobOfferById(99)).rejects.toThrow(/topilmadi/);
    });

    it('throws when query rejects', async () => {
      kit.queueSelect(new Error('x'));
      await expect(repo.findJobOfferById(1)).rejects.toThrow();
    });
  });

  describe('markFunnelAsHired', () => {
    it('completes without error on success', async () => {
      kit.queueUpdate([{ id: 1 }]);
      await expect(repo.markFunnelAsHired(1)).resolves.toBeUndefined();
    });

    it('completes silently when no row matched', async () => {
      kit.queueUpdate([]);
      await expect(repo.markFunnelAsHired(99)).resolves.toBeUndefined();
    });

    it('throws when update rejects', async () => {
      kit.queueUpdate(new Error('locked'));
      await expect(repo.markFunnelAsHired(1)).rejects.toThrow();
    });
  });
});
