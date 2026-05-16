/**
 * @module material-balance.spec
 * @description Unit tests for MaterialBalanceController.
 */

import { Test } from '@nestjs/testing';
import { MaterialBalanceController } from '../../src/modules/remaining/material-balance.controller';
import { MaterialBalanceService } from '../../src/modules/remaining/material-balance.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 3, role: 'manager' };

describe('MaterialBalanceController', () => {
  let ctrl: MaterialBalanceController;
  let svc: jest.Mocked<Partial<MaterialBalanceService>>;

  beforeEach(async () => {
    svc = {
      getOverview: jest.fn(), getAlerts: jest.fn(),
      getInternalRequests: jest.fn(), approveRequest: jest.fn(), issueRequest: jest.fn(),
      getProduction: jest.fn(), takeMaterial: jest.fn(),
      useMaterial: jest.fn(), returnMaterial: jest.fn(),
      negativeStockCheck: jest.fn(), getHistory: jest.fn(),
      getReconciliation: jest.fn(), getByWarehouse: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [MaterialBalanceController],
      providers: [{ provide: MaterialBalanceService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(MaterialBalanceController);
  });

  it('getOverview returns service data', async () => {
    (svc.getOverview as jest.Mock).mockResolvedValue(ok({ stock: 100 }));
    expect(await ctrl.getOverview()).toEqual({ stock: 100 });
  });

  it('getAlerts throws on service error', async () => {
    (svc.getAlerts as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getAlerts()).rejects.toThrow(InternalServerErrorException);
  });

  it('approveRequest forwards id, body and user id', async () => {
    (svc.approveRequest as jest.Mock).mockResolvedValue(ok({ id: 'r1', approved: true }));
    await ctrl.approveRequest('r1', { qty: 5 } as never, USER);
    expect(svc.approveRequest).toHaveBeenCalledWith('r1', { qty: 5 }, 3);
  });

  it('issueRequest delegates id to service', async () => {
    (svc.issueRequest as jest.Mock).mockResolvedValue(ok({ id: 'r1', issued: true }));
    await ctrl.issueRequest('r1');
    expect(svc.issueRequest).toHaveBeenCalledWith('r1');
  });

  it('takeMaterial forwards body', async () => {
    (svc.takeMaterial as jest.Mock).mockResolvedValue(ok({ id: 't1' }));
    await ctrl.takeMaterial({ materialId: 'm1', qty: 1 } as never);
    expect(svc.takeMaterial).toHaveBeenCalledWith({ materialId: 'm1', qty: 1 });
  });

  it('useMaterial returns service payload', async () => {
    (svc.useMaterial as jest.Mock).mockResolvedValue(ok({ id: 'u1' }));
    expect(await ctrl.useMaterial({ materialId: 'm1' } as never)).toEqual({ id: 'u1' });
  });

  it('returnMaterial delegates body to service', async () => {
    (svc.returnMaterial as jest.Mock).mockResolvedValue(ok({ id: 'r1' }));
    await ctrl.returnMaterial({ materialId: 'm1' } as never);
    expect(svc.returnMaterial).toHaveBeenCalledWith({ materialId: 'm1' });
  });

  it('negativeStockCheck returns service payload', async () => {
    (svc.negativeStockCheck as jest.Mock).mockResolvedValue(ok({ negative: 0 }));
    expect(await ctrl.negativeStockCheck()).toEqual({ negative: 0 });
  });

  it('getHistory forwards materialId and query', async () => {
    (svc.getHistory as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getHistory('m1', { from: '2026-01-01' });
    expect(svc.getHistory).toHaveBeenCalledWith('m1', { from: '2026-01-01' });
  });

  it('getByWarehouse forwards warehouse id', async () => {
    (svc.getByWarehouse as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getByWarehouse('w1');
    expect(svc.getByWarehouse).toHaveBeenCalledWith('w1');
  });
});
