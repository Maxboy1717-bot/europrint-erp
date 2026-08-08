/**
 * @module SDExtendedTypes
 * @description Shared TypeScript interfaces, types, and constants for SDExtended.
 * No JSX — pure types and data.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Target, Package, Banknote,
} from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ── Domain Interfaces ────────────────────────────────────────────────────────

export interface CrmDeal {
  id: number;
  stage: string;
  expectedRevenue?: number | string;
  assignedTo?: number;
}

export interface UserRecord {
  id: number;
  role: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

export interface PapkaOrder {
  id: number;
  status: string;
  clientName?: string;
  amount?: number;
  dueDate?: string;
  advancePercent?: number;
  papkaNo?: string;
  mijozNomi?: string;
  mahsulotNomi?: string;
  sana?: string;
  // Audit 2026-08-08: GET /api/papka-orders (legacy-warehouse.helpers.ts `SELECT po.*`)
  // returns raw snake_case columns with NO camelCase aliasing — `dueDate` above is never
  // actually populated. `tayyor_bolish_sanasi` (ready-by date) is the real column used
  // for "muddati o'tgan" (overdue) computation.
  tayyor_bolish_sanasi?: string;
  items?: PapkaOrder[];
  data?: PapkaOrder[];
  orders?: PapkaOrder[];
}

export interface RentalRecord {
  id: string;
  orderId?: string;
  clientName?: string;
  orderNumber?: string;
  areaM2?: number | string;
  startDate?: string;
  endDate?: string;
  dailyRate?: number | string;
  totalAmount?: number | string;
  billed?: boolean;
}

// ── Derived / Computed ───────────────────────────────────────────────────────

export interface ManagerStat {
  name: string;
  totalDeals: number;
  wonDeals: number;
  revenue: number;
  quota: number;
  progress: number;
}

// ── Route / Tab Constants ────────────────────────────────────────────────────

export const routeTabMap: Record<string, string> = {
  "/sd/manager-panel": "manager",
  "/sd/quota-dashboard": "quota",
  "/sd/warehouse-rental": "rental",
  "/sd/advance-control": "advance",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "manager": { title: tLabel('common.SDExtended.menejerPaneli', "Menejer Paneli"), icon: LayoutDashboard },
  "quota": { title: "Kvota Dashboard", icon: Target },
  "rental": { title: "Ombor Ijara", icon: Package },
  "advance": { title: tLabel('common.SDExtended.avansNazorat', "Avans Nazorat"), icon: Banknote },
};

// ── Business Constants ───────────────────────────────────────────────────────

/** Default per-manager quota in UZS. */
export const DEFAULT_MANAGER_QUOTA = 50_000_000;
