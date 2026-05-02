import { apiRequest } from "@/lib/queryClient";

export const aiApi = {
  call: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/call", data),

  runAllPendingAutomation: () =>
    apiRequest("POST", "/api/ai/automation/run-all-pending"),

  crmScoreLead: (leadId: number | string) =>
    apiRequest("POST", `/api/ai/crm/score-lead/${leadId}`),
  crmDealProbability: (dealId: number | string) =>
    apiRequest("POST", `/api/ai/crm/deal-probability/${dealId}`),
  crmChurnRisk: (contactId: number | string) =>
    apiRequest("POST", `/api/ai/crm/churn-risk/${contactId}`),
  crmEmailTemplate: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/crm/email-template", data),
  crmNextBestAction: (dealId: number | string) =>
    apiRequest("POST", `/api/ai/crm/next-best-action/${dealId}`),

  directorKpiExplain: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/kpi-explain", data),
  directorRiskAssess: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/risk-assess", data),
  directorStrategicRecs: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/director/strategic-recommendations", data),

  financeCashflowForecast: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/cashflow-forecast", data),
  financeBudgetVariance: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/budget-variance", data),
  financeClassifyInvoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/classify-invoice", data),
  financeFraudRisk: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/fraud-risk", data),

  hrScreenCandidate: (candidateId: number | string) =>
    apiRequest("POST", `/api/ai/hr/screen/${candidateId}`),
  hrClassifyProductivity: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/classify-productivity", data),
  hrInterviewQuestions: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/interview-questions", data),
  hrAnalyzeToolTest: (toolTestId: number | string) =>
    apiRequest("POST", `/api/ai/hr/analyze-tool-test/${toolTestId}`),
  hrOnboardingPlan: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/onboarding-plan", data),
  hrPerformanceReview: (employeeId: number | string) =>
    apiRequest("POST", `/api/ai/hr/performance-review/${employeeId}`),

  marketingGenerateContent: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/marketing/generate-content", data),
  marketingAdCopy: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/marketing/ad-copy", data),
  marketingSentimentAnalyze: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/marketing/sentiment-analyze", data),
  marketingSeoOptimize: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/marketing/seo-optimize", data),

  wmsReorderPoint: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/reorder-point", data),
  wmsOptimizeStock: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/optimize-stock", data),
  wmsDeliveryPredict: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/delivery-predict", data),
  wmsRouteOptimize: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/wms/route-optimize", data),

  crmExtendedChatRespond: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/extended/chat/respond", data),
  crmExtendedSuggestTasks: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/extended/auto-tasks/suggest", data),
  crmExtendedCreateTask: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/extended/auto-tasks/create", data),
  crmExtendedChurnAnalyze: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/extended/churn/analyze", data),
  crmExtendedVoiceAnalyze: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/crm/ai/extended/voice/analyze-call", data),
  assignExam: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai-exam/assign", data),
  attemptExam: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai-exam/attempt", data),
  createPlan: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai-planning/plans", data),
  updatePlanConfig: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/ai-planning/config", data),
  requestReservation: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai-reservation/request", data),
  cancelReservation: (id: number | string) =>
    apiRequest("POST", `/api/ai-reservation/requests/${id}/cancel`),
  createReservationBatch: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai-reservation/batches", data),
  generateInsight: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/insights/generate", data),
  markInsightRead: (id: number | string) =>
    apiRequest("PATCH", `/api/insights/${id}/read`),

};
