# Report 12 — Inventory, Materials & Stock

**Date:** 2026-05-27 (v2 pass)
**Scope:** material_cards, raw_materials, stock movements, current_stock mutations,
min/max alerts, stock-take, UOM/categories, frontend.
**Modules audited:** `apps/api/src/modules/{mm, wms, pos, remaining}`,
`lib/db/src/schema/{mm-*, wms-schema, pos-schema-v2, core/core-rules}.ts`,
`artifacts/erp-dashboard/src/pages/`.

---

## Diff vs round 1

Round-1 report at `docs/full-analysis-2026-05-27/12-inventory-materials-stock.md`.

Key changes / corrections after re-verification:

| Round-1 claim | Round-2 finding |
|---|---|
| `min_stock_alerts.materialCardId` is **varchar** referencing serial `material_cards.id` | **FIXED.** It is now `integer("material_id")` with explicit comment `// FK type fix: materialCards.id is serial (integer), was incorrectly declared varchar` (`mm-material-cards.ts:126`). |
| `consumption_suggestions.materialCardId` is varchar (mismatch) | **FIXED** to `integer("material_id")` (`mm-material-cards.ts:162`). |
| `material_batches.materialCardId` is varchar | **FIXED** to `integer("material_id")` (`mm-material-cards.ts:193`). |
| `goods_receipt_lines.materialCardId` is varchar | **FIXED** to `integer("material_id")` (`mm-purchase.ts:119`). |
| 12 POS-schema tables miss `.references(...)` to `material_cards.id` | **STILL TRUE.** Verified on all 12 — `pos_movement_lines:150`, `pos_material_request_lines:206`, `employee_issuance_log:224`, `employee_inventory_ledger:243`, `employee_write_off_act_lines:291`, `employee_liability_cases:306`, `production_material_allocs:338`, `pos_stock_reservations:370`, `pos_serial_number_items:393`, `pos_inventory_count_lines:441`, `pos_barcode_print_queue:484`, `pos_damage_qc_links:509` — none has `.references()`. |
| Round-1 claimed the type mismatch was limited to `min_stock_alerts` / `consumption_suggestions` | **STILL PRESENT in other tables** that round 1 missed: `warehouse_stock:297`, `material_barcodes:245`, `picking_tasks:466`, `cycle_count_results:506`, `pos_inventory_passport.*`, `qc_inspections:74,297`, `fi-payroll-ext.ts:158`, `mm-batch-mgmt.ts:35`, `mm-inventory.ts:245`. The type mismatch is **NOT fixed cross-tree** — round 1 under-stated the scope but newer files were patched. |
| PosMovementService updates `current_stock` manually | **PARTIAL.** `PosMovementService.createMovement` itself never touches `material_cards.current_stock`. The actual mutation happens in `PosWarehouseIntegrationMovementService.refreshMaterialCurrentStock` (`pos-warehouse-integration-movement.service.ts:152-163`) which **is** wrapped in `db.transaction(...)` at line 52. But `PosMovementService.createMovement` itself is NOT in a transaction — insertMovement and insertLines are two separate non-transactional calls. |
| `material_cards.current_stock` updated without transaction | **PARTIALLY true.** Compatibility movement path (`pos-warehouse-integration-movement.service.ts`) DOES use transactions. CQRS Material aggregate `addStock`/`consumeStock`/`reserve` paths happen in-memory only — persistence is by `MmMaterialRepository.update(material)` which is a single statement. DrizzleWmsRepository `reserveMaterial` and `issueGoods` loop FEFO rows updating each WITHOUT a transaction (`drizzle-wms.repo.ts:129-190`). |
| `raw_materials.current_stock` updated separately | **TRUE.** Confirmed — `raw_materials` table exists alongside `material_cards`. Schemas are entirely separate; no service synchronises the two. |
| No units master table | **WRONG.** `unit_of_measures` table DOES exist (`core/core-rules.ts:12`) with code/name/conversionFactor. However `material_cards.unitOfMeasure` and `raw_materials.unit` are free-text varchars — they do NOT reference `unit_of_measures`. So the table exists but is not used as a true master. |
| No material categories table | **WRONG.** `material_categories` exists (`mm-batch-mgmt.ts:80`), and the live DB has extended columns (`name_ru, code, parent_id, sort_order, is_active`) that the Drizzle definition does NOT model. Schema drift. |

Net delta: P0-09 (varchar↔integer FK mismatch on min_stock_alerts specifically) is **CLOSED for that table**. But the broader class of varchar→serial-integer FK references is still alive in ~25 other tables. The 12 POS-schema-v2 tables still have NO FK constraints at all (looser problem than type mismatch). Round 1 conflated "missing FK" and "type-mismatched FK" — they are distinct.

---

## 1. FK type mismatches

### 1.1 The pos-schema-v2 case: no FK at all (12 tables)

