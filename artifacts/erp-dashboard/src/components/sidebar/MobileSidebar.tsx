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
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menyu</SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-800 dark:text-white">
            Euro<span className="text-primary dark:text-blue-400">print</span>
            <span className="ml-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ERP</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Yopish"
          >
            <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="px-3 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-2 px-1">Modullar</p>
          <div className="grid grid-cols-3 gap-1.5">
            {filteredModules.slice(0, 12).map(([key, g]) => {
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
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center",
                    isActive
                      ? "bg-primary-container dark:bg-primary/10"
                      : "hover:bg-surface-container dark:hover:bg-slate-800"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[11px]", bg)}>
                    {g.title.charAt(0)}
                  </div>
                  <span className={cn("text-[9px] font-medium leading-tight line-clamp-2",
                    isActive ? "text-primary dark:text-blue-400" : "text-on-surface-variant dark:text-slate-400"
                  )}>
                    {g.title.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1 bg-white dark:bg-slate-950">
          {group && (
            <nav className="py-2 px-2">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-xs shadow-sm", accentBg)}>
                  {group.title.charAt(0)}
                </div>
                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{group.title}</span>
              </div>
              {(Array.isArray(filteredItems) ? filteredItems : []).map((item, index) => {
                if (item.separator) {
                  return (
                    <div key={`sep-${index}`} className="px-2 pt-4 pb-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        {item.title}
                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
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
                        ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary dark:bg-blue-400 rounded-full" />}
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </ScrollArea>

        <div className="p-3 space-y-1 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
          <button
            className="w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary text-[12px] font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            onClick={() => navigate("/kanban")}
          >
            <Plus className="h-4 w-4" />
            Yangi Vazifa
          </button>
          <div className="flex gap-1 pt-0.5">
            <button
              onClick={() => navigate("/lms/support")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-on-surface-variant dark:text-slate-400 rounded-lg hover:bg-surface-container-high dark:hover:bg-slate-800"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Yordam
            </button>
            <button
              onClick={() => navigate("/feedback")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-on-surface-variant dark:text-slate-400 rounded-lg hover:bg-surface-container-high dark:hover:bg-slate-800"
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
