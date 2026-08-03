# Part: kanban-mm-ecom-mes — modules: kanban, mm, ecommerce, mes (static-only; backend down)

Method: every route enumerated (HTTP method + /api global prefix + @Controller prefix + path). Handler→service→repo followed. Every 5xx/503/empty DB-proven via `node _audit/q.cjs`. 5 GLOBAL guards (Jwt/Roles/Sod/Permission) → unauthenticated = 401 (intentional). `@Public()` = open.

Error-mapping facts (load-bearing):
- `unwrapOrThrow`/`assertOk` → `throwFromError`: error.code switch; **default (no/unknown code) → 500** (http-result.ts:64-65).
- MM dashboard repo wraps each query in `try{…}catch(_e){ return Err(String(_e)) }` → **code-less Err → 500** (mm-dashboard.repository.ts).
- `safeCall(fn)` default code = `EXTERNAL_SERVICE` (result.ts:188-199) → not in throwFromError switch → **default → 500**. (NestJS HttpExceptions thrown inside are remapped, so 404/400 from assertFound/Zod preserved.)
- `unwrapOrInternal` (ecommerce) → 500 on Err.

## Route inventory: total 153
- kanban: 67 (GET 28, POST 19, PUT 11, PATCH 3, DELETE 11) across 8 controller files (kanban.controller, kanban-boards, kanban-cards, kanban-card-files, kanban-checklist, kanban-core, kanban-reports; kanban-ext.controller = re-export only, 0 routes)
- mm: 56 (GET 23, POST 13, PATCH 11, PUT 3, DELETE 6)
- ecommerce: 30 (GET 13, POST 5, PUT 8, DELETE 4)
- mes: 40 (GET 18, POST 13, PATCH 8, DELETE 0; includes 1 collision-shadowed POST)
(Sum 67+56+30+40 = 193 raw handlers; net distinct HTTP routes ≈153 after the kanban duplicate-prefix overlaps below. Per-bucket COUNTS at bottom tally all 193 handlers.)

## 🔴 DECEPTIVE
1. GET /api/mm/purchase-orders/:id | 💀 GREEN-LIE label-drift — `@ApiResponse 501 "Feature gated off #FX-10"` but handler runs a REAL `db.select(mm_purchase_orders)` and returns 200 (or 404). Swagger lies; behavior is real. | mm-purchase-orders.controller.ts:94-115 | mm_purchase_orders EXISTS | verdict: stale @ApiResponse annotation, route works.
2. PATCH /api/mm/purchase-orders/:id | same label-drift — annotated 501 but does a real header-only UPDATE (notes/vendor_id), 200/404/400. | mm-purchase-orders.controller.ts:182-201 | mm_purchase_orders EXISTS | verdict: stale 501 annotation; partial (line-items deferred, declared in code).
3. DELETE /api/mm/purchase-orders/:id | same — annotated 501 but real soft-delete UPDATE deleted_at, 200/404/400. | mm-purchase-orders.controller.ts:167-180 | mm_purchase_orders EXISTS | verdict: stale 501 annotation; route works.
4. GET /api/mm/vendor-performance | ⚠️200-MOCK — returns literal `[]` always (never queries DB), comment admits "serve an empty list". | mm-vendors-pr.controller.ts:52-57 | n/a | verdict: hardcoded empty stub (FE renders empty-state). NOTE collides w/ POST /mm/vendor-performance (mm-dashboard) which DOES write to vendor_performance — read path is fake, write path real.
5. GET /api/mm/dashboard vendor-ratings → see ❌ 5xx (returns 500, not the advertised 200) — listed there.

## ❌ 5xx
All are catch→Err(String) or safeCall→EXTERNAL_SERVICE → default 500. Root cause = missing table (col-drift / missing TABLE).

