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

/**
 * Audit 2026-08-08: `distanceKm` — real haversine hisob (backend, HR_MAP_FACTORY_LAT/LNG
 * asosida). `travelMinutes`/`direction` avval mavjud edi, lekin backend hech qachon
 * hisoblamagan (soxta/undefined) — real transport-jadval (avtobus soni/sig'imi/jo'nash
 * vaqti) egasi-qarori talab qiladi (Q-34), shuning uchun olib tashlandi (Q-40).
 */
export interface TransportEmployee {
  id: string;
  fullName: string;
  lat: number;
  lng: number;
  address: string | null;
  distanceKm: number;
}

/**
 * `departureTime`/`route`/`driverNote` — xuddi shu sabab bilan olib tashlandi (backend hech
 * qachon hisoblamagan, real transport-jadval biznes-qoidasi kerak). `color` endi FE'da
 * indeks bo'yicha tayinlanadi (GROUP_COLORS) — backend bermaydi.
 */
export interface TransportGroup {
  id: string;
  name: string;
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
  activeEmployees?: number;
  totalDepartments?: number;
  byDepartment: Array<{ orgDepartmentName: string; count: number }>;
}

export type ViewMode = "markers" | "heatmap" | "routes";
