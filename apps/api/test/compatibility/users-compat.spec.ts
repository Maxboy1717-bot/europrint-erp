/**
 * @module users-compat.spec
 * @description Unit tests for UsersCompatController.
 */

import { Test } from '@nestjs/testing';
import { UsersCompatController } from '../../src/modules/compatibility/users-compat.controller';
import { UsersCompatService } from '../../src/modules/compatibility/users-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('UsersCompatController', () => {
  let ctrl: UsersCompatController;
  let svc: jest.Mocked<Partial<UsersCompatService>>;

  beforeEach(async () => {
    svc = { listUsers: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [UsersCompatController],
      providers: [{ provide: UsersCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(UsersCompatController);
  });

  it('listUsers forwards pagination params', async () => {
    (svc.listUsers as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.listUsers('1', '20', 'ali');
    expect(svc.listUsers).toHaveBeenCalledWith('1', '20', 'ali');
  });

  it('listUsers returns service payload', async () => {
    (svc.listUsers as jest.Mock).mockResolvedValue(ok({ items: [{ id: 'u1' }], total: 1 }));
    expect(await ctrl.listUsers()).toEqual({ items: [{ id: 'u1' }], total: 1 });
  });

  it('listUsers throws on service error', async () => {
    (svc.listUsers as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.listUsers()).rejects.toThrow(InternalServerErrorException);
  });

  it('listUsers handles undefined args', async () => {
    (svc.listUsers as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.listUsers();
    expect(svc.listUsers).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it('listUsers forwards search-only filter', async () => {
    (svc.listUsers as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.listUsers(undefined, undefined, 'jasur');
    expect(svc.listUsers).toHaveBeenCalledWith(undefined, undefined, 'jasur');
  });
});
