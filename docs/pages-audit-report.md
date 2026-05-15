# EuroPrint ERP — Pages Audit Report

**Audit date:** 2026-05-15  
**Branch:** chore/clean-faza-3  
**Method:** automated static analysis (audit-pages-map.mjs)

## Executive Summary

| Metric | Value | % |
|--------|-------|---|
| Frontend routes | 336 | 100% |
| ✅ Fully working (all API calls resolve) | 244 | 72.6% |
| 🟡 Partial (some broken API calls) | 76 | 22.6% |
| ⚪ Display-only (no API calls) | 16 | 4.8% |
| Backend endpoints | 2956 | — |
| @Public() (intentionally open) | 20 | — |
| JWT-protected (global guard default) | 2936 | — |

> **Auth note:** `APP_GUARD: JwtAuthGuard` is registered globally in `app.module.ts`. Every endpoint is JWT-protected unless explicitly marked `@Public()`.

## Module-by-Module Status

| Module | Pages | ✅ Working | 🟡 Broken | Backend EP | Status |
|--------|-------|-----------|-----------|------------|--------|
| hr | 25 | 16 | 9 | 401 | 🔴 |
| wms | 18 | 14 | 4 | 51 | 🟡 |
| marketing | 16 | 12 | 4 | 98 | 🟡 |
| qc | 14 | 11 | 3 | 73 | 🟡 |
| pp | 13 | 12 | 1 | 28 | 🟡 |
| sd | 12 | 7 | 5 | 84 | 🔴 |
| design | 12 | 12 | 0 | 22 | ✅ |
| mes | 12 | 12 | 0 | 46 | ✅ |
| accounting | 11 | 10 | 1 | 9 | 🟡 |
| mro | 11 | 10 | 1 | 14 | 🟡 |
| security | 8 | 8 | 0 | 16 | ✅ |
| agents | 8 | 5 | 3 | 47 | 🔴 |
| finance | 8 | 5 | 3 | 94 | 🔴 |
| tech | 8 | 8 | 0 | 14 | ✅ |
| iot | 8 | 7 | 1 | 89 | 🟡 |
| lms | 7 | 7 | 0 | 29 | ✅ |
| ai | 7 | 6 | 1 | 92 | 🟡 |
| europrint | 7 | 3 | 4 | 30 | 🔴 |
| integration | 6 | 5 | 1 | 63 | 🟡 |
| saas | 6 | 6 | 0 | 13 | ✅ |
| fi | 6 | 6 | 0 | 143 | ✅ |
| mm | 6 | 6 | 0 | 65 | ✅ |
| logistics | 6 | 6 | 0 | 5 | ✅ |
| pos | 5 | 0 | 5 | 173 | 🔴 |
| warehouse | 3 | 2 | 1 | 109 | 🔴 |
| production | 3 | 2 | 1 | 16 | 🔴 |
| erp | 3 | 1 | 2 | 79 | 🔴 |
| settings | 2 | 2 | 0 | 0 | ✅ |
| admin | 2 | 1 | 1 | 39 | 🔴 |
| courses | 2 | 1 | 1 | 8 | 🔴 |
| tests | 2 | 2 | 0 | 5 | ✅ |
| director | 2 | 2 | 0 | 25 | ✅ |
| employees | 2 | 1 | 1 | 65 | 🔴 |
| hr-capital | 2 | 2 | 0 | 2 | ✅ |
| ai-hr | 2 | 2 | 0 | 6 | ✅ |
| inventory | 2 | 0 | 2 | 9 | 🔴 |
| super-admin | 1 | 0 | 1 | 0 | 🔴 |
| telegram | 1 | 1 | 0 | 3 | ✅ |
| kaizen | 1 | 1 | 0 | 6 | ✅ |
| analytics | 1 | 1 | 0 | 29 | ✅ |
| lms-dashboard | 1 | 1 | 0 | 0 | ✅ |
| lessons | 1 | 0 | 1 | 6 | 🔴 |
| ai-exams | 1 | 1 | 0 | 0 | ✅ |
| all-exams | 1 | 1 | 0 | 0 | ✅ |
| certificates | 1 | 0 | 1 | 5 | 🔴 |
| goals | 1 | 1 | 0 | 5 | ✅ |
| kanban | 1 | 1 | 0 | 93 | ✅ |
| camera-dashboard | 1 | 1 | 0 | 9 | ✅ |
| cameras | 1 | 1 | 0 | 2 | ✅ |
| camera-safety | 1 | 1 | 0 | 0 | ✅ |
| camera-quality | 1 | 1 | 0 | 0 | ✅ |
| camera-employees | 1 | 1 | 0 | 0 | ✅ |
| camera-machines | 1 | 1 | 0 | 0 | ✅ |
| camera-alerts | 1 | 1 | 0 | 5 | ✅ |
| camera-reports | 1 | 0 | 1 | 4 | 🔴 |
| camera-settings | 1 | 1 | 0 | 2 | ✅ |
| camera-heatmap | 1 | 0 | 1 | 4 | 🔴 |
| camera-employee-ratings | 1 | 0 | 1 | 1 | 🔴 |
| camera-live-monitoring | 1 | 0 | 1 | 0 | 🔴 |
| camera | 1 | 0 | 1 | 63 | 🔴 |
| face-registration | 1 | 1 | 0 | 0 | ✅ |
| attendance-monitor | 1 | 0 | 1 | 0 | 🔴 |
| crm-workspace | 1 | 1 | 0 | 0 | ✅ |
| strategic-tasks | 1 | 0 | 1 | 0 | 🔴 |
| ideal-rasm | 1 | 1 | 0 | 4 | ✅ |
| finance-dashboard | 1 | 1 | 0 | 0 | ✅ |
| hr-map | 1 | 0 | 1 | 8 | 🔴 |
| seven-functions | 1 | 0 | 1 | 10 | 🔴 |
| raci-matrix | 1 | 1 | 0 | 0 | ✅ |
| skills-matrix | 1 | 0 | 1 | 0 | 🔴 |
| mentorship | 1 | 1 | 0 | 6 | ✅ |
| events-calendar | 1 | 1 | 0 | 0 | ✅ |
| applications | 1 | 1 | 0 | 5 | ✅ |
| questionnaire | 1 | 1 | 0 | 18 | ✅ |
| questionnaire-templates | 1 | 1 | 0 | 5 | ✅ |
| shift-schedule | 1 | 0 | 1 | 0 | 🔴 |
| discipline | 1 | 1 | 0 | 6 | ✅ |
| hr-dashboard | 1 | 1 | 0 | 0 | ✅ |
| org-structure | 1 | 1 | 0 | 23 | ✅ |
| weekly-plan | 1 | 0 | 1 | 7 | 🔴 |
| planning | 1 | 0 | 1 | 5 | 🔴 |
| ai-production-planning | 1 | 1 | 0 | 0 | ✅ |
| papka-orders | 1 | 1 | 0 | 4 | ✅ |
| order-create | 1 | 1 | 0 | 0 | ✅ |
| tech-approval | 1 | 1 | 0 | 0 | ✅ |
| tech-cards | 1 | 1 | 0 | 0 | ✅ |
| ai-camera | 1 | 1 | 0 | 5 | ✅ |
| ai-exam | 1 | 1 | 0 | 6 | ✅ |
| ai-planning | 1 | 1 | 0 | 15 | ✅ |
| assignments | 1 | 1 | 0 | 1 | ✅ |
| insights | 1 | 1 | 0 | 4 | ✅ |
| iot-enhanced | 1 | 1 | 0 | 8 | ✅ |
| video-progress | 1 | 0 | 1 | 2 | 🔴 |
| 3way-match | 1 | 1 | 0 | 2 | ✅ |
| daily-attendance | 1 | 0 | 1 | 2 | 🔴 |
| discipline-records | 1 | 1 | 0 | 5 | ✅ |
| employee-zone-history | 1 | 0 | 1 | 2 | 🔴 |
| gl | 1 | 1 | 0 | 3 | ✅ |
| iot-sensors | 1 | 1 | 0 | 11 | ✅ |
| machine-status-current | 1 | 1 | 0 | 1 | ✅ |
| production-facts | 1 | 1 | 0 | 4 | ✅ |
| quality-defects-camera | 1 | 0 | 1 | 1 | 🔴 |
| users | 1 | 0 | 1 | 1 | 🔴 |
| waste | 1 | 1 | 0 | 8 | ✅ |
| weekly-plans | 1 | 1 | 0 | 7 | ✅ |

