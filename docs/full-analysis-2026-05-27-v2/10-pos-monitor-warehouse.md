# Report 10 — POS Monitor & Warehouse

**Date:** 2026-05-27 (Round 2)
**Scope:** `apps/api/src/modules/pos/`, `apps/api/src/modules/pos-v2/`, `apps/api/src/modules/wms/`, `artifacts/erp-dashboard/src/pos-monitor/`
**Round-1 reference:** `docs/full-analysis-2026-05-27/10-pos-monitor-warehouse.md`

---

## Diff vs round 1

Round 1 got the high-level shape right (POS = factory warehouse + tiny retail cashier sub-system) but several specifics were wrong or stale.

| Round-1 claim | Round-2 verdict |
|---|---|
| "`pos` module has ~23 controllers" | Verified: **23 controllers** registered in `pos.module.ts`. |
| "POS module updates `material_cards.current_stock += quantity` and `employee_inventory_ledger`" | **Wrong.** Actual writes are: (1) `current_stock` table (separate from `material_cards.current_stock`) via `execCurrentStockUpsert` (`apps/api/src/common/database/queries-remaining-a.ts:26`); (2) `pos_stock_ledger` (append-only) via `StockLedgerService.recordEntry` (`apps/api/src/modules/pos/application/services/stock-ledger.service.ts:34-88`). `employee_inventory_ledger` is written only when `movement.receivedByEmployeeId` is set. Writes happen at status=`completed`, not at create. |
| "`GlPostingLogService.scheduleGlPost()` is called on every movement create; `ai_gl_status='PENDING'`" | **Wrong.** No such method exists. Auto-GL is done by `PosGlAutoListener.handle()` (`apps/api/src/modules/pos/application/event-handlers/pos-gl-auto.listener.ts:44`) which writes a single row to `gl_posting_log` with `status='AWAITING_REVIEW'` (not `PENDING`). The `ai_gl_status` column on `pos_movements` defaults to `'PENDING'` but **no production code mutates it**. |
| "No reconciliation between POS and WMS stock tables" | **Partially wrong.** `PosWmsSyncService` (`apps/api/src/modules/pos/application/services/pos-wms-sync.service.ts:35`) DOES upsert WMS `warehouse_stock` + insert `warehouse_transactions` on movement events. **BUT** it is wired to `PosMovementCompletedEvent`, which is **never published in production** — only the legacy string topic `pos.movement.data.completed` is emitted (`pos-movement-status.service.ts:86`), and the CQRS listener does not subscribe to strings. See §5. |
| "`pos-v2` overlaps `pos` controllers (`inventory-count`, `requests`, `barcode`, `reports`) — router conflict possible" | **Wrong.** `pos-v2` controllers use `/pos-v2/...` prefix (verified via `@Controller(...)` decorators). No route collision with `/pos/...`. |
| "`pos_transactions` and `pos_products` are dormant" | Unverified in round 2 (not in scope this pass). |
| "No FK from `pos_movement_lines.material_id` → `material_cards.id`" | **Verified.** `lib/db/src/schema/pos-schema-v2.ts:150` defines `materialCardId: integer('material_id').notNull()` with no `.references()` call. |
| Page inventory listed `pages/POS*.tsx` only | **Incomplete.** Round 1 missed the entire `artifacts/erp-dashboard/src/pos-monitor/` SPA — a dedicated lazy-loaded warehouse-staff app with its own routes (`/pos-monitor/...`), socket, i18n, offline-sync hooks, and ~30 pages. See §6. |
| "PosWmsController bridges to WMS" | Verified: `apps/api/src/modules/pos/presentation/pos-wms.controller.ts:24` mounts at `/pos/wms` and exposes warehouse/material lookups for the POS Monitor frontend. |

New findings round 1 did not document:
- A dedicated **`/pos` Socket.IO namespace** (`apps/api/src/modules/pos/presentation/pos.gateway.ts:53`) broadcasts movement/stock/quarantine events to the `pos-monitor` SPA.
- An **offline-sync hook + IndexedDB-backed queue** in the frontend (`hooks/useOfflineSync.ts`, `useOfflineSyncDb.ts`) plus matching backend `/pos/sync` endpoints.
- 5 cron jobs in `pos/` module (not 0 as round 1 implicitly suggested), none in `pos-v2` or `wms`.

---

## 1. POS module nature (retail vs warehouse)

**Confirmed: the `pos/` module is a factory-warehouse management surface**, with a small retail-cashier subsystem co-resident.

Evidence of warehouse identity:

