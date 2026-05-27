# O'lik Fayllar — To'liq Ro'yxat

> Audit sanasi: 2026-05-27
> Metodologiya: controller/service uchun — module.ts controllers[]/providers[] ro'yxatiga kirmaganlar;
> frontend sahifalar uchun — routes/ papkasidan lazy import qilinmaganlar (sub-komponent va test fayllar alohida).

## Umumiy Ko'rsatkichlar

| Kategoriya | Soni |
| --- | --- |
| Module.ts'ga ulanmagan controllerlar | 36 |
| Module.ts'ga ulanmagan servicelar | 63 |
| Route'ga ulanmagan frontend sahifalar (asosiy) | 135 |
| index.ts'ga kirmagan shared DB schema fayllar | 47 |
| Backend spec fayllar (barchasi 7+ test, bo'sh yo'q) | 26 |

## 1. Module.ts'ga Ulanmagan Controllerlar

Bu controllerlar `.controller.ts` faylida mavjud, lekin hech bir `*.module.ts` faylining `controllers: []` ro'yxatiga kirmagan — NestJS ularga route bermaydi.

| Class nomi | Fayl yo'li | Izoh |
| --- | --- | --- |
| `AdminAuthController` | `apps/api/src/modules/general/controllers/admin-auth.controller.ts` | Duplikat — legacy/da ham bor |
| `AdminAuthController` | `apps/api/src/modules/legacy/controllers/admin-auth.controller.ts` | Duplikat — general/da ham bor |
| `ApplicationResponsesController` | `apps/api/src/modules/hr/applications/application-responses.controller.ts` | HR module.ts'da yo'q |
| `ApplicationsController` | `apps/api/src/modules/hr/applications/applications.controller.ts` | HR module.ts'da yo'q |
| `AttendanceFaceController` | `apps/api/src/modules/hr/attendance/attendance-face.controller.ts` | Ro'yxatga olinmagan |
| `DepartmentsPositionsCompatController` | `apps/api/src/modules/compatibility/departments-positions-compat.controller.ts` | compatibility.module.ts'da yo'q |
| `EmployeesForFaceController` | `apps/api/src/modules/hr/presentation/employees-for-face.controller.ts` | Ro'yxatga olinmagan |
| `Feedback360Controller` | `apps/api/src/modules/hr/feedback-360/feedback-360.controller.ts` | Ro'yxatga olinmagan |
| `HrAssetsController` | `apps/api/src/modules/hr/hr-assets/hr-assets.controller.ts` | Ro'yxatga olinmagan |
| `HrAttendanceController` | `apps/api/src/modules/hr/presentation/hr-attendance.controller.ts` | Ro'yxatga olinmagan |
| `HrCompatAController` | `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts` | Ro'yxatga olinmagan |
| `HrCompatSafetyController` | `apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts` | Ro'yxatga olinmagan |
| `HrDashboardController` | `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts` | Ro'yxatga olinmagan |
| `HrDashboardExtraController` | `apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts` | Ro'yxatga olinmagan |
| `HrDashboardStubsController` | `apps/api/src/modules/hr/presentation/hr-dashboard-stubs.controller.ts` | Ro'yxatga olinmagan |
| `HrDashboardStubsWriteController` | `apps/api/src/modules/hr/presentation/hr-dashboard-stubs-write.controller.ts` | Ro'yxatga olinmagan |
| `HrEmployeeGoalsController` | `apps/api/src/modules/hr/presentation/hr-employee-goals.controller.ts` | Ro'yxatga olinmagan |
| `HrEmployeesController` | `apps/api/src/modules/hr/presentation/hr-employees.controller.ts` | Ro'yxatga olinmagan |
| `HrEmployeesExtController` | `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts` | Ro'yxatga olinmagan |
| `HrGsdController` | `apps/api/src/modules/hr/presentation/hr-gsd.controller.ts` | Ro'yxatga olinmagan |
| `HrLeaveAccrualController` | `apps/api/src/modules/hr/leave/hr-leave-accrual.controller.ts` | Ro'yxatga olinmagan |
| `HrLeaveController` | `apps/api/src/modules/hr/presentation/hr-leave.controller.ts` | Ro'yxatga olinmagan |
| `HrOffboardingController` | `apps/api/src/modules/hr/offboarding/hr-offboarding.controller.ts` | Ro'yxatga olinmagan |
| `HrPayrollClosureController` | `apps/api/src/modules/hr/payroll/hr-payroll-closure.controller.ts` | Ro'yxatga olinmagan |
| `HrPayrollController` | `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts` | Ro'yxatga olinmagan |
| `HrSafetyController` | `apps/api/src/modules/hr/safety/hr-safety.controller.ts` | Ro'yxatga olinmagan |
| `HrShiftsCompatController` | `apps/api/src/modules/hr/presentation/hr-shifts-compat.controller.ts` | Ro'yxatga olinmagan |
| `HrVacanciesAnalyticsController` | `apps/api/src/modules/hr/recruitment/hr-vacancies-analytics.controller.ts` | Ro'yxatga olinmagan |
| `HrVacanciesController` | `apps/api/src/modules/hr/recruitment/hr-vacancies.controller.ts` | Ro'yxatga olinmagan |
| `HrVacanciesPipelineController` | `apps/api/src/modules/hr/recruitment/hr-vacancies-pipeline.controller.ts` | Ro'yxatga olinmagan |
| `HrVacanciesProbationController` | `apps/api/src/modules/hr/recruitment/hr-vacancies-probation.controller.ts` | Ro'yxatga olinmagan |
| `OnboardingController` | `apps/api/src/modules/hr/onboarding/onboarding.controller.ts` | Ro'yxatga olinmagan |
| `PosController` | `apps/api/src/modules/pos/presentation/pos.controller.ts` | pos.module.ts'da yo'q |
| `RecruitmentController` | `apps/api/src/modules/hr/recruitment/recruitment.controller.ts` | Ro'yxatga olinmagan |
| `RecruitmentOffersController` | `apps/api/src/modules/hr/recruitment/recruitment-offers.controller.ts` | Ro'yxatga olinmagan |
| `ValidateController` | `apps/api/src/modules/common/presentation/validate.controller.ts` | common module.ts yo'q |

