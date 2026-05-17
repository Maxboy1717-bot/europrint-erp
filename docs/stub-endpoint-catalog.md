# Stub Endpoint Catalog (Wave 11)

> Inventory of every backend endpoint that returns `HTTP 501 Not Implemented`
> (either via raw `HttpStatus.NOT_IMPLEMENTED` or the `notImplemented(route)` helper),
> cross-referenced with frontend consumers, plus the list of frontend routes still
> rendering `<StubPage>`.
>
> This is an **inventory commit only** — endpoints are not implemented in this
> change. Use this document to prioritize Wave 12+ work.

---

## Summary

| Metric                                | Count |
| ------------------------------------- | ----: |
| Backend stub endpoints (total)        | **240** |
| ├─ Consumed (frontend consumer found) | **234** |
| └─ Orphan (no frontend consumer)      | **6**   |
| Controller files holding stubs        | **44**  |
| Frontend `<StubPage>` routes (actual) | **69**  |
| Frontend `<StubPage>` routes (sprint brief expected) | 22 |
| Feature flags recommended             | **18**  |

Notes:
- The 22-route number in the sprint brief is stale — the actual `STUB_ROUTES`
  array in `artifacts/erp-dashboard/src/routes/StubRoutes.tsx` lists **69**
  entries. All 22 sprint-brief paths are still present in that array.
- "Consumed" means at least one `apiRequest('METHOD', '<route>'…)` or
  React-Query `useQuery({ queryKey: ['<route>'] })` reference was found in the
  frontend. Pure type imports / route registries don't count.

---

## Backend stubs by module

### AI (`/ai`)

File: `apps/api/src/modules/ai/presentation/ai.controller.ts`

| Verb | Route                              | Line | Consumed by                                              | Suggested action |
| ---- | ---------------------------------- | ---: | -------------------------------------------------------- | ---------------- |
| GET  | /ai/forecast/demand                | 179  | `pages/ai-planning/DemandForecastingPage.tsx`            | implement (AI service) |
| GET  | /ai/rush-orders                    | 189  | `pages/ai-planning/RushOrderPage.tsx`                    | implement (AI service) |
| POST | /ai/rush-orders/:id/approve        | 200  | `pages/ai-planning/RushOrderPage.tsx`                    | implement (AI service) |
| POST | /ai/rush-orders/:id/reject         | 211  | `pages/ai-planning/RushOrderPage.tsx`                    | implement (AI service) |

### AI Agents (`/ai-agents`)

File: `apps/api/src/modules/ai-agents/presentation/ai-agents.controller.ts`

| Verb | Route                       | Line | Consumed by                  | Suggested action |
| ---- | --------------------------- | ---: | ---------------------------- | ---------------- |
| POST | /ai-agents/:agentId/trigger | 250  | `pages/AIAgentsPage.tsx`     | implement (agent orchestrator) |

### Compatibility (`/saas`, `/orders-registry`, `/europrint-control`, `/warehouse`)

Files:
- `apps/api/src/modules/compatibility/saas.controller.ts`
- `apps/api/src/modules/compatibility/europrint-control-director.controller.ts`
- `apps/api/src/modules/compatibility/warehouse-catalog.controller.ts`

| Verb   | Route                            | Line | Consumed by                       | Suggested action |
| ------ | -------------------------------- | ---: | --------------------------------- | ---------------- |
| GET    | /saas/tenants/:id/modules        | 137  | `pages/SaaSExtended.tsx`          | implement (SaaS tenant modules) |
| PATCH  | /saas/tenants/:id/modules        | 142  | `pages/SaaSExtended.tsx`          | implement |
| POST   | /saas/tenants/:id/onboard        | 148  | `pages/SaaSExtended.tsx`          | implement |
| GET    | /orders-registry                 | 161  | `pages/OrdersRegistry.tsx`        | implement |
| POST   | /orders-registry                 | 167  | `pages/OrdersRegistryDialogs.tsx` | implement |
| GET    | /europrint-control/menus/admin   | 122  | `pages/AuditorPanel.tsx`, `hooks/use-role-menus.ts` | implement (rbac_menus query) |
| GET    | /warehouse/movements             | 65   | `pages/MaterialsAccounting.tsx`   | feature-flagged-OK (clients already use `/wms/movements`) |

### Design (`/design`)

File: `apps/api/src/modules/design/presentation/design.controller.ts`

| Verb | Route                                  | Line | Consumed by                              | Suggested action |
| ---- | -------------------------------------- | ---: | ---------------------------------------- | ---------------- |
| GET  | /design/notifications                  | 153  | `components/DesignNotifications.tsx`     | implement |
| GET  | /design/statistics                     | 164  | `pages/DesignDashboard.tsx`              | implement |
| GET  | /design/tooling                        | 175  | `pages/DesignDashboard.tsx`              | implement |
| GET  | /design/tooling/:id/wear-forecast      | 187  | (none — predictive feature)              | orphan / feature-flagged-OK |
| GET  | /design/orders/:id/messages            | 199  | `pages/DesignOrderDetail.tsx`            | implement |

### Finance (`/finance`, `/finance-extended`, `/reports`)

Files:
- `apps/api/src/modules/finance/presentation/finance-main.controller.ts`
- `apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts`
- `apps/api/src/modules/finance/presentation/reports.controller.ts`

