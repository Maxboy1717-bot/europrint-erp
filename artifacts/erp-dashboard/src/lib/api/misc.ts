import { apiRequest } from "@/lib/queryClient";

export const notificationsApi = {
  markRead: (id: number | string) =>
    apiRequest("PATCH", `/api/notifications/${id}/read`),
  markAllRead: () =>
    apiRequest("PATCH", "/api/notifications/read-all"),
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/notifications", data),
};

export const orgStructureApi = {
  createNode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/org-structure/nodes", data),
  updateNode: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/org-structure/nodes/${id}`, data),
  deleteNode: (id: number | string) =>
    apiRequest("DELETE", `/api/org-structure/nodes/${id}`),
  moveNode: (id: number | string, parentId: number | string) =>
    apiRequest("PATCH", `/api/org-structure/nodes/${id}/move`, { parentId }),
  assignUserToNode: (userId: number | string, nodeId: number | string) =>
    apiRequest("PATCH", `/api/org-structure/users/${userId}/node`, { nodeId }),
  addFolderItem: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/org-structure/nodes/${id}/folder`, data),
  deleteFolderItem: (nodeId: number | string, itemId: number | string) =>
    apiRequest("DELETE", `/api/org-structure/nodes/${nodeId}/folder/${itemId}`),
};

export const coreApi = {
  createDepartment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/core/departments", data),
  updateDepartment: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/core/departments/${id}`, data),
  deleteDepartment: (id: number | string) =>
    apiRequest("DELETE", `/api/core/departments/${id}`),
  createPosition: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/core/positions", data),
  updatePosition: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/core/positions/${id}`, data),
  deletePosition: (id: number | string) =>
    apiRequest("DELETE", `/api/core/positions/${id}`),
  saveMyPanels: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/core/panels/my", data),
};

export const sevenFunctionsApi = {
  createFunction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/seven-functions/functions", data),
  updateFunction: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/seven-functions/functions/${id}`, data),
  deleteFunction: (id: number | string) =>
    apiRequest("DELETE", `/api/seven-functions/functions/${id}`),
  createKpi: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/seven-functions/kpis", data),
  updateKpi: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/seven-functions/kpis/${id}`, data),
  deleteKpi: (id: number | string) =>
    apiRequest("DELETE", `/api/seven-functions/kpis/${id}`),
  analyze: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/seven-functions/analyze", data),
};

export const securityApi = {
  reportIncident: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/security/report", data),
  updateIncident: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/security/${id}`, data),
  resolveIncident: (id: number | string, resolution: string) =>
    apiRequest("PATCH", `/api/security/${id}/resolve`, { resolution }),
};

export const websiteApi = {
  createBanner: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/website/banners", data),
  updateBanner: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/website/banners/${id}`, data),
  deleteBanner: (id: number | string) =>
    apiRequest("DELETE", `/api/website/banners/${id}`),
  createPortfolio: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/website/portfolio", data),
  updatePortfolio: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/website/portfolio/${id}`, data),
  deletePortfolio: (id: number | string) =>
    apiRequest("DELETE", `/api/website/portfolio/${id}`),
  updateSettings: (key: string, value: unknown) =>
    apiRequest("PUT", `/api/website/settings/${key}`, { value }),
  createPage: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/website/pages", data),
  updatePage: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/website/pages/${id}`, data),
  deletePage: (id: number | string) =>
    apiRequest("DELETE", `/api/website/pages/${id}`),
};

