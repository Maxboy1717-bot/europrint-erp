/**
 * @module succession-compat.spec
 * @description Unit tests for SuccessionCompatController.
 */

import { Test } from '@nestjs/testing';
import { SuccessionCompatController } from '../../src/modules/compatibility/succession-compat.controller';
import { SuccessionCompatService } from '../../src/modules/compatibility/succession-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('SuccessionCompatController', () => {
  let ctrl: SuccessionCompatController;
  let svc: jest.Mocked<Partial<SuccessionCompatService>>;

  beforeEach(async () => {
    svc = {
      getCareerPlans: jest.fn(), createCareerPlan: jest.fn(), updateCareerPlan: jest.fn(),
      getTalentPool: jest.fn(), createTalentPoolEntry: jest.fn(),
      getKeyPositions: jest.fn(), getSuccessionRisks: jest.fn(), getReadinessStats: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [SuccessionCompatController],
      providers: [{ provide: SuccessionCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(SuccessionCompatController);
  });

  it('getCareerPlans forwards employee filter', async () => {
    (svc.getCareerPlans as jest.Mock).mockResolvedValue(ok([{ id: 'c1' }]));
    await ctrl.getCareerPlans('e1');
    expect(svc.getCareerPlans).toHaveBeenCalledWith('e1');
  });

  it('createCareerPlan returns service payload', async () => {
    (svc.createCareerPlan as jest.Mock).mockResolvedValue(ok({ id: 'c2' }));
    expect(await ctrl.createCareerPlan({ employeeId: 'e1' } as never)).toEqual({ id: 'c2' });
  });

  it('updateCareerPlan forwards body', async () => {
    (svc.updateCareerPlan as jest.Mock).mockResolvedValue(ok({ id: 'c1' }));
    await ctrl.updateCareerPlan('c1', { goal: 'manager' } as never);
    expect(svc.updateCareerPlan).toHaveBeenCalledWith('c1', { goal: 'manager' });
  });

  it('getTalentPool forwards readiness filter', async () => {
    (svc.getTalentPool as jest.Mock).mockResolvedValue(ok([{ id: 't1' }]));
    await ctrl.getTalentPool('ready');
    expect(svc.getTalentPool).toHaveBeenCalledWith('ready');
  });

  it('getCandidates routes to talent pool', async () => {
    (svc.getTalentPool as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getCandidates('pos-1');
    expect(svc.getTalentPool).toHaveBeenCalled();
  });

  it('getKeyPositions wraps array in items+total', async () => {
    (svc.getKeyPositions as jest.Mock).mockResolvedValue(ok([{ id: 'p1' }]));
    expect(await ctrl.getKeyPositions()).toEqual({ items: [{ id: 'p1' }], total: 1 });
  });

  it('getSuccessionRisks returns empty wrapper on error', async () => {
    (svc.getSuccessionRisks as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getSuccessionRisks()).toEqual({ items: [], total: 0 });
  });

  it('getReadinessStats returns fallback shape on error', async () => {
    (svc.getReadinessStats as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getReadinessStats()).toEqual({ ready: 0, nearReady: 0, notReady: 0 });
  });

  it('createTalentPoolEntry throws on service error', async () => {
    (svc.createTalentPoolEntry as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.createTalentPoolEntry({} as never)).rejects.toThrow(InternalServerErrorException);
  });
});
