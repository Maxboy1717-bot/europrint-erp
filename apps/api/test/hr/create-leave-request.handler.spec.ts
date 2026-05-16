/**
 * test/hr/create-leave-request.handler.spec.ts
 *
 * Unit tests for CreateLeaveRequestHandler. IHrRepo mocked. The aggregate
 * (LeaveRequest) and the `calcWorkDays` helper are exercised real.
 */

import { CreateLeaveRequestHandler } from '../../src/modules/hr/application/commands/create-leave-request.handler';
import { CreateLeaveRequestCommand } from '../../src/modules/hr/application/commands/create-leave-request.command';
import { LeaveStatus, LeaveType } from '../../src/modules/hr/domain/aggregates/leave-request.aggregate';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findLeaveById: jest.fn(),
    updateLeave: jest.fn(),
    saveLeave: jest.fn().mockResolvedValue(Ok({})),
    findLeaves: jest.fn(),
    getLeaveBalance: jest.fn(),
    getLeaveStats: jest.fn(),
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

const annualBalance = (remaining: number) => Ok({
  annual: { used: 21 - remaining, remaining, total: 21 },
  sick: { used: 0 },
  maternity: { used: 0 },
});

describe('CreateLeaveRequestHandler', () => {
  const start = new Date('2026-07-06'); // Monday
  const end = new Date('2026-07-10');   // Friday → 5 working days

  it('returns Err when leave balance lookup fails for ANNUAL leave', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(Err('balance fetch failed'));
    const handler = new CreateLeaveRequestHandler(repo);

    const r = await handler.execute(new CreateLeaveRequestCommand(
      'emp-1', 'user-1', LeaveType.ANNUAL, start, end, 'vacation',
    ));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/balance/i);
  });

  it('returns Err when requested annual days exceed remaining balance', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(annualBalance(2)); // remaining=2 < 5
    const handler = new CreateLeaveRequestHandler(repo);

    const r = await handler.execute(new CreateLeaveRequestCommand(
      'emp-1', 'user-1', LeaveType.ANNUAL, start, end, 'vacation',
    ));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/Insufficient/);
    expect(repo.saveLeave).not.toHaveBeenCalled();
  });

  it('skips balance check for non-ANNUAL leave types and persists request', async () => {
    const repo = makeRepo();
    const handler = new CreateLeaveRequestHandler(repo);

    const r = await handler.execute(new CreateLeaveRequestCommand(
      'emp-1', 'user-1', LeaveType.SICK, start, end, 'flu',
    ));

    expect(r.ok).toBe(true);
    expect(repo.getLeaveBalance).not.toHaveBeenCalled();
    expect(repo.saveLeave).toHaveBeenCalledTimes(1);
  });

  it('persists pending leave with calculated working days when balance is sufficient', async () => {
    const repo = makeRepo();
    repo.getLeaveBalance.mockResolvedValue(annualBalance(20));
    const handler = new CreateLeaveRequestHandler(repo);

    const r = await handler.execute(new CreateLeaveRequestCommand(
      'emp-1', 'user-1', LeaveType.ANNUAL, start, end, 'vacation',
    ));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe(LeaveStatus.PENDING);
      expect(r.data.daysRequested).toBe(5);
    }
    expect(repo.saveLeave).toHaveBeenCalledTimes(1);
  });

  it('returns Err when repo.saveLeave persistence fails', async () => {
    const repo = makeRepo();
    repo.saveLeave.mockResolvedValue(Err('insert failed'));
    const handler = new CreateLeaveRequestHandler(repo);

    const r = await handler.execute(new CreateLeaveRequestCommand(
      'emp-1', 'user-1', LeaveType.SICK, start, end, 'flu',
    ));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/Failed to save/);
  });
});
