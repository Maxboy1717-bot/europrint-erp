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
          <SheetTitle>Menyu</SheetTitle>
        </SheetHeader>

        {/* Logo header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <span className="text-sm font-bold text-foreground">
            Euro<span className="text-primary">{t('print')}</span>
            <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ERP</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Yopish"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Module grid — all modules, 4 columns, real icons */}
        <div className="px-3 py-3 bg-muted/50 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">Modullar</p>
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
        <ScrollArea className="flex-1 bg-card">
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
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                        <span className="flex-1 h-px bg-border" />
                        {item.title}
                        <span className="flex-1 h-px bg-border" />
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
                      "relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 mb-0.5 text-left",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                    )}
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-3 space-y-1 bg-card border-t border-border">
          <button
            className="w-full from-primary to-amber-500 text-primary-foreground text-[12px] font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            onClick={() => navigate("/kanban")}
          >
            <Plus className="h-4 w-4" />
            Yangi Vazifa
          </button>
          <div className="flex gap-1 pt-0.5">
            <button
              onClick={() => navigate("/lms/support")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Yordam
            </button>
            <button
              onClick={() => navigate("/feedback")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              Fikr
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
