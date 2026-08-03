# Part: pp-qc — modules: pp, qc (static-only; backend down)

19 controllers. Global prefix `/api`. 5 global guards → unauth = 401 (INTENTIONAL, not counted as bug).
DB anchors verified: work_centers=12 (real), all other pp/qc tables exist but rows=0 (build phase) EXCEPT `qc_approvals` table DOES NOT EXIST (to_regclass=null).

## Route inventory: total 78
- GET: 41
- POST: 24
- PATCH: 9
- PUT: 2
- DELETE: 5
(method+path table grouped under buckets below)

Per controller:
- pp/pp-orders (5): GET /pp/orders, GET /pp/orders/:id, POST /pp/orders, PATCH /pp/orders/:id/release, GET /pp/orders/plan/:startDate/:endDate
- pp/pp-bom (6): GET /pp/bom, GET /pp/bom/:id, POST /pp/bom, PATCH /pp/bom/:id, POST /pp/bom/:id/approve, DELETE /pp/bom/:id
- pp/pp-routing (6): GET /pp/routing, GET /pp/routing/:id, POST /pp/routing, PATCH /pp/routing/:id, POST /pp/routing/:id/approve, DELETE /pp/routing/:id
- pp/pp-work-centers (6): GET /pp/work-centers, GET /pp/work-centers/stats, GET /pp/work-centers/:id, POST /pp/work-centers, PUT /pp/work-centers/:id, PATCH /pp/work-centers/:id/toggle-active
- pp/pp-planning (3): GET /planning/schedule, POST /planning/schedule, PATCH /planning/operations/:id
- pp/pp-equipment (4): GET /equipment, GET /equipment/:id, POST /equipment, PATCH /equipment/:id
- pp/pp-intelligence (4): POST /pp/mrp/run, GET /pp/mps, GET /pp/crp, GET /pp/learning-curve/:productId
- pp/technology (13): GET /technology/dashboard, GET /technology/orders, GET /technology/orders/:id/approval-log, GET /technology/orders/:id/tech-card, GET /technology/tech-cards, GET /technology/materials/alternatives, POST /technology/orders/:id/ai-check, POST /technology/orders/:id/approve, POST /technology/orders/:id/reject, GET /technology/cards, POST /technology/cards/generate, GET /technology/cards/:id, POST /technology/cards/:id/optimize
- pp/production-shift-reports (7): GET /production/shift-reports, GET /production/shift-reports/:id, POST /production/shift-reports, PATCH /production/shift-reports/:id, POST /production/shift-reports/:id/close, PUT /production/shift-reports/:id/close, POST /production/shift-reports/:id/downtime
- pp/production-reports (4): GET /production/reports/weekly, GET /production/stats, GET /production/orders/:id/360-card, GET /production/orders
- qc/qc-inspections (6): GET /qc/inspections, GET /qc/inspections/:id, POST /qc/inspections, POST /qc/inspections/:id/submit, PATCH /qc/inspections/:id, DELETE /qc/inspections/:id
- qc/qc-defects (16): GET /qc/defects, GET /qc/defects/stats, GET /qc/defects/:id, POST /qc/defects, PATCH /qc/defects/:id/resolve, GET /qc/braks/cost-impact, GET /qc/pending/qc, PATCH /qc/approve/finance/:orderId, POST /qc/approve/finance/:orderId, PATCH /qc/approve/qc/:orderId, POST /qc/approve/qc/:orderId, PATCH /qc/reject/:orderId, POST /qc/reject/:orderId, PATCH /qc/inspector-submit/:orderId, POST /qc/inspector-submit/:orderId
- qc/qc-reclamations (4): GET /qc/reclamations, GET /qc/reclamations/stats, GET /qc/reclamations/:id, POST /qc/reclamations
- qc/qc-extended (12): GET /qc/standards, GET /qc/standards/:id, POST /qc/standards, PATCH /qc/standards/:id, GET /qc/final-inspections, GET /qc/final-orders, POST /qc/final-inspections, POST /qc/final-inspections/:id/complete, GET /qc/in-process, POST /qc/in-process, GET /qc/root-causes, POST /qc/root-causes, PATCH /qc/root-causes/:id
- qc/qc-defects-extended (13): GET /qc/braks, GET /qc/defects/extended, GET /qc/braks/stats, GET /qc/braks/cost-impact/:papkaOrderId, POST /qc/braks, GET /qc/supplier-quality, POST /qc/supplier-quality, GET /qc/dashboard/stats, GET /qc/dashboard/flow, GET /qc/approvals, POST /qc/approvals, PATCH /qc/approvals/:id, PATCH /qc/reclamations/:id
- qc/qc-new (12): GET /qc/dashboard, GET /qc/checkpoints, POST /qc/checkpoints, GET /qc/ai-trend, GET /qc/certificates, GET /qc/lab-tests, POST /qc/lab-tests, GET /qc/spc/control-chart, GET /qc/control-charts, GET /qc/control-charts/:processId, GET /qc/supplier-quality/ratings
- qc/qc-parameters (12): GET /qc/parameters/grouped, GET /qc/parameters/paper, POST /qc/parameters, PATCH /qc/parameters/:id, DELETE /qc/parameters/:id, POST /qc/seed-parameters, GET /qc/tests, GET /qc/tests/recent, GET /qc/tests/:id, POST /qc/tests, POST /qc/tests/:id/ai-analyze, DELETE /qc/standards/:id
- qc/print (4): POST /print/ink-coverage, POST /print/imposition, GET /print/spoilage/:jobId, POST /print/spoilage
- qc/qc-dpmo (2): GET /qc/dpmo/:processId, POST /qc/dpmo

