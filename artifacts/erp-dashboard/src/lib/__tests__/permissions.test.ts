/**
 * @module permissions.test
 * @description Vitest tests for the RBAC permission matrix helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  getPermissionsForRole,
  isRoleInMatrix,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../permissions';

describe('getPermissionsForRole', () => {
  it('returns ["all"] for super_admin', () => {
    expect(getPermissionsForRole('super_admin')).toContain('all');
  });

  it('returns ["all"] for admin', () => {
    expect(getPermissionsForRole('admin')).toContain('all');
  });

  it('returns finance permissions for finance_manager', () => {
    const perms = getPermissionsForRole('finance_manager');
    expect(perms).toContain('finance:read');
    expect(perms).toContain('finance:approve');
  });

  it('returns empty list for unknown role', () => {
    expect(getPermissionsForRole('does_not_exist')).toEqual([]);
  });

  it('returns hr permissions for hr role', () => {
    const perms = getPermissionsForRole('hr');
    expect(perms).toContain('hr:read');
    expect(perms).toContain('hr:write');
  });
});

describe('isRoleInMatrix', () => {
  it('returns true for known roles', () => {
    expect(isRoleInMatrix('admin')).toBe(true);
    expect(isRoleInMatrix('finance_manager')).toBe(true);
    expect(isRoleInMatrix('operator')).toBe(true);
  });

  it('returns false for unknown roles', () => {
    expect(isRoleInMatrix('made_up_role')).toBe(false);
    expect(isRoleInMatrix('')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('admin "all" wildcard grants any permission', () => {
    expect(hasPermission('admin', 'crm:read')).toBe(true);
    expect(hasPermission('admin', 'finance:approve')).toBe(true);
    expect(hasPermission('super_admin', 'production:release')).toBe(true);
  });

  it('returns false for null / undefined role', () => {
    expect(hasPermission(null, 'crm:read')).toBe(false);
    expect(hasPermission(undefined, 'crm:read')).toBe(false);
  });

  it('returns true when role list contains the permission', () => {
    expect(hasPermission('finance_manager', 'finance:read')).toBe(true);
  });

  it('returns false when role list does not contain the permission', () => {
    expect(hasPermission('hr', 'finance:approve')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown_role', 'crm:read')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when at least one permission is granted', () => {
    expect(hasAnyPermission('hr', ['hr:read', 'finance:approve'])).toBe(true);
  });

  it('returns false when no permission is granted', () => {
    expect(hasAnyPermission('hr', ['finance:approve', 'finance:write'])).toBe(false);
  });

  it('returns false for empty list', () => {
    expect(hasAnyPermission('admin', [])).toBe(false);
  });

  it('admin shortcut: any permission passes', () => {
    expect(hasAnyPermission('admin', ['crm:delete', 'finance:approve'])).toBe(true);
  });
});

describe('hasAllPermissions', () => {
  it('returns true when all permissions are granted', () => {
    expect(hasAllPermissions('admin', ['crm:read', 'finance:approve'])).toBe(true);
  });

  it('returns false when one permission is missing', () => {
    expect(hasAllPermissions('hr', ['hr:read', 'finance:approve'])).toBe(false);
  });

  it('returns true for empty list (vacuously true)', () => {
    expect(hasAllPermissions('hr', [])).toBe(true);
  });

  it('returns false for unknown role with non-empty list', () => {
    expect(hasAllPermissions('unknown', ['crm:read'])).toBe(false);
  });
});
