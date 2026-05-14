/**
 * @module HRMapSections
 * @description Map layers, icon factories, and view-mode controls for HRMap.
 * LeftPanel lives in HRMapDialogs.tsx.
 */

import { useEffect } from "react";
import { Marker, Popup, Polyline, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.heat";
import { Button } from "@/components/ui/button";
import { MapPin, Flame, Route } from "lucide-react";
import type { Employee, TransportResult, ViewMode } from "./HRMapTypes";
import { FACTORY_LAT, FACTORY_LNG, GROUP_COLORS } from "./HRMapTypes";
import { useTranslation } from '@/lib/i18n';

// ── Icon factories ────────────────────────────────────────────────────────────

export const createEmployeeIcon = (color: string) => {
  const svg = `<svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 32 16 32s16-20 16-32c0-8.8-7.2-16-16-16z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
};

export const factoryIcon = L.divIcon({
  html: `<div style="background:#1e40af;width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 20V8l6-4v4l6-4v4l6-4v16H2zm2-2h16V9.6l-6 4V9.6l-6 4V9.6l-4 2.67V18z"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

export const homeIcon = (color: string) => L.divIcon({
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// ── Map utility components ────────────────────────────────────────────────────

export function MapCenterController({ center }: { center: [number, number] }) {
  const { t } = useTranslation("common");
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, []);
  return null;
}

export function HeatmapLayer({ employees }: { employees: Employee[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = (Array.isArray(employees) ? employees : []).filter(e => e.lat != null && e.lng != null);
    if (!valid.length) return;
    type LeafletWithHeat = typeof L & {
      heatLayer: (coords: [number, number, number][], options?: Record<string, unknown>) => L.Layer
    };
    const heatLayer = (L as LeafletWithHeat).heatLayer(
      valid.map(e => [e.lat, e.lng, 1.0] as [number, number, number]),
      { radius: 25, blur: 35, maxZoom: 17, gradient: { 0: "#3b82f6", 0.5: "#f59e0b", 1: "#ef4444" } }
    );
    heatLayer.addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [map, employees]);
  return null;
}

// ── MarkersLayer ──────────────────────────────────────────────────────────────

export function MarkersLayer({ employees }: { employees: Employee[] }) {
  return (
    <MarkerClusterGroup chunkedLoading>
      {(Array.isArray(employees) ? employees : []).map(emp => (
        <Marker
          key={emp.id}
          position={[emp.lat ?? 0, emp.lng ?? 0]}
          icon={createEmployeeIcon(emp.shift ? "#f59e0b" : "#3b82f6")}
          data-testid={`marker-emp-${emp.id}`}
        >
          <Popup>
            <div className="space-y-1 min-w-[180px]">
              <div className="font-semibold">{emp.fullName}</div>
              <div className="text-sm text-gray-600">{emp.departmentName}</div>
              <div className="text-sm text-gray-600">{emp.positionName}</div>
              {emp.address && <div className="text-xs text-gray-500">{emp.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}

// ── RoutesLayer ───────────────────────────────────────────────────────────────

export function RoutesLayer({
  transportData,
  employees,
}: {
  transportData: TransportResult | undefined;
  employees: Employee[];
}) {
  if (transportData) {
    return (
      <>
        {transportData.groups?.flatMap((group, gi) => {
          const color = group.color || GROUP_COLORS[gi % GROUP_COLORS.length];
          return group.employees?.flatMap(emp => [
            <Polyline
              key={`line-${emp.id}`}
              positions={[[FACTORY_LAT, FACTORY_LNG], [emp.lat, emp.lng]]}
              color={color}
              weight={3}
              opacity={0.8}
              dashArray="6 4"
            />,
            <Marker key={`home-${emp.id}`} position={[emp.lat, emp.lng]} icon={homeIcon(color)}>
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <div className="font-semibold">{emp.fullName}</div>
                  <div className="text-sm" style={{ color }}>{group.name}</div>
                  <div className="text-xs text-gray-600">{emp.address}</div>
                  <div className="text-xs text-gray-500">
                    {emp.distanceKm} km • ~{emp.travelMinutes} daqiqa
                  </div>
                  <div className="text-xs font-medium">Chiqish: {group.departureTime}</div>
                </div>
              </Popup>
            </Marker>,
          ]);
        })}
      </>
    );
  }

  return (
    <>
      {(Array.isArray(employees) ? employees : []).map(emp => (
        <Marker
          key={emp.id}
          position={[emp.lat ?? 0, emp.lng ?? 0]}
          icon={createEmployeeIcon("#94a3b8")}
        >
          <Popup>
            <div className="font-semibold">{emp.fullName}</div>
            <div className="text-xs text-gray-500">{emp.address}</div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// ── ViewModeButtons ───────────────────────────────────────────────────────────

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
}

export function ViewModeButtons({ viewMode, onSetViewMode }: ViewModeButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={viewMode === "markers" ? "default" : "outline"}
        size="sm"
        onClick={() => onSetViewMode("markers")}
        data-testid="button-view-markers"
      >
        <MapPin className="h-3.5 w-3.5 mr-1.5" />{t("markerlar")}
      </Button>
      <Button
        variant={viewMode === "heatmap" ? "default" : "outline"}
        size="sm"
        onClick={() => onSetViewMode("heatmap")}
        data-testid="button-view-heatmap"
      >
        <Flame className="h-3.5 w-3.5 mr-1.5" />{t("zichlik")}
      </Button>
      <Button
        variant={viewMode === "routes" ? "default" : "outline"}
        size="sm"
        onClick={() => onSetViewMode("routes")}
        data-testid="button-view-routes"
      >
        <Route className="h-3.5 w-3.5 mr-1.5" />{t("marshrutlar")}
      </Button>
    </div>
  );
}
