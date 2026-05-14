/**
 * @module erp
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const erpApi = {
  updateBomItem: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/bom-items/${id}`, data),
  updateDowntimeLog: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/downtime-logs/${id}`, data),
  updateProductionPlan: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/production-plans/${id}`, data),
  updateErpProduct: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/products/${id}`, data),
  updateRoutingOperation: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/routing-operations/${id}`, data),
  updateWorkCenter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/erp/work-centers/${id}`, data),
};