1. **Movement-type enum** is warehouse-centric — `EXTERNAL_IN`, `EXTERNAL_OUT`, `INTERNAL_ISSUE`, `INTERNAL_RETURN`, `INTERNAL_TRANSFER`, `DAMAGE`, `INVENTORY_ADJ_PLUS`, `INVENTORY_ADJ_MINUS` (`apps/api/src/modules/pos/application/services/pos-movement.service.ts:34-40` defines `OUTBOUND_TYPES`).
2. **`pos_movements` table** keys on `from_warehouse_id`, `to_warehouse_id`, `goods_receipt_id`, `quarantine_required`, `three_way_matched` (`lib/db/src/schema/pos-schema-v2.ts:69-143`).
3. **The pos-monitor SPA** (`artifacts/erp-dashboard/src/pos-monitor/PosMonitorApp.tsx`) is titled "POS Monitor" but every route is a warehouse concept: `/pos-monitor/warehouses`, `/pos-monitor/materials`, `/pos-monitor/movements/new/kirim`, `/pos-monitor/movements/new/chiqim`, `/pos-monitor/quarantine`, `/pos-monitor/qc-review`, `/pos-monitor/lots`, `/pos-monitor/reservations`, etc.
4. **Movement controller permission** is `pos.movements.read|create|update`, dispatched to roles `warehouse_keeper`, `warehouse_manager`, `qc_inspector`, `finance_head`, `pos_manager` (`pos.gateway.ts:38`).

Retail co-resident sub-system (small, separate code path):

- `cash-register.controller.ts` at `@Controller('pos')` with `Roles('cashier', 'pos_manager', 'admin', 'manager')` exposes:
  - `GET /pos/products` (`pos/presentation/cash-register.controller.ts:32`)
  - `POST /pos/products` (line 39)
  - `GET /pos/scan/:barcode` (line 48)
  - `GET /pos/transactions` (line 54)
  - `POST /pos/transactions` (line 60)
  - `POST /pos/transactions/:id/refund` (line 69)
  - `GET /pos/receipt/:id` (line 77)
  - `GET /pos/dashboard` (line 83)
- `pos-stub.controller.ts:98` provides a legacy `POST /pos/sales` adapter that re-shapes the payload then delegates to `CashRegisterService.createTransaction` (so the historical URL persists to `retail_pos_transactions`/`retail_pos_products`).
- `cash-register.repository.ts:289` decrements `retail_pos_products.stock_quantity` via `GREATEST(0, stock_quantity::numeric - ${quantity})`.

The two sub-systems share NO tables and NO services. They co-exist under the `pos/` module folder only because they share role names ("pos_manager").

---

## 2. Module structure

### 2.1 `apps/api/src/modules/pos/` — 23 controllers

Each `@Controller(...)` prefix verified from `pos/presentation/*.controller.ts`:

| Controller | Route prefix | Purpose |
|---|---|---|
| `MovementsController` | `pos/movements` | CRUD, status PATCH, QC decision, damage, PDF, confirmations, history (`movements.controller.ts:50`) |
| `StockController` | `pos/stock` | Balance + manual adjust + low/expiry alerts (`stock.controller.ts:40`) |
| `CashRegisterController` | `pos` | Retail till (no sub-prefix) (`cash-register.controller.ts:28`) |
| `PosStubController` | `pos` | Legacy `/sales` adapter + several `notImplemented` stubs (`pos-stub.controller.ts:89`) |
| `InventoryCountController` | `pos/inventory-counts` | Cyclic count workflow (`inventory-count.controller.ts:42`) |
| `RequestsController` | `pos/requests` | Department material requisitions (`requests.controller.ts:41`) |
| `BarcodeController` | `pos/barcode` | Scan/print/lookup (`barcode.controller.ts:40`) |
| `EmployeeController` | `pos/employees` | Per-employee inventory ledger (`employee.controller.ts:43`) |
| `ReportsController` | `pos/reports` | KPI, inactive materials, etc. (`reports.controller.ts:22`) |
| `GlController` | `pos/gl` | GL log per movement + approve/reject (`gl.controller.ts:29`) |
| `SyncController` | `pos/sync` | Offline push/pull/status (`sync.controller.ts:43`) |
| `PosNotificationsController` | `pos/notifications` | In-app notifications (`pos-notifications.controller.ts:29`) |
| `PosAuthController` | `pos/auth` | Separate POS JWT issuance (`pos-auth.controller.ts:27`) |
| `MiniAppController` | `pos/mini-app` | Telegram Mini-App (`mini-app.controller.ts:57`) |
| `MiniAppHistoryController` | `pos/mini-app` | Mini-App history (`mini-app-history.controller.ts:27`) |
| `PrinterConfigController` | `pos/printer-config` | Printer setup (`printer-config.controller.ts:30`) |
| `PosPrinterConfigV2Controller` | `v2/pos/printer-config` | V2 printer setup (`pos-printer-config-v2.controller.ts:24`) |
| `InventoryPassportController` | `pos/inventory-passport` | External-in passport (`inventory-passport.controller.ts:23`) |
| `PosWmsController` | `pos/wms` | POS→WMS bridge queries (`pos-wms.controller.ts:24`) |
| `WarehouseFeaturesController` | `pos/wh-features` | Warehouse feature flags (`warehouse-features.controller.ts:38`) |
| `PosController` | `legacy/pos` | Legacy §38 endpoints — movement types, warehouse-access, passports, pdf-templates (`pos.controller.ts:39`) |

