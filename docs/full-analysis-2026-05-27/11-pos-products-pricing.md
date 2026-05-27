# Report 11: POS Products & Pricing

**Date:** 2026-05-27  
**Scope:** `pos_products` vs `retail_pos_products`, pricing CRUD, sync triggers

---

## 1. Module Overview

There are **two distinct product tables** that both carry "pos_products" in their names:

1. **`pos_products`** — defined in `lib/db/src/schema/fi-payroll-ext.ts:259`. This is a **Drizzle pgTable** (not a SQL VIEW). It is **dormant** — no active service reads or writes to it.
2. **`retail_pos_products`** — defined in `lib/db/src/schema/pos-retail.ts:13`. This is the **active** retail product catalog used by the cash-register flow.

Neither is a SQL VIEW. Both are standard Drizzle `pgTable` definitions.

---

## 2. Page/Screen Inventory

| Page file | Route/purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/POSDashboard.tsx` | Displays product list from `retail_pos_products` |
| `artifacts/erp-dashboard/src/pages/POSDashboardDialogs.tsx` | Add/edit product dialog |
| `artifacts/erp-dashboard/src/pages/POSDashboardPOSPanel.tsx` | Product search + sale form |

Backend controllers:
- `apps/api/src/modules/pos/presentation/cash-register.controller.ts` — product CRUD endpoints
- `apps/api/src/modules/pos/presentation/pos-stub.controller.ts` — legacy `/pos/sales` adapter

---

## 3. Data Flow Chains

### Product Listing

```
POSDashboardPOSPanel.tsx → GET /api/pos/products?search=<q>
  → cash-register.controller.ts (CashRegisterController.findProducts)
  → CashRegisterService.findProducts(search)
  → cash-register.repository.ts:55-59
    → SELECT * FROM retail_pos_products WHERE is_active=true [AND name ILIKE '%q%']
  → retail_pos_products rows returned
```

### Product Create

```
POSDashboardDialogs.tsx → POST /api/pos/products { barcode, name, unit_price, unit, ... }
  → cash-register.controller.ts
  → CashRegisterService.createProduct()
  → cash-register.repository.ts:99
    → INSERT INTO retail_pos_products VALUES (...)
```

### Price Update

```
POSDashboardDialogs.tsx → PATCH /api/pos/products/:id { unit_price: <new> }
  → cash-register.controller.ts
  → CashRegisterService.updateProduct()
  → cash-register.repository.ts
    → UPDATE retail_pos_products SET unit_price=<new>, updated_at=NOW() WHERE id=?
```

### Price used in transaction

```
POST /api/pos/transactions { items: [{productId, quantity}] }
  → CashRegisterService.createTransaction()
  → cash-register.repository.ts:221-224
    → SELECT unit_price FROM retail_pos_products WHERE id=? AND is_active=true
    → subtotal = unit_price * quantity
    → INSERT INTO retail_pos_transactions { items (jsonb), subtotal, total_amount }
