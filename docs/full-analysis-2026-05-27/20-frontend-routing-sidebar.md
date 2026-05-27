# 20 — Frontend Routing & Sidebar Reconciliation

**Audit date:** 2026-05-27
**Scope:** `artifacts/erp-dashboard/src/`
**Router library:** wouter (v2.x) — `<Route path="...">` pattern matching, no nested router, no React Router DOM
**Sidebar config:** `src/components/sidebar/constants-groups-a.ts`, `constants-groups-b.ts`, `constants-finance.ts`, `constants-hr-lms.ts`, `constants-production.ts`, `constants-warehouse-supply.ts`, `constants-admin-coord.ts`

---

## 1. Router Architecture

The application uses a single-SPA pattern with wouter `<Route>` components rendered from `AppRouter.tsx`. All authenticated routes are wrapped in `<PrivateRoute>` + `<AppShellModern>`. Routes are grouped into domain-specific arrays defined in separate `*Routes.tsx` files and flattened into `ALL_MODULE_ROUTES` for 404 detection.

### Route file registry

| File | Route group exported | # Routes |
|------|---------------------|-----------|
| `routes/AnalyticsRoutes.tsx` | `ANALYTICS_ROUTES` | 17 |
| `routes/HRRoutes.tsx` | `HR_ROUTES`, `AI_HR_ROUTES`, `SELF_SERVICE_ROUTES` | 34 |
| `routes/FinanceRoutes.tsx` | `FINANCE_ROUTES` | 33 |
| `routes/ProductionRoutes.tsx` | `PRODUCTION_ROUTES`, `MES_ROUTES`, `QC_ROUTES`, `DESIGN_ROUTES`, `MRO_ROUTES`, `IOT_ROUTES` | 106 |
| `routes/WarehouseRoutes.tsx` | `WAREHOUSE_ROUTES` | 52 |
| `routes/CRMRoutes.tsx` | `SALES_ROUTES`, `MARKETING_ROUTES` | 49 |
| `routes/DirectorRoutes.tsx` | `DIRECTOR_ROUTES` | 29 |
| `routes/CameraRoutes.tsx` | `CAMERA_ROUTES` | 27 |
| `routes/AdminRoutes.tsx` | `ADMIN_ROUTES`, `INTEGRATION_ROUTES`, `SAAS_ROUTES`, `LMS_ADMIN_ROUTES`, `LMS_LEARNER_ROUTES`, `KAIZEN_ROUTES`, `ORDERS_REGISTRY_ROUTES`, `ARCHITECTURE_GAP_ROUTES` | 44 |
| `routes/StubRoutes.tsx` | `STUB_ROUTES` | 74 |
| `routes/AppRouter.tsx` (inline) | `/order-workflow`, `/chat`, `/chat/admin`, `/` | 4 |

**Total registered route patterns: ~449** (plus ~40 redirect aliases in `AppRouter.tsx`)

### Special routes bypassing AppRouter (handled in `App.tsx`)

| Path | Component | Auth required |
|------|-----------|---------------|
| `/login` | `Login` | No |
| `/otp-verify` | `OTPVerify` | No |
| `/iot/tablet` | `IoTTablet` | No |
| `/ai-interview/:id` | `AIInterviewPublicPage` | No |
| `/public/hrc-test/:id` | `HRCapitalPublicTest` | No |
| `/mini-app/*` | `TelegramMiniApp` | No |
| `/pos-monitor/*` | `PosMonitorApp` | No |
| `/chat` / `/chat/*` | `ChatPageFull` (early intercept) | Yes |

---

## 2. All Registered Routes (by module group)

### Analytics / LMS Core

