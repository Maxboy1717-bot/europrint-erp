# 133 Orphan-Route Sahifa — Toifalanga Ro'yxat
Generated: 2026-05-21T12:06:34.162Z

## Toifa belgilash
- **D** — Detail page (parent'dan click bilan kirish, legitimate)
- **S** — Stub/Admin (sidebar'da yo'q, lekin admin uchun foydali)
- **K** — Alternative entry (legitimate ikkinchi yo'l)
- **?** — Review (endpoint'lar bor, qo'lda baholash kerak)
- **X** — Real orphan (hech narsa yo'q, o'chirish nomzodi)

## Statistika
- **D — saqlanadi:** 11 (detail page'lar)
- **S — saqlanadi:** 6 (stub/admin)
- **K — saqlanadi:** 0 (alternative entry)
- **? — REVIEW:** 109 (qo'lda qaror kerak)
- **X — O'CHIRILADI:** 7 (real orphan)

## X — O'CHIRILADI (real orphan)

| Sahifa | Route | Endpoints | Hajm | Sabab |
|---|---|---|---:|---|
| `PosMovementsPage` | `/pos/movements` | — | 217 | no endpoints |
| `SDEuroprint` | `/sd/crm` | — | 66 | no endpoints |
| `WarehouseAuditLog` | `/wms/audit-log` | — | 250 | no endpoints |
| `WarehouseBarcodeQueue` | `/wms/barcodes-queue` | — | 215 | no endpoints |
| `WarehouseInventoryPassport` | `/wms/passports` | — | 211 | no endpoints |
| `WarehouseKpiHub` | `/wms/kpi-hub` | — | 217 | no endpoints |
| `WarehouseReportsAll` | `/wms/reports`, `/wms/reports-all` | — | 88 | no endpoints |

## ? — REVIEW (qo'lda qaror)

| Sahifa | Route | Endpoints | Hajm | Sabab |
|---|---|---|---:|---|
| `AchievementsPage` | `/achievements` | `/api/achievements` | 181 | has endpoints |
| `AIAgentsPage` | `/ai/agents` | `/api/ai-agents/list`, `/api/ai-agents/${agentId}/trigger` | 134 | has endpoints |
| `AiAutomationPage` | `/ai/automation` | `/api/ai/automation/status`, `/api/ai/automation/run-all-pending` | 219 | has endpoints |
| `ApplicationResponsesPage` | `/application-responses` | `/api/application-responses` | 175 | has endpoints |
| `ApprovalHub` | `/approvals` | `/api/approval-workflow/dashboard`, `/api/approval-workflow/${type}/${id}/approve` (+1) | 305 | has endpoints |
| `ApprovalWorkflowPage` | `/approval-workflow` | `/api/approval-workflow/history`, `/api/approval-workflow/pending` (+4) | 180 | has endpoints |
| `AttemptsPage` | `/attempts` | `/api/attempts/all` | 163 | has endpoints |
| `AttendanceMonitorPage` | `/attendance-monitor`, `/daily-attendance` | `/api/hr/attendance/live`, `/api/hr/attendance/territory/logs` | 146 | has endpoints |
| `BarcodeScanner` | `/wms/scanner` | `/api/wms/barcode/scan` | 266 | has endpoints |
| `BarcodeSystem` | `/warehouse/barcodes` | `/api/warehouse/batches`, `/api/warehouse/materials` (+6) | 237 | has endpoints |
| `CalendarEventsPage` | `/calendar-events` | `/api/calendar-events` | 296 | has endpoints |
| `CameraAIAnalytics` | `/europrint/camera-ai-analytics`, `/ai-camera` | `/api/camera-ai/summary`, `/api/camera-ai/safety-trends` (+4) | 280 | has endpoints |
| `CandidatesPage` | `/candidates` | `/api/candidates`, `/api/candidates/${id}` | 283 | has endpoints |
| `CfoConfigSettings` | `/cfo/config` | `/api/finance/cfo-config`, `/api/finance/cfo-config/${key}` | 169 | has endpoints |
| `CFODashboard` | `/cfo/dashboard` | `/api/cfo/dashboard`, `/api/cfo/cash-position` (+5) | 245 | has endpoints |
| `CompanyStatePage` | `/company-state` | `/api/company-state/current` | 222 | has endpoints |
| `CoordinationPage` | `/coordination` | `/api/coordination/dokla`, `/api/coordination/rasporyazhenie` (+5) | 298 | has endpoints |
| `CRMActivities` | `/crm/activities` | `/api/crm/activities`, `/api/crm/deals` (+2) | 197 | has endpoints |
| `CrmCohortAnalysis` | `/crm/cohort` | `/api/crm/cohort` | 201 | has endpoints |
| `CrmFunnelAnalytics` | `/crm/funnel` | `/api/crm/funnel`, `/api/crm/deals/close` (+1) | 384 | has endpoints |
| `CrmRfmClusters` | `/crm/rfm` | `/api/crm/rfm/cluster` | 167 | has endpoints |
| `CRMSettings` | `/crm/settings` | `/api/crm/custom-fields`, `/api/crm/custom-fields/${entityType}` (+2) | 283 | has endpoints |
| `CrpPage` | `/pp/crp` | `/api/pp/crp` | 263 | has endpoints |
| `DirectorAiAudit` | `/director/ai-audit` | `/api/ai-agents/audit/stats`, `/api/ai-agents/audit/hard-block-stats` (+1) | 117 | has endpoints |
| `EmployeeFilesPage` | `/employee-files` | `/api/employee-files`, `/api/employee-files/${id}` | 280 | has endpoints |
| `EmployeeInventory` | `/wms/employee-inventory` | `/api/auth/me`, `/api/pos/employees/me/inventory` | 144 | has endpoints |
| `EmployeeProductivityPage` | `/employee-productivity` | `/api/employee-productivity` | 144 | has endpoints |
| `EmployeesForFacePage` | `/hr/face-employees` | `/api/hr/employees/list/for-face`, `/api/hr/employees/list/for-face${search ` | 146 | has endpoints |
| `EmployeeZoneHistoryPage` | `/employee-zone-history` | `/api/employee-zone-history` | 184 | has endpoints |
| `EquipmentPage` | `/equipment` | `/api/mro/equipment`, `/api/mro/equipment/${id}/status` | 251 | has endpoints |
| `ERPDailyReports` | `/erp-daily-reports` | `/api/erp/daily-reports`, `/api/users` (+3) | 159 | has endpoints |
| `ERPProduction` | `/erp-production` | `/api/erp/work-centers` | 103 | has endpoints |
| `EuroprintControlPage` | `/europrint-control` | `/api/europrint-control/auditor-dashboard`, `/api/europrint-control/module-health` (+2) | 291 | has endpoints |
| `FinanceBreakEven` | `/finance/break-even` | `/api/finance/break-even/cost-structure`, `/api/finance/break-even` | 302 | has endpoints |
| `FinanceVariance` | `/finance/variance` | `/api/finance/variance/${searchId}` | 266 | has endpoints |
| `ForecastAnalytics` | `/ai/forecast` | `/api/forecasts/run`, `/api/forecasts` (+4) | 347 | has endpoints |
| `GLChartOfAccounts` | `/finance/gl-chart-of-accounts` | `/api/finance/gl-accounts` | 231 | has endpoints |
| `GLPostingMonitor` | `/integration/gl-posting` | `/api/integration/gl/stock-gl-postings/stats`, `/api/integration/gl/stock-gl-postings` (+1) | 237 | has endpoints |
| `HRAssetManagement` | `/hr/assets` | `/api/assets`, `/api/employees` (+3) | 254 | has endpoints |
| `HRZnoPage` | `/hr/zno` | `/api/hr/zno`, `/api/hr/zno${params}` (+2) | 371 | has endpoints |
| `HRZvsPage` | `/hr/zvs` | `/api/hr/zvs`, `/api/hr/zvs${params}` (+2) | 168 | has endpoints |
| `ImpositionCalculator` | `/print/imposition` | `/api/print/imposition` | 278 | has endpoints |
| `InkCoverageCalculator` | `/print/ink-coverage` | `/api/print/ink-coverage` | 201 | has endpoints |
| `InspectionPage` | `/hr/inspection` | `/api/hr/inspection/rooms` | 157 | has endpoints |
| `IntegrationManagement` | `/integrations`, `/integration/requests` | `/api/system/integrations` | 163 | has endpoints |
| `InternalJobBoard` | `/hr/internal-jobs` | `/api/hr/recruitment/internal-board` | 165 | has endpoints |
| `InvoiceVerification` | `/integration/invoice-verification` | `/api/integration/invoice/vendor-invoices`, `/api/mm/vendor-invoices/${selectedVendorInvoiceId}` (+4) | 252 | has endpoints |
| `IotSensorsPage` | `/iot-sensors` | `/api/iot/sensors` | 177 | has endpoints |
| `LMSSupport` | `/lms/support` | `/api/lms/support/tickets` | 292 | has endpoints |
| `MachineStatusPage` | `/machine-status-current`, `/machine-status-logs` | `/api/iot/machine-status`, `/api/iot/machine-status-logs` | 249 | has endpoints |
| `MarketingLeads` | `/marketing/leads` | `/api/marketing/leads`, `/api/marketing/leads/automation/overdue-leads` (+7) | 285 | has endpoints |
| `MaterialBalance` | `/wms/material-balance` | `/api/material-balance/overview`, `/api/material-balance/alerts` (+5) | 320 | has endpoints |
| `MaterialCardsPage` | `/material-cards` | `/api/warehouse/materials` | 200 | has endpoints |
| `MentorshipsPage` | `/mentorships` | `/api/mentorships`, `/api/mentorships/${id}` | 280 | has endpoints |
| `MentorsPage` | `/mentors` | `/api/mentors` | 162 | has endpoints |
| `MrpMatrix` | `/pp/mrp` | `/api/pp/mrp/run` | 278 | has endpoints |
| `NotificationCenter` | `/wms/notifications` | `/api/pos/notifications`, `/api/pos/notifications/${id}/read` (+1) | 192 | has endpoints |
| `NotificationSettings` | `/settings/notifications` | `/api/notifications/preferences` | 178 | has endpoints |
| `OkrPage` | `/okr` | `/api/okr/objectives` | 198 | has endpoints |
| `OrdersRegistry` | `/orders-registry` | `/api/orders-registry` | 96 | has endpoints |
| `OrderStatusPage` | `/order-status` | `/api/order-status/chain`, `/api/order-status/transitions` (+2) | 279 | has endpoints |
| `OrgDepartmentsPage` | `/org-departments` | `/api/core/departments`, `/api/core/departments/${id}` | 250 | has endpoints |
| `PosBarcPage` | `/pos/barcode` | `/api/pos/barcode/scan`, `/api/pos/barcode/generate-ean13` | 108 | has endpoints |
| `POSDashboard` | `/pos/dashboard`, `/pos/mini-app` | `/api/pos/products`, `/api/pos/sales/daily` (+2) | 289 | has endpoints |
| `PosInventoryCountsPage` | `/pos/inventory-counts` | `/api/pos/inventory-counts` | 216 | has endpoints |
| `POSInventoryPage` | `/pos/inventory`, `/inventory/advanced` | `/api/pos/inventory/movements`, `/api/pos/inventory/low-stock` (+3) | 205 | has endpoints |
| `PosRequestsPage` | `/pos/requests` | `/api/pos/requests` | 300 | has endpoints |
| `PosStockPage` | `/pos/stock` | `/api/pos/stock`, `/api/pos/stock/adjust` (+1) | 239 | has endpoints |
| `PosSyncPage` | `/pos/sync` | `/api/pos/sync/status`, `/api/pos/sync/all` (+1) | 192 | has endpoints |
| `PosWarehousePage` | `/pos/warehouse`, `/pos/wh` | `/api/pos/wh/stock`, `/api/warehouses` (+2) | 243 | has endpoints |
| `PricingTiers` | `/finance/pricing-tiers` | `/api/pricing/calculate`, `/api/pricing/tiers` (+1) | 286 | has endpoints |
| `ProductionFactsPage` | `/production-facts` | `/api/production-facts` | 291 | has endpoints |
| `ProgressPage` | `/dashboard/progress` | `/api/progress/summary` | 140 | has endpoints |
| `qc/PaperParametersPage` | `/qc/paper-parameters` | `/api/qc/parameters/paper` | 114 | has endpoints |
| `QCDashboard` | `/qc/dashboard-home` | `/api/qc/dashboard/stats`, `/api/qc/dashboard/flow` (+3) | 103 | has endpoints |
| `QCModule` | `/qc-module` | `/api/qc/parameters/grouped`, `/api/papka-orders` (+8) | 304 | has endpoints |
| `QualityDefectsCameraPage` | `/quality-defects-camera` | `/api/iot/quality-defects` | 195 | has endpoints |
| `QuestionnaireQuestionsPage` | `/questionnaire-questions` | `/api/questionnaire-questions`, `/api/questionnaire-questions/${id}` | 287 | has endpoints |
| `QuestionsPage` | `/questions` | `/api/questions`, `/api/questions/${id}` | 139 | has endpoints |
| `RaciCrisisPage` | `/raci-crisis` | `/api/raci-crisis/crises`, `/api/raci-crisis/tasks` | 134 | has endpoints |
| `RawMaterialsPage` | `/raw-materials` | `/api/raw-materials` | 146 | has endpoints |
| `RecruiterKPIPage` | `/hr/recruiter-kpi` | `/api/hr/recruitment/urgent`, `/api/hr/recruitment/channel-analytics` (+2) | 162 | has endpoints |
| `SafetyViolationsPage` | `/safety-violations` | `/api/safety-violations` | 195 | has endpoints |
| `SalesOrders` | `/erp/sales` | `/api/sap/sales-orders`, `/api/crm/contacts` (+3) | 236 | has endpoints |
| `SDDebitors` | `/sd/debitors` | `/api/sd/debitors` | 271 | has endpoints |
| `SDOverviewDashboard` | `/sd/dashboard/overview` | `/api/sd/dashboard/overview`, `/api/sd/dashboard/manager-actions` (+1) | 269 | has endpoints |
| `SDQuotaDashboard` | `/sd/dashboard/quota` | `/api/sd/dashboard/quota` | 106 | has endpoints |
| `SDQuotations` | `/sd/quotations` | `/api/sd/quotations/${quotation.id}` | 270 | has endpoints |
| `SDSalesManagement` | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` | `/api/sales/invoices`, `/api/sales/forecast/history` (+6) | 167 | has endpoints |
| `SecurityDashboard` | `/security` | `/api/security/attendance-records`, `/api/security/daily-summary` (+6) | 287 | has endpoints |
| `ShiftReportsPage` | `/production/shift-reports` | `/api/production/shift-reports` | 275 | has endpoints |
| `SupplyChainDashboard` | `/mm/supply-chain` | `/api/supply-chain/refresh`, `/api/supply-chain` (+5) | 144 | has endpoints |
| `SystemMonitor` | `/system-monitor` | `/api/system/health`, `/api/system/db-stats` (+2) | 193 | has endpoints |
| `TechApproval` | `/tech-approval` | `/api/papka-orders`, `/api/technology/orders/:id/approve` (+4) | 263 | has endpoints |
| `TechDashboard` | `/tech/dashboard-home` | `/api/design/statistics`, `/api/design/orders` (+1) | 326 | has endpoints |
| `Technology` | `/technology` | `/api/technology/dashboard`, `/api/technology/orders` | 331 | has endpoints |
| `ThreeWayMatchPage` | `/3way-match` | `/api/3way-match/results`, `/api/3way-match/perform` | 259 | has endpoints |
| `UsersPage` | `/users` | `/api/admin/users`, `/api/admin/users/${id}/role` (+1) | 154 | has endpoints |
| `warehouse/RollManagementPage` | `/warehouse/rolls` | `/api/agents/inventory/rolls`, `/api/agents/inventory/rolls/fifo` (+1) | 183 | has endpoints |
| `WarehouseDirectory` | `/warehouse-directory` | `/api/warehouse/warehouses`, `/api/warehouse/stats/total` | 153 | has endpoints |
| `WarehouseKirimWizard` | `/wms/kirim-new` | `/api/pos/wms/warehouses`, `/api/pos/movements` (+1) | 197 | has endpoints |
| `WarehouseMaterialKits` | `/iot/material-kits` | `/api/iot-enhanced/orders-for-kits`, `/api/iot-enhanced/material-kits` (+4) | 177 | has endpoints |
| `WarehouseQCReview` | `/wms/qc-review` | `/api/pos/wh-features/quarantine`, `/api/pos/wh-features/movement/${selected.id}/qc-decision` | 325 | has endpoints |
| `WarehouseQuarantine` | `/wms/quarantine` | `/api/pos/wh-features/quarantine`, `/api/pos/wh-features/movement/${id}/qc-decision` | 208 | has endpoints |
| `WarehouseReports` | `/warehouse/reports` | `/api/warehouse/reports/stock-balance`, `/api/warehouse/reports/turnover` (+1) | 156 | has endpoints |
| `WastePage` | `/waste` | `/api/waste/dashboard`, `/api/waste/records` | 341 | has endpoints |
| `WeeklyPlansPage` | `/weekly-plans` | `/api/weekly-plans`, `/api/weekly-plans/${id}` | 256 | has endpoints |
| `WmsAnalytics` | `/ai/wms`, `/wms/analytics` | `/api/wms/inventory-turnover`, `/api/wms/dead-stock` (+1) | 73 | has endpoints |
| `WMSDashboard` | `/wms/dashboard` | `/api/warehouse/dashboard/kpis`, `/api/warehouse/dashboard/movement-summary` (+4) | 182 | has endpoints |

## D — Detail pages (saqlanadi)

| Sahifa | Route | Endpoints | Hajm | Sabab |
|---|---|---|---:|---|
| `CandidateReport` | `/hr/candidate-report/:id` | `/api/candidates/${candidateId}`, `/api/hr/recruitment/pipeline` (+2) | 174 | detail page (param URL) |
| `CourseDetail` | `/courses/:id` | `/api/courses`, `/api/employees` (+4) | 357 | detail page (param URL) |
| `Customer360Page` | `/crm/customer/:id`, `/360` | — | 32 | detail page (param URL) |
| `DesignOrderDetail` | `/design-orders/:id` | `/api/design/orders`, `/api/design/orders/${orderId}/messages` | 382 | detail page (param URL) |
| `EmployeeProfile` | `/erp/employee/:id`, `/employees/:id` | `/api/employees`, `/api/employees/${id}/passport` (+38) | 369 | detail page (param URL) |
| `EmployeeTrackingReport` | `/employee-tracking` | `/api/users`, `/api/employee-zone-history/${expandedEmployee}` | 161 | detail page (name) |
| `LessonPlayer` | `/courses/:id/lessons`, `/courses/:id/lessons/:lessonId`, `/video-progress` | `/api/courses`, `/api/courses/${id}` (+2) | 240 | detail page (param URL) |
| `OrgNodeDetail` | `/org-structure/hierarchy/node/:id` | — | 154 | detail page (param URL) |
| `ProductionOrder360` | `/production/orders/:id` | `/api/production/orders`, `/api/production/orders/${id}/360-card` | 199 | detail page (param URL) |
| `TestDetail` | `/tests/:id` | `/api/tests`, `/api/tests/${id}` (+1) | 288 | detail page (param URL) |
| `WarehouseMaterial360` | `/wms/material/360/:id` | — | 373 | detail page (param URL) |

## S — Stub/Admin (saqlanadi)

| Sahifa | Route | Endpoints | Hajm | Sabab |
|---|---|---|---:|---|
| `AuditLogPage` | `/admin/audit-log` | `/api/admin/audit-tables` | 134 | admin panel |
| `CustomerPortalConfig` | `/customer-portal` | — | 341 | known stub |
| `OrderApprovalWorkflow` | `/order-approval` | `/api/approval-workflow/dashboard`, `/api/approval-workflow/pending` (+6) | 206 | known stub |
| `OrderCreationWizard` | `/order-create` | — | 171 | known stub |
| `StubPage` | `/auth`, `/export`, `/gpt`, `/micro-modules`, `/modules`, `/pos/printer-config`, `/sap`, `/v2/pos/printer-config` | — | 31 | known stub |
| `ValidatePage` | `/admin/validate` | `/api/validate/stir`, `/api/validate/luhn` | 139 | admin panel |

## K — Alternative entry (saqlanadi)

| Sahifa | Route | Endpoints | Hajm | Sabab |
|---|---|---|---:|---|
