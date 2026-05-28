/**
 * @module SidebarFooter
 * @description React UI component.
 */

import { Plus, MessageSquare, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from '@/lib/i18n';
import { APP_VERSION, LAST_UPDATED } from '@/config/module-status';

export function SidebarFooter() {
  const { t } = useTranslation("common");
  const [, setLocation] = useLocation();

  return (
    <div className="p-3 space-y-1 border-t border-sidebar-border">
      <button
        className="w-full bg-primary text-white text-[12px] font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-sm"
        data-testid="button-create-task"
        onClick={() => setLocation("/kanban")}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("yangiVazifa1")}
      </button>
      <div className="flex gap-1 pt-0.5">
        <button
          onClick={() => setLocation("/lms/support")}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium transition-colors rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
          data-testid="nav-menu-item-support"
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span>{t("help")}</span>
        </button>
        <button
          onClick={() => setLocation("/feedback")}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium transition-colors rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
          data-testid="nav-menu-item-feedback"
        >
          <Star className="h-3.5 w-3.5 shrink-0" />
          <span>{t("fikr")}</span>
        </button>
      </div>
      <div className="pt-1 text-center text-[10px] text-sidebar-foreground/30 select-none">
        v{APP_VERSION} · {LAST_UPDATED}
      </div>
    </div>
  );
}