export const ecommerceApi = {
  createProduct: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/admin/products", data),
  updateProduct: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/products/${id}`, data),
  deleteProduct: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/products/${id}`),
  createCategory: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/admin/categories", data),
  updateCategory: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/categories/${id}`, data),
  deleteCategory: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/categories/${id}`),
  updateCustomer: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/customers/${id}`, data),
  updateOrderStatus: (id: number | string, status: string) =>
    apiRequest("PUT", `/api/admin/customer-orders/${id}/status`, { status }),
  updateOrder: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/customer-orders/${id}`, data),
  deleteOrder: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/customer-orders/${id}`),
  createPublicOrder: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/public/orders", data),
};

export const iotApi = {
  updateDeviceThresholds: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/iot/devices/${id}/thresholds`, data),
  recordDeviceReadings: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/iot/devices/${id}/readings`, data),
  createAlert: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/iot/alerts", data),
  acknowledgeAlert: (id: number | string) =>
    apiRequest("PATCH", `/api/iot/alerts/${id}/acknowledge`),
  createDevice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/iot/devices", data),
  updateDevice: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/iot/devices/${id}`, data),
};

export const cameraApi = {
  createCamera: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera/cameras", data),
  updateCamera: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/camera/cameras/${id}`, data),
  deleteCamera: (id: number | string) =>
    apiRequest("DELETE", `/api/camera/cameras/${id}`),
  createCameraZone: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera/camera-zones", data),
  createCameraEvent: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera/camera-events", data),
  updateCameraEvent: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/camera/camera-events/${id}`, data),
  createSafetyViolation: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera/safety-violations", data),
  createQualityDefect: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera/quality-defects-camera", data),
  updateQualityDefect: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/camera/quality-defects-camera/${id}`, data),
  updateCameraAiTriggerRules: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/camera-ai/cameras/${id}/trigger-rules`, data),
};

export const raciApi = {
  createAssignment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/raci-crisis/assignments", data),
  deleteAssignment: (id: number | string) =>
    apiRequest("DELETE", `/api/raci-crisis/assignments/${id}`),
  createAssessment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/raci-crisis/assessments", data),
};

export const kanbanApi = {
  createBoard: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/kanban", data),
  createBoardFull: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/kanban/boards", data),
  updateBoard: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/kanban/${id}`, data),
  deleteBoard: (id: number | string) =>
    apiRequest("DELETE", `/api/kanban/${id}`),
  createColumn: (boardId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/kanban/boards/${boardId}/columns`, data),
  updateColumn: (boardId: number | string, columnId: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/kanban/boards/${boardId}/columns/${columnId}`, data),
  deleteColumn: (boardId: number | string, columnId: number | string) =>
    apiRequest("DELETE", `/api/kanban/boards/${boardId}/columns/${columnId}`),
  createCard: (boardId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/kanban/boards/${boardId}/cards`, data),
  updateCard: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/cards/${id}`, data),
  moveCard: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/cards/${id}/move`, data),
  deleteCard: (id: number | string) =>
    apiRequest("DELETE", `/api/kanban/cards/${id}`),
};

export const lmsApi = {
  createCourse: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/courses", data),
  enrollCourse: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/courses/enroll", data),
  updateCourse: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/lms/courses/${id}`, data),
  updateLesson: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/lms/lessons/${id}`, data),
  createEnrollment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/enrollments", data),
  updateEnrollmentProgress: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/lms/enrollments/${id}/progress`, data),
  completeEnrollment: (id: number | string) =>
    apiRequest("PATCH", `/api/lms/enrollments/${id}/complete`),
  issueCertificate: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/certificates/issue", data),
  revokeCertificate: (certificateId: number | string) =>
    apiRequest("POST", `/api/lms/certificates/${certificateId}/revoke`),
  checkMesCertificate: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/certificates/check-mes", data),
  createExam: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lms/exams", data),
  submitExam: (id: number | string, answers: unknown) =>
    apiRequest("POST", `/api/lms/exams/${id}/submit`, { answers }),
};

export const logisticsApi = {
  createDelivery: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/logistics", data),
  assignDriver: (id: number | string, driverId: number | string) =>
    apiRequest("PATCH", `/api/logistics/${id}/assign-driver`, { driverId }),
  completeDelivery: (id: number | string) =>
    apiRequest("PATCH", `/api/logistics/${id}/complete`),
};

export const marketingApi = {
  createCampaign: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/marketing", data),
  updateCampaign: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/marketing/${id}`, data),
  launchCampaign: (id: number | string) =>
    apiRequest("POST", `/api/marketing/${id}/launch`),
};

