/**
 * @module cfo.spec
 * @description Unit tests for CfoCompatController.
 */

import { Test } from '@nestjs/testing';
import { CfoCompatController } from '../../src/modules/compatibility/cfo.controller';
import { CfoCompatService } from '../../src/modules/compatibility/cfo.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('CfoCompatController', () => {
  let ctrl: CfoCompatController;
  let svc: jest.Mocked<Partial<CfoCompatService>>;

  beforeEach(async () => {
    svc = {
      getDashboard: jest.fn(), getCashPosition: jest.fn(),
      getProfitability: jest.fn(), getProfitabilityTrend: jest.fn(),
      getFinancialRisk: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [CfoCompatController],
      providers: [{ provide: CfoCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(CfoCompatController);
  });

  it('getDashboard returns dashboard data', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(ok({ kpis: { revenue: 100 } }));
    expect(await ctrl.getDashboard()).toEqual({ kpis: { revenue: 100 } });
  });

  it('getDashboard throws 500 on error', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getDashboard()).rejects.toThrow(InternalServerErrorException);
  });

  it('getCashPosition returns cash balance', async () => {
    (svc.getCashPosition as jest.Mock).mockResolvedValue(ok({ cash: 5000 }));
    expect(await ctrl.getCashPosition()).toEqual({ cash: 5000 });
  });

  it('getProfitability returns margin data', async () => {
    (svc.getProfitability as jest.Mock).mockResolvedValue(ok({ margin: 0.3 }));
    expect(await ctrl.getProfitability()).toEqual({ margin: 0.3 });
  });

  it('getProfitabilityTrend returns trend series', async () => {
    (svc.getProfitabilityTrend as jest.Mock).mockResolvedValue(ok([{ m: '2026-01', v: 0.3 }]));
    expect(await ctrl.getProfitabilityTrend()).toEqual([{ m: '2026-01', v: 0.3 }]);
  });

  it('getFinancialRisk returns risk metrics', async () => {
    (svc.getFinancialRisk as jest.Mock).mockResolvedValue(ok({ risk: 'low' }));
    expect(await ctrl.getFinancialRisk()).toEqual({ risk: 'low' });
  });

  it('getFinancialRisk throws on service error', async () => {
    (svc.getFinancialRisk as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getFinancialRisk()).rejects.toThrow(InternalServerErrorException);
  });
});
