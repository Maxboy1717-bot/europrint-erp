
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module PosMovements.types
 * @description Types, status maps and type icon/label maps for PosMovements.
 *   Split out so the page composition stays under 300 lines.
 */

export interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  totalAmount?: number;
  createdAt: string;
  supplierName?: string;
  createdBy?: number;
}

export type MovementTab = "all" | "new" | "process" | "done";

export const STATUS_CFG: Record<
  string,
  { label: string; headerBg: string; headerText: string; tab: string }
> = {
  draft: { label: "Qoralama", headerBg: "#8B7355", headerText: "#FFF", tab: "new" },
  karantin: { label: "Karantin", headerBg: "#F59E0B", headerText: "#FFF", tab: "new" },
  qc_pending: { label: "QC Navbat", headerBg: "#7C3AED", headerText: "#FFF", tab: "process" },
  qc_approved: { label: tLabel('common.PosMovements.qcOtdi', "QC O'tdi"), headerBg: "#2563EB", headerText: "#FFF", tab: "process" },
  qc_rework: { label: "QC Qayta", headerBg: "#DC2626", headerText: "#FFF", tab: "process" },
  qc_rejected: { label: "QC Rad", headerBg: "#6B7280", headerText: "#FFF", tab: "done" },
  pending: { label: "Tasdiq Kutish", headerBg: "#D97706", headerText: "#FFF", tab: "process" },
  approved: { label: "Tasdiqlandi", headerBg: "#059669", headerText: "#FFF", tab: "process" },
  ai_processing: { label: "AI Ishlaydi", headerBg: "#0891B2", headerText: "#FFF", tab: "process" },
  completed: { label: "Yakunlandi", headerBg: "#047857", headerText: "#FFF", tab: "done" },
  cancelled: { label: tLabel('common.PosMovements.bekor', "Bekor"), headerBg: "#9CA3AF", headerText: "#FFF", tab: "done" },
};

export const TYPE_ICON: Record<string, string> = {
  EXTERNAL_IN: "📥",
  EXTERNAL_OUT: "📤",
  INTERNAL_ISSUE: "📦",
  INTERNAL_RETURN: "↩️",
  INTERNAL_TRANSFER: "🔄",
  DAMAGE: "⚠️",
  INVENTORY_ADJUST: "📊",
  INVENTORY_ADJ_PLUS: "➕",
  INVENTORY_ADJ_MINUS: "➖",
  // ── 4 yangi tur (POS Monitor 1-to'lqin taksonomiyasi) ──
  WASTE_IN: "♻️",
  LAB_SAMPLE_OUT: "🧪",
  PARTIAL_RECEIPT: "📦",
  CUSTOMER_MATERIAL: "🤝",
};

export const TYPE_LABEL: Record<string, string> = {
  EXTERNAL_IN: "Tashqi Kirim",
  EXTERNAL_OUT: "Tashqi Chiqim",
  INTERNAL_ISSUE: "Bo'limga Berish",
  INTERNAL_RETURN: "Qaytarish",
  INTERNAL_TRANSFER: "Ko'chirish",
  DAMAGE: "Zarar Akti",
  INVENTORY_ADJUST: "Inventarizatsiya",
  INVENTORY_ADJ_PLUS: "Qo'shish",
  INVENTORY_ADJ_MINUS: "Ayirish",
  // ── 4 yangi tur ──
  WASTE_IN: "Chiqindi Kirim",
  LAB_SAMPLE_OUT: "Lab Namuna Chiqim",
  PARTIAL_RECEIPT: "Qisman Qabul",
  CUSTOMER_MATERIAL: "Mijoz Materiali",
};

/** Badge rang klassi (pos-theme) — harakat turi bo'yicha. */
export const TYPE_BADGE: Record<string, string> = {
  EXTERNAL_IN: "pos-badge-green",
  EXTERNAL_OUT: "pos-badge-red",
  INTERNAL_ISSUE: "pos-badge-yellow",
  INTERNAL_RETURN: "pos-badge-blue",
  INTERNAL_TRANSFER: "pos-badge-blue",
  DAMAGE: "pos-badge-red",
  INVENTORY_ADJUST: "pos-badge-gray",
  INVENTORY_ADJ_PLUS: "pos-badge-green",
  INVENTORY_ADJ_MINUS: "pos-badge-red",
  // ── 4 yangi tur ──
  WASTE_IN: "pos-badge-green",
  LAB_SAMPLE_OUT: "pos-badge-yellow",
  PARTIAL_RECEIPT: "pos-badge-blue",
  CUSTOMER_MATERIAL: "pos-badge-blue",
};

export const TYPE_LIST = [
  "EXTERNAL_IN",
  "EXTERNAL_OUT",
  "INTERNAL_ISSUE",
  "INTERNAL_RETURN",
  "INTERNAL_TRANSFER",
  "DAMAGE",
  // ── 4 yangi tur ──
  "WASTE_IN",
  "LAB_SAMPLE_OUT",
  "PARTIAL_RECEIPT",
  "CUSTOMER_MATERIAL",
];

export function getMovementAction(status: string): { label: string; newStatus: string; bg: string } | null {
  switch (status) {
    case "draft":
      return { label: tLabel('common.PosMovements.yuborish', "Yuborish"), newStatus: "pending", bg: "#8B7355" };
    case "karantin":
      return { label: tLabel('common.PosMovements.qcYuborish', "QC Yuborish"), newStatus: "qc_pending", bg: "#7C3AED" };
    case "qc_pending":
      return { label: tLabel('common.PosMovements.qcOtkazish', "QC O'tkazish"), newStatus: "qc_approved", bg: "#2563EB" };
    case "qc_approved":
      return { label: tLabel('common.PosMovements.tasdiqlash', "Tasdiqlash"), newStatus: "pending", bg: "#D97706" };
    case "pending":
      return { label: tLabel('common.PosMovements.tasdiqlash', "Tasdiqlash"), newStatus: "approved", bg: "#059669" };
    case "approved":
      return { label: "Yakunlash", newStatus: "completed", bg: "#047857" };
    case "ai_processing":
      return { label: "Yakunlash", newStatus: "completed", bg: "#047857" };
    default:
      return null;
  }
}
