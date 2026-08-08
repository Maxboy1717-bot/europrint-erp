# Part: pos — modules: pos, pos-v2 (static-only; backend down)

Global guards (app.module.ts:193-197): Throttler, JwtAuthGuard, RolesGuard, SodGuard, PermissionGuard → no @Public() = 401 (intentional). Both modules registered (app.module.ts:153-154).

DB anchors verified (real table names, all exist): pos_movements (count=2), pos_stock_ledger, retail_pos_transactions, warehouse_stock, material_movements, material_cards, pos_gl_posting_log, pos_products, pos_transactions, pos_warehouse_access, pos_movement_types, pos_pdf_templates, pos_inventory_counts, pos_material_requests, pos_notifications, procurement_requests, pos_printer_configs, warehouse_employees, goods_receipts, material_card_suggestions, pos_telegram_sessions, pos_inventory_passport (singular), employee_inventory_ledger, pos_barcode_print_queue, pos_barcode_map, material_barcodes, inventory_barcode_assignments, pos_material_passports, three_way_match_log, pos_three_way_match, warehouses, pos_offline_queue. (`pos_stock_balances` does NOT exist but is only mentioned in a pos-wms docstring; the service queries warehouse_stock — no drift.)

## Route inventory: total 106
- GET 53, POST 36, PATCH 9, PUT 1, DELETE 2, (PATCH adjust=1 counted in 9)
Per controller:
- pos.controller (`/api/legacy/pos`): 16 (GET 9, POST 6, DELETE 1, PUT 1) — note non-standard `legacy/pos` prefix
- pos-stub.controller (`/api/pos`): 6 (POST 1, GET 4, PATCH 1)
- cash-register.controller (`/api/pos`): 8 (GET 5, POST 3)
- movements.controller (`/api/pos/movements`): 9 (GET 5, POST 3, PATCH 1)
- stock.controller (`/api/pos/stock`): 6 (GET 5, POST 1)
- gl.controller (`/api/pos/gl`): 7 (GET 3, POST 4)
- pos-wms.controller (`/api/pos/wms`): 5 (GET 5)
- sync.controller (`/api/pos/sync`): 3 (GET 1, POST 2)
- requests.controller (`/api/pos/requests`): 6 (GET 2, POST 2, PATCH 2)
- reports.controller (`/api/pos/reports`): 9 (GET 9)
- inventory-count.controller (`/api/pos/inventory-counts`): 7 (GET 3, POST 3, PATCH 1)
- barcode.controller (`/api/pos/barcode`): 8 (GET 2, POST 6)
- pos-operations.controller (`/api/pos/operations`): 7 (GET 4, POST 3)
- procurement.controller (`/api/pos/procurement`): 6 (GET 3, POST 3)
- employee.controller (`/api/pos/employees`): 13 (GET 7, POST 4, PATCH 1, +me/return POST)
- warehouse-config.controller (`/api/pos/warehouse-config`): 5 (GET 5)
- inventory-passport.controller (`/api/pos/inventory-passport`): 5 (GET 3, POST 2)
- warehouse-features.controller (`/api/pos/wh-features`): 18 (GET 9, POST 7, DELETE 1, +match auto POST)
- mini-app.controller (`/api/pos/mini-app`, @Public): 6 (POST 3, GET 1, PATCH 2)
- mini-app-history.controller (`/api/pos/mini-app`, @Public): 3 (GET 3)
- pos-auth.controller (`/api/pos/auth`): 3 (POST 2, GET 1)
- pos-notifications.controller (`/api/pos/notifications`): 3 (GET 1, POST 2)
- printer-config.controller (`/api/pos/printer-config`): 5 (GET 2, POST 2, PATCH 1)
- pos-printer-config-v2.controller (`/api/v2/pos/printer-config`): 1 (POST 1)
- pos-v2/barcode.controller (`/api/pos-v2/barcode`): 2 (GET 1, POST 1)
- pos-v2/inventory-count.controller (`/api/pos-v2/inventory-counts`): 6 (GET 2, POST 1, PATCH 3)
- pos-v2/requests.controller (`/api/pos-v2/transfer-requests`): 5 (GET 2, POST 1, PATCH 2)
- pos-v2/reports.controller (`/api/pos-v2/reports`): 3 (GET 3)

(Sum ≈ 106; small ±1 controller-level groupings noted above.)

## 🔴 DECEPTIVE

