import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Roles permitted to view sensitive HR data (salary, passport, bank, national ID).
 * Mirrors backend `HR_ROLES` in apps/api/src/common/constants/roles.constants.ts
 * (super_admin is granted by the useAuth.hasRole() implementation, but listed for clarity).
 */
export const PII_VIEWER_ROLES = [
  "super_admin",
  "director",
  "hr_manager",
  "hr_specialist",
  "hr",
] as const;

export type PiiViewerRole = (typeof PII_VIEWER_ROLES)[number];

interface RoleGateProps {
  /**
   * Roles allowed to see the wrapped children. If empty/omitted, the component
   * acts as a pass-through (renders children unconditionally) — useful when the
   * decision is made conditional by a parent.
   */
  roles?: readonly string[];
  /**
   * If the current user matches `ownerUserId`, they are always allowed (e.g. an
   * employee may see their own salary/passport even without HR role).
   */
  ownerUserId?: number | string | null;
  /**
   * Fallback rendered when access is denied. Defaults to a masked placeholder
   * `"•••••"`. Pass `null` to render nothing.
   */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Inline role-gated render. Use to hide or mask sensitive fields in the UI
 * (salary, passport, bank account, national ID) for users without HR access.
 *
 * Example:
 * ```tsx
 * <RoleGate roles={PII_VIEWER_ROLES} ownerUserId={employee.userId}>
 *   <span>{employee.salary.toLocaleString()} so'm</span>
 * </RoleGate>
 * ```
 */
export function RoleGate({
  roles,
  ownerUserId,
  fallback = <span aria-hidden="true">•••••</span>,
  children,
}: RoleGateProps) {
  const { user, hasRole } = useAuth();

  // If no roles required, render unconditionally (pass-through mode).
  if (!roles || roles.length === 0) return <>{children}</>;

  // Owner always passes (e.g. employee viewing own profile).
  if (ownerUserId !== undefined && ownerUserId !== null && user) {
    const same =
      String(user.id) === String(ownerUserId) ||
      (user.employeeId !== undefined &&
        String(user.employeeId) === String(ownerUserId));
    if (same) return <>{children}</>;
  }

  if (hasRole(...Array.from(roles))) return <>{children}</>;
  return <>{fallback}</>;
}

/**
 * Convenience helper: format a salary, returning a masked string when the
 * current user is not authorized to view it. Use for places where embedding
 * <RoleGate> in JSX is awkward (e.g. inside chart datasets).
 */
export function useMaskedSalary() {
  const { hasRole } = useAuth();
  const canView = hasRole(...Array.from(PII_VIEWER_ROLES));
  return {
    canView,
    format(value: number | string | null | undefined): string {
      if (!canView) return "•••••";
      const n = typeof value === "number" ? value : Number(value ?? 0);
      if (!Number.isFinite(n)) return "—";
      return n.toLocaleString();
    },
  };
}
