/**
 * @module ModuleTabs
 * @description React UI component.
 */

import { useMemo, useRef, useEffect } from "react";
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

  // Active modul tasmaning chetida bo'lsa — ko'rinishga surib chiqar (klip bo'lib qolmasin).
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeModule]);

  return (
    <div className="ep-module-tabs flex items-end h-full gap-0 w-full min-w-0">
      {(Array.isArray(filteredModules) ? filteredModules : []).map(([key, group]) => {
        const isActive = activeModule === key;
        return (
          <button
            key={key}
            ref={isActive ? activeRef : undefined}
            onClick={() => handleModuleClick(key)}
            data-testid={`tab-${key}`}
            title={group.title}
            className={cn(
              "flex items-center gap-1.5 px-2.5 xl:px-3 py-3 text-[12px] font-medium border-b-2 transition-colors duration-100 whitespace-nowrap",
              isActive
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <group.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">{group.title}</span>
          </button>
        );
      })}
    </div>
  );
}
