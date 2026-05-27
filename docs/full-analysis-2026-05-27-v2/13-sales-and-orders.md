# Report 13 — Sales & Orders

**Date:** 2026-05-27 (second-pass audit)
**Scope:** `apps/api/src/modules/sd/**`, `lib/db/src/schema/sd-*.ts`, `lib/db/src/schema/crm-contacts.ts` (crm_companies), `lib/db/src/schema/sd-customer-relations.ts`, `lib/db/src/schema/sd-europrint-schema.ts`, `apps/api/src/common/database/queries-sd.ts`, `artifacts/erp-dashboard/src/pages/SD*.tsx + OrderCreationWizard.tsx + OrderApprovalWorkflow.tsx`.

---

## Diff vs round 1

Round 1 (`docs/full-analysis-2026-05-27/13-sales-and-orders.md`) painted the SD module as the most complete in the codebase, with a working "23-stage `master_status` lifecycle" backed by real queries. Second pass disagrees on almost every load-bearing claim.

| Round-1 claim | Verified? | Correction |
|---|---|---|
| Single `sales_orders` table is the central document | **NO** | Three live tables exist: `sales_orders` (SAP-style, 71 cols), `sd_orders` (EuroPrint, 47 cols), `sd_sales_orders` (CQRS aggregate target). Different writers touch different tables. |
| 23-stage `master_status` lifecycle is enforced | **PARTIAL** | The 23-state CHECK constraint exists on `sales_orders.master_status` (sd-orders.ts:234). But neither the CQRS `UpdateOrderStatusHandler` nor the `OrdersService.updateStatus` validate against it. `SalesOrder.VALID_TRANSITIONS` only enumerates a 15-state graph that does **not** contain `pending_design`, `pending_sample_lab`, `in_fg_warehouse`, etc. — calls to transition to these states will fail with "Cannot transition" even though the DB accepts them. |
| `MASTER_STATUS_CHAIN` constant is the state machine | **NO** | It is a string array (sd-order-items.ts:56-63), but **no service or handler reads it**. The CQRS path uses `SalesOrder.VALID_TRANSITIONS` (15 states); `orders.constants.ts` defines a **third** `VALID_TRANSITIONS` (10 states); `status-machines.constants.ts` defines a **fourth** `SO_TRANSITIONS` (~26 states with `incomplete`/`waiting_customer_input` not in the master CHECK). None is wired to the public PATCH endpoint actually consumed by the front end. |
| `sales_orders.customer_id → crmCompanies.id`, `sd_customers` is a separate registry without sync | **CONFIRMED** | But it is worse: `sd_customers.id` and `crm_companies.id` are independent `serial` PKs, yet the SD repo joins `sales_orders.customer_id = sd_customers.id` (drizzle-sd-customers.repo.ts:29,53,77,154). Both joins are structurally invalid unless ID space happens to align. `sd_customers.crm_company_id` exists as a link column but is **never written** by `DrizzleSdCustomersRepository.create()`. |
| Reports back to real DB queries; no synthetic data | **MOSTLY TRUE, with exceptions** | `SdDashboardRepository`, `SdQuotationsRepository`, `DrizzleSdInvoicesRepository` etc. issue real SQL. But `SalesService.getForecastAccuracy` (sales.service.ts:42-52) returns hard-coded January/February/March numbers, and `SalesService.getForecastHistory` returns `{ history: [] }`. |
| `order_status_logs` populated on every status change | **NO** | Grep of `apps/api/src/modules/sd` finds zero writers to `order_status_logs` or `orderStatusLogs`. Only `modules/remaining/order-status.repository.ts` writes it, and it writes the wrong column names (`order_id` / `created_at` instead of the schema's `sales_order_id` / `changed_at`). |
| Dual customer registries, dual status columns are P1/P2 | **UPGRADE TO P0/P1** | Combined with three sales-order tables, three competing state machines, and silent FK breakage, the SD module is much more fragile than round 1 implied. |

The biggest miss in round 1 was treating `sd-orders.ts` and `sd-europrint-schema.ts` as one module's view of one entity. They are not — each defines an independent table, and a third (`sd_sales_orders`) is the one that actually receives writes from `POST /sd/orders`.

---

## 1. Module structure

There is no `apps/api/src/modules/sales/` — `ls` confirms it. All sales/SD logic lives under `apps/api/src/modules/sd/`. The module is layered:

```
apps/api/src/modules/sd/
├── application/
│   ├── commands/                        ← CQRS write side (NestJS @CommandHandler)
│   │   ├── approve-advance-bypass.handler.ts
│   │   ├── approve-tech-checkpoint.handler.ts
│   │   ├── confirm-advance-payment.handler.ts
│   │   ├── create-invoice.{command,handler}.ts
│   │   ├── create-order.handler.ts      ← writes sd_sales_orders (NOT sales_orders)
│   │   └── update-order-status.handler.ts
│   ├── queries/                         ← CQRS read side
│   ├── sd-customers.service.ts          ← delegates to DrizzleSdCustomersRepository
│   ├── sd-dashboard.{service,repository}.ts
│   ├── sd-leads.{service,repository}.ts
│   ├── sd-payments.{service,repository}.ts
│   └── sd-quotations.{service,repository}.ts
├── deliveries/                          ← non-CQRS service+repo (DeliveriesService)
├── domain/
│   ├── aggregates/
│   │   ├── sales-order.aggregate.ts             ← 15-state VALID_TRANSITIONS
│   │   └── sales-order-transitions.constants.ts ← 15-state SO_VALID_TRANSITIONS
│   ├── events/
│   ├── repositories/
│   └── value-objects/so-status.vo.ts
├── infrastructure/
│   ├── event-handlers/
│   └── repositories/
│       ├── drizzle-sales-order.repo.ts         ← reads/writes sd_sales_orders
│       ├── drizzle-sd-customers.repo.ts        ← writes sd_customers
│       ├── drizzle-quotation.repo.ts
│       ├── sd-dashboard.repository.ts          ← raw SQL against sales_orders
│       └── sd-quotations.repository.ts         ← writes sd_quotations, converts to sales_orders
├── invoices/                            ← service+repo (writes salesInvoices)
├── orders/
│   ├── orders.constants.ts              ← 10-state VALID_TRANSITIONS (third state machine)
│   ├── orders.service.ts                ← writes sales_orders (no transition validation)
│   └── drizzle-sd-orders.repo.ts        ← writes sales_orders
├── presentation/
│   ├── dto/
│   ├── sd-contracts.controller.ts
│   ├── sd-customers.controller.ts
│   ├── sd-deliveries.controller.ts
│   ├── sd-invoices.controller.ts
│   ├── sd-leads.controller.ts
│   ├── sd-orders.controller.ts          ← @Controller('sd/orders'), CQRS bus
│   ├── sd-payments.controller.ts
│   └── sd-quotations.controller.ts
├── sales/                               ← merged from former modules/sales (PA3-17 Wave 3)
│   └── sales.{controller,service,repository}.ts
└── sd.module.ts                         ← single Nest module wiring everything
```

`sd.module.ts:90-127` mounts all controllers in one `SdModule` and registers two repository tokens for what is functionally the same entity:

```ts
{ provide: SALES_ORDER_REPO, useClass: DrizzleSalesOrderRepository },  // → sd_sales_orders
{ provide: SD_ORDERS_REPO,   useClass: DrizzleSdOrdersRepository },     // → sales_orders
```

Two repositories for one concept, pointing at two different physical tables, both injected into the same Nest container. Whichever service grabs `SALES_ORDER_REPO` (the CQRS handlers) operates on a different table than whichever grabs `SD_ORDERS_REPO` (`OrdersService`).

---

## 2. master_status lifecycle

### 2.1 What the DB defines

`lib/db/src/schema/sd-orders.ts:147-152, 234`:

```ts
masterStatus: varchar("master_status", { length: 50 }).notNull().default("draft"),
// draft → incomplete → pending_design → pending_sample_lab → pending_manager_completion
// → pending_technology → pending_advance → ready_for_planning → planned
// → released_to_production → in_production → pending_qc_final → qc_failed → rework
// → ready_for_fg_warehouse → in_fg_warehouse → delivery_planned → in_delivery
// → delivered → partially_paid → fully_paid → closed | cancelled
...
check("sales_orders_master_status_chk",
  sql`${t.masterStatus} IN ('draft','incomplete','pending_design','pending_sample_lab',
       'pending_manager_completion','pending_technology','pending_advance',
       'ready_for_planning','planned','released_to_production','in_production',
       'pending_qc_final','qc_failed','rework','ready_for_fg_warehouse',
       'in_fg_warehouse','delivery_planned','in_delivery','delivered',
       'partially_paid','fully_paid','closed','cancelled')`),
```

23 values. The CHECK constraint enforces membership but **not transitions**. There is also a parallel `MASTER_STATUS_CHAIN` constant in `sd-order-items.ts:56-63`:

```ts
export const MASTER_STATUS_CHAIN = [
  "draft", "incomplete", "pending_design", "pending_sample_lab",
  "pending_manager_completion", "pending_technology", "pending_advance",
  "ready_for_planning", "planned", "released_to_production", "in_production",
  "pending_qc_final", "qc_failed", "rework", "ready_for_fg_warehouse",
  "in_fg_warehouse", "delivery_planned", "in_delivery", "delivered",
  "partially_paid", "fully_paid", "closed", "cancelled",
] as const;
```

A `grep -R MASTER_STATUS_CHAIN apps/api/src/modules/sd` returns **zero hits**. The 23-stage array is declared and never consumed.

### 2.2 What actually validates transitions

There are FOUR competing state-machine definitions, and they disagree:

| Source | States | Used by |
|---|---|---|
| `sd-orders.ts` CHECK constraint | 23 (master_status chain above) | DB enforcement on `sales_orders.master_status` writes |
| `apps/api/src/common/constants/status-machines.constants.ts:9-36` `SO_TRANSITIONS` | ~26 (includes `incomplete`, `waiting_customer_input`, `tech_rejected`, `on_hold`) | Declared, not imported by any SD service (grep shows usage only in docs) |
| `apps/api/src/modules/sd/domain/aggregates/sales-order.aggregate.ts:300-316` `SalesOrder.VALID_TRANSITIONS` | **15** (`draft → pending_approval → approved → pending_advance → ready_for_planning → in_planning → completed_planning → ready_for_production → in_production → ready_for_shipment → shipped → delivered → closed`, plus `cancelled`/`on_hold`) | `transitionStatus()` in the aggregate, called by `UpdateOrderStatusHandler` |
| `apps/api/src/modules/sd/orders/orders.constants.ts:19-30` `VALID_TRANSITIONS` | 10 (`draft → confirmed → pending_advance → ready_for_planning → in_production → in_delivery → delivered → closed`, plus `cancelled`/`on_hold`) | Exported but `grep` shows no importer — dead code, but it advertises a third graph |

The CQRS path (`POST /sd/orders` then `PATCH /sd/orders/:id/status`) routes:

```
SdOrdersController.updateStatus
  → CommandBus → UpdateOrderStatusHandler.execute
  → orderRepo.findById  (DrizzleSalesOrderRepository → table sd_sales_orders)
  → order.transitionStatus(newStatus)
  → SalesOrder.VALID_TRANSITIONS lookup (15 states, no pending_design/qc_failed/etc.)
```

(`apps/api/src/modules/sd/application/commands/update-order-status.handler.ts:26-77`, `apps/api/src/modules/sd/domain/aggregates/sales-order.aggregate.ts:283-316`)

So a manager who tries `PATCH /sd/orders/123/status { newStatus: "pending_design" }` will get **HTTP 403 "Cannot transition from draft to pending_design"** even though the DB's CHECK constraint accepts it. The 23-stage lifecycle round 1 documented is unreachable via the CQRS API.

The non-CQRS path (`OrdersService.updateStatus` in `apps/api/src/modules/sd/orders/orders.service.ts:52-59`) has **no transition validation at all**:

```ts
async updateStatus(id: number, masterStatus: string){
  return safeCall(async () => {
  await this.findOne(id);
  const result = await this.sdOrdersRepo.updateMasterStatus(id, masterStatus);
  ...
```

And `DrizzleSdOrdersRepository.updateMasterStatus` (orders/drizzle-sd-orders.repo.ts:86-91):

```ts
async updateMasterStatus(id: number, masterStatus: string) {
  ...
  const result = await db.update(salesOrders)
    .set({ overallStatus: masterStatus, updatedAt: _time.now() })
    .where(...).returning();
```

— writes the value to **`overallStatus`**, not `masterStatus`! And `overall_status` has its own CHECK: `IN ('IN_PROCESS','COMPLETED','CANCELLED')` (sd-orders.ts:220). Calling this helper with `'in_production'` will raise a Postgres CHECK violation; calling it with `'COMPLETED'` will quietly overwrite `overall_status` and leave `master_status` untouched. The method is misnamed and broken.

### 2.3 `order_status_logs` is not populated

Schema (`lib/db/src/schema/sd-order-items.ts:166-178`):

```ts
export const orderStatusLogs = pgTable("order_status_logs", {
  id: serial("id").primaryKey(),
  salesOrderId: varchar("sales_order_id").notNull().references(...),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  changedBy: varchar("changed_by").references(...),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  ...
});
```

Grep of `apps/api/src/modules/sd/**` for `orderStatusLogs`/`order_status_logs` returns **no hits**. `UpdateOrderStatusHandler.execute` only publishes an in-process `OrderStatusChangedEvent`; nobody persists it.

The only writer is `apps/api/src/modules/remaining/order-status.repository.ts:31-43`:

```ts
const rows = await runQuery<Row>(sql`
  INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, notes, created_at)
  SELECT id, status, ${newStatus}, ${userId}, ${notes ?? null}, NOW()
  FROM sales_orders WHERE id::text = ${orderId}
  RETURNING *
