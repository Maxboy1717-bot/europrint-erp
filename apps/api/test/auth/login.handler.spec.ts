/**
 * test/auth/login.handler.spec.ts
 *
 * Unit tests for LoginHandler. The IAuthRepo and JwtService are mocked.
 * runQuery (audit log) is also mocked to keep the test DB-free.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn().mockResolvedValue({ rows: [] }) }));

import { LoginHandler } from '../../src/modules/auth/application/commands/login.handler';
import { JwtService } from '@nestjs/jwt';
import { AuthErrorCode } from '../../src/modules/auth/domain/types';

interface FakeUser {
  getId: () => number;
  getUsername: () => string;
  getEmail: () => string;
  getRole: () => string;
  isAccountLocked: () => boolean;
  isAccountActive: () => boolean;
  verifyPassword: (p: string) => Promise<boolean>;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  updateLastLogin: (d: Date) => void;
  getFailedLoginAttempts: () => number;
}

function makeFakeUser(overrides: Partial<{
  id: number;
  locked: boolean;
  active: boolean;
  passwordOk: boolean;
  failedAttempts: number;
}> = {}): FakeUser {
  let failedAttempts = overrides.failedAttempts ?? 0;
  return {
    getId: () => overrides.id ?? 42,
    getUsername: () => 'alice',
    getEmail: () => 'alice@europrint.test',
    getRole: () => 'employee',
    isAccountLocked: () => overrides.locked ?? false,
    isAccountActive: () => overrides.active ?? true,
    verifyPassword: async () => overrides.passwordOk ?? true,
    incrementFailedAttempts: () => { failedAttempts += 1; },
    resetFailedAttempts: () => { failedAttempts = 0; },
    updateLastLogin: () => {},
    getFailedLoginAttempts: () => failedAttempts,
  };
}

function makeRepo(user: FakeUser | null) {
  return {
    findByUsername: jest.fn().mockResolvedValue(user),
    findById: jest.fn(),
    save: jest.fn(),
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
    resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
  };
}

function makeJwt() {
  return {
    sign: jest.fn().mockImplementation((payload: unknown, opts?: { expiresIn?: string }) =>
      `signed.${JSON.stringify(payload)}.${opts?.expiresIn ?? 'default'}`,
    ),
    verify: jest.fn(),
  } as unknown as JwtService;
}

describe('LoginHandler', () => {
  const cmdBase = {
    username: 'alice',
    password: 'correct',
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
  };

  beforeEach(() => {
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  it('returns UNAUTHORIZED / USER_NOT_FOUND when user does not exist', async () => {
    const repo = makeRepo(null);
    const handler = new LoginHandler(repo as never, makeJwt());

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('UNAUTHORIZED');
      expect(r.error.message).toBe(AuthErrorCode.USER_NOT_FOUND);
    }
  });

  it('returns UNAUTHORIZED / ACCOUNT_LOCKED for locked accounts', async () => {
    const user = makeFakeUser({ locked: true });
    const repo = makeRepo(user);
    const handler = new LoginHandler(repo as never, makeJwt());

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(AuthErrorCode.ACCOUNT_LOCKED);
  });

  it('returns UNAUTHORIZED / ACCOUNT_INACTIVE for inactive accounts', async () => {
    const user = makeFakeUser({ active: false });
    const repo = makeRepo(user);
    const handler = new LoginHandler(repo as never, makeJwt());

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(AuthErrorCode.ACCOUNT_INACTIVE);
  });

  it('returns UNAUTHORIZED / INVALID_CREDENTIALS on bad password', async () => {
    const user = makeFakeUser({ passwordOk: false });
    const repo = makeRepo(user);
    const handler = new LoginHandler(repo as never, makeJwt());

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    // Side-effect: failed attempt persisted
    expect(repo.incrementFailedAttempts).toHaveBeenCalledWith(42);
  });

  it('issues access + refresh tokens on success', async () => {
    const user = makeFakeUser();
    const repo = makeRepo(user);
    const jwt = makeJwt();
    const handler = new LoginHandler(repo as never, jwt);

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.accessToken).toMatch(/^signed\./);
      expect(r.data.refreshToken).toMatch(/^signed\./);
      expect(r.data.user.username).toBe('alice');
      expect(r.data.user.role).toBe('employee');
    }
    // Access token signed with 8h expiry
    expect(jwt.sign).toHaveBeenCalledTimes(2);
    const firstCall = (jwt.sign as jest.Mock).mock.calls[0];
    expect(firstCall[1]).toEqual({ expiresIn: '8h' });
    // Refresh token signed with separate JWT_REFRESH_SECRET
    const secondCall = (jwt.sign as jest.Mock).mock.calls[1];
    expect(secondCall[1]).toEqual({ expiresIn: '30d', secret: 'test-refresh-secret' });
  });

  it('resets failed-attempt counter and updates last-login on success', async () => {
    const user = makeFakeUser({ failedAttempts: 3 });
    const repo = makeRepo(user);
    const handler = new LoginHandler(repo as never, makeJwt());

    await handler.execute(cmdBase);

    expect(repo.resetFailedAttempts).toHaveBeenCalledWith(42);
    expect(repo.updateLastLogin).toHaveBeenCalled();
  });

  it('still returns Err (does not crash) if audit log throws', async () => {
    // The audit insert is wrapped in try/catch — failure must be swallowed.
    const { runQuery } = await import('@shared/db');
    (runQuery as jest.Mock).mockRejectedValueOnce(new Error('db gone'));
    const user = makeFakeUser({ passwordOk: false });
    const repo = makeRepo(user);
    const handler = new LoginHandler(repo as never, makeJwt());

    const r = await handler.execute(cmdBase);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(AuthErrorCode.INVALID_CREDENTIALS);
  });
});
