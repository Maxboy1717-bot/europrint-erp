/**
 * @module HRDashboardCards
 * @description Stat/KPI card components for the HR Dashboard: the top KPI grid,
 * the HR V2 quick-stats row, and the Operator Reports widget.
 */

import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Award, AlertTriangle, Clock, ShieldAlert, Flame,
  Lock, FileText, Trophy, MessageSquare, Wrench, Gauge, ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { DailyStats, GamLeaderboard } from "./HRDashboardTypes";

// ---------------------------------------------------------------------------
// KPI item type (for the top strip)
// ---------------------------------------------------------------------------

interface KpiItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  testId: string;
}

// ---------------------------------------------------------------------------
// KpiGrid
// ---------------------------------------------------------------------------

interface KpiGridProps {
  isLoading: boolean;
  employeeCount: number;
  warningsCount: number;
  lateArrivals: number;
  criticalAlerts: number;
  atRiskCount: number;
  rewardsSum: number;
}

export function KpiGrid({
  isLoading,
  employeeCount,
  warningsCount,
  lateArrivals,
  criticalAlerts,
  atRiskCount,
  rewardsSum,
}: KpiGridProps) {
  const { t } = useTranslation("hr");
  const kpiItems: KpiItem[] = [
    { label: t("kpi.employees"),        value: employeeCount,               icon: Users,         accent: "text-primary",             testId: "text-total-employees" },
    { label: t("kpi.warnings"),         value: warningsCount,               icon: AlertTriangle, accent: "text-[var(--ep-yellow)]",  testId: "text-warnings" },
    { label: t("kpi.lateArrivals"),     value: lateArrivals,                icon: Clock,         accent: "text-[var(--ep-primary)]", testId: "text-late" },
    { label: t("kpi.criticalAlerts"),   value: criticalAlerts,              icon: ShieldAlert,   accent: "text-[var(--ep-red)]",     testId: "text-critical-alerts" },
    { label: t("kpi.atRisk"),           value: atRiskCount,                 icon: Flame,         accent: "text-[var(--ep-red)]",     testId: "text-at-risk" },
    { label: t("kpi.rewards"),          value: rewardsSum.toLocaleString(), icon: Award,         accent: "text-[var(--ep-green)]",   testId: "text-rewards" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {isLoading
        ? [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-4 space-y-2">
              <Skeleton className="h-3 w-20 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          ))
        : kpiItems.map((item, i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-4" data-testid={item.testId}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{item.value}</p>
              <item.icon className={`w-3.5 h-3.5 ${item.accent} mt-1`} />
            </div>
          ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HrV2QuickStats
// ---------------------------------------------------------------------------

interface HrV2QuickStatsProps {
  blockedCount: number;
  activePipCount: number;
  topGamer: Record<string, unknown> | undefined;
  activeSurveys: Record<string, unknown>[] | undefined;
}

export function HrV2QuickStats({
  blockedCount,
  activePipCount,
  topGamer,
  activeSurveys,
}: HrV2QuickStatsProps) {
  const { t } = useTranslation("hr");
  const cards = [
    {
      label: t("hrV2.blockedEmployees"),
      value: blockedCount,
      icon: Lock,
      accent: blockedCount > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]",
      href: "/discipline",
      desc: blockedCount > 0 ? t("hrV2.activeBlocking") : t("hrV2.noBlocking"),
    },
    {
      label: t("hrV2.activePipPlans"),
      value: activePipCount,
      icon: FileText,
      accent: activePipCount > 0 ? "text-[var(--ep-yellow)]" : "text-slate-400",
      href: "/hr/pip",
      desc: t("hrV2.developmentPlan"),
    },
    {
      label: t("hrV2.ratingLeader"),
      value: topGamer ? `${topGamer.first_name} ${topGamer.last_name}` : "—",
      icon: Trophy,
      accent: "text-[var(--ep-yellow)]",
      href: "/hr/gamification",
      desc: topGamer ? t("hrV2.pointsMonthly", { points: String(topGamer.monthly_points || 0) }) : t("hrV2.noDataYet"),
    },
    {
      label: t("hrV2.enpsSurveys"),
      value: Array.isArray(activeSurveys) ? activeSurveys.length : 0,
      icon: MessageSquare,
      accent: "text-[var(--ep-blue)]",
      href: "/hr/enps",
      desc: t("hrV2.activeSurveys"),
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {t("hrV2.systemTitle")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="bg-card rounded-lg p-4 hover:bg-muted/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-4 h-4 ${card.accent}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <div className="text-xl font-bold text-foreground truncate">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.desc}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t("hrV2.more")} <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OperatorReportsWidget
// ---------------------------------------------------------------------------

interface OperatorReportsWidgetProps {
  operatorReportsToday: number;
  operatorTotal: number;
  dailyStats: DailyStats | undefined;
}

export function OperatorReportsWidget({
  operatorReportsToday,
  operatorTotal,
  dailyStats,
}: OperatorReportsWidgetProps) {
  const { t } = useTranslation("hr");
  if (operatorTotal === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4" data-testid="widget-operator-reports">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-[var(--ep-blue)]" />
        <h2 className="text-sm font-semibold text-blue-800">{t("operator.todayReports")}</h2>
        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
          {operatorReportsToday}/{operatorTotal}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--ep-green)]">{operatorReportsToday}</p>
          <p className="text-xs text-muted-foreground">{t("operator.submitted")}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--ep-red)]">
            {Math.max(0, operatorTotal - operatorReportsToday)}
          </p>
          <p className="text-xs text-muted-foreground">{t("operator.notSubmitted")}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <Gauge className="h-5 w-5 mx-auto text-[var(--ep-blue)] mb-0.5" />
          <p className="text-xs font-semibold text-[var(--ep-blue)]">
            {dailyStats?.stats?.avg_operator_oee ? `${dailyStats.stats.avg_operator_oee}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{t("operator.avgOee")}</p>
        </div>
      </div>
    </div>
  );
}
