/**
 * @module barcode-warehouse.spec
 * @description Unit tests for BarcodeWarehouseCompatController.
 */

import { Test } from '@nestjs/testing';
import { BarcodeWarehouseCompatController } from '../../src/modules/compatibility/barcode-warehouse.controller';
import { BarcodeWarehouseCompatService } from '../../src/modules/compatibility/barcode-warehouse.service';
import { BarcodeWarehouseDebtService } from '../../src/modules/compatibility/barcode-warehouse-debt.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('BarcodeWarehouseCompatController', () => {
  let ctrl: BarcodeWarehouseCompatController;
  let svc: jest.Mocked<Partial<BarcodeWarehouseCompatService>>;
  let debt: jest.Mocked<Partial<BarcodeWarehouseDebtService>>;

  beforeEach(async () => {
    svc = {
      getDashboard: jest.fn(), getBarcodes: jest.fn(), qcDecision: jest.fn(),
      getPickingTasks: jest.fn(), getPrintQueue: jest.fn(), getExitLogs: jest.fn(),
      getOperatorBalance: jest.fn(), getCycleCounts: jest.fn(), submitCycleCount: jest.fn(),
      deleteBarcode: jest.fn(), updateBarcode: jest.fn(), receive: jest.fn(),
      productionReceive: jest.fn(), productionComplete: jest.fn(), pickTask: jest.fn(),
      resolveOperatorBalance: jest.fn(), scanBarcodeById: jest.fn(),
      notifySecurityExit: jest.fn(), issueGoods: jest.fn(),
    };
    debt = { getOperatorDebts: jest.fn(), getDebtById: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [BarcodeWarehouseCompatController],
      providers: [
        { provide: BarcodeWarehouseCompatService, useValue: svc },
        { provide: BarcodeWarehouseDebtService, useValue: debt },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(BarcodeWarehouseCompatController);
  });

  it('getDashboard returns service data', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(ok({ stats: [{ k: 'v' }] }));
    expect(await ctrl.getDashboard()).toEqual({ stats: [{ k: 'v' }] });
  });

  it('getDashboard throws 500 on service error', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(err('DB_ERROR', 'db down'));
    await expect(ctrl.getDashboard()).rejects.toThrow(InternalServerErrorException);
  });

  it('getBarcodes forwards status filter', async () => {
    (svc.getBarcodes as jest.Mock).mockResolvedValue(ok([{ id: 'b1' }]));
    await ctrl.getBarcodes('active');
    expect(svc.getBarcodes).toHaveBeenCalledWith('active');
  });

  it('qcDecision passes id and passed flag', async () => {
    (svc.qcDecision as jest.Mock).mockResolvedValue(ok({ id: 'b1', passed: true }));
    await ctrl.qcDecision('b1', { passed: true });
    expect(svc.qcDecision).toHaveBeenCalledWith('b1', true);
  });

  it('submitCycleCount delegates body to service', async () => {
    (svc.submitCycleCount as jest.Mock).mockResolvedValue(ok({ id: 'cc1' }));
    const body = { warehouseId: 'w1', lines: [] };
    await ctrl.submitCycleCount(body as never);
    expect(svc.submitCycleCount).toHaveBeenCalledWith(body);
  });

  it('receive returns created body', async () => {
    (svc.receive as jest.Mock).mockResolvedValue(ok({ id: 'r1' }));
    expect(await ctrl.receive({ itemId: 'i1', qty: 5 } as never)).toEqual({ id: 'r1' });
  });

  it('deleteBarcode forwards id', async () => {
    (svc.deleteBarcode as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    await ctrl.deleteBarcode('b1');
    expect(svc.deleteBarcode).toHaveBeenCalledWith('b1');
  });

  it('getOperatorDebts uses debt service', async () => {
    (debt.getOperatorDebts as jest.Mock).mockResolvedValue(ok([{ id: 'd1' }]));
    expect(await ctrl.getOperatorDebts()).toEqual([{ id: 'd1' }]);
  });

  it('scanBarcodeById invokes service', async () => {
    (svc.scanBarcodeById as jest.Mock).mockResolvedValue(ok({ id: 'b1' }));
    expect(await ctrl.scanBarcodeById('b1')).toEqual({ id: 'b1' });
  });

  it('notifySecurityExit converts notes to string', async () => {
    (svc.notifySecurityExit as jest.Mock).mockResolvedValue(ok({ notified: true }));
    await ctrl.notifySecurityExit('b1', { notes: 'leaving' });
    expect(svc.notifySecurityExit).toHaveBeenCalledWith('b1', 'leaving');
  });

  it('patchDebt returns shallow merge response', async () => {
    const res = await ctrl.patchDebt('d1', { paid: true });
    expect(res).toEqual({ id: 'd1', paid: true, updated: true });
  });
});