| URL | Component | File:line | Role guard | Status |
|-----|-----------|-----------|------------|--------|
| `/analytics` | `Analytics` | `AnalyticsRoutes.tsx:40` | ALL_AUTHENTICATED | Active |
| `/ai/forecast` | `ForecastAnalytics` | `AnalyticsRoutes.tsx:41` | ALL_AUTHENTICATED | Active |
| `/lms-dashboard` | `LMSDashboard` | `AnalyticsRoutes.tsx:42` | ALL_AUTHENTICATED | Active |
| `/courses` | `Courses` | `AnalyticsRoutes.tsx:43` | ALL_AUTHENTICATED | Active |
| `/lessons` | `Courses` | `AnalyticsRoutes.tsx:44` | ALL_AUTHENTICATED | Active — alias |
| `/courses/:id` | `CourseDetail` | `AnalyticsRoutes.tsx:45` | ALL_AUTHENTICATED | Active |
| `/courses/:id/lessons` | `LessonPlayer` | `AnalyticsRoutes.tsx:46` | ALL_AUTHENTICATED | Active |
| `/courses/:id/lessons/:lessonId` | `LessonPlayer` | `AnalyticsRoutes.tsx:47` | ALL_AUTHENTICATED | Active |
| `/tests` | `Tests` | `AnalyticsRoutes.tsx:48` | ALL_AUTHENTICATED | Active |
| `/tests/:id` | `TestDetail` | `AnalyticsRoutes.tsx:49` | ALL_AUTHENTICATED | Active |
| `/ai-exams` | `AIExams` | `AnalyticsRoutes.tsx:50` | ALL_AUTHENTICATED | Active |
| `/all-exams` | `AllExams` | `AnalyticsRoutes.tsx:51` | ALL_AUTHENTICATED | Active |
| `/certificates` | `Certificates` | `AnalyticsRoutes.tsx:52` | ALL_AUTHENTICATED | Active |
| `/goals` | `GoalsKPI` | `AnalyticsRoutes.tsx:53` | ALL_AUTHENTICATED | Active |
| `/knowledge-base` | `KnowledgeBase` | `AnalyticsRoutes.tsx:54` | ALL_AUTHENTICATED | Active |
| `/kanban` | `KanbanBoard` | `AnalyticsRoutes.tsx:55` | ALL_AUTHENTICATED | Active |
| `/hr/recruiting-kanban` | `RecruitingKanban` | `AnalyticsRoutes.tsx:56` | ALL_AUTHENTICATED | Active |

### HR

