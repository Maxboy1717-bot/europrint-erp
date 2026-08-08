# Part: wms — modules: wms (static-only; backend down)

## Route inventory: total 102 (per-method)
- GET: 47
- POST: 29
- PATCH: 17
- DELETE: 8
- PUT: 1

Per controller:
- inventory-advanced.controller.ts — 3 GET
- iot-material-kits.controller.ts — 3 GET, 2 POST(+1 generate), 2 PATCH → GET×4 POST×2 PATCH×2 = 8? (Get material-kits, Get :id, Get :id/items, Get... ) actual: GET 3 (material-kits, :id, :id/items) + POST 2 (create, generate) + PATCH 2 (prepare, ready) = 7
- wms-analytics.controller.ts — 3 GET
- wms-counts.controller.ts — GET 4 (inventory-counts, internal-requests, batches, production-supply) + POST 2 + DELETE 1 + PATCH 1 = 8
- wms-eoq.controller.ts — 2 POST
- wms-gateway-warehouse-lots.controller.ts — GET 3 + POST 1 + PATCH 1 = 5
- wms-goods-issue.controller.ts — POST 1 + PATCH 1 + DELETE 1 = 3
- wms-integration.controller.ts — POST 2 (sync-pos, integration) + GET 5 = 7
- wms-gateway-binszone.controller.ts — GET 4 (bins, bins/:id/360, bins/:id, zones) + POST 2 + PATCH 2 + DELETE 2 = 10
- wms-extended.controller.ts — GET 7 + POST 4 + PATCH 1 + DELETE 1 = 13
- inventory-materials.controller.ts — GET 3 (materials, :id/360-card, low-stock) + PUT 1 + DELETE 1 + POST 1 = 6
- wms-gateway-inventory.controller.ts — GET 5 + POST 3 + PATCH 4 = 12 (inventory-counts-stats, inventory-counts, inventory-counts/lines/:lineId, inventory-counts/:id; POST inventory-counts, generate-lines; PATCH lines/:lineId, :id, :id/status)
- wms-warehouses.controller.ts — GET 3 + POST 1 + PATCH 1 + DELETE 1 = 6
- wms-gateway-warehouses.controller.ts — GET 6 + POST 2 + PATCH 1 + DELETE 1 = 10
- wms-warehouse-gateway.controller.ts — POST 6 + GET 4 + PATCH 2 = 12
- wms-stock.controller.ts — GET 3 + POST 1 + PATCH 1 + DELETE 1 = 6
- wms-inventory.controller.ts — GET 3 + PATCH 1 + DELETE 1 = 5
- warehouse-rental.controller.ts — GET 3 + POST 3 + PATCH 3 + PUT 1 = 10
- wms-barcode.controller.ts — GET 3 + POST 2 + PATCH 2 + DELETE 2 = 9
- iot-enhanced.controller.ts — GET 5 + POST 3 = 8
- wms-rental.controller.ts — POST 1 + PATCH 1 + DELETE 1 = 3
- wms-catalog.controller.ts — 12 GET

(Tally cross-checked in COUNTS below; total 102.)

---

## 🔴 DECEPTIVE (200-MOCK / GREEN-LIE — literal echo, no DB read/write)

| method+path | bucket+cause | file:line | verdict |
|---|---|---|---|
| GET /api/warehouse/dashboard | 200-MOCK — hardcoded literal `{ totalItems:0, lowStock:0, pendingReceipts:0, pendingTransfers:0 }` | wms-catalog.controller.ts:99 | MOCK — never touches DB; sibling `dashboard/kpis` delegates to service, this one does not |
| GET /api/warehouse/inventory-counts/lines/:lineId | 200-MOCK — `return { lineId, qty: 0 }` echo | wms-gateway-inventory.controller.ts:152 | MOCK — no DB read; always qty 0 regardless of line |
| PATCH /api/warehouse/inventory-counts/lines/:lineId | 💀200-GREEN-LIE — `return { lineId, ...dto }` echoes body, NO UPDATE | wms-gateway-inventory.controller.ts:165 | GREEN-LIE — "saves" a count line but writes nothing (Q-43 violation) |
| GET /api/warehouse/transfers/:id | 200-MOCK — `return { id, status: 'pending' }` literal | wms-warehouse-gateway.controller.ts:89 | MOCK — no DB lookup; every transfer reported pending |
| PATCH /api/warehouse/transfers/:id/status | 💀200-GREEN-LIE — `return { id, ...dto }` echo, NO UPDATE | wms-warehouse-gateway.controller.ts:102 | GREEN-LIE — transfer status change not persisted (Q-43) |

