/**
 * @module pp
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const ppApi = {
  getBom: (id: number | string) =>
    apiRequest("GET", `/api/pp/bom/${id}`),
  createBom: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pp/bom", data),
  approveBom: (id: number | string) =>
    apiRequest("POST", `/api/pp/bom/${id}/approve`),

  createOrder: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pp/orders", data),
  releaseOrder: (id: number | string) =>
    apiRequest("PATCH", `/api/pp/orders/${id}/release`),

  getRouting: (id: number | string) =>
    apiRequest("GET", `/api/pp/routing/${id}`),
  createRouting: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pp/routing", data),
  approveRouting: (id: number | string) =>
    apiRequest("POST", `/api/pp/routing/${id}/approve`),

  createWorkCenter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pp/work-centers", data),
  updateWorkCenter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/pp/work-centers/${id}`, data),
  toggleWorkCenterActive: (id: number | string) =>
    apiRequest("PATCH", `/api/pp/work-centers/${id}/toggle-active`),

  getSchedule: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return apiRequest("GET", `/api/planning/schedule?${params.toString()}`);
  },
  updatePlanningOperation: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/planning/operations/${id}`, data),

  listEquipment: (status?: string) => {
    const params = status ? `?status=${status}` : "";
    return apiRequest("GET", `/api/equipment${params}`);
  },
};
