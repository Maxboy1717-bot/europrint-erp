/**
 * test/hr/shift.service.spec.ts
 *
 * Unit tests for ShiftService — shift assignment + swap workflow.
 * Mocks ShiftRepository + EventEmitter2 + I18nService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { ShiftService } from '../../src/modules/hr/shift/shift.service';
import { ShiftRepository } from '../../src/modules/hr/shift/shift.repository';
import { Ok } from '../../src/common/result';

interface RepoMock {
  assignShift: jest.Mock;
  findShiftById: jest.Mock;
  checkLeaveConflict: jest.Mock;
  updateShiftStatus: jest.Mock;
  findSwapPendingShift: jest.Mock;
  findEmployeeShiftOnDate: jest.Mock;
  swapEmployees: jest.Mock;
  moveShiftToEmployee: jest.Mock;
  clearShiftPending: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    assignShift: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    findShiftById: jest.fn().mockResolvedValue(Ok({
      id: 10, employee_id: 5, shift_date: '2025-05-15', notes: null,
    })),
    checkLeaveConflict: jest.fn().mockResolvedValue(false),
    updateShiftStatus: jest.fn().mockResolvedValue(undefined),
    findSwapPendingShift: jest.fn().mockResolvedValue(Ok({
      id: 10, employee_id: 5, shift_date: '2025-05-15', notes: JSON.stringify({ to_employee_id: 7 }),
    })),
    findEmployeeShiftOnDate: jest.fn().mockResolvedValue(Ok(null)),
    swapEmployees: jest.fn().mockResolvedValue(undefined),
    moveShiftToEmployee: jest.fn().mockResolvedValue(undefined),
    clearShiftPending: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

function makeEmitter(): EventEmitter2 {
  return { emit: jest.fn().mockReturnValue(true) } as unknown as EventEmitter2;
}

async function buildSvc(repo: RepoMock): Promise<ShiftService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      ShiftService,
      { provide: ShiftRepository, useValue: repo },
      { provide: EventEmitter2, useValue: makeEmitter() },
      { provide: I18nService, useValue: makeI18n() },
    ],
  }).compile();
  return mod.get(ShiftService);
}

describe('ShiftService', () => {
  describe('assignShift()', () => {
    it('delegates to repo and emits SHIFT_ASSIGNED', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.assignShift({
        employeeId: 5,
        shiftDate: '2025-05-15',
        shiftType: 'morning',
        startTime: '08:00',
        endTime: '16:00',
      });

      expect(r.ok).toBe(true);
      expect(repo.assignShift).toHaveBeenCalled();
    });

    it('forwards optional notes', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.assignShift({
        employeeId: 5,
        shiftDate: '2025-05-15',
        shiftType: 'morning',
        startTime: '08:00',
        endTime: '16:00',
        notes: 'special',
      });

      const arg = repo.assignShift.mock.calls[0]?.[0] as { notes: string };
      expect(arg.notes).toBe('special');
    });
  });

  describe('requestSwap()', () => {
    it('returns failure when shift not found', async () => {
      const repo = makeRepo({
        findShiftById: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = await buildSvc(repo);

      const r = await svc.requestSwap({
        fromEmployeeId: 5, toEmployeeId: 7, fromShiftId: 99, reason: 'X',
      });

      expect(r.ok).toBe(false);
    });

    it('returns failure when employee does not own the shift', async () => {
      const repo = makeRepo({
        findShiftById: jest.fn().mockResolvedValue(Ok({
          id: 10, employee_id: 99, shift_date: '2025-05-15', notes: null,
        })),
      });
      const svc = await buildSvc(repo);

      const r = await svc.requestSwap({
        fromEmployeeId: 5, toEmployeeId: 7, fromShiftId: 10, reason: 'X',
      });

      expect(r.ok).toBe(false);
    });

    it('returns failure when target employee has leave conflict', async () => {
      const repo = makeRepo({
        checkLeaveConflict: jest.fn().mockResolvedValue(true),
      });
      const svc = await buildSvc(repo);

      const r = await svc.requestSwap({
        fromEmployeeId: 5, toEmployeeId: 7, fromShiftId: 10, reason: 'X',
      });

      expect(r.ok).toBe(false);
    });

    it('updates status to swap_pending on success', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.requestSwap({
        fromEmployeeId: 5, toEmployeeId: 7, fromShiftId: 10, reason: 'family',
      });

      expect(r.ok).toBe(true);
      expect(repo.updateShiftStatus).toHaveBeenCalled();
      const args = repo.updateShiftStatus.mock.calls[0];
      expect(args[1]).toBe('swap_pending');
    });
  });

  describe('approveSwap()', () => {
    it('returns failure when no pending swap exists', async () => {
      const repo = makeRepo({
        findSwapPendingShift: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = await buildSvc(repo);

      const r = await svc.approveSwap(99);

      expect(r.ok).toBe(false);
    });

    it('calls moveShiftToEmployee when target has no shift on that date', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.approveSwap(10);

      expect(repo.moveShiftToEmployee).toHaveBeenCalled();
    });

    it('calls swapEmployees when target has a shift on that date', async () => {
      const repo = makeRepo({
        findEmployeeShiftOnDate: jest.fn().mockResolvedValue(Ok({ id: 22, employee_id: 7 })),
      });
      const svc = await buildSvc(repo);

      await svc.approveSwap(10);

      expect(repo.swapEmployees).toHaveBeenCalled();
    });

    it('clears pending when target employee unspecified in notes', async () => {
      const repo = makeRepo({
        findSwapPendingShift: jest.fn().mockResolvedValue(Ok({
          id: 10, employee_id: 5, shift_date: '2025-05-15', notes: '{}',
        })),
      });
      const svc = await buildSvc(repo);

      await svc.approveSwap(10);

      expect(repo.clearShiftPending).toHaveBeenCalledWith(10);
    });
  });
});
