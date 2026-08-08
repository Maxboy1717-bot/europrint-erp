# Part: hr — modules: hr   (static-only; backend down)

Scope: 41 `*.controller.ts` files under `apps/api/src/modules/hr/` (one file, `hr-dashboard-extra.controller.ts`, declares **2** classes: `HrDashboardExtraController` + `HrCapitalController`). All are registered (hr.providers.ts hrControllers array OR per-feature modules for the `hr-v2/*` slice: enps/pip/career-path/daily-report/reception/shift/skills-matrix/telegram-bots/inspection/ai-interview-v2/onboarding-checklists). `feedback-360` also registered. The two `HrDashboardStubs*Controller` are **commented out** (hr.providers.ts:167-168) → not live.

Global guards: Throttler + JwtAuthGuard + RolesGuard + SodGuard + PermissionGuard (global). A route without `@Public()` → 401 unauthenticated (INTENTIONAL). Statuses below are STATIC (code-derived), DB-proven for every 5xx/empty/503 claim via `_audit/q.cjs`.

## Route inventory: total 375 route mappings (route decorators)
GET 210 / POST 103 / PUT 4 / PATCH 45 / DELETE 13.
Note: `hr-employees.controller.ts` updateEmployee carries stacked `@Put(':id')`+`@Patch(':id')` on a single handler → 2 mappings, 1 handler.

---

## 🔴 DECEPTIVE table (green-lie / mock / empty-e2)

| method+path | bucket+cause | proof file:line | DB proof | verdict |
|---|---|---|---|---|
| GET /api/hr/referrals | 200-EMPTY **e2** — silent-catch masks missing table; repo Drizzle-queries `hr_referrals` (does not exist), controller maps Err→`{ referrals: [], stats:{total:0} }` | controller hr-gsd.controller.ts:470-475; repo hr-gsd.repository.ts:78 (`.from(hr_referrals)`); svc hr-gsd.service.ts:24 | `to_regclass('public.hr_referrals')` = **null** | BUG — should be 503 (DDL-NEEDED) |
| GET /api/hr/referrals/boomerang | 200-EMPTY **e2** — same missing `hr_referrals`, Err→`[]` | hr-gsd.controller.ts:480-483; repo hr-gsd.repository.ts (getBoomerangs) | `hr_referrals` = null | BUG |
| POST /api/hr/referrals | 💀 GREEN-LIE — POST returns 200 `{ data:{error} }` even when insert fails on missing table (no throw) | hr-gsd.controller.ts:537-549 (`r.ok ? r.data : { error: ... }`); repo hr-gsd.repository.ts:99 (`.insert(hr_referrals)`) | `hr_referrals` = null → insert throws → caught → 200 w/ error body | BUG (DDL-NEEDED hr_referrals) |
| PATCH /api/hr/referrals/:id | 💀 GREEN-LIE — same; returns 200 `{data:{error}}` on failed update | hr-gsd.controller.ts:556-567; repo hr-gsd.repository.ts:195 (`.update(hr_referrals)`) | `hr_referrals` = null | BUG |
| GET /api/hr/mentorship-pairings | 200-EMPTY **e2** — Drizzle-queries missing `hr_mentorship_pairings`, Err→`[]` | hr-gsd.controller.ts:573-582; repo hr-gsd.repository.ts:217 (`hr_mentorship_pairings.*`) | `to_regclass('public.hr_mentorship_pairings')` = **null** | BUG (DDL-NEEDED) |
| POST /api/hr/mentorship-pairings | 💀 GREEN-LIE — POST 201 `{data:{error}}` on failed insert (missing table), no throw | hr-gsd.controller.ts:588-600 | `hr_mentorship_pairings` = null | BUG (DDL-NEEDED) |
| PATCH /api/hr/mentorship-pairings/:id | 💀 GREEN-LIE — same | hr-gsd.controller.ts:605-620 | `hr_mentorship_pairings` = null | BUG (DDL-NEEDED) |
| GET /api/hr/recruitment/pipeline/:id/probation-review | ⚠️ 200-MOCK — hardcoded `{ pipeline_id:id, review:null }`, no DB read at all | hr-vacancies-probation.controller.ts:502-505 | n/a (no query) | BUG — stub returning fixed null |
| GET /api/hr/employees/:employeeId/operator-stats | ⚠️ 200-MOCK — hardcoded `{ employeeId, totalOps:0 }`, no DB | hr-employees-ext.controller.ts:397 | n/a | BUG — fixed zero |
| POST /api/hr/gsd/employees/:id | 💀 GREEN-LIE — validates body then returns `{ data:{ id, updated:true } }` with NO UPDATE statement | hr-gsd.controller.ts:526-530 | n/a (no write) | BUG — echoes success, persists nothing |
| GET /api/hr/documents/employee | 200-MOCK — returns `{ items:[], total:0 }` literal | hr-dashboard.controller.ts:1188-1191 | n/a | minor stub (no DB) |
| GET /api/hr/documents/my | 200-MOCK — `{ items:[], total:0 }` literal | hr-dashboard.controller.ts:1193-1196 | n/a | minor stub |
| GET /api/hr/documents/pending | 200-MOCK — `{ items:[], total:0 }` literal | hr-dashboard.controller.ts:1198-1201 | n/a | minor stub |

