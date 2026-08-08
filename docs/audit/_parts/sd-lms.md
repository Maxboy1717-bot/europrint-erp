# Part: sd-lms — modules: sd, lms (static-only; backend down)

Scope: 22 controllers (11 sd + 11 lms files; lms files declare 14 controller classes due to
multi-controller files). Global prefix `/api`. 5 global guards → unauthenticated = 401 (FINE).
DB read-only proofs via `_audit/q.cjs`. Backend HTTP down (Q-44) → all statuses static-derived.

## Route inventory: total 117
- SD = 56 routes across 11 controllers
- LMS = 61 routes across 14 controller classes (11 files)
Per-method (all 117):
- GET  = 56
- POST = 31
- PATCH= 14
- PUT  = 11
- DELETE = 5

SD per-controller: customers 23, orders 9, quotations 21*, payments 8, leads 12, deliveries 3,
invoices 3, dashboard 3, contracts 2, order-departments 8, sales 11.
(*quotations controller `@Controller('sd')` hosts quotations+contracts+kpi+payments-aliases+orders-cancel)
LMS per-class: courses(CoursesController) 8, lms/courses 6, lms/enrollments 8, lms/certificates 5,
certificates(standalone) 6, lms-core 8, tests 5 + questions 5 + assignments 1, attempts 4,
lessons 6 + modules 4, micro-modules 4 + knowledge 1 + video-progress 2 + achievements 1 +
mentors 1 + progress 3, knowledge-base 7.

---

## 🔴 DECEPTIVE (green-lie / mock / fake-create)

1. GET /api/certificates/:id | 💀200-GREEN-LIE hardcoded literal, no DB read | lms-certificates-standalone.controller.ts:75-83 — returns `{ id, status:'unknown', issuedAt:null, expiresAt:null }`. Self-documented "typed placeholder ... until repo has findById". Never touches `certificates`. | DB: `certificates` table EXISTS (0 rows) — a real read was possible; this is a deliberate stub. | verdict: GREEN-LIE (detail view always fake).

No other green-lies found. Specifically dismissed:
- sd-customers.controller.ts `return {}` (lines 224/281/331/363, soft-delete/contact/doc/competitor DELETE) — NOT green-lie: `svc.softDelete`→`repo.softDelete` does real work (sd-customers.service.ts:37-39); empty body is documented LEGACY_NOOP (controller:216-218). FE ignores body.
- CLAUDE.md "sd-customers.controller.ts:111,152,184,204 return {}" flag is STALE — those line numbers are now list()/getById() enrich logic, not `return {}`.
- lms-core.controller.ts createSupportTicket (154-164) returns `{ ok:false }` only inside catch; happy path is a real `db.insert(lms_support_tickets).returning()` (table EXISTS) → real-create, not a lie.
- sd-contracts.controller.ts sign() returns `{ ok:false }` on catch/not-found but happy path is real `db.update(...).returning()` — acceptable (anti-pattern: 200 with ok:false instead of 404, but persists real data).

---

## ❌ 5xx (DB-proven)

All three micro-modules routes hit MISSING tables → repo/raw-SQL throws → 500.

1. GET /api/micro-modules | 500 | `SELECT ... FROM micro_modules mm LEFT JOIN courses` throws (relation missing); repo catch→Err→`unwrapOrInternal` 500 | drizzle-lms-misc.repo.ts:23 (svc lms-misc.service.ts:14; ctrl lms-misc.controller.ts:53) | DB: `to_regclass('public.micro_modules')` = NULL | fix-type: missing TABLE (create `micro_modules`).
2. POST /api/micro-modules | 500 | controller raw `INSERT INTO micro_modules (...)` → relation missing | lms-misc.controller.ts:91-104 | DB: `micro_modules` = NULL | fix-type: missing TABLE.
3. POST /api/micro-modules/:id/view  AND  PATCH /api/micro-modules/:id/view | 500 | `INSERT INTO micro_module_views ... ON CONFLICT ...` → relation missing | drizzle-lms-misc.repo.ts:30 (ctrl lms-misc.controller.ts:62,75) | DB: `to_regclass('public.micro_module_views')` = NULL | fix-type: missing TABLE (create `micro_module_views` with unique(micro_module_id,employee_id)).

(4 routes, 2 missing tables.) No column-drift or bad-SQL 500s found elsewhere in sd/lms.

---

## 🟠 404 / 501

404-B (missing-vision: handler/service exists but no HTTP route):
- POST /api/sd/deliveries | 404-B | DeliveriesController only has @Get / @Get(:id) / @Patch(:id/status); `DeliveriesService.create()` EXISTS (deliveries.service.ts:37) but is never wired to a @Post. | sd-deliveries.controller.ts (no @Post) | DB: `deliveries` table EXISTS. Re-derives the KNOWN claim = CONFIRMED 404-B.

