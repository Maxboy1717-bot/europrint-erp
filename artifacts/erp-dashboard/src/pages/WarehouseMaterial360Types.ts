// i18next — action labels are translation data resolved at runtime
/**
 * @module WarehouseMaterial360Types
 * @description Types, constants, and format helpers for WarehouseMaterial360.
 * Extracted from WarehouseMaterial360.tsx (Rule 16).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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
    warehouseType: string; available: number; reserved: number; total: number;
    lastUpdated: string | null;
  }>;
  recentMovements: Array<{
    movementId: number; movementNumber: string; movementType: string;
    status: string; quantity: number; unit: string; unitPrice: number;
    fromWarehouseId: number | null; toWarehouseId: number | null;
    createdAt: string; createdByName: string;
  }>;
  priceHistory: Array<{
    id: number; unitPrice: number; currency: string;
    supplierName: string | null; purchaseDate: string | null; createdAt: string;
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

// ─── Movement color map ───────────────────────────────────────────────────────

export const MOVEMENT_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  EXTERNAL_IN:       { bg: "bg-emerald-100", text: "text-emerald-800", label: "Tashqi Kirim"     },
  EXTERNAL_OUT:      { bg: "bg-amber-100",   text: "text-amber-800",   label: "Tashqi Chiqim"    },
  INTERNAL_ISSUE:    { bg: "bg-blue-100",    text: "text-blue-800",    label: "Bo'limga Berish"   },
  INTERNAL_RETURN:   { bg: "bg-green-100",   text: "text-green-800",   label: "Qaytarish"         },
  INTERNAL_TRANSFER: { bg: "bg-violet-100",  text: "text-violet-800",  label: "Ko'chirish"        },
  DAMAGE:            { bg: "bg-red-100",     text: "text-red-800",     label: "Zarar"             },
  INVENTORY_ADJUST:  { bg: "bg-gray-100",    text: "text-gray-800",    label: "Tuzatish"          },
};

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmt(n: number | null | undefined, unit?: string): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0" + (unit ? " " + unit : "");
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: 2 }) + (unit ? " " + unit : "");
}

export function fmtMoney(n: number | null | undefined, currency = "UZS"): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 " + currency;
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " " + currency;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}
