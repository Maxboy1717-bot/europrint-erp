/**
 * @module roles-guard.spec
 * @description Jest / Vitest test suite.
 */

import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

function makeContext(userRole: string | undefined, requiredRoles: string[]): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) } as unknown as Reflector;
  const mockRequest = { user: userRole !== undefined ? { role: userRole } : undefined };
  const mockContext = {
    switchToHttp: () => ({ getRequest: () => mockRequest }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  return mockContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no required roles are set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'employee' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows super_admin (lowercase) regardless of required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'super_admin' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows SUPER_ADMIN (uppercase from legacy token) — case insensitive', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows matching role (lowercase)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['sales_manager', 'director']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'director' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows matching role when required roles use uppercase but user role is lowercase', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['SALES_MANAGER', 'DIRECTOR']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'director' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: {} }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role does not match', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director', 'sales_manager']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'employee' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is missing entirely', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['director']);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: undefined as unknown }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
