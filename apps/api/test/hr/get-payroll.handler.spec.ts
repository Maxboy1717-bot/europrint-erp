/**
 * test/hr/get-payroll.handler.spec.ts
 *
 * Unit tests for GetPayrollHandler. IHrRepo mocked.
 */

import { GetPayrollHandler } from '../../src/modules/hr/application/queries/get-payroll.handler';
import { GetPayrollQuery } from '../../src/modules/hr/application/queries/get-payroll.query';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findPayroll: jest.fn(),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

describe('GetPayrollHandler', () => {
  it('returns Err when repository signals failure', async () => {
    const repo = makeRepo();
    repo.findPayroll.mockResolvedValue(Err('db down'));
    const handler = new GetPayrollHandler(repo);

    const r = await handler.execute(new GetPayrollQuery({}));

    expect(r.ok).toBe(false);
  });

  it('returns Err when repository throws unexpectedly', async () => {
    const repo = makeRepo();
    repo.findPayroll.mockRejectedValue(new Error('boom'));
    const handler = new GetPayrollHandler(repo);

    const r = await handler.execute(new GetPayrollQuery({}));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty array when no payroll records match filters', async () => {
    const repo = makeRepo();
    repo.findPayroll.mockResolvedValue(Ok([]));
    const handler = new GetPayrollHandler(repo);

    const r = await handler.execute(new GetPayrollQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns Ok with payroll rows when repo yields records', async () => {
    const rows = [{ id: 'p-1', employee_id: 1 }, { id: 'p-2', employee_id: 2 }];
    const repo = makeRepo();
    repo.findPayroll.mockResolvedValue(Ok(rows));
    const handler = new GetPayrollHandler(repo);

    const r = await handler.execute(new GetPayrollQuery({ period: '2026-06' }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('forwards filter object verbatim to the repository', async () => {
    const repo = makeRepo();
    repo.findPayroll.mockResolvedValue(Ok([]));
    const handler = new GetPayrollHandler(repo);
    const filters = { employeeId: 'emp-1', period: '2026-06', status: 'paid' };

    await handler.execute(new GetPayrollQuery(filters));

    expect(repo.findPayroll).toHaveBeenCalledWith(filters);
  });
});