`);
```

It writes columns `order_id` and `created_at` — the schema has `sales_order_id` and `changed_at`. Either the live DB has both column sets (drift) or this INSERT raises "column does not exist". The two CHECK-able statements about logging are mutually inconsistent.

---

## 3. Dual customer registries

### 3.1 The two tables

`crm_companies` is defined in `lib/db/src/schema/crm-contacts.ts:228` (per `grep ^export const crmCompanies = pgTable`). `sales_orders.customer_id`, `quotations.customer_id`, `deliveries.customer_id`, `sales_invoices.customer_id`, `customer_credit_limits.customer_id`, `credit_check_logs.customer_id`, `crmCompanies`-FKed throughout — see `sd-orders.ts:27,106`; `sd-delivery.ts:29,227`; `sd-billing.ts:38,68`.

`sd_customers` is defined in `lib/db/src/schema/sd-europrint-schema.ts:20-58`:

```ts
export const sdCustomers = pgTable("sd_customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stir: varchar("stir", { length: 20 }),
  /** INN — same registry number, kept as alias column for legacy INSERT compatibility */
  inn: varchar("inn", { length: 20 }),
  legalAddress: text("legal_address"),
  /** Generic address column (legacy INSERT uses 'address'; mirrors actual_address) */
  address: text("address"),
  actualAddress: text("actual_address"),
  ...
  // Link to CRM company (application-level FK — avoids circular import)
  crmCompanyId: integer("crm_company_id"),
  ...
});
```