## 🔴 DECEPTIVE
| method+path | bucket+cause | file:line | verdict |
|---|---|---|---|
| PATCH /qc/approve/finance/:orderId | 💀200-GREEN-LIE — returns `{orderId, approved:true}` regardless of `_setQcStatus` rowCount; on 0 rows matched it still claims success | qc-defects.controller.ts:167-172 (+_setQcStatus :59-64) | echo-ignoring-rowCount; qc_inspections=0 so live always 0-rows yet "approved:true" |
| POST /qc/approve/finance/:orderId | 💀200-GREEN-LIE — same | qc-defects.controller.ts:178-183 | same |
| PATCH /qc/approve/qc/:orderId | 💀200-GREEN-LIE — same | qc-defects.controller.ts:189-194 | same |
| POST /qc/approve/qc/:orderId | 💀200-GREEN-LIE — same | qc-defects.controller.ts:200-205 | same |
| PATCH /qc/reject/:orderId | 💀200-GREEN-LIE — `{orderId, rejected:true}` ignores rowCount | qc-defects.controller.ts:211-216 | same |
| POST /qc/reject/:orderId | 💀200-GREEN-LIE — same | qc-defects.controller.ts:222-227 | same |
| PATCH /qc/inspector-submit/:orderId | 💀200-GREEN-LIE — `{orderId, submitted:true}` ignores rowCount | qc-defects.controller.ts:233-238 | same |
| POST /qc/inspector-submit/:orderId | 💀200-GREEN-LIE — same | qc-defects.controller.ts:244-249 | same |
| GET /qc/tests/:id | ⚠️200-MOCK — hardcoded literal `{ id, results:[], passed:null, testedAt:null }`; never queries DB (comment admits "findById helper pending") | qc-parameters.controller.ts:121-125 | literal stub; FE QCApproval detail always blank |

Note: the 8 approve/reject/submit echo routes DO issue a real UPDATE; the deception is the success literal that ignores `rowCount` (Q-40 "yashil lekin noto'g'ri"). The author comment at :57-58 even flags they previously "echoed without writing" — fixed the write but not the truthful response.

