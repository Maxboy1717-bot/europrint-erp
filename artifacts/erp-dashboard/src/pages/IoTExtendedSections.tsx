/**
 * @module IoTExtendedSections
 * @description Tab section components for IoTExtended.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Brain, Gauge, Layers, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import type { IoTSensor, IoTAlert, OEEData, PredictionData } from "./IoTExtendedTypes";
import { useTranslation } from '@/lib/i18n';

export function SensorsTabContent({
  sensors,
  sensorsLoading,
  activeSensors,
  criticalAlerts,
  warningAlerts,
  onRefresh,
  onAddSensor,
}: {
  sensors: IoTSensor[];
  sensorsLoading: boolean;
  activeSensors: IoTSensor[];
  criticalAlerts: IoTAlert[];
  warningAlerts: IoTAlert[];
  onRefresh: () => void;
  onAddSensor: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("realTimeSensorMalumotlari")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-sensors">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button size="sm" onClick={onAddSensor} data-testid="button-add-sensor">
            <Activity className="h-3.5 w-3.5 mr-1.5" />{t("sensorQoshish")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Faol sensorlar",        v: activeSensors.length,    c: "text-[var(--ep-green)]" },
          { l: "Kritik ogohlantirishlar", v: criticalAlerts.length,  c: "text-[var(--ep-red)]" },
          { l: "Ogohlantirishlar",       v: warningAlerts.length,    c: "text-[var(--ep-primary)]" },
          { l: "Jami sensorlar",         v: sensors.length,          c: "text-[var(--ep-blue)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      {sensorsLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</CardContent></Card>
      ) : sensors.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <div>{t("sensorlarYoqYangiSensorQoshing")}</div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("sensorId")}</TableHead>
                <TableHead>{t("tur")}</TableHead>
                <TableHead>{t("mashina")}</TableHead>
                <TableHead>{t("unit")}</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>{t("holati")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(sensors) ? sensors : []).slice(0, 20).map((s: IoTSensor) => (
                  <TableRow key={s.id} data-testid={`row-sensor-${s.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{s.sensorId}</TableCell>
                    <TableCell><Badge variant="outline">{s.sensorType}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{s.machineId || "—"}</TableCell>
                    <TableCell>{s.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.minValue} / {s.maxValue}</TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />{t("active")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />{t("inactive")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AlertsTabContent({
  alerts,
  alertsLoading,
  criticalAlerts,
  warningAlerts,
  onRefresh,
  onResolve,
  resolvePending,
}: {
  alerts: IoTAlert[];
  alertsLoading: boolean;
  criticalAlerts: IoTAlert[];
  warningAlerts: IoTAlert[];
  onRefresh: () => void;
  onResolve: (id: number | string) => void;
  resolvePending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("iotOgohlantirishlar")}</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-alerts">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Kritik",             v: criticalAlerts.length,    c: "text-[var(--ep-red)]" },
          { l: "Ogohlantirish",      v: warningAlerts.length,     c: "text-[var(--ep-primary)]" },
          { l: "Hal qilingan (bugun)", v: (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => !!a.resolvedAt).length, c: "text-[var(--ep-green)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("sensor")}</TableHead><TableHead>{t("xabar")}</TableHead>
              <TableHead>{t("weight")}</TableHead><TableHead>{t("qiymat")}</TableHead>
              <TableHead>{t("time")}</TableHead><TableHead>{t("harakat")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {alertsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : alerts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)]" />
                  {t("hozirdaOgohlantirishlarYoq")}
                </TableCell></TableRow>
              ) : (Array.isArray(alerts) ? alerts : []).slice(0, 15).map((a: IoTAlert) => (
                <TableRow key={a.id} data-testid={`row-alert-${a.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm">{a.sensorId}</TableCell>
                  <TableCell className="max-w-[200px] text-sm">{a.alertMessage}</TableCell>
                  <TableCell>
                    <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "secondary" : "outline"}>
                      {a.severity === "critical" ? "Kritik" : a.severity === "warning" ? "Ogohlantirish" : "Ma'lumot"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{a.triggeredValue ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell>
                    {!a.resolvedAt ? (
                      <Button size="sm" variant="outline" onClick={() => onResolve(a.id)}
                        disabled={resolvePending} data-testid={`button-resolve-alert-${a.id}`}>
                        {t("halQilish")}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[var(--ep-green)] border-green-600">{t("halQilindi")}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OEETabContent({
  oeeData,
  oeeLoading,
  liveSummary,
}: {
  oeeData: OEEData[];
  oeeLoading: boolean;
  liveSummary?: { activeMachines?: number | string; avgOee?: number | string; totalProduced?: number | string; totalDefects?: number | string } & Record<string, unknown>;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("oeeLiveMonitor")}</h2>
        <Badge variant="outline" className="text-[var(--ep-green)] border-green-600">{t("jonliMalumot")}</Badge>
      </div>

      {oeeLoading ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">OEE yuklanmoqda...</div>
      ) : oeeData.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Gauge className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <div>{t("oeeMalumotlariYoq")}</div>
            <div className="text-xs mt-1">{t("mesOrqaliIshlabChiqarishSeansini")}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Array.isArray(oeeData) ? oeeData : []).slice(0, 6).map((item: OEEData, i: number) => {
            const oee = Number(item.oee ?? 0);
            return (
              <Card key={`k-${i}`} className={oee < 50 ? "border-red-300" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{item.machineId || item.workCenter || `Mashina ${i + 1}`}</span>
                    <span className={`text-2xl font-bold ${oee >= 85 ? "text-[var(--ep-green)]" : oee >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
                      {oee.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded mb-3">
                    <div className={`h-3 rounded transition-all ${oee >= 85 ? "bg-green-500" : oee >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(oee, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs">
                    {([
                      { l: "Mavjudlik",  v: item.availability ? `${Number(item.availability).toFixed(1)}%` : "—" },
                      { l: "Unumdorlik", v: item.performance  ? `${Number(item.performance).toFixed(1)}%`  : "—" },
                      { l: "Sifat",      v: item.quality      ? `${Number(item.quality).toFixed(1)}%`      : "—" },
                    ]).map((m) => (
                      <div key={m.l} className="p-1.5 rounded bg-muted/50">
                        <div className="font-bold">{m.v}</div>
                        <div className="text-muted-foreground">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {liveSummary && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("liveDashboardXulosasi")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { l: "Faol mashinalar",  v: liveSummary.activeMachines ?? "—" },
                { l: "Bugungi OEE",      v: liveSummary.avgOee ? `${Number(liveSummary.avgOee).toFixed(1)}%` : "—" },
                { l: "Ishlab chiqarilgan", v: liveSummary.totalProduced ?? "—" },
                { l: "Brak",             v: liveSummary.totalDefects ?? "—" },
              ]).map((s) => (
                <div key={s.l} className="text-center p-3 rounded-md bg-muted/50">
                  <div className="text-xl font-bold text-primary">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// PredictiveTabContent and DigitalTwinTabContent are in IoTExtendedSectionsExtra.tsx
export { PredictiveTabContent, DigitalTwinTabContent } from "./IoTExtendedSectionsExtra";
