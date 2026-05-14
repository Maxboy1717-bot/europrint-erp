/**
 * @module kpi-card
 * @description React UI component.
 */

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeColor?: "red" | "blue" | "green" | "yellow" | "slate";
  description?: string;
  loading?: boolean;
  className?: string;
  "data-testid"?: string;
}

const badgeColors = {
  red: "bg-red-50 text-[var(--ep-red)] dark:bg-red-950 dark:text-red-400",
  blue: "bg-blue-50 text-[var(--ep-blue)] dark:bg-blue-950 dark:text-blue-400",
  green: "bg-green-50 text-[var(--ep-green)] dark:bg-green-950 dark:text-green-400",
  yellow: "bg-yellow-50 text-[var(--ep-yellow)] dark:bg-yellow-950 dark:text-yellow-400",
  slate: "bg-muted text-muted-foreground",
};

export function KpiCard({
  label,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor = "text-[var(--ep-blue)]",
  iconBg = "bg-blue-50 dark:bg-blue-950",
  badge,
  badgeColor = "slate",
  description,
  loading = false,
  className,
  "data-testid": testId,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl bg-card dark:bg-slate-900 shadow-sm p-6", className)}>
        <Skeleton className="h-3 w-24 mb-4 rounded-lg" />
        <Skeleton className="h-10 w-32 mb-3 rounded-lg" />
        <Skeleton className="h-3 w-16 rounded-lg" />
      </div>
    );
  }

  const trendColor =
    trend === "up" ? "text-[var(--ep-green)] dark:text-emerald-400" :
    trend === "down" ? "text-[var(--ep-red)] dark:text-red-400" :
    "text-slate-400";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "rounded-xl bg-card dark:bg-slate-900 p-6 cursor-default",
        "shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]",
        "hover:shadow-[0_4px_20px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
        "transition-shadow duration-200",
        className
      )}
      data-testid={testId}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none">
          {label}
        </p>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <Icon className={cn("h-[18px] w-[18px]", iconColor)} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-4xl font-extrabold text-foreground leading-none mb-3 tracking-tight">
        {value}
      </p>

      {/* Bottom row: trend + badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {change && (
            <>
              <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
              <span className={cn("text-xs font-semibold", trendColor)}>{change}</span>
            </>
          )}
          {description && !change && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{description}</span>
          )}
        </div>
        {badge && (
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg", badgeColors[badgeColor])}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
