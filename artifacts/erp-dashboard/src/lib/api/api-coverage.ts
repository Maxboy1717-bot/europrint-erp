import { apiRequest } from "@/lib/queryClient";

export const approvalWorkflowApi = {
  getByType: (type: string) =>
    apiRequest("GET", `/api/approval-workflow/by-type?type=${type}`),
  bulkApprove: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/approval-workflow/bulk-approve", data),
  submit: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/approval-workflow/submit", data),
  approve: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("POST", `/api/approval-workflow/approve/${id}`, data),
  reject: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("POST", `/api/approval-workflow/reject/${id}`, data),
};

export const barcodeWarehouseApi = {
  getCycleCounts: () =>
    apiRequest("GET", "/api/barcode-warehouse/cycle-counts"),
  submitCycleCounts: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/barcode-warehouse/cycle-counts/submit", data),
  submitCycleCount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/barcode-warehouse/cycle-count/submit", data),
  updateBarcode: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/barcode-warehouse/barcodes/${id}`, data),
  deleteBarcode: (id: number | string) =>
    apiRequest("DELETE", `/api/barcode-warehouse/barcodes/${id}`),
};

export const crmDealsApi = {
  advanceStage: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/crm/deals/${id}/stage`, data),
  createTask: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/create-task", data),
  analyzeChurn: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/churn", data),
  analyzeVoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/voice", data),
};

export const disciplineRecordsApi = {
  getById: (id: number | string) =>
    apiRequest("GET", `/api/discipline-records/${id}`),
  update: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/discipline-records/${id}`, data),
  delete: (id: number | string) =>
    apiRequest("DELETE", `/api/discipline-records/${id}`),
};

export const employeeFilesApi = {
  upload: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/employee-files", data),
};

export const employeeKpiApi = {
  getTopPerformers: () =>
    apiRequest("GET", "/api/employee-kpi/top-performers"),
  getDepartmentSummary: () =>
    apiRequest("GET", "/api/employee-kpi/department-summary"),
  getZoneHistory: (employeeId: number | string) =>
    apiRequest("GET", `/api/employee-kpi/zone-history/${employeeId}`),
  getById: (id: number | string) =>
    apiRequest("GET", `/api/employee-kpi/${id}`),
  recordAttendance: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/employee-kpi/attendance", data),
  update: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/employee-kpi/${id}`, data),
  delete: (id: number | string) =>
    apiRequest("DELETE", `/api/employee-kpi/${id}`),
};

export const employeesExtApi = {
  addAsset: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/employees/${id}/assets`, data),
  addComplaint: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/employees/${id}/complaints`, data),
  updateOrgFunctions: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/employees/${id}/org-functions`, data),
  removeAsset: (id: number | string, assetId: number | string) =>
    apiRequest("DELETE", `/api/employees/${id}/assets/${assetId}`),
};

export const europrintControlApi = {
  getLog: (id: number | string) =>
    apiRequest("GET", `/api/europrint-control/logs/${id}`),
  getModuleHealth: () =>
    apiRequest("GET", "/api/europrint-control/module-health"),
  getActionTypes: () =>
    apiRequest("GET", "/api/europrint-control/action-types"),
  getSourceTypes: () =>
    apiRequest("GET", "/api/europrint-control/source-types"),
};

export const hrMapApi = {
  getDepartments: () =>
    apiRequest("GET", "/api/hr-map/departments"),
  getHeatmap: () =>
    apiRequest("GET", "/api/hr-map/heatmap"),
  filter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-map/filter", data),
};

export const materialCardsApi = {
  getById: (id: number | string) =>
    apiRequest("GET", `/api/material-cards/${id}`),
};

export const successionApi = {
  getTalentPool: () =>
    apiRequest("GET", "/api/succession/talent-pool"),
  getRisks: () =>
    apiRequest("GET", "/api/succession/risks"),
  getReadinessStats: () =>
    apiRequest("GET", "/api/succession/readiness-stats"),
  addToTalentPool: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/succession/talent-pool", data),
  updateCareerPlan: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/succession/career-plans/${id}`, data),
};