| URL | Component | File:line | Role guard | Status |
|-----|-----------|-----------|------------|--------|
| `/employees` | `Employees` | `HRRoutes.tsx:44` | HR_ROLES | Active |
| `/employees/:id` | `EmployeeProfile` | `HRRoutes.tsx:45` | HR_ROLES | Active |
| `/hr-map` | `HRMap` | `HRRoutes.tsx:46` | HR_ROLES | Active |
| `/hr/recruiting` | `RecruitingKanban` | `HRRoutes.tsx:47` | HR_ROLES | Active |
| `/skills-matrix` | `SkillsMatrix` | `HRRoutes.tsx:48` | HR_ROLES | Active |
| `/mentorship` | `Mentorship` | `HRRoutes.tsx:49` | HR_ROLES | Active |
| `/events-calendar` | `EventsCalendar` | `HRRoutes.tsx:50` | HR_ROLES | Active |
| `/applications` | `Applications` | `HRRoutes.tsx:51` | HR_ROLES | Active |
| `/shift-schedule` | `ShiftSchedule` | `HRRoutes.tsx:52` | HR_ROLES | Active |
| `/hr-dashboard` | `HRDashboard` | `HRRoutes.tsx:53` | HR_ROLES | Active |
| `/hr-capital/courses` | `HRCapitalCourses` | `HRRoutes.tsx:54` | HR_ROLES | Active |
| `/hr-capital/tests` | `HRCapitalTests` | `HRRoutes.tsx:55` | HR_ROLES | Active |
| `/org-structure/hierarchy` | `OrgStructureHierarchy` | `HRRoutes.tsx:56` | HR_ROLES | Active |
| `/org-structure/hierarchy/node/:id` | `OrgNodeDetail` | `HRRoutes.tsx:57` | HR_ROLES | Active |
| `/hr/onboarding` | `HROnboarding` | `HRRoutes.tsx:58` | HR_ROLES | Active |
| `/hr/vacation-sick` | `HRVacationSick` | `HRRoutes.tsx:59` | HR_ROLES | Active |
| `/hr/succession` | `HRSuccessionPlanning` | `HRRoutes.tsx:60` | HR_ROLES | Active |
| `/hr/offboarding` | `HROffboarding` | `HRRoutes.tsx:61` | HR_ROLES | Active |
| `/hr/health-monitoring` | `HRHealthMonitoring` | `HRRoutes.tsx:62` | HR_ROLES | Active |
| `/hr/career-path` | `HRCareerPath` | `HRRoutes.tsx:63` | HR_ROLES | Active |
| `/hr/safety` | `HRSafety` | `HRRoutes.tsx:64` | HR_ROLES | Active |
| `/hr/recruiter-kpi` | `RecruiterKPIPage` | `HRRoutes.tsx:65` | HR_ROLES | Active |
| `/hr/reception` | `ReceptionPage` | `HRRoutes.tsx:66` | HR_ROLES | Active |
| `/hr/daily-reports` | `DailyReportPage` | `HRRoutes.tsx:67` | HR_ROLES | Active |
| `/hr/assets` | `HRAssetManagement` | `HRRoutes.tsx:68` | HR_ROLES | Active |
| `/hr/referrals` | `ReferralPage` | `HRRoutes.tsx:69` | HR_ROLES | Active |
| `/hr/candidate-report/:id` | `CandidateReport` | `HRRoutes.tsx:70` | HR_ROLES | Active |
| `/hr/brand` | `HRBrandPage` | `HRRoutes.tsx:71` | HR_ROLES | Active |
| `/weekly-plan` | `WeeklyPlanPage` | `HRRoutes.tsx:72` | HR_ROLES | Active |
| `/hr/inspection` | `InspectionPage` | `HRRoutes.tsx:73` | HR_ROLES | Active |
| `/ai-hr/dashboard` | `HRAIDashboard` | `HRRoutes.tsx:76` | AI_HR_ROLES | Active |
| `/ai-hr/interviews` | `AIInterviewPage` | `HRRoutes.tsx:77` | AI_HR_ROLES | Active |
| `/hr/internal-jobs` | `InternalJobBoard` | `HRRoutes.tsx:80` | ALL_AUTHENTICATED | Active |

### Finance

