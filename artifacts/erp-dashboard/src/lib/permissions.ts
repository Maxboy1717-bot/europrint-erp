/**
 * @module permissions
 * @description Frontend RBAC — the source of truth for "which UI feature
 *   does this role see?" Every gated action (a button, route, dropdown
 *   item) consults a `Permission` here. Each role gets a static permission
 *   list, and the `hasPermission(user, perm)` helper does the lookup.
 *
 *   The matching backend permission check is authoritative — this file
 *   exists only to **hide UI elements** the user can't use, so they don't
 *   click into 403 errors. Never rely on this for security.
 * @layer Frontend utility (RBAC mapping)
 *
 * WHY PERMISSIONS ARE NAMED `domain:action` STRINGS
 *   Three-part role/resource models (e.g. "can_edit_invoice_in_finance")
 *   explode combinatorially. The `domain:action` convention scales linearly
 *   with the number of domains and keeps the union type small enough to
 *   audit. New permissions go here first, then are referenced from
 *   components — TypeScript catches typos at compile time.
 *
 * WHY `"all"` SHORT-CIRCUITS EVERY CHECK
 *   Super-admin / admin roles have `["all"]` in their permission list.
 *   The `hasPermission` helper treats `"all"` as a wildcard match for any
 *   permission query. This means new permissions automatically grant to
 *   admins without touching this file — they're always allowed.
 *
 * WHY BOTH `super_admin` AND `superadmin` KEYS
 *   Legacy data has both spellings — `super_admin` from snake-case DB
 *   inserts, `superadmin` from older form code. Rather than data-migrate
 *   400+ users, we accept both at the lookup layer. Same for `admin`.
 *
 * WHY ROLE LISTS ARE FROZEN STATIC, NOT DB-DRIVEN
 *   Permissions change at a deploy cadence (when features ship). Storing
 *   them in DB would require migrations + UI for editing + audit log of
 *   permission grants — overkill for our team size. If/when we onboard
 *   a customer who needs custom role definitions, refactor to DB-driven
 *   then. Until then, code commits ARE the audit log.
 *
 * WHY THIS LIVES IN frontend (not just backend)
 *   The backend `@RequirePermission` decorator is the security gate.
 *   This file is purely for UX: hiding buttons the user can't press,
 *   avoiding empty pages that would 403, and choosing which sidebar
 *   items to render. Backend changes always come first; frontend mirrors.
 */

