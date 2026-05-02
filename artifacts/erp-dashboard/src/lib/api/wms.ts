import { apiRequest } from "@/lib/queryClient";

export const wmsApi = {
  createInventoryCount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/inventory-counts", data),

  createInternalRequest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/internal-requests", data),
  updateInternalRequest: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/internal-requests/${id}`, data),

  createTransaction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/transactions", data),

  checkAlerts: () =>
    apiRequest("POST", "/api/wms/check-alerts"),

  createGoodsIssue: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/goods-issue", data),

  receiveRental: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/rental/receive", data),

  reserveStock: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/stock/reserve", data),

  createWarehouse: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/wms/warehouses", data),
  toggleWarehouseActive: (id: number | string) =>
    apiRequest("PATCH", `/api/wms/warehouses/${id}/toggle-active`),

  createWarehouseCompat: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouses", data),
  updateWarehouseCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/warehouses/${id}`, data),
  notifyVacancies: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouses/notify-vacancies", data),

  generateBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/barcode/generate", data),
  scanBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/barcode/scan", data),
  bulkGenerateBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/barcode/bulk-generate", data),

  printLabel: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/label/print", data),
  createPrinterConfig: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/printer-config", data),
  updatePrinterConfig: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/warehouse/printer-config/${id}`, data),

  productionReceive: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/barcode-warehouse/production-receive", data),
  cycleCount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/barcode-warehouse/cycle-count", data),
  resolveOperatorBalance: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/barcode-warehouse/operator-balance/${id}/resolve`, data),

  aiReorderPoint: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/reorder-point", data),
  aiOptimizeStock: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/optimize-stock", data),
  aiDeliveryPredict: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/delivery-predict", data),
  aiRouteOptimize: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/route-optimize", data),
  deleteGoodsIssue: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/goods-issue/${id}`),
  updateGoodsIssue: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/goods-issue/${id}`, data),
  deleteInventoryCount: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/inventory-counts/${id}`),
  updateInventory: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/inventory/${id}`, data),
  deleteInventory: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/inventory/${id}`),
  updateRental: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/rental/${id}`, data),
  deleteRental: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/rental/${id}`),
  updateStock: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/stock/${id}`, data),
  deleteStock: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/stock/${id}`),
  updateTransaction: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/wms/transactions/${id}`, data),
  deleteTransaction: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/transactions/${id}`),
  deleteWmsWarehouse: (id: number | string) =>
    apiRequest("DELETE", `/api/wms/warehouses/${id}`),
  deleteWarehouse: (id: number | string) =>
    apiRequest("DELETE", `/api/warehouses/${id}`),
  createGoodsReceipt: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/goods-receipts", data),
  completeGoodsReceipt: (id: number | string) =>
    apiRequest("POST", `/api/warehouse/goods-receipts/${id}/complete`),
  qcGoodsReceiptLine: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/warehouse/goods-receipts/lines/${id}/qc`, data),
  updateWarehouseRentalSettings: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/warehouse-rental/settings", data),

};
