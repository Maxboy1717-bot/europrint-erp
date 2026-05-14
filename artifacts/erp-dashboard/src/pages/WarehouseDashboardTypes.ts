/**
 * @module WarehouseDashboardTypes
 * @description Interfaces, types, and constants for WarehouseDashboard.
 */

export interface WarehouseStat {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string | null;
  capacity: number | null;
  isActive: boolean;
  stats: {
    itemCount: number;
    totalQty: number;
    availableQty: number;
    reservedQty: number;
  };
}

export interface LowStockItem {
  id: number;
  kod: string;
  xomAshyo: string;
  currentStock: number | null;
  minStock: number | null;
  category: string | null;
}

export interface RecentTx {
  id: number;
  materialName: string | null;
  materialCode: string | null;
  quantity: number;
  transactionType: string;
  transactionDate: string;
  createdAt: string;
}

export interface PendingTransfer {
  id: number;
  transferNumber: string;
  status: string;
  totalItems: number;
  totalValue: number | null;
  createdAt: string;
}

export interface CategoryStat {
  category: string | null;
  count: number;
  totalValue: number;
  totalStock: number;
}

export interface DashboardData {
  kpis: {
    totalWarehouses: number;
    totalMaterials: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    zoneCount: number;
    binCount: number;
    pendingTransfers: number;
    todayTransactionCount: number;
    monthlyInflow: number;
    monthlyOutflow: number;
    abcA: number;
    abcB: number;
    abcC: number;
  };
  warehouses: WarehouseStat[];
  alerts: { lowStockItems: LowStockItem[] };
  recentTransactions: RecentTx[];
  pendingTransfers: PendingTransfer[];
  categoryStats: CategoryStat[];
  generatedAt: string;
}

export const WAREHOUSE_ICONS_MAP: Record<string, string> = {
  "RM-MAIN": "Package",
  "RM-ROLLS": "ScrollText",
  "FG-MAIN": "Boxes",
  "WIP-MAIN": "Factory",
  "SCRAP-MAIN": "Trash2",
  "SCRAP": "Trash2",
  "QC-HOLD": "ShieldCheck",
  "TOOL-MAIN": "Wrench",
  "MRO-MAIN": "Wrench",
  "MRO-STORE": "Beaker",
  "AUX-MAIN": "Beaker",
};

export const WAREHOUSE_GRADIENTS: Record<string, string> = {
  "RM-MAIN": "",
  "RM-ROLLS": "",
  "FG-MAIN": "",
  "WIP-MAIN": "",
  "SCRAP-MAIN": "",
  "SCRAP": "",
  "QC-HOLD": "",
  "TOOL-MAIN": "",
  "MRO-MAIN": "",
  "MRO-STORE": "",
};

export const TYPE_LABELS: Record<string, string> = {
  raw_material: "Xom Ashyo",
  finished_goods: "Tayyor",
  wip: "Yarim Tayyor",
  scrap: "Brak",
  quarantine: "Karantin",
  tools: "Asbob",
  household_mro: "Xo'jalik",
  mro: "MRO",
};

export const TYPE_COLORS: Record<string, string> = {
  raw_material: "bg-blue-100 text-[var(--ep-blue)]",
  finished_goods: "bg-emerald-100 text-[var(--ep-green)]",
  wip: "bg-cyan-100 text-[var(--ep-cyan)]",
  scrap: "bg-red-100 text-[var(--ep-red)]",
  quarantine: "bg-orange-100 text-[var(--ep-primary)]",
  tools: "bg-yellow-100 text-[var(--ep-yellow)]",
  household_mro: "bg-amber-100 text-[var(--ep-yellow)]",
  mro: "bg-purple-100 text-[var(--ep-purple)]",
};

export const QUICK_LINKS = [
  { label: "Qabul Akti (GRN)", url: "/wms/grn", icon: "PackageCheck" },
  { label: "Inventarizatsiya", url: "/wms/inventory", icon: "BarChart3" },
  { label: "Ko'chirish", url: "/wms/transfer", icon: "ArrowRightLeft" },
  { label: "Ichki So'rov", url: "/wms/internal-requests", icon: "Zap" },
  { label: "Lot Traceability", url: "/wms/lot-traceability", icon: "Activity" },
  { label: "Ombor KPI", url: "/wms/kpi", icon: "TrendingUp" },
] as const;

export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