| Verb   | Route                                                  | Line | Consumed by                         | Suggested action |
| ------ | ------------------------------------------------------ | ---: | ----------------------------------- | ---------------- |
| GET    | /finance/reports                                       | 103  | `pages/FinancialReports.tsx`        | implement |
| GET    | /finance/loans                                         | 151  | `pages/FinanceDashboard.tsx`        | implement |
| GET    | /finance/loans/:id                                     | 162  | (none — detail rarely opened)       | orphan / OK to leave 501 |
| POST   | /finance-extended/payroll/calculate                    | 32   | `pages/PayrollAutomation.tsx`       | implement (P0 — PayrollService INPS/JSHD wiring) |
| POST   | /finance-extended/payroll/ai-calculate                 | 46   | `pages/PayrollAutomation.tsx`       | implement (P0) |
| GET    | /finance-extended/payroll-calculations                 | 58   | `pages/PayrollAutomation.tsx`       | implement (P0) |
| PATCH  | /finance-extended/payroll-calculations/:id/approve     | 72   | `pages/PayrollAutomation.tsx`       | implement |
| POST   | /finance-extended/payroll-calculations/:id/approve     | 87   | `pages/PayrollAutomation.tsx`       | implement |
| GET    | /finance-extended/payroll-contracts                    | 99   | `pages/FinanceExtended.tsx`         | implement |
| GET    | /finance-extended/payroll-tax-rules                    | 109  | `pages/FinanceExtended.tsx`         | implement |
| GET    | /finance-extended/tax-calendar                         | 119  | `pages/FinanceExtended.tsx`         | implement |
| GET    | /finance-extended/salary-benchmark/:id                 | 130  | `pages/PayrollAutomation.tsx`       | implement |
| GET    | /reports/production-efficiency                         | 75   | `pages/FinancialReports.tsx`        | implement |

### HR (`/hr`, `/hr/employees`, `/hr-capital`, `/hr-v2/documents`, `/hr-v2/enps`)

Files:
- `apps/api/src/modules/hr/presentation/hr-dashboard-stubs.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-dashboard-stubs-write.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts`
- `apps/api/src/modules/hr/document-workflow/document-workflow.controller.ts`
- `apps/api/src/modules/hr/enps/enps.controller.ts`

Read-side (`hr-dashboard-stubs.controller.ts`) — all GET:

| Verb | Route                                          | Line | Consumed by                                      | Action |
| ---- | ---------------------------------------------- | ---: | ------------------------------------------------ | ------ |
| GET  | /hr/adaptation/:id                             | 34   | `pages/employee-profile/AdaptationTab.tsx`       | implement (P1) |
| GET  | /hr/alumni/:id                                 | 42   | `pages/HRAlumni.tsx`                             | implement |
| GET  | /hr/daily-reports                              | 49   | `pages/HRDashboardSections.tsx`                  | implement |
| GET  | /hr/daily-reports/department                   | 56   | `pages/HRDashboard.tsx`                          | implement |
| GET  | /hr/daily-reports/my                           | 63   | `pages/HRDashboard.tsx`                          | implement |
| GET  | /hr/offboarding/cases                          | 70   | `pages/HROffboarding.tsx`                        | implement |
| GET  | /hr/offboarding/questions                      | 77   | `pages/HROffboardingSteps.tsx`                   | implement |
| GET  | /hr/onboarding-checklists                      | 84   | `pages/HROnboarding.tsx`                         | implement (P1) |
| GET  | /hr/fp-cycle                                   | 91   | `pages/HRSuccessionPlanningSections.tsx`         | implement |
| GET  | /hr/hrc-tests/employee                         | 98   | `pages/HRCapitalTests.tsx`                       | implement |
| GET  | /hr/hrc-tests/public                           | 105  | `pages/HRCapitalPublicTestTypes.ts`              | implement |
| GET  | /hr/hrc-tests/stats                            | 112  | `pages/HRCapitalTests.tsx`                       | implement |
| GET  | /hr/360/reviewable                             | 119  | `pages/PeerReviewPage.tsx`                       | implement |
| GET  | /hr/birthdays/settings                         | 126  | `pages/BirthdayWidget.tsx`                       | implement |
| GET  | /hr/birthdays/settings/:id                     | 134  | `pages/BirthdayWidget.tsx`                       | implement |
| GET  | /hr/ai-interview/session                       | 141  | `pages/AIInterviewPublicPage.tsx`                | implement |
| GET  | /hr/ai-interview/session/:id/review            | 149  | `pages/AIInterviewPublicPage.tsx`                | implement |
| GET  | /hr/documents/employee                         | 156  | `pages/employee-profile/WorkTabSections.tsx`     | implement |
| GET  | /hr/documents/my                               | 163  | `pages/DocumentWorkflowPage.tsx`                 | implement |
| GET  | /hr/documents/pending                          | 170  | `pages/DocumentWorkflowPage.tsx`                 | implement |
| GET  | /hr/employee-corp                              | 177  | `pages/employee-profile/CorporateInfoCard.tsx`   | implement |
| GET  | /hr/employee-corp/:id                          | 185  | `pages/employee-profile/CorporateInfoCard.tsx`   | implement |
| GET  | /hr/employees/operator-stats                   | 192  | `pages/EmployeeStats.tsx`                        | implement |
| GET  | /hr/enps/surveys/results                       | 199  | `pages/HRDashboardV2Tab.tsx`                     | implement |
| GET  | /hr/abc-analysis/:id/calculate                 | 207  | `pages/HRDashboardSections.tsx`                  | implement |
| GET  | /hr/referrals/:id                              | 215  | `pages/ReferralPage.tsx`                         | implement |

Write-side (`hr-dashboard-stubs-write.controller.ts`):

| Verb  | Route                                       | Line | Consumed by                              | Action |
| ----- | ------------------------------------------- | ---: | ---------------------------------------- | ------ |
| POST  | /hr/alumni/:id/invite                       | 31   | `pages/HRAlumni.tsx`                     | implement |
| POST  | /hr/abc-analysis/:id/calculate              | 41   | `pages/HRDashboardSections.tsx`          | implement |
| PATCH | /hr/adaptation/:id                          | 50   | `pages/employee-profile/AdaptationTab.tsx` | implement |
| PATCH | /hr/ai-interview/session/:id/review         | 60   | `pages/AIInterviewPublicPage.tsx`        | implement |
| PUT   | /hr/birthdays/settings/:id                  | 70   | `pages/BirthdayWidget.tsx`               | implement |
| POST  | /hr/offboarding/cases                       | 80   | `pages/HROffboardingDialogs.tsx`         | implement |
| POST  | /hr/onboarding-checklists                   | 90   | `pages/HROnboarding.tsx`                 | implement |
| PATCH | /hr/onboarding-checklists/:id               | 101  | `pages/HROnboarding.tsx`                 | implement |
| PATCH | /hr/referrals/:id                           | 112  | `pages/ReferralPage.tsx`                 | implement |

