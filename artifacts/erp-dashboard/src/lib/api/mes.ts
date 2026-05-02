import { apiRequest } from "@/lib/queryClient";

export const mesApi = {
  updateMaintenanceRequest: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/mes/maintenance-requests/${id}`, data),
  updateTaskProgress: (id: number | string, progress: number) =>
    apiRequest("PATCH", `/api/mes/tasks/${id}/progress`, { progress }),
  createSos: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/sos", data),
  createDowntimeEvent: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/downtime-events", data),
  startDowntime: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/operations/downtime", data),
  endDowntime: (id: number | string) =>
    apiRequest("PATCH", `/api/mes/operations/downtime/${id}/end`),
  createSession: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/sessions", data),
  startSession: (id: number | string) =>
    apiRequest("POST", `/api/mes/sessions/${id}/start`),
  completeSession: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("POST", `/api/mes/sessions/${id}/complete`, data),
  reportSessionDowntime: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/mes/sessions/${id}/downtime`, data),
  pauseSession: (id: number | string) =>
    apiRequest("PATCH", `/api/mes/sessions/${id}/pause`),
  resumeSession: (id: number | string) =>
    apiRequest("PATCH", `/api/mes/sessions/${id}/resume`),
  updateSessionQuantity: (id: number | string, quantity: number) =>
    apiRequest("PATCH", `/api/mes/sessions/${id}/quantity`, { quantity }),
  closeShiftEvaluation: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/shifts/close-evaluation", data),
  recordMaterialConsumption: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/material-consumption", data),
  createProductionSession: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mes/production-sessions", data),
  recordDowntime: (sessionId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/mes/operations/${sessionId}/downtime`, data),
  createShiftReport: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/production/shift-reports", data),
  closeShiftReport: (id: number | string) =>
    apiRequest("POST", `/api/production/shift-reports/${id}/close`),
  addShiftDowntime: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/production/shift-reports/${id}/downtime`, data),
  updateShiftReport: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/production/shift-reports/${id}`, data),

};
