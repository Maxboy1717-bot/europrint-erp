/**
 * @module shared/StatCard
 * @description Canonical StatCard — single source of truth for stat/KPI cards.
 *
 * Merged from:
 *   - components/hr/orgnode/StatCard.tsx   (icon: ReactNode, label, value, color — compact tile)
 *   - components/recruiting/helpers-atoms  (same shape)
 *   - pages/MaterialBalanceTypes.tsx       (title, value, icon, loading, variant)
 *   - pages/DirectorExtendedDialogs.tsx    (icon, label, value, sub, color)
 *
 * The `icon` prop accepts either:
 *   - A Lucide icon component:  icon={Users}
 *   - A pre-rendered JSX node:  icon={<Users className="h-4 w-4" />}
 *
 * All props are optional so any caller pattern works:
 *   <StatCard label="Xodimlar" value={42} icon={Users} color="#6366f1" />
 *   <StatCard title="Kirim" value="12 t" icon={TrendingUp} loading={isLoading} variant="warning" />
 *   <StatCard label="OEE" value="87%" icon={Gauge} sub="o'rtacha samaradorlik" />
 *   <StatCard label="Bo'limlar" value={5} icon={<Building2 className="h-4 w-4" />} color="#1d4ed8" />
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  /** Primary heading — either `label` (orgnode / director style) or `title` (material balance style). */
  label?: string;
  /** Alias for `label` — whichever is passed will be shown. */
  title?: string;
  /** Numeric or formatted string value to display prominently. */
  value: string | number;
  /**
   * Icon to display.
   * Pass either a Lucide icon component reference (`icon={Users}`)
   * or a pre-rendered JSX node (`icon={<Users className="h-4 w-4" />}`).
   */
  icon: React.ReactNode | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Optional secondary text shown below value. */
  sub?: string;
  /**
   * Colour override (hex / CSS variable string).
   * When provided the component renders in compact tile style.
   */
  color?: string;
  /** Show skeleton shimmer instead of value. */
  loading?: boolean;
  /**
   * Severity variant (affects value + icon colour).
   * Only applied when `loading` is false.
   */
  variant?: "default" | "warning" | "critical";
  /** Extra classes on the root element. */
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function variantColorClass(variant: StatCardProps["variant"]): string {
  if (variant === "critical") return "text-[var(--ep-red)] dark:text-red-400";
  if (variant === "warning")  return "text-[var(--ep-yellow)] dark:text-yellow-400";
  return "text-foreground";
}

/**
 * Normalize the icon prop:
 * - If it's already a rendered JSX element (`<Users />`), use it directly.
 * - Otherwise treat it as a component reference (function OR forwardRef object)
 *   and render it — Lucide icons are forwardRef objects, so `typeof` is not
 *   reliable here; `React.isValidElement` correctly distinguishes rendered
 *   JSX from unrendered component references.
 */
function renderIcon(
  icon: StatCardProps["icon"],
  className?: string,
  style?: React.CSSProperties,
): React.ReactNode {
  if (React.isValidElement(icon)) {
    // Already rendered (e.g. `icon={<Users className="h-4 w-4" />}`)
    return icon;
  }
  // Component reference (function or forwardRef like Lucide icons)
  const IconComp = icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  return <IconComp className={className} style={style} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  title,
  value,
  icon,
  sub,
  color,
  loading = false,
  variant = "default",
  className,
}: StatCardProps) {
  const heading = label ?? title ?? "";
  const colorClass = variantColorClass(variant);

  // Compact tile style (when a raw color hex/CSS-var is provided)
  if (color) {
    return (
      <div
        className={`bg-muted/40 rounded-xl p-4 flex items-center gap-3 min-w-[130px] ${className ?? ""}`}
        data-testid="stat-card"
      >
        <div
          className="rounded-lg p-2 shrink-0"
          style={{ background: `${color}20` }}
        >
          {renderIcon(icon, "w-5 h-5", { color })}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{heading}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1 rounded-lg" />
          ) : (
            <p className="text-lg font-bold leading-tight">{value}</p>
          )}
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    );
  }

  // Card style (when no raw color override is needed)
  return (
    <Card className={className} data-testid="stat-card">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-2 rounded-md bg-muted shrink-0">
          {renderIcon(icon, `w-6 h-6 ${colorClass}`)}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{heading}</p>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1 rounded-lg" />
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
          )}
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