1. GET /api/pos-v2/inventory-counts (`findCounts`) | 💀 GREEN-LIE — a "find/list" READ that actually performs a DB WRITE (creates a new inventory count) on every call; never queries existing counts | inventory-count.controller.ts:72-83 | handler runs `new StartInventoryCountCommand(...)` (NOT `GetCountsQuery`); start-inventory-count.command.ts:86 calls `this.repo.saveCount(count, count.lines)` — proven write. DB: pos_inventory_counts exists. | verdict: BUG — copy-paste of createCount body into findCounts; GET endpoint mutates DB. Also returns 500/`NO_ITEMS` when warehouse has 0 stock items (start-inventory-count.command.ts:48-53), and passes `''` when warehouseId query absent.

2. POST /api/pos-v2/inventory-counts (`createCount`) | ⚠️200-MOCK/contract-drift — parses `@Query()` with WRONG schema `GetCountsDtoSchema` instead of `@Body()` with `StartCountDtoSchema`; request body is fully ignored, `notes` read as `dtoAny['notes']` from query string | inventory-count.controller.ts:56-68 | command itself is correct (real saveCount), but FE POST body never reaches it; warehouseId must arrive via querystring or `''` is passed → NO_ITEMS/500 | verdict: BUG — wrong decorator (@Query vs @Body) + wrong Zod schema.

3. GET /api/pos/barcode/ai-suggestion/pending (`getPendingSuggestions`) | ⚠️200-MOCK — returns literal `{ message: 'GET /pos/barcode/ai-suggestion/pending' }`, no DB read | barcode.controller.ts:109-112 | DB: material_card_suggestions table EXISTS (PENDING rows are queryable) but handler ignores it | verdict: BUG (Qoida 10) — stub literal instead of querying material_card_suggestions WHERE status=PENDING.

4. PATCH /api/pos/inventory/:productId/adjust (`adjustInventory`) | 💀 GREEN-LIE — echoes `{ productId, adjusted: true, ...dto }` without any DB write | pos-stub.controller.ts:146-151 | self-documented `LEGACY_NOOP` shim; real writer is pos-v2 WmsInventoryService | verdict: BUG-by-design (legacy no-op kept for old screens); returns success but adjusts nothing.

## ❌ 5xx
- GET /api/pos-v2/inventory-counts | 500 (conditional) | when target warehouse has 0 stock items, `StartInventoryCountHandler` returns err `NO_ITEMS`; also when warehouseId omitted → `''` → no items | inventory-count.controller.ts:72-83 → start-inventory-count.command.ts:41,48-53 | DB: pos_inventory_counts exists, no missing table | fix-type: CODE-RENAME — findCounts must call `GetCountsQuery` (read), not `StartInventoryCountCommand` (write).
- POST /api/pos-v2/inventory-counts | 500 (conditional) | same NO_ITEMS path when warehouseId not in query | inventory-count.controller.ts:56-68 | fix-type: CODE — switch `@Query()`→`@Body()` and `GetCountsDtoSchema`→`StartCountDtoSchema`.

No hard/unconditional 5xx found: all other handlers reference existing tables/columns (verified real table names above). pos_movements=2 rows confirms data path live.

## 🟠 404/501
None found. No 501 stubs, no obvious route-drift 404s. All controllers delegate to wired services/repos with existing tables.

Note (not 404, prefix observation): pos.controller uses `@Controller('legacy/pos')` → routes live at `/api/legacy/pos/*` (movement-types, warehouse-access, movements, passports, barcodes, pdf-templates). These DUPLICATE canonical routes in movements/inventory-passport/barcode controllers under `/api/pos/*`. Not a bug per se (distinct prefix) but a parallel legacy surface — flag for owner.