`hr-dashboard-extra.controller.ts` and `hr-compat-a.controller.ts`:

| Verb   | Route                                              | Line | Consumed by                              | Action |
| ------ | -------------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET    | /hr/contracts                                      | 76   | `pages/HRExtended.tsx`                   | implement |
| GET    | /hr-capital/courses                                | 102  | `pages/HRCapitalCourses.tsx`             | implement |
| GET    | /hr-capital/stats                                  | 112  | `pages/HRCapitalCourses.tsx`             | implement |
| PATCH  | /hr/hrc-tests/tool-test/questions/:id              | 204  | `pages/HRCapitalTests.tsx`               | implement |
| DELETE | /hr/hrc-tests/tool-test/questions/:id              | 210  | `pages/HRCapitalTestsDialogs.tsx`        | implement |
| GET    | /hr/hrc-tests/employee/:employeeId/results         | 215  | `pages/HRCapitalTests.tsx`               | implement |
| DELETE | /hr/employee-skills/:id                            | 220  | `pages/HRLMSSkills.tsx`                  | implement |
| POST   | /hr/hrc-tests/sessions                             | 225  | `pages/HRCapitalTests.tsx`               | implement |
| POST   | /hr/hrc-tests/tool-test/questions                  | 231  | `pages/HRCapitalTestsDialogs.tsx`        | implement |

`hr-employees-ext.controller.ts`:

| Verb   | Route                                                          | Line | Consumed by                              | Action |
| ------ | -------------------------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET    | /hr/employees/:employeeId/documents                            | 173  | `pages/employee-profile/WorkTabSections.tsx` | implement |
| GET    | /hr/employees/:employeeId/documents/:docId                     | 182  | `pages/employee-profile/WorkTabSections.tsx` | implement |
| DELETE | /hr/employees/:employeeId/documents/:docId                     | 192  | `pages/employee-profile/WorkTabSections.tsx` | implement |

`document-workflow.controller.ts` (mounted at `/hr-v2/documents`):

| Verb | Route                                            | Line | Consumed by                              | Action |
| ---- | ------------------------------------------------ | ---: | ---------------------------------------- | ------ |
| GET  | /hr-v2/documents/employee                        | 131  | `pages/employee-profile/DocumentsTab.tsx` | implement |
| GET  | /hr-v2/documents/pending                         | 139  | `pages/DocumentWorkflowPage.tsx`         | implement |
| GET  | /hr-v2/documents/admin/workflow-routes           | 147  | `components/dizayn-new/AppSidebar.tsx`   | implement |

`enps.controller.ts` (mounted at `/hr-v2/enps`):

| Verb | Route             | Line | Consumed by                              | Action |
| ---- | ----------------- | ---: | ---------------------------------------- | ------ |
| GET  | /hr-v2/enps/results | 115 | `pages/HRDashboardV2Tab.tsx`             | implement |

### Integration (`/integration`)

File: `apps/api/src/modules/integration/integration-employee.controller.ts`

| Verb | Route                                    | Line | Consumed by                              | Action |
| ---- | ---------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /integration/employee-complaints         | 124  | `pages/EmployeeProfile.tsx`              | implement |
| GET  | /integration/employee-assessment-skips   | 132  | `pages/EmployeeProfile.tsx`              | implement |
| GET  | /integration/skill-gap                   | 140  | `pages/EmployeeProfile.tsx`              | implement |
| GET  | /integration/employee-mentorships        | 148  | `pages/EmployeeProfile.tsx`              | implement |
| GET  | /integration/employee-mes-summary        | 156  | `pages/employee-profile/MachineOperatorTab.tsx` | implement |
| GET  | /integration/employee-wms-summary        | 164  | `pages/EmployeeProfile.tsx`              | implement |
| GET  | /integration/expense                     | 172  | `pages/ExpenseManagement.tsx`            | implement |
| POST | /integration/expense                     | 181  | `pages/ExpenseManagement.tsx`            | implement |
| GET  | /integration/invoice                     | 190  | `pages/InvoiceVerification.tsx`          | implement |
| POST | /integration/invoice                     | 199  | `pages/InvoiceVerification.tsx`          | implement |

### IoT (`/iot`, `/iot-sensors`)

Files:
- `apps/api/src/modules/iot/presentation/iot-main.controller.ts`
- `apps/api/src/modules/iot/presentation/iot-alerts.controller.ts`
- `apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts`
- `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`

`iot-main.controller.ts`:

| Verb  | Route                              | Line | Consumed by                              | Action |
| ----- | ---------------------------------- | ---: | ---------------------------------------- | ------ |
| GET   | /iot/downtime-reason-codes         | 276  | `pages/MESDowntimes.tsx`                 | implement |
| PATCH | /iot/devices/:id                   | 286  | `pages/IotSensorsPage.tsx`               | implement |

`iot-alerts.controller.ts`:

| Verb | Route       | Line | Consumed by                              | Action |
| ---- | ----------- | ---: | ---------------------------------------- | ------ |
| POST | /iot/alerts | 74   | `pages/iot/useIoTTabletAlerts.ts`        | implement |

`iot-sensors-main.controller.ts` (controller prefix `/iot-sensors`):

| Verb  | Route                                       | Line | Consumed by                              | Action |
| ----- | ------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET   | /iot-sensors/predictive-maintenance         | 128  | `pages/IotMaintenanceMonitorTab.tsx`     | implement |
| PATCH | /iot-sensors/alerts/:alertId/resolve        | 138  | `pages/IotSensorsPage.tsx`               | implement |

