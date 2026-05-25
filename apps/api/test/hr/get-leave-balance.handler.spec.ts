/**
 * test/hr/get-leave-balance.handler.spec.ts
 *
 * Unit tests for GetLeaveBalanceHandler. IHrRepo mocked.
 */

import { GetLeaveBalanceHandler } from '../../src/modules/hr/application/queries/get-leave-balance.handler';
import { GetLeaveBalanceQuery } from '../../src/modules/hr/application/queries/get-leave-balance.query';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    getLeaveBalance: jest.fn(),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveStats: jest.fn(),
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

const FULL_BALANCE = {
  annual: { used: 5, remaining: 16, total: 21 },
  sick: { used: 2 },
  maternity: { used: 0 },
};

describe('GetLeaveBalanceHandler', () => {
  it('returns Err when repo fails to compute balance', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(Err('balance fail'));
    const handler = new GetLeaveBalanceHandler(repo);

    const r = await handler.execute(new GetLeaveBalanceQuery('emp-1'));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with annual/sick/maternity buckets when repo succeeds', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(Ok(FULL_BALANCE));
    const handler = new GetLeaveBalanceHandler(repo);

    const r = await handler.execute(new GetLeaveBalanceQuery('emp-1'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.annual.remaining).toBe(16);
      expect(r.data.sick.used).toBe(2);
      expect(r.data.maternity.used).toBe(0);
    }
  });

  it('preserves zero-balance results without coercion', async () => {
    const zero = {
      annual: { used: 21, remaining: 0, total: 21 },
      sick: { used: 0 }, maternity: { used: 0 },
    };
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(Ok(zero));
    const handler = new GetLeaveBalanceHandler(repo);

    const r = await handler.execute(new GetLeaveBalanceQuery('emp-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.annual.remaining).toBe(0);
  });

  it('forwards employeeId from query into repository call', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(Ok(FULL_BALANCE));
    const handler = new GetLeaveBalanceHandler(repo);

    await handler.execute(new GetLeaveBalanceQuery('emp-42'));

    expect(repo.getLeaveBalance).toHaveBeenCalledWith('emp-42');
  });
});
