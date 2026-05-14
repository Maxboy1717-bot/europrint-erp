/**
 * @module usePermissions
 * @description Canonical frontend RBAC hook. Source of truth is the backend
 * `/api/auth/me/permissions` (the position_permissions table). When a legacy
 * user has no position_id, a hardcoded role-based map is used as fallback
 * (see ARCHITECTURE.md §7.7).
 *
 * @example
 *   const { hasPermission, hasFeature, canAccess, isAdmin } = usePermissions();
 *   if (hasPermission('CRM', 'WRITE')) { ... }
 *   if (hasFeature('crm.leads.export')) { ... }
 */
import { useAuth } from "@/hooks/useAuth";
import { usePositionPermissions } from "@/hooks/usePositionPermissions";
import {
  hasPermission as checkPermission,
  hasAnyPermission,
  getPermissionsForRole,
  isRoleInMatrix,
} from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

type ModuleAction = "READ" | "WRITE" | "DELETE" | "APPROVE" | "MANAGE" | "RELEASE" | "COMPLETE" | "PAYROLL";

// ModuleAction → backend access_level mapping
const ACTION_TO_LEVEL: Record<ModuleAction, string> = {
  READ: "READ",
  WRITE: "FULL",
  DELETE: "FULL",
  APPROVE: "READ_PLUS",
  MANAGE: "FULL",
  RELEASE: "FULL",
  COMPLETE: "FULL",
  PAYROLL: "FULL",
};

// Module name aliases (frontend → backend)
const MODULE_ALIAS: Record<string, string> = {
  CRM: "CRM",
  HR: "HR",
  FINANCE: "FI",
  PRODUCTION: "PP",
  WAREHOUSE: "WMS",
  QC: "QC",
  LMS: "LMS",
  MARKETING: "ECOMMERCE",
  DESIGN: "DESIGN",
  SECURITY: "security",
  IOT: "iot",
  LOGISTICS: "LOGISTICS",
  MRO: "MM",
  SETTINGS: "MDM",
  OKR: "BI",
  REPORTS: "BI",
  DIRECTOR: "BI",
  AUDIT: "MDM",
  USERS: "MDM",
  SD: "SD",
  MM: "MM",
  POS: "POS",
  ECOMMERCE: "ECOMMERCE",
  BI: "BI",
  MDM: "MDM",
};

// Access level hierarchy (yuqori darajalar pastki amallarni qoplaydi)
const LEVEL_HIERARCHY: Record<string, number> = {
  NONE: 0,
  LIMITED: 1,
  READ: 2,
  READ_PLUS: 3,
  FULL: 4,
};

function levelMeets(actual: string | undefined, required: string): boolean {
  const actualScore = LEVEL_HIERARCHY[(actual ?? "NONE").toUpperCase()] ?? 0;
  const requiredScore = LEVEL_HIERARCHY[required.toUpperCase()] ?? 0;
  return actualScore >= requiredScore;
}

// Mirror of ROLE_ALIASES from useAuth.tsx — keep in sync with backend
const ROLE_ALIASES: Record<string, string> = {
  admin: "super_admin", superadmin: "super_admin", super_admin: "super_admin",
  director: "director", ceo: "director", manager: "director",
  sales: "sales_manager", sales_manager: "sales_manager", crm_manager: "sales_manager", marketing: "sales_manager",
  designer: "designer",
  technologist: "technologist", technolog: "technologist",
  pp_manager: "pp_viewer", pp_viewer: "pp_viewer", production_manager: "pp_viewer",
  operator: "operator",
  warehouse: "warehouse_manager", warehouse_manager: "warehouse_manager", wm_manager: "warehouse_manager", logistics_manager: "warehouse_manager",
  qc: "qc_manager", qc_manager: "qc_manager",
  finance: "finance_manager", finance_manager: "finance_manager", cfo: "finance_manager", accountant: "finance_manager",
  hr: "hr_manager", hr_manager: "hr_manager", lms_admin: "hr_manager",
  department_head: "department_head",
};

function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  return ROLE_ALIASES[role.toLowerCase()] ?? role.toLowerCase();
}

export function usePermissions() {
  const { user } = useAuth();
  const { permissions: serverPerms } = usePositionPermissions();

  const role = normalizeRole(user?.role);
  const isAdmin = serverPerms?.isAdmin === true || role === "admin" || role === "super_admin" || role === "superadmin";
  const isKnownRole = role ? isRoleInMatrix(role) : false;

  // Backend modulesdan moduleCode → level Map yaratish
  const safeModules = Array.isArray(serverPerms?.modules) ? serverPerms.modules : [];
  const modulesMap: Record<string, string> = {};
  for (const m of safeModules) {
    modulesMap[m.module.toUpperCase()] = m.level;
  }

  const safeFlags = Array.isArray(serverPerms?.featureFlags) ? serverPerms.featureFlags : [];
  const featureFlagsSet = new Set(safeFlags);

  const hasPermission = (module: string, action: ModuleAction = "READ"): boolean => {
    if (isAdmin) return true;

    // 1. Avval BACKEND'dan o'qish (yangi position-based)
    if (serverPerms !== null && serverPerms !== undefined) {
      const backendModule = MODULE_ALIAS[module.toUpperCase()] ?? module.toUpperCase();
      const requiredLevel = ACTION_TO_LEVEL[action] ?? "READ";
      const actualLevel = modulesMap[backendModule];
      if (actualLevel !== undefined) {
        return levelMeets(actualLevel, requiredLevel);
      }
    }

    // 2. Fallback: hardcoded role map (legacy)
    if (!role || !isKnownRole) return false;
    const fallbackPerm = `${module.toLowerCase()}:${action.toLowerCase()}` as Permission;
    return checkPermission(role, fallbackPerm);
  };

  const hasFeature = (featureKey: string): boolean => {
    if (isAdmin) return true;

    // 1. Backend feature flags
    if (featureFlagsSet.has(featureKey)) return true;

    // 2. Fallback: legacy role-based feature map
    if (!role || !isKnownRole) return false;
    // Legacy fallback - keep working old feature names
    return false;
  };

  const canAccess = (permission: Permission): boolean => {
    if (isAdmin) return true;
    if (!role || !isKnownRole) return false;
    return checkPermission(role, permission);
  };

  const canAccessAny = (perms: Permission[]): boolean => {
    if (isAdmin) return true;
    if (!role || !isKnownRole) return false;
    const safe = Array.isArray(perms) ? perms : [];
    return hasAnyPermission(role, safe);
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
    // Yangi: backend'dan kelgan position ma'lumotlari
    positionCode: serverPerms?.positionCode ?? null,
    positionNameUz: serverPerms?.positionNameUz ?? null,
    departmentCode: serverPerms?.departmentCode ?? null,
    rbacTier: serverPerms?.rbacTier ?? null,
  };
}
