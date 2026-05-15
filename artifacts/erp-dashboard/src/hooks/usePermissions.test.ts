/**
 * @module usePermissions.test
 * @description Vitest tests for the usePermissions RBAC hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { ServerMyPermissions } from './usePositionPermissions';

const { useAuthMock, usePositionPermissionsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  usePositionPermissionsMock: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/hooks/usePositionPermissions', () => ({
  usePositionPermissions: () => usePositionPermissionsMock(),
}));

import { usePermissions } from './usePermissions';

function setup(opts: {
  role?: string;
  serverPerms?: Partial<ServerMyPermissions> | null;
}): ReturnType<typeof usePermissions> {
  useAuthMock.mockReturnValue({ user: opts.role ? { role: opts.role } : null });
  usePositionPermissionsMock.mockReturnValue({
    permissions: opts.serverPerms ?? null,
  });
  const { result } = renderHook(() => usePermissions());
  return result.current;
}

describe('usePermissions', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    usePositionPermissionsMock.mockReset();
  });

  it('grants admin access to every permission', () => {
    const perms = setup({ role: 'admin' });
    expect(perms.isAdmin).toBe(true);
    expect(perms.hasPermission('CRM', 'WRITE')).toBe(true);
    expect(perms.hasPermission('HR', 'DELETE')).toBe(true);
    expect(perms.canAccess('finance:read')).toBe(true);
  });

  it('uses backend modules when present', () => {
    const perms = setup({
      role: 'finance_manager',
      serverPerms: {
        userId: 1,
        username: 'u',
        role: 'finance_manager',
        positionId: 1,
        positionCode: null,
        positionNameUz: null,
        positionNameRu: null,
        departmentCode: null,
        departmentNameUz: null,
        rbacTier: null,
        modules: [{ module: 'FI', level: 'FULL' }],
        featureFlags: [],
        isAdmin: false,
      },
    });
    expect(perms.hasPermission('FINANCE', 'WRITE')).toBe(true);
  });

  it('honours feature flags from backend', () => {
    const perms = setup({
      role: 'sales',
      serverPerms: {
        userId: 1,
        username: 'u',
        role: 'sales',
        positionId: 1,
        positionCode: null,
        positionNameUz: null,
        positionNameRu: null,
        departmentCode: null,
        departmentNameUz: null,
        rbacTier: null,
        modules: [],
        featureFlags: ['crm.leads.export'],
        isAdmin: false,
      },
    });
    expect(perms.hasFeature('crm.leads.export')).toBe(true);
    expect(perms.hasFeature('nope.unknown')).toBe(false);
  });

  it('falls back to role-based check when backend is null', () => {
    const perms = setup({ role: 'finance_manager', serverPerms: null });
    expect(perms.canAccess('finance:read')).toBe(true);
    expect(perms.canAccess('production:release')).toBe(false);
  });

  it('returns false for unauthenticated callers', () => {
    const perms = setup({});
    expect(perms.isAdmin).toBe(false);
    expect(perms.hasPermission('CRM', 'READ')).toBe(false);
    expect(perms.canAccess('crm:read')).toBe(false);
  });

  it('exposes position metadata from server data', () => {
    const perms = setup({
      role: 'finance_manager',
      serverPerms: {
        userId: 1,
        username: 'u',
        role: 'finance_manager',
        positionId: 7,
        positionCode: 'FIN-MGR',
        positionNameUz: 'Moliya',
        positionNameRu: null,
        departmentCode: 'FI',
        departmentNameUz: null,
        rbacTier: 'mid',
        modules: [],
        featureFlags: [],
        isAdmin: false,
      },
    });
    expect(perms.positionCode).toBe('FIN-MGR');
    expect(perms.departmentCode).toBe('FI');
    expect(perms.rbacTier).toBe('mid');
  });
});
