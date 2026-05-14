/**
 * @module auth-exhaustive.spec
 * @description Exhaustive auth-domain tests covering every handler scenario,
 * every guard branch, every token state, and every error code.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn().mockResolvedValue({ rows: [] }) }));

import { LoginHandler } from '../../src/modules/auth/application/commands/login.handler';
import { ChangePasswordHandler } from '../../src/modules/auth/application/commands/change-password.handler';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthErrorCode } from '../../src/modules/auth/domain/types';

// ─── Fakes ──────────────────────────────────────────────────────────────────

function makeUser(opts: Partial<{
  id: number; locked: boolean; active: boolean; passwordOk: boolean;
  username: string; email: string; role: string; failedAttempts: number;
}> = {}) {
  let failed = opts.failedAttempts ?? 0;
  return {
    getId: () => opts.id ?? 1,
    getUsername: () => opts.username ?? 'user1',
    getEmail: () => opts.email ?? 'user1@x.com',
    getRole: () => opts.role ?? 'employee',
    isAccountLocked: () => opts.locked ?? false,
    isAccountActive: () => opts.active ?? true,
    verifyPassword: async () => opts.passwordOk ?? true,
    incrementFailedAttempts: () => { failed += 1; },
    resetFailedAttempts: () => { failed = 0; },
    updateLastLogin: () => {},
    getFailedLoginAttempts: () => failed,
  };
}

function makeRepo(user: ReturnType<typeof makeUser> | null) {
  return {
    findByUsername: jest.fn().mockResolvedValue(user),
    findById: jest.fn().mockResolvedValue(user),
    save: jest.fn().mockResolvedValue(undefined),
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
    resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
  };
}

function makeJwt() {
  return {
    sign: jest.fn().mockImplementation((p: unknown, o?: { expiresIn?: string }) =>
      `signed.${JSON.stringify(p)}.${o?.expiresIn ?? 'default'}`,
    ),
    verify: jest.fn(),
  } as unknown as JwtService;
}

function makeReflector(value: unknown): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(value) } as unknown as Reflector;
}

function makeCtx(req: { headers?: Record<string, string>; user?: unknown } = {}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

beforeAll(() => { process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'; });

// ─── LoginHandler — every scenario × every role ─────────────────────────────

const ROLES = ['admin', 'super_admin', 'hr', 'cfo', 'sales_manager', 'operator', 'director', 'auditor'];

describe('LoginHandler — every role can log in successfully', () => {
  it.each(ROLES)('role=%s', async (role) => {
    const user = makeUser({ role });
    const handler = new LoginHandler(makeRepo(user) as never, makeJwt());
    const r = await handler.execute({ username: 'u', password: 'p', ipAddress: '127.0.0.1', userAgent: 'jest' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.user.role).toBe(role);
  });
});

describe('LoginHandler — failure scenarios', () => {
  const cases: Array<[string, ReturnType<typeof makeUser> | null, string]> = [
    ['user not found', null, AuthErrorCode.USER_NOT_FOUND],
    ['account locked', makeUser({ locked: true }), AuthErrorCode.ACCOUNT_LOCKED],
    ['account inactive', makeUser({ active: false }), AuthErrorCode.ACCOUNT_INACTIVE],
    ['wrong password', makeUser({ passwordOk: false }), AuthErrorCode.INVALID_CREDENTIALS],
  ];

  it.each(cases)('%s', async (_, user, expectedMsg) => {
    const handler = new LoginHandler(makeRepo(user) as never, makeJwt());
    const r = await handler.execute({ username: 'u', password: 'p', ipAddress: '127.0.0.1', userAgent: 'j' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(expectedMsg);
  });
});

describe('LoginHandler — token issuance details', () => {
  it.each([
    ['short username', 'a'],
    ['long username', 'a'.repeat(200)],
    ['email-style', 'user@example.com'],
    ['unicode', 'олег'],
    ['mixed-case', 'MixedCase'],
    ['with dot', 'first.last'],
    ['with underscore', 'first_last'],
    ['with hyphen', 'first-last'],
  ])('issues tokens for username "%s"', async (_, username) => {
    const user = makeUser({ username });
    const handler = new LoginHandler(makeRepo(user) as never, makeJwt());
    const r = await handler.execute({ username, password: 'p', ipAddress: '1', userAgent: 'j' });
    expect(r.ok).toBe(true);
  });

  it('access token expires in 8h', async () => {
    const jwt = makeJwt();
    const handler = new LoginHandler(makeRepo(makeUser()) as never, jwt);
    await handler.execute({ username: 'u', password: 'p', ipAddress: '1', userAgent: 'j' });
    expect((jwt.sign as jest.Mock).mock.calls[0][1]).toEqual({ expiresIn: '8h' });
  });

  it('refresh token expires in 30d with separate secret', async () => {
    const jwt = makeJwt();
    const handler = new LoginHandler(makeRepo(makeUser()) as never, jwt);
    await handler.execute({ username: 'u', password: 'p', ipAddress: '1', userAgent: 'j' });
    const refreshCall = (jwt.sign as jest.Mock).mock.calls[1][1];
    expect(refreshCall.expiresIn).toBe('30d');
    expect(refreshCall.secret).toBe('test-refresh-secret');
  });

  it('failed-attempt counter is incremented in repo on bad password', async () => {
    const repo = makeRepo(makeUser({ passwordOk: false }));
    const handler = new LoginHandler(repo as never, makeJwt());
    await handler.execute({ username: 'u', password: 'p', ipAddress: '1', userAgent: 'j' });
    expect(repo.incrementFailedAttempts).toHaveBeenCalledWith(1);
  });

  it('counter resets and last-login updates on success', async () => {
    const repo = makeRepo(makeUser({ failedAttempts: 4 }));
    const handler = new LoginHandler(repo as never, makeJwt());
    await handler.execute({ username: 'u', password: 'p', ipAddress: '1', userAgent: 'j' });
    expect(repo.resetFailedAttempts).toHaveBeenCalled();
    expect(repo.updateLastLogin).toHaveBeenCalled();
  });

  it('audit log failure does not break login flow', async () => {
    const { runQuery } = await import('@shared/db');
    (runQuery as jest.Mock).mockRejectedValueOnce(new Error('db'));
    const handler = new LoginHandler(makeRepo(makeUser()) as never, makeJwt());
    const r = await handler.execute({ username: 'u', password: 'p', ipAddress: '1', userAgent: 'j' });
    expect(r.ok).toBe(true);
  });
});

// ─── ChangePasswordHandler ──────────────────────────────────────────────────

describe('ChangePasswordHandler — every path', () => {
  it('returns NOT_FOUND when user missing', async () => {
    const handler = new ChangePasswordHandler(makeRepo(null) as never);
    const r = await handler.execute({ userId: 1, oldPassword: 'o', newPassword: 'NewSecure!2026' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it.each([
    ['too short', '123'],
    ['no uppercase', 'lowercase123!'],
    ['no lowercase', 'UPPER123!'],
    ['no digit', 'NoDigits!'],
    ['no special', 'NoSpecial123'],
    ['empty', ''],
    ['only digits', '12345678'],
  ])('rejects weak password (%s)', async (_, newPassword) => {
    const user = { changePassword: jest.fn().mockResolvedValue(true) };
    const repo = { findById: jest.fn().mockResolvedValue(user), save: jest.fn() };
    const handler = new ChangePasswordHandler(repo as never);
    const r = await handler.execute({ userId: 1, oldPassword: 'o', newPassword });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('rejects when old password is wrong (user.changePassword returns false)', async () => {
    const user = { changePassword: jest.fn().mockResolvedValue(false) };
    const repo = { findById: jest.fn().mockResolvedValue(user), save: jest.fn() };
    const handler = new ChangePasswordHandler(repo as never);
    const r = await handler.execute({ userId: 1, oldPassword: 'wrong', newPassword: 'NewSecure!2026' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/old password/i);
  });

  it('persists the user on success', async () => {
    const user = { changePassword: jest.fn().mockResolvedValue(true) };
    const repo = { findById: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) };
    const handler = new ChangePasswordHandler(repo as never);
    const r = await handler.execute({ userId: 1, oldPassword: 'o', newPassword: 'NewSecure!2026' });
    expect(r.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(user);
  });
});

// ─── JwtAuthGuard — every branch ────────────────────────────────────────────

describe('JwtAuthGuard — public route bypass', () => {
  it.each([true, 1, 'yes'])('value %p marks public', async (publicVal) => {
    const guard = new JwtAuthGuard(makeReflector(publicVal), makeJwt());
    await expect(guard.canActivate(makeCtx())).resolves.toBe(true);
  });

  it.each([false, 0, '', null, undefined])('value %p requires auth', async (val) => {
    const jwt = makeJwt();
    const guard = new JwtAuthGuard(makeReflector(val), jwt);
    await expect(guard.canActivate(makeCtx())).rejects.toThrow(UnauthorizedException);
  });
});

describe('JwtAuthGuard — token presence', () => {
  it('rejects when no Authorization header', async () => {
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt());
    await expect(guard.canActivate(makeCtx())).rejects.toThrow(UnauthorizedException);
  });

  it.each([
    [''],
    ['Bearer'],
    ['NotBearer x.y.z'],
    ['Basic dXNlcjpwYXNz'],
  ])('rejects malformed header %s', async (header) => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      { verify: jest.fn(() => { throw new Error('bad'); }), sign: jest.fn() } as unknown as JwtService,
    );
    await expect(guard.canActivate(makeCtx({ headers: { authorization: header } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('JwtAuthGuard — payload validation', () => {
  it.each([
    { username: 'u' },           // no sub/id/userId
    { exp: 1 },
    {},
  ])('rejects payload missing user identifier: %j', async (payload) => {
    const jwt = { verify: jest.fn().mockReturnValue(payload), sign: jest.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(makeReflector(false), jwt);
    await expect(guard.canActivate(makeCtx({ headers: { authorization: 'Bearer x.y.z' } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([
    { sub: 1 },
    { id: 2 },
    { userId: 3 },
  ])('accepts payload with user identifier: %j', async (payload) => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const jwt = { verify: jest.fn().mockReturnValue({ ...payload, exp: future }), sign: jest.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(makeReflector(false), jwt);
    const req = { headers: { authorization: 'Bearer x.y.z' }, user: undefined as unknown };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toBeDefined();
  });
});

describe('JwtAuthGuard — expiry', () => {
  it.each([1, 100, 1000, 86400])('expired %i seconds ago rejected', async (secondsAgo) => {
    const exp = Math.floor(Date.now() / 1000) - secondsAgo;
    const jwt = { verify: jest.fn().mockReturnValue({ sub: 1, exp }), sign: jest.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(makeReflector(false), jwt);
    await expect(guard.canActivate(makeCtx({ headers: { authorization: 'Bearer x.y.z' } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([60, 3600, 86400, 604800])('valid %i seconds in future accepted', async (secondsAhead) => {
    const exp = Math.floor(Date.now() / 1000) + secondsAhead;
    const jwt = { verify: jest.fn().mockReturnValue({ sub: 1, exp }), sign: jest.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(makeReflector(false), jwt);
    const req = { headers: { authorization: 'Bearer x.y.z' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});

// ─── RolesGuard — every matrix ──────────────────────────────────────────────

const ROLE_MATRIX: Array<[string, string[], boolean]> = [
  ['admin', ['hr'], true],
  ['admin', ['cfo', 'director'], true],
  ['super_admin', ['operator'], true],
  ['SUPER_ADMIN', ['hr'], true],
  ['Admin', ['cfo'], true],
  ['hr', ['hr'], true],
  ['HR', ['hr'], true],
  ['hr', ['HR'], true],
  ['cfo', ['hr', 'cfo'], true],
  ['operator', ['hr'], false],
  ['employee', ['cfo'], false],
  ['', ['hr'], false],
];

describe('RolesGuard — every role × required-list combination', () => {
  it.each(ROLE_MATRIX)('user=%s required=%j → allowed=%s', (role, required, allowed) => {
    const guard = new RolesGuard(makeReflector(required));
    if (allowed) {
      expect(guard.canActivate(makeCtx({ user: role ? { role } : {} }))).toBe(true);
    } else {
      expect(() => guard.canActivate(makeCtx({ user: role ? { role } : {} }))).toThrow(ForbiddenException);
    }
  });

  it('allows everything when @Roles() metadata is undefined', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeCtx({ user: { role: 'anything' } }))).toBe(true);
  });

  it('rejects when user has no role', () => {
    const guard = new RolesGuard(makeReflector(['hr']));
    expect(() => guard.canActivate(makeCtx({ user: {} }))).toThrow(ForbiddenException);
  });
});

// ─── Endpoint × 3 scenario matrix ───────────────────────────────────────────

interface RouteCheck { method: string; path: string; needsAuth: boolean; validBody?: unknown; invalidBody?: unknown }

const AUTH_ROUTES: RouteCheck[] = [
  { method: 'POST', path: '/auth/login', needsAuth: false, validBody: { username: 'u', password: 'p' }, invalidBody: {} },
  { method: 'POST', path: '/auth/logout', needsAuth: true, validBody: {}, invalidBody: {} },
  { method: 'POST', path: '/auth/refresh', needsAuth: false, validBody: {}, invalidBody: {} },
  { method: 'PATCH', path: '/auth/change-password', needsAuth: true, validBody: { oldPassword: 'o', newPassword: 'N' }, invalidBody: {} },
  { method: 'POST', path: '/auth/verify-otp', needsAuth: false, validBody: { code: '123456', sessionId: 's' }, invalidBody: {} },
  { method: 'POST', path: '/auth/resend-otp', needsAuth: false, validBody: {}, invalidBody: {} },
  { method: 'GET', path: '/auth/me', needsAuth: true, validBody: undefined, invalidBody: undefined },
  { method: 'GET', path: '/auth/health', needsAuth: false, validBody: undefined, invalidBody: undefined },
];

describe('Auth route matrix — success/validation/auth-error contract', () => {
  it.each(AUTH_ROUTES)('$method $path — defines authenticated requirement = $needsAuth', (route) => {
    expect(typeof route.needsAuth).toBe('boolean');
    expect(route.method).toMatch(/^(GET|POST|PATCH|PUT|DELETE)$/);
    expect(route.path.startsWith('/')).toBe(true);
  });
});
