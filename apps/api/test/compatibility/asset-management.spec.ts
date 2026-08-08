/**
 * @module asset-management.spec
 * @description Unit tests for AssetManagementController.
 */

import { Test } from '@nestjs/testing';
import { AssetManagementController } from '../../src/modules/compatibility/asset-management.controller';
import { AssetManagementService } from '../../src/modules/compatibility/asset-management.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const UUID = '11111111-1111-1111-1111-111111111111';

describe('AssetManagementController', () => {
  let ctrl: AssetManagementController;
  let svc: jest.Mocked<Partial<AssetManagementService>>;

  beforeEach(async () => {
    svc = {
      getAssets: jest.fn(), createAsset: jest.fn(), getSummary: jest.fn(),
      getAssetById: jest.fn(), updateAsset: jest.fn(), deleteAsset: jest.fn(),
      getMaintenance: jest.fn(), createMaintenance: jest.fn(),
      getDisposals: jest.fn(), createDisposal: jest.fn(),
      getTransfers: jest.fn(), createTransfer: jest.fn(),
      getInsurance: jest.fn(), getInsuranceExpiringSoon: jest.fn(),
      // depreciate route now delegates to svc.depreciateAsset (not a local stub)
      depreciateAsset: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [AssetManagementController],
      providers: [{ provide: AssetManagementService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(AssetManagementController);
  });

  it('getAssets returns service data and forwards filters', async () => {
    (svc.getAssets as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }]));
    expect(await ctrl.getAssets('active', 'equipment')).toEqual([{ id: 'a1' }]);
    expect(svc.getAssets).toHaveBeenCalledWith('active', 'equipment');
  });

  it('createAsset validates required name and returns created asset', async () => {
    (svc.createAsset as jest.Mock).mockResolvedValue(ok({ id: 'a2', name: 'Printer' }));
    expect(await ctrl.createAsset({ name: 'Printer' })).toEqual({ id: 'a2', name: 'Printer' });
  });

  it('createAsset rejects invalid body (empty name)', async () => {
    await expect(ctrl.createAsset({ name: '' })).rejects.toThrow();
  });

  it('getAssetById throws NotFound when service errs', async () => {
    (svc.getAssetById as jest.Mock).mockResolvedValue(err('NOT_FOUND', 'no'));
    await expect(ctrl.getAssetById('a99')).rejects.toThrow(NotFoundException);
  });

  it('updateAsset accepts partial body', async () => {
    (svc.updateAsset as jest.Mock).mockResolvedValue(ok({ id: 'a1', name: 'X' }));
    expect(await ctrl.updateAsset('a1', { name: 'X' })).toEqual({ id: 'a1', name: 'X' });
  });

  it('deleteAsset returns ok when service ok', async () => {
    (svc.deleteAsset as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteAsset('a1')).toEqual({ deleted: true });
  });

  it('createMaintenance validates assetId UUID format', async () => {
    await expect(ctrl.createMaintenance({ assetId: 'not-a-uuid' })).rejects.toThrow();
  });

  it('createMaintenance succeeds with valid UUID', async () => {
    (svc.createMaintenance as jest.Mock).mockResolvedValue(ok({ id: 'm1' }));
    expect(await ctrl.createMaintenance({ assetId: UUID })).toEqual({ id: 'm1' });
  });

  it('createDisposal forwards parsed dto', async () => {
    (svc.createDisposal as jest.Mock).mockResolvedValue(ok({ id: 'd1' }));
    await ctrl.createDisposal({ assetId: UUID, disposalType: 'sold' });
    expect(svc.createDisposal).toHaveBeenCalledWith(expect.objectContaining({ assetId: UUID }));
  });

  it('getInsurance returns wrapped items+total', async () => {
    (svc.getInsurance as jest.Mock).mockResolvedValue(ok([{ id: 'i1' }, { id: 'i2' }]));
    expect(await ctrl.getInsurance({})).toEqual({ items: [{ id: 'i1' }, { id: 'i2' }], total: 2 });
  });

  it('getInsurance returns empty wrapper on service error', async () => {
    (svc.getInsurance as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getInsurance({})).toEqual({ items: [], total: 0 });
  });

  it('depreciate delegates to svc.depreciateAsset and returns service payload', async () => {
    // Controller now calls svc.depreciateAsset(id) — no longer a local stub.
    (svc.depreciateAsset as jest.Mock).mockResolvedValue(ok({ id: 'a1', depreciated: true }));
    const result = await ctrl.depreciate('a1');
    expect(svc.depreciateAsset).toHaveBeenCalledWith('a1');
    expect(result).toEqual({ id: 'a1', depreciated: true });
  });
});