Source: `lib/db/src/schema/pos-schema-v2.ts`. Every `material_id` column is `integer` (matching the type of `material_cards.id serial`), but NONE has a `.references()` clause:

```ts
// pos-schema-v2.ts:147-176 — pos_movement_lines
export const posMovementLines = pgTable('pos_movement_lines', {
  id:                  serial('id').primaryKey(),
  movementId:          integer('movement_id').notNull(),
  materialCardId:      integer('material_id').notNull(),   // ← no .references()
  ...
}, (t) => [
  index('idx_pos_mv_lines_movement').on(t.movementId),
  index('idx_pos_mv_lines_material').on(t.materialCardId),
  index('idx_pos_mv_lines_batch').on(t.batchId),
]);
```

Identical pattern in:
| Table | Line | TS column | DB column |
|---|---|---|---|
| `pos_movement_lines` | 150 | `materialCardId` | `material_id` |
| `pos_material_request_lines` | 206 | `materialCardId` | `material_id` |
| `employee_issuance_log` | 224 | `materialCardId` | `material_id` |
| `employee_inventory_ledger` | 243 | `materialCardId` | `material_id` |
| `employee_write_off_act_lines` | 291 | `materialCardId` | `material_id` |
| `employee_liability_cases` | 306 | `materialCardId` | `material_id` |
| `production_material_allocs` | 338 | `materialCardId` | `material_id` |
| `pos_stock_reservations` | 370 | `materialCardId` | `material_id` |
| `pos_serial_number_items` | 393 | `materialCardId` | `material_id` |
| `pos_inventory_count_lines` | 441 | `materialCardId` | `material_id` |
| `pos_barcode_print_queue` | 484 | `materialCardId` | `material_id` |
| `pos_damage_qc_links` | 509 | `materialCardId` | `material_id` |

All 12 use the right column TYPE (`integer`) so they would silently accept an integer FK constraint. Adding one is a one-line change per table. The risk today is orphaned movement lines if a material is hard-deleted.

### 1.2 The varchar-vs-integer mismatch (still live)

These tables declare `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` while `materialCards.id` is `serial("id").primaryKey()` (integer):

| File | Line | Table | Column |
|---|---|---|---|
| `wms-schema.ts` | 297 | `warehouse_stock` | `materialCardId: varchar("material_id").notNull().references(() => materialCards.id, { onDelete: "cascade" })` |
| `wms-schema.ts` | 466 | `picking_tasks` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |
| `wms-schema.ts` | 506 | `cycle_count_results` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |
| `mm-batch-mgmt.ts` | 35 | `stockReservations` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |
| `mm-inventory.ts` | 245 | `material_barcodes` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |
| `qc-schema.ts` | 74, 297 | `qc_inspections`, `qc_*` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |
| `fi-payroll-ext.ts` | 158 | `payroll_material_*` | `materialCardId: varchar("material_id").references(() => materialCards.id, ...)` |

For each: at Drizzle build/migration time the FK SQL becomes
`FOREIGN KEY (material_id) REFERENCES material_cards(id)`, which PostgreSQL will reject (or silently coerce on insert depending on the column type in the migration). The Drizzle TypeScript types also mismatch — TS thinks the FK target is `string`, but at runtime it is `number`.

`warehouse_stock.materialCardId` is the most consequential — it's the canonical per-warehouse balance table queried by `mm-materials-extras.repository.ts:44-49`:

```ts
... LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity
              FROM warehouse_stock GROUP BY material_card_id) ws
    ON ws.material_card_id = mc.id ...
```

Postgres has to coerce text-vs-int silently on every aggregate — performance penalty + risk of index miss.

### 1.3 Recent fixes (round 2 verified)

`mm-material-cards.ts:126,162,193` and `mm-purchase.ts:119` are all now `integer("material_id")` with explicit comments:

```ts
// mm-material-cards.ts:125-126
// FK type fix: materialCards.id is serial (integer), was incorrectly declared varchar
materialCardId: integer("material_id").references(() => materialCards.id, { onDelete: "cascade" }).notNull(),
```

The fix pattern is now well-established; the rest of the codebase has not been swept.

---

## 2. material_cards vs raw_materials

Two parallel entities exist. Both are `serial("id").primaryKey()`.

### 2.1 `material_cards` (`mm-material-cards.ts:60-107`)

Canonical, richer model:
- 30 columns including `kod`, `xom_ashyo`/`xom_ashyo_ru`, `unit_of_measure`, `category`, paper-specific (`format_a`, `format_b`, `grammage`), stock columns (`current_stock`, `reserved_stock`, `available_stock`), reorder fields (`min_stock`, `max_stock`, `reorder_point`), pricing (`unit_price`, `currency`, `last_purchase_price`), vendor link (`vendorId`), and **a back-link `rawMaterialId: varchar("raw_material_id").references(() => rawMaterials.id, ...)`** at line 87.
- Note: `rawMaterialId` itself is **varchar referencing serial integer** → another type mismatch on the link between the two entities.
- CHECK constraints: `material_cards_type_chk`, `material_cards_abc_chk`, `material_cards_stock_chk` (current_stock >= 0), `material_cards_reserved_chk`.

