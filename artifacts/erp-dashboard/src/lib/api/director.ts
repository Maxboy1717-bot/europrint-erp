import { apiRequest } from "@/lib/queryClient";

export const directorApi = {
  createApproval: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/director/approvals", data),
  approveItem: (id: number | string, note?: string) =>
    apiRequest("PATCH", `/api/director/approvals/${id}/approve`, { note }),
  rejectItem: (id: number | string, reason?: string) =>
    apiRequest("PATCH", `/api/director/approvals/${id}/reject`, { reason }),

  createObjective: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/okr/objectives", data),
  updateObjective: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/okr/objectives/${id}`, data),
  deleteObjective: (id: number | string) =>
    apiRequest("DELETE", `/api/okr/objectives/${id}`),

  createKeyResult: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/okr/key-results", data),
  updateKeyResult: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/okr/key-results/${id}`, data),
  deleteKeyResult: (id: number | string) =>
    apiRequest("DELETE", `/api/okr/key-results/${id}`),

  updateStrategicCategory: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/strategic/categories/${id}`, data),
  updateStrategicTask: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/strategic/tasks/${id}`, data),
  deleteStrategicTask: (id: number | string) =>
    apiRequest("DELETE", `/api/strategic/tasks/${id}`),
  createMilestone: (taskId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/strategic/tasks/${taskId}/milestones`, data),
  updateMilestone: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/strategic/milestones/${id}`, data),

  updateKaizenSuggestion: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/kaizen/suggestions/${id}`, data),

  updateDokla: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/coordination/dokla/${id}`, data),
  deleteDokla: (id: number | string) =>
    apiRequest("DELETE", `/api/coordination/dokla/${id}`),
  updateRasporyazhenie: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/coordination/rasporyazhenie/${id}`, data),
  deleteRasporyazhenie: (id: number | string) =>
    apiRequest("DELETE", `/api/coordination/rasporyazhenie/${id}`),

  createZno: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/zno", data),
  approveZno: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/zno/${id}/approve`),
  rejectZno: (id: number | string, reason?: string) =>
    apiRequest("PATCH", `/api/hr/zno/${id}/reject`, { reason }),
  updateZno: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr/zno/${id}`, data),

  createZvs: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/zvs", data),
  approveZvs: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/zvs/${id}/approve`),
  rejectZvs: (id: number | string, reason?: string) =>
    apiRequest("PATCH", `/api/hr/zvs/${id}/reject`, { reason }),

  aiKpiExplain: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/kpi-explain", data),
  aiRiskAssess: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/risk-assess", data),
  aiStrategicRecommendations: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/strategic-recommendations", data),
};
