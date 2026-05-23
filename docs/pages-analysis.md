# FE Pages — To'liq Tahlil Hisoboti
Generated: 2026-05-21T12:00:13.738Z

## Umumiy statistika

- Jami sahifa fayllar: **921**
- Canon (sidebar'da) sahifalar: **167**
- Orphan-route (route bor, sidebar yo'q): **133**
- Sub-component (route yo'q, parent ichida): **621**

## Canon sahifalar (sidebar'da, ko'rinadi)

| Sahifa | Route | Endpoints | Hajm |
|---|---|---|---:|
| `AccountantView` | `/europrint/accountant` | `/api/europrint-control/dashboard/accountant`, `/api/europrint-control/accountant/kpi-values`, `/api/europrint-control/accountant/financial-summary` (+2) | 338 |
| `AccountsPayable` | `/accounting/ap` | `/api/ap/aging`, `/api/ap/overdue`, `/api/ap/aging/recalculate` (+1) | 173 |
| `AccountsReceivable` | `/accounting/ar` | `/api/ar/aging`, `/api/ar/overdue`, `/api/ar/aging/recalculate` (+1) | 173 |
| `agents/AgentsHub` | `/agents`, `/agents/:id`, `/ai` | `/api/agents/director/briefing`, `/api/agents/crm/score-leads`, `/api/agents/production/monitor` (+13) | 232 |
| `agents/FacilitiesDashboard` | `/agents/facilities` | `/api/agents/facilities/utility`, `/api/agents/facilities/maintenance`, `/api/agents/facilities/supplies` | 120 |
| `agents/HRPerformanceDashboard` | `/agents/hr-performance` | `/api/agents/hr/performance`, `/api/agents/hr/performance/${activeId}`, `/api/agents/hr/churn` (+2) | 143 |
| `agents/ProcurementDashboard` | `/agents/procurement` | `/api/agents/supplier/scores`, `/api/agents/supplier/risks` | 103 |
| `agents/ProductionDashboard` | `/agents/production` | `/api/agents/production/monitor`, `/api/agents/production/oee`, `/api/agents/production/bottleneck` | 135 |
| `agents/QualityDashboard` | `/agents/quality` | `/api/agents/quality/trend`, `/api/agents/quality/quarantine` | 95 |
| `agents/StrategicDashboard` | `/agents/strategic` | `/api/agents/strategic/forecast-revenue`, `/api/agents/strategic/investment`, `/api/agents/strategic/scenario` | 134 |
| `ai-planning/BottleneckAnalysisPage` | `/pp/bottleneck` | `/api/ai/bottleneck/analysis` | 90 |
| `ai-planning/DemandForecastingPage` | `/pp/demand-forecast` | `/api/ai/forecast/demand` | 110 |
| `ai-planning/RushOrderPage` | `/pp/rush-orders` | `/api/ai/rush-orders`, `/api/ai/rush-orders/${orderId}/approve`, `/api/ai/rush-orders/${orderId}/reject` | 169 |
| `AiCrmPage` | `/ai/crm`, `/ai-crm`, `/ai/marketing` | `/api/crm/deals`, `/api/crm/contacts` | 224 |
| `AIDesignGenerator` | `/design/generator` | `/api/design/orders`, `/api/design/templates`, `/api/design/dashboard/summary` (+5) | 300 |
| `AIFinancePage` | `/ai/finance` | — | 139 |
| `AIInterviewPage` | `/ai-hr/interviews` | `/api/hr-v2/ai-interview/questions`, `/api/hr-v2/ai-interview/questions/${id}`, `/api/ai-hr/interviews` | 346 |
| `AIProductionPlanning` | `/ai-production-planning`, `/ai-planning` | `/api/ai-planning/dashboard`, `/api/ai-planning/plans`, `/api/ai-planning/config` (+8) | 252 |
| `Analytics` | `/analytics`, `/insights` | `/api/analytics/stats`, `/api/analytics/course-progress`, `/api/analytics/user-activity` (+30) | 185 |
| `AssetManagement` | `/accounting/asset-management` | `/api/asset-management/assets`, `/api/asset-management/assets/summary`, `/api/asset-management/maintenance` (+6) | 304 |
| `AuditorPanel` | `/europrint/auditor` | `/api/europrint-control/deleted-records/${recordId}/restore`, `/api/europrint-control/deleted-records`, `/api/europrint-control/auditor-dashboard` (+4) | 370 |
| `BarcodeWarehouse` | `/warehouse/barcode-ops`, `/barcode-warehouse` | — | 58 |
| `BOMManagement` | `/erp/pp/bom` | `/api/erp/bom-headers`, `/api/erp/products`, `/api/erp/bom-items` (+2) | 252 |
| `BudgetManagement` | `/finance/budgets` | `/api/budgets`, `/api/gl/accounts`, `/api/fi/cost-centers` (+1) | 261 |
| `camera-alerts` | `/camera-alerts` | `/api/camera-alerts`, `/api/camera-alerts/${id}/acknowledge`, `/api/camera-alerts/${id}/resolve` | 118 |
| `camera-machines` | `/camera-machines` | `/api/machine-status-current`, `/api/machine-status-logs` | 373 |
| `camera-quality` | `/camera-quality` | `/api/quality-defects-camera`, `/api/camera-dashboard/quality-stats` | 340 |
| `camera-reports` | `/camera-reports` | `/api/camera-dashboard/safety-stats`, `/api/camera-dashboard/quality-stats`, `/api/camera-dashboard/top-employees` (+1) | 235 |
| `camera-safety` | `/camera-safety` | `/api/safety-violations`, `/api/camera-dashboard/safety-stats` | 350 |
| `camera-settings` | `/camera-settings` | `/api/camera-settings` | 286 |
| `CameraLiveMonitoring` | `/camera-live-monitoring` | `/api/cameras`, `/api/erp/cameras/grouped-detections`, `/api/erp/cameras/live-detections` | 180 |
| `cameras-management` | `/cameras` | `/api/cameras`, `/api/pp/work-centers`, `/api/cameras/${id}` | 273 |
| `CapacityPlanning` | `/erp/pp/capacity` | `/api/erp/work-centers`, `/api/erp/work-center-capacity`, `/api/erp/shift-calendars` (+2) | 246 |
| `CashFlowManagement` | `/finance/cashflow` | `/api/cashflow/transactions`, `/api/cashflow/daily-summary`, `/api/cashflow/forecast` (+1) | 163 |
| `CashRegister` | `/accounting/cash-register` | — | 130 |
| `Certificates` | `/certificates` | `/api/certificates`, `/api/employees`, `/api/courses` (+2) | 169 |
| `ChartOfAccounts` | `/accounting/chart-of-accounts` | `/api/gl/accounts` | 147 |
| `Courses` | `/courses`, `/lessons` | `/api/courses`, `/api/org-departments`, `/api/courses/${courseId}` (+1) | 318 |
| `CRMWorkspace` | `/crm-workspace` | — | 383 |
| `DailyKPIDashboard` | `/finance/daily-kpi` | `/api/finance-extended/daily-metrics/today`, `/api/finance-extended/daily-metrics`, `/api/ai/finance/insights` | 134 |
| `DailyReportPage` | `/hr/daily-reports` | `/api/hr-v2/daily-reports/employee`, `/api/hr-v2/daily-reports/stats`, `/api/org-departments` (+5) | 225 |
| `DesignApproval` | `/design/approval` | `/api/papka-orders`, `/api/design/${orderId}/approve`, `/api/design/${orderId}/reject` | 260 |
| `DesignDashboard` | `/design/dashboard` | `/api/design/statistics` | 239 |
| `DesignExtended` | `/design/ai-review`, `/design/3d-mockup`, `/design/brand-guidelines`, `/design/comparison`, `/design/templates`, `/design/tools`, `/design/costing`, `/design/library` | `/api/design/orders`, `/api/integration/mro/equipment`, `/api/design/templates` | 99 |
| `DesignOrders` | `/design/orders` | `/api/design/orders` | 381 |
| `DirectorExtended` | `/director/ai-summary`, `/director/problem-points`, `/director/production`, `/director/hr-stats`, `/director/finance`, `/director/kpis` | `/api/director/dashboard`, `/api/director/ai-summary`, `/api/director/alerts` (+4) | 180 |
| `EmployeeRating` | `/integration/employee-rating` | `/api/integration/employee-rating/ratings`, `/api/integration/employee-rating/goals`, `/api/integration/employee-rating/stats` | 274 |
| `Employees` | `/employees` | `/api/employees`, `/api/org-departments` | 367 |
| `EuroprintControlCenter` | `/europrint/control` | `/api/europrint-control/business-rules`, `/api/europrint-control/units`, `/api/europrint-control/validation-rules` (+4) | 252 |
| `EventsCalendar` | `/events-calendar` | `/api/calendar-events`, `/api/calendar-events/upcoming`, `/api/org-departments` (+2) | 238 |
| `ExceptionLog` | `/admin/exceptions` | `/api/exceptions/stats`, `/api/exceptions` | 299 |
| `ExpenseManagement` | `/integration/expense-management` | `/api/integration/expense/expense-requests`, `/api/integration/expense/expense-stats`, `/api/integration/expense/advance-payments` (+2) | 350 |
| `FaceRecognitionMonitoring` | `/camera/monitoring` | `/api/camera/recognition-stats`, `/api/camera/recognition-logs`, `/api/camera/recognition-logs/${id}/flag` (+1) | 114 |
| `FaceRegistration` | `/face-registration` | `/api/employees-for-face`, `/api/face-embeddings`, `/api/hr/attendance/face/register` (+1) | 295 |
| `FinanceApproval` | `/finance/approval` | `/api/papka-orders`, `/api/qc/approve/finance/${orderId}`, `/api/qc/reject/${orderId}` | 287 |
| `FinanceDashboard` | `/finance-dashboard` | `/api/system-settings`, `/api/finance/dashboard`, `/api/payroll/periods` (+8) | 336 |
| `FinanceExtended` | `/fi/cost-centers`, `/fi/transfer-pricing`, `/fi/tax-management`, `/fi/tax-calendar`, `/fi/audit-log`, `/fi/risk-ai` | `/api/fi/cost-centers`, `/api/fi/profit-centers`, `/api/fi/gl-documents` (+3) | 171 |
| `FinancialReports` | `/finance/reports` | `/api/reports/weekly-summary`, `/api/reports/monthly-summary`, `/api/reports/kpi-dashboard` (+1) | 202 |
| `GLDocuments` | `/accounting/gl-documents`, `/gl` | `/api/accounting/gl-documents` | 338 |
| `GoalsKPI` | `/goals` | `/api/goals`, `/api/org-departments`, `/api/org-functions` (+2) | 184 |
| `GoodsReceiving` | `/warehouse/goods-receiving`, `/wms/grn` | `/api/warehouse/goods-receipts` | 244 |
| `HRAIDashboard` | `/ai-hr/dashboard`, `/ai/hr` | `/api/ai-hr/dashboard`, `/api/ai-hr/providers`, `/api/ai-hr/usage/budget` (+1) | 170 |
| `HRBrandPage` | `/hr/brand` | `/api/hr/brand-settings`, `/api/org-structure/nodes/flat`, `/api/org-structure/nodes/${selectedNodeId}/portret` | 262 |
| `HRCapitalCourses` | `/hr-capital/courses` | `/api/hr-capital/courses`, `/api/hr-capital/stats` | 343 |
| `HRCapitalTests` | `/hr-capital/tests` | `/api/hr/hrc-tests/stats`, `/api/hr/hrc-tests/sessions`, `/api/hr/hrc-tests/tool-test/questions` (+1) | 198 |
| `HRCareerPath` | `/hr/career-path` | `/api/succession/career-plans` | 361 |
| `HRDashboard` | `/hr-dashboard` | `/api/users`, `/api/hr/abc-analysis`, `/api/hr/discipline-records` (+20) | 299 |
| `HRHealthMonitoring` | `/hr/health-monitoring` | `/api/hr/health-checkups` | 336 |
| `HRLMSSkills` | `/integration/hr-lms` | `/api/integration/hr-lms/position-skills`, `/api/integration/hr-lms/employee-skills`, `/api/integration/hr-lms/expiring-certifications` (+1) | 203 |
| `HRMap` | `/hr-map` | `/api/hr-map/employees`, `/api/org-departments`, `/api/hr-map/stats` (+1) | 200 |
| `HROffboarding` | `/hr/offboarding` | `/api/hr/offboarding/cases/stats`, `/api/hr/offboarding/cases` | 251 |
| `HROnboarding` | `/hr/onboarding` | `/api/hr/onboarding-checklists`, `/api/hr/recruitment/roadmaps`, `/api/hr/employees` (+1) | 137 |
| `HRSafety` | `/hr/safety` | `/api/hr/safety/incidents`, `/api/hr/safety/ppe-compliance`, `/api/hr/safety/trainings` (+4) | 198 |
| `HRSuccessionPlanning` | `/hr/succession` | `/api/succession/key-positions`, `/api/succession/candidates`, `/api/succession/career-plans` | 143 |
| `HRVacationSick` | `/hr/vacation-sick` | `/api/hr/leave-requests` | 203 |
| `IdealRasmPage` | `/ideal-rasm` | `/api/ideal-rasm` | 350 |
| `IncomeExpense` | `/accounting/income-expense` | — | 251 |
| `InventoryCount` | `/warehouse/inventory-count`, `/wms/inventory` | `/api/warehouse/inventory-counts-stats`, `/api/warehouse/inventory-counts`, `/api/warehouse/warehouses` (+5) | 230 |
| `IoTExtended` | `/iot/sensor-monitoring`, `/iot/predictive-maintenance`, `/iot/digital-twin`, `/iot/alerts`, `/iot-enhanced` | `/api/iot-sensors`, `/api/iot-sensors/alerts`, `/api/iot-sensors/oee` (+3) | 168 |
| `IoTTablet` | `/iot/tablet` | — | 158 |
| `KaizenPage` | `/kaizen` | `/api/kaizen/suggestions`, `/api/kaizen/stats` | 93 |
| `KanbanBoard` | `/kanban` | — | 235 |
| `KnowledgeBase` | `/lms/knowledge-base`, `/knowledge-base` | `/api/knowledge-base`, `/api/knowledge-base/${id}`, `/api/knowledge-base/upload` | 273 |
| `LMSDashboard` | `/lms-dashboard` | `/api/courses`, `/api/certificates`, `/api/users` (+6) | 263 |
| `LMSExtended` | `/lms/course-author`, `/lms/operator-certification`, `/lms/learning-budget`, `/lms/leaderboard`, `/lms/micro-learning`, `/lms/gamification` | `/api/courses`, `/api/tests`, `/api/analytics/leaderboard/employees` | 285 |
| `LogisticsDashboard` | `/logistics`, `/logistics/transport`, `/logistics/route-planning`, `/logistics/gps`, `/logistics/fuel`, `/logistics/drivers`, `/logistics/vehicle-schedule` | `/api/mm/fleet/vehicles`, `/api/mm/fleet/fuel-logs`, `/api/mm/fleet/maintenance` (+7) | 272 |
| `MarketingBudget` | `/marketing/budget` | `/api/marketing/budget`, `/api/marketing/budget/${id}` | 177 |
| `MarketingCalendar` | `/marketing/calendar` | `/api/marketing/calendar`, `/api/marketing/calendar/${id}`, `/api/marketing/calendar/${editId}` | 168 |
| `MarketingCampaigns` | `/marketing/campaigns` | `/api/marketing/campaigns`, `/api/marketing/campaigns/${campaignId}/stats`, `/api/marketing/dashboard/stats` (+1) | 283 |
| `MarketingContent` | `/marketing/content` | `/api/marketing/content/posts`, `/api/marketing/content/posts/${id}`, `/api/marketing/content/posts/${id}/publish` (+1) | 309 |
| `MarketingDashboard` | `/marketing/dashboard` | `/api/marketing/segments`, `/api/marketing/ai/hot-leads`, `/api/marketing/leads/sources/summary` (+6) | 116 |
| `MarketingExhibitions` | `/marketing/exhibitions` | `/api/marketing/exhibitions`, `/api/marketing/exhibitions/${selectedExh}/leads`, `/api/marketing/exhibitions/${id}` (+1) | 318 |
| `MarketingExtended` | `/marketing/analytics`, `/marketing/seo`, `/marketing/ab-testing`, `/marketing/competitors`, `/marketing/nps-churn` | `/api/marketing/campaigns`, `/api/marketing/nps/monthly`, `/api/marketing/ab-tests` (+2) | 118 |
| `MarketingPR` | `/marketing/pr` | `/api/marketing/pr`, `/api/marketing/pr/${id}` | 154 |
| `MarketingSettings` | `/marketing/settings` | `/api/marketing/settings`, `/api/marketing/settings/social-api`, `/api/marketing/settings/${id}` (+1) | 198 |
| `MarketingSocialInbox` | `/marketing/social-inbox` | `/api/marketing/inbox/stats`, `/api/marketing/inbox/conversations`, `/api/marketing/inbox/conversations/${selectedId}/messages` (+3) | 207 |
| `MarketingWebsiteCMS` | `/marketing/website-cms` | `/api/marketing/website/blog`, `/api/website/news`, `/api/marketing/website/blog/${id}` (+2) | 296 |
| `MaterialsAccounting` | `/accounting/materials` | `/api/warehouse/movements`, `/api/accounting/materials`, `/api/accounting/inventory-valuation` (+1) | 206 |
| `Mentorship` | `/mentorship` | `/api/mentorships`, `/api/employees`, `/api/courses` (+1) | 162 |
| `MESDowntimes` | `/mes/downtimes` | `/api/iot/downtime-events`, `/api/iot/production-sessions` | 322 |
| `MESExtended` | `/mes/oee-monitor`, `/mes/zone-management`, `/mes/maintenance-request`, `/mes/machine-norms`, `/mes/smena-handover` | `/api/mes/oee`, `/api/mes/maintenance-requests`, `/api/mes/gamification/leaderboard` (+4) | 197 |
| `MESHomeDashboard` | `/mes/dashboard-home` | `/api/iot/dashboard/stats`, `/api/iot/production-sessions`, `/api/iot/downtime-events` (+1) | 124 |
| `MESProducts` | `/mes/products` | `/api/products` | 254 |
| `MESWorkCenters` | `/mes/work-centers` | `/api/iot/production-sessions`, `/api/pp/work-centers` | 110 |
| `MESWorkerAssignments` | `/mes/workers`, `/assignments` | `/api/iot/production-sessions` | 297 |
| `MMDashboard` | `/mm/dashboard` | `/api/warehouse/materials`, `/api/warehouse/transactions`, `/api/mm/vendors` (+1) | 339 |
| `MMExtended` | `/mm/check-bot`, `/mm/creditor-debts`, `/mm/supplier-portal` | `/api/mm/vendors`, `/api/mm/purchase-orders`, `/api/mm/goods-receipts` (+4) | 318 |
| `MMPurchaseOrders` | `/mm/purchase-orders` | `/api/mm/purchase-orders`, `/api/mm/vendors`, `/api/raw-materials` (+1) | 377 |
| `MMVendors` | `/mm/vendors` | `/api/mm/vendors`, `/api/mm/vendors/${id}` | 262 |
| `mro/CanteenManagementPage` | `/mro/kitchen` | `/api/mro/canteen/stats` | 89 |
| `mro/CleaningSchedulePage` | `/mro/cleaning` | `/api/mro/cleaning/schedules` | 98 |
| `mro/FacilityInventoryPage` | `/mro/office-inventory`, `/mro/building-inventory` | `/api/mro/facilities` | 93 |
| `mro/PreventiveMaintenancePage` | `/mro/preventive` | `/api/mro/pm/schedules` | 98 |
| `mro/SparePartsPage` | `/mro/spare-parts` | `/api/mro/spare-parts`, `/api/mro/spare-parts${search ` | 118 |
| `mro/UtilityReadingsPage` | `/mro/utilities` | `/api/mro/utility/readings` | 112 |
| `MRODashboard` | `/integration/mro`, `/mro/dashboard` | `/api/integration/mro/items`, `/api/integration/mro/requests`, `/api/integration/mro/equipment` (+6) | 188 |
| `MROExtended` | `/mro/expense-control`, `/mro/uniforms`, `/mro/sanitation` | `/api/integration/equipment`, `/api/integration/requests`, `/api/integration/items` (+4) | 185 |
| `OrderCosting` | `/finance/order-costing` | `/api/order-costing`, `/api/sales-orders`, `/api/order-costing/top-profitable` (+1) | 158 |
| `OrgStructureHierarchy` | `/org-structure/hierarchy` | `/api/org-structure/stats`, `/api/org-structure/hierarchy`, `/api/org-departments/notify-vacancies` (+3) | 289 |
| `PapkaOrders` | `/papka-orders` | `/api/papka-orders`, `/api/papka-orders/${id}` | 202 |
| `PayrollAutomation` | `/accounting/payroll-automation` | `/api/system-settings`, `/api/finance-extended/payroll-contracts`, `/api/finance-extended/payroll-calculations` (+2) | 157 |
| `PeriodClosing` | `/accounting/period-closing` | `/api/accounting/periods`, `/api/accounting/periods/${periodId}/close` | 296 |
| `PPDashboard` | `/pp/dashboard` | `/api/production/stats`, `/api/papka-orders`, `/api/machine-tasks` | 172 |
| `ProductionReport` | `/production/orders` | `/api/production/orders` | 185 |
| `ProductProfitability` | `/finance/profitability` | `/api/finance/profitability/recalculate`, `/api/reports/profitability/export`, `/api/order-costing/top-profitable` (+2) | 194 |
| `qc/DefectManagementPage` | `/qc/defect-management` | `/api/qc/defects/extended` | 97 |
| `qc/QualityCertificatesPage` | `/qc/certificates` | `/api/qc/certificates` | 116 |
| `qc/QualityTrendPage` | `/qc/trends` | `/api/qc/ai-trend` | 133 |
| `qc/ReclamationsPage` | `/qc/complaints` | `/api/qc/reclamations` | 110 |
| `qc/SupplierQualityPage` | `/qc/vendor-quality` | `/api/qc/supplier-quality` | 108 |
| `QCApproval` | `/qc/approval` | `/api/qc/pending/qc`, `/api/qc/tests`, `/api/qc/inspector-submit/${orderId}` (+3) | 267 |
| `QCExtended` | `/qc/lab`, `/qc/iso`, `/qc/ai-analysis`, `/qc/reports`, `/qc/settings` | — | 128 |
| `QCFinalInspection` | `/qc/final` | `/api/papka-orders`, `/api/qc/final-orders`, `/api/qc/final-inspections` (+1) | 161 |
| `QueueMonitor` | `/admin/queues` | `/api/admin/queues/status`, `/api/admin/queues/failed`, `/api/admin/queues/failed/${selectedQueue}` (+2) | 126 |
| `RecruitingKanban` | `/hr/recruiting` | `/api/chat/context-room`, `/api/hr/recruitment/vacancies`, `/api/hr/recruitment/pipeline` (+6) | 281 |
| `ReferralPage` | `/hr/referrals` | `/api/hr/referrals`, `/api/hr/referrals/boomerang`, `/api/hr/referrals/${id}` | 180 |
| `ReportsHub` | `/europrint/reports-hub` | `/api/reports-hub/dashboard`, `/api/reports-hub/definitions`, `/api/reports-hub/runs` (+5) | 240 |
| `RoutingConfiguration` | `/erp/pp/routing` | `/api/erp/routings`, `/api/erp/routing-operations`, `/api/erp/products` (+3) | 256 |
| `SaaSExtended` | `/saas/tenant-management`, `/saas/onboarding`, `/saas/licensing`, `/saas/module-control`, `/saas/monitoring`, `/saas/error-log` | `/api/saas/tenants`, `/api/saas/platform-stats`, `/api/saas/error-logs` (+1) | 162 |
| `SDContracts` | `/sd/contracts` | `/api/sd/contracts`, `/api/sd/contracts/${id}/sign` | 301 |
| `SDCustomers` | `/sd/customers` | `/api/sd/customers` | 226 |
| `SDDashboard` | `/sd/dashboard` | `/api/crm/ai/dashboard-analysis`, `/api/crm/leads`, `/api/crm/deals` (+1) | 115 |
| `SDExtended` | `/sd/manager-panel`, `/sd/warehouse-rental`, `/sd/advance-control` | `/api/crm/deals`, `/api/papka-orders`, `/api/users` (+1) | 123 |
| `SDKpi` | `/sd/kpi` | `/api/sd/kpi/team`, `/api/sd/reports/funnel` | 136 |
| `SDSalesOrders` | `/sd/sales-orders` | `/api/sd/orders`, `/api/sd/orders/${id}/status`, `/api/sd/orders/${id}/cancel` (+1) | 295 |
| `SDSalesPayments` | `/sd/sales-payments` | `/api/sd/payments`, `/api/sd/payments/debitors`, `/api/sd/orders` (+2) | 246 |
| `SDSalesQuotes` | `/sd/sales-quotes` | `/api/sd/quotations`, `/api/sd/customers`, `/api/sd/calculate-price` (+3) | 159 |
| `SDSettings` | `/sd/settings` | `/api/sd/price-formulas` | 250 |
| `SecurityExtended` | `/security/zone-access`, `/security/ppe`, `/security/hazmat`, `/security/evacuation`, `/security/visitors`, `/security/rating` | `/api/security/visitors`, `/api/security/attendance-records`, `/api/security/daily-summary` (+1) | 204 |
| `Settings` | `/settings` | `/api/org-functions`, `/api/guidelines`, `/api/contact-settings` (+3) | 255 |
| `ShiftSchedule` | `/shift-schedule` | `/api/users`, `/api/org-departments`, `/api/hr/shifts/schedule` (+5) | 299 |
| `SkillsMatrix` | `/skills-matrix` | `/api/hr/skills`, `/api/hr/employees`, `/api/hr/employee-skills` (+2) | 192 |
| `StockReservation` | `/warehouse/reservations`, `/wms/reservation` | `/api/ai-reservation/dashboard`, `/api/ai-reservation/batches`, `/api/ai-reservation/requests` | 272 |
| `StrategicTasksPanel` | `/europrint/strategic` | `/api/strategic/dashboard`, `/api/strategic/categories`, `/api/strategic/tasks` (+1) | 336 |
| `SuperAdminPanel` | `/super-admin` | `/api/saas/tenants`, `/api/saas/modules`, `/api/saas/platform-stats` (+7) | 266 |
| `TechCards` | `/tech-cards`, `/tech/cards` | `/api/technology/cards`, `/api/papka-orders`, `/api/technology/cards/${cardId}/optimize` (+1) | 192 |
| `TechPPExtended` | `/tech/material-alternatives`, `/tech/machine-selection`, `/tech/time-cost`, `/tech/cost-optimization`, `/tech/client-requirements`, `/tech/change-history`, `/tech/parallel-orders`, `/pp/parallel-processes`, `/pp/what-if`, `/pp/delivery-calculator`, `/pp/energy-optimization`, `/pp/realtime-progress` | `/api/pp/production-orders`, `/api/technology-cards`, `/api/mes/oee` (+1) | 112 |
| `TelegramBotAdmin` | `/telegram-bot`, `/telegram/admin` | `/api/telegram/admin/stats`, `/api/telegram/admin/users`, `/api/telegram/admin/broadcast` | 173 |
| `Tests` | `/tests` | `/api/tests`, `/api/tests/${testId}`, `/api/courses` | 273 |
| `VendorPerformance` | `/integration/vendor-performance` | `/api/mm/vendor-performance`, `/api/integration/vendor-performance`, `/api/integration/vendor-performance/spend-analysis` | 266 |
| `WarehouseDailyView` | `/iot/daily-view` | `/api/warehouse/orders-by-date`, `/api/equipment`, `/api/warehouse/material-kits` (+1) | 190 |
| `WarehouseHub12` | `/warehouse/hub`, `/warehouse/hub/:code` | `/api/warehouse/warehouses`, `/api/pos/wh/movements`, `/api/pos/wh/alerts` (+3) | 304 |
| `WarehouseIntegrations` | `/warehouse/integrations` | `/api/warehouse/integration/summary`, `/api/warehouse/integration/mm/pending-deliveries`, `/api/warehouse/integration/mm/reorder-suggestions` (+2) | 115 |
| `WarehouseRental` | `/wms/rental` | `/api/warehouse-rental/summary`, `/api/warehouse-rental/records`, `/api/warehouse-rental/settings` (+4) | 180 |
| `WasteTracking` | `/europrint/waste-tracking` | `/api/waste/records`, `/api/waste/analysis` | 230 |
| `WMSExtended` | `/wms/production-balance`, `/wms/transfer`, `/wms/lot-traceability`, `/wms/internal-requests`, `/wms/kpi` | `/api/warehouse/stock`, `/api/warehouse/transfers`, `/api/warehouse/internal-requests` (+5) | 205 |
| `WMSMaterials` | `/inventory/materials`, `/inventory/materials/:id` | `/api/inventory/materials` | 289 |

## Orphan-route sahifalar (route bor, sidebar'da yo'q)

Bular brauzerda URL bilan kirish mumkin, lekin sidebar menyusida yo'q.

| Sahifa | Route(s) | Endpoints | Hajm |
|---|---|---|---:|
| `AchievementsPage` | `/achievements` | `/api/achievements` | 181 |
| `AIAgentsPage` | `/ai/agents` | `/api/ai-agents/list`, `/api/ai-agents/${agentId}/trigger` | 134 |
| `AiAutomationPage` | `/ai/automation` | `/api/ai/automation/status`, `/api/ai/automation/run-all-pending` | 219 |
| `ApplicationResponsesPage` | `/application-responses` | `/api/application-responses` | 175 |
| `ApprovalHub` | `/approvals` | `/api/approval-workflow/dashboard`, `/api/approval-workflow/${type}/${id}/approve`, `/api/approval-workflow/${type}/${id}/reject` | 305 |
| `ApprovalWorkflowPage` | `/approval-workflow` | `/api/approval-workflow/history`, `/api/approval-workflow/pending`, `/api/approval-workflow` (+3) | 180 |
| `AttemptsPage` | `/attempts` | `/api/attempts/all` | 163 |
| `AttendanceMonitorPage` | `/attendance-monitor`, `/daily-attendance` | `/api/hr/attendance/live`, `/api/hr/attendance/territory/logs` | 146 |
| `AuditLogPage` | `/admin/audit-log` | `/api/admin/audit-tables` | 134 |
| `BarcodeScanner` | `/wms/scanner` | `/api/wms/barcode/scan` | 266 |
| `BarcodeSystem` | `/warehouse/barcodes` | `/api/warehouse/batches`, `/api/warehouse/materials`, `/api/warehouse/warehouses` (+5) | 237 |
| `CalendarEventsPage` | `/calendar-events` | `/api/calendar-events` | 296 |
| `CameraAIAnalytics` | `/europrint/camera-ai-analytics`, `/ai-camera` | `/api/camera-ai/summary`, `/api/camera-ai/safety-trends`, `/api/camera-ai/quality-analysis` (+3) | 280 |
| `CandidateReport` | `/hr/candidate-report/:id` | `/api/candidates/${candidateId}`, `/api/hr/recruitment/pipeline`, `/api/hr/recruitment/tool-test/candidate/${candidateId}` (+1) | 174 |
| `CandidatesPage` | `/candidates` | `/api/candidates`, `/api/candidates/${id}` | 283 |
| `CfoConfigSettings` | `/cfo/config` | `/api/finance/cfo-config`, `/api/finance/cfo-config/${key}` | 169 |
| `CFODashboard` | `/cfo/dashboard` | `/api/cfo/dashboard`, `/api/cfo/cash-position`, `/api/cfo/profitability` (+4) | 245 |
| `CompanyStatePage` | `/company-state` | `/api/company-state/current` | 222 |
| `CoordinationPage` | `/coordination` | `/api/coordination/dokla`, `/api/coordination/rasporyazhenie`, `/api/coordination/stats` (+4) | 298 |
| `CourseDetail` | `/courses/:id` | `/api/courses`, `/api/employees`, `/api/mentors` (+3) | 357 |
| `CRMActivities` | `/crm/activities` | `/api/crm/activities`, `/api/crm/deals`, `/api/crm/contacts` (+1) | 197 |
| `CrmCohortAnalysis` | `/crm/cohort` | `/api/crm/cohort` | 201 |
| `CrmFunnelAnalytics` | `/crm/funnel` | `/api/crm/funnel`, `/api/crm/deals/close`, `/api/crm/deals/${stageForm.dealId}/stage` | 384 |
| `CrmRfmClusters` | `/crm/rfm` | `/api/crm/rfm/cluster` | 167 |
| `CRMSettings` | `/crm/settings` | `/api/crm/custom-fields`, `/api/crm/custom-fields/${entityType}`, `/api/crm/custom-fields/${id}` (+1) | 283 |
| `CrpPage` | `/pp/crp` | `/api/pp/crp` | 263 |
| `Customer360Page` | `/crm/customer/:id`, `/360` | — | 32 |
| `CustomerPortalConfig` | `/customer-portal` | — | 341 |
| `DesignOrderDetail` | `/design-orders/:id` | `/api/design/orders`, `/api/design/orders/${orderId}/messages` | 382 |
| `DirectorAiAudit` | `/director/ai-audit` | `/api/ai-agents/audit/stats`, `/api/ai-agents/audit/hard-block-stats`, `/api/ai-agents/audit/${selectedAgent}/decisions` | 117 |
| `EmployeeFilesPage` | `/employee-files` | `/api/employee-files`, `/api/employee-files/${id}` | 280 |
| `EmployeeInventory` | `/wms/employee-inventory` | `/api/auth/me`, `/api/pos/employees/me/inventory` | 144 |
| `EmployeeProductivityPage` | `/employee-productivity` | `/api/employee-productivity` | 144 |
| `EmployeeProfile` | `/erp/employee/:id`, `/employees/:id` | `/api/employees`, `/api/employees/${id}/passport`, `/api/attendance/user` (+37) | 369 |
| `EmployeesForFacePage` | `/hr/face-employees` | `/api/hr/employees/list/for-face`, `/api/hr/employees/list/for-face${search ` | 146 |
| `EmployeeTrackingReport` | `/employee-tracking` | `/api/users`, `/api/employee-zone-history/${expandedEmployee}` | 161 |
| `EmployeeZoneHistoryPage` | `/employee-zone-history` | `/api/employee-zone-history` | 184 |
| `EquipmentPage` | `/equipment` | `/api/mro/equipment`, `/api/mro/equipment/${id}/status` | 251 |
| `ERPDailyReports` | `/erp-daily-reports` | `/api/erp/daily-reports`, `/api/users`, `/api/erp/work-centers` (+2) | 159 |
| `ERPProduction` | `/erp-production` | `/api/erp/work-centers` | 103 |
| `EuroprintControlPage` | `/europrint-control` | `/api/europrint-control/auditor-dashboard`, `/api/europrint-control/module-health`, `/api/europrint-control/validation-summary` (+1) | 291 |
| `FinanceBreakEven` | `/finance/break-even` | `/api/finance/break-even/cost-structure`, `/api/finance/break-even` | 302 |
| `FinanceVariance` | `/finance/variance` | `/api/finance/variance/${searchId}` | 266 |
| `ForecastAnalytics` | `/ai/forecast` | `/api/forecasts/run`, `/api/forecasts`, `/api/forecast/${encodeURIComponent(materialId)}/ema` (+3) | 347 |
| `GLChartOfAccounts` | `/finance/gl-chart-of-accounts` | `/api/finance/gl-accounts` | 231 |
| `GLPostingMonitor` | `/integration/gl-posting` | `/api/integration/gl/stock-gl-postings/stats`, `/api/integration/gl/stock-gl-postings`, `/api/integration/gl/gl-account-mapping` | 237 |
| `HRAssetManagement` | `/hr/assets` | `/api/assets`, `/api/employees`, `/api/org-departments` (+2) | 254 |
| `HRZnoPage` | `/hr/zno` | `/api/hr/zno`, `/api/hr/zno${params}`, `/api/hr/zno/${id}/approve` (+1) | 371 |
| `HRZvsPage` | `/hr/zvs` | `/api/hr/zvs`, `/api/hr/zvs${params}`, `/api/hr/zvs/${id}/approve` (+1) | 168 |
| `ImpositionCalculator` | `/print/imposition` | `/api/print/imposition` | 278 |
| `InkCoverageCalculator` | `/print/ink-coverage` | `/api/print/ink-coverage` | 201 |
| `InspectionPage` | `/hr/inspection` | `/api/hr/inspection/rooms` | 157 |
| `IntegrationManagement` | `/integrations`, `/integration/requests` | `/api/system/integrations` | 163 |
| `InternalJobBoard` | `/hr/internal-jobs` | `/api/hr/recruitment/internal-board` | 165 |
| `InvoiceVerification` | `/integration/invoice-verification` | `/api/integration/invoice/vendor-invoices`, `/api/mm/vendor-invoices/${selectedVendorInvoiceId}`, `/api/integration/invoice/three-way-match/stats` (+3) | 252 |
| `IotSensorsPage` | `/iot-sensors` | `/api/iot/sensors` | 177 |
| `LessonPlayer` | `/courses/:id/lessons`, `/courses/:id/lessons/:lessonId`, `/video-progress` | `/api/courses`, `/api/courses/${id}`, `/api/lms/progress/my` (+1) | 240 |
| `LMSSupport` | `/lms/support` | `/api/lms/support/tickets` | 292 |
| `MachineStatusPage` | `/machine-status-current`, `/machine-status-logs` | `/api/iot/machine-status`, `/api/iot/machine-status-logs` | 249 |
| `MarketingLeads` | `/marketing/leads` | `/api/marketing/leads`, `/api/marketing/leads/automation/overdue-leads`, `/api/marketing/funnel` (+6) | 285 |
| `MaterialBalance` | `/wms/material-balance` | `/api/material-balance/overview`, `/api/material-balance/alerts`, `/api/material-balance/internal-requests` (+4) | 320 |
| `MaterialCardsPage` | `/material-cards` | `/api/warehouse/materials` | 200 |
| `MentorshipsPage` | `/mentorships` | `/api/mentorships`, `/api/mentorships/${id}` | 280 |
| `MentorsPage` | `/mentors` | `/api/mentors` | 162 |
| `MrpMatrix` | `/pp/mrp` | `/api/pp/mrp/run` | 278 |
| `NotificationCenter` | `/wms/notifications` | `/api/pos/notifications`, `/api/pos/notifications/${id}/read`, `/api/pos/notifications/read-all` | 192 |
| `NotificationSettings` | `/settings/notifications` | `/api/notifications/preferences` | 178 |
| `OkrPage` | `/okr` | `/api/okr/objectives` | 198 |
| `OrderApprovalWorkflow` | `/order-approval` | `/api/approval-workflow/dashboard`, `/api/approval-workflow/pending`, `/api/approval-workflow/history` (+5) | 206 |
| `OrderCreationWizard` | `/order-create` | — | 171 |
| `OrdersRegistry` | `/orders-registry` | `/api/orders-registry` | 96 |
| `OrderStatusPage` | `/order-status` | `/api/order-status/chain`, `/api/order-status/transitions`, `/api/order-status/log` (+1) | 279 |
| `OrgDepartmentsPage` | `/org-departments` | `/api/core/departments`, `/api/core/departments/${id}` | 250 |
| `OrgNodeDetail` | `/org-structure/hierarchy/node/:id` | — | 154 |
| `PosBarcPage` | `/pos/barcode` | `/api/pos/barcode/scan`, `/api/pos/barcode/generate-ean13` | 108 |
| `POSDashboard` | `/pos/dashboard`, `/pos/mini-app` | `/api/pos/products`, `/api/pos/sales/daily`, `/api/pos/inventory/low-stock` (+1) | 289 |
| `PosInventoryCountsPage` | `/pos/inventory-counts` | `/api/pos/inventory-counts` | 216 |
| `POSInventoryPage` | `/pos/inventory`, `/inventory/advanced` | `/api/pos/inventory/movements`, `/api/pos/inventory/low-stock`, `/api/pos/inventory/monthly-report` (+2) | 205 |
| `PosMovementsPage` | `/pos/movements` | — | 217 |
| `PosRequestsPage` | `/pos/requests` | `/api/pos/requests` | 300 |
| `PosStockPage` | `/pos/stock` | `/api/pos/stock`, `/api/pos/stock/adjust`, `/api/pos/stock${qs ` | 239 |
| `PosSyncPage` | `/pos/sync` | `/api/pos/sync/status`, `/api/pos/sync/all`, `/api/pos/sync/${terminalId}` | 192 |
| `PosWarehousePage` | `/pos/warehouse`, `/pos/wh` | `/api/pos/wh/stock`, `/api/warehouses`, `/api/pos/wh/alerts` (+1) | 243 |
| `PricingTiers` | `/finance/pricing-tiers` | `/api/pricing/calculate`, `/api/pricing/tiers`, `/api/pricing/tiers/${encodeURIComponent(searchKey)}` | 286 |
| `ProductionFactsPage` | `/production-facts` | `/api/production-facts` | 291 |
| `ProductionOrder360` | `/production/orders/:id` | `/api/production/orders`, `/api/production/orders/${id}/360-card` | 199 |
| `ProgressPage` | `/dashboard/progress` | `/api/progress/summary` | 140 |
| `qc/PaperParametersPage` | `/qc/paper-parameters` | `/api/qc/parameters/paper` | 114 |
| `QCDashboard` | `/qc/dashboard-home` | `/api/qc/dashboard/stats`, `/api/qc/dashboard/flow`, `/api/qc/braks` (+2) | 103 |
| `QCModule` | `/qc-module` | `/api/qc/parameters/grouped`, `/api/papka-orders`, `/api/materials/cards` (+7) | 304 |
| `QualityDefectsCameraPage` | `/quality-defects-camera` | `/api/iot/quality-defects` | 195 |
| `QuestionnaireQuestionsPage` | `/questionnaire-questions` | `/api/questionnaire-questions`, `/api/questionnaire-questions/${id}` | 287 |
| `QuestionsPage` | `/questions` | `/api/questions`, `/api/questions/${id}` | 139 |
| `RaciCrisisPage` | `/raci-crisis` | `/api/raci-crisis/crises`, `/api/raci-crisis/tasks` | 134 |
| `RawMaterialsPage` | `/raw-materials` | `/api/raw-materials` | 146 |
| `RecruiterKPIPage` | `/hr/recruiter-kpi` | `/api/hr/recruitment/urgent`, `/api/hr/recruitment/channel-analytics`, `/api/hr/recruitment/worker-type-stats` (+1) | 162 |
| `SafetyViolationsPage` | `/safety-violations` | `/api/safety-violations` | 195 |
| `SalesOrders` | `/erp/sales` | `/api/sap/sales-orders`, `/api/crm/contacts`, `/api/crm/deals` (+2) | 236 |
| `SDDebitors` | `/sd/debitors` | `/api/sd/debitors` | 271 |
| `SDEuroprint` | `/sd/crm` | — | 66 |
| `SDOverviewDashboard` | `/sd/dashboard/overview` | `/api/sd/dashboard/overview`, `/api/sd/dashboard/manager-actions`, `/api/crm/followup-activities/today` | 269 |
| `SDQuotaDashboard` | `/sd/dashboard/quota` | `/api/sd/dashboard/quota` | 106 |
| `SDQuotations` | `/sd/quotations` | `/api/sd/quotations/${quotation.id}` | 270 |
| `SDSalesManagement` | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` | `/api/sales/invoices`, `/api/sales/forecast/history`, `/api/sales/forecast/accuracy` (+5) | 167 |
| `SecurityDashboard` | `/security` | `/api/security/attendance-records`, `/api/security/daily-summary`, `/api/security/visitors` (+5) | 287 |
| `ShiftReportsPage` | `/production/shift-reports` | `/api/production/shift-reports` | 275 |
| `StubPage` | `/auth`, `/export`, `/gpt`, `/micro-modules`, `/modules`, `/pos/printer-config`, `/sap`, `/v2/pos/printer-config` | — | 31 |
| `SupplyChainDashboard` | `/mm/supply-chain` | `/api/supply-chain/refresh`, `/api/supply-chain`, `/api/mm/purchase-orders/pending-receipt` (+4) | 144 |
| `SystemMonitor` | `/system-monitor` | `/api/system/health`, `/api/system/db-stats`, `/api/system/cron-jobs` (+1) | 193 |
| `TechApproval` | `/tech-approval` | `/api/papka-orders`, `/api/technology/orders/:id/approve`, `/api/technology/orders/${orderId}/approve` (+3) | 263 |
| `TechDashboard` | `/tech/dashboard-home` | `/api/design/statistics`, `/api/design/orders`, `/api/design/templates` | 326 |
| `Technology` | `/technology` | `/api/technology/dashboard`, `/api/technology/orders` | 331 |
| `TestDetail` | `/tests/:id` | `/api/tests`, `/api/tests/${id}`, `/api/questions/${questionId}` | 288 |
| `ThreeWayMatchPage` | `/3way-match` | `/api/3way-match/results`, `/api/3way-match/perform` | 259 |
| `UsersPage` | `/users` | `/api/admin/users`, `/api/admin/users/${id}/role`, `/api/admin/users/${id}` | 154 |
| `ValidatePage` | `/admin/validate` | `/api/validate/stir`, `/api/validate/luhn` | 139 |
| `warehouse/RollManagementPage` | `/warehouse/rolls` | `/api/agents/inventory/rolls`, `/api/agents/inventory/rolls/fifo`, `/api/agents/inventory/rolls/scan` | 183 |
| `WarehouseAuditLog` | `/wms/audit-log` | — | 250 |
| `WarehouseBarcodeQueue` | `/wms/barcodes-queue` | — | 215 |
| `WarehouseDirectory` | `/warehouse-directory` | `/api/warehouse/warehouses`, `/api/warehouse/stats/total` | 153 |
| `WarehouseInventoryPassport` | `/wms/passports` | — | 211 |
| `WarehouseKirimWizard` | `/wms/kirim-new` | `/api/pos/wms/warehouses`, `/api/pos/movements`, `/api/pos/inventory-passport` | 197 |
| `WarehouseKpiHub` | `/wms/kpi-hub` | — | 217 |
| `WarehouseMaterial360` | `/wms/material/360/:id` | — | 373 |
| `WarehouseMaterialKits` | `/iot/material-kits` | `/api/iot-enhanced/orders-for-kits`, `/api/iot-enhanced/material-kits`, `/api/iot-enhanced/orders/${orderId}/calculate-bom` (+3) | 177 |
| `WarehouseQCReview` | `/wms/qc-review` | `/api/pos/wh-features/quarantine`, `/api/pos/wh-features/movement/${selected.id}/qc-decision` | 325 |
| `WarehouseQuarantine` | `/wms/quarantine` | `/api/pos/wh-features/quarantine`, `/api/pos/wh-features/movement/${id}/qc-decision` | 208 |
| `WarehouseReports` | `/warehouse/reports` | `/api/warehouse/reports/stock-balance`, `/api/warehouse/reports/turnover`, `/api/warehouse/reports/abc-analysis` | 156 |
| `WarehouseReportsAll` | `/wms/reports`, `/wms/reports-all` | — | 88 |
| `WastePage` | `/waste` | `/api/waste/dashboard`, `/api/waste/records` | 341 |
| `WeeklyPlansPage` | `/weekly-plans` | `/api/weekly-plans`, `/api/weekly-plans/${id}` | 256 |
| `WmsAnalytics` | `/ai/wms`, `/wms/analytics` | `/api/wms/inventory-turnover`, `/api/wms/dead-stock`, `/api/wms/rop-alerts` | 73 |
| `WMSDashboard` | `/wms/dashboard` | `/api/warehouse/dashboard/kpis`, `/api/warehouse/dashboard/movement-summary`, `/api/warehouse/dashboard/alerts` (+3) | 182 |

## Sub-component sahifalar (route yo'q)

Total: 621 sub-component fayl. Parent sahifa ichida import qilingan bo'lishi kerak.

## TOP 30 eng ko'p ishlatiladigan API endpoint'lar

| Endpoint | Sahifa soni |
|---|---:|
| `/api/employees` | 20 |
| `/api/warehouse/warehouses` | 12 |
| `/api/org-departments` | 9 |
| `/api/users` | 9 |
| `/api/papka-orders` | 9 |
| `/api/crm/deals` | 8 |
| `/api/erp/work-centers` | 8 |
| `/api/courses` | 8 |
| `/api/design/orders` | 6 |
| `/api/hr/employees` | 5 |
| `/api/hr/offboarding/cases` | 5 |
| `/api/iot/production-sessions` | 5 |
| `/api/crm/contacts` | 4 |
| `/api/org-functions` | 4 |
| `/api/warehouse/materials` | 4 |
| `/api/erp/products` | 4 |
| `/api/crm/leads` | 4 |
| `/api/sd/orders` | 4 |
| `/api/mm/vendors` | 4 |
| `/api/finance-extended/payroll-calculations` | 4 |
| `/api/design/templates` | 3 |
| `/api/analytics/leaderboard/employees` | 3 |
| `/api/europrint-control/auditor-dashboard` | 3 |
| `/api/europrint-control/validation-summary` | 3 |
| `/api/gl/accounts` | 3 |
| `/api/fi/cost-centers` | 3 |
| `/api/certificates` | 3 |
| `/api/org-structure/functions` | 3 |
| `/api/system-settings` | 3 |
| `/api/succession/career-plans` | 3 |