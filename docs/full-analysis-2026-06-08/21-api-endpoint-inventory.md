# 21 — API Endpoint Inventari (Backend)

> **Hujjat turi:** REPORT-ONLY. Hech narsa o'zgartirilmadi.
> **Sana:** 2026-06-08
> **Manba:** `apps/api/src/**/*.controller.ts` (341 fayl) — tolerant, class-aware NestJS marshrut parseri. Global prefiks `/api` (`apps/api/src/main-bootstrap.ts:172`).
> **To'liq jadval:** har bir endpoint (2977 ta) `21-endpoints.csv` hamroh faylida (method, path, file:line, handler, module, guards, kind, svcCall, frontend-caller).
> **Heuristika ogohlantirishi:** "kind" (svc/stub/real?) va "frontend-caller" — statik tahlil heuristikasi. Frontend yo'llari dinamik qurilishi yoki boshqa klient (mobil/telegram) chaqirishi mumkin → "caller yo'q" = ehtimoliy orfan, qat'iy emas.

---

## 1. Umumiy raqamlar

| Ko'rsatkich | Qiymat |
|---|---|
| Controller fayllar | **341** |
| Jami endpointlar | **2977** |
| GET / POST / PATCH / PUT / DELETE | 1611 / 839 / 284 / 93 / 150 |
| Aniq dublikat marshrutlar (method+path 2x) | **0** |
| Stub/dead (TODO/FIXME/NotImplemented) | **171** |
| Service chaqiradi (svc) | **2559** |
| Service chaqiruvi aniqlanmadi (real?) | **246** |
| `@Public` endpointlar | **24** |
| Aniq (controller) guard yo'q — ammo 5 ta global `APP_GUARD` qoplaydi | **396** |
| Frontend chaqiruvchisi bor (heuristik) | **2406** (81%) |
| Frontend chaqiruvchisi topilmadi (ehtimoliy orfan) | **571** |
| Frontend `/api/` yo'llari (unikal) | 1452 |
| Frontend chaqiradi, backend topilmadi (ehtimoliy missing) | **43** |

---

## 2. Shubhali endpointlarni tekshirish (real vs sintetik)

| Endpoint | Controller:line | Zanjir | Natija |
|---|---|---|---|
| `GET /api/reports/trial-balance` | `finance/presentation/reports.controller.ts:34` | svc `findTrialBalance` → `reports.service.ts:14` → `drizzle-reports.repo.ts:18` | **REAL** — `db.select(...).from(accounts).leftJoin(entries...)` (haqiqiy Drizzle SQL) |
| `GET /api/finance/gl/trial-balance` | `finance/presentation/finance-gl.controller.ts:88` | `gl.service.ts:133` → `financeGlRepo.getTrialBalance` | **REAL** (repo delegatsiyasi) |
| `GET /api/reports/profit-loss` | `reports.controller.ts:41` | → `drizzle-reports.repo.ts` | **REAL** — `accounts`/`entries` SUM so'rovlari |