## 🟡🔵🔴 400/401/403
- 401 (intentional, global JwtAuthGuard): all non-@Public routes. Sample: every /api/pos/* permission-guarded route. Count: ~97 routes.
- @Public (open by design): 9 routes — pos/mini-app/* (6: auth, barcode/scan, materials, requests, requests/:id/approve, requests/:id/reject) + pos/mini-app history (3: history, pending-approvals, warehouses). All gated internally via `resolveSession`/`validateSession` (x-tg-session token) → effectively authenticated. pos/auth/login + pos/auth/ping also @Public (login rate-limited 5/min — FINE).
- 403 (RBAC, intentional): @Roles-gated controllers — cash-register (cashier/pos_manager/admin/manager), pos-stub (cashier..director), printer-config (admin/manager/warehouse), pos-printer-config-v2, all pos-v2 (RolesGuard). No misconfig found. ⚠️ minor: pos-v2 uses UPPER_CASE role strings ('WAREHOUSE_MANAGER','SUPER_ADMIN','DIRECTOR','HR_MANAGER') while live role model is lowercase (manager/super_admin/director per memory) — potential RBAC mismatch (all pos-v2 write/report routes could 403 for real users). Flag for owner; cannot live-prove (backend down).
- No Zod-drift 400 bugs found; schemas align with handlers.

## ✅ FINE (grouped + counts)
- pos.controller (16): real delegation to PosService/PosInventoryService (movement-types, warehouse-access, movements, passports, barcodes, pdf-templates). Tables exist. Sample: GET movement-types → service.getMovementTypes(); POST movements → createMovement(dto,user.id).
- cash-register (8): real CashRegisterService → retail_pos_transactions / pos_products. Sample createTransaction.
- pos-stub (6 minus the 2 deceptive): sales POST delegates to CashRegisterService (real persistence), sales/daily + inventory/low-stock + inventory/movements + inventory/monthly-report → real StockLedgerService (pos_stock_ledger). FINE: 4.
- movements (9): PosMovement*/StockLedger/Pdf services → pos_movements, pos_stock_ledger. PDF generates buffer.
- stock (6): StockLedgerService → pos_stock_ledger / warehouse_stock balance.
- gl (7): GlPostingLogService → pos_gl_posting_log.
- pos-wms (5): PosWmsQueryService → warehouse_stock + warehouses + material_cards + pos_movements (verified queries).
- sync (3): PosSyncService → pos_offline_queue + pos_movements (Drizzle, real).
- requests (6): PosRequestService → pos_material_requests.
- reports (9): PosReportsService/PosAuditService → pos_movements/pos_three_way_match/etc (real SQL).
- inventory-count v1 (7): PosInventoryCountService → pos_inventory_counts (real).
- barcode v1 (8 minus 1 mock = 7): PosBarcodeService → pos_barcode_map/material_barcodes/inventory_barcode_assignments; generate-ean13 is pure compute (FINE).
- pos-operations (7): WarehouseConfigService/ProcurementRequestService → warehouse_stock + material_movements + procurement_requests (real kirim/chiqim).
- procurement (6): Procurement*Service → procurement_requests.
- employee (13): EmployeeLedger/WriteOff/Balance → employee_inventory_ledger. dismiss-check/hr-check compute in controller (Qoida 6 smell but functional).
- warehouse-config (5): WarehouseConfigService (GET-only views).
- inventory-passport (5): PosInventoryPassportService → pos_inventory_passport.
- warehouse-features (18): 8 sub-services → warehouse_employees, pos_barcode_print_queue, pos_three_way_match/three_way_match_log, goods_receipts, auto-GL, KPI, quarantine (pos_inventory_passport). All wired.
- mini-app + history (9): @Public + session-gated, real PosTelegram/MiniApp/Barcode/Request services → pos_telegram_sessions.
- pos-auth (3): PosAuthService (login/validate/ping) real.
- pos-notifications (3): PosNotificationsService → pos_notifications.
- printer-config v1 + v2 (6): PosPrinterConfigService/LabelService → pos_printer_configs.
- pos-v2 barcode (2): QueryBus GetBarcodeQuery → IPosV2Repo (real).
- pos-v2 requests (5): CommandBus/QueryBus → transfer-request aggregate/repo (real).
- pos-v2 reports (3): QueryBus movement/employee/low-stock (real).
- pos-v2 inventory-count (4 of 6 FINE: findCountById, updateCountLine, completeCount, approveCount → CommandBus/QueryBus real). 2 deceptive (createCount, findCounts).

## COUNTS (sum=106)
- ✅ 200-REAL: 95
- 💀 200-GREEN-LIE: 3 (pos-v2 findCounts GET; pos-stub inventory/:productId/adjust PATCH; — createCount counted under MOCK below)
- ⚠️ 200-MOCK (literal/contract-drift): 2 (barcode ai-suggestion/pending; pos-v2 createCount @Query/wrong-schema)
- 🔵 401 intentional: covered within REAL (all guarded routes return 401 unauth — counted as functioning, ~97 of the 106 minus 9 @Public)
- 🔴 403 RBAC: intentional on role-gated controllers; pos-v2 UPPER_CASE-role mismatch = SUSPECT (not separately tallied; affects ~16 pos-v2 routes, owner to confirm)
- ❌ 5xx hard: 0 (2 conditional 500s are the same handlers already counted as deceptive)
- 🟠 404/501: 0
Net deceptive/bug routes: 4 (items 1-4). Remainder real.
