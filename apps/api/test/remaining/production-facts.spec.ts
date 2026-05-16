/**
 * @module production-facts.spec
 * @description Unit tests for ProductionFactsController.
 */

import { Test } from '@nestjs/testing';
import { ProductionFactsController } from '../../src/modules/remaining/production-facts.controller';
import { ProductionFactsService } from '../../src/modules/remaining/production-facts.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('ProductionFactsController', () => {
  let ctrl: ProductionFactsController;
  let svc: jest.Mocked<Partial<ProductionFactsService>>;

  beforeEach(async () => {
    svc = {
      getAll: jest.fn(), getVariance: jest.fn(),
      getOperators: jest.fn(), create: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [ProductionFactsController],
      providers: [{ provide: ProductionFactsService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(ProductionFactsController);
  });

  it('getAll forwards query to service', async () => {
    (svc.getAll as jest.Mock).mockResolvedValue(ok([{ id: 'f1' }]));
    await ctrl.getAll({ date: '2026-01-01' });
    expect(svc.getAll).toHaveBeenCalledWith({ date: '2026-01-01' });
  });

  it('getAll returns service data', async () => {
    (svc.getAll as jest.Mock).mockResolvedValue(ok([{ id: 'f1' }]));
    expect(await ctrl.getAll({})).toEqual([{ id: 'f1' }]);
  });

  it('getVariance forwards query', async () => {
    (svc.getVariance as jest.Mock).mockResolvedValue(ok({ variance: 0.05 }));
    await ctrl.getVariance({ period: 'week' });
    expect(svc.getVariance).toHaveBeenCalledWith({ period: 'week' });
  });

  it('getOperators returns operator list', async () => {
    (svc.getOperators as jest.Mock).mockResolvedValue(ok([{ id: 'op1' }]));
    expect(await ctrl.getOperators()).toEqual([{ id: 'op1' }]);
  });

  it('create persists fact entry', async () => {
    (svc.create as jest.Mock).mockResolvedValue(ok({ id: 'f2' }));
    await ctrl.create({ orderId: 'o1', qty: 100 });
    expect(svc.create).toHaveBeenCalledWith({ orderId: 'o1', qty: 100 });
  });

  it('create throws on service error', async () => {
    (svc.create as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.create({} as never)).rejects.toThrow(InternalServerErrorException);
  });
});
