/**
 * @module pos
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const posApi = {
  scanBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcode/scan", data),
  assignBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcode/assign", data),
  printBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcode/print", data),
  generateEan13: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcode/generate-ean13", data),
  reviewAiSuggestion: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcode/ai-suggestion/review", data),

  employeeWriteOff: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/employees/write-off", data),
  employeeLiability: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/employees/liability", data),
  updateLiability: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/pos/employees/liability/${id}`, data),
  employeeDismissCheck: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/employees/dismiss-check", data),

  createInventoryCount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/inventory-counts", data),
  recordCountLine: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/inventory-counts/lines/record", data),
  bulkRecordCountLines: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/inventory-counts/lines/bulk-record", data),
  approveInventoryCount: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/pos/inventory-counts/approve", data),

  createMovement: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/movements", data),
  updateMovementStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/pos/movements/${id}/status`, { status }),
  qcDecision: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/movements/qc-decision", data),
  reportDamage: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/movements/damage", data),
  addMovementLine: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/pos/movements/${id}/lines`, data),
  putMovementStatus: (id: number | string, status: string) =>
    apiRequest("PUT", `/api/pos/movements/${id}/status`, { status }),

  createRequest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/requests", data),
  approveRequest: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/pos/requests/approve", data),
  rejectRequest: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/pos/requests/reject", data),
  issueRequest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/requests/issue", data),

  createMovementType: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/movement-types", data),

  addWarehouseAccess: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/warehouse-access", data),
  removeWarehouseAccess: (userId: number | string, warehouseId: number | string) =>
    apiRequest("DELETE", `/api/pos/warehouse-access/${userId}/${warehouseId}`),

  createPrinterConfig: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/printer-config", data),
  updatePrinterConfig: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/pos/printer-config/${id}`, data),
  testPrinter: (id: number | string) =>
    apiRequest("POST", `/api/pos/printer-config/${id}/test`),

  createPassport: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/passports", data),
  createBarcodeRecord: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/barcodes", data),
  createPdfTemplate: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/pdf-templates", data),

  miniAppAuth: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/mini-app/auth", data),
  miniAppScanBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/mini-app/barcode/scan", data),
  miniAppCreateRequest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/mini-app/requests", data),
  miniAppApproveRequest: (id: number | string) =>
    apiRequest("PATCH", `/api/pos/mini-app/requests/${id}/approve`),
  miniAppRejectRequest: (id: number | string, reason?: string) =>
    apiRequest("PATCH", `/api/pos/mini-app/requests/${id}/reject`, { reason }),

  v2BarcodeLookup: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos-v2/barcode/lookup", data),
  v2GetInventoryCounts: () =>
    apiRequest("GET", "/api/pos-v2/inventory-counts"),
  v2GetInventoryCount: (id: string) =>
    apiRequest("GET", `/api/pos-v2/inventory-counts/${id}`),
  v2CreateInventoryCount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos-v2/inventory-counts", data),
  v2UpdateCountLine: (id: number | string, lineId: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/pos-v2/inventory-counts/${id}/lines/${lineId}`, data),
  v2CompleteCount: (id: number | string) =>
    apiRequest("PATCH", `/api/pos-v2/inventory-counts/${id}/complete`),
  v2ApproveCount: (id: number | string) =>
    apiRequest("PATCH", `/api/pos-v2/inventory-counts/${id}/approve`),
  v2GetTransferRequests: () =>
    apiRequest("GET", "/api/pos-v2/transfer-requests"),
  v2GetTransferRequest: (id: string) =>
    apiRequest("GET", `/api/pos-v2/transfer-requests/${id}`),
  v2CreateTransferRequest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos-v2/transfer-requests", data),
  v2UpdateTransferStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/pos-v2/transfer-requests/${id}/status`, { status }),
};
