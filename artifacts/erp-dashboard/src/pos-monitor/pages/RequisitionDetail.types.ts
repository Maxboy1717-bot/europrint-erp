/**
 * @module RequisitionDetail.types
 * @description Types, constants, and pure helpers for RequisitionDetail.
 * Split out so the parent stays under 300 lines.
 */

export interface ReqLine {
  materialCardId: number;
  materialCode?: string;
  materialName?: string;
  requestedQty: number;
  unit?: string;
  availableQty?: number;
  notes?: string;
}

export interface StatusEvent {
  status: string;
  timestamp?: string;
  userId?: number;
  userName?: string;
}

export interface Requisition {
  id: number;
  requestNumber?: string;
  status: string;
  priority?: string;
  justification?: string;
  neededByDate?: string;
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  createdAt: string;
  createdByName?: string;
  createdById?: number;
  departmentId?: string;
  lines?: ReqLine[];
  statusHistory?: StatusEvent[];
}

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: "pos-badge-gray",
  SUBMITTED: "pos-badge-yellow",
  PENDING: "pos-badge-yellow",
  APPROVED: "pos-badge-green",
  REJECTED: "pos-badge-red",
  FULFILLED: "pos-badge-blue",
  COMPLETED: "pos-badge-blue",
  IN_PROGRESS: "pos-badge-yellow",
  CANCELLED: "pos-badge-red",
};

export const PRIORITY_BADGE: Record<string, string> = {
  LOW: "pos-badge-gray",
  MEDIUM: "pos-badge-blue",
  HIGH: "pos-badge-yellow",
  URGENT: "pos-badge-red",
};

export const TIMELINE_STEPS = ["DRAFT", "SUBMITTED", "APPROVED", "FULFILLED"];

export const TIMELINE_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  SUBMITTED: "Yuborildi",
  APPROVED: "Tasdiqlandi",
  FULFILLED: "Bajarildi",
};

export function getPosUserId(): number {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return 0;
    const p = JSON.parse(sess) as { userId?: number };
    return p.userId ?? 0;
  } catch {
    return 0;
  }
}

export function getPosRole(): string {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return "";
    const p = JSON.parse(sess) as { role?: string };
    return (p.role ?? "").toLowerCase();
  } catch {
    return "";
  }
}
