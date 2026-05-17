/**
 * hr-offboarding.controller.spec.ts — Phase 4 Task 4.4
 *
 * Covers the new GET routes that `HROffboarding.tsx` depends on:
 *   - GET /api/hr/offboarding/cases?status=&search=     (was stub)
 *   - GET /api/hr/offboarding/cases/stats               (was missing)
 *   - GET /api/hr/offboarding/cases/:id                 (was missing)
 *   - POST /api/hr/offboarding/cases                    (was missing)
 */

import { NotFoundException } from '@nestjs/common';
import { HrOffboardingController } from '../../src/modules/hr/offboarding/hr-offboarding.controller';
import { HrOffboardingService } from '../../src/modules/hr/offboarding/hr-offboarding.service';
import { Ok as ok, Err as err, AppErr } from '../../src/common/result';

describe('HrOffboardingController — Phase 4 Task 4.4', () => {
  let controller: HrOffboardingController;
  let svc: jest.Mocked<HrOffboardingService>;

  beforeEach(() => {
    svc = {
      listCases: jest.fn(),
      getStats: jest.fn(),
      getCaseById: jest.fn(),
      createCase: jest.fn(),
      updateChecklistItem: jest.fn(),
      recordExitInterview: jest.fn(),
      finalizeCase: jest.fn(),
    } as unknown as jest.Mocked<HrOffboardingService>;
    controller = new HrOffboardingController(svc);
  });

  describe('listCases', () => {
    it('returns rows for matching status filter', async () => {
      const rows = [
        { id: 1, employee_id: 7, status: 'active', first_name: 'A', last_name: 'B' },
        { id: 2, employee_id: 8, status: 'active', first_name: 'C', last_name: 'D' },
      ];
      svc.listCases.mockResolvedValue(ok(rows));

      const out = await controller.listCases('active', '', undefined);

      expect(svc.listCases).toHaveBeenCalledWith({ status: 'active', search: '', limit: 100 });
      expect(out).toEqual(rows);
    });

    it('passes search filter through', async () => {
      svc.listCases.mockResolvedValue(ok([]));
      await controller.listCases('', 'alisher', '50');
      expect(svc.listCases).toHaveBeenCalledWith({ status: '', search: 'alisher', limit: 50 });
    });

    it('uses default limit (100) when omitted', async () => {
      svc.listCases.mockResolvedValue(ok([]));
      await controller.listCases(undefined, undefined, undefined);
      expect(svc.listCases).toHaveBeenCalledWith({
        status: undefined, search: undefined, limit: 100,
      });
    });

    it('propagates repository errors as HTTP exceptions', async () => {
      svc.listCases.mockResolvedValue(err(AppErr('INTERNAL', 'boom')));
      await expect(controller.listCases('', '', undefined)).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('returns aggregate counts unwrapped from Result', async () => {
      const stats = { active: 3, exit_interviewed: 1, completed: 5, cancelled: 0, total: 9 };
      svc.getStats.mockResolvedValue(ok(stats));
      const out = await controller.getStats();
      expect(out).toEqual(stats);
    });
  });

  describe('getCase', () => {
    it('returns the case row with checklist_items', async () => {
      const row = { id: 7, employee_id: 42, status: 'active', checklist_items: [{ id: 1, done: false }] };
      svc.getCaseById.mockResolvedValue(ok(row));
      const out = await controller.getCase(7);
      expect(out).toEqual(row);
    });

    it('throws NotFound when case does not exist', async () => {
      svc.getCaseById.mockResolvedValue(ok(null));
      await expect(controller.getCase(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates DB errors via http-result mapping', async () => {
      svc.getCaseById.mockResolvedValue(err(AppErr('INTERNAL', 'db down')));
      await expect(controller.getCase(7)).rejects.toThrow();
    });
  });

  describe('createCase', () => {
    it('creates a case with employeeId + dismissalType + lastWorkingDay', async () => {
      const created = { id: 11, employee_id: 7, status: 'active', dismissal_type: 'resignation' };
      svc.createCase.mockResolvedValue(ok(created));

      const out = await controller.createCase({
        employeeId: 7,
        dismissalType: 'resignation',
        lastWorkingDay: '2026-06-01',
      });

      expect(svc.createCase).toHaveBeenCalledWith({
        employeeId: 7,
        initiatedBy: undefined,
        dismissalType: 'resignation',
        lastWorkingDay: '2026-06-01',
        totalItems: undefined,
      });
      expect(out).toEqual(created);
    });

    it('normalizes null lastWorkingDay to undefined when sending to service', async () => {
      svc.createCase.mockResolvedValue(ok({ id: 12 }));
      await controller.createCase({
        employeeId: 7,
        dismissalType: 'termination',
        lastWorkingDay: null,
      });
      const arg = svc.createCase.mock.calls[0][0];
      expect(arg.lastWorkingDay).toBeUndefined();
    });

    it('forwards repository failure as HTTP error', async () => {
      svc.createCase.mockResolvedValue(err(AppErr('CONFLICT', 'already exists')));
      await expect(
        controller.createCase({ employeeId: 7, dismissalType: 'resignation' }),
      ).rejects.toThrow();
    });
  });
});