export const warehouseLabelApi = {
  printJob: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/warehouse/label/print-job", data),
  updateBatchStatus: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/warehouse/label/batches/${id}/status`, data),
};

export const financeExtendedApi = {
  getOvertime: () =>
    apiRequest("GET", "/api/finance-extended/overtime"),
  getCustoms: () =>
    apiRequest("GET", "/api/finance-extended/customs"),
  getSalaryBenchmark: (id: number | string) =>
    apiRequest("GET", `/api/finance-extended/salary-benchmark/${id}`),
};

export const hrV2Api = {
  getAiInterviewSession: (id: number | string) =>
    apiRequest("GET", `/api/hr-v2/ai-interview/sessions/${id}`),
  getSkillsCatalog: () =>
    apiRequest("GET", "/api/hr-v2/skills-matrix/catalog"),
  getSkillsGapAnalysis: (employeeId: number | string) =>
    apiRequest("GET", `/api/hr-v2/skills-matrix/gap-analysis/${employeeId}`),
  getSkillsTeam: (departmentId: number | string) =>
    apiRequest("GET", `/api/hr-v2/skills-matrix/team/${departmentId}`),
};

export const hrEmployeesApi = {
  uploadProfileImage: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/employees/${id}/profile-image`, data),
  assignOrgFunctions: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/employees/${id}/assign-org-functions`, data),
  addAsset: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/employees/${id}/assets`, data),
  addComplaint: (employeeId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/employees/${employeeId}/complaints`, data),
};

export const integrationApi = {
  getEmployeeComplaintById: (id: number | string) =>
    apiRequest("GET", `/api/integration/employee-complaints/${id}`),
  getAssessmentSkipById: (id: number | string) =>
    apiRequest("GET", `/api/integration/employee-assessment-skips/${id}`),
};

export const iotExtApi = {
  getMachineStatus: () =>
    apiRequest("GET", "/api/iot/machine-status"),
  getMachineStatusLogs: () =>
    apiRequest("GET", "/api/iot/machine-status-logs"),
  getEnvironment: () =>
    apiRequest("GET", "/api/iot/environment"),
  getRecognitionStats: () =>
    apiRequest("GET", "/api/iot/recognition-stats"),
  getEnergyConsumption: () =>
    apiRequest("GET", "/api/iot/energy-consumption"),
  getTemperature: () =>
    apiRequest("GET", "/api/iot/temperature"),
  getHumidity: () =>
    apiRequest("GET", "/api/iot/humidity"),
  getPressure: () =>
    apiRequest("GET", "/api/iot/pressure"),
  getVibration: () =>
    apiRequest("GET", "/api/iot/vibration"),
  getGasLevels: () =>
    apiRequest("GET", "/api/iot/gas-levels"),
  getNoiseLevels: () =>
    apiRequest("GET", "/api/iot/noise-levels"),
  getDowntime: () =>
    apiRequest("GET", "/api/iot/downtime"),
  getShiftReport: () =>
    apiRequest("GET", "/api/iot/shift-report"),
};

export const kanbanExtApi = {
  addComment: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/kanban/cards/${id}/comments`, data),
  addWatcher: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/kanban/cards/${id}/watchers`, data),
  updateChecklistItem: (checklistId: number | string, itemId: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/checklists/${checklistId}/items/${itemId}`, data),
  deleteChecklistItem: (checklistId: number | string, itemId: number | string) =>
    apiRequest("DELETE", `/api/kanban/checklists/${checklistId}/items/${itemId}`),
};

export const marketingApi = {
  createSocialPost: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/marketing/social/posts", data),
  createEmailTemplate: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/marketing/email/templates", data),
  updateSocialPost: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/marketing/social/posts/${id}`, data),
  updateEmailTemplate: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/marketing/email/templates/${id}`, data),
  updateLeadStatus: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/marketing/leads/${id}/status`, data),
  deleteSocialPost: (id: number | string) =>
    apiRequest("DELETE", `/api/marketing/social/posts/${id}`),
  deleteEmailTemplate: (id: number | string) =>
    apiRequest("DELETE", `/api/marketing/email/templates/${id}`),
  addSocialAccount: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/marketing/social/accounts", data),
  removeSocialAccount: (id: number | string) =>
    apiRequest("DELETE", `/api/marketing/social/accounts/${id}`),
};

export const mesExtApi = {
  getProductionSession: (sessionId: number | string) =>
    apiRequest("GET", `/api/mes/production-sessions/${sessionId}`),
  getDowntimeEvents: (sessionId: number | string) =>
    apiRequest("GET", `/api/mes/production-sessions/${sessionId}/downtime-events`),
  recordDowntime: (sessionId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/mes/production-sessions/${sessionId}/downtime`, data),
};

export const equipmentApi = {
  update: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/equipment/${id}`, data),
};

export const fiApi = {
  getGlEntries: () =>
    apiRequest("GET", "/api/fi/gl-entries"),
};

export const materialBalanceApi = {
  getReconciliation: (materialId: number | string) =>
    apiRequest("GET", `/api/material-balance/${materialId}/reconciliation`),
  getByWarehouse: (warehouseId: number | string) =>
    apiRequest("GET", `/api/material-balance/warehouse/${warehouseId}`),
};

export const orderStatusApi = {
  getChain: () =>
    apiRequest("GET", "/api/order-status/chain"),
  getTransitions: () =>
    apiRequest("GET", "/api/order-status/transitions"),
};

export const productionFactsApi = {
  getVariance: () =>
    apiRequest("GET", "/api/production-facts/variance"),
  getOperators: () =>
    apiRequest("GET", "/api/production-facts/operators"),
};

export const systemApi = {
  updateSettings: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/system/settings", data),
};

export const weeklyPlansApi = {
  getById: (id: number | string) =>
    apiRequest("GET", `/api/weekly-plans/${id}`),
};

export const technologyApi = {
  getTechCards: () =>
    apiRequest("GET", "/api/technology/tech-cards"),
};