`iot-tablet.controller.ts` (controller prefix `/iot`) — all 19 are tablet PWA stubs:

| Verb  | Route                                                | Line | Consumed by                              | Action |
| ----- | ---------------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET   | /iot/tablet/orders                                   | 59   | `pages/iot/useIoTTablet.ts`              | implement (P0 — tablet PWA) |
| GET   | /iot/tablet/worker-schedule                          | 64   | `pages/iot/useIoTTablet.ts`              | implement (P0) |
| GET   | /iot/tablet/equipment                                | 69   | `pages/iot/useIoTTablet.ts`              | implement (P0) |
| GET   | /iot/tablet/shift                                    | 74   | `pages/iot/useIoTTablet.ts`              | implement |
| GET   | /iot/tablet/sessions                                 | 79   | `pages/iot/useIoTTabletData.ts`          | implement |
| POST  | /iot/tablet/sessions                                 | 85   | `pages/iot/useIoTTabletData.ts`          | implement |
| POST  | /iot/tablet/login                                    | 94   | `pages/iot/useIoTTabletAuth.ts`          | implement (P0) |
| POST  | /iot/tablet/sos-alert                                | 103  | `pages/iot/useIoTTabletAlerts.ts`        | implement (P0 — safety critical) |
| POST  | /iot/tablet/handover                                 | 112  | `pages/iot/useIoTTablet.ts`              | implement |
| POST  | /iot/material-kit-items/:id/scan                     | 124  | `pages/WarehouseMaterialKits.tsx`        | implement |
| PATCH | /iot/material-kit-items/:id/scan                     | 135  | `pages/WarehouseMaterialKits.tsx`        | implement |
| POST  | /iot/production-sessions                             | 149  | `pages/iot/IoTCompletionReportSections.tsx` | implement (P0) |
| GET   | /iot/production-sessions/:id/crew                    | 159  | `pages/iot/IoTCompletionReport.tsx`      | implement |
| POST  | /iot/production-sessions/:id/start                   | 167  | `pages/iot/IoTCompletionReport.tsx`      | implement (P0) |
| POST  | /iot/production-sessions/:id/stop                    | 177  | `pages/iot/IoTCompletionReport.tsx`      | implement (P0) |
| POST  | /iot/production-sessions/:id/defect                  | 187  | `pages/iot/IoTCompletionReport.tsx`      | implement |
| POST  | /iot/production-sessions/:id/evaluation              | 197  | `pages/iot/IoTCompletionReport.tsx`      | implement |
| POST  | /iot/production-sessions/:id/material-return         | 207  | `pages/iot/IoTCompletionReport.tsx`      | implement |
| POST  | /iot/production-sessions/:id/inline-qc               | 217  | `pages/iot/IoTCompletionReport.tsx`      | implement |

### IoT-enhanced (`/iot-enhanced`)

File: `apps/api/src/modules/wms/presentation/iot-enhanced.controller.ts`

| Verb | Route                | Line | Consumed by                              | Action |
| ---- | -------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /iot-enhanced/orders | 128  | `routes/StubRoutes.tsx` (route is also a frontend stub) | feature-flagged-OK |

### Kanban (`/kanban`)

Files:
- `apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts`
- `apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts`

| Verb | Route                                  | Line | Consumed by                              | Action |
| ---- | -------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /kanban/chat-messages/:id/files        | 188  | `pages/kanban/useTaskDetailMutations.ts` | implement |
| POST | /kanban/chat-messages/:id/files        | 195  | `pages/kanban/useTaskDetailMutations.ts` | implement |
| GET  | /kanban/projects                       | 234  | `pages/StrategicTasksPanel.tsx`          | implement |

### LMS (`/modules`, `/video-progress`, `/progress`)

Files:
- `apps/api/src/modules/lms/presentation/lms-lessons.controller.ts` (the `LmsModulesController` inside)
- `apps/api/src/modules/lms/presentation/lms-misc.controller.ts` (the `LmsVideoProgressController` / `LmsProgressCompatController`)

| Verb | Route               | Line | Consumed by                              | Action |
| ---- | ------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /modules            | 136  | `pages/LMSDashboard.tsx`                 | implement |
| GET  | /video-progress     | 115  | `pages/LessonPlayer.tsx`                 | implement |
| GET  | /progress           | 181  | `pages/ProgressPage.tsx`                 | implement |
| GET  | /progress/user/:id  | 191  | `pages/EmployeeStats.tsx`                | implement |

### Marketing (`/marketing`)

File: `apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts`

