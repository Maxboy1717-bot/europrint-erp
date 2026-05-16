/**
 * Unit tests for RecruitmentStatsRepository.
 * Covers selected aggregation methods with happy + Err paths.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  candidates: { id: 'c.id' },
  vacancies: { id: 'v.id', status: 'v.status' },
  hrCandidateFunnels: {
    funnelStage: 'hcf.funnel_stage',
    productivityCategory: 'hcf.productivity_category',
    source: 'hcf.source',
    assignedRecruiterId: 'hcf.assigned_recruiter_id',
    createdAt: 'hcf.created_at',
    hiredAt: 'hcf.hired_at',
    rejectedAt: 'hcf.rejected_at',
    vacancyId: 'hcf.vacancy_id',
  },
  hrToolTestResults: { testDate: 'tt.test_date' },
}));

import { RecruitmentStatsRepository } from '../../src/modules/hr/recruitment/recruitment-stats.repository';

const start = new Date('2025-01-01');
const end = new Date('2025-01-07');

describe('RecruitmentStatsRepository', () => {
  let repo: RecruitmentStatsRepository;
  beforeEach(() => {
    repo = new RecruitmentStatsRepository();
    dbStub.__setResolved([]);
  });

  describe('getStageCounts', () => {
    it('returns Ok with rows when stages present', async () => {
      dbStub.__setResolved([{ stage: 'NEW', cnt: 5 }, { stage: 'HIRED', cnt: 2 }]);
      const r = await repo.getStageCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStageCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStageCounts(1, start, end);
      expect(r.ok).toBe(false);
    });
  });

  describe('getProductivityCounts', () => {
    it('returns Ok with rows when categories present', async () => {
      dbStub.__setResolved([{ category: 'FLAGMAN', cnt: 3 }]);
      const r = await repo.getProductivityCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getProductivityCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getProductivityCounts(1, start, end);
      expect(r.ok).toBe(false);
    });
  });

  describe('getSourceCounts', () => {
    it('returns Ok with sources when present', async () => {
      dbStub.__setResolved([{ source: 'linkedin', cnt: 10 }]);
      const r = await repo.getSourceCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getSourceCounts(1, start, end);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getSourceCounts(1, start, end);
      expect(r.ok).toBe(false);
    });
  });

  describe('countByStage', () => {
    it('returns Ok with count row when found', async () => {
      dbStub.__setResolved([{ cnt: 5 }]);
      const r = await repo.countByStage('NEW');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data?.cnt).toBe(5);
    });

    it('returns Ok with undefined when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countByStage('NEW');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.countByStage('NEW');
      expect(r.ok).toBe(false);
    });
  });

  describe('countActiveVacancies', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ cnt: 12 }]);
      const r = await repo.countActiveVacancies();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data?.cnt).toBe(12);
    });

    it('returns Ok with undefined when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countActiveVacancies();
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.countActiveVacancies();
      expect(r.ok).toBe(false);
    });
  });

  describe('countRecentTests', () => {
    it('returns Ok with row when present', async () => {
      dbStub.__setResolved([{ cnt: 8 }]);
      const r = await repo.countRecentTests(start);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data?.cnt).toBe(8);
    });

    it('returns Ok with undefined when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countRecentTests(start);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.countRecentTests(start);
      expect(r.ok).toBe(false);
    });
  });

  describe('countTotalNew', () => {
    it('returns Ok with row when present', async () => {
      dbStub.__setResolved([{ cnt: 20 }]);
      const r = await repo.countTotalNew();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data?.cnt).toBe(20);
    });

    it('returns Ok with undefined when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countTotalNew();
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.countTotalNew();
      expect(r.ok).toBe(false);
    });
  });

  describe('countTotalHired', () => {
    it('returns Ok with row when present', async () => {
      dbStub.__setResolved([{ cnt: 7 }]);
      const r = await repo.countTotalHired();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data?.cnt).toBe(7);
    });

    it('returns Ok with undefined when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countTotalHired();
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.countTotalHired();
      expect(r.ok).toBe(false);
    });
  });

  describe('getChannelAnalytics', () => {
    it('returns Ok with channel rows when present', async () => {
      dbStub.__setResolved([{ ch_key: 'linkedin', total_applications: '50' }]);
      const r = await repo.getChannelAnalytics();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no channels', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getChannelAnalytics();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getChannelAnalytics();
      expect(r.ok).toBe(false);
    });
  });
});
