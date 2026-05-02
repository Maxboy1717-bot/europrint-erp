import { apiRequest } from "@/lib/queryClient";

export const qcApi = {
  createSupplierQuality: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/supplier-quality", data),

  createApproval: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/approvals", data),
  updateApproval: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/qc/approvals/${id}`, data),

  updateReclamation: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/qc/reclamations/${id}`, data),

  createDefect: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/defects", data),
  resolveDefect: (id: number | string, resolution: string) =>
    apiRequest("PATCH", `/api/qc/defects/${id}/resolve`, { resolution }),

  createStandard: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/standards", data),
  updateStandard: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/qc/standards/${id}`, data),

  createInProcess: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/in-process", data),

  createRootCause: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/root-causes", data),
  updateRootCause: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/qc/root-causes/${id}`, data),

  createInspection: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/inspections", data),
  submitInspection: (id: number | string) =>
    apiRequest("POST", `/api/qc/inspections/${id}/submit`),
  createCheckpoint: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/checkpoints", data),
  createLabTest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/lab-tests", data),
  createParameter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/qc/parameters", data),
  updateParameter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/qc/parameters/${id}`, data),
  aiAnalyzeTest: (id: number | string) =>
    apiRequest("POST", `/api/qc/tests/${id}/ai-analyze`),

};
