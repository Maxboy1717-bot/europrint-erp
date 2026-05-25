/**
 * @module misc-b
 * @description Additional API request helpers (LMS, logistics, HR, system, etc.)
 * Split from misc.ts (Rule 16).
 */

import { apiRequest } from "@/lib/queryClient";

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
