/**
 * test/auth/jwt-auth.guard.spec.ts
 *
 * Unit tests for JwtAuthGuard. Mocks Reflector and JwtService; mocks runQuery
 * so the blacklist check stays DB-free.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn().mockResolvedValue({ rows: [] }) }));

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

function makeReflector(isPublic = false): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(isPublic) } as unknown as Reflector;
}

function makeContext(headers: Record<string, string> = {}): ExecutionContext {
  const request: { headers: Record<string, string>; user?: unknown } = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeJwt(decoded?: Record<string, unknown>, shouldThrow?: Error): JwtService {
  return {
    verify: jest.fn().mockImplementation(() => {
      if (shouldThrow) throw shouldThrow;
      return decoded;
    }),
    sign: jest.fn(),
  } as unknown as JwtService;
}

describe('JwtAuthGuard', () => {
  it('passes when route is marked @Public()', async () => {
    const guard = new JwtAuthGuard(makeReflector(true), makeJwt());
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt());
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for malformed Bearer header', async () => {
    const guard = new JwtAuthGuard(makeReflector(false), makeJwt());
    const ctx = makeContext({ authorization: 'NotBearer xyz' });
    // jwt.verify will receive 'xyz' (split by space[1]) and throw
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when JwtService.verify throws', async () => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt(undefined, new Error('bad signature')),
    );
    const ctx = makeContext({ authorization: 'Bearer fake.token.value' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when payload has no sub/id/userId (invalid payload)', async () => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ username: 'alice' }), // no sub
    );
    const ctx = makeContext({ authorization: 'Bearer x.y.z' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user to request on successful verification (sub claim)', async () => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ sub: 42, username: 'alice', role: 'hr', exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    const request: { headers: Record<string, string>; user?: { id: number; sub: number; username: string; role: string } } = {
      headers: { authorization: 'Bearer x.y.z' },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);

    expect(request.user).toBeDefined();
    expect(request.user!.id).toBe(42);
    expect(request.user!.username).toBe('alice');
    expect(request.user!.role).toBe('hr');
  });

  it('throws UnauthorizedException when exp is in the past', async () => {
    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ sub: 42, exp: Math.floor(Date.now() / 1000) - 60 }),
    );
    const ctx = makeContext({ authorization: 'Bearer x.y.z' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('honors blacklist when jti is present and refresh_tokens marks revoked', async () => {
    const { runQuery } = await import('@shared/db');
    (runQuery as jest.Mock).mockResolvedValueOnce({ rows: [{ is_revoked: true }] });

    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ sub: 42, jti: 'token-id-1', exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    const ctx = makeContext({ authorization: 'Bearer x.y.z' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('fails open on DB error during blacklist check (logs but proceeds)', async () => {
    const { runQuery } = await import('@shared/db');
    (runQuery as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const guard = new JwtAuthGuard(
      makeReflector(false),
      makeJwt({ sub: 42, jti: 'token-id-2', exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    const ctx = makeContext({ authorization: 'Bearer x.y.z' });

    // Per code comments: "DB unavailable — fail open to avoid outage"
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
