/**
 * test/hr/approve-leave.handler.spec.ts
 *
 * Unit tests for ApproveLeaveHandler. IHrRepo + EventEmitter2 mocked.
 * The LeaveRequest aggregate is constructed real inside the handler.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApproveLeaveHandler,
  ApproveLeaveCommand,
} from '../../src/modules/hr/application/commands/approve-leave.handler';
import { LeaveStatus, LeaveType } from '../../src/modules/hr/domain/aggregates/leave-request.aggregate';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo, HrRow } from '../../src/modules/hr/domain/repositories/i-hr.repo';
import { leaveRequestFactory } from '../_fixtures/factories';

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

function makeBus(): jest.Mocked<EventEmitter2> {
  return { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
}

function pendingLeaveRow(): HrRow {
  const f = leaveRequestFactory();
  return {
    id: f.id,
    employeeId: f.employeeId,
    userId: f.userId,
    leaveType: LeaveType.ANNUAL,
    startDate: f.startDate,
    endDate: f.endDate,
    daysRequested: f.daysRequested,
    status: LeaveStatus.PENDING,
    reason: f.reason,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
  };
}

describe('ApproveLeaveHandler', () => {
  it('returns Err when leave request id cannot be found', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Err('not in db'));
    const handler = new ApproveLeaveHandler(repo, makeBus());

    const r = await handler.execute(new ApproveLeaveCommand('missing-id', 'mgr-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/not found/i);
  });

  it('returns Err when leave row resolves to null/empty data', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(null));
    const handler = new ApproveLeaveHandler(repo, makeBus());

    const r = await handler.execute(new ApproveLeaveCommand('any', 'mgr-1'));

    expect(r.ok).toBe(false);
  });

  it('returns Err when update persistence fails after approval transition', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingLeaveRow()));
    repo.updateLeave.mockResolvedValue(Err('db down'));
    const handler = new ApproveLeaveHandler(repo, makeBus());

    const r = await handler.execute(new ApproveLeaveCommand('id-1', 'mgr-1'));

    expect(r.ok).toBe(false);
  });

  it('approves pending leave, persists update and emits leave.approved event', async () => {
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(pendingLeaveRow()));
    const bus = makeBus();
    const handler = new ApproveLeaveHandler(repo, bus);

    const r = await handler.execute(new ApproveLeaveCommand('id-1', 'mgr-1'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe(LeaveStatus.APPROVED);
      expect(r.data.approvedBy).toBe('mgr-1');
    }
    expect(repo.updateLeave).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith('leave.approved', expect.any(Object));
  });

  it('throws when leave is not in PENDING state (already approved)', async () => {
    const row = pendingLeaveRow();
    row.status = LeaveStatus.APPROVED;
    const repo = makeRepo();
    repo.findLeaveById.mockResolvedValue(Ok(row));
    const handler = new ApproveLeaveHandler(repo, makeBus());

    await expect(handler.execute(new ApproveLeaveCommand('id-1', 'mgr-1'))).rejects.toThrow();
  });
});
