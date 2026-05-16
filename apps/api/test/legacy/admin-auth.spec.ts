/**
 * @module admin-auth.spec
 * @description Unit tests for AdminAuthController (legacy).
 */

import { Test } from '@nestjs/testing';
import { AdminAuthController } from '../../src/modules/legacy/controllers/admin-auth.controller';
import { LegacyService } from '../../src/modules/legacy/services/legacy.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

describe('AdminAuthController', () => {
  let ctrl: AdminAuthController;
  let legacySvc: jest.Mocked<Partial<LegacyService>>;
  let jwtSvc: { verify: jest.Mock; sign: jest.Mock };
  let configSvc: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    legacySvc = { findAdminById: jest.fn() };
    jwtSvc = { verify: jest.fn(), sign: jest.fn() };
    configSvc = { getOrThrow: jest.fn(() => 'refresh-secret') };

    const mod = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        { provide: LegacyService, useValue: legacySvc },
        { provide: JwtService, useValue: jwtSvc },
        { provide: ConfigService, useValue: configSvc },
      ],
    }).compile();

    ctrl = mod.get(AdminAuthController);
  });

  it('refreshToken uses JWT_REFRESH_SECRET via ConfigService.getOrThrow', async () => {
    jwtSvc.verify.mockReturnValue({ id: 1 });
    (legacySvc.findAdminById as jest.Mock).mockResolvedValue({ id: 1, username: 'admin', role: 'admin', name: 'Admin' });
    jwtSvc.sign.mockReturnValue('NEW.TOKEN');

    await ctrl.refreshToken({ refreshToken: 'OLD.TOKEN' });
    expect(configSvc.getOrThrow).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
    expect(jwtSvc.verify).toHaveBeenCalledWith('OLD.TOKEN', { secret: 'refresh-secret' });
  });

  it('refreshToken returns new accessToken on success', async () => {
    jwtSvc.verify.mockReturnValue({ id: 2 });
    (legacySvc.findAdminById as jest.Mock).mockResolvedValue({ id: 2, username: 'super', role: 'super_admin', name: 'Sup' });
    jwtSvc.sign.mockReturnValue('ACCESS.TOKEN');
    const res = await ctrl.refreshToken({ refreshToken: 'r1' });
    expect(res).toEqual({ accessToken: 'ACCESS.TOKEN' });
  });

  it('refreshToken signs token with admin claims and 24h expiry', async () => {
    jwtSvc.verify.mockReturnValue({ id: 5 });
    (legacySvc.findAdminById as jest.Mock).mockResolvedValue({ id: 5, username: 'u', role: 'admin', name: 'N' });
    jwtSvc.sign.mockReturnValue('TKN');
    await ctrl.refreshToken({ refreshToken: 'r1' });
    expect(jwtSvc.sign).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, username: 'u', role: 'admin', name: 'N' }),
      { expiresIn: '24h' },
    );
  });

  it('refreshToken throws InternalServerError when admin not found', async () => {
    jwtSvc.verify.mockReturnValue({ id: 999 });
    (legacySvc.findAdminById as jest.Mock).mockResolvedValue(undefined);
    await expect(ctrl.refreshToken({ refreshToken: 'r1' })).rejects.toThrow(InternalServerErrorException);
  });

  it('refreshToken propagates jwt verification failure', async () => {
    jwtSvc.verify.mockImplementation(() => { throw new Error('bad signature'); });
    await expect(ctrl.refreshToken({ refreshToken: 'bad' })).rejects.toThrow('bad signature');
  });

  it('refreshToken applies default role "admin" and empty name fallback', async () => {
    jwtSvc.verify.mockReturnValue({ id: 10 });
    (legacySvc.findAdminById as jest.Mock).mockResolvedValue({ id: 10, username: 'x' });
    jwtSvc.sign.mockReturnValue('OUT');
    await ctrl.refreshToken({ refreshToken: 'r' });
    expect(jwtSvc.sign).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, username: 'x', role: 'admin', name: 'x' }),
      expect.anything(),
    );
  });
});