> **Diqqat — funksional dublikatsiya:** `trial-balance` kamida **uch** controllerda mavjud: `@Controller('reports')`, `@Controller('finance/gl')` (`finance-gl.controller.ts:32`), `@Controller('gl')` (`gl-standalone.controller.ts:29`). Aniq marshrut to'qnashuvi yo'q (yo'llar har xil), lekin biznes-mantiq takrorlangan. Birlashtirish 08-hisobotda.

---

## 3. Modul bo'yicha xulosa

| Modul | Endpoint | Stub/dead | Guard yo'q | Caller yo'q |
|---|---|---|---|---|
| hr | 375 | 5 | 102 | 80 |
| compatibility | 343 | 62 | 22 | 52 |
| finance | 176 | 9 | 0 | 67 |
| pos | 168 | 2 | 9 | 19 |
| wms | 154 | 9 | 12 | 26 |
| iot | 138 | 0 | 26 | 51 |
| crm | 121 | 0 | 16 | 20 |
| remaining | 116 | 33 | 23 | 33 |
| marketing | 108 | 0 | 0 | 19 |
| sd | 106 | 0 | 30 | 4 |
| director | 105 | 0 | 2 | 14 |
| kanban | 93 | 0 | 0 | 7 |
| ai | 88 | 5 | 0 | 10 |
| lms | 85 | 2 | 0 | 19 |
| qc | 80 | 0 | 26 | 12 |
| erp | 79 | 0 | 0 | 2 |
| mm | 71 | 18 | 20 | 15 |
| integration | 69 | 7 | 0 | 1 |
| pp | 58 | 7 | 4 | 3 |
| chat | 56 | 0 | 56 | 0 |
| agents | 51 | 0 | 0 | 14 |
| mes | 46 | 0 | 13 | 7 |
| ecommerce | 38 | 0 | 10 | 18 |
| general | 38 | 0 | 14 | 0 |
| communication-center | 30 | 0 | 2 | 9 |
| security | 28 | 7 | 0 | 9 |
| org-structure | 23 | 2 | 0 | 1 |
| design | 22 | 2 | 0 | 0 |
| admin | 20 | 0 | 0 | 8 |
| mro | 17 | 0 | 0 | 7 |
| pos-v2 | 15 | 0 | 0 | 15 |
| ai-agents | 12 | 1 | 0 | 6 |
| notifications | 11 | 0 | 0 | 6 |
| auth | 9 | 0 | 4 | 2 |
| aisha | 5 | 0 | 0 | 0 |
| export | 5 | 0 | 0 | 0 |
| logistics | 5 | 0 | 0 | 5 |
| order-workflow | 5 | 0 | 3 | 5 |
| core | 3 | 0 | 0 | 2 |
| common | 2 | 0 | 0 | 0 |
| storage | 2 | 0 | 2 | 2 |
| bot-gateway | 1 | 0 | 0 | 1 |

---

## 4. Stub / dead endpointlar (171) — TODO/FIXME/NotImplemented bor

To'liq ro'yxat `21-endpoints.csv` (kind=stub/dead). Bu yerda dastlabki 60 ta:

| Method | Path | Controller:line | Handler | Module |
|---|---|---|---|---|
| GET | `/api/ai/bottleneck/analysis` | modules/ai/presentation/ai.controller.ts:169 | getBottleneckAnalysis | ai |
| GET | `/api/ai/forecast/demand` | modules/ai/presentation/ai.controller.ts:176 | getDemandForecast | ai |
| GET | `/api/ai/rush-orders` | modules/ai/presentation/ai.controller.ts:184 | getRushOrders | ai |
| POST | `/api/ai/rush-orders/:id/approve` | modules/ai/presentation/ai.controller.ts:192 | approveRushOrder | ai |
| POST | `/api/ai/rush-orders/:id/reject` | modules/ai/presentation/ai.controller.ts:201 | rejectRushOrder | ai |
| POST | `/api/ai-agents/:agentId/trigger` | modules/ai-agents/presentation/ai-agents.controller.ts:249 | triggerAgent | ai-agents |
| GET | `/api/approval-workflow` | modules/compatibility/approval-workflow.controller.ts:56 | getAll | compatibility |
| GET | `/api/approval-workflow/pending/v2` | modules/compatibility/approval-workflow.controller.ts:65 | getPendingV2 | compatibility |
| GET | `/api/asset-management/assets` | modules/compatibility/asset-management.controller.ts:95 | getAssets | compatibility |
| GET | `/api/asset-management/assets/v2` | modules/compatibility/asset-management.controller.ts:104 | getAssetsV2 | compatibility |
| GET | `/api/barcode-warehouse/dashboard` | modules/compatibility/barcode-warehouse.controller.ts:42 | getDashboard | compatibility |
| GET | `/api/barcode-warehouse/barcodes` | modules/compatibility/barcode-warehouse.controller.ts:47 | getBarcodes | compatibility |
| GET | `/api/barcode-warehouse/barcodes/v2` | modules/compatibility/barcode-warehouse.controller.ts:56 | getBarcodesV2 | compatibility |
| GET | `/api/calendar-events` | modules/compatibility/calendar-events.controller.ts:51 | getAll | compatibility |
| GET | `/api/calendar-events/v2` | modules/compatibility/calendar-events.controller.ts:60 | getAllV2 | compatibility |
| GET | `/api/candidates` | modules/compatibility/candidates-compat.controller.ts:35 | getCandidates | compatibility |
| GET | `/api/candidates/v2` | modules/compatibility/candidates-compat.controller.ts:48 | getCandidatesV2 | compatibility |
| GET | `/api/cfo/dashboard` | modules/compatibility/cfo.controller.ts:35 | getDashboard | compatibility |
| GET | `/api/cfo/cash-position` | modules/compatibility/cfo.controller.ts:40 | getCashPosition | compatibility |
| GET | `/api/cfo/cash-position/v2` | modules/compatibility/cfo.controller.ts:50 | getCashPositionV2 | compatibility |
| GET | `/api/crm/invoices` | modules/compatibility/crm-extended.controller.ts:36 | getCrmInvoices | compatibility |
| GET | `/api/crm/invoices/v2` | modules/compatibility/crm-extended.controller.ts:47 | getCrmInvoicesV2 | compatibility |
| GET | `/api/discipline-records` | modules/compatibility/discipline-records-compat.controller.ts:35 | getDisciplineRecords | compatibility |
| GET | `/api/discipline-records/v2` | modules/compatibility/discipline-records-compat.controller.ts:48 | getDisciplineRecordsV2 | compatibility |
| GET | `/api/hr-v2/workflow/routes` | modules/compatibility/document-workflow-v2.controller.ts:48 | listRoutes | compatibility |
| GET | `/api/hr-v2/workflow/routes/v2` | modules/compatibility/document-workflow-v2.controller.ts:57 | listRoutesV2 | compatibility |
| GET | `/api/employee-files` | modules/compatibility/employee-files-compat.controller.ts:49 | listFiles | compatibility |
| GET | `/api/employee-files/v2` | modules/compatibility/employee-files-compat.controller.ts:62 | listFilesV2 | compatibility |
| GET | `/api/employee-kpi` | modules/compatibility/employee-kpi-compat.controller.ts:42 | getKpis | compatibility |
| GET | `/api/employee-kpi/v2` | modules/compatibility/employee-kpi-compat.controller.ts:56 | getKpisV2 | compatibility |
| GET | `/api/employees/:id/complaints` | modules/compatibility/employees-compat-sub.controller.ts:74 | getComplaints | compatibility |
| POST | `/api/employees/:id/complaints` | modules/compatibility/employees-compat-sub.controller.ts:77 | createComplaint | compatibility |
| GET | `/api/employees/:id/assessment-skips` | modules/compatibility/employees-compat-sub.controller.ts:81 | getAssessmentSkips | compatibility |
| GET | `/api/employees/:id/bank-accounts` | modules/compatibility/employees-compat-sub.controller.ts:85 | getBankAccounts | compatibility |
| GET | `/api/employees/:id/bank-accounts/v2` | modules/compatibility/employees-compat-sub.controller.ts:93 | getBankAccountsV2 | compatibility |
| GET | `/api/employees/v2` | modules/compatibility/employees-compat.controller.ts:71 | listEmployeesV2 | compatibility |
| GET | `/api/employees/extra/:id` | modules/compatibility/employees-extra.controller.ts:71 | getEmployeeExtra | compatibility |
| GET | `/api/europrint-control/director-kpis` | modules/compatibility/europrint-control-director.controller.ts:39 | getDirectorKpis | compatibility |
| GET | `/api/europrint-control/director-kpis/v2` | modules/compatibility/europrint-control-director.controller.ts:49 | getDirectorKpisV2 | compatibility |
| GET | `/api/europrint-control/audit-logs` | modules/compatibility/europrint-control.controller.ts:104 | getAuditLogs | compatibility |
| GET | `/api/europrint-control/audit-logs/v2` | modules/compatibility/europrint-control.controller.ts:118 | getAuditLogsV2 | compatibility |
| GET | `/api/goals/v2` | modules/compatibility/goals-compat.controller.ts:73 | getGoalsV2 | compatibility |
| GET | `/api/hr-map/employees` | modules/compatibility/hr-map-compat.controller.ts:35 | getMapEmployees | compatibility |
| GET | `/api/hr-map/employees/v2` | modules/compatibility/hr-map-compat.controller.ts:51 | getMapEmployeesV2 | compatibility |
| GET | `/api/mentorships` | modules/compatibility/mentorships-compat.controller.ts:35 | getMentorships | compatibility |
| GET | `/api/mentorships/v2` | modules/compatibility/mentorships-compat.controller.ts:47 | getMentorshipsV2 | compatibility |
| GET | `/api/pos/wh/alerts` | modules/compatibility/pos-warehouse-integration.controller.ts:138 | getStockAlerts | compatibility |
| GET | `/api/pos/wh/alerts/v2` | modules/compatibility/pos-warehouse-integration.controller.ts:148 | getStockAlertsV2 | compatibility |
| GET | `/api/material-cards` | modules/compatibility/resources.controller.ts:82 | getAll | compatibility |
| GET | `/api/material-cards/v2` | modules/compatibility/resources.controller.ts:91 | getAllV2 | compatibility |
| GET | `/api/saas/tenants` | modules/compatibility/saas.controller.ts:72 | getTenants | compatibility |
| GET | `/api/saas/tenants/v2` | modules/compatibility/saas.controller.ts:82 | getTenantsV2 | compatibility |
| GET | `/api/guidelines` | modules/compatibility/settings-admin.controller.ts:54 | getGuidelines | compatibility |
| GET | `/api/guidelines/v2` | modules/compatibility/settings-admin.controller.ts:64 | getGuidelinesV2 | compatibility |
| GET | `/api/succession/career-plans` | modules/compatibility/succession-compat.controller.ts:35 | getCareerPlans | compatibility |
| GET | `/api/succession/career-plans/v2` | modules/compatibility/succession-compat.controller.ts:45 | getCareerPlansV2 | compatibility |
| GET | `/api/telegram/admin/stats` | modules/compatibility/telegram-admin.controller.ts:43 | getStats | compatibility |
| GET | `/api/telegram/admin/users` | modules/compatibility/telegram-admin.controller.ts:48 | getUsers | compatibility |
| GET | `/api/telegram/admin/users/v2` | modules/compatibility/telegram-admin.controller.ts:58 | getUsersV2 | compatibility |
| GET | `/api/users` | modules/compatibility/users-compat.controller.ts:36 | listUsers | compatibility |

---

## 5. "Aniq guard yo'q" endpointlar (396) — aslida GLOBAL himoyalangan

**TASDIQLANDI:** `apps/api/src/app.module.ts:193-197` da **5 ta global `APP_GUARD`** ro'yxatdan o'tgan: `FastifyThrottlerGuard`, **`JwtAuthGuard`**, `RolesGuard`, `SodGuard`, `PermissionGuard`. Demak `@UseGuards` aniq yozilmagan 396 endpoint ham **default holatda JWT auth + Roles + Permission + SoD bilan himoyalangan**. Haqiqiy auth-bypass yuzasi — faqat `@Public` belgilangan **24 ta** endpoint (04-hisobotda alohida ko'rib chiqilishi kerak). Quyidagi jadval informativ (controller-darajada aniq guard yo'qligini ko'rsatadi), o'z-o'zidan xavfsizlik kamchiligi emas. Modul bo'yicha:

| Modul | Guard yo'q endpoint |
|---|---|
| hr | 102 |
| chat | 56 |
| sd | 30 |
| iot | 26 |
| qc | 26 |
| remaining | 23 |
| compatibility | 22 |
| mm | 20 |
| crm | 16 |
| general | 14 |
| mes | 13 |
| wms | 12 |
| ecommerce | 10 |
| pos | 9 |
| auth | 4 |
| pp | 4 |
| order-workflow | 3 |
| communication-center | 2 |
| director | 2 |
| storage | 2 |

> To'liq ro'yxat: `21-endpoints.csv` (guards bo'sh va public=false).

---

## 6. Frontend chaqiruvchisi topilmagan endpointlar (ehtimoliy orfan, 571)

Frontend kodida (`erp-dashboard/src`) mos `/api/` chaqiruv topilmadi. **Ogohlantirish:** mobil/telegram/tashqi klient yoki dinamik yo'l bo'lishi mumkin. Dastlabki 40 ta:

| Method | Path | Controller:line | Module |
|---|---|---|---|
| GET | `/api/admin/cron-status` | modules/admin/presentation/controllers/admin-cron-status.controller.ts:30 | admin |
| GET | `/api/admin/roles` | modules/admin/presentation/controllers/admin-extra.controller.ts:27 | admin |
| GET | `/api/admin/logs` | modules/admin/presentation/controllers/admin-extra.controller.ts:33 | admin |
| GET | `/api/admin/system` | modules/admin/presentation/controllers/admin-extra.controller.ts:73 | admin |
| GET | `/api/admin/system/alerts/:id` | modules/admin/presentation/controllers/admin-extra.controller.ts:79 | admin |
| POST | `/api/admin/login` | modules/admin/presentation/controllers/admin-extra.controller.ts:85 | admin |
| GET | `/api/admin/settings` | modules/admin/presentation/controllers/admin-settings.controller.ts:54 | admin |
| PATCH | `/api/admin/settings` | modules/admin/presentation/controllers/admin-settings.controller.ts:77 | admin |
| POST | `/api/agents/crm/proposal/:leadId` | modules/agents/agents.controller.ts:90 | agents |
| GET | `/api/agents/crm/customer360/:id` | modules/agents/agents.controller.ts:91 | agents |
| GET | `/api/agents/crm/churn/:id` | modules/agents/agents.controller.ts:92 | agents |
| GET | `/api/agents/production/shift-report/:shiftId` | modules/agents/agents.controller.ts:98 | agents |
| GET | `/api/agents/inventory/forecast/:materialId` | modules/agents/agents.controller.ts:101 | agents |
| GET | `/api/agents/inventory/abc` | modules/agents/agents.controller.ts:103 | agents |
| GET | `/api/agents/finance/overdue` | modules/agents/agents.controller.ts:118 | agents |
| GET | `/api/agents/finance/fraud` | modules/agents/agents.controller.ts:119 | agents |
| GET | `/api/agents/security/audit-anomalies` | modules/agents/agents.controller.ts:153 | agents |
| GET | `/api/agents/marketing/roi/:campaignId` | modules/agents/agents.controller.ts:156 | agents |
| POST | `/api/agents/marketing/content` | modules/agents/agents.controller.ts:157 | agents |
| GET | `/api/agents/lms/progress/:id` | modules/agents/agents.controller.ts:164 | agents |
| GET | `/api/agents/iot/anomaly/:machineId` | modules/agents/agents.controller.ts:170 | agents |
| GET | `/api/agents/iot/rul/:machineId` | modules/agents/agents.controller.ts:171 | agents |
| GET | `/api/ai/director/executive-summary` | modules/ai/presentation/ai-director.controller.ts:75 | ai |
| GET | `/api/ai/budget` | modules/ai/presentation/ai.controller.ts:108 | ai |
| POST | `/api/forecast/run` | modules/ai/presentation/forecast-ext.controller.ts:70 | ai |
| POST | `/api/forecast/:id/ema` | modules/ai/presentation/forecast-ext.controller.ts:79 | ai |
| POST | `/api/forecast/:id/hw` | modules/ai/presentation/forecast-ext.controller.ts:88 | ai |
| POST | `/api/forecast/:id/croston` | modules/ai/presentation/forecast-ext.controller.ts:97 | ai |
| POST | `/api/forecast/:id/ensemble` | modules/ai/presentation/forecast-ext.controller.ts:123 | ai |
| GET | `/api/gpt/status` | modules/ai/presentation/gpt.controller.ts:33 | ai |
| GET | `/api/gpt/chat` | modules/ai/presentation/gpt.controller.ts:39 | ai |
| GET | `/api/insights/dashboard` | modules/ai/presentation/insights.controller.ts:40 | ai |
| POST | `/api/ai-agents/sales/evaluate` | modules/ai-agents/presentation/ai-agents.controller.ts:107 | ai-agents |
| POST | `/api/ai-agents/planning/plan` | modules/ai-agents/presentation/ai-agents.controller.ts:125 | ai-agents |
| POST | `/api/ai-agents/mes/oee` | modules/ai-agents/presentation/ai-agents.controller.ts:140 | ai-agents |
| POST | `/api/ai-agents/mes/anomaly` | modules/ai-agents/presentation/ai-agents.controller.ts:149 | ai-agents |
| POST | `/api/ai-agents/qc/vision-analyze` | modules/ai-agents/presentation/ai-agents.controller.ts:158 | ai-agents |
| POST | `/api/ai-agents/logistics/vrp` | modules/ai-agents/presentation/ai-agents.controller.ts:167 | ai-agents |
| PATCH | `/api/auth/change-password` | modules/auth/presentation/auth-account.controller.ts:44 | auth |
| GET | `/api/auth/health` | modules/auth/presentation/auth-account.controller.ts:88 | auth |

---

## 7. Frontend chaqiradi, backend endpoint topilmadi (ehtimoliy missing, 43)

Frontend `/api/` yo'liga murojaat qiladi, lekin mos backend marshrut topilmadi (normalizatsiyadan keyin). Dastlabki 40 ta:

- `/api/aisha/stream/${encodeURIComponent`
- `/api/aisha/stream/:sessionId`
- `/api/budgets${qs`
- `/api/camera-reports/:p`
- `/api/crm-bitrix/:p`
- `/api/equipment:p`
- `/api/finance-extended/payroll-tax-rules`
- `/api/finance/bank-accounts`
- `/api/finance/cashflow/cash-position`
- `/api/finance/cashflow/daily-summary`
- `/api/finance/cashflow/transactions`
- `/api/finance/cost-centers`
- `/api/finance/payroll/periods`
- `/api/foo`
- `/api/forecast/${encodeURIComponent`
- `/api/hr/kpi/daily`
- `/api/hr/kpi/goals`
- `/api/hr/kpi/productivity`
- `/api/hr/kpi/ratings`
- `/api/hr/zno:p`
- `/api/hr/zvs:p`
- `/api/mm/raw-materials`
- `/api/mm/stats`
- `/api/mm/transactions`
- `/api/order-status/log`
- `/api/pos/scan/${encodeURIComponent`
- `/api/positions`
- `/api/pp/equipment`
- `/api/pp/mrp-runs`
- `/api/pp/operations`
- `/api/pp/production-facts`
- `/api/pp/production-plans`
- `/api/pp/purchase-requisitions`
- `/api/pp/routings`
- `/api/qc/standards${params.toString`
- `/api/recruiting/pipeline`
- `/api/recruiting/stats`
- `/api/recruiting/vacancies`
- `/api/sd/sales-orders`
- `/api/warehouse-rental/recalculate`

> Bularning ba'zilari proxy/static yoki normalizatsiya nomuvofiqligi bo'lishi mumkin (`TASDIQLANMAGAN`).

---

## 8. Xulosa

Backend **2977 endpoint**ni 341 controllerda taqdim etadi; aniq marshrut to'qnashuvi **yo'q** (NestJS startda xato bermaydi). Endpointlarning ~86% service qatlamiga ulanadi; **171 ta** stub/dead marker (TODO/FIXME/NotImplemented) saqlaydi. Shubhali moliyaviy hisobotlar (`trial-balance`, `profit-loss`) **haqiqiy** Drizzle SQL ekani tasdiqlandi, lekin GL bo'yicha uch xil controller funksional dublikatsiyaga ega. Frontend ~81% endpointni chaqiradi; 571 ta ehtimoliy orfan va 43 ta ehtimoliy missing qo'shimcha tekshiruvni talab qiladi.

---

## 9. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil | Ta'sir | Tavsiya |
|---|---|---|---|---|---|
| D1 | 171 endpoint stub/dead (TODO/FIXME) | **P2** | 4-bo'lim; `21-endpoints.csv` | Yarim-tayyor funksiya, foydalanuvchiga 5xx/bo'sh | 23-hisobotda triage; tugatish yoki o'chirish |
| D2 | 24 ta `@Public` endpoint auth'ni chetlab o'tadi (396 "guard yo'q" emas — ular global guard bilan himoyalangan) | **P3** (lekin `@Public`larni tekshirish P2) | `app.module.ts:193-197`; 5-bo'lim | Global JWT/Roles/Permission/SoD barcha endpointga; faqat `@Public` ochiq | 04-hisobotda 24 `@Public`ni audit qilish |
| D3 | GL/trial-balance funksional dublikatsiyasi (3 controller) | **P2** | `reports.controller.ts:34`, `finance-gl.controller.ts:88`, `gl-standalone.controller.ts:29` | Chalkashlik, turli natija xavfi | 08-hisobotda birlashtirish |
| D4 | 571 ehtimoliy orfan endpoint | **P3** | 6-bo'lim | O'lik backend yuzasi | Klient tahlilidan keyin o'ch