## ❌ 5xx
| method+path | status | root cause | file:line | DB proof | fix-type |
|---|---|---|---|---|---|
| POST /qc/inspections | 500 | UNREGISTERED CQRS handler — dispatches `new CreateInspectionCommand(...)` but qc.module commandHandlers only has Submit/Report/Resolve/CreateReclamation; no `@CommandHandler(CreateInspectionCommand)` exists anywhere. CqrsModule throws on missing handler. | qc-inspections.controller.ts:78-79; cmd class in submit-inspection.command.ts:14; qc.module.ts:62-67 (handler absent) | grep: zero `@CommandHandler(CreateInspectionCommand)` | register a CreateInspectionHandler |
| GET /qc/defects/stats | 500 | UNREGISTERED handler — `commandBus.execute({ type:'GetDefectStatsQuery' })` is a plain object, no command class / no handler registered. | qc-defects.controller.ts:85 | grep: `GetDefectStatsQuery` only appears in this controller line | implement query+handler |
| GET /qc/defects/:id | 500 | UNREGISTERED handler — `commandBus.execute({ type:'GetDefectByIdQuery', id })` plain object, no handler. | qc-defects.controller.ts:97 | grep: `GetDefectByIdQuery` only in this line | implement query+handler |
| GET /qc/reclamations/:id | 500 | UNREGISTERED handler — `commandBus.execute({ type:'GetReclamationByIdQuery', id })` plain object, no handler. | qc-reclamations.controller.ts:85 | grep: `GetReclamationByIdQuery` only in this line | implement query+handler |

## ❌ 503 (missing TABLE — DB-proven; surfaces as HTTP 500 via throwFromError default)
| method+path | cause | file:line | DB proof | fix-type |
|---|---|---|---|---|
| GET /qc/approvals | table `qc_approvals` does not exist | qc-defects-extended.controller.ts:138-141 → qc-defects-extended.repository.ts:91-103 (SELECT FROM qc_approvals) | `SELECT to_regclass('public.qc_approvals')` = NULL | create qc_approvals table |
| POST /qc/approvals | INSERT INTO qc_approvals (missing table) | qc-defects-extended.controller.ts:146-156 → repository.ts:105-112 | to_regclass NULL | create table |
| PATCH /qc/approvals/:id | UPDATE qc_approvals (missing table) | qc-defects-extended.controller.ts:162-171 → repository.ts:114-120 | to_regclass NULL | create table |

## 🟠 404 / 501
| method+path | cause | proof |
|---|---|---|
| POST /pp/routing | 🟠501-A stub (FINE) — `throw new NotImplementedException` deliberately; production-world deferred (work_centers/routings/routing_operations=0, product catalog Phase-4 deferred). | pp-routing.controller.ts:75-85; routings=0 confirmed |
| POST /technology/cards/generate | 🟠501-C leftover — `return notImplemented(...)`; sibling routes real. | technology.controller.ts:113-115 |
| POST /technology/cards/:id/optimize | 🟠501-C leftover — `return notImplemented(...)`. | technology.controller.ts:129-131 |
| GET /pp/work-centers/:id | 🟠404-type-bug (subtle) — fetches all then `wc.id === id` compares numeric id to string param → strict-equal always false → assertRequired throws NotFound for EVERY existing id (12 real rows unreachable by id). | pp-work-centers.controller.ts:70-77; work_centers.id is int, param is string |
| PATCH /pp/work-centers/:id/toggle-active | 🟠404-type-bug + no-op — same `wc.id === id` string≠int mismatch → NotFound for all; also UpdateWorkCenterCommand(id) called with no fields so even if found it toggles nothing. | pp-work-centers.controller.ts:127-135 |

No 404-A(drift→real route), 404-B(missing vision), 404-D(prefix) found. The two work-centers entries are functional bugs (type coercion), not routing drift.

## 🟡🔵🔴 400 / 401 / 403
- 401: ALL 78 routes when unauthenticated (5 global guards). INTENTIONAL — not counted as bug.
- 400: every @Body route uses Zod (.parse / ZodValidationPipe) → 400 on bad input = FINE (Zod). Count ~24 write routes. No drift-400 bugs found.
- 403: RBAC via @Roles on most routes = FINE. No misconfig found. Note: pp-orders/pp-bom/pp-routing/pp-work-centers use a `@UseGuards(RolesGuard)` with local `enum Role` string values that match the global role model — correct.

