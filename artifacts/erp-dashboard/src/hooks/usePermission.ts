/**
 * usePermission — thin shim over usePermissions.
 * Delegates to the canonical backend-aware RBAC hook so PermissionGuard
 * and PermissionButton use real position-based permissions, not the
 * hardcoded role map.
 *
 * New code should use usePermissions() directly for the full API.
 */
import { usePermissions } from "./usePermissions";
import type { Permission } from "@/lib/permissions";

export function usePermission() {
  const { canAccess, canAccessAny, role, isAdmin } = usePermissions();

  return {
    can: (permission: Permission) => canAccess(permission),
    canAny: (permissions: Permission[]) => canAccessAny(permissions),
    canAll: (permissions: Permission[]) =>
      (Array.isArray(permissions) ? permissions : []).every((p) => canAccess(p)),
    role,
    isAdmin,
  };
}
