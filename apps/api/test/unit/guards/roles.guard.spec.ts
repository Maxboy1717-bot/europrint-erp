/**
 * test/unit/guards/roles.guard.spec.ts
 *
 * Unit tests for RolesGuard. Verifies role matching (single + multi),
 * case-insensitivity, admin bypass and the no-decorator pass-through.
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/common/guards/roles.guard';

interface RequestShape {
  user?: { role?: string };
}

function buildContext(
  requiredRoles: string[] | undefined,
  user: RequestShape['user'],
): { ctx: ExecutionContext; reflector: Reflector } {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
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
  it('returns true when role matches a single required role', () => {
    const { ctx, reflector } = buildContext(['director'], { role: 'director' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when role matches one of multiple required roles', () => {
    const { ctx, reflector } = buildContext(['cfo', 'director', 'hr'], { role: 'hr' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when no @Roles decorator is applied', () => {
    const { ctx, reflector } = buildContext(undefined, { role: 'employee' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user is admin regardless of required roles', () => {
    const { ctx, reflector } = buildContext(['director', 'cfo'], { role: 'admin' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user is super_admin regardless of required roles', () => {
    const { ctx, reflector } = buildContext(['hr'], { role: 'SUPER_ADMIN' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user role is not in required list', () => {
    const { ctx, reflector } = buildContext(['director'], { role: 'employee' });
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no role property', () => {
    const { ctx, reflector } = buildContext(['director'], {});
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('matches case-insensitively when required is uppercase and user lowercase', () => {
    const { ctx, reflector } = buildContext(['DIRECTOR', 'CFO'], { role: 'director' });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
