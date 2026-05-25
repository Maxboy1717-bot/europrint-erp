/**
 * @module telegram-admin.spec
 * @description Unit tests for TelegramAdminController.
 */

import { Test } from '@nestjs/testing';
import { TelegramAdminController } from '../../src/modules/compatibility/telegram-admin.controller';
import { TelegramAdminService } from '../../src/modules/compatibility/telegram-admin.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('TelegramAdminController', () => {
  let ctrl: TelegramAdminController;
  let svc: jest.Mocked<Partial<TelegramAdminService>>;

  beforeEach(async () => {
    svc = { getStats: jest.fn(), getUsers: jest.fn(), broadcast: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [TelegramAdminController],
      providers: [{ provide: TelegramAdminService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(TelegramAdminController);
  });

  it('getStats returns service data', async () => {
    (svc.getStats as jest.Mock).mockResolvedValue(ok({ users: 100 }));
    expect(await ctrl.getStats()).toEqual({ users: 100 });
  });

  it('getStats throws BadRequest on service error (unwrapOrBadRequest)', async () => {
    (svc.getStats as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getStats()).rejects.toThrow(BadRequestException);
  });

  it('getUsers returns users list', async () => {
    (svc.getUsers as jest.Mock).mockResolvedValue(ok([{ id: 'u1' }]));
    expect(await ctrl.getUsers()).toEqual([{ id: 'u1' }]);
  });

  it('broadcast validates non-empty message', async () => {
    await expect(ctrl.broadcast({ message: '' })).rejects.toThrow();
  });

  it('broadcast forwards message and target role', async () => {
    (svc.broadcast as jest.Mock).mockResolvedValue(ok({ sent: 5 }));
    await ctrl.broadcast({ message: 'Hello', targetRole: 'manager' });
    expect(svc.broadcast).toHaveBeenCalledWith('Hello', 'manager');
  });

  it('broadcast accepts message without target role', async () => {
    (svc.broadcast as jest.Mock).mockResolvedValue(ok({ sent: 10 }));
    await ctrl.broadcast({ message: 'Broadcast' });
    expect(svc.broadcast).toHaveBeenCalledWith('Broadcast', undefined);
  });

  it('broadcast throws BadRequest on service error', async () => {
    (svc.broadcast as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.broadcast({ message: 'msg' })).rejects.toThrow(BadRequestException);
  });
});