### 2.2 `raw_materials` (`mm-raw-materials.ts:19-48`)

Simpler procurement-era entity:
- 14 columns: `code`, `name`, `name_ru`, `category`, `unit`, `minimum_stock`, `current_stock`, `unit_price`, `vendor_id`, `warehouse_id`.
- Strict CHECK constraints: `raw_materials_category_chk` (only `'paperboard','glue','ink','packaging','other'`), `raw_materials_unit_chk` (only `'kg','meter','liter','piece','roll','box'`).
- These constraints are stricter than `material_cards` (which has free-text `category` and `unit_of_measure`).

### 2.3 Service ownership

| Module | Uses | Evidence |
|---|---|---|
| `mm-materials-extras.repository.ts` | Both — falls back from `material_cards` if `raw_materials` empty | Line 18-38 (`listRawMaterials` then `listRawMaterialsFallback`) |
| `purchase_order_items` (mm-purchase.ts:35) | `raw_materials.id` (FK) | `rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id, ...)` |
| `goods_receipt_items` (mm-purchase.ts:162) | `raw_materials.id` (FK) | Same |
| `goods_issue_items` (mm-purchase.ts:222) | `raw_materials.id` (FK) | Same |
| `purchase_requisitions` (mm-raw-materials.ts:121) | integer materialId (no FK) | `materialId: integer("material_id").notNull()` — no `.references()` |
| `goods_receipt_lines` (mm-purchase.ts:119) | `material_cards.id` (FK, integer) | The newer/canonical receipt-line shape |
| POS layer | `material_cards.id` exclusively | All 12 pos-schema tables |
| WMS layer | `material_cards.id` (via `warehouse_stock`) | But varchar FK type mismatch |
| MM material aggregate (`material.aggregate.ts`) | `id: string` | DDD model uses string ids — does not match either DB type cleanly |

### 2.4 Sync code

**There is none.** Searching for code that reads `raw_materials.current_stock` AND `material_cards.current_stock` in the same transaction returned no hits. They drift independently:
- `goods_receipt_items` flow → mutates `raw_materials` (via legacy)
- `pos_movements` flow → mutates `material_cards.current_stock` via `refreshMaterialCurrentStock` (`pos-warehouse-integration-movement.service.ts:152`)
- ROP trigger (`rop-trigger.handler.ts:126-132`) only reads `material_cards.current_stock` — treats it as "single source of truth for inventory position" (per docstring at line 126).

So the two entities co-exist with no reconciliation. Whichever service writes last "wins" for that table only.

---

## 3. current_stock mutation paths

Every place that writes `current_stock` (`material_cards` or `raw_materials`), and whether it is inside a transaction.

### 3.1 `PosWarehouseIntegrationMovementService.refreshMaterialCurrentStock` — TX YES

`apps/api/src/modules/compatibility/pos-warehouse-integration-movement.service.ts:152-163`:

```ts
private async refreshMaterialCurrentStock(tx: Tx, materialCardId: number): Promise<void> {
  await tx.execute(sql`
    UPDATE material_cards
    SET current_stock = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM warehouse_stock
      WHERE material_card_id = ${materialCardId}
    ),
    updated_at = NOW()
    WHERE id = ${materialCardId}
  `);
}
```

This is called from `executeMovement(tx, dto)` (line 89-93) inside `db.transaction(async (tx) => ...)` at line 52. **GOOD** — transactional, derives from `warehouse_stock`, and avoids drift by recomputing the sum rather than incrementing.

### 3.2 `decreaseFromWarehouseStock` / `increaseToWarehouseStock` — TX YES

Same file, lines 124-150. Both run inside the same `db.transaction` wrapper. Use `ON CONFLICT (warehouse_id, material_card_id) DO UPDATE` for idempotency on receipt:

```ts
ON CONFLICT (warehouse_id, material_card_id) DO UPDATE
SET quantity = warehouse_stock.quantity + EXCLUDED.quantity,
    available_quantity = warehouse_stock.available_quantity + EXCLUDED.quantity,
    last_updated_at = NOW()
```

### 3.3 `PosMovementService.createMovement` — TX NO

`apps/api/src/modules/pos/application/services/pos-movement.service.ts:57-181`:
- Calls `this.repo.insertMovement(...)` (line 140) — single statement
- Calls `this.addLines(movement.id, ...)` (line 159) which calls `this.repo.insertLines(values)` — single statement
- Calls `this.repo.updateMovementStatus(...)` (line 174) if `dto.submit`
- Each call is a separate non-transactional `db.insert`/`db.update`.

`PosMovementRepository.insertMovement` (`pos-movement.repository.ts:56-63`):

