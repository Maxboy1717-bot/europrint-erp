# Report 10: POS / Warehouse Interface (Kirim-Chiqim-Inventory Monitor)

**Date:** 2026-05-27  
**Scope:** apps/api/src/modules/pos/, apps/api/src/modules/wms/, artifacts/erp-dashboard/src/pages/POS*

---

## 1. Module Overview

The name "POS" in this codebase is **misleading**. The `pos` module is **not a retail cashier point-of-sale**. It is a **factory warehouse interface**: kirim (stock-in), chiqim (stock-out), inter-warehouse transfers, inventory counts, barcode scanning, and GL posting for every movement. Retail cashier transactions exist in a **separate** schema (`retail_pos_products`, `retail_pos_transactions`) handled by a different controller (`cash-register.controller.ts`).

There are two `pos`-named modules:
- `apps/api/src/modules/pos/` — full warehouse movement module (primary, ~23 controllers)
- `apps/api/src/modules/pos-v2/` — lighter overlay (4 controllers: barcode, inventory-count, reports, requests)
- `apps/api/src/modules/wms/` — warehouse management system (bins, zones, stock queries, rental, analytics)

---

## 2. Page/Screen Inventory

| Page file | Route/purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/POSDashboard.tsx` | Main warehouse dashboard (stock summary, movement list) |
| `artifacts/erp-dashboard/src/pages/POSDashboardCards.tsx` | KPI cards sub-component |
| `artifacts/erp-dashboard/src/pages/POSDashboardCharts.tsx` | Inventory trend charts |
| `artifacts/erp-dashboard/src/pages/POSDashboardDialogs.tsx` | Create-movement dialog |
| `artifacts/erp-dashboard/src/pages/POSDashboardPOSPanel.tsx` | Retail panel (misnomer — also factory context) |
| `artifacts/erp-dashboard/src/pages/POSInventoryPage.tsx` | Inventory balance per material/warehouse |
| `artifacts/erp-dashboard/src/pages/POSInventoryPageChart.tsx` | Stock-level charts |
| `artifacts/erp-dashboard/src/pages/POSInventoryPageDialogs.tsx` | Adjustment dialog |
| `artifacts/erp-dashboard/src/pages/POSInventoryPageSections.tsx` | Section layout |
| `artifacts/erp-dashboard/src/pages/InventoryCount.tsx` | Inventory count session (cyclic count) |
| `artifacts/erp-dashboard/src/pages/InventoryValuation.tsx` | Stock valuation report |
| `artifacts/erp-dashboard/src/pages/BarcodeWarehouse.tsx` | Barcode scanning interface |
| `artifacts/erp-dashboard/src/pages/GLPostingMonitor.tsx` | GL posting status for movements |
| `artifacts/erp-dashboard/src/pages/MaterialBalance.tsx` | Material balance (stock ledger) |
| `artifacts/erp-dashboard/src/pages/MaterialBalanceSections.tsx` | Balance sections |
| `artifacts/erp-dashboard/src/pages/MaterialBalanceTables.tsx` | Balance table component |
| `artifacts/erp-dashboard/src/pages/EmployeeInventory.tsx` | Employee issuance ledger |

Backend controllers (`apps/api/src/modules/pos/presentation/`):
- `movements.controller.ts` — `GET/POST/PATCH /pos/movements`
- `stock.controller.ts` — `GET /pos/stock`
- `inventory-count.controller.ts` — `GET/POST /pos/inventory-counts`
- `requests.controller.ts` — `GET/POST /pos/requests`
- `cash-register.controller.ts` — `GET/POST /pos/transactions` (retail only)
- `gl.controller.ts` — `GET/POST /pos/gl`
- `employee.controller.ts` — `GET /pos/employee-ledger`
- `barcode.controller.ts` — `GET/POST /pos/barcodes`
- `reports.controller.ts` — `GET /pos/reports`
- `pos-stub.controller.ts` — legacy `/pos/sales` adapter → `retail_pos_transactions`
- `sync.controller.ts` — offline sync queue
- `warehouse-features.controller.ts` — warehouse config
- `mini-app.controller.ts`, `mini-app-history.controller.ts` — Telegram Mini-App
- `pos-wms.controller.ts` — bridge to WMS inventory queries

---

## 3. Data Flow Chains

### 3a. Kirim (Stock-In / EXTERNAL_IN)

```
POSDashboardDialogs.tsx (CreateMovementDto)
  → POST /api/pos/movements
  → movements.controller.ts:~80 (MovementsController.create)
  → PosMovementService.create()
    → posMovements (INSERT) + posMovementLines (INSERT batch)
    → StockLedgerService.applyMovement()
      → employee_inventory_ledger (INSERT, entry_type='in')
      → material_cards.current_stock += quantity   [UPDATE]
    → GlPostingLogService.scheduleGlPost()
      → ai_gl_status='PENDING' on pos_movements row
      → gl.controller.ts PATCH /pos/gl/approve/:movementId → fi_gl tables (async)
