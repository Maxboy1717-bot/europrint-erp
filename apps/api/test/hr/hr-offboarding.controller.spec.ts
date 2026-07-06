/**
 * hr-offboarding.controller.spec.ts
 *
 * Direct unit tests for HrOffboardingController.
 * Methods are called directly (bypassing the NestJS HTTP pipeline) so
 * decorators like @Query(), @Body(), @CurrentUser() do NOT apply.
 * We pass plain objects that match what the controller extracts from them.
 *
 * Covers:
 *   - GET  /hr/offboarding/cases?status=  (listCases)
 *   - GET  /hr/offboarding/stats          (getStats)
 *   - GET  /hr/offboarding/cases/:id      (getCase)
 *   - POST /hr/offboarding/cases          (createCase)
 */

import { NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { HrOffboardingController } from '../../src/modules/hr/offboarding/hr-offboarding.controller';
import { HrOffboardingService } from '../../src/modules/hr/offboarding/hr-offboarding.service';
import { Ok as ok, Err as err, AppErr } from '../../src/common/result';

describe('HrOffboardingController', () => {
  let controller: HrOffboardingController;
  let svc: jest.Mocked<HrOffboardingService>;
  const i18n = { t: jest.fn((key: string) => key) } as unknown as I18nService;

  beforeEach(() => {
    svc = {
      listCases:            jest.fn(),
      getStats:             jest.fn(),
      getCaseDetail:        jest.fn(),
      createCase:           jest.fn(),
      updateChecklistItem:  jest.fn(),
      recordExitInterview:  jest.fn(),
      finalizeCase:         jest.fn(),
      cancelCase:           jest.fn(),
    } as unknown as jest.Mocked<HrOffboardingService>;
    controller = new HrOffboardingController(svc, i18n);
  });

  // ─── listCases ────────────────────────────────────────────────────────────
  describe('listCases', () => {
    it('returns rows for matching status filter', async () => {
      const rows = [
        { id: 1, employee_id: 7, status: 'active' },
        { id: 2, employee_id: 8, status: 'active' },
      ];
      svc.listCases.mockResolvedValue(ok(rows));

      // @Query() q: DTO — pass the DTO-shaped object directly
      const out = await controller.listCases({ status: 'active' } as never);

      // P1.18: controller returns { items, total } (not { data })
      expect(svc.listCases).toHaveBeenCalledWith({ status: 'active', employeeId: undefined });
      expect(out).toEqual({ items: rows, total: rows.length });
    });

    it('passes employee_id filter through', async () => {
      svc.listCases.mockResolvedValue(ok([]));
      await controller.listCases({ status: undefined, employee_id: 5 } as never);
      expect(svc.listCases).toHaveBeenCalledWith({ status: undefined, employeeId: 5 });
    });

    it('returns empty items array on empty result', async () => {
      svc.listCases.mockResolvedValue(ok([]));
      const out = await controller.listCases({} as never);
      // P1.18: returns { items: [], total: 0 }
      expect(out).toEqual({ items: [], total: 0 });
    });

    it('returns empty items on repository error (does not throw)', async () => {
      // P1.18: on Err, controller returns { items: [], total: 0 } instead of throwing
      svc.listCases.mockResolvedValue(err(AppErr('INTERNAL', 'boom')));
      const out = await controller.listCases({} as never);
      expect(out).toEqual({ items: [], total: 0 });
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('returns stats object directly (P1.18: FE accesses stats.active/completed/total)', async () => {
      const stats = { active: 3, completed: 5, cancelled: 0 };
      svc.getStats.mockResolvedValue(ok(stats));

      const out = await controller.getStats();

      // P1.18: controller returns the stats object directly, not { data: stats }
      expect(out).toEqual(stats);
    });

    it('returns fallback stats shape on error (does not throw)', async () => {
      // P1.18: on Err, returns { active:0, completed:0, cancelled:0, total:0 } fallback
      svc.getStats.mockResolvedValue(err(AppErr('INTERNAL', 'db down')));
      const out = await controller.getStats();
      expect(out).toEqual({ active: 0, completed: 0, cancelled: 0, total: 0 });
    });
  });

  // ─── getCase ──────────────────────────────────────────────────────────────
  describe('getCase', () => {
    it('returns the case row with checklist_items wrapped in data', async () => {
      const row = { id: 7, employee_id: 42, status: 'active', checklist_items: [{ id: 1, done: false }] };
      svc.getCaseDetail.mockResolvedValue(ok(row));

      const out = await controller.getCase(7);

      expect(svc.getCaseDetail).toHaveBeenCalledWith(7);
      expect(out).toEqual({ data: row });
    });

    it('throws NotFound when case does not exist (getCaseDetail returns Ok(null))', async () => {
      svc.getCaseDetail.mockResolvedValue(ok(null));

      await expect(controller.getCase(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates DB errors via unwrapOrInternal', async () => {
      svc.getCaseDetail.mockResolvedValue(err(AppErr('INTERNAL', 'db down')));
      await expect(controller.getCase(7)).rejects.toThrow();
    });
  });

  // ─── createCase ───────────────────────────────────────────────────────────
  describe('createCase', () => {
    it('creates a case with employee_id + dismissal_type + last_working_day', async () => {
      const created = { id: 11, employee_id: 7, status: 'active', dismissal_type: 'resignation' };
      svc.createCase.mockResolvedValue(ok(created));

      // @Body() body: DTO uses snake_case; @CurrentUser() user is undefined in unit test
      const out = await controller.createCase(
        { employee_id: 7, dismissal_type: 'resignation', last_working_day: '2026-06-01' } as never,
        undefined as never,
      );

      expect(svc.createCase).toHaveBeenCalledWith({
        employeeId:     7,
        initiatedBy:    undefined,
        dismissalType:  'resignation',
        lastWorkingDay: '2026-06-01',
      });
      expect(out).toEqual({ data: created });
    });

    it('passes null lastWorkingDay through to service unchanged', async () => {
      svc.createCase.mockResolvedValue(ok({ id: 12 }));

      await controller.createCase(
        { employee_id: 7, dismissal_type: 'termination', last_working_day: null } as never,
        undefined as never,
      );

      const arg = svc.createCase.mock.calls[0][0];
      expect(arg.lastWorkingDay).toBeNull();
    });

    it('forwards repository failure as HTTP error', async () => {
      svc.createCase.mockResolvedValue(err(AppErr('CONFLICT', 'already exists')));

      await expect(
        controller.createCase({ employee_id: 7, dismissal_type: 'resignation' } as never, undefined as never),
      ).rejects.toThrow();
    });
  });
});
