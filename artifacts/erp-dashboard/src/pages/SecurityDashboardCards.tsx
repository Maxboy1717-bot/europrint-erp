/**
 * @module SecurityDashboardCards
 * @description Reusable card-level UI components for the Security Dashboard:
 * KPI stat strip, access-zone capacity card, and fire/gas sensor card.
 * Relies only on shadcn/ui primitives and lucide-react — no data-fetching.
 */

import { type LucideIcon } from "lucide-react";
import {
  Users, Eye, AlertTriangle, HardHat, Bell,
  MapPin, Flame, Wind, ZapOff, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AccessZone, FireSensor, DailySummary, Visitor } from "./SecurityDashboardTypes";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------

interface KpiItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

interface SecurityKpiStripProps {
  summary: DailySummary | undefined;
  activeVisitors: Visitor[];
  openIncidents: number;
  failedPPECount: number;
  warningAlerts: number;
}

export function SecurityKpiStrip({
  summary,
  activeVisitors,
  openIncidents,
  failedPPECount,
  warningAlerts,
}: SecurityKpiStripProps) {
  const items: KpiItem[] = [
    {
      label: "Ichkarida",
      value: summary?.activeOnSite ?? 0,
      icon: Users,
      color: "text-foreground",
    },
    {
      label: tLabel('common.SecurityDashboardCards.tsx.tashrifchilar', "Tashrifchilar"),
      value: activeVisitors.length,
      icon: Eye,
      color: "text-primary",
    },
    {
      label: tLabel('common.SecurityDashboardCards.tsx.ochiqHodisalar', "Ochiq hodisalar"),
      value: openIncidents,
      icon: AlertTriangle,
      color: openIncidents > 0 ? "text-[var(--ep-red)]" : "text-foreground",
    },
    {
      label: "PPE xato",
      value: failedPPECount,
      icon: HardHat,
      color: failedPPECount > 0 ? "text-[var(--ep-yellow)]" : "text-foreground",
    },
    {
      label: tLabel('common.SecurityDashboardCards.tsx.ogohlantirish', "Ogohlantirish"),
      value: warningAlerts,
      icon: Bell,
      color: warningAlerts > 0 ? "text-[var(--ep-yellow)]" : "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((s, i) => (
        <div
          key={`kpi-${i}`}
          className="bg-card rounded-lg p-5"
          data-testid={`security-kpi-${i}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {s.label}
          </p>
          <p className={`text-4xl font-bold tracking-tight mt-1 ${s.color}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Access-zone card
// ---------------------------------------------------------------------------

interface AccessZoneCardProps {
  zone: AccessZone;
}

export function AccessZoneCard({ zone }: AccessZoneCardProps) {
  const occupancy = Math.round((zone.activeCount / zone.maxCapacity) * 100);
  const isFull = occupancy >= 90;

  return (
    <Card data-testid={`card-zone-${zone.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold">{zone.name}</p>
            <p className="text-xs text-muted-foreground">
              Ruxsat darajasi: {zone.accessLevel}
            </p>
          </div>
          <Badge
            variant={
              isFull
                ? "destructive"
                : zone.activeCount > 0
                ? "default"
                : "secondary"
            }
          >
            <MapPin className="w-3 h-3 mr-1" />
            {zone.activeCount} kishi
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>
              Band: {zone.activeCount}/{zone.maxCapacity}
            </span>
            <span>{occupancy}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isFull
                  ? "bg-red-500"
                  : occupancy > 60
                  ? "bg-orange-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(occupancy, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Fire / gas sensor card
// ---------------------------------------------------------------------------

interface FireSensorCardProps {
  sensor: FireSensor;
}

export function FireSensorCard({ sensor }: FireSensorCardProps) {
  const Icon = sensor.type.includes("Gaz")
    ? Wind
    : sensor.type.includes("Yong")
    ? Flame
    : sensor.type.includes("Tutun")
    ? ZapOff
    : Activity;

  const iconClass = sensor.type.includes("Gaz")
    ? "text-[var(--ep-blue)]"
    : sensor.type.includes("Yong")
    ? "text-[var(--ep-primary)]"
    : sensor.type.includes("Tutun")
    ? "text-muted-foreground"
    : "text-[var(--ep-purple)]";

  return (
    <Card data-testid={`card-fire-${sensor.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${iconClass}`} />
            <div>
              <p className="font-medium">{sensor.type}</p>
              <p className="text-xs text-muted-foreground">{sensor.location}</p>
            </div>
          </div>
          <Badge
            variant={
              sensor.status === "normal"
                ? "secondary"
                : sensor.status === "warning"
                ? "default"
                : "destructive"
            }
          >
            {sensor.status === "normal"
              ? "Normal"
              : sensor.status === "warning"
              ? "Ogohlantirish"
              : "XAVF!"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Oxirgi tekshiruv:{" "}
          {new Date(sensor.lastCheck).toLocaleTimeString("uz-UZ")}
        </p>
      </CardContent>
    </Card>
  );
}
