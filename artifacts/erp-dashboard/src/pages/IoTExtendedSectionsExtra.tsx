/**
 * @module IoTExtendedSectionsExtra
 * @description Predictive maintenance and Digital Twin tab components for IoTExtended.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Layers } from "lucide-react";
import type { IoTSensor, IoTAlert, PredictionData } from "./IoTExtendedTypes";
import { useTranslation } from '@/lib/i18n';

export function PredictiveTabContent({
  predictions,
  dashLoading,
}: {
  predictions?: PredictionData[];
  dashLoading: boolean;
}) {
  const { t } = useTranslation("common");
  if (dashLoading) {
    return <div className="text-center py-8 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>;
  }

  if (!predictions || predictions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">{t("aiPredictiveEngine")}</div>
          <div className="text-sm mt-1">{t("sensorMalumotlariYigilgandanSongBashoratlar")}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {([
              { l: "Model aniqligi",            v: "—", c: "text-[var(--ep-green)]" },
              { l: "Oldini olingan to'xtashlar", v: "—", c: "text-[var(--ep-blue)]" },
              { l: "Tejash (so'm)",              v: "—", c: "text-[var(--ep-purple)]" },
            ]).map((s) => (
              <div key={s.l} className="p-3 rounded-md bg-muted/50">
                <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Bashorat qilingan nosozliklar", v: predictions.length,                                                                     c: "text-[var(--ep-primary)]" },
          { l: "Kritik holatlar",               v: predictions.filter((p: PredictionData) => (p.risk ?? 0) >= 80).length,                  c: "text-[var(--ep-red)]" },
          { l: "Texnik xizmat kerak",           v: predictions.filter((p: PredictionData) => (p.daysUntilMaintenance ?? 99) <= 7).length,  c: "text-[var(--ep-blue)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">AI prognozlar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(Array.isArray(predictions) ? predictions : []).map((p: PredictionData, i: number) => (
            <div key={`k-${i}`} className="p-4 rounded-md bg-muted/50 space-y-2" data-testid={`row-prediction-${i}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{p.machineId || p.machine}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={(p.risk ?? 0) >= 80 ? "destructive" : (p.risk ?? 0) >= 60 ? "secondary" : "outline"}>
                    {(p.risk ?? 0)}% xavf
                  </Badge>
                  {(p.daysUntilMaintenance ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground">{(p.daysUntilMaintenance ?? 0)} kun</span>
                  )}
                </div>
              </div>
              {p.prediction && <p className="text-sm text-muted-foreground">{p.prediction}</p>}
              <div className="h-1.5 bg-muted rounded">
                <div
                  className={`h-1.5 rounded ${(p.risk ?? 0) >= 80 ? "bg-red-500" : (p.risk ?? 0) >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min((p.risk ?? 0), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export function DigitalTwinTabContent({
  sensors,
  activeSensors,
  criticalAlerts,
  warningAlerts,
}: {
  sensors: IoTSensor[];
  activeSensors: IoTSensor[];
  criticalAlerts: IoTAlert[];
  warningAlerts: IoTAlert[];
}) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("digitalTwinVirtualZavod")}</h2>
      <Card>
        <CardContent className="pt-4">
          <div className="h-64 bg-muted/30 rounded-md border border-dashed flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <div className="text-sm font-medium">{t("k3dDigitalTwinVizualizatsiya")}</div>
              <div className="text-xs mt-1">Three.js / BIM integratsiya tayyorlanmoqda</div>
              <div className="text-xs mt-0.5 text-muted-foreground/70">{t("realVaqtdaSensorMalumotlariBilan")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Virtual stanoqlar",     v: sensors.length || "0",                        c: "text-primary" },
          { l: "Sensor aloqalari",      v: activeSensors.length || "0",                  c: "text-[var(--ep-green)]" },
          { l: "Faol ogohlantirishlar", v: criticalAlerts.length + warningAlerts.length, c: "text-[var(--ep-primary)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
