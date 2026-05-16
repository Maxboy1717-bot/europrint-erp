/**
 * @module employee-kpi-compat.spec
 * @description Unit tests for EmployeeKpiCompatController.
 */

import { Test } from '@nestjs/testing';
import { EmployeeKpiCompatController } from '../../src/modules/compatibility/employee-kpi-compat.controller';
import { EmployeeKpiCompatService } from '../../src/modules/compatibility/employee-kpi-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('EmployeeKpiCompatController', () => {
  let ctrl: EmployeeKpiCompatController;
  let svc: jest.Mocked<Partial<EmployeeKpiCompatService>>;

  beforeEach(async () => {
    svc = {
      getKpis: jest.fn(), createKpi: jest.fn(), getTopPerformers: jest.fn(),
      getDepartmentSummary: jest.fn(), getZoneHistory: jest.fn(),
      getDailyAttendance: jest.fn(), recordAttendance: jest.fn(),
      getKpi: jest.fn(), updateKpi: jest.fn(), deleteKpi: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [EmployeeKpiCompatController],
      providers: [{ provide: EmployeeKpiCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EmployeeKpiCompatController);
  });

  it('getKpis forwards filters', async () => {
    (svc.getKpis as jest.Mock).mockResolvedValue(ok([{ id: 'k1' }]));
    await ctrl.getKpis('e1', '2026-01', '10');
    expect(svc.getKpis).toHaveBeenCalledWith('e1', '2026-01', '10');
  });

  it('createKpi returns created id', async () => {
    (svc.createKpi as jest.Mock).mockResolvedValue(ok({ id: 'k2' }));
    expect(await ctrl.createKpi({ employeeId: 'e1', value: 10 } as never)).toEqual({ id: 'k2' });
  });

  it('getTopPerformers forwards params', async () => {
    (svc.getTopPerformers as jest.Mock).mockResolvedValue(ok([{ id: 'e1', score: 95 }]));
    await ctrl.getTopPerformers('5', 'month');
    expect(svc.getTopPerformers).toHaveBeenCalledWith('5', 'month');
  });

  it('getDepartmentSummary forwards departmentId', async () => {
    (svc.getDepartmentSummary as jest.Mock).mockResolvedValue(ok({ avg: 80 }));
    await ctrl.getDepartmentSummary('d1');
    expect(svc.getDepartmentSummary).toHaveBeenCalledWith('d1');
  });

  it('getZoneHistory passes employee id and date range', async () => {
    (svc.getZoneHistory as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getZoneHistory('e1', '2026-01-01', '2026-01-31');
    expect(svc.getZoneHistory).toHaveBeenCalledWith('e1', '2026-01-01', '2026-01-31');
  });

  it('recordAttendance returns service payload', async () => {
    (svc.recordAttendance as jest.Mock).mockResolvedValue(ok({ id: 'att1' }));
    expect(await ctrl.recordAttendance({ employeeId: 'e1' } as never)).toEqual({ id: 'att1' });
  });

  it('getKpi throws when service errs', async () => {
    (svc.getKpi as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getKpi('k99')).rejects.toThrow(InternalServerErrorException);
  });

  it('updateKpi forwards body', async () => {
    (svc.updateKpi as jest.Mock).mockResolvedValue(ok({ id: 'k1', value: 20 }));
    await ctrl.updateKpi('k1', { value: 20 } as never);
    expect(svc.updateKpi).toHaveBeenCalledWith('k1', { value: 20 });
  });

  it('deleteKpi returns ok payload', async () => {
    (svc.deleteKpi as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteKpi('k1')).toEqual({ deleted: true });
  });
});