| URL | Component | File:line | Role guard | Status |
|-----|-----------|-----------|------------|--------|
| `/finance-dashboard` | `FinanceDashboard` | `FinanceRoutes.tsx:39` | FINANCE_ROLES | Active |
| `/cfo/dashboard` | `CFODashboard` | `FinanceRoutes.tsx:40` | FINANCE_ROLES | Active |
| `/finance/cashflow` | `CashFlowManagement` | `FinanceRoutes.tsx:41` | FINANCE_ROLES | Active |
| `/finance/budgets` | `BudgetManagement` | `FinanceRoutes.tsx:42` | FINANCE_ROLES | Active |
| `/finance/order-costing` | `OrderCosting` | `FinanceRoutes.tsx:43` | FINANCE_ROLES | Active |
| `/finance/reports` | `FinancialReports` | `FinanceRoutes.tsx:44` | FINANCE_ROLES | Active |
| `/finance/profitability` | `ProductProfitability` | `FinanceRoutes.tsx:45` | FINANCE_ROLES | Active |
| `/finance/daily-kpi` | `DailyKPIDashboard` | `FinanceRoutes.tsx:46` | FINANCE_ROLES | Active |
| `/accounting/ar` | `AccountsReceivable` | `FinanceRoutes.tsx:47` | FINANCE_ROLES | Active |
| `/accounting/ap` | `AccountsPayable` | `FinanceRoutes.tsx:48` | FINANCE_ROLES | Active |
| `/accounting/payroll-automation` | `PayrollAutomation` | `FinanceRoutes.tsx:49` | FINANCE_ROLES | Active |
| `/accounting/materials` | `MaterialsAccounting` | `FinanceRoutes.tsx:50` | FINANCE_ROLES | Active |
| `/accounting/gl-documents` | `GLDocuments` | `FinanceRoutes.tsx:51` | FINANCE_ROLES | Active |
| `/accounting/chart-of-accounts` | `ChartOfAccounts` | `FinanceRoutes.tsx:52` | FINANCE_ROLES | Active |
| `/accounting/period-closing` | `PeriodClosing` | `FinanceRoutes.tsx:53` | FINANCE_ROLES | Active |
| `/accounting/cash-register` | `CashRegister` | `FinanceRoutes.tsx:54` | FINANCE_ROLES | Active |
| `/pos/dashboard` | `POSDashboard` | `FinanceRoutes.tsx:55` | FINANCE_ROLES | Active |
| `/pos/inventory` | `POSInventoryPage` | `FinanceRoutes.tsx:56` | FINANCE_ROLES | Active |
| `/accounting/income-expense` | `IncomeExpense` | `FinanceRoutes.tsx:57` | FINANCE_ROLES | Active |
| `/accounting/inventory-valuation` | `InventoryValuation` | `FinanceRoutes.tsx:58` | FINANCE_ROLES | Active |
| `/accounting/asset-management` | `AssetManagement` | `FinanceRoutes.tsx:59` | FINANCE_ROLES | Active |
| `/fi/cost-centers` | `FinanceExtended` | `FinanceRoutes.tsx:60` | FINANCE_ROLES | Shallow — same page as 5 others |
| `/fi/transfer-pricing` | `FinanceExtended` | `FinanceRoutes.tsx:61` | FINANCE_ROLES | Shallow |
| `/fi/tax-management` | `FinanceExtended` | `FinanceRoutes.tsx:62` | FINANCE_ROLES | Shallow |
| `/fi/tax-calendar` | `FinanceExtended` | `FinanceRoutes.tsx:63` | FINANCE_ROLES | Shallow |
| `/fi/audit-log` | `FinanceExtended` | `FinanceRoutes.tsx:64` | FINANCE_ROLES | Shallow |
| `/fi/risk-ai` | `FinanceExtended` | `FinanceRoutes.tsx:65` | FINANCE_ROLES | Shallow |
| `/finance/gl-chart-of-accounts` | `GLChartOfAccounts` | `FinanceRoutes.tsx:66` | FINANCE_ROLES | Active |
| `/cfo/config` | `CfoConfigSettings` | `FinanceRoutes.tsx:67` | FINANCE_ROLES | Active |
| `/finance/variance` | `FinanceVariance` | `FinanceRoutes.tsx:68` | FINANCE_ROLES | Active |
| `/finance/break-even` | `FinanceBreakEven` | `FinanceRoutes.tsx:69` | FINANCE_ROLES | Active |
| `/finance/pricing-tiers` | `PricingTiers` | `FinanceRoutes.tsx:70` | FINANCE_ROLES | Active |
| `/ai/finance` | `AIFinancePage` | `FinanceRoutes.tsx:71` | FINANCE_ROLES | Active |

### Production (condensed — 106 routes across 6 groups)

| Group | URL prefix | # Routes | Shallow? | Role guard |
|-------|-----------|----------|----------|------------|
| PP/Planning | `/planning`, `/pp/*`, `/erp/pp/*`, `/ai-production-planning`, `/papka-orders` | 36 | 13 routes share `TechPPExtended` | PRODUCTION_ROLES |
| MES | `/mes/*` | 13 | 7 routes share `MESExtended` | IOT_ROLES |
| QC | `/qc/*`, `/print/*` | 20 | 5 routes share `QCExtended` | QC_ROLES |
| Design | `/design/*`, `/design-orders/:id` | 13 | 8 routes share `DesignExtended` | DESIGN_ROLES |
| MRO | `/mro/*` | 11 | 3 routes share `MROExtended` | MRO_ROLES |
| IoT | `/iot/*` | 9 | 5 routes share `IoTExtended` | IOT_ROLES |

### Warehouse / WMS / Logistics / MM (condensed — 52 routes)

Key routes:

