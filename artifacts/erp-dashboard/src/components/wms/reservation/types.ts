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

export interface Translations {
  title: string;
  subtitle: string;
  tabs: {
    aiReservation: string;
    batches: string;
    history: string;
  };
  dashboard: {
    totalStock: string;
    reservedPct: string;
    expiringSoon: string;
    aiConfidence: string;
  };
  aiPanel: {
    title: string;
    materialType: string;
    quantity: string;
    unit: string;
    requiredBy: string;
    priority: string;
    notes: string;
    optimize: string;
    selectType: string;
  };
  priorities: {
    low: string;
    normal: string;
    high: string;
    urgent: string;
  };
  recommendation: {
    title: string;
    batch: string;
    takeQty: string;
    expiry: string;
    location: string;
    grade: string;
    score: string;
    coverage: string;
    confidence: string;
    shortage: string;
    confirm: string;
    cancel: string;
    noData: string;
  };
  batches: {
    title: string;
    addBatch: string;
    batchNum: string;
    material: string;
    type: string;
    total: string;
    reserved: string;
    available: string;
    expiry: string;
    received: string;
    location: string;
    grade: string;
    status: string;
    cost: string;
    noBatches: string;
  };
  history: {
    title: string;
    id: string;
    type: string;
    qty: string;
    reserved: string;
    shortage: string;
    confidence: string;
    status: string;
    date: string;
    actions: string;
    noRequests: string;
  };
  statuses: {
    pending: string;
    reserved: string;
    partial: string;
    insufficient: string;
    cancelled: string;
    available: string;
    depleted: string;
    expired: string;
  };
  save: string;
  cancel: string;
  close: string;
  search: string;
  allTypes: string;
  allStatuses: string;
  addBatchTitle: string;
  materialName: string;
  batchNumber: string;
}
