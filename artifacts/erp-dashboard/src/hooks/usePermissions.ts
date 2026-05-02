import { useAuth } from "@/hooks/useAuth";
import {
  hasPermission as checkPermission,
  hasAnyPermission,
  getPermissionsForRole,
  isRoleInMatrix,
} from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

type ModuleAction = "READ" | "WRITE" | "DELETE" | "APPROVE" | "MANAGE" | "RELEASE" | "COMPLETE" | "PAYROLL";

const MODULE_PERMISSION_MAP: Record<string, Record<ModuleAction, Permission>> = {
  CRM:        { READ: "crm:read",        WRITE: "crm:write",        DELETE: "crm:delete",        APPROVE: "crm:write",        MANAGE: "crm:write",        RELEASE: "crm:write",        COMPLETE: "crm:write",        PAYROLL: "crm:write"        },
  HR:         { READ: "hr:read",         WRITE: "hr:write",         DELETE: "hr:write",           APPROVE: "hr:write",         MANAGE: "hr:write",         RELEASE: "hr:write",         COMPLETE: "hr:write",         PAYROLL: "hr:payroll"       },
  FINANCE:    { READ: "finance:read",    WRITE: "finance:write",    DELETE: "finance:write",      APPROVE: "finance:approve",  MANAGE: "finance:write",    RELEASE: "finance:write",    COMPLETE: "finance:write",    PAYROLL: "finance:write"    },
  PRODUCTION: { READ: "production:read", WRITE: "production:write", DELETE: "production:write",   APPROVE: "production:write", MANAGE: "production:write", RELEASE: "production:release", COMPLETE: "production:complete", PAYROLL: "production:write" },
  WAREHOUSE:  { READ: "warehouse:read",  WRITE: "warehouse:write",  DELETE: "warehouse:write",    APPROVE: "warehouse:approve", MANAGE: "warehouse:write", RELEASE: "warehouse:write",  COMPLETE: "warehouse:write",  PAYROLL: "warehouse:write"  },
  QC:         { READ: "qc:read",         WRITE: "qc:write",         DELETE: "qc:write",           APPROVE: "qc:approve",       MANAGE: "qc:write",         RELEASE: "qc:write",         COMPLETE: "qc:write",         PAYROLL: "qc:write"         },
  LMS:        { READ: "lms:read",        WRITE: "lms:write",        DELETE: "lms:write",          APPROVE: "lms:write",        MANAGE: "lms:manage",       RELEASE: "lms:write",        COMPLETE: "lms:write",        PAYROLL: "lms:write"        },
  MARKETING:  { READ: "marketing:read",  WRITE: "marketing:write",  DELETE: "marketing:write",    APPROVE: "marketing:write",  MANAGE: "marketing:write",  RELEASE: "marketing:write",  COMPLETE: "marketing:write",  PAYROLL: "marketing:write"  },
  DESIGN:     { READ: "design:read",     WRITE: "design:write",     DELETE: "design:write",       APPROVE: "design:write",     MANAGE: "design:write",     RELEASE: "design:write",     COMPLETE: "design:write",     PAYROLL: "design:write"     },
  SECURITY:   { READ: "security:read",   WRITE: "security:write",   DELETE: "security:write",     APPROVE: "security:write",   MANAGE: "security:write",   RELEASE: "security:write",   COMPLETE: "security:write",   PAYROLL: "security:write"   },
  IOT:        { READ: "iot:read",        WRITE: "iot:write",        DELETE: "iot:write",          APPROVE: "iot:write",        MANAGE: "iot:write",        RELEASE: "iot:write",        COMPLETE: "iot:write",        PAYROLL: "iot:write"        },
  LOGISTICS:  { READ: "logistics:read",  WRITE: "logistics:write",  DELETE: "logistics:write",    APPROVE: "logistics:write",  MANAGE: "logistics:write",  RELEASE: "logistics:write",  COMPLETE: "logistics:write",  PAYROLL: "logistics:write"  },
  MRO:        { READ: "mro:read",        WRITE: "mro:write",        DELETE: "mro:write",          APPROVE: "mro:write",        MANAGE: "mro:write",        RELEASE: "mro:write",        COMPLETE: "mro:write",        PAYROLL: "mro:write"        },
  SETTINGS:   { READ: "settings:read",   WRITE: "settings:write",   DELETE: "settings:write",     APPROVE: "settings:write",   MANAGE: "settings:write",   RELEASE: "settings:write",   COMPLETE: "settings:write",   PAYROLL: "settings:write"   },
  OKR:        { READ: "okr:read",        WRITE: "okr:write",        DELETE: "okr:write",          APPROVE: "okr:write",        MANAGE: "okr:write",        RELEASE: "okr:write",        COMPLETE: "okr:write",        PAYROLL: "okr:write"        },
  REPORTS:    { READ: "reports:read",    WRITE: "reports:read",     DELETE: "reports:read",       APPROVE: "reports:read",     MANAGE: "reports:read",     RELEASE: "reports:read",     COMPLETE: "reports:read",     PAYROLL: "reports:read"     },
  DIRECTOR:   { READ: "reports:read",    WRITE: "okr:write",        DELETE: "reports:read",       APPROVE: "reports:read",     MANAGE: "reports:read",     RELEASE: "reports:read",     COMPLETE: "reports:read",     PAYROLL: "reports:read"     },
  AUDIT:      { READ: "audit:read",      WRITE: "audit:read",       DELETE: "audit:read",         APPROVE: "audit:read",       MANAGE: "audit:read",       RELEASE: "audit:read",       COMPLETE: "audit:read",       PAYROLL: "audit:read"       },
  USERS:      { READ: "users:manage",    WRITE: "users:manage",     DELETE: "users:manage",       APPROVE: "users:manage",     MANAGE: "users:manage",     RELEASE: "users:manage",     COMPLETE: "users:manage",     PAYROLL: "users:manage"     },
};

