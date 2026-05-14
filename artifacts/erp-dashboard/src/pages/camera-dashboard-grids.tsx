/**
 * @module camera-dashboard-grids
 * @description Stat KPI grid and quick-navigation tile grid for the Camera AI
 * Monitoring dashboard.  Pure presentational components — no data fetching.
 */

import { Button }      from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress }    from "@/components/ui/progress";
import {
  Activity,
  BarChart3,
  Bell,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Factory,
  Gauge,
  Settings,
  Shield,
  Users,
  Video,
} from "lucide-react";
import { Link } from "wouter";
import type { DashboardStats } from "./camera-dashboard-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Lang = "uz" | "ru";

// ---------------------------------------------------------------------------
// StatsGrid
// ---------------------------------------------------------------------------

interface StatsGridProps {
  stats: DashboardStats | undefined;
  language: Lang;
  t: (key: string) => string;
}

/** 8-card KPI grid at the top of the dashboard. */
export function StatsGrid({ stats, language, t }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Cameras */}
      <div className="bg-card rounded-lg p-5" data-testid="card-cameras-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Kameralar" : "Камеры"}
          </span>
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-foreground">
          {stats?.activeCameras ?? 0}/{stats?.totalCameras ?? 0}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`h-2 w-2 rounded-full ${(stats?.activeCameras ?? 0) > 0 ? "bg-green-500 animate-pulse" : "bg-[var(--ep-red)]"}`} />
          <p className="text-xs text-muted-foreground">{t("active")}</p>
        </div>
        <Progress
          value={stats?.totalCameras ? (stats.activeCameras / stats.totalCameras) * 100 : 0}
          className="mt-4 h-1.5 bg-muted/60"
        />
      </div>

      {/* Events */}
      <div className="bg-card rounded-lg p-5" data-testid="card-events-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Hodisalar" : "События"}
          </span>
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-foreground">{stats?.totalEvents ?? 0}</div>
        <p className="text-xs text-muted-foreground mt-1">{t("today")}</p>
      </div>

      {/* Safety */}
      <div className="bg-card rounded-lg p-5" data-testid="card-safety-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Xavfsizlik" : "Безопасность"}
          </span>
          <Shield className="h-5 w-5 text-[var(--ep-primary)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-primary)]">{stats?.safetyViolationsCount ?? 0}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "uz" ? "Buzilishlar" : "Нарушения"}
        </p>
      </div>

      {/* Quality */}
      <div className="bg-card rounded-lg p-5" data-testid="card-quality-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Sifat" : "Качество"}
          </span>
          <CheckCircle className="h-5 w-5 text-[var(--ep-blue)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-blue)]">{stats?.qualityDefectsCount ?? 0}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "uz" ? "Nuqsonlar" : "Дефекты"}
        </p>
      </div>

      {/* Alerts */}
      <div className="bg-card rounded-lg p-5" data-testid="card-alerts-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("notifications")}
          </span>
          <Bell className="h-5 w-5 text-[var(--ep-red)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-red)]">{stats?.unresolvedAlerts ?? 0}</div>
        <p className="text-xs text-muted-foreground mt-1">{t("pending")}</p>
      </div>

      {/* Productivity */}
      <div className="bg-card rounded-lg p-5" data-testid="card-productivity-stat">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Samaradorlik" : "Производительность"}
          </span>
          <Gauge className="h-5 w-5 text-[var(--ep-green)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">
          {stats?.avgProductivityScore ? Math.round(stats.avgProductivityScore) : 0}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("average")}</p>
        <Progress value={stats?.avgProductivityScore ?? 0} className="mt-4 h-1.5 bg-muted/60" />
      </div>

      {/* Machines */}
      <div className="bg-card rounded-lg p-5" data-testid="card-machines-running">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "uz" ? "Mashinalar" : "Машины"}
          </span>
          <Factory className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">{stats?.runningMachines ?? 0}</span>
          <span className="text-sm font-medium text-muted-foreground">
            {language === "uz" ? "Ishlayapti" : "Работают"}
          </span>
        </div>
        <div className="flex gap-4 mt-2 text-xs font-semibold">
          <span className="text-[var(--ep-yellow)]">
            {stats?.idleMachines ?? 0} {language === "uz" ? "BO'SH" : "ПРОСТОЙ"}
          </span>
          <span className="text-[var(--ep-red)]">
            {stats?.stoppedMachines ?? 0} {language === "uz" ? "TO'XTAGAN" : "ОСТАНОВ"}
          </span>
        </div>
      </div>

      {/* Date */}
      <div className="bg-card rounded-lg p-5" data-testid="card-date">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("date")}
          </span>
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-foreground">
          {stats?.date ?? new Date().toISOString().split("T")[0]}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date().toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU")}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuickNavGrid
