/**
 * @module camera-dashboard
 * @description Route-level page component for the Camera AI Monitoring
 * dashboard.  Owns all data-fetching, auto-refresh state, and the header
 * toolbar.  Delegates every visual section to camera-dashboard-sections.tsx.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { RefreshCw } from "lucide-react";
import type { CameraAlert, CameraEvent, CameraInfo, DashboardStats } from "./camera-dashboard-types";
import { QuickNavGrid, StatsGrid } from "./camera-dashboard-grids";
import { AlertsAndEventsPanel } from "./camera-dashboard-feeds";
import { CameraStatusSection, ModuleLinksGrid } from "./camera-dashboard-panels";
import { EPErrorState, EPPageHeader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CameraDashboard() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation("common");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ---- queries ----
  const {
    data: stats,
    isLoading: statsLoading,
    isError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({ queryKey: ["/api/camera-dashboard/stats"] });

  const { data: recentEvents, isLoading: eventsLoading, refetch: refetchEvents } =
    useQuery<CameraEvent[]>({ queryKey: ["/api/camera-dashboard/recent-events"] });

  const { data: pendingAlerts, isLoading: alertsLoading, refetch: refetchAlerts } =
    useQuery<CameraAlert[]>({ queryKey: ["/api/camera-dashboard/pending-alerts"] });

  const { data: cameras, isLoading: camerasLoading } =
    useQuery<CameraInfo[]>({ queryKey: ["/api/cameras"] });

  // ---- safe arrays ----
  const safePendingAlerts = safeArray<CameraAlert>(pendingAlerts);
  const safeRecentEvents  = safeArray<CameraEvent>(recentEvents);
  const safeCameraInfos   = safeArray<CameraInfo>(cameras);

  // ---- auto-refresh (30 s) ----
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      refetchStats();
      refetchEvents();
      refetchAlerts();
    }, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, refetchStats, refetchEvents, refetchAlerts]);

  // ---- handlers ----
  const handleRefresh = () => {
    refetchStats();
    refetchEvents();
    refetchAlerts();
    toast({
      title: t("refresh"),
      description: language === "uz" ? "Ma'lumotlar yangilandi" : "Данные обновлены",
    });
  };

  // ---- guards ----
  if (isError) return <EPErrorState onRetry={refetchStats} />;

  if (statsLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  // ---- render ----
  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Kamera AI Monitoring</b></>}
        title="Kamera AI Monitoring"
        subtitle={language === "uz" ? "Real-vaqt monitoring va analitika" : "Мониторинг и аналитика в реальном времени"}
      />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={language === "uz" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button
              variant={language === "ru" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>

          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setAutoRefresh((v) => !v)}
            data-testid="button-auto-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {language === "uz" ? "Avtomatik yangilash" : "Автообновление"}
          </Button>

          {/* Manual refresh */}
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI stats */}
      <StatsGrid stats={stats} language={language as "uz" | "ru"} t={t} />

      {/* Quick-navigation tiles */}
      <QuickNavGrid language={language as "uz" | "ru"} t={t} />

      {/* Alerts + Events panels */}
      <AlertsAndEventsPanel
        pendingAlerts={safePendingAlerts}
        recentEvents={safeRecentEvents}
        alertsLoading={alertsLoading}
        eventsLoading={eventsLoading}
        totalEventCount={recentEvents?.length ?? 0}
        language={language as "uz" | "ru"}
        t={t}
      />

      {/* Camera status grid */}
      <CameraStatusSection
        cameras={safeCameraInfos}
        camerasLoading={camerasLoading}
        totalCount={cameras?.length ?? 0}
        language={language as "uz" | "ru"}
        t={t}
      />

      {/* Module links */}
      <ModuleLinksGrid language={language as "uz" | "ru"} />
    </div>
  );
}
