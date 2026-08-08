# Part: misc — modules: remaining,erp,general,auth,security,design,storage,org-structure,order-workflow,notifications,mro,logistics,export,core,common,bot-gateway (static-only; backend down)

Method: enumerated every route across 38 controllers; followed handler→service→repo; DB-proved every table/column touched by raw SQL and every 501/empty risk. Backend HTTP down (Q-44) — all statuses static.

## Route inventory: total ~243
- GET ~118, POST ~62, PATCH ~38, PUT ~8, DELETE ~17 (approx; per-controller tallies below)
- Per module: remaining 12 controllers ~95 routes; erp 4 ctrl ~70; general 3 ctrl ~30; auth 3 ctrl 9; security 2 ctrl ~22; design 2 ctrl ~22; storage 2; org-structure ~24; order-workflow 5; notifications 11; mro ~19; logistics 5; export 5; core/panels 3; common/validate 2; bot-gateway 1.

## 🔴 DECEPTIVE (200-MOCK / 200-GREEN-LIE)
1. POST /api/erp/work-center-capacity | 200-GREEN-LIE: returns literal `{message:'Work center capacity updated', updatedAt:...}`, writes NOTHING (body param is `_body`, unused) | erp/erp-reports.controller.ts:935 | n/a (no write) | verdict: green-lie create, no persistence
2. POST /api/design/:id/mockup | 200-MOCK: returns constructed URL `/mockups/${id}-${type}.png` that is never generated or saved | design-extended.repository.ts:121 (svc design-extended.service.ts:22) | designs table exists but nothing written | verdict: literal mock URL
3. GET /api/design/templates | 200-MOCK: 5 hardcoded literal templates (tmpl-001..005) | design-extended.repository.ts:69-75 | no DB read | verdict: hardcoded catalog
4. PATCH /api/logistics/:id/complete | 200-GREEN-LIE: emits DELIVERY_COMPLETED event but returns literal `{id, status:'completed'}` — NO repo/DB status update (unlike mro complete which runs a command) | logistics.controller.ts (completeDelivery, ~line 138) | no UPDATE issued | verdict: event-only, delivery row not marked completed
5. GET /api/system/cron-jobs (+/v2) | 200-MOCK: 17 hardcoded cron descriptors, not read from any scheduler/DB | system.service.ts:65-84 | n/a | verdict: static metadata list presented as live cron status

Borderline (NOT flagged deceptive — documented + reads real state):
- GET /api/system/integrations — env-derived connection status (legitimate config probe). system.service.ts:87.
- POST /api/design/:id/verify — documented PLACEHOLDER but reads real designs.status, deterministic score (Math.random removed 2026-06-06). design-extended.repository.ts:98. (designs has no quality_score col — DB-confirmed, justifies placeholder.)
- GET /api/general production/orders/report/excel — returns `{ready:false,...}` honest "not ready" descriptor (FE-aware), general-legacy-b.controller.ts.
- POST /api/general client-errors — `{received:true}` intentional client-error sink cap (documented, @Public).

## ❌ 5xx
None found. All raw-SQL tables and columns DB-proven to exist (no col-drift, no missing-table 503):
- material_movements (cols session_id,order_id,material_id,material_name,movement_type,quantity,unit,performed_by,scanned_at) — ALL present. material-balance.controller.ts:movements/createMovement.
- security_visitors / security_incidents / security_ppe_checks — exist; INSERT/SELECT cols match (security_visitors cols verified). security.controller.ts.
- design_tooling (wear_percentage,max_usage_count,total_usage_count,next_maintenance_date,tooling_number) — ALL present. design.controller.ts tooling/wear-forecast.
- "designOrderNotifications","designOrderMessages","design_orders","designs"(design_number,slogan,image_url,rejection_reason) — ALL present. design controllers.
- node_hr_requests, papka_orders, machine_tasks, planning_operations, face_embeddings, attendance — ALL present. org-structure + general-legacy-a.
- work_centers.efficiency_rate — present (the memory CRP-503 is the pp module, not erp; erp work-center stats safe).

