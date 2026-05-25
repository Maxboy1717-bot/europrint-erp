/**
 * @module PosMaterial360Helpers
 * @description Interfaces, format utilities and primitive UI components for PosMaterial360.
 * Split from PosMaterial360.tsx (Rule 16).
 */

import type React from "react";

export interface Material360 {
  material: {
    id: number; code: string; name: string; nameRu: string | null;
    category: string | null; materialType: string | null;
    unit: string; unitPrice: number; currency: string;
    currentStock: number; minStock: number; maxStock: number | null;
    description: string | null; supplierName: string | null;
    isActive: boolean; createdAt: string;
  };
  stockByWarehouse: Array<{
    warehouseId: number; warehouseCode: string; warehouseName: string;
    warehouseType: string; available: number; reserved: number;
    total: number; lastUpdated: string | null;
  }>;
  recentMovements: Array<{
    movementId: number; movementNumber: string; movementType: string;
    status: string; quantity: number; unit: string; unitPrice: number;
    fromWarehouseId: number | null; toWarehouseId: number | null;
    createdAt: string; createdByName: string;
  }>;
  priceHistory: Array<{
    id: number; unitPrice: number; currency: string;
    supplierName: string | null; purchaseDate: string | null;
    createdAt: string;
  }>;
  suppliers: Array<{ name: string; lastPrice: number; lastDate: string | null; occurrences: number }>;
  barcodes: Array<{
    id: number; barcode: string; barcodeType: string;
    batchNumber: string | null; quantity: number | null;
    status: string; createdAt: string;
  }>;
  totals: {
    totalInflow: number; totalOutflow: number; netChange: number;
    distinctWarehouses: number; movementCount: number;
  };
}

export const MOVEMENT_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  EXTERNAL_IN:       { bg: "#ECFDF5", text: "#065F46", label: "Tashqi Kirim" },
  EXTERNAL_OUT:      { bg: "#FEF3C7", text: "#92400E", label: "Tashqi Chiqim" },
  INTERNAL_ISSUE:    { bg: "#EFF6FF", text: "#1E40AF", label: "Bo'limga Berish" },
  INTERNAL_RETURN:   { bg: "#F0FDF4", text: "#14532D", label: "Qaytarish" },
  INTERNAL_TRANSFER: { bg: "#F5F3FF", text: "#4C1D95", label: "Ko'chirish" },
  DAMAGE:            { bg: "#FEF2F2", text: "#991B1B", label: "Zarar" },
  INVENTORY_ADJUST:  { bg: "#F1F5F9", text: "#1E293B", label: "Tuzatish" },
};

export function fmt(n: number, unit?: string): string {
  return `${n.toLocaleString("uz-UZ", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

export function fmtMoney(n: number, currency = "UZS"): string {
  return `${n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} ${currency}`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

// Re-exported from canonical source — do not re-define here.
export { PosKpiCard as KpiCard } from "@/pos-monitor/components/PosKpiCard";
export type { PosKpiCardProps as KpiCardProps } from "@/pos-monitor/components/PosKpiCard";

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table>
    </div>
  );
}

export function Th({ children, align }: {
  children: React.ReactNode; align?: "left" | "right" | "center";
}) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align ?? "left", fontSize: 11,
      color: "#9CA3AF", fontWeight: 600, background: "#F9FAFB",
      borderBottom: "1px solid #E5E7EB", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

export function Td({ children, align, mono, color, center, colSpan }: {
  children: React.ReactNode; align?: "left" | "right" | "center";
  mono?: boolean; color?: string; center?: boolean; colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} style={{
      padding: "10px 14px",
      textAlign: align ?? (center ? "center" : "left"),
      fontFamily: mono ? "monospace" : "inherit",
      color: color ?? "#1F2937",
      fontSize: 13,
    }}>
      {children}
    </td>
  );
}

export function Pill({ children, color, text }: {
  children: React.ReactNode; color: string; text: string;
}) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 6,
      background: color, color: text, fontSize: 10, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}
