/**
 * test/unit/guards/tablet-token.guard.spec.ts
 *
 * Owner Decision 1 (2026-07-06): 17 IoT tablet routes were converted from
 * @Roles(...IOT_READ) (unreachable -- the tablet sends x-tablet-token, never a
 * JWT bearer, so JwtAuthGuard always 401'd) to @Public() + @UseGuards(TabletTokenGuard),
 * matching the already-working tablet/orders/equipment/worker-schedule routes.
 *
 * This proves the guard's own behavior, which every one of those 17 routes now
 * depends on: (a) a request carrying only a valid x-tablet-token succeeds and
 * populates request.user, (b) a request with no token at all fails, (c) a request
 * carrying a real ERP JWT (not a tablet-issued token, i.e. missing `tablet: true`)
 * also fails -- proving a normal ERP session cannot silently satisfy this guard.
 */

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TabletTokenGuard } from '../../../src/common/guards/tablet-token.guard';

interface MockRequest {
  headers: Record<string, string | string[]>;
  user?: Record<string, unknown>;
}

function makeJwt(decoded?: Record<string, unknown>, err?: Error): JwtService {
  return {
    verify: jest.fn().mockImplementation(() => {
      if (err) throw err;
      return decoded;
    }),
  } as unknown as JwtService;
}

function makeContext(req: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('translated') };
}

describe('TabletTokenGuard', () => {
  it('returns true and attaches request.user when x-tablet-token is a valid tablet token', async () => {
    const guard = new TabletTokenGuard(
      makeJwt({ sub: 7, userId: 7, tabel: 'T-001', role: 'operator', tablet: true }),
      makeI18n() as never,
    );
    const request: MockRequest = { headers: { 'x-tablet-token': 'valid.tablet.token' } };
    const ctx = makeContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user?.['id']).toBe(7);
    expect(request.user?.['role']).toBe('operator');
    expect(request.user?.['tablet']).toBe(true);
  });

  it('throws UnauthorizedException when no x-tablet-token header is present (no token, no JWT)', async () => {
    const guard = new TabletTokenGuard(makeJwt(), makeI18n() as never);
    const ctx = makeContext({ headers: {} });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when x-tablet-token is an empty string', async () => {
    const guard = new TabletTokenGuard(makeJwt(), makeI18n() as never);
    const ctx = makeContext({ headers: { 'x-tablet-token': '' } });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the token decodes but lacks tablet:true (e.g. a real ERP JWT)', async () => {
    // A normal ERP session JWT (JwtAuthGuard's own token shape) decodes fine but
    // has no `tablet` claim -- must NOT be accepted here, or an ERP-logged-in
    // browser session could silently satisfy tablet-only routes.
    const guard = new TabletTokenGuard(
      makeJwt({ sub: 42, role: 'production_manager' }),
      makeI18n() as never,
    );
    const ctx = makeContext({ headers: { 'x-tablet-token': 'a.real.erp.jwt' } });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when JwtService.verify throws (malformed/expired/wrong-secret token)', async () => {
    const guard = new TabletTokenGuard(makeJwt(undefined, new Error('jwt malformed')), makeI18n() as never);
    const ctx = makeContext({ headers: { 'x-tablet-token': 'garbage' } });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts the header when sent as an array (defensive header-parsing)', async () => {
    const guard = new TabletTokenGuard(
      makeJwt({ sub: 3, tablet: true }),
      makeI18n() as never,
    );
    const ctx = makeContext({ headers: { 'x-tablet-token': ['first.token', 'second.token'] } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