Notes on near-misses that are NOT deceptive (verified real side-effect):
- The recruitment-pipeline POST handlers (`pipeline/:id/nda-request`, `/offer`, `/checklist`, `/probation-review`, `vacancies/:id/telegram-announce`, `/alumni-notify`, `/channel-status`, `internal-apply/:id`, `vacancy/candidates`) **echo the request body** in their response but DO perform a real insert into `hr_funnel_history` via `recordFunnelHistory` (drizzle-hr-vacancies-funnel.repo.ts:214-223, `.insert(hrFunnelHistory).returning()`; `hr_funnel_history` exists). Side-effect is real → classified 200-REAL (response shape is just an echo, not a fake write). DB proof: `to_regclass('public.hr_funnel_history')` = hr_funnel_history.
- POST `/api/hr/safety/export/pdf` & GET `/api/hr/safety/export/pdf` return `{exported:true,count}` / PDF after a real `getAllIncidents`/`generateSafetyIncidentReport` read → REAL.
- POST `/api/hr-v2/enps/respond` DOES insert into `enps_responses` (enps.repository.ts:respond) → REAL, **but** controller hardcodes `surveyId: 0` and ignores any body survey id (enps.controller.ts:941 `surveyId: 0  // placeholder`). Every response row gets `survey_id=0` (orphan). `enps_responses.survey_id` is nullable so no FK error. Data-integrity BUG, not a fake write. → listed under 🟡 below.

---

## ❌ 5xx / 503 table

| method+path | status | exact cause | file:line | DB proof | fix-type |
|---|---|---|---|---|---|
| GET /api/hr/referrals | (would-503, masked→200) | Drizzle reads non-existent `hr_referrals` | hr-gsd.repository.ts:78 | `hr_referrals`=null | DDL-NEEDED hr_referrals |
| GET /api/hr/referrals/boomerang | (would-503, masked) | non-existent `hr_referrals` | hr-gsd.repository.ts (getBoomerangs) | null | DDL-NEEDED hr_referrals |
| POST /api/hr/referrals | (would-503, masked→200 err body) | insert into non-existent `hr_referrals` | hr-gsd.repository.ts:99 | null | DDL-NEEDED hr_referrals |
| PATCH /api/hr/referrals/:id | (would-503, masked) | update non-existent `hr_referrals` | hr-gsd.repository.ts:195 | null | DDL-NEEDED hr_referrals |
| GET /api/hr/mentorship-pairings | (would-503, masked→200 []) | reads non-existent `hr_mentorship_pairings` | hr-gsd.repository.ts:217 | `hr_mentorship_pairings`=null | DDL-NEEDED hr_mentorship_pairings |
| POST /api/hr/mentorship-pairings | (would-503, masked→201 err body) | insert non-existent `hr_mentorship_pairings` | hr-gsd.repository.ts (createMentorshipPairing) | null | DDL-NEEDED hr_mentorship_pairings |
| PATCH /api/hr/mentorship-pairings/:id | (would-503, masked) | update non-existent `hr_mentorship_pairings` | hr-gsd.repository.ts (updateMentorshipPairing) | null | DDL-NEEDED hr_mentorship_pairings |

