/**
 * @module EPKpiCard
 * @description Canonical EuroPrint KPI tile — used at the top of every
 *   dashboard page (ListPage, DetailPage hero, sector dashboards). Anatomy:
 *
 *     ┌─────────────────────────────────────┐
 *     │  ┌────┐  EYEBROW LABEL (11px UPPER) │
 *     │  │ ic │  ┌──────────────────────┐   │
 *     │  └────┘  │ 28px / 700 value ↑ X%│   │
 *     │          └──────────────────────┘   │
 *     │  Sub-link (optional, brand orange)  │
 *     └─────────────────────────────────────┘
 *
 *   The value count-ups from 0 over ~1.2s on mount. Numeric props go through
 *   `useCountUp` automatically; pass `staticValue` (string/ReactNode) to skip
 *   the animation for things like "—" or "48 / 50".
 *
 *   `delta` adds an inline arrow + percentage (green=up, red=down).
 */

import * as React from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "./useCountUp";
import { EPCard, type EPModuleColor } from "./EPCard";

type DeltaTrend = "up" | "down" | "flat";

interface EPKpiCardProps {
  /** UPPERCASE eyebrow label (11px, letter-spacing 0.6px). */
  label: string;
  /** Numeric value — animates from 0. Set `staticValue` instead for non-numeric. */
  value?: number;
  /** Non-numeric or pre-formatted value (e.g. "48 / 50", "—"). Skips animation. */
  staticValue?: React.ReactNode;
  /** Format the animated number for display (e.g. compact, percent, currency). */
  formatValue?: (n: number) => string;
  /** Lucide icon shown inside the 42px round tile. */
  icon: LucideIcon;
  /** Background of the icon tile. Default: brand orange. */
  iconBg?: EPModuleColor | string;
  /** Optional small caption under the value (e.g. "↑ 12%"). */
  delta?: { value: string; trend: DeltaTrend };
  /** Optional bottom-right link text — orange, 11px (e.g. "Hammasi →"). */
  linkLabel?: string;
  /** Called when the optional link is clicked. */
  onLinkClick?: () => void;
  /** Make the entire card clickable (adds hover-lift). */
  onClick?: () => void;
  className?: string;
  /** Stagger delay (ms) — used in KPI rows to enter sequentially. */
  enterDelayMs?: number;
}

const iconBgFor = (v: EPKpiCardProps["iconBg"]): string => {
  if (!v) return "var(--ep-primary)";
  const map: Record<string, string> = {
    sd:        "var(--mod-sd)",
    pp:        "var(--mod-pp)",
    hr:        "var(--mod-hr)",
    warehouse: "var(--mod-warehouse)",
    fi:        "var(--mod-fi)",
    org:       "var(--mod-org)",
    primary:   "var(--ep-primary)",
  };
  return map[v] ?? v;
};

const trendColor = (trend: DeltaTrend): string =>
  trend === "up"   ? "var(--ep-green)" :
  trend === "down" ? "var(--ep-red)"   :
                     "var(--ep-muted)";

export function EPKpiCard({
  label,
  value,
  staticValue,
  formatValue,
  icon: Icon,
  iconBg,
  delta,
  linkLabel,
  onLinkClick,
  onClick,
  className,
  enterDelayMs,
}: EPKpiCardProps) {
  const animated = useCountUp(value ?? 0);
  const displayValue =
    staticValue !== undefined
      ? staticValue
      : formatValue
        ? formatValue(animated)
        : Math.round(animated).toLocaleString();

  return (
    <EPCard
      interactive={!!onClick}
      onClick={onClick}
      padding={14}
      className={cn("ep-fade-up", className)}
      style={{ animationDelay: enterDelayMs ? `${enterDelayMs}ms` : undefined }}
    >
      <div className="flex items-start gap-3">
        <div
          className="ep-icon-tile"
          style={{ background: iconBgFor(iconBg) }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="ep-eyebrow leading-tight">{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="ep-kpi-value">{displayValue}</span>
            {delta && (
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium"
                style={{ color: trendColor(delta.trend) }}
              >
                {delta.trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {delta.value}
              </span>
            )}
          </div>
          {linkLabel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.();
              }}
              className="mt-2 text-[11px] font-medium hover:underline"
              style={{ color: "var(--ep-primary)" }}
            >
              {linkLabel} →
            </button>
          )}
        </div>
      </div>
    </EPCard>
  );
}
