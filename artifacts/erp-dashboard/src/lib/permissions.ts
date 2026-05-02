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
