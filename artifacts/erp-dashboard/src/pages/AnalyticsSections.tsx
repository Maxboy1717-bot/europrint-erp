/**
 * @module AnalyticsSections
 * @description KPI bar and stats card sections for the Analytics page.
 */

import { Users, BookOpen, Award, TrendingUp } from "lucide-react";
import { StatsCard, StatsCardSkeleton } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsStats } from "./analytics/analytics-types";
import { useTranslation } from '@/lib/i18n';

interface KpiBarProps {
  stats: AnalyticsStats | undefined;
  statsLoading: boolean;
}

export function AnalyticsKpiBar({ stats, statsLoading }: KpiBarProps) {
  const { t } = useTranslation("common");
  return (
    <div
      className="glass-kpi overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
    >
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4  md:divide-y-0 divide-x-0 md:divide-x  dark:divide-slate-800">
          {([0, 1, 2, 3]).map(i => (
            <div key={`k-${i}`} className="p-6 space-y-3">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4  md:divide-y-0 divide-x-0 md:divide-x  dark:divide-slate-800">
          {([
            { label: "Jami Xodimlar", value: stats?.totalUsers || 0, desc: "Aktiv foydalanuvchilar", icon: Users, accent: "text-[var(--ep-blue)]", testId: "stat-card-users" },
            { label: "Kurslar", value: stats?.totalCourses || 0, desc: "Ta'lim resurslari", icon: BookOpen, accent: "text-[var(--ep-purple)]", testId: "stat-card-courses" },
            { label: "Testlar", value: stats?.totalTests || 0, desc: "Baholash tizimi", icon: Award, accent: "text-[var(--ep-green)]", testId: "stat-card-tests" },
            { label: "O'rtacha Ball", value: `${(stats?.avgTestScore || 0).toFixed(1)}%`, desc: "Test natijalari", icon: TrendingUp, accent: "text-[var(--ep-yellow)]", testId: "stat-card-avg" },
          ]).map((item, i) => (
            <div key={`k-${i}`} className="p-6" data-testid={item.testId}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground leading-none mb-4">
                {item.label}
              </p>
              <p className="text-4xl font-extrabold text-foreground dark:text-slate-50 leading-none tracking-tight mb-2">
                {item.value}
              </p>
              <div className="flex items-center gap-2">
                <item.icon className={`w-3.5 h-3.5 ${item.accent}`} />
                <span className="text-xs text-muted-foreground dark:text-muted-foreground">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LegacyStatsProps {
  stats: AnalyticsStats | undefined;
  statsLoading: boolean;
}

export function AnalyticsLegacyStats({ stats, statsLoading }: LegacyStatsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="hidden">
      {statsLoading ? (
        <>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </>
      ) : (
        <>
          <StatsCard
            title={t("jamiXodimlar")}
            value={stats?.totalUsers || 0}
            subtitle={t("aktivFoydalanuvchilar")}
            icon={Users}
            variant="hr"
            data-testid="stat-card-users-hidden"
          />
          <StatsCard
            title={t("kurslar")}
            value={stats?.totalCourses || 0}
            subtitle={`${stats?.activeCourses || 0} ta aktiv`}
            icon={BookOpen}
            variant="sd"
            data-testid="stat-card-courses"
          />
          <StatsCard
            title={t("tugatilganKurslar")}
            value={stats?.completedCourses || 0}
            subtitle={`${stats?.completionRate || 0}% yakunlangan`}
            icon={Award}
            variant="pp"
            trend={{ value: stats?.completionRate || 0, positive: true }}
            data-testid="stat-card-completed"
          />
          <StatsCard
            title={t("ortachaBall")}
            value={`${stats?.averageScore || 0}%`}
            subtitle={t("testNatijalari1")}
            icon={TrendingUp}
            variant="warehouse"
            data-testid="stat-card-score"
          />
        </>
      )}
    </div>
  );
}
