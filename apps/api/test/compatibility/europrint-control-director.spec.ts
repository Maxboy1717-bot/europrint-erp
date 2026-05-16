/**
 * @module europrint-control-director.spec
 * @description Unit tests for EuroprintControlDirectorController.
 */

import { Test } from '@nestjs/testing';
import { EuroprintControlDirectorController } from '../../src/modules/compatibility/europrint-control-director.controller';
import { EuroprintControlDirectorService } from '../../src/modules/compatibility/europrint-control-director.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('EuroprintControlDirectorController', () => {
  let ctrl: EuroprintControlDirectorController;
  let svc: jest.Mocked<Partial<EuroprintControlDirectorService>>;

  beforeEach(async () => {
    svc = {
      getDirectorKpis: jest.fn(), getDirectorSummary: jest.fn(),
      getStatusHistory: jest.fn(), getDeletedRecords: jest.fn(),
      getAccountantBudgets: jest.fn(), getAccountantFinancialSummary: jest.fn(),
      getAccountantKpiValues: jest.fn(), getAccountantPendingPayments: jest.fn(),
      getAccountantDashboard: jest.fn(), restoreDeletedRecord: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [EuroprintControlDirectorController],
      providers: [{ provide: EuroprintControlDirectorService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EuroprintControlDirectorController);
  });

  it('getDirectorKpis returns service data', async () => {
    (svc.getDirectorKpis as jest.Mock).mockResolvedValue(ok({ revenue: 1000 }));
    expect(await ctrl.getDirectorKpis()).toEqual({ revenue: 1000 });
  });

  it('getDirectorKpis throws on service error', async () => {
    (svc.getDirectorKpis as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getDirectorKpis()).rejects.toThrow(InternalServerErrorException);
  });

  it('getDirectorSummary returns service data when ok', async () => {
    (svc.getDirectorSummary as jest.Mock).mockResolvedValue(ok({ summary: 'good', alerts: [] }));
    expect(await ctrl.getDirectorSummary()).toEqual({ summary: 'good', alerts: [] });
  });

  it('getDirectorSummary returns fallback shape on service error', async () => {
    (svc.getDirectorSummary as jest.Mock).mockResolvedValue(err());
    const res = await ctrl.getDirectorSummary();
    expect(res).toMatchObject({ summary: 'N/A', alerts: [] });
  });

  it('getStatusHistory returns array on ok', async () => {
    (svc.getStatusHistory as jest.Mock).mockResolvedValue(ok([{ id: 's1' }]));
    expect(await ctrl.getStatusHistory()).toEqual([{ id: 's1' }]);
  });

  it('getDeletedRecords returns service data', async () => {
    (svc.getDeletedRecords as jest.Mock).mockResolvedValue(ok([{ id: 'd1' }]));
    expect(await ctrl.getDeletedRecords()).toEqual([{ id: 'd1' }]);
  });

  it('getAccountantFinancialSummary returns fallback on error', async () => {
    (svc.getAccountantFinancialSummary as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getAccountantFinancialSummary()).toEqual({ revenue: 0, expenses: 0, profit: 0, cashFlow: 0 });
  });

  it('getAccountantKpiValues wraps array in items+total', async () => {
    (svc.getAccountantKpiValues as jest.Mock).mockResolvedValue(ok([{ id: 'k1' }, { id: 'k2' }]));
    expect(await ctrl.getAccountantKpiValues()).toEqual({ items: [{ id: 'k1' }, { id: 'k2' }], total: 2 });
  });

  it('restoreDeletedRecord delegates to service', async () => {
    (svc.restoreDeletedRecord as jest.Mock).mockResolvedValue(ok({ restored: true }));
    expect(await ctrl.restoreDeletedRecord('d1')).toEqual({ restored: true });
  });

  it('getAccountantBudgets returns service payload', async () => {
    (svc.getAccountantBudgets as jest.Mock).mockResolvedValue(ok([{ id: 'b1' }]));
    expect(await ctrl.getAccountantBudgets()).toEqual([{ id: 'b1' }]);
  });
});
