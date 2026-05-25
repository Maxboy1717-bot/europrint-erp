/**
 * test/hr/get-employees.handler.spec.ts
 *
 * Unit tests for GetEmployeesHandler. IHrRepo mocked.
 */

import { GetEmployeesHandler } from '../../src/modules/hr/application/queries/get-employees.handler';
import { GetEmployeesQuery } from '../../src/modules/hr/application/queries/get-employees.query';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findAllEmployees: jest.fn(),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

describe('GetEmployeesHandler', () => {
  it('returns INTERNAL error when repository signals failure', async () => {
    const repo = makeRepo();
    repo.findAllEmployees.mockResolvedValue(Err('db down'));
    const handler = new GetEmployeesHandler(repo);

    const r = await handler.execute(new GetEmployeesQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
  });

  it('returns INTERNAL error when repository promise rejects', async () => {
    const repo = makeRepo();
    repo.findAllEmployees.mockRejectedValue(new Error('crashed'));
    const handler = new GetEmployeesHandler(repo);

    const r = await handler.execute(new GetEmployeesQuery({}));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with paginated payload when repo yields items', async () => {
    const repo = makeRepo();
    repo.findAllEmployees.mockResolvedValue(Ok({
      items: [{ id: 1 }, { id: 2 }],
      total: 12,
    }));
    const handler = new GetEmployeesHandler(repo);

    const r = await handler.execute(new GetEmployeesQuery({ page: 2, limit: 5 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(12);
      expect(r.data.page).toBe(2);
      expect(r.data.limit).toBe(5);
    }
  });

  it('uses default page=1 and limit=10 when filters omit pagination', async () => {
    const repo = makeRepo();
    repo.findAllEmployees.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = new GetEmployeesHandler(repo);

    const r = await handler.execute(new GetEmployeesQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('forwards filter object to repository unchanged', async () => {
    const repo = makeRepo();
    repo.findAllEmployees.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = new GetEmployeesHandler(repo);
    const filters = { department: 'Production', status: 'active' };

    await handler.execute(new GetEmployeesQuery(filters));

    expect(repo.findAllEmployees).toHaveBeenCalledWith(filters);
  });
});
