/**
 * @module IotSensorsPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
interface Sensor {
  id: string | number;
  device_id?: string;
  deviceId?: string;
  name?: string;
  type?: string;
  sensor_type?: string;
  sensorType?: string;
  location?: string;
  status?: string;
  is_active?: boolean;
  isActive?: boolean;
  last_value?: number;
  lastValue?: number;
  unit?: string;
  battery_level?: number;
  batteryLevel?: number;
  signal_strength?: number;
  signalStrength?: number;
  last_seen?: string;
  lastSeen?: string;
  firmware_version?: string;
  firmwareVersion?: string;
}

const TYPE_ICONS: Record<string, string> = {
  temperature: "🌡",
  humidity:    "💧",
  pressure:    "🌀",
  vibration:   "📳",
  gas:         "💨",
  noise:       "🔊",
  camera:      "📷",
  motion:      "👁",
  energy:      "⚡",
};

export default function IotSensorsPage() {
  const { data: rawData, isLoading, isError, refetch } = useQuery<
    Sensor[] | { data?: Sensor[] }
  >({
    queryKey: ["/api/iot/sensors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/iot/sensors");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const sensors: Sensor[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Sensor[] })?.data ?? [];

  const active   = sensors.filter(s => (s.is_active ?? s.isActive ?? s.status === "active")).length;
  const inactive = sensors.length - active;

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="iot"
      title="IoT Sensorlar"
      icon={<Activity className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {/* Summary */}
        {!isLoading && sensors.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Jami: <strong>{sensors.length}</strong></span>
            <span className="text-[var(--ep-green)]">Faol: <strong>{active}</strong></span>
            {inactive > 0 && <span className="text-destructive">Nofaol: <strong>{inactive}</strong></span>}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sensors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Sensorlar topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sensors.map(s => {
              const isActive   = s.is_active ?? s.isActive ?? s.status === "active";
              const sType      = s.type ?? s.sensor_type ?? s.sensorType ?? "unknown";
              const name       = s.name ?? s.device_id ?? s.deviceId ?? String(s.id);
              const lastVal    = s.last_value ?? s.lastValue;
              const battery    = s.battery_level ?? s.batteryLevel;
              const signal     = s.signal_strength ?? s.signalStrength;
              const lastSeen   = s.last_seen ?? s.lastSeen;
              const icon       = TYPE_ICONS[sType] ?? "📡";
              return (
                <Card key={s.id} className="hover:shadow-md transition-shadow" data-testid={`card-sensor-${s.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sType}</p>
                        </div>
                      </div>
                      {isActive ? (
                        <Wifi className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {s.location && <span>📍 {s.location}</span>}
                      {lastVal !== undefined && s.unit && (
                        <span className="font-medium text-foreground">
                          {lastVal} {s.unit}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {battery !== undefined && (
                        <span>{battery < 20 ? "🪫" : "🔋"} {battery}%</span>
                      )}
                      {signal !== undefined && <span>📶 {signal} dBm</span>}
                      {lastSeen && (
                        <span>{new Date(lastSeen).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {s.firmware_version ?? s.firmwareVersion ? (
                        <Badge variant="outline" className="text-xs">
                          v{s.firmware_version ?? s.firmwareVersion}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