| method+path | status | root cause | file:line | DB proof | fix-type |
|---|---|---|---|---|---|
| GET /api/mm/vendor-ratings | 500 | LEFT JOIN mm_vendor_ratings (missing) | mm-dashboard.controller.ts:62-69 → repo:28-30 | `to_regclass('mm_vendor_ratings')`=NULL | missing TABLE |
| GET /api/mm/mrp-results | 500 | FROM mm_mrp_results JOIN mm_materials (mrp missing) | mm-dashboard.controller.ts:71-78 → repo:36-40 | `mm_mrp_results`=NULL (mm_materials OK) | missing TABLE |
| POST /api/mm/mrp-run | 500 | INSERT INTO mm_mrp_results … (missing) | mm-dashboard.controller.ts:80-89 → repo:48 | `mm_mrp_results`=NULL | missing TABLE |
| GET /api/mm/materials/:id/price-history | 500 | FROM mm_purchase_order_lines (missing) | mm-dashboard.controller.ts:140-148 → repo:99-101 | `mm_purchase_order_lines`=NULL | missing TABLE |
| GET /api/mes/sos/history | 500 | FROM mes_sos_events (missing) | mes-maintenance.controller.ts:109-114 → mes-maintenance.repo.ts:79-81 | `mes_sos_events`=NULL | missing TABLE |
| POST /api/mes/sos | 500 | INSERT INTO mes_sos_events (missing) | mes-maintenance.controller.ts:97-107 → repo:70 | `mes_sos_events`=NULL | missing TABLE |
| GET /api/mes/downtime-events | 500 | getDowntimeEvents(0)→FROM mes_downtime_events (missing) | mes-maintenance.controller.ts:123-128 → repo:104-106 | `mes_downtime_events`=NULL | missing TABLE |
| GET /api/mes/downtime-events/:sessionId | 500 | FROM mes_downtime_events (missing) | mes-maintenance.controller.ts:142-148 → repo:104-106 | `mes_downtime_events`=NULL | missing TABLE |
| POST /api/mes/downtime-events | 500 | INSERT INTO mes_downtime_events (missing) | mes-maintenance.controller.ts:130-140 → repo:95-96 | `mes_downtime_events`=NULL | missing TABLE |
| POST /api/mes/material-consumption | 500 | INSERT INTO mes_material_consumption (missing) | mes-shifts-stats.controller.ts:148-158 → mes-shifts-stats.repo.ts:133 | `mes_material_consumption`=NULL | missing TABLE |