| Verb   | Route                                                 | Line | Consumed by                              | Action |
| ------ | ----------------------------------------------------- | ---: | ---------------------------------------- | ------ |
| POST   | /marketing/content/ai-generate                        | 45   | `pages/MarketingContent.tsx`             | implement |
| GET    | /marketing/nps/stats                                  | 49   | `pages/MarketingDashboard.tsx`           | implement |
| GET    | /marketing/nps/monthly                                | 50   | `pages/MarketingDashboard.tsx`           | implement |
| GET    | /marketing/nps                                        | 51   | `pages/MarketingDashboard.tsx`           | implement |
| GET    | /marketing/churn-risk/ai-signal                       | 53   | `pages/MarketingDashboardPanels.tsx`     | implement |
| GET    | /marketing/churn-risk                                 | 54   | `pages/MarketingDashboard.tsx`           | implement |
| POST   | /marketing/churn-risk/ai-signal                       | 55   | `pages/MarketingDashboardPanels.tsx`     | implement |
| GET    | /marketing/ai/hot-leads                               | 59   | `pages/MarketingLeads.tsx`               | implement |
| GET    | /marketing/ai-assistant                               | 60   | `pages/MarketingExtended.tsx`            | implement |
| GET    | /marketing/leads/sources/summary                      | 62   | `pages/MarketingLeads.tsx`               | implement |
| GET    | /marketing/leads/automation/overdue-leads             | 63   | `pages/MarketingLeads.tsx`               | implement |
| GET    | /marketing/leads/:id/contacts                         | 65   | `pages/MarketingLeads.tsx`               | implement |
| POST   | /marketing/leads/:id/convert-to-crm                   | 68   | `pages/MarketingLeads.tsx`               | implement |
| POST   | /marketing/leads/:id/contacts                         | 71   | `pages/MarketingLeads.tsx`               | implement |
| DELETE | /marketing/leads/:id                                  | 75   | `pages/MarketingLeads.tsx`               | implement |
| GET    | /marketing/inbox/stats                                | 79   | `pages/MarketingSocialInbox.tsx`         | implement |
| GET    | /marketing/inbox/conversations                        | 82   | `pages/MarketingSocialInbox.tsx`         | implement |
| GET    | /marketing/inbox/conversations/:id/messages           | 85   | `pages/MarketingSocialInbox.tsx`         | implement |
| POST   | /marketing/inbox/conversations/:id/reply              | 88   | `pages/MarketingSocialInbox.tsx`         | implement |
| POST   | /marketing/inbox/ai-reply/:id                         | 91   | `pages/MarketingSocialInbox.tsx`         | implement |
| PATCH  | /marketing/inbox/conversations/:id/status             | 94   | `pages/MarketingSocialInbox.tsx`         | implement |
| GET    | /marketing/ab-tests                                   | 98   | `pages/MarketingExtended.tsx`            | implement |
| GET    | /marketing/competitors                                | 99   | `pages/MarketingExtended.tsx`            | implement |
| GET    | /marketing/budget                                     | 102  | `pages/MarketingBudget.tsx`              | implement |
| GET    | /marketing/budget/:id                                 | 103  | `pages/MarketingBudget.tsx`              | implement |
| POST   | /marketing/budget                                     | 104  | `pages/MarketingBudget.tsx`              | implement |
| GET    | /marketing/calendar                                   | 108  | `pages/MarketingCalendar.tsx`            | implement |
| GET    | /marketing/calendar/:id                               | 110  | `pages/MarketingCalendar.tsx`            | implement |
| POST   | /marketing/calendar                                   | 111  | `pages/MarketingCalendar.tsx`            | implement |
| GET    | /marketing/exhibitions                                | 115  | `pages/MarketingExhibitions.tsx`         | implement |
| GET    | /marketing/exhibitions/:id                            | 116  | `pages/MarketingExhibitions.tsx`         | implement |
| GET    | /marketing/exhibitions/:id/leads                      | 117  | `pages/MarketingExhibitions.tsx`         | implement |
| GET    | /marketing/exhibitions/:id/qr                         | 118  | `pages/MarketingExhibitions.tsx`         | implement |
| POST   | /marketing/exhibitions                                | 119  | `pages/MarketingExhibitions.tsx`         | implement |
| POST   | /marketing/exhibitions/:id/leads                      | 121  | `pages/MarketingExhibitions.tsx`         | implement |
| POST   | /marketing/exhibitions/:id/qr                         | 123  | `pages/MarketingExhibitions.tsx`         | implement |
| GET    | /marketing/pr                                         | 127  | `pages/MarketingPR.tsx`                  | implement |
| GET    | /marketing/pr/:id                                     | 128  | `pages/MarketingPR.tsx`                  | implement |
| POST   | /marketing/pr                                         | 129  | `pages/MarketingPR.tsx`                  | implement |
| GET    | /marketing/settings                                   | 133  | `pages/MarketingSettings.tsx`            | implement |
| GET    | /marketing/settings/social-api                        | 134  | `pages/MarketingSettings.tsx`            | implement |
| POST   | /marketing/settings                                   | 135  | `pages/MarketingSettings.tsx`            | implement |
| POST   | /marketing/settings/social-api                        | 137  | `pages/MarketingSettingsSections.tsx`    | implement |
| DELETE | /marketing/settings/social-api/:id                    | 139  | `pages/MarketingSettingsSections.tsx`    | implement |
| PATCH  | /marketing/settings/social-api/:id                    | 141  | `pages/MarketingSettingsSections.tsx`    | implement |
| POST   | /marketing/settings/setup-telegram-webhook            | 143  | `pages/MarketingSettings.tsx`            | implement |
| GET    | /marketing/website/blog                               | 147  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| GET    | /marketing/website/blog/:id                           | 148  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| PATCH  | /marketing/website/blog/:id                           | 149  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| POST   | /marketing/website/blog/:id/publish                   | 150  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| PATCH  | /marketing/website/blog/:id/publish                   | 151  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| POST   | /marketing/website/blog/ai-generate                   | 152  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| POST   | /marketing/website/blog                               | 154  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| DELETE | /marketing/website/blog/:id                           | 156  | `pages/MarketingWebsiteCMS.tsx`          | implement |
| GET    | /marketing                                            | 160  | `pages/MarketingDashboard.tsx`           | implement |
| POST   | /marketing/leads/recalculate-scores                   | 165  | `pages/MarketingLeads.tsx`               | implement |
| PATCH  | /marketing/settings/:id                               | 171  | `pages/MarketingSettings.tsx`            | implement |

### Materials Management (`/mm`)

Files:
- `apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts`
- `apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts`

`mm-dashboard.controller.ts`:

