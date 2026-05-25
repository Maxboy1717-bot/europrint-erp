/**
 * @module hr-map-compat.spec
 * @description Unit tests for HrMapCompatController.
 */

import { Test } from '@nestjs/testing';
import { HrMapCompatController } from '../../src/modules/compatibility/hr-map-compat.controller';
import { HrMapCompatService } from '../../src/modules/compatibility/hr-map-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('HrMapCompatController', () => {
  let ctrl: HrMapCompatController;
  let svc: jest.Mocked<Partial<HrMapCompatService>>;

  beforeEach(async () => {
    svc = {
      getMapEmployees: jest.fn(), getDepartments: jest.fn(),
      getHeatmap: jest.fn(), getAttendanceToday: jest.fn(),
      filterMap: jest.fn(), getTransportGroups: jest.fn(),
      getMapStats: jest.fn(), getZones: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [HrMapCompatController],
      providers: [{ provide: HrMapCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(HrMapCompatController);
  });

  it('getMapEmployees forwards department and status filters', async () => {
    (svc.getMapEmployees as jest.Mock).mockResolvedValue(ok([{ id: 'e1' }]));
    await ctrl.getMapEmployees('d1', 'active');
    expect(svc.getMapEmployees).toHaveBeenCalledWith('d1', 'active');
  });

  it('getDepartments returns service data', async () => {
    (svc.getDepartments as jest.Mock).mockResolvedValue(ok([{ id: 'd1' }]));
    expect(await ctrl.getDepartments()).toEqual([{ id: 'd1' }]);
  });

  it('getHeatmap forwards metric param', async () => {
    (svc.getHeatmap as jest.Mock).mockResolvedValue(ok([{ x: 1 }]));
    await ctrl.getHeatmap('attendance');
    expect(svc.getHeatmap).toHaveBeenCalledWith('attendance');
  });

  it('getAttendanceToday throws on service error', async () => {
    (svc.getAttendanceToday as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getAttendanceToday()).rejects.toThrow(InternalServerErrorException);
  });

  it('filterMap forwards body to service', async () => {
    (svc.filterMap as jest.Mock).mockResolvedValue(ok([{ id: 'e1' }]));
    await ctrl.filterMap({ zone: 'A' });
    expect(svc.filterMap).toHaveBeenCalledWith({ zone: 'A' });
  });

  it('getTransportGroups returns wrapped list', async () => {
    (svc.getTransportGroups as jest.Mock).mockResolvedValue(ok([{ id: 'g1' }, { id: 'g2' }]));
    expect(await ctrl.getTransportGroups()).toEqual({ items: [{ id: 'g1' }, { id: 'g2' }], total: 2 });
  });

  it('getTransportGroups returns empty list on error', async () => {
    (svc.getTransportGroups as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getTransportGroups()).toEqual({ items: [], total: 0 });
  });

  it('getMapStats returns fallback shape on error', async () => {
    (svc.getMapStats as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getMapStats()).toEqual({ totalEmployees: 0, activeEmployees: 0, totalDepartments: 0, byDepartment: [] });
  });

  it('getZones wraps items+total', async () => {
    (svc.getZones as jest.Mock).mockResolvedValue(ok([{ id: 'z1' }]));
    expect(await ctrl.getZones()).toEqual({ items: [{ id: 'z1' }], total: 1 });
  });
});
