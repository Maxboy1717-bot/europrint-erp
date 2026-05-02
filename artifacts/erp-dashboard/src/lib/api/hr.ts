import { apiRequest } from "@/lib/queryClient";

export const hrApi = {
  createEmployee: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/employees", data),
  updateEmployee: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/hr/employees/${id}`, data),
  updateEmployeeStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/hr/employees/${id}/status`, { status }),
  salaryReview: (employeeId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/employees/${employeeId}/salary-review`, data),

  checkIn: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/attendance/check-in", data),
  checkOut: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/attendance/check-out", data),

  createLeave: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/leave", data),
  approveLeave: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/leave/${id}/approve`),
  rejectLeave: (id: number | string, reason: string) =>
    apiRequest("PATCH", `/api/hr/leave/${id}/reject`, { reason }),
  cancelLeave: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/leave/${id}/cancel`),

  createDisciplineCatalog: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/discipline/catalog", data),
  updateDisciplineCatalog: (code: string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/hr/discipline/catalog/${code}`, data),
  deleteDisciplineCatalog: (code: string) =>
    apiRequest("DELETE", `/api/hr/discipline/catalog/${code}`),
  createDiscipline: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/discipline", data),
  approveDiscipline: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/discipline/${id}/approve`),
  acknowledgeDiscipline: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/discipline/${id}/acknowledge`),
  blockEmployee: (employeeId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/discipline/block/${employeeId}`, data),
  recordAbsence: (employeeId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/discipline/absence/${employeeId}`, data),
  excuseAbsence: (id: number | string, reason: string) =>
    apiRequest("PATCH", `/api/hr/discipline/absence/${id}/excuse`, { reason }),
  unblockEmployee: (employeeId: number | string) =>
    apiRequest("PATCH", `/api/hr/discipline/unblock/${employeeId}`),

  calculatePayroll: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/payroll/calculate", data),
  approvePayroll: (payrollId: number | string) =>
    apiRequest("POST", `/api/hr/payroll/${payrollId}/approve`),
  postPayrollToGL: (payrollId: number | string) =>
    apiRequest("POST", `/api/hr/payroll/${payrollId}/post-to-gl`),

  createOnboardingPlan: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/onboarding/plans", data),
  createDefaultOnboardingPlan: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/onboarding/plans/default-hr-manager", data),
  startOnboarding: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/onboarding/start", data),
  createJobDescription: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/onboarding/job-descriptions", data),
  sendMotivation: (employeeId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/onboarding/motivation/${employeeId}`, data),
  completeProbation: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/onboarding/${id}/complete-probation`),
  updateOnboardingProgress: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr/onboarding/${id}/progress`, data),
  approveJobDescription: (id: number | string) =>
    apiRequest("PATCH", `/api/hr/onboarding/job-descriptions/${id}/approve`),

  createGamificationBadge: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/gamification/badges/catalog", data),

  createRecruitmentFunnel: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/funnel", data),
  moveFunnel: (id: number | string, stage: string) =>
    apiRequest("PATCH", `/api/hr/recruitment/funnel/${id}/move`, { stage }),
  screeningFunnel: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr/recruitment/funnel/${id}/screening`, data),
  createToolTest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/tool-test", data),
  matchToolTest: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/tool-test/match", data),
  createJobOffers: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/job-offers", data),
  createJobOffer: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/job-offer", data),
  updateJobOfferStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/hr/recruitment/job-offer/${id}/status`, { status }),
  createReferencesCheck: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/recruitment/references-check", data),
  checkReferences: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr/recruitment/references-check/${id}`, data),

  createAiInterviewSession: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/ai-interview/sessions", data),
  updateAiInterviewResults: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr-v2/ai-interview/sessions/${id}/results`, data),
  aiInterviewCameraRejected: (token: string) =>
    apiRequest("POST", `/api/hr-v2/ai-interview/session/${token}/camera-rejected`),
  aiInterviewSubmit: (token: string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr-v2/ai-interview/session/${token}/submit`, data),

  createCareerPath: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/career-path", data),
  addCareerStep: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr-v2/career-path/${id}/steps`, data),
  updateCareerStep: (id: number | string, stepId: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr-v2/career-path/${id}/steps/${stepId}`, data),

  createDailyReport: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/daily-reports", data),
  overrideDailyReport: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/hr-v2/daily-reports/${id}/override`, data),

  createDocument: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/documents", data),
  submitDocument: (id: number | string) =>
    apiRequest("PATCH", `/api/hr-v2/documents/${id}/submit`),
  approveDocumentStep: (stepId: number | string, note?: string) =>
    apiRequest("PATCH", `/api/hr-v2/documents/steps/${stepId}/approve`, { note }),
  rejectDocumentStep: (stepId: number | string, reason: string) =>
    apiRequest("PATCH", `/api/hr-v2/documents/steps/${stepId}/reject`, { reason }),

  createEnps: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/enps", data),
  respondEnps: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/enps/respond", data),
  closeEnps: (id: number | string) =>
    apiRequest("PATCH", `/api/hr-v2/enps/${id}/close`),
  launchEnps: (id: number | string) =>
    apiRequest("PATCH", `/api/hr-v2/enps/${id}/launch`),

  createPip: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/pip", data),
  addPipProgress: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr-v2/pip/${id}/progress`, data),
  acknowledgePip: (id: number | string) =>
    apiRequest("PATCH", `/api/hr-v2/pip/${id}/acknowledge`),

  receptionCheckIn: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/reception/check-in", data),
  checkOutReception: (id: number | string) =>
    apiRequest("PATCH", `/api/hr-v2/reception/${id}/check-out`),

  createShift: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/shifts", data),
  requestShiftSwap: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/shifts/swap-request", data),
  approveShiftSwap: (id: number | string, approve: boolean) =>
    apiRequest("PATCH", `/api/hr-v2/shifts/${id}/approve-swap`, { approve }),

  scoreSkillsMatrix: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr-v2/skills-matrix/score", data),

  aiScreenCandidate: (candidateId: number | string) =>
    apiRequest("POST", `/api/ai/hr/screen/${candidateId}`),
  aiClassifyProductivity: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/classify-productivity", data),
  aiInterviewQuestions: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/interview-questions", data),
  aiAnalyzeToolTest: (toolTestId: number | string) =>
    apiRequest("POST", `/api/ai/hr/analyze-tool-test/${toolTestId}`),
  aiOnboardingPlan: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/hr/onboarding-plan", data),
  aiPerformanceReview: (employeeId: number | string) =>
    apiRequest("POST", `/api/ai/hr/performance-review/${employeeId}`),
  // Employees (compat routes)
  createEmployeeCompat: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/employees", data),
  importEmployeesCompat: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/employees/import", data),
  updateEmployeeCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/employees/${id}`, data),
  deleteEmployeeCompat: (id: number | string) =>
    apiRequest("DELETE", `/api/employees/${id}`),
  updateProfileImageCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/employees/${id}/profile-image`, data),
  putProfileImageCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/employees/${id}/profile-image`, data),
  assignOrgFunctions: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/employees/${id}/assign-org-functions`, data),
  signCorpInventory: (id: number | string, itemId: number | string) =>
    apiRequest("POST", `/api/employees/${id}/corporate-inventory/${itemId}/sign`),
  returnCorpInventory: (id: number | string, itemId: number | string) =>
    apiRequest("POST", `/api/employees/${id}/corporate-inventory/${itemId}/return`),
  deleteEmployeeFile: (id: number | string, fileId: number | string) =>
    apiRequest("DELETE", `/api/employees/${id}/files/${fileId}`),
  deleteEmployeeFileCompat: (id: number | string) =>
    apiRequest("DELETE", `/api/employee-files/${id}`),
  deleteHrDocument: (id: number | string) =>
    apiRequest("DELETE", `/api/hr/documents/${id}`),
  createDisciplineRecord: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/discipline-records", data),
  createDailyReport: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/daily-reports", data),
  updateBirthdaySettings: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/birthdays/settings", data),
  completeMilestone: (id: number | string) =>
    apiRequest("POST", `/api/hr/milestones/${id}/complete`),
  addPipelineChecklist: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/checklist`, data),
  probationReview: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/probation-review`, data),
  movePipelineStage: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/stage`, data),
  notifyAlumniForVacancy: (id: number | string) =>
    apiRequest("POST", `/api/hr/recruitment/vacancies/${id}/alumni-notify`),
  setVacancyChannelStatus: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/hr/recruitment/vacancies/${id}/channel-status`, data),
  announceVacancyTelegram: (id: number | string) =>
    apiRequest("POST", `/api/hr/recruitment/vacancies/${id}/telegram-announce`),
  exportSafetyPdf: () =>
    apiRequest("POST", "/api/hr/safety/export/pdf"),
  importHrEmployees: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/hr/employees/import", data),
  updateBrandSettings: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/hr/brand-settings", data),
  updateCandidateCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/candidates/${id}`, data),
  deleteCandidateCompat: (id: number | string) =>
    apiRequest("DELETE", `/api/candidates/${id}`),
  updateCalendarEventCompat: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/calendar-events/${id}`, data),
  updateAdaptationProgram: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/adaptation/programs/${id}`, data),
  updateAdaptationFeedback: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/adaptation/feedback/${id}`, data),
  submitApplicationResponse: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/application-responses", data),
  updateApplication: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/applications/${id}`, data),
  createGoal: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/goals", data),
  updateGoal: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/goals/${id}`, data),
  deleteGoal: (id: number | string) =>
    apiRequest("DELETE", `/api/goals/${id}`),
  createGuideline: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/guidelines", data),
  updateGuideline: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/guidelines/${id}`, data),
  updateMentorship: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/mentorships/${id}`, data),
  createApprovalWorkflow: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/approval-workflow", data),

};
