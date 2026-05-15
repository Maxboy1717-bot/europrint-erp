/**
 * @module MachineStatusPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, History, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface MachineStatus {
  id: string | number;
  device_id?: string;
  deviceId?: string;
  name?: string;
  machine_name?: string;
  machineName?: string;
  status?: string;
  oee?: number;
  temperature?: number;
  speed?: number;
  uptime?: number;
  last_updated?: string;
  lastUpdated?: string;
  location?: string;
  alerts?: number;
}

interface MachineLog {
  id: string | number;
  device_id?: string;
  deviceId?: string;
  machine_name?: string;
  machineName?: string;
  status?: string;
  previous_status?: string;
  previousStatus?: string;
  changed_at?: string;
  changedAt?: string;
  reason?: string;
  duration_minutes?: number;
  durationMinutes?: number;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; dot: string }> = {
  running:     { label: "Ishlamoqda",  variant: "default",     dot: "bg-green-500"  },
  idle:        { label: "Kutmoqda",    variant: "secondary",   dot: "bg-amber-400"  },
  maintenance: { label: "Ta'mir",      variant: "outline",     dot: "bg-blue-500"   },
  stopped:     { label: "To'xtagan",   variant: "destructive", dot: "bg-red-500"    },
  error:       { label: "Xatolik",     variant: "destructive", dot: "bg-red-600"    },
};

type TabType = "current" | "logs";

export default function MachineStatusPage() {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<TabType>("current");

  const {
    data: statusRaw,
    isLoading: loadingStatus,
    isError: errorStatus,
    refetch: refetchStatus,
  } = useQuery<MachineStatus[] | { data?: MachineStatus[] }>({
    queryKey: ["/api/iot/machine-status"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/iot/machine-status");
    },
    enabled: tab === "current",
    refetchInterval: 30_000,
  });

  const {
    data: logsRaw,
    isLoading: loadingLogs,
    isError: errorLogs,
    refetch: refetchLogs,
  } = useQuery<MachineLog[] | { data?: MachineLog[] }>({
    queryKey: ["/api/iot/machine-status-logs"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/iot/machine-status-logs?limit=50");
    },
    enabled: tab === "logs",
  });

  const machines: MachineStatus[] = Array.isArray(statusRaw)
    ? statusRaw
    : (statusRaw as { data?: MachineStatus[] })?.data ?? [];

  const logs: MachineLog[] = Array.isArray(logsRaw)
    ? logsRaw
    : (logsRaw as { data?: MachineLog[] })?.data ?? [];

  const isLoading = tab === "current" ? loadingStatus : loadingLogs;
  const isError   = tab === "current" ? errorStatus   : errorLogs;
  const refetch   = tab === "current" ? refetchStatus : refetchLogs;

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="iot"
      title={t("mashinaHolati")}
      icon={<Cpu className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-2">
          <Button
            variant={tab === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("current")}
            data-testid="tab-current"
          >
            <Activity className="h-4 w-4 mr-1.5" />
            {t("joriyHolat1")}
          </Button>
          <Button
            variant={tab === "logs" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("logs")}
            data-testid="tab-logs"
          >
            <History className="h-4 w-4 mr-1.5" />
            {t("holatTarixi")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tab === "current" ? (
          machines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("mashinaHolatiTopilmadi")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {machines.map(m => {
                const name   = m.name ?? m.machine_name ?? m.machineName ?? (m.device_id ?? m.deviceId ?? String(m.id));
                const status = m.status ?? "idle";
                const sc     = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
                const updated = m.last_updated ?? m.lastUpdated;
                return (
                  <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`card-machine-${m.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sc.dot}`} />
                            <p className="font-medium text-sm truncate">{name}</p>
                          </div>
                          {m.location && (
                            <p className="text-xs text-muted-foreground mt-0.5">📍 {m.location}</p>
                          )}
                        </div>
                        <Badge variant={sc.variant} className="text-xs shrink-0">{sc.label}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {m.oee !== undefined        && <span>OEE: <span className="font-medium text-foreground">{m.oee}%</span></span>}
                        {m.temperature !== undefined && <span>🌡 {m.temperature}°C</span>}
                        {m.speed !== undefined       && <span>⚡ {m.speed} rpm</span>}
                        {m.uptime !== undefined      && <span>⏱ Uptime: {m.uptime}%</span>}
                        {m.alerts !== undefined && m.alerts > 0 && (
                          <span className="text-destructive">⚠ {m.alerts} ogohlantirish</span>
                        )}
                        {updated && (
                          <span>{new Date(updated).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          logs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("holatTarixiTopilmadi")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {logs.map(l => {
                const name     = l.machine_name ?? l.machineName ?? (l.device_id ?? l.deviceId ?? String(l.id));
                const status   = l.status ?? "idle";
                const sc       = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
                const prevSt   = l.previous_status ?? l.previousStatus;
                const prevSc   = prevSt ? (STATUS_CONFIG[prevSt] ?? STATUS_CONFIG.idle) : null;
                const changedAt = l.changed_at ?? l.changedAt;
                const dur      = l.duration_minutes ?? l.durationMinutes;
                return (
                  <Card key={l.id} data-testid={`card-log-${l.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{name}</p>
                          {prevSc && (
                            <>
                              <Badge variant={prevSc.variant} className="text-xs">{prevSc.label}</Badge>
                              <span className="text-xs text-muted-foreground">→</span>
                            </>
                          )}
                          <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                          {changedAt && <span>{new Date(changedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>}
                          {dur !== undefined && <span>⏱ {dur} daq</span>}
                          {l.reason && <span className="italic">{l.reason}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </ModulePage>
  );
}