```

Note: the `items` column in `retail_pos_transactions` is a **JSONB blob** — unit price at time of sale is embedded in the JSON, not normalized into a separate line-item table.

---

## 4. DB Tables & Columns Used

### Active table: `retail_pos_products` (lib/db/src/schema/pos-retail.ts:13)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | defaultRandom() |
| `barcode` | text UNIQUE NOT NULL | Product barcode |
| `name` | text NOT NULL | Uzbek name |
| `name_ru` | text | Russian name |
| `category` | text | Free-text category (no FK) |
| `unit_price` | decimal(18,2) NOT NULL | Sale price |
| `unit` | text NOT NULL DEFAULT 'dona' | Unit of measure |
| `stock_quantity` | decimal(12,3) DEFAULT 0 | Current stock count |
| `min_stock` | decimal(12,3) DEFAULT 0 | Low-stock threshold |
| `is_active` | boolean DEFAULT true | Soft-delete flag |
| `image_url` | text | Product image |
| `created_by` | text | User identifier (text, not FK) |
| `created_at` / `updated_at` | timestamp with timezone | Audit timestamps |

Indexes: `retail_pos_products_barcode_idx` on barcode, `retail_pos_products_active_idx` on is_active.

### Dormant table: `pos_products` (lib/db/src/schema/fi-payroll-ext.ts:259)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Integer, not UUID |
| `barcode` | varchar(50) UNIQUE NOT NULL | Different length than retail version |
| `name` | text NOT NULL | |
| `name_ru` | text | |
| `category` | varchar(50) | |
| `unit_price` | numericMoney NOT NULL | Uses custom numericMoney type |
| `unit` | varchar(20) DEFAULT 'dona' | |
| `stock_quantity` | numericMoney DEFAULT 0 | |
| `min_stock` | numericMoney DEFAULT 0 | |
| `is_active` | boolean DEFAULT true | |
| `image_url` | text | |
| `created_at` | timestamp NOT NULL | No updated_at |

---

## 5. UI Elements & Handlers

| Element | Notes |
|---|---|
| Product search bar in `POSDashboardPOSPanel.tsx` | Debounced → GET /pos/products?search=... |
| "Yangi mahsulot" button in `POSDashboardDialogs.tsx` | POST /pos/products |
| Price input field in product form | PATCH /pos/products/:id |
| Barcode lookup in `BarcodeWarehouse.tsx` | GET /pos/barcodes/lookup → checks retail_pos_products.barcode |
| Stock quantity display in product list | From retail_pos_products.stock_quantity |

---

## 6. What Is Missing or Broken

1. **`pos_products` VIEW does not exist** — there is no SQL VIEW named `pos_products`. Both `pos_products` and `retail_pos_products` are plain Drizzle tables. The name collision causes confusion. The question "is it a VIEW?" is definitively answered: **No**.
2. **`pos_products` feeds nothing** — it is a disconnected table in the wrong schema file (`fi-payroll-ext.ts`). No service queries it. It is wasteful schema space.
3. **No sync trigger between `pos_products` and `retail_pos_products`** — they are entirely independent. Price changes in one do not propagate to the other.
4. **Price update has no downstream notifications** — when `unit_price` in `retail_pos_products` changes, no event is fired to update any open orders or quoted prices.
5. **`retail_pos_transactions.items` is JSONB** — the price at time of sale is embedded in the JSON blob. There are no individual `sales_transaction_items` rows. This makes per-item sales analysis, returns, and auditing significantly harder.
6. **`retail_pos_products.created_by` is `text` (not integer FK)** — inconsistent with the rest of the codebase (which uses `integer` FK to `users.id`). No referential integrity.
7. **`category` is a free-text field** — no `pos_product_categories` master table. Category-based filtering and reporting are fragile.
8. **Price history** — there is no `price_history` table. If `unit_price` changes, the old price is lost.
9. **`retail_pos_products.stock_quantity`** — updated by `CashRegisterService` without a database-level trigger or lock. Concurrent sales can cause stock count races.
10. **Who can update prices?** — `cash-register.controller.ts` uses `@RequirePermission('pos.products.write')`. No role-level price-change approval workflow exists.

---

## Summary

`pos_products` is a dormant Drizzle table (not a VIEW) defined in the wrong schema file. The active retail product catalog is `retail_pos_products`. Pricing CRUD goes through `CashRegisterService` → `cash-register.repository.ts` → `retail_pos_products`. There are no sync triggers between the two tables, no price history, and no downstream notifications on price change. The JSONB `items` column in `retail_pos_transactions` makes per-item analytics difficult.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `pos_products` dormant, wrong file | P2 | `fi-payroll-ext.ts:259` | Schema confusion, dead code | Remove or migrate to its own schema file, mark deprecated |
| No sync between `pos_products` and `retail_pos_products` | P2 | Both defined independently | Any price update in one is invisible to the other | Eliminate dormant table |
| `items` in `retail_pos_transactions` is JSONB (no normalized items table) | P2 | `pos-retail.ts:44` | Cannot query individual sold items in SQL | Add `retail_pos_transaction_items` table |
| `created_by` is text not integer FK | P3 | `pos-retail.ts:24` | No referential integrity on creator | Change to `integer` + `references(() => users.id)` |
| No price history table | P2 | `retail_pos_products` has no history | Cannot audit price changes | Add `retail_pos_product_price_history` table |
| No category master table | P3 | `category` is free text | Typos break category filters | Add `pos_product_categories` master table |
| Stock quantity update without DB lock | P1 | `cash-register.repository.ts:99,221` | Race condition on concurrent sales | Use `FOR UPDATE` or optimistic concurrency |
| Price update: no approval workflow | P3 | Permission `pos.products.write` only | Any cashier-level user can change prices | Add manager approval step for price changes |

---

## Open Questions / UNVERIFIED

- Does `apps/api/src/shared/db/index.ts:162` export `pos_products` for any service to use? Line 162 exports it but no service import was found.
- Is there a migration that created `pos_products` table in the actual PostgreSQL database, or was it never migrated?
- `retail_pos_products.stock_quantity` — is it ever recalculated from `retail_pos_transactions.items`? No reconciliation job was found.
