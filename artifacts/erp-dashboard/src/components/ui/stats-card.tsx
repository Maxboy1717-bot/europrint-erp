/**
 * @module stats-card
 * @description React UI component.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export type StatsCardVariant = "sd" | "pp" | "hr" | "warehouse" | "fi" | "default"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  variant?: StatsCardVariant
  trend?: {
    value: string | number
    label?: string
    positive?: boolean
    isPositive?: boolean
  }
  className?: string
  "data-testid"?: string
}

const variantStyles: Record<StatsCardVariant, { bg: string; iconBg: string; gradient: string; accentColor: string }> = {
  sd: {
    bg: "bg-module-sd-light dark:bg-module-sd-light/10",
    iconBg: "bg-module-sd/20 text-module-sd dark:bg-module-sd/30",
    gradient: "from-module-sd to-module-sd-dark",
    accentColor: "text-module-sd"
  },
  pp: {
    bg: "bg-module-pp-light dark:bg-module-pp-light/10",
    iconBg: "bg-module-pp/20 text-module-pp dark:bg-module-pp/30",
    gradient: "from-module-pp to-module-pp-dark",
    accentColor: "text-module-pp"
  },
  hr: {
    bg: "bg-module-hr-light dark:bg-module-hr-light/10",
    iconBg: "bg-module-hr/20 text-module-hr dark:bg-module-hr/30",
    gradient: "from-module-hr to-module-hr-dark",
    accentColor: "text-module-hr"
  },
  warehouse: {
    bg: "bg-module-warehouse-light dark:bg-module-warehouse-light/10",
    iconBg: "bg-module-warehouse/20 text-module-warehouse dark:bg-module-warehouse/30",
    gradient: "from-module-warehouse to-module-warehouse-dark",
    accentColor: "text-module-warehouse"
  },
  fi: {
    bg: "bg-module-fi-light dark:bg-module-fi-light/10",
    iconBg: "bg-module-fi/20 text-module-fi dark:bg-module-fi/30",
    gradient: "from-module-fi to-module-fi-dark",
    accentColor: "text-module-fi"
  },
  default: {
    bg: "bg-muted/50 dark:bg-muted/20",
    iconBg: "bg-muted text-muted-foreground dark:bg-muted/50",
    gradient: "from-muted-foreground/50 to-muted-foreground",
    accentColor: "text-muted-foreground"
  }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
  className,
  "data-testid": testId
}: StatsCardProps) {
  const styles = variantStyles[variant]
  
  return (
    <div
      data-testid={testId}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 p-6 transition-all duration-200",
        styles.bg,
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        "hover:border-border hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
                (trend.positive !== false && trend.isPositive !== false)
                  ? "text-[var(--ep-green)] bg-emerald-500/10 dark:text-emerald-400" 
                  : "text-[var(--ep-red)] bg-red-500/10 dark:text-red-400"
              )}>
                {typeof trend.value === 'string' ? trend.value : `${trend.positive !== false ? "↑" : "↓"} ${Math.abs(trend.value)}%`}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            styles.iconBg
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
        styles.gradient
      )} />
    </div>
  )
}

export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-border/50 p-6 bg-card animate-pulse",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
