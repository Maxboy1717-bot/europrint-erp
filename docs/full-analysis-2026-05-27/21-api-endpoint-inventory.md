# 21 — API Endpoint Inventory

**Audit date:** 2026-05-27
**Scope:** `apps/api/src/`
**Framework:** NestJS with CQRS (CommandBus / QueryBus), Zod validation, JWT + RolesGuard auth
**Total controllers:** 338
**Total route declarations extracted:** 2,851
**Unique method+path pairs:** 2,785 (66 detected as duplicates)

---

## 1. Controller Inventory by Module

### Auth

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| POST | `/auth/login` | `auth.controller.ts:84` | `authService.login()` | Real | JwtAuthGuard | Active |
| POST | `/auth/logout` | `auth.controller.ts:115` | `authService.logout()` | Real | JwtAuthGuard | Active |
| POST | `/auth/refresh` | `auth.controller.ts:147` | `authService.refresh()` | Real | JwtAuthGuard | Active |
| PATCH | `/auth/change-password` | `auth-account.controller.ts:44` | `authService.changePassword()` | Real | JwtAuthGuard | Active |
| POST | `/auth/verify-otp` | `auth-account.controller.ts:60` | `authService.verifyOtp()` | Real | JwtAuthGuard | Active |
| POST | `/auth/resend-otp` | `auth-account.controller.ts:71` | `authService.resendOtp()` | Real | JwtAuthGuard | Active |
| GET | `/auth/me` | `auth-account.controller.ts:81` | `authService.getMe()` | Real | JwtAuthGuard | Active |
| GET | `/auth/health` | `auth-account.controller.ts:88` | — | None | Public | Active |
| GET | `/auth/me/permissions` | `me-permissions.controller.ts:36` | `permissionsService.getForUser()` | Real | JwtAuthGuard | Active |

### Finance — GL / Trial Balance

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET | `/finance/gl` | `finance-gl.controller.ts:55` | `queryBus.execute(GetGlEntriesQuery)` | Real — CQRS | RolesGuard ACCOUNTANT/DIRECTOR/SUPER_ADMIN | Active |
| POST | `/finance/gl/post-sales-invoice` | `finance-gl.controller.ts:68` | `glPostingService.postSalesInvoice()` | Real | RolesGuard ACCOUNTANT/SUPER_ADMIN | Active |
| POST | `/finance/gl/post-payroll` | `finance-gl.controller.ts:83` | `glPostingService.postPayroll()` | Real | RolesGuard ACCOUNTANT/SUPER_ADMIN | Active |
| GET | `/finance/gl/trial-balance` | `finance-gl.controller.ts:98` | `glService.getTrialBalance()` | Real | RolesGuard ACCOUNTANT/DIRECTOR/SUPER_ADMIN | Active |
| GET | `/finance/gl/ledger/:accountCode` | `finance-gl.controller.ts:111` | `glService.getLedger()` | Real | RolesGuard ACCOUNTANT/DIRECTOR/SUPER_ADMIN | Active |

### Finance — Invoices (contains fake data)

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| POST | `/finance/invoices/create` | `finance-invoices.controller.ts:85` | Returns `{invoiceId: Math.random()*RANGE, invoiceNumber: INV-${Date.now()}}` | **FAKE** — no DB write | RolesGuard FINANCE_OFFICER/SUPER_ADMIN | Bug |
| POST | `/finance/invoices/:invoiceId/post` | `finance-invoices.controller.ts:98` | `invoiceService.post()` | Real | RolesGuard | Active |
| GET | `/finance/invoices` | `finance-invoices.controller.ts:*` | `invoiceService.list()` | Real | RolesGuard | Active |

### Finance — Other

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET | `/finance/budgets` | `finance-budgets.controller.ts` | `budgetsService.list()` | Real | RolesGuard | Active |
| POST | `/finance/budgets` | `finance-budgets.controller.ts` | `budgetsService.create()` | Real | RolesGuard | Active |
| GET | `/finance/cashflow` | `cashflow.controller.ts` | `cashflowService.get()` | Real | RolesGuard | Active |
| GET | `/finance/variance` | `finance-variance.controller.ts` | `varianceService.get()` | Real | RolesGuard | Active |
| GET | `/finance/break-even` | `finance-break-even.controller.ts` | `breakEvenService.get()` | Real | RolesGuard | Active |
| GET | `/finance/ratios` | `finance-ratios.controller.ts` | `ratiosService.get()` | Real | RolesGuard | Active |
| GET | `/finance/payments` | `finance-payments.controller.ts` | `paymentsService.list()` | Real | RolesGuard | Active |
| GET/POST | `/financial-reports/*` (11 routes) | `financial-reports.controller.ts` | `financialReportsService.*` | Real | RolesGuard | Active |
| GET | `/gl` | `gl-standalone.controller.ts` | `glService.*` | Real | RolesGuard | Active (3 routes) |
| GET/POST | `/fi/*` (18 routes) | `fi.controller.ts` | `fiService.*` | Real | RolesGuard | Active |
| GET/POST | `/accounting/*` (9 routes) | `finance-accounting.controller.ts:138` | Note: `if (!orderId) return []` | **FAKE fallback** | RolesGuard | Partial stub |
| GET/POST | `/payroll/*` (8 routes total) | `finance-payroll.controller.ts`, `payroll-periods.controller.ts` | `payrollService.*` | Real | RolesGuard | Active |
| GET | `/reports` (8 routes) | `reports.controller.ts` | `reportsService.*` | Real | RolesGuard | Active |
| GET/POST | `/finance-extended/*` (32 routes) | `finance-extended*.controller.ts` | `financeExtendedService.*` | Real | RolesGuard | Active |
| GET | `/order-costing/*` (5 routes) | `order-costing.controller.ts` | `orderCostingService.*` | Real | RolesGuard | Active |
| GET | `/pricing/*` (3 routes) | `pricing.controller.ts` | `pricingService.*` | Real | RolesGuard | Active |
| GET/PATCH | `/cfo` (6 routes) | `compatibility/cfo.controller.ts` | `cfoService.*` | Real | RolesGuard | Active |

