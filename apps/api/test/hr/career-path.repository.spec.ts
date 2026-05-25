/**
 * Unit tests for CareerPathRepository.
 * Covers selected public methods with happy + Err paths.
 * (Tests sample 7 of the 11 public methods; spec capped at 300 lines.)
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  career_paths: { id: 'cp.id', status: 'cp.status', employee_id: 'cp.employee_id', progress_percent: 'cp.progress', estimated_months: 'cp.estimated', created_at: 'cp.created_at' },
  career_path_steps: { id: 'cps.id', career_path_id: 'cps.cp_id', is_completed: 'cps.is_completed', step_order: 'cps.step_order' },
  hrEmployees: { id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name', department_id: 'he.department_id' },
  hrPositions: { id: 'hp.id', name: 'hp.name' },
  hrDepartments: { id: 'hd.id', name: 'hd.name' },
}));

import { CareerPathRepository } from '../../src/modules/hr/career-path/career-path.repository';

describe('CareerPathRepository', () => {
  let repo: CareerPathRepository;
  beforeEach(() => {
    repo = new CareerPathRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
  });

  describe('createPath', () => {
    const baseDto = { employeeId: 1, currentPositionId: 2, targetPositionId: 5, createdBy: 3, estimatedMonths: 12 };

    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7, status: 'active' }]);
      const r = await repo.createPath(baseDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, status: 'active' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createPath(baseDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createPath(baseDto);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateStep', () => {
    it('returns Ok with row when update succeeds and step completed', async () => {
      dbStub.__setResolved([{ id: 1, is_completed: true }]);
      const r = await repo.updateStep(1, 5, true);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, is_completed: true });
    });

    it('returns Ok with empty object when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateStep(99, 5, false);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateStep(1, 5, true);
      expect(r.ok).toBe(false);
    });
  });

  describe('getPathProgress', () => {
    it('returns Ok with parsed counts when row present', async () => {
      dbStub.__setResolved([{ total: '5', completed: '3' }]);
      const r = await repo.getPathProgress(1);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.total).toBe(5);
        expect(r.data.completed).toBe(3);
      }
    });

    it('returns Ok with zeros when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getPathProgress(1);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.total).toBe(0);
        expect(r.data.completed).toBe(0);
      }
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getPathProgress(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getPath', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, status: 'active' }]);
      const r = await repo.getPath(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'active' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getPath(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getPath(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getByEmployee', () => {
    it('returns Ok with paths when rows present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      const r = await repo.getByEmployee(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getByEmployee(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getByEmployee(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getStepsByPath', () => {
    it('returns Ok with steps when present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.getStepsByPath(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStepsByPath(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStepsByPath(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('addStep', () => {
    const dto = { stepOrder: 1, positionTitle: 'Junior', skills: 'TS,React', requiredMonths: 6 };

    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 99 }]);
      const r = await repo.addStep(1, dto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 99 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.addStep(1, dto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.addStep(1, dto);
      expect(r.ok).toBe(false);
    });
  });

  describe('getActivePathsForMonthlyCheck', () => {
    it('returns Ok with active paths when present', async () => {
      dbStub.__setResolved([{ id: 1, months_elapsed: 3 }]);
      const r = await repo.getActivePathsForMonthlyCheck();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getActivePathsForMonthlyCheck();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getActivePathsForMonthlyCheck();
      expect(r.ok).toBe(false);
    });
  });
});
