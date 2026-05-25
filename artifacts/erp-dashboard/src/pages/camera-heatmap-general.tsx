/**
 * @module camera-heatmap-general
 * @description "General" tab content for the Camera Heatmap page.
 *              Contains GeneralTabContent plus its three sub-cards
 *              (HotspotsCard, ZonesCard, TimeCard).
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Users, Clock } from "lucide-react";
import {
  getIntensityColor,
  TIME_SLOTS,
  type HeatmapCell,
  type ZoneWithColor,
  type Translations,
} from "./camera-heatmap-types";

// ---------------------------------------------------------------------------
// HotspotsCard
// ---------------------------------------------------------------------------

interface HotspotsCardProps {
  hotspots: HeatmapCell[];
  t: Translations;
}

function HotspotsCard({ hotspots, t }: HotspotsCardProps) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
          {t.hotspots}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {(Array.isArray(hotspots) ? hotspots : []).map((spot, index) => (
            <div
              key={`k-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
              data-testid={`hotspot-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getIntensityColor(spot.intensity)}`} />
                <span className="font-bold text-foreground capitalize">{spot.zone}</span>
              </div>
              <Badge className="bg-muted/60 text-muted-foreground border-none rounded-full px-2 py-0.5 font-bold">
                {Math.round(spot.intensity * 100)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ZonesCard
// ---------------------------------------------------------------------------

interface ZonesCardProps {
  zones: ZoneWithColor[];
  heatmapData: HeatmapCell[];
  t: Translations;
}

function ZonesCard({ zones, heatmapData, t }: ZonesCardProps) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-[var(--ep-blue)]" />
          {t.zones}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {(Array.isArray(zones) ? zones : []).map(zone => {
            const zoneCells = (Array.isArray(heatmapData) ? heatmapData : []).filter(
              c => c.zone === zone.id
            );
            const avgIntensity =
              zoneCells.length > 0
                ? zoneCells.reduce((s, c) => s + c.intensity, 0) / zoneCells.length
                : 0;
            return (
              <div key={zone.id} className="space-y-1.5" data-testid={`zone-stat-${zone.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${zone.color}`} />
                    <span className="text-sm font-bold text-foreground">{zone.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {Math.round(avgIntensity * 100)}%
                  </span>
                </div>
                <Progress value={avgIntensity * 100} className="h-1.5 bg-muted/60" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TimeCard
// ---------------------------------------------------------------------------

interface TimeCardProps {
  t: Translations;
}

function TimeCard({ t }: TimeCardProps) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-[var(--ep-green)]" />
          {t.byTime}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {TIME_SLOTS.map(([time, intensity], i) => (
            <div key={String(time)} className="space-y-1.5" data-testid={`time-slot-${i}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{String(time)}</span>
                <span className="text-xs font-bold text-muted-foreground">
                  {Math.round(Number(intensity) * 100)}%
                </span>
              </div>
              <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`${getIntensityColor(Number(intensity))} h-full transition-all`}
                  style={{ width: `${Number(intensity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// GeneralTabContent (exported)
// ---------------------------------------------------------------------------

export interface GeneralTabContentProps {
  heatmapData: HeatmapCell[];
  zones: ZoneWithColor[];
  hotspots: HeatmapCell[];
  t: Translations;
}

export function GeneralTabContent({ heatmapData, zones, hotspots, t }: GeneralTabContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Heatmap grid */}
      <div className="lg:col-span-2">
        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{t.mapDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <div className="grid grid-cols-10 gap-1 aspect-square max-w-[500px] mx-auto">
                {(Array.isArray(heatmapData) ? heatmapData : []).map((cell, index) => (
                  <div
                    key={`k-${index}`}
                    className={`${getIntensityColor(cell.intensity)} rounded transition-all hover:scale-110 cursor-pointer`}
                    style={{ aspectRatio: "1/1" }}
                    title={`${cell.zone}: ${Math.round(cell.intensity * 100)}%`}
                    data-testid={`heatmap-cell-${cell.x}-${cell.y}`}
                  />
                ))}
              </div>

              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {(Array.isArray(zones) ? zones : []).map(zone => (
                  <div
                    key={zone.id}
                    className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                    data-testid={`badge-zone-${zone.id}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${zone.color}`} />
                    {zone.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Intensity legend */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t.low}
              </span>
              <div className="flex gap-1.5">
                <div className="w-10 h-3 bg-green-200 rounded-full" />
                <div className="w-10 h-3 bg-yellow-200 rounded-full" />
                <div className="w-10 h-3 bg-orange-300 rounded-full" />
                <div className="w-10 h-3 bg-red-400 rounded-full" />
                <div className="w-10 h-3 bg-red-600 rounded-full" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t.high}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <HotspotsCard hotspots={hotspots} t={t} />
        <ZonesCard zones={zones} heatmapData={heatmapData} t={t} />
        <TimeCard t={t} />
      </div>
    </div>
  );
}
