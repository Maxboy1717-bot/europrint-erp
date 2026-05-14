/**
 * @module PermissionGuard
 * @description React UI component.
 */

import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, canAny, canAll } = usePermission();

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    allowed = true;
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: Permission;
  children: ReactNode;
}

export function PermissionButton({ permission, children, ...props }: PermissionButtonProps) {
  const { can } = usePermission();
  if (!can(permission)) return null;
  return <button {...props}>{children}</button>;
}
