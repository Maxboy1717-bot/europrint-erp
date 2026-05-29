/**
 * @module ModuleSidebar
 * @description React UI component.
 */

import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Warehouse, Package, CheckSquare, Layers, AlertTriangle,
  Shield, Wrench, Home, Settings2, Store, ChevronsUpDown,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useRoleMenus } from "@/hooks/use-role-menus";
import { usePermissions } from "@/hooks/usePermissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleSidebarProps, MenuItem } from "./sidebar/types";
import { getTranslatedMenuGroups, moduleAccentColors, MODULE_PERMISSION_KEYS } from "./sidebar/constants";
import { getAuthHeaders } from "@/lib/queryClient";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { NavGroup } from "./sidebar/NavGroup";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from "@/hooks/useAuth";

export { MobileSidebar } from "./sidebar/MobileSidebar";
export { ModuleTabs } from "./sidebar/ModuleTabs";
export { findModuleByPath } from "./sidebar/constants";

// Warehouse type → lucide icon (matches POS Monitor's WH_TYPE_ICON emoji mapping)
const WH_TYPE_ICON: Record<string, typeof Warehouse> = {
  RAW_MATERIAL:   Package,
  FINISHED_GOODS: CheckSquare,
  WIP:            Layers,
  SCRAP:          AlertTriangle,
  QUARANTINE:     Shield,
  TOOLS:          Wrench,
  HOUSEHOLD:      Home,
  MRO:            Settings2,
  MAIN:           Warehouse,
  DEFAULT:        Store,
};

interface WarehouseRow {
  id: string | number;
  code: string | null;
  name: string | null;
  type: string | null;
  isActive?: boolean;
}

function useWarehouses(enabled: boolean): WarehouseRow[] {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    apiRequest<unknown>('GET', "/api/warehouse/warehouses?limit=100&isActive=true")
      .then((resp) => {
        if (cancelled) return;
        const obj = resp as Record<string, unknown>;
        const rows = Array.isArray(resp) ? resp
          : Array.isArray(obj?.data) ? obj.data
          : Array.isArray(obj?.warehouses) ? obj.warehouses
          : [];
        setWarehouses((rows as WarehouseRow[]).filter(w => w.code && w.isActive !== false));
      })
      .catch(e => console.error('Failed to load warehouses:', e));
    return () => { cancelled = true; };
  }, [enabled]);

  return warehouses;
}

/** Convert backend snake_case role to auth-namespace i18n key (e.g. "hr_manager" → "role.hrManager") */
function roleToI18nKey(role: string): string {
  const camel = role.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return `role.${camel}`;
}

/** User avatar + name + role shown at the top of the sidebar */
function AvatarBlock() {
  const { user } = useAuth();
  const { t: tAuth } = useTranslation("auth");
  const initials = [user?.firstName, user?.lastName]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => s[0].toUpperCase())
    .join("")
    .slice(0, 2) || "?";
  const roleLabel = user?.role ? (tAuth(roleToI18nKey(user.role)) || user.role) : "";
  return (
    <div className="mx-3 mt-3 mb-1 rounded-xl bg-sidebar-accent/40 hover:bg-sidebar-accent/60 transition-colors px-3.5 py-3 flex items-center gap-3 shrink-0 select-none">
      <span className="h-[38px] w-[38px] rounded-full bg-gradient-to-br from-primary to-orange-600 text-white text-[14px] font-bold flex items-center justify-center shrink-0">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-sidebar-foreground truncate leading-tight">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
          {roleLabel}
        </p>
      </div>
      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}

export function ModuleSidebar({ activeModule, onModuleChange }: ModuleSidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation('navigation');
  const { isMenuAllowed, isAdmin } = useRoleMenus();
  const { hasPermission } = usePermissions();

  const translatedMenuGroups = useMemo(() => getTranslatedMenuGroups(t), [t]);
  const group = translatedMenuGroups[activeModule];
  const accentBg = moduleAccentColors[activeModule] || "bg-slate-600";

  // Dynamic warehouse list — only fetched when tz08 (Ombor) is active
  const warehouses = useWarehouses(activeModule === "tz08");

  const warehouseItems = useMemo((): MenuItem[] => {
    if (activeModule !== "tz08" || warehouses.length === 0) return [];
    const warehousesHeader = `${t("warehousesHeader", "OMBORLAR")} (${warehouses.length})`;
    const warehouseFallback = t("warehouseFallback", "Ombor");
    return [
      {
        title: warehousesHeader,
        url: "",
        icon: Warehouse,
        separator: true,
      },
      ...warehouses.map(wh => ({
        title: wh.name ?? wh.code ?? `${warehouseFallback} #${wh.id}`,
        url: `warehouse/hub/${wh.code ?? wh.id}`,
        icon: WH_TYPE_ICON[(wh.type ?? "").toUpperCase()] ?? Store,
      })),
    ];
  }, [activeModule, warehouses, t]);

  if (!group) return null;

  const currentPath = location.slice(1);
  const moduleKey = MODULE_PERMISSION_KEYS[activeModule];
  const hasModuleAccess = isAdmin || !moduleKey || hasPermission(moduleKey);

  const filteredItems = isAdmin
    ? group.items
    : group.items?.filter((item: MenuItem) => {
        if (item.separator) return true;
        if (!hasModuleAccess) return false;
        return isMenuAllowed(item.url);
      });

  const allItems = [...filteredItems, ...warehouseItems];

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 z-40 flex-col hidden lg:flex shadow-lg border-r border-sidebar-border bg-sidebar">
      <SidebarHeader
        icon={group.icon}
        title={group.title}
        accentBg={accentBg}
      />
      <AvatarBlock />

      <ScrollArea className="flex-1">
        <NavGroup
          items={allItems}
          currentPath={currentPath}
        />
      </ScrollArea>

      <SidebarFooter />
    </aside>
  );
}
