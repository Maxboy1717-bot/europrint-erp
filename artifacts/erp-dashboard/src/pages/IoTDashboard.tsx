import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient, safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, Cpu, AlertTriangle, Languages, RefreshCw, Gauge,
  Thermometer, Droplets, Zap, Wind, BarChart3, CheckCircle2, XCircle,
  Clock, TrendingUp, Factory, Wrench, ShieldAlert,
  Users, MapPin, Building2, Heart, DoorOpen
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { IotSensor, IotAlert, OeeRecord } from "@shared/schema";

const SENSOR_ICONS: Record<string, typeof Thermometer> = {
  temperature: Thermometer,
  humidity: Droplets,
  power: Zap,
  pressure: Wind,
  vibration: Activity,
  speed: TrendingUp,
  counter: BarChart3,
};

function getStatusColor(sensor: IotSensor): string {
  if (!sensor.lastReading) return "text-muted-foreground";
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold) return "text-red-500";
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold) return "text-red-500";
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold * 0.9) return "text-yellow-500";
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold * 1.1) return "text-yellow-500";
  return "text-green-500";
}

function getStatusBadge(sensor: IotSensor, tFn: (k: string) => string) {
  if (!sensor.lastReading) return <Badge className="bg-surface-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('noData')}</Badge>;
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold)
    return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('statusCritical')}</Badge>;
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold)
    return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('statusCritical')}</Badge>;
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold * 0.9)
    return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('statusWarning')}</Badge>;
  return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('statusNormal')}</Badge>;
}

function getSeverityBadge(severity: string, tFn: (k: string) => string) {
  switch (severity) {
    case "critical": return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityCritical')}</Badge>;
    case "high": return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityHigh')}</Badge>;
    case "medium": return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityMedium')}</Badge>;
    case "low": return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityLow')}</Badge>;
    default: return <Badge className="bg-surface-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{severity}</Badge>;
  }
}

function OeeGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 -sm">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--surface-container-high))"
            strokeWidth="3.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${value}, 100`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-on-surface">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">{label}</span>
    </div>
  );
}