| URL | Component | Status |
|-----|-----------|--------|
| `/warehouse/hub` | `WarehouseHub12` | Active — 9 virtual warehouse tabs inside |
| `/warehouse/hub/:code` | `WarehouseHub12` | Param route — handles `/warehouse/hub/RM-MAIN` etc. |
| `/wms/dashboard` | `WMSDashboard` | Active |
| `/wms/material/360/:id` | `WarehouseMaterial360` | Active — param |
| `/logistics` + 6 subroutes | `LogisticsDashboard` | All shallow — 7 routes same component |
| `/mm/dashboard`, `/mm/vendors`, `/mm/purchase-orders` | Dedicated | Active |
| `/wms/production-balance`, `/wms/transfer`, `/wms/lot-traceability`, `/wms/internal-requests`, `/wms/kpi` | `WMSExtended` | Shallow |

### Sales / CRM / Marketing (condensed — 49 routes)

Key: `/crm-workspace`, `/sd/dashboard`, `/sd/customers`, `/sd/sales-orders`, `/sd/contracts`, `/sd/kpi`, `/sd/dashboard/overview`, `/sd/dashboard/quota` all active with dedicated pages. `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` all share `SDSalesManagement` (shallow).

Marketing: `/marketing/dashboard`, `/marketing/campaigns`, `/marketing/content`, `/marketing/leads`, `/marketing/calendar`, `/marketing/exhibitions`, `/marketing/pr`, `/marketing/budget`, `/marketing/settings`, `/marketing/social-inbox`, `/marketing/website-cms` active with dedicated pages. `/marketing/analytics`, `/marketing/seo`, `/marketing/ab-testing`, `/marketing/competitors`, `/marketing/nps-churn` share `MarketingExtended` (shallow).

### Director / Coordination / Agents (29 routes)

All active with dedicated pages. Key: `/`, `/coordination`, `/agents`, `/agents/:domain`, `/europrint/control`, `/europrint/auditor`, `/ideal-rasm`, `/director/ai-audit`.

### Camera / Security (27 routes)

Active dedicated pages: `/camera-dashboard`, `/cameras`, `/camera-safety`, `/camera-quality`, `/camera-employees`, `/camera-machines`, `/camera-alerts`, `/camera-reports`, `/camera-heatmap`, `/camera-live-monitoring`, `/camera/monitoring`, `/face-registration`, `/attendance-monitor`, `/camera-ai`, `/security`.

Shallow: `/security/attendance`, `/security/zone-access`, `/security/ppe`, `/security/hazmat`, `/security/evacuation`, `/security/visitors`, `/security/rating` all share `SecurityExtended`.

### Admin / Integration / SaaS / LMS Admin (44 routes)

Active: `/settings`, `/super-admin`, `/system-monitor`, `/admin/exceptions`, `/admin/queues`, `/admin/audit-log`, `/approvals`, `/integrations`, `/customer-portal`, `/kaizen`, `/orders-registry`. All 6 `/saas/*` routes share `SaaSExtended`. All 4 LMS admin routes share `LMSExtended`.

### Stub Routes — Still Serving `StubPage` (8 of 74)

| URL | Stub reason | Business priority |
|-----|-------------|------------------|
| `/auth` | Auth system handles login | None — intentional |
| `/export` | Export module not built | Low |
| `/gpt` | External GPT deferred | Low |
| `/micro-modules` | LMS micro-modules deferred | Medium |
| `/modules` | Module manager deferred | Low |
| `/pos/printer-config` | Printer hardware config deferred | Medium |
| `/sap` | SAP integration deferred | High |
| `/v2/pos/printer-config` | Duplicate, deferred | Medium |

---

## 3. Redirect Aliases

All ~40 registered in `AppRouter.tsx` lines 70–135:

| Old path | Canonical path | Guard |
|----------|----------------|-------|
| `/orgstructure`, `/org-structure/builder`, `/org-structure/view` | `/org-structure/hierarchy` | HR_ROLES |
| `/warehouse-management`, `/warehouse/dashboard` | `/warehouse/hub` | WAREHOUSE_ROLES |
| `/accounting-dashboard`, `/fi-finance`, `/erp-finance`, `/fi/dashboard` | `/finance-dashboard` | FINANCE_ROLES |
| `/cfo-dashboard` | `/cfo/dashboard` | FINANCE_ROLES |
| `/accounting/payroll` | `/accounting/payroll-automation` | FINANCE_ROLES |
| `/crm`, `/crm/dashboard`, `/crm/leads`, `/crm/deals`, `/crm/contacts`, `/crm/companies`, `/crm/proposals`, `/crm/invoices` | `/crm-workspace` | SALES_ROLES |
| `/sd/quota-dashboard` | `/sd/dashboard/quota` | SALES_ROLES |
| `/erp-cameras`, `/erp/cameras/reports`, `/erp/cameras/heatmap` | `/camera-dashboard`, `/camera-reports`, `/camera-heatmap` | CAMERA_ROLES |
| `/security/dashboard` | `/security` | CAMERA_ROLES |
| `/iot/live` | `/iot/dashboard` | IOT_ROLES |
| `/europrint/director` | `/` | DIRECTOR_ROLES |
| `/qc/dashboard` | `/qc/dashboard-home` | QC_ROLES |
| `/qc/standards`, `/qc/parameters`, `/qc/tests` | `/qc-module` | QC_ROLES |
| `/succession-planning`, `/hr/succession-planning` | `/hr/succession` | HR_ROLES |
| `/hr/leave` | `/hr/vacation-sick` | HR_ROLES |
| `/feedback` | `/kanban` | ALL |
| `/logout` | `/login` | ALL |
| `/erp-analytics` | `/analytics` | ADMIN_ROLES |
| `/erp-roles` | `/settings` | ADMIN_ROLES |
| `/erp/planning` | `/planning?tab=plans` | PRODUCTION_ROLES |
| `/erp/pp/mrp` | `/planning?tab=mrp` | PRODUCTION_ROLES |
| `/tech/dashboard`, `/tech/approval`, `/tech/parameters`, `/tech/standards` | `/tech/dashboard-home`, `/tech-approval` | PRODUCTION_ROLES |
| `/sales` | `/erp/sales` | SALES_ROLES |

---

## 4. Route vs Sidebar Reconciliation

### Sidebar URLs with no registered route (and no redirect alias)

These are genuine broken links — a user clicking them reaches the 404/NotFound render:

| Sidebar label | URL | Module | Severity |
|---------------|-----|--------|----------|
| CFO | `cfo` | tz10 | P1 — `/cfo` unregistered; `/cfo/dashboard` exists |
| Aktivlar | `assets` | tz11 | P1 — `/assets` unregistered; `/hr/assets` exists |
| Bildirishnomalar | `notifications` | tz11 | P1 — `/notifications` unregistered |
| Hujjat Oqimi | `hr/documents` | tz11 | P1 — API exists, no frontend route |
| Org Chart | `org-chart` | (hidden) | P1 — no route; `/org-structure/hierarchy` exists |
| RACI Matrix | `raci-matrix` | (hidden) | P2 — `/raci-crisis` exists |
| Discipline | `discipline` / `discipline-records` | (hidden) | P2 — no route |
| HR Alumni | `hr/alumni` | (hidden) | P3 |
| HR PIP | `hr/pip` | (hidden) | P3 |
| HR Peer Review | `hr/peer-review` | (hidden) | P3 |
| HR Conflict | `hr/conflict` | (hidden) | P3 |
| HR eNPS | `hr/enps` | (hidden) | P3 |
| HR Gamification | `hr/gamification` | (hidden) | P3 |
| HR Milestones | `hr/milestones` | (hidden) | P3 |
| Questionnaire | `questionnaire` | (hidden) | P3 |
| Seven Functions | `seven-functions` | (hidden) | P3 |
| Adaptation | `adaptation` | (hidden) | P3 |
| Business Health | `business-health` | (hidden) | P3 |

### Sidebar URLs that resolve via redirect (functional but legacy)

