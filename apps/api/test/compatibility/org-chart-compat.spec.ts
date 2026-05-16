/**
 * @module org-chart-compat.spec
 * @description Unit tests for OrgChartCompatController.
 */

import { Test } from '@nestjs/testing';
import { OrgChartCompatController } from '../../src/modules/compatibility/org-chart-compat.controller';
import { OrgChartCompatService } from '../../src/modules/compatibility/org-chart-compat.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('OrgChartCompatController', () => {
  let ctrl: OrgChartCompatController;
  let svc: jest.Mocked<Partial<OrgChartCompatService>>;

  beforeEach(async () => {
    svc = { getOrgTree: jest.fn(), getOrgFlat: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [OrgChartCompatController],
      providers: [{ provide: OrgChartCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(OrgChartCompatController);
  });

  it('getOrgTree forwards departmentId filter', async () => {
    (svc.getOrgTree as jest.Mock).mockResolvedValue(ok({ id: 'root', children: [] }));
    await ctrl.getOrgTree('d1');
    expect(svc.getOrgTree).toHaveBeenCalledWith('d1');
  });

  it('getOrgTree returns service tree', async () => {
    (svc.getOrgTree as jest.Mock).mockResolvedValue(ok({ id: 'root' }));
    expect(await ctrl.getOrgTree()).toEqual({ id: 'root' });
  });

  it('getOrgTree throws on service error', async () => {
    (svc.getOrgTree as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getOrgTree()).rejects.toThrow(InternalServerErrorException);
  });

  it('getOrgFlat forwards departmentId filter', async () => {
    (svc.getOrgFlat as jest.Mock).mockResolvedValue(ok([{ id: 'd1' }]));
    await ctrl.getOrgFlat('d1');
    expect(svc.getOrgFlat).toHaveBeenCalledWith('d1');
  });

  it('getOrgFlat returns service list', async () => {
    (svc.getOrgFlat as jest.Mock).mockResolvedValue(ok([{ id: 'd1', name: 'IT' }]));
    expect(await ctrl.getOrgFlat()).toEqual([{ id: 'd1', name: 'IT' }]);
  });

  it('getOrgFlat throws on service error', async () => {
    (svc.getOrgFlat as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getOrgFlat()).rejects.toThrow(InternalServerErrorException);
  });
});
