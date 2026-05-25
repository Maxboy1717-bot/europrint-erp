/**
 * @module europrint-control.spec
 * @description Unit tests for EuroprintControlCompatController.
 */

import { Test } from '@nestjs/testing';
import { EuroprintControlCompatController } from '../../src/modules/compatibility/europrint-control.controller';
import { EuroprintControlCompatService } from '../../src/modules/compatibility/europrint-control.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('EuroprintControlCompatController', () => {
  let ctrl: EuroprintControlCompatController;
  let svc: jest.Mocked<Partial<EuroprintControlCompatService>>;

  beforeEach(async () => {
    svc = {
      getBusinessRules: jest.fn(), getUnits: jest.fn(), getValidationRules: jest.fn(),
      getKpis: jest.fn(), getAuditorDashboard: jest.fn(),
      getSapPatternsSummary: jest.fn(), getAllRulesSummary: jest.fn(),
      getLogs: jest.fn(), getLogById: jest.fn(), getModuleHealth: jest.fn(),
      getValidationSummary: jest.fn(), getValidationResults: jest.fn(),
      getAuditStats: jest.fn(), getAuditLogs: jest.fn(),
      getActionTypes: jest.fn(), getSourceTypes: jest.fn(), getMenus: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [EuroprintControlCompatController],
      providers: [{ provide: EuroprintControlCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EuroprintControlCompatController);
  });

  it('getBusinessRules returns rules list', async () => {
    (svc.getBusinessRules as jest.Mock).mockResolvedValue(ok([{ id: 'r1' }]));
    expect(await ctrl.getBusinessRules()).toEqual([{ id: 'r1' }]);
  });

  it('getUnits returns service data', async () => {
    (svc.getUnits as jest.Mock).mockResolvedValue(ok([{ code: 'kg' }]));
    expect(await ctrl.getUnits()).toEqual([{ code: 'kg' }]);
  });

  it('getKpis returns kpi list', async () => {
    (svc.getKpis as jest.Mock).mockResolvedValue(ok([{ id: 'k1' }]));
    expect(await ctrl.getKpis()).toEqual([{ id: 'k1' }]);
  });

  it('getLogs forwards filters', async () => {
    (svc.getLogs as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getLogs('order', '2026-01-01', '50');
    expect(svc.getLogs).toHaveBeenCalledWith('order', '2026-01-01', '50');
  });

  it('getLogById delegates id to service', async () => {
    (svc.getLogById as jest.Mock).mockResolvedValue(ok({ id: 'L1' }));
    expect(await ctrl.getLogById('L1')).toEqual({ id: 'L1' });
  });

  it('getValidationResults forwards rule and limit', async () => {
    (svc.getValidationResults as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getValidationResults('rule-1', '10');
    expect(svc.getValidationResults).toHaveBeenCalledWith('rule-1', '10');
  });

  it('getMenus forwards role param', async () => {
    (svc.getMenus as jest.Mock).mockResolvedValue(ok([{ key: 'm1' }]));
    await ctrl.getMenus('admin');
    expect(svc.getMenus).toHaveBeenCalledWith('admin');
  });

  it('getMenusByRole forwards path param', async () => {
    (svc.getMenus as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getMenusByRole('director');
    expect(svc.getMenus).toHaveBeenCalledWith('director');
  });

  it('getAuditStats forwards period filter', async () => {
    (svc.getAuditStats as jest.Mock).mockResolvedValue(ok({ count: 5 }));
    await ctrl.getAuditStats('month');
    expect(svc.getAuditStats).toHaveBeenCalledWith('month');
  });

  it('getActionTypes throws on service error', async () => {
    (svc.getActionTypes as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getActionTypes()).rejects.toThrow(InternalServerErrorException);
  });
});