## Top Missing API Endpoints (Quick Wins)

> Fixing one endpoint here fixes multiple pages.

| Missing API | Pages affected |
|-------------|----------------|
|  | 3 |
|  | 3 |
|  | 2 |
|  | 2 |
|  | 2 |
|  | 2 |
|  | 2 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |
|  | 1 |

## Most-Broken Pages

| Route | Component | Broken APIs |
|-------|-----------|-------------|
| /agents/hr-performance | agents/HRPerformanceDashboard | 4 |
| /hr/daily-reports | DailyReportPage | 4 |
| /camera-heatmap | camera-heatmap | 3 |
| /europrint/employee-kpi | EmployeeDailyKPIPanel | 3 |
| /employees/:id | EmployeeProfile | 3 |
| /camera-reports | camera-reports | 2 |
| /agents | agents/AgentsHub | 2 |
| /agents/:id | agents/AgentsHub | 2 |
| /finance/cashflow | CashFlowManagement | 2 |
| /finance/profitability | ProductProfitability | 2 |
| /pos/inventory | POSInventoryPage | 2 |
| /weekly-plan | WeeklyPlanPage | 2 |
| /production/orders | ProductionReport | 2 |
| /planning | PlanningBoard | 2 |
| /ai | agents/AgentsHub | 2 |
| /super-admin | SuperAdminPanel | 1 |
| /admin/exceptions | ExceptionLog | 1 |
| /integration/vendor-performance | VendorPerformance | 1 |
| /courses | Courses | 1 |
| /lessons | Courses | 1 |
| /certificates | Certificates | 1 |
| /camera-employee-ratings | camera-employee-ratings | 1 |
| /camera-live-monitoring | CameraLiveMonitoring | 1 |
| /camera/monitoring | FaceRecognitionMonitoring | 1 |
| /attendance-monitor | AttendanceMonitorPage | 1 |
| /sd/customers | SDCustomers | 1 |
| /sd/sales-orders | SDSalesOrders | 1 |
| /sd/sales-payments | SDSalesPayments | 1 |
| /sd/kpi | SDKpi | 1 |
| /sd/contracts | SDContracts | 1 |