| Verb   | Route                                          | Line | Consumed by                              | Action |
| ------ | ---------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET    | /mm/vendor-invoices                            | 149  | `pages/InvoiceVerification.tsx`          | implement |
| GET    | /mm/vendor-invoices/:id                        | 157  | `pages/InvoiceVerification.tsx`          | implement |
| PATCH  | /mm/vendor-invoices/:id/approve                | 166  | `pages/InvoiceVerification.tsx`          | implement |
| PATCH  | /mm/vendor-invoices/:id/match                  | 175  | `pages/InvoiceVerification.tsx`          | implement |
| POST   | /mm/vendor-invoices/:id/payment                | 184  | `pages/InvoiceVerification.tsx`          | implement |
| POST   | /mm/vendor-invoices/:id/match                  | 270  | `pages/InvoiceVerification.tsx`          | implement (dup of PATCH) |
| GET    | /mm/three-way-match                            | 191  | `pages/InvoiceVerification.tsx`          | implement |
| GET    | /mm/3way-match/:invoiceId                      | 199  | `pages/InvoiceVerification.tsx`          | implement |
| POST   | /mm/3way-match/:invoiceId                      | 253  | `pages/InvoiceVerification.tsx`          | implement |
| GET    | /mm/fleet/maintenance                          | 206  | `pages/LogisticsDashboard.tsx`           | implement |
| GET    | /mm/fleet/deliveries                           | 213  | `pages/LogisticsDashboard.tsx`           | implement |
| PATCH  | /mm/fleet/deliveries/:id/status                | 222  | `pages/LogisticsDashboard.tsx`           | implement |
| POST   | /mm/fleet/deliveries                           | 261  | `pages/LogisticsDashboard.tsx`           | implement |
| GET    | /mm/vehicles/locations                         | 229  | `pages/LogisticsDashboard.tsx`           | implement |
| GET    | /mm/driver/expenses                            | 236  | `pages/LogisticsDashboard.tsx`           | implement |
| GET    | /mm/materials/:id/suppliers                    | 244  | `pages/MMExtended.tsx`                   | implement |

`mm-purchase-orders.controller.ts`:

| Verb   | Route                              | Line | Consumed by                              | Action |
| ------ | ---------------------------------- | ---: | ---------------------------------------- | ------ |
| GET    | /mm/purchase-orders/:id            | 96   | `hooks/use-mm.ts`                        | implement (P1) |
| DELETE | /mm/purchase-orders/:id            | 163  | `pages/MMDashboard.tsx`                  | implement |
| PATCH  | /mm/purchase-orders/:id            | 174  | `pages/MMDashboard.tsx`                  | implement |

### Org Structure (`/org-structure`)

File: `apps/api/src/modules/org-structure/org-structure.controller.ts`

| Verb | Route                                          | Line | Consumed by                              | Action |
| ---- | ---------------------------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /org-structure/nodes/:nodeId/history           | 227  | `components/hr/orgnode/HistoryTab.tsx`   | implement |
| GET  | /org-structure/nodes/:nodeId/hr-requests       | 236  | `components/hr/portret/HRRequestDialog.tsx` | implement |
| POST | /org-structure/nodes/:nodeId/hr-requests       | 246  | `components/hr/portret/HRRequestDialog.tsx` | implement |

### POS (`/pos`, `/pos/stock`)

Files:
- `apps/api/src/modules/pos/presentation/pos-stub.controller.ts`
- `apps/api/src/modules/pos/presentation/stock.controller.ts`

| Verb | Route                              | Line | Consumed by                              | Action |
| ---- | ---------------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /pos/sales/daily                   | 118  | `pages/POSDashboard.tsx`                 | implement |
| GET  | /pos/inventory/low-stock           | 122  | `pages/POSInventoryPage.tsx`             | implement |
| GET  | /pos/inventory/movements           | 126  | `pages/PosMovementsPage.tsx`             | implement |
| GET  | /pos/inventory/monthly-report      | 130  | `pages/POSInventoryPage.tsx`             | implement |
| GET  | /pos/stock/movements               | 94   | `pages/PosMovementsPage.tsx`             | implement |

### Production (`/production`, `/technology`)

Files:
- `apps/api/src/modules/pp/production/production-reports.controller.ts`
- `apps/api/src/modules/pp/technology/technology.controller.ts`

| Verb | Route                                | Line | Consumed by                              | Action |
| ---- | ------------------------------------ | ---: | ---------------------------------------- | ------ |
| GET  | /production/orders                   | 78   | `pages/ProductionReport.tsx`             | implement |
| GET  | /technology/cards                    | 105  | `pages/TechCards.tsx`                    | implement |
| POST | /technology/cards/generate           | 115  | `pages/TechCards.tsx`                    | implement |
| GET  | /technology/cards/:id                | 125  | `pages/TechCards.tsx`                    | implement |
| POST | /technology/cards/:id/optimize       | 135  | `pages/TechCards.tsx`                    | implement |

### QC (`/qc`)

Files:
- `apps/api/src/modules/qc/presentation/qc-defects.controller.ts`
- `apps/api/src/modules/qc/presentation/qc-new.controller.ts`

| Verb | Route                       | Line | Consumed by                              | Action |
| ---- | --------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /qc/braks/cost-impact       | 135  | `pages/qc/QCBraksTab.tsx`                | implement |
| GET  | /qc/pending/qc              | 143  | `pages/QCApproval.tsx`                   | implement |
| GET  | /qc/control-charts          | 116  | `pages/QCDashboard.tsx`                  | implement |

### Remaining / System (`/system`, `/material-balance`)

Files:
- `apps/api/src/modules/remaining/system.controller.ts`
- `apps/api/src/modules/remaining/material-balance.controller.ts`

| Verb | Route                       | Line | Consumed by                              | Action |
| ---- | --------------------------- | ---: | ---------------------------------------- | ------ |
| POST | /system                     | 34   | (none — only `/system/health`, `/system/cron-jobs` consumed) | orphan / can-delete |
| GET  | /material-balance/movements | 121  | `pages/MaterialBalance.tsx`              | implement |

### SD (`/sd/customers`)

File: `apps/api/src/modules/sd/presentation/sd-customers.controller.ts`

| Verb | Route                              | Line | Consumed by                              | Action |
| ---- | ---------------------------------- | ---: | ---------------------------------------- | ------ |
| POST | /sd/customers/:id/complaints       | 399  | (none — read-only consumed)              | orphan |

