/**
 * test/hr/drizzle-hr-vacancies.repo.spec.ts
 *
 * Unit tests for DrizzleHrVacanciesRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  vacancies: {
    id: 'id', title: 'title', department: 'department', status: 'status',
    isActive: 'isActive', createdAt: 'createdAt',
  },
}));

import { DrizzleHrVacanciesRepository } from '../../src/modules/hr/recruitment/repos/drizzle-hr-vacancies.repo';

describe('DrizzleHrVacanciesRepository', () => {
  let repo: DrizzleHrVacanciesRepository;
  type FunnelMock = {
    findPipeline: jest.Mock; findPipelineById: jest.Mock;
    updatePipelineStage: jest.Mock; countByVacancy: jest.Mock;
    findCandidateCount: jest.Mock; findChannelsByVacancy: jest.Mock;
    findRoadmapByPipeline: jest.Mock; findProbationJournal: jest.Mock;
    findProbationDates: jest.Mock; findMarketAnalysisByVacancy: jest.Mock;
    recordFunnelHistory: jest.Mock; updateFunnelNotes: jest.Mock;
    addCandidateToFunnel: jest.Mock;
  };
  const funnel: FunnelMock = {
    findPipeline: jest.fn(), findPipelineById: jest.fn(),
    updatePipelineStage: jest.fn(), countByVacancy: jest.fn(),
    findCandidateCount: jest.fn(), findChannelsByVacancy: jest.fn(),
    findRoadmapByPipeline: jest.fn(), findProbationJournal: jest.fn(),
    findProbationDates: jest.fn(), findMarketAnalysisByVacancy: jest.fn(),
    recordFunnelHistory: jest.fn(), updateFunnelNotes: jest.fn(),
    addCandidateToFunnel: jest.fn(),
  };

  beforeEach(() => {
    kit.reset();
    Object.values(funnel).forEach((m) => m.mockReset());
    repo = new DrizzleHrVacanciesRepository(funnel as never);
  });

  describe('findAll', () => {
    it('returns Ok with rows when query succeeds', async () => {
      kit.queueSelect([{ id: 1, title: 'Dev' }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty list when no vacancies', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with vacancy when present', async () => {
      kit.queueSelect([{ id: 7, title: 'CTO' }]);
      const r = await repo.findById(7);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findActiveVacancies', () => {
    it('returns Ok with active list', async () => {
      kit.queueSelect([{ id: 1, status: 'active' }]);
      const r = await repo.findActiveVacancies();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty when none active', async () => {
      kit.queueSelect([]);
      const r = await repo.findActiveVacancies();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findActiveVacancies();
      expect(r.ok).toBe(false);
    });
  });

  describe('findInternalBoard', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.findInternalBoard();
      expect(r.ok).toBe(true);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findInternalBoard();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findInternalBoard();
      expect(r.ok).toBe(false);
    });
  });

  describe('funnel delegates', () => {
    it('delegates findPipeline to funnel repo', async () => {
      funnel.findPipeline.mockResolvedValueOnce({ ok: true, data: [{ id: 1 }] });
      const r = await repo.findPipeline(5);
      expect(funnel.findPipeline).toHaveBeenCalledWith(5);
      expect(r.ok).toBe(true);
    });

    it('delegates updatePipelineStage to funnel repo', async () => {
      funnel.updatePipelineStage.mockResolvedValueOnce({ ok: true, data: { id: 1 } });
      const r = await repo.updatePipelineStage(1, 'HIRED', 7);
      expect(funnel.updatePipelineStage).toHaveBeenCalledWith(1, 'HIRED', 7);
      expect(r.ok).toBe(true);
    });

    it('delegates addCandidateToFunnel to funnel repo', async () => {
      funnel.addCandidateToFunnel.mockResolvedValueOnce({ ok: true, data: { id: 1 } });
      const r = await repo.addCandidateToFunnel(5, 7, 'note', 'HH_UZ');
      expect(funnel.addCandidateToFunnel).toHaveBeenCalledWith(5, 7, 'note', 'HH_UZ');
      expect(r.ok).toBe(true);
    });
  });
});
