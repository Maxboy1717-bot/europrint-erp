# EuroPrint ERP — Full-Project Endpoint Status Audit

**Date:** 2026-07-03 (compiled 2026-07-04)
**Type:** Read-only investigation. No code modified, no migrations run, nothing committed.
**Backend:** `apps/api/src` — 377 controller files, audited module-by-module.
**Frontend cross-check:** `artifacts/erp-dashboard` (API client = `api-request.ts` / fetch).

## Method & scope

Every `@Get`/`@Post`/`@Put`/`@Patch`/`@Delete` decorator in every `*.controller.ts` was enumerated (raw decorator grep ≈ 3,284; audited rows **3,289** — the small delta is array-path decorators such as `@Post(['a','b'])` counted as separate reachable routes). The full backend was split into 13 module-group passes (one focused auditor each); each auditor opened and traced the actual handler body — not the method name — down to the repository/service DB call, and deep-traced every non-REAL classification. The per-module tables are merged verbatim below the summary.

### Two environment caveats that affect classification (read first)

1. **The database is essentially empty** (build phase). This is a *code-level* audit — "REAL" means the handler genuinely executes a DB read/write against the real schema, not that production data exists.
2. **AI/LLM keys are not configured in this environment.** The `modules/ai` LLM services are genuinely wired to real OpenAI/Gemini/Claude SDKs, but each returns a **hardcoded neutral fallback** (e.g. `score:50`, `NEUTRAL`) with HTTP 200 when no key is present. In this keyless build they therefore *behave* like canned data. They are flagged in the risk list but counted REAL because the wiring is real and would activate with a key.

---

## Summary — totals

| Status | Count | % of 3,289 | Meaning |
|--------|------:|-----------:|---------|
| **REAL** | 2,816 | 85.6% | Handler executes real business logic / DB access |
| **DUPLICATE** | 148 | 4.5% | Overlapping route (verb-alias, `/v2` twin, or second path to the same service) |
| **ORPHAN** | 227 | 6.9% | REAL logic but zero FE/backend callers (dead surface, mostly FE↔BE contract drift) |
| **501-STUB** | 43 | 1.3% | Honest `notImplemented()` / 501 — feature-flagged, does not fake success |
| **GREEN-LIE** | 34 | 1.0% | ⚠️ Returns 200 success but does NOT perform the claimed action |
| **MOCK** | 20 | 0.6% | ⚠️ Returns hardcoded / random sample data instead of querying the DB |
| **404-DEAD** | 1 | 0.03% | Registered but unreachable (route-ordering shadow) |
| **UNVERIFIED** | 0 | 0% | — |
| **TOTAL** | **3,289** | 100% | |

The **54 dangerous routes are the GREEN-LIE (34) + MOCK (20)** buckets — the ones that look production-ready from the outside but hide failure. Everything else either works, honestly reports "not implemented," or is dead-but-harmless.

## Summary — per module

| Module group | Total | REAL | 501 | 404 | GREEN-LIE | MOCK | DUP | ORPHAN |
|--------------|------:|-----:|----:|----:|----------:|-----:|----:|-------:|
| HR | 399 | 244 | 2 | 0 | 11 | 1 | 15 | 126 |
| Compatibility | 353 | 281 | 0 | 0 | 6 | 3 | 63 | 0 |
| Finance / FI / Comm-Center / Notifications | 251 | 152 | 3 | 0 | 4 | 0 | 12 | 80 |
| WMS + MM | 265 | 241 | 16 | 0 | 1 | 0 | 7 | 0 |
| POS + Logistics + Order-Workflow | 196 | 176 | 0 | 0 | 1 | 0 | 8 | 11 |
| Director + QC | 249 | 241 | 0 | 0 | 0 | 0 | 8 | 0 |
| IoT + Agents + AI-Agents | 208 | 197 | 2 | 0 | 2 | 7 | 0 | 0 |
| CRM + Marketing | 233 | 218 | 5 | 1 | 3 | 1 | 5 | 0 |
| SD + PP + MES | 254 | 238 | 2 | 0 | 2 | 0 | 12 | 0 |
| Remaining + LMS + AI | 301 | 274 | 4 | 0 | 1 | 6 | 6 | 10 |
| Kanban + Org-Structure + ERP | 253 | 244 | 7 | 0 | 0 | 0 | 2 | 0 |
| Integration + Chat + Ecommerce + General | 203 | 194 | 0 | 0 | 1 | 1 | 7 | 0 |
| Security/Design/MRO/Admin/Aisha/Auth/Export/Storage/Core/Common/Bot | 124 | 116 | 2 | 0 | 2 | 1 | 3 | 0 |
| **TOTAL** | **3,289** | **2,816** | **43** | **1** | **34** | **20** | **148** | **227** |

---

## Top 10 highest-risk findings (look production-ready, but hide failure)

Ranked by blast radius — financial/data-integrity lies first.

| # | Route | Status | File:line | Why it's dangerous |
|---|-------|--------|-----------|--------------------|
| 1 | `POST /finance/gl-entries` and `POST /finance/gl-entries/:id/reverse` | GREEN-LIE | `finance/presentation/finance-main-actions.controller.ts` | Returns 200 and writes a `gl_documents` **header only** — never posts to the canonical `entries` ledger. The "reversal" just inserts a `[REVERSAL]`-tagged header with no mirrored journal. A caller believes the GL was posted/reversed; the ledger is untouched. (Honest counterpart: `POST /accounting/gl-documents`.) |
| 2 | `POST /api/hr/employees/:id/assign-org-functions` | GREEN-LIE | `hr/presentation/…hr-employees` | FE sends `{orgDepartmentIds}` but the Zod schema expects `departmentId/positionId`; both COALESCE to null so the UPDATE no-ops and returns 200 with the unchanged row. **Org assignment silently never persists** — directly undermines the org/approval hierarchy. |
| 3 | `GET /api/agents/iot/sensor`, `/anomaly/:machineId`, `/rul/:machineId` | MOCK | `agents/iot-agent.service.ts:34+` | Hardcoded telemetry (`vibration:1.2,temp:65.5`), so `detectAnomalies` (threshold 5.0) **can never fire** and RUL is a constant `daysLeft:60`. Wired to FE `AgentsHub.tsx` → a fake live-sensor dashboard. (A separate REAL IoT path exists under `ai-agents/mes/*` over `mes_telemetry`.) |
| 4 | `POST /crm/email/send`, `/crm/sms/send`, `/crm/whatsapp/send` | GREEN-LIE | `crm/…crm-comms.service` | Each returns `{sent:true}` but only writes an activity-log row — **no mail/SMS/WhatsApp provider is called.** Nothing is actually sent; the UI shows success. |
| 5 | All `modules/ai` LLM routes (e.g. `POST /ai/crm/score-lead/:leadId`, HR/marketing AI) | GREEN-LIE* | `ai/…crm-ai.service.ts:36`, `hr-ai.service.ts:146/170` | Genuinely wired to real LLM SDKs, but return a hardcoded neutral fallback (`score:50/WARM`, `NEUTRAL`) with 200 when **no API key** is set. In this keyless env they serve canned data indistinguishable from a real score. (*Counted REAL — wiring is real; activates with a key.) |
| 6 | `DELETE /api/hr/safety/incidents/:id` | GREEN-LIE | `hr/…safety` | Returns `{deleted:true}` but only sets `status='closed'` — **the row is never deleted**, and it returns success even when the id matches nothing. FE believes the incident is gone. |
| 7 | `POST /hr/safety/export/pdf`, `GET /api/camera-reports/generate-pdf` & `/generate-excel` | GREEN-LIE | `hr/…safety`, `iot/camera-reports` | Claim a document export and return `{exported:true}` / `{url:null}` — **no PDF/Excel is generated**. (HR variant also has a GET-vs-POST method mismatch with the FE.) |
| 8 | `POST /crm/ai/create-task` (+ `europrint-control …/restore`) | GREEN-LIE | `compatibility/crm-extended.service.ts:155`, `europrint-control-director.service.ts:171` | `create-task` returns `{id:null,status:'created'}` and persists nothing; `restore` returns `{status:'restored'}` with no DB restore. Both claim a write that never happens. Siblings `/crm/ai/churn` & `/crm/ai/voice` are MOCK. |
| 9 | `GET /mes/downtime-events` (+ `PATCH /pp/work-centers/:id/toggle-active`) | GREEN-LIE | `mes/…`, `pp/…work-centers` | `downtime-events` queries `WHERE session_id=0` hardcoded → **always empty**, param ignored. `toggle-active` reads `{isActive}` but never puts it in the command, so the active flag **never flips** (silent no-op, 200 unchanged). |
| 10 | `PATCH /aisha/wake/sensitivity` (+ `GET /admin/roles` MOCK, `POST /admin/login` no-op) | GREEN-LIE / MOCK | `aisha/wake-config.controller.ts:60`, `admin/admin-extra.service.ts:36` | Sensitivity "save" writes only an in-memory field — **lost on restart** (never persisted). `GET /admin/roles` returns a hardcoded role catalog (no DB). `POST /admin/login` returns 200 `data:null` doing no auth (benign compat stub, but auth-named). |

### Honorable mentions (non-lie gaps worth owner attention)
- **MM goods-issue** (`POST /api/mm/goods-issues`) records the issue header/items but **does not decrement `warehouse_stock`** (WMS goods-issue does the full batch+stock+ledger transaction). Not a lie — a real coverage gap.
- **`PATCH /notifications/read-all`** runs the real UPDATE but always returns `{updated:0}` (repo hardcodes `Ok(0)`, no `.returning()`) — a count-lie, not a data-lie.
- **Catch-swallow-return-200** on DB error (reported as accurate status flags, not fake success, so not counted GREEN-LIE): `POST /finance/profitability/recalculate` & `/reports/profitability/export` (return 202 on error), SD `PATCH /sd/contracts/:id/sign` (`{ok:false}` + 200), Integration `PATCH /integration/mro/:id/approve`, POS `PATCH /logistics/:id/complete`, Aisha `POST /aisha/chat` (Claude error → `success:true` stub reply, logged).
- **`GET /marketing/leads/loss-analysis`** — the sole 404-DEAD: a real handler shadowed by `GET /marketing/leads/:id` declared earlier in the same controller (`:id`='loss-analysis' → NaN).

### Structural notes
- **227 ORPHAN routes** concentrate in **HR (126)** and **Finance (80)** — overwhelmingly REAL handlers with no reachable caller, driven by **FE↔BE contract drift** (path/verb/prefix mismatches, e.g. FE `/api/hr/ai-interview/...` vs BE `/api/hr-v2/ai-interview/...`) and whole controllers (career-path, skills-matrix, feedback-360, nda, notification-schedules) exposed via HTTP but only exercised internally by cron/services.
- **148 DUPLICATE routes** are dominated by **Compatibility (63)** — every `/v2` route re-calls the identical service as its legacy sibling with zero FE callers — plus pervasive PUT/PATCH and POST/PATCH verb-aliases across SD, MES, QC, Director, and Kanban.
- **43 honest 501-STUBs** cluster in **WMS/MM (16, feature flags #FX-2/#FX-3)** and **Kanban/Org/ERP (7, deprecated legacy ERP MRP/routing writers redirecting to the PP module)** — these correctly refuse rather than fake success.

---

## Per-module detail tables

Each table below is one row per route: `Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes`.



---

## HR

Module: `modules/hr` (42 controllers). Global `api` prefix applies to every path. Repo-relative paths under `apps/api/src/...`.

Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes
---|---|---|---|---|---
GET /api/hr/employees | modules/hr/presentation/hr-employees.controller.ts:57 | modules/hr/application/queries/get-employees.handler.ts:19 → drizzle-hr-base.repo.ts:87 | REAL | `findAllEmployees` real SELECT+count on hrEmployees | `courses_total`/`bonus_amount` hardcoded 0 in projection; row query real
GET /api/hr/employees/:id | modules/hr/presentation/hr-employees.controller.ts:79 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:33 | REAL | `findEmployeeById` SELECT join deps | 404 guard via assertFound
GET /api/hr/employees/:id/rating | modules/hr/presentation/hr-employees.controller.ts:105 | modules/hr/infrastructure/repositories/hr-rating.reader.ts:159 | ORPHAN | 6 parallel DB aggregates + computeRating | No FE caller for employees/:id/rating
GET /api/hr/employees/:employeeId/kpi | modules/hr/presentation/hr-employees.controller.ts:134 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:408 | ORPHAN | leave-repo getAttendanceStats+getLeaveBalance | No FE call; FE uses /hr/kpi/* (different ctrl)
POST /api/hr/employees | modules/hr/presentation/hr-employees.controller.ts:154 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:183 | REAL | `saveEmployee` tx INSERT + audit_logs | Zod-validated
PUT /api/hr/employees/:id | modules/hr/presentation/hr-employees.controller.ts:169 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:225 | REAL | `updateEmployee` COALESCE UPDATE returning | PUT+PATCH map same handler
PATCH /api/hr/employees/:id | modules/hr/presentation/hr-employees.controller.ts:170 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:225 | REAL | `updateEmployee` COALESCE UPDATE returning | —
PATCH /api/hr/employees/:id/status | modules/hr/presentation/hr-employees.controller.ts:183 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:225 | REAL | updateEmployee status/employmentStatus | —
DELETE /api/hr/employees/:id | modules/hr/presentation/hr-employees.controller.ts:198 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:225 | REAL | Soft-delete status=terminated, deleted_at | —
GET /api/hr/employees/:employeeId/documents | modules/hr/presentation/hr-employees.controller.ts:216 | modules/hr/presentation/hr-employees.controller.ts:219 | REAL | Raw SELECT hr_documents (inline) | Inline raw SQL (Qoida 4/6 smell); FE DocumentsTab.tsx:89
POST /api/hr/employees/:employeeId/documents | modules/hr/presentation/hr-employees.controller.ts:231 | modules/hr/presentation/hr-employees.controller.ts:233 | REAL | Raw INSERT hr_documents RETURNING (inline) | FE DocumentsTabDialogs.tsx:196
DELETE /api/hr/employees/:employeeId/documents/:docId | modules/hr/presentation/hr-employees.controller.ts:256 | modules/hr/presentation/hr-employees.controller.ts:257 | REAL | Raw hard DELETE hr_documents (inline) | Hard-delete; ext-repo counterpart soft-deletes (inconsistent)
POST /api/hr/employees/:employeeId/salary-review | modules/hr/presentation/hr-employees.controller.ts:267 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:103 | ORPHAN | tx UPDATE base_salary + INSERT salary_change_log | No FE apiRequest to salary-review
POST /api/hr/employees/:id/profile-image | modules/hr/presentation/hr-employees-ext.controller.ts:46 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:28 | REAL | UPDATE hrEmployees.photo_url returning | FE EmployeeDialog.tsx:200
POST /api/hr/employees/:id/assign-org-functions | modules/hr/presentation/hr-employees-ext.controller.ts:61 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:38 | GREEN-LIE | FE sends {orgDepartmentIds}, schema expects departmentId/positionId → both COALESCE null → UPDATE no-ops, returns 200 unchanged row | Silent no-op write; org assignment not persisted via this route
POST /api/hr/employees/import | modules/hr/presentation/hr-employees-ext.controller.ts:75 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:49 | ORPHAN | Delegates to execHrEmployeeImport query helper | No FE caller for hr/employees/import
GET /api/hr/employees/:id/assets | modules/hr/presentation/hr-employees-ext.controller.ts:90 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:53 | ORPHAN | Raw SELECT employee_assets | No FE caller
POST /api/hr/employees/:id/assets | modules/hr/presentation/hr-employees-ext.controller.ts:102 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:66 | ORPHAN | Raw INSERT employee_assets RETURNING | No FE caller
GET /api/hr/employees/:employeeId/swap-requests | modules/hr/presentation/hr-employees-ext.controller.ts:113 | modules/hr/shift/shift.repository.ts:286 | ORPHAN | Proxy to ShiftRepository.getEmployeeSwapRequests | FE uses /hr/shifts/swap-requests
GET /api/hr/employees/:employeeId/complaints | modules/hr/presentation/hr-employees-ext.controller.ts:123 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:87 | ORPHAN | SELECT hr_conflict_reports ILIKE party | No FE caller
POST /api/hr/employees/:employeeId/complaints | modules/hr/presentation/hr-employees-ext.controller.ts:135 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:107 | ORPHAN | INSERT hr_conflict_reports returning | No FE caller
GET /api/hr/employees/:employeeId/assessment-skips | modules/hr/presentation/hr-employees-ext.controller.ts:146 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:120 | ORPHAN | SELECT employee_360_assessments status=skipped | FE uses /api/integration/employee-assessment-skips
GET /api/hr/employees/list/for-face | modules/hr/presentation/hr-employees-ext.controller.ts:155 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:140 | DUPLICATE | SELECT hrEmployees; FE EmployeesForFacePage.tsx:34 | Duplicates GET /employees-for-face (diff source table)
POST /api/hr/employees/:id/assign-card | modules/hr/presentation/hr-employees-ext.controller.ts:169 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:240 | ORPHAN | Verify org_functions active + UPDATE org_function_id | FE uses /api/ai-exam/assign-card
GET /api/hr/employees/:employeeId/documents/:docId | modules/hr/presentation/hr-employees-ext.controller.ts:181 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:186 | ORPHAN | SELECT single hr_documents row | No FE caller
GET /api/hr/employees/:employeeId/operator-stats | modules/hr/presentation/hr-employees-ext.controller.ts:193 | modules/hr/presentation/hr-employees-ext.controller.ts:193 | MOCK | Returns hardcoded {employeeId, totalOps:0}, no DB query | FE WorkTabSections.tsx:43 renders fake 0
GET /api/employees-for-face | modules/hr/presentation/employees-for-face.controller.ts:23 | modules/hr/presentation/hr-gsd.repository.ts:293 | DUPLICATE | findEmployeesList SELECT employees; FE FaceRegistration.tsx:83 | Overlaps GET /hr/employees/list/for-face
GET /api/hr/employees/:id/goals | modules/hr/presentation/hr-employee-goals.controller.ts:77 | modules/hr/presentation/hr-employee-goals.controller.ts:79 | REAL | SELECT hr_employee_goals (inline) | FE GoalsTab.tsx:69
POST /api/hr/employees/:id/goals | modules/hr/presentation/hr-employee-goals.controller.ts:95 | modules/hr/presentation/hr-employee-goals.controller.ts:102 | REAL | INSERT hr_employee_goals RETURNING (inline) | FE GoalsTab.tsx:83
PATCH /api/hr/employees/:id/goals/:goalId | modules/hr/presentation/hr-employee-goals.controller.ts:127 | modules/hr/presentation/hr-employee-goals.controller.ts:136 | ORPHAN | COALESCE UPDATE hr_employee_goals (inline) | GoalsTab has no update; GoalsKPI PATCHes /api/goals/:id
GET /api/hr/employees/:id/one-on-ones | modules/hr/presentation/hr-employee-goals.controller.ts:166 | modules/hr/presentation/hr-employee-goals.controller.ts:168 | REAL | SELECT hr_employee_one_on_ones (inline) | FE OneOnOneTab.tsx:76
POST /api/hr/employees/:id/one-on-ones | modules/hr/presentation/hr-employee-goals.controller.ts:187 | modules/hr/presentation/hr-employee-goals.controller.ts:195 | REAL | INSERT hr_employee_one_on_ones RETURNING (inline) | FE OneOnOneTab.tsx:90
GET /api/hr/payroll | modules/hr/presentation/hr-payroll.controller.ts:49 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:31 | REAL | findPayroll SELECT payroll_period_record join | FE use-hr-payroll
GET /api/hr/payroll/summary/:period | modules/hr/presentation/hr-payroll.controller.ts:64 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:227 | ORPHAN | getPayrollSummary SUM/COUNT aggregate | No FE caller
POST /api/hr/payroll/calculate | modules/hr/presentation/hr-payroll.controller.ts:74 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:64 | REAL | Guards org-assign, razryad coeff, INSERT payroll_period_record | FE posts {periodId} but schema expects employeeId/baseSalary (contract mismatch); BE logic real
POST /api/hr/payroll/:payrollId/approve | modules/hr/presentation/hr-payroll.controller.ts:124 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:131 | ORPHAN | updatePayroll status=approved | FE calls PUT /hr/payroll/approve (no id) → unreachable
POST /api/hr/payroll/:payrollId/post-to-gl | modules/hr/presentation/hr-payroll.controller.ts:139 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:190 | ORPHAN | tx INSERT entries GL leg + UPDATE status=paid | No FE caller; real double-entry GL posting
GET /api/hr/attendance/today | modules/hr/presentation/hr-attendance.controller.ts:42 | modules/hr/attendance/drizzle-attendance.repo.ts:26 | ORPHAN | findTodayAll raw SELECT attendance join | No FE caller (FE uses base /hr/attendance)
GET /api/hr/attendance | modules/hr/presentation/hr-attendance.controller.ts:51 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:245 | REAL | Branches findAttendance month / getTodayAll | FE use-hr-attendance.ts:16
GET /api/hr/attendance/:employeeId/summary/:period | modules/hr/presentation/hr-attendance.controller.ts:65 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:245 | ORPHAN | findAttendance + getAttendanceStats | FE calls /hr/attendance/summary (no params) → this unreachable
POST /api/hr/attendance/check-in | modules/hr/presentation/hr-attendance.controller.ts:87 | modules/hr/application/commands/record-attendance.handler.ts:68 | REAL | CQRS classify late, saveAttendance upsert, auto-discipline | FE use-hr-attendance.ts:30
POST /api/hr/attendance/check-out | modules/hr/presentation/hr-attendance.controller.ts:112 | modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts:262 | REAL | saveAttendance upsert check_out_time | FE use-hr-attendance.ts:38
GET /api/hr/shifts/schedule | modules/hr/presentation/hr-shifts-compat.controller.ts:39 | modules/hr/shift/shift.repository.ts:162 | REAL | getSchedule SELECT shiftSchedules join | Accepts camel+snake aliases
POST /api/hr/shifts/schedule | modules/hr/presentation/hr-shifts-compat.controller.ts:57 | modules/hr/shift/shift.service.ts:29 → shift.repository.ts:15 | REAL | assignShift upsert + emits SHIFT_ASSIGNED | Throws if no valid employee
GET /api/hr/shifts/swap-requests | modules/hr/presentation/hr-shifts-compat.controller.ts:83 | modules/hr/shift/shift.repository.ts:196 | REAL | getSwapRequests SELECT status=swap_pending | FE use-hr-shifts.ts:27
POST /api/hr/shifts/swap-request | modules/hr/presentation/hr-shifts-compat.controller.ts:89 | modules/hr/shift/shift.service.ts:48 | ORPHAN | requestSwap (leave-conflict check + event) | FE POSTs plural swap-requests → path mismatch; else-branch returns 200 {ok:false}
PATCH /api/hr/shifts/swap-request/:id/approve | modules/hr/presentation/hr-shifts-compat.controller.ts:109 | modules/hr/shift/shift.service.ts:77 | ORPHAN | approveSwap (swap/move shift + event) | FE calls PUT plural → verb+path mismatch, unreachable
DELETE /api/hr/shifts/:id | modules/hr/presentation/hr-shifts-compat.controller.ts:114 | modules/hr/shift/shift.repository.ts:219 | REAL | deleteShift DELETE shiftSchedules | FE caller not grep-confirmed
GET /api/hr/shifts/types | modules/hr/presentation/hr-shifts-compat.controller.ts:121 | modules/hr/presentation/hr-shifts-compat.controller.ts:122 | REAL | SELECT shift_types (inline) | FE ShiftTypesConfig.tsx:135
PATCH /api/hr/shifts/types/:id | modules/hr/presentation/hr-shifts-compat.controller.ts:140 | modules/hr/presentation/hr-shifts-compat.controller.ts:146 | REAL | COALESCE UPDATE shift_types (inline); 400 if not found | FE ShiftTypesConfig.tsx:142
GET /api/hr/leave | modules/hr/presentation/hr-leave.controller.ts:52 | modules/hr/infrastructure/repositories/drizzle-hr-leave.repo.ts:50 | REAL | findLeaves select+count leaveRequestsApp | FE use-hr-leave.ts
GET /api/hr/leave/stats | modules/hr/presentation/hr-leave.controller.ts:64 | modules/hr/infrastructure/repositories/drizzle-hr-leave.repo.ts:167 | REAL | getLeaveStats aggregate | FE use-hr-leave.ts
GET /api/hr/leave/balance/:employeeId | modules/hr/presentation/hr-leave.controller.ts:74 | modules/hr/infrastructure/repositories/drizzle-hr-leave.repo.ts:133 | REAL | getLeaveBalance DB query | via GetLeaveBalanceHandler
GET /api/hr/leave/:id | modules/hr/presentation/hr-leave.controller.ts:84 | modules/hr/infrastructure/repositories/drizzle-hr-leave.repo.ts:22 | REAL | findLeaveById select+404 | Rule-11 compliant
POST /api/hr/leave | modules/hr/presentation/hr-leave.controller.ts:97 | modules/hr/application/commands/create-leave-request.handler.ts:69 | REAL | saveLeave insert (drizzle-hr-leave.repo.ts:93) | balance-check + aggregate save
PATCH /api/hr/leave/:id/approve | modules/hr/presentation/hr-leave.controller.ts:115 | modules/hr/application/commands/approve-leave.handler.ts:68 | REAL | updateLeave + emits events | FE use-hr-leave.ts
PATCH /api/hr/leave/:id/reject | modules/hr/presentation/hr-leave.controller.ts:134 | modules/hr/application/commands/reject-leave.handler.ts:59 | REAL | updateLeave + domain events | —
PATCH /api/hr/leave/:id/cancel | modules/hr/presentation/hr-leave.controller.ts:154 | modules/hr/application/commands/cancel-leave.handler.ts:68 | REAL | ownership check + updateLeave | —
DELETE /api/hr/leave/:id | modules/hr/presentation/hr-leave.controller.ts:165 | modules/hr/application/commands/delete-leave.handler.ts:28 | REAL | soft-delete updateLeave{status:deleted} | —
GET /api/questionnaire | modules/hr/presentation/hr-questionnaire.controller.ts:27 | modules/hr/presentation/hr-questionnaire.controller.ts:34 | REAL | inline SQL questionnaire_responses | FE Questionnaire.tsx
GET /api/questionnaire-templates | modules/hr/presentation/hr-questionnaire.controller.ts:64 | modules/hr/presentation/hr-questionnaire.controller.ts:71 | REAL | inline SQL questionnaire_templates | FE QuestionnaireTemplates.tsx
GET /api/hr/gsd/employees/:id | modules/hr/presentation/hr-gsd.controller.ts:51 | modules/hr/presentation/hr-gsd.repository.ts:16 | REAL | findEmployee select employees | FE GsdGraph.tsx
GET /api/hr/gsd/employees/:id/history | modules/hr/presentation/hr-gsd.controller.ts:61 | modules/hr/presentation/hr-gsd.repository.ts:38 | REAL | findEmployeeHistory payroll_period_record | FE GsdGraph.tsx:83
GET /api/hr/referrals | modules/hr/presentation/hr-gsd.controller.ts:70 | modules/hr/presentation/hr-gsd.repository.ts:61 | REAL | findReferrals hr_referrals | FE ReferralPage.tsx
GET /api/hr/referrals/boomerang | modules/hr/presentation/hr-gsd.controller.ts:80 | modules/hr/presentation/hr-gsd.repository.ts:116 | REAL | findBoomerangs on employees | Returns recent employees, not true boomerang-rehire logic
GET /api/hr/milestones/:id/complete | modules/hr/presentation/hr-gsd.controller.ts:94 | modules/hr/presentation/hr-gsd.repository.ts:158 | ORPHAN | findMilestone read (GET, does not complete) | FE caller not found
POST /api/hr/milestones/:id/complete | modules/hr/presentation/hr-gsd.controller.ts:105 | modules/hr/presentation/hr-gsd.repository.ts:172 | REAL | completeMilestone update status=completed | —
PATCH /api/hr/milestones/:id/complete | modules/hr/presentation/hr-gsd.controller.ts:116 | modules/hr/presentation/hr-gsd.repository.ts:172 | DUPLICATE | same completeMilestone as POST | Duplicate of POST milestones/:id/complete
POST /api/hr/gsd/employees/:id | modules/hr/presentation/hr-gsd.controller.ts:127 | (none) | GREEN-LIE | validates then returns {id,updated:true} with NO DB write | FE GsdGraph.tsx:88 POSTs expecting save; silently no-ops write
POST /api/hr/referrals | modules/hr/presentation/hr-gsd.controller.ts:136 | modules/hr/presentation/hr-gsd.repository.ts:89 | REAL | createReferral insert hr_referrals | FE ReferralPage.tsx
PATCH /api/hr/referrals/:id | modules/hr/presentation/hr-gsd.controller.ts:156 | modules/hr/presentation/hr-gsd.repository.ts:187 | REAL | updateReferral update hr_referrals | FE ReferralPage.tsx
GET /api/hr/mentorship-pairings | modules/hr/presentation/hr-gsd.controller.ts:174 | modules/hr/presentation/hr-gsd.repository.ts:213 | ORPHAN | findMentorshipPairings select | no FE caller
POST /api/hr/mentorship-pairings | modules/hr/presentation/hr-gsd.controller.ts:189 | modules/hr/presentation/hr-gsd.repository.ts:246 | ORPHAN | createMentorshipPairing insert | no FE caller
PATCH /api/hr/mentorship-pairings/:id | modules/hr/presentation/hr-gsd.controller.ts:206 | modules/hr/presentation/hr-gsd.repository.ts:271 | ORPHAN | updateMentorshipPairing update | no FE caller
GET /api/hr/360/review | modules/hr/presentation/hr-compat-a.controller.ts:77 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:25 | REAL | get360Reviews SQL employee_360_assessments | FE use-hr-assessment.ts
POST /api/hr/360/review | modules/hr/presentation/hr-compat-a.controller.ts:82 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:43 | REAL | create360Review insert | avg computed in controller (Rule-6 smell)
GET /api/hr/360/dept-summary | modules/hr/presentation/hr-compat-a.controller.ts:96 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:59 | ORPHAN | get360DeptSummary real SQL | no FE caller
GET /api/hr/conflict-reports | modules/hr/presentation/hr-compat-a.controller.ts:102 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:77 | REAL | SQL hr_conflict_reports | FE HRConflict.tsx
POST /api/hr/conflict-reports | modules/hr/presentation/hr-compat-a.controller.ts:107 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:94 | REAL | insert hr_conflict_reports | FE HRConflict.tsx:144
GET /api/hr/employee-skills | modules/hr/presentation/hr-compat-a.controller.ts:114 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:112 | REAL | SQL employee_skills | FE SkillsMatrix.tsx
POST /api/hr/employee-skills | modules/hr/presentation/hr-compat-a.controller.ts:119 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:129 | REAL | insert employee_skills | FE SkillsMatrix.tsx:69
GET /api/hr/employee-skills/:employeeId | modules/hr/presentation/hr-compat-a.controller.ts:126 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:142 | ORPHAN | getEmployeeSkillsById select | FE uses no-id variant
GET /api/hr/health-checkups | modules/hr/presentation/hr-compat-a.controller.ts:132 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:360 | REAL | findHealthCheckups select | FE HRHealthMonitoring.tsx
POST /api/hr/health-checkups | modules/hr/presentation/hr-compat-a.controller.ts:137 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:163 | REAL | createHealthCheckup insert | FE HRHealthMonitoringDialogs.tsx:32
GET /api/hr/hrc-tests/sessions | modules/hr/presentation/hr-compat-a.controller.ts:175 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:191 | REAL | select hr_interview_sessions | FE HRCapitalTests.tsx:43
GET /api/hr/hrc-tests/tool-test/questions | modules/hr/presentation/hr-compat-a.controller.ts:180 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:209 | REAL | select hrc_iq_questions | FE HRCapitalTests.tsx:48
GET /api/hr/recruitment/vacancy/candidates | modules/hr/presentation/hr-compat-a.controller.ts:185 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:298 | REAL | findVacancyCandidates select candidates | FE RecruitingKanban
GET /api/hr/discipline | modules/hr/presentation/hr-compat-a.controller.ts:190 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:325 | REAL | findDisciplineRecords join | FE use-hr-discipline.ts
POST /api/hr/discipline-records | modules/hr/presentation/hr-compat-a.controller.ts:202 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:227 | REAL | insert discipline_records | FE Discipline.tsx:203
GET /api/hr/vacancies | modules/hr/presentation/hr-compat-a.controller.ts:209 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:284 | REAL | select vacancies | FE RecruitingKanban.tsx
GET /api/hr/departments | modules/hr/presentation/hr-compat-a.controller.ts:217 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:244 | REAL | select hrDepartments | FE use-hr-departments.ts
GET /api/hr/positions | modules/hr/presentation/hr-compat-a.controller.ts:225 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:263 | REAL | select hrPositions | FE use-hr-employees.ts:50
GET /api/hr/payroll-runs | modules/hr/presentation/hr-compat-a.controller.ts:234 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:245 | REAL | findPayrollRuns select | payroll UI
GET /api/hr/payroll-periods | modules/hr/presentation/hr-compat-a.controller.ts:239 | modules/hr/infrastructure/repositories/drizzle-hr.repo.ts:275 | REAL | findPayrollPeriods select | payroll UI
PATCH /api/hr/hrc-tests/tool-test/questions/:id | modules/hr/presentation/hr-compat-a.controller.ts:244 | modules/hr/presentation/hr-compat-a.controller.ts:247 | REAL | inline UPDATE test_questions | FE HRCapitalTestsDialogs.tsx:135
DELETE /api/hr/hrc-tests/tool-test/questions/:id | modules/hr/presentation/hr-compat-a.controller.ts:257 | modules/hr/presentation/hr-compat-a.controller.ts:260 | REAL | inline DELETE test_questions | FE HRCapitalTests.tsx:54
GET /api/hr/hrc-tests/employee/:employeeId/results | modules/hr/presentation/hr-compat-a.controller.ts:264 | modules/hr/presentation/hr-compat-a.controller.ts:266 | REAL | inline SELECT hr_tool_test_results | FE HRCapitalTabSections.tsx:157
DELETE /api/hr/employee-skills/:id | modules/hr/presentation/hr-compat-a.controller.ts:275 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:373 | REAL | delete employee_skills | FE SkillsMatrix.tsx:75
GET /api/hr/skills | modules/hr/presentation/hr-compat-a.controller.ts:285 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:311 | REAL | select skill_catalog | FE use-hr-skills.ts
POST /api/hr/skills | modules/hr/presentation/hr-compat-a.controller.ts:290 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:330 | REAL | insert skill_catalog | FE use-hr-skills.ts
PATCH /api/hr/skills/:id | modules/hr/presentation/hr-compat-a.controller.ts:303 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:345 | REAL | update skill_catalog | FE use-hr-skills.ts
DELETE /api/hr/skills/:id | modules/hr/presentation/hr-compat-a.controller.ts:315 | modules/hr/infrastructure/repositories/hr-compat-a.repository.ts:360 | REAL | soft-delete is_active=false | FE use-hr-skills.ts
POST /api/hr/hrc-tests/sessions | modules/hr/presentation/hr-compat-a.controller.ts:323 | modules/hr/presentation/hr-compat-a.controller.ts:327 | REAL | inline INSERT hr_interview_sessions | FE HRCapitalTestsDialogs.tsx:44
POST /api/hr/hrc-tests/tool-test/questions | modules/hr/presentation/hr-compat-a.controller.ts:341 | modules/hr/presentation/hr-compat-a.controller.ts:345 | REAL | inline INSERT test_questions | FE HRCapitalTestsDialogs.tsx:139
GET /api/hr/brand-settings | modules/hr/presentation/hr-compat-safety.controller.ts:46 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:34 | REAL | select hr_brand_settings | FE HRBrandPage.tsx
PATCH /api/hr/brand-settings | modules/hr/presentation/hr-compat-safety.controller.ts:61 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:44 | REAL | updateBrandSettings upsert | FE HRBrandPage.tsx
GET /api/hr/documents | modules/hr/presentation/hr-compat-safety.controller.ts:71 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:48 | REAL | select hr_documents | FE caller not confirmed
GET /api/hr/documents/admin/workflow-routes | modules/hr/presentation/hr-compat-safety.controller.ts:76 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:71 | REAL | select document_templates | FE caller not confirmed
DELETE /api/hr/documents/:id | modules/hr/presentation/hr-compat-safety.controller.ts:81 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:85 | REAL | archiveDocument update status=archived | FE caller not confirmed
GET /api/hr/safety/incidents | modules/hr/presentation/hr-compat-safety.controller.ts:88 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:92 | REAL | select safety_incidents | FE HRSafety.tsx
GET /api/hr/safety/export/pdf | modules/hr/presentation/hr-compat-safety.controller.ts:97 | modules/hr/application/hr-compat-safety.service.ts:54 | REAL | builds real PDF from safety_incidents (pdf-lib) | FE HRSafety.tsx:134
POST /api/hr/safety/incidents | modules/hr/presentation/hr-compat-safety.controller.ts:108 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:118 | REAL | insert safety_incidents | FE HRSafety.tsx
GET /api/hr/safety/trainings | modules/hr/presentation/hr-compat-safety.controller.ts:121 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:134 | REAL | select safety_training_records | FE HRSafety.tsx:65
POST /api/hr/safety/trainings | modules/hr/presentation/hr-compat-safety.controller.ts:126 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:157 | REAL | insert safety_training_records | FE HRSafety.tsx:101
GET /api/hr/safety/hazard-zones | modules/hr/presentation/hr-compat-safety.controller.ts:140 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:171 | REAL | select hazard_zones | FE HRSafety.tsx:70
POST /api/hr/safety/hazard-zones | modules/hr/presentation/hr-compat-safety.controller.ts:145 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:199 | REAL | insert hazard_zones | FE HRSafety.tsx:111
GET /api/hr/safety/ppe-compliance | modules/hr/presentation/hr-compat-safety.controller.ts:159 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:214 | REAL | select ppe_compliance | FE HRSafety.tsx:60
POST /api/hr/safety/ppe-compliance | modules/hr/presentation/hr-compat-safety.controller.ts:164 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:234 | REAL | insert ppe_compliance | FE HRSafety.tsx:91
GET /api/hr/leave-requests | modules/hr/presentation/hr-compat-safety.controller.ts:172 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:247 | REAL | select leaveRequestsApp | FE HRVacationSick.tsx; overlaps GET /hr/leave
POST /api/hr/leave-requests | modules/hr/presentation/hr-compat-safety.controller.ts:178 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:274 | REAL | raw INSERT leave_requests | Overlaps POST /hr/leave (diff write path/table)
GET /api/hr/gamification/leaderboard/monthly | modules/hr/presentation/hr-compat-safety.controller.ts:204 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:304 | ORPHAN | getGamLeaderboardMonthly real SQL | FE queryFn overrides to /gamification/leaderboard?period=monthly; /monthly path not fetched
GET /api/hr/milestones/generate | modules/hr/presentation/hr-compat-safety.controller.ts:210 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:322 | REAL | getAdaptationMilestones select | FE caller not confirmed
POST /api/hr/milestones/generate | modules/hr/presentation/hr-compat-safety.controller.ts:216 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:322 | GREEN-LIE | POST "generate" only re-reads milestones; generates/inserts nothing | name implies creation; no INSERT
PUT /api/hr/brand-settings | modules/hr/presentation/hr-compat-safety.controller.ts:223 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:44 | DUPLICATE | same updateBrandSettings as PATCH:61 | FE uses PATCH; PUT variant orphan
GET /api/hr/adaptation/programs | modules/hr/presentation/hr-compat-safety.controller.ts:232 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:348 | REAL | select adaptation_programs | FE use-hr-adaptation.ts
POST /api/hr/adaptation/programs | modules/hr/presentation/hr-compat-safety.controller.ts:237 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:370 | REAL | insert adaptation_programs | FE use-hr-adaptation.ts:19
GET /api/hr/adaptation/records | modules/hr/presentation/hr-compat-safety.controller.ts:244 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:392 | REAL | select adaptation_records | FE use-hr-adaptation.ts:26
POST /api/hr/adaptation/records | modules/hr/presentation/hr-compat-safety.controller.ts:251 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:463 | REAL | insert record + auto-milestones | FE use-hr-adaptation.ts:34
GET /api/hr/adaptation/records/:id/milestones | modules/hr/presentation/hr-compat-safety.controller.ts:265 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:524 | REAL | select adaptation_milestones | FE AdaptationTab.tsx
PATCH /api/hr/adaptation/milestones/:id | modules/hr/presentation/hr-compat-safety.controller.ts:271 | modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts:546 | REAL | update + recompute progress | FE AdaptationTab
GET /api/hr/birthdays | modules/hr/presentation/hr-dashboard.controller.ts:30 | modules/hr/presentation/hr-dashboard.repository.ts:54 | REAL | getBirthdaysUpcoming SQL | FE HRBirthdays.tsx
GET /api/hr/birthdays/today | modules/hr/presentation/hr-dashboard.controller.ts:35 | modules/hr/presentation/hr-dashboard.repository.ts:26 | REAL | getBirthdaysToday SQL | FE HRBirthdays.tsx
GET /api/hr/birthdays/upcoming | modules/hr/presentation/hr-dashboard.controller.ts:40 | modules/hr/presentation/hr-dashboard.repository.ts:54 | DUPLICATE | same getBirthdaysUpcoming as /hr/birthdays:30 | —
GET /api/hr/milestones/upcoming | modules/hr/presentation/hr-dashboard.controller.ts:45 | modules/hr/presentation/hr-dashboard.repository.ts:84 | REAL | getMilestonesUpcoming SQL | FE HRMilestones.tsx
GET /api/hr/monthly-trend | modules/hr/presentation/hr-dashboard.controller.ts:50 | modules/hr/presentation/hr-dashboard.repository.ts:113 | REAL | getMonthlyTrend SQL | FE HRDashboard.tsx:72
GET /api/hr/monthly-trend/:lang | modules/hr/presentation/hr-dashboard.controller.ts:55 | modules/hr/presentation/hr-dashboard.repository.ts:113 | ORPHAN | ignores :lang, same getMonthlyTrend | FE passes lang as query-key, not path
GET /api/hr/abc-analysis | modules/hr/presentation/hr-dashboard.controller.ts:60 | modules/hr/presentation/hr-dashboard.repository.ts:128 | REAL | getAbcAnalysis SQL | FE HRDashboard.tsx:60
GET /api/hr/alerts | modules/hr/presentation/hr-dashboard.controller.ts:65 | modules/hr/presentation/hr-dashboard.repository.ts:157 | REAL | getAlerts SQL | FE HRDashboard
GET /api/hr/discipline-records | modules/hr/presentation/hr-dashboard.controller.ts:70 | modules/hr/presentation/hr-dashboard.repository.ts:181 | REAL | getDisciplineRecords SQL | FE HRDashboard.tsx:63
GET /api/hr/pip | modules/hr/presentation/hr-dashboard.controller.ts:75 | modules/hr/presentation/hr-dashboard.repository.ts:204 | REAL | select pip_plans | FE HRPip.tsx
POST /api/hr/pip | modules/hr/presentation/hr-dashboard.controller.ts:80 | modules/hr/presentation/hr-dashboard.repository.ts:215 | REAL | insert pip_plans | FE HRPip.tsx
PATCH /api/hr/pip/:id | modules/hr/presentation/hr-dashboard.controller.ts:87 | modules/hr/presentation/hr-dashboard.repository.ts:228 | REAL | update pip_plans | FE HRPip.tsx
GET /api/hr/enps/surveys | modules/hr/presentation/hr-dashboard.controller.ts:96 | modules/hr/presentation/hr-dashboard.repository.ts:239 | REAL | select enps_surveys | FE HREnps.tsx
GET /api/hr/ai-interview/sessions | modules/hr/presentation/hr-dashboard.controller.ts:101 | modules/hr/presentation/hr-dashboard.repository.ts:250 | REAL | select ai_interview_sessions | FE HRDashboard.tsx:104
GET /api/hr/daily-reports/stats | modules/hr/presentation/hr-dashboard.controller.ts:106 | modules/hr/presentation/hr-dashboard.repository.ts:259 | REAL | getDailyReportsStats aggregate | operator-stats consumer
GET /api/hr/adaptation/at-risk | modules/hr/presentation/hr-dashboard.controller.ts:112 | modules/hr/presentation/hr-dashboard.repository.ts:273 | REAL | getAdaptationAtRisk SQL | FE HRDashboard.tsx:110
GET /api/hr/shifts/today | modules/hr/presentation/hr-dashboard.controller.ts:117 | modules/hr/presentation/hr-dashboard.repository.ts:298 | REAL | getShiftsToday SQL | FE ShiftSchedule.tsx
GET /api/hr/milestones | modules/hr/presentation/hr-dashboard.controller.ts:122 | modules/hr/presentation/hr-dashboard.repository.ts:84 | DUPLICATE | same getMilestonesUpcoming(90) as /milestones/upcoming | FE HRMilestones.tsx
GET /api/hr/dashboard-stats | modules/hr/presentation/hr-dashboard.controller.ts:127 | modules/hr/presentation/hr-dashboard.controller.ts:129 | REAL | inline SQL COUNT employees | FE Analytics.tsx:53
GET /api/hr/adaptation | modules/hr/presentation/hr-dashboard.controller.ts:141 | modules/hr/presentation/hr-dashboard.repository.ts:273 | DUPLICATE | same getAdaptationAtRisk as /adaptation/at-risk | —
GET /api/hr/adaptation/:employeeId | modules/hr/presentation/hr-dashboard.controller.ts:149 | modules/hr/presentation/hr-dashboard.controller.ts:151 | REAL | inline SQL adaptation_records by employee | FE AdaptationTab.tsx:140
GET /api/hr/alumni | modules/hr/presentation/hr-dashboard.controller.ts:182 | modules/hr/presentation/hr-dashboard.repository.ts:313 | REAL | getAlumni SQL | FE HRAlumni.tsx
GET /api/hr/alumni/:id | modules/hr/presentation/hr-dashboard.controller.ts:189 | modules/hr/presentation/hr-dashboard.repository.ts:313 | REAL | reuses getAlumni + .find (Rule-6 filter) | FE HRAlumni
GET /api/hr/daily-reports | modules/hr/presentation/hr-dashboard.controller.ts:198 | modules/hr/presentation/hr-dashboard.repository.ts:568 | REAL | getReportsByDate SQL | daily-report feature
GET /api/hr/daily-reports/department | modules/hr/presentation/hr-dashboard.controller.ts:209 | modules/hr/presentation/hr-dashboard.repository.ts:598 | REAL | getReportsByDepartment submitted+missing | —
GET /api/hr/daily-reports/my | modules/hr/presentation/hr-dashboard.controller.ts:221 | modules/hr/presentation/hr-dashboard.repository.ts:644 | REAL | getMyReports resolves employee then SQL | —
POST /api/hr/daily-reports | modules/hr/presentation/hr-dashboard.controller.ts:231 | modules/hr/presentation/hr-dashboard.repository.ts:674 | REAL | insert hr_daily_reports | —
GET /api/hr/offboarding/questions | modules/hr/presentation/hr-dashboard.controller.ts:247 | modules/hr/presentation/hr-dashboard.controller.ts:249 | REAL | inline SQL offboarding_checklist_items | FE OffboardingTabDialogs.tsx:33
GET /api/hr/fp-cycle | modules/hr/presentation/hr-dashboard.controller.ts:262 | modules/hr/presentation/hr-dashboard.controller.ts:264 | REAL | inline SQL fp_cycles | FE FinanceDashboard.tsx:105
GET /api/hr/hrc-tests/employee | modules/hr/presentation/hr-dashboard.controller.ts:271 | modules/hr/presentation/hr-dashboard.controller.ts:273 | ORPHAN | inline SQL hr_interview_sessions | FE uses /hrc-tests/employee/:id/results; no-id path not called
GET /api/hr/hrc-tests/public | modules/hr/presentation/hr-dashboard.controller.ts:280 | modules/hr/presentation/hr-dashboard.controller.ts:282 | REAL | inline SQL hrc_iq_questions | FE HRCapitalPublicTestTypes.ts:91
GET /api/hr/hrc-tests/stats | modules/hr/presentation/hr-dashboard.controller.ts:289 | modules/hr/presentation/hr-dashboard.controller.ts:291 | REAL | inline SQL 2 aggregates | FE HRCapitalTests.tsx:38
GET /api/hr/360/reviewable | modules/hr/presentation/hr-dashboard.controller.ts:306 | modules/hr/presentation/hr-dashboard.controller.ts:308 | ORPHAN | inline SQL employee_360_assessments | no FE caller
GET /api/hr/birthdays/settings | modules/hr/presentation/hr-dashboard.controller.ts:318 | modules/hr/presentation/hr-dashboard.controller.ts:321 | REAL | inline SQL settings; catch→defaults | catch-swallow returns defaults but read is real; FE caller not confirmed
POST /api/hr/birthdays/settings | modules/hr/presentation/hr-dashboard.controller.ts:328 | modules/hr/presentation/hr-dashboard.controller.ts:333 | REAL | inline upsert settings | FE caller not confirmed
GET /api/hr/birthdays/settings/:id | modules/hr/presentation/hr-dashboard.controller.ts:343 | modules/hr/presentation/hr-dashboard.controller.ts:348 | REAL | inline SQL (ignores :id, singleton) | :id reserved/unused; likely orphan
GET /api/hr/ai-interview/session | modules/hr/presentation/hr-dashboard.controller.ts:355 | modules/hr/presentation/hr-dashboard.controller.ts:357 | ORPHAN | inline SQL ai_interview_sessions | FE public page uses /hr-v2/*; no caller
GET /api/hr/ai-interview/session/:id/review | modules/hr/presentation/hr-dashboard.controller.ts:365 | modules/hr/presentation/hr-dashboard.controller.ts:367 | REAL | inline SQL by id + 404 | GET caller unconfirmed
GET /api/hr/documents/employee | modules/hr/presentation/hr-dashboard.controller.ts:375 | modules/hr/presentation/hr-dashboard.controller.ts:377 | REAL | inline SQL hr_documents | FE caller not confirmed
GET /api/hr/documents/my | modules/hr/presentation/hr-dashboard.controller.ts:390 | modules/hr/presentation/hr-dashboard.controller.ts:393 | REAL | inline SQL hr_documents by initiated_by | FE caller not confirmed
GET /api/hr/documents/pending | modules/hr/presentation/hr-dashboard.controller.ts:405 | modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts:218 | REAL | getPendingDocuments select | FE caller not confirmed
GET /api/hr/employee-corp | modules/hr/presentation/hr-dashboard.controller.ts:412 | modules/hr/presentation/hr-dashboard.controller.ts:414 | REAL | inline SQL employee_career_profiles | FE EmployeeProfile.tsx:276
GET /api/hr/employees/operator-stats | modules/hr/presentation/hr-dashboard.controller.ts:421 | modules/hr/presentation/hr-dashboard.repository.ts:259 | ORPHAN | reuses getDailyReportsStats | FE fetches id-path variant; no-id path not called
GET /api/hr/enps/surveys/results | modules/hr/presentation/hr-dashboard.controller.ts:428 | modules/hr/presentation/hr-dashboard.controller.ts:430 | REAL | inline SQL enps_surveys join responses | FE HREnps
GET /api/hr/abc-analysis/:id/calculate | modules/hr/presentation/hr-dashboard.controller.ts:442 | modules/hr/presentation/hr-dashboard.repository.ts:128 | ORPHAN | reuses getAbcAnalysis + .find | FE uses /api/abc-analysis/user (diff ctrl)
GET /api/hr/discipline/blocked | modules/hr/presentation/hr-dashboard.controller.ts:457 | modules/hr/presentation/hr-dashboard.repository.ts:437 | REAL | getDisciplineBlocked SQL | FE Discipline.tsx:173
GET /api/hr/gamification/leaderboard | modules/hr/presentation/hr-dashboard.controller.ts:472 | modules/hr/presentation/hr-dashboard.repository.ts:519 | REAL | getGamificationLeaderboard SQL | FE HRGamification.tsx:69
GET /api/hr/employee-corp/:id | modules/hr/presentation/hr-dashboard.controller.ts:479 | modules/hr/presentation/hr-dashboard.controller.ts:481 | REAL | inline SQL employee_career_profiles by id | FE EmployeeProfile.tsx:279
PATCH /api/hr/adaptation/:id | modules/hr/presentation/hr-dashboard.controller.ts:493 | modules/hr/presentation/hr-dashboard.controller.ts:496 | REAL | inline UPDATE adaptation_records + 404 | FE AdaptationTab.tsx:80
PATCH /api/hr/ai-interview/session/:id/review | modules/hr/presentation/hr-dashboard.controller.ts:513 | modules/hr/presentation/hr-dashboard.controller.ts:516 | REAL | inline UPDATE ai_interview_sessions | FE helpers-dialogs.tsx:73; response echoes some fields not persisted to columns
GET /api/hr/resignation-stats | modules/hr/presentation/hr-dashboard-extra.controller.ts:29 | modules/hr/presentation/hr-dashboard-extra.repository.ts:23 | REAL | getResignationStats SQL offboarding_cases | FE HRDashboard.tsx:69
GET /api/hr/resignation-stats/:lang | modules/hr/presentation/hr-dashboard-extra.controller.ts:37 | modules/hr/presentation/hr-dashboard-extra.repository.ts:23 | ORPHAN | delegates getResignationStats, ignores :lang | FE passes lang as query-key
GET /api/hr/risk-scores | modules/hr/presentation/hr-dashboard-extra.controller.ts:44 | modules/hr/presentation/hr-dashboard-extra.repository.ts:36 | REAL | getRiskScores SQL | FE HRDashboard.tsx:78
GET /api/hr/safety/summary | modules/hr/presentation/hr-dashboard-extra.controller.ts:52 | modules/hr/presentation/hr-dashboard-extra.repository.ts:67 | REAL | summary + kpis SQL | FE HRDashboard.tsx:82
GET /api/hr/offboarding/cases/stats | modules/hr/presentation/hr-dashboard-extra.controller.ts:63 | modules/hr/presentation/hr-dashboard-extra.repository.ts:87 | REAL | getOffboardingStats aggregate | FE HROffboarding.tsx:41
GET /api/hr/safety | modules/hr/presentation/hr-dashboard-extra.controller.ts:79 | modules/hr/presentation/hr-dashboard-extra.repository.ts:77 | REAL | getSafetyOverview combo | FE caller not confirmed
GET /api/hr/contracts | modules/hr/presentation/hr-dashboard-extra.controller.ts:87 | modules/hr/presentation/hr-dashboard-extra.repository.ts:117 | ORPHAN | getContracts SQL employee_contracts | FE only calls /contracts/expiring
GET /api/hr/contracts/expiring | modules/hr/presentation/hr-dashboard-extra.controller.ts:97 | modules/hr/presentation/hr-dashboard-extra.repository.ts:99 | REAL | getContractsExpiring SQL | FE HRDashboard.tsx:120
GET /api/hr-capital/courses | modules/hr/presentation/hr-dashboard-extra.controller.ts:112 | modules/hr/presentation/hr-dashboard-extra.controller.ts:114 | 501-STUB | return notImplemented(...) (feature gated #FX-9) | no real handler
GET /api/hr-capital/stats | modules/hr/presentation/hr-dashboard-extra.controller.ts:119 | modules/hr/presentation/hr-dashboard-extra.controller.ts:120 | 501-STUB | return notImplemented(...) | no real handler
GET /api/hr/recruitment | modules/hr/recruitment/recruitment.controller.ts:57 | modules/hr/recruitment/recruitment-funnel.service.ts:70 | ORPHAN | listFunnels paginated query | no FE caller for bare base path
POST /api/hr/recruitment/funnel | modules/hr/recruitment/recruitment.controller.ts:68 | modules/hr/recruitment/recruitment-funnel.service.ts:48 | ORPHAN | DB insert funnel + history | only e2e spec calls it
GET /api/hr/recruitment/funnel | modules/hr/recruitment/recruitment.controller.ts:77 | modules/hr/recruitment/recruitment-funnel.service.ts:70 | ORPHAN | listFunnels real query | only e2e calls it
GET /api/hr/recruitment/funnel/kanban | modules/hr/recruitment/recruitment.controller.ts:84 | modules/hr/recruitment/recruitment-funnel.service.ts:89 | ORPHAN | getFunnelKanban groups by 12 stages | FE Kanban uses /pipeline
GET /api/hr/recruitment/funnel/kanban-hc | modules/hr/recruitment/recruitment.controller.ts:91 | modules/hr/recruitment/recruitment-funnel.service.ts:117 | ORPHAN | getFunnelKanbanHc 7 HC stages | unused by FE
GET /api/hr/recruitment/funnel/:id | modules/hr/recruitment/recruitment.controller.ts:98 | modules/hr/recruitment/recruitment-funnel.service.ts:80 | ORPHAN | getFunnelById real | no FE caller
PATCH /api/hr/recruitment/funnel/:id/move | modules/hr/recruitment/recruitment.controller.ts:104 | modules/hr/recruitment/recruitment-funnel.service.ts:131 | ORPHAN | transition + updateFunnel + history + event | FE moves via /pipeline/:id/stage instead
PATCH /api/hr/recruitment/funnel/:id/screening | modules/hr/recruitment/recruitment.controller.ts:117 | modules/hr/recruitment/recruitment-funnel.service.ts:254 | ORPHAN | quickScreening updateFunnel + reject history | no FE caller
POST /api/hr/recruitment/tool-test | modules/hr/recruitment/recruitment.controller.ts:131 | modules/hr/recruitment/recruitment-assessment.service.ts:37 | ORPHAN | insert hr_tool_test_results + funnel update | no FE POST caller (FE reads results only)
GET /api/hr/recruitment/tool-test/candidate/:candidateId | modules/hr/recruitment/recruitment.controller.ts:140 | modules/hr/recruitment/recruitment-assessment.service.ts:124 | REAL | real query | FE CandidateReport.tsx:38
POST /api/hr/recruitment/tool-test/match | modules/hr/recruitment/recruitment.controller.ts:146 | modules/hr/recruitment/recruitment-assessment.service.ts:86 | ORPHAN | findToolTestById + updateToolTestMatchScore | FE uses /api/ai/hr/analyze-tool-test
POST /api/hr/recruitment/productivity-interview | modules/hr/recruitment/recruitment.controller.ts:155 | modules/hr/recruitment/recruitment-assessment.service.ts:134 | REAL | insertProductivityInterview + funnel update | FE ProductivityInterviewDialog.tsx:94
GET /api/hr/recruitment/productivity-interview/candidate/:candidateId | modules/hr/recruitment/recruitment.controller.ts:167 | modules/hr/recruitment/recruitment-assessment.service.ts:160 | REAL | real query | FE CandidateReport.tsx:44
GET /api/hr/recruitment/channel-analytics | modules/hr/recruitment/recruitment.controller.ts:175 | modules/hr/recruitment/recruitment-stats.service.ts:107 | REAL | repo.getChannelAnalytics query | FE RecruiterKPIPage.tsx:48
POST /api/hr/recruitment/job-offers | modules/hr/recruitment/recruitment.controller.ts:184 | modules/hr/recruitment/recruitment-assessment.service.ts:206 | REAL | insertJobOffer | FE JobOfferDialog.tsx:83
GET /api/hr/recruitment/statistics/weekly | modules/hr/recruitment/recruitment.controller.ts:195 | modules/hr/recruitment/recruitment-stats.service.ts:18 | ORPHAN | 3-query aggregate + KPI calc | no FE caller (uses /kpi)
GET /api/hr/recruitment/health-check | modules/hr/recruitment/recruitment.controller.ts:213 | modules/hr/recruitment/recruitment-stats.service.ts:75 | ORPHAN | 5-count aggregate, 13-signal health | no FE caller
GET /api/hr/recruitment/vacancies | modules/hr/recruitment/hr-vacancies.controller.ts:101 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:28 | REAL | findAll SELECT vacancies | FE use-hr-recruitment.ts:11
GET /api/hr/recruitment/vacancies/:id | modules/hr/recruitment/hr-vacancies.controller.ts:111 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:106 | REAL | findById SELECT + 404 | FE VacancyPortretDialog.tsx:99
POST /api/hr/recruitment/vacancies/:id/channel-status | modules/hr/recruitment/hr-vacancies.controller.ts:121 | modules/hr/recruitment/hr-vacancies.service.ts:113 → recordFunnelHistory:214 | GREEN-LIE | writes hr_funnel_history audit row but updates NO channel-status field; response echoes input | FE helpers-channel-status.tsx:39; "status update" only a history log line
POST /api/hr/recruitment/vacancies/:id/telegram-announce | modules/hr/recruitment/hr-vacancies.controller.ts:137 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | GREEN-LIE | records history then returns {announced:true}; NO actual Telegram dispatch | FE helpers-channel-status.tsx:52
POST /api/hr/recruitment/vacancies/:id/alumni-notify | modules/hr/recruitment/hr-vacancies.controller.ts:151 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | GREEN-LIE | records history then returns {notified:true}; no notification sent | FE helpers-channel-status.tsx:69
GET /api/hr/recruitment/vacancies/:id/market-analysis | modules/hr/recruitment/hr-vacancies.controller.ts:165 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:196 | REAL | count distinct candidates aggregate | FE LaborMarketSheet.tsx:116
GET /api/hr/recruitment/vacancies/:id/portret | modules/hr/recruitment/hr-vacancies.controller.ts:175 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:106 | REAL | findById row as portret | FE VacancyPortretDialog.tsx:92
GET /api/hr/recruitment/vacancies/:id/channels | modules/hr/recruitment/hr-vacancies.controller.ts:185 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:116 | ORPHAN | group-by candidates.source | no FE GET caller (FE only PATCHes)
POST /api/hr/recruitment/vacancies | modules/hr/recruitment/hr-vacancies.controller.ts:195 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:48 | REAL | INSERT vacancies | FE RecruitingKanban.tsx:86; salary/type/deadline not persisted
POST /api/hr/recruitment/vacancies/bulk | modules/hr/recruitment/hr-vacancies.controller.ts:218 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:80 | ORPHAN | loop INSERT | no FE caller
POST /api/hr/recruitment/vacancies/:id/publish | modules/hr/recruitment/hr-vacancies.controller.ts:233 | modules/hr/recruitment/hr-vacancies.service.ts:125 | ORPHAN | emits vacancy.published + history per channel | no FE caller; external channels only queued
PATCH /api/hr/recruitment/vacancies/:id/channel-status | modules/hr/recruitment/hr-vacancies.controller.ts:250 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | DUPLICATE | identical body to POST channel-status:121; history row + echo | Duplicate + GREEN-LIE, no FE caller
PATCH /api/hr/recruitment/vacancies/:id/channels | modules/hr/recruitment/hr-vacancies.controller.ts:267 | modules/hr/recruitment/hr-vacancies.controller.ts:271 | REAL | inline UPDATE hr_vacancy_profiles.channels jsonb | FE VacancyPortretDialog.tsx:134; raw SQL (Rule 15 deviation)
POST /api/hr/recruitment/vacancies/:id/market-analysis | modules/hr/recruitment/hr-vacancies.controller.ts:284 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:196 | GREEN-LIE | parses body then calls findMarketAnalysisByVacancy (READ) and returns it; NOTHING persisted despite FE Save | FE LaborMarketSheet.tsx:135; save silently discards input
PATCH /api/hr/recruitment/vacancies/:id/portret | modules/hr/recruitment/hr-vacancies.controller.ts:297 | modules/hr/recruitment/hr-vacancies.controller.ts:301 | REAL | inline UPDATE candidate_portrait jsonb merge | FE VacancyPortretDialog.tsx:121; raw SQL
GET /api/hr/recruitment/checklist-alerts | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:39 | modules/hr/recruitment/hr-vacancies.service.ts:48 | REAL | findPipeline, first 20 | FE CandidateChecklist.tsx:72; "alerts" = first 20 pipeline rows, no real alert logic
GET /api/hr/recruitment/kpi | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:48 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:87 | REAL | countByVacancy | FE RecruiterKPIPage.tsx:39; ignores from/to params
GET /api/hr/recruitment/urgent | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:57 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:120 | REAL | findActiveVacancies | FE RecruiterKPIPage.tsx:43; "urgent"==active
GET /api/hr/recruitment/worker-type-stats | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:66 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:87 | DUPLICATE | delegates to same countByVacancy as /kpi | FE RecruiterKPIPage.tsx:53
GET /api/hr/recruitment/internal-board | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:75 | modules/hr/recruitment/drizzle-hr-vacancies.repo.ts:140 | REAL | findInternalBoard | FE InternalJobBoard.tsx:31
POST /api/hr/recruitment/internal-apply/:id | modules/hr/recruitment/hr-vacancies-analytics.controller.ts:85 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:273 | REAL | INSERT hr_candidate_funnels | FE InternalJobBoardDialogs.tsx:33
GET /api/hr/recruitment/pipeline/:id/probation-journal | modules/hr/recruitment/hr-vacancies-probation.controller.ts:53 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:155 | REAL | findProbationJournal hr_funnel_history | FE ProbationJournalPanel.tsx:60
GET /api/hr/recruitment/pipeline/:id/probation-dates | modules/hr/recruitment/hr-vacancies-probation.controller.ts:63 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:177 | REAL | findProbationDates | FE ProbationJournalPanel.tsx
POST /api/hr/recruitment/pipeline/:id/probation-review | modules/hr/recruitment/hr-vacancies-probation.controller.ts:74 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | REAL | writes history probation_reviewed (rating in notes) | FE ProbationReviewDialog.tsx:168; rating not structured column
PATCH /api/hr/recruitment/pipeline/:id/probation-dates | modules/hr/recruitment/hr-vacancies-probation.controller.ts:91 | modules/hr/recruitment/hr-vacancies-probation.controller.ts:96 | REAL | inline UPDATE probation_start/end | FE ProbationJournalPanel.tsx:105; raw SQL
POST /api/hr/recruitment/pipeline/:id/probation-journal | modules/hr/recruitment/hr-vacancies-probation.controller.ts:111 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | REAL | writes history probation_journal_entry | FE ProbationJournalPanel.tsx:79
GET /api/hr/recruitment/pipeline/:id/probation-review | modules/hr/recruitment/hr-vacancies-probation.controller.ts:126 | modules/hr/recruitment/hr-vacancies-probation.controller.ts:128 | GREEN-LIE | returns {pipeline_id, review:null} hardcoded; no DB read | FE CandidateChecklist.tsx:54; reviews written by POST never read back
GET /api/hr/recruitment/pipeline | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:71 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:21 | REAL | findPipeline joined query | FE RecruitingKanban.tsx:104
GET /api/hr/recruitment/pipeline/:id/stage | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:81 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:58 | ORPHAN | findPipelineById | no FE GET caller (FE only writes stage)
POST /api/hr/recruitment/pipeline/:id/stage | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:91 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:72 | REAL | UPDATE hr_candidate_funnels.funnel_stage | FE use-kanban-dnd.ts:75
PATCH /api/hr/recruitment/pipeline/:id/stage | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:108 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:72 | DUPLICATE | identical to POST stage:91; FE uses POST | no FE PATCH caller
GET /api/hr/recruitment/pipeline/:id/roadmap | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:125 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:134 | REAL | two real queries (history + roadmap_data) | FE OnboardingRoadmapDialog.tsx:160
GET /api/hr/recruitment/roadmaps | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:146 | modules/hr/recruitment/hr-vacancies.service.ts:76 | REAL | findRoadmaps delegates to findPipeline (returns pipeline rows) | FE OnboardingRoadmapDialog.tsx:174; mislabeled
GET /api/hr/recruitment/pipeline/:id/report | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:156 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:58 | REAL | pipeline + history queries | FE CandidateReportDialog.tsx:36
POST /api/hr/recruitment/pipeline/:id/nda-request | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:170 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | REAL | writes history nda_requested | FE RecruitingKanban.tsx:134; returns nda_sent:true echo, no NDA doc dispatched
POST /api/hr/recruitment/pipeline/:id/offer | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:184 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:214 | REAL | writes history offer_sent (salary in notes) | FE RecruitingKanban.tsx:141
POST /api/hr/recruitment/pipeline/:id/checklist | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:199 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:258 | REAL | UPDATE initial_screening_notes | FE CandidateChecklist.tsx:67; writes notes not checklist_data col
GET /api/hr/recruitment/pipeline/:id/checklist | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:215 | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:217 | REAL | inline SELECT checklist_data + 404 | FE CandidateChecklist.tsx:48; read/write column mismatch with POST
PATCH /api/hr/recruitment/pipeline/:id/checklist | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:230 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:258 | DUPLICATE | same updateFunnelNotes as POST checklist | no FE PATCH caller
POST /api/hr/recruitment/pipeline/:id/roadmap | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:247 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:226 | REAL | persists roadmap JSON as history ROADMAP_GENERATED | FE OnboardingRoadmapDialog.tsx:171
POST /api/hr/recruitment/vacancy/candidates | modules/hr/recruitment/hr-vacancies-pipeline.controller.ts:265 | modules/hr/recruitment/drizzle-hr-vacancies-funnel.repo.ts:273 | REAL | INSERT hr_candidate_funnels | FE RecruitingKanban.tsx:156
GET /api/applications | modules/hr/applications/applications.controller.ts:39 | modules/hr/applications/applications.repository.ts:20 | REAL | SELECT hr_applications view w/ joins | FE Applications.tsx:64
GET /api/applications/:id | modules/hr/applications/applications.controller.ts:56 | modules/hr/applications/applications.repository.ts:35 | ORPHAN | SELECT + assertFound 404 | no FE caller
POST /api/applications | modules/hr/applications/applications.controller.ts:68 | modules/hr/applications/applications.repository.ts:44 | REAL | INSERT hr_applications view | FE Applications.tsx:95
PUT /api/applications/:id | modules/hr/applications/applications.controller.ts:78 | modules/hr/applications/applications.repository.ts:57 | ORPHAN | UPDATE | no FE caller
DELETE /api/applications/:id | modules/hr/applications/applications.controller.ts:92 | modules/hr/applications/applications.repository.ts:66 | REAL | execHrApplicationDelete | FE Applications.tsx:110
GET /api/application-responses | modules/hr/applications/application-responses.controller.ts:54 | modules/hr/applications/applications.repository.ts:75 | REAL | SELECT hr_application_responses view | FE ApplicationResponsesPage.tsx:63
GET /api/application-responses/:id | modules/hr/applications/application-responses.controller.ts:72 | modules/hr/applications/applications.repository.ts:86 | ORPHAN | SELECT + assertFound | no FE caller
POST /api/application-responses | modules/hr/applications/application-responses.controller.ts:83 | modules/hr/applications/applications.repository.ts:95 | ORPHAN | INSERT hr_application_responses view | no FE caller (FE only PATCHes)
PATCH /api/application-responses/:id | modules/hr/applications/application-responses.controller.ts:93 | modules/hr/applications/applications.repository.ts:108 | REAL | UPDATE | FE Applications.tsx:124
GET /api/hr-v2/pip | modules/hr/pip/pip.controller.ts:49 | modules/hr/pip/pip.repository.ts:16 | REAL | db.select from pipPlans | FE HRDashboard.tsx:95
GET /api/hr-v2/pip/:id | modules/hr/pip/pip.controller.ts:55 | modules/hr/pip/pip.repository.ts:26 | ORPHAN | findOne | no caller for single GET
POST /api/hr-v2/pip | modules/hr/pip/pip.controller.ts:63 | modules/hr/pip/pip.repository.ts:45 | ORPHAN | insert | FE creates via /api/hr/pip (diff ctrl); hr-v2 create uncalled
PATCH /api/hr-v2/pip/:id/acknowledge | modules/hr/pip/pip.controller.ts:79 | modules/hr/pip/pip.repository.ts:64 | ORPHAN | update status→active | no FE caller
POST /api/hr-v2/pip/:id/progress | modules/hr/pip/pip.controller.ts:85 | modules/hr/pip/pip.repository.ts:81 | REAL | insert pipProgressUpdates | FE HRPip.tsx:172
GET /api/hr-v2/enps | modules/hr/enps/enps.controller.ts:47 | modules/hr/enps/enps.repository.ts:16 | REAL | findAll | FE HRDashboard.tsx:101
GET /api/hr-v2/enps/:id | modules/hr/enps/enps.controller.ts:53 | modules/hr/enps/enps.repository.ts:26 | ORPHAN | findOne | no caller for single GET
POST /api/hr-v2/enps | modules/hr/enps/enps.controller.ts:61 | modules/hr/enps/enps.repository.ts:43 | REAL | insert enpsSurveys | FE HREnps.tsx:79
PATCH /api/hr-v2/enps/:id/close | modules/hr/enps/enps.controller.ts:74 | modules/hr/enps/enps.repository.ts:60 | ORPHAN | updateStatus(closed) | FE reads /api/hr/enps/surveys (other ctrl)
PATCH /api/hr-v2/enps/:id/launch | modules/hr/enps/enps.controller.ts:80 | modules/hr/enps/enps.repository.ts:60 | ORPHAN | updateStatus(active) | no FE caller
POST /api/hr-v2/enps/respond | modules/hr/enps/enps.controller.ts:86 | modules/hr/enps/enps.repository.ts:78 | ORPHAN | insert enpsResponses | no FE caller
GET /api/360/dashboard | modules/hr/feedback-360/feedback-360.controller.ts:33 | modules/hr/feedback-360/feedback-360.repo.ts:44 | ORPHAN | getDashboardStats real COUNT | FE uses /hr/assessment/360 (other ctrl)
GET /api/360/feedback | modules/hr/feedback-360/feedback-360.controller.ts:40 | modules/hr/feedback-360/feedback-360.repo.ts:22 | ORPHAN | findAssessments | no FE caller
GET /api/360/assessments | modules/hr/feedback-360/feedback-360.controller.ts:55 | modules/hr/feedback-360/feedback-360.repo.ts:22 | DUPLICATE | identical body to /360/feedback | same handler/params
GET /api/360/responses | modules/hr/feedback-360/feedback-360.controller.ts:70 | modules/hr/feedback-360/feedback-360.repo.ts:34 | ORPHAN | findResponses | no FE caller
GET /api/hr-v2/skills-matrix/catalog | modules/hr/skills-matrix/skills-matrix.controller.ts:38 | modules/hr/skills-matrix/skills-matrix.repository.ts:21 | ORPHAN | getSkillCatalog | FE uses /api/hr/skills (other ctrl)
GET /api/hr-v2/skills-matrix/employee/:id | modules/hr/skills-matrix/skills-matrix.controller.ts:46 | modules/hr/skills-matrix/skills-matrix.repository.ts:33 | ORPHAN | getEmployeeSkills JOIN | no FE caller
POST /api/hr-v2/skills-matrix/score | modules/hr/skills-matrix/skills-matrix.controller.ts:54 | modules/hr/skills-matrix/skills-matrix.repository.ts:48 | ORPHAN | upsert + emits SKILL_UPDATED | no FE caller
GET /api/hr-v2/skills-matrix/gap-analysis/:employeeId | modules/hr/skills-matrix/skills-matrix.controller.ts:66 | modules/hr/skills-matrix/skills-matrix.repository.ts:63 | ORPHAN | getGapAnalysis | no FE caller
GET /api/hr-v2/skills-matrix/team/:departmentId | modules/hr/skills-matrix/skills-matrix.controller.ts:77 | modules/hr/skills-matrix/skills-matrix.repository.ts:82 | ORPHAN | getTeamMatrix | no FE caller
POST /api/hr-v2/daily-reports | modules/hr/daily-report/daily-report.controller.ts:48 | modules/hr/daily-report/daily-report.repository.ts:22 | REAL | upsertReport + emits event | FE DailyReportPage.tsx:84
PATCH /api/hr-v2/daily-reports/:id/override | modules/hr/daily-report/daily-report.controller.ts:64 | modules/hr/daily-report/daily-report.repository.ts:49 | REAL | updateReportStatus + insertAudit | FE DailyReportPage.tsx:100
GET /api/hr-v2/daily-reports/stats | modules/hr/daily-report/daily-report.controller.ts:75 | modules/hr/daily-report/daily-report.repository.ts:69 | REAL | getStats aggregate | FE DailyReportPage.tsx:56; departments_with_reports hardcoded 0
GET /api/hr-v2/daily-reports/by-date | modules/hr/daily-report/daily-report.controller.ts:94 | modules/hr/daily-report/daily-report.repository.ts:94 | REAL | real JOIN/LATERAL | FE DailyReportPage.tsx:74
GET /api/hr-v2/daily-reports/employee | modules/hr/daily-report/daily-report.controller.ts:121 | modules/hr/daily-report/daily-report.repository.ts:83 | REAL | getByEmployee | FE DailyReportPage.tsx:50 (?employeeId=)
GET /api/hr-v2/daily-reports/employee/:id | modules/hr/daily-report/daily-report.controller.ts:133 | modules/hr/daily-report/daily-report.repository.ts:83 | DUPLICATE | same getByEmployee as /employee | FE only uses ?employeeId= query variant
GET /api/hr-v2/daily-reports/department/:id | modules/hr/daily-report/daily-report.controller.ts:143 | modules/hr/daily-report/daily-report.repository.ts:136 | REAL | submitted+missing | FE DailyReportPage.tsx:67
GET /api/hr/safety/department-summary | modules/hr/safety/hr-safety.controller.ts:38 | modules/hr/safety/hr-safety.repository.ts:20 | ORPHAN | findDepartmentSummary groupBy | FE calls /api/hr/safety/summary (other ctrl)
GET /api/hr/safety/incidents/:id | modules/hr/safety/hr-safety.controller.ts:48 | modules/hr/safety/hr-safety.repository.ts:39 | ORPHAN | findIncidentById | no FE single-incident GET
DELETE /api/hr/safety/incidents/:id | modules/hr/safety/hr-safety.controller.ts:59 | modules/hr/safety/hr-safety.repository.ts:57 | GREEN-LIE | calls updateIncident(status:closed) and returns {deleted:true}; NO row deletion, returns success even for non-existent id | FE HRSafety.tsx:121 expects removal
PATCH /api/hr/safety/incidents/:id | modules/hr/safety/hr-safety.controller.ts:68 | modules/hr/safety/hr-safety.repository.ts:57 | ORPHAN | real update status/severity | no FE caller
GET /api/hr/safety/hazard-zones/:id | modules/hr/safety/hr-safety.controller.ts:82 | modules/hr/safety/hr-safety.repository.ts:71 | ORPHAN | findHazardZoneById | no FE caller
PATCH /api/hr/safety/hazard-zones/:id | modules/hr/safety/hr-safety.controller.ts:92 | modules/hr/safety/hr-safety.repository.ts:89 | ORPHAN | real update | no FE caller; repo:91 sets created_at (bug) not updated_at
POST /api/hr/safety/export/pdf | modules/hr/safety/hr-safety.controller.ts:106 | modules/hr/safety/hr-safety.controller.ts:108 | GREEN-LIE | fetches incidents then returns hardcoded {exported:true,count,format:pdf}; generates NO PDF | Also FE HRSafety.tsx:134 calls as GET vs BE @Post (method mismatch)
GET /api/hr/nda | modules/hr/nda/nda.controller.ts:39 | modules/hr/nda/nda.repository.ts:31 | ORPHAN | list | no FE/HTTP caller (auto-issue via listener uses diff method)
GET /api/hr/nda/:id | modules/hr/nda/nda.controller.ts:46 | modules/hr/nda/nda.repository.ts:42 | ORPHAN | getById | no FE caller
POST /api/hr/nda | modules/hr/nda/nda.controller.ts:51 | modules/hr/nda/nda.repository.ts:51 | ORPHAN | issue INSERT | no FE caller
POST /api/hr/nda/:id/sign | modules/hr/nda/nda.controller.ts:59 | modules/hr/nda/nda.repository.ts:87 | ORPHAN | sign pending→signed UPDATE | no FE caller
DELETE /api/hr/nda/:id | modules/hr/nda/nda.controller.ts:68 | modules/hr/nda/nda.repository.ts:100 | ORPHAN | real delete | no FE caller
GET /api/assets | modules/hr/hr-assets/hr-assets.controller.ts:45 | apps/api/src/common/database/queries-hr-assets.ts:20 | REAL | queryAllAssets | FE HRAssetManagement.tsx:67
GET /api/assets/employee | modules/hr/hr-assets/hr-assets.controller.ts:57 | apps/api/src/common/database/queries-hr-assets.ts:136 | DUPLICATE | getByEmployee (current user) | Duplicate of /employee/:employeeId; FE uses :employeeId variant
GET /api/assets/employee/:employeeId | modules/hr/hr-assets/hr-assets.controller.ts:64 | apps/api/src/common/database/queries-hr-assets.ts:136 | REAL | param-driven query | FE AssetsTab.tsx:73
POST /api/assets | modules/hr/hr-assets/hr-assets.controller.ts:72 | apps/api/src/common/database/queries-hr-assets.ts:102 | REAL | execCreateAsset insert | FE HRAssetManagement.tsx:107; notes field dropped
GET /api/assets/:id | modules/hr/hr-assets/hr-assets.controller.ts:80 | apps/api/src/common/database/queries-hr-assets.ts:53 | REAL | queryAssetById with history | FE HRAssetManagement.tsx:159
PUT /api/assets/:id | modules/hr/hr-assets/hr-assets.controller.ts:87 | apps/api/src/common/database/queries-hr-assets.ts:120 | ORPHAN | execUpdateAsset; returns {updated:true} | no FE PUT caller
DELETE /api/assets/:id | modules/hr/hr-assets/hr-assets.controller.ts:97 | apps/api/src/common/database/queries-hr-assets.ts:132 | ORPHAN | execRemoveAsset hard delete | no FE DELETE caller
POST /api/assets/:id/assign | modules/hr/hr-assets/hr-assets.controller.ts:105 | apps/api/src/common/database/queries-hr-assets.ts:166 | REAL | execAssignAsset (status + employee_assets row) | FE HRAssetManagement.tsx:122
PATCH /api/assets/:id/return | modules/hr/hr-assets/hr-assets.controller.ts:114 | apps/api/src/common/database/queries-hr-assets.ts:183 | REAL | execReturnAsset | FE HRAssetManagement.tsx:133
PATCH /api/assets/:id/report | modules/hr/hr-assets/hr-assets.controller.ts:123 | apps/api/src/common/database/queries-hr-assets.ts:205 | REAL | execReportAssetIssue (status only) | FE HRAssetManagement.tsx:144; description discarded
POST /api/hr/onboarding/plans | modules/hr/onboarding/onboarding.controller.ts:56 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:32 | REAL | insert hrOnboardingPlans returning | FE HROnboarding.tsx:104
POST /api/hr/onboarding/plans/default-hr-manager | modules/hr/onboarding/onboarding.controller.ts:64 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:32 | ORPHAN | createPlan (hardcoded 6-week seed) | unreferenced
GET /api/hr/onboarding/plans | modules/hr/onboarding/onboarding.controller.ts:72 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:43 | REAL | select hrOnboardingPlans | FE HROnboarding.tsx:79
GET /api/hr/onboarding/plans/:id | modules/hr/onboarding/onboarding.controller.ts:86 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:50 | ORPHAN | select where id; NotFound | no FE caller
POST /api/hr/onboarding/start | modules/hr/onboarding/onboarding.controller.ts:94 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:73 | REAL | insert hrEmployeeOnboardings | FE HROnboarding.tsx:92
PATCH /api/hr/onboarding/:id/progress | modules/hr/onboarding/onboarding.controller.ts:102 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:91 | ORPHAN | update weeklyProgress merge | no FE caller
PATCH /api/hr/onboarding/:id/complete-probation | modules/hr/onboarding/onboarding.controller.ts:114 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:106 | ORPHAN | update status/probationScore | no FE caller
GET /api/hr/onboarding/employee/:employeeId | modules/hr/onboarding/onboarding.controller.ts:125 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:113 | ORPHAN | select where employeeId | no FE caller
POST /api/hr/onboarding/job-descriptions | modules/hr/onboarding/onboarding.controller.ts:133 | modules/hr/onboarding/onboarding-job.service.ts:45 | REAL | insert hrJobDescriptions versioned | FE JobDescriptionsPage.tsx:66
GET /api/hr/onboarding/job-descriptions | modules/hr/onboarding/onboarding.controller.ts:141 | modules/hr/onboarding/onboarding-job.service.ts:59 | REAL | select hrJobDescriptions | FE JobDescriptionsPage.tsx:53
PATCH /api/hr/onboarding/job-descriptions/:id/approve | modules/hr/onboarding/onboarding.controller.ts:148 | modules/hr/onboarding/onboarding-job.service.ts:72 | GREEN-LIE | "approve" only sets updatedAt=now; approvedById discarded, no approval/status column set | returns 200; approval not recorded; also ORPHAN
POST /api/hr/onboarding/motivation/:employeeId | modules/hr/onboarding/onboarding.controller.ts:161 | modules/hr/onboarding/onboarding-job.service.ts:101 | ORPHAN | insert hrMotivationPlans | no FE caller
GET /api/hr/onboarding/motivation/:employeeId | modules/hr/onboarding/onboarding.controller.ts:173 | modules/hr/onboarding/onboarding-job.service.ts:112 | ORPHAN | select hrMotivationPlans | no FE caller
PATCH /api/hr/onboarding/:id/buddy | modules/hr/onboarding/onboarding.controller.ts:181 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:120 | ORPHAN | update mentorId | no FE caller
GET /api/hr/onboarding/dashboard/stats | modules/hr/onboarding/onboarding.controller.ts:196 | modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts:131 | ORPHAN | listAllOnboardings aggregate | no FE caller
GET /api/hr/onboarding-checklists | modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:51 | modules/hr/onboarding-checklists/onboarding-checklists.repository.ts:16 | REAL | select hrOnboardingChecklists | FE HROnboarding.tsx:75
POST /api/hr/onboarding-checklists | modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:62 | modules/hr/onboarding-checklists/onboarding-checklists.repository.ts:56 | REAL | idempotent insert returning | FE HROnboarding.tsx:155
PATCH /api/hr/onboarding-checklists/:id | modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:81 | modules/hr/onboarding-checklists/onboarding-checklists.repository.ts:76 | REAL | update completedItems | FE HROnboarding.tsx:145
GET /api/hr/onboarding-checklists/:id | modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:89 | modules/hr/onboarding-checklists/onboarding-checklists.repository.ts:23 | ORPHAN | select where id; NotFound | no GET-by-id caller
GET /api/hr/offboarding/cases | modules/hr/offboarding/hr-offboarding.controller.ts:34 | modules/hr/offboarding/hr-offboarding.repository.ts:167 | REAL | select offboarding_cases | FE HROffboarding.tsx:54
GET /api/hr/offboarding/stats | modules/hr/offboarding/hr-offboarding.controller.ts:43 | modules/hr/offboarding/hr-offboarding.repository.ts:182 | ORPHAN | groupBy status | FE uses /offboarding/cases/stats (diff ctrl)
GET /api/hr/offboarding/cases/:id | modules/hr/offboarding/hr-offboarding.controller.ts:52 | modules/hr/offboarding/hr-offboarding.repository.ts:153 | REAL | findCaseById + checklist join; NotFound | FE HROffboardingSteps.tsx:57; route-shadow risk vs cases/stats
POST /api/hr/offboarding/cases | modules/hr/offboarding/hr-offboarding.controller.ts:60 | modules/hr/offboarding/hr-offboarding.repository.ts:21 | REAL | insert offboarding_cases + seed checklist; emits OFFBOARDING_STARTED | FE HROffboardingDialogs.tsx:206
PATCH /api/hr/offboarding/cases/:id/checklist/:itemId | modules/hr/offboarding/hr-offboarding.controller.ts:75 | modules/hr/offboarding/hr-offboarding.repository.ts:75 | REAL | update checklist item + recompute | FE HROffboardingSteps.tsx:62
POST /api/hr/offboarding/cases/:id/exit-interview | modules/hr/offboarding/hr-offboarding.controller.ts:87 | modules/hr/offboarding/hr-offboarding.repository.ts:125 | REAL | update status=exit_interviewed + notes | FE POSTs {answers} but DTO strips answers → interview answers silently dropped; status transition happens
POST /api/hr/offboarding/cases/:id/finalize | modules/hr/offboarding/hr-offboarding.controller.ts:103 | modules/hr/offboarding/hr-offboarding.repository.ts:139 | REAL | update status=completed; emits OFFBOARDING_COMPLETED | FE HROffboardingSteps.tsx:94
POST /api/hr/offboarding/cases/:id/cancel | modules/hr/offboarding/hr-offboarding.controller.ts:113 | modules/hr/offboarding/hr-offboarding.repository.ts:111 | ORPHAN | updateStatus(cancelled) | no FE caller
GET /api/hr-v2/reception | modules/hr/reception/reception.controller.ts:54 | modules/hr/reception/reception.repository.ts:58 | ORPHAN | getActiveVisitors + getStats combo | FE uses granular /active + /stats
GET /api/hr-v2/reception/active | modules/hr/reception/reception.controller.ts:68 | modules/hr/reception/reception.repository.ts:58 | REAL | SELECT visitor_log | FE ReceptionPage.tsx:53
GET /api/hr-v2/reception/stats | modules/hr/reception/reception.controller.ts:75 | modules/hr/reception/reception.repository.ts:84 | REAL | COUNT FILTER visitor_log | FE ReceptionPage.tsx:46
GET /api/hr-v2/reception/log | modules/hr/reception/reception.controller.ts:90 | modules/hr/reception/reception.repository.ts:71 | REAL | SELECT LIMIT | FE ReceptionPage.tsx:61
POST /api/hr-v2/reception/check-in | modules/hr/reception/reception.controller.ts:98 | modules/hr/reception/reception.repository.ts:19 | REAL | insert visitor_log; emits VISITOR_CHECKED_IN + Telegram | FE ReceptionPage.tsx:66
PATCH /api/hr-v2/reception/:id/check-out | modules/hr/reception/reception.controller.ts:117 | modules/hr/reception/reception.repository.ts:36 | REAL | update check_out_at | FE ReceptionPage.tsx:78
GET /api/hr-v2/reception/badge/:badge_number | modules/hr/reception/reception.controller.ts:125 | modules/hr/reception/reception.repository.ts:46 | REAL | SELECT where badge_number | FE ReceptionPage.tsx:88
POST /api/hr-v2/shifts | modules/hr/shift/shift.controller.ts:69 | modules/hr/shift/shift.repository.ts:24 | REAL | upsert shiftSchedules; emits SHIFT_ASSIGNED | FE ShiftSchedule.tsx:100
POST /api/hr-v2/shifts/swap-request | modules/hr/shift/shift.controller.ts:100 | modules/hr/shift/shift.repository.ts:97 | REAL | validate then updateShiftStatus(swap_pending) | FE ShiftSchedule.tsx:122
PATCH /api/hr-v2/shifts/:id/approve-swap | modules/hr/shift/shift.controller.ts:132 | modules/hr/shift/shift.repository.ts:122 | REAL | approve swap/move or reject | FE ShiftSchedule.tsx:135 ({action})
GET /api/hr-v2/shifts/schedule | modules/hr/shift/shift.controller.ts:146 | modules/hr/shift/shift.repository.ts:162 | REAL | select innerJoin hrEmployees | FE ShiftSchedule.tsx:83
GET /api/hr-v2/shifts/swap-requests | modules/hr/shift/shift.controller.ts:157 | modules/hr/shift/shift.repository.ts:196 | REAL | select status=swap_pending | FE ShiftSchedule.tsx:90
DELETE /api/hr-v2/shifts/:id | modules/hr/shift/shift.controller.ts:164 | modules/hr/shift/shift.repository.ts:219 | REAL | delete shiftSchedules | FE ShiftSchedule.tsx:111
POST /api/hr/leave/accrual/run | modules/hr/leave/hr-leave-accrual.controller.ts:31 | modules/hr/leave/leave-accrual-job.service.ts:59 | ORPHAN | per-employee accrual loop upsertBalance | manual replay; prod driver is @Cron; no FE caller
POST /api/hr/payroll/closure/periods/:id/generate | modules/hr/payroll/hr-payroll-closure.controller.ts:47 | modules/hr/payroll/payroll.service.ts:672 | ORPHAN | per-card computeGatedMonthlySalary + upsertPayrollRow | no FE caller
POST /api/hr/payroll/closure/periods/:id/close | modules/hr/payroll/hr-payroll-closure.controller.ts:53 | modules/hr/payroll/payroll.service.ts:173 | ORPHAN | gl.postJournal then markPeriodClosed/markRowsPosted | no FE caller (FE uses /hr/payroll/approve diff ctrl)
GET /api/hr/payroll/closure/card-salary-preview | modules/hr/payroll/hr-payroll-closure.controller.ts:65 | modules/hr/payroll/payroll.service.ts:572 | ORPHAN | read-only compute razryad coeff + gated salary | no FE caller
POST /api/hr/bonuses | modules/hr/payroll/hr-bonus.controller.ts:52 | modules/hr/payroll/bonus.service.ts:44 | ORPHAN | repo.create insert bonus_payments | FE bonus UI uses /api/hr/payroll/bonuses (diff ctrl); service used internally by payroll
GET /api/hr/bonuses | modules/hr/payroll/hr-bonus.controller.ts:68 | modules/hr/payroll/bonus.service.ts:59 | ORPHAN | repo.list | no FE caller
GET /api/hr/bonuses/employee/:employeeId | modules/hr/payroll/hr-bonus.controller.ts:76 | modules/hr/payroll/bonus.service.ts:55 | ORPHAN | repo.listByEmployee | no FE caller
POST /api/hr/bonuses/:id/approve | modules/hr/payroll/hr-bonus.controller.ts:84 | modules/hr/payroll/bonus.service.ts:64 | ORPHAN | repo.approve status→approved | no FE caller
POST /api/hr/bonuses/:id/reject | modules/hr/payroll/hr-bonus.controller.ts:91 | modules/hr/payroll/bonus.service.ts:69 | ORPHAN | repo.reject | no FE caller
GET /api/hr-v2/career-path | modules/hr/career-path/career-path.controller.ts:56 | modules/hr/career-path/career-path.repository.ts:110 | ORPHAN | runQuery SELECT career_paths JOIN | FE HRCareerPath uses /api/succession/career-plans (diff module)
POST /api/hr-v2/career-path | modules/hr/career-path/career-path.controller.ts:64 | modules/hr/career-path/career-path.repository.ts:19 | ORPHAN | insert career_paths returning | no caller
GET /api/hr-v2/career-path/department/:id/ladder | modules/hr/career-path/career-path.controller.ts:80 | modules/hr/career-path/career-path.repository.ts:126 | ORPHAN | SELECT positions GROUP BY | no caller
GET /api/hr-v2/career-path/employee/:id | modules/hr/career-path/career-path.controller.ts:88 | modules/hr/career-path/career-path.repository.ts:73 | ORPHAN | SELECT career_paths + steps | no caller
POST /api/hr-v2/career-path/:id/steps | modules/hr/career-path/career-path.controller.ts:97 | modules/hr/career-path/career-path.repository.ts:99 | ORPHAN | insert career_path_steps returning | no caller
PATCH /api/hr-v2/career-path/:id/steps/:stepId | modules/hr/career-path/career-path.controller.ts:113 | modules/hr/career-path/career-path.repository.ts:35 | ORPHAN | update step + recompute progress | no caller
GET /api/hr-v2/telegram-bots/status | modules/hr/telegram-bots/telegram-bots.controller.ts:41 | modules/hr/telegram-bots/telegram-bots.service.ts:74 | ORPHAN | live bot instances (runtime state) | no FE/backend caller
POST /api/hr-v2/telegram-bots/send | modules/hr/telegram-bots/telegram-bots.controller.ts:49 | modules/hr/telegram-bots/telegram-bots.service.ts:40 | ORPHAN | bot.telegram.sendMessage + DB fallback | internal-secret gated; no caller
POST /api/hr-v2/telegram-bots/broadcast | modules/hr/telegram-bots/telegram-bots.controller.ts:62 | modules/hr/telegram-bots/telegram-bots.service.ts:62 | ORPHAN | select active chat ids + send loop | no caller
POST /api/hr-v2/telegram-bots/internal-vacancy-published | modules/hr/telegram-bots/telegram-bots.controller.ts:71 | modules/hr/telegram-bots/telegram-bots.service.ts:198 | ORPHAN | broadcastToAll real send/DB | internal-secret gated; no caller
POST /api/hr-v2/telegram-bots/notify-employee | modules/hr/telegram-bots/telegram-bots.controller.ts:85 | modules/hr/telegram-bots/telegram-bots.service.ts:86 | ORPHAN | send OR insertNotificationByEmployeeId | catch-swallow at service:95, handler still returns {} (silent failure); no caller
POST /api/hr-v2/telegram-bots/notify-hr | modules/hr/telegram-bots/telegram-bots.controller.ts:100 | modules/hr/telegram-bots/telegram-bots.service.ts:100 | ORPHAN | sendMessage(hr) when group id set | catch-swallow at service:108; no-ops if group id unconfigured; no caller
GET /api/hr-v2/ai-interview/sessions | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:71 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:129 | ORPHAN | select hr_interview_sessions | FE calls /api/hr/ai-interview/sessions (missing -v2) → those FE calls 404; this path no correct FE caller
GET /api/hr-v2/ai-interview/stats | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:78 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:148 | ORPHAN | COUNT FILTER pipeline stats | no FE caller
POST /api/hr-v2/ai-interview/sessions | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:86 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:19 | REAL | rawSql INSERT hr_interview_sessions | FE helpers-dialogs.tsx:48
GET /api/hr-v2/ai-interview/sessions/:id | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:101 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:137 | ORPHAN | select by id + 404 | FE uses token routes
GET /api/hr-v2/ai-interview/session/:token/validate | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:110 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:35 | REAL | SELECT by token + markSessionExpired side-effect | @Public; FE AIInterviewPublicPage.tsx:61
POST /api/hr-v2/ai-interview/session/:token/camera-rejected | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:120 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:97 | REAL | updateCameraRejectionCount/cancelByCameraRejection | @Public; FE AIInterviewPublicPage.tsx:101
POST /api/hr-v2/ai-interview/session/:token/submit | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:129 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:68 | REAL | completeSession update transcript/summary | @Public; FE AIInterviewPublicPage.tsx:203
PATCH /api/hr-v2/ai-interview/sessions/:id/results | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:141 | modules/hr/ai-interview-v2/ai-interview-v2.repository.ts:68 | REAL | update scores/status=completed | FE PATCHes /api/hr/ai-interview/session/:id/review (diff path) — no correct FE caller for this route
GET /api/hr-v2/ai-interview/questions | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:159 | modules/hr/ai-interview-v2/ai-interview-v2-questions.helper.ts:31 | REAL | SELECT hr_interview_questions WHERE is_active | FE AIInterviewPage.tsx:53
GET /api/hr-v2/ai-interview/questions/for-job | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:166 | modules/hr/ai-interview-v2/ai-interview-v2-questions.helper.ts:22 | ORPHAN | SELECT filtered by job_title/lang | no FE caller
POST /api/hr-v2/ai-interview/questions | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:177 | modules/hr/ai-interview-v2/ai-interview-v2-questions.helper.ts:40 | REAL | INSERT hr_interview_questions RETURNING | FE AIInterviewPage.tsx:58
DELETE /api/hr-v2/ai-interview/questions/:id | modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:197 | modules/hr/ai-interview-v2/ai-interview-v2-questions.helper.ts:47 | REAL | soft-delete is_active=false | FE AIInterviewPage.tsx:78
POST /api/hr/recruitment/references-check | modules/hr/recruitment/recruitment-offers.controller.ts:45 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:131 | ORPHAN | insert hrReferencesChecks returning | no FE caller
GET /api/hr/recruitment/references-check/funnel/:funnelId | modules/hr/recruitment/recruitment-offers.controller.ts:57 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:143 | ORPHAN | select hrReferencesChecks | no FE caller
PATCH /api/hr/recruitment/references-check/:id | modules/hr/recruitment/recruitment-offers.controller.ts:65 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:165 | ORPHAN | update hrReferencesChecks | no FE caller
POST /api/hr/recruitment/job-offer | modules/hr/recruitment/recruitment-offers.controller.ts:78 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:179 | DUPLICATE | same createJobOffer as POST /job-offers (recruitment.controller.ts:184) | FE uses plural route; singular has no caller
GET /api/hr/recruitment/job-offer/candidate/:candidateId | modules/hr/recruitment/recruitment-offers.controller.ts:90 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:194 | ORPHAN | select hrJobOffers | no FE caller
GET /api/hr/recruitment/job-offer/:id | modules/hr/recruitment/recruitment-offers.controller.ts:98 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:205 | ORPHAN | select hrJobOffers where id | no FE caller
PATCH /api/hr/recruitment/job-offer/:id/status | modules/hr/recruitment/recruitment-offers.controller.ts:106 | modules/hr/recruitment/drizzle-recruitment-assessment.repo.ts:213 | ORPHAN | update hrJobOffers + markFunnelAsHired on ACCEPTED | no FE caller
POST /api/hr/inspection/rooms/:roomCode/reference-photo | modules/hr/inspection/inspection.controller.ts:49 | modules/hr/inspection/inspection.service.ts (uploadReferencePhoto) | REAL | svc.uploadReferencePhoto persists reference photo | 500 on !ok
GET /api/hr/inspection/rooms | modules/hr/inspection/inspection.controller.ts:68 | modules/hr/inspection/inspection.service.ts (getRooms) | REAL | svc.getRooms returns rooms list | —
GET /api/hr/inspection/rooms/:roomCode/history | modules/hr/inspection/inspection.controller.ts:78 | modules/hr/inspection/inspection.service.ts (getRoomHistory) | REAL | svc.getRoomHistory paginated | —
POST /api/hr/inspection/manual | modules/hr/inspection/inspection.controller.ts:98 | modules/hr/inspection/inspection.service.ts (createManualInspection) | REAL | svc.createManualInspection persists | —
POST /api/hr/inspection/checklist | modules/hr/inspection/inspection.controller.ts:114 | modules/hr/inspection/inspection.service.ts (submitChecklist) | REAL | svc.submitChecklist persists | —
GET /api/hr/inspection/checklist-pdf/:id | modules/hr/inspection/inspection.controller.ts:130 | modules/hr/inspection/inspection.repository.ts (findAnalysisById) | REAL | repo.findAnalysisById + 404; returns stored pdf_url | 404 if no pdf
GET /api/hr/inspection/alerts | modules/hr/inspection/inspection.controller.ts:147 | modules/hr/inspection/inspection.service.ts (getAlerts) | REAL | svc.getAlerts returns recent alerts | —
POST /api/hr/attendance/face/register | modules/hr/attendance/attendance-face.controller.ts:70 | modules/hr/attendance/face-recognition.service.ts (registerEmbedding/FromImages) | REAL | registers face embedding (3-image or single) | —
POST /api/hr/attendance/territory | modules/hr/attendance/attendance-face.controller.ts:106 | modules/hr/attendance/territory-log.service.ts (handleCameraEvent) | REAL | territory.handleCameraEvent processes camera event | —
GET /api/hr/attendance/live | modules/hr/attendance/attendance-face.controller.ts:124 | modules/hr/attendance/territory-log.service.ts (getLiveStatus) | REAL | territory.getLiveStatus | —
GET /api/hr/attendance/territory/logs | modules/hr/attendance/attendance-face.controller.ts:135 | modules/hr/attendance/territory-log.service.ts (getLogsForDate) | REAL | territory.getLogsForDate | —
GET /api/hr/attendance/face/health | modules/hr/attendance/attendance-face.controller.ts:151 | modules/hr/attendance/face-recognition.service.ts (healthCheck) | REAL | faceRec.healthCheck (external AI health) | —
GET /api/hr/attendance/late-arrivals/today | modules/hr/attendance/attendance-face.controller.ts:162 | modules/hr/attendance/late-arrival.service.ts (getLateArrivalsToday) | REAL | lateArrival.getLateArrivalsToday | —


---

## Compatibility

Module folder: `apps/api/src/modules/compatibility` — a deprecated compatibility-shim layer. Every controller carries `@deprecated` docblocks pointing at a "canonical" module, BUT verification shows these compat controllers hold the **sole live route registration** for their `@Controller` prefixes (e.g. `employees`, `candidates`, `goals`, `asset-management`, `cfo`, `saas` exist only here). Their own `*-compat.service.ts` files do real DB work (772 SQL/`@shared/db` occurrences across 34 service files). So legacy routes are classified **REAL**, not DUPLICATE-of-canonical.

Two systematic DUPLICATE patterns: (1) every `/v2` route re-calls the exact same service method as its legacy sibling and only reshapes output through an ACL translator (FE calls **zero** `/v2` endpoints — all are also orphan); (2) alias routes (second `@Post([...])` path, or a differently-named path routed to the same service method). GREEN-LIE/MOCK confined to `crm-extended.service.ts` AI stubs, two hardcoded no-ops in `employees-extra.controller.ts`, `restoreDeletedRecord`, and `WarehousesCompatController.notify-vacancies`.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /approval-workflow | apps/api/src/modules/compatibility/approval-workflow.controller.ts:57 | :57 | REAL | svc.getPending → approval-workflow.service.ts (SQL) | deprecated shim |
| GET /approval-workflow/pending/v2 | approval-workflow.controller.ts:66 | :66 | DUPLICATE | same svc.getPending as GET / & /pending, ACL reshape | no FE /v2 caller (orphan) |
| GET /approval-workflow/dashboard | approval-workflow.controller.ts:76 | :76 | REAL | svc.getDashboard | |
| GET /approval-workflow/order | approval-workflow.controller.ts:81 | :81 | REAL | svc.getByDocType / getPending | |
| POST /approval-workflow/submit | approval-workflow.controller.ts:89 | :89 | DUPLICATE | svc.create — same as POST /approval-workflow | alias |
| POST /approval-workflow/approve/:id | approval-workflow.controller.ts:95 | :95 | REAL | svc.approve | |
| POST /approval-workflow/reject/:id | approval-workflow.controller.ts:103 | :103 | REAL | svc.reject | |
| GET /approval-workflow/pending | approval-workflow.controller.ts:111 | :111 | DUPLICATE | svc.getPending — same as GET /approval-workflow | alias |
| GET /approval-workflow/history | approval-workflow.controller.ts:116 | :116 | REAL | svc.getHistory | |
| GET /approval-workflow/by-type | approval-workflow.controller.ts:121 | :121 | REAL | svc.getByType | |
| POST /approval-workflow/bulk-approve | approval-workflow.controller.ts:128 | :128 | REAL | svc.bulkApprove | |
| POST /approval-workflow | approval-workflow.controller.ts:136 | :136 | REAL | svc.create | |
| GET /approval-workflow/:type/:docId/requests | approval-workflow.controller.ts:142 | :142 | REAL | svc.getByDocType | |
| POST /approval-workflow/:type/:id/approve | approval-workflow.controller.ts:148 | :148 | DUPLICATE | svc.approve — same as approve/:id | alias |
| POST /approval-workflow/:type/:id/reject | approval-workflow.controller.ts:161 | :161 | DUPLICATE | svc.reject — same as reject/:id | alias |
| GET /approval-workflow/:id | approval-workflow.controller.ts:173 | :173 | REAL | svc.getById | |
| GET /asset-management/assets | asset-management.controller.ts:96 | :96 | REAL | svc.getAssets → asset-management.service.ts (SQL) | |
| GET /asset-management/assets/v2 | asset-management.controller.ts:105 | :105 | DUPLICATE | same svc.getAssets, ACL reshape | orphan /v2 |
| POST /asset-management/assets | asset-management.controller.ts:118 | :118 | REAL | svc.createAsset | |
| GET /asset-management/assets/summary | asset-management.controller.ts:125 | :125 | REAL | svc.getSummary | |
| GET /asset-management/assets/:id | asset-management.controller.ts:130 | :130 | REAL | svc.getAssetById | |
| PUT /asset-management/assets/:id | asset-management.controller.ts:135 | :135 | REAL | svc.updateAsset | |
| DELETE /asset-management/assets/:id | asset-management.controller.ts:142 | :142 | REAL | svc.deleteAsset | |
| GET /asset-management/maintenance | asset-management.controller.ts:147 | :147 | REAL | svc.getMaintenance | |
| POST /asset-management/maintenance | asset-management.controller.ts:153 | :153 | REAL | svc.createMaintenance | |
| GET /asset-management/disposals | asset-management.controller.ts:159 | :159 | REAL | svc.getDisposals | |
| POST /asset-management/disposals | asset-management.controller.ts:165 | :165 | REAL | svc.createDisposal | |
| GET /asset-management/transfers | asset-management.controller.ts:171 | :171 | REAL | svc.getTransfers | |
| POST /asset-management/transfers | asset-management.controller.ts:177 | :177 | REAL | svc.createTransfer | |
| GET /asset-management/insurance | asset-management.controller.ts:183 | :183 | REAL | svc.getInsurance | |
| GET /asset-management/insurance/expiring-soon | asset-management.controller.ts:190 | :190 | REAL | svc.getInsuranceExpiringSoon | |
| PUT /asset-management/assets/:id/depreciate | asset-management.controller.ts:197 | :197 | REAL | svc.depreciateAsset | |
| POST /asset-management/assets/:id/depreciate | asset-management.controller.ts:202 | :202 | DUPLICATE | svc.depreciateAsset — same as PUT | method alias |
| POST /asset-management/insurance | asset-management.controller.ts:208 | :208 | REAL | svc.createInsurance | |
| PUT /asset-management/maintenance/:id/complete | asset-management.controller.ts:214 | :214 | REAL | svc.completeMaintenance | |
| PATCH /asset-management/maintenance/:id/complete | asset-management.controller.ts:219 | :219 | DUPLICATE | svc.completeMaintenance — same as PUT | method alias |
| GET /barcode-warehouse/dashboard | barcode-warehouse.controller.ts:43 | :43 | REAL | svc.getDashboard → barcode-warehouse.service.ts (SQL) | |
| GET /barcode-warehouse/barcodes | barcode-warehouse.controller.ts:48 | :48 | REAL | svc.getBarcodes | |
| GET /barcode-warehouse/barcodes/v2 | barcode-warehouse.controller.ts:57 | :57 | DUPLICATE | same svc.getBarcodes, ACL reshape | orphan /v2 |
| POST /barcode-warehouse/barcodes/:id/qc-decision | barcode-warehouse.controller.ts:67 | :67 | REAL | svc.qcDecision | |
| POST /barcode-warehouse/barcodes/:id/qc | barcode-warehouse.controller.ts:73 | :73 | DUPLICATE | svc.qcDecision — same as qc-decision | alias |
| GET /barcode-warehouse/picking-tasks | barcode-warehouse.controller.ts:79 | :79 | REAL | svc.getPickingTasks | |
| GET /barcode-warehouse/print-queue | barcode-warehouse.controller.ts:84 | :84 | REAL | svc.getPrintQueue | |
| GET /barcode-warehouse/exit-logs | barcode-warehouse.controller.ts:89 | :89 | REAL | svc.getExitLogs | |
| GET /barcode-warehouse/operator-balance | barcode-warehouse.controller.ts:94 | :94 | REAL | svc.getOperatorBalance | |
| GET /barcode-warehouse/cycle-counts | barcode-warehouse.controller.ts:99 | :99 | REAL | svc.getCycleCounts | |
| POST /barcode-warehouse/cycle-counts/submit | barcode-warehouse.controller.ts:105 | :105 | REAL | svc.submitCycleCount | |
| DELETE /barcode-warehouse/barcodes/:id | barcode-warehouse.controller.ts:110 | :110 | REAL | svc.deleteBarcode | |
| PATCH /barcode-warehouse/barcodes/:id | barcode-warehouse.controller.ts:115 | :115 | REAL | svc.updateBarcode | |
| GET /barcode-warehouse/cycle-count | barcode-warehouse.controller.ts:120 | :120 | DUPLICATE | svc.getCycleCounts — same as cycle-counts | alias |
| POST /barcode-warehouse/cycle-count/submit | barcode-warehouse.controller.ts:125 | :125 | DUPLICATE | svc.submitCycleCount — same as cycle-counts/submit | alias |
| POST /barcode-warehouse/receive | barcode-warehouse.controller.ts:132 | :132 | REAL | svc.receive | |
| POST /barcode-warehouse/production-receive | barcode-warehouse.controller.ts:138 | :138 | REAL | svc.productionReceive | |
| POST /barcode-warehouse/production-complete | barcode-warehouse.controller.ts:143 | :143 | REAL | svc.productionComplete | |
| POST /barcode-warehouse/pick/:taskId | barcode-warehouse.controller.ts:150 | :150 | REAL | svc.pickTask | |
| POST /barcode-warehouse/picking/:taskId/complete | barcode-warehouse.controller.ts:155 | :155 | DUPLICATE | svc.pickTask — same as pick/:taskId | alias |
| PATCH /barcode-warehouse/operator-balance/:id/resolve | barcode-warehouse.controller.ts:161 | :161 | REAL | svc.resolveOperatorBalance | |
| PATCH /barcode-warehouse/qc/:id | barcode-warehouse.controller.ts:167 | :167 | DUPLICATE | svc.qcDecision — same as qc-decision | alias |
| GET /barcode-warehouse/barcodes/scan/:id | barcode-warehouse.controller.ts:172 | :172 | REAL | svc.scanBarcodeById | |
| POST /barcode-warehouse/exit/:id/notify-security | barcode-warehouse.controller.ts:179 | :179 | REAL | svc.notifySecurityExit | |
| POST /barcode-warehouse/issue | barcode-warehouse.controller.ts:186 | :186 | REAL | svc.issueGoods | |
| GET /barcode-warehouse/operator-debts | barcode-warehouse.controller.ts:191 | :191 | REAL | debtSvc.getOperatorDebts → barcode-warehouse-debt.service.ts | |
| GET /barcode-warehouse/debts/:id | barcode-warehouse.controller.ts:196 | :196 | REAL | debtSvc.getDebtById | |
| POST /barcode-warehouse/cycle-count | barcode-warehouse.controller.ts:201 | :201 | DUPLICATE | svc.submitCycleCount — same as cycle-counts/submit | alias |
| PATCH /barcode-warehouse/debts/:id | barcode-warehouse.controller.ts:207 | :207 | REAL | debtSvc.updateDebt | |
| GET /calendar-events | calendar-events.controller.ts:52 | :52 | REAL | svc.getAll → calendar-events.service.ts (SQL) | |
| GET /calendar-events/v2 | calendar-events.controller.ts:61 | :61 | DUPLICATE | same svc.getAll, ACL reshape | orphan /v2 |
| GET /calendar-events/upcoming | calendar-events.controller.ts:71 | :71 | REAL | svc.getUpcoming | |
| POST /calendar-events | calendar-events.controller.ts:77 | :77 | REAL | svc.create | |
| GET /calendar-events/:id | calendar-events.controller.ts:83 | :83 | REAL | svc.getById | |
| PUT /calendar-events/:id | calendar-events.controller.ts:88 | :88 | REAL | svc.update | |
| DELETE /calendar-events/:id | calendar-events.controller.ts:95 | :95 | REAL | svc.delete | |
| PATCH /calendar-events/:id | calendar-events.controller.ts:100 | :100 | DUPLICATE | svc.update — same as PUT :id | method alias |
| GET /candidates | candidates-compat.controller.ts:36 | :36 | REAL | svc.getCandidates → candidates-compat.service.ts (SQL) | |
| GET /candidates/v2 | candidates-compat.controller.ts:48 | :48 | DUPLICATE | same svc.getCandidates, ACL reshape | orphan /v2 |
| POST /candidates | candidates-compat.controller.ts:63 | :63 | REAL | svc.createCandidate | |
| GET /candidates/:id | candidates-compat.controller.ts:68 | :68 | REAL | svc.getCandidate | |
| PUT /candidates/:id | candidates-compat.controller.ts:73 | :73 | REAL | svc.updateCandidate | |
| DELETE /candidates/:id | candidates-compat.controller.ts:78 | :78 | REAL | svc.deleteCandidate | |
| GET /cfo/dashboard | cfo.controller.ts:36 | :36 | REAL | svc.getDashboard → cfo.service.ts (SQL) | |
| GET /cfo/cash-position | cfo.controller.ts:41 | :41 | REAL | svc.getCashPosition | |
| GET /cfo/cash-position/v2 | cfo.controller.ts:51 | :51 | DUPLICATE | same svc.getCashPosition, ACL reshape | orphan /v2 |
| GET /cfo/profitability | cfo.controller.ts:58 | :58 | REAL | svc.getProfitability | |
| GET /cfo/profitability-trend | cfo.controller.ts:63 | :63 | REAL | svc.getProfitabilityTrend | |
| GET /cfo/financial-risk | cfo.controller.ts:67 | :67 | REAL | svc.getFinancialRisk → cfo-risk.service.ts | |
| GET /core/departments | core-departments-compat.controller.ts:39 | :39 | REAL | getCoreDepartments → org-compat.repository.ts (SQL) | live OrgDepartmentsPage |
| POST /core/departments | core-departments-compat.controller.ts:45 | :45 | REAL | createCoreDepartment | |
| DELETE /core/departments/:id | core-departments-compat.controller.ts:51 | :51 | REAL | softDeleteCoreDepartment | |
| GET /crm/invoices | crm-extended.controller.ts:37 | :37 | REAL | svc.getCrmInvoices → SQL crm_invoices | |
| GET /crm/invoices/v2 | crm-extended.controller.ts:48 | :48 | DUPLICATE | same svc.getCrmInvoices, ACL reshape | orphan /v2 |
| GET /crm/ai/dashboard-analysis | crm-extended.controller.ts:68 | :68 | REAL | svc.getAiDashboardAnalysis → SQL crm_leads | |
| GET /crm/supervisor/dashboard | crm-extended.controller.ts:73 | :73 | REAL | svc.getSupervisorDashboard → SQL crm_deals | |
| GET /crm/ai/supervisor-dashboard | crm-extended.controller.ts:78 | :78 | DUPLICATE | svc.getSupervisorDashboard — same as supervisor/dashboard | alias |
| GET /crm/ai/nba/:entityType/:entityId | crm-extended.controller.ts:83 | :83 | REAL | svc.getNextBestAction → SQL crm_deals | params ignored but real query |
| GET /crm/ai/extended/insights | crm-extended.controller.ts:90 | :90 | REAL | svc.getExtendedInsights → SQL crm_leads | |
| POST /crm/ai/create-task | crm-extended.controller.ts:97 | crm-extended.service.ts:155 | GREEN-LIE | returns `{id:null,status:'created'}` — NO DB insert | claims created, saves nothing |
| POST /crm/chat | crm-extended.controller.ts:102 | crm-extended.service.ts:159 | GREEN-LIE | returns `{response:'',sessionId,timestamp}` — echoes, no AI/DB | empty echo |
| POST /crm/ai/extended/chat/respond | crm-extended.controller.ts:102 | crm-extended.service.ts:159 | DUPLICATE | array-alias of POST /crm/chat (also green-lie echo) | alias |
| POST /crm/auto-tasks | crm-extended.controller.ts:108 | crm-extended.service.ts:163 | GREEN-LIE | returns `{tasksCreated:0,message:'queued',params:body}` — no-op echo | |
| POST /crm/ai/extended/auto-tasks/create | crm-extended.controller.ts:108 | crm-extended.service.ts:163 | DUPLICATE | array-alias of POST /crm/auto-tasks (also no-op) | alias |
| POST /crm/ai/churn | crm-extended.controller.ts:114 | crm-extended.service.ts:167 | MOCK | hardcoded `{churnRisk:'low',score:0}` — no DB | |
| POST /crm/ai/extended/churn/analyze | crm-extended.controller.ts:114 | crm-extended.service.ts:167 | DUPLICATE | array-alias of POST /crm/ai/churn (also mock) | alias |
| POST /crm/ai/voice | crm-extended.controller.ts:120 | crm-extended.service.ts:171 | MOCK | hardcoded `{transcript:'',intent:null,confidence:0}` — no DB | |
| POST /crm/ai/extended/voice/analyze-call | crm-extended.controller.ts:120 | crm-extended.service.ts:171 | DUPLICATE | array-alias of POST /crm/ai/voice (also mock) | alias |
| GET /marketing/segments | crm-extended.controller.ts:139 | crm-extended.service.ts:109 | REAL | svc.getMarketingSegments → SQL crm_leads | MarketingExtendedCompatController |
| GET /discipline-records | discipline-records-compat.controller.ts:36 | :36 | REAL | svc.getDisciplineRecords → discipline-records-compat.service.ts (SQL) | |
| GET /discipline-records/v2 | discipline-records-compat.controller.ts:49 | :49 | DUPLICATE | same svc.getDisciplineRecords, ACL reshape | orphan /v2 |
| POST /discipline-records | discipline-records-compat.controller.ts:64 | :64 | REAL | svc.createDisciplineRecord | |
| GET /discipline-records/:id | discipline-records-compat.controller.ts:70 | :70 | REAL | svc.getDisciplineRecord | |
| PUT /discipline-records/:id | discipline-records-compat.controller.ts:75 | :75 | REAL | svc.updateDisciplineRecord | |
| DELETE /discipline-records/:id | discipline-records-compat.controller.ts:80 | :80 | REAL | svc.deleteDisciplineRecord | |
| GET /hr-v2/workflow/routes | document-workflow-v2.controller.ts:48 | :48 | REAL | svc.listRoutes → document-workflow-v2.service.ts (SQL) | |
| GET /hr-v2/workflow/routes/v2 | document-workflow-v2.controller.ts:57 | :57 | DUPLICATE | same svc.listRoutes, ACL reshape | orphan /v2 |
| POST /hr-v2/workflow/initiate | document-workflow-v2.controller.ts:73 | :73 | REAL | svc.initiateDocument | |
| POST /hr-v2/workflow/:instanceId/approve | document-workflow-v2.controller.ts:103 | :103 | REAL | svc.approveStep → document-workflow-v2-decisions.service.ts | |
| POST /hr-v2/workflow/:instanceId/reject | document-workflow-v2.controller.ts:116 | :116 | REAL | svc.rejectStep | |
| GET /hr-v2/workflow/employee/:employeeId/documents | document-workflow-v2.controller.ts:131 | :131 | REAL | svc.getEmployeeDocuments | |
| GET /hr-v2/workflow/pending | document-workflow-v2.controller.ts:140 | :140 | REAL | svc.getPendingApprovals | |
| GET /employee-files | employee-files-compat.controller.ts:49 | :49 | REAL | svc.listFiles → employee-files-compat.service.ts (SQL) | |
| GET /employee-files/v2 | employee-files-compat.controller.ts:62 | :62 | DUPLICATE | same svc.listFiles, ACL reshape | orphan /v2 |
| POST /employee-files | employee-files-compat.controller.ts:75 | :75 | REAL | svc.createFile | |
| GET /employee-files/:id | employee-files-compat.controller.ts:83 | :83 | REAL | svc.getFile | |
| PATCH /employee-files/:id | employee-files-compat.controller.ts:88 | :88 | REAL | svc.updateFile | |
| DELETE /employee-files/:id | employee-files-compat.controller.ts:93 | :93 | REAL | svc.deleteFile | |
| GET /employee-kpi | employee-kpi-compat.controller.ts:42 | :42 | REAL | svc.getKpis → employee-kpi-compat.service.ts (SQL) | |
| GET /employee-kpi/v2 | employee-kpi-compat.controller.ts:56 | :56 | DUPLICATE | same svc.getKpis, ACL reshape | orphan /v2 |
| POST /employee-kpi | employee-kpi-compat.controller.ts:70 | :70 | REAL | svc.createKpi | |
| GET /employee-kpi/top-performers | employee-kpi-compat.controller.ts:76 | :76 | REAL | svc.getTopPerformers | |
| GET /employee-kpi/summary/top-performers | employee-kpi-compat.controller.ts:76 | :76 | DUPLICATE | array-alias of top-performers | alias |
| GET /employee-kpi/department-summary | employee-kpi-compat.controller.ts:84 | :84 | REAL | svc.getDepartmentSummary | |
| GET /employee-kpi/summary/department | employee-kpi-compat.controller.ts:84 | :84 | DUPLICATE | array-alias of department-summary | alias |
| GET /employee-kpi/zone-history/:employeeId | employee-kpi-compat.controller.ts:89 | :89 | REAL | svc.getZoneHistory | |
| GET /employee-kpi/employee-zone-history | employee-kpi-compat.controller.ts:98 | :98 | DUPLICATE | svc.getZoneHistory — same handler | alias |
| GET /employee-kpi/daily-attendance | employee-kpi-compat.controller.ts:107 | :107 | REAL | svc.getDailyAttendance | |
| POST /employee-kpi/attendance | employee-kpi-compat.controller.ts:115 | :115 | REAL | svc.recordAttendance | |
| GET /employee-kpi/:id | employee-kpi-compat.controller.ts:121 | :121 | REAL | svc.getKpi | |
| PUT /employee-kpi/:id | employee-kpi-compat.controller.ts:126 | :126 | REAL | svc.updateKpi | |
| DELETE /employee-kpi/:id | employee-kpi-compat.controller.ts:131 | :131 | REAL | svc.deleteKpi | |
| GET /employee-zone-history | employee-kpi-compat.controller.ts:145 | :145 | DUPLICATE | EmployeeZoneHistoryCompatController → svc.getZoneHistory | alias controller |
| GET /employee-zone-history/:employeeId | employee-kpi-compat.controller.ts:154 | :154 | DUPLICATE | svc.getZoneHistory — same as employee-kpi/zone-history | alias controller |
| GET /daily-attendance | employee-kpi-compat.controller.ts:172 | :172 | DUPLICATE | DailyAttendanceCompatController → svc.getDailyAttendance | alias controller |
| POST /daily-attendance | employee-kpi-compat.controller.ts:180 | :180 | DUPLICATE | svc.recordAttendance — same as employee-kpi/attendance | alias controller |
| GET /employees | employees-compat.controller.ts:50 | :50 | REAL | extendedSvc.listExtended/countExtended → employees-list-extended.service.ts (SQL) | |
| GET /employees/v2 | employees-compat.controller.ts:71 | :71 | DUPLICATE | same extendedSvc, ACL reshape | orphan /v2 |
| POST /employees | employees-compat.controller.ts:92 | :92 | REAL | svc.createEmployee → employees-compat.service.ts | |
| POST /employees/import | employees-compat.controller.ts:98 | :98 | REAL | subSvc.importEmployees | |
| GET /employees/for-face | employees-compat.controller.ts:104 | :104 | REAL | svc.getEmployeesForFace | |
| GET /employees/:id | employees-compat.controller.ts:109 | :109 | REAL | extendedSvc.getById / svc.getEmployee | |
| PUT /employees/:id | employees-compat.controller.ts:116 | :116 | REAL | svc.updateEmployee | |
| DELETE /employees/:id | employees-compat.controller.ts:121 | :121 | REAL | svc.deleteEmployee | |
| PATCH /employees/:id/profile-image | employees-compat.controller.ts:126 | :126 | REAL | svc.updateProfileImage | |
| PUT /employees/:id/profile-image | employees-compat.controller.ts:135 | :135 | DUPLICATE | svc.updateProfileImage — same as PATCH | method alias |
| PATCH /employees/:id/org-functions | employees-compat.controller.ts:144 | :144 | REAL | svc.assignOrgFunctions | |
| POST /employees/:id/assign-org-functions | employees-compat.controller.ts:152 | :152 | DUPLICATE | svc.assignOrgFunctions — same handler | alias |
| GET /employees/:id/org-departments | employees-compat.controller.ts:167 | :167 | REAL | svc.getEmployeeOrgDepartments | |
| GET /employees/:id/assets | employees-compat-sub.controller.ts:61 | :61 | REAL | subSvc.getAssets → employees-compat-sub.service.ts (SQL) | |
| POST /employees/:id/assets | employees-compat-sub.controller.ts:63 | :63 | REAL | subSvc.assignAsset | |
| DELETE /employees/:id/assets/:assetId | employees-compat-sub.controller.ts:66 | :66 | REAL | subSvc.returnAsset | |
| GET /employees/:id/swap-requests | employees-compat-sub.controller.ts:70 | :70 | REAL | subSvc.getSwapRequests | |
| GET /employees/:id/complaints | employees-compat-sub.controller.ts:74 | :74 | REAL | subSvc.getComplaints | |
| POST /employees/:id/complaints | employees-compat-sub.controller.ts:77 | :77 | REAL | subSvc.createComplaint | |
| GET /employees/:id/assessment-skips | employees-compat-sub.controller.ts:81 | :81 | REAL | subSvc.getAssessmentSkips | |
| GET /employees/:id/bank-accounts | employees-compat-sub.controller.ts:85 | :85 | REAL | financials.getBankAccounts → employees-compat-financials.service.ts | |
| GET /employees/:id/bank-accounts/v2 | employees-compat-sub.controller.ts:93 | :93 | DUPLICATE | same financials.getBankAccounts, ACL reshape | orphan /v2 |
| POST /employees/:id/bank-accounts | employees-compat-sub.controller.ts:104 | :104 | REAL | financials.createBankAccount | |
| GET /employees/:id/bonuses | employees-compat-sub.controller.ts:108 | :108 | REAL | financials.getBonuses | |
| POST /employees/:id/bonuses | employees-compat-sub.controller.ts:111 | :111 | REAL | financials.createBonus | |
| GET /employees/:id/business-trips | employees-compat-sub.controller.ts:115 | :115 | REAL | financials.getBusinessTrips | |
| POST /employees/:id/business-trips | employees-compat-sub.controller.ts:118 | :118 | REAL | financials.createBusinessTrip | |
| GET /employees/:id/capital-profile | employees-compat-sub.controller.ts:122 | :122 | REAL | profile.getCapitalProfile → employees-compat-profile-*.service.ts | |
| POST /employees/:id/capital-profile | employees-compat-sub.controller.ts:125 | :125 | REAL | profile.createCapitalProfile | |
| GET /employees/:id/career | employees-compat-sub.controller.ts:129 | :129 | REAL | profile.getCareer | |
| POST /employees/:id/career | employees-compat-sub.controller.ts:135 | :135 | REAL | profile.createCareer | |
| GET /employees/:id/cash-advances | employees-compat-sub.controller.ts:139 | :139 | REAL | financials.getCashAdvances | |
| POST /employees/:id/cash-advances | employees-compat-sub.controller.ts:142 | :142 | REAL | financials.createCashAdvance | |
| GET /employees/:id/contracts | employees-compat-sub.controller.ts:146 | :146 | REAL | profile.getContracts | |
| POST /employees/:id/contracts | employees-compat-sub.controller.ts:149 | :149 | REAL | profile.createContract | |
| GET /employees/:id/corporate-inventory | employees-compat-sub.controller.ts:153 | :153 | REAL | profile.getCorporateInventory | |
| POST /employees/:id/corporate-inventory | employees-compat-sub.controller.ts:156 | :156 | REAL | profile.createCorporateInventory | |
| PATCH /employees/:id/corporate-inventory/:itemId/return | employees-compat-sub.controller.ts:159 | :159 | REAL | profile.patchCorporateInventoryReturn | |
| PATCH /employees/:id/corporate-inventory/:itemId/sign | employees-compat-sub.controller.ts:162 | :162 | REAL | profile.patchCorporateInventorySign | |
| GET /employees/:id/emergency-contacts | employees-compat-sub.controller.ts:166 | :166 | REAL | profile.getEmergencyContacts | |
| POST /employees/:id/emergency-contacts | employees-compat-sub.controller.ts:169 | :169 | REAL | profile.createEmergencyContact | |
| GET /employees/:id/files | employees-compat-sub.controller.ts:173 | :173 | REAL | profile.getFiles | |
| POST /employees/:id/files | employees-compat-sub.controller.ts:176 | :179 | REAL | inline raw INSERT INTO employee_files | Qoida-15 raw SQL in controller |
| DELETE /employees/:id/files/:fileId | employees-compat-sub.controller.ts:201 | :201 | REAL | financials.deleteEmployeeFile | |
| PATCH /employees/:id/status | employees-compat-sub.controller.ts:205 | :205 | REAL | svc.updateEmployee | |
| GET /employees/:id/assessments | employees-compat-sub.controller.ts:209 | :209 | REAL | financials.getAllAssessments | |
| POST /employees/:id/assessments | employees-compat-sub.controller.ts:212 | :212 | REAL | financials.createAssessment | |
| GET /employees/:id/fines | employees-compat-sub.controller.ts:216 | :216 | REAL | financials.getFines | |
| POST /employees/:id/fines | employees-compat-sub.controller.ts:219 | :219 | REAL | financials.createFine | |
| GET /employees/:id/leave-requests | employees-compat-sub.controller.ts:223 | :223 | REAL | profile.getLeaveRequests | |
| POST /employees/:id/leave-requests | employees-compat-sub.controller.ts:226 | :226 | REAL | profile.createLeaveRequest | |
| GET /employees/:id/overtime | employees-compat-sub.controller.ts:230 | :230 | REAL | financials.getOvertime | |
| POST /employees/:id/overtime | employees-compat-sub.controller.ts:233 | :233 | REAL | financials.createOvertime | |
| GET /employees/:id/passport | employees-compat-sub.controller.ts:244 | :244 | REAL | profile.getPassport | |
| POST /employees/:id/passport | employees-compat-sub.controller.ts:250 | :250 | REAL | profile.createPassport | |
| GET /employees/:id/salary-history | employees-compat-sub.controller.ts:254 | :254 | REAL | profile.getSalaryHistory | |
| POST /employees/:id/salary-history | employees-compat-sub.controller.ts:257 | :257 | REAL | profile.createSalaryHistory | |
| GET /employees/:id/sick-leaves | employees-compat-sub.controller.ts:261 | :261 | REAL | profile.getSickLeaves | |
| POST /employees/:id/sick-leaves | employees-compat-sub.controller.ts:264 | :264 | REAL | profile.createSickLeave | |
| GET /employees/:id/monthly-report | employees-compat-sub.controller.ts:268 | :268 | REAL | profile.getMonthlyReport | |
| GET /employees/:id/org-structure | employees-compat-sub.controller.ts:271 | :271 | REAL | profile.getOrgStructure | |
| GET /employees/:id/payroll-summary | employees-compat-sub.controller.ts:282 | :282 | REAL | profile.getPayrollSummary | |
| POST /employees/:id/set-password | employees-compat-sub.controller.ts:288 | :288 | REAL | financials.setPassword | |
| GET /employees/extra/:id | employees-extra.controller.ts:71 | :71 | REAL | svc.getEmployee + ACL translate | |
| PATCH /employees/:id | employees-extra.controller.ts:86 | :86 | DUPLICATE | svc.updateEmployee — same as employees-compat PUT :id | method alias |
| POST /employees/:id/profile-image | employees-extra.controller.ts:96 | :96 | DUPLICATE | svc.updateProfileImage — same as employees-compat PATCH | method alias |
| POST /employees/:id/corporate-inventory/:itemId/sign | employees-extra.controller.ts:107 | :109 | GREEN-LIE | returns hardcoded `{signed:true}` — NO DB write | canonical sign is sub PATCH :162 |
| POST /employees/:id/corporate-inventory/:itemId/return | employees-extra.controller.ts:113 | :115 | GREEN-LIE | returns hardcoded `{returned:true}` — NO DB write | canonical return is sub PATCH :159 |
| GET /europrint-control/director-kpis | europrint-control-director.controller.ts:39 | :39 | REAL | svc.getDirectorKpis → europrint-control-director.service.ts (SQL) | |
| GET /europrint-control/director-kpis/v2 | europrint-control-director.controller.ts:49 | :49 | DUPLICATE | same svc.getDirectorKpis, ACL reshape | orphan /v2 |
| GET /europrint-control/director-summary | europrint-control-director.controller.ts:59 | :59 | REAL | svc.getDirectorSummary (graceful fallback on err) | |
| GET /europrint-control/status-history | europrint-control-director.controller.ts:65 | :65 | REAL | svc.getStatusHistory | |
| GET /europrint-control/deleted-records | europrint-control-director.controller.ts:74 | :74 | REAL | svc.getDeletedRecords → SQL audit_logs | |
| GET /europrint-control/accountant/budgets | europrint-control-director.controller.ts:79 | :79 | REAL | svc.getAccountantBudgets | |
| GET /europrint-control/accountant/financial-summary | europrint-control-director.controller.ts:84 | :84 | REAL | svc.getAccountantFinancialSummary | |
| GET /europrint-control/accountant/kpi-values | europrint-control-director.controller.ts:90 | :90 | REAL | svc.getAccountantKpiValues | |
| GET /europrint-control/accountant/pending-payments | europrint-control-director.controller.ts:97 | :97 | REAL | svc.getAccountantPendingPayments | |
| GET /europrint-control/dashboard/accountant | europrint-control-director.controller.ts:102 | :102 | REAL | svc.getAccountantDashboard | |
| POST /europrint-control/deleted-records/:id/restore | europrint-control-director.controller.ts:108 | europrint-control-director.service.ts:171 | GREEN-LIE | returns `{id,restoredAt,status:'restored'}` — NO DB restore | claims restored, no-op |
| GET /europrint-control/menus/admin | europrint-control-director.controller.ts:122 | europrint-control-director.service.ts:42 | REAL | svc.getAdminMenus → SQL role_menus (stale "501" comment) | |
| GET /europrint-control/business-rules | europrint-control.controller.ts:35 | :35 | REAL | svc.getBusinessRules → europrint-control.service.ts (SQL) | |
| GET /europrint-control/units | europrint-control.controller.ts:40 | :40 | REAL | svc.getUnits | |
| GET /europrint-control/validation-rules | europrint-control.controller.ts:45 | :45 | REAL | svc.getValidationRules | |
| GET /europrint-control/kpis | europrint-control.controller.ts:50 | :50 | REAL | svc.getKpis | |
| GET /europrint-control/auditor-dashboard | europrint-control.controller.ts:55 | :55 | REAL | svc.getAuditorDashboard | |
| GET /europrint-control/sap-patterns-summary | europrint-control.controller.ts:60 | :60 | REAL | svc.getSapPatternsSummary (prior hardcode replaced by real query) | |
| GET /europrint-control/all-rules-summary | europrint-control.controller.ts:65 | :65 | REAL | svc.getAllRulesSummary (prior hardcode replaced by real query) | |
| GET /europrint-control/logs | europrint-control.controller.ts:70 | :70 | REAL | svc.getLogs | |
| GET /europrint-control/logs/:id | europrint-control.controller.ts:79 | :79 | REAL | svc.getLogById | |
| GET /europrint-control/module-health | europrint-control.controller.ts:84 | :84 | REAL | svc.getModuleHealth | |
| GET /europrint-control/validation-summary | europrint-control.controller.ts:89 | :89 | REAL | svc.getValidationSummary | |
| GET /europrint-control/validation-results | europrint-control.controller.ts:94 | :94 | REAL | svc.getValidationResults | |
| GET /europrint-control/audit-stats | europrint-control.controller.ts:99 | :99 | REAL | svc.getAuditStats | |
| GET /europrint-control/audit-logs | europrint-control.controller.ts:104 | :104 | REAL | svc.getAuditLogs | |
| GET /europrint-control/audit-logs/v2 | europrint-control.controller.ts:118 | :118 | DUPLICATE | same svc.getAuditLogs, ACL reshape | orphan /v2 |
| GET /europrint-control/action-types | europrint-control.controller.ts:132 | :132 | REAL | svc.getActionTypes | |
| GET /europrint-control/source-types | europrint-control.controller.ts:137 | :137 | REAL | svc.getSourceTypes | |
| GET /europrint-control/menus | europrint-control.controller.ts:142 | :142 | REAL | svc.getMenus | |
| GET /europrint-control/menus/:role | europrint-control.controller.ts:147 | :147 | DUPLICATE | svc.getMenus — same as /menus?role | alias |
| GET /europrint-control/audit-action-types | europrint-control.controller.ts:152 | :152 | DUPLICATE | svc.getActionTypes — same as /action-types | alias |
| GET /europrint-control/audit-source-types | europrint-control.controller.ts:157 | :157 | DUPLICATE | svc.getSourceTypes — same as /source-types | alias |
| GET /goals | goals-compat.controller.ts:58 | :58 | REAL | svc.getGoals → goals-compat.service.ts (SQL) | |
| GET /goals/v2 | goals-compat.controller.ts:73 | :73 | DUPLICATE | same svc.getGoals, ACL reshape | orphan /v2 |
| POST /goals | goals-compat.controller.ts:90 | :90 | REAL | svc.createGoal | |
| GET /goals/:id | goals-compat.controller.ts:98 | :98 | REAL | svc.getGoal | |
| PUT /goals/:id | goals-compat.controller.ts:103 | :103 | REAL | svc.updateGoal | |
| PATCH /goals/:id | goals-compat.controller.ts:111 | :111 | DUPLICATE | svc.updateGoal — same as PUT :id | method alias |
| DELETE /goals/:id | goals-compat.controller.ts:117 | :117 | REAL | svc.deleteGoal | |
| GET /hr-map/employees | hr-map-compat.controller.ts:35 | :35 | REAL | svc.getMapEmployees → hr-map-compat.service.ts (SQL) | |
| GET /hr-map/employees/v2 | hr-map-compat.controller.ts:51 | :51 | DUPLICATE | same svc.getMapEmployees, ACL reshape | orphan /v2 |
| GET /hr-map/departments | hr-map-compat.controller.ts:64 | :64 | REAL | svc.getDepartments | |
| GET /hr-map/heatmap | hr-map-compat.controller.ts:69 | :69 | REAL | svc.getHeatmap | |
| GET /hr-map/attendance-today | hr-map-compat.controller.ts:74 | :74 | REAL | svc.getAttendanceToday | |
| POST /hr-map/filter | hr-map-compat.controller.ts:79 | :79 | REAL | svc.filterMap | |
| GET /hr-map/transport-groups | hr-map-compat.controller.ts:84 | :84 | REAL | svc.getTransportGroups | |
| GET /hr-map/stats | hr-map-compat.controller.ts:91 | :91 | REAL | svc.getMapStats | |
| GET /hr-map/zones | hr-map-compat.controller.ts:99 | :99 | REAL | svc.getZones | |
| GET /mentorships | mentorships-compat.controller.ts:35 | :35 | REAL | svc.getMentorships → mentorships-compat.service.ts (SQL) | |
| GET /mentorships/v2 | mentorships-compat.controller.ts:47 | :47 | DUPLICATE | same svc.getMentorships, ACL reshape | orphan /v2 |
| POST /mentorships | mentorships-compat.controller.ts:60 | :60 | REAL | svc.createMentorship | |
| GET /mentorships/:id | mentorships-compat.controller.ts:66 | :66 | REAL | svc.getMentorship | |
| PUT /mentorships/:id | mentorships-compat.controller.ts:71 | :71 | REAL | svc.updateMentorship | |
| PATCH /mentorships/:id | mentorships-compat.controller.ts:76 | :76 | DUPLICATE | svc.updateMentorship — same as PUT :id | method alias |
| DELETE /mentorships/:id | mentorships-compat.controller.ts:81 | :81 | REAL | svc.deleteMentorship | |
| GET /pos/wh/stock | pos-warehouse-integration.controller.ts:49 | :49 | REAL | svc.getRealTimeStock → pos-warehouse-integration-queries.service.ts (SQL) | |
| GET /pos/wh/barcode/:barcode | pos-warehouse-integration.controller.ts:69 | :69 | REAL | svc.findByBarcode | |
| POST /pos/wh/movements | pos-warehouse-integration.controller.ts:77 | :77 | REAL | svc.createMovement → pos-warehouse-integration-movement.service.ts | |
| GET /pos/wh/movements | pos-warehouse-integration.controller.ts:118 | :118 | REAL | svc.getMovementHistory | |
| GET /pos/wh/alerts | pos-warehouse-integration.controller.ts:138 | :138 | REAL | svc.getStockAlerts | |
| GET /pos/wh/alerts/v2 | pos-warehouse-integration.controller.ts:148 | :148 | DUPLICATE | same svc.getStockAlerts, ACL reshape | orphan /v2 |
| GET /warehouses | resources.controller.ts:35 | :35 | REAL | svc.getWarehouses → resources.service.ts (SQL) | WarehousesCompatController |
| GET /warehouses/:id | resources.controller.ts:40 | :40 | REAL | svc.getWarehouse | |
| POST /warehouses | resources.controller.ts:45 | :45 | REAL | svc.createWarehouse | |
| PATCH /warehouses/:id | resources.controller.ts:51 | :51 | REAL | svc.updateWarehouse | |
| DELETE /warehouses/:id | resources.controller.ts:56 | :56 | REAL | svc.deleteWarehouse | |
| POST /warehouses/notify-vacancies | resources.controller.ts:62 | :62 | MOCK | returns hardcoded `{notified:false,reason:'not configured'}` — no DB | honest no-op stub |
| GET /material-cards | resources.controller.ts:82 | :82 | REAL | svc.getMaterialCards | MaterialCardsCompatController |
| GET /material-cards/v2 | resources.controller.ts:91 | :91 | DUPLICATE | same svc.getMaterialCards, ACL reshape | orphan /v2 |
| GET /material-cards/:id | resources.controller.ts:105 | :105 | REAL | svc.getMaterialCard | |
| POST /material-cards | resources.controller.ts:110 | :110 | REAL | svc.createMaterialCard | |
| PATCH /material-cards/:id/unit-price | resources.controller.ts:116 | :116 | REAL | svc.updateMaterialCardUnitPrice | |
| GET /org-departments | resources.controller.ts:139 | :139 | REAL | svc.getOrgDepartments | OrgDepartmentsCompatController |
| POST /org-departments/notify-vacancies | resources.controller.ts:144 | :144 | REAL | svc.getVacantDepartments (real query, misnomer path) | |
| GET /org-functions | resources.controller.ts:161 | :161 | REAL | svc.getOrgFunctions | OrgFunctionsCompatController |
| POST /org-functions | resources.controller.ts:171 | :171 | REAL | svc.createOrgFunction | |
| PATCH /org-functions/:id | resources.controller.ts:179 | :179 | REAL | svc.updateOrgFunction | |
| DELETE /org-functions/:id | resources.controller.ts:186 | :186 | REAL | svc.deleteOrgFunction | |
| GET /saas/tenants | saas.controller.ts:72 | :72 | REAL | svc.getTenants → saas.service.ts (SQL) | |
| GET /saas/tenants/v2 | saas.controller.ts:82 | :82 | DUPLICATE | same svc.getTenants, ACL reshape | orphan /v2 |
| POST /saas/tenants | saas.controller.ts:92 | :92 | REAL | svc.createTenant | |
| GET /saas/platform-stats | saas.controller.ts:99 | :99 | REAL | svc.getPlatformStats | |
| GET /saas/error-logs | saas.controller.ts:104 | :104 | REAL | svc.getErrorLogs | |
| PATCH /saas/tenants/:id/status | saas.controller.ts:109 | :109 | REAL | svc.updateTenantStatus | |
| GET /saas/modules | saas.controller.ts:115 | :115 | REAL | svc.getModules | |
| GET /saas/expiry-alerts | saas.controller.ts:120 | :120 | REAL | svc.getExpiryAlerts | |
| GET /saas/tenants/:id | saas.controller.ts:125 | :125 | REAL | svc.getTenantById | |
| PUT /saas/tenants/:id | saas.controller.ts:130 | :130 | REAL | svc.updateTenant | |
| DELETE /saas/tenants/:id | saas.controller.ts:136 | :136 | REAL | svc.deleteTenant | |
| GET /saas/tenants/:id/modules | saas.controller.ts:142 | :142 | REAL | svc.getTenantModules | |
| PATCH /saas/tenants/:id/modules | saas.controller.ts:147 | :147 | REAL | svc.updateTenantModules | |
| POST /saas/tenants/:id/onboard | saas.controller.ts:153 | :153 | REAL | svc.onboardTenant | |
| GET /orders-registry | saas.controller.ts:167 | :167 | REAL | svc.listOrders → orders-registry.service.ts (SQL) | OrdersRegistryCompatController |
| POST /orders-registry | saas.controller.ts:173 | :173 | REAL | svc.createOrder | |
| GET /guidelines | settings-admin.controller.ts:54 | :54 | REAL | svc.getGuidelines → settings-admin.service.ts (SQL) | |
| GET /guidelines/v2 | settings-admin.controller.ts:64 | :64 | DUPLICATE | same svc.getGuidelines, ACL reshape | orphan /v2 |
| POST /guidelines | settings-admin.controller.ts:75 | :75 | REAL | svc.createGuideline | |
| PUT /guidelines/:id | settings-admin.controller.ts:82 | :82 | REAL | svc.updateGuideline | |
| DELETE /guidelines/:id | settings-admin.controller.ts:88 | :88 | REAL | svc.deleteGuideline | |
| GET /contact-settings | settings-admin.controller.ts:94 | :94 | REAL | svc.getContactSettings | |
| PUT /contact-settings | settings-admin.controller.ts:100 | :100 | REAL | svc.updateContactSettings | |
| GET /system-settings | settings-admin.controller.ts:113 | :113 | REAL | svc.getSystemSettings | |
| PUT /system-settings | settings-admin.controller.ts:119 | :119 | REAL | svc.updateSystemSettings | |
| GET /filters | settings-admin.controller.ts:132 | :132 | REAL | svc.getFilters | |
| POST /filters | settings-admin.controller.ts:138 | :138 | REAL | svc.createFilter | |
| PUT /filters/:id | settings-admin.controller.ts:145 | :145 | REAL | svc.updateFilter | |
| DELETE /filters/:id | settings-admin.controller.ts:151 | :151 | REAL | svc.deleteFilter | |
| GET /succession/career-plans | succession-compat.controller.ts:35 | :35 | REAL | svc.getCareerPlans → succession-compat.service.ts (SQL) | |
| GET /succession/career-plans/v2 | succession-compat.controller.ts:45 | :45 | DUPLICATE | same svc.getCareerPlans, ACL reshape | orphan /v2 |
| POST /succession/career-plans | succession-compat.controller.ts:55 | :55 | REAL | svc.createCareerPlan | |
| PUT /succession/career-plans/:id | succession-compat.controller.ts:61 | :61 | REAL | svc.updateCareerPlan | |
| GET /succession/talent-pool | succession-compat.controller.ts:66 | :66 | REAL | svc.getTalentPool | |
| POST /succession/talent-pool | succession-compat.controller.ts:71 | :71 | REAL | svc.createTalentPoolEntry | |
| GET /succession/candidates | succession-compat.controller.ts:77 | :77 | DUPLICATE | svc.getTalentPool — same as /talent-pool (positionId ignored) | alias |
| GET /succession/key-positions | succession-compat.controller.ts:82 | :82 | REAL | svc.getKeyPositions | |
| GET /succession/risks | succession-compat.controller.ts:89 | :89 | REAL | svc.getSuccessionRisks | |
| GET /succession/readiness-stats | succession-compat.controller.ts:95 | :95 | REAL | svc.getReadinessStats | |
| GET /telegram/admin/stats | telegram-admin.controller.ts:43 | :43 | REAL | svc.getStats → telegram-admin.service.ts (SQL) | |
| GET /telegram/admin/users | telegram-admin.controller.ts:48 | :48 | REAL | svc.getUsers | |
| GET /telegram/admin/users/v2 | telegram-admin.controller.ts:58 | :58 | DUPLICATE | same svc.getUsers, ACL reshape | orphan /v2 |
| POST /telegram/admin/broadcast | telegram-admin.controller.ts:69 | :69 | REAL | svc.broadcast | |
| GET /users | users-compat.controller.ts:36 | :36 | REAL | svc.listUsers → users-compat.service.ts (SQL) | |
| GET /users/v2 | users-compat.controller.ts:48 | :48 | DUPLICATE | same svc.listUsers, ACL reshape | orphan /v2 |
| POST /warehouse/barcode/generate | warehouse-barcode-ops.controller.ts:36 | :36 | REAL | svc.generateBarcode → warehouse-barcode-ops.service.ts (SQL) | |
| POST /warehouse/barcode/scan | warehouse-barcode-ops.controller.ts:42 | :42 | REAL | svc.scanBarcode | |
| POST /warehouse/barcode/scan/v2 | warehouse-barcode-ops.controller.ts:53 | :53 | DUPLICATE | same svc.scanBarcode, ACL reshape | orphan /v2 |
| POST /warehouse/barcode/bulk-generate | warehouse-barcode-ops.controller.ts:61 | :61 | REAL | svc.bulkGenerateBarcodes | |
| GET /warehouse/barcode/print/:id | warehouse-barcode-ops.controller.ts:67 | :67 | REAL | svc.getPrintPreview | |
| GET /warehouse/materials | warehouse-catalog.controller.ts:50 | :50 | REAL | svc.getMaterials → warehouse-catalog.service.ts (SQL) | |
| GET /warehouse/materials/v2 | warehouse-catalog.controller.ts:60 | :60 | DUPLICATE | same svc.getMaterials, ACL reshape | orphan /v2 |
| POST /warehouse/materials | warehouse-catalog.controller.ts:74 | :74 | REAL | svc.createMaterial → INSERT material_cards | |
| GET /warehouse/batches/stats | warehouse-catalog.controller.ts:85 | :85 | REAL | svc.getBatchesStats | |
| GET /warehouse/batches | warehouse-catalog.controller.ts:90 | :90 | REAL | svc.getBatches | |
| POST /warehouse/batches | warehouse-catalog.controller.ts:100 | :100 | REAL | svc.createBatch | |
| PATCH /warehouse/batches/:id | warehouse-catalog.controller.ts:106 | :106 | REAL | svc.updateBatch | |
| POST /warehouse/movements | warehouse-catalog.controller.ts:111 | :111 | REAL | inline raw INSERT INTO material_movements | Qoida-15 raw SQL in controller |
| POST /warehouse/label/print | warehouse-label.controller.ts:36 | :36 | REAL | svc.printLabel → warehouse-label.service.ts (SQL) | |
| GET /warehouse/label/batches | warehouse-label.controller.ts:42 | :42 | REAL | svc.getLabelBatches | |
| GET /warehouse/label/batches/v2 | warehouse-label.controller.ts:55 | :55 | DUPLICATE | same svc.getLabelBatches, ACL reshape | orphan /v2 |
| GET /warehouse/label/history | warehouse-label.controller.ts:68 | :68 | REAL | svc.getPrintHistory | |
| PATCH /warehouse/label/batches/:id/status | warehouse-label.controller.ts:76 | :76 | REAL | svc.updateBatchStatus | |
| POST /warehouse/label/print-job | warehouse-label.controller.ts:84 | :84 | REAL | svc.createLabelPrintJob | |


---

## Finance / FI / Communication-Center / Notifications

Scope: every `@Get/@Post/@Put/@Patch/@Delete` route in every `*.controller.ts` under `modules/finance`, `modules/fi` (there is no separate `modules/fi` folder — the FI controller lives at `modules/finance/presentation/fi.controller.ts`; `modules/fi/` holds only a tax service, no controllers), `modules/communication-center`, and `modules/notifications`. 43 controllers, 251 routes.

GL engine note (deep-traced, load-bearing): `GlPostingService.createJournalEntry` (apps/api/src/modules/finance/domain/services/gl-posting.service.ts:138-203) resolves account codes → `accounts.id`, validates ΣDr==ΣCr, enforces a closed-period lock, is idempotent by reference, and inserts BALANCED pair-rows into the canonical `entries` table via a Drizzle transaction (drizzle-gl-posting.repo.ts:96-117). Every honest GL write path (post-sales-invoice, post-payroll, income-split, record-payment, verify-payment, cashier movements, payroll close) reaches this engine and truly persists to `entries`. The ONLY finance write paths that claim to post GL but do NOT reach `entries` are the two `/finance/gl-entries` routes in finance-main-actions.controller.ts (flagged GREEN-LIE below).

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /finance/gl | apps/api/src/modules/finance/presentation/finance-gl.controller.ts:50 | :52 | REAL | queryBus GetGlEntriesQuery → get-gl-entries.query handler reads entries | List GL entries |
| POST /finance/gl/post-sales-invoice | finance-gl.controller.ts:64 | :67 | REAL | glPostingService.postSalesInvoice → createJournalEntry → insertJournal → `entries` (gl-posting.service.ts:198) | Financial write reaches canonical ledger; ΣDr==ΣCr enforced |
| POST /finance/gl/post-payroll | finance-gl.controller.ts:79 | :82 | REAL | glPostingService.postPayroll → insertJournal → `entries` (gl-posting.service.ts:80) | Gross-only balanced Dr Salary Exp / Cr Salary Payable |
| GET /finance/gl/trial-balance | finance-gl.controller.ts:93 | :95 | REAL | glService.getTrialBalance | Read |
| GET /finance/gl/ledger/:accountCode | finance-gl.controller.ts:103 | :105 | REAL | glService.getLedger (paginated) | Read |
| GET /finance/gl/accounts-grouped | finance-gl.controller.ts:118 | :120 | REAL | financeAccountingService.getAccountGroups (ranges over accounts+entries) | 4-hisob grouping |
| GET /finance/gl/account-groups | finance-gl.controller.ts:129 | :131 | DUPLICATE | Same financeAccountingService.getAccountGroups as /accounts-grouped | Self-documented alias (counterpart: /finance/gl/accounts-grouped) |
| GET /finance/gl/income-split/preview | finance-gl.controller.ts:138 | :140 | REAL | incomeSplitService.computeSplit (no posting) | Read/compute |
| POST /finance/gl/income-split | finance-gl.controller.ts:148 | :150 | REAL | incomeSplitService.splitAndPost → postJournal → `entries` (income-split.service.ts:125) | Balanced 4-fund auto-split, real ledger post |
| GET /gl/accounts | apps/api/src/modules/finance/presentation/gl-standalone.controller.ts:38 | :39 | REAL | glSvc.findAllAccounts | Read chart of accounts |
| POST /gl/seed-accounts | gl-standalone.controller.ts:46 | :47 | REAL | glSvc.seedAccounts(rows) INSERT | Write |
| POST /gl/accounts | gl-standalone.controller.ts:56 | :57 | REAL | glSvc.createAccount INSERT | Write |
| GET /ar/ecl-aging | apps/api/src/modules/finance/presentation/finance-ar.controller.ts:48 | :49 | REAL | queryBus ArAgingQuery → ar-aging.handler (fi_invoices) | IFRS-9 ECL aging |
| GET /ar/aging | finance-ar.controller.ts:55 | :56 | REAL | svc.getAgingBuckets → repo getArAgingBuckets/Totals | Read |
| GET /ar/overdue | finance-ar.controller.ts:76 | :77 | REAL | svc.getOverdue → repo.getOverdueInvoices | Read |
| POST /ar/aging/recalculate | finance-ar.controller.ts:84 | :85 | REAL | svc.recalculateAging → repo.replaceArAgingBuckets (atomic tx) | Real recompute+write |
| POST /ar/entries | finance-ar.controller.ts:93 | :94 | REAL | svc.createEntry → repo.createArEntry INSERT | Write |
| GET /ap/ecl-aging | apps/api/src/modules/finance/presentation/finance-ap.controller.ts:48 | :49 | REAL | queryBus ApAgingQuery → ap-aging.handler | Read |
| GET /ap/aging | finance-ap.controller.ts:55 | :56 | REAL | svc.getAgingBuckets | Read |
| GET /ap/overdue | finance-ap.controller.ts:76 | :77 | REAL | svc.getOverdue | Read |
| POST /ap/aging/recalculate | finance-ap.controller.ts:84 | :85 | REAL | svc.recalculateAging | Real recompute+write |
| POST /ap/entries | finance-ap.controller.ts:93 | :94 | REAL | svc.createEntry → repo.createApEntry INSERT | Write |
| GET /finance/payments | apps/api/src/modules/finance/presentation/finance-payments.controller.ts:62 | :64 | REAL | queryBus GetPaymentsQuery | Read |
| POST /finance/payments | finance-payments.controller.ts:72 | :75 | 501-STUB | throw NotImplementedException (finance-payments.controller.ts:80) | Deliberate: routes users to POST /finance/payments/record (invoice+GL) |
| PATCH /finance/payments/:id/approve | finance-payments.controller.ts:88 | :90 | REAL | actionsSvc.approvePayment → repo.approvePayment UPDATE | Write |
| POST /finance/payments/record | finance-payments.controller.ts:102 | :105 | REAL | RecordPaymentHandler → recordPayment + updateInvoicePaidAmount + postCustomerPayment → `entries` (record-payment.handler.ts:99) | Overpayment guard, real GL post |
| POST /finance/payments/:paymentId/verify | finance-payments.controller.ts:122 | :125 | REAL | actionsSvc.verifyPayment → status flip + postCustomerPayment → `entries` (finance-actions.service.ts:43) | GL soft-fail logged, not swallowed silently |
| GET /finance/payments/:invoiceId/outstanding | finance-payments.controller.ts:134 | :136 | REAL | rawSql SELECT invoices (finance-payments.controller.ts:138) | Read; try/catch rethrows 500 (not swallowed) |
| POST /finance/payments/:id/approve | finance-payments.controller.ts:157 | :159 | DUPLICATE | Same actionsSvc.approvePayment as PATCH :id/approve | Counterpart: PATCH /finance/payments/:id/approve |
| GET /finance/invoices | apps/api/src/modules/finance/presentation/finance-invoices.controller.ts:57 | :59 | REAL | queryBus GetInvoicesQuery | Read |
| POST /finance/invoices | finance-invoices.controller.ts:71 | :74 | REAL | invoiceRepo.saveInvoice INSERT (finance-invoices.controller.ts:78) | Write (draft) |
| POST /finance/invoices/create | finance-invoices.controller.ts:99 | :102 | DUPLICATE | Same invoiceRepo.saveInvoice as root POST; only DTO schema differs | Counterpart: POST /finance/invoices |
| POST /finance/invoices/:invoiceId/post | finance-invoices.controller.ts:126 | :129 | REAL | gl.postSalesInvoice → `entries` + invoiceRepo.markInvoicePosted (finance-invoices.controller.ts:139) | Idempotent by invoice status; real GL post |
| GET /finance/invoices/:invoiceId | finance-invoices.controller.ts:153 | :155 | REAL | invoiceRepo.findInvoiceById; 404-guarded | Read |
| GET /accounting/dashboard | apps/api/src/modules/finance/presentation/finance-accounting.controller.ts:48 | :49 | DUPLICATE | accountingRepo.getDashboard (drizzle-finance-accounting.repo.ts:33) | Same as /finance/dashboard & /finance/accounting; no FE caller |
| GET /accounting/accounts | finance-accounting.controller.ts:62 | :63 | ORPHAN | findAccounts SELECT accounts (drizzle-finance-accounting.repo.ts:19) | Only e2e hits it; overlaps /finance/gl-accounts |
| GET /accounting/gl-documents | finance-accounting.controller.ts:75 | :76 | REAL | getGlDocumentsFiltered (drizzle-finance-accounting.repo.ts:49-55) | FE GLDocuments.tsx:86 |
| POST /accounting/gl-documents | finance-accounting.controller.ts:90 | :92 | REAL | svc.createGlDocument → glPosting.postJournal → insertJournal → `entries` | Rejects unbalanced (400); real ledger post |
| GET /accounting/periods | finance-accounting.controller.ts:100 | :101 | REAL | getPeriods SELECT accounting_periods (repo:76) | FE PeriodClosing.tsx:74 |
| POST /accounting/periods/:id/close | finance-accounting.controller.ts:109 | :111 | REAL | closePeriod UPDATE accounting_periods (repo:86) | FE PeriodClosing.tsx:99 |
| GET /accounting/materials | finance-accounting.controller.ts:122 | :123 | REAL | getMaterialsFiltered SELECT stock_moves (repo:92) | FE MaterialsAccounting.tsx:58 |
| GET /accounting/materials/by-order | finance-accounting.controller.ts:136 | :137 | REAL | getMaterialsByOrder SELECT stock_moves (repo:102) | FE MaterialsAccounting.tsx:68 |
| GET /accounting/inventory-valuation | finance-accounting.controller.ts:144 | :145 | REAL | getInventoryValuation SELECT raw_materials (repo:110) | FE MaterialsAccounting.tsx:64 |
| GET /finance/advances | apps/api/src/modules/finance/presentation/finance-advance.controller.ts:45 | :47 | ORPHAN | listAdvances SELECT payroll_advances (finance-actions.repository.ts:79) | No FE caller |
| POST /finance/advances/request | finance-advance.controller.ts:59 | :62 | ORPHAN | CheckAdvanceHandler → recordAdvance INSERT payroll_advances (drizzle-finance-ops.repo.ts:51) | REAL write, no FE caller |
| POST /finance/advances/override | finance-advance.controller.ts:72 | :75 | ORPHAN | CheckAdvanceHandler override → INSERT payroll_advances (drizzle-finance-ops.repo.ts:51) | REAL write, no FE caller |
| GET /finance/advances/pending | finance-advance.controller.ts:84 | :86 | ORPHAN | getPendingAdvances SELECT payroll_advances (finance-actions.repository.ts:105) | No FE caller |
| GET /finance/dashboard | apps/api/src/modules/finance/presentation/finance-main.controller.ts:52 | :53 | REAL | accountingRepo.getDashboard (repo:33) | FE FinanceDashboard.tsx:80 |
| GET /finance/gl-entries | finance-main.controller.ts:59 | :60 | ORPHAN | glSvc.findAllDocuments SELECT glDocuments (drizzle-finance-gl.repo.ts:18) | FE uses /accounting/gl-documents |
| GET /finance/gl-accounts | finance-main.controller.ts:66 | :67 | ORPHAN | findAllAccounts SELECT accounts (drizzle-finance-gl.repo.ts:28) | Dup of /finance/accounts; FE uses /gl/accounts |
| GET /finance/exchange-rates | finance-main.controller.ts:73 | :74 | ORPHAN | inline rawSql SELECT exchange_rates (finance-main.controller.ts:76) | try/catch falls back to documented default rates; no FE caller |
| GET /finance/transactions | finance-main.controller.ts:106 | :107 | ORPHAN | cashflowSvc.findTransactions (drizzle-cashflow.repo.ts:18) | Dup of /finance/cash-flow & /cashflow/transactions |
| GET /finance/budget | finance-main.controller.ts:113 | :114 | ORPHAN | budgetsSvc.findAll SELECT budgets (drizzle-finance-budgets.repo.ts:50) | No FE caller |
| GET /finance/cash-flow | finance-main.controller.ts:120 | :121 | DUPLICATE | Identical body to GET /finance/transactions | Counterpart: /finance/transactions |
| GET /finance/reports | finance-main.controller.ts:128 | :130 | 501-STUB | notImplemented() (finance-main.controller.ts:130) | Feature-gated #FX-4, no FE caller |
| GET /finance/accounts | finance-main.controller.ts:135 | :136 | DUPLICATE | Same glSvc.findAllAccounts as /finance/gl-accounts | Counterpart: /finance/gl-accounts |
| GET /finance/expenses | finance-main.controller.ts:142 | :143 | ORPHAN | getExpenseReports SELECT expense_reports (repo:130) | Dup of /finance/expense-reports |
| GET /finance/expense-reports | finance-main.controller.ts:153 | :154 | ORPHAN | getExpenseReports SELECT expense_reports (repo:130) | No FE caller |
| GET /finance/expense-reports/:id | finance-main.controller.ts:165 | :166 | ORPHAN | getExpenseReportById SELECT expense_reports (repo:140) | No FE caller |
| GET /finance/loans | finance-main.controller.ts:174 | :176 | 501-STUB | notImplemented() (finance-main.controller.ts:176) | FE ObligationsTab.tsx:77 CALLS it and receives 501 (loans module not built) |
| GET /finance/accounting | finance-main.controller.ts:181 | :182 | DUPLICATE | Same getDashboard as /finance/dashboard | Counterpart: /finance/dashboard |
| POST /finance/gl-entries | apps/api/src/modules/finance/presentation/finance-main-actions.controller.ts:70 | :72 | GREEN-LIE | glSvc.postDocument INSERT glDocuments header status='posted' (drizzle-finance-gl.repo.ts:42) — does NOT reach `entries`, writes no gl_lines; balance guard `dto.totalDebit!==dto.totalCredit` is a no-op when totals omitted (undefined===undefined) | Claims GL post but only writes a doc header; orphan (no FE). Contrast honest POST /accounting/gl-documents |
| GET /finance/gl-entries/:id/reverse | finance-main-actions.controller.ts:80 | :81 | ORPHAN | inline SELECT entries + gl_documents (finance-main-actions.controller.ts:84) | REAL read; `reversed` flag derived from ANY '[REVERSAL]%' doc in table (misleading); no FE caller |
| POST /finance/gl-entries/:id/reverse | finance-main-actions.controller.ts:106 | :108 | GREEN-LIE | glSvc.postDocument INSERT [REVERSAL]-tagged glDocuments header only; no mirrored journal posted to `entries` (code comment concedes reverseDocument unimplemented) | Returns 200 "reversed" but no accounting reversal occurs; orphan |
| GET /finance/salary-benchmark/:userId | finance-main-actions.controller.ts:123 | :124 | REAL | getSalaryBenchmark aggregate over payroll_period_record (finance-actions.repository.ts:27) | FE FinanceTab.tsx:33; userId param ignored (global market aggregate) and echoed back |
| POST /finance/profitability/recalculate | finance-main-actions.controller.ts:150 | :152 | REAL | inline UPDATE order_costings (finance-main-actions.controller.ts:156) | FE ProductProfitability.tsx:37. CATCH-SWALLOW: on DB error returns HTTP 202 `{status:'error'}` instead of 5xx (:184) — happy path is a real write |
| POST /finance/ap/entries | finance-main-actions.controller.ts:194 | :196 | ORPHAN | createApEntry INSERT finance_invoices type='purchase' (finance-actions.repository.ts:132) | REAL write, no FE caller |
| POST /finance/ar/entries | finance-main-actions.controller.ts:206 | :208 | ORPHAN | createArEntry INSERT finance_invoices type='sales' (finance-actions.repository.ts:162) | REAL write, no FE caller |
| GET /finance/budgets | apps/api/src/modules/finance/presentation/finance-budgets.controller.ts:54 | :56 | ORPHAN | findBudgets SELECT budgets (drizzle-finance-budgets.repo.ts:153) | Dup of GET /budgets; FE uses standalone |
| GET /finance/budgets/stats | finance-budgets.controller.ts:64 | :66 | ORPHAN | getBudgetStats SELECT budgets (repo:219) | Only e2e |
| GET /finance/budgets/:id | finance-budgets.controller.ts:76 | :78 | ORPHAN | GetBudgetByIdHandler SELECT budgets (get-budget-by-id.handler.ts:25) | No FE caller |
| GET /finance/budgets/:id/variance | finance-budgets.controller.ts:88 | :90 | ORPHAN | findBudgetById SELECT budgets+budget_lines (repo:142) | No FE caller |
| POST /finance/budgets | finance-budgets.controller.ts:99 | :101 | ORPHAN | saveBudget tx INSERT budgets+budget_lines (repo:169) | REAL write; FE uses POST /budgets |
| PATCH /finance/budgets/:id/submit | finance-budgets.controller.ts:128 | :130 | ORPHAN | updateBudgetStatus UPDATE budgets (repo:183) | REAL write, no FE caller |
| PATCH /finance/budgets/:id/approve | finance-budgets.controller.ts:147 | :149 | ORPHAN | updateBudgetStatus UPDATE budgets (repo:183) | REAL write, no FE caller |
| GET /budgets | apps/api/src/modules/finance/presentation/budgets-standalone.controller.ts:36 | :37 | REAL | svc.findAll SELECT budgets (repo:50) | FE BudgetManagement.tsx:93 |
| POST /budgets | budgets-standalone.controller.ts:44 | :45 | REAL | svc.create INSERT budgets (repo:70) | FE BudgetManagement.tsx:127 |
| GET /budgets/:id/lines | budgets-standalone.controller.ts:53 | :54 | REAL | findBudgetLines SELECT budget_lines (repo:117) | FE BudgetManagement |
| POST /budgets/:id/lines | budgets-standalone.controller.ts:62 | :63 | REAL | createBudgetLine INSERT budget_lines (repo:127) | FE BudgetManagement.tsx:141 |
| GET /cashflow/transactions | apps/api/src/modules/finance/presentation/cashflow.controller.ts:27 | :28 | REAL | findTransactions SELECT cashFlowTransactions (drizzle-cashflow.repo.ts:18) | FE CashFlowManagement.tsx:62 |
| POST /cashflow/transactions | cashflow.controller.ts:35 | :36 | REAL | createTransaction INSERT cashFlowTransactions (repo:28) | FE CashFlowManagement.tsx:83 |
| GET /cashflow/daily-summary | cashflow.controller.ts:43 | :44 | REAL | findDailySummary SUM cashFlowTransactions (repo:35) | FE CashFlowManagement.tsx:68 |
| GET /cashflow/forecast | cashflow.controller.ts:50 | :51 | REAL | findForecast GROUP BY cashFlowTransactions (repo:58) | FE CashFlowManagement.tsx:72 |
| POST /finance/cfo-config | apps/api/src/modules/finance/presentation/finance-cfo-config.controller.ts:39 | :41 | ORPHAN | update → upsertCfoConfig INSERT..onConflictDoUpdate cfo_config (drizzle-finance-cfo.repo.ts:87) | REAL upsert; FE uses GET+PUT only |
| GET /finance/cfo-config | finance-cfo-config.controller.ts:52 | :54 | REAL | findAllCfoConfig SELECT cfo_config (repo:64) | FE ArApAging.tsx:99, CfoConfigSettings.tsx:43 |
| PUT /finance/cfo-config/:key | finance-cfo-config.controller.ts:62 | :64 | REAL | update → upsertCfoConfig cfo_config (repo:87) | FE ArApAging.tsx:104 |
| GET /finance/break-even | apps/api/src/modules/finance/presentation/finance-break-even.controller.ts:40 | :42 | REAL | svc → repo.fetchBreakEvenInputs SELECT cost_structure (drizzle-finance-planning.repo.ts:38) | FE FinanceBreakEven.tsx:83 |
| POST /finance/break-even/cost-structure | finance-break-even.controller.ts:56 | :58 | REAL | INSERT cost_structure ON CONFLICT (planning.repo.ts:76) | FE FinanceBreakEven.tsx:90 |
| GET /finance/cashflow/forecast | apps/api/src/modules/finance/presentation/finance-cashflow-forecast.controller.ts:27 | :29 | REAL | fetchCashflowWeek SELECT fi_invoices/sales_orders/payroll_entries (planning.repo.ts:91) | FE CFODashboard.tsx:97 |
| GET /finance/ratios | apps/api/src/modules/finance/presentation/finance-ratios.controller.ts:27 | :29 | REAL | fetchFinancialRatiosGl SELECT entries/accounts + snapshot write (planning.repo.ts:147) | FE CFODashboard.tsx:90 |
| GET /finance/standard-cost/:productId | apps/api/src/modules/finance/presentation/finance-standard-cost.controller.ts:37 | :39 | ORPHAN | SELECT standard_cost (drizzle-finance-costing.repo.ts:71) | REAL, no FE caller |
| GET /finance/standard-cost/name/:productName | finance-standard-cost.controller.ts:54 | :56 | ORPHAN | findStandardCostByName (costing.repo.ts:56) | REAL, no FE caller |
| GET /finance/standard-cost/name/:productName/periods | finance-standard-cost.controller.ts:67 | :69 | ORPHAN | listStandardCosts (costing.repo.ts:85) | REAL, no FE caller |
| POST /finance/standard-cost/name/:productName/calculate | finance-standard-cost.controller.ts:76 | :78 | ORPHAN | INSERT standard_cost ON CONFLICT (costing.repo.ts:131) | REAL write, no FE caller |
| GET /finance/variance/:orderId | apps/api/src/modules/finance/presentation/finance-variance.controller.ts:32 | :34 | REAL | drizzle-finance-variance.repo.ts:30 SELECT + report write :135 | FE FinanceVariance.tsx:96 |
| GET /finance-extended/finance-categories | apps/api/src/modules/finance/presentation/finance-extended.controller.ts:38 | :39 | REAL | repo.ts:23 db.select financeCategories | FE useIncomeExpense.ts:55 |
| GET /finance-extended/finance-categories/:id | finance-extended.controller.ts:46 | :47 | REAL | repo.ts:33 db.select where id | Group wired |
| POST /finance-extended/finance-categories | finance-extended.controller.ts:54 | :55 | REAL | repo.ts:40 db.insert(financeCategories) | FE useIncomeExpense.ts:109 |
| PUT /finance-extended/finance-categories/:id | finance-extended.controller.ts:64 | :65 | REAL | repo.ts:47 db.update | Write |
| PATCH /finance-extended/finance-categories/:id | finance-extended.controller.ts:74 | :75 | DUPLICATE | Same svc.updateCategory → repo.ts:47 as PUT | Counterpart: PUT /finance-extended/finance-categories/:id |
| DELETE /finance-extended/finance-categories/:id | finance-extended.controller.ts:84 | :85 | REAL | repo.ts:54 db.delete | FE useIncomeExpense.ts:138 |
| GET /finance-extended/income-expense/summary | apps/api/src/modules/finance/presentation/finance-extended-income.controller.ts:32 | :33 | REAL | repo.ts:71 runQuery aggregate income_expense_transactions | FE useIncomeExpense.ts:46 |
| GET /finance-extended/income-expense | finance-extended-income.controller.ts:39 | :40 | REAL | repo.ts:61 db.select incomeExpenseTransactions | FE useIncomeExpense.ts:61 |
| POST /finance-extended/income-expense | finance-extended-income.controller.ts:47 | :48 | REAL | repo.ts:107 INSERT income_expense_transactions | FE useIncomeExpense.ts:85 |
| PUT /finance-extended/income-expense/:id | finance-extended-income.controller.ts:57 | :58 | REAL | repo.ts:133 db.update | Write |
| DELETE /finance-extended/income-expense/:id | finance-extended-income.controller.ts:67 | :68 | REAL | repo.ts:140 db.delete | Write |
| GET /finance-extended/inventory-counts | finance-extended-income.controller.ts:74 | :75 | REAL | repo.ts:147 db.select inventoryCounts | FE useInventoryValuationMutations.ts:30 |
| POST /finance-extended/inventory-counts | finance-extended-income.controller.ts:82 | :84 | REAL | repo.ts:157 INSERT inventory_counts | FE useInventoryValuationMutations.ts:28 |
| GET /finance-extended/asset-inventory | finance-extended-income.controller.ts:91 | :92 | REAL | repo.ts:174 SELECT asset_items | FE useInventoryValuationMutations.ts:49 |
| POST /finance-extended/asset-inventory | finance-extended-income.controller.ts:99 | :101 | REAL | repo.ts:192 INSERT asset_items | FE useInventoryValuationMutations.ts:47 |
| GET /finance-extended/asset-inventory/summary | finance-extended-income.controller.ts:108 | :109 | REAL | repo.ts:268 aggregate asset_items | FE invalidates key |
| GET /finance-extended/asset-inventory/:id | finance-extended-income.controller.ts:116 | :117 | REAL | repo.ts:210 SELECT asset_items by id | Group wired |
| GET /finance-extended/daily-metrics | finance-extended-income.controller.ts:123 | :124 | REAL | repo.ts:223 employee_daily_reports | FE DailyKPIDashboard.tsx:38 |
| GET /finance-extended/daily-metrics/today | finance-extended-income.controller.ts:130 | :131 | REAL | repo.ts:223 (date=today) | FE DailyKPIDashboard.tsx:37 |
| GET /finance-extended/overtime | finance-extended-income.controller.ts:137 | :138 | ORPHAN | repo.ts:238 attendance JOIN employees | FE uses /api/hr/payroll/overtime |
| GET /finance-extended/customs | finance-extended-income.controller.ts:144 | :145 | ORPHAN | repo.ts:255 customs_declarations | No FE caller |
| GET /finance-extended/insurance | finance-extended-income.controller.ts:151 | :152 | ORPHAN | repo.ts:291 employee_benefits | FE uses /api/asset-management/insurance |
| GET /finance-extended/ai-finance-insights | finance-extended-income.controller.ts:158 | :159 | GREEN-LIE | returns hardcoded `{ insights: [], generatedAt: now }` — no service, no DB (controller:160) | Claims AI finance insights, performs nothing; no FE caller |
| GET /financial-reports/kassa | apps/api/src/modules/finance/financial-reports/presentation/financial-reports.controller.ts:42 | :43 | ORPHAN | financial-reports-query.service.ts:40 queryCashSummary (real SQL) | FE uses /api/reports/*; served by cron server-side |
| GET /financial-reports/ombor | financial-reports.controller.ts:49 | :50 | ORPHAN | query.service.ts:46 queryWarehouseBalance | No FE caller |
| GET /financial-reports/debitorlar | financial-reports.controller.ts:56 | :57 | ORPHAN | query.service.ts:54 queryReceivables | No FE caller |
| GET /financial-reports/kreditorlar | financial-reports.controller.ts:63 | :64 | ORPHAN | query.service.ts:60 queryPayables | No FE caller |
| GET /financial-reports/balans | financial-reports.controller.ts:70 | :71 | ORPHAN | query.service.ts:66 queryBalanceSheet | No FE caller |
| GET /financial-reports/ishlab-chiqarish | financial-reports.controller.ts:77 | :78 | ORPHAN | query.service.ts:72 queryProductionMetrics | No FE caller |
| GET /financial-reports/analytics | financial-reports.controller.ts:86 | :87 | ORPHAN | query.service reads DB + analytics.service math (controller:89-118) | REAL data, no FE caller; `ccc` hardcoded null |
| GET /financial-reports/dashboard | financial-reports.controller.ts:127 | :128 | ORPHAN | query.service.ts:99 getDashboard (Promise.allSettled real queries) | No FE caller |
| GET /financial-reports/alerts/overstock | financial-reports.controller.ts:136 | :137 | ORPHAN | query.service.ts:77 queryOverstockAlerts (CTE SQL) | No FE caller |
| GET /financial-reports/alerts/overdue-debts | financial-reports.controller.ts:143 | :144 | ORPHAN | query.service.ts:85 queryOverdueDebtAlerts | No FE caller |
| POST /financial-reports/alerts/send-report | financial-reports.controller.ts:151 | :153 | ORPHAN | dispatches real dailyCron.dailyReport() (controller:156) | REAL work, no FE caller; fire-and-forget `.catch()` swallow returns `sent:true` before completion |
| GET /api/order-costing/top-profitable | apps/api/src/modules/finance/presentation/order-costing.controller.ts:27 | :28 | REAL | repo.findTopProfitable db.select orderCostings (drizzle-order-costing.repo.ts:46) | FE OrderCosting.tsx:45 |
| GET /api/order-costing/top-loss | order-costing.controller.ts:34 | :35 | REAL | repo.findTopLoss (repo:57) | FE OrderCosting.tsx:49 |
| GET /api/order-costing | order-costing.controller.ts:41 | :42 | REAL | repo.findAll (repo:21-23) | FE OrderCosting.tsx:32 |
| POST /api/order-costing | order-costing.controller.ts:49 | :50 | REAL | repo.create db.insert(orderCostings) (repo:39) | FE OrderCosting.tsx:68 |
| POST /api/order-costing/:id/calculate | order-costing.controller.ts:59 | :60 | REAL | repo.calculate db.update(orderCostings) (repo:74) | FE OrderCostingDetail.tsx:28 |
| POST /api/pricing/calculate | apps/api/src/modules/finance/presentation/pricing.controller.ts:45 | :47 | REAL | repo.findPriceTierForQty SELECT price_tier (drizzle-finance-costing.repo.ts:206) | FE PricingTiers.tsx:77 |
| GET /api/pricing/tiers/:productName | pricing.controller.ts:55 | :57 | REAL | repo.listPriceTiers (costing.repo.ts:224) | FE PricingTiers.tsx:66 |
| POST /api/pricing/tiers | pricing.controller.ts:64 | :66 | REAL | repo.upsertPriceTier INSERT price_tier (costing.repo.ts:236) | FE PricingTiers.tsx:91 |
| GET /api/sales-orders | apps/api/src/modules/finance/presentation/sales-orders-standalone.controller.ts:26 | :27 | REAL | repo.findAll db.select salesOrders (drizzle-sales-orders-fi.repo.ts:19) | FE OrderCosting.tsx:41; reads canonical salesOrders |
| GET /api/fi/accounting-periods | apps/api/src/modules/finance/presentation/fi.controller.ts:58 | :59 | ORPHAN | repo.findAccountingPeriods db.select accountingPeriods (drizzle-fi.repo.ts:22) | FE only POSTs to it |
| POST /api/fi/accounting-periods | fi.controller.ts:66 | :67 | REAL | repo.createAccountingPeriod db.insert (drizzle-fi.repo.ts:31) | FE PeriodClosing.tsx:80 |
| POST /api/fi/accounting-periods/:id/close | fi.controller.ts:76 | :77 | ORPHAN | repo.closeAccountingPeriod db.update status='closed' (drizzle-fi.repo.ts:38) | FE closes via /api/accounting/periods/:id/close instead |
| POST /api/fi/gl-documents/:id/post | fi.controller.ts:85 | :86 | REAL | repo.postGlDocument db.update glDocuments status='posted' (drizzle-fi.repo.ts:48) | FE GLDocuments.tsx:104 |
| GET /api/fi/payments | fi.controller.ts:92 | :93 | REAL | repo.findPayments db.select payments (drizzle-fi.repo.ts:58) | FE FinanceExtended.tsx:103 |
| POST /api/fi/payments | fi.controller.ts:100 | :101 | REAL | repo.createPayment db.insert payments (drizzle-fi.repo.ts:68) | FE FinanceExtended.tsx:130 |
| GET /api/fi/cost-centers | fi.controller.ts:109 | :110 | REAL | repo.getCostCenters db.select cost_centers (drizzle-fi.repo.ts:75) | FE BudgetManagement.tsx:112; hardcoded 4-item fallback only when table empty/errors |
| POST /api/fi/cost-centers | fi.controller.ts:118 | :120 | REAL | repo.createCostCenter db.insert (drizzle-fi.repo.ts:88) | FE FinanceExtended.tsx:118 |
| PATCH /api/fi/cost-centers/:id | fi.controller.ts:129 | :130 | ORPHAN | repo.updateCostCenter db.update (drizzle-fi.repo.ts:95) | No FE caller |
| DELETE /api/fi/cost-centers/:id | fi.controller.ts:143 | :144 | ORPHAN | repo.deleteCostCenter db.delete (drizzle-fi.repo.ts:102) | No FE caller |
| GET /api/fi/stats | fi.controller.ts:151 | :152 | REAL | repo.getStats SUM income_expense_transactions (drizzle-fi.repo.ts:110) | FE FinanceExtended.tsx:99 |
| GET /api/fi/recent-transactions | fi.controller.ts:159 | :160 | ORPHAN | repo.getRecentTransactions (drizzle-fi.repo.ts:134) | No FE caller |
| GET /api/fi/gl-documents | fi.controller.ts:167 | :168 | REAL | repo.findGlDocuments db.select glDocuments (drizzle-fi.repo.ts:143) | FE FinanceExtended.tsx:94 |
| POST /api/fi/gl-documents | fi.controller.ts:176 | :178 | REAL | createGlDoc validates ΣDr==ΣCr then GlPostingService.postJournal → `entries` (gl-posting.service.ts:198) | Honest 400 on unbalanced; FE GLDocuments.tsx:91 |
| GET /api/fi/profit-centers | fi.controller.ts:186 | :187 | REAL | repo.findProfitCenters db.select profit_centers (drizzle-fi.repo.ts:153) | FE FinanceExtended.tsx:89 |
| POST /api/fi/profit-centers | fi.controller.ts:195 | :197 | REAL | repo.createProfitCenter db.insert (drizzle-fi.repo.ts:160) | FE FinanceExtended.tsx:142 |
| PATCH /api/fi/profit-centers/:id | fi.controller.ts:206 | :207 | ORPHAN | repo.updateProfitCenter db.update (drizzle-fi.repo.ts:167) | No FE caller |
| DELETE /api/fi/profit-centers/:id | fi.controller.ts:220 | :221 | ORPHAN | repo.deleteProfitCenter db.delete (drizzle-fi.repo.ts:173) | No FE caller |
| GET /api/fi/tax-summary | fi.controller.ts:228 | :229 | REAL | repo.getTaxSummary raw SQL aggregate fi_invoices (drizzle-fi.repo.ts:183) | FE FinanceExtended.tsx:112 |
| GET /api/finance/reports-hub | apps/api/src/modules/finance/presentation/reports-hub.controller.ts:33 | :34 | ORPHAN | repo.getSummary count/FILTER invoices/payments/budgets/gl_entries (drizzle-reports-hub.repo.ts:17) | FE uses canonical /api/reports-hub/* (remaining module) |
| GET /api/reports/trial-balance | apps/api/src/modules/finance/presentation/reports.controller.ts:34 | :35 | REAL | repo.findTrialBalance JOIN accounts⋈entries (drizzle-reports.repo.ts:21) | FE FinanceDashboard.tsx:97 |
| GET /api/reports/profit-loss | reports.controller.ts:41 | :42 | REAL | repo.findProfitLoss over entries⋈accounts (drizzle-reports.repo.ts:49) | FE FinanceDashboard.tsx:101 |
| GET /api/reports/weekly-summary/current-week | reports.controller.ts:48 | :49 | ORPHAN | repo.findWeeklySummary dailyFinancialMetrics (drizzle-reports.repo.ts:85) | FE uses /api/reports/weekly-summary |
| GET /api/reports/weekly-summary | reports.controller.ts:55 | :56 | REAL | repo.findWeeklySummary (drizzle-reports.repo.ts:85) | FE FinancialReports.tsx:45 |
| GET /api/reports/monthly-summary | reports.controller.ts:62 | :63 | REAL | repo.findMonthlySummary (drizzle-reports.repo.ts:101) | FE FinancialReports.tsx:49 |
| GET /api/reports/kpi-dashboard | reports.controller.ts:69 | :70 | REAL | repo.findKpiDashboard db.select financialKPIs (drizzle-reports.repo.ts:117) | FE FinancialReports.tsx:53 |
| GET /api/reports/production-efficiency | reports.controller.ts:76 | :77 | REAL | inline raw SQL aggregate oee_records (reports.controller.ts:86-104) | FE FinancialReports.tsx:57 |
| POST /api/reports/profitability/export | reports.controller.ts:117 | :119 | REAL | inline raw SQL SELECT order_costings (reports.controller.ts:135) | FE ProductProfitability.tsx:47. CATCH-SWALLOW: DB error → HTTP 202 `{data:[],error}` not 5xx; returns JSON not a file |
| GET /api/payroll/by-department | apps/api/src/modules/finance/presentation/finance-payroll.controller.ts:29 | finance-payroll.service.ts:14 | ORPHAN | SELECT payroll_rows⋈users⋈departments (finance-payroll.repository.ts:19) | No FE caller |
| GET /api/payroll/by-brigade | finance-payroll.controller.ts:36 | finance-payroll.service.ts:20 | ORPHAN | SELECT payroll_rows GROUP BY shift (finance-payroll.repository.ts:36) | No FE caller |
| GET /api/payroll/tax-summary | finance-payroll.controller.ts:43 | finance-payroll.service.ts:26 | ORPHAN | SELECT SUM payroll_rows (finance-payroll.repository.ts:54) | FE calls /api/fi/tax-summary instead |
| GET /api/payroll/periods | apps/api/src/modules/finance/presentation/payroll-periods.controller.ts:29 | payroll/payroll.service.ts:26 | REAL | SELECT payrollPeriods (payroll/drizzle-finance-payroll.repo.ts:17) | FE FinanceDashboard.tsx |
| POST /api/payroll/periods | payroll-periods.controller.ts:37 | payroll.service.ts:47 | REAL | INSERT payrollPeriods (drizzle-finance-payroll.repo.ts:41) | FE caller present |
| POST /api/payroll/periods/:id/calculate | payroll-periods.controller.ts:47 | payroll.service.ts:65 | REAL | UPDATE payrollPeriods status='calculated' (drizzle-finance-payroll.repo.ts:49) | FE caller present |
| POST /api/payroll/periods/:id/close | payroll-periods.controller.ts:56 | payroll.service.ts:61 → hr/payroll/payroll.service.ts:144 | REAL | HR closePeriod → gl.postJournal → insertJournal → `entries`; markPeriodClosed only AFTER GL succeeds | Genuine close, posts balanced GL; not a green-lie |
| POST /api/payroll/calculate-tax | payroll-periods.controller.ts:64 | :65 | REAL | Pure calc: 12% tax / 8% pension from body.grossSalary; no DB | Stateless calculator, no persistence claimed; rates hardcoded inline |
| POST /api/finance-extended/payroll/calculate | apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts:36 | finance-extended-payroll.service.ts:220 | REAL | INSERT payrollCalculations (service:213 insertCalc) | FE CalculatePayrollDialog.tsx |
| POST /api/finance-extended/payroll/ai-calculate | finance-extended-payroll.controller.ts:45 | finance-extended-payroll.service.ts:254 | REAL | INSERT payrollCalculations; real attendance rows (service:316) | FE AIPayrollDialog.tsx; persisted, not mock |
| POST /api/finance-extended/payroll/run | finance-extended-payroll.controller.ts:54 | finance-extended-payroll.service.ts:419 | REAL | Batch INSERT payrollCalculations per contract (service:449→213) | FE PayrollAutomation.tsx; idempotent by notes=period |
| GET /api/finance-extended/payroll-calculations | finance-extended-payroll.controller.ts:63 | finance-extended-payroll.service.ts:165 | REAL | SELECT payrollCalculations (service:167) | FE CalculationsTab.tsx |
| PATCH /api/finance-extended/payroll-calculations/:id/approve | finance-extended-payroll.controller.ts:70 | finance-extended-payroll.service.ts:392 | REAL | UPDATE payrollCalculations status='approved' (service:400) | FE CalculationsTab.tsx |
| POST /api/finance-extended/payroll-calculations/:id/approve | finance-extended-payroll.controller.ts:79 | finance-extended-payroll.service.ts:392 | DUPLICATE | Same approveCalculation as PATCH variant ("POST mirror") | Counterpart: PATCH .../:id/approve |
| GET /api/finance-extended/payroll-contracts | finance-extended-payroll.controller.ts:88 | finance-extended-payroll.service.ts:155 | REAL | SELECT payrollContracts (service:157) | FE ContractsTab.tsx |
| POST /api/finance-extended/payroll-contracts | finance-extended-payroll.controller.ts:95 | finance-extended-payroll.service.ts:115 | REAL | INSERT payrollContracts (service:129) | FE ContractsTab.tsx |
| GET /api/finance-extended/tax-calendar | finance-extended-payroll.controller.ts:104 | :106 | REAL | inline db.execute SELECT payroll_tax_rules (controller:106) | Raw SQL in controller (Rule 6 smell) but real read; FE FinanceExtended.tsx |
| GET /api/finance-extended/salary-benchmark/:id | finance-extended-payroll.controller.ts:119 | :122 | ORPHAN | inline db.execute SELECT salary_bands (controller:122) | URL drift: FE calls /api/finance/salary-benchmark/:id; this route unreachable from FE |
| POST /api/finance/cashier/shifts/open | apps/api/src/modules/finance/cashier-hub/cashier-hub.controller.ts:35 | cashier-hub.service.ts:82 | REAL | INSERT cashierShifts (cashier-hub/drizzle-cashier-hub.repo.ts:124); one-open-per-cashier guard | FE CashierHub.tsx:337 |
| POST /api/finance/cashier/shifts/:id/close | cashier-hub.controller.ts:48 | cashier-hub.service.ts:104 | REAL | UPDATE cashierShifts close+variance (drizzle-cashier-hub.repo.ts:147); expected=opening+ΣcashIn−ΣcashOut | Real X/Z reconciliation; FE CashierHub.tsx:349 |
| POST /api/finance/cashier/shifts/:id/movements | cashier-hub.controller.ts:57 | cashier-hub.service.ts:319 | REAL | postGl → gl.postJournal → `entries`; THEN INSERT cashierMovements w/ gl_entry_id (drizzle-cashier-hub.repo.ts:228) | PIN-gated cash-out, idempotent; FE CashierHub.tsx:367 |
| GET /api/finance/cashier/shifts | cashier-hub.controller.ts:70 | cashier-hub.service.ts:147 | REAL | repo.listShifts paginated SELECT cashierShifts | FE CashierHub.tsx:206 |
| GET /api/finance/cashier/shifts/current | cashier-hub.controller.ts:79 | cashier-hub.service.ts:160 | ORPHAN | repo.findOpenShiftByCashier SELECT cashierShifts | REAL, FE derives open shift from list |
| GET /api/finance/cashier/shifts/:id/ledger | cashier-hub.controller.ts:90 | cashier-hub.service.ts:202 | REAL | repo.listMovements SELECT cashier_movements + running balance; USD→UZS | FE CashierHub.tsx:242 |
| GET /api/finance/cashier/shifts/:id/pdf | cashier-hub.controller.ts:99 | cashier-hub.service.ts:272 | REAL | reads shift+movements, Z-report PDF (cashier-hub-pdf.service) | FE CashierHub.tsx:384 |
| GET /api/finance/cashier/shifts/:id | cashier-hub.controller.ts:113 | cashier-hub.service.ts:168 | ORPHAN | repo.findShiftById + getShiftMovementTotals | REAL X-summary read; no direct single-shift GET in FE |
| GET /api/finance/cashier/salary-payouts | apps/api/src/modules/finance/cashier-hub/cashier-payroll.controller.ts:37 | cashier-payroll.service.ts:129 | REAL | repo.listApprovals SELECT approval chains | FE CashierHub.tsx |
| POST /api/finance/cashier/salary-payouts | cashier-payroll.controller.ts:45 | cashier-payroll.service.ts:86 | REAL | repo.createApproval INSERT chain; amount tied to card-salary total | FE CashierHub.tsx |
| POST /api/finance/cashier/salary-payouts/:id/approve | cashier-payroll.controller.ts:54 | cashier-payroll.service.ts:145 | REAL | repo.setApprovalStage UPDATE (service:166); ordered chain | FE CashierHub.tsx |
| POST /api/finance/cashier/salary-payouts/:id/reject | cashier-payroll.controller.ts:67 | cashier-payroll.service.ts:172 | REAL | repo.rejectApproval UPDATE status='rejected' (service:181) | FE CashierHub.tsx |
| POST /api/finance/cashier/salary-payouts/pay | cashier-payroll.controller.ts:81 | cashier-payroll.service.ts:193 | ORPHAN | gated (approved+PIN) → recordMovement (GL Dr6710/Cr5010 → `entries`) + repo.markApprovalPaid:238 | REAL money-out + GL post; NO FE caller — payout unreachable from UI (notable gap) |
| POST /api/finance/cashier/advances | cashier-payroll.controller.ts:94 | cashier-podotchet.service.ts:137 | REAL | recordMovement type='advance' (GL Dr4000/Cr5010 → `entries`) + repo.createDebt:167 | FE CashierHub.tsx |
| GET /api/finance/cashier/advance-reports | cashier-payroll.controller.ts:103 | cashier-podotchet.service.ts:339 | REAL | repo.listAdvanceReports SELECT advance_reports | FE CashierHub.tsx |
| POST /api/finance/cashier/advance-reports | cashier-payroll.controller.ts:113 | cashier-podotchet.service.ts:184 | REAL | repo.createAdvanceReport INSERT pending (service:210) | FE CashierHub.tsx |
| POST /api/finance/cashier/advance-reports/:id/approve | cashier-payroll.controller.ts:121 | cashier-podotchet.service.ts:316 | REAL | repo.approveAdvanceReport UPDATE + repo.clearDebt:330 | FE CashierHub.tsx |
| GET /api/finance/cashier/employees/:id/debt | cashier-payroll.controller.ts:132 | cashier-podotchet.service.ts:354 | REAL | repo.getOpenDebtTotal + listOpenDebts + getDebtTotalAll | FE ObligationsTab.tsx:93 |
| GET /api/cc/verify/:id | apps/api/src/modules/communication-center/presentation/cc-public.controller.ts:54 | :55 | ORPHAN | loadDocRow runQuery SELECT cc_documents (cc-public.controller.ts:74); loadApprovalRows :95 | Public QR-scan verify (external auditors, no ERP login); by-design outside SPA |
| POST /api/cc/ai/start | apps/api/src/modules/communication-center/presentation/cc-ai.controller.ts:49 | :50 | REAL | ai.start → CcAiInterviewService (14 runQuery in cc-ai-interview.service.ts) | FE NewDocumentModal.tsx:83 |
| POST /api/cc/ai/sessions/:id/answer | cc-ai.controller.ts:65 | :66 | REAL | ai.answer → cc-ai-interview.service.ts (persists session) | FE NewDocumentModal.tsx:90 |
| POST /api/cc/ai/sessions/:id/finalize | cc-ai.controller.ts:77 | :78 | REAL | ai.finalize → cc-ai-interview.service.ts (saves draft) | FE NewDocumentModal.tsx:102 |
| GET /api/cc/ai/sessions/:id | cc-ai.controller.ts:92 | :93 | REAL | ai.getSessionState (cc-ai-interview.service.ts:275) | FE NewDocumentModal.tsx:76 |
| GET /api/cc/baskets/stats/kpi | apps/api/src/modules/communication-center/presentation/cc-baskets.controller.ts:54 | :55 | ORPHAN | stats.getKpi → CcStatsService (11 SQL in cc-stats.service.ts) | REAL, no FE caller |
| GET /api/cc/baskets/inbox | cc-baskets.controller.ts:61 | :62 | REAL | svc.listBasket → repo.listBasket (cc-baskets.service.ts:17) | FE CommunicationCenter.tsx:37 |
| GET /api/cc/baskets/pending | cc-baskets.controller.ts:68 | :69 | REAL | svc.listBasket → repo (cc-baskets.service.ts:17) | FE CommunicationCenter.tsx:42 |
| GET /api/cc/baskets/outbox | cc-baskets.controller.ts:75 | :76 | REAL | svc.listBasket → repo (cc-baskets.service.ts:17) | FE CommunicationCenter.tsx:47 |
| GET /api/cc/baskets/summary | cc-baskets.controller.ts:82 | :83 | REAL | svc.summary → repo.summary (cc-baskets.service.ts:22) | FE CommunicationCenter.tsx:31 |
| GET /api/cc/baskets/:id | cc-baskets.controller.ts:90 | :91 | REAL | svc.getOne → repo.getById (cc-baskets.service.ts:32); 404-guarded | FE DocumentDetailModal.tsx:64 |
| POST /api/cc/baskets/:id/move | cc-baskets.controller.ts:106 | :107 | REAL | svc.move → repo.moveBasket (cc-baskets.service.ts:27) | FE BasketColumn.tsx:120 |
| GET /api/cc/documents/:id/pdf | apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts:88 | :90 | REAL | pdfSvc.generate runQuery (cc-pdf.service.ts:82,106) + pdf-lib | FE DocumentDetailModal.tsx:94 |
| GET /api/cc/templates | cc-documents.controller.ts:100 | :101 | REAL | inline runQuery SELECT cc_document_templates (cc-documents.controller.ts:104) | FE NewDocumentModal.tsx:67 |
| GET /api/cc/documents/:id/rejection-reasons | cc-documents.controller.ts:121 | :122 | REAL | inline runQuery SELECT cc_rejection_reasons (cc-documents.controller.ts:125) | FE PinPromptModal.tsx:33 |
| POST /api/cc/pin | cc-documents.controller.ts:140 | :141 | REAL | pin.setPin INSERT..ON CONFLICT (cc-pin.service.ts:38) | FE NewDocumentModal.tsx:120 |
| GET /api/cc/pin/status | cc-documents.controller.ts:151 | :152 | REAL | pin.hasPin SELECT (cc-pin.service.ts:48) | FE NewDocumentModal.tsx:113 |
| POST /api/cc/documents/draft | cc-documents.controller.ts:160 | :161 | ORPHAN | wf.createDraft → CcWorkflowService (cc-workflow.service.ts:51) | REAL; FE creates drafts via AI finalize, not this |
| GET /api/cc/documents/:id | cc-documents.controller.ts:171 | :172 | REAL | baskets.getOne → repo.getById (cc-baskets.service.ts:32) | FE DocumentDetailModal.tsx:70 |
| POST /api/cc/documents/:id/send | cc-documents.controller.ts:179 | :180 | REAL | wf.sendDocument (cc-workflow.service.ts:79) | FE NewDocumentModal.tsx:133 |
| POST /api/cc/documents/:id/approve | cc-documents.controller.ts:191 | :192 | REAL | wf.approve (cc-workflow.service.ts:158) | FE PinPromptModal.tsx:41 |
| POST /api/cc/documents/:id/reject | cc-documents.controller.ts:203 | :204 | REAL | wf.reject (cc-workflow.service.ts:210) | FE PinPromptModal.tsx:41 |
| POST /api/cc/documents/:id/resubmit | cc-documents.controller.ts:215 | :216 | ORPHAN | wf.resubmit (cc-workflow.service.ts:229) | REAL, no FE caller |
| POST /api/cc/documents/:id/cancel | cc-documents.controller.ts:227 | :228 | REAL | wf.cancel (cc-workflow.service.ts:251) | FE PinPromptModal.tsx:41 |
| POST /api/cc/documents/:id/complaint | cc-documents.controller.ts:239 | :240 | ORPHAN | wf.createComplaint (cc-workflow.service.ts:266) | REAL, no FE caller |
| POST /api/cc/documents/:id/print | cc-documents.controller.ts:251 | :252 | REAL | wf.logPrint (cc-workflow.service.ts:274) | FE DocumentDetailModal.tsx:79 |
| POST /api/cc/webhooks/:source | apps/api/src/modules/communication-center/presentation/cc-webhook.controller.ts:56 | :58 | GREEN-LIE | audit "write" is no-op `SELECT 1` (cc-webhook.controller.ts:94-96); then events.emit('cc.spawn') into EventEmitter2 with NO subscriber (listener migrated to CQRS @EventsHandler; EventBridge only bridges CQRS→EE2, never reverse) | HMAC/idempotency real, but returns 202 `{ok,queued}` while the promised draft-spawn never runs; external (no FE) |
| POST /api/cc/notification-prefs | apps/api/src/modules/communication-center/presentation/cc-notification-prefs.controller.ts:37 | :38 | ORPHAN | repo.upsert INSERT..ON CONFLICT (cc-notification-prefs.repo.ts:65) | REAL upsert (prior green-lie fixed); no FE caller; functional dup of PUT |
| GET /api/cc/notification-prefs | cc-notification-prefs.controller.ts:49 | :50 | ORPHAN | repo.getOrDefault SELECT (cc-notification-prefs.repo.ts:52) | REAL, no FE caller |
| PUT /api/cc/notification-prefs | cc-notification-prefs.controller.ts:57 | :58 | DUPLICATE | Same repo.upsert as POST (cc-notification-prefs.repo.ts:65) | Counterpart: POST /api/cc/notification-prefs; also orphan |
| GET /notifications | apps/api/src/modules/notifications/presentation/notifications.controller.ts:54 | get-notifications.handler.ts:22 | ORPHAN | queryBus → notificationRepo.findByUserId (drizzle-notification.repo.ts:49) | REAL read, no FE caller; dup of GET /my |
| GET /notifications/my | notifications.controller.ts:70 | get-notifications.handler.ts:22 | DUPLICATE | Same GetNotificationsQuery as GET / (only default limit differs) | Counterpart: GET /notifications; also orphan |
| GET /notifications/my/unread-count | notifications.controller.ts:87 | drizzle-notification.repo.ts:85 | ORPHAN | notifRepo.findUnreadCount (drizzle-notification.repo.ts:85) | FE uses /api/kanban/notifications/unread-count |
| POST /notifications/my/mark-all-read | notifications.controller.ts:97 | notification-preferences.repository.ts:78 | ORPHAN | prefsSvc.markAllRead → markAllReadByUserId UPDATE notificationsApp (repo:78) | REAL write; dup of PATCH /my/mark-all-read; no FE caller |
| GET /notifications/preferences | notifications.controller.ts:106 | notification-preferences.repository.ts:25 | REAL | prefsSvc.getPreferences → findByUserId (repo:25) | FE NotificationSettings.tsx:53 |
| PUT /notifications/preferences | notifications.controller.ts:116 | notification-preferences.repository.ts:45 | DUPLICATE | Same upsert as PATCH /preferences (repo:45) | Counterpart: PATCH /preferences; FE uses PATCH |
| PATCH /notifications/:id/read | notifications.controller.ts:128 | drizzle-notification.repo.ts:126 | ORPHAN | notifRepo.markAsRead UPDATE..returning (drizzle-notification.repo.ts:126) | REAL write; FE /read callers use /api/pos, /api/design, /api/kanban prefixes |
| PATCH /notifications/read-all | notifications.controller.ts:138 | drizzle-notification.repo.ts:145 | ORPHAN | notifRepo.markAllAsRead UPDATE (drizzle-notification.repo.ts:145) — real write BUT returns hardcoded updated:0 (repo:152 `return Ok(0)`, no .returning()) | Write real; reported count is a lie; no FE caller (FE uses /api/pos/notifications/read-all) |
| PATCH /notifications/my/mark-all-read | notifications.controller.ts:149 | notification-preferences.repository.ts:78 | DUPLICATE | Same markAllReadByUserId as POST /my/mark-all-read | Counterpart: POST /my/mark-all-read; also orphan |
| PATCH /notifications/preferences | notifications.controller.ts:159 | notification-preferences.repository.ts:45 | REAL | prefsSvc.updatePreferences → upsert (repo:45) | FE NotificationSettings.tsx:64 |
| POST /notifications | notifications.controller.ts:170 | create-notification.handler.ts:35 | ORPHAN | commandBus → notificationRepo.save INSERT..returning (drizzle-notification.repo.ts:98) | REAL insert (+catch-swallowed telegram/email/sms delivery side-channels); no FE caller |
| GET /notification-schedules | apps/api/src/modules/notifications/presentation/notification-schedules.controller.ts:61 | notification-schedules.repository.ts:63 | ORPHAN | repo.list SELECT (notification-schedules.repository.ts:63) | REAL admin CRUD, no FE caller; consumed by crons |
| POST /notification-schedules | notification-schedules.controller.ts:69 | notification-schedules.repository.ts:78 | ORPHAN | repo.create INSERT..RETURNING (repo:78) | REAL, Zod-validated, no FE caller |
| PATCH /notification-schedules/:id | notification-schedules.controller.ts:78 | notification-schedules.repository.ts:99 | ORPHAN | repo.update UPDATE..COALESCE (repo:99) | REAL, 404 on missing, no FE caller |
| DELETE /notification-schedules/:id | notification-schedules.controller.ts:87 | notification-schedules.repository.ts:123 | ORPHAN | repo.remove DELETE..RETURNING (repo:123) | REAL, 404 on missing, no FE caller |
| GET /notification-routing-rules | apps/api/src/modules/notifications/presentation/notification-routing.controller.ts:48 | notification-routing.repository.ts:52 | ORPHAN | repo.list SELECT (notification-routing.repository.ts:52) | REAL, no FE caller |
| POST /notification-routing-rules | notification-routing.controller.ts:56 | notification-routing.repository.ts:65 | ORPHAN | repo.create INSERT..RETURNING (repo:65) | REAL, Zod-validated, no FE caller |
| PATCH /notification-routing-rules/:id | notification-routing.controller.ts:64 | notification-routing.repository.ts:80 | ORPHAN | repo.update UPDATE..COALESCE (repo:80) | REAL, 404 on missing, no FE caller |
| DELETE /notification-routing-rules/:id | notification-routing.controller.ts:74 | notification-routing.repository.ts:99 | ORPHAN | repo.remove DELETE..RETURNING (repo:99) | REAL, 404 on missing, no FE caller |

### Top risks (GREEN-LIE / catch-swallow / 501 on real paths)
- **GREEN-LIE** POST /finance/gl-entries (finance-main-actions.controller.ts:72) — inserts a `gl_documents` header status='posted' but NEVER posts to the canonical `entries` ledger and writes no gl_lines; the debit==credit balance guard is a no-op when totals are omitted. The honest counterpart is POST /accounting/gl-documents (real `entries` post).
- **GREEN-LIE** POST /finance/gl-entries/:id/reverse (finance-main-actions.controller.ts:108) — a "reversal" only inserts a `[REVERSAL]`-tagged `gl_documents` header; no mirrored journal is posted to `entries` (code comment concedes reverseDocument is unimplemented).
- **GREEN-LIE** POST /api/cc/webhooks/:source (cc-webhook.controller.ts:58) — after valid HMAC returns 202 `{ok,queued}`, but the audit write is a literal `SELECT 1` and the `events.emit('cc.spawn')` has no subscriber (listener moved to CQRS; bridge is one-way), so the claimed draft-spawn silently never runs.
- **GREEN-LIE** GET /finance-extended/ai-finance-insights (finance-extended-income.controller.ts:159) — returns hardcoded `{ insights: [] }`; no service, no DB, no AI.
- **catch-swallow-return-success** POST /finance/profitability/recalculate (finance-main-actions.controller.ts:184) and POST /api/reports/profitability/export (reports.controller.ts:149) — both do a real DB op on the happy path but on DB error return HTTP 202 with `{status/error}` instead of a 5xx, masking failure as success.
- **write-real/count-lie** PATCH /notifications/read-all (drizzle-notification.repo.ts:152) — performs the UPDATE but always returns `{updated:0}` (repo hardcodes `Ok(0)`, no `.returning()`).
- **501 hit by FE** GET /finance/loans (finance-main.controller.ts:176) — FE ObligationsTab.tsx:77 calls it and receives 501 (loans module not built).
- **Unreachable payout** POST /api/finance/cashier/salary-payouts/pay — REAL cash-out + GL post to `entries`, but no FE caller, so the approval chain never disburses from the UI.

COUNTS: REAL=152 501-STUB=3 404-DEAD=0 GREEN-LIE=4 MOCK=0 DUPLICATE=12 ORPHAN=80 UNVERIFIED=0 TOTAL=251


---

## WMS + MM

Scope: every `@Get/@Post/@Put/@Patch/@Delete` in `modules/wms/presentation/*.controller.ts` (28 controllers) and `modules/mm/presentation/*.controller.ts` (8 controllers). Total 265 routes.

High-risk stock/goods write paths were deep-traced to DB:
- WMS goods-issue → `GoodsIssueHandler.issueInTx` runs FIFO/FEFO `batch_lots` decrement + `issueFromWarehouseStock` (canonical `warehouse_stock`) + `wms_transactions` OUT ledger, all in one tx (goods-issue.handler.ts:107-262). REAL.
- WMS goods-receipt complete → `quarantineGate.releaseToMain` (QC_PASS-gated MAIN post) (wms-warehouse-gateway.service.ts:89-94). REAL.
- MM `POST /mm/goods-receipts/:id/post` → `execPostGoodsReceiptStock` real UPSERT into `warehouse_stock` (queries-mm-goods.ts:114-131). REAL, idempotent (already-received not double-posted).
- WMS stock CRUD → `WmsCrudRepository` real Drizzle/SQL UPDATE...RETURNING (wms-crud.repository.ts). Note drift: patch/softDelete target `wms_stock` (schema-compat-5) while getStockById/list read `warehouse_stock` — two different stock tables in one controller.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /api/wms/stock | wms-stock.controller.ts:33 | :55 | REAL | queryBus GetStockInventoryQuery | |
| GET /api/wms/stock/:id | wms-stock.controller.ts:33 | :67 | REAL | crudSvc.getStockById → warehouse_stock SELECT (wms-crud.repository.ts:185) | |
| GET /api/wms/stock/fefo/:materialId/:warehouseId | wms-stock.controller.ts:33 | :79 | REAL | queryBus FefoStockQuery | |
| POST /api/wms/stock/reserve | wms-stock.controller.ts:33 | :93 | REAL | ReserveMaterialCommand | |
| PATCH /api/wms/stock/:id | wms-stock.controller.ts:33 | :114 | REAL | crudSvc.patchStock → UPDATE wms_stock (wms-crud.repository.ts:120) | Writes wms_stock, not warehouse_stock (table drift) |
| DELETE /api/wms/stock/:id | wms-stock.controller.ts:33 | :127 | REAL | crudSvc.softDeleteStock UPDATE wms_stock (wms-crud.repository.ts:106) | |
| GET /api/wms/goods-issue | wms-goods-issue.controller.ts:45 | :60 | REAL | crudSvc.listGoodsIssues SELECT wms_goods_issues (wms-crud.repository.ts:158) | |
| GET /api/wms/goods-issue/:id | wms-goods-issue.controller.ts:45 | :71 | REAL | crudSvc.getGoodsIssueById (wms-crud.repository.ts:171) | |
| POST /api/wms/goods-issue | wms-goods-issue.controller.ts:45 | :81 | REAL | GoodsIssueCommand → batch+warehouse_stock+ledger tx (goods-issue.handler.ts:107) | Critical stock-out; verified real |
| PATCH /api/wms/goods-issue/:id | wms-goods-issue.controller.ts:45 | :102 | REAL | crudSvc.patchGoodsIssue UPDATE (wms-crud.repository.ts:58) | |
| DELETE /api/wms/goods-issue/:id | wms-goods-issue.controller.ts:45 | :115 | REAL | crudSvc.softDeleteGoodsIssue (wms-crud.repository.ts:49) | |
| GET /api/wms/inventory | wms-inventory.controller.ts:33 | :55 | REAL | queryBus GetStockInventoryQuery | |
| GET /api/wms/inventory/low-stock | wms-inventory.controller.ts:33 | :68 | REAL | queryBus GetLowStockQuery | |
| GET /api/wms/inventory/:id | wms-inventory.controller.ts:33 | :79 | REAL | GetStockInventoryQuery + find | Loads full page then finds by id (inefficient) |
| PATCH /api/wms/inventory/:id | wms-inventory.controller.ts:33 | :93 | REAL | crudSvc.patchInventory UPDATE wms_inventory (wms-crud.repository.ts:77) | |
| DELETE /api/wms/inventory/:id | wms-inventory.controller.ts:33 | :106 | REAL | crudSvc.softDeleteInventory (wms-crud.repository.ts:68) | |
| GET /api/warehouse/reports/abc-analysis | wms-catalog.controller.ts:27 | :39 | REAL | catalogService.getAbcAnalysis | |
| GET /api/warehouse/reports/aging | wms-catalog.controller.ts:27 | :47 | REAL | catalogService.getAging | |
| GET /api/warehouse/reports/expiry | wms-catalog.controller.ts:27 | :55 | REAL | catalogService.getExpiry | |
| GET /api/warehouse/reports/stock-balance | wms-catalog.controller.ts:27 | :66 | REAL | catalogService.getStockBalance | |
| GET /api/warehouse/reports/turnover | wms-catalog.controller.ts:27 | :78 | REAL | catalogService.getTurnover | |
| GET /api/warehouse/stats/total | wms-catalog.controller.ts:27 | :91 | REAL | catalogService.getStatsTotal | DUP-ish: also /wms/stats/total (wms-extended) |
| GET /api/warehouse/dashboard | wms-catalog.controller.ts:27 | :101 | REAL | catalogService.getDashboardKpis | |
| GET /api/warehouse/dashboard/kpis | wms-catalog.controller.ts:27 | :119 | REAL | catalogService.getDashboardKpis | |
| GET /api/warehouse/dashboard/movement-summary | wms-catalog.controller.ts:27 | :127 | REAL | catalogService.getMovementSummary | |
| GET /api/warehouse/dashboard/alerts | wms-catalog.controller.ts:27 | :135 | REAL | catalogService.getDashboardAlerts | |
| GET /api/warehouse/dashboard/top-materials | wms-catalog.controller.ts:27 | :143 | REAL | catalogService.getTopMaterials | |
| GET /api/warehouse/transactions | wms-catalog.controller.ts:27 | :156 | REAL | db SELECT warehouse_transactions | DUP: /wms/transactions (wms-extended) |
| GET /api/warehouse/orders-by-date/:date | wms-catalog.controller.ts:27 | :169 | REAL | db raw JOIN production_orders+material_kits | |
| POST /api/warehouse/warehouses/:id/sync-pos | wms-integration.controller.ts:44 | :64 | GREEN-LIE | try{logPosSyncEvent}catch{return ok:true} (:71-77) | catch-swallow-return-success; only logs event, never syncs stock; returns ok:true even on failure |
| GET /api/warehouse/integration/mm/pending-deliveries | wms-integration.controller.ts:44 | :84 | 501-STUB | notImplemented (:85) | #FX-3 |
| GET /api/warehouse/integration/mm/reorder-suggestions | wms-integration.controller.ts:44 | :91 | 501-STUB | notImplemented (:92) | #FX-3 |
| GET /api/warehouse/integration/fi/stock-valuation | wms-integration.controller.ts:44 | :98 | 501-STUB | notImplemented (:99) | #FX-3 |
| GET /api/warehouse/integration/summary | wms-integration.controller.ts:44 | :105 | 501-STUB | notImplemented (:106) | #FX-3 |
| GET /api/warehouse/integration | wms-integration.controller.ts:44 | :112 | 501-STUB | notImplemented (:113) | #FX-3 |
| POST /api/warehouse/integration | wms-integration.controller.ts:44 | :119 | 501-STUB | parse then notImplemented (:121) | #FX-3 |
| GET /api/inventory/advanced/analytics | inventory-advanced.controller.ts:21 | :31 | REAL | svc.getAnalytics | |
| GET /api/inventory/advanced/counts | inventory-advanced.controller.ts:21 | :38 | REAL | svc.getCounts | |
| GET /api/inventory/advanced/barcodes | inventory-advanced.controller.ts:21 | :54 | REAL | svc.getBarcodeAssignments | |
| GET /api/iot/material-kits | iot-material-kits.controller.ts:32 | :40 | REAL | IotEnhancedService.getMaterialKits (canonical) | |
| POST /api/iot/material-kits | iot-material-kits.controller.ts:32 | :53 | REAL | svc.createMaterialKit | |
| POST /api/iot/material-kits/generate | iot-material-kits.controller.ts:32 | :67 | REAL | svc.generateMaterialKit | |
| GET /api/iot/material-kits/:id | iot-material-kits.controller.ts:32 | :80 | REAL | svc.getMaterialKitById | |
| PATCH /api/iot/material-kits/:id/prepare | iot-material-kits.controller.ts:32 | :92 | REAL | svc.prepareMaterialKit | |
| PATCH /api/iot/material-kits/:id/ready | iot-material-kits.controller.ts:32 | :104 | REAL | svc.readyMaterialKit | |
| GET /api/iot/material-kits/:id/items | iot-material-kits.controller.ts:32 | :113 | REAL | svc.getKitItems | |
| GET /api/wms/inventory-turnover | wms-analytics.controller.ts:24 | :32 | REAL | WmsAnalyticsService.getInventoryTurnover | |
| GET /api/wms/dead-stock | wms-analytics.controller.ts:24 | :40 | REAL | svc.getDeadStock | |
| GET /api/wms/rop-alerts | wms-analytics.controller.ts:24 | :48 | REAL | svc.getRopAlerts | |
| POST /api/wms/eoq/calculate | wms-eoq.controller.ts:39 | :49 | REAL | WmsEoqService.calculateWithTiers | pure calc (no DB) |
| POST /api/wms/eoq/recalculate-all | wms-eoq.controller.ts:39 | :60 | REAL | svc.enqueueRecalculation (BullMQ, per README:81) | async enqueue |
| GET /api/warehouse/warehouses/:id/zones | wms-gateway-warehouse-lots.controller.ts:53 | :62 | REAL | rawSql warehouse_zones | |
| GET /api/warehouse/warehouses/:id/bins | wms-gateway-warehouse-lots.controller.ts:53 | :84 | REAL | rawSql warehouse_bins | |
| GET /api/warehouse/warehouses/:id/lots | wms-gateway-warehouse-lots.controller.ts:53 | :110 | REAL | rawSql batch_lots | catch returns empty on error (read) |
| POST /api/warehouse/warehouses/:id/lots | wms-gateway-warehouse-lots.controller.ts:53 | :151 | REAL | rawSql INSERT batch_lots (:159) | |
| PATCH /api/warehouse/warehouses/:id/lots/:lotId | wms-gateway-warehouse-lots.controller.ts:53 | :182 | REAL | rawSql UPDATE batch_lots (:189) | |
| GET /api/warehouse/bins | wms-gateway-binszone.controller.ts:77 | :88 | REAL | rawSql warehouse_bins | |
| POST /api/warehouse/bins | wms-gateway-binszone.controller.ts:77 | :118 | REAL | rawSql INSERT warehouse_bins (:124) | |
| GET /api/warehouse/bins/:id/360 | wms-gateway-binszone.controller.ts:77 | :146 | REAL | rawSql warehouse_bins | catch returns {id} |
| GET /api/warehouse/bins/:id | wms-gateway-binszone.controller.ts:77 | :165 | REAL | rawSql warehouse_bins | catch returns {id} |
| PATCH /api/warehouse/bins/:id | wms-gateway-binszone.controller.ts:77 | :185 | REAL | rawSql UPDATE warehouse_bins (:188) | |
| DELETE /api/warehouse/bins/:id | wms-gateway-binszone.controller.ts:77 | :206 | REAL | rawSql DELETE warehouse_bins (:208) | hard delete |
| GET /api/warehouse/zones | wms-gateway-binszone.controller.ts:77 | :218 | REAL | rawSql warehouse_zones | |
| POST /api/warehouse/zones | wms-gateway-binszone.controller.ts:77 | :242 | REAL | rawSql INSERT warehouse_zones (:248) | |
| PATCH /api/warehouse/zones/:id | wms-gateway-binszone.controller.ts:77 | :268 | REAL | rawSql UPDATE warehouse_zones (:271) | |
| DELETE /api/warehouse/zones/:id | wms-gateway-binszone.controller.ts:77 | :290 | REAL | rawSql UPDATE deleted_at (:292) | |
| GET /api/wms/stats/total | wms-extended.controller.ts:44 | :57 | REAL | WmsExtendedService.getTotalStats | DUP: /warehouse/stats/total |
| GET /api/wms/materials/:id/fifo-cost | wms-extended.controller.ts:44 | :65 | REAL | svc.getFifoCost | |
| GET /api/wms/transactions | wms-extended.controller.ts:44 | :71 | REAL | svc.listTransactions | DUP: /warehouse/transactions |
| POST /api/wms/transactions | wms-extended.controller.ts:44 | :91 | REAL | svc.createTransaction | |
| GET /api/wms/alerts | wms-extended.controller.ts:44 | :99 | REAL | svc.getAlerts | |
| POST /api/wms/check-alerts | wms-extended.controller.ts:44 | :109 | REAL | svc.checkAlerts | |
| GET /api/wms/suggestions | wms-extended.controller.ts:44 | :117 | REAL | svc.getReplenishmentSuggestions | |
| GET /api/wms/low-stock | wms-extended.controller.ts:44 | :124 | REAL | svc.getLowStock | DUP-ish: /wms/inventory/low-stock |
| POST /api/wms/barcode/scan | wms-extended.controller.ts:44 | :135 | REAL | svc.scanBarcode | |
| PATCH /api/wms/transactions/:id | wms-extended.controller.ts:44 | :147 | REAL | crudSvc.patchTransaction UPDATE (wms-crud.repository.ts:39) | |
| DELETE /api/wms/transactions/:id | wms-extended.controller.ts:44 | :161 | REAL | crudSvc.softDeleteTransaction (wms-crud.repository.ts:30) | |
| GET /api/wms/movements | wms-extended.controller.ts:44 | :172 | REAL | movementsSvc.findAll | |
| GET /api/wms/warehouses | wms-warehouses.controller.ts:36 | :52 | REAL | queryBus GetWarehousesQuery | |
| GET /api/wms/warehouses/:id | wms-warehouses.controller.ts:36 | :64 | REAL | GetWarehousesQuery + find | |
| POST /api/wms/warehouses | wms-warehouses.controller.ts:36 | :79 | REAL | rawSql INSERT warehouses (:89) | CreateWarehouseCommand imported but unused; DUP: /warehouse/warehouses |
| PATCH /api/wms/warehouses/:id/toggle-active | wms-warehouses.controller.ts:36 | :107 | REAL | rawSql UPDATE warehouses (:110) | |
| GET /api/wms/warehouses/:id/inventory | wms-warehouses.controller.ts:36 | :129 | REAL | rawSql warehouse_stock JOIN | catch returns empty |
| DELETE /api/wms/warehouses/:id | wms-warehouses.controller.ts:36 | :155 | REAL | crudSvc.softDeleteWarehouse (wms-crud.repository.ts:149) | |
| GET /api/warehouse-rental/records | warehouse-rental.controller.ts:32 | :42 | REAL | WarehouseRentalService.getRecords | |
| POST /api/warehouse-rental/records | warehouse-rental.controller.ts:32 | :55 | REAL | svc.createRecord | |
| GET /api/warehouse-rental/summary | warehouse-rental.controller.ts:32 | :64 | REAL | svc.getSummary | |
| GET /api/warehouse-rental/settings | warehouse-rental.controller.ts:32 | :73 | REAL | svc.getSettings | |
| PATCH /api/warehouse-rental/settings | warehouse-rental.controller.ts:32 | :84 | REAL | svc.updateSettings | |
| POST /api/warehouse-rental/records/:id/close | warehouse-rental.controller.ts:32 | :95 | REAL | svc.closeRecord | |
| POST /api/warehouse-rental/records/:id/mark-paid | warehouse-rental.controller.ts:32 | :106 | REAL | svc.markPaid | |
| PATCH /api/warehouse-rental/records/:id/close | warehouse-rental.controller.ts:32 | :126 | REAL | svc.closeRecord | mirror of POST close |
| PATCH /api/warehouse-rental/records/:id/mark-paid | warehouse-rental.controller.ts:32 | :136 | REAL | svc.markPaid | mirror of POST mark-paid |
| PUT /api/warehouse-rental/settings | warehouse-rental.controller.ts:32 | :150 | REAL | svc.updateSettings | mirror of PATCH settings |
| POST /api/wms/rental/receive | wms-rental.controller.ts:35 | :48 | REAL | ReceiveFgCommand (FG-in via CommandBus) | |
| PATCH /api/wms/rental/:id | wms-rental.controller.ts:35 | :79 | REAL | PatchRentalCommand | |
| DELETE /api/wms/rental/:id | wms-rental.controller.ts:35 | :94 | REAL | DeleteRentalCommand | |
| GET /api/iot-enhanced/orders-for-kits | iot-enhanced.controller.ts:45 | :55 | REAL | svc.getOrdersForKits | |
| GET /api/iot-enhanced/material-kits | iot-enhanced.controller.ts:45 | :66 | DUPLICATE | svc.getMaterialKits | dup of GET /iot/material-kits (iot-material-kits) |
| POST /api/iot-enhanced/material-kits | iot-enhanced.controller.ts:45 | :77 | DUPLICATE | svc.createMaterialKit | dup of POST /iot/material-kits |
| GET /api/iot-enhanced/orders/:id/calculate-bom | iot-enhanced.controller.ts:45 | :87 | REAL | svc.calculateBom | |
| GET /api/iot-enhanced/material-kits/:id/items | iot-enhanced.controller.ts:45 | :97 | DUPLICATE | svc.getKitItems | dup of GET /iot/material-kits/:id/items |
| POST /api/iot-enhanced/material-kits/:id/items | iot-enhanced.controller.ts:45 | :109 | REAL | svc.addKitItem | |
| POST /api/iot-enhanced/orders/:id/calculate-bom | iot-enhanced.controller.ts:45 | :121 | REAL | svc.calculateBom | POST mirror of GET calculate-bom |
| GET /api/iot-enhanced/orders | iot-enhanced.controller.ts:45 | :128 | REAL | db SELECT production_orders | |
| POST /api/wms/rulon-cards | rulon-card.controller.ts:48 | :60 | REAL | RulonCardService.create | |
| GET /api/wms/rulon-cards | rulon-card.controller.ts:48 | :70 | REAL | svc.list | |
| GET /api/wms/rulon-cards/:id | rulon-card.controller.ts:48 | :88 | REAL | svc.getById | |
| PATCH /api/wms/rulon-cards/:id/weight | rulon-card.controller.ts:48 | :100 | REAL | svc.updateCurrentWeight | |
| PATCH /api/wms/rulon-cards/:id/status | rulon-card.controller.ts:48 | :112 | REAL | svc.changeStatus | |
| GET /api/warehouse/inventory-counts-stats | wms-gateway-inventory.controller.ts:65 | :75 | REAL | rawSql inventory_counts | catch returns zeros |
| GET /api/warehouse/inventory-counts | wms-gateway-inventory.controller.ts:65 | :99 | REAL | rawSql inventory_counts | DUP-world: /wms/inventory-counts uses wms_inventory_counts table |
| POST /api/warehouse/inventory-counts | wms-gateway-inventory.controller.ts:65 | :132 | REAL | rawSql INSERT inventory_counts (:144) | DUP-world vs /wms/inventory-counts |
| GET /api/warehouse/inventory-counts/lines/:lineId | wms-gateway-inventory.controller.ts:65 | :166 | REAL | rawSql inventory_count_lines | |
| PATCH /api/warehouse/inventory-counts/lines/:lineId | wms-gateway-inventory.controller.ts:65 | :204 | REAL | rawSql UPDATE inventory_count_lines (:214) | |
| GET /api/warehouse/inventory-counts/:id | wms-gateway-inventory.controller.ts:65 | :238 | REAL | rawSql inventory_counts + json_agg | catch returns draft stub |
| PATCH /api/warehouse/inventory-counts/:id | wms-gateway-inventory.controller.ts:65 | :308 | REAL | rawSql UPDATE inventory_counts (:314) | |
| PATCH /api/warehouse/inventory-counts/:id/status | wms-gateway-inventory.controller.ts:65 | :331 | REAL | rawSql UPDATE inventory_counts (:338) | |
| POST /api/warehouse/inventory-counts/:id/generate-lines | wms-gateway-inventory.controller.ts:65 | :355 | REAL | rawSql INSERT inventory_count_lines from warehouse_stock (:395) | |
| POST /api/warehouse/transfers | wms-warehouse-gateway.controller.ts:67 | :81 | REAL | svc.createTransfer | |
| GET /api/warehouse/transfers/:id | wms-warehouse-gateway.controller.ts:67 | :96 | REAL | rawSql warehouse_transfers | |
| PATCH /api/warehouse/transfers/:id/status | wms-warehouse-gateway.controller.ts:67 | :113 | REAL | rawSql UPDATE warehouse_transfers (:120) | status only; does not move stock |
| POST /api/warehouse/internal-requests | wms-warehouse-gateway.controller.ts:67 | :137 | REAL | svc.createInternalRequest | DUP: /wms/internal-requests (wms-counts) |
| GET /api/warehouse/goods-receipts/stats | wms-warehouse-gateway.controller.ts:67 | :153 | REAL | svc.getGoodsReceiptStats | |
| GET /api/warehouse/goods-receipts | wms-warehouse-gateway.controller.ts:67 | :161 | REAL | svc.getGoodsReceipts | |
| POST /api/warehouse/goods-receipts | wms-warehouse-gateway.controller.ts:67 | :173 | REAL | svc.createGoodsReceipt | |
| GET /api/warehouse/goods-receipts/:id/lines | wms-warehouse-gateway.controller.ts:67 | :187 | REAL | svc.getGoodsReceiptLines | |
| POST /api/warehouse/goods-receipts/lines/:id/qc | wms-warehouse-gateway.controller.ts:67 | :197 | REAL | svc.qcLine | |
| PATCH /api/warehouse/goods-receipts/lines/:id/qc | wms-warehouse-gateway.controller.ts:67 | :211 | REAL | svc.qcLine | mirror of POST qc |
| POST /api/warehouse/goods-receipts/:id/lines | wms-warehouse-gateway.controller.ts:67 | :224 | REAL | svc.addGoodsReceiptLine | |
| POST /api/warehouse/goods-receipts/:id/quarantine | wms-warehouse-gateway.controller.ts:67 | :238 | REAL | svc.sendToQuarantine (quarantineGate) | |
| POST /api/warehouse/goods-receipts/:id/qc-decision | wms-warehouse-gateway.controller.ts:67 | :251 | REAL | svc.qcReceiptDecision (quarantineGate) | |
| POST /api/warehouse/goods-receipts/:id/complete | wms-warehouse-gateway.controller.ts:67 | :268 | REAL | svc.completeGoodsReceipt → releaseToMain stock post (service:89) | Critical stock-in; QC-gated |
| GET /api/inventory/materials | inventory-materials.controller.ts:50 | :60 | REAL | InventoryMaterialsService.listMaterials | |
| GET /api/inventory/materials/:id/360-card | inventory-materials.controller.ts:50 | :77 | REAL | svc.getMaterial360Card | |
| PUT /api/inventory/materials/:id | inventory-materials.controller.ts:50 | :89 | REAL | svc.updateMaterial | |
| DELETE /api/inventory/materials/:id | inventory-materials.controller.ts:50 | :101 | REAL | svc.deleteMaterial | |
| POST /api/inventory/materials | inventory-materials.controller.ts:50 | :112 | REAL | svc.createMaterial → material_cards | |
| GET /api/inventory/materials/low-stock | inventory-materials.controller.ts:50 | :123 | REAL | svc.getLowStockList | route ordering after :id ok (distinct path) |
| POST /api/wms/goods-issue/overflow | wms-overflow.controller.ts:48 | :66 | REAL | WmsOverflowService.issueWithOverflow | |
| POST /api/wms/goods-issue/enforce-check | wms-overflow.controller.ts:48 | :90 | REAL | OutboundEnforcementService.checkIssueAllowed | |
| GET /api/warehouse/warehouses/stats/total | wms-gateway-warehouses.controller.ts:56 | :66 | REAL | rawSql warehouses+warehouse_stock | catch returns zeros |
| GET /api/warehouse/warehouses | wms-gateway-warehouses.controller.ts:56 | :90 | REAL | rawSql warehouses | |
| POST /api/warehouse/warehouses | wms-gateway-warehouses.controller.ts:56 | :125 | REAL | rawSql INSERT warehouses (:138) | DUP: /wms/warehouses |
| GET /api/warehouse/warehouses/:id/stock | wms-gateway-warehouses.controller.ts:56 | :154 | REAL | rawSql pos_warehouse_stock_view / warehouse_stock | |
| GET /api/warehouse/warehouses/:id/stats | wms-gateway-warehouses.controller.ts:56 | :201 | REAL | rawSql 6-way Promise.all rollup | catch returns partial |
| GET /api/warehouse/warehouses/:id | wms-gateway-warehouses.controller.ts:56 | :301 | REAL | rawSql warehouses | catch returns {id} on non-404 err |
| PATCH /api/warehouse/warehouses/:id | wms-gateway-warehouses.controller.ts:56 | :315 | REAL | rawSql UPDATE warehouses (:321) | |
| DELETE /api/warehouse/warehouses/:id | wms-gateway-warehouses.controller.ts:56 | :341 | REAL | rawSql UPDATE deleted_at (:343) | |
| GET /api/wms/in-transit/shipments | wms-in-transit.controller.ts:36 | :46 | REAL | WmsInTransitService.list | |
| GET /api/wms/in-transit/shipments/:id | wms-in-transit.controller.ts:36 | :57 | REAL | svc.getOne | |
| POST /api/wms/in-transit/shipments | wms-in-transit.controller.ts:36 | :67 | REAL | svc.create | |
| POST /api/wms/in-transit/shipments/:id/customs | wms-in-transit.controller.ts:36 | :78 | REAL | svc.markCustoms | |
| POST /api/wms/in-transit/shipments/:id/arrived | wms-in-transit.controller.ts:36 | :92 | REAL | svc.markArrived | |
| POST /api/wms/in-transit/shipments/:id/cancel | wms-in-transit.controller.ts:36 | :106 | REAL | svc.cancel | |
| GET /api/wms/in-transit/shipments/:id/documents | wms-in-transit.controller.ts:36 | :114 | REAL | svc.listDocuments | |
| POST /api/wms/in-transit/shipments/:id/documents | wms-in-transit.controller.ts:36 | :127 | REAL | svc.addDocument | |
| GET /api/wms/material-life/aging-alerts | material-life.controller.ts:68 | :78 | REAL | MaterialLifeService.getAgingAlerts | |
| GET /api/wms/material-life/hazard-stock | material-life.controller.ts:68 | :88 | REAL | svc.getHazardStock | |
| GET /api/wms/material-life/:id | material-life.controller.ts:68 | :99 | REAL | svc.getLife | |
| PATCH /api/wms/material-life/:id | material-life.controller.ts:68 | :109 | REAL | svc.updateLife | |
| GET /api/wms/material-life/:id/substitutes | material-life.controller.ts:68 | :118 | REAL | svc.listSubstitutes | |
| POST /api/wms/material-life/:id/substitutes | material-life.controller.ts:68 | :131 | REAL | svc.addSubstitute | |
| DELETE /api/wms/material-life/substitutes/:subId | material-life.controller.ts:68 | :145 | REAL | svc.removeSubstitute | |
| GET /api/wms/inventory-counts | wms-counts.controller.ts:37 | :53 | REAL | WmsCountsService.listInventoryCounts | DUP-world vs /warehouse/inventory-counts |
| GET /api/wms/count-deviation-reasons | wms-counts.controller.ts:37 | :70 | REAL | freezeSvc.listDeviationReasons | |
| POST /api/wms/count-lines | wms-counts.controller.ts:37 | :82 | REAL | svc.recordCountLine | |
| GET /api/wms/freeze-zones | wms-counts.controller.ts:37 | :97 | REAL | freezeSvc.listFreezes | |
| POST /api/wms/freeze-zones | wms-counts.controller.ts:37 | :108 | REAL | freezeSvc.freezeZone | |
| PATCH /api/wms/freeze-zones/:id/release | wms-counts.controller.ts:37 | :122 | REAL | freezeSvc.releaseZone | |
| POST /api/wms/inventory-counts | wms-counts.controller.ts:37 | :131 | REAL | svc.createInventoryCount | DUP-world vs /warehouse/inventory-counts |
| DELETE /api/wms/inventory-counts/:id | wms-counts.controller.ts:37 | :142 | REAL | crudSvc.softDeleteInventoryCount (wms-crud.repository.ts:140) | |
| GET /api/wms/internal-requests | wms-counts.controller.ts:37 | :153 | REAL | svc.listInternalRequests | DUP: /warehouse/internal-requests |
| POST /api/wms/internal-requests | wms-counts.controller.ts:37 | :163 | REAL | svc.createInternalRequest | DUP: /warehouse/internal-requests |
| PATCH /api/wms/internal-requests/:id | wms-counts.controller.ts:37 | :176 | REAL | svc.updateInternalRequest | |
| GET /api/wms/batches | wms-counts.controller.ts:37 | :188 | REAL | svc.listBatches | |
| GET /api/wms/production-supply | wms-counts.controller.ts:37 | :195 | REAL | svc.getProductionSupply | |
| GET /api/wms/suppliers/rating | wms-supplier-rating.controller.ts:43 | :51 | REAL | SupplierRatingService.listRatings | |
| GET /api/wms/suppliers/:id/rating | wms-supplier-rating.controller.ts:43 | :61 | REAL | svc.getRating | |
| GET /api/wms/settings | wms-settings.controller.ts:32 | :40 | REAL | WmsSettingsService.getAll | |
| POST /api/wms/settings | wms-settings.controller.ts:32 | :49 | REAL | svc.saveMany | |
| PATCH /api/wms/settings/:id | wms-settings.controller.ts:32 | :57 | REAL | svc.patchById | |
| GET /api/warehouse/printer-config | wms-barcode.controller.ts:69 | :79 | REAL | db.select posPrinterConfig | |
| POST /api/warehouse/printer-config | wms-barcode.controller.ts:69 | :94 | REAL | db.insert posPrinterConfig (:96) | |
| PATCH /api/warehouse/printer-config/:id | wms-barcode.controller.ts:69 | :115 | REAL | db.update posPrinterConfig (:127) | |
| DELETE /api/warehouse/printer-config/:id | wms-barcode.controller.ts:69 | :141 | REAL | db.delete posPrinterConfig (:142) | |
| GET /api/warehouse/material-kits | wms-barcode.controller.ts:69 | :156 | DUPLICATE | db SELECT material_kits | dup of /iot/material-kits (same material_kits table) |
| POST /api/warehouse/material-kits | wms-barcode.controller.ts:69 | :165 | DUPLICATE | db INSERT material_kits (:172) | dup writer of material_kits |
| PATCH /api/warehouse/material-kits/:id/status | wms-barcode.controller.ts:69 | :194 | DUPLICATE | db UPDATE material_kits (:196) | dup of kit status transitions |
| GET /api/warehouse/material-kits/:id/items | wms-barcode.controller.ts:69 | :205 | DUPLICATE | db SELECT material_kit_items | dup of /iot/material-kits/:id/items |
| GET /api/materials/cards | mm-material-cards.controller.ts:32 | :43 | REAL | MmMaterialsExtrasService.listMaterialCards | |
| GET /api/materials/cards/:id | mm-material-cards.controller.ts:32 | :56 | REAL | svc.getMaterialCard | |
| GET /api/raw-materials | mm-raw-materials.controller.ts:29 | :39 | REAL | MmMaterialsExtrasService.listRawMaterials | |
| GET /api/mm/materials/:id/sheet-conversion | mm-materials.controller.ts:43 | :58 | REAL | LayerFormulaService.convert | |
| GET /api/mm/materials | mm-materials.controller.ts:43 | :78 | REAL | queryBus GetMaterialsQuery | |
| GET /api/mm/materials/stats | mm-materials.controller.ts:43 | :102 | REAL | commandBus GetMaterialStatsQuery | |
| GET /api/mm/materials/:id | mm-materials.controller.ts:43 | :120 | REAL | commandBus GetMaterialByIdQuery | |
| POST /api/mm/materials | mm-materials.controller.ts:43 | :138 | REAL | CreateMaterialCommand | |
| PUT /api/mm/materials/:id | mm-materials.controller.ts:43 | :167 | REAL | UpdateMaterialCommand | |
| PATCH /api/mm/materials/:id/toggle-active | mm-materials.controller.ts:43 | :197 | REAL | UpdateMaterialCommand (isActive) | |
| GET /api/mm/vendors | mm-vendors-pr.controller.ts:34 | :42 | REAL | MmVendorsPrService.listVendors | |
| GET /api/mm/vendor-performance | mm-vendors-pr.controller.ts:34 | :55 | REAL | rawSql mm_vendor_ratings JOIN mm_vendors | catch returns [] |
| GET /api/mm/vendors/:id | mm-vendors-pr.controller.ts:34 | :98 | REAL | svc.getVendor | |
| POST /api/mm/vendors | mm-vendors-pr.controller.ts:34 | :113 | REAL | svc.createVendor | |
| PATCH /api/mm/vendors/:id | mm-vendors-pr.controller.ts:34 | :125 | REAL | svc.updateVendor | |
| DELETE /api/mm/vendors/:id | mm-vendors-pr.controller.ts:34 | :140 | REAL | svc.deleteVendor | |
| GET /api/mm/purchase-requisitions | mm-vendors-pr.controller.ts:34 | :147 | REAL | svc.listRequisitions | |
| GET /api/mm/purchase-requisitions/:id | mm-vendors-pr.controller.ts:34 | :156 | REAL | svc.getRequisition | |
| POST /api/mm/purchase-requisitions | mm-vendors-pr.controller.ts:34 | :170 | REAL | svc.createRequisition | |
| PATCH /api/mm/purchase-requisitions/:id | mm-vendors-pr.controller.ts:34 | :182 | REAL | svc.updateRequisition | |
| DELETE /api/mm/purchase-requisitions/:id | mm-vendors-pr.controller.ts:34 | :197 | REAL | svc.deleteRequisition | |
| GET /api/mm/goods-receipts | mm-goods.controller.ts:31 | :40 | REAL | MmGoodsService.listGoodsReceipts | |
| GET /api/mm/goods-receipts/:id | mm-goods.controller.ts:31 | :48 | REAL | svc.getGoodsReceipt | |
| POST /api/mm/goods-receipts | mm-goods.controller.ts:31 | :62 | REAL | svc.createGoodsReceipt | |
| POST /api/mm/goods-receipts/:id/post | mm-goods.controller.ts:31 | :71 | REAL | svc.postGoodsReceipt → warehouse_stock UPSERT (queries-mm-goods.ts:116) | Critical stock-in; verified real+idempotent |
| PATCH /api/mm/goods-receipts/:id | mm-goods.controller.ts:31 | :82 | REAL | svc.updateGoodsReceipt | |
| DELETE /api/mm/goods-receipts/:id | mm-goods.controller.ts:31 | :97 | REAL | svc.deleteGoodsReceipt | returns {} |
| GET /api/mm/goods-issues | mm-goods.controller.ts:31 | :105 | REAL | svc.listGoodsIssues | |
| GET /api/mm/goods-issues/:id | mm-goods.controller.ts:31 | :113 | REAL | svc.getGoodsIssue | |
| POST /api/mm/goods-issues | mm-goods.controller.ts:31 | :127 | REAL | svc.createGoodsIssue (execCreateGoodsIssue) | inserts issue header/items; stock decrement not in this path (mm issue ≠ warehouse_stock decrement) |
| PATCH /api/mm/goods-issues/:id | mm-goods.controller.ts:31 | :138 | REAL | svc.updateGoodsIssue | |
| DELETE /api/mm/goods-issues/:id | mm-goods.controller.ts:31 | :153 | REAL | svc.deleteGoodsIssue | returns {} |
| GET /api/mm/three-way-match/:poId | mm-goods.controller.ts:31 | :162 | REAL | svc.threeWayMatch | DUP-ish: /mm/three-way-match (mm-dashboard) |
| GET /api/mm/currencies | mm-goods.controller.ts:31 | :169 | REAL | svc.getCurrencies | |
| GET /api/mm/suppliers/price-comparison | mm-goods.controller.ts:31 | :175 | REAL | svc.getPriceComparison | |
| GET /api/hitl-approvals | hitl-approvals.controller.ts:34 | :46 | REAL | repo.listPending hitl_approvals | |
| POST /api/hitl-approvals/:id/approve | hitl-approvals.controller.ts:34 | :58 | REAL | repo.approve | |
| POST /api/hitl-approvals/:id/reject | hitl-approvals.controller.ts:34 | :71 | REAL | repo.reject | |
| GET /api/mm/dashboard | mm-dashboard.controller.ts:60 | :73 | REAL | MmDashboardService.getDashboard | |
| GET /api/mm/vendor-ratings | mm-dashboard.controller.ts:60 | :82 | REAL | svc.getVendorRatings | |
| GET /api/mm/mrp-results | mm-dashboard.controller.ts:60 | :91 | REAL | svc.getMrpResults | |
| POST /api/mm/mrp-run | mm-dashboard.controller.ts:60 | :102 | REAL | svc.runMrp | |
| GET /api/mm/fleet/vehicles | mm-dashboard.controller.ts:60 | :111 | REAL | svc.getFleetVehicles | |
| POST /api/mm/fleet/vehicles | mm-dashboard.controller.ts:60 | :122 | REAL | svc.createFleetVehicle | |
| GET /api/mm/fleet/fuel-logs | mm-dashboard.controller.ts:60 | :131 | REAL | svc.getFuelLogs | |
| POST /api/mm/fleet/fuel-logs | mm-dashboard.controller.ts:60 | :142 | REAL | svc.createFuelLog | |
| GET /api/mm/supplier-performance | mm-dashboard.controller.ts:60 | :151 | REAL | svc.getSupplierPerformance | |
| GET /api/mm/materials/:id/price-history | mm-dashboard.controller.ts:60 | :161 | REAL | svc.getPriceHistory | |
| GET /api/mm/vendor-invoices | mm-dashboard.controller.ts:60 | :169 | REAL | svc.getVendorInvoices | |
| GET /api/mm/vendor-invoices/:id | mm-dashboard.controller.ts:60 | :178 | REAL | svc.getVendorInvoiceById | |
| PATCH /api/mm/vendor-invoices/:id/approve | mm-dashboard.controller.ts:60 | :187 | 501-STUB | notImplemented (:188) | #FX-2 |
| PATCH /api/mm/vendor-invoices/:id/match | mm-dashboard.controller.ts:60 | :194 | 501-STUB | notImplemented (:195) | #FX-2 |
| POST /api/mm/vendor-invoices/:id/payment | mm-dashboard.controller.ts:60 | :201 | 501-STUB | notImplemented (:202) | #FX-2 |
| GET /api/mm/three-way-match | mm-dashboard.controller.ts:60 | :208 | REAL | svc.getThreeWayMatch | DUP-ish: /mm/three-way-match/:poId (mm-goods) |
| GET /api/mm/3way-match/:invoiceId | mm-dashboard.controller.ts:60 | :217 | REAL | svc.getVendorInvoiceById | |
| GET /api/mm/fleet/maintenance | mm-dashboard.controller.ts:60 | :226 | REAL | svc.getFleetMaintenance | |
| GET /api/mm/fleet/deliveries | mm-dashboard.controller.ts:60 | :233 | 501-STUB | notImplemented (:234) | #FX-2 |
| PATCH /api/mm/fleet/deliveries/:id/status | mm-dashboard.controller.ts:60 | :238 | 501-STUB | notImplemented (:240) | #FX-2 |
| GET /api/mm/vehicles/locations | mm-dashboard.controller.ts:60 | :245 | REAL | svc.getVehicleLocations | |
| GET /api/mm/driver/expenses | mm-dashboard.controller.ts:60 | :253 | REAL | svc.getDriverExpenses | |
| GET /api/mm/materials/:id/suppliers | mm-dashboard.controller.ts:60 | :261 | 501-STUB | notImplemented (:263) | #FX-2 |
| POST /api/mm/3way-match/:invoiceId | mm-dashboard.controller.ts:60 | :268 | 501-STUB | notImplemented (:270) | #FX-2 |
| POST /api/mm/fleet/deliveries | mm-dashboard.controller.ts:60 | :275 | 501-STUB | notImplemented (:277) | #FX-2 |
| POST /api/mm/vendor-invoices/:id/match | mm-dashboard.controller.ts:60 | :282 | 501-STUB | notImplemented (:284) | #FX-2 |
| PATCH /api/mm/vendor-invoices/:id/payment | mm-dashboard.controller.ts:60 | :289 | 501-STUB | throws 501 needs fi_payments (:291) | |
| POST /api/mm/vendor-performance | mm-dashboard.controller.ts:60 | :297 | REAL | ratingService.computeRating + db INSERT mm_vendor_ratings (:335) | |
| GET /api/mm/purchase-orders | mm-purchase-orders.controller.ts:36 | :48 | REAL | db raw mm_purchase_orders JOIN | |
| GET /api/mm/purchase-orders/pending-receipt | mm-purchase-orders.controller.ts:36 | :98 | REAL | db raw mm_purchase_orders status=approved | |
| GET /api/mm/purchase-orders/:id | mm-purchase-orders.controller.ts:36 | :148 | REAL | db raw mm_purchase_orders | |
| POST /api/mm/purchase-orders | mm-purchase-orders.controller.ts:36 | :198 | REAL | CreatePurchaseOrderCommand | |
| POST /api/mm/purchase-orders/:id/approve | mm-purchase-orders.controller.ts:36 | :220 | REAL | ApprovePurchaseOrderCommand | |
| POST /api/mm/purchase-orders/:id/goods-receipt | mm-purchase-orders.controller.ts:36 | :234 | REAL | GoodsReceiptCommand | |
| DELETE /api/mm/purchase-orders/:id | mm-purchase-orders.controller.ts:36 | :250 | REAL | db UPDATE deleted_at (draft-only) (:256) | |
| PATCH /api/mm/purchase-orders/:id | mm-purchase-orders.controller.ts:36 | :266 | REAL | db UPDATE header (draft-only) (:276) | line-item recalc deferred (header-only) |
| PATCH /api/mm/purchase-orders/:id/approve | mm-purchase-orders.controller.ts:36 | :289 | REAL | ApprovePurchaseOrderCommand | mirror of POST approve |


---

## POS + Logistics + Order-Workflow

High-risk finding summary: every POS movement/GL/stock write path was deep-traced to a real DB statement. `PosMovementService.createMovement` inserts via repo (pos-movement.service.ts:244), `WarehouseConfigService.issueStock/receiveStock` do atomic `warehouse_stock` UPDATE/INSERT + `material_movements` journal (warehouse-config.service.ts:112-128, 167-196), `GlPostingLogService.approveByMovement` posts to canonical `entries` ledger via repo.postMovementToLedger (gl-posting-log.service.ts:89,106), `AutoGlPostingService.postForMovement` does atomic `pos_gl_postings` insert (auto-gl-posting.service.ts:112), `StockLedgerService.adjustStock/recordEntry` insert ledger rows (stock-ledger.service.ts:47,205). No no-op or fake-success on the money/stock legs. Two soft spots flagged in Notes (pos-stub adjust catch-swallow; employee inventory PDF empty-buffer-on-error) but neither returns a false success on a stock/GL write.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /pos/movements | apps/api/src/modules/pos/presentation/movements.controller.ts:73 | pos-movement-query.service.ts findAll | REAL | movementQueryService.findAll(filter) | |
| GET /pos/movements/:id | movements.controller.ts:82 | pos-movement-query.service.ts findOne | REAL | movementQueryService.findOne(id) | |
| POST /pos/movements | movements.controller.ts:91 | pos-movement.service.ts:244 | REAL | repo.insertMovement + addLines (real DB) | High-risk path, verified writes |
| PATCH /pos/movements/:id/status | movements.controller.ts:106 | pos-movement-status.service.ts updateStatus | REAL | movementStatusService.updateStatus | |
| POST /pos/movements/qc-decision | movements.controller.ts:120 | pos-movement-status.service.ts recordQcDecision | REAL | delegates to status service | |
| POST /pos/movements/damage | movements.controller.ts:129 | pos-movement.service.ts:391 | REAL | createDamageAct → createMovement (real insert) | |
| GET /pos/movements/:id/pdf | movements.controller.ts:138 | pos-pdf.service.ts generateMovementAct | REAL | throws InternalServerError on failure (no fake 0-byte) | Fixed from prior fake-success |
| GET /pos/movements/:id/confirmations | movements.controller.ts:162 | stock-ledger.service.ts:214 | REAL | repo.getMovementConfirmations | |
| POST /pos/movements/:id/recheck-techcard | movements.controller.ts:171 | pos-techcard-gate.service.ts recheckOnOrderChange | REAL | techCardGate.recheckOnOrderChange | |
| GET /pos/movements/:id/history | movements.controller.ts:184 | pos-audit.service.ts getEntityHistory | REAL | auditService.getEntityHistory | |
| GET /legacy/pos/movement-types | apps/api/src/modules/pos/presentation/pos.controller.ts:49 | pos.service.ts getMovementTypes | REAL | service.getMovementTypes | |
| POST /legacy/pos/movement-types | pos.controller.ts:56 | pos.service.ts createMovementType | REAL | service.createMovementType | |
| GET /legacy/pos/warehouse-access/:userId | pos.controller.ts:67 | pos.service.ts getUserWarehouseAccess | REAL | service.getUserWarehouseAccess | |
| POST /legacy/pos/warehouse-access | pos.controller.ts:74 | pos.service.ts grantWarehouseAccess | REAL | service.grantWarehouseAccess | |
| DELETE /legacy/pos/warehouse-access/:userId/:warehouseId | pos.controller.ts:81 | pos.service.ts revokeWarehouseAccess | REAL | service.revokeWarehouseAccess | |
| GET /legacy/pos/movements | pos.controller.ts:95 | pos.service.ts getMovements | DUPLICATE | overlaps GET /pos/movements (movements.controller) | Parallel legacy §38 movement impl (PosService) |
| GET /legacy/pos/movements/stats | pos.controller.ts:107 | pos-inventory.service.ts getStats | REAL | inventoryService.getStats | |
| GET /legacy/pos/movements/:id | pos.controller.ts:114 | pos.service.ts getMovementById | DUPLICATE | overlaps GET /pos/movements/:id | |
| POST /legacy/pos/movements | pos.controller.ts:121 | pos.service.ts createMovement | DUPLICATE | overlaps POST /pos/movements | Second createMovement world |
| POST /legacy/pos/movements/:id/lines | pos.controller.ts:128 | pos.service.ts addMovementLine | DUPLICATE | overlaps movements.controller line-add | |
| PUT /legacy/pos/movements/:id/status | pos.controller.ts:138 | pos.service.ts updateMovementStatus | DUPLICATE | overlaps PATCH /pos/movements/:id/status | |
| GET /legacy/pos/passports | pos.controller.ts:153 | pos-inventory.service.ts getPassports | REAL | inventoryService.getPassports | |
| GET /legacy/pos/passports/:id | pos.controller.ts:161 | pos-inventory.service.ts getPassportById | REAL | inventoryService.getPassportById | |
| POST /legacy/pos/passports | pos.controller.ts:168 | pos-inventory.service.ts createPassport | REAL | inventoryService.createPassport | |
| GET /legacy/pos/barcodes/lookup | pos.controller.ts:177 | pos-inventory.service.ts lookupBarcode | REAL | inventoryService.lookupBarcode | |
| POST /legacy/pos/barcodes | pos.controller.ts:185 | pos-inventory.service.ts assignBarcode | REAL | inventoryService.assignBarcode | |
| GET /legacy/pos/pdf-templates | pos.controller.ts:196 | pos-inventory.service.ts getPdfTemplates | REAL | inventoryService.getPdfTemplates | |
| GET /legacy/pos/pdf-templates/:id | pos.controller.ts:203 | pos-inventory.service.ts getPdfTemplateById | REAL | inventoryService.getPdfTemplateById | |
| POST /legacy/pos/pdf-templates | pos.controller.ts:210 | pos-inventory.service.ts createPdfTemplate | REAL | inventoryService.createPdfTemplate | |
| GET /pos/wms/warehouses | apps/api/src/modules/pos/presentation/pos-wms.controller.ts:33 | pos-wms-query.service.ts getWarehousesList | REAL | wmsQuery.getWarehousesList | |
| GET /pos/wms/materials | pos-wms.controller.ts:44 | pos-wms-query.service.ts searchMaterials | REAL | wmsQuery.searchMaterials | |
| GET /pos/wms/warehouse/:warehouseId/stock | pos-wms.controller.ts:66 | pos-wms-query.service.ts getWarehouseStockForWms | REAL | wmsQuery.getWarehouseStockForWms | |
| GET /pos/wms/warehouse/:warehouseId/movements | pos-wms.controller.ts:86 | pos-wms-query.service.ts getMovementHistoryForWms | REAL | wmsQuery.getMovementHistoryForWms | |
| GET /pos/wms/low-stock | pos-wms.controller.ts:109 | pos-wms-query.service.ts getLowStockForWms | REAL | wmsQuery.getLowStockForWms | |
| GET /pos/gl/movement/:id | apps/api/src/modules/pos/presentation/gl.controller.ts:35 | gl-posting-log.service.ts:26 | REAL | repo.getByMovement | |
| POST /pos/gl/approve/:movementId | gl.controller.ts:43 | gl-posting-log.service.ts:84 | REAL | approveByMovement + postToLedger→entries (line 106) | High-risk GL, verified ledger post |
| POST /pos/gl/entry/:id/approve | gl.controller.ts:54 | gl-posting-log.service.ts:59 | REAL | repo.approveEntry + postToLedger | |
| POST /pos/gl/entry/:id/reject | gl.controller.ts:64 | gl-posting-log.service.ts:72 | REAL | repo.rejectEntry | |
| GET /pos/gl/pending | gl.controller.ts:74 | gl-posting-log.service.ts:37 | REAL | repo.getPendingEntries | |
| GET /pos/gl/journal | gl.controller.ts:81 | gl-posting-log.service.ts:48 | REAL | repo.getJournal | |
| GET /pos/operations/warehouses | apps/api/src/modules/pos/presentation/pos-operations.controller.ts:68 | warehouse-config.service.ts:41 | REAL | listWarehouses + per-wh getWarehouseStock | |
| GET /pos/operations/warehouses/:id/stock | pos-operations.controller.ts:90 | warehouse-config.service.ts:58 | REAL | getWarehouseStock (warehouse_stock join) | |
| POST /pos/operations/warehouses/:id/issue | pos-operations.controller.ts:104 | warehouse-config.service.ts:94 | REAL | atomic warehouse_stock UPDATE + material_movements (112-128) | High-risk stock write verified |
| POST /pos/operations/warehouses/:id/receive | pos-operations.controller.ts:128 | warehouse-config.service.ts:147 | REAL | warehouse_stock upsert + material_movements (167-196) | High-risk stock write verified |
| GET /pos/operations/p2p/pending | pos-operations.controller.ts:152 | procurement-request.service.ts listRequests | REAL | listRequests({status:'approved'}) | |
| POST /pos/operations/p2p/:requestId/receive | pos-operations.controller.ts:173 | procurement-request.service.ts receiveProcurement | REAL | receiveProcurement (chek + warehouse prixod) | |
| GET /pos/operations/materials/:materialId/movements | pos-operations.controller.ts:196 | warehouse-config.service.ts:207 | REAL | getMaterialMovements | |
| GET /pos/stock | apps/api/src/modules/pos/presentation/stock.controller.ts:45 | stock-ledger.service.ts:101 | REAL | repo.getAllStockSummary | |
| POST /pos/stock/adjust | stock.controller.ts:52 | stock-ledger.service.ts:194 | REAL | adjustStock → recordEntry insert (205,47) | High-risk stock write verified |
| GET /pos/stock/low-alerts | stock.controller.ts:70 | stock-ledger.service.ts:150 | REAL | repo.getUnresolvedAlerts | |
| GET /pos/stock/expiry-alerts | stock.controller.ts:77 | stock-ledger.service.ts:183 | REAL | repo.getExpiryAlerts | |
| GET /pos/stock/movements | stock.controller.ts:90 | stock-ledger.service.ts:139 | REAL | repo.getMovements | |
| GET /pos/stock/:warehouseId/:materialId | stock.controller.ts:103 | stock-ledger.service.ts:90 | REAL | repo.getBalance | |
| GET /pos/inventory/low-stock | apps/api/src/modules/pos/presentation/pos-stub.controller.ts:47 | stock-ledger.service.ts:114 | REAL | getLowStock (ledger summary filter) | |
| GET /pos/inventory/movements | pos-stub.controller.ts:53 | stock-ledger.service.ts:139 | REAL | getMovements | |
| GET /pos/inventory/monthly-report | pos-stub.controller.ts:65 | stock-ledger.service.ts:127 | REAL | getMonthlyReport | |
| PATCH /pos/inventory/:productId/adjust | pos-stub.controller.ts:75 | pos-stub.controller.ts:85 | REAL | raw INSERT pos_stock_ledger; returns rowsWritten | CATCH-SWALLOW (line 91) but returns adjusted:false on fail (not fake success); legacy shim, writes ledger not canonical warehouse_stock |
| POST /pos/sync/push | apps/api/src/modules/pos/presentation/sync.controller.ts:49 | pos-sync.service.ts push | REAL | syncService.push (idempotency) | |
| POST /pos/sync/pull | sync.controller.ts:60 | pos-sync.service.ts pull | REAL | syncService.pull | |
| GET /pos/sync/status | sync.controller.ts:68 | pos-sync.service.ts getStatus | REAL | syncService.getStatus | |
| GET /pos/requests | apps/api/src/modules/pos/presentation/requests.controller.ts:48 | pos-request.service.ts findAll | REAL | requestService.findAll | |
| GET /pos/requests/:id | requests.controller.ts:57 | pos-request.service.ts findOne | REAL | requestService.findOne | |
| POST /pos/requests | requests.controller.ts:66 | pos-request.service.ts createRequest | REAL | requestService.createRequest | |
| PATCH /pos/requests/approve | requests.controller.ts:75 | pos-request.service.ts approveRequest | REAL | requestService.approveRequest | |
| PATCH /pos/requests/reject | requests.controller.ts:84 | pos-request.service.ts rejectRequest | REAL | requestService.rejectRequest | |
| POST /pos/requests/issue | requests.controller.ts:93 | pos-request.service.ts issueFromRequest | REAL | issueFromRequest (INTERNAL_ISSUE movement) | |
| GET /pos/procurement/approval-chain/:employeeId | apps/api/src/modules/pos/presentation/procurement.controller.ts:36 | procurement-approval-chain.service.ts resolveChainForEmployee | REAL | approvalChain.resolveChainForEmployee | |
| POST /pos/procurement/requests | procurement.controller.ts:44 | procurement-request.service.ts createRequest | REAL | requestService.createRequest | |
| GET /pos/procurement/requests | procurement.controller.ts:54 | procurement-request.service.ts listRequests | REAL | requestService.listRequests | |
| GET /pos/procurement/requests/:id | procurement.controller.ts:70 | procurement-request.service.ts getRequest | REAL | requestService.getRequest | |
| POST /pos/procurement/requests/:id/decide | procurement.controller.ts:78 | procurement-request.service.ts decideApproval | REAL | requestService.decideApproval | |
| POST /pos/procurement/requests/:id/receive | procurement.controller.ts:89 | procurement-request.service.ts receiveProcurement | DUPLICATE | same service.receiveProcurement as POST /pos/operations/p2p/:requestId/receive | |
| POST /pos/barcode/scan | apps/api/src/modules/pos/presentation/barcode.controller.ts:48 | pos-barcode.service.ts scanBarcode | REAL | barcodeService.scanBarcode | |
| GET /pos/barcode/lookup | barcode.controller.ts:57 | pos-barcode.service.ts lookupByBarcode | REAL | barcodeService.lookupByBarcode | |
| POST /pos/barcode/assign | barcode.controller.ts:70 | pos-barcode.service.ts assignBarcode | REAL | barcodeService.assignBarcode | |
| POST /pos/barcode/print | barcode.controller.ts:79 | pos-barcode.service.ts queuePrint | REAL | barcodeService.queuePrint | |
| POST /pos/barcode/generate-ean13 | barcode.controller.ts:88 | pos-barcode.service.ts generateEan13 | REAL | pure GS1 compute (no DB, real algo) | |
| POST /pos/barcode/ai-suggestion/review | barcode.controller.ts:97 | pos-barcode.service.ts reviewAiSuggestion | REAL | barcodeService.reviewAiSuggestion | |
| GET /pos/barcode/ai-suggestion/pending | barcode.controller.ts:106 | barcode.controller.ts:109 | GREEN-LIE | returns hardcoded `{message:'GET /pos/barcode/ai-suggestion/pending'}` — no DB query; claims to list pending AI suggestions but does nothing | |
| GET /pos/employees/:userId/balance | apps/api/src/modules/pos/presentation/employee.controller.ts:57 | employee-ledger.service.ts getEmployeeBalance | REAL | ledgerService.getEmployeeBalance | |
| GET /pos/employees/me/balance | employee.controller.ts:72 | employee-ledger.service.ts getEmployeeBalance | REAL | ledgerService.getEmployeeBalance | |
| GET /pos/employees/department/:code/balance | employee.controller.ts:84 | employee-ledger.service.ts getDepartmentBalance | REAL | ledgerService.getDepartmentBalance | |
| GET /pos/employees/:userId/statement | employee.controller.ts:93 | employee-ledger.service.ts getEmployeeStatement | REAL | ledgerService.getEmployeeStatement | |
| POST /pos/employees/write-off | employee.controller.ts:109 | employee-write-off.service.ts createWriteOffAct | REAL | writeOffService.createWriteOffAct | |
| POST /pos/employees/liability | employee.controller.ts:127 | employee-ledger.service.ts openLiabilityCase | REAL | ledgerService.openLiabilityCase | |
| PATCH /pos/employees/liability/:id | employee.controller.ts:145 | employee-write-off.service.ts updateLiabilityCase | REAL | writeOffService.updateLiabilityCase | |
| POST /pos/employees/dismiss-check | employee.controller.ts:167 | employee.controller.ts:170 | REAL | aggregates getEmployeeBalance + getOpenLiabilityCases (real reads) | Controller-side aggregation |
| GET /pos/employees/me/inventory | employee.controller.ts:192 | pos-employee-balance.service.ts getMyInventory | REAL | employeeBalanceSvc.getMyInventory | |
| GET /pos/employees/me/inventory/pdf | employee.controller.ts:202 | pos-pdf.service.ts generateEmployeeInventoryPdf | REAL | real PDF; on error sends 0-byte 200 (Buffer.alloc(0)) | Minor: silent empty PDF on failure (line 210) |
| GET /pos/employees/me/checklist | employee.controller.ts:220 | pos-employee-balance.service.ts getHRChecklist | REAL | employeeBalanceSvc.getHRChecklist | |
| POST /pos/employees/me/return | employee.controller.ts:229 | pos-employee-balance.service.ts requestReturn | REAL | employeeBalanceSvc.requestReturn | |
| GET /pos/employees/:id/hr-check | employee.controller.ts:248 | pos-employee-balance.service.ts checkHRBlock | REAL | employeeBalanceSvc.checkHRBlock | |
| GET /pos/inventory-counts/variance-config | apps/api/src/modules/pos/presentation/inventory-count.controller.ts:61 | pos-variance-config.service.ts getThreshold | REAL | varianceConfig.getThreshold | |
| PATCH /pos/inventory-counts/variance-config | inventory-count.controller.ts:69 | pos-variance-config.service.ts setThreshold | REAL | varianceConfig.setThreshold | |
| GET /pos/inventory-counts | inventory-count.controller.ts:81 | pos-inventory-count.service.ts findAll | REAL | countService.findAll | |
| POST /pos/inventory-counts | inventory-count.controller.ts:90 | pos-inventory-count.service.ts createCount | REAL | countService.createCount (snapshot) | |
| POST /pos/inventory-counts/lines/record | inventory-count.controller.ts:99 | pos-inventory-count.service.ts recordActualQty | REAL | countService.recordActualQty | |
| POST /pos/inventory-counts/lines/bulk-record | inventory-count.controller.ts:106 | pos-inventory-count.service.ts bulkRecordActualQty | REAL | countService.bulkRecordActualQty | |
| GET /pos/inventory-counts/:id/variance | inventory-count.controller.ts:115 | pos-inventory-count.service.ts getVarianceReport | REAL | countService.getVarianceReport | |
| GET /pos/inventory-counts/:id/variance-decision | inventory-count.controller.ts:124 | pos-inventory-count.service.ts evaluateVarianceDecision | REAL | countService.evaluateVarianceDecision | |
| PATCH /pos/inventory-counts/approve | inventory-count.controller.ts:133 | pos-inventory-count.service.ts approveCount | REAL | countService.approveCount (GL adjust) | |
| GET /pos/inventory-counts/:id/pdf | inventory-count.controller.ts:142 | pos-pdf.service.ts generateInventoryCountPdf | REAL | pdfService.generateInventoryCountPdf | |
| POST /pos/inventory-passport | apps/api/src/modules/pos/presentation/inventory-passport.controller.ts:27 | pos-inventory-passport.service.ts createPassport | REAL | svc.createPassport | |
| GET /pos/inventory-passport/quarantine | inventory-passport.controller.ts:34 | pos-inventory-passport.service.ts getQuarantineList | REAL | svc.getQuarantineList | |
| GET /pos/inventory-passport/:movementId | inventory-passport.controller.ts:41 | pos-inventory-passport.service.ts getPassport | REAL | svc.getPassport | |
| GET /pos/inventory-passport | inventory-passport.controller.ts:48 | pos-inventory-passport.service.ts listPassports | REAL | svc.listPassports | |
| POST /pos/inventory-passport/:movementId/qc-decision | inventory-passport.controller.ts:65 | pos-inventory-passport.service.ts recordQcDecision | REAL | svc.recordQcDecision | |
| GET /pos/material-norms | apps/api/src/modules/pos/presentation/material-norms.controller.ts:78 | material-norms.service.ts list | ORPHAN | service.list is REAL but 0 FE callers (grep material-norms=0) | |
| GET /pos/material-norms/:id | material-norms.controller.ts:93 | material-norms.service.ts getById | ORPHAN | REAL impl, no callers | |
| POST /pos/material-norms | material-norms.controller.ts:101 | material-norms.service.ts create | ORPHAN | REAL impl, no callers | |
| PATCH /pos/material-norms/:id | material-norms.controller.ts:119 | material-norms.service.ts update | ORPHAN | REAL impl, no callers | |
| DELETE /pos/material-norms/:id | material-norms.controller.ts:127 | material-norms.service.ts deactivate | ORPHAN | REAL soft-delete, no callers | |
| POST /pos/material-norms/ai-recalculate | material-norms.controller.ts:134 | material-norms.service.ts recalculateAi | ORPHAN | REAL (historical consumption calc), no callers | |
| GET /pos/mini-app/history | apps/api/src/modules/pos/presentation/mini-app-history.controller.ts:35 | pos-mini-app.service.ts getHistory | REAL | miniAppService.getHistory (session-gated) | |
| GET /pos/mini-app/pending-approvals | mini-app-history.controller.ts:49 | pos-mini-app.service.ts getPendingApprovals | REAL | miniAppService.getPendingApprovals | |
| GET /pos/mini-app/warehouses | mini-app-history.controller.ts:57 | pos-mini-app.service.ts getWarehouses | REAL | miniAppService.getWarehouses | |
| POST /pos/mini-app/auth | apps/api/src/modules/pos/presentation/mini-app.controller.ts:67 | pos-telegram.service.ts createOrRenewSession | REAL | telegramService.createOrRenewSession | |
| POST /pos/mini-app/barcode/scan | mini-app.controller.ts:84 | pos-barcode.service.ts scanBarcode | REAL | barcodeService.scanBarcode | |
| GET /pos/mini-app/materials | mini-app.controller.ts:92 | pos-mini-app.service.ts searchMaterials | REAL | miniAppService.searchMaterials | |
| POST /pos/mini-app/requests | mini-app.controller.ts:100 | pos-request.service.ts createRequest | REAL | requestService.createRequest | |
| PATCH /pos/mini-app/requests/:id/approve | mini-app.controller.ts:108 | pos-request.service.ts approveRequest | REAL | requestService.approveRequest | |
| PATCH /pos/mini-app/requests/:id/reject | mini-app.controller.ts:116 | pos-request.service.ts rejectRequest | REAL | requestService.rejectRequest | |
| GET /pos/anomalies | apps/api/src/modules/pos/presentation/pos-anomalies.controller.ts:45 | pos-anomaly.service.ts listAnomalies | REAL | anomaly.listAnomalies (empty when table empty, no fake) | |
| GET /pos/anomalies/:id | pos-anomalies.controller.ts:56 | pos-anomaly.service.ts getById | REAL | anomaly.getById | |
| POST /pos/auth/login | apps/api/src/modules/pos/presentation/pos-auth.controller.ts:36 | pos-auth.service.ts login | REAL | posAuthService.login | |
| POST /pos/auth/validate | pos-auth.controller.ts:56 | pos-auth.controller.ts:61 | REAL | role-set check on JWT user (real gate, no DB needed) | |
| GET /pos/auth/ping | pos-auth.controller.ts:70 | pos-auth.controller.ts:73 | REAL | static liveness probe (legit health) | |
| GET /pos/notifications | apps/api/src/modules/pos/presentation/pos-notifications.controller.ts:35 | pos-notifications.service.ts getForUser | REAL | notificationsService.getForUser | |
| POST /pos/notifications/:id/read | pos-notifications.controller.ts:42 | pos-notifications.service.ts markRead | REAL | notificationsService.markRead | |
| POST /pos/notifications/read-all | pos-notifications.controller.ts:52 | pos-notifications.service.ts markAllRead | REAL | notificationsService.markAllRead | |
| POST /v2/pos/printer-config/:id/test | apps/api/src/modules/pos/presentation/pos-printer-config-v2.controller.ts:31 | pos-printer-config.service.ts getForTest + label.service.ts sendToPrinter | DUPLICATE | v2 alias of POST /pos/printer-config/:id/test (self-doc "v2 alias") | Real TCP printer test |
| GET /pos/printer-config | apps/api/src/modules/pos/presentation/printer-config.controller.ts:38 | pos-printer-config.service.ts getAll | REAL | svc.getAll | |
| GET /pos/printer-config/active | printer-config.controller.ts:44 | label.service.ts getPrinterConfig | REAL | labelService.getPrinterConfig (fallback default if none) | |
| POST /pos/printer-config | printer-config.controller.ts:52 | pos-printer-config.service.ts create | REAL | svc.create | |
| PATCH /pos/printer-config/:id | printer-config.controller.ts:59 | pos-printer-config.service.ts update | REAL | svc.update | |
| POST /pos/printer-config/:id/test | printer-config.controller.ts:69 | label.service.ts sendToPrinter | REAL | real TCP connect test | |
| GET /pos/reports/kpi | apps/api/src/modules/pos/presentation/reports.controller.ts:30 | pos-reports.service.ts getKpi | REAL | reportsService.getKpi | |
| GET /pos/reports/stock | reports.controller.ts:37 | pos-reports.service.ts getStockReport | REAL | reportsService.getStockReport | |
| GET /pos/reports/movement-stats | reports.controller.ts:49 | pos-reports.service.ts getMovementStats | REAL | reportsService.getMovementStats | |
| GET /pos/reports/top-materials | reports.controller.ts:57 | pos-reports.service.ts getTopMaterials | REAL | reportsService.getTopMaterials | |
| GET /pos/reports/audit | reports.controller.ts:64 | pos-audit.service.ts getAuditLog | REAL | auditService.getAuditLog | |
| GET /pos/reports/three-way-match | reports.controller.ts:89 | pos-reports.service.ts getThreeWayMismatch | REAL | reportsService.getThreeWayMismatch | |
| GET /pos/reports/liabilities | reports.controller.ts:96 | pos-reports.service.ts getLiabilityReport | REAL | reportsService.getLiabilityReport | |
| GET /pos/reports/abc-analysis | reports.controller.ts:103 | pos-reports.service.ts getAbcAnalysis | REAL | reportsService.getAbcAnalysis | |
| GET /pos/reports/inactive-materials | reports.controller.ts:111 | pos-reports.service.ts getInactiveMaterials | REAL | reportsService.getInactiveMaterials | |
| GET /pos/handovers | apps/api/src/modules/pos/presentation/shift-handover.controller.ts:41 | pos-shift-handover.service.ts findAll | REAL | service.findAll | |
| GET /pos/handovers/pallets/balance | shift-handover.controller.ts:50 | pos-shift-handover.service.ts getPalletBalance | REAL | service.getPalletBalance | |
| GET /pos/handovers/:id | shift-handover.controller.ts:59 | pos-shift-handover.service.ts findOne | REAL | service.findOne | |
| POST /pos/handovers | shift-handover.controller.ts:67 | pos-shift-handover.service.ts createHandover | REAL | service.createHandover | |
| POST /pos/handovers/:id/sign | shift-handover.controller.ts:77 | pos-shift-handover.service.ts sign | REAL | service.sign (2-signature gate) | |
| POST /pos/handovers/:id/cancel | shift-handover.controller.ts:91 | pos-shift-handover.service.ts cancel | REAL | service.cancel | |
| POST /pos/handovers/pallets | shift-handover.controller.ts:105 | pos-shift-handover.service.ts recordPallet | REAL | service.recordPallet | |
| POST /pos/barcode/generate | apps/api/src/modules/pos/presentation/stock-issuable.controller.ts:56 | pos-stock-issuable.service.ts generateInboundBarcode | REAL | issuableService.generateInboundBarcode (seq + label) | |
| GET /pos/stock/issuable/:barcode | stock-issuable.controller.ts:79 | pos-stock-issuable.service.ts getIssuable | REAL | issuableService.getIssuable (reservation gate) | |
| GET /pos/warehouse-config/types | apps/api/src/modules/pos/presentation/warehouse-config.controller.ts:26 | warehouse-config.service.ts:24 | REAL | svc.listTypes | |
| GET /pos/warehouse-config/warehouses | warehouse-config.controller.ts:34 | warehouse-config.service.ts:41 | REAL | svc.listWarehouses | |
| GET /pos/warehouse-config/warehouses/:id/stock | warehouse-config.controller.ts:43 | warehouse-config.service.ts:58 | REAL | svc.getWarehouseStock | |
| GET /pos/warehouse-config/materials/:materialId/movements | warehouse-config.controller.ts:51 | warehouse-config.service.ts:207 | DUPLICATE | same getMaterialMovements as GET /pos/operations/materials/:materialId/movements | |
| GET /pos/warehouse-config/dashboard | warehouse-config.controller.ts:59 | warehouse-config.service.ts:227 | REAL | svc.getDashboard | |
| GET /pos/wh-features/warehouse/:warehouseId/employees | apps/api/src/modules/pos/presentation/warehouse-features.controller.ts:55 | warehouse-employees.service.ts listByWarehouse | REAL | employees.listByWarehouse | |
| GET /pos/wh-features/user/:userId/warehouses | warehouse-features.controller.ts:63 | warehouse-employees.service.ts listByUser | REAL | employees.listByUser | |
| POST /pos/wh-features/warehouse/:warehouseId/employees | warehouse-features.controller.ts:70 | warehouse-employees.service.ts assign | REAL | employees.assign | |
| DELETE /pos/wh-features/employees/:assignmentId | warehouse-features.controller.ts:93 | warehouse-employees.service.ts remove | REAL | employees.remove | |
| POST /pos/wh-features/movement/:movementId/auto-barcode | warehouse-features.controller.ts:105 | auto-barcode.service.ts generateForMovement | REAL | autoBarcode.generateForMovement | |
| GET /pos/wh-features/movement/:movementId/barcodes | warehouse-features.controller.ts:112 | auto-barcode.service.ts listForMovement | REAL | autoBarcode.listForMovement | |
| GET /pos/wh-features/material/:materialId/profile | warehouse-features.controller.ts:121 | material-360.service.ts getProfile | REAL | material360.getProfile | |
| POST /pos/wh-features/movement/:movementId/gl-post | warehouse-features.controller.ts:133 | auto-gl-posting.service.ts:77 | REAL | autoGl.postForMovement → atomic pos_gl_postings insert (112) | High-risk GL verified |
| GET /pos/wh-features/movement/:movementId/gl-postings | warehouse-features.controller.ts:140 | auto-gl-posting.service.ts:135 | REAL | autoGl.listForMovement | |
| POST /pos/wh-features/movement/:movementId/gl-approve | warehouse-features.controller.ts:147 | auto-gl-posting.service.ts:143 | REAL | autoGl.approveForMovement (repo update is_approved) | |
| GET /pos/wh-features/gl/journal | warehouse-features.controller.ts:157 | auto-gl-posting.service.ts:150 | REAL | autoGl.getJournal | |
| GET /pos/wh-features/kpi/warehouses | warehouse-features.controller.ts:175 | warehouse-kpi.service.ts getWarehouseKpis | REAL | kpi.getWarehouseKpis | |
| GET /pos/wh-features/kpi/system | warehouse-features.controller.ts:182 | warehouse-kpi.service.ts getSystemKpi | REAL | kpi.getSystemKpi | |
| GET /pos/wh-features/grn | warehouse-features.controller.ts:191 | goods-receipt.service.ts findAll | REAL | grn.findAll | |
| POST /pos/wh-features/grn | warehouse-features.controller.ts:209 | goods-receipt.service.ts create | REAL | grn.create | |
| POST /pos/wh-features/grn/:id/approve | warehouse-features.controller.ts:230 | goods-receipt.service.ts approve | REAL | grn.approve | |
| GET /pos/wh-features/quarantine | warehouse-features.controller.ts:242 | quarantine-workflow.service.ts listQuarantine | REAL | quarantine.listQuarantine (parallels inventory-passport quarantine, different service) | |
| POST /pos/wh-features/movement/:id/move-to-quarantine | warehouse-features.controller.ts:249 | quarantine-workflow.service.ts moveToQuarantine | REAL | quarantine.moveToQuarantine | |
| POST /pos/wh-features/movement/:id/qc-decision | warehouse-features.controller.ts:256 | quarantine-workflow.service.ts qcDecision | REAL | quarantine.qcDecision | |
| GET /pos/wh-features/three-way-match/variances | warehouse-features.controller.ts:269 | three-way-match.service.ts listVariances | REAL | threeWay.listVariances | |
| POST /pos/wh-features/three-way-match | warehouse-features.controller.ts:276 | three-way-match.service.ts match | REAL | threeWay.match | |
| POST /pos/wh-features/three-way-match/auto | warehouse-features.controller.ts:296 | three-way-match.service.ts autoMatchAll | REAL | threeWay.autoMatchAll | |
| GET /pos/my-warehouses | apps/api/src/modules/pos/presentation/warehouse-open.controller.ts:42 | warehouse-open.service.ts getMyWarehouses | REAL | service.getMyWarehouses | |
| GET /pos/label-config | warehouse-open.controller.ts:50 | warehouse-open.service.ts listLabelConfigs | REAL | service.listLabelConfigs | |
| GET /pos/label-config/warehouse/:id | warehouse-open.controller.ts:58 | warehouse-open.service.ts getLabelConfigByWarehouse | REAL | service.getLabelConfigByWarehouse | |
| GET /pos/label-config/:type | warehouse-open.controller.ts:66 | warehouse-open.service.ts getLabelConfig | REAL | service.getLabelConfig (default if none) | |
| PATCH /pos/label-config | warehouse-open.controller.ts:74 | warehouse-open.service.ts upsertLabelConfig | REAL | service.upsertLabelConfig (real upsert) | |
| GET /logistics | apps/api/src/modules/logistics/presentation/logistics.controller.ts:62 | get-deliveries.query handler | REAL | queryBus GetDeliveriesQuery | |
| GET /logistics/:id | logistics.controller.ts:85 | i-delivery.repo findById | REAL | deliveryRepo.findById (404 if null) | |
| POST /logistics | logistics.controller.ts:96 | dispatch-delivery.command handler | REAL | commandBus DispatchDeliveryCommand | |
| PATCH /logistics/:id/assign-driver | logistics.controller.ts:112 | assign-driver.command handler | REAL | commandBus AssignDriverCommand | |
| PATCH /logistics/:id/complete | logistics.controller.ts:129 | logistics.controller.ts:137 | REAL | deliveryRepo.update(DELIVERED) + emit DELIVERY_COMPLETED | On update failure only logs warn, returns 200 updated:false (reports flag, not fake) |
| POST /order-workflow/orders | apps/api/src/modules/order-workflow/presentation/order-workflow.controller.ts:52 | create-order.handler | ORPHAN | REAL CQRS command handler but 0 FE/backend HTTP callers (grep order-workflow=0) | |
| PATCH /order-workflow/orders/:id/status | order-workflow.controller.ts:73 | transition-status.handler | ORPHAN | REAL transition handler, no callers | |
| POST /order-workflow/orders/:id/payment-plan | order-workflow.controller.ts:92 | create-payment-plan.handler | ORPHAN | REAL handler, no callers | |
| GET /order-workflow/orders/:id/saga-status | order-workflow.controller.ts:107 | get-order-saga.handler | ORPHAN | REAL query handler, no callers | |
| GET /order-workflow/orders | order-workflow.controller.ts:123 | list-orders.handler | ORPHAN | REAL query handler, no callers | |


---

## Director + QC

Scope: every `@Get/@Post/@Put/@Patch/@Delete` in every `*.controller.ts` under `apps/api/src/modules/director` (18 controllers) and `apps/api/src/modules/qc` (10 controllers). 249 routes total. High-risk focus (dashboard/KPI MOCK, approval/HITL no-op) verified: all KPI/dashboard endpoints run real SQL; all approve/reject handlers perform real DB writes (no green-lies found). Note: the once-reported "approve echoes `{approved:true}`" green-lie in qc-defects is now fixed — `_setQcStatus` does a real UPDATE + 404 (file:line 61-66).

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /analytics/stats | apps/api/src/modules/director/analytics/analytics.controller.ts:25 | analytics.service.ts:18 | REAL | repo.findStats + findLeaderboardEmployees (analytics.repository.ts) | LMS analytics; empty-fallback on DB error |
| GET /analytics/course-progress | analytics.controller.ts:30 | analytics.service.ts:24 | REAL | repo.findCourseProgress | |
| GET /analytics/user-activity | analytics.controller.ts:35 | analytics.service.ts:30 | REAL | repo.findUserActivity | |
| GET /analytics/test-results | analytics.controller.ts:40 | analytics.service.ts:36 | REAL | repo.findTestResults | |
| GET /analytics/learning-outcomes | analytics.controller.ts:45 | analytics.service.ts:42 | REAL | repo.findLearningOutcomes | |
| GET /analytics/funnel | analytics.controller.ts:50 | analytics.service.ts:48 | REAL | repo.findFunnel | |
| GET /analytics/by-department | analytics.controller.ts:55 | analytics.service.ts:54 | REAL | repo.findByDepartment | |
| GET /analytics/by-position | analytics.controller.ts:60 | analytics.service.ts:60 | REAL | repo.findByPosition | |
| GET /analytics/leaderboard/employees | analytics.controller.ts:65 | analytics.service.ts:66 | REAL | repo.findLeaderboardEmployees | |
| GET /analytics/leaderboard/departments | analytics.controller.ts:70 | analytics.service.ts:72 | REAL | repo.findLeaderboardDepartments | |
| GET /analytics/leaderboard/courses | analytics.controller.ts:75 | analytics.service.ts:78 | REAL | repo.findLeaderboardCourses | |
| GET /analytics/engagement/active-users | analytics-extended.controller.ts:25 | analytics-extended.service.ts:17 | REAL | repo.findActiveUsers | |
| GET /analytics/engagement/activity-trend | analytics-extended.controller.ts:30 | analytics-extended.service.ts:22 | REAL | repo.findActivityTrend | |
| GET /analytics/engagement/retention | analytics-extended.controller.ts:35 | analytics-extended.service.ts:27 | REAL | repo.findRetention | |
| GET /analytics/engagement/sessions | analytics-extended.controller.ts:40 | analytics-extended.service.ts:32 | REAL | repo.findSessionStats | |
| GET /analytics/assessment/difficulty | analytics-extended.controller.ts:45 | analytics-extended.service.ts:37 | REAL | repo.findDifficultyAnalysis | |
| GET /analytics/assessment/discrimination | analytics-extended.controller.ts:50 | analytics-extended.service.ts:42 | REAL | repo.findDiscriminationData | |
| GET /analytics/assessment/reliability | analytics-extended.controller.ts:55 | analytics-extended.service.ts:52 | REAL | repo.findReliabilityData (Cronbach) | |
| GET /analytics/assessment/item-analysis | analytics-extended.controller.ts:60 | analytics-extended.service.ts:57 | REAL | repo.findItemAnalysis | |
| GET /analytics/mentorships-stats | analytics-extended.controller.ts:65 | analytics-extended.service.ts:62 | REAL | repo.findMentorshipsStats | |
| GET /analytics/events-stats | analytics-extended.controller.ts:70 | analytics-extended.service.ts:67 | REAL | repo.findEventsStats | |
| GET /analytics/applications-stats | analytics-extended.controller.ts:75 | analytics-extended.service.ts:72 | REAL | repo.findApplicationsStats | |
| GET /analytics/surveys-stats | analytics-extended.controller.ts:80 | analytics-extended.service.ts:77 | REAL | repo.findSurveysStats | |
| GET /analytics/broadcasts-stats | analytics-extended.controller.ts:85 | analytics-extended.service.ts:82 | REAL | repo.findBroadcastsStats | |
| GET /analytics/skills-stats | analytics-extended.controller.ts:90 | analytics-extended.service.ts:87 | REAL | repo.findSkillsStats | |
| GET /analytics/employee-stats | analytics-extended.controller.ts:95 | analytics-extended.service.ts:92 | REAL | repo.findEmployeeStats | |
| GET /analytics/ai-general-analysis | analytics-extended.controller.ts:100 | analytics-extended.service.ts:97 | REAL | repo.findAiGeneralAnalysis (DB-derived text, not hardcoded) | |
| GET /analytics/score-distribution | analytics-extended.controller.ts:105 | analytics-extended.service.ts:102 | REAL | repo.findScoreDistribution | |
| GET /analytics/skills-matrix | analytics-extended.controller.ts:110 | analytics-extended.service.ts:107 | REAL | repo.findSkillsMatrix | |
| GET /director/approvals | presentation/approvals.controller.ts:66 | queries/get-pending-approvals.handler.ts | REAL | queryBus GetPendingApprovalsQuery | |
| GET /director/approvals/pending | approvals.controller.ts:85 | get-pending-approvals.handler.ts | DUPLICATE | identical query to GET /director/approvals (approvals.controller.ts:66) | same body copy-pasted |
| GET /director/approvals/stats | approvals.controller.ts:104 | i-approval.repo getStats | REAL | approvalRepo.getStats() (drizzle-approval.repo.ts) | |
| GET /director/approvals/history | approvals.controller.ts:118 | queries/get-approval-history.handler.ts | REAL | queryBus GetApprovalHistoryQuery | |
| POST /director/approvals | approvals.controller.ts:138 | commands/create-approval-request.handler.ts | REAL | commandBus CreateApprovalRequestCommand → repo insert | |
| GET /director/approvals/:id/steps | approvals.controller.ts:159 | approval-steps.repository.ts listByRequest | REAL | stepsRepo.listByRequest() | |
| PATCH /director/approvals/:id/approve | approvals.controller.ts:167 | commands/approve-request.handler.ts:31 | REAL | approvalRepo.update + eventBus.publish HitlApprovedEvent | HITL write confirmed real |
| PATCH /director/approvals/:id/reject | approvals.controller.ts:177 | commands/reject-request.handler.ts | REAL | commandBus RejectRequestCommand → repo update + event | |
| GET /coordination/councils | presentation/coordination.controller.ts:41 | inline raw SQL:45 | REAL | SELECT ... FROM councils (raw SQL) | |
| PATCH /coordination/councils/:id | coordination.controller.ts:62 | coordination.service.ts updateCouncilWithAuth | REAL | svc.updateCouncilWithAuth | |
| GET /coordination/baskets | coordination.controller.ts:84 | coordination.service.ts getBaskets | REAL | svc.getBaskets | |
| POST /coordination/dokla | coordination.controller.ts:92 | coordination.service.ts createDoklaWithValidation | REAL | svc.createDoklaWithValidation | |
| GET /coordination/dokla | coordination.controller.ts:103 | coordination.service.ts listDokla | REAL | svc.listDokla | |
| PATCH /coordination/dokla/:id | coordination.controller.ts:111 | coordination.service.ts updateDoklaWithAuth | REAL | svc.updateDoklaWithAuth | |
| DELETE /coordination/dokla/:id | coordination.controller.ts:125 | coordination.service.ts deleteDoklaWithAuth | REAL | svc.deleteDoklaWithAuth | |
| POST /coordination/rasporyazhenie | coordination.controller.ts:136 | coordination.service.ts createRaspWithValidation | REAL | svc.createRaspWithValidation | |
| GET /coordination/rasporyazhenie | coordination.controller.ts:147 | coordination.service.ts listRasporyazhenie | REAL | svc.listRasporyazhenie | |
| PATCH /coordination/rasporyazhenie/:id/done | coordination.controller.ts:155 | coordination.service.ts markRaspDoneWithAuth | REAL | svc.markRaspDoneWithAuth | |
| PATCH /coordination/dokla/:id/read | coordination.controller.ts:168 | coordination.service.ts updateDoklaWithAuth | REAL | svc.updateDoklaWithAuth('read') | |
| PATCH /coordination/dokla/:id/resolved | coordination.controller.ts:179 | coordination.service.ts updateDoklaWithAuth | REAL | svc.updateDoklaWithAuth('resolved') | |
| PATCH /coordination/rasporyazhenie/:id | coordination.controller.ts:190 | coordination.service.ts updateRaspWithAuth | REAL | svc.updateRaspWithAuth | |
| DELETE /coordination/rasporyazhenie/:id | coordination.controller.ts:204 | coordination.service.ts deleteRaspWithAuth | REAL | svc.deleteRaspWithAuth | |
| GET /coordination/stats | coordination.controller.ts:214 | coordination.service.ts getStats | REAL | svc.getStats | |
| GET /coordination/users-for-select | coordination.controller.ts:221 | inline raw SQL:226 | REAL | SELECT ... FROM employees JOIN users | |
| GET /prikaz | presentation/coordination-docs.controller.ts:55 | prikaz.repository.ts list | REAL | repo.list() | |
| GET /prikaz/:id | coordination-docs.controller.ts:59 | prikaz.repository.ts getById | REAL | repo.getById() | |
| POST /prikaz | coordination-docs.controller.ts:63 | prikaz.repository.ts create | REAL | repo.create() draft | |
| PATCH /prikaz/:id | coordination-docs.controller.ts:71 | prikaz.repository.ts updateDraft | REAL | repo.updateDraft (immutable after sign) | assertOk before {success:true} |
| POST /prikaz/:id/sign | coordination-docs.controller.ts:78 | prikaz.repository.ts sign | REAL | repo.sign() assigns number | |
| POST /prikaz/:id/cancel | coordination-docs.controller.ts:82 | prikaz.repository.ts cancel | REAL | repo.cancel() | |
| GET /protocols | coordination-docs.controller.ts:100 | protocol.repository.ts list | REAL | repo.list() | |
| GET /protocols/:id | coordination-docs.controller.ts:104 | protocol.repository.ts getById | REAL | repo.getById() | |
| POST /protocols | coordination-docs.controller.ts:108 | protocol.repository.ts create | REAL | repo.create() | |
| PATCH /protocols/:id | coordination-docs.controller.ts:115 | protocol.repository.ts updateDraft | REAL | repo.updateDraft | |
| POST /protocols/:id/sign | coordination-docs.controller.ts:122 | protocol.repository.ts sign | REAL | repo.sign() | |
| POST /protocols/:id/amend | coordination-docs.controller.ts:126 | protocol.repository.ts amend | REAL | repo.amend() new correction protocol | |
| GET /councils/:councilId/members | presentation/council-members.controller.ts:40 | council-members.repository.ts listByCouncil | REAL | repo.listByCouncil() | |
| POST /councils/:councilId/members | council-members.controller.ts:48 | council-members.repository.ts add | REAL | repo.add() upsert | |
| PATCH /council-members/:id | council-members.controller.ts:57 | council-members.repository.ts updateRole | REAL | repo.updateRole() | |
| DELETE /council-members/:id | council-members.controller.ts:66 | council-members.repository.ts remove | REAL | repo.remove() | |
| GET /director/dashboard | presentation/dashboard.controller.ts:51 | director-data.service + dashboard-query.service | REAL | Promise.all of getDashboard/getPlanFact/... real repos | aiInsights:[] deferred (documented) |
| GET /director/dashboard/plan-fact | dashboard.controller.ts:78 | dashboard-query.service.ts:161 | REAL | statRepo.getPlanFact | |
| GET /director/dashboard/order-progress | dashboard.controller.ts:85 | dashboard-query.service.ts:166 | REAL | statRepo.getOrderProgress | |
| GET /director/dashboard/stat-trends | dashboard.controller.ts:92 | dashboard-query.service.ts:171 | REAL | statRepo.getStatTrends | |
| GET /director/dashboard/open-issues | dashboard.controller.ts:99 | dashboard-query.service.ts:176 | REAL | statRepo.getOpenIssues | |
| GET /director/dashboard/kpis | dashboard.controller.ts:106 | queries/get-dashboard-kpis.handler.ts:38 | REAL | real SQL: sales_orders/invoices/production_orders/qc_inspections/warehouse_stock | high-risk verified NOT mock |
| GET /director/dashboard/production-summary | dashboard.controller.ts:113 | dashboard-query.service.ts:99 | REAL | repo getActivePoCount/CompletedToday/AvgOee | |
| GET /director/dashboard/finance-summary | dashboard.controller.ts:120 | dashboard-query.service.ts:115 | REAL | repo getMonthlyRevenue/TopUnpaid/AdvancePending | |
| GET /director/dashboard/hr-summary | dashboard.controller.ts:127 | dashboard-query.service.ts:143 | REAL | repo getAttendanceToday/OpenPayrollCount | |
| GET /director/dashboard/kpi-definitions | dashboard.controller.ts:142 | inline rawSql:146 | REAL | SELECT FROM kpi_definitions | |
| PATCH /director/dashboard/kpi-definitions/:id | dashboard.controller.ts:155 | inline rawSql:163 | REAL | UPDATE kpi_definitions ... RETURNING | |
| GET /director/dashboard/kpi-weights | dashboard.controller.ts:182 | inline rawSql:186 | REAL | SELECT FROM kpi_score_weights | |
| PATCH /director/dashboard/kpi-weights/:code | dashboard.controller.ts:194 | inline rawSql:202 | REAL | UPDATE kpi_score_weights | |
| GET /director/diary/list | presentation/diary.controller.ts:66 | diary.service.ts directorList | REAL | svc.directorList | |
| GET /director/diary | diary.controller.ts:75 | diary.service.ts openDiaryForUser | REAL | svc.openDiaryForUser (card-centric) | |
| PATCH /director/diary/:id | diary.controller.ts:86 | diary.service.ts saveDraft | REAL | svc.saveDraft | |
| POST /director/diary/:id/submit | diary.controller.ts:101 | diary.service.ts submitEntry | REAL | svc.submitEntry | |
| GET /director/wms-rental | presentation/director-extended.controller.ts:28 | director-state.service.ts getWmsRental | REAL | stateService.getWmsRental | |
| GET /director/company-state | director-extended.controller.ts:35 | director-state.service.ts getCurrentCompanyState | REAL | stateService.getCurrentCompanyState | |
| GET /director/company-state/history | director-extended.controller.ts:42 | director-state.service.ts getCompanyStateHistory | REAL | stateService.getCompanyStateHistory | |
| GET /director/ideal-vs-actual | director-extended.controller.ts:49 | director-state.service.ts getIdealVsActual | REAL | stateService.getIdealVsActual | |
| POST /director/orders/:id/vip | director-extended.controller.ts:56 | director-state.service.ts markOrderVip | REAL | stateService.markOrderVip (unwrapOrInternal then returns markedAt) | |
| GET /director/kpi | presentation/director-root.controller.ts:33 | get-dashboard-kpis.handler.ts | DUPLICATE | legacy alias of GET /director/dashboard/kpis | comment "legacy alias" |
| GET /director/kpis | director-root.controller.ts:41 | get-dashboard-kpis.handler.ts | DUPLICATE | plural alias of /director/dashboard/kpis (and of /director/kpi) | comment "plural alias" |
| GET /director/summary | director-root.controller.ts:49 | director-data.service.ts getSummaryFull | REAL | directorData.getSummaryFull | |
| GET /director/production | director-root.controller.ts:56 | director-data.service.ts getProductionFull | REAL | directorData.getProductionFull | |
| GET /director/hr | director-root.controller.ts:63 | director-data.service.ts getHrFull | REAL | directorData.getHrFull | |
| GET /director/finance | director-root.controller.ts:70 | director-data.service.ts getFinanceFull | REAL | directorData.getFinanceFull | |
| GET /director/alerts | director-root.controller.ts:77 | director-data.service.ts getAlerts | REAL | directorData.getAlerts | |
| GET /director/ai-summary | director-root.controller.ts:84 | director-data.service.ts getAiSummary | REAL | directorData.getAiSummary | |
| GET /director/owner-summary | director-root.controller.ts:93 | owner-summary.service.ts buildSummary(false) | REAL | ownerSummary.buildSummary compute-only (SD/CRM live) | |
| POST /director/owner-summary/send | director-root.controller.ts:101 | owner-summary.service.ts buildSummary(true) | REAL | compute + config-gated Telegram push (graceful) | send is config-gated, not a no-op |
| POST /kaizen/suggestions | presentation/kaizen.controller.ts:41 | kaizen.service.ts createSuggestion | REAL | svc.createSuggestion | |
| GET /kaizen/suggestions | kaizen.controller.ts:55 | kaizen.service.ts listSuggestions | REAL | svc.listSuggestions | |
| GET /kaizen/suggestions/:id | kaizen.controller.ts:70 | kaizen.service.ts getSuggestion | REAL | svc.getSuggestion | |
| PATCH /kaizen/suggestions/:id | kaizen.controller.ts:82 | kaizen.service.ts updateSuggestion | REAL | svc.updateSuggestion | |
| PATCH /kaizen/suggestions/:id/status | kaizen.controller.ts:97 | kaizen.service.ts updateSuggestion | DUPLICATE | same svc.updateSuggestion as PATCH /kaizen/suggestions/:id (kaizen.controller.ts:82) | subset of fields |
| GET /kaizen/stats | kaizen.controller.ts:111 | kaizen.service.ts getStats | REAL | svc.getStats | |
| GET /director/monthly-plans | presentation/monthly-plan.controller.ts:62 | monthly-plan.service.ts list | REAL | svc.list | |
| GET /director/monthly-plans/by-month | monthly-plan.controller.ts:70 | monthly-plan.service.ts getByMonth | REAL | svc.getByMonth | |
| POST /director/monthly-plans | monthly-plan.controller.ts:78 | monthly-plan.service.ts create | REAL | svc.create | |
| PATCH /director/monthly-plans/:id | monthly-plan.controller.ts:94 | monthly-plan.service.ts update | REAL | svc.update | |
| POST /director/monthly-plans/:id/complete | monthly-plan.controller.ts:110 | monthly-plan.service.ts completePlan | REAL | svc.completePlan | |
| GET /okr/objectives | presentation/okr.controller.ts:51 | okr.service.ts listObjectives | REAL | svc.listObjectives | |
| GET /okr/objectives/:id | okr.controller.ts:71 | okr.service.ts getObjective | REAL | svc.getObjective | |
| POST /okr/objectives | okr.controller.ts:83 | okr.service.ts createObjective | REAL | svc.createObjective | |
| PATCH /okr/objectives/:id | okr.controller.ts:103 | okr.service.ts updateObjective | REAL | svc.updateObjective | |
| DELETE /okr/objectives/:id | okr.controller.ts:114 | okr.service.ts deleteObjective | REAL | svc.deleteObjective | |
| GET /okr/key-results | okr.controller.ts:123 | okr.service.ts listKeyResults | REAL | svc.listKeyResults | |
| POST /okr/key-results | okr.controller.ts:131 | okr.service.ts createKeyResult | REAL | svc.createKeyResult | |
| PATCH /okr/key-results/:id | okr.controller.ts:152 | okr.service.ts updateKeyResult | REAL | svc.updateKeyResult | |
| DELETE /okr/key-results/:id | okr.controller.ts:169 | okr.service.ts deleteKeyResult | REAL | svc.deleteKeyResult | |
| GET /okr/dashboard | okr.controller.ts:178 | okr.service.ts getDashboard | REAL | svc.getDashboard | |
| GET /okr/cascade | okr.controller.ts:186 | okr.service.ts getCascade | REAL | svc.getCascade rolled-up | |
| GET /director/stat-regulations | presentation/stat-regulation.controller.ts:65 | stat-regulation.service.ts list | REAL | svc.list | |
| GET /director/stat-regulations/history | stat-regulation.controller.ts:73 | stat-regulation.service.ts getHistory | REAL | svc.getHistory | |
| GET /director/stat-regulations/:id | stat-regulation.controller.ts:81 | stat-regulation.service.ts getById | REAL | svc.getById | |
| POST /director/stat-regulations | stat-regulation.controller.ts:89 | stat-regulation.service.ts create | REAL | svc.create | |
| PATCH /director/stat-regulations/:id | stat-regulation.controller.ts:110 | stat-regulation.service.ts update | REAL | svc.update (new version) | |
| DELETE /director/stat-regulations/:id | stat-regulation.controller.ts:132 | stat-regulation.service.ts deactivate | REAL | svc.deactivate | |
| GET /strategic/categories | presentation/strategic.controller.ts:81 | strategic.service.ts listCategories | REAL | svc.listCategories | |
| POST /strategic/categories | strategic.controller.ts:89 | strategic.service.ts createCategory | REAL | svc.createCategory | |
| PATCH /strategic/categories/:id | strategic.controller.ts:99 | strategic.service.ts updateCategory | REAL | svc.updateCategory | |
| GET /strategic/tasks | strategic.controller.ts:107 | strategic.service.ts listTasks | REAL | svc.listTasks | |
| GET /strategic/tasks/:id | strategic.controller.ts:128 | strategic.service.ts getTask | REAL | svc.getTask | |
| POST /strategic/tasks | strategic.controller.ts:140 | strategic.service.ts createTask | REAL | svc.createTask | |
| PATCH /strategic/tasks/:id | strategic.controller.ts:161 | strategic.service.ts updateTask | REAL | svc.updateTask | |
| DELETE /strategic/tasks/:id | strategic.controller.ts:180 | strategic.service.ts deleteTask | REAL | svc.deleteTask | |
| POST /strategic/tasks/:taskId/milestones | strategic.controller.ts:190 | strategic.service.ts createMilestone | REAL | svc.createMilestone | |
| PATCH /strategic/milestones/:id | strategic.controller.ts:200 | strategic.service.ts updateMilestone | REAL | svc.updateMilestone | |
| POST /strategic/seed | strategic.controller.ts:209 | strategic.service.ts createCategory ×5 | REAL | Promise.allSettled real inserts, returns created/failed | admin seed util |
| GET /strategic/dashboard | strategic.controller.ts:221 | strategic.service.ts getDashboard | REAL | svc.getDashboard | |
| GET /coordination/workflow-rules | presentation/workflow-rules.controller.ts:70 | workflow-rules.service.ts list | REAL | svc.list | |
| GET /coordination/workflow-rules/resolve | workflow-rules.controller.ts:86 | workflow-rules.service.ts resolve | REAL | svc.resolve ordered chain | |
| GET /coordination/workflow-rules/:id | workflow-rules.controller.ts:94 | workflow-rules.service.ts getById | REAL | svc.getById | |
| POST /coordination/workflow-rules | workflow-rules.controller.ts:102 | workflow-rules.service.ts create | REAL | svc.create | |
| PUT /coordination/workflow-rules/:id | workflow-rules.controller.ts:111 | workflow-rules.service.ts update | REAL | svc.update | |
| DELETE /coordination/workflow-rules/:id | workflow-rules.controller.ts:121 | workflow-rules.service.ts remove | REAL | svc.remove soft-delete | |
| POST /hr/zno | presentation/zno.controller.ts:37 | zno.service.ts createZnoWithValidation | REAL | svc.createZnoWithValidation | |
| GET /hr/zno | zno.controller.ts:48 | zno.service.ts listZno | REAL | svc.listZno | |
| PATCH /hr/zno/:id/approve | zno.controller.ts:61 | zno.service.ts approveZnoWithAuth | REAL | svc.approveZnoWithAuth | |
| PATCH /hr/zno/:id/reject | zno.controller.ts:76 | zno.service.ts rejectZnoWithAuth | REAL | svc.rejectZnoWithAuth | |
| PATCH /hr/zno/:id | zno.controller.ts:91 | zno.service.ts updateZnoWithAuth | REAL | svc.updateZnoWithAuth | |
| POST /hr/zvs | presentation/zvs.controller.ts:35 | zvs.service.ts createZvsWithValidation | REAL | svc.createZvsWithValidation | |
| GET /hr/zvs | zvs.controller.ts:46 | zvs.service.ts listZvs | REAL | svc.listZvs | |
| PATCH /hr/zvs/:id/approve | zvs.controller.ts:58 | zvs.service.ts approveZvsWithAuth | REAL | svc.approveZvsWithAuth | |
| PATCH /hr/zvs/:id/reject | zvs.controller.ts:71 | zvs.service.ts rejectZvsWithAuth | REAL | svc.rejectZvsWithAuth | |
| GET /qc/inspections | modules/qc/presentation/qc-inspections.controller.ts:56 | queries/get-inspections.handler.ts | REAL | queryBus GetInspectionsQuery | |
| GET /qc/inspections/stats | qc-inspections.controller.ts:67 | queries/get-inspection-stats.handler.ts | REAL | queryBus GetInspectionStatsQuery (brak%/FTQ) | |
| GET /qc/inspections/:id | qc-inspections.controller.ts:86 | qc-new.service.ts getInspectionById | REAL | qcNewService.getInspectionById | |
| POST /qc/inspections | qc-inspections.controller.ts:96 | commands/create-inspection.handler.ts | REAL | commandBus CreateInspectionCommand | |
| POST /qc/inspections/:id/submit | qc-inspections.controller.ts:107 | commands/submit-inspection.handler.ts | REAL | commandBus SubmitInspectionCommand (3-way) | |
| POST /qc/inspections/:id/rework | qc-inspections.controller.ts:128 | submit-inspection.handler.ts | REAL | SubmitInspectionCommand decision=rework | |
| PATCH /qc/inspections/:id | qc-inspections.controller.ts:145 | qc-new.service.ts updateInspection | REAL | existence-check + updateInspection | |
| DELETE /qc/inspections/:id | qc-inspections.controller.ts:163 | qc-new.service.ts deleteInspection | REAL | existence-check + deleteInspection | |
| GET /qc/defects | presentation/qc-defects.controller.ts:70 | queries/get-defects.handler.ts | REAL | queryBus GetDefectsQuery | |
| GET /qc/defects/stats | qc-defects.controller.ts:83 | queries/get-defect-stats.handler.ts | REAL | queryBus GetDefectStatsQuery | |
| GET /qc/defects/:id | qc-defects.controller.ts:96 | queries/get-defect-by-id.handler.ts | REAL | queryBus GetDefectByIdQuery | |
| POST /qc/defects | qc-defects.controller.ts:107 | commands/report-defect.handler.ts | REAL | commandBus ReportDefectCommand | |
| PATCH /qc/defects/:id/resolve | qc-defects.controller.ts:124 | commands/resolve-defect.handler.ts | REAL | commandBus ResolveDefectCommand | |
| GET /qc/braks/cost-impact | qc-defects.controller.ts:139 | inline raw SQL:144 | REAL | UNION qc_braks + qc_defects aggregated | |
| GET /qc/pending/qc | qc-defects.controller.ts:161 | inline raw SQL:163 | REAL | SELECT FROM qc_defects unresolved | |
| PATCH /qc/approve/finance/:orderId | qc-defects.controller.ts:176 | _setQcStatus:61 + insert qc_approvals | REAL | real UPDATE qc_inspections + INSERT qc_approvals; 404 if no row | prior green-lie now fixed |
| POST /qc/approve/finance/:orderId | qc-defects.controller.ts:196 | _setQcStatus + insert | DUPLICATE | identical to PATCH /qc/approve/finance/:orderId (line 176) | POST alias |
| PATCH /qc/approve/qc/:orderId | qc-defects.controller.ts:216 | _setQcStatus + insert qc_approvals | REAL | real UPDATE + INSERT; 404 guard | |
| POST /qc/approve/qc/:orderId | qc-defects.controller.ts:236 | _setQcStatus + insert | DUPLICATE | identical to PATCH /qc/approve/qc/:orderId (line 216) | POST alias |
| PATCH /qc/reject/:orderId | qc-defects.controller.ts:256 | _setQcStatus('rejected') | REAL | UPDATE qc_inspections; 404 guard | |
| POST /qc/reject/:orderId | qc-defects.controller.ts:268 | _setQcStatus('rejected') | DUPLICATE | identical to PATCH /qc/reject/:orderId (line 256) | POST alias |
| PATCH /qc/inspector-submit/:orderId | qc-defects.controller.ts:280 | _setQcStatus('inspector_submitted') | REAL | UPDATE qc_inspections; 404 guard | |
| POST /qc/inspector-submit/:orderId | qc-defects.controller.ts:292 | _setQcStatus('inspector_submitted') | DUPLICATE | identical to PATCH /qc/inspector-submit/:orderId (line 280) | POST alias |
| GET /qc/reclamations | presentation/qc-reclamations.controller.ts:51 | queries/get-reclamations.handler.ts | REAL | queryBus GetReclamationsQuery | |
| GET /qc/reclamations/stats | qc-reclamations.controller.ts:64 | inline raw SQL:67 | REAL | FILTER aggregate over qc_reclamations | |
| GET /qc/reclamations/:id | qc-reclamations.controller.ts:84 | queries/get-reclamation-by-id.handler.ts | REAL | queryBus GetReclamationByIdQuery | |
| POST /qc/reclamations | qc-reclamations.controller.ts:95 | commands/create-reclamation.handler.ts | REAL | commandBus CreateReclamationCommand | |
| GET /qc/dpmo/:processId | presentation/qc-dpmo.controller.ts:36 | dpmo.service.ts getProcessDpmoData + calculate | REAL | dpmoSvc DB-read + compute | |
| POST /qc/dpmo | qc-dpmo.controller.ts:49 | dpmo.service.ts calculate | REAL | dpmoSvc.calculate (pure compute) | |
| GET /qc/dashboard | presentation/qc-new.controller.ts:91 | qc-new.service.ts:13 getDashboard | REAL | repo.getDashboardStats | |
| GET /qc/checkpoints | qc-new.controller.ts:98 | qc-new.service.ts getCheckpoints | REAL | repo.findCheckpoints | |
| POST /qc/checkpoints | qc-new.controller.ts:105 | qc-new.service.ts createCheckpoint | REAL | repo.insertCheckpoint | |
| GET /qc/ai-trend | qc-new.controller.ts:113 | qc-new.repository.ts:223 getAiTrendSummary | REAL | real SQL aggregate over qc_lab_tests + brak UNION | not mock (verified) |
| GET /qc/certificates | qc-new.controller.ts:120 | qc-new.service.ts getCertificates | REAL | repo.findCertificates | |
| POST /qc/certificates | qc-new.controller.ts:127 | qc-new.service.ts createCertificate | REAL | repo insert | |
| POST /qc/certificates/generate-pdf | qc-new.controller.ts:140 | qc-certificate-pdf.service.ts generate | REAL | certPdfSvc.generate (seq number + row + PDF) | |
| GET /qc/certificates/next-number | qc-new.controller.ts:167 | qc-certificate-pdf.service.ts nextCertificateNumber | REAL | sequence nextval | |
| GET /qc/lab-tests | qc-new.controller.ts:176 | qc-new.service.ts getLabTests | REAL | repo query | |
| POST /qc/lab-tests | qc-new.controller.ts:183 | qc-new.service.ts createLabTest | REAL | repo insert | |
| GET /qc/spc/control-chart | qc-new.controller.ts:191 | qc-new.service.ts getSpcControlChart | REAL | repo query | |
| GET /qc/control-charts | qc-new.controller.ts:199 | inline raw SQL:203 | REAL | aggregate over qc_spc_data | |
| GET /qc/control-charts/:processId | qc-new.controller.ts:217 | spc.service.ts getControlChart | REAL | spcSvc.getControlChart UCL/LCL | |
| GET /qc/supplier-quality/ratings | qc-new.controller.ts:229 | qc-new.service.ts getSupplierQualityRatings | REAL | repo.getSupplierRatings | |
| GET /qc/aql/plan | qc-new.controller.ts:249 | qc-aql.service.ts plan | REAL | aqlSvc.plan ISO 2859-1 pure compute | |
| GET /qc/inspections/:id/aql-plan | qc-new.controller.ts:279 | qc-new.service.ts getInspectionById + aqlSvc.plan | REAL | reads inspection row, computes plan | |
| GET /qc/parameters/grouped | presentation/qc-parameters.controller.ts:54 | qc-parameters.service.ts getParametersGrouped | REAL | svc.getParametersGrouped | |
| GET /qc/parameters/paper | qc-parameters.controller.ts:61 | qc-parameters.service.ts getParametersGrouped | REAL | filters grouped output to paper/physical | related to grouped |
| POST /qc/parameters | qc-parameters.controller.ts:75 | qc-parameters.service.ts createParameter | REAL | svc.createParameter | |
| PATCH /qc/parameters/:id | qc-parameters.controller.ts:84 | qc-parameters.service.ts updateParameter | REAL | svc.updateParameter | |
| DELETE /qc/parameters/:id | qc-parameters.controller.ts:92 | qc-parameters.service.ts deleteParameter | REAL | svc.deleteParameter | |
| POST /qc/seed-parameters | qc-parameters.controller.ts:100 | qc-parameters.service.ts seedParameters | REAL | svc.seedParameters | admin seed util |
| GET /qc/tests | qc-parameters.controller.ts:107 | qc-parameters.service.ts getTests | REAL | svc.getTests | |
| GET /qc/tests/recent | qc-parameters.controller.ts:114 | qc-parameters.service.ts getRecentTests | REAL | svc.getRecentTests | |
| GET /qc/tests/:id | qc-parameters.controller.ts:121 | inline rawSql:126 | REAL | SELECT FROM qc_material_tests | catch-swallow returns {found:false} on error (read degrade, not fake write) |
| POST /qc/tests | qc-parameters.controller.ts:139 | qc-parameters.service.ts createMaterialTest | REAL | svc.createMaterialTest | |
| POST /qc/tests/:id/ai-analyze | qc-parameters.controller.ts:148 | qc-parameters.service.ts:68 aiAnalyzeTest | REAL | reads qc_material_tests, derives pass/fail from real JSONB (rule-based, not random) | |
| DELETE /qc/standards/:id | qc-parameters.controller.ts:155 | qc-parameters.service.ts deleteStandard | REAL | svc.deleteStandard | |
| GET /qc/calibrations | presentation/instrument-calibration.controller.ts:54 | instrument-calibration.repository.ts list | REAL | repo.list(dueSoon) | |
| GET /qc/calibrations/:id | instrument-calibration.controller.ts:63 | instrument-calibration.repository.ts getById | REAL | repo.getById | |
| POST /qc/calibrations | instrument-calibration.controller.ts:67 | instrument-calibration.repository.ts create | REAL | repo.create | |
| PATCH /qc/calibrations/:id | instrument-calibration.controller.ts:74 | instrument-calibration.repository.ts update | REAL | repo.update | |
| POST /qc/calibrations/:id/calibrate | instrument-calibration.controller.ts:81 | instrument-calibration.repository.ts calibrate | REAL | repo.calibrate advances due | |
| DELETE /qc/calibrations/:id | instrument-calibration.controller.ts:89 | instrument-calibration.repository.ts remove | REAL | repo.remove | |
| POST /print/ink-coverage | presentation/print.controller.ts:68 | ink-consumption.service.ts estimateInkConsumption | REAL | inkSvc compute | |
| POST /print/imposition | print.controller.ts:84 | imposition.service.ts pack | REAL | impositionSvc.pack FFDH | |
| GET /print/spoilage/:jobId | print.controller.ts:96 | spoilage.service.ts getJobSpoilageData + calculate | REAL | DB-read + compute | |
| POST /print/spoilage | print.controller.ts:111 | spoilage.service.ts calculate | REAL | spoilageSvc.calculate | |
| GET /qc/standards | presentation/qc-extended.controller.ts:46 | qc-extended.service.ts listStandards | REAL | svc.listStandards | |
| GET /qc/standards/:id | qc-extended.controller.ts:54 | qc-extended.service.ts getStandard | REAL | svc.getStandard | |
| POST /qc/standards | qc-extended.controller.ts:66 | qc-extended.service.ts createStandard | REAL | svc.createStandard | |
| PATCH /qc/standards/:id | qc-extended.controller.ts:78 | qc-extended.service.ts updateStandard | REAL | svc.updateStandard | |
| GET /qc/final-inspections | qc-extended.controller.ts:91 | qc-extended.service.ts listFinalInspections | REAL | svc.listFinalInspections | |
| GET /qc/final-orders | qc-extended.controller.ts:99 | qc-extended.service.ts getFinalOrders | REAL | svc.getFinalOrders | |
| POST /qc/final-inspections | qc-extended.controller.ts:107 | qc-extended.service.ts createFinalInspection | REAL | svc.createFinalInspection | |
| POST /qc/final-inspections/:id/complete | qc-extended.controller.ts:132 | qc-extended.service.ts completeFinalInspection | REAL | svc.completeFinalInspection | |
| GET /qc/in-process | qc-extended.controller.ts:145 | qc-extended.service.ts listInProcess | REAL | svc.listInProcess | |
| POST /qc/in-process | qc-extended.controller.ts:153 | qc-extended.service.ts createInProcessInspection | REAL | svc.createInProcessInspection | |
| GET /qc/root-causes | qc-extended.controller.ts:162 | qc-extended.service.ts listRootCauses | REAL | svc.listRootCauses | |
| POST /qc/root-causes | qc-extended.controller.ts:170 | qc-extended.service.ts createRootCause | REAL | svc.createRootCause | |
| PATCH /qc/root-causes/:id | qc-extended.controller.ts:181 | qc-extended.service.ts updateRootCause | REAL | svc.updateRootCause | |
| GET /qc/braks | presentation/qc-defects-extended.controller.ts:48 | qc-defects-extended.service.ts listBraks | REAL | svc.listBraks | |
| GET /qc/defects/extended | qc-defects-extended.controller.ts:57 | qc-defects-extended.service.ts listBraks | REAL | alias → svc.listBraks | registered before /defects/:id |
| GET /qc/braks/stats | qc-defects-extended.controller.ts:65 | qc-defects-extended.service.ts getBrakStats | REAL | svc.getBrakStats | |
| GET /qc/braks/cost-impact/:papkaOrderId | qc-defects-extended.controller.ts:73 | qc-defects-extended.service.ts getBrakCostImpact | REAL | svc.getBrakCostImpact | related to /qc/braks/cost-impact (no param, qc-defects.controller:139) |
| POST /qc/braks | qc-defects-extended.controller.ts:81 | ReportDefectCommand (report-defect.handler.ts) | REAL | commandBus → qc_defects insert (routed via CQRS) | |
| GET /qc/supplier-quality | qc-defects-extended.controller.ts:131 | qc-defects-extended.service.ts listSupplierQuality | REAL | svc.listSupplierQuality | |
| POST /qc/supplier-quality | qc-defects-extended.controller.ts:139 | qc-defects-extended.service.ts createSupplierQuality | REAL | svc.createSupplierQuality | |
| GET /qc/dashboard/stats | qc-defects-extended.controller.ts:161 | qc-defects-extended.service.ts:37 getDashboardStats | REAL | repo.getDashboardStats | |
| GET /qc/dashboard/flow | qc-defects-extended.controller.ts:168 | qc-defects-extended.service.ts:41 getDashboardFlow | REAL | repo.getDashboardFlow | |
| GET /qc/approvals | qc-defects-extended.controller.ts:175 | qc-defects-extended.service.ts:45 listApprovals | REAL | repo.listApprovals | |
| POST /qc/approvals | qc-defects-extended.controller.ts:183 | qc-defects-extended.service.ts:49 createApproval | REAL | repo.createApproval | |
| PATCH /qc/approvals/:id | qc-defects-extended.controller.ts:199 | qc-defects-extended.service.ts:53 updateApproval | REAL | repo.updateApproval | |
| PATCH /qc/reclamations/:id | qc-defects-extended.controller.ts:214 | commands/resolve-reclamation.handler.ts | REAL | commandBus ResolveReclamationCommand | |

### Notes / cross-controller observations
- Both `qc-defects.controller`, `qc-reclamations.controller`, `qc-dpmo.controller`, `qc-new.controller`, `qc-parameters.controller`, `qc-extended.controller`, `qc-defects-extended.controller` share `@Controller('qc')`. No literal path collisions found (segments differ). `qc/braks/cost-impact` (no param) vs `qc/braks/cost-impact/:papkaOrderId` coexist.
- No 501-STUB, 404-DEAD, GREEN-LIE, MOCK, or UNVERIFIED routes found. The dashboard/KPI high-risk target is clean: `get-dashboard-kpis.handler.ts` runs real SQL against sales_orders/invoices/production_orders/qc_inspections/warehouse_stock. HITL approve/reject handlers perform real repo.update + event publish.
- `notImplemented` is imported in qc-defects.controller.ts:8 and qc-new.controller.ts:16 but is NOT called by any route (dead import only).


---

## IoT + Agents + AI-Agents

Backend root: `apps/api/src`. Prefix built from `@Controller(...)` + method path. All routes under `/api`.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /api/agents/director/briefing | modules/agents/agents.controller.ts:73 | modules/agents/director-agent.service.ts | REAL | director-agent.service has 8 DB calls (runQuery) | |
| POST /api/agents/director/ask | modules/agents/agents.controller.ts:77 | director-agent.service.ts (askAdvisor) | REAL | AI advisor call | |
| GET /api/agents/director/module-health | modules/agents/agents.controller.ts:84 | director-agent.service.ts (getModuleHealth) | REAL | queries module tables | |
| GET /api/agents/crm/score-leads | modules/agents/agents.controller.ts:89 | modules/agents/lead-scoring-agent.service.ts:35 | REAL | 7 DB calls in service | |
| POST /api/agents/crm/proposal/:leadId | modules/agents/agents.controller.ts:90 | lead-scoring-agent.service.ts (generateProposal) | REAL | reads lead/customer | |
| GET /api/agents/crm/customer360/:id | modules/agents/agents.controller.ts:91 | lead-scoring-agent.service.ts (getCustomer360) | REAL | DB aggregate | |
| GET /api/agents/crm/churn/:id | modules/agents/agents.controller.ts:92 | lead-scoring-agent.service.ts:87 | REAL | DB-driven churn | |
| GET /api/agents/production/monitor | modules/agents/agents.controller.ts:95 | modules/agents/production-agent.service.ts:70 | REAL | queries orders | |
| GET /api/agents/production/oee | modules/agents/agents.controller.ts:96 | production-agent.service.ts:88 | REAL | computes from real data (comment notes placeholder OEE weight factors only) | |
| GET /api/agents/production/bottleneck | modules/agents/agents.controller.ts:97 | production-agent.service.ts:125 | REAL | queue query | |
| GET /api/agents/production/shift-report/:shiftId | modules/agents/agents.controller.ts:98 | production-agent.service.ts (generateShiftReport) | REAL | DB read | |
| GET /api/agents/inventory/forecast/:materialId | modules/agents/agents.controller.ts:101 | modules/agents/inventory-agent.service.ts:49 | REAL | 12 DB calls in service | |
| GET /api/agents/inventory/critical | modules/agents/agents.controller.ts:102 | inventory-agent.service.ts (checkCriticalStock) | REAL | stock query | |
| GET /api/agents/inventory/abc | modules/agents/agents.controller.ts:103 | inventory-agent.service.ts (abcAnalysis) | REAL | DB aggregate | |
| GET /api/agents/inventory/rolls | modules/agents/agents.controller.ts:104 | inventory-agent.service.ts (getRollBalance) | REAL | rolls table | |
| GET /api/agents/inventory/rolls/fifo | modules/agents/agents.controller.ts:105 | inventory-agent.service.ts (getFIFOQueue) | REAL | rolls FIFO query | |
| POST /api/agents/inventory/rolls/scan | modules/agents/agents.controller.ts:106 | inventory-agent.service.ts (scanRoll) | REAL | INSERT roll | |
| POST /api/agents/inventory/rolls/use | modules/agents/agents.controller.ts:110 | inventory-agent.service.ts (trackRollUsage) | REAL | UPDATE roll usage | |
| GET /api/agents/inventory/rolls/qr/:dbId | modules/agents/agents.controller.ts:114 | inventory-agent.service.ts (rollQRCode) | REAL | reads roll | |
| GET /api/agents/finance/cashflow | modules/agents/agents.controller.ts:117 | modules/agents/cashflow-agent.service.ts | REAL | 6 DB calls in service | |
| GET /api/agents/finance/overdue | modules/agents/agents.controller.ts:118 | cashflow-agent.service.ts (checkOverduePayments) | REAL | payments query | |
| GET /api/agents/finance/fraud | modules/agents/agents.controller.ts:119 | cashflow-agent.service.ts (detectFraud) | REAL | txn scan | |
| GET /api/agents/supplier/scores | modules/agents/agents.controller.ts:122 | modules/agents/supplier-agent.service.ts | REAL | 3 DB calls in service | |
| GET /api/agents/supplier/risks | modules/agents/agents.controller.ts:123 | supplier-agent.service.ts (detectDeliveryRisks) | REAL | PO/delivery query | |
| GET /api/agents/hr/performance | modules/agents/agents.controller.ts:126 | modules/agents/hr-performance-agent.service.ts | REAL | 4 DB calls in service | |
| GET /api/agents/hr/performance/:id | modules/agents/agents.controller.ts:127 | hr-performance-agent.service.ts (analyzePerformance) | REAL | KPI query | |
| GET /api/agents/hr/churn | modules/agents/agents.controller.ts:128 | hr-performance-agent.service.ts:66 | REAL | churn query | |
| GET /api/agents/hr/churn/:id | modules/agents/agents.controller.ts:129 | hr-performance-agent.service.ts:66 | REAL | churn query | DUPLICATE of /hr/churn (query vs param) |
| GET /api/agents/hr/bonus | modules/agents/agents.controller.ts:130 | hr-performance-agent.service.ts (calculateBonus) | REAL | KPI-based bonus | |
| GET /api/agents/hr/bonus/:id | modules/agents/agents.controller.ts:138 | hr-performance-agent.service.ts (calculateBonus) | REAL | KPI-based bonus | DUPLICATE of /hr/bonus |
| GET /api/agents/quality/trend | modules/agents/agents.controller.ts:148 | modules/agents/quality-agent.service.ts:34 | REAL | SUM over production_facts (trackBrakTrend) | |
| GET /api/agents/quality/quarantine | modules/agents/agents.controller.ts:149 | quality-agent.service.ts:52 | REAL | warehouse_transactions query | analyzeDefect placeholder in same file is NOT routed |
| GET /api/agents/security/access-attempts | modules/agents/agents.controller.ts:152 | modules/agents/security-agent.service.ts | REAL | 4 DB calls in service | |
| GET /api/agents/security/audit-anomalies | modules/agents/agents.controller.ts:153 | security-agent.service.ts (analyzeAuditLog) | REAL | audit_log scan | |
| GET /api/agents/marketing/roi/:campaignId | modules/agents/agents.controller.ts:156 | modules/agents/marketing-agent.service.ts | REAL | 3 DB calls in service | |
| POST /api/agents/marketing/content | modules/agents/agents.controller.ts:157 | marketing-agent.service.ts (generateContent) | REAL | AI content gen | |
| GET /api/agents/marketing/segments | modules/agents/agents.controller.ts:161 | marketing-agent.service.ts (segmentCustomers) | REAL | customer query | |
| GET /api/agents/lms/progress/:id | modules/agents/agents.controller.ts:164 | modules/agents/lms-agent.service.ts | REAL | 3 DB calls in service | |
| GET /api/agents/lms/expiry | modules/agents/agents.controller.ts:165 | lms-agent.service.ts (checkCertificateExpiry) | REAL | certificates query | |
| GET /api/agents/iot/sensor | modules/agents/agents.controller.ts:168 | modules/agents/iot-agent.service.ts:32 | MOCK | returns hardcoded `{vibration:1.2,temp:65.5,current:12.3}` (iot-agent.service.ts:34, "Placeholder simulated values") | Consumed by FE AgentsHub.tsx — fake sensor telemetry shown live |
| GET /api/agents/iot/sensor/:machineId | modules/agents/agents.controller.ts:169 | iot-agent.service.ts:32 | MOCK | same hardcoded values regardless of machineId | |
| GET /api/agents/iot/anomaly/:machineId | modules/agents/agents.controller.ts:170 | iot-agent.service.ts:38 | MOCK | detectAnomalies reads collectSensorData mock → vibration 1.2<5.0 always returns hasAnomaly:false | Never fires real anomaly |
| GET /api/agents/iot/rul/:machineId | modules/agents/agents.controller.ts:171 | iot-agent.service.ts:52 | MOCK | returns hardcoded `{daysLeft:60,confidence:0.85}` | |
| GET /api/agents/facilities/utility | modules/agents/agents.controller.ts:174 | modules/agents/facilities-agent.service.ts:23 | MOCK | returns hardcoded `{electricity:12_000_000,gas:4_500_000,water:1_200_000,deltaPct:8.5}` (facilities-agent.service.ts:26) | month param ignored |
| GET /api/agents/facilities/maintenance | modules/agents/agents.controller.ts:175 | facilities-agent.service.ts:31 | REAL | queries `machines` table (schedulePreventiveMaintenance) | |
| GET /api/agents/facilities/supplies | modules/agents/agents.controller.ts:176 | facilities-agent.service.ts:40 | MOCK | returns hardcoded `{low:3,out:1}` (line 41) | |
| POST /api/agents/strategic/scenario | modules/agents/agents.controller.ts:179 | modules/agents/strategic-agent.service.ts:24 | REAL | real Claude AI call; NOTE impact map hardcoded `{revenue:0,production:0,customers:0}` (line 34) | analysis text real, impact numbers stubbed |
| GET /api/agents/strategic/forecast-revenue | modules/agents/agents.controller.ts:186 | strategic-agent.service.ts:39 | REAL | SUM over crm_deals won (line 41) | |
| GET /api/agents/strategic/investment | modules/agents/agents.controller.ts:190 | strategic-agent.service.ts:56 | MOCK | returns hardcoded recommendations array (lines 59-62, "// Placeholder") | |
| GET /api/agents/alerts | modules/agents/agents.controller.ts:195 | modules/agents/shared/agent-alert.service.ts (listForUser) | REAL | agent_alerts query (5 DB calls) | |
| POST /api/agents/alerts/:id/read | modules/agents/agents.controller.ts:201 | agent-alert.service.ts (markRead) | REAL | UPDATE alert | |
| POST /api/ai-agents/sales/evaluate | modules/ai-agents/presentation/ai-agents.controller.ts:107 | modules/ai-agents/sales/sales-copilot.service.ts:114 | REAL | calcRisk + AI call + idempotency cache + persists ai_decision_log | |
| POST /api/ai-agents/prepress/tech-card | modules/ai-agents/presentation/ai-agents.controller.ts:116 | modules/ai-agents/prepress/prepress-assistant.service.ts | REAL | generateTechCard, AI + decision-log persist | |
| POST /api/ai-agents/planning/plan | modules/ai-agents/presentation/ai-agents.controller.ts:125 | modules/ai-agents/planning/planner.service.ts | REAL | scheduling algo + decision-log | |
| POST /api/ai-agents/mes/oee | modules/ai-agents/presentation/ai-agents.controller.ts:140 | modules/ai-agents/mes/mes-monitor.service.ts:98 | REAL | pure OEE computation from input (calcOee) | |
| POST /api/ai-agents/mes/anomaly | modules/ai-agents/presentation/ai-agents.controller.ts:149 | mes-monitor.service.ts:131 | REAL | z-score over rolling buffer; UPDATE mes_work_orders on auto-stop; logs ai_decision_log | |
| POST /api/ai-agents/qc/vision-analyze | modules/ai-agents/presentation/ai-agents.controller.ts:158 | modules/ai-agents/qc/vision-qc.service.ts | REAL | VLM analyze + decision-log persist | |
| POST /api/ai-agents/logistics/vrp | modules/ai-agents/presentation/ai-agents.controller.ts:167 | modules/ai-agents/logistics/router.service.ts | REAL | VRP optimize + decision-log persist | |
| GET /api/ai-agents/audit/stats | modules/ai-agents/presentation/ai-agents.controller.ts:175 | modules/ai-agents/common/ai-decision-log.service.ts:162 | REAL | GROUP BY over aiDecisionLog | |
| GET /api/ai-agents/audit/:agent/decisions | modules/ai-agents/presentation/ai-agents.controller.ts:183 | ai-decision-log.service.ts:191 | REAL | SELECT aiDecisionLog (catch→[] on DB error) | |
| GET /api/ai-agents/audit/hard-block-stats | modules/ai-agents/presentation/ai-agents.controller.ts:199 | ai-decision-log.service.ts:209 | REAL | UNION query over customer_orders/mes_production_sessions/mm_purchase_orders (line 240) | |
| GET /api/ai-agents/list | modules/ai-agents/presentation/ai-agents.controller.ts:208 | ai-agents.controller.ts:210 (inline) | REAL | static AGENT_META catalog merged with real getStats() counts; status hardcoded 'active', lastRunAt null | metadata static, counts from DB |
| POST /api/ai-agents/:agentId/trigger | modules/ai-agents/presentation/ai-agents.controller.ts:249 | ai-agents.controller.ts:251 | 501-STUB | `return notImplemented('POST /ai-agents/:agentId/trigger')` (line 252) | Honest 501 (P3-26 not wired) |
| GET /api/iot/dashboard | modules/iot/presentation/iot-main.controller.ts:56 | modules/iot/application/iot-main.service.ts (getDashboard) | REAL | service DB read | |
| GET /api/iot/attendance/live | modules/iot/presentation/iot-main.controller.ts:61 | iot-main.service.ts (getAttendanceLive) | REAL | DB read | |
| GET /api/iot/room-inspections | modules/iot/presentation/iot-main.controller.ts:66 | iot-main.service.ts (getRoomInspections) | REAL | DB read | |
| GET /api/iot/employee-health | modules/iot/presentation/iot-main.controller.ts:74 | iot-main.service.ts (getEmployeeHealth) | REAL | DB read | |
| GET /api/iot/machine-status | modules/iot/presentation/iot-main.controller.ts:83 | iot-main.service.ts (getMachineStatusCurrent) | REAL | DB read | |
| GET /api/iot/machine-status-logs | modules/iot/presentation/iot-main.controller.ts:88 | iot-main.service.ts (getMachineStatusLogs) | REAL | DB read | |
| GET /api/iot/employee-productivity | modules/iot/presentation/iot-main.controller.ts:97 | iot-main.service.ts (getEmployeeProductivity) | REAL | DB read | DUPLICATE of EmployeeProductivityController GET /employee-productivity |
| GET /api/iot/environment | modules/iot/presentation/iot-main.controller.ts:107 | iot-main.service.ts (getEnvironmentData) | REAL | sensor DB read | |
| GET /api/iot/devices/:id/stats | modules/iot/presentation/iot-main.controller.ts:120 | iot-main.service.ts (getDeviceStats) | REAL | DB read | |
| GET /api/iot/quality-defects | modules/iot/presentation/iot-main.controller.ts:128 | iot-main.service.ts (getQualityDefects) | REAL | DB read | |
| GET /api/iot/recognition-stats | modules/iot/presentation/iot-main.controller.ts:137 | iot-main.service.ts (getRecognitionStats) | REAL | DB read | DUPLICATE of camera-recognition GET /camera/recognition-stats |
| GET /api/iot/energy-consumption | modules/iot/presentation/iot-main.controller.ts:145 | iot-main.controller.ts:154 | 501-STUB | throws NOT_IMPLEMENTED 'EP-IOT-018-PENDING' — owner-mandated honest 501 (no physical energy sensor) | |
| GET /api/iot/temperature | modules/iot/presentation/iot-main.controller.ts:163 | iot-main.service.ts (getEnvironmentData 'temperature') | REAL | DB read | |
| GET /api/iot/humidity | modules/iot/presentation/iot-main.controller.ts:171 | iot-main.service.ts (getEnvironmentData 'humidity') | REAL | DB read | |
| GET /api/iot/pressure | modules/iot/presentation/iot-main.controller.ts:179 | iot-main.service.ts (getEnvironmentData 'pressure') | REAL | DB read | |
| GET /api/iot/vibration | modules/iot/presentation/iot-main.controller.ts:187 | iot-main.service.ts (getEnvironmentData 'vibration') | REAL | DB read | |
| GET /api/iot/gas-levels | modules/iot/presentation/iot-main.controller.ts:198 | iot-main.service.ts (getEnvironmentData 'gas') | REAL | DB read | |
| GET /api/iot/noise-levels | modules/iot/presentation/iot-main.controller.ts:204 | iot-main.service.ts (getEnvironmentData 'noise') | REAL | DB read | |
| GET /api/iot/production-metrics | modules/iot/presentation/iot-main.controller.ts:215 | iot-main.service.ts (getProductionMetrics) | REAL | DB read | |
| GET /api/iot/oee | modules/iot/presentation/iot-main.controller.ts:223 | iot-main.service.ts (getOee) | REAL | DB read | DUPLICATE of iot-sensors-main GET /iot-sensors/oee (same svc.getOee) |
| GET /api/iot/downtime | modules/iot/presentation/iot-main.controller.ts:232 | iot-main.service.ts (getMachineStatusLogs) | REAL | DB read (reuses logs) | |
| GET /api/iot/shift-report | modules/iot/presentation/iot-main.controller.ts:241 | iot-main.service.ts (getShiftReport) | REAL | DB read | |
| GET /api/iot/maintenance-schedule | modules/iot/presentation/iot-main.controller.ts:250 | iot-main.service.ts (getMachineStatusCurrent) | REAL | DB read (reuses machine-status; misnamed but real) | |
| GET /api/iot/sensors | modules/iot/presentation/iot-main.controller.ts:258 | modules/iot/application/iot-sensors-extended.service.ts (listSensors) | REAL | DB read | |
| GET /api/iot/telemetry | modules/iot/presentation/iot-main.controller.ts:265 | iot-sensors-extended.service.ts (getDashboard) | REAL | DB read | |
| GET /api/iot/live-dashboard/summary | modules/iot/presentation/iot-main.controller.ts:272 | iot-main.service.ts (getDashboard) | REAL | DB read | DUPLICATE of GET /iot/dashboard |
| GET /api/iot/downtime-reason-codes | modules/iot/presentation/iot-main.controller.ts:279 | iot-main.controller.ts:281 (inline) | REAL | SELECT downtime_reason_codes | |
| PATCH /api/iot/devices/:id | modules/iot/presentation/iot-main.controller.ts:293 | iot-main.controller.ts:295 (inline) | REAL | UPDATE iot_devices | |
| GET /api/iot/oee/live | modules/iot/presentation/iot-main.controller.ts:313 | iot-main.controller.ts:314 (inline) | REAL | AVG/GROUP BY production_sessions (lines 320,338) | |
| GET /api/iot/devices | modules/iot/presentation/iot-sensors.controller.ts:63 | modules/iot/application/queries/get-devices.handler.ts | REAL | CQRS GetDevicesQuery | |
| GET /api/iot/devices/:id | modules/iot/presentation/iot-sensors.controller.ts:78 | iot-sensors.controller.ts:82 (inline) | REAL | db.select iotDevices | |
| POST /api/iot/devices | modules/iot/presentation/iot-sensors.controller.ts:90 | modules/iot/application/commands/register-device.handler.ts | REAL | CQRS RegisterDeviceCommand | |
| PATCH /api/iot/devices/:id/thresholds | modules/iot/presentation/iot-sensors.controller.ts:111 | modules/iot/application/commands/update-device-thresholds.handler.ts | REAL | CQRS command | |
| POST /api/iot/devices/:id/readings | modules/iot/presentation/iot-sensors.controller.ts:126 | modules/iot/application/commands/record-sensor-reading.handler.ts | REAL | CQRS command (INSERT reading) | |
| GET /api/iot/devices/:id/readings | modules/iot/presentation/iot-sensors.controller.ts:139 | modules/iot/application/queries/get-readings.handler.ts | REAL | CQRS query | |
| GET /api/iot/anomalies | modules/iot/presentation/iot-sensors.controller.ts:158 | modules/iot/application/queries/get-anomalies.handler.ts | REAL | CQRS query | |
| GET /api/iot/sensors/:id/oee | modules/iot/presentation/iot-sensors.controller.ts:171 | iot-sensors.controller.ts:173 (inline) | REAL | oee_records then production_sessions fallback; 404 if none (no fake zeros) | |
| GET /api/iot-sensors/dashboard | modules/iot/presentation/iot-sensors-main.controller.ts:57 | iot-sensors-extended.service.ts (getDashboard) | REAL | DB read | |
| GET /api/iot-sensors/live | modules/iot/presentation/iot-sensors-main.controller.ts:65 | iot-sensors-extended.service.ts (getLiveReadings) | REAL | DB read | |
| GET /api/iot-sensors/alerts | modules/iot/presentation/iot-sensors-main.controller.ts:74 | iot-sensors-extended.service.ts (getAlerts) | REAL | DB read | |
| GET /api/iot-sensors/oee | modules/iot/presentation/iot-sensors-main.controller.ts:83 | iot-sensors-extended.service.ts (getOee) | REAL | DB read | DUPLICATE of GET /iot/oee |
| GET /api/iot-sensors | modules/iot/presentation/iot-sensors-main.controller.ts:92 | iot-sensors-extended.service.ts (listSensors) | REAL | DB read | |
| GET /api/iot-sensors/trends | modules/iot/presentation/iot-sensors-main.controller.ts:101 | iot-sensors-extended.service.ts (getSensorTrends) | REAL | DB read | |
| GET /api/iot-sensors/:id/history | modules/iot/presentation/iot-sensors-main.controller.ts:110 | iot-sensors-extended.service.ts (getSensorHistory) | REAL | DB read | |
| GET /api/iot-sensors/predictive-maintenance | modules/iot/presentation/iot-sensors-main.controller.ts:122 | iot-sensors-main.controller.ts:124 (inline) | REAL | SELECT equipment_maintenance | |
| PATCH /api/iot-sensors/alerts/:alertId/resolve | modules/iot/presentation/iot-sensors-main.controller.ts:138 | iot-sensors-main.controller.ts:139 (inline) | REAL | UPDATE iot_alerts | |
| POST /api/iot-sensors | modules/iot/presentation/iot-sensors-main.controller.ts:151 | iot-sensors-extended.service.ts (createSensor) | REAL | INSERT sensor | |
| POST /api/iot-sensors/alerts/:alertId/resolve | modules/iot/presentation/iot-sensors-main.controller.ts:163 | iot-sensors-main.controller.ts:166 (inline) | REAL | UPDATE iot_alerts | DUPLICATE of PATCH .../resolve |
| GET /api/iot/alerts | modules/iot/presentation/iot-alerts.controller.ts:42 | iot-main.service.ts (getAlerts) | REAL | DB read | |
| POST /api/iot/alerts/:id/acknowledge | modules/iot/presentation/iot-alerts.controller.ts:52 | iot-main.service.ts (acknowledgeAlert) | REAL | UPDATE alert | |
| GET /api/iot/safety-violations | modules/iot/presentation/iot-alerts.controller.ts:55 | iot-main.service.ts (getSafetyViolations) | REAL | DB read | DUPLICATE of SafetyViolationsController + iot-camera-events GET camera/safety-violations |
| POST /api/iot/alerts | modules/iot/presentation/iot-alerts.controller.ts:67 | iot-alerts.controller.ts:69 (inline) | REAL | INSERT iot_alerts | |
| PATCH /api/iot/alerts/:id/acknowledge | modules/iot/presentation/iot-alerts.controller.ts:84 | iot-main.service.ts (acknowledgeAlert) | REAL | UPDATE alert | DUPLICATE of POST .../acknowledge |
| GET /api/camera-ai/summary | modules/iot/presentation/camera-ai.controller.ts:39 | modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts (findSummary) | REAL | repo has 12 DB queries; camera-ai.service delegates | |
| GET /api/camera-ai/safety-trends | modules/iot/presentation/camera-ai.controller.ts:47 | drizzle-camera-ai.repo.ts (findSafetyTrends) | REAL | DB query | |
| GET /api/camera-ai/quality-analysis | modules/iot/presentation/camera-ai.controller.ts:56 | drizzle-camera-ai.repo.ts (findQualityAnalysis) | REAL | DB query | |
| GET /api/camera-ai/productivity-scores | modules/iot/presentation/camera-ai.controller.ts:64 | drizzle-camera-ai.repo.ts (findProductivityScores) | REAL | DB query | |
| GET /api/camera-ai/machine-utilization | modules/iot/presentation/camera-ai.controller.ts:72 | drizzle-camera-ai.repo.ts (findMachineUtilization) | REAL | DB query | |
| GET /api/camera-ai/anomaly-detection | modules/iot/presentation/camera-ai.controller.ts:80 | drizzle-camera-ai.repo.ts (findAnomalyDetection) | REAL | DB query | |
| GET /api/camera-ai/cameras | modules/iot/presentation/camera-ai.controller.ts:88 | drizzle-camera-ai.repo.ts (listActiveCameras) | REAL | DB query | |
| GET /api/camera-ai/cameras/:id/trigger-rules | modules/iot/presentation/camera-ai.controller.ts:97 | drizzle-camera-ai.repo.ts (findCameraConfig) | REAL | DB query | |
| PUT /api/camera-ai/cameras/:id/prompt | modules/iot/presentation/camera-ai.controller.ts:108 | camera-ai.service.ts:88 (updateCameraPrompt) | REAL | UPDATE camera config | |
| PUT /api/camera-ai/cameras/:id/trigger-rules | modules/iot/presentation/camera-ai.controller.ts:128 | camera-ai.service.ts (updateCameraTriggerRulesFromBody) | REAL | UPDATE camera config | |
| GET /api/camera-dashboard/stats | modules/iot/presentation/camera-dashboard.controller.ts:37 | modules/iot/application/camera-dashboard.service.ts (getStats) | REAL | DB read | |
| GET /api/camera-dashboard/pending-alerts | modules/iot/presentation/camera-dashboard.controller.ts:45 | camera-dashboard.service.ts (getPendingAlerts) | REAL | DB read | |
| GET /api/camera-dashboard/recent-events | modules/iot/presentation/camera-dashboard.controller.ts:52 | camera-dashboard.service.ts (getRecentEvents) | REAL | DB read | |
| GET /api/camera-dashboard/top-employees | modules/iot/presentation/camera-dashboard.controller.ts:61 | camera-dashboard.service.ts (getTopEmployees) | REAL | DB read | |
| GET /api/camera-dashboard/quality-stats | modules/iot/presentation/camera-dashboard.controller.ts:70 | camera-dashboard.service.ts (getQualityStats) | REAL | DB read | |
| GET /api/camera-dashboard/attendance-stats | modules/iot/presentation/camera-dashboard.controller.ts:78 | camera-dashboard.service.ts (getAttendanceStats) | REAL | DB read | |
| GET /api/camera-dashboard/production-stats | modules/iot/presentation/camera-dashboard.controller.ts:86 | camera-dashboard.service.ts (getProductionStats) | REAL | DB read | |
| GET /api/camera-dashboard/safety-stats | modules/iot/presentation/camera-dashboard.controller.ts:94 | camera-dashboard.service.ts (getSafetyStats) | REAL | DB read | |
| GET /api/camera-dashboard/weekly-trend | modules/iot/presentation/camera-dashboard.controller.ts:102 | camera-dashboard.service.ts (getWeeklyTrend) | REAL | DB read | |
| GET /api/camera-heatmap/data | modules/iot/presentation/camera-heatmap-reports.controller.ts:34 | camera-dashboard.service.ts (getHeatmapData) | REAL | DB read | |
| GET /api/camera-heatmap/employees | modules/iot/presentation/camera-heatmap-reports.controller.ts:45 | camera-dashboard.service.ts (getHeatmapEmployees) | REAL | DB read | |
| GET /api/camera-heatmap/employee | modules/iot/presentation/camera-heatmap-reports.controller.ts:54 | camera-dashboard.service.ts (getHeatmapEmployees) | REAL | DB read | DUPLICATE of /camera-heatmap/employees (same svc call) |
| GET /api/camera-heatmap/employee/:id | modules/iot/presentation/camera-heatmap-reports.controller.ts:64 | camera-dashboard.service.ts (getHeatmapEmployee) | REAL | DB read | |
| POST /api/camera-reports/generate-pdf | modules/iot/presentation/camera-heatmap-reports.controller.ts:80 | camera-dashboard.service.ts (generateReport 'pdf') | REAL | service generateReport | |
| POST /api/camera-reports/generate-excel | modules/iot/presentation/camera-heatmap-reports.controller.ts:91 | camera-dashboard.service.ts (generateReport 'excel') | REAL | service generateReport | |
| GET /api/camera-reports/generate-pdf | modules/iot/presentation/camera-heatmap-reports.controller.ts:101 | camera-heatmap-reports.controller.ts:103 | GREEN-LIE | returns hardcoded `{ url: null, period }` — no report generated, echoes query param | |
| GET /api/camera-reports/generate-excel | modules/iot/presentation/camera-heatmap-reports.controller.ts:107 | camera-heatmap-reports.controller.ts:109 | GREEN-LIE | returns hardcoded `{ url: null, period }` — no report generated, echoes query param | |
| GET /api/camera/recognition-stats | modules/iot/presentation/camera-recognition.controller.ts:33 | modules/iot/application/camera-extended.service.ts (getRecognitionStats) | REAL | DB read | DUPLICATE of iot GET /iot/recognition-stats |
| GET /api/camera/recognition-logs | modules/iot/presentation/camera-recognition.controller.ts:41 | camera-extended.service.ts (getRecognitionLogs) | REAL | DB read | |
| PATCH /api/camera/recognition-logs/:id/flag | modules/iot/presentation/camera-recognition.controller.ts:52 | camera-extended.service.ts (flagRecognitionLog) | REAL | UPDATE log | |
| PATCH /api/camera/recognition-logs/:id/unflag | modules/iot/presentation/camera-recognition.controller.ts:63 | camera-extended.service.ts (unflagRecognitionLog) | REAL | UPDATE log | |
| POST /api/camera/recognition-logs/:id/flag | modules/iot/presentation/camera-recognition.controller.ts:74 | camera-extended.service.ts (flagRecognitionLog) | REAL | UPDATE log | DUPLICATE of PATCH .../flag |
| POST /api/camera/recognition-logs/:id/unflag | modules/iot/presentation/camera-recognition.controller.ts:86 | camera-extended.service.ts (unflagRecognitionLog) | REAL | UPDATE log | DUPLICATE of PATCH .../unflag |
| GET /api/camera-alerts | modules/iot/presentation/camera-alerts.controller.ts:48 | camera-extended.service.ts (getCameraAlerts) | REAL | DB read | |
| POST /api/camera-alerts/:id/acknowledge | modules/iot/presentation/camera-alerts.controller.ts:59 | camera-extended.service.ts (acknowledgeCameraAlert) | REAL | UPDATE alert | |
| POST /api/camera-alerts/:id/resolve | modules/iot/presentation/camera-alerts.controller.ts:69 | camera-extended.service.ts (resolveCameraAlert) | REAL | UPDATE alert | |
| PATCH /api/camera-alerts/:id/acknowledge | modules/iot/presentation/camera-alerts.controller.ts:84 | camera-extended.service.ts (acknowledgeCameraAlert) | REAL | UPDATE alert | DUPLICATE of POST .../acknowledge |
| PATCH /api/camera-alerts/:id/resolve | modules/iot/presentation/camera-alerts.controller.ts:94 | camera-extended.service.ts (resolveCameraAlert) | REAL | UPDATE alert | DUPLICATE of POST .../resolve |
| GET /api/camera-settings | modules/iot/presentation/camera-alerts.controller.ts:123 | camera-extended.service.ts (getGlobalCameraSettings) | REAL | reads `settings` singleton | |
| POST /api/camera-settings | modules/iot/presentation/camera-alerts.controller.ts:132 | camera-extended.service.ts (saveGlobalCameraSettings) | REAL | upsert settings | |
| PUT /api/camera-settings | modules/iot/presentation/camera-alerts.controller.ts:143 | camera-extended.service.ts (saveGlobalCameraSettings) | REAL | upsert settings | DUPLICATE of POST /camera-settings |
| GET /api/cameras | modules/iot/presentation/camera-alerts.controller.ts:160 | camera-extended.service.ts (listAllCameras) | REAL | DB read | DUPLICATE of camera GET /camera/cameras + camera-ai GET /camera-ai/cameras |
| POST /api/cameras | modules/iot/presentation/camera-alerts.controller.ts:173 | camera-extended.service.ts (createCameraManagement) | REAL | INSERT camera | |
| GET /api/cameras/:id | modules/iot/presentation/camera-alerts.controller.ts:184 | camera-extended.service.ts (getCameraById) | REAL | DB read | |
| PATCH /api/cameras/:id | modules/iot/presentation/camera-alerts.controller.ts:210 | camera-extended.service.ts (updateCameraManagement / patchCameraAi) | REAL | UPDATE; AI-only keys route to patchCameraAi (AI-config persistence noted out-of-scope in comment) | |
| DELETE /api/cameras/:id | modules/iot/presentation/camera-alerts.controller.ts:231 | camera-extended.service.ts (deleteCameraManagement) | REAL | soft delete | |
| GET /api/camera-employee-ratings | modules/iot/presentation/camera-alerts.controller.ts:247 | camera-extended.service.ts (getCameraEmployeeRatings) | REAL | DB read | |
| POST /api/ai-camera/analyze-by-missions | modules/iot/presentation/camera-alerts.controller.ts:271 | camera-ai.service.ts (analyzeByMissions) | REAL | real VLM call over uploaded frame (2.11 fix from fake echo) | |
| GET /api/machine-status-current | modules/iot/presentation/camera-alerts.controller.ts:293 | iot-main.service.ts (getMachineStatusCurrent) | REAL | DB read | DUPLICATE of iot GET /iot/machine-status |
| GET /api/machine-status-logs | modules/iot/presentation/camera-alerts.controller.ts:308 | iot-main.service.ts (getMachineStatusLogs) | REAL | DB read | DUPLICATE of iot GET /iot/machine-status-logs |
| GET /api/safety-violations | modules/iot/presentation/camera-alerts.controller.ts:324 | iot-main.service.ts (getSafetyViolations) | REAL | DB read | DUPLICATE of iot GET /iot/safety-violations |
| GET /api/employee-productivity | modules/iot/presentation/camera-alerts.controller.ts:340 | iot-main.service.ts (getEmployeeProductivity) | REAL | DB read | DUPLICATE of iot GET /iot/employee-productivity |
| GET /api/quality-defects-camera | modules/iot/presentation/camera-alerts.controller.ts:356 | camera-extended.service.ts (getQualityDefectsCamera) | REAL | DB read | overlaps iot-camera-events GET /camera/quality-defects-camera |
| GET /api/camera/camera-events | modules/iot/presentation/iot-camera-events.controller.ts:46 | modules/iot/application/iot-camera-events.service.ts (listCameraEvents) | REAL | DB read | |
| POST /api/camera/camera-events | modules/iot/presentation/iot-camera-events.controller.ts:55 | iot-camera-events.service.ts (createCameraEvent) | REAL | INSERT event | |
| PATCH /api/camera/camera-events/:id | modules/iot/presentation/iot-camera-events.controller.ts:77 | iot-camera-events.service.ts (updateCameraEvent) | REAL | UPDATE event | |
| GET /api/camera/safety-violations | modules/iot/presentation/iot-camera-events.controller.ts:87 | iot-camera-events.service.ts (listSafetyViolations) | REAL | DB read | overlaps iot GET /iot/safety-violations |
| POST /api/camera/safety-violations | modules/iot/presentation/iot-camera-events.controller.ts:96 | iot-camera-events.service.ts (createSafetyViolation) | REAL | INSERT violation | |
| GET /api/camera/quality-defects-camera | modules/iot/presentation/iot-camera-events.controller.ts:114 | iot-camera-events.service.ts (listQualityDefects) | REAL | DB read | overlaps GET /quality-defects-camera |
| POST /api/camera/quality-defects-camera | modules/iot/presentation/iot-camera-events.controller.ts:122 | iot-camera-events.service.ts (createQualityDefect) | REAL | INSERT defect | |
| PATCH /api/camera/quality-defects-camera/:id | modules/iot/presentation/iot-camera-events.controller.ts:141 | iot-camera-events.service.ts (updateQualityDefect) | REAL | UPDATE defect | |
| GET /api/camera/cameras | modules/iot/presentation/iot-camera.controller.ts:50 | modules/iot/application/iot-camera.service.ts (listCameras) | REAL | DB read | DUPLICATE of GET /cameras + /camera-ai/cameras |
| GET /api/camera/cameras/:id | modules/iot/presentation/iot-camera.controller.ts:58 | iot-camera.service.ts (getCamera) | REAL | DB read | |
| POST /api/camera/cameras | modules/iot/presentation/iot-camera.controller.ts:68 | iot-camera.service.ts (createCamera) | REAL | INSERT camera | DUPLICATE of POST /cameras |
| PATCH /api/camera/cameras/:id | modules/iot/presentation/iot-camera.controller.ts:88 | iot-camera.service.ts (updateCamera) | REAL | UPDATE camera | |
| DELETE /api/camera/cameras/:id | modules/iot/presentation/iot-camera.controller.ts:113 | iot-camera.service.ts (deleteCamera) | REAL | delete camera | DUPLICATE of DELETE /cameras/:id |
| GET /api/camera/cameras/:cameraId/zones | modules/iot/presentation/iot-camera.controller.ts:124 | iot-camera.service.ts (getCameraZones) | REAL | DB read | |
| POST /api/camera/camera-zones | modules/iot/presentation/iot-camera.controller.ts:132 | iot-camera.service.ts (createCameraZone) | REAL | INSERT zone | |
| POST /api/iot/warehouse-guard/verify-exit | modules/iot/presentation/warehouse-exit-guard.controller.ts:32 | modules/iot/application/warehouse-exit-guard.service.ts (verifyExit) | REAL | face-recognition verify + DB | |
| GET /api/iot/warehouse-guard/cross-checks | modules/iot/presentation/warehouse-exit-guard.controller.ts:42 | warehouse-exit-guard.service.ts (listCrossChecks) | REAL | reads ai_camera_cross_check | |
| GET /api/iot/tablet/orders | modules/iot/presentation/iot-tablet.controller.ts:86 | modules/iot/application/iot-tablet.service.ts (getTabletOrders) | REAL | DB read | |
| GET /api/iot/tablet/worker-schedule | modules/iot/presentation/iot-tablet.controller.ts:98 | iot-tablet.service.ts (getWorkerSchedule) | REAL | DB read | |
| GET /api/iot/tablet/equipment | modules/iot/presentation/iot-tablet.controller.ts:110 | iot-tablet.service.ts (getTabletEquipment) | REAL | DB read | |
| GET /api/iot/tablet/shift | modules/iot/presentation/iot-tablet.controller.ts:122 | iot-tablet.controller.ts:124 (inline) | REAL | SELECT shift_handovers | |
| GET /api/iot/tablet/sessions | modules/iot/presentation/iot-tablet.controller.ts:135 | iot-tablet.controller.ts:137 (inline) | REAL | SELECT production_sessions | |
| POST /api/iot/tablet/sessions | modules/iot/presentation/iot-tablet.controller.ts:146 | iot-tablet.controller.ts:147 (inline) | REAL | INSERT production_sessions | |
| POST /api/iot/tablet/login | modules/iot/presentation/iot-tablet.controller.ts:170 | iot-tablet.service.ts (login) | REAL | auth against DB | |
| POST /api/iot/tablet/sos-alert | modules/iot/presentation/iot-tablet.controller.ts:181 | iot-tablet.service.ts (raiseSosAlert) | REAL | INSERT alert | |
| POST /api/iot/tablet/handover | modules/iot/presentation/iot-tablet.controller.ts:201 | iot-tablet.controller.ts:202 (inline) | REAL | INSERT shift_handovers | |
| POST /api/iot/material-kit-items/:id/scan | modules/iot/presentation/iot-tablet.controller.ts:232 | iot-tablet.controller.ts:233 (inline) | REAL | UPDATE material_kit_items | |
| PATCH /api/iot/material-kit-items/:id/scan | modules/iot/presentation/iot-tablet.controller.ts:245 | iot-tablet.controller.ts:246 (inline) | REAL | UPDATE material_kit_items | DUPLICATE of POST .../scan |
| POST /api/iot/production-sessions | modules/iot/presentation/iot-tablet.controller.ts:263 | iot-tablet.controller.ts:264 (inline) | REAL | INSERT production_sessions | |
| GET /api/iot/production-sessions/:id/crew | modules/iot/presentation/iot-tablet.controller.ts:288 | iot-tablet.controller.ts:289 (inline) | REAL | SELECT machine_crews | |
| POST /api/iot/production-sessions/:id/crew | modules/iot/presentation/iot-tablet.controller.ts:300 | iot-tablet.controller.ts:301 (inline) | REAL | INSERT machine_crews | |
| POST /api/iot/production-sessions/:id/start | modules/iot/presentation/iot-tablet.controller.ts:322 | iot-tablet.controller.ts:323 (inline) | REAL | checklist gate + UPDATE running (422 if incomplete) | |
| POST /api/iot/production-sessions/:id/stop | modules/iot/presentation/iot-tablet.controller.ts:377 | iot-tablet.controller.ts:378 (inline) | REAL | UPDATE+OEE compute; publishes MesCompletedEvent → QC (golden thread) | Real event with QC listener (not no-op) |
| POST /api/iot/production-sessions/:id/defect | modules/iot/presentation/iot-tablet.controller.ts:513 | iot-tablet.controller.ts:514 (inline) | REAL | UPDATE session + INSERT downtime_events + brak-limit check | |
| POST /api/iot/production-sessions/:id/evaluation | modules/iot/presentation/iot-tablet.controller.ts:542 | iot-tablet.controller.ts:543 (inline) | REAL | INSERT shift_evaluations | |
| POST /api/iot/production-sessions/:id/material-return | modules/iot/presentation/iot-tablet.controller.ts:573 | iot-tablet.controller.ts:574 (inline) | REAL | INSERT material_movements + credits warehouse_stock | |
| POST /api/iot/production-sessions/:id/inline-qc | modules/iot/presentation/iot-tablet.controller.ts:695 | iot-tablet.controller.ts:696 (inline) | REAL | INSERT inline_qc_checks | |
| POST /api/iot/downtime-events | modules/iot/presentation/iot-tablet.controller.ts:714 | iot-tablet.controller.ts:715 (inline) | REAL | INSERT downtime_events | |

### Notes
- **MOCK cluster (agents module, high-risk telemetry/insights):** `GET /agents/iot/sensor`, `/agents/iot/sensor/:machineId`, `/agents/iot/anomaly/:machineId`, `/agents/iot/rul/:machineId` all return hardcoded sensor values (iot-agent.service.ts:34,53) — and are consumed by FE `AgentsHub.tsx`, so a fake live telemetry panel is shown. `/agents/facilities/utility` (hardcoded bills), `/agents/facilities/supplies` (hardcoded low/out), `/agents/strategic/investment` (hardcoded recommendations) are also MOCK. `/agents/strategic/scenario` is REAL AI text but its `impact` numbers are hardcoded 0.
- **GREEN-LIE:** `GET /camera-reports/generate-pdf` and `GET /camera-reports/generate-excel` return `{ url: null, period }` (echo of query param, no report). The POST siblings are REAL.
- **501-STUB (honest):** `POST /ai-agents/:agentId/trigger` (notImplemented) and `GET /iot/energy-consumption` (owner-mandated EP-IOT-018, no physical sensor).
- **The mes/anomaly + mes/oee ai-agents routes are REAL** (real z-score over telemetry, real OEE math, persists ai_decision_log) — the *legacy* `agents/iot/*` cluster is the mock one. Two parallel IoT-agent implementations exist.
- **Event emits:** `iot/production-sessions/:id/stop` publishes MesCompletedEvent with a real QC listener (verified golden-thread, not a no-op). No-op emits not found in these routes.
- **Heavy DUPLICATE surface:** camera list served 3 ways (`/cameras`, `/camera/cameras`, `/camera-ai/cameras`); machine-status/logs, safety-violations, employee-productivity, quality-defects each exposed under both `/iot/*` and bare top-level prefixes; many POST+PATCH pairs do the identical write (acknowledge/resolve/flag/scan/resolve-alert).


---

## CRM + Marketing

Module folders: `apps/api/src/modules/crm`, `apps/api/src/modules/marketing`. 21 controllers, 233 routes.

**High-risk verdict (RFM/analytics/NPS/churn):** ALL real DB-backed. CRM analytics (funnel/cohort/kmeans/churn/churn-retrain) read+persist via `drizzle-crm-analytics.repo.ts` (real SQL against `crm_deals`/`crm_stages`/`sales_orders`/`churn_model_params`/`rfm_clusters`). Marketing NPS/churn/ROI go through `drizzle-marketing-ext.repo.ts` (`npsResponses`, `marketingLeadsCanonical`, `sdCustomers`). No `Math.random`, no hardcoded scoring payloads found.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /crm/activities | crm/presentation/crm-activities.controller.ts:42 | :43 | REAL | svc.list → crm-activities.service | |
| GET /crm/activities/today | :60 | :61 | REAL | svc.today | |
| GET /crm/activities/:id | :68 | :69 | REAL | svc.getById | |
| POST /crm/activities | :80 | :84 | REAL | svc.create (INSERT) | |
| PATCH /crm/activities/:id/complete | :94 | :98 | REAL | svc.complete | |
| PATCH /crm/activities/:id | :110 | :114 | REAL | svc.update | |
| DELETE /crm/activities/:id | :126 | :129 | REAL | svc.delete; returns {} | |
| GET /crm/funnel | crm/presentation/crm-analytics.controller.ts:73 | :76 | REAL | funnel.service→repo.getFunnelStageData SQL (drizzle-crm-analytics.repo.ts:143) | high-risk verified |
| GET /crm/cohort | :81 | :84 | REAL | cohort.service→repo.getCohortCountOrders SQL (repo:99) | high-risk verified |
| POST /crm/rfm/cluster | :89 | :93 | REAL | kmeans.service persists rfm_clusters (repo:199) | high-risk verified |
| POST /crm/churn/predict | :98 | :102 | REAL | churn.service.predictWithActiveModel; loads churn_model_params (repo:32) | high-risk; DEFAULT coeffs only if no DB model |
| POST /crm/churn/retrain | :107 | :111 | REAL | churn-retrain.service; INSERT churn_model_params (repo:61) | high-risk verified |
| POST /crm/leads/:id/ai-analysis | crm/presentation/crm-ai.controller.ts:44 | :46 | REAL | crm-ai.service.analyzeLeadAi→repo.getLeadWithActivity + updateLeadScore | rule-based score (not ML) but DB-driven |
| POST /crm/leads/:id/scoring-v2 | :58 | :60 | REAL | crm-ai.service.scoreLeadV2→repo.getLeadWithDeals + updateLeadScoreSimple | |
| POST /crm/deals/:id/ai-forecast | :72 | :74 | REAL | crm-ai.service.forecastDeal→repo.getDealWithActivity | rule-based probability |
| GET /crm/dashboard-analysis | :84 | :85 | REAL | crm-ai.service.getDashboardAnalysis→repo lead/deal dashboards | |
| POST /crm/nba/:entityType/:entityId | :93 | :95 | REAL | crm-ai.service.getNextBestAction→repo.getEntityActivities | rule map over real last-activity |
| POST /crm/suggest-action | :102 | :104 | REAL | crm-ai.service.suggestAction→repo.getRecentActivity | |
| GET /crm/ai/autofill/:entityType/:id | crm/presentation/crm-ai-extended.controller.ts:81 | :82 | 501-STUB | svc.autofill→NOT_IMPL (crm-ai-extended.service.ts:32) | no AI provider |
| GET /crm/ai/churn-rescue/:entityType/:id | :88 | :89 | 501-STUB | svc.analyzeChurn→NOT_IMPL (service:40) | no ML model |
| GET /crm/ai/extended/auto-tasks/suggest | :95 | :96 | REAL | svc.suggestAutoTasks SELECT crm_tasks (service:48) | |
| POST /crm/ai/extended/auto-tasks/suggest | :103 | :104 | REAL | svc.suggestAutoTasks (service:48) | |
| GET /crm/ai/leads | :111 | :112 | REAL | svc.getAiLeads SELECT crmLeads+activity (service:116) | |
| GET /crm/ai/nba | :118 | :119 | REAL | svc.getAiNba SELECT crm_activities (service:153) | overlaps GET /crm/nba (crm-extras) |
| POST /crm/ai/nba/create-task | :126 | :127 | REAL | svc.createAutoTask INSERT crm_tasks (service:75) | |
| POST /crm/ai/nba/:entityType/:entityId | :141 | :142 | DUPLICATE | wraps crmAiSvc.getNextBestAction; counterpart POST /crm/nba/:entityType/:entityId (crm-ai.controller:93) | reshapes labels; controller-side biz logic (Rule 6) |
| POST /crm/ai/churn-rescue/:entityType/:id | :165 | :166 | 501-STUB | svc.analyzeChurn→NOT_IMPL (service:40) | |
| GET /crm/ai/quick-score/:entityType/:id | :172 | :173 | 501-STUB | svc.getAiQuickScore→NOT_IMPL (service:205) | overlaps real GET /crm/quick-score (crm-auto-lead) |
| POST /crm/ai/autofill/:entityId | :179 | :181 | 501-STUB | svc.autofill→NOT_IMPL (service:32) | |
| POST /crm/ai/leads/:entityId/scoring-v2 | :192 | :194 | DUPLICATE | wraps crmAiSvc.scoreLeadV2; counterpart POST /crm/leads/:id/scoring-v2 (crm-ai.controller:58) | reshapes into scoring{} |
| GET /crm/quick-score/:entityType/:id | crm/presentation/crm-auto-lead.controller.ts:44 | :45 | REAL | crm-auto-lead.service.quickScore | |
| GET /crm/supervisor-dashboard | :55 | :57 | REAL | svc.getSupervisorDashboard | |
| POST /crm/churn-rescue/:entityType/:id | :65 | :67 | REAL | svc.churnRescue | overlaps 501 /crm/ai/churn-rescue |
| GET /crm/auto-lead/sources | :73 | :74 | REAL | svc.getAutoLeadSources | |
| POST /crm/auto-lead/call | :91 | :93 | REAL | svc.ingestCallLead; @Public + WebhookSignatureGuard (HMAC) | |
| POST /crm/auto-lead/form | :104 | :106 | REAL | svc.ingestFormLead; HMAC guard | |
| POST /crm/auto-lead/telegram | :117 | :119 | REAL | svc.ingestTelegramLead; HMAC guard | |
| POST /crm/auto-lead/website | :130 | :132 | REAL | svc.ingestWebsiteLead; HMAC guard | |
| GET /crm-bitrix/proposals | crm/presentation/crm-bitrix-compat.controller.ts:51 | :52 | REAL | svc.listProposals | overlaps GET /crm/proposals (crm-extras) |
| GET /crm-bitrix/invoices | :58 | :59 | REAL | svc.listInvoices | |
| GET /crm-bitrix/robots | :65 | :66 | REAL | svc.listRobots | |
| GET /crm-bitrix/robots/:id | :72 | :73 | REAL | svc.getRobot | |
| POST /crm-bitrix/robots | :77 | :80 | REAL | svc.createRobot | |
| PUT /crm-bitrix/robots/:id | :84 | :87 | REAL | svc.updateRobot | |
| PATCH /crm-bitrix/robots/:id/toggle | :91 | :93 | REAL | svc.toggleRobot | |
| DELETE /crm-bitrix/robots/:id | :97 | :99 | REAL | svc.deleteRobot | |
| PATCH /crm-bitrix/robots/:id | :103 | :106 | REAL | svc.updateRobot | dup of PUT robots/:id (same svc) |
| POST /crm-bitrix/robots/:id/toggle | :110 | :112 | REAL | svc.toggleRobot | dup of PATCH toggle |
| PATCH /crm-bitrix/proposals/:id/stage | :116 | :117 | REAL | svc.updateProposalStage | |
| PATCH /crm-bitrix/invoices/:id/stage | :123 | :124 | REAL | svc.updateInvoiceStage | |
| DELETE /crm-bitrix/proposals/:id | :130 | :132 | REAL | svc.deleteProposal | |
| DELETE /crm-bitrix/invoices/:id | :136 | :138 | REAL | svc.deleteInvoice | |
| POST /crm/email/send | crm/presentation/crm-comms.controller.ts:51 | :53 | GREEN-LIE | returns {sent:true} but only repo.logEmail; no mail provider (crm-comms.service.ts:16) | claims sent; only logs activity row |
| POST /crm/meetings/schedule | :62 | :64 | REAL | svc.scheduleMeeting persists meeting (service:22) | |
| POST /crm/sms/send | :80 | :82 | GREEN-LIE | returns {sent:true} but only repo.logSms; no SMS provider (service:29) | claims sent; only logs |
| POST /crm/whatsapp/send | :91 | :93 | GREEN-LIE | returns {sent:true} but only repo.logWhatsapp; no provider (service:35) | claims sent; only logs |
| GET /crm/companies | crm/presentation/crm-companies.controller.ts:53 | :54 | REAL | svc.listCompanies | |
| GET /crm/companies/:id | :61 | :62 | REAL | svc.getCompany | |
| GET /crm/companies/:companyId/contacts/:contactId | :73 | :74 | REAL | svc.getCompanyContacts + find | |
| GET /crm/companies/:id/contacts | :85 | :86 | REAL | svc.getCompanyContacts | |
| GET /crm/companies/:id/deals | :93 | :94 | REAL | svc.getCompanyDeals | |
| GET /crm/companies/:id/credit | :101 | :102 | REAL | svc.getCompanyCredit | |
| POST /crm/companies/check-duplicates | :113 | :115 | REAL | svc.checkDuplicates (DB query) | |
| POST /crm/companies | :122 | :126 | REAL | svc.createCompany | |
| PATCH /crm/companies/:id | :135 | :139 | REAL | svc.updateCompany | |
| DELETE /crm/companies/:id | :151 | :154 | REAL | svc.deleteCompany; returns {} | |
| PATCH /crm/companies/:id/credit-limit | :163 | :167 | REAL | svc.updateCreditLimit | |
| GET /crm/lead-stages | :177 | :178 | REAL | svc.listLeadStages | |
| GET /crm/lead-stages/:id | :185 | :186 | REAL | svc.getLeadStage | |
| POST /crm/lead-stages | :197 | :201 | REAL | svc.createLeadStage | |
| PATCH /crm/lead-stages/:id | :210 | :214 | REAL | svc.updateLeadStage | |
| POST /crm/companies/:id/contacts | :226 | :229 | REAL | svc.createCompanyContact | |
| DELETE /crm/companies/:id/contacts/:contactId | :238 | :241 | REAL | svc.deleteCompanyContact | |
| GET /crm/contacts | crm/presentation/crm-contacts.controller.ts:41 | :42 | REAL | svc.listContacts | |
| GET /crm/contacts/:id | :49 | :50 | REAL | svc.getContact | |
| POST /crm/contacts/check-duplicates | :61 | :63 | REAL | svc.checkDuplicates | |
| POST /crm/contacts | :70 | :74 | REAL | svc.createContact | |
| PATCH /crm/contacts/:id | :83 | :87 | REAL | svc.updateContact | |
| DELETE /crm/contacts/:id | :99 | :102 | REAL | svc.deleteContact | |
| GET /crm/custom-fields | crm/presentation/crm-custom-fields.controller.ts:37 | :38 | REAL | svc.list | |
| GET /crm/custom-fields/:entityType | :44 | :45 | REAL | svc.list(entityType) | |
| POST /crm/custom-fields | :52 | :56 | REAL | svc.create | |
| PATCH /crm/custom-fields/:id | :69 | :73 | REAL | svc.update | |
| POST /crm/custom-fields/reorder | :84 | :88 | REAL | svc.reorder | |
| DELETE /crm/custom-fields/:id | :103 | :106 | REAL | svc.delete | |
| GET /crm/deals | crm/presentation/crm-deals.controller.ts:89 | :91 | REAL | dealsService.findAll | |
| GET /crm/deals/:id | :103 | :105 | REAL | dealsService.findOne | |
| POST /crm/deals | :116 | :118 | REAL | CommandBus CreateDealCommand | |
| PATCH /crm/deals/:id/won | :141 | :143 | REAL | MarkDealWonCommand | |
| PATCH /crm/deals/:id/stage | :157 | :159 | REAL | UpdateDealStageCommand | |
| PATCH /crm/deals/:id | :173 | :175 | REAL | UpdateDealCommand | |
| DELETE /crm/deals/:id | :189 | :191 | REAL | DeleteDealCommand | |
| POST /crm/deals/quick | :199 | :201 | REAL | dealsService.create | |
| GET /crm/comments | crm/presentation/crm-extras.controller.ts:45 | :46 | REAL | svc.listComments | |
| POST /crm/comments | :62 | :64 | REAL | svc.createComment | |
| GET /crm/history | :78 | :79 | REAL | svc.getHistory | |
| GET /crm/dashboard | :94 | :95 | REAL | svc.getDashboard | |
| GET /crm/pipeline | :101 | :102 | REAL | svc.getPipeline | |
| GET /crm/tasks | :108 | :109 | REAL | svc.listTasks | |
| POST /crm/tasks | :125 | :127 | REAL | svc.createTask | |
| GET /crm/proposals | :134 | :135 | REAL | svc.listProposals | overlaps /crm-bitrix/proposals |
| GET /crm/nba | :151 | :152 | REAL | svc.getNba | overlaps GET /crm/ai/nba |
| GET /crm | :158 | :159 | MOCK | returns hardcoded {module:'crm',status:'active'} — no DB | harmless status ping |
| GET /crm/followup-activities | crm/presentation/crm-followup-compat.controller.ts:56 | :57 | REAL | svc.list | |
| GET /crm/followup-activities/today | :66 | :67 | REAL | svc.today | |
| POST /crm/followup-activities | :74 | :76 | REAL | svc.create | |
| PATCH /crm/followup-activities/:id | :85 | :86 | REAL | svc.update | |
| DELETE /crm/followup-activities/:id | :95 | :96 | REAL | svc.delete; returns {} | |
| PATCH /crm/leads/:id | crm/presentation/crm-leads-ops.controller.ts:55 | :57 | REAL | CommandBus UpdateLeadCommand | |
| PATCH /crm/leads/:id/pipeline-stage | :68 | :70 | REAL | UpdateLeadStageCommand | overlaps PATCH /crm/leads/:id/stage (crm-leads) |
| POST /crm/leads/:id/convert | :82 | :84 | REAL | ConvertLeadToDealCommand | |
| DELETE /crm/leads/:id | :105 | :106 | REAL | DeleteLeadCommand | |
| GET /crm/leads | crm/presentation/crm-leads.controller.ts:100 | :101 | REAL | leadsService.findAll | |
| GET /crm/leads/quick | :115 | :116 | REAL | leadsService.findAll | |
| GET /crm/leads/:id | :124 | :125 | REAL | leadsService.findOne | |
| GET /crm/leads/:id/emails | :135 | :136 | REAL | leadsService.findOne → emails array | |
| POST /crm/leads | :148 | :149 | REAL | leadsService.create | |
| PATCH /crm/leads/:id/stage | :159 | :160 | REAL | leadsService.update | |
| PATCH /crm/leads/:id/qualify | :174 | :175 | REAL | QualifyLeadCommand | |
| POST /crm/leads/:id/emails | :185 | :186 | REAL | leadsService.logEmail (honest queued, prior green-lie fixed) | |
| POST /crm/leads/quick | :198 | :199 | REAL | leadsService.create | |
| GET /marketing/campaigns | marketing/presentation/marketing.controller.ts:61 | :63 | REAL | campaignsSvc.findAll (marketing_campaigns) | |
| GET /marketing/campaigns/:id | :85 | :87 | REAL | campaignsSvc.findOne | |
| POST /marketing/campaigns | :95 | :97 | REAL | campaignsSvc.create | |
| PATCH /marketing/campaigns/:id | :112 | :114 | REAL | campaignsSvc.update | |
| DELETE /marketing/campaigns/:id | :128 | :132 | REAL | campaignsSvc.remove | |
| POST /marketing/campaigns/:id/launch | :139 | :141 | REAL | campaignsSvc.update status=active | |
| GET /marketing/social/posts | marketing/presentation/marketing-analytics.controller.ts:58 | :60 | REAL | svc.getSocialPosts | |
| POST /marketing/social/posts | :64 | :68 | REAL | svc.createSocialPost | |
| PUT /marketing/social/posts/:id | :73 | :76 | REAL | svc.updateSocialPost | |
| DELETE /marketing/social/posts/:id | :81 | :85 | REAL | svc.deleteSocialPost | |
| GET /marketing/leads | :89 | :91 | REAL | leadsSvc.findAll | |
| POST /marketing/leads | :95 | :99 | REAL | leadsSvc.create | |
| GET /marketing/leads/:id | :104 | :106 | REAL | leadsSvc.findOne | shadows GET /marketing/leads/loss-analysis (declared later) |
| PUT /marketing/leads/:id | :110 | :113 | REAL | leadsSvc.update | |
| PATCH /marketing/leads/:id/status | :118 | :121 | REAL | leadsSvc.update status | |
| PATCH /marketing/leads/:id | :126 | :133 | REAL | leadsSvc.update | |
| GET /marketing/email/templates | :138 | :140 | REAL | svc.getEmailTemplates | |
| POST /marketing/email/templates | :144 | :148 | REAL | svc.createEmailTemplate | |
| PUT /marketing/email/templates/:id | :153 | :156 | REAL | svc.updateEmailTemplate | |
| DELETE /marketing/email/templates/:id | :161 | :165 | REAL | svc.deleteEmailTemplate | |
| GET /marketing/analytics/overview | :169 | :171 | REAL | svc.getAnalyticsOverview→repo SQL | |
| GET /marketing/analytics/campaigns | :175 | :177 | REAL | svc.getCampaignAnalytics→repo | |
| GET /marketing/analytics/audience | :181 | :183 | REAL | svc.getLeadsBySource→repo | |
| GET /marketing/analytics/conversion | :187 | :189 | REAL | svc.getMarketingFunnel→repo (marketing-ext.repo:367) | |
| GET /marketing/analytics/channel-roi | :193 | :198 | REAL | svc.getChannelRoi→repo.getChannelRollup + ROI engine | honest-empty guard |
| GET /marketing/funnel | :202 | :204 | DUPLICATE | svc.getMarketingFunnel; counterpart GET /marketing/analytics/conversion (:187) | same service method |
| GET /marketing/reports | :208 | :210 | DUPLICATE | svc.getCampaignAnalytics; counterpart GET /marketing/analytics/campaigns (:175) | same service method |
| GET /marketing/reports/:id | :214 | :216 | REAL | svc.getCampaignStats | |
| GET /marketing/leads/loss-analysis | :220 | :224 | 404-DEAD | handler real (leadsSvc.getLossAnalysis) but route shadowed by GET /marketing/leads/:id (:104, registered earlier) → id='loss-analysis'→NaN | Express first-match; unreachable |
| POST /marketing/content/ai-generate | marketing/presentation/marketing-analytics-stubs.controller.ts:116 | :118 | REAL | INSERT marketing_content draft; ai_provider:'pending' (honest, no AI) | |
| GET /marketing/nps/stats | :134 | :136 | REAL | svc.getNpsStats→npsResponses (repo:424) | high-risk verified |
| GET /marketing/nps/monthly | :140 | :142 | REAL | svc.getNpsStats.monthlyTrend | |
| GET /marketing/nps | :148 | :150 | REAL | svc.getNps→npsResponses | |
| POST /marketing/nps | :154 | :157 | REAL | INSERT nps_responses | |
| GET /marketing/churn-risk/ai-signal | :176 | :178 | REAL | svc.getChurnRisk→sdCustomers (repo:653) | high-risk verified |
| GET /marketing/churn-risk | :182 | :184 | REAL | svc.getChurnRisk | dup of churn-risk/ai-signal (same method) |
| POST /marketing/churn-risk/ai-signal | :188 | :189 | REAL | UPDATE marketing_leads score | |
| GET /marketing/ai/hot-leads | :208 | :210 | REAL | svc.getHotLeads→marketingLeadsCanonical (repo:466) | score as proxy, real DB |
| GET /marketing/ai-assistant | :214 | :215 | REAL | SELECT marketing_settings ai_chat_history; ai_provider:'pending' | |
| POST /marketing/ai-assistant | :225 | :227 | REAL | UPSERT chat history; placeholder reply (honest, no AI) | |
| GET /marketing/leads/sources/summary | :246 | :248 | REAL | svc.getLeadsSourcesSummary→group by source (repo:501) | |
| GET /marketing/leads/automation/overdue-leads | :252 | :254 | REAL | svc.getOverdueLeads (repo:483) | |
| POST /marketing/leads/recalculate-scores | :258 | :260 | REAL | UPDATE marketing_leads score recompute | |
| POST /marketing/leads/:id/convert-to-crm | :280 | :282 | REAL | INSERT crm_leads + UPDATE marketing_leads | |
| GET /marketing/inbox/stats | :315 | :317 | REAL | svc.getInboxStats | |
| GET /marketing/inbox/conversations | :321 | :322 | REAL | SELECT social_conversations | |
| GET /marketing/inbox/conversations/:id/messages | :333 | :334 | REAL | SELECT social_messages | |
| POST /marketing/inbox/conversations/:id/reply | :345 | :347 | REAL | INSERT social_messages + UPDATE conv | |
| POST /marketing/inbox/ai-reply/:id | :364 | :366 | REAL | INSERT placeholder social_messages; ai_provider:'pending' (honest) | |
| PATCH /marketing/inbox/conversations/:id/status | :382 | :383 | REAL | UPDATE social_conversations | |
| GET /marketing/ab-tests | :392 | :393 | REAL | SELECT marketing_ab_tests | |
| POST /marketing/ab-tests | :397 | :398 | REAL | INSERT marketing_ab_tests | |
| GET /marketing/exhibitions | :423 | :424 | REAL | SELECT exhibitions | |
| GET /marketing/exhibitions/:id | :431 | :432 | REAL | SELECT exhibitions by id | |
| GET /marketing/exhibitions/:id/leads | :440 | :441 | REAL | SELECT exhibition_leads | |
| GET /marketing/exhibitions/:id/qr | :448 | :449 | REAL | SELECT exhibitions qr_code | |
| POST /marketing/exhibitions | :457 | :458 | REAL | INSERT exhibitions | |
| POST /marketing/exhibitions/:id/leads | :477 | :478 | REAL | INSERT exhibition_leads | |
| POST /marketing/exhibitions/:id/qr | :499 | :500 | REAL | UPDATE exhibitions qr_code | |
| PATCH /marketing/exhibitions/:id | :508 | :509 | REAL | UPDATE exhibitions | |
| DELETE /marketing/exhibitions/:id | :539 | :540 | REAL | soft-delete UPDATE exhibitions | |
| GET /marketing/pr | :548 | :549 | REAL | SELECT pr_activities | |
| GET /marketing/pr/:id | :557 | :558 | REAL | SELECT pr_activities by id | |
| POST /marketing/pr | :566 | :567 | REAL | INSERT pr_activities | |
| PATCH /marketing/pr/:id | :582 | :583 | REAL | UPDATE pr_activities | |
| DELETE /marketing/pr/:id | :602 | :603 | REAL | soft-delete pr_activities | |
| GET /marketing/settings | :611 | :612 | REAL | SELECT marketing_settings | |
| GET /marketing/settings/social-api | :616 | :617 | REAL | SELECT social_api_configs (secrets excluded) | |
| POST /marketing/settings | :622 | :623 | REAL | UPSERT marketing_settings | |
| POST /marketing/settings/social-api | :635 | :636 | REAL | INSERT social_api_configs | |
| DELETE /marketing/settings/social-api/:id | :653 | :654 | REAL | DELETE social_api_configs | |
| PATCH /marketing/settings/social-api/:id | :659 | :660 | REAL | UPDATE social_api_configs | |
| POST /marketing/settings/setup-telegram-webhook | :673 | :674 | REAL | UPDATE social_api_configs (telegram) | |
| PATCH /marketing/settings/:id | :686 | :687 | REAL | UPDATE marketing_settings | |
| PATCH /marketing/website/blog/:id/publish | :696 | :697 | DUPLICATE | UPDATE blog_posts publish; counterpart POST /marketing/website/blog/:id/publish (marketing-group2:125) | both publish blog_posts |
| POST /marketing/website/blog/ai-generate | :704 | :706 | REAL | INSERT blog_posts draft; ai_provider:'pending' (honest) | |
| GET /marketing | :726 | :727 | REAL | aggregate COUNT() across marketing tables | root overview |
| GET /marketing/campaigns/:id/stats | marketing/presentation/marketing-content.controller.ts:34 | :36 | REAL | svc.getCampaignStats | |
| GET /marketing/dashboard/stats | :40 | :42 | REAL | svc.getDashboardStats | |
| GET /marketing/content/posts | :46 | :48 | REAL | svc.getContentPosts | |
| POST /marketing/content/posts | :52 | :56 | REAL | svc.createContentPost | |
| GET /marketing/content/posts/:id | :61 | :63 | REAL | svc.getContentPostById | |
| PUT /marketing/content/posts/:id | :67 | :70 | REAL | svc.updateContentPost | |
| DELETE /marketing/content/posts/:id | :75 | :79 | REAL | svc.deleteContentPost | |
| POST /marketing/content/posts/:id/publish | :83 | :87 | REAL | svc.publishContentPost | |
| GET /marketing/content/calendar | :91 | :93 | REAL | svc.getContentCalendar | |
| GET /marketing/content/analytics | :97 | :99 | REAL | svc.getContentAnalytics | |
| GET /marketing/social/accounts | :103 | :105 | REAL | svc.getSocialAccounts | |
| POST /marketing/social/accounts | :109 | :113 | REAL | svc.createSocialAccount | |
| DELETE /marketing/social/accounts/:id | :118 | :122 | REAL | svc.deleteSocialAccount | |
| PATCH /marketing/content/posts/:id | :126 | :132 | REAL | svc.updateContentPost | dup of PUT content/posts/:id |
| GET /marketing/website/blog | marketing/presentation/marketing-group2.controller.ts:90 | :93 | REAL | svc.getBlogPosts | |
| POST /marketing/website/blog | :106 | :110 | REAL | svc.createBlogPost | |
| PATCH /marketing/website/blog/:id | :116 | :119 | REAL | svc.updateBlogPost | |
| POST /marketing/website/blog/:id/publish | :125 | :129 | REAL | svc.publishBlogPost | overlaps PATCH publish (stubs) |
| DELETE /marketing/website/blog/:id | :134 | :138 | REAL | svc.deleteBlogPost | |
| GET /marketing/budget | :145 | :148 | REAL | svc.getBudgetLines | |
| GET /marketing/budget/:id | :159 | :162 | REAL | svc.getBudgetLineById | |
| POST /marketing/budget | :167 | :171 | REAL | svc.createBudgetLine | |
| PUT /marketing/budget/:id | :177 | :180 | REAL | svc.updateBudgetLine | |
| DELETE /marketing/budget/:id | :186 | :190 | REAL | DELETE marketing_budget_items | |
| GET /marketing/calendar | :197 | :200 | REAL | svc.getCalendarEvents | |
| GET /marketing/calendar/:id | :208 | :211 | REAL | svc.getCalendarEventById | |
| POST /marketing/calendar | :216 | :220 | REAL | svc.createCalendarEvent | |
| PATCH /marketing/calendar/:id | :226 | :229 | REAL | UPDATE marketing_calendar_events | |
| DELETE /marketing/calendar/:id | :254 | :258 | REAL | DELETE marketing_calendar_events | |
| GET /marketing/competitors | :265 | :268 | REAL | svc.getCompetitors (sd_customer_competitors) | |
| GET /marketing/leads/:id/contacts | :275 | :278 | REAL | svc.getLeadContacts | |
| POST /marketing/leads/:id/contacts | :283 | :287 | REAL | svc.createLeadContact | |
| DELETE /marketing/leads/:id | :293 | :297 | REAL | svc.softDeleteLead | overlaps marketing-analytics leads routes |
| GET /marketing/nps-requests | marketing/presentation/nps-requests.controller.ts:34 | :35 | REAL | repo.list (nps requests) | |
| POST /marketing/nps-requests/:id/responded | :41 | :42 | REAL | repo.markResponded | |


---

## SD + PP + MES

Backend root `apps/api/src`. Every route across `modules/sd`, `modules/pp`, `modules/mes` (29 controllers). SD order/quotation writes land on `sales_orders` through the write-through view `sd_sales_orders` (REAL, not a lie). Production writes verified: `POST /pp/orders` → CreateProductionOrderHandler → DrizzlePpRepository.savePo → `execSavePo` INSERT into `production_orders`; `POST /mes/sessions` & `/mes/production-sessions` → repo `INSERT INTO production_sessions` (canonical; `mes_production_sessions` is a VIEW over it); MES start/complete → `mesRepo.saveSession`.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /sd/orders/export | modules/sd/presentation/sd-orders.controller.ts:53 | :55 | REAL | ListOrdersQuery → CSV stream | |
| GET /sd/orders | sd-orders.controller.ts:81 | :83 | REAL | queryBus ListOrdersQuery | |
| GET /sd/orders/pending-advance | sd-orders.controller.ts:97 | :99 | REAL | PendingAdvanceOrdersQuery | |
| GET /sd/orders/:id | sd-orders.controller.ts:112 | :114 | REAL | GetOrderByIdQuery | |
| POST /sd/orders | sd-orders.controller.ts:124 | :126 | REAL | CreateOrderCommand → sales_orders (via sd_sales_orders view) | |
| POST /sd/orders/atp-check | sd-orders.controller.ts:151 | :153 | REAL | AtpCheckQuery | |
| PATCH /sd/orders/:id/status | sd-orders.controller.ts:165 | :167 | REAL | UpdateOrderStatusCommand | |
| POST /sd/orders/:id/advance-bypass | sd-orders.controller.ts:182 | :184 | REAL | ApproveAdvanceBypassCommand | |
| PATCH /sd/orders/:id/tech-checkpoint | sd-orders.controller.ts:197 | :199 | REAL | ApproveTechCheckpointCommand | |
| POST /sd/orders/:id/advance-payment | sd-orders.controller.ts:212 | :215 | REAL | ConfirmAdvancePaymentCommand | |
| PUT /sd/orders/:id/status | sd-orders.controller.ts:225 | :227 | DUPLICATE | Same UpdateOrderStatusCommand | Verb-alias of PATCH /sd/orders/:id/status |
| GET /sd/customers/abc/preview | sd-customers.controller.ts:111 | :113 | REAL | abc.preview() | |
| POST /sd/customers/abc/recompute | sd-customers.controller.ts:119 | :121 | REAL | abc.recompute() persists | |
| GET /sd/customers | sd-customers.controller.ts:127 | :128 | REAL | svc.list() | |
| GET /sd/customers/export | sd-customers.controller.ts:141 | :143 | REAL | svc.exportCsv() | |
| GET /sd/customers/:id | sd-customers.controller.ts:158 | :159 | REAL | svc.getById + contacts/orders | |
| GET /sd/customers/:id/360 | sd-customers.controller.ts:195 | :196 | REAL | svc.get360View() | |
| GET /sd/customers/:id/credit-check | sd-customers.controller.ts:205 | :206 | REAL | svc.getCreditStatus() | |
| POST /sd/customers | sd-customers.controller.ts:213 | :215 | REAL | svc.create() | |
| PUT /sd/customers/:id | sd-customers.controller.ts:227 | :230 | REAL | svc.update() | |
| DELETE /sd/customers/:id | sd-customers.controller.ts:244 | :247 | REAL | svc.softDelete() real; returns `{}` (LEGACY_NOOP response shape only) | Empty body, FE ignores |
| GET /sd/customers/:id/contacts | sd-customers.controller.ts:255 | :256 | REAL | svc.getContacts() | |
| POST /sd/customers/:id/contacts | sd-customers.controller.ts:264 | :266 | REAL | svc.addContact() | |
| PUT /sd/customers/:id/contacts/:cid | sd-customers.controller.ts:280 | :282 | REAL | svc.updateContact() | |
| DELETE /sd/customers/:id/contacts/:cid | sd-customers.controller.ts:301 | :304 | REAL | svc.deleteContact() | |
| GET /sd/customers/:id/interactions | sd-customers.controller.ts:312 | :313 | REAL | svc.getInteractions() | |
| POST /sd/customers/:id/interactions | sd-customers.controller.ts:321 | :324 | REAL | svc.addInteraction() | |
| GET /sd/customers/:id/documents | sd-customers.controller.ts:331 | :332 | REAL | svc.getDocuments() | |
| POST /sd/customers/:id/documents | sd-customers.controller.ts:340 | :343 | REAL | svc.addDocument() | |
| DELETE /sd/customers/:id/documents/:did | sd-customers.controller.ts:351 | :354 | REAL | svc.deleteDocument() | |
| GET /sd/customers/:id/competitors | sd-customers.controller.ts:362 | :363 | REAL | svc.getCompetitors() | |
| POST /sd/customers/:id/competitors | sd-customers.controller.ts:371 | :373 | REAL | svc.addCompetitor() | |
| DELETE /sd/customers/:id/competitors/:coid | sd-customers.controller.ts:383 | :386 | REAL | svc.deleteCompetitor() | |
| GET /sd/customers/:id/nps | sd-customers.controller.ts:395 | :396 | REAL | svc.getNps() | |
| POST /sd/customers/:id/nps | sd-customers.controller.ts:404 | :406 | REAL | svc.addNps() | |
| PATCH /sd/customers/:id/internal | sd-customers.controller.ts:416 | :418 | REAL | svc.updateInternalNotes() | |
| GET /sd/customers/:id/complaints | sd-customers.controller.ts:426 | :427 | REAL | svc.getComplaints() | |
| POST /sd/customers/:id/complaints | sd-customers.controller.ts:435 | :438 | REAL | svc.createComplaint() | |
| POST /sd/customers/:id/complaints/:cid/resolve | sd-customers.controller.ts:455 | :458 | REAL | svc.resolveComplaint() | |
| GET /sd/invoices | sd-invoices.controller.ts:62 | :64 | REAL | GetInvoicesQuery | |
| GET /sd/invoices/:id | sd-invoices.controller.ts:86 | :88 | REAL | GetInvoiceQuery | |
| GET /sd/invoices/:id/pdf | sd-invoices.controller.ts:101 | :103 | REAL | invoicePdfService.generateInvoicePdf | |
| GET /sd/invoices/:id/export-pdf | sd-invoices.controller.ts:138 | :140 | REAL | generateExportInvoicePdf | |
| POST /sd/invoices | sd-invoices.controller.ts:202 | :204 | REAL | CreateInvoiceCommand | |
| GET /sd/payments | sd-payments.controller.ts:51 | :52 | REAL | svc.list() | |
| POST /sd/payments | sd-payments.controller.ts:68 | :70 | REAL | svc.create() | |
| GET /sd/payments/debitors | sd-payments.controller.ts:76 | :77 | REAL | svc.getDebitors() | |
| GET /sd/payments/overdue | sd-payments.controller.ts:83 | :84 | REAL | svc.getOverdue() | |
| GET /sd/debitors | sd-payments.controller.ts:90 | :91 | DUPLICATE | Same svc.getDebitors() | Counterpart: GET /sd/payments/debitors |
| GET /sd/active-rentals | sd-payments.controller.ts:97 | :98 | REAL | svc.getActiveRentals() | |
| PUT /sd/payments/:id | sd-payments.controller.ts:104 | :106 | REAL | raw UPDATE sd_payments RETURNING | |
| GET /sd/dashboard/overview | sd-dashboard.controller.ts:38 | :39 | REAL | svc.getOverview() | |
| GET /sd/dashboard/manager-actions | sd-dashboard.controller.ts:45 | :46 | REAL | svc.getManagerActions() | |
| GET /sd/dashboard/quota | sd-dashboard.controller.ts:52 | :53 | REAL | svc.getQuotaStats() | |
| GET /sd/orders/:id/departments | sd-order-departments.controller.ts:30 | :32 | REAL | svc.listForOrder() | |
| PATCH /sd/orders/:id/departments | sd-order-departments.controller.ts:39 | :42 | REAL | svc.setForOrder() | |
| GET /sd/orders/:id/saga | sd-order-departments.controller.ts:49 | :51 | REAL | svc.getSaga() | |
| PATCH /sd/orders/:id/molds/:moldId/status | sd-order-departments.controller.ts:58 | :61 | REAL | svc.setMoldStatus() | |
| PATCH /sd/orders/:id/tech-cards/:tcId/status | sd-order-departments.controller.ts:68 | :71 | REAL | svc.setDesignStatus() | |
| PATCH /sd/orders/:id/cliches/:clicheId/status | sd-order-departments.controller.ts:78 | :81 | REAL | svc.setClicheStatus() | |
| PATCH /sd/orders/:id/shipping/status | sd-order-departments.controller.ts:88 | :91 | REAL | svc.setShippingStatus() | |
| PATCH /sd/orders/:id/materials/:reqId/status | sd-order-departments.controller.ts:98 | :101 | REAL | svc.setMaterialStatus() | |
| GET /sd/deliveries | sd-deliveries.controller.ts:45 | :46 | REAL | deliveriesService.findAll() | |
| POST /sd/deliveries | sd-deliveries.controller.ts:54 | :55 | REAL | deliveriesService.create() | |
| GET /sd/deliveries/:id | sd-deliveries.controller.ts:70 | :71 | REAL | deliveriesService.findOne() | |
| PATCH /sd/deliveries/:id/status | sd-deliveries.controller.ts:79 | :81 | REAL | deliveriesService.updateStatus() | |
| GET /sd/contracts | sd-contracts.controller.ts:35 | :36 | REAL | raw SELECT * FROM sd_contracts | |
| PATCH /sd/contracts/:id/sign | sd-contracts.controller.ts:79 | :81 | REAL | db.update(sd_contracts) set signed; try/catch returns `{ok:false}` on error but real UPDATE on success | |
| GET /sd/leads | sd-leads.controller.ts:43 | :44 | REAL | svc.list() | |
| GET /sd/leads/stats | sd-leads.controller.ts:54 | :55 | REAL | svc.getStats() | |
| GET /sd/leads/export | sd-leads.controller.ts:61 | :64 | REAL | svc.exportLeads() | |
| POST /sd/leads/import | sd-leads.controller.ts:71 | :73 | REAL | loops svc.create() | |
| GET /sd/leads/:id | sd-leads.controller.ts:91 | :92 | REAL | svc.getById() | |
| POST /sd/leads | sd-leads.controller.ts:103 | :106 | REAL | svc.create() | |
| PATCH /sd/leads/:id | sd-leads.controller.ts:114 | :117 | REAL | svc.update() | |
| PUT /sd/leads/:id/status | sd-leads.controller.ts:129 | :132 | REAL | svc.updateStatus() | |
| DELETE /sd/leads/:id | sd-leads.controller.ts:144 | :146 | REAL | svc.delete() | |
| POST /sd/leads/:id/convert | sd-leads.controller.ts:155 | :158 | REAL | svc.convert() | |
| POST /sd/leads/:id/activities | sd-leads.controller.ts:166 | :169 | REAL | svc.addActivity() | |
| GET /sd/leads/:id/activities | sd-leads.controller.ts:176 | :177 | REAL | svc.getActivities() | |
| GET /sd/quotations | sd-quotations.controller.ts:68 | :69 | REAL | svc.listQuotations() | |
| POST /sd/quotations | sd-quotations.controller.ts:84 | :85 | REAL | svc.createQuotation() | |
| POST /sd/contracts | sd-quotations.controller.ts:92 | :93 | REAL | svc.createContract() | |
| GET /sd/price-formulas | sd-quotations.controller.ts:97 | :98 | REAL | svc.getPriceSettings() | |
| POST /sd/calculate-price | sd-quotations.controller.ts:105 | :106 | REAL | svc.calculatePrice() reads sd_price_formulas | |
| GET /sd/kpi/team | sd-quotations.controller.ts:125 | :126 | REAL | svc.getKpiTeam() | |
| GET /sd/kpi-targets | sd-quotations.controller.ts:140 | :141 | REAL | svc.getKpiTargets() | |
| GET /sd/reports/funnel | sd-quotations.controller.ts:147 | :148 | REAL | svc.getFunnelReport() | |
| POST /sd/quotations/:id/convert-to-order | sd-quotations.controller.ts:154 | :155 | REAL | svc.convertToOrder() | |
| POST /sd/quotations/:id/convert | sd-quotations.controller.ts:161 | :162 | DUPLICATE | Same svc.convertToOrder() | Counterpart: .../convert-to-order |
| POST /sd/quotations/:id/send | sd-quotations.controller.ts:170 | :171 | REAL | svc.sendQuotation() | |
| PUT /sd/quotations/:id/send | sd-quotations.controller.ts:177 | :178 | DUPLICATE | Same svc.sendQuotation() | Verb-alias of POST .../send |
| PATCH /sd/quotations/:id/approve | sd-quotations.controller.ts:184 | :185 | REAL | svc.approveQuotation() | |
| PUT /sd/quotations/:id/approve | sd-quotations.controller.ts:191 | :192 | DUPLICATE | Same svc.approveQuotation() | Verb-alias of PATCH .../approve |
| PATCH /sd/quotations/:id | sd-quotations.controller.ts:198 | :199 | REAL | svc.updateQuotation() | |
| DELETE /sd/quotations/:id | sd-quotations.controller.ts:205 | :206 | REAL | svc.deleteQuotation() | |
| PATCH /sd/kpi-targets/:id | sd-quotations.controller.ts:214 | :215 | REAL | svc.updateKpiTarget() | |
| PATCH /sd/orders/:id/cancel | sd-quotations.controller.ts:221 | :222 | REAL | svc.cancelOrder() | |
| POST /sd/orders/:id/cancel | sd-quotations.controller.ts:228 | :229 | DUPLICATE | Same svc.cancelOrder() | Verb-alias of PATCH .../cancel |
| PATCH /sd/payments/:id/mark-paid | sd-quotations.controller.ts:235 | :236 | REAL | svc.markPaymentPaid() | |
| PUT /sd/payments/:id/mark-paid | sd-quotations.controller.ts:242 | :243 | DUPLICATE | Same svc.markPaymentPaid() | Verb-alias of PATCH .../mark-paid |
| PUT /sd/contracts/:id/sign | sd-quotations.controller.ts:249 | :250 | DUPLICATE | svc.signContract() | Counterpart: PATCH /sd/contracts/:id/sign (SdContractsController) |
| PUT /sd/price-formulas | sd-quotations.controller.ts:255 | :257 | REAL | svc.upsertPriceFormula() | |
| GET /sales/invoices | sd/sales/sales.controller.ts:49 | :50 | REAL | svc.listInvoices() | |
| GET /sales/analytics/monthly-trend | sales.controller.ts:65 | :66 | REAL | svc.getMonthlyTrend() | |
| GET /sales/analytics/velocity | sales.controller.ts:72 | :73 | REAL | svc.getVelocity() | |
| GET /sales/commission/calculations | sales.controller.ts:79 | :80 | REAL | svc.getCommissionCalculations() | |
| GET /sales/forecast/accuracy | sales.controller.ts:93 | :94 | REAL | svc.getForecastAccuracy() | |
| GET /sales/forecast/generate | sales.controller.ts:100 | :101 | REAL | svc.generateForecast() | |
| POST /sales/forecast/generate | sales.controller.ts:113 | :115 | DUPLICATE | Same svc.generateForecast() | Verb-alias of GET .../generate |
| GET /sales/forecast/history | sales.controller.ts:127 | :128 | REAL | svc.getForecastHistory() | |
| GET /sales/targets/leaderboard | sales.controller.ts:139 | :140 | REAL | svc.getLeaderboard() | |
| GET /sd/lost-orders | sd-lost-orders-reclamations.controller.ts:60 | :61 | REAL | svc.listLostOrders() | |
| POST /sd/lost-orders | sd-lost-orders-reclamations.controller.ts:70 | :71 | REAL | svc.createLostOrder() | |
| GET /sd/reclamations | sd-lost-orders-reclamations.controller.ts:80 | :81 | REAL | svc.listReclamations() | |
| GET /sd/reclamations/:id | sd-lost-orders-reclamations.controller.ts:91 | :92 | REAL | svc.getReclamation() | |
| POST /sd/reclamations | sd-lost-orders-reclamations.controller.ts:100 | :101 | REAL | svc.createReclamation() | |
| PATCH /sd/reclamations/:id/resolve | sd-lost-orders-reclamations.controller.ts:110 | :112 | REAL | svc.resolveReclamation() | |
| GET /planning/schedule | modules/pp/presentation/pp-planning.controller.ts:46 | :47 | REAL | svc.getSchedule() | |
| POST /planning/schedule | pp-planning.controller.ts:59 | :61 | REAL | svc.createScheduleEntry() | |
| PATCH /planning/operations/:id | pp-planning.controller.ts:68 | :70 | REAL | svc.updateOperation() | |
| GET /pp/orders | pp-orders.controller.ts:55 | :57 | REAL | GetProductionOrdersQuery | |
| GET /pp/orders/:id | pp-orders.controller.ts:81 | :83 | REAL | GetProductionOrderByIdQuery | |
| POST /pp/orders | pp-orders.controller.ts:93 | :95 | REAL | CreateProductionOrderCommand → savePo INSERT production_orders (drizzle-pp.repo.ts:33 / queries-pp execSavePo) | Production write reaches real table |
| PATCH /pp/orders/:id/release | pp-orders.controller.ts:115 | :117 | REAL | ReleaseProductionOrderCommand → savePo UPDATE status | |
| GET /pp/orders/plan/:startDate/:endDate | pp-orders.controller.ts:129 | :131 | REAL | ProductionPlanQuery | |
| GET /pp/ai-plan/skeleton | pp-intelligence.controller.ts:50 | :52 | REAL | aiPlanSvc.buildSkeleton() (partial when no AI key) | |
| POST /pp/mrp/run | pp-intelligence.controller.ts:59 | :62 | REAL | svc.runMrp() + formatMrpResponse | |
| GET /pp/mps | pp-intelligence.controller.ts:70 | :72 | REAL | mpsSvc.getMps() | |
| GET /pp/crp | pp-intelligence.controller.ts:78 | :80 | REAL | crpSvc.getCrp() | |
| GET /pp/learning-curve/:productId | pp-intelligence.controller.ts:92 | :94 | REAL | svc.getLearningCurve() | |
| GET /pp/queue | pp-queue.controller.ts:31 | :33 | REAL | GetProductionQueueQuery | |
| GET /technology/dashboard | modules/pp/technology/technology.controller.ts:80 | :83 | REAL | svc.getDashboard() | |
| GET /technology/orders | technology.controller.ts:87 | :90 | REAL | svc.getOrders() | |
| GET /technology/orders/:id/approval-log | technology.controller.ts:94 | :97 | REAL | svc.getApprovalLog() | |
| GET /technology/orders/:id/tech-card | technology.controller.ts:101 | :104 | REAL | svc.getOrderTechCard() | |
| GET /technology/tech-cards | technology.controller.ts:108 | :111 | REAL | svc.getTechCards() | |
| GET /technology/materials/alternatives | technology.controller.ts:115 | :118 | REAL | svc.getMaterialAlternatives() | |
| POST /technology/orders/:id/ai-check | technology.controller.ts:122 | :125 | REAL | svc.runAiCheck() | |
| POST /technology/orders/:id/approve | technology.controller.ts:129 | :132 | REAL | svc.approveOrder() | |
| POST /technology/orders/:id/reject | technology.controller.ts:138 | :141 | REAL | svc.rejectOrder() | |
| GET /technology/cards | technology.controller.ts:147 | :150 | REAL | svc.getCards() | |
| POST /technology/cards/generate | technology.controller.ts:154 | :157 | 501-STUB | `return notImplemented('POST /technology/cards/generate')` | |
| GET /technology/cards/:id | technology.controller.ts:161 | :164 | REAL | svc.getCardById() | |
| GET /technology/cards/:id/grammage | technology.controller.ts:173 | :176 | REAL | svc.getCardGrammage() (gofra 3-formula) | honest complete:false when unfilled |
| POST /technology/cards/:id/optimize | technology.controller.ts:188 | :191 | 501-STUB | `return notImplemented('POST /technology/cards/:id/optimize')` | |
| PUT /technology/materials/:materialCardId/layers | technology.controller.ts:197 | :200 | REAL | grammage.setMaterialLayers() | |
| POST /technology/cards | technology.controller.ts:208 | :211 | REAL | svc.createCard() | |
| PUT /technology/cards/:id | technology.controller.ts:216 | :219 | REAL | svc.updateCard() bumps version | |
| DELETE /technology/cards/:id | technology.controller.ts:226 | :229 | REAL | svc.deleteCard() soft-delete | |
| POST /technology/cards/:id/lab-approve | technology.controller.ts:234 | :237 | REAL | svc.labApprove() | |
| POST /technology/cards/:id/maket-approve | technology.controller.ts:243 | :246 | REAL | svc.maketApprove() | |
| GET /technology/cards/:id/bom | technology.controller.ts:252 | :255 | REAL | svc.getBom() | |
| POST /technology/cards/:id/bom | technology.controller.ts:259 | :262 | REAL | svc.addBomItem() | |
| GET /technology/cards/:id/routes | technology.controller.ts:269 | :272 | REAL | svc.getRoutes() | |
| POST /technology/cards/:id/routes | technology.controller.ts:276 | :279 | REAL | svc.addRoute() | |
| GET /technology/cards/:id/versions | technology.controller.ts:286 | :289 | REAL | svc.getVersions() | |
| GET /pp/gofra/convert | modules/pp/conversion/gofra-conversion.controller.ts:62 | :63 | REAL | svc.dispatch pure conversion | |
| GET /pp/gofra/flute-types | gofra-conversion.controller.ts:88 | :89 | REAL | factorsRepo.getFluteTypes() | |
| PUT /pp/gofra/flute-types/:code | gofra-conversion.controller.ts:99 | :100 | REAL | factorsRepo.updateFluteFactor() | |
| POST /pp/gofra/grammage | gofra-conversion.controller.ts:107 | :108 | REAL | svc.computeCorrugatedGrammage() | |
| GET /pp/gofra/config | gofra-conversion.controller.ts:148 | :149 | REAL | raw SELECT gofra_config | |
| PATCH /pp/gofra/config/:key | gofra-conversion.controller.ts:157 | :158 | REAL | raw UPDATE gofra_config RETURNING | |
| GET /pp/routing | pp-routing.controller.ts:52 | :54 | REAL | GetRoutingsQuery | |
| GET /pp/routing/:id | pp-routing.controller.ts:62 | :64 | REAL | routingsService.findOne() | |
| POST /pp/routing | pp-routing.controller.ts:73 | :75 | REAL | routingsService.create() composite header+ops | |
| POST /pp/routing/:routingId/operations | pp-routing.controller.ts:85 | :88 | REAL | routingsService.addOperation() | |
| DELETE /pp/routing/:routingId/operations/:opId | pp-routing.controller.ts:94 | :97 | REAL | routingsService.removeOperation() | |
| PATCH /pp/routing/:id | pp-routing.controller.ts:105 | :107 | REAL | routingsService.update() | |
| POST /pp/routing/:id/approve | pp-routing.controller.ts:116 | :118 | REAL | ApproveRoutingCommand | |
| DELETE /pp/routing/:id | pp-routing.controller.ts:132 | :135 | REAL | routingsService.remove() | |
| GET /pp/bom | pp-bom.controller.ts:72 | :74 | REAL | GetBomsQuery | |
| GET /pp/bom/:id | pp-bom.controller.ts:82 | :84 | REAL | bomService.findOne() | |
| POST /pp/bom | pp-bom.controller.ts:92 | :94 | REAL | bomService.create() → insert bomHeaders/bomItems | |
| GET /pp/bom/:id/items | pp-bom.controller.ts:102 | :104 | REAL | bomService.findItems() | |
| POST /pp/bom/:id/items | pp-bom.controller.ts:110 | :113 | REAL | bomService.addItem() | |
| DELETE /pp/bom/:id/items/:itemId | pp-bom.controller.ts:119 | :122 | REAL | bomService.removeItem() | |
| PATCH /pp/bom/:id | pp-bom.controller.ts:130 | :132 | REAL | bomService.update() | |
| POST /pp/bom/:id/approve | pp-bom.controller.ts:142 | :144 | REAL | ApproveBomCommand | |
| DELETE /pp/bom/:id | pp-bom.controller.ts:155 | :158 | REAL | bomService.remove() | |
| GET /pp/work-centers | pp-work-centers.controller.ts:54 | :56 | REAL | GetWorkCentersQuery | |
| GET /pp/work-centers/stats | pp-work-centers.controller.ts:65 | :67 | REAL | GetWorkCentersStatsQuery | |
| GET /pp/work-centers/:id | pp-work-centers.controller.ts:75 | :77 | REAL | GetWorkCentersQuery + find | |
| POST /pp/work-centers | pp-work-centers.controller.ts:89 | :91 | REAL | CreateWorkCenterCommand → insert workCenters | |
| PUT /pp/work-centers/:id | pp-work-centers.controller.ts:110 | :112 | REAL | UpdateWorkCenterCommand | |
| PUT /pp/work-centers/:id/norms | pp-work-centers.controller.ts:132 | :134 | REAL | UpdateWorkCenterNormsCommand | |
| PUT /pp/work-centers/:id/card | pp-work-centers.controller.ts:153 | :155 | REAL | LinkWorkCenterCardCommand | |
| PATCH /pp/work-centers/:id/toggle-active | pp-work-centers.controller.ts:168 | :170 | GREEN-LIE | Reads body `{isActive}` but constructs `new UpdateWorkCenterCommand(id)` with NO isActive; handler (update-work-center.command.ts:68) rebuilds WorkCenter with `existing.isActive` → active flag NEVER flips. Returns 200 unchanged. | Toggle is a silent no-op |
| GET /equipment | pp-equipment.controller.ts:45 | :46 | REAL | svc.listEquipment() | |
| GET /equipment/:id/360 | pp-equipment.controller.ts:56 | :57 | REAL | svc.getEquipment360() | |
| GET /equipment/:id | pp-equipment.controller.ts:69 | :70 | REAL | svc.getEquipment() | |
| POST /equipment | pp-equipment.controller.ts:77 | :79 | REAL | svc.createEquipment() | |
| PATCH /equipment/:id | pp-equipment.controller.ts:87 | :89 | REAL | svc.updateEquipment() | |
| GET /production/reports/weekly | modules/pp/production/production-reports.controller.ts:52 | :53 | REAL | svc.weeklyReport() | |
| GET /production/stats | production-reports.controller.ts:64 | :65 | REAL | svc.getProductionStats() | |
| GET /production/orders/:id/360-card | production-reports.controller.ts:72 | :73 | REAL | svc.getOrder360Card() | |
| GET /production/orders | production-reports.controller.ts:82 | :83 | REAL | raw SQL production_orders (count+rows) | |
| GET /production/shift-reports | production-shift-reports.controller.ts:54 | :55 | REAL | svc.listShiftReports() | |
| GET /production/shift-reports/:id | production-shift-reports.controller.ts:65 | :66 | REAL | svc.getShiftReport() | |
| POST /production/shift-reports | production-shift-reports.controller.ts:75 | :77 | REAL | svc.createShiftReport() | |
| PATCH /production/shift-reports/:id | production-shift-reports.controller.ts:85 | :87 | REAL | svc.updateShiftReport() | |
| POST /production/shift-reports/:id/close | production-shift-reports.controller.ts:97 | :99 | REAL | svc.closeShiftReport() | |
| PUT /production/shift-reports/:id/close | production-shift-reports.controller.ts:109 | :111 | DUPLICATE | Same svc.closeShiftReport() | Verb-alias of POST .../close |
| POST /production/shift-reports/:id/downtime | production-shift-reports.controller.ts:121 | :123 | REAL | svc.addShiftDowntime() | |
| GET /mes/sessions | modules/mes/presentation/mes-sessions.controller.ts:51 | :53 | REAL | sessionsSvc.listSessions() | |
| GET /mes/sessions/:id | mes-sessions.controller.ts:71 | :73 | REAL | sessionsSvc.getSession() | |
| POST /mes/sessions | mes-sessions.controller.ts:82 | :85 | REAL | createSession → INSERT production_sessions (mes-production-sessions.repo.ts:67/83) | MES write reaches real table |
| POST /mes/sessions/:id/start | mes-sessions.controller.ts:96 | :99 | REAL | StartSessionCommand → LMS/checklist gate → mesRepo.saveSession | |
| POST /mes/sessions/:id/complete | mes-sessions.controller.ts:112 | :115 | REAL | CompleteSessionCommand → tx saveSession + MesCompleted/HR360 events | |
| POST /mes/sessions/:id/downtime | mes-sessions.controller.ts:124 | :127 | REAL | RecordDowntimeCommand | |
| GET /mes/production-sessions | mes-production-sessions.controller.ts:48 | :49 | REAL | svc.listSessions() | |
| POST /mes/production-sessions | mes-production-sessions.controller.ts:60 | :62 | DUPLICATE | Same MesProductionSessionsService.createSession as POST /mes/sessions | Counterpart: POST /mes/sessions |
| GET /mes/production-sessions/:sessionId | mes-production-sessions.controller.ts:69 | :70 | REAL | svc.getSession() | |
| POST /mes/production-sessions/:sessionId/advance-stage | mes-production-sessions.controller.ts:77 | :78 | REAL | svc.advanceSessionStage() → UPDATE production_sessions | |
| POST /mes/production-sessions/:sessionId/downtime | mes-production-sessions.controller.ts:85 | :87 | REAL | svc.recordDowntimeForSession() → INSERT downtime_events | |
| GET /mes/production-sessions/:sessionId/stage-availability | mes-production-sessions.controller.ts:96 | :97 | REAL | svc.getStageBasedAvailability() | |
| GET /mes/production-sessions/:sessionId/downtime-events | mes-production-sessions.controller.ts:104 | :105 | REAL | svc.listDowntimeEvents() | |
| GET /mes/operations | mes-operations.controller.ts:63 | :65 | REAL | GetSessionsQuery | |
| GET /mes/operations/downtime | mes-operations.controller.ts:71 | :73 | REAL | GetDowntimeQuery | |
| POST /mes/operations/downtime | mes-operations.controller.ts:82 | :84 | REAL | RecordDowntimeCommand | |
| PATCH /mes/operations/downtime/:id/end | mes-operations.controller.ts:102 | :104 | REAL | EndDowntimeCommand | |
| GET /mes/operations/downtime/summary | mes-operations.controller.ts:113 | :115 | REAL | GetDowntimeSummaryQuery | |
| GET /mes/operations/reason-codes | mes-operations.controller.ts:125 | :127 | REAL | Returns DOWNTIME_REASON_CODES constant (static reason-code catalog, legit lookup — not DB) | |
| GET /mes/operations/oee | mes-operations.controller.ts:134 | :136 | REAL | GetOeeQuery | Overlaps GET /mes/oee (different service) |
| POST /mes/operations/:sessionId/downtime | mes-operations.controller.ts:146 | :148 | DUPLICATE | Same RecordDowntimeCommand as POST /mes/operations/downtime | sessionId in path vs body |
| GET /mes/shifts/current | mes-shifts-stats.controller.ts:40 | :41 | REAL | svc.getCurrentShift() | |
| POST /mes/shifts/handover | mes-shifts-stats.controller.ts:48 | :51 | REAL | svc.shiftHandover() | |
| POST /mes/shifts/close-evaluation | mes-shifts-stats.controller.ts:60 | :63 | REAL | svc.closeShiftEvaluation() | |
| GET /mes/shifts/evaluations | mes-shifts-stats.controller.ts:71 | :74 | REAL | svc.getShiftEvaluations() | |
| GET /mes/oee | mes-shifts-stats.controller.ts:80 | :81 | REAL | svc.getOee() | |
| GET /mes/stats | mes-shifts-stats.controller.ts:87 | :88 | REAL | svc.getStats() | |
| GET /mes/gamification/leaderboard | mes-shifts-stats.controller.ts:94 | :95 | REAL | svc.getGamificationLeaderboard() | |
| GET /mes/papka-orders | mes-shifts-stats.controller.ts:101 | :102 | REAL | svc.getPapkaOrders() | |
| PATCH /mes/sessions/:id/pause | mes-shifts-stats.controller.ts:110 | :113 | REAL | svc.pauseSession() | |
| PATCH /mes/sessions/:id/resume | mes-shifts-stats.controller.ts:124 | :127 | REAL | svc.resumeSession() | |
| PATCH /mes/sessions/:id/quantity | mes-shifts-stats.controller.ts:138 | :141 | REAL | svc.updateSessionQuantity() | |
| POST /mes/material-consumption | mes-shifts-stats.controller.ts:151 | :154 | REAL | svc.recordMaterialConsumption() | |
| GET /mes/orders | mes-shifts-stats.controller.ts:162 | :163 | REAL | svc.getProductionOrders() | |
| GET /mes/orders/:id | mes-shifts-stats.controller.ts:174 | :175 | REAL | svc.getProductionOrderById() | |
| GET /mes/shifts | mes-shifts-stats.controller.ts:181 | :182 | REAL | svc.getShifts() | |
| GET /mes/maintenance | mes-shifts-stats.controller.ts:192 | :193 | REAL | svc.getMaintenanceRequests() | Overlaps GET /mes/maintenance-requests (mes-maintenance) |
| GET /mes/work-centers/norms | mes-shifts-stats.controller.ts:203 | :204 | REAL | svc.getWorkCenterNorms() | |
| GET /mes/maintenance-requests | mes-maintenance.controller.ts:45 | :46 | REAL | svc.listMaintenanceRequests() | |
| POST /mes/maintenance-requests | mes-maintenance.controller.ts:53 | :56 | REAL | svc.createMaintenanceRequest() | |
| PATCH /mes/maintenance-requests/:id | mes-maintenance.controller.ts:66 | :69 | REAL | svc.updateMaintenanceRequest() | |
| GET /mes/tasks | mes-maintenance.controller.ts:78 | :79 | REAL | svc.listTasks() | |
| PATCH /mes/tasks/:id/progress | mes-maintenance.controller.ts:87 | :90 | REAL | svc.updateTaskProgress() | |
| POST /mes/sos | mes-maintenance.controller.ts:100 | :103 | REAL | svc.createSos() | |
| GET /mes/sos/history | mes-maintenance.controller.ts:109 | :112 | REAL | svc.getSosHistory() | |
| POST /mes/sos/:sosId/resolve | mes-maintenance.controller.ts:118 | :120 | REAL | svc.resolveSos() | |
| GET /mes/downtime-reasons | mes-maintenance.controller.ts:124 | :127 | REAL | svc.getDowntimeReasons() | |
| GET /mes/downtime-events | mes-maintenance.controller.ts:133 | :135 | GREEN-LIE | Calls `svc.getDowntimeEvents(0)` — hardcoded sessionId 0; repo (mes-maintenance.repo.ts:109) runs `WHERE de.session_id = 0` → always empty; `limit` query param ignored. Claims "list downtime events" but never lists them. | Latent bug: no all-events path |
| POST /mes/downtime-events | mes-maintenance.controller.ts:141 | :144 | REAL | svc.createDowntimeEvent() | |
| GET /mes/downtime-events/:sessionId | mes-maintenance.controller.ts:153 | :154 | REAL | svc.getDowntimeEvents(sessionId) real filter | |


---

## Remaining + LMS + AI

Backend root abbreviated as `apps/api/src`. All three modules are overwhelmingly REAL: controllers are thin transport layers delegating to services/repos that hit the DB (verified DB-call counts per service), and the AI module genuinely proxies to real LLM SDKs (OpenAI / Google Gemini / Anthropic Claude) via `ai-router-call.service.ts`. Non-REAL rows are the ten `/v2` ACL "demonstrator" endpoints (ORPHAN — zero FE callers, confirmed by FE grep), a handful of static/empty payload handlers (MOCK), four `notImplemented()` gated AI routes (501), one no-op cache trigger (GREEN-LIE), and intra-controller aliases (DUPLICATE).

⚠️ Cross-cutting risk (not a per-row bucket): every LLM-backed AI service (`crm-ai`, `hr-ai`, `wms-ai`, `marketing-ai`, `director-ai`, `finance-ai`) returns a **hardcoded neutral fallback** (e.g. `{score:50, grade:'WARM'}`, `{overall:'NEUTRAL', score:50}`, `{category:'UNKNOWN'}`, canned interview questions) with HTTP 200 when `isErr(aiResult)` — i.e. when no AI key is configured. In this build-stage env (AI keys likely absent) those POST routes effectively serve canned data despite being genuinely wired. Classified REAL (real external call is the primary path) but flagged.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /company-state/current | apps/api/src/modules/remaining/company-state.controller.ts:29 | :30 | REAL | svc.getCurrent() → company-state.service.ts (rawSql) | |
| GET /company-state/history | company-state.controller.ts:36 | :37 | REAL | rawSql SELECT company_state_log :38 | |
| GET /company-state/trend | company-state.controller.ts:52 | :53 | REAL | rawSql SELECT company_state_log :55 | |
| POST /company-state/snapshot | company-state.controller.ts:72 | :74 | REAL | snapshot.snapshotNow() cron :75 | |
| GET /company-state/thresholds | company-state.controller.ts:89 | :90 | REAL | rawSql SELECT state_thresholds :91 | |
| PATCH /company-state/thresholds/:id | company-state.controller.ts:99 | :100 | REAL | rawSql UPDATE state_thresholds :105 | 404 on missing |
| GET /exceptions | apps/api/src/modules/remaining/exception-log.controller.ts:39 | :40 | REAL | svc.getAll() exception-log.service.ts (9 DB) | |
| GET /exceptions/v2 | exception-log.controller.ts:52 | :53 | ORPHAN | ACL translate of getAll; FE grep "exceptions/v2"=NONE | PA2-14 demonstrator |
| GET /exceptions/stats | exception-log.controller.ts:72 | :73 | REAL | svc.getStats() | |
| GET /exceptions/:id | exception-log.controller.ts:77 | :78 | REAL | svc.getOne() | |
| POST /exceptions | exception-log.controller.ts:82 | :84 | REAL | svc.create() | |
| POST /exceptions/advance-bypass | exception-log.controller.ts:88 | :90 | REAL | svc.advanceBypass() | |
| POST /exceptions/status-force | exception-log.controller.ts:94 | :96 | REAL | svc.statusForce() | |
| POST /exceptions/design-reject | exception-log.controller.ts:100 | :102 | REAL | svc.designReject() | |
| POST /exceptions/advance-block | exception-log.controller.ts:106 | :108 | REAL | svc.advanceBlock() | |
| POST /exceptions/material-shortage | exception-log.controller.ts:112 | :114 | REAL | svc.materialShortage() | |
| POST /exceptions/machine-breakdown | exception-log.controller.ts:118 | :120 | REAL | svc.machineBreakdown() | |
| POST /exceptions/qc-failed | exception-log.controller.ts:124 | :126 | REAL | svc.qcFailed() | |
| POST /exceptions/delivery-failed | exception-log.controller.ts:130 | :132 | REAL | svc.deliveryFailed() | |
| POST /exceptions/employee-absent | exception-log.controller.ts:136 | :138 | REAL | svc.employeeAbsent() | |
| POST /exceptions/material-not-returned | exception-log.controller.ts:142 | :144 | REAL | svc.materialNotReturned() | |
| PATCH /exceptions/:id | exception-log.controller.ts:148 | :149 | REAL | svc.update() | |
| DELETE /exceptions/:id | exception-log.controller.ts:158 | :160 | REAL | svc.deleteOne() | |
| POST /exceptions/cert-expiry-check | exception-log.controller.ts:164 | :165 | REAL | svc.certExpiryCheck() | |
| GET /ideal-rasm | apps/api/src/modules/remaining/ideal-rasm.controller.ts:34 | :35 | REAL | svc.getAll() ideal-rasm.service.ts (6 DB) | |
| GET /ideal-rasm/v2 | ideal-rasm.controller.ts:44 | :45 | ORPHAN | ACL translate; FE grep=NONE | POST create previously retired (green-lie) |
| PUT /ideal-rasm | ideal-rasm.controller.ts:55 | :58 | REAL | svc.updateAll() | |
| PUT /ideal-rasm/:key | ideal-rasm.controller.ts:62 | :65 | REAL | svc.updateOne() | |
| GET /material-balance/overview | apps/api/src/modules/remaining/material-balance.controller.ts:35 | :36 | REAL | svc.getOverview() material-balance.service.ts (11 DB) | |
| GET /material-balance/overview/v2 | material-balance.controller.ts:45 | :46 | ORPHAN | ACL translate; FE grep "overview/v2"=NONE | |
| GET /material-balance/alerts | material-balance.controller.ts:52 | :53 | REAL | svc.getAlerts() | |
| GET /material-balance/internal-requests | material-balance.controller.ts:57 | :58 | REAL | svc.getInternalRequests() | |
| PATCH /material-balance/internal-requests/:id/approve | material-balance.controller.ts:62 | :65 | REAL | svc.approveRequest() | |
| PATCH /material-balance/internal-requests/:id/issue | material-balance.controller.ts:73 | :76 | REAL | svc.issueRequest() | |
| GET /material-balance/production | material-balance.controller.ts:80 | :81 | REAL | svc.getProduction() | |
| POST /material-balance/production/take | material-balance.controller.ts:87 | :90 | REAL | svc.takeMaterial() | |
| POST /material-balance/production/use | material-balance.controller.ts:94 | :97 | REAL | svc.useMaterial() | |
| POST /material-balance/production/return | material-balance.controller.ts:101 | :104 | REAL | svc.returnMaterial() | |
| POST /material-balance/negative-stock-check | material-balance.controller.ts:108 | :109 | REAL | svc.negativeStockCheck() | |
| GET /material-balance/:materialId/history | material-balance.controller.ts:113 | :114 | REAL | svc.getHistory() | |
| GET /material-balance/movements | material-balance.controller.ts:126 | :127 | REAL | db.execute SELECT material_movements :129 | Docstring says "501" but code is REAL — stale comment |
| POST /material-balance/movements | material-balance.controller.ts:136 | :138 | REAL | db.execute INSERT material_movements :168 (+material_cards lookup) | |
| GET /material-balance/:materialId/reconciliation | material-balance.controller.ts:188 | :189 | REAL | svc.getReconciliation() | |
| GET /material-balance/warehouse/:warehouseId | material-balance.controller.ts:193 | :194 | REAL | svc.getByWarehouse() | |
| GET /order-status/chain | apps/api/src/modules/remaining/order-status.controller.ts:36 | :37 | REAL | svc.getStatusChain() order-status.service.ts (10 DB) | static chain config from service |
| GET /order-status/transitions | order-status.controller.ts:43 | :44 | REAL | STATUS_TRANSITIONS constant | Static transition map (domain config, not data) |
| GET /order-status/:orderId/log | order-status.controller.ts:48 | :49 | REAL | svc.getStatusLog() | |
| GET /order-status/:orderId/log/v2 | order-status.controller.ts:58 | :59 | ORPHAN | ACL translate; FE grep "/log/v2"=NONE | |
| POST /order-status/:orderId/transition | order-status.controller.ts:70 | :72 | REAL | svc.transition() | |
| POST /order-status/:orderId/design-approved | order-status.controller.ts:80 | :82 | REAL | svc.designApproved() | |
| POST /order-status/:orderId/tech-approved | order-status.controller.ts:89 | :91 | REAL | svc.techApproved() | |
| POST /order-status/:orderId/advance-received | order-status.controller.ts:95 | :97 | REAL | svc.advanceReceived() | |
| POST /order-status/:orderId/qc-result | order-status.controller.ts:101 | :103 | REAL | svc.qcResult() | |
| POST /order-status/:orderId/mes-complete | order-status.controller.ts:107 | :109 | REAL | svc.mesComplete() | |
| POST /order-status/:orderId/delivery-failed | order-status.controller.ts:113 | :115 | REAL | svc.deliveryFailed() | |
| GET /order-status/:orderId/machine-breakdown | order-status.controller.ts:119 | :120 | MOCK | returns hardcoded `{orderId, breakdown:null, machineId:null}` :121 | No DB read; static null payload |
| GET /production-facts | apps/api/src/modules/remaining/production-facts.controller.ts:32 | :33 | REAL | svc.getAll() production-facts.service.ts (5 DB) | |
| GET /production-facts/variance | production-facts.controller.ts:37 | :38 | REAL | svc.getVariance() | |
| GET /production-facts/operators | production-facts.controller.ts:42 | :43 | REAL | svc.getOperators() | |
| GET /production-facts/plan-fact-dashboard | production-facts.controller.ts:52 | :53 | REAL | svc.getPlanFactDashboard() (work_centers norma) | |
| GET /production-facts/operators/v2 | production-facts.controller.ts:62 | :63 | ORPHAN | ACL translate; FE grep "operators/v2"=NONE | |
| POST /production-facts | production-facts.controller.ts:72 | :76 | REAL | svc.create() | |
| GET /reports-hub/dashboard | apps/api/src/modules/remaining/reports-hub.controller.ts:34 | :35 | REAL | svc.getDashboard() reports-hub.service.ts (16 DB) | |
| GET /reports-hub/categories | reports-hub.controller.ts:39 | :40 | REAL | svc.getCategories() | |
| GET /reports-hub/definitions | reports-hub.controller.ts:44 | :45 | REAL | svc.getDefinitions() | |
| GET /reports-hub/definitions/v2 | reports-hub.controller.ts:54 | :55 | ORPHAN | ACL translate; FE grep "definitions/v2"=NONE | |
| POST /reports-hub/definitions | reports-hub.controller.ts:64 | :66 | REAL | svc.createDefinition() | |
| GET /reports-hub/runs | reports-hub.controller.ts:70 | :71 | REAL | svc.getRuns() | |
| GET /reports-hub/runs/:runId | reports-hub.controller.ts:75 | :76 | REAL | svc.getRun() | |
| POST /reports-hub/generate/:definitionId | reports-hub.controller.ts:80 | :82 | REAL | svc.generateReport() | |
| POST /reports-hub/seed-categories | reports-hub.controller.ts:89 | :90 | REAL | svc.seedCategories() | |
| GET /reports-hub/subscriptions | reports-hub.controller.ts:94 | :95 | REAL | svc.getSubscriptions() | |
| POST /reports-hub/subscriptions | reports-hub.controller.ts:99 | :101 | REAL | svc.createSubscription() | |
| DELETE /reports-hub/subscriptions/:id | reports-hub.controller.ts:108 | :109 | REAL | svc.deleteSubscription() | |
| GET /system/health | apps/api/src/modules/remaining/system.controller.ts:33 | :34 | REAL | svc.getHealth() system.service.ts:35 | |
| GET /system/db-stats | system.controller.ts:38 | :39 | REAL | repo.getDbStats() system.service.ts:65 | |
| GET /system/cron-jobs | system.controller.ts:43 | :44 | REAL | cronStatus.getAllStatuses() system.service.ts:72 | live cron registry |
| GET /system/cron-jobs/v2 | system.controller.ts:55 | :56 | ORPHAN | ACL translate; FE grep "cron-jobs/v2"=NONE | |
| GET /system | system.controller.ts:66 | :67 | MOCK | returns static `{status:'ok', version:'1.0.0'}` :67 | Trivial info stub |
| GET /system/integrations | system.controller.ts:69 | :70 | REAL | env-derived status list system.service.ts:75 | config-derived, not DB |
| POST /supply-chain/refresh | system.controller.ts:83 | :85 | GREEN-LIE | returns `{ok:true, refreshedAt}` :87 — no server action | Cache-bust trigger; performs nothing |
| GET /system/settings | system.controller.ts:99 | :100 | REAL | svc.getSettings() → repo | 404 on missing |
| PUT /system/settings | system.controller.ts:104 | :105 | REAL | svc.updateSettings() → repo | |
| GET /3way-match/results | apps/api/src/modules/remaining/three-way-match.controller.ts:35 | :38 | REAL | ThreeWayMatchService.getResults() (pos/application) | |
| GET /3way-match/results/v2 | three-way-match.controller.ts:51 | :54 | ORPHAN | ACL translate; FE grep "results/v2"=NONE | |
| POST /3way-match/perform | three-way-match.controller.ts:68 | :71 | REAL | svc.perform() | |
| GET /waste/records | apps/api/src/modules/remaining/waste.controller.ts:30 | :31 | REAL | svc.getRecords() waste.service.ts (8 DB) | |
| GET /waste/records/v2 | waste.controller.ts:40 | :41 | ORPHAN | ACL translate; FE grep "records/v2"=NONE | |
| POST /waste/records | waste.controller.ts:50 | :54 | REAL | svc.createRecord() | |
| PATCH /waste/records/:id | waste.controller.ts:58 | :61 | REAL | svc.updateRecord() | |
| GET /waste/dashboard | waste.controller.ts:65 | :66 | REAL | svc.getDashboard() | |
| GET /waste/trends | waste.controller.ts:70 | :71 | REAL | svc.getTrends() | |
| GET /waste/targets | waste.controller.ts:75 | :76 | REAL | svc.getTargets() | |
| POST /waste/targets | waste.controller.ts:80 | :84 | REAL | svc.createTarget() | |
| GET /waste/analysis | waste.controller.ts:88 | :89 | REAL | svc.getAnalysis() | |
| GET /weekly-plans/stats/summary | apps/api/src/modules/remaining/weekly-plan.controller.ts:33 | :34 | REAL | svc.getStatsSummary() weekly-plan.service.ts (14 DB) | |
| GET /weekly-plans | weekly-plan.controller.ts:38 | :39 | REAL | svc.getAll() | |
| GET /weekly-plans/v2 | weekly-plan.controller.ts:56 | :57 | ORPHAN | ACL translate; FE grep "weekly-plans/v2"=NONE | |
| POST /weekly-plans | weekly-plan.controller.ts:73 | :75 | REAL | svc.create() | |
| GET /weekly-plans/:id | weekly-plan.controller.ts:84 | :85 | REAL | svc.getOne() | |
| PATCH /weekly-plans/:id | weekly-plan.controller.ts:91 | :92 | REAL | svc.update() | |
| PATCH /weekly-plans/:id/approve | weekly-plan.controller.ts:102 | :103 | REAL | svc.approve() | |
| DELETE /weekly-plans/:id | weekly-plan.controller.ts:109 | :112 | REAL | svc.deletePlan() | |
| GET /lms/card-knowledge/by-card/:cardId | apps/api/src/modules/lms/presentation/card-required-knowledge.controller.ts:50 | :52 | REAL | svc.listByCard() CardRequiredKnowledgeService | |
| GET /lms/card-knowledge/:id | card-required-knowledge.controller.ts:60 | :62 | REAL | svc.findById() | |
| POST /lms/card-knowledge | card-required-knowledge.controller.ts:69 | :72 | REAL | svc.create() | |
| PATCH /lms/card-knowledge/:id | card-required-knowledge.controller.ts:81 | :83 | REAL | svc.update() | |
| DELETE /lms/card-knowledge/:id | card-required-knowledge.controller.ts:91 | :94 | REAL | svc.remove() | |
| GET /courses/completion-trend/:lang | apps/api/src/modules/lms/presentation/courses.controller.ts:44 | :46 | DUPLICATE | same svc.completionTrend() as /courses/completion-trend; `lang` ignored (`_lang`) | counterpart :53 |
| GET /courses/completion-trend | courses.controller.ts:53 | :55 | REAL | LmsCoursesExtendedService.completionTrend() | |
| GET /courses | courses.controller.ts:62 | :64 | REAL | svc.listCourses() | overlaps /lms/courses (see notes) |
| POST /courses | courses.controller.ts:90 | :93 | REAL | svc.createCourse() | overlaps /lms/courses |
| GET /courses/:id | courses.controller.ts:102 | :104 | REAL | svc.getCourse() | |
| PUT /courses/:id | courses.controller.ts:113 | :116 | REAL | svc.updateCourse() | |
| DELETE /courses/:id | courses.controller.ts:126 | :128 | REAL | svc.deleteCourse() | |
| PATCH /courses/:id | courses.controller.ts:138 | :141 | REAL | svc.updateCourse() | |
| GET /knowledge-base | apps/api/src/modules/lms/presentation/knowledge-base.controller.ts:48 | :50 | REAL | svc.findAll() KnowledgeBaseService | |
| GET /knowledge-base/:id | knowledge-base.controller.ts:60 | :62 | REAL | svc.findById() | |
| POST /knowledge-base | knowledge-base.controller.ts:69 | :73 | REAL | svc.create() | |
| PUT /knowledge-base/:id | knowledge-base.controller.ts:81 | :84 | REAL | svc.update() | |
| PATCH /knowledge-base/:id | knowledge-base.controller.ts:92 | :95 | REAL | svc.update() | |
| DELETE /knowledge-base/:id | knowledge-base.controller.ts:103 | :105 | REAL | svc.remove() | |
| POST /knowledge-base/upload | knowledge-base.controller.ts:112 | :115 | REAL | multipart parse + svc.uploadFile() :132 | ext/size validated |
| GET /attempts/all | apps/api/src/modules/lms/presentation/lms-attempts.controller.ts:44 | :46 | DUPLICATE | same svc.listAttempts() as GET /attempts (root) | counterpart :68 |
| GET /attempts/retakes | lms-attempts.controller.ts:59 | :61 | REAL | svc.listRetakeAttempts() | |
| GET /attempts | lms-attempts.controller.ts:68 | :70 | REAL | LmsTestsService.listAttempts() | |
| POST /attempts/:id/submit | lms-attempts.controller.ts:84 | :86 | REAL | LmsExamsService.submitExam() | |
| GET /certificates/expiring | apps/api/src/modules/lms/presentation/lms-certificates-standalone.controller.ts:47 | :49 | REAL | svc.getExpiringCertificates() | |
| GET /certificates | lms-certificates-standalone.controller.ts:54 | :56 | REAL | svc.listCertificates() | |
| POST /certificates | lms-certificates-standalone.controller.ts:67 | :70 | REAL | svc.createCertificate() | |
| GET /certificates/:id | lms-certificates-standalone.controller.ts:76 | :78 | REAL | rawSql SELECT certificates :79 | 404 on missing |
| DELETE /certificates/:id | lms-certificates-standalone.controller.ts:90 | :93 | REAL | db.execute DELETE certificates :94 | |
| GET /certificates/:id/download | lms-certificates-standalone.controller.ts:98 | :100 | REAL | generates HTML cert from :id | HTML built from id (not a DB fetch); intentional printable stub |
| POST /lms/certificates/issue | apps/api/src/modules/lms/presentation/lms-certificates.controller.ts:55 | :58 | REAL | commandBus IssueCertificateCommand :63 | |
| GET /lms/certificates/operator/:operatorId | lms-certificates.controller.ts:79 | :81 | REAL | queryBus OperatorCertificationsQuery :82 | |
| GET /lms/certificates/:employeeId | lms-certificates.controller.ts:88 | :90 | REAL | lmsRepo.findCertificatesByEmployee() :91 | |
| POST /lms/certificates/:certificateId/revoke | lms-certificates.controller.ts:98 | :101 | REAL | lmsRepo.updateCertificateStatus('revoked') :103 | |
| POST /lms/certificates/check-mes | lms-certificates.controller.ts:110 | :113 | REAL | lmsRepo.checkOperatorCertForMes() :114 | |
| GET /lms/lessons/:id | apps/api/src/modules/lms/presentation/lms-core.controller.ts:49 | :51 | REAL | LmsCoreService.getLesson() | |
| GET /lms/exams | lms-core.controller.ts:58 | :60 | REAL | svc.listExams() | |
| GET /lms/exams/:id/questions | lms-core.controller.ts:69 | :71 | REAL | svc.getExamQuestions() | |
| POST /lms/exams | lms-core.controller.ts:79 | :82 | REAL | svc.createExam() | |
| POST /lms/exams/:id/submit | lms-core.controller.ts:91 | :94 | REAL | svc.submitExam() | |
| GET /lms/leaderboard | lms-core.controller.ts:107 | :109 | REAL | svc.getLeaderboard() | |
| GET /lms/recent-activity/:lang | lms-core.controller.ts:117 | :119 | DUPLICATE | same svc.getRecentActivity() as /lms/recent-activity; `lang` ignored | counterpart :127 |
| GET /lms/recent-activity | lms-core.controller.ts:127 | :129 | REAL | svc.getRecentActivity() | |
| GET /lms/progress/my | lms-core.controller.ts:137 | :139 | REAL | svc.getMyProgress() | |
| POST /lms/progress/complete | lms-core.controller.ts:148 | :150 | REAL | svc.completeCourse() :160 (was green-lie, now persists) | |
| POST /lms/support/tickets | lms-core.controller.ts:166 | :169 | REAL | db.insert(lms_support_tickets) :174 | try/catch returns `{ok:false}` on error (reports failure, not swallow-success) |
| GET /lms/courses | apps/api/src/modules/lms/presentation/lms-courses.controller.ts:60 | :62 | REAL | queryBus GetCoursesQuery :63 | overlaps /courses controller |
| GET /lms/courses/by-card/:cardId | lms-courses.controller.ts:79 | :81 | REAL | lmsRepo.findCoursesByCard() :82 | |
| GET /lms/courses/:id | lms-courses.controller.ts:89 | :91 | REAL | lmsRepo.findCourseById() :92 | |
| POST /lms/courses | lms-courses.controller.ts:98 | :101 | REAL | lmsRepo.saveCourse() :106 | overlaps /courses POST |
| PATCH /lms/courses/:id | lms-courses.controller.ts:125 | :127 | REAL | db.execute UPDATE courses :130 (was green-lie echo, now persists) | 404 on rowCount 0 |
| PATCH /lms/courses/:id/card | lms-courses.controller.ts:151 | :154 | REAL | lmsRepo.setCourseCard() :155 | |
| DELETE /lms/courses/:id | lms-courses.controller.ts:164 | :167 | REAL | lmsRepo.deleteCourse() :169 | |
| POST /lms/courses/:id/submit | lms-courses.controller.ts:184 | :187 | REAL | lmsRepo.submitCourseForReview() :189 | |
| POST /lms/courses/:id/approve | lms-courses.controller.ts:198 | :201 | REAL | lmsRepo.approveCourse() :203 | 2-signature workflow |
| POST /lms/courses/enroll | lms-courses.controller.ts:211 | :214 | REAL | commandBus EnrollCourseCommand :216 | |
| GET /lms/enrollments | apps/api/src/modules/lms/presentation/lms-enrollments.controller.ts:90 | :92 | REAL | lmsRepo.findEnrollmentsByUser() :95 | |
| GET /lms/enrollments/my | lms-enrollments.controller.ts:106 | :108 | REAL | lmsRepo.findEnrollmentsByUser() :111 | |
| POST /lms/enrollments | lms-enrollments.controller.ts:123 | :126 | REAL | commandBus EnrollCourseCommand :128 | |
| PATCH /lms/enrollments/:id/progress | lms-enrollments.controller.ts:144 | :147 | REAL | lmsRepo.updateEnrollment() :149 + emits lms.course.completed | |
| PATCH /lms/enrollments/:id/complete | lms-enrollments.controller.ts:166 | :169 | REAL | lmsRepo.updateEnrollment() :171 + event | |
| GET /lms/enrollments/stats | lms-enrollments.controller.ts:184 | :186 | REAL | lmsRepo.findExpiringCertificates + findAllCourses :187 | |
| GET /lms/enrollments/expiring-certificates | lms-enrollments.controller.ts:199 | :201 | REAL | lmsRepo.findExpiringCertificates() :202 | |
| GET /lessons | apps/api/src/modules/lms/presentation/lms-lessons.controller.ts:55 | :57 | REAL | LmsCoursesExtendedService.listLessons() | |
| POST /lessons | lms-lessons.controller.ts:65 | :68 | REAL | svc.createLesson() | |
| GET /lessons/:id | lms-lessons.controller.ts:77 | :79 | REAL | svc.getLessonById() | |
| PUT /lessons/:id | lms-lessons.controller.ts:88 | :91 | REAL | svc.updateLesson() | |
| PATCH /lessons/:id | lms-lessons.controller.ts:101 | :104 | REAL | svc.updateLesson() | |
| DELETE /lessons/:id | lms-lessons.controller.ts:114 | :116 | REAL | svc.deleteLesson() | |
| GET /modules | lms-lessons.controller.ts:135 | :137 | REAL | LmsMiscService.listModules() | |
| POST /modules | lms-lessons.controller.ts:144 | :147 | REAL | svc.createModule() | |
| GET /modules/:id | lms-lessons.controller.ts:156 | :158 | REAL | svc.getModule() | |
| DELETE /modules/:id | lms-lessons.controller.ts:165 | :168 | REAL | db.execute soft-delete UPDATE modules :169 | |
| GET /tests | apps/api/src/modules/lms/presentation/lms-tests.controller.ts:41 | :43 | REAL | LmsTestsService.listTests() | |
| POST /tests | lms-tests.controller.ts:48 | :51 | REAL | svc.createTest() | |
| GET /tests/:id | lms-tests.controller.ts:57 | :59 | REAL | svc.getTest() | |
| PUT /tests/:id | lms-tests.controller.ts:64 | :67 | REAL | svc.updateTest() | |
| DELETE /tests/:id | lms-tests.controller.ts:73 | :75 | REAL | svc.deleteTest() | |
| GET /questions | lms-tests.controller.ts:89 | :91 | REAL | svc.listQuestions() | |
| POST /questions | lms-tests.controller.ts:96 | :99 | REAL | svc.createQuestion() | |
| GET /questions/:questionId | lms-tests.controller.ts:105 | :107 | REAL | svc.getQuestion() | |
| PUT /questions/:questionId | lms-tests.controller.ts:112 | :115 | REAL | svc.updateQuestion() | |
| DELETE /questions/:questionId | lms-tests.controller.ts:121 | :123 | REAL | svc.deleteQuestion() | |
| POST /assignments | lms-tests.controller.ts:137 | :140 | REAL | svc.createAssignment() | |
| GET /micro-modules | apps/api/src/modules/lms/presentation/lms-misc.controller.ts:59 | :61 | REAL | LmsMiscService.listMicroModules() | |
| POST /micro-modules/:id/view | lms-misc.controller.ts:70 | :72 | REAL | svc.recordMicroModuleView() | |
| PATCH /micro-modules/:id/view | lms-misc.controller.ts:83 | :85 | DUPLICATE | same svc.recordMicroModuleView() as POST :id/view | counterpart :70 |
| POST /micro-modules | lms-misc.controller.ts:94 | :97 | REAL | db.execute INSERT micro_modules :103 | raw SQL (no pgTable) |
| GET /lms-knowledge | lms-misc.controller.ts:131 | :133 | REAL | svc.listKnowledge() | |
| GET /video-progress | lms-misc.controller.ts:148 | :150 | REAL | svc.listVideoProgress() | |
| POST /video-progress | lms-misc.controller.ts:157 | :160 | REAL | svc.saveVideoProgress() | |
| GET /achievements | lms-misc.controller.ts:180 | :182 | REAL | svc.listAchievements() | |
| GET /mentors | lms-misc.controller.ts:198 | :200 | REAL | svc.listMentors() | |
| GET /mentors/cards | lms-misc.controller.ts:211 | :213 | REAL | svc.listCardMentors() | |
| GET /mentors/cards/:id | lms-misc.controller.ts:221 | :223 | REAL | svc.getCardMentor() | 404 on missing |
| POST /mentors/cards | lms-misc.controller.ts:232 | :236 | REAL | svc.assignCardMentor() | |
| PUT /mentors/cards/:id | lms-misc.controller.ts:252 | :255 | REAL | svc.updateCardMentor() | |
| DELETE /mentors/cards/:id | lms-misc.controller.ts:265 | :267 | REAL | svc.revokeCardMentor() soft-delete | |
| GET /progress | lms-misc.controller.ts:283 | :285 | REAL | svc.listAllProgress() | |
| GET /progress/user/:id | lms-misc.controller.ts:291 | :293 | REAL | svc.getProgressByUser() | |
| GET /progress/summary | lms-misc.controller.ts:299 | :301 | REAL | db.select agg courseProgress :302 | |
| POST /ai/call | apps/api/src/modules/ai/presentation/ai.controller.ts:54 | :97 | REAL | AiRouterService.call() → real OpenAI/Gemini/Claude SDK (ai-router-call.service.ts:30/60/89) | Err if no API key |
| GET /ai/budget | ai.controller.ts:108 | :161 | REAL | aiRouter.getUsageStats() (ai_usage_log) | |
| GET /ai/bottleneck/analysis | ai.controller.ts:169 | :172 | MOCK | returns static `{bottlenecks:[], analyzedAt}` :173 | No DB/AI call |
| GET /ai/forecast/demand | ai.controller.ts:176 | :180 | 501-STUB | notImplemented('GET /ai/forecast/demand') :181 | gated #FX-5 |
| GET /ai/rush-orders | ai.controller.ts:184 | :188 | 501-STUB | notImplemented() :189 | gated #FX-5 |
| POST /ai/rush-orders/:id/approve | ai.controller.ts:192 | :197 | 501-STUB | notImplemented() :198 | gated #FX-5 |
| POST /ai/rush-orders/:id/reject | ai.controller.ts:201 | :206 | 501-STUB | notImplemented() :208 (parses body then 501) | gated #FX-5 |
| GET /ai/shift/recommendations | ai.controller.ts:211 | :214 | MOCK | returns static `{recommendations:[], generatedAt}` :215 | No DB/AI call |
| GET /gpt/status | apps/api/src/modules/ai/presentation/gpt.controller.ts:33 | :35 | MOCK | static `{status:'active', provider:'gemini', features:[...]}` :36 | |
| GET /gpt/chat | gpt.controller.ts:39 | :41 | MOCK | static usage-doc payload :42 | Info echo, not data |
| POST /gpt/test | gpt.controller.ts:45 | :49 | REAL | aiRouter.call() → real LLM :51 | |
| GET /ai/provider-configs | apps/api/src/modules/ai/presentation/ai-provider-config.controller.ts:53 | :56 | REAL | repo.findAll() ai_provider_config | |
| PATCH /ai/provider-configs/:provider | ai-provider-config.controller.ts:62 | :65 | REAL | repo.upsert() | |
| GET /ai/automation/status | apps/api/src/modules/ai/presentation/ai-automation.controller.ts:24 | :28 | REAL | AiAutomationService.getAutomationStatus() | |
| POST /ai/automation/run-all-pending | ai-automation.controller.ts:32 | :37 | REAL | automation.runAllPendingJobs() | |
| POST /ai/crm/score-lead/:leadId | apps/api/src/modules/ai/presentation/ai-crm.controller.ts:32 | :36 | REAL | CrmAiService.scoreLead() → aiRouter.call() crm-ai.service.ts:33 | ⚠️ hardcoded `{score:50,WARM}` fallback if no AI key :36 |
| POST /ai/crm/deal-probability/:dealId | ai-crm.controller.ts:40 | :44 | REAL | crmAi.predictDealProbability() → aiRouter :78 | ⚠️ neutral fallback if no key |
| POST /ai/crm/churn-risk/:contactId | ai-crm.controller.ts:48 | :53 | REAL | crmAi.assessChurnRisk() → aiRouter | ⚠️ fallback if no key |
| POST /ai/crm/email-template | ai-crm.controller.ts:61 | :66 | REAL | crmAi.generateEmailTemplate() → aiRouter | |
| POST /ai/crm/next-best-action/:dealId | ai-crm.controller.ts:73 | :78 | REAL | crmAi.nextBestAction() → aiRouter | |
| POST /ai/daily-report/submit | apps/api/src/modules/ai/presentation/ai-daily-report.controller.ts:41 | :53 | REAL | AiDailyReportService.submit() (router+DB, 5+5) | needsManualValue if no key (no fabrication) |
| POST /ai/daily-report/ai-answer | ai-daily-report.controller.ts:59 | :72 | REAL | service.submitAndRecord() writes ckp_fact_values | |
| POST /ai/director/kpi-explain | apps/api/src/modules/ai/presentation/ai-director.controller.ts:36 | :41 | REAL | DirectorAiService.explainKpi() → aiRouter | ⚠️ fallback if no key |
| POST /ai/director/risk-assess | ai-director.controller.ts:51 | :56 | REAL | directorAi.assessRisks() → aiRouter | ⚠️ fallback if no key |
| POST /ai/director/strategic-recommendations | ai-director.controller.ts:63 | :68 | REAL | DirectorAiStrategyService.generateStrategicRecommendations() | |
| GET /ai/director/executive-summary | ai-director.controller.ts:75 | :79 | REAL | directorStrategy.generateExecutiveSummary() | |
| GET /ai-exam/attempts | apps/api/src/modules/ai/presentation/ai-exam.controller.ts:40 | :42 | REAL | AiExamService.getAttempts() (9 DB) | |
| GET /ai-exam/attempt/:id | ai-exam.controller.ts:46 | :48 | REAL | service.getAttemptById() | |
| POST /ai-exam/assign | ai-exam.controller.ts:52 | :56 | REAL | service.assignExam() | |
| GET /ai-exam/attempt | ai-exam.controller.ts:60 | :62 | DUPLICATE | alias of GET /ai-exam/attempts (same getAttempts()) | counterpart :40 |
| POST /ai-exam/assign-card | ai-exam.controller.ts:66 | :70 | REAL | service.assignExamToCard() | |
| GET /ai-exam/by-card/:orgFunctionId | ai-exam.controller.ts:75 | :77 | REAL | service.getAttemptsByCard() | |
| POST /ai-exam/attempt | ai-exam.controller.ts:81 | :85 | REAL | service.submitAttempt() | |
| DELETE /ai-exam/attempt/:id | ai-exam.controller.ts:89 | :93 | REAL | service.deleteAttempt() | |
| GET /ai/finance/anomalies | apps/api/src/modules/ai/presentation/ai-finance.controller.ts:69 | :74 | REAL | FinanceAiService.detectAnomalies() (router+DB) | |
| GET /ai/finance/insights | ai-finance.controller.ts:78 | :82 | REAL | detectAnomalies() then buildInsights (controller-side map) | returns [] on err |
| POST /ai/finance/cashflow-forecast | ai-finance.controller.ts:142 | :147 | REAL | financeAi.forecastCashflow() → aiRouter | |
| POST /ai/finance/budget-variance | ai-finance.controller.ts:154 | :159 | REAL | FinanceAiAnalysisService.explainBudgetVariance() | |
| POST /ai/finance/classify-invoice | ai-finance.controller.ts:168 | :173 | REAL | financeAnalysis.classifyInvoice() | |
| POST /ai/finance/fraud-risk | ai-finance.controller.ts:180 | :185 | REAL | financeAnalysis.assessFraudRisk() | |
| POST /ai/fit/evaluate | apps/api/src/modules/ai/presentation/ai-fit.controller.ts:40 | :44 | REAL | AiFitService.evaluate() (router+DB, 4+5) | |
| GET /ai/fit/scores | ai-fit.controller.ts:49 | :51 | REAL | service.listScores() | |
| GET /ai/fit/report/:employeeId | ai-fit.controller.ts:56 | :58 | REAL | service.getReport() | 404 on missing |
| POST /ai/hr/screen/:candidateId | apps/api/src/modules/ai/presentation/ai-hr.controller.ts:38 | :42 | REAL | HrAiService.screenCandidate() → aiRouter | ⚠️ fallback if no key |
| POST /ai/hr/classify-productivity | ai-hr.controller.ts:46 | :51 | REAL | hrAi.classifyProductivity() → aiRouter | ⚠️ `{category:'UNKNOWN'}` fallback :146 |
| POST /ai/hr/interview-questions | ai-hr.controller.ts:55 | :60 | REAL | hrAi.generateInterviewQuestions() → aiRouter | ⚠️ canned questions fallback :170 |
| POST /ai/hr/analyze-tool-test/:toolTestId | ai-hr.controller.ts:64 | :69 | REAL | HrAiExtService.analyzeToolTest() → aiRouter | ⚠️ fallback :199 |
| POST /ai/hr/onboarding-plan | ai-hr.controller.ts:73 | :78 | REAL | hrAiExt.generateOnboardingPlan() → aiRouter | |
| POST /ai/hr/performance-review/:employeeId | ai-hr.controller.ts:82 | :87 | REAL | hrAiExt.performanceReview() → aiRouter | |
| GET /ai-hr/interviews | apps/api/src/modules/ai/presentation/ai-hr-new.controller.ts:34 | :36 | REAL | AiHrNewService.getInterviews() (router+DB, 6+6) | |
| POST /ai-hr/interviews | ai-hr-new.controller.ts:40 | :44 | REAL | service.createInterview() | |
| GET /ai-hr/dashboard | ai-hr-new.controller.ts:48 | :50 | REAL | service.getDashboard() | |
| GET /ai-hr/providers | ai-hr-new.controller.ts:54 | :56 | REAL | service.getProviders() | |
| GET /ai-hr/usage/budget | ai-hr-new.controller.ts:60 | :62 | REAL | service.getUsageBudget() | |
| GET /ai-hr/tasks/:id | ai-hr-new.controller.ts:66 | :68 | REAL | service.getTaskById() | |
| POST /ai-hr/tasks/:taskType | ai-hr-new.controller.ts:73 | :77 | REAL | service.submitTask() | |
| POST /ai/marketing/generate-content | apps/api/src/modules/ai/presentation/ai-marketing.controller.ts:33 | :38 | REAL | MarketingAiService.generateContent() → aiRouter | |
| POST /ai/marketing/ad-copy | ai-marketing.controller.ts:47 | :52 | REAL | marketingAi.generateAdCopy() → aiRouter | |
| POST /ai/marketing/sentiment-analyze | ai-marketing.controller.ts:61 | :66 | REAL | marketingAi.analyzeSentiment() → aiRouter | ⚠️ `{NEUTRAL,50}` fallback :149 |
| POST /ai/marketing/seo-optimize | ai-marketing.controller.ts:73 | :78 | REAL | marketingAi.optimizeSeo() → aiRouter | |
| GET /ai-planning/dashboard | apps/api/src/modules/ai/presentation/ai-planning.controller.ts:40 | :42 | REAL | AiPlanningService.getDashboard() (16 DB) | |
| GET /ai-planning/plans | ai-planning.controller.ts:46 | :48 | REAL | service.getPlans() | |
| POST /ai-planning/plans | ai-planning.controller.ts:52 | :57 | REAL | service.createPlan() | |
| GET /ai-planning/config | ai-planning.controller.ts:61 | :63 | REAL | service.getConfig() | |
| PUT /ai-planning/config | ai-planning.controller.ts:67 | :71 | REAL | service.updateConfig() | |
| PATCH /ai-planning/config | ai-planning.controller.ts:75 | :81 | REAL | service.updateConfig() | |
| POST /ai-planning/generate | ai-planning.controller.ts:85 | :90 | REAL | service.generatePlan() | |
| GET /ai-planning/plans/:id | ai-planning.controller.ts:94 | :96 | REAL | service.getPlanById() | 404 |
| GET /ai-planning/plans/:id/batch-groups | ai-planning.controller.ts:100 | :102 | REAL | service.getBatchGroups() | |
| POST /ai-planning/plans/:id/approve | ai-planning.controller.ts:106 | :111 | REAL | service.approvePlan() | |
| POST /ai-planning/plans/:id/reject | ai-planning.controller.ts:115 | :120 | REAL | service.rejectPlan() | |
| POST /ai-planning/plans/:id/execute | ai-planning.controller.ts:124 | :128 | REAL | service.executePlan() | |
| POST /ai-planning/plans/:id/reschedule | ai-planning.controller.ts:132 | :137 | REAL | service.reschedulePlan() | |
| POST /ai-planning/decisions/:id/accept | ai-planning.controller.ts:141 | :145 | REAL | service.acceptDecision() | |
| POST /ai-planning/orders/:orderId/block-material | ai-planning.controller.ts:149 | :154 | REAL | service.blockMaterial() | |
| GET /ai-reservation | apps/api/src/modules/ai/presentation/ai-reservation.controller.ts:31 | :33 | REAL | AiReservationService.getAll() (13 DB) | |
| GET /ai-reservation/requests | ai-reservation.controller.ts:37 | :39 | REAL | service.getRequests() | |
| GET /ai-reservation/dashboard | ai-reservation.controller.ts:43 | :45 | REAL | service.getDashboard() | |
| POST /ai-reservation/request | ai-reservation.controller.ts:49 | :53 | REAL | service.createRequest() | |
| GET /ai-reservation/optimize | ai-reservation.controller.ts:57 | :59 | REAL | service.optimizeReservation() | |
| POST /ai-reservation/requests/:id/confirm | ai-reservation.controller.ts:63 | :67 | REAL | service.confirmRequest() | |
| POST /ai-reservation/requests/:id/cancel | ai-reservation.controller.ts:71 | :75 | REAL | service.cancelRequest() | |
| GET /ai-reservation/batches | ai-reservation.controller.ts:79 | :81 | DUPLICATE | calls service.getAll() — same as GET /ai-reservation | counterpart :31 |
| POST /ai-reservation/batches | ai-reservation.controller.ts:85 | :89 | REAL | service.createBatch() | |
| POST /ai/wms/reorder-point | apps/api/src/modules/ai/presentation/ai-wms.controller.ts:33 | :38 | REAL | WmsAiService.calculateReorderPoint() → aiRouter | ⚠️ fallback if no key |
| POST /ai/wms/optimize-stock | ai-wms.controller.ts:48 | :53 | REAL | wmsAi.optimizeStock() → aiRouter | |
| POST /ai/wms/delivery-predict | ai-wms.controller.ts:60 | :65 | REAL | wmsAi.predictDelivery() → aiRouter | |
| POST /ai/wms/route-optimize | ai-wms.controller.ts:75 | :80 | REAL | wmsAi.optimizeRoute() → aiRouter | |
| POST /forecast/run (+/forecasts) | apps/api/src/modules/ai/presentation/forecast-ext.controller.ts:70 | :74 | REAL | ForecastWeeklyJob.scheduleForecastJobs() :75 | |
| POST /forecast/:id/ema | forecast-ext.controller.ts:79 | :82 | REAL | ForecastService.forecastEma() :84 | |
| POST /forecast/:id/hw | forecast-ext.controller.ts:88 | :91 | REAL | HoltWintersService.autoForecast() :93 | |
| POST /forecast/:id/croston | forecast-ext.controller.ts:97 | :100 | REAL | CrostonService.forecast() + persistenceSvc.saveForecast() :106 | |
| POST /forecast/:id/ensemble | forecast-ext.controller.ts:123 | :126 | REAL | EnsembleForecastService.ensemble() + saveForecast :139 | Math.random only in ensemble internal jitter, output persisted |
| GET /insights | apps/api/src/modules/ai/presentation/insights.controller.ts:33 | :35 | REAL | InsightsService.getAll() (4 DB) | |
| GET /insights/dashboard | insights.controller.ts:40 | :42 | REAL | service.getAll() then counts | |
| POST /insights/generate | insights.controller.ts:49 | :53 | REAL | service.generate() | |
| PATCH /insights/:id/read | insights.controller.ts:57 | :61 | REAL | service.markRead() | 404 |

### Notes / risks
- **Cross-controller duplicate surface (not counted per-row to avoid inflation):** `courses` (prefix `courses`, `LmsCoursesExtendedService`) and `lms-courses` (prefix `lms/courses`, CQRS + `LmsRepository`) are two parallel course-CRUD APIs (list/get/create/update/delete). Both REAL and both registered — a genuine two-surface overlap; FE could hit either. Worth an owner decision on canonical prefix.
- **AI-LLM hardcoded fallbacks (marked ⚠️ above):** wired to real LLM but degrade to canned neutral values (`score:50/WARM/NEUTRAL/UNKNOWN`, canned interview questions) with HTTP 200 when `isErr(aiResult)` (no API key / call fails). In a keyless env these read as GREEN-LIE. Sources: crm-ai.service.ts:36/43, hr-ai.service.ts:146/170/199, marketing-ai.service.ts:149, plus director/wms analogous.
- `material-balance GET /movements`: docstring claims "returns 501" but the handler actually runs a real `db.execute` SELECT — stale comment, code is REAL.


---

## Kanban + Org-Structure + ERP

All paths are prefixed with the global `/api`. Controller `@Controller` prefixes: `kanban`, `org-structure`, `org-structure/cards`, `org-structure/ckp`, `org-structure/razryad-levels`, `org-structure/card-templates`, `org-structure/error-catalog`, `org-structure/cards/:cardId/folder`, `erp`.

Kanban delegates through `KanbanExtService`/`KanbanBoardsService` → repos in `modules/kanban/infrastructure/repositories/*` (all real Drizzle/`runQuery` SQL; no stub/`notImplemented`/`Math.random` found in the module). Org-structure delegates to per-entity services+repos. ERP delegates to `erp.service`/`erp-extra.service`/`erp-camera.service`/`erp-reports.service` → `erp.repository`/`erp-extra.repository`.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /kanban/boards/:boardId/flows | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:46 | same:48 | REAL | svc.getFlowsByBoard → flow repo | |
| POST /kanban/flows | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:52 | same:55 | REAL | svc.createFlow (INSERT) | |
| GET /kanban/flows/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:66 | same:68 | REAL | svc.getFlowById | |
| PUT /kanban/flows/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:72 | same:75 | REAL | svc.updateFlow (UPDATE) | |
| DELETE /kanban/flows/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:80 | same:84 | REAL | svc.deleteFlow | |
| GET /kanban/robots/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:90 | same:92 | REAL | svc.getRobotById | |
| PUT /kanban/robots/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:96 | same:99 | REAL | svc.updateRobot | |
| DELETE /kanban/robots/:id | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:104 | same:108 | REAL | svc.deleteRobot | |
| PUT /kanban/boards/:boardId | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:114 | same:117 | REAL | svc.updateBoard | |
| DELETE /kanban/boards/:boardId | apps/api/src/modules/kanban/presentation/kanban-core.controller.ts:122 | same:126 | REAL | svc.deleteBoard | |
| GET /kanban/cards/:id/checklists | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:37 | same:39 | REAL | svc.getCardChecklists | |
| POST /kanban/cards/:id/checklists | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:43 | same:47 | REAL | svc.createChecklist (INSERT) | |
| PUT /kanban/checklists/:checklistId | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:52 | same:55 | REAL | svc.updateChecklist | |
| DELETE /kanban/checklists/:checklistId | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:60 | same:64 | REAL | svc.deleteChecklist | |
| GET /kanban/checklists/:id/items | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:68 | same:70 | REAL | svc.getChecklistItems | |
| POST /kanban/checklists/:id/items | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:74 | same:78 | REAL | svc.createChecklistItem | |
| PUT /kanban/checklists/:checklistId/items/:itemId | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:83 | same:86 | REAL | svc.updateChecklistItem | |
| DELETE /kanban/checklists/:checklistId/items/:itemId | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:91 | same:95 | REAL | svc.deleteChecklistItem | |
| PUT /kanban/checklist-items/:itemId/toggle | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:99 | same:103 | REAL | svc.toggleChecklistItem (UPDATE) | |
| GET /kanban/cards/:id/comments | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:107 | same:109 | REAL | svc.getCardComments | |
| POST /kanban/cards/:id/comments | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:113 | same:117 | REAL | svc.addComment (INSERT) | |
| GET /kanban/cards/:id/watchers | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:122 | same:124 | REAL | svc.getCardWatchers | |
| POST /kanban/cards/:id/watchers | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:128 | same:132 | REAL | svc.addWatcher | possible overlap w/ observers (distinct svc method) |
| GET /kanban/sprint | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:136 | drizzle-kanban-stats.repo.ts:234 | REAL | real COUNT over kanban_cards | |
| GET /kanban/cards/overdue | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:142 | same:144 | REAL | svc.getOverdueCards | |
| GET /kanban/cards/by-employee/:employeeId | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:148 | same:150 | REAL | svc.getCardsByEmployee | |
| GET /kanban/members | apps/api/src/modules/kanban/presentation/kanban-checklist.controller.ts:154 | same:156 | REAL | svc.getMembers | |
| GET /kanban/cards/:id/results | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:53 | same:55 | REAL | svc.getCardResults | |
| POST /kanban/cards/:id/results | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:59 | same:62 | REAL | svc.createResult (INSERT) | |
| GET /kanban/results/:resultId/files | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:73 | same:75 | REAL | svc.getResultFiles | |
| POST /kanban/results/:resultId/files | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:81 | same:85 | REAL | multipart write to disk + svc.addResultFile (INSERT) | |
| DELETE /kanban/result-files/:fileId | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:131 | same:134 | REAL | svc.deleteResultFile | returns {deleted:true} without checking Result.ok (delete still executes) |
| GET /kanban/cards/:id/files | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:141 | same:143 | REAL | svc.getCardFiles | |
| POST /kanban/cards/:id/files | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:147 | same:151 | REAL | multipart write + svc.createFile (INSERT) | |
| DELETE /kanban/files/:fileId | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:198 | same:201 | REAL | svc.deleteFile (soft delete) | returns success without checking Result.ok |
| GET /kanban/cards/:id/time-entries | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:208 | same:210 | REAL | svc.getTimeEntries | |
| POST /kanban/cards/:id/time-entries/start | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:214 | same:217 | REAL | svc.startTimeTracking (INSERT) | |
| POST /kanban/cards/:id/time-entries/stop | apps/api/src/modules/kanban/presentation/kanban-card-files.controller.ts:228 | same:231 | REAL | svc.stopTimeTracking (UPDATE) | |
| GET /kanban/reports/employee-performance | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:77 | same:79 | REAL | svc.getEmployeePerformance | |
| GET /kanban/reports/productivity | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:83 | same:85 | REAL | svc.getProductivityReport | |
| GET /kanban/reports/overdue | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:89 | same:91 | REAL | svc.getOverdueReport | |
| GET /kanban/analytics/summary | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:95 | drizzle-kanban-stats.repo.ts:343 | REAL | real COUNT over kanban_cards | |
| GET /kanban/reports/export | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:101 | same:103 | REAL | exceljs/pdfmake from svc.getTaskStats/getTeamMetrics/getOverdueReport | PDF catch-branch (:173-178) emits `%PDF-1.4 placeholder` only if pdfmake throws — degraded fallback |
| GET /kanban/task-stats | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:233 | same:235 | REAL | svc.getTaskStats | |
| GET /kanban/dashboard/team-metrics | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:239 | same:241 | REAL | svc.getTeamMetrics | |
| GET /kanban/overdue-inbox | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:247 | same:249 | REAL | svc.getOverdueInbox | |
| GET /kanban/projects | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:257 | same:260 | REAL | inline SQL SELECT task_projects | |
| POST /kanban/projects | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:270 | same:275 | REAL | inline SQL INSERT task_projects | |
| PUT /kanban/projects/:id | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:294 | same:301 | REAL | inline SQL UPDATE task_projects | |
| DELETE /kanban/projects/:id | apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:323 | same:330 | REAL | inline SQL soft-delete task_projects | |
| GET /kanban/boards/:boardId/cards | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:99 | same:101 | REAL | runQuery SELECT kanban_cards + visibility predicate | catch returns {items:[],total:0} (read fallback) |
| GET /kanban/cards | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:118 | same:120 | REAL | runQuery SELECT kanban_cards JOIN boards/columns | catch returns empty (read fallback) |
| PUT /kanban/cards/:id/rating | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:153 | same:155 | REAL | runQuery UPDATE kanban_cards SET rating | |
| POST /kanban/cards | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:166 | same:170 | REAL | svc.createCardFlat (INSERT) | overlaps POST /kanban/boards/:boardId/cards (different svc path/UI) |
| PATCH /kanban/:id/assign | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:183 | same:187 | REAL | runQuery UPDATE kanban_cards SET owner_user_id | path is /kanban/:id/assign (no `cards`) |
| PUT /kanban/cards/:id/accept | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:200 | same:204 | REAL | svc.acceptCard (UPDATE) | |
| PUT /kanban/cards/:id/complete | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:211 | same:215 | REAL | svc.completeCard (UPDATE) | |
| GET /kanban/cards/:id/chat | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:228 | same:230 | DUPLICATE | svc.getCardComments — identical to GET /kanban/cards/:id/comments | |
| POST /kanban/cards/:id/chat | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:234 | same:237 | DUPLICATE | svc.addComment — identical to POST /kanban/cards/:id/comments | |
| GET /kanban/chat-messages/:id/files | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:248 | same:250 | REAL | inline SQL SELECT task_chat_message_files | |
| POST /kanban/chat-messages/:id/files | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:261 | same:264 | REAL | inline SQL INSERT task_chat_message_files | |
| GET /kanban/cards/:id/tags | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:284 | same:286 | REAL | svc.getCardTags | |
| POST /kanban/cards/:id/tags | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:290 | same:293 | REAL | svc.addTagToCard (INSERT) | |
| DELETE /kanban/cards/:id/tags/:tagId | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:302 | same:305 | REAL | svc.removeTagFromCard | |
| GET /kanban/cards/:id/observers | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:312 | same:314 | REAL | svc.getObservers | |
| POST /kanban/cards/:id/observers | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:318 | same:321 | REAL | svc.addObserver (INSERT) | |
| DELETE /kanban/cards/:id/observers/:observerId | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:326 | same:329 | REAL | svc.removeObserver | |
| GET /kanban/cards/:id/co-executors | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:336 | same:338 | REAL | svc.getCoExecutors | |
| POST /kanban/cards/:id/co-executors | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:342 | same:345 | REAL | svc.addCoExecutor (INSERT) | |
| DELETE /kanban/cards/:id/co-executors/:coExecutorId | apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts:350 | same:353 | REAL | svc.removeCoExecutor | |
| GET /kanban/boards | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:51 | same:53 | REAL | boardsSvc.getBoards | |
| GET /kanban/boards/:boardId | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:64 | same:66 | REAL | boardsSvc.getBoardById | |
| POST /kanban/boards | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:73 | same:81 | REAL | boardsSvc.createBoard (INSERT) | super_admin/director only |
| POST /kanban/boards/:boardId/columns | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:87 | same:94 | REAL | boardsSvc.addColumn (INSERT) | |
| PATCH /kanban/boards/:boardId/columns/:columnId | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:98 | same:101 | REAL | boardsSvc.updateColumn | |
| DELETE /kanban/boards/:boardId/columns/:columnId | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:109 | same:112 | REAL | boardsSvc.deleteColumn | |
| POST /kanban/boards/:boardId/cards | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:123 | same:127 | REAL | boardsSvc.addCard (INSERT) | overlaps POST /kanban/cards |
| PUT /kanban/cards/:id | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:135 | same:138 | REAL | boardsSvc.updateCard | |
| PUT /kanban/cards/:id/move | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:142 | same:145 | REAL | boardsSvc.moveCard (UPDATE) | |
| DELETE /kanban/cards/:id | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:153 | same:156 | REAL | boardsSvc.deleteCard | |
| GET /kanban/employees | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:164 | same:166 | REAL | extSvc.getEmployees | |
| GET /kanban/notifications/unread-count | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:172 | same:174 | REAL | extSvc.getUnreadCount | |
| GET /kanban/notifications | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:180 | same:182 | REAL | extSvc.getNotifications | |
| PUT /kanban/notifications/read-all | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:196 | same:199 | REAL | extSvc.markAllNotificationsRead (UPDATE) | returns {ok:true} but write executes |
| PUT /kanban/notifications/:id/read | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:204 | same:207 | REAL | extSvc.markNotificationRead (UPDATE) | |
| GET /kanban/templates | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:217 | same:219 | REAL | extSvc.getTemplates | |
| POST /kanban/templates | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:223 | same:226 | REAL | extSvc.createTemplate (INSERT) | |
| PUT /kanban/templates/:id | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:241 | same:244 | REAL | extSvc.updateTemplate | |
| DELETE /kanban/templates/:id | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:248 | same:251 | REAL | extSvc.deleteTemplate | |
| POST /kanban/templates/:templateId/apply | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:256 | same:261 | REAL | loops boardsSvc.addColumn per template column | super_admin/director only |
| GET /kanban/boards/:boardId/robots | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:297 | same:299 | REAL | extSvc.getRobotsByBoard | |
| POST /kanban/boards/:boardId/robots | apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts:303 | same:306 | REAL | extSvc.createRobot (INSERT) | |
| GET /org-structure/hierarchy | apps/api/src/modules/org-structure/org-structure.controller.ts:158 | same:159 | REAL | service.getHierarchy | |
| GET /org-structure/stats | apps/api/src/modules/org-structure/org-structure.controller.ts:165 | same:166 | REAL | service.getStats | |
| GET /org-structure/nodes/flat | apps/api/src/modules/org-structure/org-structure.controller.ts:172 | same:173 | REAL | service.getFlat | |
| GET /org-structure/available-users | apps/api/src/modules/org-structure/org-structure.controller.ts:185 | same:186 | REAL | service.getAvailableUsers | |
| GET /org-structure/nodes/:id | apps/api/src/modules/org-structure/org-structure.controller.ts:193 | same:194 | REAL | service.findOne | |
| POST /org-structure/nodes | apps/api/src/modules/org-structure/org-structure.controller.ts:201 | same:202 | REAL | service.create (INSERT org_departments) | |
| POST /org-structure/nodes/import | apps/api/src/modules/org-structure/org-structure.controller.ts:215 | same:216 | REAL | service.importNodes (bulk INSERT, partial-commit) | |
| PATCH /org-structure/nodes/:id | apps/api/src/modules/org-structure/org-structure.controller.ts:225 | same:226 | REAL | service.update | |
| DELETE /org-structure/nodes/:id | apps/api/src/modules/org-structure/org-structure.controller.ts:235 | same:236 | REAL | service.remove | |
| PATCH /org-structure/nodes/:id/move | apps/api/src/modules/org-structure/org-structure.controller.ts:244 | same:245 | REAL | service.move | |
| PATCH /org-structure/users/:userId/node | apps/api/src/modules/org-structure/org-structure.controller.ts:253 | same:254 | REAL | service.assignUserToNode | |
| DELETE /org-structure/users/:userId/node/:nodeId | apps/api/src/modules/org-structure/org-structure.controller.ts:271 | same:272 | REAL | service.removeUserFromNode | |
| GET /org-structure/export/excel | apps/api/src/modules/org-structure/org-structure.controller.ts:283 | same:284 | REAL | exportService.exportExcel | |
| GET /org-structure/export/pdf | apps/api/src/modules/org-structure/org-structure.controller.ts:296 | same:297 | REAL | exportService.exportPdf | |
| GET /org-structure/nodes/:id/folder | apps/api/src/modules/org-structure/org-structure.controller.ts:312 | same:313 | REAL | folderService.getFolderItems | |
| POST /org-structure/nodes/:id/folder | apps/api/src/modules/org-structure/org-structure.controller.ts:321 | same:322 | REAL | folderService.addFolderItem (INSERT) | |
| DELETE /org-structure/nodes/:nodeId/folder/:itemId | apps/api/src/modules/org-structure/org-structure.controller.ts:330 | same:331 | REAL | folderService.removeFolderItem | |
| GET /org-structure/employees/:userId/folder | apps/api/src/modules/org-structure/org-structure.controller.ts:341 | same:342 | REAL | folderService.getEmployeeFolderItems | |
| GET /org-structure/nodes/:nodeId/history | apps/api/src/modules/org-structure/org-structure.controller.ts:349 | same:354 | REAL | inline SQL SELECT audit_logs | |
| GET /org-structure/nodes/:nodeId/hr-requests | apps/api/src/modules/org-structure/org-structure.controller.ts:373 | same:374 | REAL | portretService.getHrRequests | |
| POST /org-structure/nodes/:nodeId/hr-requests | apps/api/src/modules/org-structure/org-structure.controller.ts:382 | same:383 | REAL | portretService.createHrRequest (INSERT) | |
| GET /org-structure/nodes/:nodeId/portret | apps/api/src/modules/org-structure/org-structure.controller.ts:402 | same:403 | REAL | portretService.getPortret | |
| POST /org-structure/nodes/:nodeId/portret | apps/api/src/modules/org-structure/org-structure.controller.ts:411 | same:412 | REAL | portretService.savePortret (upsert) | |
| GET /org-structure/nodes/:nodeId/approval-chain | apps/api/src/modules/org-structure/org-structure.controller.ts:425 | same:426 | REAL | service.getApprovalChain | |
| GET /org-structure/nodes/:nodeId/direct-manager | apps/api/src/modules/org-structure/org-structure.controller.ts:433 | same:434 | REAL | service.getDirectManager | |
| GET /org-structure/nodes/:nodeId/telegram-group | apps/api/src/modules/org-structure/org-structure.controller.ts:441 | same:442 | REAL | service.getTelegramGroupForNode | |
| GET /org-structure/manager-chain/:nodeId | apps/api/src/modules/org-structure/org-structure.controller.ts:453 | same:454 | REAL | service.deriveManagerForNode | |
| POST /org-structure/admin/backfill-manager-ids | apps/api/src/modules/org-structure/org-structure.controller.ts:466 | same:467 | REAL | service.triggerManagerBackfill (dryRun default true) | super_admin/hr only |
| GET /org-structure/cards | apps/api/src/modules/org-structure/card.controller.ts:84 | same:85 | REAL | service.list | |
| GET /org-structure/cards/:id | apps/api/src/modules/org-structure/card.controller.ts:100 | same:101 | REAL | service.findById | |
| GET /org-structure/cards/:id/can-assign | apps/api/src/modules/org-structure/card.controller.ts:107 | same:108 | REAL | service.canAssignEmployee | |
| GET /org-structure/cards/:id/portret | apps/api/src/modules/org-structure/card.controller.ts:116 | same:117 | REAL | service.getCardPortret | |
| PUT /org-structure/cards/:id/portret | apps/api/src/modules/org-structure/card.controller.ts:125 | same:126 | REAL | service.saveCardPortret (upsert) | |
| GET /org-structure/cards/:id/employees | apps/api/src/modules/org-structure/card.controller.ts:144 | same:145 | REAL | service.listEmployees | |
| GET /org-structure/cards/:id/fit | apps/api/src/modules/org-structure/card.controller.ts:153 | same:154 | REAL | service.computeCardFit (deterministic v1) | |
| GET /org-structure/cards/:id/manager-candidates | apps/api/src/modules/org-structure/card.controller.ts:162 | same:163 | REAL | service.listManagerCandidates | |
| PATCH /org-structure/cards/:id/manager | apps/api/src/modules/org-structure/card.controller.ts:172 | same:173 | REAL | service.setCardManager (UPDATE, cycle-guarded) | |
| GET /org-structure/cards/:id/children | apps/api/src/modules/org-structure/card.controller.ts:180 | same:181 | REAL | service.listChildren | |
| GET /org-structure/cards/:id/vacancies | apps/api/src/modules/org-structure/card.controller.ts:189 | same:190 | REAL | service.listVacancies | |
| GET /org-structure/cards/:id/history | apps/api/src/modules/org-structure/card.controller.ts:198 | same:199 | REAL | service.listHistory | |
| GET /org-structure/cards/by-employee/:employeeId | apps/api/src/modules/org-structure/card.controller.ts:209 | same:210 | REAL | service.listEmployeeCards (FORMULA-A salary) | |
| POST /org-structure/cards/:id/assign | apps/api/src/modules/org-structure/card.controller.ts:217 | same:218 | REAL | service.assignEmployeeToCard (INSERT, atomic guard) | |
| DELETE /org-structure/cards/:id/assign/:employeeId | apps/api/src/modules/org-structure/card.controller.ts:229 | same:230 | REAL | service.unassignEmployeeFromCard | |
| GET /org-structure/cards/:id/certificates | apps/api/src/modules/org-structure/card.controller.ts:239 | same:240 | REAL | service.listCertificates | |
| PATCH /org-structure/cards/:id/review | apps/api/src/modules/org-structure/card.controller.ts:249 | same:250 | REAL | service.markReviewed (UPDATE) | |
| PATCH /org-structure/cards/:id/freeze | apps/api/src/modules/org-structure/card.controller.ts:259 | same:260 | REAL | service.freezeCard (UPDATE) | |
| PATCH /org-structure/cards/:id/thaw | apps/api/src/modules/org-structure/card.controller.ts:269 | same:270 | REAL | service.thawCard (UPDATE) | |
| PATCH /org-structure/cards/:id/vacant | apps/api/src/modules/org-structure/card.controller.ts:278 | same:279 | REAL | service.setVacantCard (UPDATE) | |
| PATCH /org-structure/cards/:id/restore | apps/api/src/modules/org-structure/card.controller.ts:287 | same:288 | REAL | service.restoreCard (UPDATE) | |
| GET /org-structure/cards/gate/by-user/:userId | apps/api/src/modules/org-structure/card.controller.ts:295 | same:296 | REAL | service.resolveGate | |
| POST /org-structure/cards | apps/api/src/modules/org-structure/card.controller.ts:303 | same:304 | REAL | service.create (INSERT) | |
| PATCH /org-structure/cards/:id | apps/api/src/modules/org-structure/card.controller.ts:314 | same:315 | REAL | service.update | |
| DELETE /org-structure/cards/:id | apps/api/src/modules/org-structure/card.controller.ts:323 | same:324 | REAL | service.softDelete | |
| POST /org-structure/ckp/fact | apps/api/src/modules/org-structure/ckp.controller.ts:41 | same:42 | REAL | service.recordFact (INSERT + cascade) | |
| GET /org-structure/ckp/fact | apps/api/src/modules/org-structure/ckp.controller.ts:60 | same:61 | REAL | service.listByCard | |
| GET /org-structure/ckp/aggregate/:cardId | apps/api/src/modules/org-structure/ckp.controller.ts:69 | same:70 | REAL | service.aggregate (cascade over children) | |
| GET /org-structure/razryad-levels | apps/api/src/modules/org-structure/razryad.controller.ts:75 | same:76 | REAL | service.list | |
| GET /org-structure/razryad-levels/:id | apps/api/src/modules/org-structure/razryad.controller.ts:86 | same:87 | REAL | service.findById | |
| POST /org-structure/razryad-levels | apps/api/src/modules/org-structure/razryad.controller.ts:95 | same:96 | REAL | service.create (INSERT) | |
| PATCH /org-structure/razryad-levels/:id | apps/api/src/modules/org-structure/razryad.controller.ts:107 | same:108 | REAL | service.update | |
| PATCH /org-structure/razryad-levels/:id/settings | apps/api/src/modules/org-structure/razryad.controller.ts:122 | same:123 | REAL | service.updateSettings | |
| DELETE /org-structure/razryad-levels/:id | apps/api/src/modules/org-structure/razryad.controller.ts:132 | same:133 | REAL | service.softDelete | |
| GET /org-structure/cards/:cardId/razryad-history | apps/api/src/modules/org-structure/razryad-history.controller.ts:43 | same:44 | REAL | service.historyByCard | |
| GET /org-structure/cards/:cardId/razryad-requests | apps/api/src/modules/org-structure/razryad-history.controller.ts:52 | same:53 | REAL | service.listRequestsByCard | |
| GET /org-structure/razryad-requests/pending | apps/api/src/modules/org-structure/razryad-history.controller.ts:62 | same:63 | REAL | service.listPendingRequests | |
| POST /org-structure/cards/:cardId/razryad-requests | apps/api/src/modules/org-structure/razryad-history.controller.ts:73 | same:74 | REAL | service.createRequest (INSERT) | |
| POST /org-structure/razryad-requests/:id/hr-approve | apps/api/src/modules/org-structure/razryad-history.controller.ts:95 | same:96 | REAL | service.hrApprove (1st signature) | |
| POST /org-structure/razryad-requests/:id/manager-approve | apps/api/src/modules/org-structure/razryad-history.controller.ts:104 | same:105 | REAL | service.managerApprove (2nd sig → razryad change) | |
| POST /org-structure/razryad-requests/:id/reject | apps/api/src/modules/org-structure/razryad-history.controller.ts:112 | same:113 | REAL | service.reject (UPDATE) | |
| GET /org-structure/cards/:cardId/folder | apps/api/src/modules/org-structure/card-folder.controller.ts:43 | same:44 | REAL | service.getFolder | |
| PUT /org-structure/cards/:cardId/folder | apps/api/src/modules/org-structure/card-folder.controller.ts:51 | same:52 | REAL | service.upsertFolder (upsert 6 sections) | |
| GET /org-structure/card-templates | apps/api/src/modules/org-structure/card-template.controller.ts:51 | same:52 | REAL | service.list | |
| GET /org-structure/card-templates/:id | apps/api/src/modules/org-structure/card-template.controller.ts:61 | same:62 | REAL | service.findById | |
| POST /org-structure/card-templates | apps/api/src/modules/org-structure/card-template.controller.ts:70 | same:71 | REAL | service.create (INSERT) | |
| PATCH /org-structure/card-templates/:id | apps/api/src/modules/org-structure/card-template.controller.ts:81 | same:82 | REAL | service.update | |
| DELETE /org-structure/card-templates/:id | apps/api/src/modules/org-structure/card-template.controller.ts:90 | same:91 | REAL | service.softDelete | |
| POST /org-structure/card-templates/:id/apply-template | apps/api/src/modules/org-structure/card-template.controller.ts:99 | same:100 | REAL | service.applyTemplate (seeds new org_departments card) | |
| GET /org-structure/error-catalog | apps/api/src/modules/org-structure/error-catalog.controller.ts:52 | same:53 | REAL | service.list | |
| GET /org-structure/error-catalog/:id | apps/api/src/modules/org-structure/error-catalog.controller.ts:63 | same:64 | REAL | service.findById | |
| POST /org-structure/error-catalog | apps/api/src/modules/org-structure/error-catalog.controller.ts:72 | same:73 | REAL | service.create (INSERT) | |
| PATCH /org-structure/error-catalog/:id | apps/api/src/modules/org-structure/error-catalog.controller.ts:83 | same:84 | REAL | service.update | |
| DELETE /org-structure/error-catalog/:id | apps/api/src/modules/org-structure/error-catalog.controller.ts:92 | same:93 | REAL | service.softDelete | |
| GET /erp/camera-reports/employees | apps/api/src/modules/erp/erp-camera.controller.ts:40 | same:41 | REAL | svc.cameraEmployeeReports | |
| GET /erp/camera-reports/employees/:userId | apps/api/src/modules/erp/erp-camera.controller.ts:50 | same:51 | REAL | svc.cameraEmployeeReport | |
| GET /erp/cameras/live-detections | apps/api/src/modules/erp/erp-camera.controller.ts:67 | same:68 | REAL | svc.liveDetections | |
| GET /erp/cameras/grouped-detections | apps/api/src/modules/erp/erp-camera.controller.ts:74 | same:75 | REAL | svc.groupedDetections | |
| GET /erp/team-analytics/departments | apps/api/src/modules/erp/erp-camera.controller.ts:81 | same:82 | REAL | svc.teamAnalyticsDepartments | |
| GET /erp/team-analytics/zone-activity | apps/api/src/modules/erp/erp-camera.controller.ts:88 | same:89 | REAL | svc.teamAnalyticsZoneActivity | |
| GET /erp/team-analytics/zone-activity/:departmentId | apps/api/src/modules/erp/erp-camera.controller.ts:97 | same:98 | REAL | svc.teamAnalyticsZoneActivity(deptId) | |
| GET /erp/employee/:id/metrics | apps/api/src/modules/erp/erp-camera.controller.ts:108 | same:109 | REAL | svc.getEmployeeMetrics | |
| GET /erp/employee/:id/transfer-history | apps/api/src/modules/erp/erp-camera.controller.ts:116 | same:117 | REAL | svc.getEmployeeTransferHistory | |
| GET /erp/daily-reports | apps/api/src/modules/erp/erp-reports.controller.ts:37 | same:38 | REAL | svc.listDailyReports | |
| POST /erp/daily-reports | apps/api/src/modules/erp/erp-reports.controller.ts:45 | same:48 | REAL | svc.createDailyReport (INSERT) | |
| GET /erp/daily-reports/:id | apps/api/src/modules/erp/erp-reports.controller.ts:55 | same:56 | REAL | svc.getDailyReport | |
| PATCH /erp/daily-reports/:id | apps/api/src/modules/erp/erp-reports.controller.ts:68 | same:71 | REAL | svc.updateDailyReport | |
| DELETE /erp/daily-reports/:id | apps/api/src/modules/erp/erp-reports.controller.ts:79 | same:81 | REAL | svc.deleteDailyReport | |
| GET /erp/production-facts | apps/api/src/modules/erp/erp-reports.controller.ts:87 | same:88 | REAL | svc.listProductionFacts | |
| POST /erp/production-facts | apps/api/src/modules/erp/erp-reports.controller.ts:95 | same:98 | REAL | svc.createProductionFact (INSERT) | |
| GET /erp/production-plans | apps/api/src/modules/erp/erp-reports.controller.ts:104 | same:105 | REAL | svc.listProductionPlans | |
| POST /erp/production-plans | apps/api/src/modules/erp/erp-reports.controller.ts:112 | same:115 | REAL | svc.createProductionPlan (INSERT) | |
| PUT /erp/production-plans/:id | apps/api/src/modules/erp/erp-reports.controller.ts:123 | same:126 | REAL | svc.updateProductionPlan | |
| PATCH /erp/production-plans/:id | apps/api/src/modules/erp/erp-reports.controller.ts:134 | same:137 | REAL | svc.updateProductionPlan (same as PUT) | |
| GET /erp/downtime-logs | apps/api/src/modules/erp/erp-reports.controller.ts:143 | same:144 | REAL | svc.listDowntimeLogs | |
| POST /erp/downtime-logs | apps/api/src/modules/erp/erp-reports.controller.ts:151 | same:154 | REAL | svc.createDowntimeLog (INSERT) | |
| GET /erp/downtime-logs/:id | apps/api/src/modules/erp/erp-reports.controller.ts:161 | same:162 | REAL | svc.getDowntimeLog | |
| PUT /erp/downtime-logs/:id | apps/api/src/modules/erp/erp-reports.controller.ts:174 | same:177 | REAL | svc.updateDowntimeLog | |
| PATCH /erp/downtime-logs/:id | apps/api/src/modules/erp/erp-reports.controller.ts:185 | same:188 | REAL | svc.updateDowntimeLog (same as PUT) | |
| DELETE /erp/downtime-logs/:id | apps/api/src/modules/erp/erp-reports.controller.ts:196 | same:198 | REAL | svc.deleteDowntimeLog | |
| GET /erp/capacity | apps/api/src/modules/erp/erp-reports.controller.ts:204 | same:205 | REAL | svc.getCapacity | |
| GET /erp/capacity/load-analysis | apps/api/src/modules/erp/erp-reports.controller.ts:211 | same:212 | REAL | svc.capacityLoadAnalysis | |
| GET /erp/shift-calendars | apps/api/src/modules/erp/erp-reports.controller.ts:218 | same:219 | REAL | svc.listShiftCalendars | |
| POST /erp/shift-calendars | apps/api/src/modules/erp/erp-reports.controller.ts:226 | same:229 | REAL | svc.createShiftCalendar (INSERT) | |
| GET /erp/employee-work-centers | apps/api/src/modules/erp/erp-reports.controller.ts:235 | same:236 | REAL | svc.listEmployeeWorkCenters | |
| POST /erp/employee-work-centers | apps/api/src/modules/erp/erp-reports.controller.ts:243 | same:246 | REAL | svc.createEmployeeWorkCenter (INSERT) | |
| GET /erp/employee-work-centers/:id | apps/api/src/modules/erp/erp-reports.controller.ts:253 | same:254 | REAL | svc.getEmployeeWorkCenter | |
| PATCH /erp/employee-work-centers/:id | apps/api/src/modules/erp/erp-reports.controller.ts:266 | same:269 | REAL | svc.updateEmployeeWorkCenter | |
| DELETE /erp/employee-work-centers/:id | apps/api/src/modules/erp/erp-reports.controller.ts:277 | same:279 | REAL | svc.deleteEmployeeWorkCenter | |
| GET /erp/work-center-capacity | apps/api/src/modules/erp/erp-reports.controller.ts:285 | same:286 | REAL | svc.workCenterCapacity | |
| POST /erp/work-center-capacity | apps/api/src/modules/erp/erp-reports.controller.ts:293 | same:296 | REAL | svc.updateWorkCenterCapacity (no id → read-only list fallback) | |
| GET /erp/products | apps/api/src/modules/erp/erp-products.controller.ts:51 | same:52 | REAL | svc.listProducts | |
| GET /erp/products/:id | apps/api/src/modules/erp/erp-products.controller.ts:62 | same:63 | REAL | svc.getProduct | |
| POST /erp/products | apps/api/src/modules/erp/erp-products.controller.ts:72 | same:75 | REAL | svc.createProduct (INSERT) | |
| PUT /erp/products/:id | apps/api/src/modules/erp/erp-products.controller.ts:83 | same:86 | REAL | svc.updateProduct | |
| PATCH /erp/products/:id | apps/api/src/modules/erp/erp-products.controller.ts:96 | same:99 | REAL | svc.updateProduct (same as PUT) | |
| DELETE /erp/products/:id | apps/api/src/modules/erp/erp-products.controller.ts:107 | same:109 | REAL | svc.deleteProduct | |
| GET /erp/bom-headers | apps/api/src/modules/erp/erp-products.controller.ts:115 | same:116 | REAL | svc.listBomHeaders | |
| GET /erp/bom-headers/:id | apps/api/src/modules/erp/erp-products.controller.ts:126 | same:127 | REAL | svc.getBomHeader | |
| GET /erp/bom-headers/:bomId/explosion | apps/api/src/modules/erp/erp-products.controller.ts:135 | same:136 | REAL | svc.bomExplosion | |
| GET /erp/bom-items | apps/api/src/modules/erp/erp-products.controller.ts:145 | same:146 | REAL | svc.listBomItems | |
| POST /erp/bom-headers | apps/api/src/modules/erp/erp-products.controller.ts:153 | same:156 | REAL | svc.createBomHeader (INSERT) | |
| DELETE /erp/bom-headers/:id | apps/api/src/modules/erp/erp-products.controller.ts:164 | same:166 | REAL | svc.deleteBomHeader | |
| POST /erp/bom-items | apps/api/src/modules/erp/erp-products.controller.ts:173 | same:176 | REAL | svc.createBomItem (INSERT) | |
| PUT /erp/bom-items/:id | apps/api/src/modules/erp/erp-products.controller.ts:184 | same:187 | REAL | svc.updateBomItem | |
| DELETE /erp/bom-items/:id | apps/api/src/modules/erp/erp-products.controller.ts:195 | same:197 | REAL | svc.deleteBomItem | |
| GET /erp/routings | apps/api/src/modules/erp/erp-products.controller.ts:209 | same:210 | REAL | svc.listRoutings (reads canonical PP `routings`) | DEPRECATED read; still used by SD wizard |
| GET /erp/routings/:id | apps/api/src/modules/erp/erp-products.controller.ts:226 | same:227 | REAL | svc.getRouting (reads `routings`) | DEPRECATED read |
| GET /erp/routing-operations | apps/api/src/modules/erp/erp-products.controller.ts:241 | erp.repository.ts:111 | REAL | inline SQL SELECT routing_operations JOIN work_centers | DEPRECATED read |
| POST /erp/routings | apps/api/src/modules/erp/erp-products.controller.ts:255 | erp.repository.ts:169 | 501-STUB | repo.createRouting returns Err('NOT_IMPLEMENTED') | intentionally blocked (two-world write); use PP routing |
| DELETE /erp/routings/:id | apps/api/src/modules/erp/erp-products.controller.ts:271 | erp.repository.ts:177 | 501-STUB | repo.deleteRouting returns Err('NOT_IMPLEMENTED') | blocked; use PP |
| POST /erp/routing-operations | apps/api/src/modules/erp/erp-products.controller.ts:286 | erp.repository.ts:185 | 501-STUB | repo.createRoutingOperation returns Err('NOT_IMPLEMENTED') | blocked; use PP |
| PUT /erp/routing-operations/:id | apps/api/src/modules/erp/erp-products.controller.ts:302 | erp.repository.ts:193 | 501-STUB | repo.updateRoutingOperation returns Err('NOT_IMPLEMENTED') | blocked; use PP |
| DELETE /erp/routing-operations/:id | apps/api/src/modules/erp/erp-products.controller.ts:318 | erp.repository.ts:201 | 501-STUB | repo.deleteRoutingOperation returns Err('NOT_IMPLEMENTED') | blocked; use PP |
| GET /erp/orders | apps/api/src/modules/erp/erp-orders.controller.ts:51 | same:52 | REAL | svc.listOrders | |
| GET /erp/orders/:id | apps/api/src/modules/erp/erp-orders.controller.ts:63 | same:64 | REAL | svc.getOrder | |
| POST /erp/orders | apps/api/src/modules/erp/erp-orders.controller.ts:73 | same:76 | REAL | svc.createOrder (INSERT) | |
| PUT /erp/orders/:id | apps/api/src/modules/erp/erp-orders.controller.ts:84 | same:87 | REAL | svc.updateOrder | |
| PATCH /erp/orders/:id | apps/api/src/modules/erp/erp-orders.controller.ts:95 | same:98 | REAL | svc.updateOrder (same as PUT) | |
| DELETE /erp/orders/:id | apps/api/src/modules/erp/erp-orders.controller.ts:106 | same:108 | REAL | svc.deleteOrder | |
| GET /erp/work-centers | apps/api/src/modules/erp/erp-orders.controller.ts:114 | same:115 | REAL | svc.listWorkCenters | |
| GET /erp/work-centers/:id | apps/api/src/modules/erp/erp-orders.controller.ts:125 | same:126 | REAL | svc.getWorkCenter | |
| POST /erp/work-centers | apps/api/src/modules/erp/erp-orders.controller.ts:135 | same:138 | REAL | svc.createWorkCenter (INSERT) | |
| PUT /erp/work-centers/:id | apps/api/src/modules/erp/erp-orders.controller.ts:146 | same:149 | REAL | svc.updateWorkCenter | |
| PATCH /erp/work-centers/:id | apps/api/src/modules/erp/erp-orders.controller.ts:157 | same:160 | REAL | svc.updateWorkCenter (same as PUT) | |
| DELETE /erp/work-centers/:id | apps/api/src/modules/erp/erp-orders.controller.ts:168 | same:170 | REAL | svc.deleteWorkCenter | |
| GET /erp/work-centers/:id/stats | apps/api/src/modules/erp/erp-orders.controller.ts:176 | same:177 | REAL | svc.getWorkCenterStats | |
| GET /erp/mrp-runs | apps/api/src/modules/erp/erp-orders.controller.ts:192 | same:193 | REAL | svc.listMrpRuns (reads erp_mrp_runs) | DEPRECATED read; legacy table |
| POST /erp/mrp-runs | apps/api/src/modules/erp/erp-orders.controller.ts:208 | erp-extra.repository.ts:99 | 501-STUB | repo.createMrpRun returns Err('NOT_IMPLEMENTED') | blocked (fake MRP); use PP MRP |
| POST /erp/mrp-runs/:runId/calculate | apps/api/src/modules/erp/erp-orders.controller.ts:224 | erp-extra.repository.ts:113 | 501-STUB | repo.calculateMrpRun returns Err('NOT_IMPLEMENTED') | blocked (was status-flip only); use PP MRP |
| GET /erp/mrp-results | apps/api/src/modules/erp/erp-orders.controller.ts:238 | same:239 | REAL | svc.listMrpResults (reads erp_mrp_results) | DEPRECATED read; table has no writer → always empty |
| GET /erp/purchase-requisitions | apps/api/src/modules/erp/erp-orders.controller.ts:251 | same:252 | REAL | svc.listPurchaseRequisitions (reads mm_purchase_requisitions) | rewired Q-46 to real MM table |
| GET /erp/dashboard-stats | apps/api/src/modules/erp/erp-orders.controller.ts:261 | same:262 | REAL | svc.listDashboardStats | |


---

## Integration + Chat + Ecommerce + General

Scope: `modules/integration`, `modules/chat`, `modules/ecommerce`, `modules/general`. 20 controller files (admin-auth has 0 routes). All repos/services trace to real Drizzle/`sql` DB access (integration-employee.repo 18 calls, integration-extended-mro.repo 30, integration-extended-hr.repo 13, integration-mro.repo 15, sap.repository 12, ecommerce.repository 20, ecommerce-catalog.helper 13, website.repository 18, legacy-warehouse/attendance/iot helpers 40). No `notImplemented`, no `Math.random`, no `{ ok: true }` stubs found across the four folders. HIGH-RISK sync surfaces (SAP) deep-traced: SAP is a real DB shim over `sales_orders`/`sap_sales_orders`, NOT a green-lie.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| GET /api/integration/employee-complaints/:id | apps/api/src/modules/integration/integration-employee.controller.ts:50 | same:51 | REAL | svc.getEmployeeComplaints → integration-employee.service.ts:16 → repo.findEmployeeComplaints (repo has 18 db calls) | fallback `{complaints:[]}` on !ok |
| GET /api/integration/employee-assessment-skips/:id | integration/integration-employee.controller.ts:59 | same:60 | REAL | service.ts:24 → repo.findEmployeeAssessmentSkips | |
| GET /api/integration/swap-requests | integration/integration-employee.controller.ts:67 | same:68 | REAL | service.ts:30 → repo.findSwapRequests | |
| GET /api/integration/skill-gap/:id | integration/integration-employee.controller.ts:79 | same:80 | REAL | service.ts:36 → repo.findSkillGap | |
| GET /api/integration/employee-mentorships/:id | integration/integration-employee.controller.ts:88 | same:89 | REAL | service.ts:42 → repo mentor/mentee | |
| GET /api/integration/employee-mes-summary/:id | integration/integration-employee.controller.ts:96 | same:97 | REAL | service.ts:53 → repo.findMesProduction | |
| GET /api/integration/employee-wms-summary/:id | integration/integration-employee.controller.ts:108 | same:109 | REAL | service.ts:62 → repo.findWmsTransactions | |
| GET /api/integration/employee-complaints | integration/integration-employee.controller.ts:116 | same:117 | REAL | service.ts:68 → repo.findAllComplaints | |
| GET /api/integration/employee-assessment-skips | integration/integration-employee.controller.ts:124 | same:125 | REAL | service.ts:73 → repo.findAllAssessmentSkips | |
| GET /api/integration/skill-gap | integration/integration-employee.controller.ts:132 | same:134 | REAL | inline db.execute SELECT employee_skill_scores | controller-level raw SQL |
| GET /api/integration/employee-mentorships | integration/integration-employee.controller.ts:146 | same:147 | REAL | service.ts:78 → repo.findAllMentorships | |
| GET /api/integration/employee-mes-summary | integration/integration-employee.controller.ts:154 | same:155 | REAL | service.ts:83 → repo.findAllMesProduction | |
| GET /api/integration/employee-wms-summary | integration/integration-employee.controller.ts:162 | same:163 | REAL | service.ts:90 → repo.findAllWmsTransactions | |
| GET /api/integration/expense | integration/integration-employee.controller.ts:170 | same:173 | REAL | inline SELECT expense_reports | |
| POST /api/integration/expense | integration/integration-employee.controller.ts:183 | same:190 | REAL | inline INSERT expense_reports RETURNING | Zod ExpenseSchema |
| GET /api/integration/invoice | integration/integration-employee.controller.ts:205 | same:208 | REAL | inline SELECT invoices | |
| POST /api/integration/invoice | integration/integration-employee.controller.ts:218 | same:229 | REAL | inline nextval('invoice_number_seq') + INSERT invoices RETURNING | |
| GET /api/integration/equipment | integration/integration-extended.controller.ts:42 | same:44 | REAL | repo.findFlatEquipment (integration-extended-mro.repo.ts) | |
| POST /api/integration/equipment | integration/integration-extended.controller.ts:52 | same:56 | REAL | repo.insertFlatEquipment | Zod CreateEquipmentSchema |
| GET /api/integration/requests | integration/integration-extended.controller.ts:66 | same:68 | REAL | repo.findFlatRequests | overlaps integration/mro/requests (diff prefix+repo) |
| POST /api/integration/requests | integration/integration-extended.controller.ts:76 | same:80 | REAL | repo.insertFlatRequest | |
| GET /api/integration/items | integration/integration-extended.controller.ts:90 | same:92 | REAL | repo.findFlatItems | overlaps integration/mro/items |
| POST /api/integration/items | integration/integration-extended.controller.ts:100 | same:104 | REAL | repo.insertFlatItem | |
| GET /api/integration/stats | integration/integration-extended.controller.ts:115 | same:117 | REAL | repo.getFlatStats | overlaps integration/mro/stats |
| GET /api/integration/mro | integration/integration-extended.controller.ts:124 | same:126 | REAL | repo.getMroOverview | |
| GET /api/integration/shifts | integration/integration-extended.controller.ts:133 | same:135 | REAL | repo.findShifts | |
| GET /api/integration/expense/expense-requests/all | integration/integration-extended.controller.ts:142 | same:144 | REAL | repo.findExpenseRequests(undefined) | |
| GET /api/integration/expense/expense-requests | integration/integration-extended.controller.ts:151 | same:153 | REAL | repo.findExpenseRequests(status) | |
| POST /api/integration/expense/expense-requests | integration/integration-extended.controller.ts:162 | same:166 | REAL | repo.insertExpenseRequest | Zod CreateExpenseRequestSchema |
| GET /api/integration/expense/expense-stats | integration/integration-extended.controller.ts:176 | same:178 | REAL | repo.getExpenseStats (reshaped in controller) | |
| GET /api/integration/expense/advance-payments | integration/integration-extended.controller.ts:194 | same:196 | REAL | repo.findAdvancePayments | |
| PUT /api/integration/expense-requests/:id/approve | integration/integration-extended.controller.ts:205 | same:208 | REAL | repo.approveExpenseRequest | Zod ApproveActionSchema |
| GET /api/integration/gl/stock-gl-postings | integration/integration-extended.controller.ts:215 | same:217 | REAL | repo.findGlPostings | |
| GET /api/integration/gl/stock-gl-postings/stats | integration/integration-extended.controller.ts:224 | same:226 | REAL | repo.getGlPostingStats | |
| GET /api/integration/gl/gl-account-mapping | integration/integration-extended.controller.ts:233 | same:235 | REAL | repo.findGlAccountMapping | |
| GET /api/integration/invoice/vendor-invoices | integration/integration-extended.controller.ts:242 | same:244 | REAL | repo.findVendorInvoices | |
| GET /api/integration/invoice/three-way-match/stats | integration/integration-extended.controller.ts:251 | same:253 | REAL | repo.getThreeWayMatchStats | |
| GET /api/integration/invoice/three-way-match/results | integration/integration-extended.controller.ts:260 | same:262 | REAL | repo.findThreeWayMatchResults | |
| POST /api/integration/invoice/three-way-match/:invoiceId | integration/integration-extended.controller.ts:271 | same:275 | REAL | repo.performThreeWayMatch | Zod InvoiceMatchSchema |
| GET /api/integration/hr-lms/position-skills | integration/integration-extended-hr.controller.ts:37 | same:39 | REAL | repo.findHrLmsPositionSkills (integration-extended-hr.repo.ts) | |
| GET /api/integration/hr-lms/employee-skills | integration/integration-extended-hr.controller.ts:46 | same:48 | REAL | repo.findHrLmsEmployeeSkills | |
| GET /api/integration/hr-lms/expiring-certifications | integration/integration-extended-hr.controller.ts:55 | same:57 | REAL | repo.findHrLmsExpiringCertifications | |
| GET /api/integration/hr-lms/stats | integration/integration-extended-hr.controller.ts:64 | same:66 | REAL | repo.getHrLmsStats | |
| GET /api/integration/employee-rating/ratings/:year/:month | integration/integration-extended-hr.controller.ts:73 | same:75 | REAL | repo.findEmployeeRatings(y,m) | |
| GET /api/integration/employee-rating/ratings | integration/integration-extended-hr.controller.ts:85 | same:91 | REAL | repo.findEmployeeRatings + snake→camel map | |
| GET /api/integration/employee-rating/goals | integration/integration-extended-hr.controller.ts:117 | same:120 | REAL | repo.findEmployeeRatingGoals | |
| GET /api/integration/employee-rating/stats | integration/integration-extended-hr.controller.ts:136 | same:139 | REAL | repo.getEmployeeRatingStats | |
| GET /api/integration/vendor-performance | integration/integration-extended-hr.controller.ts:153 | same:156 | REAL | repo.findVendorPerformance | |
| GET /api/integration/vendor-performance/spend-analysis | integration/integration-extended-hr.controller.ts:173 | same:175 | REAL | repo.findVendorSpendAnalysis | |
| GET /api/integration/pm-upcoming | integration/integration-extended-hr.controller.ts:182 | same:184 | DUPLICATE | mroRepo.findPmUpcoming — code comment "alias" | counterpart: GET /api/integration/mro/pm-upcoming (same repo call) |
| GET /api/integration/mro/pm-upcoming | integration/integration-extended-hr.controller.ts:199 | same:201 | REAL | IntegrationMroPmController → repo.findPmUpcoming | canonical of the alias above |
| GET /api/integration/mro/items | integration/integration-mro.controller.ts:43 | same:44 | REAL | svc.getItems → integration-mro.service → integration-mro.repo.ts | overlaps /integration/items |
| POST /api/integration/mro/items | integration/integration-mro.controller.ts:52 | same:55 | REAL | svc.createItem | Zod CreateMroItemSchema |
| GET /api/integration/mro/requests | integration/integration-mro.controller.ts:62 | same:63 | REAL | svc.getRequests | overlaps /integration/requests |
| POST /api/integration/mro/requests | integration/integration-mro.controller.ts:71 | same:74 | REAL | svc.createRequest | |
| GET /api/integration/mro/equipment | integration/integration-mro.controller.ts:81 | same:82 | REAL | svc.getEquipment | overlaps /integration/equipment |
| GET /api/integration/mro/stats | integration/integration-mro.controller.ts:89 | same:90 | REAL | svc.getStats | overlaps /integration/stats |
| GET /api/integration/mro/budgets | integration/integration-mro.controller.ts:97 | same:98 | REAL | svc.getBudgets | |
| GET /api/integration/mro/cleaning-schedules | integration/integration-mro.controller.ts:105 | same:106 | REAL | svc.getCleaningSchedules | |
| GET /api/integration/mro/utility-readings | integration/integration-mro.controller.ts:113 | same:114 | REAL | svc.getUtilityReadings | |
| GET /api/integration/mro/facilities | integration/integration-mro.controller.ts:121 | same:122 | REAL | svc.getFacilities | |
| PATCH /api/integration/mro/:id/approve | integration/integration-mro.controller.ts:131 | same:132 | REAL | svc.approveRequest(id,'approve') | on !ok returns `{approved:false,error}` (200) — mild soft-fail |
| PUT /api/integration/requests/:id/approve | integration/integration-mro.controller.ts:150 | same:152 | DUPLICATE | IntegrationRequestsController → svc.approveRequest | counterpart: PATCH /integration/mro/:id/approve (same svc method) |
| GET /api/sap/sales-orders | integration/sap/sap.controller.ts:45 | same:46 | REAL | svc→sap.repository.ts:18 SELECT sap_sales_orders + fallback sales_orders | internal shim, not external SAP |
| GET /api/sap/sales-orders/:id | integration/sap/sap.controller.ts:61 | same:62 | REAL | repo.getSalesOrder (repo.ts:32) | |
| PUT /api/sap/sales-orders/:id | integration/sap/sap.controller.ts:74 | same:76 | REAL | repo.updateSalesOrder (repo.ts:41) UPDATE ... RETURNING | Zod SapUpdateSalesOrderSchema |
| POST /api/sap/sales-orders | integration/sap/sap.controller.ts:83 | same:85 | REAL | repo.createSalesOrder (repo.ts:50) INSERT sales_orders RETURNING | writes canonical sales_orders |
| PATCH /api/sap/sales-orders/:id | integration/sap/sap.controller.ts:94 | same:95 | DUPLICATE | repo.updateSalesOrder | counterpart: PUT /api/sap/sales-orders/:id (identical svc call) |
| DELETE /api/sap/sales-orders/:id | integration/sap/sap.controller.ts:103 | same:105 | REAL | repo.deleteSalesOrder (repo.ts:69) UPDATE overall_status='CANCELLED' | soft-delete |
| GET /api/chat | chat/chat.controller.ts:55 | same:56 | REAL | chatService.getRoomsForUser | |
| GET /api/chat/rooms | chat/chat.controller.ts:64 | same:65 | REAL | getOrCreateDepartmentRooms + getRoomsForUser | |
| POST /api/chat/rooms/direct | chat/chat.controller.ts:73 | same:75 | REAL | getOrCreateDirectRoom | Zod ChatStartDirectSchema |
| POST /api/chat/rooms/group | chat/chat.controller.ts:85 | same:87 | REAL | createGroupRoom | |
| GET /api/chat/rooms/:roomId/messages | chat/chat.controller.ts:96 | same:97 | REAL | chatService.getMessages | |
| POST /api/chat/rooms/:roomId/messages | chat/chat.controller.ts:109 | same:111 | REAL | chatService.sendMessage | Zod ChatSendMessageSchema |
| POST /api/chat/rooms/:roomId/read | chat/chat.controller.ts:127 | same:129 | REAL | markRoomAsRead | 204 |
| GET /api/chat/rooms/:roomId/members | chat/chat.controller.ts:138 | same:139 | REAL | getRoomMembers | |
| GET /api/chat/employees | chat/chat.controller.ts:149 | same:150 | REAL | getAllEmployees | |
| GET /api/chat/birthdays/today | chat/chat.controller.ts:156 | same:157 | REAL | getTodayBirthdays | |
| GET /api/chat/unread | chat/chat.controller.ts:163 | same:164 | REAL | getTotalUnreadCount | |
| GET /api/chat/rooms/:roomId | chat/chat.controller.ts:171 | same:172 | REAL | getRoomsForUser + find | |
| GET /api/chat/rooms/:roomId/pinned-messages | chat/chat.controller.ts:183 | same:184 | REAL | getPinnedMessage | overlaps chat-advanced GET hr-v2/chat/rooms/:roomId/pinned |
| GET /api/chat/rooms/:roomId/files | chat/chat.controller.ts:195 | same:196 | REAL | getSharedFiles | |
| GET /api/chat/rooms/:roomId/mute | chat/chat.controller.ts:207 | same:208 | REAL | getRoomMembers→isMuted | |
| GET /api/chat/presence | chat/chat.controller.ts:220 | same:221 | REAL | getOnlineUsers | |
| PATCH /api/chat/rooms/:roomId | chat/chat.controller.ts:227 | same:229 | REAL | inline UPDATE chat_rooms RETURNING | |
| POST /api/chat/rooms/:roomId/mute | chat/chat.controller.ts:252 | same:254 | REAL | toggleMemberMute | Zod ChatMuteRoomSchema |
| GET /api/hr-v2/chat/rooms/:roomId/pinned | chat/chat-advanced.controller.ts:49 | same:50 | REAL | getPinnedMessage | |
| POST /api/hr-v2/chat/messages/:id/reactions | chat/chat-advanced.controller.ts:69 | same:71 | REAL | toggleReaction + gateway emit | overlaps chat-reactions reaction route (diff prefix) |
| PATCH /api/hr-v2/chat/messages/:id/pin | chat/chat-advanced.controller.ts:93 | same:95 | REAL | pinMessage + gateway emit | overlaps chat-ext POST chat/messages/:id/pin |
| POST /api/hr-v2/chat/polls | chat/chat-advanced.controller.ts:120 | same:122 | REAL | createPoll + gateway emit | overlaps chat-reactions POST chat/rooms/:roomId/polls |
| POST /api/hr-v2/chat/polls/:pollId/vote | chat/chat-advanced.controller.ts:161 | same:163 | REAL | votePoll | |
| GET /api/chat/notifications | chat/chat-ext.controller.ts:45 | same:46 | REAL | chatNotifSvc.getNotifications | |
| POST /api/chat/notifications/read-all | chat/chat-ext.controller.ts:55 | same:57 | REAL | chatNotifSvc.markAllRead | |
| PATCH /api/chat/notifications/read-all | chat/chat-ext.controller.ts:66 | same:68 | DUPLICATE | chatNotifSvc.markAllRead | counterpart: POST /api/chat/notifications/read-all (identical) |
| PATCH /api/chat/notifications/:id/read | chat/chat-ext.controller.ts:78 | same:80 | REAL | chatNotifSvc.markOneRead | |
| GET /api/chat/search | chat/chat-ext.controller.ts:88 | same:89 | REAL | chatNotifSvc.searchMessages | |
| GET /api/chat/message-tasks | chat/chat-ext.controller.ts:97 | same:98 | REAL | chatNotifSvc.getMessageTasks | |
| POST /api/chat/message-tasks | chat/chat-ext.controller.ts:107 | same:109 | REAL | chatNotifSvc.createMessageTask | |
| POST /api/chat/context-room | chat/chat-ext.controller.ts:122 | same:124 | REAL | chatNotifSvc.getOrCreateContextRoom | |
| GET /api/chat/admin/rooms | chat/chat-ext.controller.ts:133 | same:135 | REAL | chatAdminSvc.getAdminRooms | |
| GET /api/chat/admin/rooms/:roomId/members | chat/chat-ext.controller.ts:144 | same:146 | REAL | chatAdminSvc.getRoomMembers | |
| POST /api/chat/admin/rooms/:roomId/archive | chat/chat-ext.controller.ts:156 | same:159 | REAL | chatAdminSvc.archiveRoom | |
| DELETE /api/chat/admin/rooms/:roomId/members/:userId | chat/chat-ext.controller.ts:169 | same:172 | REAL | chatAdminSvc.removeMember | |
| PATCH /api/chat/admin/rooms/:roomId/members/:userId/role | chat/chat-ext.controller.ts:182 | same:185 | REAL | chatAdminSvc.updateMemberRole | |
| GET /api/chat/admin/audit-logs | chat/chat-ext.controller.ts:194 | same:196 | REAL | chatAdminSvc.getAuditLogs | |
| PATCH /api/chat/admin/rooms/:roomId/archive | chat/chat-ext.controller.ts:207 | same:210 | DUPLICATE | chatAdminSvc.archiveRoom | counterpart: POST /api/chat/admin/rooms/:roomId/archive (self-declared alias) |
| DELETE /api/chat/messages/:id/pin | chat/chat-ext.controller.ts:218 | same:220 | REAL | chatService.pinMessage(...,false) | |
| POST /api/chat/messages/:id/pin | chat/chat-ext.controller.ts:231 | same:233 | REAL | chatService.pinMessage | |
| GET /api/chat/starred-messages | chat/chat-ext.controller.ts:245 | same:246 | REAL | chatMessageSvc.getStarredMessages | |
| POST /api/chat/messages/:id/star | chat/chat-ext.controller.ts:255 | same:257 | REAL | chatMessageSvc.starMessage | |
| GET /api/chat/admin/rooms/:roomId/members/:userId | chat/chat-ext.controller.ts:269 | same:271 | REAL | chatAdminSvc.getRoomMembers + find | |
| PATCH /api/chat/rooms/:roomId/messages/:msgId | chat/chat-reactions.controller.ts:48 | same:50 | REAL | chatService.editMessage | Zod ChatEditMessageSchema |
| DELETE /api/chat/rooms/:roomId/messages/:msgId | chat/chat-reactions.controller.ts:62 | same:64 | REAL | chatService.deleteMessage | 204 |
| POST /api/chat/rooms/:roomId/messages/:msgId/reactions | chat/chat-reactions.controller.ts:75 | same:77 | REAL | toggleReaction + gateway emit | |
| DELETE /api/chat/rooms/:roomId/messages/:msgId/reactions/:emoji | chat/chat-reactions.controller.ts:92 | same:94 | REAL | chatService.removeReaction | |
| POST /api/chat/rooms/:roomId/polls | chat/chat-reactions.controller.ts:108 | same:110 | REAL | chatService.createPoll | |
| POST /api/chat/polls/:pollId/vote | chat/chat-reactions.controller.ts:126 | same:128 | REAL | chatService.votePoll | |
| POST /api/chat/push/subscribe | chat/chat-uploads.controller.ts:87 | same:89 | REAL | pushService.register | Zod RegisterPushSchema |
| DELETE /api/chat/push/unsubscribe | chat/chat-uploads.controller.ts:109 | same:111 | REAL | pushService.unregister | |
| POST /api/chat/upload/request-url | chat/chat-uploads.controller.ts:120 | same:122 | REAL | uploadService.requestUrl | |
| POST /api/chat/upload/complete | chat/chat-uploads.controller.ts:148 | same:150 | REAL | chatService.sendMessage + gateway emit | |
| POST /api/chat/video/token | chat/chat-uploads.controller.ts:172 | same:174 | REAL | videoToken.generate + fire-and-forget INSERT chat_video_calls | |
| GET /api/hr-v2/chat/messages/:id/thread | chat/chat-advanced-uploads.controller.ts:48 | same:49 | REAL | chatService.getThreadMessages | |
| POST /api/hr-v2/chat/messages/:id/thread | chat/chat-advanced-uploads.controller.ts:56 | same:58 | REAL | chatService.sendThreadMessage + gateway emit | |
| POST /api/hr-v2/chat/messages/:id/forward | chat/chat-advanced-uploads.controller.ts:85 | same:87 | REAL | chatService.forwardMessage | |
| POST /api/hr-v2/chat/upload/request-url | chat/chat-advanced-uploads.controller.ts:117 | same:119 | DUPLICATE | ObjectStorage getObjectEntityUploadURL | counterpart: POST /api/chat/upload/request-url |
| POST /api/hr-v2/chat/upload/complete | chat/chat-advanced-uploads.controller.ts:146 | same:148 | DUPLICATE | chatService.uploadFileAndSendMessage | counterpart: POST /api/chat/upload/complete |
| GET /api/admin/products | ecommerce/ecommerce-catalog.controller.ts:32 | same:34 | REAL | svc.listProducts → ecommerce-catalog.helper.ts (13 db calls) | |
| GET /api/admin/products/:id | ecommerce/ecommerce-catalog.controller.ts:41 | same:43 | REAL | svc.getProduct | |
| POST /api/admin/products | ecommerce/ecommerce-catalog.controller.ts:50 | same:53 | REAL | svc.createProduct | Zod EcommerceBodySchema |
| PUT /api/admin/products/:id | ecommerce/ecommerce-catalog.controller.ts:61 | same:64 | REAL | svc.updateProduct | |
| DELETE /api/admin/products/:id | ecommerce/ecommerce-catalog.controller.ts:71 | same:73 | REAL | throws 403 FORBIDDEN by design | intentional "delete disabled" (audit compliance), not a stub |
| GET /api/admin/categories | ecommerce/ecommerce-catalog.controller.ts:82 | same:84 | REAL | svc.listCategories | |
| GET /api/admin/categories/:id | ecommerce/ecommerce-catalog.controller.ts:91 | same:93 | REAL | svc.getCategoryById | |
| POST /api/admin/categories | ecommerce/ecommerce-catalog.controller.ts:100 | same:103 | REAL | svc.createCategory | |
| PUT /api/admin/categories/:id | ecommerce/ecommerce-catalog.controller.ts:111 | same:114 | REAL | svc.updateCategory | |
| DELETE /api/admin/categories/:id | ecommerce/ecommerce-catalog.controller.ts:122 | same:124 | REAL | checkCategoryEmpty then throws 403 | intentional delete-disabled |
| GET /api/admin/customers | ecommerce/ecommerce-customers.controller.ts:30 | same:32 | REAL | svc.listCustomers → ecommerce.repository.ts (20 db calls) | strips passwordHash |
| GET /api/admin/customers/:id | ecommerce/ecommerce-customers.controller.ts:39 | same:41 | REAL | svc.getCustomer + orders + stats | |
| PUT /api/admin/customers/:id | ecommerce/ecommerce-customers.controller.ts:49 | same:52 | REAL | svc.updateCustomer → repo.updateCustomer | |
| GET /api/admin/ecommerce/stats | ecommerce/ecommerce-customers.controller.ts:58 | same:60 | REAL | svc.getStats → repo.getStats | |
| GET /api/admin/customer-orders | ecommerce/ecommerce-orders.controller.ts:33 | same:35 | REAL | svc.listOrders → repo.listOrders | |
| GET /api/admin/customer-orders/:id | ecommerce/ecommerce-orders.controller.ts:42 | same:44 | REAL | svc.getOrder → repo.getOrder | |
| PUT /api/admin/customer-orders/:id/status | ecommerce/ecommerce-orders.controller.ts:52 | same:55 | REAL | svc.updateOrderStatus → repo.updateOrderStatus | validates status enums |
| PUT /api/admin/customer-orders/:id | ecommerce/ecommerce-orders.controller.ts:63 | same:66 | REAL | svc.updateOrder → repo.updateOrder | |
| DELETE /api/admin/customer-orders/:id | ecommerce/ecommerce-orders.controller.ts:73 | same:75 | REAL | throws 403 FORBIDDEN by design | intentional delete-disabled |
| GET /api/public/categories | ecommerce/ecommerce-public.controller.ts:31 | same:32 | REAL | svc.getPublicCategories | @Public |
| POST /api/public/orders | ecommerce/ecommerce-public.controller.ts:40 | same:42 | REAL | svc.createPublicOrderFromBody:151 INSERT order + eventBus.publish WebsiteOrderCreated | @Public; golden-thread CRM lead |
| GET /api/public/products/:slug | ecommerce/ecommerce-public.controller.ts:50 | same:51 | REAL | svc.getPublicProductBySlug | @Public |
| POST /api/public/contact | ecommerce/ecommerce-public.controller.ts:63 | same:65 | REAL | svc.emitWebsiteContact:221 eventBus.publish WebsiteContactSubmitted (→CRM lead listener) | returns `{ok:true}` but genuinely fires CQRS event, not a no-op |
| GET /api/website/settings | ecommerce/website/website.controller.ts:35 | same:36 | REAL | svc.getSettings → website.repository.ts (18 db calls) | @Public |
| PUT /api/website/settings/:key | ecommerce/website/website.controller.ts:44 | same:46 | REAL | svc.upsertSetting | Zod WebsiteUpsertSettingSchema |
| GET /api/website/pages | ecommerce/website/website.controller.ts:53 | same:54 | REAL | svc.listPages | @Public |
| POST /api/website/pages | ecommerce/website/website.controller.ts:61 | same:63 | REAL | svc.createPage | |
| PUT /api/website/pages/:id | ecommerce/website/website.controller.ts:71 | same:73 | REAL | svc.updatePage | |
| DELETE /api/website/pages/:id | ecommerce/website/website.controller.ts:80 | same:82 | REAL | throws 403 FORBIDDEN by design | intentional delete-disabled |
| GET /api/website/banners | ecommerce/website/website-media.controller.ts:36 | same:37 | REAL | svc.listBanners | @Public |
| POST /api/website/banners | ecommerce/website/website-media.controller.ts:44 | same:46 | REAL | svc.createBanner | |
| PUT /api/website/banners/:id | ecommerce/website/website-media.controller.ts:54 | same:56 | REAL | svc.updateBanner | |
| DELETE /api/website/banners/:id | ecommerce/website/website-media.controller.ts:63 | same:65 | REAL | throws 403 FORBIDDEN by design | intentional delete-disabled |
| GET /api/website/portfolio | ecommerce/website/website-media.controller.ts:75 | same:76 | REAL | svc.listPortfolio | @Public |
| POST /api/website/portfolio | ecommerce/website/website-media.controller.ts:83 | same:85 | REAL | svc.createPortfolioItem | |
| PUT /api/website/portfolio/:id | ecommerce/website/website-media.controller.ts:93 | same:95 | REAL | svc.updatePortfolioItem | |
| DELETE /api/website/portfolio/:id | ecommerce/website/website-media.controller.ts:102 | same:104 | REAL | throws 403 FORBIDDEN by design | intentional delete-disabled |
| GET /api/website/news | ecommerce/website/website-media.controller.ts:114 | same:115 | REAL | svc.listNews | @Public |
| GET /api/face-embeddings | general/controllers/general-legacy-a.controller.ts:56 | same:57 | REAL | svc.getFaceEmbeddings → legacy-attendance.helpers | |
| DELETE /api/face-embeddings/:id | general/controllers/general-legacy-a.controller.ts:61 | same:64 | REAL | svc.deleteFaceEmbedding | JwtAuthGuard+Roles |
| GET /api/attendance | general/controllers/general-legacy-a.controller.ts:69 | same:70 | REAL | svc.getAttendance | |
| GET /api/attendance/user | general/controllers/general-legacy-a.controller.ts:74 | same:75 | REAL | svc.getMyAttendance | |
| GET /api/attendance/zone-logs | general/controllers/general-legacy-a.controller.ts:79 | same:80 | REAL | svc.getZoneLogs | |
| GET /api/attendance/stats | general/controllers/general-legacy-a.controller.ts:84 | same:85 | REAL | svc.getAttendanceStats | |
| GET /api/papka-orders | general/controllers/general-legacy-a.controller.ts:89 | same:90 | REAL | svc.getPapkaOrders → legacy-warehouse.helpers | |
| POST /api/papka-orders | general/controllers/general-legacy-a.controller.ts:97 | same:99 | REAL | svc.createPapkaOrder (no fake-id catch) | Zod schema |
| DELETE /api/papka-orders/:id | general/controllers/general-legacy-a.controller.ts:125 | same:126 | REAL | svc.updatePapkaOrder status=cancelled (soft) | A13: fake-success catch removed |
| PATCH /api/papka-orders/:id | general/controllers/general-legacy-a.controller.ts:133 | same:135 | REAL | svc.updatePapkaOrder | A12: echo-body catch removed |
| GET /api/machine-tasks | general/controllers/general-legacy-a.controller.ts:159 | same:160 | REAL | svc.getMachineTasks | |
| POST /api/machine-tasks | general/controllers/general-legacy-a.controller.ts:164 | same:166 | REAL | svc.createMachineTask | A10: fake-id catch removed |
| GET /api/planning/operations | general/controllers/general-legacy-a.controller.ts:180 | same:181 | REAL | svc.getPlanningOperations | |
| POST /api/planning/operations | general/controllers/general-legacy-a.controller.ts:185 | same:187 | REAL | svc.createPlanningOperation | A11: fake-id catch removed |
| POST /api/upload | general/controllers/general-legacy-a.controller.ts:201 | same:203 | REAL | writes multipart to uploads/lessons/<key> via fs | A4: was green-lie, now real disk write |
| POST /api/client-errors | general/controllers/general-legacy-a.controller.ts:224 | same:227 | GREEN-LIE | returns `{received:true}`, body param `_body` discarded — nothing logged/persisted | @Public; intentional discard but claims receipt without storing |
| GET /api/warehouse/stock | general/controllers/general-legacy-b.controller.ts:58 | same:59 | REAL | svc.getWarehouseStock → legacy-warehouse.helpers | |
| GET /api/warehouse/transfers | general/controllers/general-legacy-b.controller.ts:63 | same:64 | REAL | svc.getWarehouseTransfers | |
| GET /api/warehouse/lots | general/controllers/general-legacy-b.controller.ts:68 | same:69 | REAL | svc.getWarehouseLots | |
| GET /api/warehouse/internal-requests | general/controllers/general-legacy-b.controller.ts:73 | same:74 | REAL | svc.getWarehouseInternalRequests | |
| GET /api/warehouse/dashboard/warehouse-occupancy | general/controllers/general-legacy-b.controller.ts:80 | same:81 | REAL | svc.getWarehouseOccupancy | |
| GET /api/finance/salary-benchmark | general/controllers/general-legacy-b.controller.ts:86 | same:87 | REAL | svc.getSalaryBenchmark | |
| GET /api/progress/user | general/controllers/general-legacy-b.controller.ts:92 | same:94 | REAL | lmsRepo.findAllCourses/Enrollments + getCourseProgressForUserRaw | |
| GET /api/certificates/user | general/controllers/general-legacy-b.controller.ts:109 | same:110 | REAL | svc.getCertificatesUser | |
| GET /api/safety-violations/user | general/controllers/general-legacy-b.controller.ts:114 | same:115 | REAL | svc.getSafetyViolationsUser | |
| GET /api/abc-analysis/user | general/controllers/general-legacy-b.controller.ts:119 | same:125 | REAL | getAbcAnalysisForUserRaw (legacy-kpi.helpers) | try/catch returns grade 'C' fallback on error |
| GET /api/discipline/user | general/controllers/general-legacy-b.controller.ts:132 | same:133 | REAL | svc.getDisciplineUser | |
| GET /api/iot/dashboard/stats | general/controllers/general-legacy-b.controller.ts:138 | same:139 | REAL | iotSvc.getIotDashboardStats → legacy-iot.service (9 db calls) | |
| GET /api/iot/production-sessions | general/controllers/general-legacy-b.controller.ts:145 | same:146 | REAL | iotSvc.getIotProductionSessions | |
| GET /api/iot/downtime-events | general/controllers/general-legacy-b.controller.ts:150 | same:151 | REAL | iotSvc.getIotDowntimeEvents | |
| GET /api/iot/tablet/defect-reasons | general/controllers/general-legacy-b.controller.ts:155 | same:156 | REAL | iotSvc.getIotTabletDefectReasons | |
| GET /api/production/orders/report | general/controllers/general-legacy-b.controller.ts:161 | same:162 | REAL | iotSvc.getProductionOrdersReport | |
| GET /api/production/orders/report/excel | general/controllers/general-legacy-b.controller.ts:169 | same:170 | MOCK | returns hardcoded `{ready:false,url:null,reason:...}` — no XLSX generated | honest not-ready placeholder (transparent), no real export |
| GET /api/pp/production-orders | general/controllers/general-legacy-b.controller.ts:180 | same:181 | REAL | iotSvc.getPpProductionOrders | |
| GET /api/products | general/controllers/general-legacy-b.controller.ts:186 | same:187 | REAL | iotSvc.getProducts | |
| GET /api/technology-cards | general/controllers/general-legacy-b.controller.ts:192 | same:193 | REAL | iotSvc.getTechnologyCards | |
| POST /api/attendance | general/controllers/general-legacy-b.controller.ts:197 | same:199 | REAL | svc.createAttendance → insertAttendanceRecordRaw | Zod CreateAttendanceSchema |


---

## Security + Design + MRO + Admin + Aisha + Auth + Export + Storage + Core + Common + Bot-Gateway

Backend root prefix omitted from paths below; all paths are the effective route (global `/api` + `@Controller` prefix + method path). Files are repo-relative to `apps/api/src/`.

| Route (method + path) | Controller file:line | Handler file:line | Status | Evidence | Notes |
|---|---|---|---|---|---|
| **security.controller.ts — `@Controller('security')`** | | | | | |
| GET /security | modules/security/presentation/security.controller.ts:87 | :89 | REAL | queryBus `GetIncidentsQuery` → incident repo | super_admin/director |
| GET /security/:id | :110 | :112 | REAL | `incidentRepo.findById(id)` :113; 404 if missing | Fastify static routes take precedence over `:id` |
| POST /security/report | :121 | :123 | REAL | `commandBus.execute(ReportIncidentCommand)` :126 | creates incident |
| PATCH /security/:id | :138 | :140 | REAL | `commandBus.execute(UpdateIncidentCommand)` :143 | |
| PATCH /security/:id/resolve | :155 | :157 | REAL | `commandBus.execute(ResolveIncidentCommand)` :160 | |
| POST /security/visitors/:id/exit | :173 | :176 | REAL | `db.execute(UPDATE security_visitors …)` :177 | |
| GET /security/visitors | :183 | :185 | REAL | `db.execute(SELECT … security_visitors)` :186 | |
| GET /security/incidents | :192 | :194 | DUPLICATE | same `GetIncidentsQuery` as GET /security :200 | counterpart: getAll (GET /security) |
| GET /security/access-zones | :205 | :207 | REAL | `accessSvc.findAll(query)` :208 | |
| GET /security/attendance-records | :213 | :215 | REAL | `attendanceSvc.findAll(query)` :216 | |
| GET /security/daily-summary | :221 | :223 | REAL | `db.execute` aggregate over incidents/visitors/ppe :224 | |
| GET /security/fire-sensors | :241 | :243 | 501-STUB | `return notImplemented('GET /security/fire-sensors')` :243 | feature gated #FX-6 |
| GET /security/ppe-checks | :247 | :249 | REAL | `db.execute(SELECT … security_ppe_checks)` :251 | |
| GET /security/ppe-stats | :260 | :262 | REAL | `db.execute` FILTER aggregate :263 | |
| GET /security/ppe-violations | :287 | :289 | REAL | `db.execute(SELECT … WHERE NOT(...))` :291 | |
| PATCH /security/visitors/:id/exit | :304 | :307 | DUPLICATE | identical UPDATE to POST visitors/:id/exit :308 | counterpart: recordVisitorExit (POST) |
| POST /security/visitors | :314 | :317 | REAL | `db.execute(INSERT security_visitors)` :319 | Zod VisitorCreateSchema |
| POST /security/incidents | :334 | :337 | REAL | `db.execute(INSERT security_incidents)` :339 | overlaps POST /security/report (raw-SQL vs CQRS); kept REAL |
| POST /security/ppe-checks | :353 | :356 | REAL | `db.execute(INSERT security_ppe_checks)` :358 | |
| **raci.controller.ts — `@Controller('raci-crisis')`** | | | | | |
| GET /raci-crisis/tasks | modules/security/presentation/raci.controller.ts:51 | :52 | REAL | `svc.listTasks(status)` :53 | |
| POST /raci-crisis/tasks | :59 | :61 | REAL | `svc.createTask(...)` :67 | Zod pipe |
| GET /raci-crisis/tasks/:id/assignments | :80 | :81 | REAL | `svc.getTaskAssignments(id)` :82 | |
| POST /raci-crisis/assignments | :88 | :90 | REAL | `svc.createAssignment(...)` :95 | |
| DELETE /raci-crisis/assignments/:id | :102 | :103 | REAL | `svc.deleteAssignment(id)` :104 | |
| GET /raci-crisis/stages | :110 | :111 | REAL | `svc.getStages()` :112 | |
| GET /raci-crisis/crises | :117 | :118 | REAL | `svc.listCrises(status)` :119 | |
| GET /raci-crisis/assessments | :124 | :125 | REAL | `svc.listAssessments()` :126 | |
| POST /raci-crisis/assessments | :132 | :134 | REAL | `svc.createAssessment(...)` :140 | |
| **design.controller.ts — `@Controller('design')`** | | | | | |
| GET /design | modules/design/presentation/design.controller.ts:77 | :79 | REAL | queryBus `GetDesignOrdersQuery` :91 | |
| GET /design/:id | :100 | :102 | REAL | queryBus `GetDesignOrderQuery` :103 | |
| POST /design | :112 | :114 | REAL | commandBus `RequestDesignCommand` :123 | canonical design-create |
| PATCH /design/:id/status | :137 | :139 | REAL | commandBus `UpdateDesignStatusCommand` :149 | |
| GET /design/notifications | :159 | :161 | REAL | `db.execute(SELECT designOrderNotifications)` :162 | |
| GET /design/statistics | :169 | :171 | REAL | `designRepo.getStatistics()` :172 | |
| GET /design/tooling | :179 | :181 | REAL | `db.execute(SELECT design_tooling)` :182 | |
| GET /design/tooling/:id/wear-forecast | :189 | :191 | REAL | `db.execute(SELECT … design_tooling WHERE id)` :192 | |
| GET /design/orders/:id/messages | :208 | :210 | REAL | `db.execute(SELECT designOrderMessages)` :211 | |
| POST /design/orders | :219 | :221 | 501-STUB | `throw new NotImplementedException(...)` :229 | intentional; use POST /design instead. Fragmented create surface noted in code |
| POST /design/orders/:id/messages | :236 | :238 | REAL | `db.execute(INSERT designOrderMessages)` :240 | |
| **design-extended.controller.ts — `@Controller('design')` (2nd controller, same prefix)** | | | | | |
| GET /design/orders | modules/design/presentation/design-extended.controller.ts:33 | :36 | REAL | `svc.getOrdersList()` → repo `find*` | design-extended.repository.ts |
| GET /design/templates | :40 | :43 | REAL | repo `findTemplates` SELECT design_library_items :68 | |
| GET /design/dashboard/summary | :47 | :50 | REAL | repo `findDashboardSummary` groupBy design_orders :31 | |
| POST /design/generate | :54 | :57 | REAL | repo `generateDesigns` INSERT into designs :91 | was green-lie, now persists (comment :86) |
| PATCH /design/orders/:orderId/status | :62 | :65 | DUPLICATE | repo `updateOrderStatus` UPDATE design_orders :60 | counterpart: PATCH /design/:id/status (design.controller) |
| GET /design/orders/:orderId/revisions | :70 | :73 | REAL | repo `findOrderRevisions` SELECT design_order_revisions :41 | |
| PATCH /design/notifications/:id/read | :77 | :80 | REAL | repo `markNotificationRead` UPDATE :54 | |
| POST /design/:id/verify | :85 | :88 | REAL | repo `verifyDesign` — reads designs.status, deterministic score :102 | PLACEHOLDER scoring (no real QC/quality_score col; Math.random removed) |
| POST /design/:id/mockup | :93 | :96 | REAL | repo `generateMockup` — returns stored image_url :124 | GREEN-LIE-leaning: fabricates `/mockups/…png` URL when no image; no real 3D render |
| POST /design/:id/approve | :101 | :104 | REAL | repo `approveDesign` UPDATE designs status='approved' :137 | was echo, now persists |
| POST /design/:id/reject | :108 | :111 | REAL | repo `rejectDesign` UPDATE designs status='rejected' :147 | was echo, now persists |
| **mro.controller.ts — `@Controller('mro')`** | | | | | |
| GET /mro | modules/mro/presentation/mro.controller.ts:89 | :91 | REAL | queryBus `GetMaintenanceOrdersQuery` :105 | |
| GET /mro/:id | :114 | :116 | REAL | `maintenanceRepo.findById(id)` :117 | 404 guard |
| POST /mro/stop-machine | :125 | :127 | REAL | commandBus `StopMachineCommand` :131 | |
| PATCH /mro/:id/assign | :142 | :144 | REAL | commandBus `AssignMaintenanceCommand` :147 | |
| PATCH /mro/:id/complete | :159 | :161 | REAL | commandBus `CompleteMaintenanceCommand` :164 | |
| GET /mro/spare-parts | :175 | :177 | REAL | `maintenanceSvc.findSpareParts(search)` :178 | |
| GET /mro/canteen/stats | :183 | :185 | REAL | `maintenanceSvc.getCanteenStats()` :186 | |
| GET /mro/cleaning/schedules | :191 | :193 | REAL | `maintenanceSvc.findCleaningSchedules()` :194 | |
| GET /mro/facilities | :199 | :201 | REAL | `maintenanceSvc.findFacilities()` :202 | |
| GET /mro/pm/schedules | :207 | :209 | REAL | `maintenanceSvc.findPmSchedules()` :210 | |
| GET /mro/utility/readings | :215 | :217 | REAL | `maintenanceSvc.findUtilityReadings()` :218 | |
| GET /mro/equipment | :223 | :225 | REAL | `maintenanceSvc.findEquipment(query)` :226 | |
| POST /mro/equipment | :232 | :234 | REAL | `maintenanceSvc.createEquipment(dto)` :236 | |
| PATCH /mro/equipment/:id/status | :242 | :244 | REAL | `maintenanceSvc.updateEquipmentStatus(id,status)` :250 | |
| GET /mro/canteen/logs | :257 | :259 | REAL | `maintenanceSvc.listCanteenLogs(date)` :260 | |
| POST /mro/canteen/logs | :266 | :268 | REAL | `maintenanceSvc.createCanteenLog(dto)` :270 | |
| PATCH /mro/canteen/logs/:id | :276 | :278 | REAL | `maintenanceSvc.updateCanteenLog(id,dto)` :283 | |
| GET /mro/settings | :290 | :292 | REAL | `maintenanceSvc.getSettings()` :293 | |
| POST /mro/settings | :298 | :300 | REAL | `maintenanceSvc.saveSettings(dto)` :302 | bulk key-value |
| PATCH /mro/settings/:id | :307 | :309 | REAL | `maintenanceSvc.patchSetting(id,value)` :311 | |
| **admin-extra.controller.ts — `@Controller('admin')`** | | | | | |
| GET /admin/roles | modules/admin/presentation/controllers/admin-extra.controller.ts:27 | :29 | MOCK | `svc.getRoles()` returns hardcoded RoleDefinition[] (admin-extra.service.ts:36-42) | static role catalog, no DB query (roles table is code-const, not queried) |
| GET /admin/logs | :33 | :35 | REAL | `svc.getLogs(page,limit)` :39 | audit logs |
| GET /admin/audit | :42 | :44 | REAL | `svc.getAudit(table,page)` :45 | |
| GET /admin/audit-filtered | :48 | :50 | REAL | `svc.getLogsFiltered(...)` :60 | |
| GET /admin/audit-tables | :67 | :69 | REAL | `svc.getDistinctTables()` :70 | |
| GET /admin/system | :73 | :75 | REAL | `svc.getSystemStatus()` :76 | |
| GET /admin/system/alerts/:id | :79 | :81 | REAL | `svc.getAlertById(id)` :82 | |
| POST /admin/login | :85 | :87 | GREEN-LIE | returns 200 `{ message:'Use /api/auth/login', data:null }` :88; performs NO auth | compat stub — no-op; does not fake login success but returns 200 without action |
| **admin-cron-status.controller.ts — `@Controller('admin/cron-status')`** | | | | | |
| GET /admin/cron-status | modules/admin/presentation/controllers/admin-cron-status.controller.ts:30 | :34 | REAL | `cronStatusService.getAllStatuses()` + `getSummary()` :35 | in-memory cron tracker (live runtime state) |
| **admin-settings.controller.ts — `@Controller('admin/settings')`** | | | | | |
| GET /admin/settings | modules/admin/presentation/controllers/admin-settings.controller.ts:54 | :57 | REAL | `settingsRepo.getSettings()` :58 | defaults if none |
| PATCH /admin/settings | :77 | :81 | REAL | `updateSettingsHandler.execute(...)` :83 | |
| **admin-users.controller.ts — `@Controller('admin/users')`** | | | | | |
| POST /admin/users | modules/admin/presentation/controllers/admin-users.controller.ts:47 | :51 | REAL | `createUserHandler.execute(...)` :53 | |
| GET /admin/users | :70 | :73 | REAL | `listUsersHandler.execute(...)` :80 | |
| PATCH /admin/users/:id/role | :94 | :98 | REAL | `updateUserRoleHandler.execute(...)` :104 | |
| DELETE /admin/users/:id | :109 | :113 | REAL | `userRepo.softDelete(userId)` :116 | self-delete blocked |
| **admin-queue.controller.ts — `@Controller('admin/queues')`** | | | | | |
| GET /admin/queues/status | modules/admin/presentation/controllers/admin-queue.controller.ts:27 | :30 | REAL | `svc.getStatus()` :31 | |
| GET /admin/queues/failed | :34 | :37 | REAL | `svc.getAllFailed()` :38 | |
| GET /admin/queues/failed/:queue | :41 | :45 | REAL | `svc.getFailedByQueue(queue)` :46 | |
| POST /admin/queues/retry/:queue/:jobId | :49 | :54 | REAL | `svc.retryJob(queue,jobId)` :55 | |
| DELETE /admin/queues/failed/:id | :58 | :63 | REAL | `svc.deleteFailedJob(id)` :64 | returns svc result directly (not unwrapped) |
| **auth.controller.ts — `@Controller('auth')`** | | | | | |
| POST /auth/login | modules/auth/presentation/auth.controller.ts:88 | :92 | REAL | `loginHandler.execute(command)` :104 + sets httpOnly cookies | @Public |
| POST /auth/logout | :119 | :123 | REAL | `logoutHandler.execute(command)` :136; revokes access+refresh | |
| POST /auth/refresh | :154 | :158 | REAL | jwt verify(JWT_REFRESH_SECRET) :171 + sign + blacklist old :196 | @Public; rotation |
| **auth-account.controller.ts — `@Controller('auth')`** | | | | | |
| PATCH /auth/change-password | modules/auth/presentation/auth-account.controller.ts:44 | :48 | REAL | `changePasswordHandler.execute(...)` :55 | |
| POST /auth/verify-otp | :60 | :64 | REAL | `verifyOtpHandler.execute(...)` :67 | @Public |
| POST /auth/resend-otp | :71 | :75 | REAL | `resendOtpHandler.execute(...)` :77 | @Public |
| GET /auth/me | :81 | :84 | REAL | returns `@CurrentUser()` (JWT-resolved) :85 | |
| GET /auth/health | :88 | :92 | REAL | returns status/uptime/timestamp :93 | @Public, SkipThrottle |
| **me-permissions.controller.ts — `@Controller('auth/me')`** | | | | | |
| GET /auth/me/permissions | modules/auth/presentation/me-permissions.controller.ts:36 | :45 | REAL | `handler.execute({userId})` :46 (Redis-cached perms) | |
| **card-gate-precheck.controller.ts — `@Controller('auth/card-gate')`** | | | | | |
| GET /auth/card-gate/precheck | modules/auth/presentation/card-gate-precheck.controller.ts:75 | :86 | REAL | `precheck.summarize()` live blast-radius query :88 | admin/super_admin/director only; read-only |
| **voice.controller.ts — `@Controller('aisha/voice')`** | | | | | |
| POST /aisha/voice/transcribe | modules/aisha/presentation/controllers/voice.controller.ts:38 | :39 | REAL | `whisper.transcribe(buf,mime)` :44 (external STT) | multipart |
| POST /aisha/voice/synthesize | :52 | :53 | REAL | `eleven.synthesizeStream(text)` streams MP3 :58 | external TTS |
| **wake-config.controller.ts — `@Controller('aisha/wake')`** | | | | | |
| GET /aisha/wake/config | modules/aisha/presentation/controllers/wake-config.controller.ts:40 | :41 | REAL | returns Porcupine access key + ppn URL from config :42 | |
| PATCH /aisha/wake/sensitivity | :53 | :54 | GREEN-LIE | writes only in-memory `this.currentSensitivity` :60; NOT persisted | Q-43: "save" lost on restart, no DB/config write; director-only |
| **chat.controller.ts — `@Controller('aisha')`** | | | | | |
| POST /aisha/chat | modules/aisha/presentation/controllers/chat.controller.ts:135 | :136 | REAL | `conversation.runTurn(...)` persists turn/tools/approvals :145 | catch-swallow-return-success: on Claude error returns `success:true` stub reply :150-153 (logged); stub reply when no LLM key :121 |
| **aisha-history.controller.ts — `@Controller('aisha')`** | | | | | |
| GET /aisha/conversations | modules/aisha/presentation/controllers/aisha-history.controller.ts:63 | :64 | REAL | `history.listConversations(...)` :66 | |
| GET /aisha/conversations/:id | :73 | :74 | REAL | `history.getConversation(...)` :76 | uuid param |
| GET /aisha/approvals | :82 | :83 | REAL | `history.listApprovals(...)` :85 | HITL queue |
| POST /aisha/approvals/:id/approve | :92 | :93 | REAL | `history.approve(...)` runs real tool + UPDATE :95 | |
| POST /aisha/approvals/:id/reject | :102 | :103 | REAL | `history.reject(...)` UPDATE :105 | |
| **export.controller.ts — `@Controller('export')`** | | | | | |
| GET /export/employees/csv | modules/export/export.controller.ts:57 | :60 | REAL | `exportSvc.getEmployeesCsv()` :65 + audit log | |
| GET /export/attendance/csv | :71 | :74 | REAL | `exportSvc.getAttendanceCsv()` :79 | |
| GET /export/discipline/csv | :85 | :88 | REAL | `exportSvc.getDisciplineCsv()` :93 | |
| GET /export/hr-stats/pdf | :99 | :102 | REAL | `exportSvc.getHrStatsPdf()` :107 | |
| GET /export/hr-stats/excel | :113 | :116 | REAL | `exportSvc.getHrStatsExcel()` :121 | CSV Excel-compatible |
| **storage.controller.ts — `@Controller('storage')`** | | | | | |
| PUT /storage/upload | modules/storage/storage.controller.ts:126 | :128 | REAL | `fs.writeFileSync(safePath, body)` :172 | ext allowlist + traversal guard + 25MB cap |
| GET /storage/download/* | :199 | :200 | REAL | `fs.createReadStream` :245; role-gate + reason-log :235 | force-download, doc types need ?reason |
| GET /storage/* | :260 | :261 | REAL | `fs.createReadStream` :285; doc types role-gated :274 | inline serve; registered after download/* |
| **panels.controller.ts — `@Controller('core/panels')`** | | | | | |
| GET /core/panels/my | modules/core/presentation/panels.controller.ts:43 | :44 | REAL | queryBus `GetMyPanelQuery(user.id)` :46 | |
| POST /core/panels/my | :53 | :54 | REAL | commandBus `SavePanelCommand(user.id, dto)` :58 | |
| GET /core/panels/default | :64 | :65 | REAL | queryBus `GetMyPanelQuery('')` :67 | default panel via empty userId |
| **validate.controller.ts — `@Controller('validate')`** | | | | | |
| POST /validate/stir | modules/common/presentation/validate.controller.ts:31 | :34 | REAL | `validateStir(stir)` pure algorithm :36 | no DB — checksum validator |
| POST /validate/luhn | :39 | :42 | REAL | `validateLuhn(cardNumber)` pure algorithm :44 | no DB — Luhn validator |
| **bot-gateway.controller.ts — `@Controller('bot')`** | | | | | |
| POST /bot/:bot/webhook | modules/bot-gateway/bot-gateway.controller.ts:69 | :71 | REAL | `botSvc.handle(msg)` dispatch to 9 bot services :116 | @Public + TelegramAuthGuard; returns `{}` for unknown bot :77 (silent); handler errors logged not swallowed :116 |
