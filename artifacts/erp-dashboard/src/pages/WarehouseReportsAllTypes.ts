/**
 * WarehouseReportsAllTypes.ts
 * Interfaces, constants and data for WarehouseReportsAll
 */
import { apiRequest } from "@/lib/queryClient";

import { tLabel } from '@/lib/i18n/tLabel';
export interface ReportType {
  key: string;
  icon: string;
  title: string;
  description: string;
  category: "stock" | "movement" | "financial" | "quality" | "audit";
  loader: () => Promise<unknown>;
}

const POS_BASE = "/api/pos";

async function fetchPos<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>("GET", `${POS_BASE}${path}`);
}

export const REPORTS: ReportType[] = [
  // ── STOCK / INVENTORY ──
  { key: "stock_balance", icon: "📦", title: "Stok Balans", category: "stock",
    description: "Har omborda joriy stok holati",
    loader: () => fetchPos("/stock") },

  { key: "low_stock", icon: "⚠️", title: "Past Stok", category: "stock",
    description: tLabel('warehouse.WarehouseReportsAll.minimalQoldiqdanPastMateriallar', "Minimal qoldiqdan past materiallar"),
    loader: () => fetchPos("/stock/low-alerts") },

  { key: "expiry_alerts", icon: "🗓️", title: tLabel('warehouse.WarehouseReportsAll.muddatOgohlantirish', "Muddat Ogohlantirish"), category: "stock",
    description: "30 kun ichida muddati tugaydi",
    loader: () => fetchPos("/stock/expiry-alerts?days=30") },

  { key: "abc_analysis", icon: "📊", title: "ABC Tahlil", category: "stock",
    description: tLabel('warehouse.WarehouseReportsAll.materiallarABCGuruhlari', "Materiallar A/B/C guruhlari (Pareto)"),
    loader: () => fetchPos("/reports/abc-analysis") },

  { key: "fifo_aging", icon: "⏳", title: "FIFO Qarilik", category: "stock",
    description: tLabel('warehouse.WarehouseReportsAll.partiyalarQarilikTahlili', "Partiyalar qarilik tahlili"),
    loader: () => fetchPos("/reports/top-materials") },

  // ── MOVEMENTS ──
  { key: "movement_journal", icon: "🔄", title: "Harakat Jurnali", category: "movement",
    description: tLabel('warehouse.WarehouseReportsAll.barchaKirimChiqimKochirish', "Barcha kirim/chiqim/ko'chirish"),
    loader: () => fetchPos("/wh/movements?limit=200") },

  { key: "damage_movements", icon: "⚡", title: tLabel('warehouse.WarehouseReportsAll.zararHarakatlari', "Zarar Harakatlari"), category: "movement",
    description: tLabel('warehouse.WarehouseReportsAll.damageTuriZararlarRoyxati', "DAMAGE turi - zararlar ro'yxati"),
    loader: () => fetchPos("/movements?type=DAMAGE&limit=100") },

  { key: "turnover", icon: "🔁", title: "Aylanma", category: "movement",
    description: "Oylik aylanma statistikasi",
    loader: () => fetchPos("/reports/movement-stats?period=month") },

  // ── FINANCIAL / GL ──
  { key: "gl_journal", icon: "📒", title: "GL Jurnali", category: "financial",
    description: "GL kontotipi yozuvlari (Dt/Ct)",
    loader: () => fetchPos("/wh-features/gl/journal?limit=200") },

  { key: "gl_audit", icon: "📋", title: tLabel('warehouse.WarehouseReportsAll.glHisobotAudit', "GL Hisobot (Audit)"), category: "audit",
    description: "GL audit izi - kim, qachon, nima",
    loader: () => fetchPos("/reports/audit") },

  { key: "three_way_match", icon: "🔀", title: tLabel('warehouse.WarehouseReportsAll.3TomonlamaTaqqoslash', "3-Tomonlama Taqqoslash"), category: "audit",
    description: "PO ↔ Qabul ↔ Hisob-faktura",
    loader: () => fetchPos("/reports/three-way-match") },

  { key: "cash_log", icon: "💰", title: "Kassa Logi", category: "financial",
    description: "Kassa harakatlari",
    loader: () => fetchPos("/reports/kpi") },

  // ── QUALITY ──
  { key: "qc_report", icon: "🔬", title: tLabel('warehouse.WarehouseReportsAll.qcHisobot', "QC Hisobot"), category: "quality",
    description: "QC tekshiruv natijalari",
    loader: () => fetchPos("/movements?status=qc_pending&limit=100") },

  { key: "confirmation_audit", icon: "✅", title: tLabel('warehouse.WarehouseReportsAll.tasdiqlashAuditi', "Tasdiqlash Auditi"), category: "audit",
    description: tLabel('warehouse.WarehouseReportsAll.harakatTasdiqlashAudit', "Harakat tasdiqlash audit"),
    loader: () => fetchPos("/movements?limit=100") },

  // ── INVENTORY OPERATIONS ──
  { key: "inventory_variance", icon: "🔍", title: "Inventarizatsiya Farqlari", category: "stock",
    description: "Hisoblangan vs tizim qoldiqlari farqi",
    loader: () => fetchPos("/inventory-counts") },

  { key: "inventory_act", icon: "📝", title: "Inventarizatsiya Akti", category: "audit",
    description: "Yakuniy inventarizatsiya aktlari",
    loader: () => fetchPos("/inventory-counts") },

  { key: "request_fulfill", icon: "📬", title: tLabel('warehouse.WarehouseReportsAll.sorovBajarish', "So'rov Bajarish"), category: "movement",
    description: tLabel('warehouse.WarehouseReportsAll.ichkiSorovlarBajarilishi', "Ichki so'rovlar bajarilishi"),
    loader: () => fetchPos("/reports/liabilities") },

  // ── HR / EMPLOYEE ──
  { key: "employee_balance", icon: "👤", title: tLabel('warehouse.WarehouseReportsAll.xodimBalansi', "Xodim Balansi"), category: "audit",
    description: tLabel('warehouse.WarehouseReportsAll.harXodimningMaterialBalansi', "Har xodimning material balansi"),
    loader: () => fetchPos("/reports/liabilities") },

  // ── SUPPLIER ──
  { key: "supplier_rating", icon: "⭐", title: tLabel('warehouse.WarehouseReportsAll.taminotchiReytingi', "Ta'minotchi Reytingi"), category: "audit",
    description: tLabel('warehouse.WarehouseReportsAll.taminotchilarReytingKorsatkichi', "Ta'minotchilar reyting ko'rsatkichi"),
    loader: () => fetchPos("/reports/top-materials") },

  // ── OPERATIONS ──
  { key: "label_history", icon: "🏷️", title: "Label Tarixi", category: "movement",
    description: tLabel('warehouse.WarehouseReportsAll.chopEtilganBarkodlarTarixi', "Chop etilgan barkodlar tarixi"),
    loader: () => fetchPos("/reports/top-materials") },

  { key: "sync_status", icon: "🔗", title: "Sinxronizatsiya Holati", category: "audit",
    description: "POS ↔ ERP sinxronizatsiya jurnali",
    loader: () => fetchPos("/sync/status") },

  // ── KPI ──
  { key: "kpi_dashboard", icon: "📈", title: "KPI Dashboard", category: "stock",
    description: "Real-time KPI har omborda",
    loader: () => fetchPos("/wh-features/kpi/system") },
];

export const CATEGORY_COLORS: Record<string, string> = {
  stock:     "bg-blue-50 border-blue-200",
  movement:  "bg-emerald-50 border-emerald-200",
  financial: "bg-amber-50 border-amber-200",
  quality:   "bg-violet-50 border-violet-200",
  audit:     "bg-gray-50 border-gray-200",
};

export const CATEGORY_LABELS: Record<string, string> = {
  stock:     "Stok",
  movement:  "Harakat",
  financial: "Moliyaviy",
  quality:   "Sifat",
  audit:     "Audit",
};
