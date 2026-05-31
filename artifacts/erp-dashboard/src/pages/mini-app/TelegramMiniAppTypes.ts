/** @module TelegramMiniAppTypes @description TypeScript interfaces, types, constants, and utilities for the Telegram Mini App POS module. No JSX. */

// ─── Telegram WebApp global augmentation ────────────────────────────────────
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        showAlert: (msg: string) => void;
        showConfirm: (msg: string, cb: (ok: boolean) => void) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          setText: (t: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (p: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: "light" | "dark";
        HapticFeedback: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

// ─── Screen & domain types ───────────────────────────────────────────────────

export type Screen =
  | "loading"
  | "auth-error"
  | "scan"
  | "request"
  | "history"
  | "approvals"
  | "request-detail";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  departmentCode: string;
  departmentName: string;
}

export interface MaterialResult {
  id: number;
  name: string;
  nameRu: string;
  barcode: string;
  unit: string;
  stock: number;
  isConsumable: boolean;
  minIntervalDays: number;
  maxQtyPerIssue: number;
}

export interface RequestItem {
  materialId: number;
  name: string;
  nameRu?: string;
  qty: number;
  unit: string;
}

export interface HistoryItem {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  departmentCode: string;
  lines: Array<{
    name: string;
    requestedQty: number;
    issuedQty?: number;
    unit: string;
  }>;
}

export interface PendingApproval {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  requestedByName: string;
  departmentCode: string;
  lines: Array<{
    name: string;
    nameRu?: string;
    requestedQty: number;
    unit: string;
  }>;
}

export interface AppColors {
  bg: string;
  text: string;
  hint: string;
  button: string;
  buttonText: string;
}

export type ToastState = { msg: string; type: "success" | "error" | "info" } | null;

// ─── Constants ───────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending: "Kutilmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
  issued: "Berildi",
  cancelled: "Bekor",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  pending: "#d97706",
  approved: "#059669",
  rejected: "#dc2626",
  issued: "#2563eb",
  cancelled: "#9ca3af",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "#6b7280",
  normal: "#2563eb",
  high: "#d97706",
  urgent: "#dc2626",
};

// ─── API helpers ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
export const API_BASE = `${BASE}/api/pos/mini-app`;

export function getTg() {
  return typeof window !== "undefined" ? window?.Telegram?.WebApp : null;
}

/** Map a raw materialCard API response to a typed MaterialResult. */
export function parseScanResult(m: Record<string, unknown>): MaterialResult {
  return {
    id: m.id as number,
    name: (m.xomAshyo || m.name) as string,
    nameRu: (m.xomAshyoRu || m.nameRu) as string,
    barcode: m.barcode as string,
    unit: (m.unitOfMeasure || m.unit) as string,
    stock: ((m.currentStock ?? m.availableStock ?? 0) as number),
    isConsumable: m.isConsumable as boolean,
    minIntervalDays: m.minIntervalDays as number,
    maxQtyPerIssue: m.maxQtyPerIssue as number,
  };
}

export function apiCall(path: string, options?: RequestInit) {
  const token = sessionStorage.getItem("tg_session_token");
  // eslint-disable-next-line no-restricted-globals -- raw fetch: shared mini-app helper; x-tg-session auth + separate API_BASE, not ERP cookie
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-tg-session": token } : {}),
      ...options?.headers,
    },
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({ message: r.statusText }));
      throw new Error(err.message || r.statusText);
    }
    return r.json();
  });
}