```ts
async insertMovement(movRow: Omit<typeof posMovements.$inferInsert, 'id'>): Promise<Result<PosMovement>> {
  try {
    const [movement] = await db.insert(posMovements).values(movRow).returning();
    return Ok(movement);
  } ...
}
```

Bare `db.insert` — no tx parameter, no `db.transaction`. **If `addLines` fails after `insertMovement` succeeds, the movement header exists without any lines.**

### 3.4 `DrizzleWmsRepository.reserveMaterial` / `issueGoods` — TX NO

`apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms.repo.ts:129-190`:

```ts
async reserveMaterial(materialId, warehouseId, amount): Promise<Result<void>> {
  try {
    const rows = await queryFefoStock(materialId, warehouseId);
    let remainingAmount = amount;
    for (const row of rows) {
      if (remainingAmount <= 0) break;
      const available = Number(row['quantity']) - Number(row['reserved_quantity']);
      const toReserve = Math.min(available, remainingAmount);
      if (toReserve > 0) {
        await execUpdateStockReserved(row['id'], Number(row['reserved_quantity']) + toReserve);
        // ^ one bare UPDATE per row, no transaction
        remainingAmount -= toReserve;
      }
    }
    ...
  }
}
```

`execUpdateStockReserved` (`apps/api/src/common/database/queries-wms.ts:41-43`):

```ts
export async function execUpdateStockReserved(id: unknown, newReserved: number): Promise<void> {
  await db.update(stocks).set({ reserved_quantity: String(newReserved) }).where(eq(stocks.id, id as number));
}
```

If FEFO reserves four rows and the third UPDATE crashes, the first two commits stand and the function returns Err — partial reservation, no rollback. **P1**.

`issueGoods` (line 150-190) has the same loop pattern — same problem.

`withTransaction` exists on this repo at line 76-85 but **is not used by `reserveMaterial` or `issueGoods`**. There's no caller that wraps them in a tx either (grep shows none).

### 3.5 `ErpRepository.updateProduct` / `deleteProduct` — TX NO

`apps/api/src/modules/erp/erp.repository.ts:36,140`:

```ts
const r = await exec(sql`UPDATE material_cards
  SET name = COALESCE(${body.name ?? null}, name), unit = COALESCE(${body.unit ?? null}, unit),
      min_stock = COALESCE(${body.minStock ?? null}, min_stock), updated_at = NOW()
  WHERE id = ${id} RETURNING *`);
```

These are single-statement, naturally atomic, so no tx needed — but note they update business columns (`min_stock`) without auditing.

### 3.6 `Material` aggregate `addStock`/`consumeStock` — IN-MEMORY ONLY

`apps/api/src/modules/mm/domain/aggregates/material.aggregate.ts:159-191`:

```ts
addStock(quantity: number): Result<void> {
  if (!Number.isFinite(quantity) || quantity <= 0) return Err(...);
  this._currentStock += quantity;
  this._updatedAt = new Date();
  this.addDomainEvent(new MaterialStockAddedEvent(this._id, quantity, this._currentStock));
  return Ok();
}
```

Mutates only in-memory state. Persistence relies on a follow-up `repository.save(material)` which the searched callers DON'T do under a transaction. `UpdateMaterialHandler` (`update-material.handler.ts`) constructs a new `Material` then calls `materialRepository.update(updated)` — a single update statement.

### 3.7 Summary table

| Caller | File | Line | TX? | Risk |
|---|---|---|---|---|
| `PosWarehouseIntegrationMovementService.executeMovement` | pos-warehouse-integration-movement.service.ts | 52, 89 | YES | OK |
| `PosMovementService.createMovement` | pos-movement.service.ts | 57 | NO | Header without lines |
| `PosMovementRepository.insertMovement` | pos-movement.repository.ts | 56 | NO | as above |
| `DrizzleWmsRepository.reserveMaterial` | drizzle-wms.repo.ts | 129 | NO | Partial reservation |
| `DrizzleWmsRepository.issueGoods` | drizzle-wms.repo.ts | 150 | NO | Partial issue |
| `DrizzleWmsRepository.receiveFg` | drizzle-wms.repo.ts | 192 | NO | Single statement, OK |
| `Material.addStock/.consumeStock` | material.aggregate.ts | 159, 175 | N/A in-mem | Persist may not match |
| `UpdateMaterialHandler.execute` | update-material.handler.ts | 24 | NO | OK (single update) |
| `ErpRepository.updateProduct` | erp.repository.ts | 34 | NO | OK (single update) |
| `ErpRepository.deleteProduct` | erp.repository.ts | 138 | NO | OK (single update, soft delete) |
| `RopTriggerHandler.checkAndTrigger` | rop-trigger.handler.ts | 110 | NO (only reads + 1 insert CTE) | OK |
| `GoodsReceiptRepository.approve` | goods-receipt.repository.ts | 154 | NO | OK (single update) |

