/**
 * @module reports-hub.spec
 * @description Unit tests for ReportsHubController.
 */

import { Test } from '@nestjs/testing';
import { ReportsHubController } from '../../src/modules/remaining/reports-hub.controller';
import { ReportsHubService } from '../../src/modules/remaining/reports-hub.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 11, role: 'manager' };

describe('ReportsHubController', () => {
  let ctrl: ReportsHubController;
  let svc: jest.Mocked<Partial<ReportsHubService>>;

  beforeEach(async () => {
    svc = {
      getDashboard: jest.fn(), getCategories: jest.fn(),
      getDefinitions: jest.fn(), createDefinition: jest.fn(),
      getRuns: jest.fn(), getRun: jest.fn(),
      generateReport: jest.fn(), seedCategories: jest.fn(),
      getSubscriptions: jest.fn(), createSubscription: jest.fn(),
      deleteSubscription: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [ReportsHubController],
      providers: [{ provide: ReportsHubService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(ReportsHubController);
  });

  it('getDashboard returns service data', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(ok({ total: 5 }));
    expect(await ctrl.getDashboard()).toEqual({ total: 5 });
  });

  it('getCategories returns category list', async () => {
    (svc.getCategories as jest.Mock).mockResolvedValue(ok([{ id: 'c1' }]));
    expect(await ctrl.getCategories()).toEqual([{ id: 'c1' }]);
  });

  it('getDefinitions forwards query', async () => {
    (svc.getDefinitions as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getDefinitions({ categoryId: 'c1' });
    expect(svc.getDefinitions).toHaveBeenCalledWith({ categoryId: 'c1' });
  });

  it('createDefinition delegates body', async () => {
    (svc.createDefinition as jest.Mock).mockResolvedValue(ok({ id: 'd1' }));
    await ctrl.createDefinition({ name: 'Sales' });
    expect(svc.createDefinition).toHaveBeenCalledWith({ name: 'Sales' });
  });

  it('getRun returns run by id', async () => {
    (svc.getRun as jest.Mock).mockResolvedValue(ok({ id: 'r1' }));
    expect(await ctrl.getRun('r1')).toEqual({ id: 'r1' });
  });

  it('generateReport forwards definition id and user id', async () => {
    (svc.generateReport as jest.Mock).mockResolvedValue(ok({ runId: 'r2' }));
    await ctrl.generateReport('d1', USER);
    expect(svc.generateReport).toHaveBeenCalledWith('d1', 11);
  });

  it('seedCategories invokes service', async () => {
    (svc.seedCategories as jest.Mock).mockResolvedValue(ok({ seeded: 5 }));
    expect(await ctrl.seedCategories()).toEqual({ seeded: 5 });
  });

  it('getSubscriptions passes user id', async () => {
    (svc.getSubscriptions as jest.Mock).mockResolvedValue(ok([{ id: 's1' }]));
    await ctrl.getSubscriptions(USER);
    expect(svc.getSubscriptions).toHaveBeenCalledWith(11);
  });

  it('createSubscription forwards body and user id', async () => {
    (svc.createSubscription as jest.Mock).mockResolvedValue(ok({ id: 's2' }));
    await ctrl.createSubscription({ definitionId: 'd1' }, USER);
    expect(svc.createSubscription).toHaveBeenCalledWith({ definitionId: 'd1' }, 11);
  });

  it('deleteSubscription forwards id and user id', async () => {
    (svc.deleteSubscription as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    await ctrl.deleteSubscription('s1', USER);
    expect(svc.deleteSubscription).toHaveBeenCalledWith('s1', 11);
  });

  it('getRuns throws on service error', async () => {
    (svc.getRuns as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getRuns({})).rejects.toThrow(InternalServerErrorException);
  });
});