export default function IoTDashboard() {
  const [selectedSensorId, setSelectedSensorId] = useState<string>("");
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation('iot');
  const { t: tProd } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');

  const { data: dashboardData, isLoading: dashLoading, isError: dashError, refetch: refetchDash } = useQuery({
    queryKey: ["/api/iot-sensors/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000,
  });
  const dashboard = dashboardData as {
    activeSensors: number;
    totalActiveAlerts: number;
    alertsBySeverity: Record<string, number>;
    avgOeeToday: number;
    machinesRunning: number;
  } | undefined;

  const { data: sensorsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/live"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 15000,
  });
  const sensors: IotSensor[] = safeArray<IotSensor>(sensorsData);

  const { data: alertsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/alerts"],
    queryFn: () => fetch("/api/iot-sensors/alerts?resolved=false", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 30000,
  });
  const alerts: IotAlert[] = safeArray<IotAlert>(alertsData);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: oeeData = [] } = useQuery({
    queryKey: ["/api/iot-sensors/oee", fromDate],
    queryFn: () => fetch(`/api/iot-sensors/oee?from=${fromDate}`, { credentials: "include" }).then(r => r.json()),
    refetchInterval: 60000,
  });
  const oeeRecordsList: OeeRecord[] = safeArray<OeeRecord>(oeeData);

  const { data: readingsData = [] } = useQuery({
    queryKey: ["/api/iot-sensors", selectedSensorId, "readings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedSensorId,
    refetchInterval: 15000,
  });
  const readings: Array<{ id: string; value: number; status: string; recordedAt: string }> = safeArray(readingsData);

  const { data: pmData, isLoading: pmLoading } = useQuery({
    queryKey: ["/api/iot-sensors/predictive-maintenance"],
    queryFn: () => fetch("/api/iot-sensors/predictive-maintenance", { credentials: "include" }).then(r => r.json()),
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

  const resolveAlert = useMutation({
    mutationFn: (alertId: string) => apiRequest("POST", `/api/iot-sensors/alerts/${alertId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/dashboard"] });
      toast({ title: t('resolved'), description: t('alertResolved') });
    },
  });

  // Camera Attendance Live
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["/api/iot/attendance/live"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 20000,
  });
  const attendanceLive = attendanceData as {
    live: Array<{
      employee_id: string;
      full_name: string | null;
      department_name: string | null;
      gate_status: "in" | "out" | null;
      workplace_status: "in" | "out" | null;
      last_seen: string | null;
      status: "at_workplace" | "on_premises" | "absent";
    }>;
    summary: { total: number; at_workplace: number; on_premises: number; absent: number };
    date: string;
  } | undefined;

  // Room Inspections
  const { data: roomInspectionsData, isLoading: roomsLoading, refetch: refetchRooms } = useQuery({
    queryKey: ["/api/iot/room-inspections"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 60000,
  });
  const roomInspections = safeArray<{
    id: number;
    room_id: string;
    room_name: string | null;
    checked_at: string;
    inspector_id: string | null;
    inspector_name: string | null;
    status: string;
    notes: string | null;
    photo_url: string | null;
  }>(roomInspectionsData);

  // Employee Health (HR only — gracefully handle 403)
  const { data: healthData } = useQuery({
    queryKey: ["/api/iot/employee-health"],
    queryFn: () =>
      fetch("/api/iot/employee-health", { credentials: "include" })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    refetchInterval: 120000,
  });
  const employeeHealth = healthData as {
    date: string;
    note: string;
    health: Array<{
      department: string;
      present_count: number;
      total_count: number;
      attendance_rate: number;
      mood_indicator: "good" | "moderate" | "low";
    }>;
  } | null;

  const oeeChartData: { date: string; oee: number; availability: number; performance: number; quality: number }[] = oeeRecordsList
    .slice()
    .sort((a: OeeRecord, b: OeeRecord) => String(a.date).localeCompare(String(b.date)))
    .reduce<{ date: string; oee: number; availability: number; performance: number; quality: number }[]>((acc, r) => {
      const existing = (Array.isArray(acc) ? acc : []).find(a => a.date === r.date);
      if (existing) {
        existing.oee = (existing.oee + r.oee) / 2;
        existing.availability = (existing.availability + r.availability) / 2;
        existing.performance = (existing.performance + r.performance) / 2;
        existing.quality = (existing.quality + r.quality) / 2;
      } else {
        acc.push({ date: r.date, oee: r.oee, availability: r.availability, performance: r.performance, quality: r.quality });
      }
      return acc;
    }, [] as { date: string; oee: number; availability: number; performance: number; quality: number }[]);

  const readingsChartData = readings
    .slice()
    .reverse()
    .slice(-50)
    .map(r => ({
      time: new Date(r.recordedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      value: r.value,
    }));

  const machineOeeMap: Record<string, { availability: number; performance: number; quality: number; oee: number }> = {};
  for (const r of oeeRecordsList) {
    if (!machineOeeMap[r.machineId] || r.date > (machineOeeMap[r.machineId] as { availability: number; performance: number; quality: number; oee: number; date?: string }).date!) {
      machineOeeMap[r.machineId] = { availability: r.availability, performance: r.performance, quality: r.quality, oee: r.oee };
    }
  }

  if (dashLoading) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (dashError) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <ErrorState onRetry={refetchDash} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 font-inter" data-testid="iot-sensor-dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="text-dashboard-title">
            IoT <span className="font-bold text-primary">Dashboard</span>
          </h1>
          <p className="text-on-surface-variant text-base mt-1">
            {t('systemDesc')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-outline-variant hover:bg-surface-container shadow-sm" onClick={() => { refetchDash(); queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors"] }); }} data-testid="button-refresh">
            <RefreshCw className="h-5 w-5 text-on-surface-variant" />
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-outline-variant hover:bg-surface-container shadow-sm" onClick={() => setLanguage(language === "uz" ? "ru" : "uz")} data-testid="button-lang-toggle">
            <Languages className="h-5 w-5 text-on-surface-variant" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-active-sensors">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('activeSensors')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-active-sensors">{dashboard?.activeSensors || 0}</p>
          <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('sensorsOnline')}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-avg-oee">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('avgOee')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-avg-oee">{(dashboard?.avgOeeToday || 0).toFixed(1)}%</p>
          <div className="h-2 bg-surface-container rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${dashboard?.avgOeeToday || 0}%` }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-active-alerts">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('activeAlerts')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-active-alerts">{dashboard?.totalActiveAlerts || 0}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {dashboard?.alertsBySeverity?.critical ? <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{dashboard.alertsBySeverity.critical} {t('abbreviationCrit')}</Badge> : null}
            {dashboard?.alertsBySeverity?.high ? <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{dashboard.alertsBySeverity.high} {t('abbreviationHigh')}</Badge> : null}
            {dashboard?.alertsBySeverity?.medium ? <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{dashboard.alertsBySeverity.medium} {t('abbreviationMed')}</Badge> : null}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-machines-running">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tProd('machines')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-machines-running">{dashboard?.machinesRunning || 0}</p>
          <p className="text-xs font-medium text-on-surface-variant mt-2">{t('machinesWithSensors')}</p>
        </div>
      </div>

      <Tabs defaultValue="sensors" className="space-y-6">
        <TabsList className="bg-surface-container p-1 rounded-xl border border-outline-variant h-auto flex-wrap">
          <TabsTrigger value="sensors" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-sensors">{t('tabSensors')}</TabsTrigger>
          <TabsTrigger value="oee" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-oee">{tProd('oee')}</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-alerts">{t('tabAlerts')}</TabsTrigger>
          <TabsTrigger value="readings" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-readings">{t('tabReadings')}</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-maintenance">
            <Wrench className="h-4 w-4 mr-1" />
            {t('tabPredictive')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-attendance">
            <Users className="h-4 w-4 mr-1" />
            {t('attendanceTab')}
          </TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-rooms">
            <Building2 className="h-4 w-4 mr-1" />
            {t('roomInspectionTab')}
          </TabsTrigger>
          <TabsTrigger value="health" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-sm" data-testid="tab-health">
            <Heart className="h-4 w-4 mr-1" />
            {t('healthTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-4 focus-visible:outline-none">
          {sensors.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-20 text-center shadow-sm">
              <Cpu className="h-16 w-16 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-on-surface-variant font-medium">{t('noActiveSensors')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(Array.isArray(sensors) ? sensors : []).map(sensor => {
                const Icon = SENSOR_ICONS[sensor.type] || Activity;
                const statusColor = getStatusColor(sensor);
                return (
                  <div key={sensor.id} 
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    data-testid={`card-sensor-${sensor.id}`}
                    onClick={() => { setSelectedSensorId(sensor.id); }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${statusColor === "text-red-500" ? "bg-red-50" : statusColor === "text-yellow-500" ? "bg-yellow-50" : "bg-green-50"}`}>
                          <Icon className={`h-5 w-5 ${statusColor}`} />
                        </div>
                        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate max-w-[120px]">{sensor.name}</p>
                      </div>
                      {getStatusBadge(sensor, t)}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-4xl font-black tracking-tighter ${statusColor}`} data-testid={`text-sensor-value-${sensor.id}`}>
                        {sensor.lastReading !== null ? sensor.lastReading : "—"}
                        <span className="text-lg font-bold ml-1 opacity-70">{sensor.unit || ""}</span>
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{sensor.sensorCode}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-outline-variant/30 space-y-2">
                      {sensor.location && (
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                          <Wind className="h-3 w-3" />
                          {sensor.location}
                        </div>
                      )}
                      {sensor.lastReadingAt && (
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                          <Clock className="h-3 w-3" />
                          {new Date(sensor.lastReadingAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="oee" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('oeeTitle')}
              </h3>
              {oeeChartData.length === 0 ? (
                <div className="py-20 text-center text-on-surface-variant font-medium">{tProd('noDataFound')}</div>
              ) : (
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={oeeChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderRadius: "12px", border: "1px solid hsl(var(--outline-variant))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        itemStyle={{ fontWeight: "bold" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      <Line type="monotone" dataKey="oee" stroke="hsl(var(--primary))" name={tProd('oee')} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "white" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="availability" stroke="#22c55e" name={tProd('availability')} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="performance" stroke="#3b82f6" name={tProd('performanceRate')} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="quality" stroke="#f59e0b" name={tProd('qualityRate')} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                {t('oeeByMachine')}
              </h3>
              {Object.keys(machineOeeMap).length === 0 ? (
                <div className="py-20 text-center text-on-surface-variant font-medium">{tProd('noDataFound')}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(machineOeeMap).map(([machineId, oee]) => (
                    <div key={machineId} className="bg-surface p-5 rounded-2xl border border-outline-variant/50" data-testid={`oee-machine-${machineId}`}>
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {machineId}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <OeeGauge label={tProd('availability')} value={oee.availability} color="#22c55e" />
                        <OeeGauge label={tProd('performanceRate')} value={oee.performance} color="#3b82f6" />
                        <OeeGauge label={tProd('qualityRate')} value={oee.quality} color="#f59e0b" />
                        <OeeGauge label={tProd('oee')} value={oee.oee} color="hsl(var(--primary))" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="focus-visible:outline-none">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
            <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              {t('activeAlertsDesc')}
            </h3>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{t('allGood')}</p>
                  <p className="text-on-surface-variant font-medium">{t('noActiveAlerts')}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(alerts) ? alerts : []).map(alert => (
                  <div key={alert.id} className="flex items-start justify-between gap-4 p-5 bg-surface rounded-2xl border border-outline-variant/50 hover:border-error/30 transition-all" data-testid={`alert-${alert.id}`}>
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'critical' ? 'bg-error/10 text-error' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {getSeverityBadge(alert.severity, t)}
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{alert.alertType}</Badge>
                        </div>
                        <p className="text-sm font-bold text-on-surface leading-snug">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-3 text-[11px] text-on-surface-variant font-medium">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(alert.createdAt).toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                          {alert.value !== null && (
                            <span className="flex items-center gap-1 font-bold text-on-surface"><Activity className="h-3 w-3" /> {alert.value}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-9 font-bold text-xs border-outline-variant hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
                      onClick={() => resolveAlert.mutate(alert.id)}
                      disabled={resolveAlert.isPending}
                      data-testid={`button-resolve-${alert.id}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      {t('resolve')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="readings" className="focus-visible:outline-none">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t('sensorReadings')}
              </h3>
              <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
                <SelectTrigger className="w-[300px] h-11 rounded-xl border-outline-variant bg-surface shadow-sm focus:ring-primary/20" data-testid="select-sensor">
                  <SelectValue placeholder={t('selectSensor')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                  {(Array.isArray(sensors) ? sensors : []).map(s => (
                    <SelectItem key={s.id} value={s.id} className="py-2.5 rounded-lg font-medium" data-testid={`select-sensor-option-${s.id}`}>
                      {s.name} <span className="text-on-surface-variant opacity-60 ml-1">({s.sensorCode})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-8">
              {!selectedSensorId ? (
                <div className="py-32 flex flex-col items-center gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center">
                    <Activity className="h-8 w-8 text-on-surface-variant/30" />
                  </div>
                  <p className="text-on-surface-variant font-bold max-w-[280px]">{t('selectSensorPrompt')}</p>
                </div>
              ) : readingsChartData.length === 0 ? (
                <div className="py-32 text-center text-on-surface-variant font-bold">{tProd('noDataFound')}</div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readingsChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderRadius: "12px", border: "1px solid hsl(var(--outline-variant))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        labelStyle={{ fontWeight: "black", marginBottom: "4px", color: "hsl(var(--primary))" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={4} 
                        dot={{ r: 4, strokeWidth: 2, fill: "white" }} 
                        activeDot={{ r: 7, strokeWidth: 0 }} 
                        name={t('readingValue')} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== TZ-18: Predictive Maintenance Tab ===== */}
        <TabsContent value="maintenance" className="focus-visible:outline-none">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                {t('predictiveMaintenance')}
              </h3>
              {pmResult?.analyzedAt && (
                <span className="text-xs text-muted-foreground">
                  {t('analyzedAt')} {new Date(pmResult.analyzedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {pmResult?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { key: "critical", label: t('riskCritical'), color: "text-red-600", bg: "bg-red-50", icon: <ShieldAlert className="h-5 w-5" /> },
                  { key: "high", label: t('riskHigh'), color: "text-orange-600", bg: "bg-orange-50", icon: <AlertTriangle className="h-5 w-5" /> },
                  { key: "medium", label: t('riskMedium'), color: "text-yellow-600", bg: "bg-yellow-50", icon: <Wrench className="h-5 w-5" /> },
                  { key: "low", label: t('riskLow'), color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="h-5 w-5" /> },
                ]).map(({ key, label, color, bg, icon }) => (
                  <div key={key} className={`rounded-xl p-4 ${bg} flex items-center gap-3`}>
                    <div className={color}>{icon}</div>
                    <div>
                      <div className={`text-2xl font-black ${color}`}>{pmResult.summary[key as keyof typeof pmResult.summary]}</div>
                      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pmLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
                <p>{t('analyzingSensors')}</p>
              </div>
            ) : !pmResult?.sensors?.length ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">{t('noSensorData')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(pmResult.sensors) ? pmResult.sensors : []).map(s => {
                  const riskColors: Record<string, string> = {
                    critical: "border-red-300 bg-red-50/50",
                    high: "border-orange-200 bg-orange-50/50",
                    medium: "border-yellow-200 bg-yellow-50/50",
                    low: "border-green-200 bg-green-50/30",
                  };
                  const riskBadge: Record<string, string> = {
                    critical: "bg-red-100 text-red-700",
                    high: "bg-orange-100 text-orange-700",
                    medium: "bg-yellow-100 text-yellow-700",
                    low: "bg-green-100 text-green-700",
                  };
                  return (
                    <div key={s.sensorId} className={`rounded-xl border p-4 ${riskColors[s.riskLevel] || "border-outline-variant"}`} data-testid={`pm-sensor-${s.sensorId}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskBadge[s.riskLevel] || ""}`}>
                              {s.riskLevel.toUpperCase()} — {s.riskScore}%
                            </span>
                            <Badge variant="outline" className="text-xs">{s.type}</Badge>
                            {s.machineId && <Badge variant="secondary" className="text-xs">{s.machineId}</Badge>}
                          </div>
                          <p className="font-bold text-on-surface text-sm">{s.sensorName} <span className="text-muted-foreground font-normal">({s.sensorCode})</span></p>
                          <p className="text-xs text-muted-foreground mt-1">{s.recommendation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            <span>{t('lastValue')} <strong className="text-on-surface">{s.lastValue ?? "—"}</strong></span>
                          </div>
                          {s.threshold && (
                            <div className="text-xs text-muted-foreground">
                              {t('sensorThreshold')} <strong>{s.threshold}</strong>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {t('consecutiveCritical')} <strong className="text-red-500">{s.consecutiveCritical}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={s.riskScore} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== Kamera Davomat (Attendance) Tab ===== */}
        <TabsContent value="attendance" className="focus-visible:outline-none space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('realTimeAttendance')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => refetchAttendance()} className="rounded-lg border-outline-variant">
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
            </div>

            {/* Summary Cards */}
            {attendanceLive?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {([
                  { label: t('atWorkplace'), count: attendanceLive.summary.at_workplace, color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="h-5 w-5" /> },
                  { label: t('onPremises'), count: attendanceLive.summary.on_premises, color: "text-blue-600", bg: "bg-blue-50", icon: <MapPin className="h-5 w-5" /> },
                  { label: t('absent'), count: attendanceLive.summary.absent, color: "text-red-600", bg: "bg-red-50", icon: <XCircle className="h-5 w-5" /> },
                  { label: tCommon('total'), count: attendanceLive.summary.total, color: "text-on-surface", bg: "bg-surface-container", icon: <Users className="h-5 w-5" /> },
                ]).map((item, i) => (
                  <div key={`k-${i}`} className={`${item.bg} rounded-xl p-4 flex items-center gap-3`}>
                    <div className={item.color}>{item.icon}</div>
                    <div>
                      <div className={`text-2xl font-black ${item.color}`}>{item.count}</div>
                      <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Employee List */}
            {attendanceLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
                <p>{t('attendanceLoading')}</p>
              </div>
            ) : !attendanceLive?.live?.length ? (
              <div className="py-16 text-center border-2 border-dashed rounded-xl border-outline-variant">
                <Users className="h-12 w-12 mx-auto mb-3 text-on-surface-variant/30" />
                <p className="font-bold text-on-surface-variant">
                  {t('noAttendanceEvents')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-left">
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{t('employee')}</th>
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{t('department')}</th>
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{t('gate')}</th>
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{t('workplace')}</th>
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{tCommon('status')}</th>
                      <th className="pb-3 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{t('lastSeen')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {(Array.isArray(attendanceLive.live) ? attendanceLive.live : []).map(emp => (
                      <tr key={emp.employee_id} className="hover:bg-surface-container/50 transition-colors" data-testid={`attendance-row-${emp.employee_id}`}>
                        <td className="py-3 font-semibold text-on-surface">{emp.full_name || emp.employee_id}</td>
                        <td className="py-3 text-on-surface-variant text-xs">{emp.department_name || "—"}</td>
                        <td className="py-3">
                          {emp.gate_status === "in" ? (
                            <Badge className="bg-green-100 text-green-700 text-xs rounded-full">{t("statusIn")}</Badge>
                          ) : emp.gate_status === "out" ? (
                            <Badge className="bg-red-100 text-red-700 text-xs rounded-full">{t("statusOut")}</Badge>
                          ) : (
                            <span className="text-on-surface-variant text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {emp.workplace_status === "in" ? (
                            <Badge className="bg-green-100 text-green-700 text-xs rounded-full">{t("statusIn")}</Badge>
                          ) : emp.workplace_status === "out" ? (
                            <Badge className="bg-red-100 text-red-700 text-xs rounded-full">{t("statusOut")}</Badge>
                          ) : (
                            <span className="text-on-surface-variant text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {emp.status === "at_workplace" ? (
                            <Badge className="bg-green-100 text-green-800 rounded-full text-xs">{t('statusAtWorkplace')}</Badge>
                          ) : emp.status === "on_premises" ? (
                            <Badge className="bg-blue-100 text-blue-800 rounded-full text-xs">{t('statusOnPremises')}</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 rounded-full text-xs">{t('statusAbsent')}</Badge>
                          )}
                        </td>
                        <td className="py-3 text-xs text-on-surface-variant">
                          {emp.last_seen ? new Date(emp.last_seen).toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== Xona Tekshiruvi (Room Inspections) Tab ===== */}
        <TabsContent value="rooms" className="focus-visible:outline-none space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t('roomStatusInspection')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => refetchRooms()} className="rounded-lg border-outline-variant">
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
            </div>

            {roomsLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
                <p>{t('roomInspectionLoading')}</p>
              </div>
            ) : roomInspections.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed rounded-xl border-outline-variant">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-on-surface-variant/30" />
                <p className="font-bold text-on-surface-variant">
                  {t('noRoomInspections')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(Array.isArray(roomInspections) ? roomInspections : []).map(insp => (
                  <div
                    key={insp.id}
                    className={`rounded-xl border p-4 transition-all ${
                      insp.status === "critical"
                        ? "border-red-300 bg-red-50/50"
                        : insp.status === "issue"
                        ? "border-amber-200 bg-amber-50/50"
                        : "border-green-200 bg-green-50/30"
                    }`}
                    data-testid={`room-inspection-${insp.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-on-surface-variant shrink-0" />
                        <span className="font-bold text-on-surface text-sm">{insp.room_name || insp.room_id}</span>
                      </div>
                      {insp.status === "critical" ? (
                        <Badge className="bg-red-100 text-red-700 text-xs rounded-full shrink-0">{t('critical')}</Badge>
                      ) : insp.status === "issue" ? (
                        <Badge className="bg-amber-100 text-amber-700 text-xs rounded-full shrink-0">{t('problem')}</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 text-xs rounded-full shrink-0">{t('healthGood')}</Badge>
                      )}
                    </div>
                    {insp.notes && (
                      <p className="text-xs text-on-surface-variant mt-1">{insp.notes}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(insp.checked_at).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {insp.inspector_name && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {insp.inspector_name}
                        </span>
                      )}
                    </div>
                    {insp.photo_url && (
                      <a href={insp.photo_url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                        {t('viewPhoto')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== Xodim Sog'lig'i (Health) Tab ===== */}
        <TabsContent value="health" className="focus-visible:outline-none space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {t('healthMonitoring')}
              </h3>
              <Badge className="bg-surface-container text-on-surface-variant text-xs rounded-full px-3 py-1">
                {t('anonymousHROnly')}
              </Badge>
            </div>

            {!employeeHealth ? (
              <div className="py-16 text-center border-2 border-dashed rounded-xl border-outline-variant">
                <Heart className="h-12 w-12 mx-auto mb-3 text-on-surface-variant/30" />
                <p className="font-bold text-on-surface-variant">
                  {t('healthNoAccess')}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant mb-4 italic">{employeeHealth.note}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(employeeHealth.health || []).map((dept, idx) => (
                    <div key={idx} className="bg-surface rounded-xl border border-outline-variant/50 p-4" data-testid={`health-dept-${idx}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-on-surface text-sm">{dept.department}</span>
                        {dept.mood_indicator === "good" ? (
                          <Badge className="bg-green-100 text-green-700 text-xs rounded-full">
                            {t('healthGood')}
                          </Badge>
                        ) : dept.mood_indicator === "moderate" ? (
                          <Badge className="bg-amber-100 text-amber-700 text-xs rounded-full">
                            {t('healthModerate')}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-xs rounded-full">
                            {t('healthLow')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-black text-on-surface">{dept.attendance_rate}%</span>
                        <span className="text-xs text-on-surface-variant mb-1">
                          {dept.present_count}/{dept.total_count} {t('staffCount')}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            dept.attendance_rate >= 80 ? "bg-green-500" : dept.attendance_rate >= 60 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${dept.attendance_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
