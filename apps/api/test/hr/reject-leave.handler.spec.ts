/**
 * test/hr/reject-leave.handler.spec.ts
 *
 * Unit tests for RejectLeaveHandler. IHrRepo mocked.
 */

import { RejectLeaveHandler } from '../../src/modules/hr/application/commands/reject-leave.handler';
import { RejectLeaveCommand } from '../../src/modules/hr/application/commands/reject-leave.command';
import { LeaveStatus, LeaveType } from '../../src/modules/hr/domain/aggregates/leave-request.aggregate';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo, HrRow } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    findLeaveById: jest.fn(),
    updateLeave: jest.fn().mockResolvedValue(Ok({})),
    saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
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

function pendingRow(): HrRow {
  return {
    id: 'lv-1', employeeId: 'emp-1', userId: 'user-1',
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2026-08-01'), endDate: new Date('2026-08-05'),
    daysRequested: 5, status: LeaveStatus.PENDING, reason: 'Trip',
    approvedBy: null, approvedAt: null, rejectedBy: null, rejectionReason: null,
    createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'),
  };
}

describe('RejectLeaveHandler', () => {
  it('returns Err when leave id cannot be found', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Err('not found'));
    const handler = new RejectLeaveHandler(repo);

    const r = await handler.execute(new RejectLeaveCommand('x', 'mgr-1', 'no'));

    expect(r.ok).toBe(false);
  });

  it('returns Err when row data is null', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(null));
    const handler = new RejectLeaveHandler(repo);

    const r = await handler.execute(new RejectLeaveCommand('x', 'mgr-1', 'no'));

    expect(r.ok).toBe(false);
  });

  it('rejects pending leave and records rejector + reason in the aggregate', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow()));
    const handler = new RejectLeaveHandler(repo);

    const r = await handler.execute(new RejectLeaveCommand('lv-1', 'mgr-1', 'Peak season'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe(LeaveStatus.REJECTED);
      expect(r.data.rejectedBy).toBe('mgr-1');
      expect(r.data.rejectionReason).toBe('Peak season');
    }
    expect(repo.updateLeave).toHaveBeenCalledTimes(1);
  });

  it('returns Err when persistence of rejection fails', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingRow()));
    repo.updateLeave.mockResolvedValue(Err('write fail'));
    const handler = new RejectLeaveHandler(repo);

    const r = await handler.execute(new RejectLeaveCommand('lv-1', 'mgr-1', 'busy'));

    expect(r.ok).toBe(false);
  });

  it('throws when row is not in PENDING state (already rejected)', async () => {
    const row = pendingRow();
    row.status = LeaveStatus.REJECTED;
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(row));
    const handler = new RejectLeaveHandler(repo);

    await expect(handler.execute(new RejectLeaveCommand('lv-1', 'mgr-1', 'x'))).rejects.toThrow();
  });
});
