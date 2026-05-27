# Report 15 — Procurement & Vendors

**Date:** 2026-05-27 (round 2)
**Scope:** `apps/api/src/modules/mm/`, `lib/db/src/schema/mm-*`, `apps/api/src/shared/db/schema-business-b-1/b-2/c-1`, `artifacts/erp-dashboard/src/pages/MM*`, `artifacts/erp-dashboard/src/pages/VendorPerformance.tsx`

---

## Diff vs round 1

Round 1 (`docs/full-analysis-2026-05-27/15-procurement-vendors.md`) made several material errors. This pass corrects them.

| Round 1 claim | Reality | Severity of error |
|---|---|---|
| `purchase_order_items` has dual FKs `po_id`+`purchase_order_id` and `raw_material_id`+`material_id` (both ADD-ONLY) | True that JS-side fields exist, but `purchase_order_id` and `material_id` are bare `integer` columns with **no `.references()`**, so they are not FKs at all — they are unenforced aliases | Material |
| Purchase requisitions "not implemented" | **WRONG.** `purchase_requisitions` table is defined in `lib/db/src/schema/mm-raw-materials.ts:116` with full schema. A second parallel `mm_purchase_requisitions` table is defined in `apps/api/src/shared/db/schema-business-b-1.ts:174`. A third parallel `erp_purchase_requisitions` table is defined in `apps/api/src/shared/db/schema-ext-b-3.ts:20`. Full CRUD controller exists at `mm-vendors-pr.controller.ts` lines 109–164. | Major |
| `purchase_invoices` disconnected from Finance | **WRONG.** `purchase_invoices` is read by Finance AP repository at `apps/api/src/modules/finance/infrastructure/repositories/finance-ap.repository.ts:42–61` for AP aging and overdue queries. `createApEntry` (line 98) INSERTs into the table. Director dashboard joins it for profit calc (`director-state.repository.ts:67`). Disconnection is from **GL journal entries**, not from Finance. | Material |
| Three-way match is "POS-movement-centric" | **WRONG.** The MM module has its own `validateThreeWayMatch` in `drizzle-mm.repo.ts:159–176` invoked from `goods-receipt.handler.ts:39`. Round 1 missed this entirely. (However the MM implementation is fake — only two booleans, no quantity/price compare.) | Material |
| `goods_receipts.supplier_id` is `varchar`, `purchase_orders.vendor_id` is `integer` (type inconsistency) | **WRONG.** `goods_receipts.supplierId` is `integer` in `mm-purchase.ts:75` with comment "FK type fix: vendors.id is serial (integer), was incorrectly declared varchar". | Outdated |
| `goods_receipt_lines.material_card_id` is `varchar` (type mismatch with integer PK) | **WRONG.** Line 119 reads `materialCardId: integer("material_id").references(() => materialCards.id, ...)` with the explicit fix comment. Note however that the JS field is `materialCardId` but the DB column is `material_id` — confusing naming. | Outdated |
| No multi-level PO approval workflow | **WRONG.** §6 SoD is enforced in `approve-purchase-order.handler.ts:36–38` (creator ≠ approver), and `create-purchase-order.handler.ts:46–56` publishes `PO_REQUIRES_DIRECTOR_APPROVAL` for amounts > 50M UZS (HITL gate, `PO_MAX_AMOUNT_UZS` from `app.constants.ts:121`). Roles split: PURCHASER creates, PURCHASE_MANAGER/SUPER_ADMIN/DIRECTOR approves (controller decorator). | Major |

What round 1 got right:
- Vendor master has duplicate columns `tax_id`/`tin` and `code`/`vendor_code` — confirmed at `mm-raw-materials.ts:177,184,186`.
- Legacy `goods_receipt_items` coexists with `goods_receipt_lines` — confirmed (`mm-purchase.ts:159` vs `:115`).
- `purchaseOrders.items` jsonb ADD-ONLY field exists — confirmed (`mm-raw-materials.ts:224`).
- Receipt of goods (current `createGoodsReceipt` path) does NOT update `material_cards.current_stock` or `raw_materials.current_stock` — confirmed; only inserts into `mm_goods_receipts` and `mm_goods_receipt_items`.

---

## 1. Module structure

`apps/api/src/modules/mm/` (DDD-style):

```
mm/
├── application/
│   ├── commands/
│   │   ├── approve-purchase-order.handler.ts
│   │   ├── create-purchase-order.handler.ts
│   │   └── goods-receipt.handler.ts
│   ├── queries/
│   │   ├── get-purchase-orders.handler.ts
│   │   ├── get-vendors.handler.ts
│   │   └── get-materials.handler.ts
│   ├── mm-dashboard.service.ts
│   ├── mm-goods.service.ts
│   ├── mm-materials-extras.service.ts
│   └── mm-vendors-pr.service.ts
├── domain/
│   ├── aggregates/
│   │   ├── material.aggregate.ts
│   │   └── purchase-order.aggregate.ts
│   └── repositories/
│       └── mm.repository.ts
├── infrastructure/
│   ├── event-handlers/
│   │   ├── pp-released.listener.ts
│   │   └── supplier-quality-fail.listener.ts
│   └── repositories/
│       ├── drizzle-mm.repo.ts
│       ├── drizzle-mm-goods.repo.ts
│       └── mm-vendors-pr.repository.ts
├── presentation/
│   ├── mm-dashboard.controller.ts
│   ├── mm-goods.controller.ts
│   ├── mm-material-cards.controller.ts
│   ├── mm-materials.controller.ts
│   ├── mm-purchase-orders.controller.ts
│   ├── mm-raw-materials.controller.ts
│   └── mm-vendors-pr.controller.ts
├── purchase/
│   ├── drizzle-purchase-svc.repo.ts
│   ├── i-purchase-svc.repo.ts
│   └── purchase.service.ts
├── vendors/
│   ├── vendors.repository.ts
│   └── vendors.service.ts
├── materials/ (separate sub-module)
└── mm.module.ts
```

