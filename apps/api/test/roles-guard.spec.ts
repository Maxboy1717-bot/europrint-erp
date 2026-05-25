/**
 * @module roles-guard.spec
 * @description Jest / Vitest test suite.
 */

import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

describe('RolesGuard', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  });

  function makeGuard() {
    return new RolesGuard(reflector, makeI18n());
  }

  it('allows access when no required roles are set', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'employee' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows super_admin (lowercase) regardless of required roles', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'super_admin' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows SUPER_ADMIN (uppercase from legacy token) — case insensitive', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows matching role (lowercase)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['sales_manager', 'director']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'director' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows matching role when required roles use uppercase but user role is lowercase', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['SALES_MANAGER', 'DIRECTOR']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'director' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when user has no role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: {} }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role does not match', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'employee' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is missing entirely', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director']);
    const guard = makeGuard();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: undefined as unknown }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
