/**
 * test/auth/roles-guard-extended.spec.ts
 *
 * Additional RolesGuard scenarios beyond the existing test/roles-guard.spec.ts.
 * Focus: super_admin shortcut, case-insensitivity matrix, request.user shape.
 */

import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

function ctx(role: string | undefined, required: string[] | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : {} }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function guardWith(required: string[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard — extended scenarios', () => {
  it('passes when @Roles() metadata is absent', () => {
    expect(guardWith(undefined).canActivate(ctx('operator', undefined))).toBe(true);
  });

  it('passes for admin (lowercase) against any role list', () => {
    expect(guardWith(['hr']).canActivate(ctx('admin', ['hr']))).toBe(true);
  });

  it('passes for super_admin shortcut', () => {
    expect(guardWith(['hr', 'cfo']).canActivate(ctx('super_admin', ['hr', 'cfo']))).toBe(true);
  });

  it('matches when required role list contains user role case-insensitively', () => {
    expect(guardWith(['HR']).canActivate(ctx('hr', ['HR']))).toBe(true);
    expect(guardWith(['hr']).canActivate(ctx('HR', ['hr']))).toBe(true);
    expect(guardWith(['Cfo']).canActivate(ctx('CFO', ['Cfo']))).toBe(true);
  });

  it('denies with ForbiddenException when role not in required list', () => {
    expect(() => guardWith(['cfo']).canActivate(ctx('operator', ['cfo']))).toThrow(
      ForbiddenException,
    );
  });

  it('denies when user object has no role property', () => {
    expect(() => guardWith(['hr']).canActivate(ctx(undefined, ['hr']))).toThrow(ForbiddenException);
  });
});
