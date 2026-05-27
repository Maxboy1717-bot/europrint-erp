# Report 15: Procurement & Vendors (MM Module)

**Date:** 2026-05-27  
**Scope:** apps/api/src/modules/mm/, lib/db/src/schema/mm-*, artifacts/erp-dashboard/src/pages/MM*

---

## 1. Module Overview

Procurement is handled by the MM (Materials Management) module. It covers:
- Vendor/supplier master data (`vendors` table)
- Purchase Orders (`purchase_orders`)
- Goods Receipts (`goods_receipts`, `goods_receipt_lines`, `goods_receipt_items`)
- Goods Issues (`goods_issues`, `goods_issue_items`)
- Purchase invoices (`purchase_invoices`)

The module also manages raw materials and material cards (covered in Report 12).

---

## 2. Page/Screen Inventory

| Page file | Purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/MMDashboard.tsx` | MM overview dashboard |
| `artifacts/erp-dashboard/src/pages/MMVendors.tsx` | Vendor list and CRUD |
| `artifacts/erp-dashboard/src/pages/MMVendorsDialogs.tsx` | Add/edit vendor dialog |
| `artifacts/erp-dashboard/src/pages/MMVendorsFormFields.tsx` | Vendor form fields |
| `artifacts/erp-dashboard/src/pages/MMVendorsSections.tsx` | Vendor detail sections |
| `artifacts/erp-dashboard/src/pages/MMPurchaseOrders.tsx` | Purchase order list |
| `artifacts/erp-dashboard/src/pages/MMPurchaseOrderDialogs.tsx` | PO create/edit dialog |
| `artifacts/erp-dashboard/src/pages/MMExtended.tsx` | Extended views (MRO, fleet) |
| `artifacts/erp-dashboard/src/pages/MMExtendedTabs.tsx` | Extended tab views |

Backend controllers (`apps/api/src/modules/mm/presentation/`):
- `mm-vendors-pr.controller.ts` — `GET/POST/PATCH /mm/vendors`
- `mm-purchase-orders.controller.ts` — `GET/POST/PATCH /mm/purchase-orders`
- `mm-goods.controller.ts` — `GET/POST /mm/goods-receipts`, `GET/POST /mm/goods-issues`
- `mm-raw-materials.controller.ts` — `GET/POST /mm/raw-materials`
- `mm-material-cards.controller.ts` — `GET/POST/PATCH /mm/material-cards`
- `mm-materials.controller.ts` — `GET /mm/materials`
- `mm-dashboard.controller.ts` — `GET /mm/dashboard`

---

## 3. Purchase Order Flow

```
MMPurchaseOrders.tsx → POST /api/mm/purchase-orders {
    vendor_id, order_date, delivery_date, items: [{raw_material_id, quantity, unit_price}]
  }
  → mm-purchase-orders.controller.ts (MmPurchaseOrdersController.create)
  → MmPurchaseOrderService.create()
  → INSERT INTO purchase_orders { po_number, vendor_id, order_date, status='draft', tenant_id }
  → INSERT INTO purchase_order_items (per item: po_id, raw_material_id, quantity, unit_price, total_price)

Status transition (PO approval):
  → PATCH /mm/purchase-orders/:id/status { status: 'sent' }
  → UPDATE purchase_orders SET status='sent'
  (No multi-level approval workflow found — single status update)

Goods receipt (GR) on delivery:
  → POST /api/mm/goods-receipts {
      purchase_order_id, supplier_id, warehouse_id,
      lines: [{material_card_id, received_quantity, unit_cost, batch_number}]
    }
  → MmGoodsService.createReceipt()
  → INSERT INTO goods_receipts { receipt_number, status='draft' }
  → INSERT INTO goods_receipt_lines (per line)
  → If QC required: UPDATE goods_receipts SET status='pending_qc'
  → After QC pass: UPDATE goods_receipts SET status='qc_passed'
  → On receive: UPDATE goods_receipts SET status='received'
             → material_cards.current_stock += accepted_quantity (per line)
             → INSERT INTO material_batches (batch tracking)
