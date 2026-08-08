/**
 * @module types
 * @description React UI component.
 */

export interface DashboardData {
  totalBatches: number;
  totalQuantity: number;
  totalReserved: number;
  reservedPercent: number;
  expiringSoon: number;
  shortageAlerts: number;
  avgConfidence: number;
  materialTypes: string[];
}

export interface MaterialBatchData {
  id: string;
  batchNumber: string;
  materialId: string | null;
  materialName: string;
  materialType: string | null;
  quantity: number;
  reservedQuantity: number | null;
  availableQuantity: number;
  unit: string;
  expiryDate: string | null;
  receivedDate: string | null;
  warehouseId: string | null;
  location: string | null;
  costPerUnit: number | null;
  qualityGrade: string | null;
  status: string;
  createdAt: string;
}

export interface AllocationItem {
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string | null;
  location: string | null;
  qualityGrade: string | null;
  score: number;
  freshness: number;
  costPerUnit: number;
}

export interface OptimizationResult {
  materialType: string;
  requiredQuantity: number;
  allocation: AllocationItem[];
  totalAllocated: number;
  shortage: number;
  coverage: number;
  confidence: number;
}

export interface ReservationRequestData {
  id: string;
  orderId: string | null;
  materialType: string;
  requiredQuantity: number;
  unit: string;
  requiredByDate: string | null;
  priority: string;
  status: string;
  aiRecommendation: AllocationItem[] | null;
  reservedBatches: AllocationItem[] | null;
  totalReserved: number | null;
  shortageAmount: number | null;
  aiConfidence: number | null;
  notes: string | null;
  createdAt: string;
}

/** Signature of the real i18n `t()` function from `useTranslation()` (see src/lib/i18n). */
export type TFunc = (key: string, params?: Record<string, string | number> | string) => string;

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-[var(--ep-yellow)] dark:text-yellow-400",
  reserved: "bg-blue-500/20 text-[var(--ep-blue)] dark:text-blue-400",
  partial: "bg-orange-500/20 text-[var(--ep-primary)] dark:text-orange-400",
  insufficient: "bg-red-500/20 text-[var(--ep-red)] dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  available: "bg-green-500/20 text-[var(--ep-green)] dark:text-green-400",
  depleted: "bg-muted text-muted-foreground",
  expired: "bg-red-500/20 text-[var(--ep-red)] dark:text-red-400",
};

export const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500/20 text-[var(--ep-green)] dark:text-green-400",
  B: "bg-yellow-500/20 text-[var(--ep-yellow)] dark:text-yellow-400",
  C: "bg-red-500/20 text-[var(--ep-red)] dark:text-red-400",
};

/** Maps a batch/request `status` DB value to its i18n key under the "wms" namespace. */
export const STATUS_I18N_KEY: Record<string, string> = {
  pending: "Reservation.statusPending",
  reserved: "Reservation.statusReserved",
  partial: "Reservation.statusPartial",
  insufficient: "Reservation.statusInsufficient",
  cancelled: "Reservation.statusCancelled",
  available: "Reservation.statusAvailable",
  depleted: "Reservation.statusDepleted",
  expired: "Reservation.statusExpired",
};
