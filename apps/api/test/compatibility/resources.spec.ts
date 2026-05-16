/**
 * @module resources.spec
 * @description Unit tests for WarehousesCompatController from resources.controller.ts.
 */

import { Test } from '@nestjs/testing';
import { WarehousesCompatController } from '../../src/modules/compatibility/resources.controller';
import { ResourcesCompatService } from '../../src/modules/compatibility/resources.service';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });

describe('WarehousesCompatController', () => {
  let ctrl: WarehousesCompatController;
  let svc: jest.Mocked<Partial<ResourcesCompatService>>;

  beforeEach(async () => {
    svc = {
      getWarehouses: jest.fn(), getWarehouse: jest.fn(),
      createWarehouse: jest.fn(), updateWarehouse: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WarehousesCompatController],
      providers: [{ provide: ResourcesCompatService, useValue: svc }],
    }).compile();
    ctrl = mod.get(WarehousesCompatController);
  });

  it('getAll forwards pagination params', async () => {
    (svc.getWarehouses as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.getAll('1', '20');
    expect(svc.getWarehouses).toHaveBeenCalledWith('1', '20');
  });

  it('getAll returns service payload', async () => {
    (svc.getWarehouses as jest.Mock).mockResolvedValue(ok({ items: [{ id: 'w1' }], total: 1 }));
    expect(await ctrl.getAll()).toEqual({ items: [{ id: 'w1' }], total: 1 });
  });

  it('getOne returns warehouse', async () => {
    (svc.getWarehouse as jest.Mock).mockResolvedValue(ok({ id: 'w1', name: 'Main' }));
    expect(await ctrl.getOne('w1')).toEqual({ id: 'w1', name: 'Main' });
  });

  it('getOne throws on service error', async () => {
    (svc.getWarehouse as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getOne('w99')).rejects.toThrow(InternalServerErrorException);
  });

  it('create persists and returns id', async () => {
    (svc.createWarehouse as jest.Mock).mockResolvedValue(ok({ id: 'w2' }));
    expect(await ctrl.create({ name: 'New', code: 'WH2' } as never)).toEqual({ id: 'w2' });
  });

  it('update forwards body to service', async () => {
    (svc.updateWarehouse as jest.Mock).mockResolvedValue(ok({ id: 'w1', name: 'Updated' }));
    await ctrl.update('w1', { name: 'Updated' } as never);
    expect(svc.updateWarehouse).toHaveBeenCalledWith('w1', { name: 'Updated' });
  });
});
