/**
 * @module SidebarHeader
 * @description React UI component.
 */

import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";

interface SidebarHeaderProps {
  icon: typeof LayoutDashboard;
  title: string;
  accentBg: string;
}

export function SidebarHeader({ icon: Icon, title, accentBg }: SidebarHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-white select-none", accentBg)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-sidebar-foreground leading-tight">{title}</p>
          <p className="text-[10px] font-medium mt-0.5 text-sidebar-foreground/50">EuroPrint ERP</p>
        </div>
      </div>
    </div>
  );
}