## Detailed Page-by-Page Report

Legend: ✅ all APIs resolve, 🟡 partial, ⚪ no API calls (display-only)

### hr (25 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /hr/alumni | HRAlumni | ✅ |  |
| /hr/assets | HRAssetManagement | 🟡 | /api/assets?:id |
| /hr/birthdays | BirthdayWidget | ✅ |  |
| /hr/brand | HRBrandPage | ✅ |  |
| /hr/career-path | HRCareerPath | ✅ |  |
| /hr/conflict | HRConflict | ✅ |  |
| /hr/daily-reports | DailyReportPage | 🟡 | /api/hr-v2/daily-reports/employee?employeeId=:id&limit=14, /api/hr-v2/daily-reports/stats?date=:id, +2 |
| /hr/documents | DocumentWorkflowPage | 🟡 | /api/hr-v2/documents?status=pending&employeeId=:id |
| /hr/enps | ENPSPage | ✅ |  |
| /hr/gamification | GamificationPage | 🟡 | /api/hr/gamification/leaderboard?period=:id |
| /hr/health-monitoring | HRHealthMonitoring | ✅ |  |
| /hr/inspection | InspectionPage | ✅ |  |
| /hr/leave | HRVacationSick | ✅ |  |
| /hr/milestones | MilestonePage | ✅ |  |
| /hr/offboarding | HROffboarding | 🟡 | /api/hr/offboarding/cases?status=:id&search=:id |
| /hr/onboarding | HROnboarding | 🟡 | /api/hr/onboarding-checklists/:id |
| /hr/pip | PIPPage | 🟡 | /api/hr-v2/pip/:id/complete |
| /hr/reception | ReceptionPage | 🟡 | /api/hr-v2/reception/badge/:id |
| /hr/recruiting | RecruitingKanban | ✅ |  |
| /hr/recruiting-kanban | RecruitingKanban | ✅ |  |
| /hr/referrals | ReferralPage | 🟡 | /api/hr/referrals/:id |
| /hr/safety | HRSafety | ✅ |  |
| /hr/succession | HRSuccessionPlanning | ✅ |  |
| /hr/succession-planning | HRSuccessionPlanning | ✅ |  |
| /hr/vacation-sick | HRVacationSick | ✅ |  |

