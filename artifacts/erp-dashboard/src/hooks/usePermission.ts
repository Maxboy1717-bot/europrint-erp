import { useAuth } from "@/hooks/useAuth";
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from "@/lib/permissions";

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    can: (permission: Permission): boolean => hasPermission(role, permission),
    canAny: (permissions: Permission[]): boolean => hasAnyPermission(role, permissions),
    canAll: (permissions: Permission[]): boolean => hasAllPermissions(role, permissions),
    role,
    isAdmin: role === "admin" || role === "super_admin",
  };
}
