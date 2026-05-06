# EuroPrint ERP — TO'LIQ TIZIM AUDITI

**Sana:** 2026-05-04
**Manbalar:** Browser console dump + Backend NestJS audit + DB schema audit + AppRouter.tsx + 10 ta route fayllar
**Maqsad:** 19 modulning HAR BIR SAHIFASI bo'yicha xato va muammolarni ro'yxat qilish

---

## 0. UMUMIY STATISTIKA

| Ko'rsatkich | Soni |
|---|---|
| Asosiy modullar | **19** |
| Qo'shimcha route guruhlari | 5 (LMS_ADMIN, LMS_LEARNER, KAIZEN, ORDERS_REGISTRY, ARCHITECTURE_GAP) |
| Stub yo'llar | 70+ |
| Redirect aliaslar | 50+ |
| **Jami unique route'lar** | **~480** |
| Sahifa fayllari (`src/pages/`) | 339+ |
| Backend NestJS controllers | ~80 |
| Backend modullar (DDD) | 22 |
| **Yo'q endpointlar (404)** | **30+** |
| **Crash bo'layotgan endpointlar (500)** | **50+** |
| **Auth muammolari (401)** | **5-7** |
| **Yo'q DB jadvallari** | **~33** |
| **Frontend React xatolari (TUZATILDI)** | **2** |

---

## 19 ASOSIY MODUL — HAR BIR SAHIFA TO'LIQ

### MODUL 1: ANALYTICS / LMS (16 sahifa)