**Verdict:** the round-1 worry is partially over-stated (the canonical path is wrapped in `db.transaction`), but two real risks remain: (a) `PosMovementService.createMovement` is NOT transactional, and (b) the WMS reservation/issue FEFO loop is not transactional. Both are P1.

---

## 4. Stock movements

### 4.1 Table inventory

| Table | File:line | Purpose | Material FK | TX? |
|---|---|---|---|---|
| `pos_movements` | pos-schema-v2.ts:69 | Header — all stock motion | n/a | n/a |
| `pos_movement_lines` | pos-schema-v2.ts:147 | Line items | `integer`, no FK | depends |
| `material_movements` | mm-batch-mgmt.ts:161 | Production-time movements | `varchar("material_id")` → `rawMaterials.id` (serial) — **mismatch** | n/a |
| `warehouse_transactions` | wms-schema.ts:245 | WMS transaction log | `integer("material_id")` → `materialCards.id` — correct | n/a |
| `warehouse_stock` | wms-schema.ts:294 | Per-warehouse balance | **varchar mismatch** | depends |
| `stocks` | (compat-5 wms_stock) | Legacy stock table used by `DrizzleWmsRepository` | integer | NO |
| `goods_receipts` | mm-purchase.ts:70 | GR header | n/a | NO (just approve()) |
| `goods_receipt_lines` | mm-purchase.ts:115 | GR lines (modern, material_cards FK, integer) | integer FK | NO |
| `goods_receipt_items` | mm-purchase.ts:159 | Legacy GR items (raw_materials FK) | integer FK | NO |
| `goods_issues` | mm-purchase.ts:187 | GI header | n/a | NO |
| `goods_issue_items` | mm-purchase.ts:219 | GI items | integer FK → raw_materials | NO |
| `stock_movement_gl_postings` | wms-schema.ts:542 | GL postings of stock changes | `varchar("material_id")`, no FK | NO |
| `material_batches` | mm-material-cards.ts:189 | Batch tracking per material | `integer("material_id")` → materialCards.id — **fixed** | N/A |
| `batches` | mm-material-cards.ts:17 | Production batches | references products | N/A |
| `inventory_movements` | NOT FOUND | round-1 referenced this — does not exist as Drizzle pgTable | — | — |
| `stock_movements` | NOT FOUND | round-1 referenced this — does not exist | — | — |
| `inventoryCounts` | mm-inventory.ts:65 | Count headers | `integer materialId` (single-material count) | NO |
| `inventoryCountLines` | mm-inventory.ts:126 | Count lines | `integer materialId` → rawMaterials | NO |
| `posInventoryCounts` | pos-schema-v2.ts:416 | POS count headers | n/a | NO |
| `posInventoryCountLines` | pos-schema-v2.ts:438 | POS count lines | `integer materialId`, no FK | NO |
| `cycleCountResults` | wms-schema.ts:502 | Cycle counts | varchar mismatch | NO |

The "inventory_movements" table claim in round 1 is **wrong** — that name does not appear in the Drizzle schema. The closest analogues are `pos_movements`/`pos_movement_lines`, `material_movements`, and `warehouse_transactions`. This is one of three duplicate ledgers.

### 4.2 Three-way data path

For a single goods receipt the same logical event can land in:
1. `goods_receipts` + `goods_receipt_lines` (FK material_cards, integer)
2. `pos_movements` + `pos_movement_lines` (FK material_cards via index only, no constraint)
3. `warehouse_transactions` (FK material_cards, integer — looks correct)
4. `material_movements` (FK raw_materials, varchar — type mismatch)
5. `stock_movement_gl_postings` (no FK, varchar)
6. `posMovementService.repo.insertDamageQcLink` → `pos_damage_qc_links`

No invariant ensures any two of these are kept in sync. The `PosWarehouseIntegrationMovementService` is the most coherent — it writes `material_movements`, then updates `warehouse_stock`, then recomputes `material_cards.current_stock` — all inside one transaction.

---

## 5. Min/max stock alerts

### 5.1 `min_stock_alerts` table (`mm-material-cards.ts:123-151`)

Now fully-typed correctly. PK `serial`, FK `materialCardId: integer("material_id").references(() => materialCards.id, { onDelete: "cascade" }).notNull()`.

Columns:
- `alertType`: `'min_stock' | 'expiring' | 'zero_stock' | 'price_change' | 'reorder'` (CHECK at line 149)
- `severity`: `'warning' | 'critical'` (CHECK at line 150)
- `currentStock`, `minStock`, `deficit` (numericMoney)
- Workflow: `isAcknowledged`, `acknowledgedBy: integer→users.id` (also fixed type), `isResolved`, `resolvedAt`
- Telegram delivery flag: `telegramSent`, `telegramSentAt`
- Indexes on `materialCardId`, `severity`, `isResolved`, `createdAt`

### 5.2 Who writes these alerts?

Grep for `insert(minStockAlerts)` returned **only one hit** — and it is in `apps/api/src/shared/db/invariants/migrations-drift.ts` (a tooling/check file, not a service). **There is no service code that inserts into `min_stock_alerts`.** The table exists but no producer writes to it.

