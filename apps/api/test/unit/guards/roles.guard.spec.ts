/**
 * test/unit/guards/roles.guard.spec.ts
 *
 * Unit tests for RolesGuard. Verifies role matching (single + multi),
 * case-insensitivity, admin bypass and the no-decorator pass-through.
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { IS_PUBLIC_KEY } from '../../../src/common/decorators/public.decorator';

interface RequestShape {
  user?: { role?: string };
}

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

function buildContext(
  requiredRoles: string[] | undefined,
  user: RequestShape['user'],
): { ctx: ExecutionContext; reflector: Reflector } {
  const reflector = {
    // Real Reflector differentiates by metadata key — mock must too, since
    // RolesGuard now checks IS_PUBLIC_KEY before 'roles' (@Public() bypass).
    getAllAndOverride: jest.fn().mockImplementation((key: string) =>
      key === IS_PUBLIC_KEY ? undefined : requiredRoles,
    ),
  } as unknown as Reflector;
  const request: RequestShape = { user };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  return { ctx, reflector };
}

describe('RolesGuard', () => {
  it('returns true when role matches a single required role', async () => {
    const { ctx, reflector } = buildContext(['director'], { role: 'director' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when role matches one of multiple required roles', async () => {
    const { ctx, reflector } = buildContext(['cfo', 'director', 'hr'], { role: 'hr' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when no @Roles decorator is applied', async () => {
    const { ctx, reflector } = buildContext(undefined, { role: 'employee' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when user is admin regardless of required roles', async () => {
    const { ctx, reflector } = buildContext(['director', 'cfo'], { role: 'admin' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when user is super_admin regardless of required roles', async () => {
    const { ctx, reflector } = buildContext(['hr'], { role: 'SUPER_ADMIN' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when user role is not in required list', async () => {
    const { ctx, reflector } = buildContext(['director'], { role: 'employee' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no role property', async () => {
    const { ctx, reflector } = buildContext(['director'], {});
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('matches case-insensitively when required is uppercase and user lowercase', async () => {
    const { ctx, reflector } = buildContext(['DIRECTOR', 'CFO'], { role: 'director' });
    const guard = new RolesGuard(reflector, makeI18n());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