The header comment for the file says:

```ts
// NOTE: FK references to quotations, salesOrders, crmCompanies are loose (application-level)
// to avoid circular imports. quotations.id, salesOrders.id, crmCompanies.id are
// kept as integer without DB-level FK constraint.
```

So `sd_customers.crm_company_id` is a logical pointer with no FK constraint.

### 3.2 Who writes to which?

| Writer | Target | Reads |
|---|---|---|
| `DrizzleSdCustomersRepository.create()` (drizzle-sd-customers.repo.ts:131-147) | `sd_customers` | — |
| CRM module (`apps/api/src/modules/crm`) | `crm_companies` | — |
| `sd-quotations.repository.ts:25-30` (`listQuotations`) | reads | `sd_quotations LEFT JOIN sd_customers` |
| `drizzle-sd-customers.repo.ts:29,53,77,154` (list/getById/get360View/getRecentOrders) | reads | `sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id` |
| `sd-dashboard.repository.ts:28` (`getTopCustomers`) | reads | `sales_orders o LEFT JOIN sd_customers c ON c.id::text = o.customer_id::text` |
| `convertQuotationToOrder` (sd-quotations.repository.ts:121-137) | writes | `INSERT INTO sales_orders ... company_id` from `sd_quotations.customer_id` |

The structural break:

* `sales_orders.customer_id` is declared `integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' })` in the Drizzle schema (sd-orders.ts:106). If the live DB enforces that FK, then any value in `sales_orders.customer_id` must exist in `crm_companies.id`.
* The SD repo joins `sales_orders.customer_id` to `sd_customers.id`. Both `crm_companies.id` and `sd_customers.id` are independent `serial` PKs, so the same integer means two different companies in the two registries.
* `DrizzleSdCustomersRepository.create()` (lines 131-147) inserts a row into `sd_customers` **without** populating `crm_company_id` and **without** creating a matching row in `crm_companies`. Subsequent quotation→order conversion will write that `sd_customers.id` into `sales_orders.customer_id` (sd-quotations.repository.ts:122-128) — if the FK on `sales_orders.customer_id → crm_companies.id` is live, that INSERT fails with FK violation. If it has been dropped or set to `set null`, the order ends up with `customer_id = NULL`.

