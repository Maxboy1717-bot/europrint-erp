/**
 * test/hr/record-attendance.handler.spec.ts
 *
 * Unit tests for RecordAttendanceHandler. IHrRepo + EventEmitter2 mocked.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RecordAttendanceHandler,
  RecordAttendanceCommand,
} from '../../src/modules/hr/application/commands/record-attendance.handler';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    saveAttendance: jest.fn().mockResolvedValue(Ok({ id: 'att-1' })),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(), save360Feedback: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

function makeBus(): jest.Mocked<EventEmitter2> {
  return { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
}

describe('RecordAttendanceHandler', () => {
  it('persists attendance with status=present when checkInTime is provided', async () => {
    const repo = makeRepo();
    const handler = new RecordAttendanceHandler(repo, makeBus());

    const r = await handler.execute(new RecordAttendanceCommand(
      42, '2026-06-15', new Date('2026-06-15T09:00:00Z'), undefined, 0, 'biometric',
    ));

    expect(r.ok).toBe(true);
    expect(repo.saveAttendance).toHaveBeenCalledWith(expect.objectContaining({
      employeeId: 42,
      status: 'present',
      source: 'biometric',
    }));
  });

  it('persists attendance with status=absent when checkInTime is omitted', async () => {
    const repo = makeRepo();
    const handler = new RecordAttendanceHandler(repo, makeBus());

    await handler.execute(new RecordAttendanceCommand(42, '2026-06-15'));

    expect(repo.saveAttendance).toHaveBeenCalledWith(expect.objectContaining({
      status: 'absent',
    }));
  });

  it('returns Err when repo.saveAttendance fails to persist', async () => {
    const repo = makeRepo();
    repo.saveAttendance.mockResolvedValue(Err('db fail'));
    const bus = makeBus();
    const handler = new RecordAttendanceHandler(repo, bus);

    const r = await handler.execute(new RecordAttendanceCommand(42, '2026-06-15'));

    expect(r.ok).toBe(false);
    expect(bus.emit).not.toHaveBeenCalled();
  });

  it('emits hr.attendance.recorded event on successful persistence', async () => {
    const repo = makeRepo();
    const bus = makeBus();
    const handler = new RecordAttendanceHandler(repo, bus);

    await handler.execute(new RecordAttendanceCommand(42, '2026-06-15'));

    expect(bus.emit).toHaveBeenCalledWith('hr.attendance.recorded', expect.objectContaining({
      employeeId: 42,
      date: '2026-06-15',
    }));
  });

  it('passes overtimeMinutes from command to the repository payload', async () => {
    const repo = makeRepo();
    const handler = new RecordAttendanceHandler(repo, makeBus());

    await handler.execute(new RecordAttendanceCommand(42, '2026-06-15', undefined, undefined, 60));

    expect(repo.saveAttendance).toHaveBeenCalledWith(expect.objectContaining({
      overtimeMinutes: 60,
    }));
  });
});