404 (none A/D found). 501: none. No `notImplemented()` route bodies (import present but unused in
lms-misc.controller.ts:38 and lms-lessons.controller.ts:37 — dead imports, not routes).

GET /modules (LmsModulesController, lms-lessons.controller.ts:136) advertises 501 in @ApiResponse
but body calls `lmsMiscService.listModules`→`lms_modules` (EXISTS, 0 rows) → actually 200-EMPTY, not 501.
GET /video-progress likewise advertises 501 but reads `video_progress` (EXISTS) → 200-EMPTY.

---

## 🟡🔵🔴 400 / 401 / 403 (BUG ones + intentional counts)

No BUG-class found.
- 401 (FINE): all 117 routes sit behind global JwtAuthGuard + per-controller @UseGuards(JwtAuthGuard).
  Unauthenticated = 401 intentional.
- 403 (FINE): RBAC via @Roles on most write routes (SD_WRITE/ADMIN sets, LMS role sets). All look
  intentional; no misconfig (e.g. role string casing is consistent within each controller's own set).
  Note (non-blocking): SD controllers mix lowercase `'sales_manager'` and SCREAMING `Role.SALES_MANAGER`
  enum across files, and SdCustomers uses both `'SALES'` and `'sales_manager'` — works because @Roles
  arrays carry both forms; not a bug, just smell.
- 400 (FINE): Zod via @UsePipes(ZodValidationPipe) or inline `.parse()` on every @Body route — drift-free.

---

## ✅ FINE (grouped + counts + sample proofs)

200-REAL (real DB read/write), grouped:
- SD orders CQRS (9): POST /api/sd/orders = transactional insert (repo.save+saveItems+outbox in one
  db.transaction) — create-order.handler.ts:93-118. list/get/status/advance via QueryBus/CommandBus.
- SD customers (23): list/getById(enrich contacts+orders)/360/CRUD/contacts/interactions/documents/
  competitors/nps/complaints — all delegate to SdCustomersService→repo. DB: `sd_customers`=9 rows.
- SD quotations+contracts+kpi+price (21) → SdQuotationsService; DB `sd_quotations`=0 (200-EMPTY-FINE,
  build phase), `sd_price_formulas` EXISTS singleton.
- SD payments (8) → SdPaymentsService + one raw UPDATE sd_payments (table EXISTS, casts to ::uuid).
- SD leads (12) → SdLeadsService reads `leads` table (EXISTS, 0 rows) + `sd_lead_activities`.
- SD contracts (2), dashboard (3), invoices (3, CQRS), order-departments (8, Phase-4 fan-out), sales (11).
- LMS courses/lessons/modules/tests/questions/assignments/enrollments/certificates/attempts/exams/
  knowledge-base/achievements/mentors/progress — all delegate to services→repos over EXISTING tables
  (`courses`,`lessons`,`lms_modules`,`lms_tests`,`lms_enrollments`,`lms_certificates`,`certificates`,
  `lms_knowledge`,`video_progress`,`mentors`,`lms_achievements`,`course_progress`,`lms_support_tickets`).

200-EMPTY (e1 FINE — empty because build-phase DB, schema correct):
- Nearly all LMS list routes + SD quotations/leads/contracts/payments lists. DB proof: courses=0,
  lms_courses=0, certificates=0, lms_certificates=0, modules=0, lms_modules=0, course_progress=0,
  lms_enrollments=0, sd_quotations=0, sd_contracts=0, leads=0. Schema present → e1 FINE.

Sample DB proofs:
- `to_regclass` confirms EXISTS: deliveries, sd_payments, sd_contracts, sd_price_formulas,
  sd_order_departments, lms_support_tickets, modules, certificates, courses, course_progress,
  lessons, lms_lessons, video_progress, mentors, lms_knowledge, lms_modules.
- modules.deleted_at column EXISTS (deleteModule soft-delete valid).
- MISSING: micro_modules, micro_module_views.

---

## COUNTS (sum = 117)

- 💀 200-GREEN-LIE: 1   (GET /api/certificates/:id)
- ❌ 500 (missing table): 4   (micro-modules: GET list, POST create, POST :id/view, PATCH :id/view)
- 🟠 404-B (missing route, service exists): 1   (POST /api/sd/deliveries)
- ✅ 200-REAL / 200-EMPTY-e1-FINE: 111
- 🔵 401 (intentional, applies to all): not double-counted
- 🔴 403 / 🟡 400: all FINE (not double-counted)

Bucket breakdown of the 111 FINE: ~200-REAL writes/reads on populated/empty-but-valid tables.
SD = 55 FINE (1 deceptive carve-out: none in SD beyond the deliveries 404-B already counted).
LMS = 56 FINE (after removing 1 green-lie + 4 micro-module 500s from LMS's 61).
