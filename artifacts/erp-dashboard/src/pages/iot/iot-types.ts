/**
 * @module iot-types
 * @description React page component. Route-level UI.
 */

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName?: string;
  productNameRu?: string;
  quantity: number;
  status: string;
  priority: number;
  barcode?: string;
  setupTimeMinutes?: number;
  scheduledDate?: string;
  assignedWorkerId?: string;
}

export interface Equipment {
  id: string;
  name: string;
  nameRu?: string;
  status: string;
}

export interface ProductionSession {
  id: string;
  sessionNumber: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  startedAt?: string;
  lastSignalAt?: string;
  setupStartedAt?: string;
  setupEndedAt?: string;
  /** OEE factor breakdown (real columns on production_sessions). */
  availability?: number | string | null;
  performance?: number | string | null;
  quality?: number | string | null;
  oee?: number | string | null;
  orderNumber?: string;
  productName?: string;
  productNameRu?: string;
  equipmentName?: string;
  equipmentNameRu?: string;
  barcode?: string;
}

export interface DowntimeReasonCode {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  labelUz?: string;
  labelRu?: string;
  category: string;
  color: string;
}

export interface WorkerSchedule {
  id: string;
  orderNumber: string;
  productName: string;
  productNameRu?: string;
  quantity: number;
  priority: number;
  scheduledTime?: string;
  equipmentName?: string;
  status: string;
  barcode?: string;
  setupTimeMinutes?: number;
}

export interface ChecklistMaterial {
  id: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  itemBarcode?: string;
  isScanned: boolean;
}

export interface MaterialKit {
  id: string;
  kitNumber: string;
  barcode: string;
  status: string;
  items: ChecklistMaterial[];
}

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  shift?: string;
}

export interface CrewAssignment {
  masterId: string | null;
  polmasterId: string | null;
  shogirdId: string | null;
  roklerId: string | null;
}

export interface CompletionReportData {
  sessionId?: string;
  worker?: { name: string; tabelNumber: string };
  production?: {
    targetQuantity: number;
    actualQuantity: number;
    goodQuantity: number;
    defectQuantity: number;
    completionPercent: number;
  };
  earnings?: { totalEarnings: number; currency: string; paymentPerUnit: number };
  time?: { runningSeconds: number; downtimeSeconds: number; totalSeconds: number };
  metrics?: { availability: number; performance: number; quality: number; oee: number };
  downtimes?: Array<{ reason: string; duration: number }>;
  materialRemainder?: {
    takenQty: number;
    usedQty: number;
    remainderQty: number;
    unit: string;
    requiresReturn: boolean;
  };
}

// i18n F2 (2026-07-05): widened from "uz" | "ru" to the canonical 3-language
// type -- the old 2-value type is exactly why uz-cyr tablet users always saw
// Russian (the type itself made a 3rd branch impossible to represent).
export type { Language as IotLang } from "@/lib/i18n";