```

### 3b. Chiqim (Stock-Out / EXTERNAL_OUT or INTERNAL_ISSUE)

```
POSDashboardDialogs.tsx
  → POST /api/pos/movements  { movementType: 'EXTERNAL_OUT' or 'INTERNAL_ISSUE' }
  → movements.controller.ts → PosMovementService.create()
    → posMovements (INSERT) + posMovementLines (INSERT)
    → StockLedgerService: employee_inventory_ledger entry_type='out'
    → material_cards.current_stock -= quantity
    → GlPostingLogService (GL debit/credit)
```

### 3c. Finance Integration

```
pos_movements.ai_gl_status = 'PENDING'
  → GlPostingLogService.scheduleGlPost()
  → gl.controller.ts POST /pos/gl/approve/:movementId
  → GlPostingLogService.approveByMovement()
  → gl_documents (fi module, fi-gl.ts) INSERT
  → pos_movements.gl_document_id = <gl_documents.id>
  → pos_movements.ai_gl_status = 'POSTED'
```

Cash **does** flow from warehouse → Finance module via GL document. The `posMovements.cashPaid` boolean + `cashAmount` field tracks if supplier was paid cash on delivery.

### 3d. Retail (Cash Register) — separate path

```
POSDashboardPOSPanel.tsx → POST /api/pos/sales (legacy) OR /api/pos/transactions
  → pos-stub.controller.ts → CashRegisterService.createTransaction()
  → cash-register.repository.ts
  → retail_pos_transactions (INSERT)
  → retail_pos_products.stock_quantity -= item.quantity  (UPDATE per item)