**Jami: 36 ta controller**

> Diqqat: HR moduli eng ko'p muammo — 28 ta dead controller shu modulda.

## 2. Module.ts'ga Ulanmagan Servicelar

Bu servicelar `providers: []` ro'yxatiga kirmagan — DI container ularga inject qila olmaydi.

| Class nomi | Fayl yo'li |
| --- | --- |
| `AbcXyzService` | `apps/api/src/modules/wms/analytics/abc-xyz.service.ts` |
| `AlertsService` | `apps/api/src/modules/notifications/alerts/alerts.service.ts` |
| `ApplicationsService` | `apps/api/src/modules/hr/applications/applications.service.ts` |
| `ApprovalsService` | `apps/api/src/modules/director/approvals/approvals.service.ts` |
| `AttritionService` | `apps/api/src/modules/hr/analytics/attrition.service.ts` |
| `BarcodeWarehouseQueriesService` | `apps/api/src/modules/compatibility/barcode-warehouse-queries.service.ts` |
| `BehavioralAnalyzerService` | `apps/api/src/modules/hr/ai-interview-v2/behavioral-analyzer.service.ts` |
| `CameraService` | `apps/api/src/modules/camera/camera.service.ts` |
| `CostingService` | `apps/api/src/modules/pp/domain/services/costing.service.ts` |
| `CrmLeadsOpsService` | `apps/api/src/modules/crm/application/crm-leads-ops.service.ts` |
| `DepartmentsService` | `apps/api/src/modules/core/departments/departments.service.ts` |
| `DepreciationService` | `apps/api/src/modules/finance/domain/services/depreciation.service.ts` |
| `DocumentWorkflowV2DecisionsService` | `apps/api/src/modules/compatibility/document-workflow-v2-decisions.service.ts` |
| `EmailNotificationService` | `apps/api/src/modules/notifications/domain/services/email-notification.service.ts` |
| `EmployeeMonthlyCardService` | `apps/api/src/modules/hr/employees/employee-monthly-card.service.ts` |
| `EmployeesService` | `apps/api/src/modules/hr/employees/employees.service.ts` |
| `FaceRecognitionService` | `apps/api/src/modules/hr/attendance/face-recognition.service.ts` |
| `Feedback360Service` | `apps/api/src/modules/hr/feedback-360/feedback-360.service.ts` |
| `FuzzySearchService` | `apps/api/src/modules/common/search/fuzzy-search.service.ts` |
| `HrAssetsSchemaService` | `apps/api/src/modules/hr/hr-assets/hr-assets-schema.service.ts` |
| `HrAssetsService` | `apps/api/src/modules/hr/hr-assets/hr-assets.service.ts` |
| `HrAttendanceService` | `apps/api/src/modules/hr/application/hr-attendance.service.ts` |
| `HrCompatAService` | `apps/api/src/modules/hr/application/hr-compat-a.service.ts` |
| `HrCompatSafetyService` | `apps/api/src/modules/hr/application/hr-compat-safety.service.ts` |
| `HrDashboardExtraService` | `apps/api/src/modules/hr/application/hr-dashboard-extra.service.ts` |
| `HrDashboardService` | `apps/api/src/modules/hr/application/hr-dashboard.service.ts` |
| `HrEmployeesExtService` | `apps/api/src/modules/hr/application/hr-employees-ext.service.ts` |
| `HrGsdService` | `apps/api/src/modules/hr/presentation/hr-gsd.service.ts` |
| `HrOffboardingService` | `apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts` |
| `HrSafetyService` | `apps/api/src/modules/hr/safety/hr-safety.service.ts` |
| `HrVacanciesService` | `apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts` |
| `InterviewLinkService` | `apps/api/src/modules/hr/ai-interview-v2/interview-link.service.ts` |
| `InventoryTurnoverService` | `apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts` |
| `InvestmentService` | `apps/api/src/modules/finance/domain/services/investment.service.ts` |
| `KpiService` | `apps/api/src/modules/hr/domain/services/kpi.service.ts` |
| `LateArrivalService` | `apps/api/src/modules/hr/attendance/late-arrival.service.ts` |
| `LeaveAccrualJobService` | `apps/api/src/modules/hr/leave/leave-accrual-job.service.ts` |
| `LeaveAccrualService` | `apps/api/src/modules/hr/leave/leave-accrual.service.ts` |
| `LeaveService` | `apps/api/src/modules/hr/leave/leave.service.ts` |
| `LibraryService` | `apps/api/src/modules/design/library/library.service.ts` |
| `MroInventoryService` | `apps/api/src/modules/mro/inventory/mro-inventory.service.ts` |
| `OeeCalculatorService` | `apps/api/src/modules/iot/oee/oee-calculator.service.ts` |
| `OffboardingWorkflowService` | `apps/api/src/modules/hr/offboarding/offboarding-workflow.service.ts` |
| `OnboardingJobService` | `apps/api/src/modules/hr/onboarding/onboarding-job.service.ts` |
| `OnboardingProgressService` | `apps/api/src/modules/hr/onboarding/onboarding-progress.service.ts` |
| `OnboardingService` | `apps/api/src/modules/hr/onboarding/onboarding.service.ts` |
| `OperationsService` | `apps/api/src/modules/mes/operations/operations.service.ts` |
| `OvertimeCalculatorService` | `apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts` |
| `PayrollClosureService` | `apps/api/src/modules/hr/payroll/payroll-closure.service.ts` |
| `PositionPermissionsService` | `apps/api/src/modules/admin/position-permissions/position-permissions.service.ts` |
| `PositionsService` | `apps/api/src/modules/core/positions/positions.service.ts` |
| `RecruitmentAssessmentService` | `apps/api/src/modules/hr/recruitment/recruitment-assessment.service.ts` |
| `RecruitmentFunnelService` | `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts` |
| `RecruitmentService` | `apps/api/src/modules/hr/recruitment/recruitment.service.ts` |
| `RecruitmentStatsService` | `apps/api/src/modules/hr/recruitment/recruitment-stats.service.ts` |
| `RopService` | `apps/api/src/modules/wms/domain/services/rop.service.ts` |
| `RoutesService` | `apps/api/src/modules/logistics/routes/routes.service.ts` |
| `SensorsService` | `apps/api/src/modules/iot/sensors/sensors.service.ts` |
| `Sprint3MigrationService` | `apps/api/src/modules/common/services/sprint3-migration.service.ts` |
| `TaxCalculatorService` | `apps/api/src/modules/hr/domain/services/tax-calculator.service.ts` |
| `TerritoryLogService` | `apps/api/src/modules/hr/attendance/territory-log.service.ts` |
| `UtilizationService` | `apps/api/src/modules/hr/analytics/utilization.service.ts` |
| `VendorsService` | `apps/api/src/modules/mm/vendors/vendors.service.ts` |