**Two parallel vendor service stacks** in the SAME module:

1. `vendors/vendors.service.ts` + `vendors/vendors.repository.ts` (uses `@europrint/schemas` `vendors` table directly, supports `findAll/findOne/create/update/deactivate`) — but **is not wired into a controller** in `mm.module.ts` (file doesn't list `VendorsService` in providers).
2. `application/mm-vendors-pr.service.ts` + `infrastructure/repositories/mm-vendors-pr.repository.ts` (raw SQL against `mm_vendors`) — this is the one wired through `MmVendorsPrController`.

The first service is dead code unless imported elsewhere. (Spot-grep didn't find an import outside its own folder.)

**Three command handlers** for PO lifecycle: create, approve, goods-receipt. Plus a separate raw-SQL `purchase.service.ts` with a state machine that doesn't use the aggregate at all (see §6).

---

## 2. Purchase order schema (dual FK columns)

### Canonical `purchase_orders` (lib schema)

`lib/db/src/schema/mm-raw-materials.ts:207`:

```ts
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  vendorId: integer("vendor_id").references(() => vendors.id, { onDelete: "restrict" }).notNull(),
  orderDate: varchar("order_date", { length: 10 }).notNull(),
  deliveryDate: varchar("delivery_date", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  totalAmount: numericMoney("total_amount").default(0),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  vendorName: text("vendor_name"),
  items: jsonb("items"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  goodsReceivedBy: integer("goods_received_by"),
  goodsReceivedAt: timestamp("goods_received_at"),
  invoiceMatched: boolean("invoice_matched").default(false),
  threeWayMatched: boolean("three_way_matched").default(false),
  notes: text("notes"),
  updatedAt: timestamp("updated_at"),
  supplierId: varchar("supplier_id"),           // alternate supplier reference, no FK
  expectedDeliveryDate: varchar("expected_delivery_date", { length: 10 }),
  actualDeliveryDate: varchar("actual_delivery_date", { length: 10 }),
  expectedDate: varchar("expected_date", { length: 10 }),
  referenceNumber: varchar("reference_number", { length: 100 }),
  receivedBy: integer("received_by"),
});
```

Three date-of-delivery columns: `deliveryDate`, `expectedDeliveryDate`, `expectedDate`. Two vendor references: integer `vendorId` (FK) + varchar `supplierId` (no FK). The controller's `list` (line 56 of `mm-purchase-orders.controller.ts`) reads `expected_date`, not `delivery_date`.

### Parallel `mm_purchase_orders` (shared/db, different shape)

`apps/api/src/shared/db/schema-business-b-1.ts:160`:

```ts
export const mm_purchase_orders = pgTable('mm_purchase_orders', {
  id:              serial('id').primaryKey(),
  vendor_id:       integer('vendor_id'),  // no FK constraint
  status:          text('status').default('draft'),
  total_amount:    numeric('total_amount', { precision: 15, scale: 2 }),
  currency:        text('currency').default('UZS'),
  order_date:      date('order_date'),
  expected_date:   date('expected_date'),
  notes:           text('notes'),
  created_by:      integer('created_by'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});
```

This is the table the `mm-purchase-orders.controller.ts` **list endpoint actually reads** (`db.select().from(mm_purchase_orders)`, line 50). Different table name (`mm_purchase_orders` vs `purchase_orders`), different column types (`date` vs `varchar(10)`), no FK constraint, no `po_number` column at all (the controller fakes one with `'PO-' || padStart(id, 6)`).

A third table `purchase_orders_legacy` is exported (`apps/api/src/shared/db/index.ts:114`) and used in `drizzle-mm.repo.ts:81` inside the tx-branch of `savePurchaseOrder`:

```ts
await exec.insert(purchase_orders_legacy).values({
  po_number: po.getPoNumber(),
  vendor_name: String(po.getSupplierId()),
  total_amount: String(po.getTotalAmount()),
  status: String(po.getStatus()) as PoStatus,
  created_by: String(po.getCreatedBy()),
});
```

So PO creation through the CQRS command-handler path writes to `purchase_orders_legacy`; listing reads from `mm_purchase_orders`. The two tables have no synchronisation. **A newly-created PO does not appear in the list.**

### `purchase_order_items` — round-1 claim corrected

`lib/db/src/schema/mm-purchase.ts:32`:

```ts
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id, { onDelete: "cascade" }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitPrice: numericMoney("unit_price").notNull(),
  totalPrice: numericMoney("total_price").notNull(),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  purchaseOrderId: integer("purchase_order_id"),  // alternate FK alias of po_id (legacy column)
  materialId: integer("material_id"),             // alternate FK alias of raw_material_id (legacy column)
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, ...);
```

**Round 1 was half-right.** The columns exist, but `purchase_order_id` and `material_id` have **no `.references()` constraint** — they are unconstrained integers, not FKs at all. The comments say "alternate FK alias" but the schema does not enforce that. They are pure name-alias columns.

The active codepath uses these aliases: `apps/api/src/common/database/queries-mm-goods.ts:222`:

```ts
.leftJoin(mm_purchase_orders, eq(mm_purchase_orders.id, mm_purchase_order_items.purchase_order_id))
.leftJoin(mm_materials_ext, eq(mm_materials_ext.id, mm_purchase_order_items.material_id))
```

So the price-comparison query reads `purchase_order_id` and `material_id` (the "legacy aliases"), not `po_id` and `raw_material_id` (the "canonical"). Whichever path writes the row determines which alias is populated; the other is `NULL`. The query result depends on which writer touched the row.

---

## 3. Purchase requisitions

**Round 1 said requisitions are not implemented. They are — three times over.**

### Definition #1: `lib/db/src/schema/mm-raw-materials.ts:108–145`

```ts
export const purchaseRequisitionSeq = pgSequence("purchase_requisition_seq", { startWith: 1, ... });

export const purchaseRequisitions = pgTable("purchase_requisitions", {
  id: serial("id").primaryKey(),
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(),
  mrpResultId: varchar("mrp_result_id").references(() => mrpResults.id, ...),
  mrpRunId: varchar("mrp_run_id").references(() => mrpRuns.id, ...),
  materialId: integer("material_id").notNull(),
  requiredQuantity: numericMoney("required_quantity").notNull(),
  requiredDate: varchar("required_date", { length: 10 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  supplierSuggestion: varchar("supplier_suggestion", { length: 200 }),
  supplierId: varchar("supplier_id"),       // no FK
  estimatedCost: numericMoney("estimated_cost"),
  purchaseOrderId: varchar("purchase_order_id"),  // no FK
  requestedBy: integer("requested_by"),     // no FK
  approvedBy: integer("approved_by"),       // no FK
  approvedAt: timestamp("approved_at"),
  ...
});
```

CHECK constraint: `priority IN ('low','normal','high','urgent')`, `status IN ('pending','approved','ordered','received','cancelled')`.

This is MRP-linked (FK to `mrpResults.id` and `mrpRuns.id`), suggesting it's the MRP-generated requisition.

### Definition #2: `apps/api/src/shared/db/schema-business-b-1.ts:174–183`

```ts
export const mm_purchase_requisitions = pgTable('mm_purchase_requisitions', {
  id:           serial('id').primaryKey(),
  title:        text('title'),                        // column doesn't exist in #1
  requested_by: integer('requested_by'),
  needed_by:    date('needed_by'),                    // column doesn't exist in #1
  notes:        text('notes'),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const mm_purchase_requisition_items = pgTable('mm_purchase_requisition_items', {
  id:               serial('id').primaryKey(),
  requisition_id:   integer('requisition_id').notNull(),
  material_id:      integer('material_id'),
  quantity:         numeric('quantity', { precision: 15, scale: 3 }),
  unit_price:       numeric('unit_price', { precision: 12, scale: 2 }),
});
```

This is what `mm-vendors-pr.repository.ts:127` actually inserts into via raw SQL:

```sql
INSERT INTO mm_purchase_requisitions (title, requested_by, needed_by, notes, status)
VALUES (${title}, ${requested_by}, ${needed_by ?? null}, ${notes ?? null}, 'pending')
```

Totally different shape from definition #1 (no requisition_number, no priority, no material at the header level, header/lines split with separate items table).

### Definition #3: `apps/api/src/shared/db/schema-ext-b-3.ts:20`

```ts
export const erp_purchase_requisitions = pgTable('erp_purchase_requisitions', {
  id:          serial('id').primaryKey(),
  material_id: integer('material_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  status:      text('status').default('pending'),
  requested_by: integer('requested_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});
```

Yet a third shape. No code consumer was found for this one in spot-grep — appears to be an orphan stub.

### Controller / service

`apps/api/src/modules/mm/presentation/mm-vendors-pr.controller.ts:111–164` exposes:

- `GET /mm/purchase-requisitions` (list with status filter)
- `GET /mm/purchase-requisitions/:id`
- `POST /mm/purchase-requisitions` (create with items, requires Roles)
- `PATCH /mm/purchase-requisitions/:id`
- `DELETE /mm/purchase-requisitions/:id`

DTO validation `MmCreateRequisitionSchema` (`mm.dto.ts:89–100`):

```ts
export const MmCreateRequisitionSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  needed_by:   z.string().optional(),
  notes:       z.string().optional(),
  items:       z.array(z.object({
    material_id:  z.number().int().positive(),
    quantity:     z.number().positive(),
    unit_of_measure: z.string().optional(),
  })).optional(),
});
```

DTO uses priority enum `'low', 'medium', 'high', 'urgent'`, but schema CHECK constraint is `'low', 'normal', 'high', 'urgent'` — `'medium'` will violate the CHECK. (Note: this only matters for definition #1; the actively-used `mm_purchase_requisitions` table has no priority column at all, so the priority field is silently dropped.)

`MmUpdateRequisitionSchema` status enum: `'draft', 'pending', 'approved', 'rejected', 'cancelled'`, but the canonical CHECK constraint is `'pending', 'approved', 'ordered', 'received', 'cancelled'`. `'draft'` and `'rejected'` violate; `'ordered'` and `'received'` are not exposed via the DTO. Mismatched enums.

### No PR → PO conversion

No code path was found that converts a PR to a PO. The `purchaseRequisitions.purchaseOrderId` column exists but is never written by any code. Requisitions are decoupled from PO creation — they are inert lists.

---

## 4. `purchase_invoices` & Finance integration

### Definitions (two parallel)

`lib/db/src/schema/mm-raw-materials.ts:67–90`:

```ts
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  invoiceDate: varchar("invoice_date", { length: 10 }).notNull(),
  supplierName: text("supplier_name").notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  totalAmount: numericMoney("total_amount").notNull(),
  paidAmount: numericMoney("paid_amount").notNull().default(0),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("unpaid"),
  dueDate: varchar("due_date", { length: 10 }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, ...);
```

**`vendorId: varchar` references `vendors.id` which is `serial` (integer) — actual FK type mismatch.** Drizzle will type-error or silently cast; the migration will fail unless one side is cast.

`apps/api/src/shared/db/schema-business-c-1.ts:223`:

```ts
export const purchase_invoices = pgTable('purchase_invoices', {
  id:             serial('id').primaryKey(),
  vendor_id:      integer('vendor_id'),                  // integer (no FK)
  supplier_name:  text('supplier_name'),
  invoice_no:     text('invoice_no'),                    // NOT invoice_number
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  paid_amount:    numeric('paid_amount', { precision: 15, scale: 2 }).default('0'),
  amount:         numeric('amount', { precision: 15, scale: 2 }),  // duplicate of total_amount
  currency:       text('currency').default('UZS'),
  invoice_date:   date('invoice_date'),                  // date, not varchar
  due_date:       date('due_date'),
  status:         text('status').default('pending'),     // additional status column
  payment_status: text('payment_status').default('unpaid'),
  notes:          text('notes'),
  ...
});
```

Two definitions of the same table name with different column shapes (`invoice_number` vs `invoice_no`, `varchar` date vs `date`, integer vs varchar FK). The lib-schema version has the FK type mismatch; the shared/db version has integer.

A third "vendor invoice" table also exists: `vendor_invoices` (`schema-business-b-2.ts:36`) with `po_id`, `gr_id`, `match_status` — this is the table the Integration module's three-way match uses.

### Finance reads it

`apps/api/src/modules/finance/infrastructure/repositories/finance-ap.repository.ts`:

- Line 42–47: `getOverduePurchaseInvoices` — `SELECT … FROM purchase_invoices WHERE payment_status != 'paid' AND due_date < today`
- Line 50–61: `getUnpaidPurchaseInvoices` — returns id, due_date, total_amount, paid_amount, supplier_name
- Line 98–116: `createApEntry` — `INSERT INTO purchase_invoices (vendor_id, supplier_name, invoice_no, total_amount, paid_amount, amount, currency, due_date, status, payment_status, notes)`

So **Finance both reads and writes `purchase_invoices`** as its AP table. Round-1 claim of "disconnected from Finance" is wrong at the read level.

Director profit calc (`director-state.repository.ts:67`):
```sql
SELECT … COALESCE(SUM(si.total_amount) FILTER (WHERE payment_status='paid'), 0)
       - (SELECT SUM(pi.total_amount) FROM purchase_invoices pi
          WHERE … AND pi.payment_status IN ('paid','partial')) AS profit
FROM sales_invoices si …
```

### What IS missing: GL posting

`createApEntry` inserts into `purchase_invoices` but does NOT create a GL journal entry (no insert into `gl_documents` / `gl_lines` / `glJournalEntries`). The MM module also never posts to GL on PO approval, goods receipt, or invoice receipt.

There is a `glDocuments` import in `mm-raw-materials.ts:12` and `mm-purchase.ts:12` but it is unused in those files (no reference past the import).

So `purchase_invoices` rows are sub-ledger entries with no double-entry posting. The Finance "AP aging" view is a flat sum of `purchase_invoices` rows — no debit/credit reconciliation against `gl_lines`.

### MM module never inserts purchase_invoices

`grep purchase_invoices apps/api/src/modules/mm/` returns only `drizzle-mm-goods.repo.ts:67` (the threeWayMatch read), no writes. MM does not create supplier invoices; only Finance's `createApEntry` does.

---

## 5. Vendor master

### Canonical `vendors` (lib schema)

`lib/db/src/schema/mm-raw-materials.ts:169`:

```ts
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorCode: varchar("vendor_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 50 }),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  tin: varchar("tin", { length: 50 }),                  // duplicate of tax_id
  rating: numericMoney("rating"),
  code: varchar("code", { length: 50 }),                // duplicate of vendor_code
  contactPerson: varchar("contact_person", { length: 200 }),
}, ...);
```

Confirmed duplicates: `tax_id`/`tin`, `vendor_code`/`code`. The `vendorsService.create` in `mm/vendors/vendors.service.ts:42` writes to `code`, not `vendorCode` — the canonical column is empty for that codepath.

### Parallel `mm_vendors`

Referenced via `mm_vendors` import in `mm-vendors-pr.repository.ts:10`. The actively-used SQL in `mm-vendors-pr.repository.ts:43`:

```sql
INSERT INTO mm_vendors (name, code, contact_person, phone, email, address, payment_terms, currency)
```

— writes `code`, `contact_person` (snake_case), not `vendor_code`. Different table, different column conventions.

### FK type problems referencing vendors

| Source table.column | Source type | Target | Target type | Match? |
|---|---|---|---|---|
| `raw_materials.vendor_id` | varchar | `vendors.id` | integer (serial) | NO |
| `purchase_invoices.vendor_id` (lib) | varchar | `vendors.id` | integer | NO |
| `purchase_invoices.vendor_id` (shared/db) | integer | `vendors.id` | integer | YES |
| `purchase_orders.vendor_id` | integer | `vendors.id` | integer | YES |
| `goods_receipts.supplier_id` | integer | `vendors.id` | integer | YES (fixed) |
| `vendor_performance.vendor_id` | integer | `vendors.id` | integer | YES |
| `vendor_performance_metrics.vendor_id` | varchar | `vendors.id` | integer | NO |
| `ap_aging_buckets.vendor_id` | text | `vendors.id` | integer | NO |

Two duplicate column pairs on the master + three FK-type mismatches downstream.

### Vendor approval / KYC

No vendor approval workflow. `createVendor` inserts directly with `is_active=true` default. There is no `verified` or `approved_by` flag. Any user with `MM_WRITE_ROLES` (`ERP_MANAGER, mm_manager, warehouse_manager, super_admin, director`) can add a vendor that immediately becomes orderable.

Note `vendors.isActive` is a boolean — but the `MmUpdateVendorSchema` DTO at `mm.dto.ts:85` accepts `status: z.enum(['active', 'inactive', 'blacklisted'])`. There is no `blacklisted` column to store this — the DTO field maps nowhere. The `updateVendor` repo (`mm-vendors-pr.repository.ts:53`) does not read `body.status` at all (only `is_active`).

---

## 6. Three-way match

### MM module's implementation (canonical claim)

`apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm.repo.ts:159–176`:

```ts
async validateThreeWayMatch(poId: number, tx?: DrizzleExecutor):
  Promise<Result<{ matched: boolean; difference: number }>> {
  try {
    const exec = asExec(tx);
    const rows = await exec.select().from(purchase_orders)
      .where(eq(purchase_orders.id, String(poId))).limit(1);
    const po = rows[0] as DbRow | undefined;
    if (!po) return Err('PO topilmadi');
    const invoiceMatched = Boolean(po['invoice_matched']);
    const goodsReceived = Boolean(po['goods_received_at']);
    const matched = invoiceMatched && goodsReceived;
    return Ok({ matched, difference: matched ? 0 : 1 });
  } catch (error: unknown) {
    this.logger.error('Failed to validate three-way match');
    return Err('Tekshirishda xatolik');
  }
}
```

**This is not a three-way match.** It reads two boolean flags off the PO header and returns `matched=true` iff both are set. There is:
- No comparison of PO quantity vs GR quantity vs invoice quantity
- No comparison of PO unit price vs invoice unit price
- No tolerance configuration
- `difference: 1` (literally `1`) when not matched — meaningless number

Called by `goods-receipt.handler.ts:39` inside a transaction; if it returns `matched=false`, the handler buffers a `THREE_WAY_MATCH_FAILED` event and returns an error message containing `difference` (which is always `1`).

### `purchase_orders` flags

`mm-raw-materials.ts:229–230` adds these "ADD-ONLY" columns:

```ts
invoiceMatched: boolean("invoice_matched").default(false),
threeWayMatched: boolean("three_way_matched").default(false),
```

And the `recordInvoice` method on `DrizzleMmRepository` (line 151) just flips `invoice_matched=true`. There is no link to an actual `purchase_invoices` row from the flag-flip.

### Read-only "3-way match" view

`apps/api/src/common/database/queries-mm-goods.ts:197–205`:

```ts
export async function queryThreeWayMatch(pid: number) {
  const [poRow] = await db.select().from(mm_purchase_orders).where(eq(mm_purchase_orders.id, pid)).limit(1);
  const receiptsRaw = await db.execute(sql`SELECT * FROM mm_goods_receipts WHERE purchase_order_id = ${pid}`);
  const receipts = …
  const invoices = poRow?.vendor_id
    ? await db.select().from(purchase_invoices).where(eq(purchase_invoices.vendor_id, poRow.vendor_id))
    : [];
  return { purchase_order: poRow ?? null, goods_receipts: receipts, purchase_invoices: invoices as Row[] };
}
```

Returns the PO + all its GRs + ALL invoices for the vendor (not just for this PO — there is no PO ↔ invoice link). The endpoint `GET /mm/three-way-match/:poId` exposes this raw data, leaving any matching to the frontend.

### Integration module's `three_way_match_results`

`apps/api/src/shared/db/schema-business-b-2.ts:49`:

```ts
export const three_way_match_results = pgTable('three_way_match_results', {
  id:                serial('id').primaryKey(),
  invoice_id:        integer('invoice_id').unique(),
  tolerance_percent: numeric('tolerance_percent', { precision: 5, scale: 2 }),
  status:            text('status').default('pending'),
  match_details:     jsonb('match_details'),
  matched_at:        timestamp('matched_at'),
  created_at:        timestamp('created_at').defaultNow(),
});
```

The Integration `performThreeWayMatch` (`integration-extended-mro.repo.ts:254`) just inserts a row with `status: 'pending'` and no actual matching logic.

### Summary

Three "implementations" of three-way match, none of them actually compare PO vs GR vs invoice quantities/prices:

1. MM aggregate flag-pair check (2 booleans on PO)
2. MM read-only view (returns raw data, no matching)
3. Integration table (records a placeholder result)

No `tolerance_percent` enforcement anywhere in code paths.

---

## 7. Vendor evaluation & contracts

### Two parallel vendor performance tables

`lib/db/src/schema/mm-logistics.ts:32`:

```ts
export const vendorPerformanceMetrics = pgTable("vendor_performance_metrics", {
  id: serial("id").primaryKey(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "cascade" }).notNull(),
  // ← FK type mismatch: varchar referencing integer serial
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  totalOrders: integer("total_orders").notNull().default(0),
  onTimeDeliveries: integer("on_time_deliveries").notNull().default(0),
  lateDeliveries: integer("late_deliveries").notNull().default(0),
  qualityScore: numericMoney("quality_score").default(0),
  priceCompetitiveness: numericMoney("price_competitiveness").default(0),
  returnRate: numericMoney("return_rate").default(0),
  overallRating: numericMoney("overall_rating").default(0),
  totalSpend: numericMoney("total_spend").default(0),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  notes: text("notes"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

vs `apps/api/src/shared/db/schema-ext-b-3.ts:10`:

```ts
export const vendor_performance = pgTable('vendor_performance', {
  id:          serial('id').primaryKey(),
  vendor_id:   integer('vendor_id'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  on_time_rate: numeric('on_time_rate', { precision: 5, scale: 2 }),
  quality_rate: numeric('quality_rate', { precision: 5, scale: 2 }),
  period:      text('period'),
  created_at:  timestamp('created_at').defaultNow(),
});
```

The Integration query (`integration-extended-hr.repo.ts:66`):

```ts
return safeCall(async () => exec(sql`
  SELECT * FROM vendor_performance ORDER BY overall_score DESC LIMIT 100
`));
```

**Refers to `overall_score` — a column that does NOT exist in `vendor_performance` (which has `score`, `on_time_rate`, `quality_rate`).** It exists in `vendor_performance_metrics` (as `overallRating`/`overall_rating`). The query will error at runtime — `ORDER BY overall_score` against a table with no such column.

### Vendor rating event listener

`apps/api/src/modules/mm/infrastructure/event-handlers/supplier-quality-fail.listener.ts:25–43`:

```ts
async handle(event: SupplierQualityFailEvent): Promise<void> {
  this.logger.log({ supplierId: event.supplierId, ... }, 'Trigger 19: …');
  // Trigger 19: Quality fail → vendor rating decrease
  const currentRating = 5; // placeholder until rating lookup is wired
  const newRating = Math.max(1, currentRating - 1);
  const result = await this.mmRepo.updateVendorRating(event.supplierId, newRating);
  …
}
```

Always sets rating to `4` regardless of vendor's actual rating (line 32: `const currentRating = 5; // placeholder`). The decrease is not cumulative; consecutive failures all set 4. The `vendors.rating` column is updated, but the `vendor_performance_metrics` / `vendor_performance` tables are not touched.

### Vendor performance frontend

`artifacts/erp-dashboard/src/pages/VendorPerformance.tsx`:
- Queries `/api/integration/vendor-performance` (line 67) and `/api/integration/vendor-performance/spend-analysis` (line 71)
- The first endpoint backs to `findVendorPerformance` which fails at runtime (missing column, see above)
- POST `/api/mm/vendor-performance` (line 50) — controller stub returns `[]` (`mm-vendors-pr.controller.ts:55`), so the POST silently does nothing

### Contracts

**No supplier contract table found.** `grep vendor_contracts|supplierContracts|supplier_contracts` against both `lib/db/src/schema/` and `apps/api/src/shared/db/` returns nothing. There is no contract storage, no expiry tracking, no contract-pricing override.

---

## 8. Frontend integration

| Page | Endpoint(s) | Notes |
|---|---|---|
| `MMDashboard.tsx` | `/api/warehouse/materials`, `/api/warehouse/transactions` | MM dashboard uses warehouse endpoints (not `/api/mm/`) |
| `MMVendors.tsx` (261 LoC) | `GET/POST/PATCH/DELETE /api/mm/vendors` via `MMVendorsTypes.VENDOR_QUERY_KEY` | Modular: `MMVendorsSections.tsx`, `MMVendorsDialogs.tsx`, `MMVendorsFormFields.tsx`, `MMVendorsTypes.ts` |
| `MMPurchaseOrders.tsx` (376 LoC) | `GET /api/mm/purchase-orders`, `POST /api/mm/purchase-orders`, queries `/api/mm/vendors`, `/api/raw-materials` | DELETE/PATCH on PO would call disabled (`501 notImplemented`) endpoints |
| `MMPurchaseOrderDialogs.tsx` | Same | Dialog split |
| `MMExtended.tsx` (317 LoC) | `/api/mm/vendors`, `/api/mm/purchase-orders`, `/api/mm/goods-receipts`, `/api/mm/purchase-requisitions`, `/api/mm/fleet/vehicles`, `/api/mm/fleet/deliveries` | Multi-tab: checkbot, supplier-portal, goods-receipts, creditor, fleet (transport, GPS, fuel, drivers, schedule, routes) |
| `MMExtendedFleetTabs.tsx` | Fleet endpoints | Vehicle/driver/route tabs |
| `MMExtendedTabs.tsx` | Various | Includes `CheckBotTab, SupplierPortalTab, GoodsReceiptsTab, CreditorTab` |
| `LogisticsVendorInvoicesTabContent.tsx` | (separate) | Logistics-module entry to vendor invoices |
| `VendorPerformance.tsx` (265 LoC) | `/api/integration/vendor-performance`, `/api/integration/vendor-performance/spend-analysis`, POST `/api/mm/vendor-performance` | Performance UI is wired but backend stubbed/broken (see §7) |

Frontend create-PO form (`MMPurchaseOrders.tsx:88–95`):

```tsx
mutationFn: async (data: POFormValues) => {
  const totalAmount = data.items?.reduce(...);
  await apiRequest("POST", "/api/mm/purchase-orders", {
    ...data,
    totalAmount,
    status: "draft",
  });
}
```

Payload shape: `{ vendorId: string, orderDate, deliveryDate, items: [{rawMaterialId, quantity, unit, unitPrice}] }` (form schema lines 28–40).

But the controller `createPo` (`mm-purchase-orders.controller.ts:107–122`) expects:
```ts
{ supplierId: number, items: [{materialId: number, quantity, unitPrice}], createdBy: number }
```

Field mismatch: `vendorId` (frontend) vs `supplierId` (backend), `rawMaterialId` vs `materialId`, frontend sends `orderDate`/`deliveryDate`/`unit`/`status`/`totalAmount` that backend ignores; backend expects `createdBy` that frontend doesn't send.

The actively-handled POST handler in `mm-purchase-orders.controller.ts:107` dispatches `CreatePurchaseOrderCommand(dto.supplierId, dto.items, dto.createdBy)` — passing `undefined` for all three from the frontend payload (it would create a PO with `vendorId=undefined`, fail SoD on subsequent approve, and fail to satisfy the `vendor_id NOT NULL` constraint on canonical `purchase_orders`).

The fact that the controller's `listPos` reads from `mm_purchase_orders` (with no `po_number`, no items table), while `create` writes via the CQRS aggregate to `purchase_orders_legacy`, means the UI **cannot see what it just created**.

---

## 9. Findings summary

### P0 (data integrity / crash-loud)

1. **Frontend↔backend payload mismatch on POST `/api/mm/purchase-orders`.** Frontend sends `{ vendorId, orderDate, items: [{rawMaterialId, ...}] }` (`MMPurchaseOrders.tsx:88–95`); backend expects `{ supplierId, items: [{materialId, ...}], createdBy }` (`mm-purchase-orders.controller.ts:107–122`). The CQRS handler will receive `undefined` for all three, leading to a failure or insertion of a malformed PO. Evidence above.

2. **PO writes go to `purchase_orders_legacy`, reads come from `mm_purchase_orders`.** `drizzle-mm.repo.ts:81` inserts into `purchase_orders_legacy`; `mm-purchase-orders.controller.ts:50` selects from `mm_purchase_orders`. The two tables have no sync. Newly created POs never appear in the list.

3. **`SELECT … FROM vendor_performance ORDER BY overall_score` references nonexistent column.** Schema has `score`, not `overall_score` (`schema-ext-b-3.ts:10`). Runtime query failure on `/api/integration/vendor-performance`. (`integration-extended-hr.repo.ts:66`.)

4. **`vendor_performance_metrics.vendor_id` is `varchar` referencing integer `vendors.id`** (`mm-logistics.ts:34`). FK constraint will fail to create; if migration succeeded it's via cast and joins are broken. Same pattern: `raw_materials.vendor_id` varchar → integer, lib-schema `purchase_invoices.vendor_id` varchar → integer.

### P1 (logic broken / silent bypass)

5. **`validateThreeWayMatch` is a 2-boolean stub, not a three-way match.** No quantity/price comparison, no tolerance. Compares only `invoice_matched` and `goods_received_at` on the PO header. `difference: 1` is a literal placeholder. (`drizzle-mm.repo.ts:159`.) The three "implementations" together never actually compare PO/GR/invoice values.

6. **Goods receipt does NOT update inventory.** `createGoodsReceipt` (`mm-goods.service.ts:31`, `queries-mm-goods.ts:85`) inserts `mm_goods_receipts` + `mm_goods_receipt_items` rows but never updates `raw_materials.current_stock`, `material_cards.current_stock`, or `stocks`. Stock value diverges from receipts.

7. **No GL posting on AP / PO / GR.** `createApEntry` (`finance-ap.repository.ts:98`) inserts only `purchase_invoices`; no journal entry. `goods-receipt.handler.ts` updates the aggregate only. No `gl_documents` / `gl_lines` insertions in the MM module. The Finance "AP aging" is a flat sum, with no double-entry reconciliation.

8. **PR → PO conversion not implemented.** `purchaseRequisitions.purchaseOrderId` column exists but is never written. Requisitions and POs are independent lists.

9. **`supplier-quality-fail.listener.ts:32` uses placeholder `currentRating = 5`.** Always sets rating to 4 on any quality fail, regardless of vendor's actual current rating. Not cumulative.

10. **PR `priority` enum mismatch.** DTO accepts `'medium'`; CHECK constraint allows only `'normal'`. Active inserts succeed because the actively-used `mm_purchase_requisitions` table has no priority column at all — silently dropped.

11. **PR `status` enum mismatch.** DTO accepts `'draft', 'rejected'`; canonical CHECK constraint forbids both. Update with these values will fail against the lib-schema table.

12. **PO status state machine in `purchase.service.ts:30–37` uses statuses not in schema enum.** Machine has `sent`, `sent_to_vendor`, `confirmed`, `partially_received`, `fully_received`; schema CHECK is `'draft','sent','confirmed','received','cancelled'`. `'partially_received'` and `'fully_received'` violate the constraint. Aggregate uses third set: `DRAFT, APPROVED, RECEIVED, INVOICED, CLOSED, CANCELLED` (`purchase-order.aggregate.ts:13–20`).

13. **Vendor status DTO field `'blacklisted'` maps nowhere.** `vendors.isActive` is a boolean; no `blacklisted` column. The DTO field is silently dropped by `updateVendor` repo (only reads `body.is_active`).

### P2 (parallel definitions / dead code / smell)

14. **Three parallel purchase_orders tables**: canonical `purchase_orders` (lib), `mm_purchase_orders` (business-b-1, the one listed), `purchase_orders_legacy` (the one written by CQRS). Three column conventions, three writers.

15. **Three parallel purchase_requisitions tables**: `purchase_requisitions` (lib, MRP-linked), `mm_purchase_requisitions` (the one actually used by CRUD), `erp_purchase_requisitions` (orphan stub).

16. **Two parallel `purchase_invoices` definitions** with different column shapes (`invoice_number` vs `invoice_no`, `varchar` vs `date`, varchar FK vs integer FK).

17. **Two `vendor_performance` tables**: `vendorPerformanceMetrics` (lib, full metrics, broken FK) vs `vendor_performance` (shared/db, simple shape). Plus a third `vendor_invoices` table for invoice matching.

18. **Two parallel vendor services in MM module**: `vendors/vendors.service.ts` (uses canonical schema, `findAll/findOne/create/update/deactivate`) is unwired; `application/mm-vendors-pr.service.ts` (raw SQL on `mm_vendors`) is the one exposed via controller.

19. **`vendors.tax_id` vs `vendors.tin`** — both columns hold STIR. DTO uses `inn` (a third name) (`mm.dto.ts:72`).

20. **`vendors.vendor_code` vs `vendors.code`** — `vendors.service.ts:42` writes `code`; `mm-vendors-pr.repository.ts:43` also writes `code`. Canonical `vendor_code` is empty.

21. **`purchase_order_items.purchase_order_id` and `.material_id` are not actual FKs** — bare integers in `mm-purchase.ts:41–42`. Active queries (`queries-mm-goods.ts:222–224`) use these "alias" columns, so the canonical `po_id`/`raw_material_id` may be empty in active rows.

22. **`purchase_orders` has 3 delivery-date columns** (`deliveryDate`, `expectedDeliveryDate`, `expectedDate`) and 2 vendor refs (`vendorId` integer FK + `supplierId` varchar no-FK).

23. **`goods_receipt_lines.material_id` column is named `material_id` but the JS field is `materialCardId`** — confusing naming; the column references `materialCards.id` not `materials.id`/`rawMaterials.id` (`mm-purchase.ts:119`).

24. **Legacy `goods_receipt_items` (using `raw_material_id`) coexists with `goods_receipt_lines` (using `material_id`/material_cards FK)** — `mm-purchase.ts:159` vs `:115`. Both tables active.

25. **No vendor contract table** — no expiry tracking, no contract-pricing override capability.

26. **No vendor approval / KYC workflow** — created vendors are immediately orderable; no `approved_by` flag.

27. **POST `/api/mm/vendor-performance` is a stub** returning `[]` (`mm-vendors-pr.controller.ts:55`). UI's "add rating" mutation succeeds silently with no DB write.

28. **`GET /mm/purchase-orders/:id`, `PATCH /mm/purchase-orders/:id`, `DELETE /mm/purchase-orders/:id`** all return `notImplemented` (controller lines 97, 158, 168). The PO detail view is unreachable.

29. **`purchaseOrders.items` jsonb column** (`mm-raw-materials.ts:224`) — embedded line-items "legacy JSON storage". Unverified whether any code path writes here; would double-store items if so.

### Open / unverified

- Does any code actually call `recordInvoice` (`drizzle-mm.repo.ts:147`)? It flips `invoice_matched=true` but no caller was found in spot-grep.
- Does the `PpReleasedListener` (`mm.module.ts:58`, referenced) act on `PpReleasedEvent` to trigger an MRP-driven requisition? Not inspected.
- The `mm_purchase_orders_int` and `mm_materials_int` exports (`shared/db/index.ts:119–120`) — what are they, and which side of the parallel tables are they?
- Does the warehouse-rental / pos-movements integration write three-way-match data anywhere that actually fires?