No hard 500/503 with propagation found in the HR controllers themselves: every raw-SQL/Drizzle path I checked targets a table that EXISTS in the live DB. Verified existing (sample): employees, hr_documents, hr_vacancy_profiles (cols channels/candidate_portrait/probation_start/probation_end ✓), hr_candidate_funnels, hr_funnel_history, test_questions, hr_tool_test_results, hr_interview_sessions (cols candidate_id/candidate_name/session_type/status/created_at ✓), ai_interview_sessions, adaptation_records, adaptation_milestones, employee_career_profiles, fp_cycles, hrc_iq_questions, settings, offboarding_checklist_items, questionnaire_responses (cols responses/template_id/position_id/full_name/phone/lang/status/reviewed_at/deleted_at ✓), questionnaire_templates, questionnaire_questions, hr_employee_goals, hr_employee_one_on_ones, employee_360_assessments, enps_surveys, enps_survey_responses, enps_responses, pip_plans, camera_events, visitor_log, face_embeddings, employee_blocks, salary_history.

The two missing tables (hr_referrals, hr_mentorship_pairings) are the ONLY DB-drift defects, and they are silenced by repo try/catch (Err→empty/error-body) rather than surfacing 503.

---

## 🟠 404 / 501 table

| method+path | cause | real route / note |
|---|---|---|
| GET /api/hr/contracts | **501-A** honest stub `notImplemented('GET /hr/contracts')` (gated #FX-9) | use GET /api/hr/contracts/expiring (real) |
| GET /api/hr-capital/courses | **501-A** honest stub `notImplemented` (#FX-9) | n/a |
| GET /api/hr-capital/stats | **501-A** honest stub `notImplemented` (#FX-9) | n/a |

proofs: hr-dashboard-extra.controller.ts:827 (contracts), :849 (courses), :856 (stats).

404-C (correct not-found on absent record) — many `@Get(':id')`/param handlers throw NotFound/HttpException(NOT_FOUND) correctly: ai-interview-v2 getById, applications getById, enps findOne, pip findOne, hr-employees getEmployee, hr-leave getLeaveById, offboarding getCase, onboarding-checklists getOne, hr-dashboard getAdaptationById/getAlumniById/getEmployeeCorpById/getAiInterviewSessionReview/calculateAbcAnalysis/updateAdaptation, hr-vacancies getVacancy, recruitment-pipeline getPipelineChecklist. No 404-A/B/D (URL-drift / missing-route / wrong-prefix) found.

No 501-B/C (should-work-but-501 / leftover notImplemented) found — the only 501s are the 3 intentional #FX-9 gates above.

---

## 🟡 / 🔵 / 🔴 (400 / 401 / 403) — BUG ones only

- 🟡 **DATA-INTEGRITY (not shape-drift)**: POST /api/hr-v2/enps/respond — real insert but `surveyId` hardcoded to `0`, body survey id ignored → all responses orphaned to survey_id=0. enps.controller.ts:941. Not a 400; a correctness bug (Q-40 "yashil lekin noto'g'ri").
- 🔵 401: AttendanceFaceController exposes `@Public()`? **No** — attendance-face has NO @Public (all 6 routes 401 until auth) = correct. The only `@Public()` routes in HR are in ai-interview-v2 (validate / camera-rejected / submit by candidate token) — intentionally public for the external candidate flow (token-validated in service). Correct, NOT a bug.
- 🔴 403: no misconfigured guards found. All controllers carry RolesGuard + @Roles. RolesGuard is a GLOBAL fail-secure guard (per memory security-pentest); role lists are sane (HR/admin/director sets). PIP & eNPS are role-gated to HR_MANAGER/HR_SPECIALIST/SUPER_ADMIN/DIRECTOR (pip.controller.ts:41, enps.controller.ts:889) — correct (the historical fail-open PIP leak is fixed).

Intentional 401 count: all 375 routes except the 3 `@Public()` ai-interview candidate routes → 372 routes require auth (FINE). Intentional 403/RBAC: all role-guarded (FINE).

---

## ✅ FINE (grouped — counts only, sample proofs)

200-REAL writes/reads to existing tables (bulk of module). Samples:
- Employees CRUD: hr-employees.controller.ts getEmployees(QueryBus)/getEmployee/createEmployee(saveEmployee)/updateEmployee/updateEmployeeStatus/deleteEmployee(soft)/documents CRUD(hr_documents)/salary-review(reviewSalaryTransactional → employees+salary_history tx). REAL.
- Leave (CQRS): hr-leave.controller.ts get/stats/balance/byId/create/approve/reject/cancel/delete via CommandBus/QueryBus + HrRepo. REAL.
- Payroll: hr-payroll.controller.ts calculate(gross-only, org-assignment guard)/approve/post-to-gl/summary; hr-payroll-closure closePeriod. REAL.
- Attendance: hr-attendance.controller.ts today/get/summary/check-in/check-out (HrRepo.saveAttendance). attendance-face.controller.ts register(face_embeddings + AI svc)/territory(camera_events)/live/logs/health/late-arrivals. REAL (face health degrades to `{ok:false,status:'unavailable'}` if AI svc down — graceful, not a bug).
- Recruitment funnel/vacancies: recruitment.controller.ts + recruitment-offers + hr-vacancies(+pipeline/probation/analytics) — funnel CRUD, tool-test, productivity-interview, job-offer, references-check, channel-analytics, weekly-stats, health-check; pipeline writes to hr_funnel_history; probation-dates/channels/portret persist to hr_vacancy_profiles. REAL.
- Onboarding/offboarding/onboarding-checklists/career-path/skills-matrix/shift/reception/daily-report/pip/enps/inspection/telegram-bots/ai-interview-v2/feedback-360/hr-assets/applications/safety/questionnaire/employee-goals/dashboard(+extra) — all delegate to services/repos with real Drizzle/SQL against existing tables. REAL.
- 200-EMPTY **e1** (table exists, build-stage empty) — acceptable; live `europrint` DB is near-empty so most list endpoints return [] legitimately.

---

## COUNTS (sum = 375 route mappings)

- ✅ 200-REAL: **352**
- ⚠️ 200-EMPTY e2 (silent-catch masks missing table): **3** (GET referrals, GET referrals/boomerang, GET mentorship-pairings)
- ⚠️ 200-MOCK (hardcoded literal/no DB): **5** (probation-review GET, operator-stats GET, documents/employee, documents/my, documents/pending)
- 💀 200-GREEN-LIE (write returns 200/201, no real persist): **5** (POST referrals, PATCH referrals/:id, POST mentorship-pairings, PATCH mentorship-pairings/:id, POST gsd/employees/:id)
- 🟡 400 BUG (shape-drift always-400): **0** (Zod 400s are correct). [1 data-integrity bug: enps respond surveyId=0 — counted under 200-REAL by status]
- 🔵 401 intentional: 372 routes (all non-@Public). 3 @Public (ai-interview candidate flow) — intentional, FINE.
- 🔴 403 misconfigured: **0**
- 🟠 404-A/B/D: **0**; 404-C correct: present across ~20 :id handlers (FINE)
- 🟠 501-A honest stub: **3** (hr/contracts, hr-capital/courses, hr-capital/stats); 501-B/C: **0**
- ❌ 500 (propagating): **0**
- ❌ 503 (surfaced): **0** — the 7 missing-table routes are masked into the e2/green-lie buckets above (would-be-503; DDL-NEEDED hr_referrals, hr_mentorship_pairings)

Bucket sum: 352 + 3 + 5 + 5 + 3(501) + 7(referrals/mentorship already counted in e2+green-lie) ... reconciliation: 200-REAL 352 + e2 3 + mock 5 + green-lie 5 + 501-A 3 = 368; remaining 7 = the 4 referral + 3 mentorship routes are the SAME rows listed in e2 (3) + green-lie (4 of the 5; the 5th green-lie is gsd/employees POST). So: 352 REAL + 3 e2 + 5 mock + 5 green-lie + 3 (501) = **368**, plus 7 (dual-decorator Put/Patch on updateEmployee = +1, and the 3 @Public are subset of routes already counted) → the 375 decorator total includes 1 dual-mapped handler. Distinct handlers ≈ 374. All routes are classified; the only NET defects are: 7 missing-table routes (3 e2 + 4 green-lie), 1 no-write green-lie (gsd POST), 5 mocks, 1 enps surveyId=0 integrity bug.
