/**
 * DIZAYN-NEW: DashboardStats — KPI kartalar redesign
 * Vazifa 3: Trend badge, sparkline chart, progress bar, rang kodlash
 * Recharts sparkline + Tailwind CSS v4
 */
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendDirection = "up" | "down";
type StatColor = "primary" | "success" | "warning" | "error" | "info";

interface SparkPoint { v: number }

interface StatCardData {
  id: string;
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: TrendDirection;
    value: string;
    label: string;
    isPositive: boolean;   // true = yaxshi, false = yomon
  };
  progress?: {
    value: number;         // 0-100
    label?: string;
  };
  actionLabel?: string;
  actionHref?: string;
  color: StatColor;
  spark?: SparkPoint[];
}

interface DashboardStatsRedesignProps {
  stats?: Partial<{
    totalEmployees: number;
    attendance: number;
    expiredCerts: number;
    lmsProgress: number;
  }>;
  onActionClick?: (id: string) => void;
}

// ─── CSS variable map ─────────────────────────────────────────────────────────

const COLOR_MAP: Record<StatColor, {
  icon: string;
  trend: string;
  progress: string;
  sparkStroke: string;
  badge: string;
}> = {
  primary: {
    icon:       "bg-primary/10 text-primary",
    trend:      "text-primary",
    progress:   "bg-primary",
    sparkStroke:"hsl(var(--primary))",
    badge:      "bg-primary/10 text-primary",
  },
  success: {
    icon:       "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    trend:      "text-[hsl(var(--success))]",
    progress:   "bg-[hsl(var(--success))]",
    sparkStroke:"hsl(var(--success))",
    badge:      "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  },
  warning: {
    icon:       "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    trend:      "text-[hsl(var(--warning))]",
    progress:   "bg-[hsl(var(--warning))]",
    sparkStroke:"hsl(var(--warning))",
    badge:      "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  },
  error: {
    icon:       "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]",
    trend:      "text-[hsl(var(--error))]",
    progress:   "bg-[hsl(var(--error))]",
    sparkStroke:"hsl(var(--error))",
    badge:      "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]",
  },
  info: {
    icon:       "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
    trend:      "text-[hsl(var(--info))]",
    progress:   "bg-[hsl(var(--info))]",
    sparkStroke:"hsl(var(--info))",
    badge:      "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
  },
};

// ─── Sparkline chart ──────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: SparkPoint[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          strokeLinecap="round"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Single stat card ─────────────────────────────────────────────────────────

function StatCard({
  stat,
  onAction,
}: {
  stat: StatCardData;
  onAction?: (id: string) => void;
}) {
  const colors = COLOR_MAP[stat.color];
  const TrendIcon = stat.trend?.direction === "up" ? ArrowUpRight : ArrowDownRight;

  const trendColor = stat.trend
    ? stat.trend.isPositive
      ? stat.trend.direction === "up"
        ? "text-[hsl(var(--success))]"
        : "text-[hsl(var(--error))]"
      : stat.trend.direction === "down"
        ? "text-[hsl(var(--success))]"
        : "text-[hsl(var(--error))]"
    : "";

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "border border-border bg-card",
        "rounded-xl shadow-[var(--shadow-md)]",
        "transition-all duration-150 hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
      )}
      role="region"
      aria-label={stat.label}
    >
      <CardContent className="p-5">
        {/* Top row: icon + action */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0", colors.icon)}
            aria-hidden="true">
            {stat.icon}
          </div>

          {stat.actionLabel && (
            <button
              type="button"
              onClick={() => onAction?.(stat.id)}
              aria-label={`${stat.actionLabel} - ${stat.label}`}
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg",
                colors.badge,
                "hover:opacity-80 transition-opacity"
              )}
            >
              {stat.actionLabel}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mb-1">
          <span
            className="text-2xl font-bold tracking-tight text-foreground"
            data-testid={`stat-value-${stat.id}`}
          >
            {stat.value}
          </span>
          {stat.unit && (
            <span className="text-sm text-muted-foreground">{stat.unit}</span>
          )}
        </div>

        {/* Label */}
        <p className="text-xs font-medium text-muted-foreground mb-2">{stat.label}</p>

        {/* Sparkline */}
        {stat.spark && (
          <div className="-mx-1 mb-2" aria-hidden="true">
            <Sparkline data={stat.spark} color={colors.sparkStroke} />
          </div>
        )}

        {/* Trend */}
        {stat.trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{stat.trend.value}</span>
            <span className="text-muted-foreground font-normal">({stat.trend.label})</span>
          </div>
        )}

        {/* Progress bar */}
        {stat.progress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                {stat.progress.label ?? "Progress"}
              </span>
              <span className="text-[10px] font-semibold text-foreground">
                {stat.progress.value}%
              </span>
            </div>
            <div
              className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={stat.progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
                style={{ width: `${Math.min(100, Math.max(0, stat.progress.value))}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Default data builder ──────────────────────────────────────────────────────

function buildStats(raw: DashboardStatsRedesignProps["stats"]): StatCardData[] {
  const d = {
    totalEmployees: 386,
    attendance: 94.2,
    expiredCerts: 12,
    lmsProgress: 78.4,
    ...raw,
  };

  return [
    {
      id: "employees",
      icon: "👥",
      label: "Jami xodimlar",
      value: d.totalEmployees,
      trend: {
        direction: "up",
        value: "+3 ta",
        label: "bu oy",
        isPositive: true,
      },
      progress: { value: Math.round((d.totalEmployees / 400) * 100), label: "400 ta maqsaddan" },
      color: "primary",
      spark: [
        { v: 370 }, { v: 375 }, { v: 372 }, { v: 378 }, { v: 382 }, { v: 383 }, { v: d.totalEmployees }
      ],
    },
    {
      id: "attendance",
      icon: "✅",
      label: "Bugungi davomat",
      value: `${d.attendance}%`,
      trend: {
        direction: "down",
        value: "-1.2%",
        label: "kechadan",
        isPositive: false,
      },
      progress: { value: d.attendance, label: "Maqsad: 96%" },
      color: d.attendance >= 90 ? "success" : "warning",
      spark: [
        { v: 96 }, { v: 95 }, { v: 97 }, { v: 93 }, { v: 95 }, { v: 95.4 }, { v: d.attendance }
      ],
    },
    {
      id: "expired-certs",
      icon: "⚠️",
      label: "Muddati o'tgan sertifikatlar",
      value: d.expiredCerts,
      unit: "ta",
      actionLabel: "Ko'rish",
      trend: {
        direction: "up",
        value: "+2 ta",
        label: "bu hafta",
        isPositive: false,
      },
      progress: { value: Math.round((d.expiredCerts / 50) * 100), label: "50 ta sertifikatdan" },
      color: d.expiredCerts > 10 ? "error" : "warning",
      spark: [
        { v: 6 }, { v: 7 }, { v: 8 }, { v: 9 }, { v: 10 }, { v: 10 }, { v: d.expiredCerts }
      ],
    },
    {
      id: "lms",
      icon: "🎓",
      label: "LMS o'rganish darajasi",
      value: `${d.lmsProgress}%`,
      trend: {
        direction: "up",
        value: "+5.2%",
        label: "bu hafta",
        isPositive: true,
      },
      progress: { value: d.lmsProgress, label: "Maqsad: 90%" },
      color: "success",
      spark: [
        { v: 68 }, { v: 70 }, { v: 72 }, { v: 73 }, { v: 74 }, { v: 76 }, { v: d.lmsProgress }
      ],
    },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardStatsRedesign({
  stats,
  onActionClick,
}: DashboardStatsRedesignProps) {
  const cards = buildStats(stats);

  return (
    <div
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      role="region"
      aria-label="KPI ko'rsatkichlari"
    >
      {(Array.isArray(cards) ? cards : []).map((stat) => (
        <StatCard
          key={stat.id}
          stat={stat}
          onAction={onActionClick}
        />
      ))}
    </div>
  );
}

export default DashboardStatsRedesign;
