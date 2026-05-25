/**
 * Unit tests for DailyReportRepository.
 * Covers selected public methods with happy + Err paths.
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);
const markAbsentMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  hr_daily_reports: { id: 'dr.id', status: 'dr.status', employee_id: 'dr.employee_id', report_date: 'dr.report_date' },
  hr_daily_report_audit: { id: 'dra.id' },
  hrEmployees: { id: 'he.id', status: 'he.status' },
  hrDepartments: { id: 'hd.id', name: 'hd.name' },
  hrPositions: { id: 'hp.id', name: 'hp.name' },
}));

jest.mock('@common/database/queries-remaining', () => ({
  execDailyReportMarkAbsent: markAbsentMock,
}));

import { DailyReportRepository } from '../../src/modules/hr/daily-report/daily-report.repository';

describe('DailyReportRepository', () => {
  let repo: DailyReportRepository;
  beforeEach(() => {
    repo = new DailyReportRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
    markAbsentMock.mockReset().mockResolvedValue(undefined);
  });

  const upsertDto = { employeeId: 1, reportDate: '2025-01-01', tasksCompleted: 'task A done' };

  describe('upsertReport', () => {
    it('returns Ok with row when upsert succeeds', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, status: 'submitted' }] });
      const r = await repo.upsertReport(upsertDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'submitted' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.upsertReport(upsertDto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.upsertReport(upsertDto);
      expect(r.ok).toBe(false);
    });
  });

  describe('getReportStatus', () => {
    it('returns Ok with status when row exists', async () => {
      dbStub.__setResolved([{ status: 'submitted' }]);
      const r = await repo.getReportStatus(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('submitted');
    });

    it('returns Ok with "unknown" when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getReportStatus(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('unknown');
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getReportStatus(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateReportStatus', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, status: 'reviewed' }]);
      const r = await repo.updateReportStatus(1, 'reviewed');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'reviewed' });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateReportStatus(99, 'reviewed');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateReportStatus(1, 'reviewed');
      expect(r.ok).toBe(false);
    });
  });

  describe('getStats', () => {
    it('returns Ok with stats when row present', async () => {
      dbStub.__setResolved([{ submitted_count: 10, absent_count: 2, total_active_employees: 12 }]);
      const r = await repo.getStats('2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.submitted_count).toBe(10);
    });

    it('returns Ok with empty object when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStats('2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStats('2025-01-01');
      expect(r.ok).toBe(false);
    });
  });

  describe('getByEmployee', () => {
    it('returns Ok with reports when present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.getByEmployee(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getByEmployee(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getByEmployee(1, 10);
      expect(r.ok).toBe(false);
    });
  });

  describe('getByDate', () => {
    it('returns Ok with rows when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.getByDate('2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getByDate('2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getByDate('2025-01-01');
      expect(r.ok).toBe(false);
    });
  });

  describe('findEmployeesWithoutReport', () => {
    it('returns Ok with rows when found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      const r = await repo.findEmployeesWithoutReport('2025-01-01', 50, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when all reported', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.findEmployeesWithoutReport('2025-01-01', 50, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.findEmployeesWithoutReport('2025-01-01', 50, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findByIdWithEmployee', () => {
    it('returns Ok with row when found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, employee_name: 'A B' }] });
      const r = await repo.findByIdWithEmployee(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, employee_name: 'A B' });
    });

    it('returns Ok with null when not found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.findByIdWithEmployee(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.findByIdWithEmployee(1);
      expect(r.ok).toBe(false);
    });
  });
});