### HR — Dashboard

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET | `/hr/*` (43 routes) | `hr-dashboard.controller.ts` | `hrService.*` | Real | RolesGuard | Active |
| GET | `/hr/*` (26 routes) | `hr-dashboard-stubs.controller.ts` | Returns HTTP 501 via `notImplemented()` | **Dead** — HTTP 501 | RolesGuard | Stubs — P3-26 |
| POST/PATCH | `/hr/*` (9 routes) | `hr-dashboard-stubs-write.controller.ts` | Returns HTTP 501 | **Dead** — HTTP 501 | RolesGuard | Stubs |
| GET | `/hr/*` (26 routes) | `hr-compat-a.controller.ts` | `hrCompatService.*` | Real | RolesGuard | Active |
| GET/POST | `/hr/*` (18 routes) | `hr-compat-safety.controller.ts` | `hrSafetyService.*` | Real | RolesGuard | Active |
| GET | `/hr/*` (11 routes) | `hr-dashboard-extra.controller.ts` | `hrExtraService.*` | Real | RolesGuard | Active |
| GET | `/hr/*` (12 routes) | `hr-gsd.controller.ts` | `hrGsdService.*` | Real | RolesGuard | Active |
| GET | `/hr/*` (6 routes) | `hr-shifts-compat.controller.ts` | `hrShiftsService.*` | Real | RolesGuard | Active |

