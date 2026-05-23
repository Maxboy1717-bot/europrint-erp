/**
 * test/unit/guards/jwt-auth.guard.spec.ts
 *
 * Unit tests for JwtAuthGuard. Verifies @Public() bypass, missing/invalid
 * Bearer header handling, expired token rejection, valid token pass-through,
 * and wrong-secret rejection via JwtService.verify throwing.
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

interface MockRequest {
  headers: Record<string, string>;
  cookies?: Record<string, string>;
  user?: Record<string, unknown>;
}

function makeReflector(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

function makeJwt(decoded?: Record<string, unknown>, err?: Error): JwtService {
  return {
    verify: jest.fn().mockImplementation(() => {
      if (err) throw err;
      return decoded;
    }),
    sign: jest.fn(),
  } as unknown as JwtService;
}

function makeContext(req: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('returns true when route is marked @Public', async () => {
    const guard = new JwtAuthGuard(makeReflector(true), makeJwt(), makeI18n());
    const ctx = makeContext({ headers: {} });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws UnauthorizedException when Bearer header is missing', async () => {
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt(), makeI18n());
    const ctx = makeContext({ headers: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is expired', async () => {
    const expired = { sub: 7, exp: Math.floor(Date.now() / 1000) - 120 };
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt(expired), makeI18n());
    const ctx = makeContext({ headers: { authorization: 'Bearer expired.tok.value' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true and attaches user when token is valid', async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const decoded = { sub: 99, role: 'manager', exp: future };
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt(decoded), makeI18n());
    const request: MockRequest = { headers: { authorization: 'Bearer good.tok.value' } };
    const ctx = makeContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user?.['id']).toBe(99);
    expect(request.user?.['role']).toBe('manager');
  });

  it('throws UnauthorizedException when JwtService.verify throws (wrong secret)', async () => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt(undefined, new Error('invalid signature')),
      makeI18n(),
    );
    const ctx = makeContext({ headers: { authorization: 'Bearer wrong.secret.value' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when payload has no user identifier', async () => {
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt({ name: 'orphan' }), makeI18n());
    const ctx = makeContext({ headers: { authorization: 'Bearer no.sub.token' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('reads access_token cookie when no Authorization header is present', async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ sub: 'user-cookie', exp: future }),
      makeI18n(),
    );
    const request: MockRequest = {
      headers: {},
      cookies: { access_token: 'cookie.jwt.value' },
    };
    const ctx = makeContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user?.['id']).toBe('user-cookie');
  });
});