There is no event listener, no trigger, and no controller endpoint that copies an `sd_customers` row into `crm_companies` (or vice versa). Grep for `sd_customers` / `sdCustomers` inside `apps/api/src/modules/crm/` returns one unrelated documents repo hit; no sync code.

### 3.3 Denormalised counters drift

`sd_customers.total_orders` and `sd_customers.total_revenue` (sd-europrint-schema.ts:39-40) are integer/numericMoney columns intended to hold aggregates. But the actual customer-list repo *ignores them* and computes the aggregate on the fly (drizzle-sd-customers.repo.ts:24-44):

```sql
SELECT c.id, ..., COUNT(DISTINCT o.id)::int AS "totalOrders",
       COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS "totalRevenue"
FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
...
```

So both forms exist in the DB (denormalised columns and live aggregation), with no writer keeping the columns up to date. Anyone querying `sd_customers.total_orders` directly will see stale zeros, while the UI sees the recomputed value.

### 3.4 `stir` / `inn` aliasing in writes

`drizzle-sd-customers.repo.ts:115-127` (update) and 138-144 (create) write the same value into both `stir` and `inn` columns:

```ts
SET name = COALESCE(${finalName}, name),
    stir = COALESCE(${finalStir}, stir),
    inn  = COALESCE(${finalStir}, inn),
    ...
```

```ts
INSERT INTO sd_customers (name, stir, inn, phone, email, address, actual_address, ...)
VALUES (${finalName}, ${finalStir}, ${finalStir}, ${phone ?? null}, ..., ${actualAddress}, ${actualAddress}, ...)
```

Same pattern for `address` / `actual_address`. So a single user input is fanned into four columns. Any external writer that sets only `stir` or only `address` produces an asymmetric row that the SD repo will not detect, because reads pull `c.stir` and `c.actual_address` first.

---

## 4. Duplicate tax columns

`_audit_out/db-columns-by-table.json` shows the live-DB column lists:

| Table | Tax/VAT/discount columns | Notes |
|---|---|---|
| `sales_orders` | `tax_amount` (single) | But also `total_amount`, `total_value`, `net_value`, `paid_amount`, `advance_paid`, `advance_paid_amount`, `advance_percent`, `advance_required`, `tech_bom_approved`, `bom_checked`, `tech_routing_approved`, `routing_checked`, `tech_card_approved`, `tech_card_checked`, `order_number`, `document_number`, `status`, `master_status`, `overall_status`, `module_status` — many other duplicate pairs. |
| `sales_order_items` | `tax_code`, `tax_amount` (`tax_code='V1'` = 12% VAT) | OK; `tax_code` is a tax-class lookup, `tax_amount` is the absolute amount. Not strictly redundant, but the price field is computed entirely client-side and there is no derivation guard. |
| `quotations` (SAP-style) | `tax_amount`, `vat_rate` | Two tax fields for one document. `vat_rate` looks orphaned. |
| `sd_quotations` (EuroPrint) | `tax_amount`, `vat_rate` | Same — independent table with the same redundant pair. |
| `sales_invoices` | `tax_amount` (single) | OK. |
| `sd_customers` | `discount_rate` | Single, but `crm_companies` also has `discount_rate` — same field maintained twice across registries. |

The `sales_orders` table has 71 columns in the live DB; many are aliases of each other from the ADD-ONLY merge:

```ts
// sd-orders.ts:193-218 — "Live DB superset (ADD-ONLY)"
orderNumber: varchar("order_number", { length: 50 }),           // ↔ documentNumber
status: varchar("status", { length: 30 }),                       // ↔ overallStatus / masterStatus
totalAmount: numericMoney("total_amount"),                       // ↔ totalValue
paidAmount: numericMoney("paid_amount").default(0),
notes: text("notes"),
customerName: text("customer_name"),
dealId: varchar("deal_id"),                                      // ↔ crmDealId
companyId: integer("company_id"),                                // ↔ customerId (different domain!)
assignedTo: varchar("assigned_to"),
advanceRequiredAmount: numericMoney("advance_required"),         // ↔ advanceRequired (percent)
advancePaid: numericMoney("advance_paid").default(0),            // ↔ advancePaidAmount
advanceBypassBy: varchar("advance_bypass_by"),
advanceBypassReason: text("advance_bypass_reason"),
bomChecked: boolean("bom_checked").default(false),               // ↔ techBomApproved
routingChecked: boolean("routing_checked").default(false),       // ↔ techRoutingApproved
techCardChecked: boolean("tech_card_checked").default(false),    // ↔ techCardApproved
version: bigint("version", { mode: "number" }).default(0),
```

There is no single canonical "total" or "advance paid" or "tech checkpoint" column — different code paths read and write different ones.

---

## 5. Sales order creation & line items

### 5.1 The three creation paths

**Path A — CQRS `POST /sd/orders`** (`apps/api/src/modules/sd/presentation/sd-orders.controller.ts:92-109` → `CreateOrderHandler` → `DrizzleSalesOrderRepository.save` → `execSdSalesOrderInsert`):

- DTO accepts ONLY: `companyId`, `totalAmount`, `currency`, `designFlag`, `sampleFlag` (presentation/dto/create-order.dto.ts:8-14).
- No line items, no customer (only `companyId`), no order date, no delivery address.
- Writes to table **`sd_sales_orders`** (queries-sd.ts:59-71), NOT `sales_orders`.
- Inserts an order with `status: 'draft'`, `advance_required: 70`, `advance_paid: '0'`, `advance_status: 'pending'`, all flags `false`. No item rows are created.
- Atomic: order + outbox events in one Drizzle transaction (create-order.handler.ts:94-154).

**Path B — `OrdersService.create`** (orders/orders.service.ts:35-41 → `DrizzleSdOrdersRepository.create`, orders/drizzle-sd-orders.repo.ts:49-63):