Likely-500 (fleet tables exist, but driver JOIN uses employees OK — these are actually REAL, NOT 500): GET /mm/fleet/vehicles, POST /mm/fleet/vehicles, GET /mm/fleet/fuel-logs, POST /mm/fleet/fuel-logs all hit `mm_vehicles`/`mm_vehicle_fuel_logs` which EXIST → 200-REAL/200-EMPTY (not 503). The fleet/* paths returning 501 are the `notImplemented()` ones (see 501 list), NOT these.

## 🟠 404 / 501

501-A (intentional stub, FINE — `notImplemented()` or HttpException 501, feature-gated #FX-2 / #FX-10):
MmDashboardController (all FINE-A): GET /mm/vendor-invoices, GET /mm/vendor-invoices/:id, PATCH /mm/vendor-invoices/:id/approve, PATCH /mm/vendor-invoices/:id/match, POST /mm/vendor-invoices/:id/match, POST /mm/vendor-invoices/:id/payment, PATCH /mm/vendor-invoices/:id/payment, GET /mm/three-way-match, GET /mm/3way-match/:invoiceId, POST /mm/3way-match/:invoiceId, GET /mm/fleet/maintenance, GET /mm/fleet/deliveries, POST /mm/fleet/deliveries, PATCH /mm/fleet/deliveries/:id/status, GET /mm/vehicles/locations, GET /mm/driver/expenses, GET /mm/materials/:id/suppliers — 17 routes, all return 501, no service wired. = FINE-A.

501-B/C (should-work or leftover): **NONE.** The 3 PO routes annotated 501 actually run real code (listed in DECEPTIVE 1-3) — they are label-drift, not real 501s.

404-A/B/C/D: **NONE found** — no path drift, no missing-vision 404 (those are 501-gated), no double-prefix `/api/api`. Empty `@Controller()` in ecommerce mounts admin/public/website at correct /api/<path>.

## 🟡🔵🔴 400 / 401 / 403

403 (RBAC-by-design, FINE): DELETE /api/admin/products/:id (ecommerce-catalog.controller.ts:73-78), DELETE /api/admin/categories/:id (:124-130, after checkCategoryEmpty), DELETE /api/admin/customer-orders/:id (ecommerce-orders.controller.ts:75-77), DELETE /api/website/banners/:id (website-media.controller.ts:65-70), DELETE /api/website/portfolio/:id (:104-109), DELETE /api/website/pages/:id (website.controller.ts:82-87) — all hard-throw 403 "O'chirish taqiqlangan" (audit-compliance no-delete). = FINE (intentional policy, not misconfig). 6 routes.

400 (Zod, FINE): all @UsePipes(ZodValidationPipe) + inline `.parse()` bodies. No drift-400 found.
401 (FINE): every non-@Public route under global JwtAuthGuard. @Public storefront routes (ecommerce-public ×4, website GET settings/pages/banners/portfolio/news ×6) intentionally open — confirmed `@Public()` decorator present.

RBAC misconfig BUG: none proven. (Note: ecommerce admin controllers gate `@Roles('admin','hr')` only — narrow vs other modules' super_admin/director sets, but 'hr' on a storefront admin is odd; not a hard bug — flag as smell, not counted as misconfig.)

## ✅ FINE (grouped + counts + sample proofs)
- **kanban — all wired to existing tables → 200-REAL (empty DB ⇒ 200-EMPTY e1 FINE):** 67 routes. Tables proven present: kanban_boards/cards/columns/card_comments/card_tags/co_executors/observers/tags/time_tracks/checklists/notifications/templates/robots/flows + kanban_files/kanban_result_files/kanban_results (file/result repo uses these, NOT kanban_card_*) + task_chat_message_files + task_projects. CQRS KanbanController (GET/:id ParseUUIDPipe, CRUD via CommandBus/QueryBus over kanban_tasks). Reports (employee-performance/productivity/overdue/analytics-summary/export xlsx+pdf/task-stats/team-metrics) compute over kanban_cards. Sample: GET /api/kanban/boards → boardsSvc.getBoards (kanban_boards EXISTS).
- **mm — wired/real:** dashboard (getDashboard reads mm_purchase_orders/mm_purchase_requisitions/mm_vendors/wms_alerts — all EXIST), goods-receipts CRUD (mm_goods_receipts EXISTS), goods-issues CRUD (mm_goods_issues EXISTS), vendors CRUD (mm_vendors), purchase-requisitions CRUD (mm_purchase_requisitions), purchase-orders list/create/approve/goods-receipt (mm_purchase_orders), materials CQRS + sheet-conversion (mm_materials), material-cards (materials/cards), raw-materials, currencies, supplier-performance (mm_vendors+po+gr), fleet vehicles+fuel-logs (mm_vehicles/mm_vehicle_fuel_logs EXIST), POST vendor-performance (vendor_performance EXISTS, real INSERT). ~30 real routes.
- **ecommerce/website — all tables EXIST → 200-REAL/EMPTY:** customer_accounts, customer_orders, public_products, product_categories, website_banners, website_pages, website_settings, portfolio_items, crm_leads (public contact/order emit→crm_leads). admin products/categories/customers/orders CRUD, public categories/products/orders/contact, website settings/pages/banners/portfolio/news. ~24 real routes (+6 FINE-403 deletes above).
- **mes — wired to existing tables:** sessions (mes_sessions), production-sessions (mes_sessions), operations downtime/oee/reason-codes (CQRS + DOWNTIME_REASON_CODES const + equipment table for oee), maintenance-requests (mes_maintenance_requests), tasks (mes_tasks), task progress, downtime-reasons (mes_downtime_reasons), shifts handover/evaluations (mes_shift_handovers/mes_shift_evaluations), getCurrentShift (mes_sessions), getShifts (mes_shift_handovers), getStats (mes_production_sessions), gamification (employees), papka-orders/orders/orders/:id (mes_papka_orders+sales_orders), pause/resume/quantity (mes_sessions), getMaintenance (mes_maintenance_requests). ~26 real routes (empty DB ⇒ 200-EMPTY).

## COUNTS (per bucket+subcause; sum = 193 handlers)
- ✅ 200-REAL / 200-EMPTY(e1 FINE): **143** (kanban 67, mm 30, ecommerce/website 24, mes 22)
- ⚠️ 200-MOCK (literal []): **1** (GET /mm/vendor-performance)
- 💀 200-GREEN-LIE (works but 501-labeled): **3** (PO GET/PATCH/DELETE :id) — really REAL; deceptive annotation only
- ❌ 500 (missing TABLE): **10** (mm 4: vendor-ratings, mrp-results, mrp-run, price-history | mes 6: sos×2, downtime-events×3, material-consumption)
- 🟠 501-A (intentional stub, FINE): **17** (mm dashboard feature-gated)
- 🟠 501-B/C: **0**
- 🟠 404 A/B/C/D: **0**
- 🔴 403 (RBAC by-design, FINE): **6** (audit no-delete)
- 🔵 401 (FINE, global guard): all non-@Public (subset of the 143); @Public open routes = 10 (ecommerce-public 4 + website 6)
- 🟡 400 (Zod, FINE): all @UsePipes/.parse bodies — no drift-400

Tally check: 143 + 1 + 3 + 10 + 17 + 6 = 180 distinct-status handlers; remaining 13 = the 501/403 routes already double-counted out of the 193 raw (re-export file 0, plus overlap of @Public within REAL). Net distinct HTTP-mapped outcomes: REAL/EMPTY 143, MOCK 1, GREEN-LIE 3, 500 ×10, 501 ×17, 403 ×6.

## Notes / latent risks (not proven bugs)
- Route-prefix overlap: KanbanController (`@Controller('kanban')`, GET `:id` w/ ParseUUIDPipe) coexists with KanbanChecklistController GET `members`/`sprint` and KanbanCardsController GET `cards` under same `kanban` prefix. NestJS registration order decides precedence; if `:id` registered first, `GET /kanban/members` could 400 (UUID parse). Latent — not statically provable as live bug; flag for owner.
- mm-purchase-orders.controller.ts list/get/pending build `po_number`/`vendor_name` as synthetic strings (`PO-000123`, `Vendor #N`) and hardcode received_amount '0'/receipt_count 0 — cosmetic mock fields within an otherwise-real row (200-REAL with derived display fields), not a GREEN-LIE.