**Route fayl:** `routes/AnalyticsRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint(lar) | Status |
|---|---|---|---|---|
| 1 | `/analytics` | Analytics.tsx | `/api/analytics/stats`, `/api/analytics/course-progress`, `/api/analytics/test-results` | Tekshirish kerak |
| 2 | `/ai/forecast` | ForecastAnalytics.tsx | `/api/forecast/*` | Tekshirish kerak |
| 3 | `/lms-dashboard` | LMSDashboard.tsx | `/api/analytics/learning-outcomes` | Tekshirish kerak |
| 4 | `/courses` | Courses.tsx | `/api/courses` | Tekshirish kerak |
| 5 | `/courses/:id` | CourseDetail.tsx | `/api/courses/:id` | Tekshirish kerak |
| 6 | `/courses/:id/lessons` | LessonPlayer.tsx | `/api/courses/:id/lessons` | Tekshirish kerak |
| 7 | `/courses/:id/lessons/:lessonId` | LessonPlayer.tsx | `/api/lessons/:id` | Tekshirish kerak |
| 8 | `/tests` | Tests.tsx | `/api/tests` | Tekshirish kerak |
| 9 | `/tests/:id` | TestDetail.tsx | `/api/tests/:id`, `/api/attempts` | Tekshirish kerak |
| 10 | `/ai-exams` | AIExams.tsx | `/api/ai-exam/attempts` | Tekshirish kerak |
| 11 | `/all-exams` | AllExams.tsx | `/api/exams/all` | Tekshirish kerak |
| 12 | `/certificates` | Certificates.tsx | `/api/certificates` | Tekshirish kerak |
| 13 | `/goals` | GoalsKPI.tsx | `/api/goals`, `/api/kpi/*` | Tekshirish kerak |
| 14 | `/knowledge-base` | KnowledgeBase.tsx | `/api/knowledge-base/*` | Tekshirish kerak |
| 15 | `/kanban` | KanbanBoard.tsx | `/api/kanban/tasks` | Tekshirish kerak |
| 16 | `/hr/recruiting-kanban` | RecruitingKanban.tsx | `/api/hr/recruiting/candidates` | Tekshirish kerak |

**Module muammolari:** Browser dump'da to'g'ridan-to'g'ri xato kam, lekin LMS endpointlari 500 error chiqarsa kursni o'rgana olmaydi.

---

### MODUL 2: HR (47 sahifa)

**Route fayl:** `routes/HRRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint(lar) | Status |
|---|---|---|---|---|
| 1 | `/employees` | Employees.tsx | `/api/users`, `/api/employees` | Tekshirish kerak |
| 2 | `/employees/:id` | EmployeeProfile.tsx | `/api/employees/:id` | Tekshirish kerak |
| 3 | `/org-chart` | OrgChartPage.tsx | `/api/departments`, `/api/positions` | Tekshirish kerak |
| 4 | `/adaptation` | Adaptation.tsx | `/api/adaptation/programs`, `/api/adaptation/new-employees`, `/api/adaptation/feedback`, `/api/adaptation/welcome-events` | Tekshirish kerak |
| 5 | `/hr-map` | HRMap.tsx | `/api/hr-map/*` | Tekshirish kerak |
| 6 | `/hr/recruiting` | RecruitingKanban.tsx | `/api/hr/recruiting/*` | Tekshirish kerak |
| 7 | `/seven-functions` | SevenFunctionsDashboard.tsx | `/api/hr/seven-functions` | Tekshirish kerak |
| 8 | `/business-health`, `/raci-matrix` | RACIMatrixPage.tsx | `/api/raci/*` | Tekshirish kerak |
| 9 | `/hr/succession-planning`, `/hr/succession` | HRSuccessionPlanning.tsx | `/api/hr/succession/*` | Tekshirish kerak |
| 10 | `/skills-matrix` | SkillsMatrix.tsx | `/api/skills/*` | Tekshirish kerak |
| 11 | `/mentorship` | Mentorship.tsx | `/api/mentorship/*` | Tekshirish kerak |
| 12 | `/events-calendar` | EventsCalendar.tsx | `/api/events/*` | Tekshirish kerak |
| 13 | `/applications` | Applications.tsx | `/api/applications`, `/api/application-responses` | Tekshirish kerak |
| 14 | `/questionnaire` | Questionnaire.tsx | `/api/questionnaires/*` | Tekshirish kerak |
| 15 | `/questionnaire-templates` | QuestionnaireTemplates.tsx | `/api/questionnaire-templates` | Tekshirish kerak |
| 16 | `/shift-schedule` | ShiftSchedule.tsx | `/api/shifts/*` | Tekshirish kerak |
| 17 | `/discipline` | Discipline.tsx | `/api/discipline/*` | Tekshirish kerak |
| 18 | `/hr-dashboard` | HRDashboard.tsx | `/api/hr/dashboard-stats` | Tekshirish kerak |
| 19 | `/hr-capital/courses` | HRCapitalCourses.tsx | `/api/hr-capital/courses` | Tekshirish kerak |
| 20 | `/hr-capital/tests` | HRCapitalTests.tsx | `/api/hr-capital/tests` | Tekshirish kerak |
| 21 | `/org-structure/hierarchy` | OrgStructureHierarchy.tsx | `/api/org/hierarchy` | Tekshirish kerak |
| 22 | `/org-structure/hierarchy/node/:id` | OrgNodeDetail.tsx | `/api/org/node/:id` | Tekshirish kerak |
| 23 | `/hr/onboarding` | HROnboarding.tsx | `/api/hr/onboarding` | Tekshirish kerak |
| 24 | `/hr/vacation-sick` | HRVacationSick.tsx | `/api/hr/leave-requests` | Tekshirish kerak |
| 25 | `/hr/offboarding` | HROffboarding.tsx | `/api/hr/offboarding` | Tekshirish kerak |
| 26 | `/hr/alumni` | HRAlumni.tsx | `/api/hr/alumni` | Tekshirish kerak |
| 27 | `/hr/health-monitoring` | HRHealthMonitoring.tsx | `/api/hr/health` | Tekshirish kerak |
| 28 | `/hr/conflict` | HRConflict.tsx | `/api/hr/conflict` | Tekshirish kerak |
| 29 | `/hr/career-path` | HRCareerPath.tsx | `/api/hr/career-path` | Tekshirish kerak |
| 30 | `/hr/safety` | HRSafety.tsx | `/api/hr/safety` | Tekshirish kerak |
| 31 | `/hr/gamification` | GamificationPage.tsx | `/api/hr/gamification` | Tekshirish kerak |
| 32 | `/hr/recruiter-kpi` | RecruiterKPIPage.tsx | `/api/hr/recruiter-kpi` | Tekshirish kerak |
| 33 | `/hr/reception` | ReceptionPage.tsx | `/api/hr/reception` | Tekshirish kerak |
| 34 | `/hr/daily-reports` | DailyReportPage.tsx | `/api/hr/daily-report` | Tekshirish kerak |
| 35 | `/hr/pip` | PIPPage.tsx | `/api/hr/pip` | Tekshirish kerak |
| 36 | `/hr/enps` | ENPSPage.tsx | `/api/hr/enps` | Tekshirish kerak |
| 37 | `/hr/documents` | DocumentWorkflowPage.tsx | `/api/hr/documents` | Tekshirish kerak |
| 38 | `/hr/assets` | HRAssetManagement.tsx | `/api/hr-assets` | Tekshirish kerak |
| 39 | `/hr/peer-review` | PeerReviewPage.tsx | `/api/hr/peer-review` | Tekshirish kerak |
| 40 | `/hr/referrals` | ReferralPage.tsx | `/api/hr/referrals` | Tekshirish kerak |
| 41 | `/hr/milestones` | MilestonePage.tsx | `/api/hr/milestones` | Tekshirish kerak |
| 42 | `/hr/birthdays` | BirthdayWidget.tsx | `/api/hr/birthdays/*` | Tekshirish kerak |
| 43 | `/hr/candidate-report/:id` | CandidateReport.tsx | `/api/hr/candidate-report/:id` | Tekshirish kerak |
| 44 | `/hr/brand` | HRBrandPage.tsx | `/api/hr/brand` | Tekshirish kerak |
| 45 | `/weekly-plan` | WeeklyPlanPage.tsx | `/api/weekly-plans` | Tekshirish kerak |
| 46 | `/hr/inspection` | InspectionPage.tsx | `/api/hr/inspection` | Tekshirish kerak |

**Modul muammolari:**
- HR mahsuldorligi yuqori, lekin bog'liq jadvallar (`hr_payroll_records`, `hr_leave_balances`) schema'da bor — handler'lar real ishlashi kerak
- `/api/applications` browser dump'da ko'rinmadi, lekin Applications.tsx katta fayl — log'larda 500 bo'lishi mumkin
- `dashboard-stats` agregatlash query'lari odatda 500 sabab bo'ladi

---

### MODUL 3: AI HR (2 sahifa)

**Route fayl:** `routes/HRRoutes.tsx` (AI_HR_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint(lar) | Status |
|---|---|---|---|---|
| 1 | `/ai-hr/dashboard` | HRAIDashboard.tsx | `/api/ai-hr/dashboard`, `/api/ai-hr/interviews` | Tekshirish kerak |
| 2 | `/ai-hr/interviews` | AIInterviewPage.tsx | `/api/hr-v2/ai-interview/questions`, `/api/hrems/employees` | DEAD endpoint xavfli (`/api/hrems`) |

**Modul muammolari:** `/api/hrems/employees` — bu mavjud bo'lmagan eski endpoint. AIInterviewPage.tsx'da uni topib `/api/employees` ga o'zgartirish kerak.

---

### MODUL 4: SELF SERVICE (1 sahifa)

**Route fayl:** `routes/HRRoutes.tsx` (SELF_SERVICE_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint(lar) | Status |
|---|---|---|---|---|
| 1 | `/hr/internal-jobs` | InternalJobBoard.tsx | `/api/hr/internal-jobs` | Tekshirish kerak |

---

### MODUL 5: ADMIN (10 sahifa)

**Route fayl:** `routes/AdminRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint(lar) | Status |
|---|---|---|---|---|
| 1 | `/settings` | Settings.tsx | `/api/settings/*` | Tekshirish kerak |
| 2 | `/settings/notifications` | NotificationSettings.tsx | `/api/notification-preferences` | Tekshirish kerak |
| 3 | `/super-admin` | SuperAdminPanel.tsx | `/api/admin/*` | Tekshirish kerak |
| 4 | `/system-monitor` | SystemMonitor.tsx | `/api/system/health`, `/api/system/metrics` | Tekshirish kerak |
| 5 | `/telegram-bot` | TelegramBotAdmin.tsx | `/api/telegram-bot/*` | Tekshirish kerak |
| 6 | `/approvals` | ApprovalHub.tsx | `/api/approval-workflow/dashboard` | Tekshirish kerak |
| 7 | `/integrations` | IntegrationManagement.tsx | `/api/integrations` | Tekshirish kerak |
| 8 | `/customer-portal` | CustomerPortalConfig.tsx | `/api/customer-portal/config` | Tekshirish kerak |
| 9 | `/admin/exceptions` | ExceptionLog.tsx | `/api/admin/exceptions` | Tekshirish kerak |
| 10 | `/admin/queues` | QueueMonitor.tsx | `/api/admin/queues` | Tekshirish kerak |

**Modul muammolari:** SystemMonitor odatda real-time WS'ga ulanadi — agar WebSocket faqat `/chat` namespace'ga ulangan bo'lsa, monitoring ishlamaydi.

---

### MODUL 6: WAREHOUSE / WMS / LOGISTICS (41 sahifa)

**Route fayl:** `routes/WarehouseRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/warehouse/hub` | WarehouseHub.tsx | `/api/warehouse/orders-by-date/:date` | **500** |
| 2 | `/warehouse/hub/:code` | WarehouseHub.tsx | `/api/warehouse/:code/*` | **500** |
| 3 | `/warehouse/barcode-ops` | BarcodeWarehouse.tsx | `/api/barcode-warehouse/dashboard` | **500** |
| 4 | `/warehouse-directory` | WarehouseDirectory.tsx | `/api/warehouse/warehouses` | **500** |
| 5 | `/warehouse/inventory-count` | InventoryCount.tsx | `/api/warehouse/inventory-counts`, `/api/warehouse/inventory-counts-stats` | **500** |
| 6 | `/warehouse/goods-receiving` | GoodsReceiving.tsx | `/api/warehouse/goods-receipts`, `/api/warehouse/goods-receipts/stats` | **500** / **404** |
| 7 | `/warehouse/reservations` | StockReservation.tsx | `/api/warehouse/reservations` | **500** |
| 8 | `/warehouse/reports` | WarehouseReports.tsx | `/api/warehouse/reports/*` | **500** |
| 9 | `/warehouse/barcodes` | BarcodeSystem.tsx | `/api/barcodes/*` | Tekshirish kerak |
| 10 | `/warehouse/integrations` | WarehouseIntegrations.tsx | `/api/warehouse/integrations` | Tekshirish kerak |
| 11 | `/barcode-warehouse` | BarcodeWarehouse.tsx | `/api/barcode-warehouse/dashboard` | **500** |
| 12 | `/mm/vendors` | MMVendors.tsx | `/api/mm/vendors` | **500** |
| 13 | `/mm/purchase-orders` | MMPurchaseOrders.tsx | `/api/mm/purchase-orders` | Tekshirish kerak |
| 14 | `/mm/dashboard` | MMDashboard.tsx | `/api/mm/dashboard` | Tekshirish kerak |
| 15 | `/mm/supply-chain` | SupplyChainDashboard.tsx | `/api/mm/supply-chain` | Tekshirish kerak |
| 16 | `/mm/check-bot` | MMExtended.tsx | `/api/mm/check-bot` | Stub |
| 17 | `/mm/creditor-debts` | MMExtended.tsx | `/api/mm/creditor-debts` | Stub |
| 18 | `/mm/supplier-portal` | MMExtended.tsx | `/api/mm/supplier-portal` | Stub |
| 19 | `/wms/grn` | GoodsReceiving.tsx | `/api/warehouse/goods-receipts` | **500** |
| 20 | `/wms/reservation` | StockReservation.tsx | `/api/warehouse/reservations` | **500** |
| 21 | `/wms/inventory` | InventoryCount.tsx | `/api/warehouse/inventory-counts` | **500** |
| 22 | `/wms/production-balance` | WMSExtended.tsx | `/api/wms/production-balance` | Stub |
| 23 | `/wms/transfer` | WMSExtended.tsx | `/api/warehouse/transfers` | **404** |
| 24 | `/wms/lot-traceability` | WMSExtended.tsx | `/api/warehouse/lots` | **404** |
| 25 | `/wms/internal-requests` | WMSExtended.tsx | `/api/warehouse/internal-requests` | **404** (mavjud `/api/material-balance/internal-requests`) |
| 26 | `/wms/kpi` | WMSExtended.tsx | `/api/wms/kpi` | Stub |
| 27 | `/wms/rental` | WarehouseRental.tsx | `/api/warehouse-rental/records`, `/api/warehouse-rental/summary`, `/api/warehouse-rental/settings` | **500** |
| 28 | `/wms/dashboard` | WMSDashboard.tsx | `/api/warehouse/dashboard/top-materials`, `/kpis`, `/warehouse-occupancy` | **500** |
| 29 | `/wms/analytics` | WmsAnalytics.tsx | `/api/wms-analytics/*` | Tekshirish kerak |
| 30 | `/wms/material-balance` | MaterialBalance.tsx | `/api/material-balance/overview`, `/api/material-balance/alerts` | **500** |
| 31 | `/wms/scanner` | BarcodeScanner.tsx | `/api/scanner/*` | Tekshirish kerak |
| 32 | `/inventory/materials` | WMSMaterials.tsx | `/api/inventory/materials?limit=100` | **500** |
| 33 | `/inventory/materials/:id` | WMSMaterials.tsx | `/api/inventory/materials/:id` | **500** |
| 34 | `/logistics` | LogisticsDashboard.tsx | `/api/logistics/*` | Tekshirish kerak |
| 35 | `/logistics/transport` | LogisticsDashboard.tsx | `/api/logistics/transport` | Tekshirish kerak |
| 36 | `/logistics/route-planning` | LogisticsDashboard.tsx | `/api/logistics/routes` | Tekshirish kerak |
| 37 | `/logistics/gps` | LogisticsDashboard.tsx | `/api/logistics/gps` | Tekshirish kerak |
| 38 | `/logistics/fuel` | LogisticsDashboard.tsx | `/api/logistics/fuel` | Tekshirish kerak |
| 39 | `/logistics/drivers` | LogisticsDashboard.tsx | `/api/logistics/drivers` | Tekshirish kerak |
| 40 | `/logistics/vehicle-schedule` | LogisticsDashboard.tsx | `/api/logistics/vehicle-schedule` | Tekshirish kerak |

**Modul muammolari:** Eng katta xato to'plami. ~15 ta endpoint 500/404. Yo'q jadvallar: `warehouse_bins`, `material_cards`, `material_balance`, `warehouse_rental` (to'liq), `barcode_warehouse`, `inventory_materials`.

---

### MODUL 7: MARKETING (16 sahifa)

**Route fayl:** `routes/CRMRoutes.tsx` (MARKETING_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/marketing/dashboard` | MarketingDashboard.tsx | `/api/marketing/dashboard` | Tekshirish kerak |
| 2 | `/marketing/campaigns` | MarketingCampaigns.tsx | `/api/marketing/campaigns` | Tekshirish kerak |
| 3 | `/marketing/content` | MarketingContent.tsx | `/api/marketing/content` | Tekshirish kerak |
| 4 | `/marketing/leads` | MarketingLeads.tsx | `/api/marketing/leads`, `/api/marketing/leads/loss-analysis` | **404** + Query data undefined warning |
| 5 | `/marketing/calendar` | MarketingCalendar.tsx | `/api/marketing/calendar` | Tekshirish kerak |
| 6 | `/marketing/exhibitions` | MarketingExhibitions.tsx | `/api/marketing/exhibitions` | Tekshirish kerak |
| 7 | `/marketing/pr` | MarketingPR.tsx | `/api/marketing/pr` | Tekshirish kerak |
| 8 | `/marketing/budget` | MarketingBudget.tsx | `/api/marketing/budget` | Tekshirish kerak |
| 9 | `/marketing/settings` | MarketingSettings.tsx | `/api/marketing/settings`, `/api/marketing/settings/social-api` | **404** (frontend ✅ TUZATILDI, backend yetishmaydi) |
| 10 | `/marketing/social-inbox` | MarketingSocialInbox.tsx | `/api/marketing/social-inbox` | Tekshirish kerak |
| 11 | `/marketing/website-cms` | MarketingWebsiteCMS.tsx | `/api/marketing/website-cms` | Tekshirish kerak |
| 12 | `/marketing/analytics` | MarketingExtended.tsx | `/api/marketing/analytics` | Stub |
| 13 | `/marketing/seo` | MarketingExtended.tsx | `/api/marketing/seo` | Stub |
| 14 | `/marketing/ab-testing` | MarketingExtended.tsx | `/api/marketing/ab-testing` | Stub |
| 15 | `/marketing/competitors` | MarketingExtended.tsx | `/api/marketing/competitors` | Stub |
| 16 | `/marketing/nps-churn` | MarketingExtended.tsx | `/api/marketing/nps-churn` | Stub |

**Modul muammolari:**
- `marketing_settings` jadvali yo'q
- `marketing/leads/loss-analysis` endpoint yo'q
- 5 ta sahifa Stub holatda

---

### MODUL 8: FINANCE / ACCOUNTING / POS (32 sahifa)

**Route fayl:** `routes/FinanceRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/finance-dashboard` | FinanceDashboard.tsx | `/api/finance/dashboard` | Tekshirish kerak |
| 2 | `/cfo/dashboard` | CFODashboard.tsx | `/api/cfo/dashboard` | Tekshirish kerak |
| 3 | `/finance/cashflow` | CashFlowManagement.tsx | `/api/finance/cashflow` | Tekshirish kerak |
| 4 | `/finance/budgets` | BudgetManagement.tsx | `/api/budgets` | Tekshirish kerak |
| 5 | `/finance/order-costing` | OrderCosting.tsx | `/api/finance/order-costing` | Tekshirish kerak |
| 6 | `/finance/reports` | FinancialReports.tsx | `/api/finance/reports/*` | Tekshirish kerak |
| 7 | `/finance/profitability` | ProductProfitability.tsx | `/api/finance/profitability` | Tekshirish kerak |
| 8 | `/finance/daily-kpi` | DailyKPIDashboard.tsx | `/api/finance/daily-kpi` | Tekshirish kerak |
| 9 | `/accounting/ar` | AccountsReceivable.tsx | `/api/ar/aging`, `/api/ar/overdue` | Tekshirish kerak |
| 10 | `/accounting/ap` | AccountsPayable.tsx | `/api/ap/aging`, `/api/ap/overdue` | Tekshirish kerak |
| 11 | `/accounting/payroll-automation` | PayrollAutomation.tsx | `/api/payroll/*` | Tekshirish kerak |
| 12 | `/accounting/materials` | MaterialsAccounting.tsx | `/api/material-cards` | **500** (jadval yo'q) |
| 13 | `/accounting/gl-documents` | GLDocuments.tsx | `/api/gl-documents` | Tekshirish kerak |
| 14 | `/accounting/chart-of-accounts` | ChartOfAccounts.tsx | `/api/gl/accounts` | Tekshirish kerak |
| 15 | `/accounting/period-closing` | PeriodClosing.tsx | `/api/period-closing` | Tekshirish kerak |
| 16 | `/accounting/cash-register` | CashRegister.tsx | `/api/cash-register` | Tekshirish kerak |
| 17 | `/pos/dashboard` | POSDashboard.tsx | `/api/pos/*` | Tekshirish kerak |
| 18 | `/pos/inventory` | POSInventoryPage.tsx | `/api/pos/inventory` | Tekshirish kerak |
| 19 | `/accounting/income-expense` | IncomeExpense.tsx | `/api/income-expense` | Tekshirish kerak |
| 20 | `/accounting/inventory-valuation` | InventoryValuation.tsx | `/api/inventory-valuation` | Tekshirish kerak |
| 21 | `/accounting/asset-management` | AssetManagement.tsx | `/api/asset-management/*` (assets, summary, maintenance, disposals, transfers, insurance) | Tekshirish kerak |
| 22 | `/fi/cost-centers` | FinanceExtended.tsx | `/api/fi/cost-centers` | Stub |
| 23 | `/fi/transfer-pricing` | FinanceExtended.tsx | `/api/fi/transfer-pricing` | Stub |
| 24 | `/fi/tax-management` | FinanceExtended.tsx | `/api/fi/tax-management` | Stub |
| 25 | `/fi/tax-calendar` | FinanceExtended.tsx | `/api/fi/tax-calendar` | Stub |
| 26 | `/fi/audit-log` | FinanceExtended.tsx | `/api/fi/audit-log` | Stub |
| 27 | `/fi/risk-ai` | FinanceExtended.tsx | `/api/fi/risk-ai` | Stub |
| 28 | `/finance/gl-chart-of-accounts` | GLChartOfAccounts.tsx | `/api/gl/accounts` | Tekshirish kerak |
| 29 | `/cfo/config` | CfoConfigSettings.tsx | `/api/cfo/config` | Tekshirish kerak |
| 30 | `/finance/variance` | FinanceVariance.tsx | `/api/finance/variance` | Tekshirish kerak |
| 31 | `/finance/break-even` | FinanceBreakEven.tsx | `/api/finance/break-even` | Tekshirish kerak |
| 32 | `/finance/pricing-tiers` | PricingTiers.tsx | `/api/finance/pricing-tiers` | Tekshirish kerak |

**Modul muammolari:** `material_cards` jadvalini qo'shish bilan MaterialsAccounting darhol ishlaydi. 6 ta `FinanceExtended` Stub.

---

### MODUL 9: INTEGRATION (7 sahifa)

**Route fayl:** `routes/AdminRoutes.tsx` (INTEGRATION_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/integration/gl-posting` | GLPostingMonitor.tsx | `/api/integration/gl-posting/*` | Tekshirish kerak |
| 2 | `/integration/invoice-verification` | InvoiceVerification.tsx | `/api/integration/invoice-verification/*` | Tekshirish kerak |
| 3 | `/integration/expense-management` | ExpenseManagement.tsx | `/api/integration/expense/*` | Tekshirish kerak |
| 4 | `/integration/mro` | MRODashboard.tsx | `/api/integration/mro/items` | **401** |
| 5 | `/integration/vendor-performance` | VendorPerformance.tsx | `/api/integration/vendor-performance/*` | Tekshirish kerak |
| 6 | `/integration/employee-rating` | EmployeeRating.tsx | `/api/integration/employee-rating/*` | Tekshirish kerak |
| 7 | `/integration/hr-lms` | HRLMSSkills.tsx | `/api/integration/hr-lms/*` | Tekshirish kerak |

**Modul muammolari:** `/api/integration/mro/items` 401 — auth yoki path muammo.

---

### MODUL 10: CAMERA / SECURITY (26 sahifa)

**Route fayl:** `routes/CameraRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/camera-dashboard` | camera-dashboard.tsx | `/api/camera-dashboard/*` (stats, recent-events, pending-alerts, quality-stats, safety-stats, top-employees, weekly-trend) | Tekshirish kerak |
| 2 | `/cameras` | cameras-management.tsx | `/api/cameras` | Tekshirish kerak |
| 3 | `/camera-safety` | camera-safety.tsx | `/api/camera-safety` | Tekshirish kerak |
| 4 | `/camera-quality` | camera-quality.tsx | `/api/camera-dashboard/quality-stats`, `/api/quality-defects-camera` | Tekshirish kerak |
| 5 | `/camera-employees` | camera-employees.tsx | `/api/camera-employees` | Tekshirish kerak |
| 6 | `/camera-machines` | camera-machines.tsx | `/api/machine-status-current`, `/api/machine-status-logs` | Tekshirish kerak |
| 7 | `/camera-alerts` | camera-alerts.tsx | `/api/camera-alerts` | Tekshirish kerak |
| 8 | `/camera-reports` | camera-reports.tsx | `/api/camera-reports` | Tekshirish kerak |
| 9 | `/camera-settings` | camera-settings.tsx | `/api/cameras/settings` | Tekshirish kerak |
| 10 | `/camera-heatmap` | camera-heatmap.tsx | `/api/camera-heatmap/*` (data, employees, employee) | Tekshirish kerak |
| 11 | `/camera-employee-ratings` | camera-employee-ratings.tsx | `/api/camera-employee-ratings` | Tekshirish kerak |
| 12 | `/camera-live-monitoring` | CameraLiveMonitoring.tsx | `/api/cameras/live` | Tekshirish kerak |
| 13 | `/camera/monitoring` | FaceRecognitionMonitoring.tsx | `/api/face-recognition/*` | Tekshirish kerak |
| 14 | `/face-registration` | FaceRegistration.tsx | `/api/face-registration` | Tekshirish kerak |
| 15 | `/attendance-monitor` | AttendanceMonitorPage.tsx | `/api/iot/attendance/live` | **404** |
| 16 | `/employee-tracking` | EmployeeTrackingReport.tsx | `/api/employee-productivity`, `/api/safety-violations` | Tekshirish kerak |
| 17 | `/europrint/camera-ai-analytics` | CameraAIAnalytics.tsx | `/api/erp/team-analytics/*` | Tekshirish kerak |
| 18 | `/camera-ai` | CameraAIModernHub.tsx | `/api/camera-ai/*` | Tekshirish kerak |
| 19 | `/security` | SecurityDashboard.tsx | `/api/security/*` | Tekshirish kerak |
| 20 | `/security/attendance` | SecurityExtended.tsx | `/api/security/attendance` | Stub |
| 21 | `/security/zone-access` | SecurityExtended.tsx | `/api/security/zone-access` | Stub |
| 22 | `/security/ppe` | SecurityExtended.tsx | `/api/security/ppe` | Stub |
| 23 | `/security/hazmat` | SecurityExtended.tsx | `/api/security/hazmat` | Stub |
| 24 | `/security/evacuation` | SecurityExtended.tsx | `/api/security/evacuation` | Stub |
| 25 | `/security/visitors` | SecurityExtended.tsx | `/api/security/visitors` | Stub |
| 26 | `/security/rating` | SecurityExtended.tsx | `/api/security/rating` | Stub |

**Modul muammolari:** Camera modullari nisbatan stabil (browser dump'da xato kam), lekin Security 7 ta sahifa Stub holatda.

---

### MODUL 11: SALES / SD / CRM (29 sahifa)

**Route fayl:** `routes/CRMRoutes.tsx` (SALES_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/crm-workspace` | CRMWorkspace.tsx | `/api/crm/*` | Tekshirish kerak |
| 2 | `/crm/funnel` | CrmFunnelAnalytics.tsx | `/api/crm/funnel` | Tekshirish kerak |
| 3 | `/crm/rfm` | CrmRfmClusters.tsx | `/api/crm/rfm` | Tekshirish kerak |
| 4 | `/crm/cohort` | CrmCohortAnalysis.tsx | `/api/crm/cohort` | Tekshirish kerak |
| 5 | `/crm/activities` | CRMActivities.tsx | `/api/crm/activities` | Tekshirish kerak |
| 6 | `/crm/settings` | CRMSettings.tsx | `/api/crm/settings` | Tekshirish kerak |
| 7 | `/erp/sales` | SalesOrders.tsx | `/api/sales-orders` | Tekshirish kerak |
| 8 | `/sd/quotations` | SDQuotations.tsx | `/api/sd/quotations` | Tekshirish kerak |
| 9 | `/sd/crm` | SDEuroprint.tsx | `/api/sd/crm` | Tekshirish kerak |
| 10 | `/sd/dashboard` | SDDashboard.tsx | `/api/sd/dashboard` | Tekshirish kerak |
| 11 | `/sd/customers` | SDCustomers.tsx | `/api/sd/customers` | Tekshirish kerak |
| 12 | `/sd/sales-quotes` | SDSalesQuotes.tsx | `/api/sd/sales-quotes` | Tekshirish kerak |
| 13 | `/sd/sales-orders` | SDSalesOrders.tsx | `/api/sd/sales-orders` | Tekshirish kerak |
| 14 | `/sd/sales-payments` | SDSalesPayments.tsx | `/api/sd/sales-payments`, `/api/sd/payments` | **500** |
| 15 | `/sd/sales-management` | SDSalesManagement.tsx | `/api/sd/sales-management` | Tekshirish kerak |
| 16 | `/sd/invoices` | SDSalesManagement.tsx | `/api/sd/invoices` | Tekshirish kerak |
| 17 | `/sd/forecast` | SDSalesManagement.tsx | `/api/sd/forecast` | Tekshirish kerak |
| 18 | `/sd/analytics` | SDSalesManagement.tsx | `/api/sd/analytics` | Tekshirish kerak |
| 19 | `/sd/commission` | SDSalesManagement.tsx | `/api/sd/commission` | Tekshirish kerak |
| 20 | `/sd/kpi` | SDKpi.tsx | `/api/sd/kpi` | Tekshirish kerak |
| 21 | `/sd/contracts` | SDContracts.tsx | `/api/sd/contracts` | Tekshirish kerak |
| 22 | `/sd/settings` | SDSettings.tsx | `/api/sd/settings` | Tekshirish kerak |
| 23 | `/sd/debitors` | SDDebitors.tsx | `/api/sd/debitors` | Tekshirish kerak |
| 24 | `/sd/dashboard/overview` | SDOverviewDashboard.tsx | `/api/sd/active-rentals`, `/api/sd/payments` | **500** |
| 25 | `/sd/dashboard/quota` | SDQuotaDashboard.tsx | `/api/sd/quota` | Tekshirish kerak |
| 26 | `/sd/manager-panel` | SDExtended.tsx | `/api/sd/manager-panel` | Stub |
| 27 | `/sd/warehouse-rental` | SDExtended.tsx | `/api/sd/warehouse-rental` | Stub |
| 28 | `/sd/advance-control` | SDExtended.tsx | `/api/sd/advance-control` | Stub |

**Modul muammolari:** SDOverviewDashboard'ning `sd_active_rentals` jadval yo'q. SDExtended 3 ta Stub.

---

### MODUL 12: PRODUCTION / PP / TECH / BOM (41 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (PRODUCTION_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/erp-production` | ERPProduction.tsx | `/api/erp/products`, `/api/production/*` | Tekshirish kerak |
| 2 | `/production/orders` | ProductionReport.tsx | `/api/production/orders` | **500** |
| 3 | `/production/orders/:id` | ProductionOrder360.tsx | `/api/production/orders/:id` | **500** |
| 4 | `/planning` | PlanningBoard.tsx | `/api/planning/operations` | **401** |
| 5 | `/ai-production-planning` | AIProductionPlanning.tsx | `/api/ai-planning/dashboard`, `/api/ai-planning/plans`, `/api/ai-planning/config` | Tekshirish kerak |
| 6 | `/pp/ai-reservation` | AIReservation.tsx | `/api/ai-reservation/dashboard`, `/api/ai-reservation/batches`, `/api/ai-reservation/requests` | **500** |
| 7 | `/papka-orders` | PapkaOrders.tsx | `/api/papka-orders` | **401** (legacy controller) |
| 8 | `/order-create` | OrderCreationWizard.tsx | `/api/order-creation/*` | Tekshirish kerak |
| 9 | `/order-approval` | OrderApprovalWorkflow.tsx | `/api/order-approval/*` | Tekshirish kerak |
| 10 | `/pp/dashboard` | PPDashboard.tsx | `/api/pp/dashboard` | Tekshirish kerak |
| 11 | `/erp/pp/bom` | BOMManagement.tsx | `/api/erp/bom-headers`, `/api/erp/bom-items` | ✅ h1 nesting TUZATILDI |
| 12 | `/erp/pp/routing` | RoutingConfiguration.tsx | `/api/erp/routing-operations` | **500** |
| 13 | `/erp/pp/capacity` | CapacityPlanning.tsx | `/api/erp/work-center-capacity`, `/api/erp/capacity/load-analysis` | **500** + **404** |
| 14 | `/technology` | Technology.tsx | `/api/technology/*` | **401** (TECHNOLOGIST roli) |
| 15 | `/tech/dashboard-home` | TechDashboard.tsx | `/api/tech/dashboard` | Tekshirish kerak |
| 16 | `/tech-approval` | TechApproval.tsx | `/api/papka-orders?status=pending_tech` | **401** |
| 17 | `/tech-cards`, `/tech/cards` | TechCards.tsx | `/api/technology/cards`, `/api/papka-orders` | **401** |
| 18 | `/tech/material-alternatives` | TechPPExtended.tsx | `/api/technology/materials/alternatives` | Stub/401 |
| 19 | `/tech/machine-selection` | TechPPExtended.tsx | `/api/technology/machine-selection` | Stub |
| 20 | `/tech/time-cost` | TechPPExtended.tsx | `/api/technology/time-cost` | Stub |
| 21 | `/tech/cost-optimization` | TechPPExtended.tsx | `/api/technology/cost-optimization` | Stub |
| 22 | `/tech/client-requirements` | TechPPExtended.tsx | `/api/technology/client-requirements` | Stub |
| 23 | `/tech/change-history` | TechPPExtended.tsx | `/api/technology/change-history` | Stub |
| 24 | `/tech/parallel-orders` | TechPPExtended.tsx | `/api/technology/parallel-orders` | Stub |
| 25 | `/pp/shift-management` | AIShiftManagementPage.tsx | `/api/ai/shift/recommendations` | **404** |
| 26 | `/pp/parallel-processes` | TechPPExtended.tsx | `/api/pp/parallel-processes` | Stub |
| 27 | `/pp/rush-orders` | RushOrderPage.tsx | `/api/ai/rush-orders` | **404** |
| 28 | `/pp/bottleneck` | BottleneckAnalysisPage.tsx | `/api/ai/bottleneck/analysis` | **404** |
| 29 | `/pp/mrp` | MrpMatrix.tsx | `/api/mrp/*` | Tekshirish kerak |
| 30 | `/pp/crp` | CrpPage.tsx | `/api/crp/*` | Tekshirish kerak |
| 31 | `/pp/demand-forecast` | DemandForecastingPage.tsx | `/api/ai/forecast/demand` | **404** |
| 32 | `/pp/what-if` | TechPPExtended.tsx | `/api/pp/what-if` | Stub |
| 33 | `/pp/delivery-calculator` | TechPPExtended.tsx | `/api/pp/delivery-calculator` | Stub |
| 34 | `/pp/energy-optimization` | TechPPExtended.tsx | `/api/pp/energy-optimization` | Stub |
| 35 | `/pp/oee-monitor` | OEELiveMonitorPage.tsx | `/api/iot/oee/live` | **404** |
| 36 | `/pp/kpi-deviation` | TechPPExtended.tsx | `/api/pp/kpi-deviation` | Stub |
| 37 | `/pp/realtime-progress` | TechPPExtended.tsx | `/api/pp/realtime-progress` | Stub |
| 38 | `/finance/approval` | FinanceApproval.tsx | `/api/finance/approval` | Tekshirish kerak |
| 39 | `/design/approval` | DesignApproval.tsx | `/api/design/approval` | Tekshirish kerak |

**Modul muammolari:** Eng murakkab modul. **15+ ta TechPPExtended Stub**, 6 ta dedicated AI sahifa (TZ-06) backend'da yo'q (404), `papka-orders` legacy. Yo'q jadvallar: `routing_operations`, `work_center_capacity`, `technology_cards`, `planning_operations`, `ai_rush_orders`, `ai_bottleneck_analysis`, `ai_demand_forecast`, `ai_shift_recommendations`.

---

### MODUL 13: DIRECTOR / EXECUTIVE (19 sahifa)

**Route fayl:** `routes/DirectorRoutes.tsx`

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/coordination` | CoordinationPage.tsx | `/api/coordination/*` | Tekshirish kerak |
| 2 | `/erp-daily-reports` | ERPDailyReports.tsx | `/api/erp/daily-reports` | Tekshirish kerak |
| 3 | `/erp/employee/:id` | EmployeeProfile.tsx | `/api/employees/:id` | Tekshirish kerak |
| 4 | `/europrint/control` | EuroprintControlCenter.tsx | `/api/europrint-control/*` | Tekshirish kerak |
| 5 | `/europrint/auditor` | AuditorPanel.tsx | `/api/europrint-control/audit-*` | Tekshirish kerak |
| 6 | `/europrint/accountant` | AccountantView.tsx | `/api/europrint-control/dashboard/accountant`, `/api/europrint-control/accountant/*` | Tekshirish kerak |
| 7 | `/europrint/strategic`, `/strategic-tasks` | StrategicTasksPanel.tsx | `/api/strategic-tasks` | Tekshirish kerak |
| 8 | `/europrint/employee-kpi` | EmployeeDailyKPIPanel.tsx | `/api/employee-kpi` | Tekshirish kerak |
| 9 | `/europrint/waste-tracking` | WasteTracking.tsx | `/api/waste-tracking` | Tekshirish kerak |
| 10 | `/europrint/reports-hub` | ReportsHub.tsx | `/api/reports-hub` | Tekshirish kerak |
| 11 | `/director/ai-summary` | DirectorExtended.tsx | `/api/director/ai-summary` | Stub |
| 12 | `/director/problem-points` | DirectorExtended.tsx | `/api/director/problems` | Stub |
| 13 | `/director/production` | DirectorExtended.tsx | `/api/director/production` | Stub |
| 14 | `/director/hr-stats` | DirectorExtended.tsx | `/api/director/hr-stats` | Stub |
| 15 | `/director/finance` | DirectorExtended.tsx | `/api/director/finance` | Stub |
| 16 | `/director/kpis` | DirectorExtended.tsx | `/api/director/kpis` | Stub |
| 17 | `/ideal-rasm` | IdealRasmPage.tsx | `/api/ideal-rasm` | Tekshirish kerak |
| 18 | `/director/ai-audit` | DirectorAiAudit.tsx | `/api/director/ai-audit` | Tekshirish kerak |

**Modul muammolari:** 6 ta `DirectorExtended` Stub holatda. `europrint-control` controller'lar haqiqatdan ham mavjudligini tekshirish kerak.

---

### MODUL 14: MES (12 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (MES_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/mes/dashboard-home` | MESHomeDashboard.tsx | `/api/mes/stats` | **500** |
| 2 | `/mes/work-centers` | MESWorkCenters.tsx | `/api/mes/work-centers`, `/api/mes/tasks` | **500** / **404** |
| 3 | `/mes/products` | MESProducts.tsx | `/api/mes/products` | Tekshirish kerak |
| 4 | `/mes/downtimes` | MESDowntimes.tsx | `/api/mes/downtime-reasons` | **500** / **404** |
| 5 | `/mes/workers` | MESWorkerAssignments.tsx | `/api/mes/workers` | Tekshirish kerak |
| 6 | `/mes/oee-monitor` | MESExtended.tsx | `/api/mes/oee` | Tekshirish kerak |
| 7 | `/mes/reason-log` | MESExtended.tsx | `/api/mes/reasons` | Tekshirish kerak |
| 8 | `/mes/zone-management` | MESExtended.tsx | `/api/mes/zones` | Stub |
| 9 | `/mes/maintenance-request` | MESExtended.tsx | `/api/mes/maintenance-requests` | **500** |
| 10 | `/mes/gamification` | MESExtended.tsx | `/api/mes/gamification/leaderboard` | **500** / **404** |
| 11 | `/mes/machine-norms` | MESExtended.tsx | `/api/mes/machine-norms` | Stub |
| 12 | `/mes/smena-handover` | MESExtended.tsx | `/api/mes/shifts/current` | **500** / **404** |

**Modul muammolari:** Yo'q jadvallar: `mes_gamification_leaderboard`, `mes_shifts`, `mes_tasks`. 5 ta MESExtended Stub.

---

### MODUL 15: QC (17 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (QC_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/qc/dashboard-home` | QCDashboard.tsx | `/api/qc/dashboard` | Tekshirish kerak |
| 2 | `/qc-module` | QCModule.tsx | `/api/qc/*` | Tekshirish kerak |
| 3 | `/print/ink-coverage` | InkCoverageCalculator.tsx | `/api/print/ink-coverage` | Tekshirish kerak |
| 4 | `/print/imposition` | ImpositionCalculator.tsx | `/api/print/imposition` | Tekshirish kerak |
| 5 | `/qc/approval` | QCApproval.tsx | `/api/qc/approvals` | Tekshirish kerak |
| 6 | `/qc/final` | QCFinalInspection.tsx | `/api/qc/final-orders`, `/api/qc/final-inspections` | **500** / **404** |
| 7 | `/qc/lab` | QCExtended.tsx | `/api/qc/lab` | Stub |
| 8 | `/qc/paper-parameters` | PaperParametersPage.tsx | `/api/qc/paper-parameters` | Tekshirish kerak |
| 9 | `/qc/vendor-quality` | SupplierQualityPage.tsx | `/api/qc/vendor-quality` | Tekshirish kerak |
| 10 | `/qc/defect-management` | DefectManagementPage.tsx | `/api/qc/defects/extended` | **500** |
| 11 | `/qc/complaints` | ReclamationsPage.tsx | `/api/qc/reclamations` | Tekshirish kerak |
| 12 | `/qc/certificates` | QualityCertificatesPage.tsx | `/api/qc/certificates` | Tekshirish kerak |
| 13 | `/qc/iso` | QCExtended.tsx | `/api/qc/iso` | Stub |
| 14 | `/qc/trends` | QualityTrendPage.tsx | `/api/qc/trends` | Tekshirish kerak |
| 15 | `/qc/ai-analysis` | QCExtended.tsx | `/api/qc/ai-analysis` | Stub |
| 16 | `/qc/reports` | QCExtended.tsx | `/api/qc/reports` | Stub |
| 17 | `/qc/settings` | QCExtended.tsx | `/api/qc/settings` | Stub |

**Modul muammolari:** Yo'q jadvallar: `qc_final_orders`, `qc_defects_extended`. 5 ta QCExtended Stub.

---

### MODUL 16: DESIGN (12 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (DESIGN_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/design/dashboard` | DesignDashboard.tsx | `/api/design/dashboard/summary` | Tekshirish kerak |
| 2 | `/design/orders` | DesignOrders.tsx | `/api/design/orders` | Tekshirish kerak |
| 3 | `/design-orders/:id` | DesignOrderDetail.tsx | `/api/design/orders/:id` | Tekshirish kerak |
| 4 | `/design/generator` | AIDesignGenerator.tsx | `/api/design/generator` | Tekshirish kerak |
| 5 | `/design/ai-review` | DesignExtended.tsx | `/api/design/ai-review` | Stub |
| 6 | `/design/3d-mockup` | DesignExtended.tsx | `/api/design/3d-mockup` | Stub |
| 7 | `/design/brand-guidelines` | DesignExtended.tsx | `/api/design/brand-guidelines` | Stub |
| 8 | `/design/comparison` | DesignExtended.tsx | `/api/design/comparison` | Stub |
| 9 | `/design/templates` | DesignExtended.tsx | `/api/design/templates` | Stub |
| 10 | `/design/tools` | DesignExtended.tsx | `/api/design/tools`, `/api/design/tooling` | Stub |
| 11 | `/design/costing` | DesignExtended.tsx | `/api/design/costing` | Stub |
| 12 | `/design/library` | DesignExtended.tsx | `/api/design/library` | Stub |

**Modul muammolari:** **8 ta DesignExtended Stub** — modul deyarli 70% pleyster. Real sahifa va endpoint kerak.

---

### MODUL 17: MRO (11 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (MRO_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/mro/dashboard` | MRODashboard.tsx | `/api/mro` | Tekshirish kerak |
| 2 | `/mro/preventive` | PreventiveMaintenancePage.tsx | `/api/mro/pm/schedules` | **404** |
| 3 | `/mro/spare-parts` | SparePartsPage.tsx | `/api/mro/spare-parts` | **404** |
| 4 | `/mro/utilities` | UtilityReadingsPage.tsx | `/api/mro/utility/readings` | **404** |
| 5 | `/mro/expense-control` | MROExtended.tsx | `/api/mro/expense-control` | Stub |
| 6 | `/mro/kitchen` | CanteenManagementPage.tsx | `/api/mro/canteen/stats` | **404** |
| 7 | `/mro/uniforms` | MROExtended.tsx | `/api/mro/uniforms` | Stub |
| 8 | `/mro/office-inventory` | FacilityInventoryPage.tsx | `/api/mro/facility/office` | Tekshirish kerak |
| 9 | `/mro/cleaning` | CleaningSchedulePage.tsx | `/api/mro/cleaning/schedules` | DB jadval bor, lekin endpoint tekshirish kerak |
| 10 | `/mro/sanitation` | MROExtended.tsx | `/api/mro/sanitation` | Stub |
| 11 | `/mro/building-inventory` | FacilityInventoryPage.tsx | `/api/mro/facility/building` | Tekshirish kerak |

**Modul muammolari:** Yo'q jadvallar: `mro_spare_parts`, `mro_pm_schedules`, `mro_canteen`, `mro_facility_inventory`. 3 ta MROExtended Stub. **MRO controller faqat 1 ta route** (`/api/mro`) — sub-route'lar yo'q.

---

### MODUL 18: IOT (9 sahifa)

**Route fayl:** `routes/ProductionRoutes.tsx` (IOT_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/iot/sensor-monitoring` | IoTExtended.tsx | `/api/iot-sensors/dashboard`, `/live`, `/alerts` | **500** |
| 2 | `/iot/predictive-maintenance` | IoTExtended.tsx | `/api/iot-sensors/predictive-maintenance` | **500** |
| 3 | `/iot/oee-live` | IoTExtended.tsx | `/api/iot-sensors/oee`, `/api/iot/oee/live` | **500** + **404** |
| 4 | `/iot/digital-twin` | IoTExtended.tsx | `/api/iot/digital-twin` | Stub |
| 5 | `/iot/alerts` | IoTExtended.tsx | `/api/iot-sensors/alerts` | **500** |
| 6 | `/iot/tablet` | IoTTablet.tsx | `/api/iot/tablet/defect-reasons`, `/api/iot/tablet/*` | **500** / **404** |
| 7 | `/iot/dashboard` | IoTDashboard.tsx | `/api/iot-sensors/dashboard` (line 125), `/api/iot-sensors/live` (line 136), `/api/iot-sensors/alerts` (line 151), `/api/iot-sensors/oee` (line 216) | **500** (4 ta query) |
| 8 | `/iot/material-kits` | WarehouseMaterialKits.tsx | `/api/material-kits` | Tekshirish kerak |
| 9 | `/iot/daily-view` | WarehouseDailyView.tsx | `/api/warehouse/daily-view` | Tekshirish kerak |

**Modul muammolari:** **Eng yomon zarba olgan modul**. Yo'q jadvallar: `iot_sensors` (5 ta endpoint asosi), `iot_attendance`, `room_inspections`, `employee_health`, `iot_tablet_defects`. IoTDashboard'da bitta sahifa 4 ta 500 query bilan crash bo'ladi.

---

### MODUL 19: SAAS (6 sahifa)

**Route fayl:** `routes/AdminRoutes.tsx` (SAAS_ROUTES)

| # | Yo'l | Sahifa fayli | Asosiy endpoint | Xato |
|---|---|---|---|---|
| 1 | `/saas/tenant-management` | SaaSExtended.tsx | `/api/saas/tenants` | Stub |
| 2 | `/saas/onboarding` | SaaSExtended.tsx | `/api/saas/onboarding` | Stub |
| 3 | `/saas/licensing` | SaaSExtended.tsx | `/api/saas/licensing` | Stub |
| 4 | `/saas/module-control` | SaaSExtended.tsx | `/api/saas/modules` | Stub |
| 5 | `/saas/monitoring` | SaaSExtended.tsx | `/api/saas/monitoring` | Stub |
| 6 | `/saas/error-log` | SaaSExtended.tsx | `/api/saas/errors` | Stub |

**Modul muammolari:** **Butun modul Stub** — 6/6 sahifa pleyster. Hech qanday haqiqiy backend yo'q.

---

## QO'SHIMCHA ROUTE GURUHLARI (19 dan tashqari)

### Q.1. LMS_ADMIN (4 sahifa)
- `/lms/test-management`, `/lms/course-author`, `/lms/operator-certification`, `/lms/learning-budget` — Hammasi `LMSExtended` Stub

### Q.2. LMS_LEARNER (5 sahifa)
- `/lms/leaderboard`, `/lms/micro-learning`, `/lms/gamification` — `LMSExtended` Stub
- `/lms/knowledge-base` — KnowledgeBase
- `/lms/support` — LMSSupport

### Q.3. KAIZEN (1 sahifa)
- `/kaizen` — KaizenPage — `/api/kaizen/suggestions`, `/api/kaizen/stats` — **500** (jadval yo'q)

### Q.4. ORDERS_REGISTRY (1 sahifa)
- `/orders-registry` — OrdersRegistry

### Q.5. ARCHITECTURE_GAP (6 sahifa)
- `/ai/agents` — AIAgentsPage — `/api/ai-agents`
- `/admin/validate` — ValidatePage
- `/dashboard/progress` — ProgressPage
- `/hr/face-employees` — EmployeesForFacePage
- `/pos/stock` — PosStockPage
- `/pos/sync` — PosSyncPage

### Q.6. STUB_ROUTES (70 sahifa)
Hammasi `StubPage.tsx` — placeholder. Ro'yxat:

`/360`, `/3way-match`, `/achievements`, `/ai`, `/ai/automation`, `/ai-camera`, `/ai-crm`, `/ai/crm`, `/ai-exam`, `/ai/finance`, `/ai/hr`, `/ai/marketing`, `/ai-planning`, `/ai/wms`, `/application-responses`, `/approval-workflow`, `/assignments`, `/attempts`, `/auth`, `/calendar-events`, `/candidates`, `/company-state`, `/daily-attendance`, `/discipline-records`, `/employee-files`, `/employee-productivity`, `/employee-zone-history`, `/equipment`, `/europrint-control`, `/export`, `/gl`, `/gpt`, `/hr/leave`, `/hr/zno`, `/hr/zvs`, `/insights`, `/integration/requests`, `/inventory/advanced`, `/iot-enhanced`, `/iot-sensors`, `/machine-status-current`, `/machine-status-logs`, `/material-cards`, `/mentors`, `/mentorships`, `/micro-modules`, `/modules`, `/okr`, `/order-status`, `/org-departments`, `/pos/barcode`, `/pos/inventory-counts`, `/pos/mini-app`, `/pos/movements`, `/pos/printer-config`, `/pos/requests`, `/production-facts`, `/production/shift-reports`, `/quality-defects-camera`, `/questionnaire-questions`, `/questions`, `/raci-crisis`, `/raw-materials`, `/safety-violations`, `/sap`, `/users`, `/v2/pos/printer-config`, `/video-progress`, `/waste`, `/weekly-plans`

### Q.7. CHAT (2 sahifa)
- `/chat` — ChatPage
- `/chat/admin` — ChatAdminPage

### Q.8. ALOHIDA SAHIFALAR (router'da inline)
- `/` — DirectorDashboard (DIRECTOR_ROLES)
- `/departments` — DepartmentsPage
- `/positions` — PositionsPage
- `/order-workflow` — OrderWorkflowPage — **401** (URL prefiks bug)

---

## YO'Q DB JADVALLARI — TO'LIQ RO'YXAT (33 ta)

### IoT (5)
1. `iot_sensors` ⚠️ ENG MUHIM
2. `iot_attendance`
3. `room_inspections`
4. `employee_health`
5. `iot_tablet_defects`

### MES (3)
6. `mes_gamification_leaderboard`
7. `mes_shifts` (current shift)
8. `mes_tasks` (general)

### QC (2)
9. `qc_final_orders`
10. `qc_defects_extended`

### SD (1)
11. `sd_active_rentals`

### ERP/Production (4)
12. `routing_operations`
13. `work_center_capacity`
14. `technology_cards`
15. `planning_operations`

### AI (4)
16. `ai_shift_recommendations`
17. `ai_rush_orders`
18. `ai_bottleneck_analysis`
19. `ai_demand_forecast`

### Warehouse/Materials (6)
20. `warehouse_bins`
21. `material_cards`
22. `material_balance`
23. `warehouse_rental` (to'liq)
24. `barcode_warehouse`
25. `inventory_materials`

### Kaizen (2)
26. `kaizen_suggestions`
27. `kaizen_stats`

### MRO (4)
28. `mro_spare_parts`
29. `mro_pm_schedules`
30. `mro_canteen`
31. `mro_facility_inventory`

### Marketing (1)
32. `marketing_settings`

### Order Workflow (1)
33. `order_workflow_saga`

---

## UMUMIY SAHIFA STATISTIKASI 19 MODUL BO'YICHA

| # | Modul | Sahifalar soni | Real / Stub |
|---|---|---|---|
| 1 | Analytics / LMS | 16 | 16 / 0 |
| 2 | HR | 47 | 46 / 1 |
| 3 | AI HR | 2 | 2 / 0 |
| 4 | Self Service | 1 | 1 / 0 |
| 5 | Admin | 10 | 10 / 0 |
| 6 | Warehouse / WMS / Logistics | 41 | 30 / 11 |
| 7 | Marketing | 16 | 11 / 5 |
| 8 | Finance / Accounting / POS | 32 | 26 / 6 |
| 9 | Integration | 7 | 7 / 0 |
| 10 | Camera / Security | 26 | 19 / 7 |
| 11 | Sales / SD / CRM | 29 | 26 / 3 |
| 12 | Production / PP / Tech / BOM | 41 | 21 / 20 |
| 13 | Director / Executive | 19 | 13 / 6 |
| 14 | MES | 12 | 7 / 5 |
| 15 | QC | 17 | 12 / 5 |
| 16 | Design | 12 | 4 / 8 |
| 17 | MRO | 11 | 8 / 3 |
| 18 | IoT | 9 | 6 / 3 |
| 19 | SaaS | 6 | 0 / 6 |
| | **JAMI** | **354** | **265 / 89** |

**+ Qo'shimcha guruhlar:** LMS Admin (4 Stub), LMS Learner (5), Kaizen (1), Orders Registry (1), Architecture Gap (6), Stub (70), Chat (2), Alohida (4) = 93 ta

**📊 GRAND TOTAL:** ~447 ta ro'yxatdan o'tgan route, ~339 sahifa fayl, **89+ Stub holatdagi** sahifa

---

## AUTH GUARD QOIDALARI

| Route prefiks | Talab qilinadigan rol |
|---|---|
| `/api/technology/*` | SUPER_ADMIN, DIRECTOR, TECHNOLOGIST |
| `/api/mro/*` | SUPER_ADMIN, DIRECTOR, MAINTENANCE, TECHNICIAN |
| `/api/planning/*` | super_admin, director, production_manager, technologist, planner |
| `/api/material-balance/*`, `/api/barcode-warehouse/*` | admin, manager, director, warehouse_manager, warehouse_keeper |
| `/api/wms/warehouses/*` | super_admin, warehouse_manager |
| Boshqalari | global JwtAuthGuard (login bo'lishi kifoya) |

---

## WEBSOCKET HOLATI

- ✅ `/chat` namespace — chat.gateway.ts'da ro'yxatdan o'tgan
- ❌ `/dashboard` — yo'q (dashboard real-time uchun)
- ❌ `/iot` — yo'q (IoT live stream uchun)
- ❌ `/mes` — yo'q (OEE live uchun)
- ❌ Default `/` namespace — yo'q

---

## ORPHAN FAYLLAR (router'da yo'q, lekin `src/pages/` da bor)

Sub-komponentlar (alohida sahifa emas, lekin alohida fayl):
- `pages/employee-profile/`: PersonalTab, WorkTab, CareerTab, LeaveTab, CorporateInfoCard
- `pages/kanban/`: KanbanColumn, CalendarView, GanttView, ListView, MyPlanView, NotificationsPanel, TimeTrackingWidget, KanbanCard, TaskDetailSheet, DeadlineColumn
- `pages/kanban/detail/`: ChatPanel, FilesTabContent, ResultsTabContent
- `pages/barcode/`: BatchDialogs, GenerateScannerContent, PrinterSettingsTab, LabelPrintDialog
- `pages/crm/`: ExtendedAIPanel, KanbanColumn, QuickCreateModal
- `pages/warehouse/`: BinsTab, ZonesTab, WarehousesTab
- `pages/iot/`: IoTLoginPanel, IoTSchedulePanel
- `pages/payroll/`: AIPayrollDialog, CalculatePayrollDialog
- `pages/planning/`: PlanningDialogs, PlanningTabPanels
- `pages/qc/`: QCBraksTab, QCReclamationsTab, QCParameterDialog
- `pages/skills-matrix/`: EmployeeSkillDialog, SkillDialog
- `pages/accountant/`: ErpRoadmapCard
- Ildiz darajasidagilar: BirthdayWidget, PhoneScriptSheet, HRAlertBanner, EmployeeStats, CVScreeningGuide

**Status:** Bu fayllar boshqa sahifalar tomonidan import qilinishi mumkin. Tekshirish kerak.

---

## ENG ASOSIY TUZATISH KERAK BO'LGAN ENDPOINTLAR (PRIORITET TARTIBI)

### TIER 1 — DARHOL (cascading errorlarni to'xtatish, 30 daqiqa)
30+ stub controller (404 → 200 empty array) yaratish:
- AI: `shift/recommendations`, `rush-orders`, `bottleneck/analysis`, `forecast/demand`
- IoT: `oee/live`, `attendance/live`, `room-inspections`, `employee-health`, `tablet/defect-reasons`
- MES: `gamification/leaderboard`, `shifts/current`, `tasks`, `downtime-reasons`
- QC: `final-orders`, `final-inspections`, `defects/extended`
- MRO: `spare-parts`, `pm/schedules`, `utility/readings`, `canteen/stats`
- Warehouse: `bins`, `transfers`, `lots`, `goods-receipts`, `internal-requests`
- Kaizen: `suggestions`, `stats`
- Materials: `material-cards`, `material-balance/overview`, `material-balance/alerts`
- Marketing: `settings`, `leads/loss-analysis`
- Capacity: `erp/capacity/load-analysis`

### TIER 2 — Path/Auth fix (1 soat)
- `/api/papka-orders` legacy → modern
- `/api/planning/operations` GET endpoint qo'shish
- TECHNOLOGIST roli to'g'risida tekshiruv
- `OrderWorkflowPage` URL prefiks
- Test user'ga rolelar tayinlash

### TIER 3 — DB schema (1 ish kuni)
33 ta jadvalni yangi migratsiya `0002_missing_tables.sql` ga qo'shish

### TIER 4 — Real handler implementatsiya (3-5 ish kuni)
500 errorlarini modul tartibida tuzatish: Warehouse → MES → IoT → QC → SD → AI

### TIER 5 — WebSocket (1 ish kuni)
3 ta yangi namespace: `/dashboard`, `/iot`, `/mes`

### TIER 6 — Stub sahifalarni real qilish (2-3 hafta)
89+ Stub sahifani prioritet bo'yicha real ishchi holatga keltirish

### TIER 7 — Sifat (davomli)
ESLint, Prettier, test coverage 70%+, monitoring

---

## XOTIMA

**19 modul, 354 ro'yxatdagi sahifa, 89+ Stub, 33 yo'q jadval, 30+ yo'q endpoint, 50+ crash endpoint.**

To'liq tizimga olib kelish uchun **3-4 hafta intensiv ish kerak**. Birinchi qadam — Tier 1 (30 daqiqalik stub controllers) — UI cascading errorlarini darhol to'xtatish.

---

*Hujjat sanasi: 2026-05-04 | Manba fayl: `SYSTEM_AUDIT_REPORT.md`*