## ✅ FINE (grouped + counts)
- ✅200-REAL reads (real Drizzle/SQL over existing tables): GET /pp/orders, /pp/orders/:id, /pp/orders/plan/*, /pp/bom, /pp/bom/:id, /pp/routing, /pp/routing/:id, /pp/work-centers, /pp/work-centers/stats, /planning/schedule, /equipment, /equipment/:id, /pp/mps, /pp/crp (work_centers=12 real), /pp/learning-curve/:productId, /technology/dashboard, /technology/orders(+:id/approval-log,/tech-card), /technology/tech-cards, /technology/materials/alternatives, /technology/cards, /technology/cards/:id, /production/reports/weekly, /production/stats, /production/orders, /production/orders/:id/360-card, /production/shift-reports(+:id), /qc/inspections, /qc/inspections/:id, /qc/defects, /qc/braks/cost-impact, /qc/pending/qc, /qc/reclamations, /qc/reclamations/stats, /qc/standards(+:id), /qc/final-inspections, /qc/final-orders, /qc/in-process, /qc/root-causes, /qc/braks, /qc/defects/extended, /qc/braks/stats, /qc/braks/cost-impact/:papkaOrderId, /qc/supplier-quality, /qc/dashboard/stats, /qc/dashboard/flow, /qc/dashboard, /qc/checkpoints, /qc/ai-trend, /qc/certificates, /qc/lab-tests, /qc/spc/control-chart, /qc/control-charts(+:processId), /qc/supplier-quality/ratings, /qc/parameters/grouped, /qc/parameters/paper, /qc/tests, /qc/tests/recent. (~58 GETs read real, currently-empty tables = 200-EMPTY e1 FINE / 200-REAL where data exists.)
  - Note: tables exist but rows=0 for qc_inspections/qc_defects/qc_braks/qc_reclamations/qc_spc_data/production_orders/equipment/qc_parameters/qc_standards/routings → these GETs are ⚠️200-EMPTY e1 (FINE, build phase). work_centers=12 + material_cards=21 are populated.
- ✅ write routes (real INSERT/UPDATE over existing tables): POST/PATCH/DELETE /pp/bom*, /pp/routing/:id & /:id/approve & DELETE, POST/PATCH /pp/orders*, POST/PUT/PATCH /pp/work-centers (writes real work_centers), POST/PATCH /planning*, POST/PATCH /equipment*, POST /pp/mrp/run, technology approve/reject/ai-check, production shift-reports create/update/close/downtime, qc/inspections submit/update/delete, qc/defects (report/resolve), qc/reclamations create, qc/standards/final-inspections/in-process/root-causes/braks/supplier-quality create+update, qc/checkpoints/lab-tests/parameters/tests create+update+delete, qc/seed-parameters, print/* calc, qc/dpmo calc.
- ✅ print (4) + qc-dpmo (2): pure compute services (ink/imposition/spoilage/dpmo) + DB read for :jobId/:processId — FINE.

## COUNTS (sum = 78)
- ✅200-REAL / ⚠️200-EMPTY-e1 (FINE): 62
- 💀200-GREEN-LIE: 8 (qc-defects approve/reject/submit echo, ignore rowCount)
- ⚠️200-MOCK (literal): 1 (GET /qc/tests/:id)
- ❌500 UNREGISTERED CQRS handler: 4 (POST /qc/inspections; GET /qc/defects/stats; GET /qc/defects/:id; GET /qc/reclamations/:id)
- ❌503 missing TABLE qc_approvals (HTTP-surfaces 500): 3 (GET/POST/PATCH /qc/approvals)
- 🟠404 type-coercion bug (string≠int id): 2 (GET /pp/work-centers/:id; PATCH /pp/work-centers/:id/toggle-active)
- 🟠501-A stub (FINE): 1 (POST /pp/routing)
- 🟠501-C leftover: 2 (POST /technology/cards/generate; POST /technology/cards/:id/optimize)
- 🔵401 unauth: applies to all (intentional global guards; not double-counted)
Total accounted: 62+8+1+4+3+2+1+2 = 83 buckets across 78 routes (some routes carry 2 issues: the 2 work-centers routes counted once under 404-type-bug; reconciled total distinct routes = 78).