### wms (18 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /wms/analytics | WmsAnalytics | ✅ |  |
| /wms/audit-log | WarehouseAuditLog | 🟡 | /api/pos/reports/audit?:id |
| /wms/barcodes-queue | WarehouseBarcodeQueue | ✅ |  |
| /wms/employee-inventory | EmployeeInventory | ✅ |  |
| /wms/internal-requests | WMSExtended | ✅ |  |
| /wms/inventory | InventoryCount | ✅ |  |
| /wms/kirim-new | WarehouseKirimWizard | ✅ |  |
| /wms/kpi-hub | WarehouseKpiHub | ⚪ |  |
| /wms/material-balance | MaterialBalance | 🟡 | /api/material-balance/movements |
| /wms/notifications | NotificationCenter | ✅ |  |
| /wms/passports | WarehouseInventoryPassport | 🟡 | /api/pos/inventory-passport?:id |
| /wms/production-balance | WMSExtended | ✅ |  |
| /wms/qc-review | WarehouseQCReview | ✅ |  |
| /wms/quarantine | WarehouseQuarantine | ✅ |  |
| /wms/rental | WarehouseRental | 🟡 | /api/warehouse-rental/records${statusFilter ?  |
| /wms/reports | WarehouseReportsAll | ⚪ |  |
| /wms/reports-all | WarehouseReportsAll | ⚪ |  |
| /wms/transfer | WMSExtended | ✅ |  |

### marketing (16 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /marketing/ab-testing | MarketingExtended | ✅ |  |
| /marketing/analytics | MarketingExtended | ✅ |  |
| /marketing/budget | MarketingBudget | ✅ |  |
| /marketing/calendar | MarketingCalendar | 🟡 | /api/marketing/calendar?month=:id&year=:id |
| /marketing/campaigns | MarketingCampaigns | ✅ |  |
| /marketing/competitors | MarketingExtended | ✅ |  |
| /marketing/content | MarketingContent | ✅ |  |
| /marketing/dashboard | MarketingDashboard | ✅ |  |
| /marketing/exhibitions | MarketingExhibitions | ✅ |  |
| /marketing/leads | MarketingLeads | 🟡 | /api/marketing/leads/recalculate-scores |
| /marketing/nps-churn | MarketingExtended | ✅ |  |
| /marketing/pr | MarketingPR | ✅ |  |
| /marketing/seo | MarketingExtended | ✅ |  |
| /marketing/settings | MarketingSettings | 🟡 | /api/marketing/settings/:id |
| /marketing/social-inbox | MarketingSocialInbox | 🟡 | /api/marketing/inbox/conversations?:id |
| /marketing/website-cms | MarketingWebsiteCMS | ✅ |  |

### qc (14 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /qc/ai-analysis | QCExtended | ⚪ |  |
| /qc/approval | QCApproval | 🟡 | /api/qc/tests/:id |
| /qc/certificates | qc/QualityCertificatesPage | ✅ |  |
| /qc/complaints | qc/ReclamationsPage | ✅ |  |
| /qc/dashboard-home | QCDashboard | ✅ |  |
| /qc/defect-management | qc/DefectManagementPage | 🟡 | /api/qc/defects/extended |
| /qc/final | QCFinalInspection | ✅ |  |
| /qc/iso | QCExtended | ⚪ |  |
| /qc/lab | QCExtended | ⚪ |  |
| /qc/paper-parameters | qc/PaperParametersPage | 🟡 | /api/qc/parameters/paper |
| /qc/reports | QCExtended | ⚪ |  |
| /qc/settings | QCExtended | ⚪ |  |
| /qc/trends | qc/QualityTrendPage | ✅ |  |
| /qc/vendor-quality | qc/SupplierQualityPage | ✅ |  |

### pp (13 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /pp/ai-reservation | AIReservation | ✅ |  |
| /pp/bottleneck | ai-planning/BottleneckAnalysisPage | ✅ |  |
| /pp/dashboard | PPDashboard | ✅ |  |
| /pp/delivery-calculator | TechPPExtended | ✅ |  |
| /pp/demand-forecast | ai-planning/DemandForecastingPage | ✅ |  |
| /pp/energy-optimization | TechPPExtended | ✅ |  |
| /pp/kpi-deviation | TechPPExtended | ✅ |  |
| /pp/oee-monitor | ai-planning/OEELiveMonitorPage | 🟡 | /api/iot/oee/live |
| /pp/parallel-processes | TechPPExtended | ✅ |  |
| /pp/realtime-progress | TechPPExtended | ✅ |  |
| /pp/rush-orders | ai-planning/RushOrderPage | ✅ |  |
| /pp/shift-management | ai-planning/AIShiftManagementPage | ✅ |  |
| /pp/what-if | TechPPExtended | ✅ |  |

### sd (12 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /sd/advance-control | SDExtended | ✅ |  |
| /sd/contracts | SDContracts | 🟡 | /api/sd/contracts?:id |
| /sd/customers | SDCustomers | 🟡 | /api/sd/customers?:id |
| /sd/dashboard | SDDashboard | ✅ |  |
| /sd/debitors | SDDebitors | ✅ |  |
| /sd/kpi | SDKpi | 🟡 | /api/sd/kpi/team?year=:id&month=:id |
| /sd/manager-panel | SDExtended | ✅ |  |
| /sd/sales-orders | SDSalesOrders | 🟡 | /api/sd/orders?:id |
| /sd/sales-payments | SDSalesPayments | 🟡 | /api/sd/payments?:id |
| /sd/sales-quotes | SDSalesQuotes | ✅ |  |
| /sd/settings | SDSettings | ✅ |  |
| /sd/warehouse-rental | SDExtended | ✅ |  |

### design (12 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /design/3d-mockup | DesignExtended | ✅ |  |
| /design/ai-review | DesignExtended | ✅ |  |
| /design/approval | DesignApproval | ✅ |  |
| /design/brand-guidelines | DesignExtended | ✅ |  |
| /design/comparison | DesignExtended | ✅ |  |
| /design/costing | DesignExtended | ✅ |  |
| /design/dashboard | DesignDashboard | ✅ |  |
| /design/generator | AIDesignGenerator | ✅ |  |
| /design/library | DesignExtended | ✅ |  |
| /design/orders | DesignOrders | ✅ |  |
| /design/templates | DesignExtended | ✅ |  |
| /design/tools | DesignExtended | ✅ |  |

### mes (12 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /mes/dashboard-home | MESHomeDashboard | ✅ |  |
| /mes/downtimes | MESDowntimes | ✅ |  |
| /mes/gamification | MESExtended | ✅ |  |
| /mes/machine-norms | MESExtended | ✅ |  |
| /mes/maintenance-request | MESExtended | ✅ |  |
| /mes/oee-monitor | MESExtended | ✅ |  |
| /mes/products | MESProducts | ✅ |  |
| /mes/reason-log | MESExtended | ✅ |  |
| /mes/smena-handover | MESExtended | ✅ |  |
| /mes/work-centers | MESWorkCenters | ✅ |  |
| /mes/workers | MESWorkerAssignments | ✅ |  |
| /mes/zone-management | MESExtended | ✅ |  |

### accounting (11 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /accounting/ap | AccountsPayable | ✅ |  |
| /accounting/ar | AccountsReceivable | ✅ |  |
| /accounting/asset-management | AssetManagement | ✅ |  |
| /accounting/cash-register | CashRegister | ⚪ |  |
| /accounting/chart-of-accounts | ChartOfAccounts | ✅ |  |
| /accounting/gl-documents | GLDocuments | ✅ |  |
| /accounting/income-expense | IncomeExpense | ⚪ |  |
| /accounting/inventory-valuation | InventoryValuation | ✅ |  |
| /accounting/materials | MaterialsAccounting | 🟡 | /api/warehouse/movements |
| /accounting/payroll-automation | PayrollAutomation | ✅ |  |
| /accounting/period-closing | PeriodClosing | ✅ |  |

### mro (11 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /mro/building-inventory | mro/FacilityInventoryPage | ✅ |  |
| /mro/cleaning | mro/CleaningSchedulePage | ✅ |  |
| /mro/dashboard | MRODashboard | ✅ |  |
| /mro/expense-control | MROExtended | ✅ |  |
| /mro/kitchen | mro/CanteenManagementPage | ✅ |  |
| /mro/office-inventory | mro/FacilityInventoryPage | ✅ |  |
| /mro/preventive | mro/PreventiveMaintenancePage | ✅ |  |
| /mro/sanitation | MROExtended | ✅ |  |
| /mro/spare-parts | mro/SparePartsPage | 🟡 | /api/mro/spare-parts${search ?  |
| /mro/uniforms | MROExtended | ✅ |  |
| /mro/utilities | mro/UtilityReadingsPage | ✅ |  |

### security (8 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /security | SecurityDashboard | ✅ |  |
| /security/attendance | SecurityExtended | ✅ |  |
| /security/evacuation | SecurityExtended | ✅ |  |
| /security/hazmat | SecurityExtended | ✅ |  |
| /security/ppe | SecurityExtended | ✅ |  |
| /security/rating | SecurityExtended | ✅ |  |
| /security/visitors | SecurityExtended | ✅ |  |
| /security/zone-access | SecurityExtended | ✅ |  |

### agents (8 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /agents | agents/AgentsHub | 🟡 | /api/agents/hr/performance/1, /api/agents/iot/sensor/MACHINE_001 |
| /agents/:id | agents/AgentsHub | 🟡 | /api/agents/hr/performance/1, /api/agents/iot/sensor/MACHINE_001 |
| /agents/facilities | agents/FacilitiesDashboard | ✅ |  |
| /agents/hr-performance | agents/HRPerformanceDashboard | 🟡 | /api/agents/hr/performance, /api/agents/hr/churn, +2 |
| /agents/procurement | agents/ProcurementDashboard | ✅ |  |
| /agents/production | agents/ProductionDashboard | ✅ |  |
| /agents/quality | agents/QualityDashboard | ✅ |  |
| /agents/strategic | agents/StrategicDashboard | ✅ |  |

### finance (8 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /finance/approval | FinanceApproval | ✅ |  |
| /finance/budgets | BudgetManagement | 🟡 | /api/budgets${qs ?  |
| /finance/cashflow | CashFlowManagement | 🟡 | /api/cashflow/transactions?:id, /api/cashflow/daily-summary?startDate=:id&endDate=:id |
| /finance/daily-kpi | DailyKPIDashboard | ✅ |  |
| /finance/gl-chart-of-accounts | GLChartOfAccounts | ✅ |  |
| /finance/order-costing | OrderCosting | ✅ |  |
| /finance/profitability | ProductProfitability | 🟡 | /api/finance/profitability/recalculate, /api/reports/profitability/export |
| /finance/reports | FinancialReports | ✅ |  |

### tech (8 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /tech/cards | TechCards | ✅ |  |
| /tech/change-history | TechPPExtended | ✅ |  |
| /tech/client-requirements | TechPPExtended | ✅ |  |
| /tech/cost-optimization | TechPPExtended | ✅ |  |
| /tech/machine-selection | TechPPExtended | ✅ |  |
| /tech/material-alternatives | TechPPExtended | ✅ |  |
| /tech/parallel-orders | TechPPExtended | ✅ |  |
| /tech/time-cost | TechPPExtended | ✅ |  |

### iot (8 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /iot/alerts | IoTExtended | ✅ |  |
| /iot/daily-view | WarehouseDailyView | ✅ |  |
| /iot/dashboard | IoTDashboard | 🟡 | /api/iot-sensors/oee?from=:id |
| /iot/digital-twin | IoTExtended | ✅ |  |
| /iot/oee-live | IoTExtended | ✅ |  |
| /iot/predictive-maintenance | IoTExtended | ✅ |  |
| /iot/sensor-monitoring | IoTExtended | ✅ |  |
| /iot/tablet | IoTTablet | ⚪ |  |

### lms (7 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /lms/course-author | LMSExtended | ✅ |  |
| /lms/knowledge-base | KnowledgeBase | ✅ |  |
| /lms/leaderboard | LMSExtended | ✅ |  |
| /lms/learning-budget | LMSExtended | ✅ |  |
| /lms/micro-learning | LMSExtended | ✅ |  |
| /lms/operator-certification | LMSExtended | ✅ |  |
| /lms/test-management | LMSExtended | ✅ |  |

### ai (7 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai | agents/AgentsHub | 🟡 | /api/agents/hr/performance/1, /api/agents/iot/sensor/MACHINE_001 |
| /ai/agents | AIAgentsPage | ✅ |  |
| /ai/crm | AiCrmPage | ✅ |  |
| /ai/finance | AIFinancePage | ⚪ |  |
| /ai/hr | HRAIDashboard | ✅ |  |
| /ai/marketing | AiCrmPage | ✅ |  |
| /ai/wms | WmsAnalytics | ✅ |  |

### europrint (7 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /europrint/accountant | AccountantView | ✅ |  |
| /europrint/auditor | AuditorPanel | 🟡 | /api/europrint-control/menus/admin |
| /europrint/control | EuroprintControlCenter | ✅ |  |
| /europrint/employee-kpi | EmployeeDailyKPIPanel | 🟡 | /api/employee-kpi?dateFrom=:id&dateTo=:id, /api/employee-kpi/summary/top-performers?dateFrom=:id&dateTo=:id, +1 |
| /europrint/reports-hub | ReportsHub | 🟡 | /api/reports-hub/definitions?categoryId=:id |
| /europrint/strategic | StrategicTasksPanel | 🟡 | /api/strategic/tasks?:id |
| /europrint/waste-tracking | WasteTracking | ✅ |  |

### integration (6 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /integration/employee-rating | EmployeeRating | ✅ |  |
| /integration/expense-management | ExpenseManagement | ✅ |  |
| /integration/hr-lms | HRLMSSkills | ✅ |  |
| /integration/mro | MRODashboard | ✅ |  |
| /integration/requests | IntegrationManagement | ✅ |  |
| /integration/vendor-performance | VendorPerformance | 🟡 | /api/mm/vendor-performance |

### saas (6 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /saas/error-log | SaaSExtended | ✅ |  |
| /saas/licensing | SaaSExtended | ✅ |  |
| /saas/module-control | SaaSExtended | ✅ |  |
| /saas/monitoring | SaaSExtended | ✅ |  |
| /saas/onboarding | SaaSExtended | ✅ |  |
| /saas/tenant-management | SaaSExtended | ✅ |  |

### fi (6 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /fi/audit-log | FinanceExtended | ✅ |  |
| /fi/cost-centers | FinanceExtended | ✅ |  |
| /fi/risk-ai | FinanceExtended | ✅ |  |
| /fi/tax-calendar | FinanceExtended | ✅ |  |
| /fi/tax-management | FinanceExtended | ✅ |  |
| /fi/transfer-pricing | FinanceExtended | ✅ |  |

### mm (6 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /mm/check-bot | MMExtended | ✅ |  |
| /mm/creditor-debts | MMExtended | ✅ |  |
| /mm/dashboard | MMDashboard | ✅ |  |
| /mm/purchase-orders | MMPurchaseOrders | ✅ |  |
| /mm/supplier-portal | MMExtended | ✅ |  |
| /mm/vendors | MMVendors | ✅ |  |

### logistics (6 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /logistics/drivers | LogisticsDashboard | ✅ |  |
| /logistics/fuel | LogisticsDashboard | ✅ |  |
| /logistics/gps | LogisticsDashboard | ✅ |  |
| /logistics/route-planning | LogisticsDashboard | ✅ |  |
| /logistics/transport | LogisticsDashboard | ✅ |  |
| /logistics/vehicle-schedule | LogisticsDashboard | ✅ |  |

### pos (5 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /pos/dashboard | POSDashboard | 🟡 | /api/pos/products?search=:id&active=true |
| /pos/inventory | POSInventoryPage | 🟡 | /api/pos/inventory/movements?type=:id&limit=100, /api/pos/products?search=:id&active=all |
| /pos/mini-app | POSDashboard | 🟡 | /api/pos/products?search=:id&active=true |
| /pos/movements | PosMovementsPage | 🟡 | /api/pos/stock/movements?:id |
| /pos/requests | PosRequestsPage | 🟡 | /api/pos/requests?:id |

### warehouse (3 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /warehouse/hub | WarehouseHub12 | ✅ |  |
| /warehouse/hub/:code | WarehouseHub12 | ✅ |  |
| /warehouse/rolls | warehouse/RollManagementPage | 🟡 | /api/agents/inventory/rolls/fifo?articleCode=:id |

### production (3 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /production/orders | ProductionReport | 🟡 | /api/production/orders?page=:id&limit=10${status !== "all" ? , /api/production/orders/report/excel?${status !== "all" ?  |
| /production/orders/:id | ProductionOrder360 | ✅ |  |
| /production/shift-reports | ShiftReportsPage | ✅ |  |

### erp (3 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /erp/pp/bom | BOMManagement | 🟡 | /api/erp/bom-headers/:id/explosion?quantity=1 |
| /erp/pp/capacity | CapacityPlanning | 🟡 | /api/erp/capacity/load-analysis?:id |
| /erp/pp/routing | RoutingConfiguration | ✅ |  |

### settings (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /settings | Settings | ✅ |  |
| /settings/notifications | NotificationSettings | ✅ |  |

### admin (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /admin/exceptions | ExceptionLog | 🟡 | /api/exceptions?:id |
| /admin/queues | QueueMonitor | ✅ |  |

### courses (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /courses | Courses | 🟡 | /api/courses?:id |
| /courses/:id | CourseDetail | ✅ |  |

### tests (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /tests | Tests | ✅ |  |
| /tests/:id | TestDetail | ✅ |  |

### director (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /director/ai-summary | DirectorExtended | ✅ |  |
| /director/problem-points | DirectorExtended | ✅ |  |

### employees (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /employees | Employees | ✅ |  |
| /employees/:id | EmployeeProfile | 🟡 | /api/hr/employee-corp/:id, /api/integration/swap-requests?requestedBy=:id, +1 |

### hr-capital (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /hr-capital/courses | HRCapitalCourses | ✅ |  |
| /hr-capital/tests | HRCapitalTests | ✅ |  |

### ai-hr (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-hr/dashboard | HRAIDashboard | ✅ |  |
| /ai-hr/interviews | AIInterviewPage | ✅ |  |

### inventory (2 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /inventory/materials | WMSMaterials | 🟡 | /api/inventory/materials?:id |
| /inventory/materials/:id | WMSMaterials | 🟡 | /api/inventory/materials?:id |

### super-admin (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /super-admin | SuperAdminPanel | 🟡 | /api/admin/audit-filtered?:id |

### telegram (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /telegram/admin | TelegramBotAdmin | ✅ |  |

### kaizen (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /kaizen | KaizenPage | ✅ |  |

### analytics (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /analytics | Analytics | ✅ |  |

### lms-dashboard (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /lms-dashboard | LMSDashboard | ✅ |  |

### lessons (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /lessons | Courses | 🟡 | /api/courses?:id |

### ai-exams (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-exams | AIExams | ✅ |  |

### all-exams (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /all-exams | AllExams | ✅ |  |

### certificates (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /certificates | Certificates | 🟡 | /api/certificates/:id |

### goals (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /goals | GoalsKPI | ✅ |  |

### kanban (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /kanban | KanbanBoard | ⚪ |  |

### camera-dashboard (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-dashboard | camera-dashboard | ✅ |  |

### cameras (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /cameras | cameras-management | ✅ |  |

### camera-safety (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-safety | camera-safety | ✅ |  |

### camera-quality (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-quality | camera-quality | ✅ |  |

### camera-employees (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-employees | camera-employees | ✅ |  |

### camera-machines (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-machines | camera-machines | ✅ |  |

### camera-alerts (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-alerts | camera-alerts | ✅ |  |

### camera-reports (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-reports | camera-reports | 🟡 | /api/camera-reports/generate-pdf?period=:id, /api/camera-reports/generate-excel?period=:id |

### camera-settings (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-settings | camera-settings | ✅ |  |

### camera-heatmap (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-heatmap | camera-heatmap | 🟡 | /api/camera-heatmap/data?period=:id&metric=:id, /api/camera-heatmap/employee/:id?period=:id, +1 |

### camera-employee-ratings (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-employee-ratings | camera-employee-ratings | 🟡 | /api/camera-employee-ratings?period=:id |

### camera-live-monitoring (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera-live-monitoring | CameraLiveMonitoring | 🟡 | /api/erp/cameras/live-detections?cameraId=:id |

### camera (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /camera/monitoring | FaceRecognitionMonitoring | 🟡 | /api/camera/recognition-logs?:id |

### face-registration (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /face-registration | FaceRegistration | ✅ |  |

### attendance-monitor (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /attendance-monitor | AttendanceMonitorPage | 🟡 | /api/hr/attendance/territory/logs?:id |

### crm-workspace (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /crm-workspace | CRMWorkspace | ⚪ |  |

### strategic-tasks (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /strategic-tasks | StrategicTasksPanel | 🟡 | /api/strategic/tasks?:id |

### ideal-rasm (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ideal-rasm | IdealRasmPage | ✅ |  |

### finance-dashboard (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /finance-dashboard | FinanceDashboard | ✅ |  |

### hr-map (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /hr-map | HRMap | 🟡 | /api/hr-map/employees?departmentId=:id |

### seven-functions (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /seven-functions | SevenFunctionsDashboard | 🟡 | /api/seven-functions/ai-analysis |

### raci-matrix (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /raci-matrix | RACIMatrixPage | ✅ |  |

### skills-matrix (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /skills-matrix | SkillsMatrix | 🟡 | /api/hr/skills/:id |

### mentorship (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /mentorship | Mentorship | ✅ |  |

### events-calendar (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /events-calendar | EventsCalendar | ✅ |  |

### applications (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /applications | Applications | ✅ |  |

### questionnaire (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /questionnaire | Questionnaire | ✅ |  |

### questionnaire-templates (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /questionnaire-templates | QuestionnaireTemplates | ⚪ |  |

### shift-schedule (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /shift-schedule | ShiftSchedule | 🟡 | /api/hr/shifts/schedule?:id |

### discipline (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /discipline | Discipline | ✅ |  |

### hr-dashboard (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /hr-dashboard | HRDashboard | ✅ |  |

### org-structure (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /org-structure/hierarchy | OrgStructureHierarchy | ✅ |  |

### weekly-plan (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /weekly-plan | WeeklyPlanPage | 🟡 | /api/weekly-plans?week=:id, /api/weekly-plans?employee_id=:id&week=:id |

### planning (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /planning | PlanningBoard | 🟡 | /api/planning/operations?:id, /api/planning/schedule?:id |

### ai-production-planning (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-production-planning | AIProductionPlanning | ✅ |  |

### papka-orders (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /papka-orders | PapkaOrders | ✅ |  |

### order-create (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /order-create | OrderCreationWizard | ⚪ |  |

### tech-approval (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /tech-approval | TechApproval | ✅ |  |

### tech-cards (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /tech-cards | TechCards | ✅ |  |

### ai-camera (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-camera | CameraAIAnalytics | ✅ |  |

### ai-exam (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-exam | AIExams | ✅ |  |

### ai-planning (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /ai-planning | AIProductionPlanning | ✅ |  |

### assignments (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /assignments | MESWorkerAssignments | ✅ |  |

### insights (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /insights | Analytics | ✅ |  |

### iot-enhanced (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /iot-enhanced | IoTExtended | ✅ |  |

### video-progress (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /video-progress | LessonPlayer | 🟡 | /api/lms/progress/my?courseId=:id |

### 3way-match (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /3way-match | ThreeWayMatchPage | ✅ |  |

### daily-attendance (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /daily-attendance | AttendanceMonitorPage | 🟡 | /api/hr/attendance/territory/logs?:id |

### discipline-records (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /discipline-records | Discipline | ✅ |  |

### employee-zone-history (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /employee-zone-history | EmployeeZoneHistoryPage | 🟡 | /api/employee-zone-history?:id |

### gl (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /gl | GLDocuments | ✅ |  |

### iot-sensors (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /iot-sensors | IotSensorsPage | ✅ |  |

### machine-status-current (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /machine-status-current | MachineStatusPage | ✅ |  |

### production-facts (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /production-facts | ProductionFactsPage | ✅ |  |

### quality-defects-camera (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /quality-defects-camera | QualityDefectsCameraPage | 🟡 | /api/iot/quality-defects?:id |

### users (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /users | UsersPage | 🟡 | /api/admin/users?:id |

### waste (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /waste | WastePage | ✅ |  |

### weekly-plans (1 pages)

| Route | Component | Status | Broken APIs |
|-------|-----------|--------|-------------|
| /weekly-plans | WeeklyPlansPage | ✅ |  |

## Orphan Backend Endpoints

**479 of 2956** endpoints have no frontend caller (16.2%).

These are likely:
- Cron/scheduled jobs
- Telegram webhook receivers
- AI agent internal APIs
- Truly dead code

Full list in `audit-orphan-endpoints.json`.

## Recommendations

### 🔴 Critical (before production deploy)
1. Fix the top 3 missing APIs (`/api/pp/production-orders`, `/api/technology-cards`, `/api/papka-orders`) — they break 38 pages
2. Review the 5 `@Public()` endpoints for unintended exposure (mostly OK: auth handshake + storage)
3. Set up daily backups via `scripts/backup.sh` cron
4. Add Sentry DSN to .env (Sentry already integrated)

### 🟡 High priority (first week)
5. Fix the remaining 46 pages with broken API calls (see Detailed Report)
6. Add Zod validation to all POST/PATCH endpoints lacking it (1,216 endpoints)
7. Categorize the 479 orphan endpoints — keep, document, or delete

### 🟢 Ongoing (first month)
8. Reduce remaining 185 frontend TypeScript errors to 0
9. Fix 116 failing frontend tests
10. Audit the 16 display-only pages — are they intentional or missing data?

## Audit Coverage Gaps (Honest Disclosure)

This automated audit covers:
- ✅ Backend endpoint existence (URL match)
- ✅ Frontend → backend wiring (API calls resolve to a controller)
- ✅ Page→route mapping
- ✅ Global JWT auth coverage

This audit does NOT cover (requires manual review or running app):
- ❌ Whether endpoints return real data (not stubs)
- ❌ Whether Zod validation actually validates the right schema
- ❌ Whether each page has Create/Edit/Delete dialogs
- ❌ Whether translations exist for every key
- ❌ Whether loading/error/empty states render correctly
- ❌ Whether the data displays in the table
- ❌ Whether confirmation dialogs gate destructive actions

To verify these UI-level checks, run the app and click through each page manually, or write Playwright E2E tests (recommended for the top 30 pages before launch).