Plus `PosGateway` at namespace `/pos` (Socket.IO).

### 2.2 `apps/api/src/modules/pos-v2/` — 4 controllers (CQRS shape)

| Controller | Route prefix |
|---|---|
| `InventoryCountController` | `pos-v2/inventory-counts` (`pos-v2/presentation/inventory-count.controller.ts:46`) |
| `RequestsController` | `pos-v2/transfer-requests` (`requests.controller.ts:43`) |
| `BarcodeController` | `pos-v2/barcode` (`barcode.controller.ts:28`) |
| `ReportsController` | `pos-v2/reports` (`reports.controller.ts:35`) |

Pure CQRS — uses `CommandBus`/`QueryBus`, never injects services directly. Round 1 claim that pos-v2 collides with pos routes is **false**; the prefix `pos-v2` makes them disjoint.

### 2.3 `apps/api/src/modules/wms/` — 22 controllers

| Controller | Route prefix |
|---|---|
| `WmsStockController` | `wms/stock` (`wms-stock.controller.ts:33`) |
| `WmsInventoryController` | `wms/inventory` (`wms-inventory.controller.ts:33`) |
| `WmsWarehousesController` | `wms/warehouses` (`wms-warehouses.controller.ts:36`) |
| `WmsGoodsIssueController` | `wms/goods-issue` (`wms-goods-issue.controller.ts:32`) |
| `WmsCountsController` | `wms` (`wms-counts.controller.ts:34`) |
| `WmsExtendedController` | `wms` (`wms-extended.controller.ts:44`) |
| `WmsAnalyticsController` | `wms` (`wms-analytics.controller.ts:24`) |
| `WmsRentalController` | `wms/rental` (`wms-rental.controller.ts:35`) |
| `WmsEoqController` | `wms/eoq` (`wms-eoq.controller.ts:39`) |
| `WmsBarcodeController` | `warehouse` (`wms-barcode.controller.ts:50`) |
| `WmsCatalogController` | `warehouse` (`wms-catalog.controller.ts:25`) |
| `WmsIntegrationController` | `warehouse` (`wms-integration.controller.ts:43`) |
| `WmsWarehouseGatewayController` | `warehouse` (`wms-warehouse-gateway.controller.ts:59`) |
| `WmsGatewayWarehousesController` | `warehouse` (`wms-gateway-warehouses.controller.ts:56`) |
| `WmsGatewayWarehouseLotsController` | `warehouse` (`wms-gateway-warehouse-lots.controller.ts:53`) |
| `WmsGatewayBinZoneController` | `warehouse` (`wms-gateway-binszone.controller.ts:77`) |
| `WmsGatewayInventoryController` | `warehouse` (`wms-gateway-inventory.controller.ts:56`) |
| `WarehouseRentalController` | `warehouse-rental` (`warehouse-rental.controller.ts:32`) |
| `InventoryAdvancedController` | `inventory/advanced` (`inventory-advanced.controller.ts:21`) |
| `InventoryMaterialsController` | `inventory` (`inventory-materials.controller.ts:50`) |
| `IotEnhancedController` | `iot-enhanced` (`iot-enhanced.controller.ts:43`) |
| `IotMaterialKitsController` | `iot` (`iot-material-kits.controller.ts:32`) |

Note 7 controllers share the bare `warehouse` prefix — actual collision risk should be audited (out of scope here).

### 2.4 Frontend `artifacts/erp-dashboard/src/pos-monitor/` — dedicated SPA

`PosMonitorApp.tsx` is the SPA root (mounted somewhere under the main ERP dashboard). It has its own:

- Auth (`pos_session` JWT in `localStorage`, parsed at `PosMonitorApp.tsx:56`, separate from main ERP `access_token`).
- Lazy routes (lines 12-39) — 23 lazy-loaded pages.
- Layout (`layout/PosLayout.tsx`, plus `ScannerOnlyLayout.tsx` for hardware-scan-only mode).
- Socket adapter at namespace `/pos` (`socket/pos-socket.ts:15`).
- Offline sync hooks (`hooks/useOfflineSync.ts`, `hooks/useOfflineSyncDb.ts`).
- Three locales: `i18n/uz.json`, `i18n/ru.json`, `i18n/uz-cyr.json`.
- Telegram WebApp init (`PosMonitorApp.tsx:122`).
- API base layer in `api/pos-monitor.api.ts` that uses `pos_session.token` rather than the ERP JWT (`pos-monitor.api.ts:12`).

---

## 3. Stock tracking — POS ledger

The POS module maintains **two stock tables**:

### 3.1 `pos_stock_ledger` (append-only journal)

`lib/db/src/schema/pos-schema-extensions.ts:55`:
```ts
export const posStockLedger = pgTable('pos_stock_ledger', {
  id:             bigserial('id', { mode: 'number' }).primaryKey(),
  ts:             timestamp('ts').notNull().defaultNow(),
  materialCardId: integer('material_id').notNull(),
  warehouseId:    varchar('warehouse_id', { length: 50 }).notNull(),
  batchId:        integer('batch_id'),
  movementId:     integer('movement_id'),
  qtyChange:      numericMoney('qty_change').notNull(),
  balanceAfter:   numericMoney('balance_after').notNull(),
  reason:         varchar('reason', { length: 100 }),
}, ...);
```