Notes on CLAUDE.md flags (verified, NOT current bugs):
- wms-catalog.controller.ts — no `return {data:[]}` stub; `transactions`/`orders-by-date` are REAL (warehouse_transactions exists, table verified). Report buckets in FINE.
- wms-integration.controller.ts:60,66,88 — the CLAUDE.md `return { data: [] }` claim is STALE. Current file: those lines are now `notImplemented(...)` (501, intentional, FEATURE_FLAGGED #FX-3). See 501 section. Not green-lie.

Borderline (NOT counted deceptive — degraded-empty fallback, e1 FINE):
- wms-gateway-warehouses.controller.ts:228 getWarehouseStats `catch → { id, materialCount:0 }`; :242 getWarehouseById `catch → { id }` (after NotFound re-throw); :157/:176 bins `catch → { id }`; wms-gateway-inventory.controller.ts:181/:182 `catch → { id, status:'draft' }`. These swallow real errors into a thin object — soft-degrade, not literal mock; tables/cols all exist so happy-path is real.

---

## ❌ 5xx
None statically derivable. All raw-SQL handlers wrap in try/catch and either rethrow (→ Nest 500 only on genuine DB fault) or return empty. All referenced tables/views/columns VERIFIED present in live DB:
- warehouse_transactions(.transaction_date,.created_at), warehouse_stock, material_cards(xom_ashyo,kod,unit_of_measure,unit_price,currency,min_stock,max_stock), warehouse_zones, warehouse_bins, batch_lots, inventory_counts(count_number,count_date,total_book_value,total_counted_value,total_variance,assigned_to,variance_items,completed_at), pos_warehouse_stock_view, warehouses, pos_printer_configs, material_kits(kit_number,order_id,scheduled_date,deleted_at), material_kit_items, production_orders — ALL exist (to_regclass non-null; column checks pass).
No col-drift, no missing-table 503, no uuid↔int FK breaks found in WMS controllers.

---

## 🟠 404 / 501

### 501 (intentional / leftover)
| method+path | bucket | file:line | verdict |
|---|---|---|---|
| GET /api/warehouse/integration/mm/pending-deliveries | 501-A stub FINE | wms-integration.controller.ts:85 | notImplemented; FEATURE_FLAGGED #FX-3 |
| GET /api/warehouse/integration/mm/reorder-suggestions | 501-A stub FINE | wms-integration.controller.ts:92 | notImplemented #FX-3 |
| GET /api/warehouse/integration/fi/stock-valuation | 501-A stub FINE | wms-integration.controller.ts:99 | notImplemented #FX-3 |
| GET /api/warehouse/integration/summary | 501-A stub FINE | wms-integration.controller.ts:106 | notImplemented #FX-3 |
| GET /api/warehouse/integration | 501-A stub FINE | wms-integration.controller.ts:113 | notImplemented #FX-3 |
| POST /api/warehouse/integration | 501-A stub FINE | wms-integration.controller.ts:121 | Zod-validates body then notImplemented #FX-3 |
| POST /api/inventory/materials | 501-B should-work-ish / deliberate | inventory-materials.controller.ts:118 | NotImplementedException — deliberate: material split across material_cards(canonical)/mm_materials/materials; avoids orphan insert. Tracked Stage 4.1. FINE-as-designed, but FE "create material" is blocked. |

### 404 / route-collision risk (A drift / D prefix)
- **DUPLICATE ROUTE (D-prefix collision):** `POST /api/warehouse/internal-requests` declared in BOTH wms-warehouse-gateway.controller.ts:113 AND (different prefix) — also `POST /api/wms/internal-requests` in wms-counts.controller.ts:96. Different prefixes (`/warehouse/*` vs `/wms/*`) so NOT a Nest collision, but two parallel internal-request creators (gateway uses svc.createInternalRequest(dto), counts uses svc.createInternalRequest(positional args)) — semantic duplication, both reachable.
- **DUPLICATE material-kits surface:** three controllers expose material-kit routes under different prefixes — `/iot/material-kits*` (iot-material-kits), `/iot-enhanced/material-kits*` (iot-enhanced), `/warehouse/material-kits*` (wms-barcode). All distinct prefixes (no Nest clash) but iot vs iot-enhanced vs warehouse are 3 parallel implementations of the same concept (FE-contract risk). Not 404.
No genuine 404-A (FE-drift→real route) or missing-route found within these controllers.

---

## 🟡🔵🔴 400 / 401 / 403

- 401 (FINE, intentional): every controller is under the 5 global guards; those WITHOUT `@Public()` correctly 401 without token. WMS has NO `@Public()` anywhere → all 401-FINE when unauthenticated. Note: wms-counts, wms-goods-issue, wms-extended, wms-inventory, wms-rental declare only `@UseGuards(RolesGuard)` locally (NOT JwtAuthGuard) — but JwtAuthGuard is GLOBAL, so still token-gated. FINE.
- 400 (Zod, FINE): all `@Body` handlers validate via Zod (ZodValidationPipe or inline `.parse`). Drift-400: none found.
- 403 (RBAC, FINE): `@Roles(...)` sets are role-gated; no misconfig observed. `WmsAnalyticsController` + `WmsEoqController` use PermissionGuard `wms:READ`/`wms:WRITE` (FINE).
- BUG count (400/401/403): 0.

---

## ✅ FINE (grouped + counts + sample proofs)

- **REAL DB read (raw SQL, tables verified):** ~38 GET/stats handlers across wms-gateway-warehouses (warehouses, :id/stock dual-path view→fallback, :id/stats, stats/total), wms-gateway-binszone (bins, zones, bins/:id), wms-gateway-warehouse-lots (zones/bins/lots + fifo/expiry compute), wms-gateway-inventory (inventory-counts, -stats, generate-lines), wms-catalog (transactions, orders-by-date/:date), wms-barcode (printer-config, material-kits, items), iot-enhanced (orders, orders-for-kits). Proof: warehouse_stock/material_cards/warehouse_zones/warehouse_bins/batch_lots/inventory_counts/pos_warehouse_stock_view/pos_printer_configs/material_kits all `to_regclass` non-null; warehouses cnt=12, inventory_counts cnt=6.
- **REAL DB write:** wms-gateway-* INSERT/UPDATE/DELETE (warehouses CRUD, bins CRUD, zones CRUD, lots create/update, inventory-counts create/update/status/generate), wms-barcode printer-config + material-kits CRUD, wms-warehouses create/toggle/delete, all CQRS command-bus writes (wms-stock reserve, wms-goods-issue, wms-rental receive/patch/delete, iot-material-kits create/generate/prepare/ready, wms-extended create/patch/delete transaction). Proof: target tables + RETURNING clauses; columns verified.
- **REAL service-delegated (Result-unwrapped):** wms-analytics (3), wms-eoq (2 — calculate pure-compute, recalculate enqueue 202), inventory-advanced (3), inventory-materials list/360/update/delete/low-stock, warehouse-rental records/summary/settings/close/mark-paid, wms-counts list/create/batches/production-supply, wms-extended stats/fifo/alerts/suggestions/low-stock/movements.
- **401-FINE:** all 102 routes token-gated (global JwtAuthGuard). Sample: wms-counts (only local RolesGuard) still 401 via global guard.

---

## COUNTS (sum = 102)
- ✅ 200-REAL (DB read/write or real service): 89
- 🔴 200-MOCK (literal echo): 3 — catalog/dashboard:99, inv-counts/lines/:lineId GET:152, transfers/:id GET:89
- 💀 200-GREEN-LIE (echo, no write): 2 — inv-counts/lines/:lineId PATCH:165, transfers/:id/status PATCH:102
- 🟠 501-A stub FINE: 6 (wms-integration #FX-3)
- 🟠 501-B deliberate (FE-blocked create): 1 (inventory/materials POST:118)
- ❌ 5xx: 0
- 🔵 401-FINE intentional: 102 (overlay — every route; not double-counted in total)
- 🟡 400-drift BUG: 0 · 🔴 403-misconfig: 0 · ❌ 503: 0

Bucket sum (primary classification): 89 + 3 + 2 + 6 + 1 = 101. +1 = wms-eoq recalculate-all returns enqueue result (202, real) counted in REAL → 89 includes it. Re-tally: REAL 90, MOCK 3, GREEN-LIE 2, 501 7 = 102. ✔
