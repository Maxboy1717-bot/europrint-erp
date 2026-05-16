/**
 * @module fi.spec
 * @description Unit tests for FiController.
 */

import { Test } from '@nestjs/testing';
import { FiController } from '../../src/modules/remaining/fi.controller';
import { FiService } from '../../src/modules/remaining/fi.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('FiController', () => {
  let ctrl: FiController;
  let svc: jest.Mocked<Partial<FiService>>;

  beforeEach(async () => {
    svc = {
      getStats: jest.fn(), getRecentTransactions: jest.fn(),
      getCostCenters: jest.fn(), getCostCenter: jest.fn(),
      createCostCenter: jest.fn(), updateCostCenter: jest.fn(), deleteCostCenter: jest.fn(),
      getProfitCenters: jest.fn(), getProfitCenter: jest.fn(),
      createProfitCenter: jest.fn(), updateProfitCenter: jest.fn(), deleteProfitCenter: jest.fn(),
      getGlDocuments: jest.fn(), createGlDocument: jest.fn(),
      getGlEntries: jest.fn(), getInvoices: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [FiController],
      providers: [{ provide: FiService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(FiController);
  });

  it('getStats returns finance KPI', async () => {
    (svc.getStats as jest.Mock).mockResolvedValue(ok({ revenue: 100 }));
    expect(await ctrl.getStats()).toEqual({ revenue: 100 });
  });

  it('getRecentTransactions throws on service error', async () => {
    (svc.getRecentTransactions as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getRecentTransactions()).rejects.toThrow(InternalServerErrorException);
  });

  it('getCostCenters returns list', async () => {
    (svc.getCostCenters as jest.Mock).mockResolvedValue(ok([{ id: 'cc1' }]));
    expect(await ctrl.getCostCenters()).toEqual([{ id: 'cc1' }]);
  });

  it('createCostCenter persists and returns id', async () => {
    (svc.createCostCenter as jest.Mock).mockResolvedValue(ok({ id: 'cc2' }));
    expect(await ctrl.createCostCenter({ name: 'A' } as never)).toEqual({ id: 'cc2' });
  });

  it('updateCostCenter forwards body', async () => {
    (svc.updateCostCenter as jest.Mock).mockResolvedValue(ok({ id: 'cc1', name: 'X' }));
    await ctrl.updateCostCenter('cc1', { name: 'X' } as never);
    expect(svc.updateCostCenter).toHaveBeenCalledWith('cc1', { name: 'X' });
  });

  it('deleteCostCenter returns service payload', async () => {
    (svc.deleteCostCenter as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteCostCenter('cc1')).toEqual({ deleted: true });
  });

  it('getGlEntries parses page and limit with defaults', async () => {
    (svc.getGlEntries as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getGlEntries();
    expect(svc.getGlEntries).toHaveBeenCalledWith(1, 20);
  });

  it('getGlEntries parses provided page and limit', async () => {
    (svc.getGlEntries as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getGlEntries('2', '50');
    expect(svc.getGlEntries).toHaveBeenCalledWith(2, 50);
  });

  it('getInvoices forwards pagination', async () => {
    (svc.getInvoices as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.getInvoices('3', '10');
    expect(svc.getInvoices).toHaveBeenCalledWith(3, 10);
  });

  it('createProfitCenter delegates to service', async () => {
    (svc.createProfitCenter as jest.Mock).mockResolvedValue(ok({ id: 'pc1' }));
    expect(await ctrl.createProfitCenter({ name: 'B' } as never)).toEqual({ id: 'pc1' });
  });
});
