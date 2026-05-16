/**
 * Unit tests for PipRepository.
 * Covers selected public methods with happy + Err paths.
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  pip_plans: { id: 'pp.id', status: 'pp.status', employee_id: 'pp.employee_id', end_date: 'pp.end_date' },
  pip_progress_updates: { id: 'ppu.id', pip_id: 'ppu.pip_id', created_at: 'ppu.created_at' },
  hrEmployees: { id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name' },
  hrDepartments: { id: 'hd.id', name: 'hd.name' },
}));

jest.mock('@common/constants/app.constants', () => ({
  MAX_QUERY_LIMIT: 100,
}));

import { PipRepository } from '../../src/modules/hr/pip/pip.repository';

describe('PipRepository', () => {
  let repo: PipRepository;
  beforeEach(() => {
    repo = new PipRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
  });

  const baseDto = { employeeId: 1, createdBy: 2, durationDays: 30, startDate: '2025-01-01', endDate: '2025-01-31', goals: 'improve quality' };

  describe('createPip', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7, status: 'active' }]);
      const r = await repo.createPip(baseDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, status: 'active' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createPip(baseDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createPip(baseDto);
      expect(r.ok).toBe(false);
    });
  });

  describe('addProgressUpdate', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'on_track' }]);
      const r = await repo.addProgressUpdate(1, 2, 'doing well', 'on_track');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'on_track' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.addProgressUpdate(1, 2, 'note', 'at_risk');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.addProgressUpdate(1, 2, 'note', 'on_track');
      expect(r.ok).toBe(false);
    });
  });

  describe('getPip', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, status: 'active' }]);
      const r = await repo.getPip(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'active' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getPip(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getPip(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('acknowledge', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.acknowledge(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.acknowledge(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.acknowledge(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getByIdWithEmployee', () => {
    it('returns Ok with row when found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, employee_name: 'Alice X' }] });
      const r = await repo.getByIdWithEmployee(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, employee_name: 'Alice X' });
    });

    it('returns Ok with null when not found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getByIdWithEmployee(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getByIdWithEmployee(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getProgressUpdates', () => {
    it('returns Ok with updates when present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.getProgressUpdates(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getProgressUpdates(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getProgressUpdates(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getActivePips', () => {
    it('returns Ok with active rows when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.getActivePips();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none active', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getActivePips();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getActivePips();
      expect(r.ok).toBe(false);
    });
  });

  describe('getOverduePips', () => {
    it('returns Ok with overdue rows when present', async () => {
      dbStub.__setResolved([{ id: 1, end_date: '2025-01-01' }]);
      const r = await repo.getOverduePips('2025-02-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none overdue', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getOverduePips('2025-02-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getOverduePips('2025-02-01');
      expect(r.ok).toBe(false);
    });
  });
});
