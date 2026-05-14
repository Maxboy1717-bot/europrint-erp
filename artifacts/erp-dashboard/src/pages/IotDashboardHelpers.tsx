/**
 * IotDashboardHelpers — Shared icons, helpers, and small components
 * used across IoTDashboard tab sub-components.
 */
import { Badge } from "@/components/ui/badge";
import {
  Thermometer, Droplets, Zap, Wind, Activity, TrendingUp, BarChart3,
} from "lucide-react";
import type { IotSensor } from "@shared/schema";
import { EPStatusPill } from "@/components/ep";

export const SENSOR_ICONS: Record<string, typeof Thermometer> = {
  temperature: Thermometer,
  humidity:    Droplets,
  power:       Zap,
  pressure:    Wind,
  vibration:   Activity,
  speed:       TrendingUp,
  counter:     BarChart3,
};

export function getStatusColor(sensor: IotSensor): string {
  if (!sensor.lastReading) return "text-muted-foreground";
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold)           return "text-[var(--ep-red)]";
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold)           return "text-[var(--ep-red)]";
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold * 0.9)    return "text-[var(--ep-yellow)]";
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold * 1.1)    return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-green)]";
}

export function getStatusBadge(sensor: IotSensor, tFn: (k: string) => string) {
  if (!sensor.lastReading)
    return <Badge className="bg-muted/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('noData')}</Badge>;
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold)
    return <EPStatusPill tone="danger">{tFn('statusCritical')}</EPStatusPill>;
  if (sensor.minThreshold !== null && sensor.lastReading < sensor.minThreshold)
    return <EPStatusPill tone="danger">{tFn('statusCritical')}</EPStatusPill>;
  if (sensor.maxThreshold !== null && sensor.lastReading > sensor.maxThreshold * 0.9)
    return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('statusWarning')}</Badge>;
  return <EPStatusPill tone="success">{tFn('statusNormal')}</EPStatusPill>;
}

export function getSeverityBadge(severity: string, tFn: (k: string) => string) {
  switch (severity) {
    case "critical": return <EPStatusPill tone="danger">{tFn('severityCritical')}</EPStatusPill>;
    case "high":     return <EPStatusPill tone="danger">{tFn('severityHigh')}</EPStatusPill>;
    case "medium":   return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityMedium')}</Badge>;
    case "low":      return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{tFn('severityLow')}</Badge>;
    default:         return <Badge className="bg-muted/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">{severity}</Badge>;
  }
}

export function OeeGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const circumference = 100.53; // 2π × 15.9155
  const strokeDash = (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="hsl(var(--surface-container-high))" strokeWidth="3.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}
