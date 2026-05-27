# Report 11 — POS Products & Pricing

**Date:** 2026-05-27 (round 2)
**Scope:** `pos_products` vs `retail_pos_products`, pricing CRUD, price history,
SKU/barcode/UOM, categories, multi-warehouse pricing, discount/promo logic,
frontend wire-up.

---

## Diff vs round 1

Round 1's report (`docs/full-analysis-2026-05-27/11-pos-products-pricing.md`)
got the headline right — `pos_products` is dormant, `retail_pos_products` is
live — but the rest of it was loose. Confirmed and **changed** vs round 1:

| Round 1 claim | Round 2 verdict |
|---|---|
| `pos_products` defined in `fi-payroll-ext.ts:259`, dormant | Confirmed (`fi-payroll-ext.ts:259`). Re-exported once via `apps/api/src/shared/db/schema-ext-b-2.ts:38`. No code reads it. |
| `retail_pos_products` is active and used by `CashRegisterRepository` | Confirmed (`cash-register.repository.ts:11`). |
| Page `POSDashboardDialogs.tsx` is the "add/edit product dialog" | **FALSE.** `POSDashboardDialogs.tsx` contains only `PaymentDialog` and `ReceiptDialog`. There is **no product create/edit dialog in the dashboard at all**. Product CRUD is exposed only as an API endpoint via `apps/api/src/lib/api/operations.ts:78` (`createPosProduct`) — no UI screen calls it. |
| `PATCH /pos/products/:id { unit_price }` exists | **FALSE.** `cash-register.controller.ts` (88 lines) has only `GET /pos/products`, `POST /pos/products`, `GET /pos/scan/:barcode`, plus 5 transaction endpoints. There is **no PATCH/PUT/DELETE for products anywhere**. Once a `retail_pos_products` row is inserted, its price cannot be changed via REST. |
| `cash-register.repository.ts:99` writes `INSERT INTO retail_pos_products` | Confirmed (`cash-register.repository.ts:99`). |
| `cash-register.repository.ts:221-224` reads `unit_price` from `retail_pos_products` and writes JSONB items | Confirmed; the actual atomic write path is `insertTransactionAtomic` at `cash-register.repository.ts:248` (which round 1 missed). |
| "Stock quantity update without DB lock" — race condition | **PARTIALLY WRONG.** Round 1 missed that `insertTransactionAtomic` wraps the INSERT + stock decrement in a single `db.transaction(async (tx) => ...)` at lines 255–282. There is still no `SELECT ... FOR UPDATE` and the decrement uses `GREATEST(0, stock_quantity - qty)` (silent clamp), but it is not "no transaction at all" — it is atomic per-sale, just not row-locked across concurrent sales. |
| `items` jsonb in `retail_pos_transactions`, no normalized items table | Confirmed (`pos-retail.ts:50`). |
| `created_by` is text not int FK | Confirmed (`pos-retail.ts:25`). |

**New findings round 1 missed (full list in §8):**

1. **Migration drift on `pos_products`:** the `0000_volatile_ender_wiggin.sql` migration creates `pos_products` with a *completely different* column set (`category_id integer`, `price`, no `unit_price`, no `name_ru`, no `stock_quantity`, no `unit`, no `min_stock`) than the Drizzle declaration in `fi-payroll-ext.ts:259`. If both ever ran together, the table on disk would not match what Drizzle's type system thinks exists.
2. **DTO id-type contract mismatch.** Controller-DTO `PosCreateTransactionSchema` declares `items[].product_id: z.number().int().positive()` (`apps/api/src/modules/pos/dto/pos-cash-register.dto.ts:19`). Service-DTO `CreateTransactionSchema` declares `items[].productId: z.string()` (`cash-register.service.ts:27`). The DB column is `uuid`. Frontend (`POSDashboardTypes.ts:15`) declares `PosProduct.id: number`. Every layer disagrees — the live frontend submits **integer** product IDs against a **uuid** column. Either the legacy `/pos/sales` shim is the only path that ever works, or the system is silently broken.
3. **Controller `addProduct` validates twice with incompatible schemas.** `cash-register.controller.ts:40` runs `ZodValidationPipe(PosAddProductSchema)` (fields: `product_id`, `name`, `price`, `quantity`, `barcode`, `.passthrough()`) and then `cash-register.service.ts:88` parses again with `CreateProductSchema` (fields: `barcode`, `name`, `unitPrice`). A request shaped like the controller DTO will fail the service DTO.
4. **No PATCH endpoint** for product updates (price, stock-min, image, name) — full table at §1.
5. **Three independent barcode systems** with no FK between them (§3).
6. **No SKU column anywhere** — barcode is used as the de-facto SKU (§3).
7. **`pos_categories` table exists** in `apps/api/src/shared/db/schema-ext-b-2.ts:30` but is referenced nowhere; `productCategories` from `pp/pp-enhanced.ts:283` is the canonical hierarchy, but `retail_pos_products.category` is plain text with no FK to either.