const FEATURE_MAP: Record<string, Permission> = {
  "crm.leads.export":           "crm:read",
  "crm.leads.create":           "crm:write",
  "crm.leads.delete":           "crm:delete",
  "crm.contracts.approve":      "crm:write",
  "hr.employees.create":        "hr:write",
  "hr.employees.delete":        "hr:write",
  "hr.payroll.view":            "hr:payroll",
  "hr.payroll.process":         "hr:payroll",
  "finance.reports.export":     "finance:read",
  "finance.budget.approve":     "finance:approve",
  "finance.cashflow.view":      "finance:read",
  "production.orders.release":  "production:release",
  "production.orders.complete": "production:complete",
  "production.planning.edit":   "production:write",
  "warehouse.inventory.export": "warehouse:read",
  "warehouse.grn.approve":      "warehouse:approve",
  "qc.inspection.approve":      "qc:approve",
  "qc.defect.create":           "qc:write",
  "lms.courses.create":         "lms:write",
  "lms.tests.manage":           "lms:manage",
  "lms.certificates.issue":     "lms:write",
  "marketing.campaigns.create": "marketing:write",
  "marketing.budget.view":      "marketing:read",
  "design.artwork.create":      "design:write",
  "design.approval.submit":     "design:write",
  "security.zones.manage":      "security:write",
  "iot.sensors.view":           "iot:read",
  "logistics.routes.plan":      "logistics:write",
  "mro.maintenance.create":     "mro:write",
  "settings.users.manage":      "users:manage",
  "settings.system.edit":       "settings:write",
  "reports.view":               "reports:read",
  "audit.log.view":             "audit:read",
};

function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  return role;
}

export function usePermissions() {
  const { user } = useAuth();
  const rawRole = user?.role;
  const role = normalizeRole(rawRole);
  const isAdmin = role === "admin" || role === "super_admin" || role === "superadmin";
  const isKnownRole = role ? isRoleInMatrix(role) : false;

  const hasPermission = (module: string, action: ModuleAction = "READ"): boolean => {
    if (isAdmin) return true;
    if (!role) return false;
    if (!isKnownRole) return false;

    const moduleUpper = module.toUpperCase() as keyof typeof MODULE_PERMISSION_MAP;
    const moduleMap = MODULE_PERMISSION_MAP[moduleUpper];
    if (!moduleMap) return false;

    const permission = moduleMap[action];
    return checkPermission(role, permission);
  };

  const hasFeature = (featureKey: string): boolean => {
    if (isAdmin) return true;
    if (!role) return false;
    if (!isKnownRole) return false;

    const permission = FEATURE_MAP[featureKey];
    if (!permission) return false;

    return checkPermission(role, permission);
  };

  const canAccess = (permission: Permission): boolean => {
    if (isAdmin) return true;
    if (!role) return false;
    if (!isKnownRole) return false;
    return checkPermission(role, permission);
  };

  const canAccessAny = (permissions: Permission[]): boolean => {
    if (isAdmin) return true;
    if (!role) return false;
    if (!isKnownRole) return false;
    return hasAnyPermission(role, permissions);
  };

  const permissions = role ? getPermissionsForRole(role) : [];

  return {
    hasPermission,
    hasFeature,
    canAccess,
    canAccessAny,
    permissions,
    role,
    isAdmin,
    isKnownRole,
  };
}