### HR — Employees

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET/POST/PATCH/DELETE | `/employees/*` (49 routes) | `employees-compat-sub.controller.ts` | `employeesService.*` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/employees/*` (13 routes) | `employees-compat.controller.ts` | `employeesService.*` | Real | RolesGuard | Active |
| GET | `/employees/*` (5 routes) | `employees-extra.controller.ts` | `employeesExtraService.*` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/hr/employees/*` (26 routes total) | `hr-employees.controller.ts`, `hr-employees-ext.controller.ts`, `hr-employee-goals.controller.ts` | `hrEmployeesService.*` | Real | RolesGuard | Active |

### HR — Recruitment

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET/POST/PATCH/DELETE | `/hr/recruitment/*` (14 routes) | `hr-vacancies.controller.ts` | `vacanciesService.*` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/hr/recruitment/*` (14 routes) | `hr-vacancies-pipeline.controller.ts` | `pipelineService.*` | Real | RolesGuard | Active |
| GET | `/hr/recruitment/*` (6 routes) | `hr-vacancies-analytics.controller.ts` | `vacancyAnalyticsService.*` | Real | RolesGuard | Active |
| GET | `/hr/recruitment/*` (6 routes) | `hr-vacancies-probation.controller.ts` | `probationService.*` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/hr/recruitment/*` (16 routes) | `recruitment.controller.ts` | `recruitmentService.*` | Real | RolesGuard | Active |
| GET/POST | `/hr/recruitment/*` (7 routes) | `recruitment-offers.controller.ts` | `offersService.*` | Real | RolesGuard | Active |

### HR — Attendance / Leave / Safety

| Method | Path | Controller | DB | Guards | Status |
|--------|------|-----------|-----|--------|--------|
| GET/POST | `/hr/attendance/*` (11 routes total) | `hr-attendance.controller.ts`, `attendance-face.controller.ts` | Real | RolesGuard | Active |
| GET/POST/PATCH/DELETE | `/hr/leave/*` (9 routes) | `hr-leave.controller.ts` | Real | RolesGuard | Active |
| GET | `/hr/leave/accrual` (1 route) | `hr-leave-accrual.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/hr/safety/*` (7 routes) | `hr-safety.controller.ts` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/hr/payroll/*` (6 routes) | `hr-payroll.controller.ts`, `hr-payroll-closure.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/hr/onboarding/*` (15 routes) | `onboarding.controller.ts` | Real | RolesGuard | Active |
| GET/POST/PATCH | `/hr/offboarding/*` (8 routes) | `hr-offboarding.controller.ts` | Real | RolesGuard | Active |

### Analytics / Director

| Method | Path | Controller:line | Service.method | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|----------------|-------------------|--------|--------|
| GET | `/analytics/stats` | `analytics.controller.ts:25` | `svc.getStats()` | Real | None visible | Active |
| GET | `/analytics/course-progress` | `analytics.controller.ts:30` | `svc.getCourseProgress()` | Real | None visible | Active |
| GET | `/analytics/user-activity` | `analytics.controller.ts:35` | `svc.getUserActivity()` | Real | None visible | Active |
| GET | `/analytics/test-results` | `analytics.controller.ts:40` | `svc.getTestResults()` | Real | None visible | Active |
| GET | `/analytics/funnel` | `analytics.controller.ts:50` | `svc.getFunnel()` | Real | None visible | Active |
| GET | `/analytics/*` (18 routes) | `analytics-extended.controller.ts` | `analyticsExtService.*` | Real | RolesGuard | Active |
| GET/POST | `/director/*` (13 routes total) | `director-root.controller.ts`, `director-extended.controller.ts` | `directorService.*` | Real | RolesGuard | Active |
| GET | `/director/dashboard/*` (5 routes) | `dashboard.controller.ts` | `dashboardService.*` | Real | RolesGuard | Active |
| GET/POST | `/director/approvals/*` (7 routes) | `approvals.controller.ts` | `approvalsService.*` | Real | RolesGuard | Active |
| GET/POST | `/coordination/*` (14 routes) | `coordination.controller.ts` | `coordinationService.*` | Real | RolesGuard | Active |
| GET/POST | `/kaizen/*` (6 routes) | `kaizen.controller.ts` | `kaizenService.*` | Real | RolesGuard | Active |
| GET/POST | `/okr/*` (10 routes) | `okr.controller.ts` | `okrService.*` | Real | RolesGuard | Active |
| GET/POST | `/strategic/*` (12 routes) | `strategic.controller.ts` | `strategicService.*` | Real | RolesGuard | Active |

### Marketing

| Method | Path | Controller:line | DB real/fake/dead | Status |
|--------|------|-----------------|-------------------|--------|
| GET/POST/DELETE/PATCH | `/marketing/*` (22 routes) | `marketing-analytics.controller.ts` | Real | Active |
| POST | `/marketing/content/ai-generate` | `marketing-analytics-stubs.controller.ts` | **Dead — HTTP 501** | Stub |
| GET | `/marketing/nps/stats`, `/marketing/nps/monthly`, `/marketing/nps` | `marketing-analytics-stubs.controller.ts` | **Dead — HTTP 501** | Stub |
| GET | `/marketing/churn-risk/*` | `marketing-analytics-stubs.controller.ts` | **Dead — HTTP 501** | Stub |
| (54 more routes in stubs) | `/marketing/*` | `marketing-analytics-stubs.controller.ts:*` | **Dead — HTTP 501** | Stub |
| GET/POST | `/marketing/campaigns/*` (6 routes) | `marketing.controller.ts` | Real | Active |
| GET/POST | `/marketing/content/*` (14 routes) | `marketing-content.controller.ts` | Real | Active |

### MES (Manufacturing Execution System)

| Method | Path | Controller:line | DB real/fake/dead | Guards | Status |
|--------|------|-----------------|-------------------|--------|--------|
| GET | `/mes/shifts/current` | `mes-shifts-stats.controller.ts:40` | Real | RolesGuard | Active |
| POST | `/mes/shifts/handover` | `mes-shifts-stats.controller.ts:48` | Real | RolesGuard | Active |
| GET | `/mes/oee` | `mes-shifts-stats.controller.ts:80` | Real | RolesGuard | Active |
| GET | `/mes/stats` | `mes-shifts-stats.controller.ts:87` | Real | RolesGuard | Active |
| GET | `/mes/orders` | `mes-shifts-stats.controller.ts:163` | **FAKE — `return []`** | RolesGuard | Dead stub |
| GET | `/mes/shifts` | `mes-shifts-stats.controller.ts:174` | **FAKE — `return []`** | RolesGuard | Dead stub |
| GET | `/mes/maintenance` | `mes-shifts-stats.controller.ts:179` | **FAKE — `return []`** | RolesGuard | Dead stub |
| GET/POST | `/mes/operations/*` (8 routes) | `mes-operations.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/mes/production-sessions/*` (5 routes) | `mes-production-sessions.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/mes/sessions/*` (6 routes) | `mes-sessions.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/mes/*` (11 routes) | `mes-maintenance.controller.ts` | Real | RolesGuard | Active |

### WMS / Warehouse

| Method | Path | Controller | DB | Guards | Status |
|--------|------|-----------|-----|--------|--------|
| GET/POST/PATCH | `/warehouse/*` (many routes) | `wms-catalog.controller.ts` | Real (P3-26: 501 for unimplemented) | RolesGuard | Mostly active |
| GET | `/wms/inventory/*` (6 routes) | `wms-inventory.controller.ts` | Real | RolesGuard | Active |
| GET | `/wms/*` (12 routes) | `wms-extended.controller.ts:170` | Note: `getMovements() return []` | **FAKE fallback** | RolesGuard | Partial stub |
| GET/POST | `/wms/stock/*` (7 routes) | `wms-stock.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/wms/rental/*` (3 routes) | `wms-rental.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/wms/warehouses/*` (6 routes) | `wms-warehouses.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/wms/counts/*` (8 routes) | `wms-counts.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/wms/goods-issue/*` (3 routes) | `wms-goods-issue.controller.ts` | Real | RolesGuard | Active |
| GET | `/wms/eoq/*` (2 routes) | `wms-eoq.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/wms/analytics/*` (3 routes) | `wms-analytics.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/warehouse-rental/*` (11 routes) | `warehouse-rental.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/inventory/*` (9 routes) | `wms-gateway-inventory.controller.ts`, `inventory-advanced.controller.ts`, `inventory-materials.controller.ts` | Real | RolesGuard | Active |
| GET/POST | `/warehouses/*` (21 routes) | `compatibility/resources.controller.ts` | Real | RolesGuard | Active (with duplicate issue) |

### MM (Materials Management)

| Method | Path | Controller:line | DB | Status |
|--------|------|-----------------|-----|--------|
| GET/POST | `/mm/*` (27 routes) | `mm-dashboard.controller.ts` | Real (note: P3-26 comment) | Active |
| GET/POST | `/mm/*` (13 routes) | `mm-goods.controller.ts:91,147` | Note: `return {}` for 2 routes | **Fake responses** on 2 endpoints |
| GET/POST | `/mm/materials/*` (6 routes) | `mm-materials.controller.ts` | Real | Active |
| GET/POST | `/mm/purchase-orders/*` (9 routes) | `mm-purchase-orders.controller.ts:64,90` | `catch (_e) { return [] }` — silenced errors | **Fake fallback** |
| GET | `/mm/*` (11 routes) | `mm-vendors-pr.controller.ts:56,163` | `return []` and `return {}` | **Fake responses** on 2 endpoints |
| GET/POST | `/raw-materials/*` (1 route) | `mm-raw-materials.controller.ts` | Real | Active |
| GET | `/materials/cards/*` (2 routes) | `mm-material-cards.controller.ts` | Real | Active |

### Sales & Distribution (SD)

| Method | Path | Controller:line | DB | Status |
|--------|------|-----------------|-----|--------|
| GET/POST | `/sd/customers/*` (24 routes) | `sd-customers.controller.ts:207,264,314,346` | 4 routes `return {}` | **Fake responses** |
| GET | `/sd/contracts` | `sd-contracts.controller.ts:63` | `return []` | **Fake — empty list** |
| GET/POST | `/sd/orders/*` (9 routes) | `sd-orders.controller.ts` | Real | Active |
| GET/POST | `/sd/leads/*` (11 routes) | `sd-leads.controller.ts` | Real | Active |
| GET/POST | `/sd/quotations/*` + `/sd/*` (23 routes) | `sd-quotations.controller.ts` | Real | Active |
| GET/POST | `/sd/invoices/*` (3 routes) | `sd-invoices.controller.ts` | Real | Active |
| GET/POST | `/sd/payments/*` + `/sd/*` (6 routes) | `sd-payments.controller.ts` | Real | Active |
| GET/POST | `/sd/deliveries/*` (3 routes) | `sd-deliveries.controller.ts` | Real | Active |
| GET/POST | `/sd/dashboard/*` (3 routes) | `sd-dashboard.controller.ts` | Real | Active |
| GET/POST | `/sales/*` (9 routes) | `sales.controller.ts` | Real | Active |
| GET | `/sd/customers` — visitors | `security.controller.ts:154` | `return []` for `getVisitors()` | **Fake** |

### CRM

| Method | Path | Controller:line | DB | Status |
|--------|------|-----------------|-----|--------|
| GET/POST | `/crm/*` (many routes) | `crm-leads.controller.ts`, `crm-leads-ops.controller.ts` | Real | Active |
| GET/POST | `/crm/*` | `crm-deals.controller.ts:57` | Note: `// TODO PA1-11: replace...` | Active but TODO |
| GET/POST | `/crm/activities/*` (7 routes) | `crm-activities.controller.ts:131` | `return {}` for 1 route | **Fake response** |
| GET/POST | `/crm/*` | `crm-companies.controller.ts:156` | `return {}` for 1 route | **Fake response** |
| GET/POST | `/crm/followup-activities/*` (5 routes) | `crm-followup-compat.controller.ts:98` | `return {}` for 1 route | **Fake response** |
| GET/POST | `/crm/ai/*` (12 routes) | `crm-ai-extended.controller.ts` | Real | Active |
| GET/POST | `/crm/custom-fields/*` (5 routes) | `crm-custom-fields.controller.ts` | Real | Active |

### Production Planning (PP)

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/pp/bom/*` (6 routes) | `pp-bom.controller.ts` | Real | Active |
| GET/POST | `/pp/orders/*` (5 routes) | `pp-orders.controller.ts` | Real | Active |
| GET/POST | `/pp/routing/*` (6 routes) | `pp-routing.controller.ts` | Real | Active |
| GET/POST | `/pp/work-centers/*` (6 routes) | `pp-work-centers.controller.ts` | Real | Active |
| GET/POST | `/planning/*` (3 routes) | `pp-planning.controller.ts` | Real | Active |
| GET/POST | `/equipment/*` (4 routes) | `pp-equipment.controller.ts` | Real | Active |
| GET | `/pp/*` (4 routes) | `pp-intelligence.controller.ts` | Real | Active |
| GET/POST | `/production/*` (4+7 routes) | `production-reports.controller.ts`, `production-shift-reports.controller.ts` | Real | Active |
| GET/POST | `/technology/*` (13 routes) | `technology.controller.ts` | Real | Active |

### QC

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/qc/*` (13 routes) | `qc-defects-extended.controller.ts` | Real | Active |
| GET/POST | `/qc/*` (15 routes) | `qc-defects.controller.ts` | Real | Active |
| GET | `/qc/*` (2 routes) | `qc-dpmo.controller.ts` | Real | Active |
| GET/POST | `/qc/*` (13 routes) | `qc-extended.controller.ts` | Real | Active |
| GET/POST | `/qc/inspections/*` (6 routes) | `qc-inspections.controller.ts` | Real | Active |
| GET/POST | `/qc/*` (11 routes) | `qc-new.controller.ts` | Real | Active |
| GET/POST | `/qc/*` (12 routes) | `qc-parameters.controller.ts` | Real | Active |
| GET/POST | `/qc/*` (4 routes) | `qc-reclamations.controller.ts` | Real | Active |
| GET/POST | `/print/*` (4 routes) | `print.controller.ts` | Real | Active |

### IoT / Camera

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/camera-ai/*` (10 routes) | `camera-ai.controller.ts` | Real | Active |
| GET/POST | `/camera-alerts/*` (17 routes) | `camera-alerts.controller.ts` | Real | Active |
| GET/POST | `/camera-dashboard/*` (9 routes) | `camera-dashboard.controller.ts` | Real | Active |
| GET/POST | `/camera-heatmap/*` (8 routes) | `camera-heatmap-reports.controller.ts` | Real | Active |
| GET/POST | `/camera/*` (21 routes) | `camera-recognition.controller.ts`, `iot-camera-events.controller.ts`, `iot-camera.controller.ts` | Real | Active |
| GET/POST | `/iot/*` (44 routes) | `iot-main.controller.ts`, `iot-alerts.controller.ts`, `iot-sensors.controller.ts`, `iot-tablet.controller.ts` | Real | Active |
| GET/POST | `/iot-sensors/*` (11 routes) | `iot-sensors-main.controller.ts` | Real | Active |
| GET/POST | `/iot-enhanced/*` (8 routes) | `iot-enhanced.controller.ts` | Real | Active |
| GET/POST | `/iot/*` (7 routes) | `iot-material-kits.controller.ts` | Real | Active |

### Kanban

| Method | Path | Controller:line | DB real/fake/dead | Status |
|--------|------|-----------------|-------------------|--------|
| GET/POST | `/kanban/*` (22 routes) | `kanban-boards.controller.ts:107,140,173` | 2x `return {}`, 1x `if (!result.ok) return []` | Mixed — mostly real, 3 fake fallbacks |
| GET/POST | `/kanban/*` (19 routes) | `kanban-cards.controller.ts` | Real | Active |
| GET/POST | `/kanban/*` (17 routes) | `kanban-checklist.controller.ts` | Real | Active |
| GET/POST | `/kanban/*` (11 routes) | `kanban-card-files.controller.ts` | Real | Active |
| GET/POST | `/kanban/*` (10 routes) | `kanban-core.controller.ts` | Real | Active |
| GET/POST | `/kanban/*` (9 routes) | `kanban-reports.controller.ts` | Real | Active |
| GET/POST | `/kanban/*` (5 routes) | `kanban.controller.ts` | Real | Active |
| None | `kanban-ext.controller.ts` | `@Controller()` with 0 method decorators | Dead file | Orphan |

### POS

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/pos/*` (full system — ~80 routes) | `pos.controller.ts`, `cash-register.controller.ts`, `barcode.controller.ts`, `employee.controller.ts`, `inventory-count.controller.ts`, `movements.controller.ts`, `reports.controller.ts`, `requests.controller.ts`, `stock.controller.ts`, `sync.controller.ts`, `warehouse-features.controller.ts`, `pos-wms.controller.ts`, `mini-app.controller.ts`, `pos-notifications.controller.ts` | Real | Active |
| GET/POST | `/pos/*` (6 routes) | `pos-stub.controller.ts:128` | Note: `// TODO P3-26: migrate...` | Legacy stubs |
| GET/POST | `/pos-v2/*` (15 routes) | `pos-v2/barcode.controller.ts`, `inventory-count.controller.ts`, `reports.controller.ts`, `requests.controller.ts` | Real | Active |
| GET/POST | `/legacy/pos/*` (19 routes) | `pos.controller.ts` | Real (legacy) | Active — legacy |
| GET | `/v2/pos/printer-config` | `pos-printer-config-v2.controller.ts` | Real | Active (1 route) |
| GET/POST | `/pos/printer-config/*` (5 routes) | `printer-config.controller.ts` | Real | Active |

### Admin

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/admin/cron-status/*` (1 route) | `admin-cron-status.controller.ts` | Real | Active |
| GET/POST | `/admin/*` (8 routes) | `admin-extra.controller.ts` | Real | Active |
| GET/POST | `/admin/queues/*` (5 routes) | `admin-queue.controller.ts` | Real | Active |
| GET/POST | `/admin/settings/*` (2 routes) | `admin-settings.controller.ts` | Real | Active |
| GET/POST | `/admin/users/*` (4 routes) | `admin-users.controller.ts` | Real | Active |
| GET/POST/DELETE | `/saas/*` (16 routes) | `compatibility/saas.controller.ts` | Real | Active |
| GET/POST | `/admin/auth` (1 route) | `legacy/admin-auth.controller.ts` | Real | Active (legacy) |

### AI Modules

| Method | Path | Controller | DB | Status |
|--------|------|-----------|-----|--------|
| GET/POST | `/ai/*` (8 routes) | `ai.controller.ts` | Real | Active |
| GET/POST | `/ai/hr/*` (6+6 routes) | `ai-hr.controller.ts`, `ai-hr-new.controller.ts` | Real | Active |
| GET/POST | `/ai/finance/*` (6 routes) | `ai-finance.controller.ts` | Real | Active |
| GET/POST | `/ai/crm/*` (5 routes) | `ai-crm.controller.ts` | Real | Active |
| GET/POST | `/ai/automation/*` (2 routes) | `ai-automation.controller.ts` | Real | Active |
| GET/POST | `/ai/marketing/*` (4 routes) | `ai-marketing.controller.ts` | Real | Active |
| GET/POST | `/ai/wms/*` (4 routes) | `ai-wms.controller.ts` | Real | Active |
| GET/POST | `/ai-planning/*` (15 routes) | `ai-planning.controller.ts` | Real | Active |
| GET/POST | `/ai-reservation/*` (9 routes) | `ai-reservation.controller.ts` | Real | Active |
| GET/POST | `/ai-exam/*` (6 routes) | `ai-exam.controller.ts` | Real | Active |
| GET/POST | `/ai/director/*` (4 routes) | `ai-director.controller.ts` | Real | Active |
| GET/POST | `/agents/*` (51 routes) | `agents.controller.ts` | Real | Active |
| GET/POST | `/ai-agents/*` (12 routes) | `ai-agents.controller.ts` | Real | Active |
| GET/POST | `/forecast/*` (4 routes) | `forecast-ext.controller.ts` | Real | Active |
| GET/POST | `/gpt/*` (3 routes) | `gpt.controller.ts` | Real | Active |
| GET/POST | `/insights/*` (4 routes) | `insights.controller.ts` | Real | Active |

### Other Significant Modules

| Module | Base path | # Routes | DB | Status |
|--------|----------|----------|----|--------|
| Chat | `/chat`, `/hr-v2/chat` | 33+15=48 | Real | Active |
| Aisha AI | `/aisha`, `/aisha/voice`, `/aisha/wake` | 5 | Real | Active |
| Notifications | `/notifications` | 11 | Real | Active |
| LMS | `/lms/*`, `/courses`, `/lessons`, `/tests`, `/attempts`, `/certificates`, `/knowledge-base`, `/micro-modules` | 58 | Real | Active |
| Org Structure | `/org-structure/*` | 23 | Real | Active |
| Integration | `/integration/*` | 51 | Real | Active |
| MRO | `/mro/*` | 14 | Real | Active |
| Logistics | `/logistics/*` | 5 | Real | Active |
| Security / RACI | `/security/*`, `/raci-crisis/*` | 25 | Mixed (1 fake `return []`) | Active |
| Design | `/design/*` | 22 | Real | Active |
| Storage | `/storage/*` | 2 | Real | Active |
| Export | `/export/*` | 5 | Real | Active |
| Order Workflow | `/order-workflow/*` | 5 | Real | Active |
| Communication Center | `/cc/*` | 30 | Real | Active |
| SAP | `/sap/*` | 6 | Real | Active |
| eCommerce | (no base path set — `@Controller()`) | 38 | Unknown | **Orphan — no base path** |

### Legacy / Compatibility Modules

| Module | Base path | Note |
|--------|----------|------|
| `general/controllers/admin-auth.controller.ts` | `@Controller()` — no path | No base path — routes are at API root |
| `general/controllers/general-legacy-a.controller.ts` | `@Controller()` — no path | 16 routes at root level |
| `general/controllers/general-legacy-b.controller.ts` | `@Controller()` — no path | 24 routes at root level |
| `compatibility/departments-positions-compat.controller.ts` | `@Controller()` — no path | 2 routes at root level |
| `compatibility/settings-admin.controller.ts` | `@Controller()` — no path | 13 routes at root level |
| `legacy/controllers/general-legacy-a.controller.ts` | `/legacy` | 9 routes |
| `legacy/controllers/general-legacy-b.controller.ts` | `/legacy` | 8 routes |
| `remaining/fi.controller.ts` | `/legacy/fi` | 18 routes |

---

## 2. Fake / Stub / Dead Endpoints Summary

### Category A — Hard-coded fake returns (silently wrong data)

| Endpoint | File:line | Fake behavior | Risk |
|----------|-----------|---------------|------|
| `POST /finance/invoices/create` | `finance-invoices.controller.ts:85` | Returns `Math.random()` as invoiceId | P0 — invoice IDs non-deterministic; no DB record created |
| `GET /mes/orders` | `mes-shifts-stats.controller.ts:163` | `return []` | P1 — MES orders list always empty |
| `GET /mes/shifts` | `mes-shifts-stats.controller.ts:174` | `return []` | P1 — MES shifts always empty |
| `GET /mes/maintenance` | `mes-shifts-stats.controller.ts:179` | `return []` | P1 — maintenance list always empty |
| `GET /wms/movements` | `wms-extended.controller.ts:170` | `return []` | P1 — warehouse movements never shown |
| `GET/POST /mm/vendors-pr` (2 routes) | `mm-vendors-pr.controller.ts:56,163` | `return []` / `return {}` | P2 |
| `GET/POST /mm/goods` (2 routes) | `mm-goods.controller.ts:91,147` | `return {}` | P2 |
| `GET /sd/contracts` | `sd-contracts.controller.ts:63` | `return []` | P2 — contracts list always empty |
| `GET/POST /sd/customers` (4 routes) | `sd-customers.controller.ts:207,264,314,346` | `return {}` | P2 |
| `GET /security/visitors` | `security.controller.ts:154` | `return []` | P2 |
| `GET/POST /crm/activities` (1 route) | `crm-activities.controller.ts:131` | `return {}` | P2 |
| `GET/POST /crm/companies` (1 route) | `crm-companies.controller.ts:156` | `return {}` | P2 |
| `GET/POST /crm/followup-activities` (1 route) | `crm-followup-compat.controller.ts:98` | `return {}` | P2 |
| `GET /accounting/*` (conditional) | `finance-accounting.controller.ts:138` | `if (!orderId) return []` | P2 |
| `GET /kanban` (3 routes) | `kanban-boards.controller.ts:107,140,173` | `return {}` / `return []` | P2 |
| `POST /mm/purchase-orders` (2 routes) | `mm-purchase-orders.controller.ts:64,90` | `catch (_e) { return [] }` silences errors | P2 — errors hidden |

### Category B — HTTP 501 stubs (correctly signals not implemented)

| Module | Controller | # Routes returning 501 |
|--------|-----------|------------------------|
| HR dashboard stubs | `hr-dashboard-stubs.controller.ts` | 26 |
| HR dashboard stubs (write) | `hr-dashboard-stubs-write.controller.ts` | 9 |
| Marketing analytics stubs | `marketing-analytics-stubs.controller.ts` | 57 |
| WMS catalog (partial) | `wms-catalog.controller.ts:18` | Some routes |

Total: ~92 routes returning HTTP 501. This is correct behavior per project rule P3-26, but the routes still appear in the API surface and frontend must handle 501 responses.

### Category C — TODO / FIXME comments on active routes

| File:line | TODO |
|-----------|------|
| `crm-deals.controller.ts:57` | `// TODO PA1-11: replace dealsService.create in createQuickDeal` |
| `pos-stub.controller.ts:128` | `// TODO P3-26: migrate clients to /pos-v2/inventory and delete` |

---

## 3. Duplicate Routes (Same HTTP Method + Path)

Full list of genuine cross-controller collisions (not counting regex artifacts from the extraction):

| Method | Path | Controllers | Severity | Notes |
|--------|------|------------|---------|-------|
| GET | `/hr/360/reviewable` | `hr-dashboard-stubs.controller.ts` + `hr-dashboard.controller.ts` | P0 | NestJS loads first match — stubs shadow real handler |
| GET | `/hr/abc-analysis/:id/calculate` | same pair | P0 | |
| GET | `/hr/adaptation/:id` | same pair | P0 | |
| GET | `/hr/ai-interview/session` | same pair | P0 | |
| GET | `/hr/daily-reports` | same pair | P0 | |
| GET | `/hr/daily-reports/department` | same pair | P0 | |
| GET | `/hr/daily-reports/my` | same pair | P0 | |
| GET | `/hr/documents/employee` | same pair | P0 | |
| GET | `/hr/documents/my` | same pair | P0 | |
| GET | `/hr/documents/pending` | same pair | P0 | |
| GET | `/hr/offboarding/cases` | `hr-offboarding.controller.ts` + `hr-dashboard-stubs.controller.ts` | P0 | Real offboarding shadowed |
| POST | `/hr/offboarding/cases` | `hr-offboarding.controller.ts` + `hr-dashboard-stubs-write.controller.ts` | P0 | |
| GET | `/hr/onboarding-checklists` | `onboarding-checklists.controller.ts` + `hr-dashboard-stubs.controller.ts` | P0 | |
| POST | `/hr/onboarding-checklists` | `onboarding-checklists.controller.ts` + `hr-dashboard-stubs-write.controller.ts` | P0 | |
| PATCH | `/hr/onboarding-checklists/:id` | `onboarding-checklists.controller.ts` + `hr-dashboard-stubs-write.controller.ts` | P0 | |
| GET | `/warehouses` (5x) | `compatibility/resources.controller.ts` (repeated) | P1 | Likely regex artifact from multi-pattern |
| GET/POST/PATCH/DELETE | `/warehouses/:id` | `compatibility/resources.controller.ts` (repeated) | P1 | Same file, likely multi-decorator on one method |
| GET | `/lessons` (2x) | `lms-lessons.controller.ts` | P2 | Same file — repeated decorator |
| GET | `/tests` (2x) | `lms-tests.controller.ts` | P2 | Same file — repeated decorator |
| GET | `/micro-modules` (6x) | `lms-misc.controller.ts` | P2 | Same file — heavy repetition |

**Critical finding:** The HR stub controllers (`hr-dashboard-stubs.controller.ts`, `hr-dashboard-stubs-write.controller.ts`) declare the same routes as the real HR controllers. NestJS resolves route conflicts by module registration order. If the stubs module is registered first, 501 responses shadow real data — effectively making HR features appear broken. This must be verified against the NestJS module tree.

---

## 4. Orphan Controllers

Controllers with no module import found or with no `@Controller` base path:

| Controller | Issue |
|-----------|-------|
| `kanban-ext.controller.ts` | `@Controller()` with 0 HTTP method decorators — completely dead |
| `ecommerce/ecommerce-catalog.controller.ts` | `@Controller()` bare — all routes at root `/` — likely unintentional |
| `ecommerce/ecommerce-customers.controller.ts` | Same — `@Controller()` bare |
| `ecommerce/ecommerce-orders.controller.ts` | Same |
| `ecommerce/ecommerce-public.controller.ts` | Same |
| `ecommerce/website/website.controller.ts` | Same |
| `ecommerce/website/website-media.controller.ts` | Same |
| `general/controllers/admin-auth.controller.ts` | `@Controller()` bare — 1 route at root |
| `general/controllers/general-legacy-a.controller.ts` | `@Controller()` bare — 16 routes at root |
| `general/controllers/general-legacy-b.controller.ts` | `@Controller()` bare — 24 routes at root |
| `compatibility/departments-positions-compat.controller.ts` | `@Controller()` bare — 2 routes at root |
| `compatibility/settings-admin.controller.ts` | `@Controller()` bare — 13 routes at root |

---

## 5. Frontend API Client Mapping

The project uses `lib/api-client-react` with auto-generated hooks (via Orval from OpenAPI spec). Direct `fetch()` calls also exist in component files. Key mapping:

| Frontend hook/call | Backend endpoint | Notes |
|-------------------|-----------------|-------|
| `useAuth()` in `AuthProvider` | `GET /auth/me` | Via `apiClient` |
| `useChatFileUpload()` | `POST /chat/files` | Direct fetch |
| Chat component | `GET/POST /chat/*` | Via socket + REST |
| `useOrgNodeData()` | `GET /org-structure/*` | Via apiClient |
| `ShiftReportsTab`, `WeeklyReportsTab` | `GET /production/shift-reports` | Direct fetch |
| Camera AI settings | `GET/POST /camera-ai/prompts` | Direct fetch |
| Director `AlertFeed` | `GET /director/alerts` | Via apiClient |

The generated `lib/api-client-react/src/generated/api.ts` covers the OpenAPI-documented subset. Non-documented endpoints (compatibility, remaining, legacy modules) are called via raw fetch with hardcoded paths in page components.

---

## 6. Summary Statistics

| Metric | Value |
|--------|-------|
| Total controllers | 338 |
| Total route declarations | 2,851 |
| Unique method+path pairs | 2,785 |
| Genuine cross-controller duplicate routes | 15 pairs (P0) |
| Same-file repeated decorators | ~50 routes |
| Routes with fake/hardcoded returns | ~16 endpoints |
| Routes returning HTTP 501 (correct stubs) | ~92 |
| Orphan controllers (bare @Controller()) | 12 |
| Controllers with no methods | 1 (kanban-ext) |
| Finance endpoints with Math.random() | 1 (P0) |

---

## 7. Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested fix |
|-------|----------|--------------------|--------|---------------|
| `POST /finance/invoices/create` returns `Math.random()` as invoiceId | P0 | `finance-invoices.controller.ts:85` | Invoice IDs are non-deterministic; no DB record is created — billing data integrity failure | Implement real invoice creation via service + DB insert |
| HR stub controllers shadow real HR handlers on 15+ routes | P0 | `hr-dashboard-stubs.controller.ts` + `hr-dashboard.controller.ts` | Whichever module registers first wins; frontend sees 501 on real endpoints | Delete or disable stub controller; migrate needed stubs to real service returning real data |
| `GET /hr/offboarding/cases`, `POST /hr/offboarding/cases` in both offboarding and stubs | P0 | `hr-offboarding.controller.ts` + `hr-dashboard-stubs-write.controller.ts` | Offboarding API silenced by stub | Remove from stubs; keep only `hr-offboarding.controller.ts` |
| `GET /hr/onboarding-checklists` in both onboarding-checklists and stubs | P0 | `onboarding-checklists.controller.ts` + `hr-dashboard-stubs.controller.ts` | Same shadow problem | Remove from stubs |
| `GET /mes/orders`, `/mes/shifts`, `/mes/maintenance` return empty arrays | P1 | `mes-shifts-stats.controller.ts:163,174,179` | MES dashboard shows no data for these 3 lists | Implement via MES service + DB query |
| `GET /wms/movements` returns empty array | P1 | `wms-extended.controller.ts:170` | Warehouse movement history never visible | Implement via WMS service |
| `GET /sd/contracts` returns empty array | P1 | `sd-contracts.controller.ts:63` | Contracts page always empty | Implement contracts query via SD service |
| 12 controllers have bare `@Controller()` (no base path) | P1 | All ecommerce controllers, general legacy controllers, compatibility/settings-admin | All their routes registered at API root `/` — collision risk with all other modules | Add explicit base paths to all `@Controller()` decorators |
| `POST /mm/purchase-orders` silently returns `[]` on error | P2 | `mm-purchase-orders.controller.ts:64,90` | Errors swallowed; client sees empty list instead of failure | Remove catch-swallow; let error propagate or return 500 |
| 57 marketing analytics routes return HTTP 501 | P2 | `marketing-analytics-stubs.controller.ts` | All `/marketing/nps`, `/marketing/churn-risk`, etc. non-functional | Implement marketing analytics service |
| `kanban-ext.controller.ts` is an empty dead file | P2 | `kanban-ext.controller.ts` (0 method decorators) | Dead code noise | Delete file |
| 4 `return {}` in `sd-customers.controller.ts` | P2 | `sd-customers.controller.ts:207,264,314,346` | Customer create/update operations silently succeed with empty object | Implement real SD customer write operations |
| eCommerce controllers have no base path | P2 | `ecommerce-catalog.controller.ts:24` `@Controller()` | Routes collide at root with all other modules; eCommerce not integrated | Add `/ecommerce` base path or move to a feature-flagged module |
| `crm-deals.controller.ts` TODO PA1-11 unresolved | P3 | `crm-deals.controller.ts:57` | createQuickDeal uses wrong service method | Resolve PA1-11 ticket |
| `pos-stub.controller.ts` TODO P3-26 migration pending | P3 | `pos-stub.controller.ts:128` | Old POS routes still active; should migrate to `/pos-v2` | Migrate and deprecate `pos-stub.controller.ts` |

---

## 8. Open Questions / UNVERIFIED

- NestJS module registration order for HR controllers was not inspected — the exact load sequence of `HRModule` vs `HRStubsModule` determines which handler wins on duplicate routes. This must be verified in the module `.module.ts` files.
- Ecommerce controllers (`ecommerce/`) — unclear if these are registered in any NestJS `@Module`. If not imported, they are dead code. Module files for ecommerce were not read.
- `general/controllers/` vs `legacy/controllers/` — the general/ directory has duplicate filenames of the legacy/ directory. Whether both are imported simultaneously is unconfirmed.
- The `@ApiThrottle()` decorator behavior and rate limits were not inspected — cannot confirm rate limiting is applied uniformly.
- `lib/api-client-react/src/generated/api.ts` coverage vs total backend routes — not quantified. The OpenAPI spec may not include all 2,785 routes, meaning many endpoints are not typed for the frontend client.
- Finance `FINANCE_RANDOM_REF_RANGE` constant value not checked — unclear how large the range is or whether it could produce collisions in test data.
