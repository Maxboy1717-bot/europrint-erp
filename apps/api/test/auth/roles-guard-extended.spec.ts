/**
 * test/auth/roles-guard-extended.spec.ts
 *
 * Additional RolesGuard scenarios beyond the existing test/roles-guard.spec.ts.
 * Focus: super_admin shortcut, case-insensitivity matrix, request.user shape.
 */

import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

function ctx(role: string | undefined, required: string[] | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : {} }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function guardWith(required: string[] | undefined): RolesGuard {
  // Real Reflector differentiates by metadata key — mock must too, since
  // RolesGuard now checks IS_PUBLIC_KEY before 'roles' (@Public() bypass).
  const reflector = {
    getAllAndOverride: jest.fn().mockImplementation((key: string) =>
      key === IS_PUBLIC_KEY ? undefined : required,
    ),
  } as unknown as Reflector;
  return new RolesGuard(reflector, makeI18n());
}

describe('RolesGuard — extended scenarios', () => {
  it('passes when @Roles() metadata is absent', async () => {
    await expect(guardWith(undefined).canActivate(ctx('operator', undefined))).resolves.toBe(true);
  });

  it('passes for admin (lowercase) against any role list', async () => {
    await expect(guardWith(['hr']).canActivate(ctx('admin', ['hr']))).resolves.toBe(true);
  });

  it('passes for super_admin shortcut', async () => {
    await expect(guardWith(['hr', 'cfo']).canActivate(ctx('super_admin', ['hr', 'cfo']))).resolves.toBe(true);
  });

  it('matches when required role list contains user role case-insensitively', async () => {
    await expect(guardWith(['HR']).canActivate(ctx('hr', ['HR']))).resolves.toBe(true);
    await expect(guardWith(['hr']).canActivate(ctx('HR', ['hr']))).resolves.toBe(true);
    await expect(guardWith(['Cfo']).canActivate(ctx('CFO', ['Cfo']))).resolves.toBe(true);
  });

  it('denies with ForbiddenException when role not in required list', async () => {
    await expect(guardWith(['cfo']).canActivate(ctx('operator', ['cfo']))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('denies when user object has no role property', async () => {
    await expect(guardWith(['hr']).canActivate(ctx(undefined, ['hr']))).rejects.toThrow(ForbiddenException);
  });
});
