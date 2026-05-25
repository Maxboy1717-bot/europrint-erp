/**
 * @module warehouse-catalog.spec
 * @description Unit tests for WarehouseCatalogController.
 */

import { Test } from '@nestjs/testing';
import { WarehouseCatalogController } from '../../src/modules/compatibility/warehouse-catalog.controller';
import { WarehouseCatalogService } from '../../src/modules/compatibility/warehouse-catalog.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('WarehouseCatalogController', () => {
  let ctrl: WarehouseCatalogController;
  let svc: jest.Mocked<Partial<WarehouseCatalogService>>;

  beforeEach(async () => {
    svc = {
      getMaterials: jest.fn(), getBatchesStats: jest.fn(),
      getBatches: jest.fn(), createBatch: jest.fn(), updateBatch: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WarehouseCatalogController],
      providers: [{ provide: WarehouseCatalogService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(WarehouseCatalogController);
  });

  it('getMaterials forwards search filter', async () => {
    (svc.getMaterials as jest.Mock).mockResolvedValue(ok([{ id: 'm1' }]));
    await ctrl.getMaterials('paper');
    expect(svc.getMaterials).toHaveBeenCalledWith('paper');
  });

  it('getBatchesStats returns service data', async () => {
    (svc.getBatchesStats as jest.Mock).mockResolvedValue(ok({ total: 100 }));
    expect(await ctrl.getBatchesStats()).toEqual({ total: 100 });
  });

  it('getBatches forwards all filters', async () => {
    (svc.getBatches as jest.Mock).mockResolvedValue(ok([{ id: 'b1' }]));
    await ctrl.getBatches('m1', 'w1', 'active', 'A4');
    expect(svc.getBatches).toHaveBeenCalledWith('m1', 'w1', 'active', 'A4');
  });

  it('createBatch persists and returns id', async () => {
    (svc.createBatch as jest.Mock).mockResolvedValue(ok({ id: 'b2' }));
    expect(await ctrl.createBatch({ materialId: 'm1' })).toEqual({ id: 'b2' });
  });

  it('updateBatch forwards id and body', async () => {
    (svc.updateBatch as jest.Mock).mockResolvedValue(ok({ id: 'b1', qty: 99 }));
    await ctrl.updateBatch('b1', { qty: 99 });
    expect(svc.updateBatch).toHaveBeenCalledWith('b1', { qty: 99 });
  });

  it('getMaterials throws on service error', async () => {
    (svc.getMaterials as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getMaterials()).rejects.toThrow(InternalServerErrorException);
  });
});