- Writes to **`sales_orders`** (the SAP-style table), takes a freeform `dto: Record<string, unknown>`, picks out `customerId`, `currency`, `totalAmount`, `notes`, `documentNumber`/`orderNumber`, `createdBy`.
- Sets `status: 'draft'` — note this is the column `status` (legacy `varchar(30)`), not `master_status`. The `master_status` column is left at its default `'draft'` (good), but the new value the caller passed never reaches `master_status`.
- No line items inserted.
- No HTTP route in `sd-orders.controller.ts` is wired to this service. `SdOrdersController` is purely CQRS. The only consumers of `OrdersService` are internal callers (quotation conversion, dashboards) — verify via grep.

**Path C — `convertQuotationToOrder`** (`sd-quotations.repository.ts:96-141`):

- Writes to `sales_orders` via raw SQL:

  ```sql
  INSERT INTO sales_orders
    (order_number, status, company_id, total_amount, advance_required, advance_paid,
     advance_status, design_flag, sample_flag, created_by)
  VALUES
    (${orderNumber}, 'pending', ${companyId}, ${totalAmount}, ${advancePercent ?? 30},
     '0', 'pending', false, false, 0)
  ```

- `status = 'pending'` — not a member of the `master_status` CHECK list (`'draft','incomplete',...`); it slips by because the column written is `status`, not `master_status`. The master status stays at its default `'draft'`.
- The variable `companyId` is computed as `Number(quotation['customer_id'] ?? quotation['company_id'] ?? 0)` (line 113) — i.e., the quotation's customer id is reinterpreted as the order's company id. If the FK on `sales_orders.company_id` (also present as ADD-ONLY column, sd-orders.ts:206) is enforced against `companies`, this miscopy could fail; if it isn't, the order ends up pointing at the wrong tenant/company.
- The `convert` is atomic (order insert + quotation status flip in `db.transaction`).

### 5.2 Line-item flow

`sales_order_items` schema (sd-order-items.ts:181-223) defines `salesOrderId`, `itemNumber`, `materialId`, `orderQuantity`, `deliveredQuantity`, `openQuantity`, `netPrice`, `taxCode`, `taxAmount`, `totalPrice`, `deliveryStatus`, `billingStatus`, `productionOrderId`, etc. — all the pieces needed for an SD line item.

Search for inserts into `salesOrderItems` / `sales_order_items` in the SD module:

```
grep -R 'salesOrderItems\|sales_order_items' apps/api/src/modules/sd
→ (no inserts; only schema imports)
```

**No code path in the SD module inserts a `sales_order_items` row.** Path A doesn't take items. Path B doesn't either. Path C is order-header only. The 23-stage lifecycle has nothing to act on — `delivered_quantity`/`open_quantity` per item can never be updated, so the schemas for delivery/picking against item rows are unreachable.

### 5.3 Pricing

The only price computation in the module is `SdQuotationsService.calculatePrice` (`apps/api/src/modules/sd/application/sd-quotations.service.ts:87-108`):

```ts
async calculatePrice(productId: number, quantity: number, formulaId: number | null) {
  return safeCall(async () => {
    const base = QUOTATION_BASE_NUMBER;       // ← hardcoded constant
    const discount = quantity > BULK_DISCOUNT_LARGE.minQty
      ? BULK_DISCOUNT_LARGE.rate
      : quantity > BULK_DISCOUNT_SMALL.minQty
        ? BULK_DISCOUNT_SMALL.rate
        : 0;
    const unitPrice = base * (1 - discount);
    return { ..., unit_price: unitPrice, total_price: unitPrice * quantity, ... };
  });
}
```

The method comments (lines 78-86) explicitly note that `productId` is "logging context; product price is NOT looked up here". The `formulaId` parameter is reserved for a future path. The DB table `sd_price_formulas` (sd-europrint-schema.ts:151-199) is read by `listPriceFormulas` but never evaluated against a product — there is no formula interpreter. So pricing today is a per-quantity discount on a single hard-coded base.

---

## 6. Quotation → order → delivery → invoice

### 6.1 Quotation

Two tables again: `quotations` (SAP-style, sd-delivery.ts:222-...) and `sd_quotations` (sd-europrint-schema.ts:205-233). The SD controllers (`sd-quotations.controller.ts`) talk to `sd_quotations` via `SdQuotationsRepository`. `quotations` (SAP-style) is referenced in the schema graph (`sd-billing.ts:17`) but no service in the SD module writes it — only the `DrizzleQuotationRepo` (registered via `QUOTATION_REPO`) appears to.

### 6.2 Quotation status

`sd_quotations.status` CHECK: `IN ('draft','sent','viewed','approved','rejected','expired')` (sd-europrint-schema.ts:224). But the `convertQuotationToOrder` flow flips it to `'converted'` (sd-quotations.repository.ts:132). `'converted'` is NOT in the CHECK list — that UPDATE will fail in any DB that has the constraint, succeed only if the constraint was dropped during migration.

### 6.3 Conversion

Already detailed in §5.1 Path C. The conversion is atomic but:

- Writes `status='pending'` (not a master_status value).
- Writes `company_id = quotation.customer_id` — semantic mismatch (sales_orders has both `customer_id` and `company_id`; here only `company_id` is populated).
- Returns `{ id, order_number, status, total_amount, created_at }` — `master_status` is never set.

### 6.4 Delivery

`deliveries` table (sd-delivery.ts:18-57): references `sales_orders.id` (varchar) and `crm_companies.id`. Status enum `PICKING / PACKING / GOODS_ISSUE / COMPLETED`.

`DeliveriesService.create` (deliveries/deliveries.service.ts:37-43) forwards a `Record<string, unknown>` to `DrizzleSdDeliveriesRepository.create` (deliveries/drizzle-sd-deliveries.repo.ts:53-58):

```ts
const result = await db.insert(deliveries).values({ ...dto, status: 'pending' } as ...).returning();
```

