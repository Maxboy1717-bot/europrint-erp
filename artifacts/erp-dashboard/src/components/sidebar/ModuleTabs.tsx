import { useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useRoleMenus } from "@/hooks/use-role-menus";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { ModuleSidebarProps } from "./types";
import { getTranslatedMenuGroups, MODULE_PERMISSION_KEYS } from "./constants";

export function ModuleTabs({ activeModule, onModuleChange }: ModuleSidebarProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation('navigation');
  const { isMenuAllowed, isAdmin } = useRoleMenus();
  const { hasPermission } = usePermissions();

  const translatedMenuGroups = useMemo(() => getTranslatedMenuGroups(t), [t]);

  const filteredModules = useMemo(() => {
    if (isAdmin) return Object.entries(translatedMenuGroups);
    return Object.entries(translatedMenuGroups).filter(([key, group]) => {
      const moduleKey = MODULE_PERMISSION_KEYS[key];
      if (moduleKey && !hasPermission(moduleKey)) return false;
      return group.items?.some((item) => !item.separator && isMenuAllowed(item.url));
    });
  }, [translatedMenuGroups, isMenuAllowed, isAdmin, hasPermission]);

  const handleModuleClick = (key: string) => {
    const group = translatedMenuGroups[key];
    onModuleChange(key);
    if (group?.defaultUrl) {
      setLocation(`/${group.defaultUrl}`);
    }
  };

  return (
    <div className="flex items-end h-full gap-0">
      {(Array.isArray(filteredModules) ? filteredModules : []).map(([key, group]) => {
        const isActive = activeModule === key;
        const tzNum = key.replace("tz", "");
        return (
          <button
            key={key}
            onClick={() => handleModuleClick(key)}
            data-testid={`tab-${key}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all duration-150 whitespace-nowrap",
              isActive
                ? "text-primary dark:text-blue-400 border-primary dark:border-blue-400"
                : "text-on-surface-variant dark:text-slate-400 border-transparent hover:text-on-surface dark:hover:text-slate-200"
            )}
          >
            <group.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">{group.title}</span>
            <span className="xl:hidden">{tzNum}</span>
          </button>
        );
      })}
    </div>
  );
}
