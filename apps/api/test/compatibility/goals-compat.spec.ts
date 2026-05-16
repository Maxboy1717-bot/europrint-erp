/**
 * @module goals-compat.spec
 * @description Unit tests for GoalsCompatController.
 */

import { Test } from '@nestjs/testing';
import { GoalsCompatController } from '../../src/modules/compatibility/goals-compat.controller';
import { GoalsCompatService } from '../../src/modules/compatibility/goals-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('GoalsCompatController', () => {
  let ctrl: GoalsCompatController;
  let svc: jest.Mocked<Partial<GoalsCompatService>>;

  beforeEach(async () => {
    svc = {
      getGoals: jest.fn(), createGoal: jest.fn(),
      getGoal: jest.fn(), updateGoal: jest.fn(), deleteGoal: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [GoalsCompatController],
      providers: [{ provide: GoalsCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(GoalsCompatController);
  });

  it('getGoals forwards all filters', async () => {
    (svc.getGoals as jest.Mock).mockResolvedValue(ok([{ id: 'g1' }]));
    await ctrl.getGoals('active', 'sales', 'individual', '10');
    expect(svc.getGoals).toHaveBeenCalledWith('active', 'sales', 'individual', '10');
  });

  it('createGoal persists and returns id', async () => {
    (svc.createGoal as jest.Mock).mockResolvedValue(ok({ id: 'g2' }));
    expect(await ctrl.createGoal({ title: 'Sales' })).toEqual({ id: 'g2' });
  });

  it('getGoal returns service payload', async () => {
    (svc.getGoal as jest.Mock).mockResolvedValue(ok({ id: 'g1', title: 'X' }));
    expect(await ctrl.getGoal('g1')).toEqual({ id: 'g1', title: 'X' });
  });

  it('getGoal throws on error', async () => {
    (svc.getGoal as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getGoal('g99')).rejects.toThrow(InternalServerErrorException);
  });

  it('updateGoal forwards body to service', async () => {
    (svc.updateGoal as jest.Mock).mockResolvedValue(ok({ id: 'g1', completed: true }));
    await ctrl.updateGoal('g1', { completed: true });
    expect(svc.updateGoal).toHaveBeenCalledWith('g1', { completed: true });
  });

  it('deleteGoal returns ok payload', async () => {
    (svc.deleteGoal as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteGoal('g1')).toEqual({ deleted: true });
  });
});