`status: 'pending'` — but the column is named `delivery_status` and CHECK-constrained to `IN ('PICKING','PACKING','GOODS_ISSUE','COMPLETED')` (sd-delivery.ts:56). The insert sets a column that does not exist (`status` vs `delivery_status`), and the value (`'pending'`) is not in the CHECK list. Live DB may have an additional `status` column from drift, or this call may silently no-op the status (DB defaults `delivery_status` to `'PICKING'`).

`updateStatus` (line 60) writes `status` again — same problem.

### 6.5 Invoice

`sales_invoices` schema (sd-orders.ts:19-61): `customer_id → crm_companies.id`, `order_id → orders.id` (the PP-side `orders` table), `sales_order_id` is an integer ADD-ONLY with no FK.

`DrizzleSdInvoicesRepository.findAll` and `create` (invoices/drizzle-sd-invoices.repo.ts:35-63) operate on `salesInvoices` (Drizzle alias for `sales_invoices`). `createInvoice` (lines 101-130) writes to a DIFFERENT object `legacyInvoices` (imported as `invoices` from `@shared/db`) — that's the legacy `invoices` table, not `sales_invoices`. Two physical invoice tables receive writes:

```ts
import { db, invoices as legacyInvoices, sales_orders as legacySalesOrders } from '@shared/db';
import { salesInvoices } from '@europrint/schemas';
...
async findAll(...)                  { ... .from(salesInvoices) ... }         // sales_invoices
async create(dto, createdBy)        { db.insert(salesInvoices).values(dto) }  // sales_invoices
async createInvoice(input, tx)      { exec.insert(legacyInvoices).values({   // invoices
  invoice_number, sales_order_id, customer_name, customer_id, items,
  subtotal, tax_amount, total_amount, paid_amount, status, due_date,
  created_by, created_at, updated_at,
}); }
```

`create` is called from `InvoicesService.create` (`POST /sd/invoices` controller path). `createInvoice` is called from the `CreateInvoiceHandler` CQRS handler. Two API paths → two different tables for the "same" invoice.

`findOrderForInvoicing` (invoices/drizzle-sd-invoices.repo.ts:66-89) reads from `legacySalesOrders` (the `sales_orders` alias from `@shared/db/schema-core`, distinct from `salesOrders` in `@europrint/schemas`). The header comment notes that this alias has *no* `deleted_at`, returning `deletedAt: null` defensively — meaning soft-delete filters set on `sales_orders` elsewhere will not be respected on this read.

---

## 7. Customer master & documents

`sd_customers` (master) is defined in sd-europrint-schema.ts:20-58. Relation tables in `sd-customer-relations.ts`:

| Table | Purpose | FK to customer |
|---|---|---|
| `sd_customer_contacts` | Contact persons (name, position, phone, email, isPrimary, isDecisionMaker, influenceLevel) | `customerId → sdCustomers.id ON DELETE CASCADE` |
| `sd_customer_interactions` | Call/meeting/note log | `customerId → sdCustomers.id ON DELETE CASCADE` |
| `sd_customer_documents` | Attached files & contracts (documentType, fileUrl, fileSize, expiresAt, totalAmount) | `customerId → sdCustomers.id ON DELETE CASCADE` |
| `sd_customer_competitors` | Competitor share data | (same) |
| `sd_customer_complaints` | Complaint tracking | (same) |
| `sd_contacts` (sd-europrint-schema.ts:71-81) | Older contacts table — DUPLICATE of `sd_customer_contacts` | `customerId → sdCustomers.id ON DELETE CASCADE` |

`sd_contacts` and `sd_customer_contacts` are two separate Drizzle tables for the same concept (contact persons), with overlapping columns. `sd_customer_contacts` is the one the repository uses (`drizzle-sd-customers.repo.ts:82-85`). `sd_contacts` appears to be orphaned schema.

Customer documents have a comment noting legacy aliases:

```ts
// Legacy aliases: the repo reads both "d.name" and "d.title"; "name" is canonical.
documentName: varchar("document_name", { length: 500 }).notNull(),
// Legacy aliases: the repo reads both "d.file_url" and "d.url"; "file_url" is canonical.
fileUrl: text("file_url"),
// Legacy aliases: the repo reads both "d.expires_at" and "d.end_date".
expiresAt: timestamp("expires_at"),
```

So the live DB likely has `name`/`title`, `file_url`/`url`, `expires_at`/`end_date` pairs that the schema represents as one column each — repo reads must defensively coalesce.

### 7.1 `Customer360Page` data

`drizzle-sd-customers.repo.ts:67-109` (`get360View`) issues 8 parallel queries against `sd_customers`, `sales_orders`, `sd_customer_contacts`, `sd_customer_documents`, `sd_customer_interactions`, `sd_customer_competitors`, `sd_payments`, `nps_responses`. All are real DB reads — no mock data. But the orders join (line 77) joins on `customer_id = ${cid}` where `cid` is the SD customer id — this only returns rows if `sales_orders.customer_id` happens to equal `sd_customers.id`, which is structurally not guaranteed (see §3.2). On most rows the 360 view will display an empty orders/payments timeline despite the customer having active orders under a different id space.

---

## 8. Frontend integration