### Security (`/security`)

File: `apps/api/src/modules/security/presentation/security.controller.ts`

| Verb | Route                       | Line | Consumed by                              | Action |
| ---- | --------------------------- | ---: | ---------------------------------------- | ------ |
| GET  | /security/daily-summary     | 187  | `pages/SecurityDashboard.tsx`            | implement |
| GET  | /security/fire-sensors      | 198  | `pages/SecurityExtended.tsx`             | implement |
| GET  | /security/ppe-checks        | 209  | `pages/SecurityExtendedSectionsA.tsx`    | implement |
| GET  | /security/ppe-stats         | 220  | `pages/SecurityExtendedSectionsA.tsx`    | implement |
| GET  | /security/ppe-violations    | 231  | `pages/SecurityExtended.tsx`             | implement |

### WMS / Warehouse (`/warehouse`, `/wms/rental`)

Files:
- `apps/api/src/modules/wms/presentation/wms-rental.controller.ts`
- `apps/api/src/modules/wms/presentation/wms-catalog.controller.ts`
- `apps/api/src/modules/wms/presentation/wms-barcode.controller.ts`
- `apps/api/src/modules/wms/presentation/wms-integration.controller.ts`

| Verb   | Route                                            | Line | Consumed by                              | Action |
| ------ | ------------------------------------------------ | ---: | ---------------------------------------- | ------ |
| GET    | /wms/rental/:warehouseId                         | 48   | (none — read uses `/wms` directly)       | orphan |
| GET    | /warehouse/transactions                          | 147  | (none — `/wms/movements` used instead)   | orphan |
| GET    | /warehouse/orders-by-date/:date                  | 156  | `pages/WarehouseDailyView.tsx`           | implement |
| GET    | /warehouse/printer-config                        | 66   | `pages/barcode/PrinterSettingsTab.tsx`   | implement |
| POST   | /warehouse/printer-config                        | 76   | `pages/barcode/PrinterSettingsTab.tsx`   | implement |
| PATCH  | /warehouse/printer-config/:id                    | 87   | `pages/barcode/PrinterSettingsTab.tsx`   | implement |
| DELETE | /warehouse/printer-config/:id                    | 102  | `pages/barcode/PrinterSettingsTab.tsx`   | implement |
| GET    | /warehouse/material-kits                         | 113  | `pages/WarehouseMaterialKits.tsx`        | implement |
| POST   | /warehouse/material-kits                         | 123  | `pages/WarehouseMaterialKits.tsx`        | implement |
| PATCH  | /warehouse/material-kits/:id/status              | 134  | `pages/WarehouseMaterialKitsDialogs.tsx` | implement |
| GET    | /warehouse/material-kits/:id/items               | 148  | `pages/WarehouseMaterialKits.tsx`        | implement |
| GET    | /warehouse/integration/mm/pending-deliveries     | 85   | `pages/WarehouseIntegrations.tsx`        | implement |
| GET    | /warehouse/integration/mm/reorder-suggestions    | 96   | `pages/WarehouseIntegrations.tsx`        | implement |
| GET    | /warehouse/integration/fi/stock-valuation        | 109  | `pages/WarehouseIntegrations.tsx`        | implement |
| GET    | /warehouse/integration/summary                   | 122  | `pages/WarehouseIntegrations.tsx`        | implement |
| GET    | /warehouse/integration                           | 133  | `pages/WarehouseIntegrations.tsx`        | implement |
| POST   | /warehouse/integration                           | 145  | `pages/WarehouseIntegrations.tsx`        | implement |

---

## Frontend StubPage routes

Source: `artifacts/erp-dashboard/src/routes/StubRoutes.tsx` (69 entries).
Mounted via `STUB_ROUTES` spread into `AppRouter.tsx` line 52 + 122.

| Route                              | Suggested action |
| ---------------------------------- | ---------------- |
| /360                               | real-page-needed (HR 360 reviews) |
| /3way-match                        | feature-flagged-OK (mirrors `/mm/3way-match`) |
| /achievements                      | real-page-needed (LMS achievements) |
| /ai                                | real-page-needed (AI hub landing) |
| /ai/automation                     | real-page-needed |
| /ai-camera                         | real-page-needed (camera AI dashboard) |
| /ai-crm, /ai/crm                   | real-page-needed (consolidate to one path) |
| /ai-exam                           | real-page-needed (HRC AI exam) |
| /ai/finance                        | real-page-needed |
| /ai/hr                             | real-page-needed |
| /ai/marketing                      | real-page-needed |
| /ai-planning                       | real-page-needed |
| /ai/wms                            | real-page-needed |
| /application-responses             | real-page-needed (recruitment) |
| /approval-workflow                 | real-page-needed |
| /assignments                       | real-page-needed |
| /attempts                          | real-page-needed (test attempts) |
| /auth                              | can-delete (auth lives at `/login`) |
| /calendar-events                   | real-page-needed |
| /candidates                        | real-page-needed (recruitment) |
| /company-state                     | real-page-needed |
| /daily-attendance                  | real-page-needed |
| /discipline-records                | real-page-needed |
| /employee-files                    | real-page-needed |
| /employee-productivity             | real-page-needed |
| /employee-zone-history             | real-page-needed |
| /equipment                         | real-page-needed |
| /europrint-control                 | real-page-needed (auditor panel) |
| /export                            | feature-flagged-OK |
| /gl                                | real-page-needed |
| /gpt                               | feature-flagged-OK |
| /hr/zno, /hr/zvs                   | real-page-needed (legacy HR rules) |
| /insights                          | real-page-needed |
| /integration/requests              | real-page-needed |
| /inventory/advanced                | real-page-needed |
| /iot-enhanced                      | real-page-needed |
| /iot-sensors                       | real-page-needed |
| /machine-status-current            | real-page-needed |
| /machine-status-logs               | real-page-needed |
| /material-cards                    | real-page-needed |
| /mentors                           | real-page-needed |
| /mentorships                       | real-page-needed |
| /micro-modules                     | real-page-needed (LMS) |
| /modules                           | real-page-needed (LMS) |
| /okr                               | real-page-needed |
| /order-status                      | real-page-needed |
| /org-departments                   | real-page-needed |
| /pos/barcode                       | real-page-needed |
| /pos/inventory-counts              | real-page-needed |
| /pos/mini-app                      | feature-flagged-OK |
| /pos/movements                     | real-page-needed |
| /pos/printer-config                | real-page-needed |
| /pos/requests                      | real-page-needed |
| /production-facts                  | real-page-needed |
| /production/shift-reports          | real-page-needed |
| /quality-defects-camera            | real-page-needed |
| /questionnaire-questions           | real-page-needed |
| /questions                         | real-page-needed |
| /raci-crisis                       | feature-flagged-OK |
| /raw-materials                     | real-page-needed |
| /safety-violations                 | real-page-needed |
| /sap                               | feature-flagged-OK |
| /users                             | real-page-needed (admin) |
| /v2/pos/printer-config             | can-delete (dup of `/pos/printer-config`) |
| /video-progress                    | real-page-needed (LMS) |
| /waste                             | real-page-needed |
| /weekly-plans                      | real-page-needed |