**Jami: 63 ta service**

> HR moduli: 30+ dead service (recruitment, attendance, leave, offboarding, payroll).
> WMS, Finance, Common modullarida ham alohida domain service'lar inject qilinmagan.

## 3. Route'ga Ulanmagan Frontend Sahifalar

Bu `.tsx` fayllar `src/pages/` ichida bor, lekin `src/routes/` papkasidagi hech bir route faylida `lazy(() => import(...))` bilan chaqirilmagan.

**Statistika:**
- Jami `pages/` fayllar: 1,265
- Route'ga ulangan: 319
- Route'ga ulanmagan: 946
  - Smoke test fayllar (`.smoke.test`, `__tests__/`): ~317 — route shart emas
  - Sub-komponent fayllar (Sections, Dialogs, Cards va h.k.): ~370 — parent bilan yuklanadi
  - Haqiqatan dead (standalone, lekin route yo'q): **~136**

### 3a. Haqiqatan Dead Standalone Sahifalar

| Sahifa fayli | Izoh |
| --- | --- |
| `AIFinancePageSections2` | Route yo'q |
| `AIInterviewPublicPage` | Route yo'q |
| `AIInterviewPublicPageInterview` | Route yo'q |
| `AIProductionPlanningChart` | Route yo'q |
| `AiCrmPageSections2` | Route yo'q |
| `AttendanceMonitorPageChart` | Route yo'q |
| `CRMSettingsPlaceholders` | Settings sub-tab, lekin route yo'q |
| `CVScreeningGuide` | Route yo'q |
| `CandidateReportDialogSections2` | Route yo'q |
| `DesignExtendedSectionsMore` | Route yo'q |
| `DesignGenerator` | Route yo'q |
| `DesignOrderChat` | Route yo'q |
| `DocumentRoutingAdmin` | Route yo'q |
| `EmployeeStats` | Route yo'q |
| `FIDashboard` | Route yo'q |
| `FIFinance` | Route yo'q |
| `FaceRegistrationCamera` | Route yo'q |
| `HRBrandPageTabsA` | Route yo'q |
| `HRBrandPageTabsB` | Route yo'q |
| `HRCapitalPublicTest` | Route yo'q |
| `HRExtended` | Route yo'q |
| `HROffboardingInterview` | Route yo'q |
| `HRQuestionBankAdmin` | Route yo'q |
| `LessonPlayerSectionsA` | Route yo'q |
| `LessonPlayerSectionsB` | Route yo'q |
| `Login` | Auth sahifasi — App.tsx da to'g'ridan chaqirilishi kerak |
| `MESDashboard` | Eski dashboard versiyasi |
| `MESExtendedTabsA` | Route yo'q |
| `MESExtendedTabsB` | Route yo'q |
| `MESExtendedTabsC` | Route yo'q |
| `MESExtendedTabsD` | Route yo'q |
| `MMVendorsFormFields` | Route yo'q |
| `MRODashboardSections2` | Route yo'q |
| `MROExtendedTabsA` | Route yo'q |
| `MROExtendedTabsB` | Route yo'q |
| `MaterialBalanceTables` | Route yo'q |
| `MockupShowcase` | Dev-only mockup, production'ga kirmasin |
| `OTPVerify` | Auth sahifasi — App.tsx da to'g'ridan chaqirilishi kerak |
| `POSInventoryPageChart` | Route yo'q |
| `PhoneScriptSheet` | Route yo'q |
| `PositionFolderPage` | Route yo'q |
| `ProductionOrder360Bom` | Route yo'q |
| `ProductionOrder360Cost` | Route yo'q |
| `ProductionOrder360Equipment` | Route yo'q |
| `ProductionOrder360Quality` | Route yo'q |
| `ProductionOrder360Shifts` | Route yo'q |
| `ProductionOrder360TimeAnalysis` | Route yo'q |
| `ProductionOrder360Timeline` | Route yo'q |
| `ProductivityInterviewDialogStep1` | Route yo'q |
| `ProductivityInterviewDialogStep2` | Route yo'q |
| `ProductivityInterviewDialogStep3` | Route yo'q |
| `ProductivityInterviewDialogStep4` | Route yo'q |
| `QCDashboardAttention` | Route yo'q |
| `RecruiterKPIPageAnalytics` | Route yo'q |
| `RecruiterKPIPageTables` | Route yo'q |
| `RecruitingKanbanSectionsA` | Route yo'q |
| `RecruitingKanbanSectionsB` | Route yo'q |
| `ReportsHubSectionsA` | Route yo'q |
| `ReportsHubSectionsB` | Route yo'q |
| `SDExtendedSections2` | Route yo'q |
| `SDQuotationDetailSheet` | Route yo'q |
| `SDQuotationFormFields` | Route yo'q |
| `SDSalesManagementSectionsA` | Route yo'q |
| `SDSalesManagementSectionsB` | Route yo'q |
| `SaaSExtendedSectionsA` | Route yo'q |
| `SaaSExtendedSectionsB` | Route yo'q |
| `SecurityDashboardManagement` | Route yo'q |
| `SecurityExtendedSectionsA` | Route yo'q |
| `SecurityExtendedSectionsB` | Route yo'q |
| `SecurityExtendedSectionsC` | Route yo'q |
| `SettingsTabContact` | Settings sub-tab, lekin route yo'q |
| `SettingsTabExam` | Settings sub-tab, lekin route yo'q |
| `SettingsTabGeneral` | Settings sub-tab, lekin route yo'q |
| `SettingsTabGpt` | Settings sub-tab, lekin route yo'q |
| `SettingsTabGuidelines` | Settings sub-tab, lekin route yo'q |
| `SettingsTabTax` | Settings sub-tab, lekin route yo'q |
| `TechCardsLists` | Route yo'q |
| `WMSDashboardAlerts` | Route yo'q |
| `WMSExtendedSections2` | Route yo'q |
| `WarehouseDashboard` | Eski dashboard versiyasi |
| `WarehouseHub` | Eski dashboard versiyasi |
| `WarehouseIntegrationsSections2` | Route yo'q |
| `WarehouseRentalSettings` | Settings sub-tab, lekin route yo'q |
| `accountant/AuditConsole` | `accountant/` papkasida |
| `accountant/ErpRoadmapPhase1` | `accountant/` papkasida |
| `accountant/ErpRoadmapPhase2` | `accountant/` papkasida |
| `accountant/ErpRoadmapPhase3` | `accountant/` papkasida |
| `accountant/ErpRoadmapPhase4_5` | `accountant/` papkasida |
| `analytics/RemainingTabsA` | `analytics/` papkasida |
| `analytics/RemainingTabsB` | `analytics/` papkasida |
| `analytics/RemainingTabsHr` | `analytics/` papkasida |
| `analytics/RemainingTabsUsers` | `analytics/` papkasida |
| `analytics/SystemTabSectionsMore` | `analytics/` papkasida |
| `camera-alerts-sections` | Route yo'q |
| `camera-dashboard-feeds` | Route yo'q |
| `camera-dashboard-grids` | Route yo'q |
| `camera-dashboard-panels` | Route yo'q |
| `camera-heatmap-controls` | Route yo'q |
| `camera-heatmap-employee` | Route yo'q |
| `camera-heatmap-general` | Route yo'q |
| `camera-heatmap-sections` | Route yo'q |
| `camera-heatmap-zone` | Route yo'q |
| `camera-reports-tabs` | Route yo'q |
| `camera-reports-tabs-extra` | Route yo'q |
| `cameras-management-dialogs` | Route yo'q |
| `cameras-management-sections` | Route yo'q |
| `crm/DetailSheet` | `crm/` papkasida |
| `crm/DetailSheetCustomer360` | `crm/` papkasida |
| `crm/DetailSheetProposals` | `crm/` papkasida |
| `daily-kpi/WeeklyTrendChart` | `daily-kpi/` papkasida |
| `employee-profile/AttendanceTabCalendar` | `employee-profile/` papkasida |
| `employee-profile/DocumentsTabSectionsA` | `employee-profile/` papkasida |
| `employee-profile/DocumentsTabSectionsB` | `employee-profile/` papkasida |
| `employee-profile/DocumentsTabSectionsC` | `employee-profile/` papkasida |
| `employee-profile/FinanceTabDialogsBF` | `employee-profile/` papkasida |
| `employee-profile/FinanceTabDialogsOA` | `employee-profile/` papkasida |
| `employee-profile/FinanceTabRecordLists` | `employee-profile/` papkasida |
| `employee-profile/MachineOperatorTabExtras` | `employee-profile/` papkasida |
| `employee-profile/RemainingTabsDiscipline` | `employee-profile/` papkasida |
| `employee-profile/RemainingTabsDisciplineExtras` | `employee-profile/` papkasida |
| `employee-profile/RemainingTabsLearning` | `employee-profile/` papkasida |
| `employee-profile/RemainingTabsLearningExtras` | `employee-profile/` papkasida |
| `employee-profile/WorkTabTables` | `employee-profile/` papkasida |
| `iot/IoTCompletionReport` | `iot/` papkasida |
| `iot/IoTProductionDashboard` | `iot/` papkasida |
| `kanban/TaskDetailSheet` | `kanban/` papkasida |
| `kanban/TimeTrackingWidget` | `kanban/` papkasida |
| `kanban/detail/MainTabContentExtras` | `kanban/` papkasida |
| `mini-app/TelegramMiniApp` | `mini-app/` papkasida |
| `org-chart/OrgChartSearchBar` | `org-chart/` papkasida |
| `org-chart/OrgChartTreeNode` | `org-chart/` papkasida |
| `planning/PlanningDialogsA` | `planning/` papkasida |
| `planning/PlanningDialogsB` | `planning/` papkasida |
| `qc/QCCertificateGenerator` | `qc/` papkasida |
| `warehouse/BinsTabView360` | `warehouse/` papkasida |

**Jami: 135 ta standalone dead sahifa**

## 4. Foydalanilmagan Shared DB Schema Fayllar

Bu schema fayllar `apps/api/src/shared/db/` ichida mavjud, lekin `index.ts` orqali re-export qilinmagan — hech qaysi modul ularga import orqali yetib borolmaydi.

| Schema fayli | Yo'l |
| --- | --- |
| `schema-business-a-1.ts` | `apps/api/src/shared/db/schema-business-a-1.ts` |
| `schema-business-a-2.ts` | `apps/api/src/shared/db/schema-business-a-2.ts` |
| `schema-business-a-2-mro.ts` | `apps/api/src/shared/db/schema-business-a-2-mro.ts` |
| `schema-business-b-1.ts` | `apps/api/src/shared/db/schema-business-b-1.ts` |
| `schema-business-b-2.ts` | `apps/api/src/shared/db/schema-business-b-2.ts` |
| `schema-business-c-1.ts` | `apps/api/src/shared/db/schema-business-c-1.ts` |
| `schema-business-c-2.ts` | `apps/api/src/shared/db/schema-business-c-2.ts` |
| `schema-business-c-2-hr-payroll.ts` | `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` |
| `schema-business-c-2-hr-safety.ts` | `apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` |
| `schema-business-c-2-misc.ts` | `apps/api/src/shared/db/schema-business-c-2-misc.ts` |
| `schema-business-c-3.ts` | `apps/api/src/shared/db/schema-business-c-3.ts` |
| `schema-compat.ts` | `apps/api/src/shared/db/schema-compat.ts` |
| `schema-compat-1a.ts` | `apps/api/src/shared/db/schema-compat-1a.ts` |
| `schema-compat-1b.ts` | `apps/api/src/shared/db/schema-compat-1b.ts` |
| `schema-compat-helpers.ts` | `apps/api/src/shared/db/schema-compat-helpers.ts` |
| `schema-compat-zod.ts` | `apps/api/src/shared/db/schema-compat-zod.ts` |
| `schema-core.ts` | `apps/api/src/shared/db/schema-core.ts` |
| `schema-db-only-generated.ts` | `apps/api/src/shared/db/schema-db-only-generated.ts` |
| `schema-enums.ts` | `apps/api/src/shared/db/schema-enums.ts` |
| `schema-ext-a-1.ts` | `apps/api/src/shared/db/schema-ext-a-1.ts` |
| `schema-ext-a-2.ts` | `apps/api/src/shared/db/schema-ext-a-2.ts` |
| `schema-ext-a-3.ts` | `apps/api/src/shared/db/schema-ext-a-3.ts` |
| `schema-ext-b-1.ts` | `apps/api/src/shared/db/schema-ext-b-1.ts` |
| `schema-ext-b-2.ts` | `apps/api/src/shared/db/schema-ext-b-2.ts` |
| `schema-ext-b-3.ts` | `apps/api/src/shared/db/schema-ext-b-3.ts` |
| `schema-ext-c-1.ts` | `apps/api/src/shared/db/schema-ext-c-1.ts` |
| `schema-ext-c-2.ts` | `apps/api/src/shared/db/schema-ext-c-2.ts` |
| `schema-ext-c-3.ts` | `apps/api/src/shared/db/schema-ext-c-3.ts` |
| `schema-finance.ts` | `apps/api/src/shared/db/schema-finance.ts` |
| `schema-finance-budgets.ts` | `apps/api/src/shared/db/schema-finance-budgets.ts` |
| `schema-finance-extended.ts` | `apps/api/src/shared/db/schema-finance-extended.ts` |
| `schema-finance-invoicing.ts` | `apps/api/src/shared/db/schema-finance-invoicing.ts` |
| `schema-finance-reports.ts` | `apps/api/src/shared/db/schema-finance-reports.ts` |
| `schema-hr-lms.ts` | `apps/api/src/shared/db/schema-hr-lms.ts` |
| `schema-manufacturing.ts` | `apps/api/src/shared/db/schema-manufacturing.ts` |
| `schema-marketing-ext.ts` | `apps/api/src/shared/db/schema-marketing-ext.ts` |
| `schema-misc.ts` | `apps/api/src/shared/db/schema-misc.ts` |
| `schema-misc-app.ts` | `apps/api/src/shared/db/schema-misc-app.ts` |
| `schema-misc-app-b.ts` | `apps/api/src/shared/db/schema-misc-app-b.ts` |
| `schema-misc-iot.ts` | `apps/api/src/shared/db/schema-misc-iot.ts` |
| `schema-misc-qc.ts` | `apps/api/src/shared/db/schema-misc-qc.ts` |
| `schema-order-workflow.ts` | `apps/api/src/shared/db/schema-order-workflow.ts` |
| `schema-pos-ext.ts` | `apps/api/src/shared/db/schema-pos-ext.ts` |
| `schema-pos-retail.ts` | `apps/api/src/shared/db/schema-pos-retail.ts` |
| `schema-rbac.ts` | `apps/api/src/shared/db/schema-rbac.ts` |
| `schema-sprint3.ts` | `apps/api/src/shared/db/schema-sprint3.ts` |
| `schema-wms.ts` | `apps/api/src/shared/db/schema-wms.ts` |

**Jami: 47 ta schema fayli index.ts'dan tashqarida**

> Bu fayllar ehtimol eski draft yoki refactoring qoldiqlari. `schema-business-*`, `schema-ext-*` seriyalari — katta `schema-business.ts`'ga birlashtirish uchun bo'lingan lekin qoldirilgan nusxalar.

## 5. Modul Bo'yicha Fayl Statistikasi

| Modul | Jami .ts | Controller | Service | Spec | Module.ts |
| --- | --- | --- | --- | --- | --- |
| `hr` | 283 | 40 | 65 | 2 | 12 |
| `pos` | 154 | 21 | 52 | 0 | 1 |
| `crm` | 152 | 15 | 27 | 11 | 1 |
| `finance` | 151 | 31 | 31 | 0 | 2 |
| `compatibility` | 115 | 30 | 39 | 0 | 1 |
| `pp` | 94 | 10 | 21 | 0 | 1 |
| `wms` | 93 | 22 | 22 | 1 | 1 |
| `ai` | 88 | 15 | 25 | 6 | 1 |
| `sd` | 81 | 10 | 9 | 1 | 1 |
| `director` | 81 | 12 | 13 | 1 | 1 |
| `qc` | 71 | 9 | 13 | 0 | 1 |
| `iot` | 59 | 12 | 10 | 0 | 1 |
| `mm` | 55 | 7 | 7 | 0 | 1 |
| `aisha` | 55 | 3 | 6 | 0 | 1 |
| `lms` | 52 | 11 | 11 | 0 | 1 |
| `kanban` | 52 | 8 | 6 | 0 | 1 |
| `remaining` | 49 | 12 | 12 | 0 | 1 |
| `mes` | 46 | 5 | 6 | 0 | 1 |
| `auth` | 42 | 3 | 7 | 0 | 1 |
| `notifications` | 39 | 1 | 7 | 0 | 1 |
| `communication-center` | 34 | 6 | 10 | 0 | 1 |
| `chat` | 33 | 6 | 10 | 1 | 1 |
| `marketing` | 28 | 4 | 3 | 0 | 1 |
| `admin` | 28 | 5 | 7 | 0 | 1 |
| `shared` | 26 | 0 | 2 | 0 | 2 |
| `security` | 26 | 2 | 3 | 1 | 1 |
| `logistics` | 26 | 1 | 5 | 0 | 1 |
| `design` | 26 | 2 | 3 | 0 | 1 |
| `pos-v2` | 24 | 4 | 0 | 0 | 1 |
| `mro` | 21 | 1 | 2 | 0 | 1 |
| `agents` | 19 | 1 | 17 | 0 | 1 |
| `order-workflow` | 16 | 1 | 0 | 0 | 1 |
| `integration` | 16 | 5 | 3 | 0 | 1 |
| `erp` | 15 | 4 | 4 | 1 | 1 |
| `ecommerce` | 15 | 6 | 2 | 1 | 1 |
| `core` | 13 | 1 | 2 | 0 | 1 |
| `bot-gateway` | 13 | 1 | 0 | 0 | 1 |
| `org-structure` | 12 | 1 | 3 | 0 | 1 |
| `queue` | 11 | 0 | 1 | 0 | 1 |
| `general` | 11 | 3 | 2 | 0 | 1 |
| `ai-agents` | 11 | 1 | 8 | 0 | 1 |
| `legacy` | 5 | 3 | 2 | 0 | 0 ⚠️ module.ts yo'q |
| `common` | 5 | 1 | 4 | 0 | 0 ⚠️ module.ts yo'q |
| `export` | 4 | 1 | 1 | 0 | 1 |
| `storage` | 2 | 1 | 0 | 0 | 1 |
| `hr-assets` | 2 | 0 | 2 | 0 | 0 ⚠️ module.ts yo'q |
| `applications` | 2 | 0 | 1 | 0 | 0 ⚠️ module.ts yo'q |
| `fi` | 1 | 0 | 1 | 0 | 0 ⚠️ module.ts yo'q |
| `feedback-360` | 1 | 0 | 1 | 0 | 0 ⚠️ module.ts yo'q |
| `camera` | 1 | 0 | 1 | 0 | 0 ⚠️ module.ts yo'q |

> `legacy`, `common`, `hr-assets`, `applications`, `fi`, `feedback-360`, `camera` — standalone modullarda `*.module.ts` fayli yo'q.
> `pos` va `finance` — 0 spec fayl bor, bu production risq.

## 6. Xulosa va Tavsiyalar

**Asosiy muammo — HR moduli:** 283 ta .ts fayl, lekin 28 ta controller va 30+ service hech qachon inject qilinmagan. Bu shuni ko'rsatadiki, HR'ning katta qismi (recruitment, attendance, onboarding, offboarding, payroll, safety) yozilgan lekin NestJS'ga ulangan emas.

**Frontend sahifalar:** 1,265 fayldan faqat 319 tasi route'ga ulangan. Sub-komponentlar bundan mustasno bo'lsa ham, 136 ta standalone sahifa hech qaerdan chaqirilmaydi.

**Shared DB schema:** 47 ta schema fayli index.ts'dan tashqarida — bu fayllardan kelgan tablo definitionlari Drizzle migration'larda ham ko'rinmaydi, ya'ni real DB'da mos jadvallar yo'q bo'lishi mumkin.

**Tavsiya:** Har bir dead controller/service uchun tegishli `*.module.ts` ga qo'shish yoki faylni o'chirish. Dead schema fayllarini `index.ts` orqali birlashtirish yoki arxivlash.