// ---------------------------------------------------------------------------

interface QuickNavGridProps {
  language: Lang;
  t: (key: string) => string;
}

/** 8-card quick-navigation grid below the stats. */
export function QuickNavGrid({ language, t }: QuickNavGridProps) {
  const navItems = [
    {
      href:   "/cameras",
      icon:   <Settings className="h-5 w-5" />,
      iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
      label:  language === "uz" ? "Kameralar" : "Камеры",
      sub:    language === "uz" ? "Boshqarish" : "Управление",
      testId: "link-cameras-management",
    },
    {
      href:   "/camera-safety",
      icon:   <Shield className="h-5 w-5" />,
      iconBg: "bg-orange-100 text-[var(--ep-primary)] group-hover:bg-orange-600 group-hover:text-white",
      label:  language === "uz" ? "Xavfsizlik" : "Безопасность",
      sub:    language === "uz" ? "Nazorat" : "Контроль",
      testId: "link-safety-monitoring",
    },
    {
      href:   "/camera-quality",
      icon:   <CheckCircle className="h-5 w-5" />,
      iconBg: "bg-blue-100 text-[var(--ep-blue)] group-hover:bg-blue-600 group-hover:text-white",
      label:  language === "uz" ? "Sifat" : "Качество",
      sub:    language === "uz" ? "Nazorat" : "Контроль",
      testId: "link-quality-control",
    },
    {
      href:   "/camera-employees",
      icon:   <Users className="h-5 w-5" />,
      iconBg: "bg-green-100 text-[var(--ep-green)] group-hover:bg-green-600 group-hover:text-white",
      label:  language === "uz" ? "Xodimlar" : "Сотрудники",
      sub:    language === "uz" ? "Kuzatuv" : "Мониторинг",
      testId: "link-employees-monitoring",
    },
    {
      href:   "/camera-machines",
      icon:   <Factory className="h-5 w-5" />,
      iconBg: "bg-purple-100 text-[var(--ep-purple)] group-hover:bg-purple-600 group-hover:text-white",
      label:  language === "uz" ? "Mashinalar" : "Машины",
      sub:    language === "uz" ? "Holat" : "Статус",
      testId: "link-machines-status",
    },
    {
      href:   "/camera-live-monitoring",
      icon:   <Video className="h-5 w-5" />,
      iconBg: "bg-red-100 text-[var(--ep-red)] group-hover:bg-red-600 group-hover:text-white",
      label:  language === "uz" ? "Jonli ko'rish" : "Живой просмотр",
      sub:    "Real-vaqt",
      testId: "link-live-monitoring",
    },
    {
      href:   "/erp/cameras/reports",
      icon:   <BarChart3 className="h-5 w-5" />,
      iconBg: "bg-indigo-100 text-[var(--ep-blue)] group-hover:bg-indigo-600 group-hover:text-white",
      label:  t("reports"),
      sub:    "Analitika",
      testId: "link-reports",
    },
    {
      href:   "/camera-heatmap",
      icon:   <Eye className="h-5 w-5" />,
      iconBg: "bg-amber-100 text-[var(--ep-yellow)] group-hover:bg-amber-600 group-hover:text-white",
      label:  language === "uz" ? "Issiqlik" : "Тепловая",
      sub:    "Xarita",
      testId: "link-heatmap",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card
            className="bg-card hover:bg-muted border-none rounded-lg transition-all cursor-pointer overflow-hidden group"
            data-testid={item.testId}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg transition-colors ${item.iconBg}`}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{item.label}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {item.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