| Frontend page | Endpoint hit | Status |
|---|---|---|
| `SDSalesOrders.tsx:112` | `GET /api/sd/orders?...` | OK (controller exposes `Get()`, sd-orders.controller.ts:49). |
| `SDSalesOrders.tsx:121` | `GET /api/sd/orders/${id}` | OK (sd-orders.controller.ts:80). |
| `SDSalesOrders.tsx:128` | `PATCH /api/sd/orders/${id}/status` body `{ status, note }` | **BROKEN** — backend DTO is `{ newStatus }` (presentation/dto/update-status.dto.ts:8-10). Zod parse fails → HTTP 400. |
| `SDSalesOrders.tsx:139` | `PATCH /api/sd/orders/${id}/cancel` body `{ reason }` | **BROKEN** — no `/cancel` route exists on `SdOrdersController` (grep confirms no `cancel` decorator). |
| `OrderCreationWizard.tsx` → `useWizardState.ts:203` | `POST /api/papka-orders` | **NOT an SD endpoint** — writes to PP's `papka_orders` table, not `sales_orders`. The wizard never touches the SD module. |
| `OrderApprovalWorkflow.tsx:58-114` | `/api/approval-workflow/*` | Different module entirely (`approval-workflow.controller`). Not in SD. |
| `SDCustomers.tsx`, `SDCustomersSections.tsx` | `/api/sd/customers*` | OK (controller exposes these). |
| `SDQuotations.tsx` | `/api/sd/quotations*` | OK. |
| `SDDashboard.tsx` | `/api/sd/dashboard/*` | OK. |
| `SDContracts.tsx` | `/api/sd/contracts*` | OK. |
| `SDDebitors.tsx`, `SDKpi.tsx` | `/api/sd/dashboard/quota`, `/api/sd/customers` aggregates | OK. |

