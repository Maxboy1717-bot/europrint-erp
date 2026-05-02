import { apiRequest } from "@/lib/queryClient";

export const crmApi = {
  createLead: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/leads", data),
  updateLead: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/crm/leads/${id}`, data),
  qualifyLead: (id: number | string) =>
    apiRequest("PATCH", `/api/crm/leads/${id}/qualify`),
  moveLead: (id: number | string, stageId: number | string) =>
    apiRequest("PATCH", `/api/crm/leads/${id}/stage`, { stageId }),
  convertLead: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("POST", `/api/crm/leads/${id}/convert`, data),
  deleteLead: (id: number | string) =>
    apiRequest("DELETE", `/api/crm/leads/${id}`),

  createDeal: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/deals", data),
  markDealWon: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/crm/deals/${id}/won`, data),

  createContact: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/contacts", data),
  updateContact: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/crm/contacts/${id}`, data),
  deleteContact: (id: number | string) =>
    apiRequest("DELETE", `/api/crm/contacts/${id}`),
  checkDuplicateContacts: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/contacts/check-duplicates", data),

  createCompany: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/companies", data),
  updateCompany: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/crm/companies/${id}`, data),
  deleteCompany: (id: number | string) =>
    apiRequest("DELETE", `/api/crm/companies/${id}`),
  updateCreditLimit: (id: number | string, creditLimit: number) =>
    apiRequest("PATCH", `/api/crm/companies/${id}/credit-limit`, { creditLimit }),
  checkDuplicateCompanies: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/companies/check-duplicates", data),

  completeActivity: (id: number | string) =>
    apiRequest("PATCH", `/api/crm/activities/${id}/complete`),
  deleteActivity: (id: number | string) =>
    apiRequest("DELETE", `/api/crm/activities/${id}`),

  createLeadStage: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/lead-stages", data),
  updateLeadStage: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/crm/lead-stages/${id}`, data),

  churnRescue: (entityType: string, id: number | string) =>
    apiRequest("POST", `/api/crm/churn-rescue/${entityType}/${id}`),

  autoLeadSources: () =>
    apiRequest("GET", "/api/crm/auto-lead/sources"),
  quickScore: (entityType: string, id: number | string) =>
    apiRequest("GET", `/api/crm/quick-score/${entityType}/${id}`),
  autoLeadCall: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/auto-lead/call", data),
  autoLeadForm: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/auto-lead/form", data),
  autoLeadTelegram: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/auto-lead/telegram", data),
  autoLeadWebsite: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/auto-lead/website", data),

  aiAnalyzeLead: (id: number | string) =>
    apiRequest("POST", `/api/crm/leads/${id}/ai-analysis`),
  scoreLeadV2: (id: number | string) =>
    apiRequest("POST", `/api/crm/leads/${id}/scoring-v2`),
  aiForecastDeal: (id: number | string) =>
    apiRequest("POST", `/api/crm/deals/${id}/ai-forecast`),
  nextBestAction: (entityType: string, entityId: number | string) =>
    apiRequest("POST", `/api/crm/nba/${entityType}/${entityId}`),
  suggestAction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/suggest-action", data),
  aiAutofill: (entityId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/crm/ai/autofill/${entityId}`, data),
  aiLeadScoringV2: (entityId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/crm/ai/leads/${entityId}/scoring-v2`, data),
  createComment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/comments", data),
  sendEmail: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/email/send", data),
  scheduleMeeting: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/meetings/schedule", data),
  sendSms: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/sms/send", data),
  createTask: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/tasks", data),
  sendWhatsapp: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/whatsapp/send", data),
  toggleBitrixRobot: (id: number | string) =>
    apiRequest("PATCH", `/api/crm-bitrix/robots/${id}/toggle`),
  updateBitrixRobot: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/crm-bitrix/robots/${id}`, data),
  deleteMarketing: (id: number | string) =>
    apiRequest("DELETE", `/api/marketing/${id}`),
  updateMarketingPost: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/marketing/content/posts/${id}`, data),
  updateMarketingLead: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/marketing/leads/${id}`, data),

};
