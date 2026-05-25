/**
 * test/hr/get-attendance.handler.spec.ts
 *
 * Unit tests for GetAttendanceHandler. Only IHrRepo is mocked.
 */

import { GetAttendanceHandler } from '../../src/modules/hr/application/queries/get-attendance.handler';
import { GetAttendanceQuery } from '../../src/modules/hr/application/queries/get-attendance.query';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findAttendance: jest.fn(),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

describe('GetAttendanceHandler', () => {
  it('returns Err when repository signals failure', async () => {
    const repo = makeRepo();
    repo.findAttendance.mockResolvedValue(Err('db down'));
    const handler = new GetAttendanceHandler(repo);

    const r = await handler.execute(new GetAttendanceQuery('emp-1', '2026-06'));

    expect(r.ok).toBe(false);
  });

  it('returns Err when underlying repository promise rejects', async () => {
    const repo = makeRepo();
    repo.findAttendance.mockRejectedValue(new Error('boom'));
    const handler = new GetAttendanceHandler(repo);

    const r = await handler.execute(new GetAttendanceQuery('emp-1', '2026-06'));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty array when employee has no records in period', async () => {
    const repo = makeRepo();
    repo.findAttendance.mockResolvedValue(Ok([]));
    const handler = new GetAttendanceHandler(repo);

    const r = await handler.execute(new GetAttendanceQuery('emp-1', '2026-06'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns Ok with attendance rows when records exist', async () => {
    const rows = [{ id: 1, status: 'present' }, { id: 2, status: 'absent' }];
    const repo = makeRepo();
    repo.findAttendance.mockResolvedValue(Ok(rows));
    const handler = new GetAttendanceHandler(repo);

    const r = await handler.execute(new GetAttendanceQuery('emp-1', '2026-06'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('passes employeeId and period from query to repository', async () => {
    const repo = makeRepo();
    repo.findAttendance.mockResolvedValue(Ok([]));
    const handler = new GetAttendanceHandler(repo);

    await handler.execute(new GetAttendanceQuery('emp-7', '2026-09'));

    expect(repo.findAttendance).toHaveBeenCalledWith('emp-7', '2026-09');
  });
});
