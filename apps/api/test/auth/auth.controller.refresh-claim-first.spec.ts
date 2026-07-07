/**
 * test/auth/auth.controller.refresh-claim-first.spec.ts
 *
 * C7.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): refresh() used to check-then-mint-then-revoke —
 * two concurrent calls with the same old token could both pass the check before either revoked,
 * both minting a live new pair. The fix calls authRepo.blacklistToken() (now an atomic
 * claim returning boolean) BEFORE minting anything, and rejects outright when it returns false.
 * These tests prove: (1) a successful claim proceeds to mint + set cookies, (2) a failed claim
 * (already revoked / lost the race) is rejected with UnauthorizedException and NEVER mints a new
 * token pair or sets cookies.
 */

import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../src/modules/auth/presentation/auth.controller';

describe('AuthController.refresh — C7.6 claim-before-mint', () => {
  let controller: AuthController;
  let authRepo: { blacklistToken: jest.Mock; isTokenBlacklisted: jest.Mock };
  let jwtService: { verify: jest.Mock; sign: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  let reply: { setCookie: jest.Mock };

  const PAYLOAD = { sub: 1, username: 'muslimbek', role: 'super_admin', exp: Math.floor(Date.now() / 1000) + 3600 };

  beforeEach(() => {
    authRepo = { blacklistToken: jest.fn(), isTokenBlacklisted: jest.fn() };
    jwtService = {
      verify: jest.fn().mockReturnValue(PAYLOAD),
      sign: jest.fn().mockReturnValue('new.jwt.token'),
    };
    configService = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
    };
    reply = { setCookie: jest.fn() };

    controller = new AuthController(
      {} as never, // loginHandler unused by refresh()
      {} as never, // logoutHandler unused by refresh()
      jwtService as never,
      configService as never,
      authRepo as never,
      { t: jest.fn(async (k: string) => k) } as never,
    );
  });

  const req = { cookies: { refresh_token: 'old.refresh.token' } } as never;

  it('mints a new pair and sets cookies when the claim succeeds', async () => {
    authRepo.blacklistToken.mockResolvedValue(true);

    const result = await controller.refresh(undefined as never, req, reply as never);

    expect(authRepo.blacklistToken).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledTimes(2); // access + refresh
    expect(reply.setCookie).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'new.jwt.token', refreshToken: 'new.jwt.token' });
  });

  it('rejects and mints nothing when the claim fails (already revoked / lost the race)', async () => {
    authRepo.blacklistToken.mockResolvedValue(false);

    await expect(controller.refresh(undefined as never, req, reply as never)).rejects.toThrow(UnauthorizedException);

    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(reply.setCookie).not.toHaveBeenCalled();
  });

  it('calls blacklistToken (the claim) BEFORE calling jwtService.sign (minting)', async () => {
    const callOrder: string[] = [];
    authRepo.blacklistToken.mockImplementation(async () => { callOrder.push('claim'); return true; });
    jwtService.sign.mockImplementation(() => { callOrder.push('mint'); return 'new.jwt.token'; });

    await controller.refresh(undefined as never, req, reply as never);

    expect(callOrder).toEqual(['claim', 'mint', 'mint']);
  });
});