Two SD-specific bugs in the front end (status update, cancel) and one structural surprise (the "Order Creation Wizard" doesn't create sales orders).

---

## 9. Findings summary

### P0 (blocking — breaks core flow)

| # | Finding | Evidence |
|---|---|---|
| P0-1 | **Three competing physical tables for "sales order"**: `sales_orders` (SAP-style, 71 cols), `sd_orders` (EuroPrint, 47 cols), `sd_sales_orders` (CQRS aggregate). Different writers use different ones; reads cross-join them. | `_db_tables.txt:846,848,866,872`; sd-orders.ts:92; sd-europrint-schema.ts:274; queries-sd.ts:59 |
| P0-2 | **23-stage `master_status` lifecycle is unreachable via the CQRS API.** `SalesOrder.VALID_TRANSITIONS` only contains 15 states; transitioning to `pending_design`, `qc_failed`, `in_fg_warehouse`, etc. returns "Cannot transition". The 23-state `MASTER_STATUS_CHAIN` constant is imported by zero services. | sales-order.aggregate.ts:300-316; sd-order-items.ts:56-63 (no consumer); sd-orders.ts:234 (CHECK list) |
| P0-3 | **`OrdersService.updateStatus` writes the wrong column.** `DrizzleSdOrdersRepository.updateMasterStatus` sets `overallStatus` instead of `masterStatus`; passing any `master_status` value to it will raise a CHECK violation on `overall_status_chk`. | orders/drizzle-sd-orders.repo.ts:86-91; sd-orders.ts:220 |
| P0-4 | **Front-end status PATCH body shape mismatches backend DTO.** UI sends `{ status, note }`; backend expects `{ newStatus }`. All in-app status transitions return HTTP 400. | SDSalesOrders.tsx:128; presentation/dto/update-status.dto.ts:8-10 |
| P0-5 | **Front-end cancel endpoint does not exist.** UI calls `PATCH /api/sd/orders/${id}/cancel`; `SdOrdersController` defines no such route. | SDSalesOrders.tsx:139; sd-orders.controller.ts (no `cancel` handler) |
| P0-6 | **No code path inserts `sales_order_items`.** All three order-creation paths write only the header row. The lifecycle's per-item delivery/billing tracking is unreachable. | grep `salesOrderItems` in `apps/api/src/modules/sd` → no inserts |

### P1 (data integrity / silent corruption)

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **Dual customer registries with no sync.** `sd_customers.id` and `crm_companies.id` are independent serial PKs, yet `drizzle-sd-customers.repo.ts:29,53,77,154` joins `sales_orders.customer_id = sd_customers.id` while `sales_orders.customer_id` schema is FK to `crm_companies.id`. `crm_company_id` on `sd_customers` exists as a link column but is never written by `create()`. | sd-europrint-schema.ts:20,52; sd-orders.ts:106; drizzle-sd-customers.repo.ts:131-147 |
| P1-2 | **`order_status_logs` is not written by the SD module.** No code in `apps/api/src/modules/sd/**` inserts a row; only `modules/remaining/order-status.repository.ts` writes it with the WRONG column names (`order_id`/`created_at` vs schema's `sales_order_id`/`changed_at`). Audit trail of state transitions is missing. | grep no matches; order-status.repository.ts:31-43 vs sd-order-items.ts:166-178 |
| P1-3 | **`convertQuotationToOrder` sets `sd_quotations.status = 'converted'`** but the CHECK constraint only allows `'draft','sent','viewed','approved','rejected','expired'`. UPDATE fails in any DB that has the constraint. | sd-quotations.repository.ts:132; sd-europrint-schema.ts:224 |
| P1-4 | **`DrizzleSdDeliveriesRepository.create/updateStatus` writes column `status`, not `delivery_status`.** The CHECK is on `delivery_status` (`'PICKING','PACKING','GOODS_ISSUE','COMPLETED'`); the value `'pending'` written by `create()` matches neither column nor enum. Either silently no-ops or raises drift errors. | deliveries/drizzle-sd-deliveries.repo.ts:55,62; sd-delivery.ts:36,56 |
| P1-5 | **Quotation→order conversion misroutes the customer.** `companyId = quotation.customer_id` is written to `sales_orders.company_id` (not `customer_id`), so the converted order is unlinked from `crm_companies`. The 360-view orders query will not return it. | sd-quotations.repository.ts:113,123-126 |
| P1-6 | **Two invoice tables receive writes from two API paths.** `POST /sd/invoices` → `sales_invoices`; CQRS `CreateInvoiceHandler` → `invoices` (legacy). Both are real, both keyed by `invoice_number`, no sync. | invoices/drizzle-sd-invoices.repo.ts:7,61,104 |
| P1-7 | **Forecast/accuracy returns hardcoded data.** Round 1 said "no synthetic data in SD"; `SalesService.getForecastAccuracy` returns fixed January/February/March numbers, `getForecastHistory` returns `{ history: [] }`. | sales/sales.service.ts:42-52,69-75 |
| P1-8 | **`sales_orders.advance_paid_amount < total_amount * advance_percent / 100`** check uses `advance_percent` DEFAULT 30 in the dashboard query, but the schema default is 70 (`advanceRequired` on sd-orders.ts:160 = 70). Pending-advance lists understate the queue by ~57%. | sd-dashboard.repository.ts:37-38 vs sd-orders.ts:160 |

### P2 (drift / dead code / maintenance load)

| # | Finding | Evidence |
|---|---|---|
| P2-1 | **Four competing state-machine definitions for the sales order.** `sd-orders.ts` CHECK (23), `status-machines.constants.ts` `SO_TRANSITIONS` (~26, includes `incomplete`/`waiting_customer_input`/`tech_rejected`), `SalesOrder.VALID_TRANSITIONS` (15), `orders.constants.ts` `VALID_TRANSITIONS` (10). All disagree on enum membership. | files cited above |
| P2-2 | **`sd_quotations` and `quotations` are two physical tables for the same concept.** Same shape, different writers; `quotations` references `crm_companies`, `sd_quotations` references `sd_customers`. | sd-europrint-schema.ts:205; sd-delivery.ts:222 |
| P2-3 | **`sd_contacts` and `sd_customer_contacts` are two tables for "contact persons".** `sd_contacts` (sd-europrint-schema.ts:71) is orphan; the repo uses `sd_customer_contacts`. | sd-customer-relations.ts:36; sd-europrint-schema.ts:71 |
| P2-4 | **`sales_orders` has 71 columns with many internal duplicates.** `order_number`/`document_number`, `status`/`overall_status`/`master_status`/`module_status`, `total_amount`/`total_value`, `advance_paid`/`advance_paid_amount`, `advance_required`/`advance_percent`, `bom_checked`/`tech_bom_approved`, `routing_checked`/`tech_routing_approved`, `tech_card_checked`/`tech_card_approved`. | sd-orders.ts:147,193-218; _audit_out/db-columns-by-table.json `sales_orders` |
| P2-5 | **`sd_customers.stir` / `inn` and `address` / `actual_address` are bidirectionally written.** `update()` and `create()` set both columns to the same value. External writers that touch only one column leave the other stale. | drizzle-sd-customers.repo.ts:115-127,138-144 |
| P2-6 | **`sd_customers.total_orders` / `total_revenue` are denormalized columns that nobody updates.** Live queries recompute via JOIN; the columns hold zero/stale values. | sd-europrint-schema.ts:39-40; drizzle-sd-customers.repo.ts:24-44 |
| P2-7 | **`sales_invoices.sales_order_id` has no FK constraint** (ADD-ONLY integer column). Orphan invoices are possible. | sd-orders.ts:30 |
| P2-8 | **`quotations` / `sd_quotations` both have `tax_amount` AND `vat_rate`** — redundant tax-field pair on quotations. | _audit_out/db-columns-by-table.json |
| P2-9 | **OrderCreationWizard hits `/api/papka-orders`, not the SD module.** Branded as "sales order" creation in the UI, but functionally creates a PP folder entry. | useWizardState.ts:203 |
| P2-10 | **`sd_orders.status` CHECK has 13 values** (`new, advance_pending, advance_paid, design, technologist, planned, production, quality_check, in_warehouse, delivering, delivered, closed, cancelled`) — yet another competing lifecycle for a "sales order" concept. | sd-europrint-schema.ts:280-281,328 |
| P2-11 | **`MASTER_STATUS_CHAIN` constant has zero consumers.** Pure documentation in code form. | grep no importer in `apps/api/src/modules/sd` |
| P2-12 | **`DrizzleSdInvoicesRepository.findOrderForInvoicing` reads from a `sales_orders` alias that lacks `deleted_at`,** so soft-deleted orders are still pickable for invoicing. | invoices/drizzle-sd-invoices.repo.ts:81-85 |
| P2-13 | **`storage_accrued_amount`, `storage_total_m2`, `storage_days`** — fields meant to drive storage-fee accrual exist on `sales_orders`; no cron job, listener, or service updates them. The `sdStorageFees` table is defined but unused by the SD module. | sd-orders.ts:171-176; sd-europrint-schema.ts:386 |
| P2-14 | **`OrdersService.updateStatus` accepts arbitrary `masterStatus` string** with no validation against the CHECK enum, the aggregate's `VALID_TRANSITIONS`, or any constant. Caller can pass anything; the only guard is the PG CHECK on the wrong column (see P0-3). | orders/orders.service.ts:52-59 |

---

### Suggested remediation order

1. **P0-4 / P0-5** — fix the front-end status/cancel wires; trivial but blocks daily ops.
2. **P0-3** — make `updateMasterStatus` actually set `masterStatus`; add a CHECK-aware validator.
3. **P0-1 / P0-2** — decide one canonical "sales order" table and one state machine; freeze writes to the others. Likely keep `sales_orders` + the 23-state CHECK, retire `sd_orders` and `sd_sales_orders`, and rebuild the aggregate's `VALID_TRANSITIONS` to enumerate the full 23-state graph.
4. **P0-6** — extend `CreateOrderCommand`/DTO to accept `items[]` and insert `sales_order_items` rows in the same transaction.
5. **P1-1** — pick one customer registry (`crm_companies` is the FK target everywhere) and migrate `sd_customers` into it, or write an SD↔CRM sync listener.
6. **P1-2** — wire `order_status_logs` writes into `UpdateOrderStatusHandler`'s post-transition step (inside the transaction).
7. **P1-3 / P1-4** — fix CHECK / column-name mismatches in `convertQuotationToOrder` and `DrizzleSdDeliveriesRepository`.
8. **P1-7** — replace the hardcoded forecast with a real query against `sales_forecasts` (table exists, sd-billing.ts:214).
9. **P2 cleanup** — collapse duplicate tax columns, retire `sd_contacts`, drop ADD-ONLY columns once writers are migrated.