---

## 1. `pos_products` vs `retail_pos_products`

### Both declarations

**`pos_products` (dormant) — `lib/db/src/schema/fi-payroll-ext.ts:259`:**

```ts
export const posProducts = pgTable("pos_products", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 50 }),
  unitPrice: numericMoney("unit_price").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  stockQuantity: numericMoney("stock_quantity").default(0),
  minStock: numericMoney("min_stock").default(0),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pos_products_category").on(t.category),
  index("idx_pos_products_is_active").on(t.isActive),
]);
```

**`retail_pos_products` (active) — `lib/db/src/schema/pos-retail.ts:13`:**

```ts
export const retailPosProducts = pgTable("retail_pos_products", {
  id:             uuid("id").primaryKey().defaultRandom(),
  barcode:        text("barcode").unique().notNull(),
  name:           text("name").notNull(),
  name_ru:        text("name_ru"),
  category:       text("category"),
  unit_price:     decimal("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  unit:           text("unit").notNull().default("dona"),
  stock_quantity: decimal("stock_quantity", { precision: 12, scale: 3 }).default("0"),
  min_stock:      decimal("min_stock", { precision: 12, scale: 3 }).default("0"),
  is_active:      boolean("is_active").default(true),
  image_url:      text("image_url"),
  created_by:     text("created_by"),
  created_at:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("retail_pos_products_barcode_idx").on(t.barcode),
  index("retail_pos_products_active_idx").on(t.is_active),
]);
```

### Who reads which

`Grep "\bposProducts\b" Uzbek-Language-Module/**` returns three call sites:

1. `lib/db/src/schema/fi-payroll-ext.ts:259,280,287` — the definition + insert
   schema + type export.
2. `apps/api/src/shared/db/schema-ext-b-2.ts:38` —
   `export { posProducts as pos_products } from '@workspace/db';` — a
   re-export shim. Nothing imports from that shim.
3. `apps/api/src/modules/general/services/legacy-iot.service.ts:92` — a
   comment string only, not actual usage.

`Grep "\bretailPosProducts\b" Uzbek-Language-Module/**` shows it is imported by:

- `lib/db/src/schema/pos-retail.ts` (declaration site).
- `apps/api/src/shared/db/schema-pos-retail.ts:13` — re-export under snake_case alias.
- `apps/api/src/modules/pos/infrastructure/repositories/cash-register.repository.ts:11`
  via the aliased name `retail_pos_products`. Eight queries (lines
  55, 59, 71, 86, 99, 221, 277, 292, 305).
- `apps/api/src/modules/pos/infrastructure/repositories/cash-register.types.ts:8`
  for type aliases.
- `apps/api/src/modules/pos/application/services/cash-register.service.ts:10`
  via the type alias.

**Verdict: `pos_products` is dormant. `retail_pos_products` is the live table.**

### Migration drift on `pos_products`

The compiled SQL migration `apps/api/drizzle/0000_volatile_ender_wiggin.sql:3980`
has a *different shape* than the Drizzle declaration:

```sql
CREATE TABLE "pos_products" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text,
    "category_id" integer,
    "barcode" text,
    "price" numeric(15, 2) DEFAULT '0',
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);
```

vs the Drizzle defn in `fi-payroll-ext.ts:259`, which declares
`unit_price numericMoney`, `stock_quantity`, `min_stock`, `unit`, `image_url`,
`name_ru`, etc. So:

- The migration produces a *7-column* `pos_products` table.
- The Drizzle code thinks it is a *12-column* table.

If anyone re-introduces use of `posProducts` from Drizzle, the runtime would
fail with column-not-found. `retail_pos_products` does not have this problem
— migration (`0000_volatile_ender_wiggin.sql:1101`) and Drizzle declaration
match column-for-column.

The DROP guard at `apps/api/src/shared/db/migrations/drop-dormant-tables.sql:27`
is commented out specifically because `schema-ext-b-2.ts:38` still re-exports
the symbol:

```sql
-- DROP TABLE IF EXISTS pos_products CASCADE;   -- enable only after removing schema-ext-b-2.ts re-export
```

The DROP is partly already applied (`payroll_calculations`, `pos_transactions`
are uncommented; `pos_products` is not).

---

## 2. Price storage & history

### Storage

Only one column carries the sale price of a retail product:

`retail_pos_products.unit_price` — `decimal(18, 2) NOT NULL DEFAULT '0'`
(`pos-retail.ts:19`).

No "cost", "list_price", "wholesale_price", "promo_price", or
"effective_from"/"effective_to" columns exist. The same column is read at sale
time (`cash-register.service.ts:115`):

```ts
const unitPrice = Number(productResult.data.unit_price);
resolvedItems.push({ ..., unitPrice, total: unitPrice * item.quantity });
```

— so the live `unit_price` at the moment of `createTransaction` is what gets
quoted to the customer.

### How updates happen (or rather, do not)

There is **no UPDATE flow for `unit_price`**.

- `cash-register.repository.ts` has methods `findProducts`, `findProductById`,
  `findProductByBarcode`, `insertProduct`, `findTransactions`,
  `findTransactionById`, `insertTransaction`, `insertTransactionAtomic`,
  `refundTransaction`, `getDashboard`, `decrementStock`, `incrementStock` —
  **no `updateProduct`**.
- `cash-register.controller.ts:29-88` exposes `@Get('products')`,
  `@Post('products')`, `@Get('scan/:barcode')`, `@Get('transactions')`,
  `@Post('transactions')`, `@Post('transactions/:id/refund')`,
  `@Get('receipt/:id')`, `@Get('dashboard')` — **no `@Patch`/`@Put`/`@Delete`**.
- `Grep '@Patch|@Put.*retail|update.*retail_pos|update.*retailPosProducts' apps/api/src/**` finds **zero** matches that touch retail product rows. All
  `tx.update(retail_pos_products)` calls (lines 277, 292, 305) mutate
  `stock_quantity` only.

So a price change requires a direct SQL `UPDATE retail_pos_products SET unit_price = … WHERE id = …` against the database. There is no permissioned UI/API path.

### Price history

No price-history table exists.

- `Grep 'price_history|priceHistory|product_price_history' lib/db/src/schema/**` → 0 matches.
- The `retail_pos_products` row has `updated_at` (`pos-retail.ts:27`) but no
  trigger or shadow table; updating it overwrites `unit_price` irretrievably.
- The JSON payload in `retail_pos_transactions.items` (`pos-retail.ts:50`)
  captures `unitPrice` per line at the moment of sale (see
  `cash-register.service.ts:116`), so the price *paid* is auditable per
  transaction. But the price *table state* before/after a change is not
  recorded anywhere.
- `material_cards.lastPurchasePrice` (`mm-material-cards.ts:82`) and
  `lastPurchaseDate` (`:83`) store the most recent purchase price for raw
  materials only — a single value, not a series, and unrelated to retail
  sale prices.

---

## 3. SKU / barcode / unit-of-measure handling

### SKU

