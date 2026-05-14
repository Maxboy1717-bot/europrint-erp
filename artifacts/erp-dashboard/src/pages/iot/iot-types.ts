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
  oee?: number;
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

export type IotLang = "uz" | "ru";