The actual ROP/min-stock workflow is `RopTriggerHandler` (`apps/api/src/modules/wms/infrastructure/event-handlers/rop-trigger.handler.ts`) — which on `StockUpdatedEvent` inserts into `mm_purchase_requisitions` (creating a PR) but **does not write to `min_stock_alerts`**. So the alerting table is dead/orphaned schema. **P1.**

### 5.3 Alert query path (frontend)

`material-balance.repository.ts:24-29` exposes "alerts" by inline computation on `material_cards`:

```ts
async getAlerts(): Promise<Result<Row[]>>  {
  return exec(sql`
    SELECT mc.id, mc.kod, ..., mc.current_stock, mc.min_stock
    FROM material_cards mc
    LEFT JOIN warehouses w ON w.id = mc.warehouse_id
    WHERE mc.is_active = true
      AND (mc.current_stock < mc.min_stock OR mc.current_stock <= 0)
    ORDER BY mc.current_stock ASC
  `);
}
```

So the UI reads `material_cards` directly, never `min_stock_alerts`. This is a strong signal that `min_stock_alerts` should either be deprecated or wired into the writer side.

---

## 6. Stock-take / cycle count

### 6.1 Two parallel implementations

**A. POS-side inventory count** (`pos_inventory_counts`, `pos_inventory_count_lines`)
- Service: `PosInventoryCountService` (`apps/api/src/modules/pos/application/services/pos-inventory-count.service.ts`)
- Workflow: `createCount` → snapshot `system_qty` → operators record `actualQty` → `approveCount` → `_applyGlAdjustments` creates `INVENTORY_ADJ_PLUS/MINUS` movements via `PosMovementService.createMovement`
- TX boundaries: `createCount` (line 54-109) does 4 sequential DB operations (`createCount`, `snapshotStock`, `startCount`, `audit log`) without a `db.transaction` wrapper. If `snapshotStock` fails, count header is created in DRAFT and the warehouse is not properly locked.

**B. WMS-side cycle count** (`cycle_count_results`)
- Schema: `wms-schema.ts:502` — `materialCardId: varchar("material_id")` (FK type mismatch)
- Service: `WmsCountsService` (`apps/api/src/modules/wms/application/wms-counts.service.ts`) — thin wrapper, delegates to repo
- DTOs at `wms/presentation/dto/wms-counts.dto.ts`
- Generic `cycle_count_results` table has fields: `systemQuantity`, `countedQuantity`, `variance`, `variancePercent`, `adjustmentAction` (`'AUTO_ADJUST' | 'SUPERVISOR_APPROVE' | 'RECOUNT' | 'NONE'`), `glPosted`
- Frontend page: `InventoryCount.tsx`

**C. Generic** `inventory_counts` + `inventory_count_lines` (`mm-inventory.ts:65, 126`)
- Header has both `materialId: integer` (single-material count case) and lines for multi-line counts
- Used by frontend `WMSDashboard.tsx` via `/api/warehouse/inventory-counts`

So there are **three count systems**: POS, WMS, and the generic `inventory_counts`. The frontend `InventoryCount.tsx` page calls `/api/warehouse/inventory-counts` — likely the generic one. `PosInventoryCountsPage.tsx` exists separately for the POS workflow.

### 6.2 GL posting

`PosInventoryCountService._applyGlAdjustments` (line 178 onwards) iterates variance lines and per-line calls `movementService.createMovement(...)` — N+1 movements + lack of outer TX means a partial GL post is possible.

---

## 7. Material categories & UOM

### 7.1 `material_categories` (`mm-batch-mgmt.ts:80-86`)

Drizzle definition is thin:
```ts
export const materialCategories = pgTable("material_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: varchar("icon", { length: 50 }),
  unit: varchar("unit", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Drift:** the migration SQL (`apps/api/src/shared/db/migrations/pos-warehouse-integration.sql:31`) writes additional columns that are NOT in the Drizzle definition:
```sql
INSERT INTO material_categories (name, name_ru, code, parent_id, sort_order, is_active)
```

So the live DB schema has `name_ru, code, parent_id, sort_order, is_active` while Drizzle only models 5 columns. This is **schema drift (P1)** — TS code reading the table will not see those columns at all, and inserts via Drizzle will fail if `is_active NOT NULL` was added.

`material_cards.category` is `varchar(30)` free-text — no FK to `material_categories`. The relationship is by string match (`c.name = mc.category` in `mm-materials-extras.repository.ts:44`).

### 7.2 `unit_of_measures` (`core/core-rules.ts:12-22`)

```ts
export const unitOfMeasures = pgTable("unit_of_measures", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 30 }).notNull(),
  baseUnitId: varchar("base_unit_id").references((): AnyPgColumn => unitOfMeasures.id, { onDelete: "set null" }),  // ← self-ref, varchar→serial mismatch
  conversionFactor: numericMoney("conversion_factor").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This is a proper UOM master with conversion factors, but:
1. `baseUnitId` is `varchar` referencing self (serial id) → another type mismatch
2. NO table references `unit_of_measures.id`/`.code`. Every `unit_of_measure`/`unit`/`uom` column elsewhere is free-text varchar (e.g. `material_cards.unitOfMeasure`, `raw_materials.unit`, `pos_movement_lines.unit`)

So both master tables exist but are orphaned. Round 1's "no master tables" claim is wrong on existence but correct on usage — they're effectively dead. **P2**: wire `material_cards.unit_of_measure` and `category` to the master tables.

### 7.3 Strict CHECK constraints partially compensate

`raw_materials_unit_chk` (`mm-raw-materials.ts:47`) restricts `unit` to `'kg','meter','liter','piece','roll','box'` — but `material_cards.unit_of_measure` has NO such CHECK and the migration's seed data uses `'sht','kg','m'` etc.

---

## 8. Frontend integration

### 8.1 Page inventory

Material/stock pages in `artifacts/erp-dashboard/src/pages/`:

| Page | Purpose | Backend |
|---|---|---|
| `MaterialBalance.tsx` | Overview + alerts + internal requests + production stock | `/api/material-balance/*` → `MaterialBalanceRepository` |
| `MaterialBalanceSections.tsx` | Tab content (overview, alerts) | — |
| `MaterialBalanceTables.tsx` | Requests + production tables | — |
| `MaterialBalanceDialogs.tsx` | Add-movement dialog | mutations into `/api/material-balance/movement` |
| `MaterialCardsPage.tsx` | CRUD on `material_cards` | `/api/mm/material-cards` |
| `RawMaterialsPage.tsx` | CRUD on `raw_materials` | `/api/mm/raw-materials` |
| `MaterialsAccounting.tsx` + Dialogs/Sections/Panels | Material accounting | — |
| `WMSMaterials.tsx` | WMS material list with Material360 detail card | `/api/wms/materials` |
| `WMSDashboard.tsx` + Alerts/Sections/Dialogs | WMS overview | `/api/wms/dashboard` |
| `WMSExtended.tsx` + Sections/Sections2/Dialogs | WMS power-user view | — |
| `WmsAnalytics.tsx` + Sections/TableSections | Analytics on movements | — |
| `InventoryValuation.tsx` | Per-material valuation report | `/api/wms/inventory-valuation` |
| `InventoryCount.tsx` | Generic stock-take session UI | `/api/warehouse/inventory-counts` |
| `PosInventoryCountsPage.tsx` | POS-side count UI | `/api/pos/inventory-counts` |
| `PosStockPage.tsx` | POS stock view | `/api/pos/stock` |
| `PosWarehousePage.tsx` + Sections/Dialogs | POS warehouse view | — |
| `BarcodeWarehouse.tsx` | Barcode-driven warehouse ops | `/api/wms/barcode/*` |
| `BarcodeScanner.tsx`, `BarcodeSystem.tsx` + Sections/Dialogs | Barcode scanning | — |
| `EmployeeInventory.tsx` | Per-employee issuance ledger | `/api/employee-inventory` |
| `StockReservation.tsx` | Manage `pos_stock_reservations` | `/api/pos/stock-reservations` |
| `WarehouseHub12StockOpsTab.tsx` | Hub stock ops tab | — |
| `MMDashboard.tsx` | MM module dashboard | `/api/mm/dashboard` |
| `MMExtended.tsx` + Tabs/FleetTabs/Dialogs | MM extended views | — |
| `MMPurchaseOrders.tsx` + Dialogs | PO management | — |
| `MMVendors.tsx` + Dialogs/FormFields | Vendor master | — |

### 8.2 React Query keys (samples)

From `MaterialBalance.tsx`:
- `["/api/material-balance/overview"]`
- `["/api/material-balance/alerts"]`
- `["/api/material-balance/internal-requests"]`
- `["/api/material-balance/production"]`

From `InventoryCount.tsx`:
- `["/api/warehouse/inventory-counts-stats"]`
- `["/api/warehouse/inventory-counts", { status, warehouseId }]`
- `["/api/warehouse/warehouses"]`
- `["/api/users"]`

### 8.3 Missing master-data pages

Round 1 was right that there are no first-class "Units" or "Material Categories" CRUD pages. The thin `materialCategories` table is just used for seed/lookup; no UI manages it.

### 8.4 Drift between FE shape and BE schema

`MaterialBalanceTypes.tsx` defines `MovementForm` with `{material, quantity, type}` where `type: "kirim" | "chiqim" | ...`. The backend `pos_movements.movementType` is a Postgres enum with values `EXTERNAL_IN | EXTERNAL_OUT | INTERNAL_ISSUE | ...`. The FE form uses Uzbek (`kirim`/`chiqim`) which only `warehouse_transactions.transactionType` accepts (CHECK at `wms-schema.ts:277`). So this dialog targets the legacy `warehouse_transactions` write path, not the canonical POS movements. Confirms multi-ledger reality.