```

---

## 4. DB Tables & Columns Used

### Warehouse Movement Tables (lib/db/src/schema/pos-schema-v2.ts)

| Table | Key columns |
|---|---|
| `pos_movements` | `id`, `movement_number`, `movement_type` (enum), `from_warehouse_id`, `to_warehouse_id`, `status`, `cash_paid`, `cash_amount`, `three_way_matched`, `ai_gl_status`, `gl_document_id`, `purchase_order_id`, `goods_receipt_id`, `invoice_id`, `created_by`, `approved_by` |
| `pos_movement_lines` | `id`, `movement_id`, `material_id` (FK → material_cards.id), `batch_id`, `unit`, `quantity`, `unit_price`, `total_price`, `fifo_sequence` |
| `pos_material_requests` | `id`, `request_number`, `department_code`, `target_warehouse_id`, `status` (DRAFT→FULLY_ISSUED) |
| `pos_material_request_lines` | `request_id`, `material_id`, `requested_qty`, `approved_qty`, `issued_qty` |
| `employee_inventory_ledger` | `user_id`, `material_id`, `warehouse_id`, `entry_type` (in/out), `quantity`, `unit_price`, `total_amount` |
| `employee_issuance_log` | `user_id`, `material_id`, `warehouse_id`, `quantity_issued` |
| `employee_write_off_acts` | `act_number`, `user_id`, `status`, `total_amount`, `gl_document_id` |
| `employee_liability_cases` | `case_number`, `user_id`, `material_id`, `status`, `assessed_value` |
| `production_material_allocs` | `production_order_id`, `material_id`, `from_warehouse_id`, `to_warehouse_id`, `pos_movement_id` |
| `pos_stock_reservations` | `production_order_id`, `material_id`, `warehouse_id`, `reserved_qty`, `issued_qty`, `remaining_qty` |
| `pos_serial_number_items` | `material_id`, `serial_number`, `warehouse_id`, `assigned_to_user_id`, `status` |
| `pos_inventory_counts` | `count_number`, `warehouse_id`, `status` (DRAFT→GL_POSTED), `total_variance_value` |
| `pos_inventory_count_lines` | `count_id`, `material_id`, `system_qty`, `actual_qty`, `variance_qty`, `variance_value` |
| `pos_offline_queue` | `terminal_id`, `user_id`, `sync_status`, `payload` |
| `pos_three_way_match` | `pos_movement_id`, `purchase_order_id`, `goods_receipt_id`, `invoice_id`, `overall_match` |
| `pos_audit_log` | `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value` |

### Retail Tables (lib/db/src/schema/pos-retail.ts)

| Table | Key columns |
|---|---|
| `retail_pos_products` | `id`, `barcode`, `name`, `unit_price`, `stock_quantity`, `min_stock`, `is_active` |
| `retail_pos_transactions` | `id`, `transaction_number`, `receipt_number`, `cashier_id`, `items` (jsonb), `total_amount`, `payment_method`, `status` |

### Dormant table

| Table | Status |
|---|---|
| `pos_transactions` (lib/db/src/schema/fi-payroll-ext.ts:226) | **Dormant**. Not referenced by any active service. `fi-payroll-ext.ts` defines it in the FI schema file — architectural misplacement. All active writes go to `retail_pos_transactions`. |
| `pos_products` (lib/db/src/schema/fi-payroll-ext.ts:259) | **Dormant**. Active reads/writes use `retail_pos_products`. |

---

## 5. UI Elements & Handlers

| Element | File:Line | Notes |
|---|---|---|
| Movement type selector | `POSDashboardDialogs.tsx` | Dropdown: EXTERNAL_IN, EXTERNAL_OUT, INTERNAL_ISSUE, etc. |
| Create movement button | `POSDashboardDialogs.tsx` | POST /pos/movements |
| Stock summary cards | `POSDashboardCards.tsx` | GET /pos/stock |
| Inventory trend chart | `POSDashboardCharts.tsx` | GET /pos/reports |
| Barcode scan input | `BarcodeWarehouse.tsx` | GET /pos/barcodes/lookup |
| Inventory count form | `InventoryCount.tsx` | POST /pos/inventory-counts |
| GL posting status | `GLPostingMonitor.tsx` | GET /pos/gl/pending |
| Material balance table | `MaterialBalance.tsx` | GET /pos/stock or WMS endpoint |
| Employee ledger | `EmployeeInventory.tsx` | GET /pos/employee-ledger |
| POS sales panel | `POSDashboardPOSPanel.tsx` | POST /pos/sales → retail_pos_transactions |

---

## 6. What Is Missing or Broken

1. **`pos_transactions` and `pos_products` are dormant** — defined in `fi-payroll-ext.ts` (wrong file), never written to by any active code path. Old code may still reference them causing silent empty reads.
2. **`pos-stub.controller.ts` comment (line 6-14)** explicitly documents that `/pos/sales` previously echoed payloads without DB write — now fixed to call `CashRegisterService`, but the fix is a patch on a stub, not a proper endpoint.
3. **No direct FK between `pos_movement_lines.material_id` and `material_cards.id`** — the Drizzle column is named `materialCardId` in TypeScript but maps to DB column `material_id`. No `references()` call in the schema (`pos-schema-v2.ts:~100`). FK is application-level only.
4. **`retail_pos_products.stock_quantity` is updated manually** — no DB trigger. If a transaction crashes mid-flight the stock count diverges.
5. **GL posting is AI-assisted and async** — `ai_gl_status='PENDING'` movements are not immediately posted. Finance module sees a lag.
6. **WMS module (`apps/api/src/modules/wms/`) and POS module both track stock** — `material_cards.current_stock` vs WMS `warehouse_transactions`. No reconciliation mechanism exists.
7. **`pos-v2` module** exists parallel to `pos` with overlapping endpoints — `inventory-count.controller.ts`, `requests.controller.ts`, `barcode.controller.ts`, `reports.controller.ts` appear in both. Which takes precedence in the router is not verified.
8. **`posTransactions` (dormant)** has a stricter status enum (`completed|refunded|pending|cancelled`) vs `retail_pos_transactions` (`completed|refunded|pending`) — future code merging these schemas could corrupt rows.

---

## Summary

The `pos` module is a **factory warehouse management module** (kirim/chiqim/transfer/inventarizatsiya), NOT a retail POS. Retail cashier functionality is a separate, smaller sub-system using `retail_pos_products` and `retail_pos_transactions`. Cash flow from warehouse movements reaches the Finance module via an asynchronous AI-assisted GL posting pipeline (`pos_movements.ai_gl_status → gl_documents`). Two dormant tables (`pos_transactions`, `pos_products`) exist in the wrong schema file and should be removed.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `pos_transactions` / `pos_products` dormant but still in schema | P2 | `lib/db/src/schema/fi-payroll-ext.ts:226,259` | Schema bloat, confusion, accidental reads | Mark deprecated, schedule removal after migration |
| No FK from `pos_movement_lines.material_id` → `material_cards.id` | P1 | `pos-schema-v2.ts:~100` (no references()) | Orphan movement lines possible | Add Drizzle `.references(() => materialCards.id)` |
| `retail_pos_products.stock_quantity` updated without DB transaction guarantee | P1 | `cash-register.repository.ts:~99` | Stock divergence on crash | Wrap in DB transaction or use trigger |
| Dual stock tracking (POS ledger + WMS transactions) with no reconciliation | P1 | `employee_inventory_ledger` vs `warehouse_transactions` | Balance mismatch | Choose one authoritative stock source |
| `pos` and `pos-v2` duplicate controllers | P2 | Both modules have `inventory-count.controller.ts`, `requests.controller.ts` | Router conflict, maintenance burden | Consolidate into single module |
| GL posting is async/AI — Finance sees lag | P2 | `pos_movements.ai_gl_status='PENDING'` | Finance reports incomplete until GL approved | Implement synchronous GL posting or at-least a SLA monitor |
| `pos-stub.controller.ts` legacy adapter still in production | P3 | `pos-stub.controller.ts:1-14` | Technical debt, dual code paths | Migrate callers to canonical `/pos/transactions` endpoint |

---

## Open Questions / UNVERIFIED

- Does `pos-v2.module.ts` register its controllers before or after `pos.module.ts`? Which wins for duplicate routes?
- Is `GlPostingLogService.scheduleGlPost()` actually called on every movement CREATE, or only on APPROVE? Need to verify service method body.
- `POSDashboardPOSPanel.tsx` — does it actually call `/pos/sales` (stub) or `/pos/transactions` (canonical)? Component not fully read.
- Are `pos_movement_types` seed rows present in production? `apps/api/src/shared/db/seed-pos-movement-types.ts` exists but seeding invocation not confirmed.