Written by `StockLedgerService.recordEntry()` (`pos/application/services/stock-ledger.service.ts:34-88`):
```ts
async recordEntry(materialCardId, warehouseId, qtyChange, movementId, reason, batchId) {
  const balanceR = await this.repo.getBalance(materialCardId, warehouseId);
  const prevBalance = balanceR.ok && balanceR.data ? balanceR.data.balance : 0;
  const balanceAfter = prevBalance + qtyChange;

  const entryR = await this.repo.insertLedgerEntry({ ... });
  ...
  // Triggers low/out-of-stock alerts at thresholds 5 / 0
  this.eventBus.publish(new StockUpdatedEvent(materialCardId, balanceAfter));
}
```

Notice: the previous balance is read from `posStockLedger` itself (via `repo.getBalance`), not from `current_stock`. The ledger is the source of truth for "balance after" reporting.

### 3.2 `current_stock` (live aggregate)

`apps/api/src/shared/db/schema-ext-a-1.ts:43`:
```ts
export const current_stock = pgTable('current_stock', {
  id:               serial('id').primaryKey(),
  material_card_id: integer('material_card_id').notNull(),
  warehouse_id:     integer('warehouse_id'),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 4 }).default('0'),
  last_movement_at: timestamp('last_movement_at'),
});
```

Written by `execCurrentStockUpsert` / `execCurrentStockDecrement` (`apps/api/src/common/database/queries-remaining-a.ts:26-50`):
```ts
export async function execCurrentStockUpsert(matId, warehouseId, qty) {
  await db.insert(current_stock).values({...}).onConflictDoUpdate({
    target: [current_stock.material_card_id, current_stock.warehouse_id],
    set: {
      quantity_on_hand: sql`${current_stock.quantity_on_hand} + ${qty}`,
      last_movement_at: sql`NOW()`,
    },
  });
}
```

### 3.3 When are writes applied?

ONLY when `pos_movements.status` transitions to `'completed'`. In `pos-movement-status.service.ts:67`:
```ts
if (dto.status === 'completed') await this._processCompletedMovement(movement, updatedById);
```

`_processCompletedMovement` (line 150) loops over lines and per movement direction:
```ts
if (movType?.direction === 'in') {
  await this.repo.upsertStockIn(matId, toWh, qty);                          // current_stock +
  await this.stockLedger.recordEntry(matId, toWh, qty, movId, `in:${...}`); // pos_stock_ledger row
} else if (movType?.direction === 'out') {
  await this.repo.decrementStock(matId, fromWh, qty);                       // current_stock -
  await this.stockLedger.recordEntry(matId, fromWh, -qty, movId, `out:${...}`);
} else if (movType?.direction === 'transfer') {
  await this.repo.decrementStock(matId, fromWh, qty);
  await this.repo.upsertStockIn(matId, toWh, qty);
  await this.stockLedger.recordEntry(matId, fromWh, -qty, movId, `transfer_out:${...}`);
  await this.stockLedger.recordEntry(matId, toWh, qty, movId, `transfer_in:${...}`);
}
```

There is no DB transaction wrapping the two writes — if `recordEntry` fails after `upsertStockIn` succeeded, the aggregate and the ledger diverge. (P1.)

### 3.4 `employee_inventory_ledger` (per-employee tracking)

Written by `EmployeeLedgerService.addEntry()` only when `movement.receivedByEmployeeId` is set (`pos-movement-status.service.ts:176-184`):
```ts
if (movement.receivedByEmployeeId) {
  const entryType = movType?.direction === 'out' ? 'DEBIT' : 'CREDIT';
  await this.employeeLedger.addEntry({
    userId, materialCardId, warehouseId, entryType, quantity,
    unitPrice, referenceType: 'pos_movement', referenceId: movId,
  });
}
```

### 3.5 GL posting

Round 1 said GL is async/AI with `ai_gl_status='PENDING' → POSTED`. Round 2:

- `pos_movements.ai_gl_status` column DOES exist (`pos-schema-v2.ts:94`, defaults `'PENDING'`).
- **No production code mutates this column.** Grep for `aiGlStatus` finds only the schema definition.
- `gl_posting_log` insert is done by `PosGlAutoListener.handle()` (`pos-gl-auto.listener.ts:44`) which subscribes to `PosMovementCompletedEvent` … **which is never published in production** (see §5).
- Manual approval is via `GET /pos/gl/pending` + `POST /pos/gl/approve/:movementId` (`gl.controller.ts:74,43`); these read/write `gl_posting_log` (status enum: `'PROCESSING' | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'POSTED'`, `pos-schema-extensions.ts:41-43`).