```

---

## 4. DB Tables & Columns Used

### `vendors` (lib/db/src/schema/mm-raw-materials.ts:169)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `vendor_code` | varchar(50) UNIQUE NOT NULL | Internal vendor code |
| `name` | text NOT NULL | |
| `name_ru` | text | |
| `address` | text | |
| `phone` | varchar(20) | |
| `email` | varchar(100) | |
| `tax_id` | varchar(50) | STIR |
| `payment_terms` | varchar(50) | NET30, NET60, etc. |
| `currency` | varchar(10) DEFAULT 'UZS' | |
| `is_active` | boolean DEFAULT true | |
| `tin` | varchar(50) | ADD-ONLY: duplicate of tax_id |
| `rating` | numericMoney | Vendor performance rating |
| `code` | varchar(50) | ADD-ONLY: alternate vendor code |
| `contact_person` | varchar(200) | |

### `purchase_orders` (lib/db/src/schema/mm-raw-materials.ts:207)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `tenant_id` | integer NOT NULL DEFAULT 1 | |
| `po_number` | varchar(50) UNIQUE NOT NULL | |
| `vendor_id` | integer NOT NULL → vendors.id | |
| `order_date` | varchar(10) NOT NULL | YYYY-MM-DD |
| `delivery_date` | varchar(10) | |
| `status` | varchar(20) DEFAULT 'draft' | draft / sent / confirmed / received / cancelled |
| `total_amount` | numericMoney DEFAULT 0 | |
| `currency` | varchar(10) DEFAULT 'UZS' | |
| `created_by` | integer → users.id | |
| `vendor_name` | text | ADD-ONLY: denormalized |
| `items` | jsonb | ADD-ONLY: embedded line items (legacy) |

### `purchase_order_items` (lib/db/src/schema/mm-purchase.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `po_id` | integer NOT NULL → purchase_orders.id | |
| `raw_material_id` | integer NOT NULL → raw_materials.id | |
| `quantity` | numericMoney NOT NULL | |
| `unit` | varchar(20) NOT NULL | |
| `unit_price` | numericMoney NOT NULL | |
| `total_price` | numericMoney NOT NULL | |
| `purchase_order_id` | integer | ADD-ONLY: duplicate FK alias of `po_id` |
| `material_id` | integer | ADD-ONLY: alternate FK alias of `raw_material_id` |

### `goods_receipts` (lib/db/src/schema/mm-purchase.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `receipt_number` | varchar(50) UNIQUE NOT NULL | |
| `receipt_date` | varchar(10) NOT NULL | |
| `supplier_id` | varchar → vendors.id | |
| `purchase_order_id` | varchar → purchase_orders.id | Optional link to PO |
| `warehouse_id` | varchar → warehouses.id | |
| `status` | varchar(20) DEFAULT 'draft' | draft / pending_qc / qc_passed / qc_failed / received / cancelled |
| `total_items` | integer DEFAULT 0 | |
| `total_value` | numericMoney DEFAULT 0 | |
| `qc_required_items` | integer DEFAULT 0 | |
| `qc_passed_items` | integer DEFAULT 0 | |
| `received_by` | varchar → users.id | |
| `invoice_number` | varchar(50) | Vendor invoice reference |

### `goods_receipt_lines` (lib/db/src/schema/mm-purchase.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `receipt_id` | integer NOT NULL → goods_receipts.id | |
| `material_card_id` | varchar → material_cards.id | **varchar FK to integer PK — type mismatch** |
| `received_quantity` | numericMoney NOT NULL | |
| `accepted_quantity` | numericMoney | After QC |
| `rejected_quantity` | numericMoney DEFAULT 0 | |
| `unit_cost` | numericMoney DEFAULT 0 | |
| `batch_number` | varchar(50) | |
| `qc_status` | varchar(20) DEFAULT 'pending' | pending / passed / failed / not_required |
| `bin_id` | varchar → warehouse_bins.id | Target bin location |

### `goods_receipt_items` (legacy, lib/db/src/schema/mm-purchase.ts)

Older table using `raw_material_id` (FK to `raw_materials`) instead of `material_card_id`. Both tables coexist — `goods_receipt_lines` is the newer, `goods_receipt_items` is legacy.

### `purchase_invoices` (lib/db/src/schema/mm-raw-materials.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `invoice_number` | varchar(50) UNIQUE | |
| `supplier_name` | text NOT NULL | |
| `vendor_id` | varchar → vendors.id | |
| `total_amount` | numericMoney NOT NULL | |
| `paid_amount` | numericMoney DEFAULT 0 | |
| `payment_status` | varchar(20) DEFAULT 'unpaid' | unpaid / partial / paid |
| `due_date` | varchar(10) | |

---

## 5. Three-Way Match (PO + Receipt + Invoice)

Three-way matching **is schema-defined** in `pos-schema-v2.ts`:

```typescript
// pos-schema-v2.ts
export const posThreeWayMatch = pgTable('pos_three_way_match', {
  posMovementId:    integer NOT NULL UNIQUE,
  purchaseOrderId:  varchar,
  goodsReceiptId:   varchar,
  invoiceId:        varchar,
  poQty / grQty / invoiceQty,
  poUnitPrice / invoiceUnitPrice,
  qtyVariance / priceVariance,
  qtyMatch / priceMatch / overallMatch: boolean,
  aiVerified:       boolean DEFAULT false,
});
```

And in `pos_movements`:
```typescript
purchaseOrderId:  varchar,
goodsReceiptId:   varchar,
invoiceId:        varchar,
threeWayMatched:  boolean DEFAULT false,
```

**However:** Three-way matching is currently **POS-movement-centric**, not `goods_receipts`-centric. The link is `pos_movements.purchase_order_id` (FK to PO) + `pos_movements.goods_receipt_id` (FK to GR) + `pos_movements.invoice_id`. This means 3-way match only works if a POS movement is created for the goods receipt, which is the intended flow but not enforced.

The `purchase_invoices` table in MM is **separate** from the Finance invoicing system. No automatic link from `purchase_invoices` to `pos_three_way_match` was found — the `invoice_id` in `pos_three_way_match` references the Finance module's `invoices` table, not MM's `purchase_invoices`.

---

## 6. Receipt of Goods — Does It Update Inventory?

**Yes, but only via `material_cards`**, not `raw_materials.current_stock`.

The flow when `goods_receipts.status` moves to `'received'`:
1. `MmGoodsService.receive()` loops through `goods_receipt_lines`
2. For each line with `material_card_id`: `UPDATE material_cards SET current_stock += accepted_quantity`
3. `INSERT INTO material_batches` (batch record)
4. No update to `raw_materials.current_stock`

For legacy `goods_receipt_items` (using `raw_material_id`): it is unclear if `raw_materials.current_stock` is updated. This is an **unverified gap**.

---

## 7. Purchase Requisitions

**Not implemented.** No `purchase_requisitions` table was found in any schema file. The closest entity is `pos_material_requests` in the POS module, which tracks department requests for materials from the warehouse. This is an internal warehouse request, not a formal procurement requisition.

---

## 8. What Is Missing or Broken

1. **No purchase requisition workflow** — PRs are not implemented. Procurement starts directly with a Purchase Order.
2. **`purchase_order_items` has duplicate FK columns** — `po_id` and `purchase_order_id` (ADD-ONLY) are the same FK. `raw_material_id` and `material_id` are the same FK. Two write paths with different column names.
3. **`goods_receipt_lines.material_card_id` is `varchar` but `material_cards.id` is `serial` (integer)** — type mismatch on FK. Same issue as in Report 12.
4. **`goods_receipt_items` (legacy) coexists with `goods_receipt_lines` (new)** — parallel tables for the same concept. Both may be written to simultaneously.
5. **Three-way match is only enforced at POS movement level**, not at the `goods_receipts` level. A GR can be received without creating a POS movement, bypassing 3-way match.
6. **`purchase_invoices` in MM is disconnected from Finance `invoices`** — no FK or sync. Finance does not automatically see MM purchase invoices.
7. **`vendors.tax_id` and `vendors.tin` are duplicate columns** (ADD-ONLY superset, acknowledged in schema comment).
8. **`vendors.code` and `vendors.vendor_code` are duplicate columns** — same value, two columns.
9. **No vendor approval workflow** — any user with `mm.vendors.write` can create a vendor. No approval or KYC step.
10. **PO status `'received'`** — when PO status is set to 'received', is `goods_receipt` automatically created or must it be created manually? No event linkage found.
11. **`goods_receipts.supplier_id` is `varchar → vendors.id`** but `purchase_orders.vendor_id` is `integer → vendors.id` — type inconsistency on the same entity.

---

## Summary

Procurement is implemented with vendor master, purchase orders, goods receipts (with QC workflow), and purchase invoices. Three-way match schema exists but is POS-movement-centric. Purchase requisitions are not implemented. Two significant schema issues exist: dual tables (`goods_receipt_lines` vs `goods_receipt_items`) and type mismatches on vendor FK references. Receipt of goods updates `material_cards.current_stock` but not `raw_materials.current_stock`.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| No purchase requisition workflow | P2 | No `purchase_requisitions` table | Procurement starts at PO, no demand-driven flow | Implement PR → PO conversion |
| `purchase_order_items` dual FK columns (`po_id` + `purchase_order_id`, `raw_material_id` + `material_id`) | P2 | `mm-purchase.ts` ADD-ONLY columns | Two write paths to same FK | Remove legacy aliases after migration |
| `goods_receipt_lines.material_card_id` is varchar, `material_cards.id` is integer | P1 | `mm-purchase.ts:~100` | FK type mismatch | Change to integer |
| Legacy `goods_receipt_items` coexists with `goods_receipt_lines` | P2 | Both tables in mm-purchase.ts | Dual GR line tables | Deprecate `goods_receipt_items` |
| 3-way match bypassed if no POS movement created | P1 | `pos_three_way_match` requires `pos_movement_id` | GRs can be received without 3-way check | Link 3-way match to `goods_receipts` directly |
| `purchase_invoices` disconnected from Finance `invoices` | P1 | No FK or sync | Finance does not see MM purchase invoices | Add FK or event-based sync |
| `vendors.tax_id` + `vendors.tin` duplicate columns | P3 | `mm-raw-materials.ts:183,189` | Data entry confusion | Keep `tax_id`, remove `tin` |
| `vendors.code` + `vendors.vendor_code` duplicate | P3 | `mm-raw-materials.ts:186,172` | Confusion | Keep `vendor_code`, remove `code` |
| `goods_receipt_lines.supplier_id` varchar vs `purchase_orders.vendor_id` integer | P2 | Type inconsistency | Impossible to join without cast | Standardize FK type |
| GR receipt does not update `raw_materials.current_stock` | P2 | `MmGoodsService` (unverified for legacy path) | Raw material stock diverges | Update `raw_materials.current_stock` on GR receive |

---

## Open Questions / UNVERIFIED

- When `goods_receipts.status='received'`, does `MmGoodsService` update `raw_materials.current_stock` for rows in `goods_receipt_items`?
- Is `PATCH /mm/purchase-orders/:id/status` guarded by any approval workflow (e.g., manager must approve before `'sent'`)?
- `MMExtended.tsx` — what tabs does it contain? "Fleet" and "MRO" tabs were mentioned — are these connected to separate tables?
- `purchase_orders.items` (jsonb ADD-ONLY) — is it still written to by any code path? If so, it duplicates `purchase_order_items` table entirely.
