/**
 * @module MobileSidebar
 * @description React UI component.
 */

import { useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useRoleMenus } from "@/hooks/use-role-menus";
import { usePermissions } from "@/hooks/usePermissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, MessageSquare, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileSidebarProps } from "./types";
import { getTranslatedMenuGroups, moduleAccentColors, MODULE_PERMISSION_KEYS } from "./constants";

export function MobileSidebar({ open, onClose, activeModule, onModuleChange }: MobileSidebarProps) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation('navigation');
  const { isMenuAllowed, isAdmin } = useRoleMenus();
  const { hasPermission } = usePermissions();

  const translatedMenuGroups = useMemo(() => getTranslatedMenuGroups(t), [t]);
  const group = translatedMenuGroups[activeModule];
  const accentBg = moduleAccentColors[activeModule] || "bg-slate-600";
  const currentPath = location.slice(1);

  const filteredModules = useMemo(() => {
    if (isAdmin) return Object.entries(translatedMenuGroups);
    return Object.entries(translatedMenuGroups).filter(([key, g]) => {
      const moduleKey = MODULE_PERMISSION_KEYS[key];
      if (moduleKey && !hasPermission(moduleKey)) return false;
      return g.items?.some((item) => !item.separator && isMenuAllowed(item.url));
    });
  }, [translatedMenuGroups, isMenuAllowed, isAdmin, hasPermission]);

  const filteredItems = !group ? [] : (isAdmin
    ? group.items
    : group.items?.filter((item) => item.separator || isMenuAllowed(item.url)));

  const navigate = (url: string) => {
    setLocation(url);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-full sm:w-[300px] p-0 flex flex-col gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("menyu")}</SheetTitle>
        </SheetHeader>

        {/* Logo header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <span className="text-sm font-bold text-foreground">
            {t("euro")}<span className="text-primary">{t('print')}</span>
            <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ERP</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={t("close2")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Module grid — all modules, 4 columns, real icons */}
        <div className="px-3 py-3 bg-muted/50 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">{t("modullar")}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
            {filteredModules.map(([key, g]) => {
              const isActive = activeModule === key;
              const bg = moduleAccentColors[key] || "bg-slate-600";
              return (
                <button
                  key={key}
                  onClick={() => {
                    onModuleChange(key);
                    if (g.defaultUrl) navigate(`/${g.defaultUrl}`);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all text-center",
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0", bg)}>
                    <g.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className={cn(
                    "text-[8px] font-medium leading-tight line-clamp-1 w-full",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {g.title.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active module nav items */}
        <ScrollArea className="flex-1 min-h-0 bg-card">
          {group && (
            <nav className="py-2 px-2">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm", accentBg)}>
                  <group.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[12px] font-bold text-foreground">{group.title}</span>
              </div>
              {(Array.isArray(filteredItems) ? filteredItems : []).map((item, index) => {
                if (item.separator) {
                  return (
                    <div key={`sep-${index}`} className="px-2 pt-4 pb-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {item.title}
                      </p>
                    </div>
                  );
                }
                const hasExactChildMatch = (Array.isArray(filteredItems) ? filteredItems : []).some(
                  (other) => !other.separator && other.url !== item.url && currentPath === other.url
                );
                const isActive =
                  currentPath === item.url ||
                  (!hasExactChildMatch && currentPath.startsWith(item.url + "/"));
                return (
                  <button
                    key={item.url + index}
                    onClick={() => navigate(`/${item.url}`)}
                    className={cn(
                      "group relative w-full flex items-center gap-3 px-3 h-10 rounded-[10px] text-[13px] font-medium transition-colors duration-150 mb-0.5 text-left",
                      isActive
                        ? "bg-sidebar-accent text-primary font-semibold shadow-[inset_3px_0_0_hsl(var(--primary))]"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/55 hover:text-primary"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-all duration-200", isActive ? "text-primary" : "text-sidebar-foreground/45 group-hover:text-primary group-hover:scale-110")} />
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-3 space-y-1 bg-card border-t border-border">
          <button
            className="w-full bg-primary text-primary-foreground text-[12px] font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-sm"
            onClick={() => navigate("/kanban")}
          >
            <Plus className="h-4 w-4" />
            {t("yangiVazifa1")}
          </button>
          <div className="flex gap-1 pt-0.5">
            <button
              onClick={() => navigate("/lms/support")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("help")}
            </button>
            <button
              onClick={() => navigate("/feedback")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              {t("fikr")}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
