import { apiRequest } from "@/lib/queryClient";

export const mmApi = {
  createGoodsReceipt: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mm/goods-receipts", data),
  updateGoodsReceipt: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/mm/goods-receipts/${id}`, data),
  deleteGoodsReceipt: (id: number | string) =>
    apiRequest("DELETE", `/api/mm/goods-receipts/${id}`),

  createGoodsIssue: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mm/goods-issues", data),
  updateGoodsIssue: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/mm/goods-issues/${id}`, data),
  deleteGoodsIssue: (id: number | string) =>
    apiRequest("DELETE", `/api/mm/goods-issues/${id}`),

  createMaterial: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mm/materials", data),
  updateMaterial: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/mm/materials/${id}`, data),
  toggleMaterialActive: (id: number | string) =>
    apiRequest("PATCH", `/api/mm/materials/${id}/toggle-active`),

  approvePurchaseOrder: (id: number | string) =>
    apiRequest("POST", `/api/mm/purchase-orders/${id}/approve`),
  goodsReceiptForPo: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/mm/purchase-orders/${id}/goods-receipt`, data),

  createPurchaseRequisition: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mm/purchase-requisitions", data),
  updatePurchaseRequisition: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/mm/purchase-requisitions/${id}`, data),
  deletePurchaseRequisition: (id: number | string) =>
    apiRequest("DELETE", `/api/mm/purchase-requisitions/${id}`),
  runMrp: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mm/mrp-run", data),

};
