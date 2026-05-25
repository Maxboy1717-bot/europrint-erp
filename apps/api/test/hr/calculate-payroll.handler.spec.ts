/**
 * test/hr/calculate-payroll.handler.spec.ts
 *
 * Unit tests for CalculatePayrollHandler. Mocks IHrRepo, EventEmitter2, and
 * the compatibility helpers (`findUserIdByEmployee`, `hasAnyOrgAssignment`)
 * — those reach into rawSql so cannot be left real.
 */

jest.mock('../../src/modules/compatibility/employees-org-assignment.helper', () => ({
  findUserIdByEmployee: jest.fn(),
  hasAnyOrgAssignment: jest.fn(),
}));

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CalculatePayrollHandler,
  CalculatePayrollCommand,
} from '../../src/modules/hr/application/commands/calculate-payroll.handler';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';
import {
  findUserIdByEmployee,
  hasAnyOrgAssignment,
} from '../../src/modules/compatibility/employees-org-assignment.helper';

const mockFindUser = findUserIdByEmployee as jest.Mock;
const mockHasAssign = hasAnyOrgAssignment as jest.Mock;

type Repo = jest.Mocked<IHrRepo>;
function makeRepo(): Repo {
  return {
    savePayroll: jest.fn().mockResolvedValue(Ok({ id: 'pay-1' })),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

function makeBus(): jest.Mocked<EventEmitter2> {
  return { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
}

const BASE_CMD = new CalculatePayrollCommand(42, '2026-06', 5_000_000, 0, 0, 0, 1);

describe('CalculatePayrollHandler', () => {
  beforeEach(() => {
    mockFindUser.mockReset();
    mockHasAssign.mockReset();
  });

  it('returns BAD_REQUEST when no user is linked to the employee record', async () => {
    mockFindUser.mockResolvedValue(null);
    const handler = new CalculatePayrollHandler(makeRepo(), makeBus());

    const r = await handler.execute(BASE_CMD);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('returns BAD_REQUEST when employee has no org-structure assignment', async () => {
    mockFindUser.mockResolvedValue(7);
    mockHasAssign.mockResolvedValue(false);
    const handler = new CalculatePayrollHandler(makeRepo(), makeBus());

    const r = await handler.execute(BASE_CMD);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('returns Err when payroll persistence fails after computation', async () => {
    mockFindUser.mockResolvedValue(7);
    mockHasAssign.mockResolvedValue(true);
    const repo = makeRepo();
    repo.savePayroll.mockResolvedValue(Err('insert fail'));
    const handler = new CalculatePayrollHandler(repo, makeBus());

    const r = await handler.execute(BASE_CMD);

    expect(r.ok).toBe(false);
  });

  it('computes INPS/JSHD/net salary and emits hr.payroll.calculated on success', async () => {
    mockFindUser.mockResolvedValue(7);
    mockHasAssign.mockResolvedValue(true);
    const repo = makeRepo();
    const bus = makeBus();
    const handler = new CalculatePayrollHandler(repo, bus);

    const r = await handler.execute(BASE_CMD);

    expect(r.ok).toBe(true);
    if (r.ok) {
      // gross = base + bonus = 5_000_000; INPS = 8% = 400_000; net = 4_600_000
      expect(r.data.grossSalary).toBe(5_000_000);
      expect(r.data.inpsEmployee).toBe(400_000);
      expect(r.data.jshdEmployer).toBe(600_000);
      expect(r.data.netSalary).toBe(4_600_000);
    }
    expect(repo.savePayroll).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith('hr.payroll.calculated', expect.any(Object));
  });

  it('adds overtime pay and bonus to gross salary correctly', async () => {
    mockFindUser.mockResolvedValue(7);
    mockHasAssign.mockResolvedValue(true);
    const handler = new CalculatePayrollHandler(makeRepo(), makeBus());

    // overtime: 10h * (5_000_000/22/8) * 1.5 ≈ 426_136.36
    const cmd = new CalculatePayrollCommand(42, '2026-06', 5_000_000, 10, 100_000, 0, 1);
    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      const grossNum = Number(r.data.grossSalary);
      expect(grossNum).toBeGreaterThan(5_100_000);
      expect(grossNum).toBeLessThan(5_600_000);
    }
  });
});
