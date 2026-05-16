/**
 * test/hr/get-leaves.handler.spec.ts
 *
 * Unit tests for GetLeavesHandler. IHrRepo mocked.
 */

import { GetLeavesHandler } from '../../src/modules/hr/application/queries/get-leaves.handler';
import { GetLeavesQuery } from '../../src/modules/hr/application/queries/get-leaves.query';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findLeaves: jest.fn(),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

describe('GetLeavesHandler', () => {
  it('returns Err when underlying repo fails', async () => {
    const repo = makeRepo();
    repo.findLeaves.mockResolvedValue(Err('db down'));
    const handler = new GetLeavesHandler(repo);

    const r = await handler.execute(new GetLeavesQuery());

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty items when no leaves match', async () => {
    const repo = makeRepo();
    repo.findLeaves.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = new GetLeavesHandler(repo);

    const r = await handler.execute(new GetLeavesQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toEqual([]);
      expect(r.data.total).toBe(0);
    }
  });

  it('returns Ok with paginated leaves when repo yields results', async () => {
    const repo = makeRepo();
    repo.findLeaves.mockResolvedValue(Ok({
      items: [{ id: 'lv-1' }, { id: 'lv-2' }],
      total: 17,
    }));
    const handler = new GetLeavesHandler(repo);

    const r = await handler.execute(new GetLeavesQuery('emp-1'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(17);
    }
  });

  it('forwards filter parameters from query to repository call', async () => {
    const repo = makeRepo();
    repo.findLeaves.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = new GetLeavesHandler(repo);

    await handler.execute(new GetLeavesQuery('emp-9', 'PENDING', 'ANNUAL', 2, 25));

    expect(repo.findLeaves).toHaveBeenCalledWith({
      employeeId: 'emp-9',
      status: 'PENDING',
      leaveType: 'ANNUAL',
      page: 2,
      limit: 25,
    });
  });

  it('uses default page=1 and limit=10 when query omits pagination', async () => {
    const repo = makeRepo();
    repo.findLeaves.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = new GetLeavesHandler(repo);

    await handler.execute(new GetLeavesQuery());

    expect(repo.findLeaves).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
  });
});