export const mroApi = {
  stopMachine: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/mro/stop-machine", data),
  assignMro: (id: number | string, technicianId: number | string) =>
    apiRequest("PATCH", `/api/mro/${id}/assign`, { technicianId }),
  completeMro: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/mro/${id}/complete`, data),
};

export const exceptionsApi = {
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions", data),
  advanceBypass: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/advance-bypass", data),
  forceStatus: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/status-force", data),
  designReject: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/design-reject", data),
  advanceBlock: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/advance-block", data),
  materialShortage: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/material-shortage", data),
  machineBreakdown: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/machine-breakdown", data),
  qcFailed: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/qc-failed", data),
  deliveryFailed: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/delivery-failed", data),
  employeeAbsent: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/employee-absent", data),
  materialNotReturned: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/material-not-returned", data),
  certExpiryCheck: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/exceptions/cert-expiry-check", data),
};

export const weeklyPlanApi = {
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/weekly-plans", data),
  approve: (id: number | string) =>
    apiRequest("PATCH", `/api/weekly-plans/${id}/approve`),
};

export const wasteApi = {
  updateRecord: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/waste/records/${id}`, data),
};

export const designApi = {
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/design", data),
  updateStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/design/${id}/status`, { status }),
};

export const orderStatusApi = {
  transition: (orderId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/order-status/${orderId}/transition`, data),
  designApproved: (orderId: number | string) =>
    apiRequest("POST", `/api/order-status/${orderId}/design-approved`),
  techApproved: (orderId: number | string) =>
    apiRequest("POST", `/api/order-status/${orderId}/tech-approved`),
  advanceReceived: (orderId: number | string) =>
    apiRequest("POST", `/api/order-status/${orderId}/advance-received`),
  qcResult: (orderId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/order-status/${orderId}/qc-result`, data),
  mesComplete: (orderId: number | string) =>
    apiRequest("POST", `/api/order-status/${orderId}/mes-complete`),
  machineBreakdown: (orderId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/order-status/${orderId}/machine-breakdown`, data),
  deliveryFailed: (orderId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/order-status/${orderId}/delivery-failed`, data),
};

export const materialBalanceApi = {
  takeForProduction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/material-balance/production/take", data),
  useInProduction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/material-balance/production/use", data),
  returnFromProduction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/material-balance/production/return", data),
  checkNegativeStock: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/material-balance/negative-stock-check", data),
};

export const productionFactsApi = {
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/production-facts", data),
};

export const reportsHubApi = {
  createDefinition: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/reports-hub/definitions", data),
};

export const systemApi = {
  updateSettings: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/system", data),
};

export const threeWayMatchApi = {
  perform: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/3way-match/perform", data),
};

export const idealRasmApi = {
  update: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/ideal-rasm", data),
  updateByKey: (key: string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/ideal-rasm/${key}`, data),
};

export const fiGlDocApi = {
  createGlDocument: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/fi/gl-documents", data),
};

export const hrTelegramApi = {
  send: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/telegram-bots/send", data),
  broadcast: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/telegram-bots/broadcast", data),
  notifyInternalVacancy: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/telegram-bots/internal-vacancy-published", data),
  notifyEmployee: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/telegram-bots/notify-employee", data),
  notifyHr: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/telegram-bots/notify-hr", data),
};

export const uploadApi = {
  upload: (data: FormData) =>
    apiRequest("POST", "/api/upload", data),
};

export const machineTasksApi = {
  create: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/machine-tasks", data),
};

export const clientErrorsApi = {
  report: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/client-errors", data),
};

export const authRefreshApi = {
  refresh: () =>
    apiRequest("POST", "/api/auth/refresh"),
  adminLogin: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/auth/login", data),
};