---

## 9. Findings summary

### P0
None. The pure `min_stock_alerts.materialCardId` type-mismatch claim from round 1 is fixed.

### P1
1. **F12-01: Missing FK constraints on 12 POS-schema tables.** All `material_id integer` columns in `pos-schema-v2.ts` lack `.references(() => materialCards.id)`. Orphan rows possible if a material card is hard-deleted. Tables listed in §1.1.
2. **F12-02: varchar↔serial type mismatch persists in ≥10 tables.** `warehouse_stock`, `picking_tasks`, `cycle_count_results`, `material_barcodes`, `qc_inspections`, `stockReservations`, `fi-payroll-ext.payroll_material_*`, and self-ref on `unit_of_measures.baseUnitId`. Drizzle migration generates FK SQL that PG silently coerces; index plans on join paths suffer. Fix follows same pattern as `min_stock_alerts` patch.
3. **F12-03: `PosMovementService.createMovement` is non-transactional.** Separate `insertMovement` and `insertLines` calls (`pos-movement.service.ts:140, 159` → `pos-movement.repository.ts:56, 74`). Partial header without lines possible on crash. Fix: wrap in `db.transaction` and thread `tx` through repository methods.
4. **F12-04: WMS FEFO reserve/issue loops not transactional.** `DrizzleWmsRepository.reserveMaterial` and `.issueGoods` loop over rows with one bare UPDATE each (`drizzle-wms.repo.ts:129-190`). Partial reservation on failure. The `withTransaction` helper exists on the same class but isn't used here. Fix: route through `withTransaction` with a single-tx executor.
5. **F12-05: `min_stock_alerts` table has no producer.** Schema exists but no service writes to it (only the `migrations-drift.ts` tooling file references the table). The frontend reads alerts directly from `material_cards`. Either wire alerts into `RopTriggerHandler` (currently writes only `mm_purchase_requisitions`) or remove the table.
6. **F12-06: `material_categories` Drizzle ↔ live-DB drift.** Drizzle has 5 columns; migration writes `name_ru, code, parent_id, sort_order, is_active`. Production reads via Drizzle will see undefined for those columns; inserts will fail any new NOT NULL.
7. **F12-07: Dual `current_stock` source-of-truth.** `material_cards.current_stock` (POS path) and `raw_materials.current_stock` (procurement path) diverge silently. No service reads both transactionally. `RopTriggerHandler` declares `material_cards` as canonical (`rop-trigger.handler.ts:126` docstring) but procurement still writes to `raw_materials`.

### P2
8. **F12-08: `material_cards.available_stock` is stored, not computed.** Column exists alongside `current_stock` and `reserved_stock` (`mm-material-cards.ts:72-74`). Either drop and compute as a view, or maintain via DB trigger.
9. **F12-09: `unit_of_measures` master orphaned.** Table exists with conversion factors but no FK references it. `material_cards.unit_of_measure` and `raw_materials.unit` are free-text. `raw_materials_unit_chk` covers raw materials only.
10. **F12-10: `material_categories` orphaned (lookup-only).** Joined by name match (`c.name = mc.category`) rather than FK; no UI to maintain it.
11. **F12-11: `material_cards.rawMaterialId` is varchar→serial mismatch.** The back-link between the two material entities is itself type-mismatched (`mm-material-cards.ts:87`). Same with `material_cards.vendorId`, `material_cards.warehouseId` — all `varchar` to `serial` PKs.
12. **F12-12: Three parallel inventory-count systems.** `pos_inventory_counts`, `cycle_count_results`, `inventory_counts` — different schemas, different services, separate frontend pages. Consolidation work needed.

### P3
13. **F12-13: `PosInventoryCountService.createCount` non-transactional.** 4 sequential DB ops (create, snapshot, startCount, audit) — if any fail, count is in inconsistent DRAFT state.
14. **F12-14: `material_cards.unitOfMeasure` lacks CHECK.** `raw_materials_unit_chk` enforces a closed set on `raw_materials`; `material_cards` accepts any string. Causes inconsistent units across tables.
15. **F12-15: `MaterialBalanceDialogs` movement form targets legacy `warehouse_transactions` (kirim/chiqim) instead of canonical POS movement.** Type-pollution: FE knows two enums but uses only the older one.

---

## Cross-references

- Report 02 (database-schema-overview) — sets the baseline for serial-PK convention
- Report 03 (db-drift-and-duplicates) — catalogues the broader varchar↔serial FK drift; this report's F12-02 is a domain-scoped subset
- Report 13 (procurement & vendors) — should cover `raw_materials`/`purchase_orders` overlap with this report's F12-07
- Report 17 (POS) — owns the full POS movement / lifecycle workflows (this report covered only the stock-mutation surfaces)
