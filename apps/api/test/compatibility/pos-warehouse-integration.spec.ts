/**
 * @module pos-warehouse-integration.spec
 * @description Unit tests for PosWarehouseIntegrationController.
 */

import { Test } from '@nestjs/testing';
import { PosWarehouseIntegrationController } from '../../src/modules/compatibility/pos-warehouse-integration.controller';
import { PosWarehouseIntegrationService } from '../../src/modules/compatibility/pos-warehouse-integration.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 12 };

describe('PosWarehouseIntegrationController', () => {
  let ctrl: PosWarehouseIntegrationController;
  let svc: jest.Mocked<Partial<PosWarehouseIntegrationService>>;

  beforeEach(async () => {
    svc = {
      getRealTimeStock: jest.fn(), findByBarcode: jest.fn(),
      createMovement: jest.fn(), getMovementHistory: jest.fn(),
      getStockAlerts: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [PosWarehouseIntegrationController],
      providers: [{ provide: PosWarehouseIntegrationService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(PosWarehouseIntegrationController);
  });

  it('getStock parses query params', async () => {
    (svc.getRealTimeStock as jest.Mock).mockResolvedValue(ok([{ id: 'm1' }]));
    await ctrl.getStock('3', 'paper', 'true', 'A4');
    expect(svc.getRealTimeStock).toHaveBeenCalledWith({
      warehouseId: 3, category: 'paper', onlyAvailable: true, search: 'A4',
    });
  });

  it('getStock with missing params defaults onlyAvailable to false', async () => {
    (svc.getRealTimeStock as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getStock();
    expect(svc.getRealTimeStock).toHaveBeenCalledWith({
      warehouseId: undefined, category: undefined, onlyAvailable: false, search: undefined,
    });
  });

  it('findByBarcode forwards barcode', async () => {
    (svc.findByBarcode as jest.Mock).mockResolvedValue(ok({ id: 'm1' }));
    await ctrl.findByBarcode('123');
    expect(svc.findByBarcode).toHaveBeenCalledWith('123');
  });

  it('createMovement rejects when movementType missing', async () => {
    await expect(ctrl.createMovement({}, USER)).rejects.toThrow(BadRequestException);
  });

  it('createMovement rejects when materialCardId missing', async () => {
    await expect(ctrl.createMovement({ movementType: 'EXTERNAL_IN' }, USER)).rejects.toThrow(BadRequestException);
  });

  it('createMovement rejects invalid movementType', async () => {
    await expect(ctrl.createMovement({
      movementType: 'INVALID', materialCardId: 1, quantity: 5,
    }, USER)).rejects.toThrow(BadRequestException);
  });

  it('createMovement forwards valid payload to service', async () => {
    (svc.createMovement as jest.Mock).mockResolvedValue(ok({ id: 100 }));
    await ctrl.createMovement({
      movementType: 'EXTERNAL_IN', materialCardId: 1, quantity: 5,
    }, USER);
    expect(svc.createMovement).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'EXTERNAL_IN', materialCardId: 1, quantity: 5, performedBy: 12,
    }));
  });

  it('getMovementHistory parses params and applies default limit', async () => {
    (svc.getMovementHistory as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getMovementHistory('5', '3', 'EXTERNAL_IN');
    expect(svc.getMovementHistory).toHaveBeenCalledWith({
      materialCardId: 5, warehouseId: 3, movementType: 'EXTERNAL_IN', limit: 100,
    });
  });

  it('getStockAlerts throws on service error', async () => {
    (svc.getStockAlerts as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getStockAlerts()).rejects.toThrow(InternalServerErrorException);
  });

  it('getStockAlerts returns alert list', async () => {
    (svc.getStockAlerts as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }]));
    expect(await ctrl.getStockAlerts()).toEqual([{ id: 'a1' }]);
  });
});