## 🟠 404 / 501
- GET /api/security/daily-summary | 501-A stub (notImplemented, #FX-6, FINE) | security.controller.ts
- GET /api/security/fire-sensors | 501-A (#FX-6) | security.controller.ts
- GET /api/security/ppe-checks | 501-A (#FX-6) — NOTE inconsistency: POST /api/security/ppe-checks WRITES real rows to security_ppe_checks, but GET is gated 501 → created PPE checks cannot be read back. Both documented; flagged as functional gap, not a bug-per-rules.
- GET /api/security/ppe-stats | 501-A (#FX-6)
- GET /api/security/ppe-violations | 501-A (#FX-6)
- POST /api/design/orders | 501-C leftover: throws NotImplemented, redirects to canonical POST /design (requestDesign). Documented fragmentation cleanup deferred. design.controller.ts:createOrder.
No 404-A(drift)/404-B(missing vision)/404-D(prefix) found. No 501-B (should-work) found.

## 🟡🔵🔴 400/401/403
- All controllers sit behind 5 global guards; @Public() only on: auth login/refresh/verify-otp/resend-otp/health, general client-errors, bot-gateway webhook (TelegramAuthGuard instead), storage (no @Public — relies on cookie JWT; GET/PUT 401 anon — INTENTIONAL). All 401 = FINE (intentional).
- 403 RBAC: per-route @Roles throughout — all FINE (no misconfig found). fi.controller uses mixed-case 'SUPER_ADMIN' in class @Roles but lowercase in method overrides — cosmetic, RolesGuard case-handling not verifiable statically (backend down); low risk.
- 400: all @Body via Zod (.parse) or ZodValidationPipe — Zod FINE. No drift-400 found.

## ✅ FINE (grouped)
- auth (3 ctrl, 9 routes): login/logout/refresh cookie+rotation, change-password, verify/resend-otp, me, me/permissions, health — all real CQRS/service. CLEAN.
- erp (4 ctrl, ~70 routes): products/bom/routings/orders/work-centers/mrp/daily-reports/production-facts/downtime/capacity/shift/employee-work-centers — full CRUD via ErpService/ErpExtraService/ErpReportsService, Zod-validated, all tables exist. (1 green-lie: work-center-capacity POST, listed above.)
- remaining (12 ctrl): company-state, exception-log (15 routes), fi (legacy/fi finance CRUD), ideal-rasm, material-balance, order-status (state machine), production-facts, reports-hub, system/supply-chain/system-settings, three-way-match, waste, weekly-plan — delegate to services w/ Result pattern + ACL /v2 variants. (cron-jobs MOCK listed above.)
- general (3 ctrl): admin-auth (empty shell), legacy-a (papka-orders/machine-tasks/planning real DB, A-series green-lies already retired per code comments, real upload to disk), legacy-b (warehouse/iot/lms/abc real DB reads).
- security (real visitor/incident/ppe INSERTs + CQRS incidents). design (CQRS design-orders + raw tooling/messages real). storage (disk upload/serve, path-traversal hardened). org-structure (24 routes, nodes CRUD + portret + hr-requests + folder + export, all real). order-workflow (CQRS orders/saga/payment-plan). notifications (11 routes, repo-backed). mro (~19, CQRS + maintenance svc + canteen/equipment real). logistics (CQRS deliveries; complete is green-lie, listed). export (5 CSV/PDF streams via ExportService). core/panels (CQRS panel persist). common/validate (STIR/Luhn pure validators). bot-gateway (9 telegram bots, real handlers, error-logged).

## COUNTS (per bucket)
- ✅ 200-REAL: ~218
- 🔴 200-MOCK (hardcoded literal): 3 (design/templates, design/:id/mockup, system/cron-jobs[+v2 counts as same handler])
- 🔴 200-GREEN-LIE (no real write): 2 (erp/work-center-capacity, logistics/:id/complete)
- 🟠 501-A (stub, FINE): 5 (security daily-summary/fire-sensors/ppe-checks/ppe-stats/ppe-violations)
- 🟠 501-C (leftover redirect): 1 (design/orders)
- 🔵 401 (intentional, FINE): all anon hits across guarded routes
- 🟡 400 Zod (FINE): all @Body routes
- 🔴 403 RBAC (FINE): all @Roles routes
- ❌ 5xx: 0 · ❌ 503: 0 · 🟠 404: 0
Sum of non-FINE deceptive/incomplete: 11 (3 MOCK + 2 GREEN-LIE + 5 stub + 1 leftover).
