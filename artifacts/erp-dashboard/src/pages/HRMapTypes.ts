/**
 * @module HRMapTypes
 * @description Types and constants for HRMap page.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const FACTORY_LAT = 40.555645;
export const FACTORY_LNG = 70.927983;

export const GROUP_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  fullName: string;
  orgDepartmentName: string;
  orgPositionName: string;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lng: number | null;
  shift?: string;
  status: string;
  address?: string;
  profileImageUrl?: string;
}

export interface TransportEmployee {
  id: string;
  fullName: string;
  lat: number;
  lng: number;
  address: string;
  department: string;
  distanceKm: number;
  direction: string;
  travelMinutes: number;
}

export interface TransportGroup {
  id: string;
  name: string;
  color: string;
  departureTime: string;
  totalMinutes: number;
  employeeIds: string[];
  route: string;
  driverNote: string;
  employees: TransportEmployee[];
}

export interface TransportResult {
  groups: TransportGroup[];
  summary: string;
  factoryLat: number;
  factoryLng: number;
  generatedAt: string;
}

export interface MapStats {
  total: { employees: number };
  byDepartment: Array<{ orgDepartmentName: string; count: number }>;
  byShift: Array<{ shift: string; count: number }>;
  byDistrict: Array<{ district: string; count: number }>;
  factoryLat?: number;
  factoryLng?: number;
}

export type ViewMode = "markers" | "heatmap" | "routes";
