/**
 * @module MESHomeDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import type { DashStats, Session, Downtime, ProductionOrder } from "./MESHomeDashboardTypes";
import { MesKpiRow, MesMachineGrid } from "./MESHomeDashboardSections";
import { MesOrdersAndDowntimes, MesActiveSessionsTable, MesQuickLinks } from "./MESHomeDashboardWidgets";

import { useTranslation } from '@/lib/i18n';
export default function MESHomeDashboard() {
  const { t } = useTranslation('common');
  const { data: stats, isLoading: sLoad, refetch: refetchStats } = useQuery<DashStats>({
    queryKey: ["/api/mes/stats"],
    refetchInterval: 30000,
  });

  const { data: sessionsRaw, isLoading: sessLoad, refetch: refetchSess } = useQuery<Session[]>({
    queryKey: ["/api/mes/production-sessions"],
    refetchInterval: 30000,
  });

  const { data: downtimesRaw, isLoading: dtLoad } = useQuery<Downtime[]>({
    queryKey: ["/api/iot/downtime-events"],
    refetchInterval: 60000,
  });

  const { data: ordersRaw } = useQuery<{ orders: ProductionOrder[] }>({
    queryKey: ["/api/production/orders/report"],
    refetchInterval: 60000,
  });

  const sessions: Session[] = safeArray<Session>(sessionsRaw);
  const downtimes: Downtime[] = safeArray<Downtime>(downtimesRaw);
  const orders: ProductionOrder[] = safeArray<ProductionOrder>(ordersRaw, "orders");

  const activeSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.status === "running" || s.status === "active" || s.status === "in_progress");
  const stoppedSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.status === "stopped" || s.status === "paused");

  // OEE derived from sessions list (averageOee not in /api/mes/stats)
  const sessWithOee = (Array.isArray(sessions) ? sessions : []).filter(s => s.oee != null);
  const avgOee = sessWithOee.length > 0
    ? sessWithOee.reduce((a, s) => a + Number(s.oee ?? 0), 0) / sessWithOee.length / 100
    : 0;
  const oeePercent = Math.round(avgOee * 100);

  // Use stats.produced_today directly from /api/mes/stats; defect_rate also comes from stats
  const totalProduced = stats?.produced_today ?? (Array.isArray(sessions) ? sessions : []).reduce((a, s) => a + (Number(s.actual_quantity) || 0), 0);
  const defectRate    = stats?.defect_rate != null ? String(stats.defect_rate) : "0";

  const inProgressOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status === "in_progress");

  function refreshAll() {
    refetchStats(); refetchSess();
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="ep-h1">
            MES <span className="text-primary">{t('dashboard5')}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ishlab chiqarish real-vaqt monitoringi — {new Date().toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stoppedSessions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-[var(--ep-red)] animate-pulse" />
              <span className="text-sm font-semibold text-[var(--ep-red)] dark:text-red-400">
                {stoppedSessions.length} sessiya to'xtagan
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} data-testid="button-refresh-mes">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
          </Button>
          <Button size="sm" asChild data-testid="button-orders-report">
            <Link href="/production/orders">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> {t("report")}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <MesKpiRow
        stats={stats}
        sLoad={sLoad}
        sessLoad={sessLoad}
        dtLoad={dtLoad}
        activeSessions={activeSessions}
        downtimes={downtimes}
        totalProduced={totalProduced}
        defectRate={defectRate}
        oeePercent={oeePercent}
        avgOee={avgOee}
      />

      {/* Machine Grid */}
      <MesMachineGrid sessions={sessions} sessLoad={sessLoad} />

      {/* Orders + Downtimes */}
      <MesOrdersAndDowntimes
        inProgressOrders={inProgressOrders}
        downtimes={downtimes}
        dtLoad={dtLoad}
      />

      {/* Active Sessions Table */}
      <MesActiveSessionsTable activeSessions={activeSessions} sessLoad={sessLoad} />

      {/* Quick Links */}
      <MesQuickLinks />

    </div>
  );
}