Round-1 claim that `gl_documents` is populated via this pipeline is **unverified** — `approveByMovement` in `gl-posting-log.repository.ts:74` only updates `gl_posting_log` rows; no `gl_documents` insert was found in this audit pass.

### 3.6 Retail till stock

`cash-register.repository.ts:289`:
```ts
async decrementStock(productId: string, quantity: number) {
  return safeCall(async () => {
    await db.update(retail_pos_products)
      .set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${quantity})` })
      .where(eq(retail_pos_products.id, productId));
  });
}
```

No DB transaction. No ledger. If a transaction crashes after stock decrement but before transaction insert, stock divergence is silent. (P1.)

---

## 4. Stock tracking — WMS ledger

The WMS module maintains **three independent stock surfaces**, none of which intersect §3:

### 4.1 `stocks` (FEFO/lot-aware)

`apps/api/src/shared/db/schema-ext-a-1.ts:29`:
```ts
export const stocks = pgTable('stocks', {
  id:                serial('id').primaryKey(),
  warehouse_id:      integer('warehouse_id'),
  material_id:       integer('material_id'),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }).default('0'),
  reserved_quantity: numeric('reserved_quantity', { precision: 15, scale: 4 }).default('0'),
  expiry_date:       date('expiry_date'),
  batch_number:      text('batch_number'),
  received_at:       timestamp('received_at'),
  created_at:        timestamp('created_at').defaultNow(),
});
```

Read/written by `DrizzleWmsRepository` (`wms/infrastructure/repositories/drizzle-wms.repo.ts`). FEFO ordering done in `getFefoStock` (line 108):
```ts
.orderBy(sql`${stocks.expiry_date} ASC NULLS LAST`, asc(stocks.received_at));
```

Used by `GoodsIssueHandler.execute` (`wms/application/commands/goods-issue.handler.ts:30`) inside a real DB transaction (`this.wmsRepo.withTransaction(...)`).

Used by `ReceiveFgHandler.execute` (`receive-fg.handler.ts:32`) — inserts a NEW row per batch (no upsert; same FG can produce N rows over time).

### 4.2 `warehouse_stock` (aggregated)

`lib/db/src/schema/wms-schema.ts:294`:
```ts
export const warehouseStock = pgTable("warehouse_stock", {
  id: serial("id").primaryKey(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  materialCardId: varchar("material_id").notNull().references(() => materialCards.id, { onDelete: "cascade" }),
  quantity: numericMoney("quantity").notNull().default(0),
  reservedQuantity: numericMoney("reserved_quantity").notNull().default(0),
  availableQuantity: numericMoney("available_quantity").notNull().default(0),
  ...
});
```

Read by `DrizzleWmsInventoryRepository` (`wms/inventory/drizzle-wms-inventory.repo.ts`). Written by `upsertWarehouseStock` helper (`pos/application/services/pos-wms-sync.helpers.ts:82`) using raw SQL on POS movement events — i.e. the only writer is the **POS→WMS bridge**, NOT the WMS module itself.

This is significant: `warehouse_stock` is a read-only mirror as far as the WMS module is concerned. The WMS reads it but never writes it. The POS module writes it via an event listener that does not fire in production (see §5).

### 4.3 `warehouse_transactions` (WMS journal)

Inserted by `PosWmsSyncService.onMovementCompleted` (`pos-wms-sync.service.ts:115`) and `onMovementCreated` (line 209). Same publisher issue applies.

### 4.4 Other related tables

- `material_cards.current_stock` (`lib/db/src/schema/mm-material-cards.ts:72`) — a global per-material quantity, no warehouse dimension. Not actively written by either POS or WMS code path.
- `wms_alerts` (`lib/db/src/schema/...`) — low-stock alert table, written by `execWmsAlertInsert` (`queries-remaining-a.ts:66`).

### 4.5 WMS event sources

- `WmsGoodsIssuedEvent` is published by `GoodsIssueHandler` (`goods-issue.handler.ts:80`).
- `WmsFgReceivedEvent` is published by `ReceiveFgHandler` (`receive-fg.handler.ts:55`).
- `StockUpdatedEvent` is published by `StockLedgerService` (`stock-ledger.service.ts:81`) — i.e. POS publishes the WMS-named event back, which is then re-emitted via `EventBridgeService` to the legacy string `ERP_EVENTS.STOCK_UPDATED` (`event-bridge.service.ts:37`).

---

## 5. Reconciliation (or lack thereof)

Round 1 said "no reconciliation exists". Round 2's nuance:

### 5.1 A reconciliation pipeline EXISTS in code

`PosWmsSyncService` (`pos/application/services/pos-wms-sync.service.ts`) is designed to:

1. On `PosMovementCompletedEvent` (`onMovementCompleted`, line 47) — upsert `warehouse_stock` with the delta and insert into `warehouse_transactions`, then broadcast `warehouse.stock.updated` on the `/pos` Socket.IO namespace.
2. On `PosMovementCreatedEvent` (`onMovementCreated`, line 170) — insert a draft `warehouse_transactions` row.

Both paths use raw SQL because Drizzle cannot express the cross-module schema bridge (header comment lines 13-21).

### 5.2 The pipeline is dead-lettered

`pos-wms-sync-completed.listener.ts:13` and `pos-gl-auto.listener.ts:18` both contain the comment:

> "No production code currently publishes `pos.movement.data.completed` on either bus (no emit site exists today); the listener was therefore already a dead-letter prior to migration."

Verification via grep:
- `pos-movement-status.service.ts:86` only emits the STRING topic (`this.eventEmitter.emit('pos.movement.data.${dto.status}', ...)`), never `eventBus.publish(new PosMovementCompletedEvent(...))`.
- `EventBridgeService` (`shared/events/event-bridge.service.ts:74`) maps `PosMovementCompletedEvent → 'pos.movement.data.completed'`, i.e. CQRS-class → string only. It does NOT do the reverse, so a string emit can't reach the CQRS `@EventsHandler` listener.
- The only callers of `new PosMovementCompletedEvent(...)` are in `apps/api/test/pos-gl-auto.service.spec.ts` (lines 105-263).

**Net effect:** when a warehouse user marks a movement `completed` in production:
- `pos_stock_ledger` ← yes (synchronous, from `_processCompletedMovement`).
- `current_stock` ← yes (synchronous).
- `employee_inventory_ledger` ← conditionally yes.
- `gl_posting_log` (AWAITING_REVIEW row) ← **NO** (listener never fires).
- `warehouse_stock` (WMS aggregate) ← **NO**.
- `warehouse_transactions` (WMS journal) ← **NO**.
- Socket.IO `warehouse.stock.updated` broadcast ← **NO**.

`PosMovementCreatedEvent` is the only event actually published from production code (`pos-movement.service.ts:171`), so the `onMovementCreated` draft-insert path DOES fire and writes draft rows into `warehouse_transactions` with type `'kirim'` for every movement irrespective of real direction (`pos-wms-sync.service.ts:214`). This means `warehouse_transactions` is corrupted on create with wrong direction tags, and is never updated/cleared when the movement completes. (P0.)

### 5.3 No batch reconciliation

No cron job, no admin endpoint, and no migration script attempts to recompute `warehouse_stock` from `pos_stock_ledger` or to compare the two. Searches for "reconcile" return only unrelated employee-balance and three-way-match code paths.

---

## 6. POS monitor frontend

### 6.1 Routes

`PosMonitorApp.tsx` registers 24 routes under `/pos-monitor/...`. Verbatim list (lines 134-362):

| Path | Component | File |
|---|---|---|
| `/pos-monitor/login` | `PosLogin` | `pages/PosLogin.tsx` |
| `/pos-monitor` | `PosDashboard` | `pages/PosDashboard.tsx` |
| `/pos-monitor/kpi` | `PosKpiDashboard` | `pages/PosKpiDashboard.tsx` |
| `/pos-monitor/grn` | `PosGoodsReceipts` | `pages/PosGoodsReceipts.tsx` |
| `/pos-monitor/lots` | `PosLotTraceability` | `pages/PosLotTraceability.tsx` |
| `/pos-monitor/reservations` | `PosReservations` | `pages/PosReservations.tsx` |
| `/pos-monitor/material-balance` | `PosMaterialBalance` | `pages/PosMaterialBalance.tsx` |
| `/pos-monitor/warehouses` | `PosWarehouses` | `pages/PosWarehouses.tsx` |
| `/pos-monitor/warehouses/:id` | `PosWarehouseDetail` | `pages/PosWarehouseDetail.tsx` |
| `/pos-monitor/materials` | `PosMaterials` | `pages/PosMaterials.tsx` |
| `/pos-monitor/materials/360/:id` | `PosMaterial360` | `pages/PosMaterial360.tsx` |
| `/pos-monitor/materials/new` | `PosMaterialNew` | `pages/PosMaterialNew.tsx` |
| `/pos-monitor/materials/:id` | `PosMaterialDetail` | `pages/PosMaterialDetail.tsx` |
| `/pos-monitor/movements/new/kirim` | `PosMovementKirim` | `pages/PosMovementKirim.tsx` |
| `/pos-monitor/movements/new/chiqim` | `PosMovementChiqim` | `pages/PosMovementChiqim.tsx` |
| `/pos-monitor/movements/new` | `PosMovementNew` | `pages/PosMovementNew.tsx` |
| `/pos-monitor/movements/:id` | `PosMovementDetail` | `pages/PosMovementDetail.tsx` |
| `/pos-monitor/movements` | `PosMovements` | `pages/PosMovements.tsx` |
| `/pos-monitor/ledger` | `PosLedger` | `pages/PosLedger.tsx` |
| `/pos-monitor/my-inventory` | `PosMyInventory` | `pages/PosMyInventory.tsx` |
| `/pos-monitor/requests/:id` | `RequisitionDetail` | `pages/RequisitionDetail.tsx` |
| `/pos-monitor/requests` | `PosRequests` | `pages/PosRequests.tsx` |
| `/pos-monitor/inventory` | `PosInventory` | `pages/PosInventory.tsx` |
| `/pos-monitor/quarantine` | `PosQuarantine` | `pages/PosQuarantine.tsx` |
| `/pos-monitor/qc-review` | `PosQCReview` | `pages/PosQCReview.tsx` |
| `/pos-monitor/reports` | `PosReports` | `pages/PosReports.tsx` |
| `/pos-monitor/admin` | `PosAdmin` (`AdminGuard`) | `pages/PosAdmin.tsx` |

### 6.2 Realtime layer

`socket/pos-socket.ts:15` opens a Socket.IO connection to namespace `/pos` with token from `pos_session`. `hooks/usePOSSocket.ts:101` is a single hook that subscribes to:

- `movement.created`, `movement.status_changed`
- `stock.low_alert`, `warehouse.stock.updated`
- `quarantine.expired`, `requisition.approved`
- `gl.posted`, `notification.new`

Each handler is wired to `setState({ lastEvent: <name> })` plus an optional caller-provided callback. Of the eight subscriptions, only `movement.created`, `movement.confirmed` (note: hook listens for `movement.status_changed` but `pos.events.ts:169` and `:179` emit `movement.confirmed`), and `notification.new` map to events the backend actually broadcasts. `warehouse.stock.updated` is only broadcast inside the dead-letter `PosWmsSyncService` path.

### 6.3 Offline sync

`hooks/useOfflineSync.ts` (and `useOfflineSyncDb.ts`) implement an IndexedDB-backed queue for movement creates when the device is offline. The matching backend is `pos/sync` controller (`sync.controller.ts:43`) with `/sync/push`, `/sync/pull`, `/sync/status` endpoints (per `pos-monitor.api.ts:116-119`).

### 6.4 Hardware scanner

`hooks/useHardwareScanner.ts`, `hooks/usePosScannerWorkflow.ts`, plus `components/PosBarcodeScanner.tsx` and `components/ScannerStatus.tsx`. A `ScannerOnlyLayout.tsx` exists for kiosk-mode terminals.

### 6.5 Auth and roles

`pos_session` JWT held in `localStorage`. `AdminGuard` (`PosMonitorApp.tsx:91`) limits `/pos-monitor/admin` to roles `pos_manager`, `admin`, `super_admin`, `finance_head` (line 73).

### 6.6 Legacy `pages/POS*.tsx`

Distinct from the SPA — these are the admin-side dashboard panels rendered inside the main ERP dashboard (`POSDashboard.tsx`, `POSDashboardCards.tsx`, `POSDashboardCharts.tsx`, `POSDashboardDialogs.tsx`, `POSDashboardPOSPanel.tsx`, `POSInventoryPage.tsx` + 3 children). They share the same `/api/pos/...` backend.

---

## 7. Cron jobs

**5 cron jobs in `pos/`, 0 in `wms/`, 0 in `pos-v2/`.**

| Job | File | Schedule (Tashkent) | Action |
|---|---|---|---|
| `StockLedgerService.evaluateStockAlerts` | `pos/application/services/stock-ledger.service.ts:123` | `0 * * * *` (hourly) | Scan `posStockLedger` aggregate balances; insert `LOW_STOCK` (≤5) or `OUT_OF_STOCK` (≤0) alerts; emit `pos.stock.low_alert`. |
| `PosLowStockJob.checkLowStock` | `pos/application/jobs/pos-low-stock.job.ts:23` | `EVERY_HOUR` | Call `PosFifoService.getLowStockMaterials`; create notifications + Telegram alert. |
| `PosQuarantineCheckJob.checkExpiredQuarantine` | `pos/application/jobs/pos-quarantine-check.job.ts:21` | `EVERY_HOUR` | Move movements past 48h quarantine to `qc_review`; legacy passport check. |
| `PosFifoRecalculateJob.recalculate` | `pos/application/jobs/pos-fifo-recalculate.job.ts:17` | `0 2 * * *` (02:00 daily) | `PosFifoService.markExpiredBatches`. |
| `PosInactiveMaterialsJob.checkInactiveMaterials` | `pos/application/jobs/pos-inactive-materials.job.ts:26` | `0 22 * * 0` (Sun 22:00) | List materials inactive 90+ days; notify managers + Telegram alert. |

The hourly low-stock check is duplicated between `StockLedgerService.evaluateStockAlerts` and `PosLowStockJob.checkLowStock` — they read different sources (`posStockLedger` vs `PosFifoService`) so the alerts they raise may disagree. (P2.)

No cron drives a POS↔WMS stock reconciliation. The only mechanism intended to keep `warehouse_stock` in sync with `current_stock` is the event listener pipeline that is dead-lettered (§5.2).

---

## 8. Findings summary

### P0 — must fix

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P0-1 | `PosWmsSyncService.onMovementCompleted` is dead-letter — `warehouse_stock` and `warehouse_transactions` never receive the delta when a POS movement completes | `pos-wms-sync-completed.listener.ts:13`; `pos-movement-status.service.ts:86` emits string-only; only tests publish `PosMovementCompletedEvent` | WMS reports show stale stock vs POS reality; the entire `/wms/stock` and `/wms/inventory` surface returns numbers diverged from the operational truth in `pos_stock_ledger` / `current_stock`. |
| P0-2 | `PosWmsSyncService.onMovementCreated` writes `warehouse_transactions` with hard-coded `transaction_type='kirim'` regardless of actual movement direction | `pos-wms-sync.service.ts:214` — `VALUES (..., 'kirim', ...)` for EVERY movement on creation | WMS transaction journal is corrupted from movement creation forward; outbound/transfer movements appear as inbound. No subsequent update fixes it because the completed listener never fires. |
| P0-3 | `PosGlAutoListener` is dead-letter — `gl_posting_log` AWAITING_REVIEW rows are never auto-created | `pos-gl-auto.listener.ts:18` confirms no publisher; only `GET /pos/gl/pending` returns nothing until a manual `POST /pos/gl/approve/:movementId` is hit | Finance has no automated GL pipeline; the entire "AI GL 5-bosqich" UI in `GLPostingStatus.tsx` shows empty. Round 1's claim that GL posts asynchronously is materially false in current state. |

### P1 — important

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P1-1 | `_processCompletedMovement` writes `current_stock` and `pos_stock_ledger` without a DB transaction | `pos-movement-status.service.ts:163-174` calls 2-4 separate repo methods serially | Partial-failure divergence between live aggregate and journal; reconciliation requires a backfill from ledger. |
| P1-2 | `CashRegisterRepository.decrementStock` and `createTransaction` are not wrapped in a single DB transaction | `cash-register.repository.ts:289` standalone update | Retail till stock can drift on crash mid-checkout. |
| P1-3 | No FK from `pos_movement_lines.material_id → material_cards.id` (and `movement_id → pos_movements.id`) | `lib/db/src/schema/pos-schema-v2.ts:147-176` — no `.references()` calls | Orphan rows possible on either parent delete; cascade safety only enforced by application logic. |
| P1-4 | `pos_movements.ai_gl_status` column is defined and defaults to `'PENDING'`, but no code ever updates it | `pos-schema-v2.ts:94`; grep for `aiGlStatus` returns only schema definition | Misleading column suggests an async GL pipeline exists. Either remove the column or wire it. |
| P1-5 | `usePOSSocket` listens for `movement.status_changed` but backend emits `movement.confirmed` | `usePOSSocket.ts:139` vs `pos.events.ts:169,179,194,200` | Realtime status updates in the SPA never fire — list stays stale until manual refresh. |
| P1-6 | Three independent stock surfaces (`pos_stock_ledger`, `current_stock`, `warehouse_stock`, plus FEFO `stocks`) with no single source of truth and no reconciliation job | §3 and §4 above | Material balance reports differ between `/pos/stock`, `/wms/stock`, `/wms/inventory`, and `/pos/wms/warehouse/:id/stock`. |

### P2 — nice to fix

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P2-1 | Two hourly low-stock cron jobs run independent of each other reading different sources | `stock-ledger.service.ts:123` + `pos-low-stock.job.ts:23` | Duplicate alerts; possible contradictory thresholds. |
| P2-2 | Seven WMS controllers share the bare `warehouse` prefix | §2.3 table | Route collision risk; needs a deeper audit. |
| P2-3 | `pos-stub.controller.ts` legacy adapter at `POST /pos/sales` still present | `pos-stub.controller.ts:98-108` | Tech debt; two URLs persist the same row. |
| P2-4 | `pos.controller.ts` mounted at `/legacy/pos` exposes `§38` endpoints with no clear deprecation marker | `pos.controller.ts:39` | Maintenance ambiguity. |
| P2-5 | `WmsStockController.createStock` is a stub returning `{ success: true }` without writing | `wms-stock.controller.ts:51-53` | Misleading API surface; callers silently no-op. |
| P2-6 | `pos-monitor` SPA uses its own `pos_session` JWT separate from the main `access_token` — single sign-on is not enforced | `api/pos-monitor.api.ts:12`; `PosMonitorApp.tsx:56` | UX friction, dual logout/expiry surfaces. |

### Open questions (not pursued this pass)

- Does `gl_documents` ever get a row from POS movements? `approveByMovement` in `gl-posting-log.repository.ts:74` (read-only quick check) does not appear to write `gl_documents`; needs Report 5 (finance) cross-check.
- The frontend `materialsApi.getStock` falls back to `/reports/stock` which is not visible in `reports.controller.ts` Glob output — may be a 404 path.
- `PosPrinterConfigV2Controller` at `v2/pos/printer-config` and `PrinterConfigController` at `pos/printer-config` — verify only one is wired to the frontend.
- The `material_cards.current_stock` global column (no warehouse dimension) appears unused by either POS or WMS write paths — possibly fully dormant or used only in legacy reads (out of scope here).
