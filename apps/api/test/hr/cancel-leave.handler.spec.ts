/**
 * test/hr/cancel-leave.handler.spec.ts
 *
 * Unit tests for CancelLeaveHandler. IHrRepo mocked.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { CancelLeaveHandler } from '../../src/modules/hr/application/commands/cancel-leave.handler';
import { CancelLeaveCommand } from '../../src/modules/hr/application/commands/cancel-leave.command';
import { LeaveStatus, LeaveType } from '../../src/modules/hr/domain/aggregates/leave-request.aggregate';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo, HrRow } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findLeaveById: jest.fn(),
    updateLeave: jest.fn().mockResolvedValue(Ok({})),
    saveLeave: jest.fn(),
    findLeaves: jest.fn(),
    getLeaveBalance: jest.fn(),
    getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(),
    findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    findAttendance: jest.fn(),
    saveAttendance: jest.fn(),
    getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(),
    savePayroll: jest.fn(),
    updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(),
    save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(),
    findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(),
    findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

function pendingRow(userId = 'user-1'): HrRow {
  return {
    id: 'lv-1', employeeId: 'emp-1', userId,
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-05'),
    daysRequested: 5,
    status: LeaveStatus.PENDING,
    reason: 'Family',
    approvedBy: null, approvedAt: null, rejectedBy: null, rejectionReason: null,
    createdAt: new Date('2026-06-01'), updatedAt: new Date('2026-06-01'),
  };
}

function makeBus(): jest.Mocked<EventEmitter2> {
  return { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
}

describe('CancelLeaveHandler', () => {
  it('returns Err when leave id is not found', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Err('missing'));
    const handler = new CancelLeaveHandler(repo, makeBus());

    const r = await handler.execute(new CancelLeaveCommand('x', 'user-1'));

    expect(r.ok).toBe(false);
  });

  it('returns Err when caller is neither owner nor HR/admin role', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow('user-1')));
    const handler = new CancelLeaveHandler(repo, makeBus());

    const r = await handler.execute(new CancelLeaveCommand('lv-1', 'user-2'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/owner|HR/i);
    expect(repo.updateLeave).not.toHaveBeenCalled();
  });

  it('cancels pending leave when owner requests it', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow('user-1')));
    const handler = new CancelLeaveHandler(repo, makeBus());

    const r = await handler.execute(new CancelLeaveCommand('lv-1', 'user-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe(LeaveStatus.CANCELLED);
    expect(repo.updateLeave).toHaveBeenCalledTimes(1);
  });

  it('allows HR_MANAGER role to cancel another employee\'s leave', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow('user-99')));
    const handler = new CancelLeaveHandler(repo, makeBus());

    const r = await handler.execute(new CancelLeaveCommand('lv-1', 'HR_MANAGER'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe(LeaveStatus.CANCELLED);
  });

  it('returns Err when persistence fails after the cancel transition', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow('user-1')));
    repo.updateLeave.mockResolvedValue(Err('write fail'));
    const handler = new CancelLeaveHandler(repo, makeBus());

    const r = await handler.execute(new CancelLeaveCommand('lv-1', 'user-1'));

    expect(r.ok).toBe(false);
  });
});
