import { useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useRoleMenus } from "@/hooks/use-role-menus";
import { usePermissions } from "@/hooks/usePermissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleSidebarProps } from "./sidebar/types";
import { getTranslatedMenuGroups, moduleAccentColors, MODULE_PERMISSION_KEYS } from "./sidebar/constants";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { NavGroup } from "./sidebar/NavGroup";
import { SidebarFooter } from "./sidebar/SidebarFooter";

export { MobileSidebar } from "./sidebar/MobileSidebar";
export { ModuleTabs } from "./sidebar/ModuleTabs";
export { findModuleByPath } from "./sidebar/constants";

export function ModuleSidebar({ activeModule, onModuleChange }: ModuleSidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation('navigation');
  const { isMenuAllowed, isAdmin } = useRoleMenus();
  const { hasPermission } = usePermissions();

  const translatedMenuGroups = useMemo(() => getTranslatedMenuGroups(t), [t]);
  const group = translatedMenuGroups[activeModule];
  const accentBg = moduleAccentColors[activeModule] || "bg-slate-600";

  if (!group) return null;

  const currentPath = location.slice(1);
  const moduleKey = MODULE_PERMISSION_KEYS[activeModule];
  const hasModuleAccess = isAdmin || !moduleKey || hasPermission(moduleKey);

  const filteredItems = isAdmin
    ? group.items
    : group.items?.filter((item: import("./sidebar/types").MenuItem) => {
        if (item.separator) return true;
        if (!hasModuleAccess) return false;
        return isMenuAllowed(item.url);
      });

  return (
    <aside className="fixed left-0 top-12 h-[calc(100vh-3rem)] w-64 z-40 flex-col hidden lg:flex shadow-lg border-r border-sidebar-border bg-sidebar">
      <SidebarHeader 
        icon={group.icon} 
        title={group.title} 
        accentBg={accentBg} 
      />

      <ScrollArea className="flex-1">
        <NavGroup 
          items={filteredItems} 
          currentPath={currentPath} 
        />
      </ScrollArea>

      <SidebarFooter />
    </aside>
  );
}