---

## Implementation priority — top 10

Ranked by user impact (blocking a real workflow) and number of consuming pages.

| # | Endpoint                                              | Why first |
| - | ----------------------------------------------------- | --------- |
| 1 | `POST /iot/tablet/sos-alert`                          | Safety-critical: tablet PWA SOS button currently 501s. |
| 2 | `POST /iot/tablet/login` + `GET /iot/tablet/equipment` + `GET /iot/tablet/orders` + `GET /iot/tablet/worker-schedule` | The IoT tablet PWA can't render anything until these 4 land. |
| 3 | `POST /iot/production-sessions` + `/start` + `/stop`  | Shift completion report can't write a session. |
| 4 | `POST /finance-extended/payroll/calculate` + `GET /finance-extended/payroll-calculations` + `PATCH .../approve` | Payroll run blocked; INPS/JSHD pipeline already exists in `PayrollService`, just needs wiring. |
| 5 | `GET /mm/vendor-invoices` + `GET /mm/3way-match` + 7 vendor-invoice writes | `InvoiceVerification.tsx` is entirely dead without these. |
| 6 | `GET /hr/onboarding-checklists` + `POST` + `PATCH /:id` | Onboarding flow blocked. |
| 7 | `GET /hr/adaptation/:id` + `PATCH /hr/adaptation/:id` | Adaptation tab on every employee profile is 501. |
| 8 | `GET /hr-v2/documents/pending` + `GET /hr-v2/documents/admin/workflow-routes` | Document workflow page blocked. |
| 9 | `GET /mm/fleet/deliveries` + `GET /mm/fleet/maintenance` + `GET /mm/vehicles/locations` | `LogisticsDashboard.tsx` is empty without these. |
| 10 | `GET /qc/pending/qc` + `GET /qc/braks/cost-impact` + `GET /qc/control-charts` | QC approval page and SPC charts both blocked. |

---

## Feature flags to add

For stubs that should stay 501 until a real implementation is funded, gate the
frontend consumer behind one of these flags so a "Coming soon" empty state is
rendered instead of an error toast. Add to
`artifacts/erp-dashboard/src/lib/feature-flags.ts` (or equivalent).

| Flag                                       | Gates |
| ------------------------------------------ | ----- |
| `FEATURE_FLAGS.aiRushOrders`               | `/ai/rush-orders*`, `/ai/forecast/demand` |
| `FEATURE_FLAGS.aiAgentTrigger`             | `POST /ai-agents/:id/trigger` |
| `FEATURE_FLAGS.designPredictiveTooling`    | `GET /design/tooling/:id/wear-forecast`, `/design/notifications`, `/design/statistics` |
| `FEATURE_FLAGS.financeLoans`               | `/finance/loans*` |
| `FEATURE_FLAGS.salaryBenchmark`            | `/finance-extended/salary-benchmark/:id` |
| `FEATURE_FLAGS.hrCapital`                  | `/hr-capital/courses`, `/hr-capital/stats` |
| `FEATURE_FLAGS.hrcTests`                   | All `/hr/hrc-tests/*` stubs |
| `FEATURE_FLAGS.aiInterview`                | `/hr/ai-interview/*` |
| `FEATURE_FLAGS.alumni`                     | `/hr/alumni/*` |
| `FEATURE_FLAGS.peerReview360`              | `/hr/360/reviewable` |
| `FEATURE_FLAGS.iotSensorsPredictive`       | `/iot-sensors/predictive-maintenance` |
| `FEATURE_FLAGS.iotDowntimeReasonCodes`     | `/iot/downtime-reason-codes` |
| `FEATURE_FLAGS.kanbanProjects`             | `/kanban/projects` |
| `FEATURE_FLAGS.marketingAi`                | `/marketing/ai-assistant`, `/marketing/ai/hot-leads`, `/marketing/content/ai-generate`, `/marketing/website/blog/ai-generate`, `/marketing/inbox/ai-reply/:id` |
| `FEATURE_FLAGS.marketingChurnAi`           | `/marketing/churn-risk/ai-signal` |
| `FEATURE_FLAGS.marketingInbox`             | All `/marketing/inbox/*` |
| `FEATURE_FLAGS.saasOnboarding`             | `/saas/tenants/:id/modules`, `/saas/tenants/:id/onboard` |
| `FEATURE_FLAGS.warehouseIntegration`       | All `/warehouse/integration/*` |

---

*Generated: 2026-05-17 — Wave 11 (Uzbek-Language-Module). Inventory only; no
endpoints were implemented in this change.*
