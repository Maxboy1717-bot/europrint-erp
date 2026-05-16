/**
 * Unit tests for SkillsMatrixRepository.
 * Covers all public methods. No real DB.
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  skill_catalog: { code: 'sc.code', name: 'sc.name', category: 'sc.category', is_active: 'sc.is_active' },
  employee_skill_scores: { id: 'ess.id' },
  position_skill_requirements: { id: 'psr.id' },
  hrEmployees: { id: 'he.id' },
}));

import { SkillsMatrixRepository } from '../../src/modules/hr/skills-matrix/skills-matrix.repository';

describe('SkillsMatrixRepository', () => {
  let repo: SkillsMatrixRepository;
  beforeEach(() => {
    repo = new SkillsMatrixRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
  });

  describe('getSkillCatalog', () => {
    it('returns Ok with skills when active entries present', async () => {
      dbStub.__setResolved([{ code: 'JS', name: 'JavaScript' }]);
      const r = await repo.getSkillCatalog();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no active skills', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getSkillCatalog();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getSkillCatalog();
      expect(r.ok).toBe(false);
    });
  });

  describe('getEmployeeSkills', () => {
    it('returns Ok with skills when employee has scores', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ skill_code: 'JS', current_level: 3 }] });
      const r = await repo.getEmployeeSkills(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no scores', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getEmployeeSkills(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getEmployeeSkills(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('upsertSkillScore', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, current_level: 3 }] });
      const r = await repo.upsertSkillScore(1, 'JS', 3, 2);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok when assessedBy omitted', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.upsertSkillScore(1, 'JS', 2);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.upsertSkillScore(1, 'JS', 3);
      expect(r.ok).toBe(false);
    });
  });

  describe('getGapAnalysis', () => {
    it('returns Ok with gap rows when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ skill_code: 'JS', gap: 2 }] });
      const r = await repo.getGapAnalysis(1, 5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no gaps', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getGapAnalysis(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getGapAnalysis(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getTeamMatrix', () => {
    it('returns Ok with team rows when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ employee_id: 1 }, { employee_id: 2 }] });
      const r = await repo.getTeamMatrix(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no team members', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getTeamMatrix(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getTeamMatrix(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getEmployeesNeedingAssessment', () => {
    it('returns Ok with rows when employees need assessment', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ employee_id: 1, scored_skills: 1 }] });
      const r = await repo.getEmployeesNeedingAssessment();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when all assessed', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getEmployeesNeedingAssessment();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getEmployeesNeedingAssessment();
      expect(r.ok).toBe(false);
    });
  });
});
