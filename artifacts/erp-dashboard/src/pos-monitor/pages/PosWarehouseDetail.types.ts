/**
 * @module PosWarehouseDetail.types
 * @description Types, constants and pure helpers for PosWarehouseDetail.
 * Split out so the page composition stays under 300 lines.
 */

export interface WarehouseEmployee {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  isPrimary: boolean;
  assignedAt: string;
}

export interface StockRow {
  materialCardId: number;
  materialCode: string | null;
  materialName: string | null;
  unit: string | null;
  availableQty: number;
  reservedQty: number;
  totalQty: number;
  lastUpdated: string | null;
}

export interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  fromWarehouseId?: number | null;
  toWarehouseId?: number | null;
}

export const STATUS_BADGE: Record<string, string> = {
  draft: "pos-badge-gray",
  pending: "pos-badge-yellow",
  approved: "pos-badge-green",
  completed: "pos-badge-green",
  cancelled: "pos-badge-red",
  qc_pending: "pos-badge-yellow",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  EXTERNAL_IN: "Tashqi Kirim",
  INTERNAL_RETURN: "Qaytarish",
  EXTERNAL_OUT: "Tashqi Chiqim",
  INTERNAL_ISSUE: "Bo'limga Berish",
  INTERNAL_TRANSFER: "Ombor Ko'chirish",
  DAMAGE: "Zarar Akti",
  INVENTORY_ADJUST: "Inventarizatsiya",
};

export const INBOUND_TYPES = new Set(["EXTERNAL_IN", "INTERNAL_RETURN"]);
export const OUTBOUND_TYPES = new Set(["EXTERNAL_OUT", "INTERNAL_ISSUE", "DAMAGE"]);
export const TRANSFER_TYPES = new Set(["INTERNAL_TRANSFER"]);

export const UNIT_GROUP: Record<string, { icon: string; label: string; color: string }> = {
  KG: { icon: "⚖️", label: "Kilogramm", color: "#3B82F6" },
  KILOGRAMM: { icon: "⚖️", label: "Kilogramm", color: "#3B82F6" },
  L: { icon: "💧", label: "Litr", color: "#06B6D4" },
  LITR: { icon: "💧", label: "Litr", color: "#06B6D4" },
  ML: { icon: "💧", label: "Millilitr", color: "#06B6D4" },
  M: { icon: "📏", label: "Metr", color: "#10B981" },
  METR: { icon: "📏", label: "Metr", color: "#10B981" },
  CM: { icon: "📏", label: "Santimetr", color: "#10B981" },
  M2: { icon: "🟦", label: "Kv. metr", color: "#8B5CF6" },
  M3: { icon: "🟪", label: "Kub. metr", color: "#A855F7" },
  DONA: { icon: "📦", label: "Dona", color: "#F59E0B" },
  SHT: { icon: "📦", label: "Dona", color: "#F59E0B" },
  PCS: { icon: "📦", label: "Dona", color: "#F59E0B" },
  RULON: { icon: "🧻", label: "Rulon", color: "#EC4899" },
  PALETA: { icon: "🪧", label: "Paleta", color: "#84CC16" },
  TON: { icon: "🏋️", label: "Tonna", color: "#0EA5E9" },
};

export function getUnitGroup(unit: string | null | undefined) {
  if (!unit) return { icon: "❓", label: "Noma'lum", color: "#9CA3AF" };
  const up = String(unit).toUpperCase().trim().replace(/\./g, "").replace(/\s/g, "");
  return UNIT_GROUP[up] ?? { icon: "📦", label: unit, color: "#6B7280" };
}

export function fmt(n: number | null | undefined, max = 3): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export type TabKey = "stock" | "inflow" | "outflow" | "quarantine" | "employees" | "bins";
