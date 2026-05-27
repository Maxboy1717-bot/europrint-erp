# Report 09 — Finance AR/AP & Invoices

**Date:** 2026-05-27 (second pass)
**Scope:** AR/AP services, invoice CRUD, GL posting chains, payment recording, aging reports, frontend integration.
**Round-1 source:** `docs/full-analysis-2026-05-27/09-finance-ar-ap-invoices.md`
**Verification method:** every line-numbered claim re-read against the working tree at HEAD (commit `75fc8a2f` "fix(finance): replace Math.random stubs with real DB writes in GL, AR/AP, invoices" applied on top of round-1's baseline).

---

## Diff vs round 1

Round 1's report was authored **before** commit `75fc8a2f`. The single most consequential finding of round 1 — the P0 "invoice controller returns random IDs with no DB write" — has been **structurally fixed** in the current tree. The remaining issues are different in kind: the writes happen but reference columns that the Drizzle schema (and the schema-drift migration in `migrations-drift.ts`) never define.

| Round-1 claim | Current state | Status |
|---|---|---|
| `createInvoice()` returns `Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE)` | Now calls `this.invoiceRepo.saveInvoice({...})` and returns `row['id']`. `FINANCE_RANDOM_REF_RANGE` no longer referenced in any finance file. | REFUTED — fixed |
| `postInvoice()` returns hardcoded `{ message: 'Invoice posted to GL', invoiceId }` with no DB update | Now calls `this.invoiceRepo.updateInvoice(String(invoiceId), { status: 'posted', updated_at: new Date() })`; throws on Err. Message string unchanged. | PARTIALLY REFUTED — DB update added, but no GL entry actually created (despite the literal message claim) |
| `getInvoice()` returns hardcoded `{ data: { invoiceId, status: 'posted' } }` | Now calls `this.invoiceRepo.findInvoiceById(String(invoiceId))`; returns `NotFoundException` when row missing. | REFUTED — real DB read |
| Path is `apps/api/src/modules/finance/ar-ap/invoice.service.ts` | No such file. Real path: `apps/api/src/modules/finance/presentation/finance-invoices.controller.ts`. There is no `ar-ap/` subdirectory. | Path was wrong in round 1 (and again in this task's prompt) |
| Payment-to-GL chain missing | `RecordPaymentHandler.execute` (commands/record-payment.handler.ts:91, 134) now calls `glPostingService.postCustomerPayment(...)` on both fully-paid and partial branches. | REFUTED — chain exists |
| `POST /finance/ar/entries` and `POST /finance/ap/entries` return 404 | Controllers expose `POST /ar/entries` and `POST /ap/entries` (no `/finance` prefix). Frontend still posts to `/api/finance/ar/entries` and `/api/finance/ap/entries`. | STILL BROKEN — but for a different reason (route-mismatch, not missing endpoint) |
| Round 1 listed 3 invoice tables (`fi_invoices`, `invoices`, `sales_invoices`) | I found 11 distinct `pgTable('…')` invoice-shaped definitions across 8 schema files, with two of them targeting the same physical table name `invoices`. | Expanded |
| Round 1 said `fi_invoices` lacks `total_amount`, `paid_amount`, `payment_status`, `customer_name` in Drizzle but might be added by migrations | Confirmed: also missing from the `migrations-drift.ts` CREATE TABLE seed (`migrations-drift.ts:1955`). No ALTER TABLE adds them anywhere in the repo. So the `INSERT … (customer_id, source_type, source_id, status, total_amount, paid_amount, …)` in `drizzle-finance-invoice.repo.ts:108` will fail at runtime against a fresh DB. | CONFIRMED + STRONGER — no migration backfills these columns |
| `fi_payments` has no Drizzle schema | Confirmed — `grep "fi_payments"` across `shared/db/` returns zero matches (only raw-SQL writers in `drizzle-finance-invoice.repo.ts:182` and `drizzle-finance-ops.repo.ts:87`). | CONFIRMED |

---

## 1. Invoice service methods (P0-02 verification)

The round-1 file path claim was wrong twice. The actual controller is:

`apps/api/src/modules/finance/presentation/finance-invoices.controller.ts`

There is no `apps/api/src/modules/finance/ar-ap/invoice.service.ts` (the prompt for this task repeats round-1's mistake). The controller delegates directly to `FinanceInvoiceRepo` at `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo.ts`.

### 1.1 `createInvoiceRoot` — `POST /finance/invoices`

`finance-invoices.controller.ts:72-92`:

```ts
@Post()
@HttpCode(HttpStatus.CREATED)
@Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
async createInvoiceRoot(@Body() body: unknown) {
  const dto = CreateInvoiceRootSchema.parse(body);
  this.logger.log(`Creating invoice (root POST)`);
  const invoiceNumber = `INV-${Date.now()}`;
  const result = await this.invoiceRepo.saveInvoice({
    customer_id: dto.customerId ?? null,
    source_type: 'manual',
    source_id: null,
    status: 'draft',
    total_amount: dto.amount ?? 0,
    paid_amount: 0,
    due_date: dto.dueDate ?? null,
    notes: dto.notes ?? null,
    created_at: new Date(),
  } as Record<string, unknown>);
  if (!result.ok) {
    throw new InternalServerErrorException('Invoice yaratilmadi');
  }
  const row = result.data as Record<string, unknown>;
  return { invoiceId: row['id'], invoiceNumber, ...dto, created: true };
}
```

No `Math.random`. The ID returned is the DB-generated `id`. The invoice number is generated with `Date.now()` and is **not** stored — `saveInvoice` (see §1.4) does not insert into any `invoice_no` / `invoice_number` column.

### 1.2 `createInvoice` — `POST /finance/invoices/create`

`finance-invoices.controller.ts:100-119`:

```ts
@Post('create')
@Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
@UsePipes(new ZodValidationPipe(FinanceCreateInvoiceSchema))
async createInvoice(@Body() body: FinanceCreateInvoiceDto) {
  this.logger.log(`Creating invoice for customer ${body.customerId}, Amount: ${body.amount}`);
  const invoiceNumber = `INV-${Date.now()}`;
  const result = await this.invoiceRepo.saveInvoice({
    customer_id: body.customerId,
    source_type: 'manual',
    source_id: null,
    status: 'draft',
    total_amount: body.amount,
    paid_amount: 0,
    due_date: body.dueDate,
    notes: body.description,
    created_at: new Date(),
  } as Record<string, unknown>);
  if (!result.ok) {
    throw new InternalServerErrorException('Invoice yaratilmadi');
  }
  const row = result.data as Record<string, unknown>;
  return { invoiceId: row['id'], invoiceNumber };
}
```

Same pattern. Validates with `FinanceCreateInvoiceSchema` (`presentation/dto/finance.dto.ts:42`), which requires `customerId`, `amount`, `dueDate`, `description`, `createdBy` — note `createdBy` is required by the DTO but never persisted.

### 1.3 `postInvoice` — `POST /finance/invoices/:invoiceId/post`

`finance-invoices.controller.ts:124-139`:

```ts
@Post(':invoiceId/post')
@Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
@UsePipes(new ZodValidationPipe(FinancePostInvoiceSchema))
async postInvoice(
  @Param('invoiceId') invoiceId: number,
  @Body() body: FinancePostInvoiceDto
) {
  const result = await this.invoiceRepo.updateInvoice(String(invoiceId), {
    status: 'posted',
    updated_at: new Date(),
  } as Record<string, unknown>);
  if (!result.ok) {
    throw new InternalServerErrorException('Invoice postlanmadi');
  }
  return { message: 'Invoice posted to GL', invoiceId };
}
```

The status is updated. The `body` (`FinancePostInvoiceDto` = `{ postedBy }`) is parsed by the pipe but never used — `postedBy` is never written. **The literal response message still claims "Invoice posted to GL"**, but no `gl_journal_entries`/`gl_entries` insert happens here. The only way invoice posting produces a GL entry is via the separate `POST /finance/gl/post-sales-invoice` endpoint, which the user must call manually with `(invoiceId, amount, tax, postedBy)`.

### 1.4 `getInvoice` — `GET /finance/invoices/:invoiceId`

`finance-invoices.controller.ts:144-155`:

```ts
@Get(':invoiceId')
@Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
async getInvoice(@Param('invoiceId') invoiceId: number) {
  const result = await this.invoiceRepo.findInvoiceById(String(invoiceId));
  if (!result.ok) {
    throw new InternalServerErrorException('Invoice topishda xatolik');
  }
  if (!result.data) {
    throw new NotFoundException(`Invoice ${invoiceId} topilmadi`);
  }
  return { data: result.data };
}
```

Real DB read via `SELECT * FROM fi_invoices WHERE id = ${id} LIMIT 1`. Returns 404 on miss.

### 1.5 `listInvoices` — `GET /finance/invoices`

`finance-invoices.controller.ts:57-64` dispatches `new GetInvoicesQuery({ status, page, limit })` through the `queryBus`. The handler at `application/queries/get-invoices.handler.ts:14-44` resolves `financeRepo.findInvoices(query.filters)` which routes to `FinanceInvoiceRepo.findInvoices` (`drizzle-finance-invoice.repo.ts:23-96`) — a real paginated query against `fi_invoices` with optional `status` / `customer_id` / `from` / `to` filters. Round-1 left this `UNVERIFIED`; it is now resolved.

### 1.6 Underlying `saveInvoice` / `updateInvoice` / `findInvoiceById`

`drizzle-finance-invoice.repo.ts:105-128` — `saveInvoice`:

```ts
async saveInvoice(invoice: FinanceRow): Promise<Result<FinanceRow>> {
  try {
    const now = new Date();
    const r = await runQuery<FinanceRow>(sql`
      INSERT INTO fi_invoices
        (customer_id, source_type, source_id, status, total_amount, paid_amount, due_date, notes, created_at)
      VALUES
        (${invoice['customer_id'] ?? null},
         ${invoice['source_type'] ?? null},
         ${invoice['source_id'] ?? null},
         ${invoice['status'] ?? 'draft'},
         ${invoice['total_amount'] ?? 0},
         ${invoice['paid_amount'] ?? 0},
         ${invoice['due_date'] ?? null},
         ${invoice['notes'] ?? null},
         ${invoice['created_at'] ?? now})
      RETURNING *
    `);
    return Ok((r.rows[0] ?? invoice) as FinanceRow);
  } catch (error: unknown) {
    this.logger.error(`saveInvoice failed: ${(error as Error).message}`);
    return Err((error as Error).message);
  }
}
```

The columns inserted (`source_type`, `source_id`, `total_amount`, `paid_amount`) **do not exist** in the Drizzle definition (`schema-business-b-2.ts:61`) nor in the migration-drift seed (`invariants/migrations-drift.ts:1955`). See §2.1.

`updateInvoice` at `drizzle-finance-invoice.repo.ts:130-152` issues an UPDATE using the same column set with `COALESCE(...)`, so it has the same column-existence dependency. `findInvoiceById` (line 16) uses `SELECT * FROM fi_invoices WHERE id = ${parseInt(id, 10)}`, which is safe column-wise but ignores the leading-zero edge case (`parseInt` on a non-numeric ID returns NaN).

### 1.7 P0-02 verdict

The original P0-02 (random-ID, no-DB-write) is **closed**. A new, narrower P0 takes its place: every `fi_invoices` write path depends on columns that the schema does not declare; on a fresh DB those statements throw `column "total_amount" does not exist`. See §8 finding F-09-02.

---

## 2. Invoice table inventory

`grep "pgTable" shared/db/*.ts | grep -i invoice` returns **11 distinct definitions** across **8 schema files**. Two of them target the same physical table `invoices`.

| # | Drizzle export | Physical table | File:line | PK type | Writer(s) | Reader(s) |
|---|---|---|---|---|---|---|
| 1 | `fi_invoices` | `fi_invoices` | `schema-business-b-2.ts:61` | `serial` | `FinanceInvoiceRepo.saveInvoice/updateInvoice` (raw SQL) | `FinanceInvoiceRepo.findInvoiceById/findInvoices/findInvoiceBySalesOrderId`, `FinanceOpsRepo.findInvoiceById/getAllUnpaidInvoices/getSalesReceipts`, `FinanceReportRepo.getArAging` |
| 2 | `vendor_invoices` | `vendor_invoices` | `schema-business-b-2.ts:36` | `serial` | (none in finance) | three-way-match flow in `modules/mm` (queries-mm-goods.ts, mm-goods.service.ts) |
| 3 | `crm_invoices` | `crm_invoices` | `schema-business-b-2.ts:202` | `serial` | CRM module (proposal-to-invoice) | CRM dashboard |
| 4 | `purchase_invoices` | `purchase_invoices` | `schema-business-c-1.ts:223` | `serial` | `FinanceApRepository.createApEntry` (Drizzle insert) | `FinanceApRepository.getOverduePurchaseInvoices/getUnpaidPurchaseInvoices`, `DrizzleFinanceAccountingRepo.getDashboard` (raw SQL) |
| 5 | `sales_invoices` | `sales_invoices` | `schema-business-c-2-misc.ts:13` | `serial` | `FinanceArRepository.createArEntry` (Drizzle insert) | `FinanceArRepository.getOverdueInvoices/getUnpaidInvoices`, `DrizzleFinanceAccountingRepo.getDashboard`, `director-state.repository.ts:89` |
| 6 | `operatorHourlyInvoices` | `operator_hourly_invoices` | `schema-db-only-generated.ts:588` | `integer` | HR/payroll | HR/payroll |
| 7 | `sdInvoices` | `sd_invoices` | `schema-db-only-generated.ts:903` | `uuid` | (none — see §2.5) | SD module |
| 8 | `finance_invoices` | `finance_invoices` | `schema-ext-b-3.ts:55` | `serial` | (none observed) | (none observed) |
| 9 | `finance_invoice_lines` | `finance_invoice_lines` | `schema-ext-b-3.ts:69` | `serial` | (none observed) | (none observed) |
| 10 | `invoicePayments` | `invoice_payments` | `schema-finance-extended.ts:128` | `integer` | (none observed in finance module) | `financial-reports-query.helpers.ts:114` (`queryPayables`) |
| 11 | `invoices` | `invoices` | `schema-finance-invoicing.ts:20` | `uuid` (`cuid2`) | (none — see §2.4) | (none) |
| 12 | `invoicesTable` | `invoices` | `schema-misc-app-b.ts:123` | `integer` | (none — collision with #11) | (none) |
| 13 | `payments` | `payments` | `schema-finance-invoicing.ts:52` | `uuid` (`cuid2`) | (none observed) | (none observed) |

(Plus `crm_invoice_payments` in `migrations-drift.ts:2852` and `gl_entries` (UUID) in `schema-finance-invoicing.ts:74` which is a parallel GL store to `gl_journal_entries`.)

### 2.1 `fi_invoices` — column gap

Drizzle (`schema-business-b-2.ts:61-75`):

```ts
export const fi_invoices = pgTable('fi_invoices', {
  id:            serial('id').primaryKey(),
  invoice_no:    text('invoice_no'),
  vendor_id:     integer('vendor_id'),
  customer_id:   integer('customer_id'),
  type:          text('type').default('payable'),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  currency:      text('currency').default('UZS'),
  due_date:      date('due_date'),
  invoice_date:  date('invoice_date'),
  status:        text('status').default('pending'),
  notes:         text('notes'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});
```

Columns referenced by code but **absent from this definition AND from the `CREATE TABLE` seed at `migrations-drift.ts:1956-1970`**:

| Column | Referenced at |
|---|---|
| `total_amount` | `drizzle-finance-invoice.repo.ts:110`, `drizzle-finance-ops.repo.ts:135,169`, `drizzle-finance-report.repo.ts:34,58` |
| `paid_amount` | `drizzle-finance-invoice.repo.ts:110`, `drizzle-finance-ops.repo.ts:136`, `drizzle-finance-report.repo.ts:34` |
| `source_type` | `drizzle-finance-invoice.repo.ts:110` |
| `source_id` | `drizzle-finance-invoice.repo.ts:100,110` |
| `payment_status` | `drizzle-finance-report.repo.ts:45` |
| `customer_name` | `drizzle-finance-report.repo.ts:32,46` |
| `payment_date` | `drizzle-finance-ops.repo.ts:171`, `drizzle-finance-report.repo.ts:58` |
| `invoice_number` | `record-payment.handler.ts:57` (read-only via COALESCE fallback) |

Net effect: a fresh DB built from the Drizzle schema or from `migrations-drift.ts` will accept reads via the existing columns (`amount`, `invoice_no`, `status`) but every write path in `drizzle-finance-invoice.repo.ts` will throw `column "..." does not exist`. The `getArAging` SQL will fail at the `customer_name` clause.

The repo file itself has a top-of-file comment acknowledging schema drift: `drizzle-finance-ops.repo.ts:1-8` says "Raw SQL retained intentionally … schema-resilient fallback chains" — but `drizzle-finance-invoice.repo.ts:saveInvoice/updateInvoice` has **no** try/fallback; a missing column will bubble up to the controller as a 500.

### 2.2 `vendor_invoices` — three-way-match table (orphaned from finance)

`schema-business-b-2.ts:36-47`:

```ts
export const vendor_invoices = pgTable('vendor_invoices', {
  id:            serial('id').primaryKey(),
  vendor_id:     integer('vendor_id'),
  invoice_no:    text('invoice_no'),
  amount:        numeric('amount', { precision: 15, scale: 2 }),
  match_status:  text('match_status').default('unmatched'),
  po_id:         integer('po_id'),
  gr_id:         integer('gr_id'),
  invoice_date:  date('invoice_date'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});
```

Has a sibling `three_way_match_results` (`schema-business-b-2.ts:49-57`). Round 1 said the 3-way match is "schema-only, not operational". That is **wrong**: `modules/pos/application/services/three-way-match.service.ts` and `modules/mm/application/mm-goods.service.ts` both consume these tables. The integration with the finance AP flow is missing, however — `vendor_invoices` rows never feed into the `purchase_invoices` or `fi_invoices` ledger; AP aging will not include them.

### 2.3 `sales_invoices` / `purchase_invoices` — canonical SD/MM stores

`schema-business-c-2-misc.ts:13-27` and `schema-business-c-1.ts:223-239` both define rich shapes with `total_amount`, `paid_amount`, `payment_status`, `due_date`. These columns exist and match the SQL in `finance-ar.repository.ts` / `finance-ap.repository.ts`. The drift report flags `sales_invoices: tenant_id, customer_name, status, gl_document_id, due_date, notes, total_amount` as missing from the actual DB, however (`_drift_report.txt:219`) — so the Drizzle schema and the live DB are not in sync for `sales_invoices`.

The accounting dashboard sums these:

`drizzle-finance-accounting.repo.ts:30-44`:

```ts
async getDashboard(): Promise<Row> {
  const rows = await runQuery<Row>(sql`
    SELECT
      ...
      (SELECT COALESCE(SUM(total_amount),0) FROM sales_invoices) AS ar_total,
      (SELECT COALESCE(SUM(total_amount),0) FROM sales_invoices WHERE payment_status = 'unpaid') AS ar_unpaid,
      (SELECT COALESCE(SUM(total_amount),0) FROM purchase_invoices) AS ap_total,
      (SELECT COALESCE(SUM(total_amount),0) FROM purchase_invoices WHERE payment_status = 'unpaid') AS ap_unpaid
  `);
  return (rows.rows[0] ?? {}) as Row;
}
```

So AR/AP **dashboard numbers** come from `sales_invoices` / `purchase_invoices`, while AR/AP **aging report** (§6) comes from `fi_invoices` — two unrelated datasets, no consistency guarantee.

### 2.4 `invoices` (UUID, schema-finance-invoicing.ts) — orphan

`schema-finance-invoicing.ts:20-50` defines a well-formed invoice table with `cuid2` PK, FK to `sales_orders` and `users`, JSON `items`, decimal arithmetic, `invoiceStatusEnum`, unique-index on `invoice_number`. **No service in `apps/api/src/modules/finance` queries or writes this table.** It is fully unused by the finance module. The SD module (`modules/sd/`) likewise does not reference `schema-finance-invoicing.ts`.

### 2.5 `invoices` collision with `invoicesTable`

`schema-misc-app-b.ts:123-129`:

```ts
export const invoicesTable = pgTable('invoices', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  amount: text('amount'),
  due_date: date('due_date'),
  created_at: timestamp('created_at'),
});
```

This is a 4-column `int` PK table also named `'invoices'` — physically conflicting with the 13-column `cuid2` definition in §2.4. Whichever loads last wins the Drizzle barrel export; live DB has only one `invoices` table; the two Drizzle objects cannot both be correct. No code currently writes to either of them, so the collision is latent.

### 2.6 `sd_invoices` — generated mirror

`schema-db-only-generated.ts:903-925` mirrors the `invoices` shape with `camelCase` columns and additional CRM-pipeline fields (`proposalId`, `contactId`, `companyId`, `stageId`). Generated from the live DB, so the DB has both `invoices` (cuid2-style or stub) AND `sd_invoices` (UUID); the SD module probably reads via Drizzle.

### 2.7 `fi_payments` — physical-only

Confirmed no Drizzle schema, no migration. Only two writers: `drizzle-finance-invoice.repo.ts:182` (savePayment) and `drizzle-finance-ops.repo.ts:87` (recordPayment), both using raw SQL with columns `(invoice_id, amount, status, recorded_by, payment_date)`. Also referenced by an UPDATE in `modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts:133`. Drizzle migrations will not create this table on a fresh DB.

### 2.8 `finance_payments` — Drizzle-only, different table

`schema-db-only-generated.ts:298-310` defines `finance_payments` (note the underscore) with `paymentDate`, `paymentMethod`, `reference`, `notes` columns — a different physical table than `fi_payments`. No code in the finance module writes to it.

---

## 3. AR flow: SO → invoice → payment

### 3.1 SO → invoice

There is **no automated handler** that creates an invoice when a sales order is completed. Searching the finance module for SO-to-invoice references:

- `FinanceInvoiceRepo.findInvoiceBySalesOrderId` (`drizzle-finance-invoice.repo.ts:98-103`) exists — `SELECT * FROM fi_invoices WHERE source_id = ${salesOrderId}` — so the convention is that `fi_invoices.source_id` stores the SO ID, with `source_type = 'sales_order'` implied. But:
  - `source_id` is not in the Drizzle schema (§2.1).
  - No handler / listener invokes `saveInvoice` with `source_type: 'sales_order', source_id: <so_id>`.
  - `presentation/finance-invoices.controller.ts:78` hard-codes `source_type: 'manual'` for both create paths.

A sales-order completion event flow exists separately in `modules/finance/infrastructure/event-handlers/`:

```
delivery-completed.listener.ts        — listens to DELIVERY_COMPLETED
tech-three-checkpoint.listener.ts     — listens to TECH_THREE_CHECKPOINT
wms-fg-received.listener.ts           — listens to WMS_FG_RECEIVED
```

None of these listeners call `saveInvoice`. They do not auto-generate AR invoices.

`POST /ar/entries` (`finance-ar.controller.ts:75-85`) creates a `sales_invoices` row via `FinanceArRepository.createArEntry`. But:
- it does not reference any sales order;
- the frontend posts to `/api/finance/ar/entries` while the route is at `/api/ar/entries` (route mismatch — same as round 1 noted, the controller does exist now).

### 3.2 Invoice → GL

The "post invoice to GL" step happens via the **separate** `POST /finance/gl/post-sales-invoice` endpoint (`finance-gl.controller.ts:62-69`):

```ts
@Post('post-sales-invoice')
async postSalesInvoice(@Body() body: FinancePostSalesInvoiceDto) {
  this.logger.log(`Posting sales invoice ${body.invoiceId} to GL`);
  const result = await this.glPostingService.postSalesInvoice(body.invoiceId, body.amount, body.tax);
  assertOk(result);
  return { entryId: (result).data };
}
```

`GlPostingService.postSalesInvoice` (`gl-posting.service.ts:26-34`) creates lines:
- DR AR (`GL.ACCOUNTS_RECEIVABLE_TRADE`) = amount + tax
- CR Revenue (`GL.REVENUE`) = amount
- CR Sales Tax Payable (`GL.SALES_TAX_PAYABLE`) = tax

…via `createJournalEntry` → `glPostingRepo.insertEntry` (one row per non-zero line).

This is **not** called from `postInvoice` (`/finance/invoices/:id/post`), which only updates `fi_invoices.status = 'posted'`. So the "Invoice posted to GL" message returned by `postInvoice` is **misleading** — the GL entry only appears if the caller separately hits `/finance/gl/post-sales-invoice`.

### 3.3 Payment recording

The well-formed path is `RecordPaymentCommand` → `RecordPaymentHandler.execute` (`commands/record-payment.handler.ts:39-159`).

Steps the handler runs (verified line-by-line):

1. `financeRepo.findInvoiceById(String(command.invoiceId))` (line 44) — DB read.
2. Maps snake_case to camelCase using both column shapes (`raw['total_amount'] ?? raw['totalAmount']`) — line 52-60. This is the "fallback to live shape" approach because of the §2.1 column-mismatch.
3. Builds `Invoice` aggregate via `Invoice.create(...)` (line 62), with VO-backed money math.
4. Cents-based overpayment guard (line 71-73) — `Ortiqcha to'lov ruxsat etilmaydi` (Uzbek "Overpayment not allowed").
5. Branches on `paymentStatus = finalAmountCents >= totalAmountCents ? 'completed' : 'partial'`.
6. For both branches: `await this.financeRepo.recordPayment({...})` (line 82-89 or 125-132) — INSERTs into `fi_payments` (column-existence safe because of §2.7).
7. For both branches: `await this.glPostingService.postCustomerPayment(command.paymentId, command.amount)` (line 91-94 or 134-137) — creates DR Cash / CR AR pair.
8. Emits domain events via both `eventBus` (CQRS) and `eventEmitter` (legacy ERP_EVENTS topics) for `InvoiceFullyPaidEvent` / `InvoicePartiallyPaidEvent`.

This path is correctly wired. The only concern is that the `fi_invoices` UPDATE for marking the invoice paid happens **inside the aggregate** (`invoice.markAsFullyPaid` / `markAsPartiallyPaid`) which only mutates the in-memory state and emits events — there is **no `financeRepo.updateInvoice` call after the aggregate mutation** to persist the `paid_amount` / `status` change. The next read of `fi_invoices` will not show the payment unless some event listener writes it back.

Grep confirms this:

```
grep "updateInvoice" record-payment.handler.ts   → no match
```

So after a payment is recorded:
- a row in `fi_payments` exists,
- a row in `gl_journal_entries` (via `gl-posting.service.ts` lines) exists,
- but `fi_invoices.paid_amount` is unchanged and `fi_invoices.status` is still whatever it was.

The aging recalc reads `(total_amount - paid_amount)` from `fi_invoices` (`drizzle-finance-report.repo.ts:34`), so the aging will keep showing the full balance as outstanding even after a payment is recorded. This is a **new P0** (`F-09-04`) not noted in round 1.

---

## 4. AP flow: PO → invoice → payment

### 4.1 PO → vendor invoice

The MM module owns the three-way-match flow: PO (`mm_purchase_orders`) → GR (`mm_goods_receipts`) → vendor invoice (`vendor_invoices`). Implementation: `modules/pos/application/services/three-way-match.service.ts` and `modules/mm/application/mm-goods.service.ts`.

`vendor_invoices` is NOT propagated into `purchase_invoices` automatically. The AP aging report (`finance-ap.repository.ts:50-61`) reads `purchase_invoices` only. So any AP three-way-matched invoice is invisible to the AP aging dashboard unless a manual entry is also made via `POST /ap/entries`.

### 4.2 Manual AP entry

`finance-ap.controller.ts:75-85`:

```ts
@Post('entries')
async createApEntry(@Body() body: unknown) {
  const dto = CreateApEntrySchema.parse(body);
  const result = await this.svc.createEntry({
    vendorId:    dto.vendorId ?? null,
    amount:      dto.amount,
    dueDate:     dto.dueDate ?? null,
    description: dto.description ?? null,
  });
  return unwrapOrInternal(result);
}
```

`FinanceApService.createEntry` → `FinanceApRepository.createApEntry` (`finance-ap.repository.ts:98-116`) — a real Drizzle INSERT into `purchase_invoices` with `invoice_no: AP-${Date.now()}`, `status: 'pending'`, `payment_status: 'unpaid'`. Works. `supplier_name` is hardcoded `null` — the AP aging recalc (§4.4) uses `supplier_name` as bucket key (`finance-ap.service.ts:50`), so all manually-entered entries collapse into one `'unknown'` vendor bucket.

### 4.3 Vendor payment → GL

`GlPostingService.postVendorPayment` (`gl-posting.service.ts:54-61`) exists and produces DR AP / CR Cash. **It is never called** from any service or handler — `grep "postVendorPayment"` returns only its own declaration. The AP module has no equivalent of `RecordPaymentHandler` — vendor payments do not go through a command/handler that updates GL. The AP-to-GL bridge is implemented but unwired.

### 4.4 AP aging recalc

`FinanceApService.recalculateAging` (`finance-ap.service.ts:38-63`):

```ts
async recalculateAging() {
  return safeCall(async () => {
    const invoicesResult = await this.repo.getUnpaidPurchaseInvoices();
    const invoices = invoicesResult.ok ? invoicesResult.data : [];
    const today = _time.now();
    const buckets: Record<string, ApBucket> = {};
    for (const inv of invoices) {
      const r = inv as Record<string, unknown>;
      if (!r['due_date']) continue;
      const dueDate = new Date(r['due_date'] as string);
      const daysPast = Math.floor((today.getTime() - dueDate.getTime()) / MS_PER_DAY);
      const amount = (Number(r['total_amount']) || 0) - (Number(r['paid_amount']) || 0);
      const key = String(r['supplier_name'] || 'unknown');
      ...
      await this.repo.replaceApAgingBuckets(Object.values(buckets));
      return Object.keys(buckets).length;
    }
  });
}
```

Same correct math as AR. Calls `replaceApAgingBuckets` which `db.transaction(...)` wraps DELETE + INSERT (`finance-ap.repository.ts:79-96`). Atomic — round 1's claim that buckets are partial-failure-risky is no longer true.

---

## 5. GL posting integration

### 5.1 Bridge inventory

| Trigger | GL service method | Repo | Wired? |
|---|---|---|---|
| Sales invoice posting | `postSalesInvoice(invoiceId, amount, tax)` | `gl-posting.service.ts:26` | Yes, via `POST /finance/gl/post-sales-invoice` (manual only) |
| Customer payment | `postCustomerPayment(paymentId, amount)` | `gl-posting.service.ts:36` | Yes, called from `RecordPaymentHandler` lines 91, 134 |
| Goods receipt | `postGoodsReceipt(grId, amount)` | `gl-posting.service.ts:45` | Need to verify outside this report's scope |
| Vendor payment | `postVendorPayment(paymentId, amount)` | `gl-posting.service.ts:54` | NOT WIRED — zero callers |
| Material consumption | `postMaterialConsumption(...)` | `gl-posting.service.ts:63` | Need to verify |
| Payroll | `postPayroll(payrollId, gross, inps, jshd)` | `gl-posting.service.ts:72` | Yes, via `POST /finance/gl/post-payroll` |

### 5.2 `createJournalEntry` integrity

`gl-posting.service.ts:85-120`:

```ts
private async createJournalEntry(lines: JournalLine[], reference: string): Promise<Result<number>> {
  const safeLines = Array.isArray(lines) ? lines : [];
  const totalDebit  = safeLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = safeLines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return Err(`Double-entry validation failed: Debit ${totalDebit} != Credit ${totalCredit}`);
  }

  const entryDate = new Date().toISOString().slice(0, 10);
  let firstId: number | undefined;

  for (const line of safeLines) {
    const amount = line.debit > 0 ? line.debit : line.credit;
    if (amount <= 0) continue;

    const entryNumber = `${reference}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const insertResult = await this.glPostingRepo.insertEntry({
      entryNumber,
      entryDate,
      documentType: 'journal',
      debitAccountId:  line.debit  > 0 ? line.accountCode : 'OFFSET',
      creditAccountId: line.credit > 0 ? line.accountCode : 'OFFSET',
      amount,
      description: `${reference} — ${line.accountName}`,
    });

    if (!insertResult.ok) {
      return Err(AppErr('DB_ERROR', `Failed to insert GL line for ${line.accountName}: ${insertResult.error.message}`));
    }
    if (firstId === undefined) firstId = insertResult.data;
  }
  ...
}
```

Concerns:

1. Not transactional — each `insertEntry` is a separate INSERT. If line 2 fails after line 1 succeeded, the GL is left in an unbalanced state. Mid-loop failure returns `Err` but does not roll back line 1.
2. `Math.random() * 1000` collision-mitigation makes the `entryNumber` non-deterministic. With 4 lines per entry, the suffix collision probability is `~1 - (1 - 4/1000)^N` — manageable but not enforced by a UNIQUE index check.
3. Uses placeholder `'OFFSET'` for the non-active side of single-leg journal lines. This makes lookup by account problematic — `'OFFSET'` is not a real account code.
4. Each line is written as one journal row with a `debitAccountId` and `creditAccountId`; that is a non-standard "T-account per line" representation, not the usual one-header-many-lines model. Whether this matches what `gl-posting-repo.insertEntry` writes depends on the repo impl (not read in this audit).

### 5.3 Posted vs paid

The flow `postInvoice` (`fi_invoices.status = 'posted'`) is decoupled from GL posting. There is no `posted_at` column being set, no audit trail of *who* posted, and no foreign key from the invoice row to the GL entry. The `fi_invoices` table also lacks a `gl_entry_id` reference.

---

## 6. Aging & reports

### 6.1 AR aging — pre-computed bucket store

`ar_aging_buckets` (`schema-business-b-2.ts:89-100`) is the read-time store. `FinanceArRepository.getArAgingBuckets` (`finance-ar.repository.ts:20-25`) returns all buckets ordered by `total_outstanding DESC`. `getArAgingTotals` (line 27-39) sums the columns. Both are clean Drizzle selects, no schema drift.

`FinanceArController.getAgingBuckets` (`finance-ar.controller.ts:37-54`) wraps both results and converts column names to camelCase for the API. The frontend (`AccountsReceivable.tsx:31`) consumes the result.

### 6.2 AR aging — recalc

`FinanceArService.recalculateAging` (`finance-ar.service.ts:38-63`) reads `sales_invoices` (via `FinanceArRepository.getUnpaidInvoices` at `finance-ar.repository.ts:49-60`), computes buckets in JS by day-since-due-date, and atomically replaces `ar_aging_buckets`. This is consistent and works (assuming `sales_invoices.total_amount` exists in DB — the drift report flags it as missing on the live DB).

### 6.3 AR aging — second implementation

`FinanceReportRepo.getArAging` (`drizzle-finance-report.repo.ts:25-52`) is a **second** AR aging implementation that bucketizes on the fly with raw SQL, reading from `fi_invoices` (the alternate invoice store) and grouping by `customer_id, customer_name`. This reads different data than §6.1/§6.2.

```sql
SELECT customer_id, customer_name,
  SUM(CASE WHEN CURRENT_DATE <= due_date
        THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS current_amount,
  SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30
        THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS days_1_30,
  ...
  SUM(total_amount - COALESCE(paid_amount, 0))::numeric AS total_outstanding
FROM fi_invoices
WHERE payment_status != 'paid' OR status != 'paid'
GROUP BY customer_id, customer_name
```

`customer_name`, `total_amount`, `paid_amount`, `payment_status` all **fail** the schema check (§2.1). This query will throw on a fresh DB.

### 6.4 Cash flow report

`FinanceReportRepo.getCashFlow` (`drizzle-finance-report.repo.ts:54-85`) queries `fi_invoices` (for `total_amount`, `payment_date` — missing in schema) and `gl_journal_entries` (for `account_type`, `account_code` — confirmed missing). Same problem as round 1 noted, no fix applied. The query at line 58 also assumes `payment_date` exists in `fi_invoices`.

### 6.5 AP overdue list

`FinanceApController.getOverdue` (`finance-ap.controller.ts:58-61`) → `FinanceApService.getOverdue` → `FinanceApRepository.getOverduePurchaseInvoices` — a clean Drizzle select with `payment_status != 'paid' AND due_date < today`. Works.

---

## 7. Frontend integration

### 7.1 Pages

| Route | File | Calls |
|---|---|---|
| `/accounting/ar` | `pages/AccountsReceivable.tsx` | `GET /api/ar/aging`, `GET /api/ar/overdue`, `POST /api/ar/aging/recalculate`, `POST /api/finance/ar/entries` (broken — see §7.3) |
| `/accounting/ap` | `pages/AccountsPayable.tsx` | `GET /api/ap/aging`, `GET /api/ap/overdue`, `POST /api/ap/aging/recalculate`, `POST /api/finance/ap/entries` (broken) |
| No dedicated invoice list page | — | `useInvoices` hook in `hooks/use-finance.ts:25-27` exists but is not imported by any page (grep returns only `use-finance.test.ts`). |

### 7.2 AR page details

`pages/AccountsReceivable.tsx:31-37`:

```tsx
const { data: agingData, isLoading: agingLoading, isError, error, refetch } = useQuery<ArAgingData>({
  queryKey: ["/api/ar/aging"],
});

const { data: overdueInvoices = [] } = useQuery<OverdueInvoice[]>({
  queryKey: ["/api/ar/overdue"],
});
```

The aging table and KPI cards are rendered by `AccountsReceivableSections.tsx`. The sort state and overdue filter are pure client-side (lines 71-97). The "Excel" export uses `exportToCSV` from `@/lib/export-utils` (client-side).

### 7.3 Route mismatch for entry creation

`pages/AccountsReceivable.tsx:52-58`:

```tsx
const addEntryMutation = useMutation({
  mutationFn: async () =>
    apiRequest("POST", "/api/finance/ar/entries", {
      customerId: arForm.customerId,
      amount: Number(arForm.amount),
      dueDate: arForm.dueDate,
      description: arForm.description,
    }),
```

Frontend posts to `/api/finance/ar/entries`. The controller is `@Controller('ar')` (`finance-ar.controller.ts:26`) with `@Post('entries')` (line 75) → mounted at `/api/ar/entries` (the global prefix is `'api'`, set at `main-bootstrap.ts:161`). There is **no** `/api/finance/ar/entries` route. The mutation will 404.

Identical mismatch in `AccountsPayable.tsx:53` → `/api/finance/ap/entries` vs actual `/api/ap/entries`.

### 7.4 Invoice CRUD UI

The `useFinanceDashboard`/`useInvoices`/`useCreateInvoice` hooks in `hooks/use-finance.ts` post to `/api/finance/invoices` (and `/api/finance/invoices/create`). The backend controller `@Controller('finance/invoices')` (`finance-invoices.controller.ts:41`) actually exposes both routes (POST `''` = `createInvoiceRoot`, POST `'create'` = `createInvoice`). So the hooks are correct — but **no page imports them**.

The `lib/api/finance.ts:18-20` defines plain async wrappers:

```ts
apiRequest("POST", "/api/finance/invoices/create", data),
...
apiRequest("POST", `/api/finance/invoices/${invoiceId}/post`),
```

These are also unused in any page component. The whole invoice CRUD API surface is consumer-less from the dashboard.

---

## 8. Findings summary

### P0

| ID | Title | File:line | Evidence | Impact | Suggested fix |
|---|---|---|---|---|---|
| F-09-01 | Round-1 P0-02 is closed | `presentation/finance-invoices.controller.ts:72-155`, `infrastructure/repositories/drizzle-finance-invoice.repo.ts:105-152` | All three "stub" methods now hit `FinanceInvoiceRepo` and produce/consume real `fi_invoices` rows. `FINANCE_RANDOM_REF_RANGE` no longer referenced anywhere in `modules/finance/`. | Round 1's blocker is resolved. | (No action.) |
| F-09-02 | `fi_invoices` writes depend on undefined columns | Drizzle `schema-business-b-2.ts:61-75`; migration seed `migrations-drift.ts:1955-1971`; writers `drizzle-finance-invoice.repo.ts:108-122` (saveInvoice), `drizzle-finance-invoice.repo.ts:131-146` (updateInvoice) | `saveInvoice` INSERTs `(customer_id, source_type, source_id, status, total_amount, paid_amount, due_date, notes, created_at)` but schema/migration only know `(id, invoice_no, vendor_id, customer_id, type, amount, currency, due_date, invoice_date, status, notes, created_at, updated_at)`. No ALTER TABLE adds the missing columns. | Every successful-looking 201 on `/finance/invoices*` will throw `column "source_type" does not exist` on a fresh DB. The error path returns 500 + `Invoice yaratilmadi`. | Either align Drizzle schema to add the eight missing columns, or rewrite `saveInvoice` to use the actually-defined columns (`amount`, `invoice_no`, `type`). |
| F-09-03 | AR aging raw-SQL report references undefined columns | `drizzle-finance-report.repo.ts:29-49` | Reads `fi_invoices.customer_name`, `fi_invoices.total_amount`, `fi_invoices.paid_amount`, `fi_invoices.payment_status` — none in schema. | The trial-balance / AR dashboard tile that consumes `getArAging()` will 500 on first call. | Migrate the query to use `sales_invoices` (which does have these columns), or add the columns to `fi_invoices`. |
| F-09-04 | `RecordPaymentHandler` does not persist the paid invoice state | `commands/record-payment.handler.ts:39-159` | Aggregate mutates in memory (`markAsFullyPaid` / `markAsPartiallyPaid`) and emits events, but no `financeRepo.updateInvoice(...)` call writes the new `paid_amount` / `status` back to `fi_invoices`. Only `fi_payments` and `gl_journal_entries` rows are persisted. | AR aging (which subtracts `paid_amount` from `total_amount`) will keep showing the full balance as outstanding after any payment. Trial balance via `gl_journal_entries` will be correct, but the invoice list will be wrong. | After the GL post succeeds, call `financeRepo.updateInvoice(invoice.id, { paid_amount: invoice.paidAmount, status: invoice.status })`. |
| F-09-05 | `fi_payments` not in Drizzle schema | `drizzle-finance-invoice.repo.ts:182`, `drizzle-finance-ops.repo.ts:87`, `modules/sd/.../drizzle-quotation.repo.ts:133` | Zero matches for `fi_payments` in `shared/db/schema-*.ts`. Migrations-drift seed does not create it. | Fresh DB without manual SQL setup will not have the table; payment recording will fail at insertion. | Add `pgTable('fi_payments', {...})` to a schema file and a CREATE TABLE entry in `migrations-drift.ts`. |

### P1

| ID | Title | File:line | Evidence | Impact | Suggested fix |
|---|---|---|---|---|---|
| F-09-06 | `postInvoice` claims GL post but does not create GL entry | `presentation/finance-invoices.controller.ts:138` (`return { message: 'Invoice posted to GL', invoiceId }`) | Method only sets `status='posted'`. The actual GL leg requires a separate call to `/finance/gl/post-sales-invoice`. | Misleading API; clients trusting the response will reconcile incorrectly. | Either (a) chain `glPostingService.postSalesInvoice(invoiceId, amount, tax)` from within `postInvoice`, or (b) change the message to "Invoice marked as posted". |
| F-09-07 | `POST /finance/ar/entries` and `POST /finance/ap/entries` are 404 (route mismatch) | Frontend: `pages/AccountsReceivable.tsx:53`, `pages/AccountsPayable.tsx:53`. Backend: `@Controller('ar')` / `@Controller('ap')`, prefix `'api'`. | Frontend posts to `/api/finance/ar/entries`; route exists at `/api/ar/entries`. | "Add AR/AP entry" dialogs always fail with 404. | Change either side. Recommended: update frontend to `/api/ar/entries` / `/api/ap/entries`. |
| F-09-08 | `GlPostingService.postVendorPayment` is dead code | `gl-posting.service.ts:54-61` | Zero non-declaration callers. | AP payments never reach GL; AR side has the analogous chain wired, AP side does not. | Add a `RecordVendorPaymentHandler` mirroring `RecordPaymentHandler`, or call `postVendorPayment` from the existing AP entry path. |
| F-09-09 | Cash flow query references undefined `gl_journal_entries.account_type` and `account_code` | `drizzle-finance-report.repo.ts:61-72` (primary) with try/catch fallback to `source_type` filter | Schema (`schema-business-b-1.ts:135`-area) does not declare these columns. The primary query always throws; fallback returns correct-ish data. | Each cash-flow request burns one failing query before succeeding. Logs polluted. | Either add `account_type`/`account_code` to the GL schema, or rewrite the primary path to use `source_type` directly. |
| F-09-10 | Duplicate `'invoices'` physical-table definitions | `schema-finance-invoicing.ts:20` (UUID cuid2) vs `schema-misc-app-b.ts:123` (integer PK) | Both `pgTable('invoices', ...)`. | Whichever loads last wins the Drizzle barrel; the other becomes silently shadowed. | Delete `invoicesTable` from `schema-misc-app-b.ts` or rename to `'invoices_stub'`. |
| F-09-11 | `vendor_invoices` three-way-match flow disconnected from AP aging | `schema-business-b-2.ts:36`, `modules/mm/...`, `finance-ap.repository.ts:50` | `getUnpaidPurchaseInvoices` reads `purchase_invoices` only. Matched vendor invoices never get a `purchase_invoices` row. | AP aging is missing all MM-matched vendor invoices. | Either UNION `vendor_invoices` with `purchase_invoices` in the recalc query, or push matched rows into `purchase_invoices`. |
| F-09-12 | Manually-added AP entries collapse into `'unknown'` bucket | `finance-ap.repository.ts:103` (hardcodes `supplier_name: null`), `finance-ap.service.ts:50` (`key = supplier_name || 'unknown'`) | After `POST /ap/entries`, the resulting row has `supplier_name = NULL`. All such entries share the `'unknown'` bucket key. | AP aging shows one giant `'unknown'` vendor instead of per-vendor totals. | Look up `vendor.name` from `vendor_id` before insert; or require `supplierName` in the DTO. |
| F-09-13 | GL journal posting not transactional | `gl-posting.service.ts:97-116` | Loop over `safeLines` issues N independent INSERTs. Mid-loop failure returns `Err` but does not roll back prior inserts. | Partial GL entries left in DB; trial balance can become unbalanced. | Wrap in `db.transaction(...)` and have `insertEntry` accept a tx handle, or insert all lines in a single `VALUES (...)`. |

### P2

| ID | Title | File:line | Evidence | Impact | Suggested fix |
|---|---|---|---|---|---|
| F-09-14 | `invoiceNumber` is generated as `INV-${Date.now()}` and never stored | `presentation/finance-invoices.controller.ts:75, 102` | Returned in HTTP response but `saveInvoice` (`drizzle-finance-invoice.repo.ts:108-122`) does not INSERT into `invoice_no`. Two concurrent requests within the same ms produce identical numbers. | Invoice number is fictitious to the client (does not exist in DB); concurrency-unsafe; no audit trail. | Use a DB sequence `invoice_seq`, write to `fi_invoices.invoice_no`, return the persisted value. |
| F-09-15 | `invoices` table (`schema-finance-invoicing.ts:20`) is unused by any service | grep on `invoices` exports across `modules/finance` returns zero references | Well-formed table with `invoiceStatusEnum`, FK to `sales_orders` and `users`, JSON `items`, unique invoice_number — but no writer/reader. | Dead Drizzle code; migration overhead with no value. Also collides with `invoicesTable` in `schema-misc-app-b.ts` (see F-09-10). | Either wire it as the canonical invoice (replace `fi_invoices`) or remove from active schema. |
| F-09-16 | `finance_invoices` / `finance_invoice_lines` are unused | `schema-ext-b-3.ts:55-77` | No writer/reader found. | Same as F-09-15. | Drop or wire. |
| F-09-17 | `FinancePostInvoiceDto.postedBy` parsed but never persisted | `presentation/dto/finance.dto.ts:51-53`, `presentation/finance-invoices.controller.ts:129-138` | Pipe validates `postedBy: z.number().int().positive()`, but no column accepts it. | No audit trail of who posted. | Add `posted_by` and `posted_at` columns; persist in `updateInvoice`. |
| F-09-18 | No dedicated invoice list/detail page in frontend | `artifacts/erp-dashboard/src/hooks/use-finance.ts:25-86` defines hooks; no page imports them. | `grep "useInvoices\|useCreateInvoice"` returns only the hook file + its test. | Finance officer cannot browse/manage invoices from UI; the entire `/finance/invoices*` API surface is consumer-less. | Add `/accounting/invoices` route with list + detail pages. |
| F-09-19 | `fi_invoices.type` lacks CHECK constraint | `schema-business-b-2.ts:66` | `type: text('type').default('payable')` — no `CHECK (type IN ('payable','receivable'))`. | Stray AR/AP rows can corrupt aging. | Add constraint via raw SQL migration. |
| F-09-20 | `finance_payments` Drizzle table differs from `fi_payments` raw table | `schema-db-only-generated.ts:298-310` vs `drizzle-finance-invoice.repo.ts:182` | Two unrelated payment stores: `fi_payments` (raw SQL only) and `finance_payments` (Drizzle, generated, unused). | Confusion; data could land in either; reconciliation impossible. | Consolidate to one. |
| F-09-21 | `findInvoiceBySalesOrderId` uses `source_id` column that does not exist | `drizzle-finance-invoice.repo.ts:100` | `SELECT * FROM fi_invoices WHERE source_id = ${salesOrderId}` — column is in F-09-02 missing list. | Will always 0 rows / throw. The "find existing invoice for SO" check is broken. | Same fix as F-09-02. |

### Round-1 items resolved

- P0-02 (Math.random invoice IDs) — fully fixed by commit `75fc8a2f`.
- AR/AP entry endpoints existing — `POST /ar/entries` and `POST /ap/entries` exist; only the frontend URL is wrong (now F-09-07).
- AR/AP aging recalc atomicity — `replaceArAgingBuckets` / `replaceApAgingBuckets` already wrapped in `db.transaction`.
- Round-1 marked `findInvoices` and `GetInvoicesHandler` as UNVERIFIED. Verified: handler at `application/queries/get-invoices.handler.ts:14` delegates to `IFinanceRepo.findInvoices` → `FinanceInvoiceRepo.findInvoices` (paginated `SELECT … FROM fi_invoices`).
- Round-1 marked the three-way-match flow as "schema-only, not operational". Refuted: real services in `modules/pos/application/services/three-way-match.service.ts` and `modules/mm/application/mm-goods.service.ts` use it.

### Round-1 items that remain (now reclassified)

- AR aging SQL references columns missing from Drizzle schema → still true, now F-09-03 (was round-1 6.4).
- Cash flow query references missing GL columns → still true, now F-09-09 (was round-1 6.6).
- Three disjoint invoice tables → confirmed and **expanded** to 11 distinct definitions; F-09-10/-15/-16/-21.
- Invoice number generation unsafe → still true, F-09-14.
- `fi_invoices.type` no CHECK → still true, F-09-19.

---

## Open questions / not yet verified

1. `GlPostingRepository.insertEntry` (`infrastructure/repositories/drizzle-gl-posting.repo.ts`) — does it write to `gl_journal_entries` (the snake-case table) or to `gl_entries` (the camelCase cuid2 table in `schema-finance-invoicing.ts:74`)? Not opened in this audit. Affects which trial-balance query is canonical.
2. `GoodsReceipt` GL posting via `postGoodsReceipt` — who calls it? Likely in WMS module, outside Report 09 scope.
3. The "delivery-completed" / "tech-three-checkpoint" / "wms-fg-received" listeners in `modules/finance/infrastructure/event-handlers/` — none call `saveInvoice` (per grep), but I did not open them line-by-line. Could they create invoices indirectly via a different repo?
4. The `sd` module probably has its own invoice creation path that writes to `sd_invoices` (UUID). The relationship between `sd_invoices` and `fi_invoices` is unclear — are they meant to mirror, or are they parallel?
5. Whether the live DB has the missing `fi_invoices` columns (`total_amount`, etc.) added by some pre-existing seeded SQL that lives outside the repo (e.g., a SaaS export). The drift report (`_drift_report.txt:219`) flags `sales_invoices` columns as missing in DB but does **not** flag `fi_invoices` at all, which is suspicious — either `fi_invoices` does have those columns in the live DB but Drizzle hasn't been updated, or the drift script does not check `fi_invoices`.