| Sidebar label | Sidebar URL | Redirects to | Notes |
|---------------|------------|--------------|-------|
| CFO Dashboard | `cfo-dashboard` | `/cfo/dashboard` | Works; update sidebar to canonical |
| Texnik Tasdiqlash | `tech/approval` | `/tech-approval` | Works |
| Kvota Dashboard | `sd/quota-dashboard` | `/sd/dashboard/quota` | Works |
| Sotish Paneli | `sales` | `/erp/sales` | Works |
| Direktor Dashboard | `europrint/director` | `/` | Confusing — renders root dashboard |
| QC Dashboard (tz04 in constants-groups-a) | `qc/dashboard` | `/qc/dashboard-home` | Works |

### Routes with no sidebar entry (expected — detail pages)

| URL | Reason |
|-----|--------|
| `/order-workflow` | Sprint 4, not in sidebar yet |
| `/hr/candidate-report/:id` | Detail page, launched from list |
| `/design-orders/:id` | Detail page |
| `/production/orders/:id` | Detail page |
| `/org-structure/hierarchy/node/:id` | Detail page |
| `/wms/material/360/:id` | Detail page |
| `/crm/customer/:id` | Detail page |
| `/finance/gl-chart-of-accounts` | Sub-page |
| `/finance/variance`, `/finance/break-even`, `/finance/pricing-tiers` | Finance sub-pages |
| `/video-progress` | Alias for lesson player |

### Duplicate frontend URL registrations

| URL | Both registered in | Assessment |
|-----|-------------------|------------|
| `/ai-crm` and `/ai/crm` | `CRMRoutes.tsx:44,45` | Intentional alias — first match wins |
| `/wms/grn` and `/warehouse/goods-receiving` | `WarehouseRoutes.tsx` | Intentional alias |
| `/wms/reservation` and `/warehouse/reservations` | `WarehouseRoutes.tsx` | Intentional alias |
| `/wms/inventory` and `/warehouse/inventory-count` | `WarehouseRoutes.tsx` | Intentional alias |

No accidental duplicates found.

---

## 5. Shallow Components (Many URLs, One Page)

These groups have multiple sidebar-visible URLs all rendering the same React component with no internal URL-based differentiation — the user sees the same UI regardless of which link they click:

| Component | # URLs | Sample paths | Risk |
|-----------|--------|-------------|------|
| `TechPPExtended` | 13 | `/tech/material-alternatives`, `/tech/machine-selection`, `/pp/what-if`, etc. | P2 |
| `MESExtended` | 7 | `/mes/oee-monitor`, `/mes/reason-log`, `/mes/gamification`, etc. | P2 |
| `DesignExtended` | 8 | `/design/ai-review`, `/design/3d-mockup`, `/design/library`, etc. | P2 |
| `FinanceExtended` | 6 | `/fi/cost-centers`, `/fi/transfer-pricing`, `/fi/tax-management`, etc. | P2 |
| `SecurityExtended` | 7 | `/security/attendance`, `/security/ppe`, `/security/hazmat`, etc. | P2 |
| `LogisticsDashboard` | 7 | `/logistics`, `/logistics/transport`, `/logistics/route-planning`, etc. | P2 |
| `WMSExtended` | 5 | `/wms/production-balance`, `/wms/transfer`, `/wms/lot-traceability`, etc. | P2 |
| `IoTExtended` | 5 | `/iot/sensor-monitoring`, `/iot/predictive-maintenance`, etc. | P2 |
| `MarketingExtended` | 5 | `/marketing/analytics`, `/marketing/seo`, `/marketing/ab-testing`, etc. | P2 |
| `SDSalesManagement` | 4 | `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` | P2 |
| `MROExtended` | 3 | `/mro/expense-control`, `/mro/uniforms`, `/mro/sanitation` | P2 |
| `SaaSExtended` | 6 | All `/saas/*` routes | P2 |
| `LMSExtended` | 9 | LMS admin + learner routes | P2 |
| `QCExtended` | 5 | `/qc/lab`, `/qc/iso`, `/qc/ai-analysis`, `/qc/reports`, `/qc/settings` | P2 |

