/**
 * @module use-role-menus
 * @description React custom hook.
 */

import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  role: string;
  fullName?: string;
}

interface RoleMenu {
  id: string;
  menuPath: string;
  role: string;
}

// Har bir rol qaysi URL prefikslarini ko'ra olishi mumkin
const ROLE_MODULE_MAP: Record<string, string[]> = {
  // TZ-01: Savdo va CRM
  sales:      ["sd-", "sd/", "crm", "customers", "orders", "quotations", "contracts", "debitors", "papka", "order-workflow"],
  crm:        ["sd-", "sd/", "crm", "customers", "orders", "quotations", "contracts", "debitors", "papka", "order-workflow"],

  // TZ-02: Marketing
  marketing:  ["marketing", "social", "campaign", "seo", "ab-test"],

  // TZ-03: Dizayn va Tayyorlov
  design:     ["design", "tech-prep", "prepress", "artwork", "color"],

  // TZ-04: Sifat nazorati
  qc:         ["qc", "quality", "inspection", "lab", "defect"],
  quality:    ["qc", "quality", "inspection", "lab", "defect"],

  // TZ-05 + TZ-06: Texnolog va PP
  technologist: ["tech/", "bom", "routing", "tech-approval", "capacity"],
  pp:           ["pp/", "planning", "ai-production", "erp-production", "daily-reports"],
  production_manager: ["pp/", "planning", "mes/", "erp-production", "daily-reports", "capacity"],

  // TZ-07: MES + IoT planshet
  operator:     ["mes/", "iot/tablet", "iot/live", "shift"],
  mes:          ["mes/", "iot/", "shift", "oee"],
  production:   ["mes/", "iot/", "erp-production", "shift", "planning"],

  // TZ-08: Ombor (WMS)
  warehouse:    ["wms/", "warehouse/", "barcode", "inventory", "goods-receiving", "stock"],
  wms:          ["wms/", "warehouse/", "barcode", "inventory", "goods-receiving", "stock"],

  // TZ-09: Ta'minot va Logistika
  procurement:  ["mm/", "supplier", "purchase", "logistics", "transport", "delivery"],
  mm:           ["mm/", "supplier", "purchase", "logistics", "transport", "delivery"],
  logistics:    ["logistics", "transport", "delivery", "driver", "gps"],

  // TZ-10: Moliya
  finance:      ["fi/", "accounting/", "finance/", "budget", "cash-flow", "gl-", "payroll", "tax"],
  accounting:   ["fi/", "accounting/", "finance/", "budget", "cash-flow", "gl-"],
  cfo:          ["fi/", "accounting/", "finance/", "budget", "cash-flow", "gl-", "payroll", "director"],

  // TZ-11: HR
  hr:           ["hr/", "employees", "departments", "positions", "orgstructure", "recruiting", "shift-schedule", "discipline", "adaptation", "goals"],

  // TZ-12: Ta'lim (LMS)
  lms:          ["lms", "courses", "tests", "ai-exams", "certificates", "skills", "knowledge", "mentorship"],
  trainer:      ["lms", "courses", "tests", "ai-exams", "certificates", "skills", "knowledge"],
  mentor:       ["mentorship", "courses", "lms"],

  // TZ-13: Xavfsizlik
  security:     ["security/", "access-control", "incidents", "ppe", "evacuation", "visitor"],

  // TZ-14: MRO / Xo'jalik
  mro:          ["mro/", "integration/", "maintenance", "energy", "cleaning", "uniforms"],
  maintenance:  ["mro/", "integration/", "maintenance", "energy"],

  // TZ-15: IoT va Kamera
  iot:          ["iot/", "sensor", "camera", "digital-twin", "predictive"],

  // TZ-16: Direktor
  director:     ["director/", "analytics", "goals", "strategic", "kpi", "coordination"],
  ceo:          ["director/", "analytics", "goals", "strategic", "kpi", "fi/", "hr/", "mes/", "coordination"],
  manager:      ["director/", "analytics", "goals", "strategic", "kpi", "coordination"],

  // TZ-17: SaaS / IT
  saas:         ["saas/", "super-admin", "tenants", "licensing"],
  it:           ["saas/", "super-admin", "settings"],

  // Umumiy xodim — faqat o'z profilini va LMS ni ko'radi
  employee:     ["employees/", "lms", "courses", "tests", "certificates", "goals/my", "shift-schedule"],
};

export function useRoleMenus() {
  const { data: user } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });

  const role = user?.role || 'viewer';

  const { data: allowedMenus } = useQuery<RoleMenu[]>({
    queryKey: ["/api/europrint-control/menus", role],
    enabled: !!role,
  });

  const isMenuAllowed = (menuPath: string): boolean => {
    // Admin va superadmin hamma narsani ko'radi
    if (role === 'admin' || role === 'super_admin') return true;

    // Chat — barcha xodimlar uchun universal modul
    if (menuPath === 'chat' || menuPath === '/chat' || menuPath.startsWith('chat')) return true;

    // DB da sozlangan ruxsatlar bo'lsa, o'shani ishlatamiz
    if (allowedMenus && allowedMenus.length > 0) {
      return (Array.isArray(allowedMenus) ? allowedMenus : []).some((menu: RoleMenu) =>
        menuPath.includes(menu.menuPath) || menu.menuPath?.includes(menuPath)
      );
    }

    // DB bo'sh bo'lsa → built-in rol mapping ishlatamiz
    const rolePrefixes = ROLE_MODULE_MAP[role];
    if (!rolePrefixes) {
      // Tanilmagan rol → hech narsani ko'rsatmaymiz (xavfsiz fail-closed)
      return false;
    }

    return (Array.isArray(rolePrefixes) ? rolePrefixes : []).some(prefix => menuPath.includes(prefix) || menuPath.startsWith(prefix));
  };

  const isAdmin = role === 'admin' || role === 'super_admin';

  return { role, allowedMenus, isMenuAllowed, isAdmin };
}
