# Report 12: Inventory, Materials & Stock

**Date:** 2026-05-27  
**Critical investigation: `material_id` vs `material_card_id` column drift**

---

## 1. Module Overview

Material management spans two modules:
- `apps/api/src/modules/mm/` — Material Management (material cards, raw materials, vendors, purchase orders)
- `apps/api/src/modules/wms/` — Warehouse Management (stock ledger, bins, zones, transactions)
- `apps/api/src/modules/pos/` — POS module owns `pos_movement_lines` which also references materials

The canonical material entity is `material_cards` table (`lib/db/src/schema/mm-material-cards.ts`). A separate `raw_materials` table (`mm-raw-materials.ts`) is a **distinct entity** — it predates material cards and is used in procurement/production contexts.

---

## 2. Page/Screen Inventory

| Page file | Purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/MaterialBalance.tsx` | Stock balance per material/warehouse |
| `artifacts/erp-dashboard/src/pages/MaterialBalanceSections.tsx` | Section layout |
| `artifacts/erp-dashboard/src/pages/MaterialBalanceTables.tsx` | Balance table |
| `artifacts/erp-dashboard/src/pages/MaterialBalanceDialogs.tsx` | Stock adjustment dialog |
| `artifacts/erp-dashboard/src/pages/MMDashboard.tsx` | MM module dashboard |
| `artifacts/erp-dashboard/src/pages/MMExtended.tsx` | Extended MM views (fleet, MRO) |
| `artifacts/erp-dashboard/src/pages/InventoryValuation.tsx` | Valuation report |
| `artifacts/erp-dashboard/src/pages/InventoryCount.tsx` | Physical count session |
| `artifacts/erp-dashboard/src/pages/BarcodeWarehouse.tsx` | Barcode lookup |
| `artifacts/erp-dashboard/src/pages/EmployeeInventory.tsx` | Per-employee issuance ledger |

Backend controllers (`apps/api/src/modules/mm/presentation/`):
- `mm-material-cards.controller.ts` — CRUD for material cards
- `mm-materials.controller.ts` — material list + search
- `mm-raw-materials.controller.ts` — raw materials CRUD
- `mm-purchase-orders.controller.ts` — PO management
- `mm-vendors-pr.controller.ts` — vendor management
- `mm-goods.controller.ts` — goods receipt
- `mm-dashboard.controller.ts` — MM dashboard data

Backend controllers (`apps/api/src/modules/wms/presentation/`):
- `wms-inventory.controller.ts` — stock queries
- `wms-stock.controller.ts` — stock balance
- `wms-goods-issue.controller.ts` — goods issue
- `wms-counts.controller.ts` — inventory count
- `wms-catalog.controller.ts` — warehouse catalog
- `wms-warehouses.controller.ts` — warehouse CRUD
- `inventory-materials.controller.ts` — material inventory view

---

## 3. Critical: `material_id` vs `material_card_id` Analysis

### Finding: Column Name Drift Confirmed

The Drizzle schema uses **TypeScript property name** `materialCardId` mapped to **DB column name** `material_id`:

```typescript
// lib/db/src/schema/pos-schema-v2.ts:~100
export const posMovementLines = pgTable('pos_movement_lines', {
  ...
  materialCardId: integer('material_id').notNull(),  // <-- TS: materialCardId, DB: material_id
  ...
});
```

This same pattern appears in multiple tables:

| Table | Drizzle TS property | DB column name | References |
|---|---|---|---|
| `pos_movement_lines` | `materialCardId` | `material_id` | No FK constraint |
| `pos_material_request_lines` | `materialCardId` | `material_id` | No FK constraint |
| `employee_issuance_log` | `materialCardId` | `material_id` | No FK constraint |
| `employee_inventory_ledger` | `materialCardId` | `material_id` | No FK constraint |
| `employee_write_off_act_lines` | `materialCardId` | `material_id` | No FK constraint |
| `employee_liability_cases` | `materialCardId` | `material_id` | No FK constraint |
| `production_material_allocs` | `materialCardId` | `material_id` | No FK constraint |
| `pos_stock_reservations` | `materialCardId` | `material_id` | No FK constraint |
| `pos_serial_number_items` | `materialCardId` | `material_id` | No FK constraint |
| `pos_inventory_count_lines` | `materialCardId` | `material_id` | No FK constraint |
| `pos_barcode_print_queue` | `materialCardId` | `material_id` | No FK constraint |
| `pos_damage_qc_links` | `materialCardId` | `material_id` | No FK constraint |
| `material_card_suggestions` | n/a | `created_material_card_id` | No FK |
| `min_stock_alerts` | `materialCardId` | `material_id` | `references(() => materialCards.id)` (**varchar** cast issue) |
| `consumption_suggestions` | `materialCardId` | `material_id` | `references(() => materialCards.id)` (**varchar** cast issue) |
| `material_batches` | `materialCardId` | `material_id` | `references(() => materialCards.id)` |
| `goods_receipt_lines` | `materialCardId` | `material_id` | `references(() => materialCards.id)` |

**Root cause:** All tables in `pos-schema-v2.ts` use `integer('material_id').notNull()` without a `.references()` call. The intent (confirmed by the TS alias `materialCardId`) is to reference `material_cards.id`, but the FK constraint is missing. This is an application-level convention, not enforced by the DB.

Tables in `mm-material-cards.ts` and `mm-purchase.ts` do add proper `.references(() => materialCards.id)` but with a **type mismatch**: `material_cards.id` is `serial` (integer), yet some referencing columns use `varchar`. Example:
- `min_stock_alerts.materialCardId` is `varchar` but references `materialCards.id` (integer serial) → type mismatch in Drizzle.

---

## 4. `material_cards` Table

**File:** `lib/db/src/schema/mm-material-cards.ts`

**PK:** `id serial("id").primaryKey()` — integer serial, NOT uuid.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Integer auto-increment |
| `kod` | varchar(50) UNIQUE NOT NULL | Internal code |
| `xom_ashyo` | text NOT NULL | Material name (Uzbek) |
| `xom_ashyo_ru` | text | Russian name |
| `unit_of_measure` | varchar(20) NOT NULL | kg, dona, m2, rlon, etc. |
| `category` | varchar(30) | qogoz, kley, plastina, boshqa |
| `format_a`, `format_b` | numericMoney | Paper format dimensions |
| `grammage` | numericMoney | Grams (for paper) |
| `current_stock` | numericMoney DEFAULT 0 | Current inventory balance |
| `reserved_stock` | numericMoney DEFAULT 0 | Reserved quantity |
| `available_stock` | numericMoney DEFAULT 0 | current - reserved |
| `min_stock`, `max_stock`, `reorder_point` | numericMoney | Inventory control levels |
| `unit_price` | numericMoney | Standard cost |
| `currency` | varchar(10) DEFAULT 'UZS' | |
| `last_purchase_price` | numericMoney | Latest purchase price |
| `vendor_id` | varchar → vendors.id | Preferred vendor |
| `raw_material_id` | varchar → raw_materials.id | Link to procurement entity |
| `warehouse_id` | varchar → warehouses.id | Primary warehouse |
| `material_type` | varchar(30) DEFAULT 'raw_material' | raw_material / chemical / consumable / spare_part / packaging |
| `abc_segment` | varchar(1) DEFAULT 'C' | ABC analysis |
| `barcode` | varchar(100) | |
| `is_active` | boolean DEFAULT true | |

---

## 5. `raw_materials` Table — Separate Entity

**File:** `lib/db/src/schema/mm-raw-materials.ts`

**PK:** `id serial("id").primaryKey()` — integer serial.

`raw_materials` is a **separate, older entity** used primarily in procurement (`purchase_order_items`, `goods_receipt_items`, `goods_issue_items`) and production (`production_order_components`). It has a simpler structure than `material_cards` (no format, grammage, ABC segment, etc.).

`material_cards.raw_material_id` links back to `raw_materials` — they represent the same physical material from two different angles. This dual-entity design is a recognized debt item.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `code` | varchar(50) UNIQUE | SKU |
| `name` | text NOT NULL | |
| `category` | varchar(50) NOT NULL | paperboard / glue / ink / packaging / other |
| `unit` | varchar(20) NOT NULL | kg / meter / liter / piece / roll / box |
| `minimum_stock` | numericMoney | |
| `current_stock` | numericMoney | |
| `unit_price` | numericMoney | |
| `vendor_id` | varchar → vendors.id | |
| `warehouse_id` | varchar → warehouses.id | |
| `is_active` | boolean | |

---

## 6. Stock Movement Tables (Exact Names)

| Table | File | Direction |
|---|---|---|
| `pos_movements` | pos-schema-v2.ts | Header for all stock movements |
| `pos_movement_lines` | pos-schema-v2.ts | Line items (material_id, quantity, unit_price) |
| `employee_inventory_ledger` | pos-schema-v2.ts | Per-employee debit/credit ledger |
| `employee_issuance_log` | pos-schema-v2.ts | Issue-to-employee log |
| `warehouse_transactions` | wms-schema.ts | WMS-level transaction log |
| `goods_receipts` | mm-purchase.ts | GR header (from vendor) |
| `goods_receipt_lines` | mm-purchase.ts | GR line items |
| `goods_receipt_items` | mm-purchase.ts | Legacy GR items (raw_materials FK) |
| `goods_issues` | mm-purchase.ts | GI header |
| `goods_issue_items` | mm-purchase.ts | GI line items |
| `material_batches` | mm-material-cards.ts | Batch tracking per material |
| `consumption_suggestions` | mm-material-cards.ts | AI-suggested consumption |
| `min_stock_alerts` | mm-material-cards.ts | Low-stock alerts |

---

## 7. Units and Categories Master Data

**Units:** No dedicated `units` master table exists. Units are stored as free-text `varchar` in each table (`material_cards.unit_of_measure`, `raw_materials.unit`, `pos_movement_lines.unit`). The `raw_materials` table has a CHECK constraint limiting to `('kg','meter','liter','piece','roll','box')` but `material_cards` does not enforce unit values.

**Categories:** No `material_categories` table. Categories are free-text varchar in `material_cards.category` and `raw_materials.category`. `raw_materials` enforces `('paperboard','glue','ink','packaging','other')` via CHECK; `material_cards` does not.

**Frontend pages for master data:**
- `artifacts/erp-dashboard/src/pages/MMDashboard.tsx` — overview
- `artifacts/erp-dashboard/src/pages/MMExtended.tsx` — extended views
No dedicated "Units" or "Categories" master data CRUD pages were found.

---

## 8. What Is Missing or Broken

1. **`material_id` column lacks FK constraint in all POS movement tables** — 12 tables in `pos-schema-v2.ts` reference `material_cards.id` through convention only, no DB enforcement.
2. **Dual entity: `material_cards` + `raw_materials`** — same physical material stored in two tables. `material_cards.raw_material_id` is supposed to link them but no service enforces consistency.
3. **Type mismatch in FK references** — `min_stock_alerts.materialCardId` is `varchar` but `material_cards.id` is `serial` (integer). Drizzle will silently cast but this is schema-level debt.
4. **`material_cards.current_stock`** is updated manually by `PosMovementService`. No DB trigger. If a movement is partially applied and then crashes, stock is incorrect.
5. **`raw_materials.current_stock`** exists in parallel — updated separately by `GoodsReceiptService`. Neither `material_cards.current_stock` nor `raw_materials.current_stock` is guaranteed to match `pos_movement_lines` sum.
6. **No units master table** — category and unit validation is inconsistent across tables.
7. **`material_cards.available_stock` is a derived field** stored as a column — it should be computed (`current_stock - reserved_stock`) but is written by application code. Can drift.

---

## Summary

`material_cards` (PK: `id` serial integer) is the canonical material entity. The TS alias `materialCardId` maps to the DB column `material_id` in all POS movement tables — this is column name drift, not a different concept. There is no DB-level FK enforcing this relationship in the POS schema. `raw_materials` is a separate older entity used in procurement/production. No units or categories master data tables exist.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| 12 tables have `material_id` with no FK constraint | P1 | `pos-schema-v2.ts` throughout | Orphan movement lines possible | Add `.references(() => materialCards.id)` to all |
| Dual entity `material_cards` + `raw_materials` | P2 | `mm-material-cards.ts` + `mm-raw-materials.ts` | Data inconsistency, two stock values | Migrate to single `material_cards` entity |
| `min_stock_alerts.materialCardId` is varchar, `material_cards.id` is integer | P1 | `mm-material-cards.ts:~200` | Type mismatch in FK | Change to `integer` type |
| `material_cards.current_stock` updated without DB transaction | P1 | `PosMovementService` | Stock count drift on crash | Use DB transaction + advisory lock |
| `material_cards.available_stock` stored (not computed) | P2 | `mm-material-cards.ts` column definition | Can drift from current-reserved | Make a computed column or remove, calculate in queries |
| No units master table | P3 | All schemas use free-text | Inconsistent unit validation | Add `uom_master` table |
| No categories master table | P3 | All schemas use free-text | Typos break category filters | Add `material_categories` table |

---

## Open Questions / UNVERIFIED

- Is `material_cards.id` referenced by `pos_movement_lines.material_id` via an application-level join in `PosMovementQueryService`? Service source not fully read.
- Does `GoodsReceiptService` update `material_cards.current_stock` when receiving goods, or only `raw_materials.current_stock`?
- `consumption_suggestions.materialCardId` references `materialCards.id` with `varchar` cast — does this produce DB errors in practice?
