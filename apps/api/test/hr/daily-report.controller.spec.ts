/**
 * daily-report.controller.spec.ts — Phase 4 Task 4.1
 *
 * Covers the 4 routes that DailyReportPage.tsx depends on:
 *   - GET /hr-v2/daily-reports/employee?employeeId=&limit=  (was a stub)
 *   - GET /hr-v2/daily-reports/stats?date=
 *   - GET /hr-v2/daily-reports/department/:id?date=         (was a stub)
 *   - GET /hr-v2/daily-reports/by-date?type=&limit=         (didn't filter)
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DailyReportController } from '../../src/modules/hr/daily-report/daily-report.controller';
import { DailyReportService } from '../../src/modules/hr/daily-report/daily-report.service';
import { Ok as ok, Err as err, AppErr } from '../../src/common/result';

describe('DailyReportController — broken-API repair (Phase 4 Task 4.1)', () => {
  let controller: DailyReportController;
  let svc: jest.Mocked<DailyReportService>;

  beforeEach(() => {
    svc = {
      submitReport: jest.fn(),
      hrOverride: jest.fn(),
      getStats: jest.fn(),
      getByEmployee: jest.fn(),
      getByDate: jest.fn(),
      getByDepartment: jest.fn(),
    } as unknown as jest.Mocked<DailyReportService>;
    controller = new DailyReportController(svc);
  });

  // ------------------------------------------------------------------
  // GET /employee?employeeId=&limit= (was a stub returning { data: [] })
  // ------------------------------------------------------------------
  describe('byEmployeeQuery', () => {
    it('returns real rows for valid employeeId', async () => {
      const rows = [
        { id: 1, employee_id: 7, report_date: '2026-05-17', status: 'submitted' },
        { id: 2, employee_id: 7, report_date: '2026-05-16', status: 'submitted' },
      ];
      svc.getByEmployee.mockResolvedValue(ok(rows));

      const out = await controller.byEmployeeQuery('7', '14');

      expect(svc.getByEmployee).toHaveBeenCalledWith(7, 14);
      expect(out).toEqual(rows);
    });

    it('rejects missing employeeId with BadRequest', async () => {
      await expect(controller.byEmployeeQuery('', undefined)).rejects.toBeInstanceOf(BadRequestException);
      expect(svc.getByEmployee).not.toHaveBeenCalled();
    });

    it('rejects non-numeric employeeId with BadRequest', async () => {
      await expect(controller.byEmployeeQuery('abc', '14')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects zero / negative employeeId', async () => {
      await expect(controller.byEmployeeQuery('0', '14')).rejects.toBeInstanceOf(BadRequestException);
      await expect(controller.byEmployeeQuery('-3', '14')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uses default limit (30) when omitted', async () => {
      svc.getByEmployee.mockResolvedValue(ok([]));
      await controller.byEmployeeQuery('7', undefined);
      expect(svc.getByEmployee).toHaveBeenCalledWith(7, 30);
    });

    it('clamps limit to 365 maximum', async () => {
      svc.getByEmployee.mockResolvedValue(ok([]));
      await controller.byEmployeeQuery('7', '9999');
      expect(svc.getByEmployee).toHaveBeenCalledWith(7, 365);
    });

    it('propagates repository errors as HTTP exceptions', async () => {
      svc.getByEmployee.mockResolvedValue(err(AppErr('NOT_FOUND', 'employee missing')));
      await expect(controller.byEmployeeQuery('99', '14')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ------------------------------------------------------------------
  // GET /department/:id?date= (was a stub)
  // ------------------------------------------------------------------
  describe('byDepartment', () => {
    it('returns { submitted, missing } snapshot for department', async () => {
      const snapshot = {
        submitted: [{ id: 11, first_name: 'A', last_name: 'B', employee_code: 'E1', status: 'submitted' }],
        missing:   [{ id: 12, first_name: 'C', last_name: 'D', employee_code: 'E2' }],
      };
      svc.getByDepartment.mockResolvedValue(ok(snapshot));

      const out = await controller.byDepartment(3, '2026-05-17');

      expect(svc.getByDepartment).toHaveBeenCalledWith(3, '2026-05-17');
      expect(out).toEqual(snapshot);
    });

    it('defaults date to today when omitted', async () => {
      const snap = { submitted: [], missing: [] };
      svc.getByDepartment.mockResolvedValue(ok(snap));
      await controller.byDepartment(3, undefined);

      const [, dateArg] = svc.getByDepartment.mock.calls[0];
      expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('propagates DB errors', async () => {
      svc.getByDepartment.mockResolvedValue(err(AppErr('INTERNAL', 'db down')));
      await expect(controller.byDepartment(3, '2026-05-17')).rejects.toThrow();
    });
  });

  // ------------------------------------------------------------------
  // GET /by-date?type=&limit= (didn't filter)
  // ------------------------------------------------------------------
  describe('byDate', () => {
    it('passes through type=operator filter', async () => {
      svc.getByDate.mockResolvedValue(ok([]));
      await controller.byDate('2026-05-17', 'operator', '100');
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'operator', 100);
    });

    it('passes through type=office filter', async () => {
      svc.getByDate.mockResolvedValue(ok([]));
      await controller.byDate('2026-05-17', 'office', '100');
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'office', 100);
    });

    it('normalizes unknown type to "all"', async () => {
      svc.getByDate.mockResolvedValue(ok([]));
      await controller.byDate('2026-05-17', 'malicious', '50');
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'all', 50);
    });

    it('defaults type to "all" when omitted', async () => {
      svc.getByDate.mockResolvedValue(ok([]));
      await controller.byDate('2026-05-17', undefined, undefined);
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'all', 100);
    });

    it('clamps limit between 1 and 500', async () => {
      svc.getByDate.mockResolvedValue(ok([]));
      await controller.byDate('2026-05-17', 'all', '9999');
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'all', 500);

      svc.getByDate.mockClear();
      await controller.byDate('2026-05-17', 'all', '-5');
      expect(svc.getByDate).toHaveBeenCalledWith('2026-05-17', 'all', 100); // NaN → default
    });
  });

  // ------------------------------------------------------------------
  // GET /stats?date= (already existed — keep regression test)
  // ------------------------------------------------------------------
  describe('stats', () => {
    it('returns aggregate counts unwrapped from Result', async () => {
      const stats = { submitted_count: 5, absent_count: 1, total_active_employees: 20 };
      svc.getStats.mockResolvedValue(ok(stats));
      const out = await controller.stats('2026-05-17');
      expect(svc.getStats).toHaveBeenCalledWith('2026-05-17');
      expect(out).toEqual(stats);
    });

    it('propagates failures with HTTP exception', async () => {
      svc.getStats.mockResolvedValue(err(AppErr('INTERNAL', 'boom')));
      await expect(controller.stats('2026-05-17')).rejects.toThrow();
    });
  });
});
