/**
 * @module pill-tabs
 * @description React UI component.
 */

import { cn } from "@/lib/utils";

interface PillTab {
  key: string;
  label: string;
  count?: number;
  color?: "default" | "red" | "blue" | "green" | "yellow";
}

interface PillTabsProps {
  tabs: PillTab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

const countColors = {
  red: "bg-[var(--ep-red)] text-white",
  blue: "bg-[var(--ep-blue)] text-white",
  green: "bg-[var(--ep-green)] text-white",
  yellow: "bg-[var(--ep-yellow)] text-white",
  default: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export function PillTabs({ tabs, active, onChange, className }: PillTabsProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {(Array.isArray(tabs) ? tabs : []).map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            data-testid={`pill-tab-${tab.key}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none",
                isActive ? "bg-card/20 text-white" : countColors[tab.color || "default"]
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
