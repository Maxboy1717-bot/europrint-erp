/**
 * @module usePermission.test
 * @description Vitest tests for the usePermission shim hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Permission } from '@/lib/permissions';

const { usePermissionsMock } = vi.hoisted(() => ({
  usePermissionsMock: vi.fn(),
}));

vi.mock('./usePermissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

import { usePermission } from './usePermission';

function setup(overrides: {
  canAccess?: (p: Permission) => boolean;
  canAccessAny?: (ps: Permission[]) => boolean;
  role?: string | null;
  isAdmin?: boolean;
}): ReturnType<typeof usePermission> {
  usePermissionsMock.mockReturnValue({
    canAccess: overrides.canAccess ?? (() => false),
    canAccessAny: overrides.canAccessAny ?? (() => false),
    role: overrides.role ?? null,
    isAdmin: overrides.isAdmin ?? false,
  });
  return renderHook(() => usePermission()).result.current;
}

describe('usePermission shim', () => {
  beforeEach(() => usePermissionsMock.mockReset());

  it('delegates can() to canAccess', () => {
    const canAccess = vi.fn().mockReturnValue(true);
    const perm = setup({ canAccess });
    expect(perm.can('crm:read')).toBe(true);
    expect(canAccess).toHaveBeenCalledWith('crm:read');
  });

  it('delegates canAny() to canAccessAny', () => {
    const canAccessAny = vi.fn().mockReturnValue(true);
    const perm = setup({ canAccessAny });
    const list: Permission[] = ['crm:read', 'crm:write'];
    expect(perm.canAny(list)).toBe(true);
    expect(canAccessAny).toHaveBeenCalledWith(list);
  });

  it('canAll() returns true only when every permission passes', () => {
    const canAccess = vi.fn((p: Permission) => p === 'crm:read');
    const perm = setup({ canAccess });
    expect(perm.canAll(['crm:read'])).toBe(true);
    expect(perm.canAll(['crm:read', 'crm:write'])).toBe(false);
  });

  it('canAll() handles non-array input safely', () => {
    const canAccess = vi.fn();
    const perm = setup({ canAccess });
    const ps = null as unknown as Permission[];
    expect(perm.canAll(ps)).toBe(true);
    expect(canAccess).not.toHaveBeenCalled();
  });

  it('exposes role and isAdmin flags', () => {
    const perm = setup({ role: 'director', isAdmin: true });
    expect(perm.role).toBe('director');
    expect(perm.isAdmin).toBe(true);
  });
});