Total: ~100 routes (of ~449) render identical UI — sidebar navigation has no visual effect for those paths.

---

## 6. Summary

| Metric | Value |
|--------|-------|
| Total registered route patterns | ~449 |
| Redirect aliases in AppRouter | ~40 |
| Currently serving StubPage | 8 |
| Routes with no sidebar entry (expected detail pages) | ~16 |
| Sidebar URLs with no route (broken links) | 5 visible P1, 3 P2, 10+ P3 hidden |
| Shallow components (many URLs → same UI) | 14 clusters, ~100 routes |
| Intentional duplicate aliases | 4 pairs |
| MES routes mis-guarded as IOT_ROLES | 13 routes |

---

## 7. Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested fix |
|-------|----------|--------------------|--------|---------------|
| `/assets` sidebar link not registered as route | P1 | `constants-groups-b.ts` tz11 item `url: "assets"` | Sidebar click hits NotFound | Change sidebar url to `hr/assets` |
| `/notifications` sidebar link not registered | P1 | `constants-groups-b.ts` tz11 item `url: "notifications"` | Sidebar click hits NotFound | Register `/notifications` in AdminRoutes or HRRoutes |
| `/hr/documents` sidebar link not registered | P1 | `constants-hr-lms.ts` tz11 item `url: "hr/documents"` | API endpoint exists but no page | Create `HRDocuments` page, register route |
| `/cfo` sidebar link not registered | P1 | `constants-finance.ts` tz10 item `url: "cfo"` | Sidebar "CFO" link hits NotFound | Change to `cfo/dashboard` |
| `/org-chart` in hidden sidebar has no route | P1 | `constants-*` hidden items | If un-hidden, link breaks | Register or point to `/org-structure/hierarchy` |
| MES routes guarded by IOT_ROLES not PRODUCTION_ROLES | P1 | `AppRouter.tsx:101` `<ModuleGroup roles={IOT_ROLES} routes={MES_ROUTES} />` | MES inaccessible to PRODUCTION_MANAGER without IOT role | Change to `PRODUCTION_ROLES` or union |
| 8 routes still serving StubPage | P2 | `StubRoutes.tsx:42–50` | `/sap`, `/pos/printer-config` show placeholder | Prioritize `/sap` and `/pos/printer-config` |
| ~100 routes render identical UI (shallow components) | P2 | `ProductionRoutes.tsx:TechPPExtended`, `MESExtended`, etc. | Navigation links appear to work but have no effect | Add tab or sub-route switching inside shared components |
| `cfo-dashboard` sidebar default uses legacy redirect | P2 | `constants-finance.ts` defaultUrl | Extra redirect roundtrip | Update defaultUrl to `cfo/dashboard` |
| `europrint/director` redirect goes to root `/` | P2 | `AppRouter.tsx:136` | Confusing UX for director module | Update tz16 defaultUrl or add `/director` canonical route |
| 20+ hidden sidebar items have no routes | P3 | `constants-hr-lms.ts` hidden HR items | Risk if items are un-hidden | Create backlog ticket for each; add routes first |
| Duplicate aliases `/ai-crm` and `/ai/crm` | P3 | `CRMRoutes.tsx:44,45` | Minor — both work | Remove `/ai-crm` or document intentionally |

---

## 8. Open Questions / UNVERIFIED

- `ModuleSidebar.tsx` `findModuleByPath` matching logic for parameterized paths like `/warehouse/hub/RM-MAIN` — not fully inspected.
- `constants-hidden.ts` full contents not read — additional hidden sidebar items may exist beyond those discovered.
- `constants-sales-crm.ts` and `constants-utils.ts` not fully read.
- Exact role string values in `HR_ROLES`, `FINANCE_ROLES`, etc. not verified against backend `@Roles()` decorator values.
- `RoleRoute` behavior (404 vs redirect) when role check fails — not confirmed.
- Whether `MES_ROUTES` being guarded by `IOT_ROLES` is intentional design or a copy-paste error from a previous refactor.
