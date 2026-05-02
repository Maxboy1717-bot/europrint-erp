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
  red: "bg-red-500 text-white",
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-500 text-white",
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
                ? "bg-blue-700 text-white dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            )}
            data-testid={`pill-tab-${tab.key}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none",
                isActive ? "bg-surface-container-lowest/20 text-white" : countColors[tab.color || "default"]
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
