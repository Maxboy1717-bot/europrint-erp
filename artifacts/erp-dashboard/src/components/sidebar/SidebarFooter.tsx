/**
 * @module SidebarFooter
 * @description React UI component.
 */

import { Plus, MessageSquare, Star } from "lucide-react";
import { useLocation } from "wouter";

export function SidebarFooter() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-3 space-y-1 border-t border-sidebar-border">
      <button
        className="w-full bg-primary text-white text-[12px] font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-sm"
        data-testid="button-create-task"
        onClick={() => setLocation("/kanban")}
      >
        <Plus className="h-3.5 w-3.5" />
        Yangi Vazifa
      </button>
      <div className="flex gap-1 pt-0.5">
        <button
          onClick={() => setLocation("/lms/support")}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium transition-colors rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
          data-testid="nav-menu-item-support"
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span>Yordam</span>
        </button>
        <button
          onClick={() => setLocation("/feedback")}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium transition-colors rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
          data-testid="nav-menu-item-feedback"
        >
          <Star className="h-3.5 w-3.5 shrink-0" />
          <span>Fikr</span>
        </button>
      </div>
    </div>
  );
}