export type Permission =
  | "crm:read"
  | "crm:write"
  | "crm:delete"
  | "hr:read"
  | "hr:write"
  | "hr:payroll"
  | "finance:read"
  | "finance:write"
  | "finance:approve"
  | "production:read"
  | "production:write"
  | "production:release"
  | "production:complete"
  | "warehouse:read"
  | "warehouse:write"
  | "warehouse:approve"
  | "qc:read"
  | "qc:write"
  | "qc:approve"
  | "lms:read"
  | "lms:write"
  | "lms:manage"
  | "marketing:read"
  | "marketing:write"
  | "design:read"
  | "design:write"
  | "security:read"
  | "security:write"
  | "iot:read"
  | "iot:write"
  | "logistics:read"
  | "logistics:write"
  | "mro:read"
  | "mro:write"
  | "okr:read"
  | "okr:write"
  | "assets:read"
  | "assets:write"
  | "settings:read"
  | "settings:write"
  | "reports:read"
  | "audit:read"
  | "users:manage"
  | "all";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: ["all"],
  superadmin:  ["all"],
  admin: ["all"],
  director: [
    "crm:read", "crm:write",
    "hr:read",
    "finance:read", "finance:write", "finance:approve",
    "production:read",
    "warehouse:read",
    "qc:read",
    "lms:read",
    "marketing:read",
    "design:read",
    "logistics:read",
    "okr:read", "okr:write",
    "reports:read",
    "audit:read",
    "settings:read",
  ],
  ceo: [
    "crm:read", "crm:write",
    "hr:read", "hr:write",
    "finance:read", "finance:write", "finance:approve",
    "production:read",
    "warehouse:read",
    "qc:read",
    "lms:read",
    "marketing:read",
    "design:read",
    "logistics:read",
    "security:read",
    "iot:read",
    "okr:read", "okr:write",
    "reports:read",
    "audit:read",
    "settings:read",
    "users:manage",
  ],
  finance_manager: [
    "finance:read", "finance:write", "finance:approve",
    "reports:read",
  ],
  cfo: [
    "finance:read", "finance:write", "finance:approve",
    "reports:read",
    "audit:read",
  ],
  accountant: [
    "finance:read", "finance:write",
    "reports:read",
  ],
  accounting: [
    "finance:read", "finance:write",
    "reports:read",
  ],
  finance: [
    "finance:read", "finance:write",
    "reports:read",
  ],
  hr_manager: [
    "hr:read", "hr:write", "hr:payroll",
    "lms:read", "lms:write", "lms:manage",
    "reports:read",
  ],
  hr: [
    "hr:read", "hr:write",
    "lms:read",
  ],
  sales: [
    "crm:read", "crm:write",
    "warehouse:read",
    "reports:read",
  ],
  crm: [
    "crm:read", "crm:write",
    "warehouse:read",
    "reports:read",
  ],
  crm_manager: [
    "crm:read", "crm:write", "crm:delete",
    "reports:read",
  ],
  marketing: [
    "marketing:read", "marketing:write",
    "crm:read",
  ],
  design: [
    "design:read", "design:write",
    "production:read",
  ],
  technologist: [
    "production:read", "production:write",
    "warehouse:read",
    "qc:read",
  ],
  production_manager: [
    "production:read", "production:write", "production:release", "production:complete",
    "warehouse:read",
    "qc:read",
    "reports:read",
  ],
  pp_manager: [
    "production:read", "production:write", "production:release",
    "warehouse:read",
    "reports:read",
  ],
  pp: [
    "production:read", "production:write", "production:release",
    "warehouse:read",
  ],
  production: [
    "production:read", "production:write",
    "warehouse:read",
    "iot:read",
  ],
  supervisor: [
    "production:read", "production:write",
    "warehouse:read",
    "qc:read",
  ],
  operator: [
    "production:read",
    "production:complete",
    "iot:read",
  ],
  mes: [
    "production:read", "production:write",
    "iot:read", "iot:write",
  ],
  warehouse_manager: [
    "warehouse:read", "warehouse:write", "warehouse:approve",
    "production:read",
    "reports:read",
  ],
  warehouse: [
    "warehouse:read", "warehouse:write",
  ],
  wms: [
    "warehouse:read", "warehouse:write",
  ],
  procurement: [
    "warehouse:read",
    "logistics:read", "logistics:write",
    "finance:read",
    "reports:read",
  ],
  mm: [
    "warehouse:read",
    "logistics:read", "logistics:write",
    "finance:read",
  ],
  logistics: [
    "logistics:read", "logistics:write",
  ],
  qc_manager: [
    "qc:read", "qc:write", "qc:approve",
    "production:read",
    "reports:read",
  ],
  qc: [
    "qc:read", "qc:write",
    "production:read",
  ],
  quality: [
    "qc:read", "qc:write",
    "production:read",
  ],
  lms_manager: [
    "lms:read", "lms:write", "lms:manage",
    "hr:read",
  ],
  lms: [
    "lms:read", "lms:write",
  ],
  trainer: [
    "lms:read", "lms:write",
  ],
  mentor: [
    "lms:read",
    "hr:read",
  ],
  security: [
    "security:read", "security:write",
  ],
  iot: [
    "iot:read", "iot:write",
    "production:read",
  ],
  mro: [
    "mro:read", "mro:write",
    "assets:read",
  ],
  maintenance: [
    "mro:read", "mro:write",
  ],
  saas: [
    "settings:read", "settings:write",
    "users:manage",
    "audit:read",
  ],
  it: [
    "settings:read", "settings:write",
    "users:manage",
    "reports:read",
    "audit:read",
  ],
  manager: [
    "crm:read", "crm:write",
    "hr:read",
    "production:read", "production:write",
    "warehouse:read",
    "reports:read",
    "okr:read", "okr:write",
  ],
  employee: [
    "hr:read",
    "lms:read",
  ],
};

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isRoleInMatrix(role: string): boolean {
  return role in ROLE_PERMISSIONS;
}

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false;
  const perms = getPermissionsForRole(userRole);
  return perms.includes("all") || perms.includes(permission);
}

export function hasAnyPermission(userRole: string | undefined | null, permissions: Permission[]): boolean {
  return (Array.isArray(permissions) ? permissions : []).some((p) => hasPermission(userRole, p));
}

export function hasAllPermissions(userRole: string | undefined | null, permissions: Permission[]): boolean {
  return (Array.isArray(permissions) ? permissions : []).every((p) => hasPermission(userRole, p));
}