There is **no `sku` column on `retail_pos_products`**. `Grep "sku|SKU" lib/db/src/schema/pos-retail.ts` returns nothing. Barcode is treated as the de-facto unique product identifier from the client side (the POS panel's primary input is the barcode scanner: `POSDashboardPOSPanel.tsx:74-87`).

### Barcode

Three independent barcode storage tables exist:

| Table | Column | Type | Constraints |
|---|---|---|---|
| `retail_pos_products` | `barcode` | `text` | `NOT NULL UNIQUE` (`pos-retail.ts:15`) |
| `material_cards` | `barcode` | `varchar(100)` | nullable, not unique (`mm-material-cards.ts:93`) |
| `inventory_barcode_assignments` | `barcode` | `varchar(200)` | `NOT NULL UNIQUE`, FK to `inventory_passports` (`pos-schema.ts:132-134`) |

There is **no FK linking them**: a barcode on a `retail_pos_products` row is *not* required to exist in `inventory_barcode_assignments`, and vice versa.

`inventory_passports.productId` is a plain `varchar(50)` text field (`pos-schema.ts:107`) — explicitly not a FK to any of the three product tables.

Barcode lookup paths:

- `POST /pos/scan/:barcode` (`cash-register.controller.ts:48-52`) →
  `findProductByBarcode` (`cash-register.repository.ts:81`) — hits
  `retail_pos_products` only.
- `POST /pos/barcode/scan` (`barcode.controller.ts:47-51`) →
  `PosBarcodeService.scanBarcode` — hits `inventory_barcode_assignments` /
  `inventory_passports` / `material_cards` flow (separate WMS-side system).

The two `/scan` endpoints serve different purposes; the cashier app uses the
first, the WMS uses the second. They do not cross-reference.

### Unit of measure

`retail_pos_products.unit` is `text NOT NULL DEFAULT 'dona'` (`pos-retail.ts:20`) — a free-text string, not an enum. The Drizzle declaration's `unit_price` precision is `(18, 2)` and `stock_quantity` precision is `(12, 3)`, which suggests support for fractional units (e.g. `1.250 kg`), but there is no UOM master table. `material_cards.unitOfMeasure` (`mm-material-cards.ts:65`) holds free-text values "kg, dona, m2, rlon" per the inline comment — same shape, also free text.

No UOM conversion factors anywhere — pricing in `unit_price * quantity` (cash-register.service.ts:116) assumes the two unit semantics already match.

---

## 4. Product hierarchy

### Free-text on retail_pos_products

`retail_pos_products.category` is `text` (`pos-retail.ts:18`), nullable, with **no FK**.

The repository never filters by category — `findProducts(search?: string)` (`cash-register.repository.ts:50-64`) filters only by `name ILIKE %search%` and `is_active = true`. The frontend's product grid (`POSDashboardPOSPanel.tsx`) does not display a category filter.

### Candidate master tables (all unused by POS)

Two product-category tables exist elsewhere in the codebase:

1. **`product_categories`** — `lib/db/src/schema/pp/pp-enhanced.ts:283`,
   serial PK, hierarchical (`parentId references productCategories.id`),
   slug-based, used by `publicProducts` (`ecommerce-schema.ts:18`) and
   `portfolio_items`.
2. **`pos_categories`** — `apps/api/src/shared/db/schema-ext-b-2.ts:30`,
   serial PK, simple `(id, name, is_active, created_at)`. Defined only;
   `Grep "pos_categories|posCategories" apps/api/src/modules/**` → no
   references from any module.

`retail_pos_products.category` is not joined to either.

`material_cards.category` (`mm-material-cards.ts:66`) is also free-text varchar(30) with no FK — a parallel free-text taxonomy for raw materials.

### No category hierarchy on POS

The cashier app has no notion of "Drinks → Hot drinks → Coffee → Espresso". Category, if set at all, is a flat string with no validation.

---

## 5. Multi-warehouse pricing

There is **no multi-warehouse pricing for retail products**.

`retail_pos_products` has no `warehouse_id`, no `location_id`, no `branch_id` column. The single `unit_price` value is global across all retail outlets. `stock_quantity` is likewise a single scalar — the table cannot represent "10 units at warehouse A, 5 at warehouse B".

For comparison, the warehouse-side `material_cards` table *does* carry a warehouse FK (`mm-material-cards.ts:88`):

```ts
warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
```

— but that is per-card, not per-(card, warehouse) pair, so it also represents a single warehouse per material. To model true multi-warehouse stock for materials there is a separate `wms` module (not part of this report's scope; it has its own `stock_levels` / `bin` tables — see Report 09).

For *retail* products on the cashier flow:

- `Grep "warehouse_price|warehousePrice|priceList|price_list|priceTier|price_tier" lib/db/src/schema/**` → **0 hits.**
- No price-list table, no customer-tier pricing, no per-store/per-region pricing.

The system, by design, supports a single price per SKU across a single physical location.

---

## 6. Discount / promotion logic

### Current implementation

Discount is a **per-transaction flat amount**, captured in two places:

1. **Wire DTO** — `cash-register.service.ts:34`:
   ```ts
   discountAmount: z.number().min(0).default(0),
   ```
2. **DB column** — `retail_pos_transactions.discount_amount` `decimal(18,2) DEFAULT '0'` (`pos-retail.ts:52`).

The cashier UI captures it as a freeform number (`POSDashboard.tsx:56` →
`POSDashboardPOSPanel.tsx` props `discountAmount`/`setDiscountAmount`).

### Calculation

`cash-register.service.ts:119-122`:

```ts
const subtotal     = resolvedItems.reduce((sum, i) => sum + i.total, 0);
const taxableBase  = Math.max(0, subtotal - dto.discountAmount);
const taxAmount    = Math.round((taxableBase * dto.taxRate) / (100 + dto.taxRate));
const totalAmount  = subtotal - dto.discountAmount;
```

Notes:

- Tax is computed against the *post-discount* base.
- `totalAmount = subtotal - discountAmount` — i.e. the total is the discounted
  pre-tax amount, *not* `(subtotal - discount) + tax`. So the receipt total
  ignores the tax line. The `tax_amount` column is computed and stored but
  not added to the customer's total. This is a math bug in
  `cash-register.service.ts:122`.
- Default `taxRate = 12` (Uzbek VAT rate) but the discount flow does not check
  that `discountAmount <= subtotal`. `Math.max(0, …)` is used only in
  `taxableBase`, not in `totalAmount`, so a `discountAmount` larger than
  `subtotal` can produce a negative `total_amount`. The DB CHECK constraint
  `retail_pos_txn_total_chk` (`pos-retail.ts:67`) is `total_amount >= 0`, so
  the INSERT would fail — but with a generic SQL error, not a friendly
  validation message.

### No promotion/coupon infrastructure

- `Grep "discount|promotion|coupon" lib/db/src/schema/**` → matches in
  `pos-retail.ts` (the `discount_amount` column above),
  `crm-deal-products.ts`, `crm-proposals.ts`, `crm-contacts.ts`,
  `order-workflow-schema.ts`, `fi-payroll-ext.ts` (payroll discounts) — but
  no `discount_rules`, `promotions`, `coupons`, `loyalty_tiers`,
  `bogo_offers`, or similar tables.
- No item-level discount column on the JSONB cart items — the cashier
  applies a single dollar amount across the whole basket.
- No customer-tier discount (`retail_pos_transactions.customer_id` is
  `text` and not FK-checked — it can hold a string from anywhere).

### Permission model

`cash-register.controller.ts:25` gates all eight endpoints with the same
guard:

```ts
@Roles('cashier', 'pos_manager', 'admin', 'manager')
@UseGuards(RolesGuard)
```

— so any cashier can apply any discount amount up to subtotal. There is no
manager-approval workflow, no maximum-discount-percentage cap, no audit row
distinguishing "discounted by cashier X with manager Y override".

---

## 7. Frontend integration

### Pages

| Page file | Purpose | Calls |
|---|---|---|
| `artifacts/erp-dashboard/src/pages/POSDashboard.tsx` | Route-level page; query orchestration | `GET /api/pos/products?search=…&active=true` (`:88`), `GET /api/pos/sales/daily` (`:94`), `GET /api/pos/inventory/low-stock` (`:101`), `POST /api/pos/sales` (`:119`) |
| `artifacts/erp-dashboard/src/pages/POSDashboardPOSPanel.tsx` | Product grid + cart + checkout button | barcode input, search input, add-to-cart |
| `artifacts/erp-dashboard/src/pages/POSDashboardDialogs.tsx` | Payment + receipt only — **NO product create/edit dialog** | none — purely presentational |
| `artifacts/erp-dashboard/src/pages/POSDashboardCards.tsx` | Sale-count / revenue / avg-sale / low-stock KPI cards | none |
| `artifacts/erp-dashboard/src/pages/POSDashboardCharts.tsx` | Monthly / payment charts + daily table | none |
| `artifacts/erp-dashboard/src/pages/POSInventoryPage.tsx` | Inventory-movements / low-stock / adjustments table | `GET /api/pos/inventory/movements`, `GET /api/pos/inventory/low-stock`, `GET /api/pos/inventory/monthly-report`, `GET /api/pos/products?active=all`, `PATCH /api/pos/inventory/:productId/adjust` |
| `artifacts/erp-dashboard/src/lib/pos-sync.ts` | Offline-queue flusher | `POST /api/pos/sales` (`:56`), `GET /api/pos/products?active=true&limit=1000` (`:96`) |
| `artifacts/erp-dashboard/src/lib/api/operations.ts:78-83` | Stale operation helpers | `createPosProduct → POST /api/pos/products`, `createPosTransaction → POST /api/pos/transactions`, `refundPosTransaction → POST /api/pos/transactions/:id/refund` |

### Wire contract mismatches

#### `productId` type

`POSDashboardTypes.ts:14-26`:

```ts
export interface PosProduct {
  id: number;
  …
}
```

But `retail_pos_products.id` is `uuid` (`pos-retail.ts:14`), and the API
maps it through with `id: p.id` (`cash-register.service.ts:51`) — the
server returns string UUIDs but the frontend's TS type says number. In
practice the React Query layer treats `id` as opaque, but the cart's
`productId: number` (`POSDashboardTypes.ts:29`) is used as the key for
`onUpdateQty(productId: number, delta: number)`
(`POSDashboardPOSPanel.tsx:49`) and as `i.productId` in the POST body
(`POSDashboard.tsx:170`). The server's Zod validator on the canonical
`/pos/transactions` endpoint expects `product_id: z.number().int().positive()`
(`pos-cash-register.dto.ts:19`) — but the service then re-parses it as
`productId: z.string()` (`cash-register.service.ts:27`). The legacy
`/pos/sales` adapter accepts `z.union([z.string(), z.number()])`
(`pos-stub.controller.ts:32`), which is the only path that survives both ends.

#### `addProduct` double-validation

`cash-register.controller.ts:40`:

```ts
@Post('products')
@UsePipes(new ZodValidationPipe(PosAddProductSchema))
```

…validates against `PosAddProductSchema` (`pos-cash-register.dto.ts:8`):

```ts
{ product_id?, name?, price?, quantity?, barcode? }.passthrough();
```

— all fields optional, snake_case, and `price` rather than `unit_price`.

Then the body is forwarded to `CashRegisterService.addProduct(body, ...)`
(`cash-register.service.ts:87`), which re-parses with
`CreateProductSchema` (`cash-register.service.ts:13-23`):

```ts
{ barcode: required, name: required, unitPrice: required, nameRu?, category?, unit?, stockQuantity?, minStock?, imageUrl? }
```

— a *different* shape. A request with `{ price: 5000, name: "X", barcode: "Y" }`
passes the controller (optional fields, `.passthrough()`) but throws Zod errors
at the service (`unitPrice` missing, `price` ignored). The two DTOs were never
reconciled.

### No UI for product creation

Search the dashboard:

- `POSDashboardDialogs.tsx` — only `PaymentDialog`, `ReceiptDialog`.
- `POSDashboardPOSPanel.tsx` — only search + grid + cart + checkout.
- `POSInventoryPage.tsx` — only movements/adjustments table; no "Add product" button.
- `Grep '/api/pos/products' artifacts/erp-dashboard/src/**` for POST — only
  the helper in `operations.ts:78` (no UI calls it) and `pos-sync.ts:96` (GET,
  not POST).

So `POST /api/pos/products` (the controller endpoint at `cash-register.controller.ts:39`) has no UI caller. The product catalogue is populated only via direct SQL or some out-of-band seeding script.

### Offline cache

`POSDashboard.tsx:50` uses `usePosOffline()` (defined at
`artifacts/erp-dashboard/src/hooks/use-pos-offline.ts`). When the browser
is offline:

- `getOfflineProducts(query)` serves the most-recently-cached product list
  from IndexedDB (`pos-sync.ts:96` fills the cache when online).
- `saveOfflineSale(...)` queues the sale locally; `pos-sync.ts:56` flushes
  the queue when network returns by re-POSTing to `/api/pos/sales`.

This is the only mechanism that handles concurrent stock changes — the
offline queue assumes stock will still be available when it eventually
flushes; if not, the server's `GREATEST(0, stock_quantity - qty)` clamps
silently and the cashier never learns the sale exceeded available stock.

---

## 8. Findings summary

### P0 — broken / silently wrong

| # | Finding | Evidence |
|---|---|---|
| P0-1 | **No price-update endpoint.** `retail_pos_products.unit_price` cannot be modified through any HTTP route. Once a product is created, pricing requires direct SQL. | `cash-register.controller.ts` exposes only `GET /products`, `POST /products`, `GET /scan/:barcode`. No `@Patch`/`@Put`/`@Delete`. `cash-register.repository.ts` has no `updateProduct` method. |
| P0-2 | **Total ignores tax.** Receipt total = `subtotal − discount`. `tax_amount` is computed and stored but never added to what the customer pays. | `cash-register.service.ts:122` — `const totalAmount = subtotal - dto.discountAmount;` (vs `taxableBase + taxAmount` if VAT is *exclusive*, or no change if VAT is *inclusive* — but then the math at `:121` is wrong because it derives `taxAmount = base * rate / (100 + rate)`, the inclusive-VAT formula). The system is internally inconsistent. |
| P0-3 | **Migration drift on `pos_products`.** The compiled SQL table has 7 columns; the Drizzle declaration declares 12 columns with `NOT NULL` on `barcode` and `unit_price`. Any code that goes through Drizzle would crash on column-not-found. | `apps/api/drizzle/0000_volatile_ender_wiggin.sql:3980` vs `lib/db/src/schema/fi-payroll-ext.ts:259`. |
| P0-4 | **`productId` type mismatch across layers.** Frontend types it as `number`, controller DTO validates as `number`, service DTO re-validates as `string`, DB column is `uuid`. The canonical `/pos/transactions` endpoint cannot accept a real UUID. The legacy `/pos/sales` shim is the only working path. | `POSDashboardTypes.ts:15,29`; `pos-cash-register.dto.ts:19`; `cash-register.service.ts:27`; `pos-retail.ts:14`. |

### P1 — significant gaps

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **No price history.** `unit_price` updates (even via SQL) overwrite the previous value with no shadow table. | No `price_history` / `product_price_history` table anywhere in `lib/db/src/schema/**`. `retail_pos_products` has `updated_at` (`pos-retail.ts:27`) but no trigger. |
| P1-2 | **`pos_products` dormant duplicate, still re-exported.** Confused symbol space; DROP guard explicitly disabled until re-export removed. | `apps/api/src/shared/db/schema-ext-b-2.ts:38`; `apps/api/src/shared/db/migrations/drop-dormant-tables.sql:27`. |
| P1-3 | **`items` is JSONB with no normalized line table.** Per-item return reporting, refund-by-item, FIFO cost basis, sales-by-category aggregates all become harder. | `pos-retail.ts:50` `items: jsonb("items").notNull().default("[]")`. |
| P1-4 | **`addProduct` double-validation with incompatible schemas.** Controller-side Zod schema and service-side Zod schema were never reconciled. | `cash-register.controller.ts:40` + `pos-cash-register.dto.ts:8` vs `cash-register.service.ts:13`. |
| P1-5 | **`addProduct` has no UI.** Live product catalogue can only be seeded out-of-band. The wire endpoint exists; no React component calls it. | `Grep '/api/pos/products' artifacts/erp-dashboard/src/**` returns GET callers and one operation helper, no POST UI. |
| P1-6 | **Race on `stock_quantity`.** `insertTransactionAtomic` (`cash-register.repository.ts:248`) is per-sale atomic but uses `GREATEST(0, stock_quantity - qty)` without `SELECT FOR UPDATE`; two concurrent sales of the last unit can both succeed and clamp to zero, leaving stock under-decremented. | `cash-register.repository.ts:278` `set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${item.quantity})` })`. |
| P1-7 | **`discountAmount` not bounded against `subtotal`.** Negative `total_amount` is rejected only at the DB CHECK level. | `cash-register.service.ts:122`; `pos-retail.ts:67` `retail_pos_txn_total_chk total_amount >= 0`. |

### P2 — design holes

| # | Finding | Evidence |
|---|---|---|
| P2-1 | **No SKU column.** Barcode is the de-facto identifier; multi-barcode-per-product or barcode-less products are not representable. | `pos-retail.ts:13-31` — no `sku` field; `barcode` is `NOT NULL UNIQUE`. |
| P2-2 | **Three independent barcode storage tables**, no FK between them. | `retail_pos_products.barcode`, `material_cards.barcode`, `inventory_barcode_assignments.barcode`. |
| P2-3 | **`category` is free-text** on both `retail_pos_products` and `material_cards`. A `product_categories` master table exists (`pp/pp-enhanced.ts:283`, hierarchical) but is unused by POS. A second `pos_categories` table (`schema-ext-b-2.ts:30`) is also unused. | Three category mechanisms, none wired. |
| P2-4 | **No multi-warehouse pricing.** `retail_pos_products` has no `warehouse_id`. Single global price + single global stock count. | `pos-retail.ts:13-31`. |
| P2-5 | **No discount/promotion infrastructure.** Discount is a per-transaction flat amount, no rules engine, no tier/coupon tables. | `Grep` on `lib/db/src/schema/**` for `discount_rules|promotions|coupons` → 0 hits. |
| P2-6 | **No UOM master table or conversion factors.** `unit` is free text on both `retail_pos_products` and `material_cards`. | `pos-retail.ts:20`; `mm-material-cards.ts:65`. |
| P2-7 | **`created_by` is plain `text`.** No FK to `users`, no referential integrity for the cashier audit trail. | `pos-retail.ts:25` `created_by: text("created_by")`. |
| P2-8 | **No price-change approval workflow.** All POS endpoints share `@Roles('cashier', 'pos_manager', 'admin', 'manager')` (`cash-register.controller.ts:25`). | Same role guard for `POST /products`, `POST /transactions/:id/refund`, `POST /transactions`. |

---

**Bottom line.** The retail-POS path works for the simplest happy case
(`POST /api/pos/sales` from a cashier with integer-id legacy payload through
the `pos-stub.controller.ts` adapter, which forwards to
`CashRegisterService.createTransaction`, which atomically inserts the
transaction and decrements stock). The canonical `/pos/transactions` REST
endpoint and the `/products` write endpoint both have layer-mismatched DTOs
and no UI callers. Price updates are not exposed at all. Tax math is off.
The `pos_products` dormant table is still present and its migrated SQL no
longer matches its TypeScript declaration. Round-1's report described
features (`PATCH /pos/products/:id`, product create/edit dialog) that do
not exist in the codebase.
