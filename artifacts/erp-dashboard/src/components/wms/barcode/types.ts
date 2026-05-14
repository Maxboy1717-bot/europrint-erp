/**
 * @module types
 * @description React UI component.
 */

export interface MaterialCardItem {
  id: string | number;
  name: string;
  unit?: string;
  currentStock?: number;
}
export interface WarehouseItem {
  id: string | number;
  name: string;
  code?: string;
}
export interface QcBarcodeItem {
  barcode: {
    id: string;
    barcodeId?: string;
    status?: string;
    remainingQuantity?: number;
    uom?: string;
    lotNumber?: string;
  };
  materialName?: string;
}
export interface PickingBarcodeRef { barcodeId: string; qty: number }
export interface PickingTask {
  task: {
    id: string | number;
    taskNumber?: string;
    status?: string;
    requiredQty?: number;
    pickedQty?: number;
    barcodesToPick?: string | PickingBarcodeRef[];
  };
  materialName?: string;
}
export interface ExitLog {
  id: string | number;
  personName?: string;
  alertLevel?: string;
  exitAllowed?: boolean;
  exitTime?: string;
  securityNotified?: boolean;
}
export interface OperatorDebt {
  balance: {
    id: string | number;
    status?: string;
    qtyDebt?: number;
    reason?: string;
  };
  operatorName?: string;
  barcodeCode?: string;
}
export interface PrintJob {
  id: string | number;
  status?: string;
  templateName?: string;
  copies?: number;
}
export interface RecentMovement {
  barcodeCode?: string;
  movement?: { movementType?: string; quantity?: number; uom?: string };
}
