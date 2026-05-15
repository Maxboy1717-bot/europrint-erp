/**
 * @module IoTDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient, safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Languages, RefreshCw } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import type { IotSensor, IotAlert, OeeRecord } from "@shared/schema";
import { IotSensorsReadingsTab }      from "./IotSensorsReadingsTab";
import { IotOeeAlertsTab }             from "./IotOeeAlertsTab";
import { IotMaintenanceMonitorTab }    from "./IotMaintenanceMonitorTab";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

export default function IoTDashboard() {
  const [selectedSensorId, setSelectedSensorId] = useState<string>("");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { t, language, setLanguage } = useTranslation('iot');
  const { t: tProd } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');

  /* ── Dashboard summary ── */
  const { data: dashboardData, isLoading: dashLoading, isError, error: dashError, refetch: refetchDash } = useQuery({
    queryKey: ["/api/iot-sensors/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000,
  });
  const dashboard = dashboardData as {
    activeSensors: number; totalActiveAlerts: number;
    alertsBySeverity: Record<string, number>; avgOeeToday: number; machinesRunning: number;
  } | undefined;

  /* ── Sensors & readings ── */
  const { data: sensorsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/live"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!isAuthenticated,
    refetchInterval: 15000,
  });
  const sensors: IotSensor[] = safeArray<IotSensor>(sensorsData);

  const { data: readingsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors", selectedSensorId, "readings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!isAuthenticated && !!selectedSensorId,
    refetchInterval: 15000,
  });
  const readings: Array<{ id: string; value: number; status: string; recordedAt: string }> = safeArray(readingsData);
  const readingsChartData = readings.slice().reverse().slice(-50).map(r => ({
    time: new Date(r.recordedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    value: r.value,
  }));

  /* ── OEE & alerts ── */
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: oeeData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/oee", fromDate],
    queryFn: () => apiRequest('GET', `/api/iot-sensors/oee?from=${fromDate}`).then(r => r.json()),
    enabled: !!isAuthenticated,
    refetchInterval: 60000,
  });
  const oeeRecordsList: OeeRecord[] = safeArray<OeeRecord>(oeeData);

  const oeeChartData = oeeRecordsList
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .reduce<{ date: string; oee: number; availability: number; performance: number; quality: number }[]>((acc, r) => {
      const existing = acc.find(a => a.date === r.date);
      if (existing) {
        existing.oee          = (existing.oee          + r.oee)          / 2;
        existing.availability = (existing.availability + r.availability) / 2;
        existing.performance  = (existing.performance  + r.performance)  / 2;
        existing.quality      = (existing.quality      + r.quality)      / 2;
      } else {
        acc.push({ date: r.date, oee: r.oee, availability: r.availability, performance: r.performance, quality: r.quality });
      }
      return acc;
    }, []);

  const machineOeeMap: Record<string, { availability: number; performance: number; quality: number; oee: number; date?: string }> = {};
  for (const r of oeeRecordsList) {
    if (!machineOeeMap[r.machineId] || r.date > (machineOeeMap[r.machineId].date ?? "")) {
      machineOeeMap[r.machineId] = { availability: r.availability, performance: r.performance, quality: r.quality, oee: r.oee, date: r.date };
    }
  }

  const { data: alertsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/alerts"],
    queryFn: () => apiRequest('GET', "/api/iot-sensors/alerts?resolved=false").then(r => r.json()),
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
  });
  const alerts: IotAlert[] = safeArray<IotAlert>(alertsData);

  const resolveAlert = useMutation({
    mutationFn: (alertId: string) => apiRequest("PATCH", `/api/iot-sensors/alerts/${alertId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/dashboard"] });
      toast({ title: t('resolved'), description: t('alertResolved') });
    },
  });

  /* ── Maintenance ── */
  const { data: pmData, isLoading: pmLoading } = useQuery({
    queryKey: ["/api/iot-sensors/predictive-maintenance"],
    queryFn: () => apiRequest('GET', "/api/iot-sensors/predictive-maintenance").then(r => r.json()),
    enabled: !!isAuthenticated,
    refetchInterval: 120000,
  });
  const pmResult = pmData as {
    sensors: Array<{
      sensorId: string; sensorCode: string; sensorName: string; type: string;
      machineId: string | null; riskLevel: string; riskScore: number;
      recommendation: string; lastValue: number | null; threshold: number | null;
      consecutiveCritical: number; avgLast10: number | null;
    }>;
    summary: { critical: number; high: number; medium: number; low: number };
    analyzedAt: string;
  } | undefined;

  /* ── Monitoring ── */
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["/api/iot/attendance/live"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!isAuthenticated,
    refetchInterval: 20000,
  });
  const attendanceLive = attendanceData as {
    live: Array<{
      employee_id: string; full_name: string | null; department_name: string | null;
      gate_status: "in" | "out" | null; workplace_status: "in" | "out" | null;
      last_seen: string | null; status: "at_workplace" | "on_premises" | "absent";
    }>;
    summary: { total: number; at_workplace: number; on_premises: number; absent: number };
    date: string;
  } | undefined;

  const { data: roomInspectionsData, isLoading: roomsLoading, refetch: refetchRooms } = useQuery({
    queryKey: ["/api/iot/room-inspections"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!isAuthenticated,
    refetchInterval: 60000,
  });
  const roomInspections = safeArray<{
    id: number; room_id: string; room_name: string | null; checked_at: string;
    inspector_id: string | null; inspector_name: string | null;
    status: string; notes: string | null; photo_url: string | null;
  }>(roomInspectionsData);

  const { data: healthData } = useQuery({
    queryKey: ["/api/iot/employee-health"],
    queryFn: () =>
      apiRequest('GET', "/api/iot/employee-health")
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    enabled: !!isAuthenticated,
    refetchInterval: 120000,
  });
  const employeeHealth = healthData as {
    date: string; note: string;
    health: Array<{ department: string; present_count: number; total_count: number; attendance_rate: number; mood_indicator: "good" | "moderate" | "low" }>;
  } | null;

  /* ── Render ── */
  if (dashLoading) return <div className="space-y-6"><DashboardSkeleton /></div>;
  if (dashError)   return <div className="space-y-6"><EPErrorState onRetry={refetchDash} /></div>;

  return (
    <div className="space-y-6 font-inter" data-testid="iot-sensor-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">IoT {t('dashboard1')}</b></>}
        title="IoT {t('dashboard1')}"
        subtitle={t('systemDesc')}
      />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border hover:bg-muted/60 shadow-sm"
            onClick={() => { refetchDash(); queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors"] }); }}
            data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border hover:bg-muted/60 shadow-sm"
            onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}
            data-testid="button-lang-toggle">
            <Languages className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg p-5" data-testid="card-active-sensors">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('activeSensors')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-active-sensors">{dashboard?.activeSensors ?? 0}</p>
          <p className="text-xs font-medium text-[var(--ep-green)] mt-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{t('sensorsOnline')}
          </p>
        </div>
        <div className="bg-card rounded-lg p-5" data-testid="card-avg-oee">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('avgOee')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-avg-oee">{(dashboard?.avgOeeToday ?? 0).toFixed(1)}%</p>
          <div className="h-2 bg-muted/60 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${dashboard?.avgOeeToday ?? 0}%` }} />
          </div>
        </div>
        <div className="bg-card rounded-lg p-5" data-testid="card-active-alerts">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('activeAlerts')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-active-alerts">{dashboard?.totalActiveAlerts ?? 0}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {dashboard?.alertsBySeverity?.critical ? <EPStatusPill tone="danger">{dashboard.alertsBySeverity.critical} {t('abbreviationCrit')}</EPStatusPill> : null}
            {dashboard?.alertsBySeverity?.high     ? <EPStatusPill tone="danger">{dashboard.alertsBySeverity.high} {t('abbreviationHigh')}</EPStatusPill> : null}
            {dashboard?.alertsBySeverity?.medium   ? <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{dashboard.alertsBySeverity.medium} {t('abbreviationMed')}</Badge> : null}
          </div>
        </div>
        <div className="bg-card rounded-lg p-5" data-testid="card-machines-running">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{"Machines"}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-machines-running">{dashboard?.machinesRunning ?? 0}</p>
          <p className="text-xs font-medium text-muted-foreground mt-2">{t('machinesWithSensors')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sensors" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1.5 rounded-lg bg-muted/60">
          <TabsTrigger value="sensors"     className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-sensors">{t('tabSensors')}</TabsTrigger>
          <TabsTrigger value="oee"         className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-oee">{"Oee"}</TabsTrigger>
          <TabsTrigger value="alerts"      className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-alerts">{t('tabAlerts')}</TabsTrigger>
          <TabsTrigger value="readings"    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-readings">{t('tabReadings')}</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-maintenance">
            <Activity className="h-3.5 w-3.5 mr-1.5" />{t('tabMaintenance')}
          </TabsTrigger>
          <TabsTrigger value="attendance"  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-attendance">
            {t('tabAttendance')}
          </TabsTrigger>
          <TabsTrigger value="rooms"       className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-rooms">
            {t('tabRooms')}
          </TabsTrigger>
          <TabsTrigger value="health"      className="rounded-lg px-6 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-health">
            {t('tabHealth')}
          </TabsTrigger>
        </TabsList>

        <IotSensorsReadingsTab
          sensors={sensors}
          selectedSensorId={selectedSensorId}
          setSelectedSensorId={setSelectedSensorId}
          readingsChartData={readingsChartData}
          t={t} tProd={tProd} language={language}
        />

        <IotOeeAlertsTab
          oeeChartData={oeeChartData}
          machineOeeMap={machineOeeMap}
          alerts={alerts}
          onResolveAlert={(id) => resolveAlert.mutate(id)}
          resolveAlertPending={resolveAlert.isPending}
          t={t} tProd={tProd} language={language}
        />

        <IotMaintenanceMonitorTab
          pmResult={pmResult}
          pmLoading={pmLoading}
          attendanceLive={attendanceLive}
          attendanceLoading={attendanceLoading}
          refetchAttendance={refetchAttendance}
          roomInspections={roomInspections}
          roomsLoading={roomsLoading}
          refetchRooms={refetchRooms}
          employeeHealth={employeeHealth}
          t={t} tCommon={tCommon} language={language}
        />
      </Tabs>
    </div>
  );
}
