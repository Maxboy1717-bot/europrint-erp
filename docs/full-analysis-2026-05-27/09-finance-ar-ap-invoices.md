# Report 09 — Finance: AR, AP & Invoices
**Date:** 2026-05-27  
**Analyst:** Forensic audit sub-agent  
**Scope:** Full vertical slice — frontend → API → service → repository → Drizzle schema → DB table

---

## 1. Module Overview

The AR/AP/Invoices module covers three related but structurally separate sub-systems:

1. **`fi_invoices`** — the primary operational invoice table (both AR and AP flag via `type` column), managed by `FinanceInvoiceRepo` and `FinanceOpsRepo`.
2. **`sales_invoices` / `purchase_invoices`** — separate canonical SD/MM invoice tables referenced by the accounting dashboard queries.
3. **`ar_aging_buckets` / `ap_aging_buckets`** — pre-computed aging bucket tables populated by a recalculation job.
4. **`invoices` / `payments`** — a third invoice system defined in `schema-finance-invoicing.ts` with UUID PKs, linked to `sales_orders` and `users`.

This fragmentation means three independent invoice schemas coexist without a consolidation plan.

Key source files:

| Layer | File |
|---|---|
| AR controller | `apps/api/src/modules/finance/presentation/finance-ar.controller.ts` |
| AP controller | `apps/api/src/modules/finance/presentation/finance-ap.controller.ts` |
| Invoice controller | `apps/api/src/modules/finance/presentation/finance-invoices.controller.ts` |
| AR service | `apps/api/src/modules/finance/application/finance-ar.service.ts` |
| AP service | `apps/api/src/modules/finance/application/finance-ap.service.ts` |
| Invoice repo | `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo.ts` |
| AR repo interface | `apps/api/src/modules/finance/domain/repositories/i-finance-ar.repo.ts` |
| Finance ops repo | `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-ops.repo.ts` |
| Finance report repo | `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-report.repo.ts` |
| Schema — fi_invoices | `apps/api/src/shared/db/schema-business-b-2.ts:61` |
| Schema — ar/ap aging | `apps/api/src/shared/db/schema-business-b-2.ts:77–100` |
| Schema — invoices (new) | `apps/api/src/shared/db/schema-finance-invoicing.ts:20` |
| Schema — payments | `apps/api/src/shared/db/schema-finance-invoicing.ts:52` |
| Schema — fi_payments | `apps/api/src/shared/db/schema-finance-invoicing.ts` (referenced by drizzle-finance-ops.repo.ts) |
| Frontend — AR page | `artifacts/erp-dashboard/src/pages/AccountsReceivable.tsx` |
| Frontend — AP page | `artifacts/erp-dashboard/src/pages/AccountsPayable.tsx` |
| Frontend — AR/AP cash flow widget | `artifacts/erp-dashboard/src/components/finance/reports/CashFlowARAP.tsx` |
| Routes | `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx:46–47` |

---

## 2. Page/Screen Inventory

| Route | Component | File | Queries |
|---|---|---|---|
| `/accounting/ar` | `AccountsReceivable` | `src/pages/AccountsReceivable.tsx` | `GET /api/ar/aging`, `GET /api/ar/overdue` |
| `/accounting/ap` | `AccountsPayable` | `src/pages/AccountsPayable.tsx` | `GET /api/ap/aging`, `GET /api/ap/overdue` |
| `/accounting/gl-documents` (tab) | `GLDocumentsTab` | `src/components/finance/GLDocumentsTab.tsx` | `GET /api/fi/gl-documents` (broken URL) |
| `/finance-dashboard` | `FinanceDashboard` | `src/pages/FinanceDashboard.tsx` | References `CashFlowARAP` component |
| `/finance/reports` | `FinancialReports` | `src/pages/FinancialReports.tsx` | Unknown — not read in this audit |
| `/sd/invoices` | `SDSalesManagement` | (CRM routes) | SD module invoices — different system |

There is **no dedicated invoice list page** under the finance module routes. The `finance-invoices.controller.ts` exposes `GET /finance/invoices` but no frontend page imports a component that fetches this endpoint.

---

## 3. Data Flow Chains

### Chain A — AR Aging Buckets (Read)

```
GET /ar/aging
  → FinanceArController.getAgingBuckets()        [finance-ar.controller.ts:29]
  → FinanceArService.getAgingBuckets()           [finance-ar.service.ts:17]
  → IFinanceArRepo.getArAgingBuckets()           [i-finance-ar.repo.ts:24]
  → concrete repo reads ar_aging_buckets table
  → returns { buckets[], totals{current, days31to60, ..., totalOutstanding} }
  ← AccountsReceivable.tsx:31 useQuery(["/api/ar/aging"])
  ← ArKpiCards + ArAgingTable components
```

### Chain B — AR Aging Recalculation

```
POST /ar/aging/recalculate
  → FinanceArController.recalculateAging()       [finance-ar.controller.ts:59]
  → FinanceArService.recalculateAging()          [finance-ar.service.ts:34]
  → IFinanceArRepo.getUnpaidInvoices()           → reads sales_invoices (or fi_invoices) WHERE status != 'paid'
  → buckets computed in JS (loop over invoices, bucket by due_date days past)
  → IFinanceArRepo.replaceArAgingBuckets()       → DELETE + INSERT INTO ar_aging_buckets
  → returns count of vendor buckets updated
```

### Chain C — AP Aging (identical structure)

```
GET /ap/aging
  → FinanceApController.getAgingBuckets()        [finance-ap.controller.ts:29]
  → FinanceApService.getAgingBuckets()           [finance-ap.service.ts:17]
  → IFinanceApRepo.getApAgingBuckets()           → reads ap_aging_buckets table

POST /ap/aging/recalculate
  → FinanceApService.recalculateAging()          [finance-ap.service.ts:34]
  → IFinanceApRepo.getUnpaidPurchaseInvoices()   → reads purchase_invoices WHERE status != 'paid'
  → buckets computed in JS
  → IFinanceApRepo.replaceApAgingBuckets()       → DELETE + INSERT INTO ap_aging_buckets
```

### Chain D — Invoice CRUD (fi_invoices)

```
GET /finance/invoices?page=&limit=&status=
  → FinanceInvoicesController.listInvoices()     [finance-invoices.controller.ts:53]
  → QueryBus.execute(GetInvoicesQuery)           [get-invoices.query.ts]
  → [handler not found in audit scope]
  → UNVERIFIED path

POST /finance/invoices/create   { customerId, amount, currency, invoiceDate, dueDate, items }
  → FinanceInvoicesController.createInvoice()    [finance-invoices.controller.ts:81]
  → returns {
      invoiceId: Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE),
      invoiceNumber: `INV-${Date.now()}`,
    }
  → NO DATABASE INSERT
```

```
POST /finance/invoices/:invoiceId/post
  → FinanceInvoicesController.postInvoice()      [finance-invoices.controller.ts:94]
  → returns { message: 'Invoice posted to GL', invoiceId }
  → NO DATABASE UPDATE, NO GL ENTRY CREATED

GET /finance/invoices/:invoiceId
  → FinanceInvoicesController.getInvoice()       [finance-invoices.controller.ts:109]
  → returns { data: { invoiceId, status: 'posted' } }
  → NO DATABASE READ (hardcoded stub)
```

### Chain E — Payment Recording (fi_payments)

```
recordPayment (via FinanceOpsRepo)               [drizzle-finance-ops.repo.ts:82]
  → INSERT INTO fi_payments (invoice_id, amount, status, recorded_by, payment_date)
  → fi_payments table

savePayment (via FinanceInvoiceRepo)             [drizzle-finance-invoice.repo.ts:179]
  → INSERT INTO fi_payments (invoice_id, amount, status, recorded_by, payment_date)
  → fi_payments table
```

Payment recording has real DB writes, but there is **no GL entry created on payment** — no `saveGlEntry` call follows `recordPayment` or `savePayment` in any observed flow.

### Chain F — AR Aging Report (direct SQL, FinanceReportRepo)

```
FinanceReportRepo.getArAging()                   [drizzle-finance-report.repo.ts:25]
  → raw SQL against fi_invoices:
    SELECT customer_id, customer_name,
      SUM(CASE WHEN CURRENT_DATE <= due_date THEN total_amount - COALESCE(paid_amount,0) ELSE 0) AS current_amount,
      SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 ...) AS days_1_30,
      ... (61–90, 91+)
    FROM fi_invoices WHERE payment_status != 'paid' OR status != 'paid'
    GROUP BY customer_id, customer_name
```

This is a **real SQL query** with correct aging bucketing logic. It reads `fi_invoices.total_amount`, `fi_invoices.paid_amount`, `fi_invoices.due_date`, `fi_invoices.customer_name`.

### Chain G — Invoice-to-GL Integration (fi_invoices → gl_journal_entries)

```
FinanceInvoiceRepo.saveGlEntry()                 [drizzle-finance-invoice.repo.ts:199]
  → INSERT INTO gl_journal_entries
      (source_type, source_id, entry_date, total_debit, total_credit, notes)
  → gl_journal_entries table (schema-business-b-1.ts:135)
```

This is the only path where invoice activity creates a GL record. However it is only called if the caller explicitly invokes `saveGlEntry()` — no service method was found that chains `saveInvoice` → `saveGlEntry` automatically. Payment-to-GL chaining is similarly absent.

---

## 4. DB Tables & Columns Used

### `fi_invoices` (Primary invoice store — AR and AP)
**Defined in:** `apps/api/src/shared/db/schema-business-b-2.ts:61`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `invoice_no` | text | |
| `vendor_id` | integer | AP invoices |
| `customer_id` | integer | AR invoices |
| `type` | text | default 'payable' — distinguishes AR vs AP |
| `amount` | numeric(15,2) | |
| `currency` | text | default 'UZS' |
| `due_date` | date | |
| `invoice_date` | date | |
| `status` | text | default 'pending' |
| `notes` | text | |
| `created_at`, `updated_at` | timestamp | |

**Missing columns used in queries:** `total_amount`, `paid_amount`, `payment_status`, `customer_name`, `source_type`, `source_id`, `payment_date`. These appear in raw SQL inside `FinanceReportRepo` and `FinanceOpsRepo` but are **not defined in the Drizzle schema** — they reference a broader DB table that may have been extended by migrations not reflected in the schema file.

### `ar_aging_buckets`
**Defined in:** `apps/api/src/shared/db/schema-business-b-2.ts:89`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `customer_id` | text | |
| `customer_type` | text | |
| `current` | numeric(15,2) | Drizzle name: `current_amount` |
| `days_31_to_60` | numeric(15,2) | Drizzle name: `days_31_60` |
| `days_61_to_90` | numeric(15,2) | |
| `days_91_to_120` | numeric(15,2) | |
| `over_120` | numeric(15,2) | |
| `total_outstanding` | numeric(15,2) | |
| `updated_at` | timestamp | |

### `ap_aging_buckets`
**Defined in:** `apps/api/src/shared/db/schema-business-b-2.ts:77`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `vendor_id` | text | |
| `current` | numeric(15,2) | |
| `days_31_to_60` | numeric(15,2) | |
| `days_61_to_90` | numeric(15,2) | |
| `days_91_to_120` | numeric(15,2) | |
| `over_120` | numeric(15,2) | |
| `total_outstanding` | numeric(15,2) | |
| `updated_at` | timestamp | |

### `invoices` (Second invoice schema — UUID PK, linked to sales_orders)
**Defined in:** `apps/api/src/shared/db/schema-finance-invoicing.ts:20`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK (cuid2) | |
| `invoice_number` | text NOT NULL UNIQUE | |
| `sales_order_id` | uuid FK→sales_orders | |
| `customer_name` | text NOT NULL | |
| `customer_id` | uuid | |
| `items` | text | JSON array stored as text |
| `subtotal` | decimal(15,2) NOT NULL | |
| `tax_amount` | decimal(15,2) NOT NULL | |
| `total_amount` | decimal(15,2) NOT NULL | |
| `paid_amount` | decimal(15,2) | default 0 |
| `status` | invoiceStatusEnum | draft/sent/paid/overdue |
| `due_date` | timestamp with TZ | |
| `created_by` | uuid FK→users | |
| `created_at`, `updated_at`, `deleted_at` | timestamp | |

This table has a proper status enum and `invoiceStatusEnum` type, but **no controller or service in the finance module queries this table directly**. It appears to be a standalone invoice table created for a different sub-system (possibly the SD/CRM invoicing path).

### `payments` (Linked to `invoices` table above)
**Defined in:** `apps/api/src/shared/db/schema-finance-invoicing.ts:52`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `invoice_id` | uuid FK→invoices | |
| `amount` | decimal(15,2) NOT NULL | |
| `currency` | text | default 'UZS' |
| `payment_method` | text NOT NULL | |
| `reference_number` | text | |
| `paid_at` | timestamp NOT NULL | |
| `recorded_by` | uuid FK→users | |
| `notes` | text | |
| `created_at` | timestamp | |

### `fi_payments` (Used by FinanceInvoiceRepo and FinanceOpsRepo)

Referenced in raw SQL at `drizzle-finance-invoice.repo.ts:181` and `drizzle-finance-ops.repo.ts:86`. Columns: `invoice_id`, `amount`, `status`, `recorded_by`, `payment_date`. No Drizzle schema definition found in audit scope — this is a raw-SQL only table.

### `sales_invoices` / `purchase_invoices`
Referenced in `DrizzleFinanceAccountingRepo.getDashboard()` (`drizzle-finance-accounting.repo.ts:38–41`):
```sql
SELECT COALESCE(SUM(total_amount),0) FROM sales_invoices
SELECT COALESCE(SUM(total_amount),0) FROM sales_invoices WHERE payment_status = 'unpaid'
SELECT COALESCE(SUM(total_amount),0) FROM purchase_invoices
SELECT COALESCE(SUM(total_amount),0) FROM purchase_invoices WHERE payment_status = 'unpaid'
```
These are separate canonical tables from the SD and MM modules respectively. No Drizzle schema file for them was accessed in this audit — they are referenced only via raw SQL.

### `vendor_invoices`
**Defined in:** `apps/api/src/shared/db/schema-business-b-2.ts:36`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `vendor_id` | integer | |
| `invoice_no` | text | |
| `amount` | numeric(15,2) | |
| `match_status` | text | default 'unmatched' |
| `po_id` | integer FK→mm_purchase_orders | |
| `gr_id` | integer FK→mm_goods_receipts | |
| `invoice_date` | date | |
| `created_at`, `updated_at` | timestamp | |

Used in three-way matching (PO → GR → vendor invoice). Has a related `three_way_match_results` table.

### `gl_journal_entries` (Invoice-to-GL bridge)
**Defined in:** `apps/api/src/shared/db/schema-business-b-1.ts:135`
Used by `FinanceInvoiceRepo.saveGlEntry()` and `FinanceReportRepo.getCashFlow()`.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `source_type` | text | e.g. 'sales', 'expense', 'payroll' |
| `source_id` | text | |
| `entry_date` | timestamp | |
| `total_debit` | numeric(15,2) | |
| `total_credit` | numeric(15,2) | |
| `notes` | text | |
| `created_at` | timestamp | |

Also queried with `account_type`, `account_code` columns in `FinanceReportRepo.getCashFlow()` — these columns do **not exist** in the defined schema. The repo has try/catch fallback chains for this reason.

---

## 5. UI Elements & Handlers

### AccountsReceivable page (`src/pages/AccountsReceivable.tsx`)

| Element | Handler | File:Line | API Call |
|---|---|---|---|
| Page load | `useQuery` | AccountsReceivable.tsx:31 | `GET /api/ar/aging` |
| Overdue list load | `useQuery` | AccountsReceivable.tsx:35 | `GET /api/ar/overdue` |
| "Yangilash" (Recalculate) button | `recalculateMutation.mutate()` | AccountsReceivable.tsx:154 | `POST /api/ar/aging/recalculate` |
| "Excel" (Export) button | `handleExport()` — client-side CSV | AccountsReceivable.tsx:158 | none |
| AddArEntryDialog submit | `addEntryMutation.mutate()` | AccountsReceivable.tsx:51–58 | `POST /api/finance/ar/entries` (404) |
| Overdue filter dropdown | `setOverdueFilter(value)` | AccountsReceivable.tsx:92 | client-side filter |
| Column sort | `handleSort(field)` | AccountsReceivable.tsx:71 | client-side sort |

### AccountsPayable page (`src/pages/AccountsPayable.tsx`)

| Element | Handler | File:Line | API Call |
|---|---|---|---|
| Page load | `useQuery` | AccountsPayable.tsx:31 | `GET /api/ap/aging` |
| Overdue list load | `useQuery` | AccountsPayable.tsx:35 | `GET /api/ap/overdue` |
| "Yangilash" button | `recalculateMutation.mutate()` | AccountsPayable.tsx:154 | `POST /api/ap/aging/recalculate` |
| "Excel" button | `handleExport()` | AccountsPayable.tsx:158 | none |
| AddApEntryDialog submit | `addEntryMutation.mutate()` | AccountsPayable.tsx:51 | `POST /api/finance/ap/entries` (404) |

### CashFlowARAP widget (`src/components/finance/reports/CashFlowARAP.tsx`)

| Element | Data source | File:Line |
|---|---|---|
| Inflows display | `data?.cashFlow?.inflows` | CashFlowARAP.tsx:47 |
| Outflows display | `data?.cashFlow?.outflows` | CashFlowARAP.tsx:54 |
| Net cash flow | `data?.cashFlow?.netCashFlow` | CashFlowARAP.tsx:61 |
| AR movement (opening, collected, new, closing) | `data?.arMovement.*` | CashFlowARAP.tsx:96–110 |
| AP movement (opening, paid, new, closing) | `data?.apMovement.*` | CashFlowARAP.tsx:120–134 |

This component receives data as props from a parent page (not read in this audit). The data shape `WeeklySummary` is imported from `./types`.

---

## 6. What Is Missing or Broken

### 6.1 Invoice Creation is Fully Synthetic

`FinanceInvoicesController.createInvoice()` (`finance-invoices.controller.ts:81–88`):

```typescript
async createInvoice(@Body() body: FinanceCreateInvoiceDto) {
  this.logger.log(`Creating invoice for customer ${body.customerId}, Amount: ${body.amount}`);
  return {
    invoiceId: Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE),
    invoiceNumber: `INV-${Date.now()}`,
  };
}
```

No database insert. No invoice is persisted. The returned `invoiceId` is a random integer unrelated to any DB record.

Similarly, `createInvoiceRoot()` (`finance-invoices.controller.ts:69–73`) also returns a fake response:
```typescript
return { invoiceId: Date.now(), invoiceNumber: `INV-${Date.now()}`, ...dto, created: true };
```

### 6.2 Invoice Posting to GL is a No-op

`FinanceInvoicesController.postInvoice()` (`finance-invoices.controller.ts:94–103`):

```typescript
async postInvoice(@Param('invoiceId') invoiceId: number, @Body() body: FinancePostInvoiceDto) {
  return { message: 'Invoice posted to GL', invoiceId };
}
```

No GL entry is created. No `fi_invoices.status` is updated. The response text falsely claims the invoice was posted.

### 6.3 Invoice Detail Endpoint is Hardcoded

`FinanceInvoicesController.getInvoice()` (`finance-invoices.controller.ts:109–113`):

```typescript
async getInvoice(@Param('invoiceId') invoiceId: number) {
  return { data: { invoiceId, status: 'posted' } };
}
```

Returns a hardcoded object. No DB query. Every invoice ID returns `status: 'posted'`.

### 6.4 AR Aging Report — Real SQL but Table Column Mismatch

`FinanceReportRepo.getArAging()` (`drizzle-finance-report.repo.ts:25–51`) queries `fi_invoices` for `customer_name`, `total_amount`, `paid_amount`, `due_date`, `payment_status`. The Drizzle schema for `fi_invoices` (`schema-business-b-2.ts:61–75`) does not define `customer_name`, `total_amount`, `paid_amount`, or `payment_status`. These columns must be added by a DB migration not reflected in the Drizzle schema. If the DB was created only from Drizzle schemas (without separate migrations), these queries will fail with "column does not exist".

### 6.5 Payment-to-GL Integration Is Manual and Disconnected

Payment recording (`FinanceOpsRepo.recordPayment()`, `FinanceInvoiceRepo.savePayment()`) writes to `fi_payments` successfully. However, no service method automatically calls `saveGlEntry()` after a payment is recorded. The GL entry creation (`FinanceInvoiceRepo.saveGlEntry()`) exists but is never chained to the payment flow in any observed service. The trial balance will never reflect actual payments.

### 6.6 `gl_journal_entries` Queried with Non-Existent Columns

`FinanceReportRepo.getCashFlow()` (`drizzle-finance-report.repo.ts:64–75`) runs:
```sql
SELECT COALESCE(SUM(total_debit), 0) AS total
FROM gl_journal_entries
WHERE ...
  AND (account_type = 'expense' OR account_code LIKE '6%' OR account_code LIKE '7%' ...)
```

The `gl_journal_entries` schema has no `account_type` or `account_code` columns. The repo has a try/catch fallback that retries with `source_type` filter — but this means the primary cash flow query will always throw an exception in production.

### 6.7 Three Separate Invoice Tables With No Consolidation

| Table | PK Type | Managed by | Status |
|---|---|---|---|
| `fi_invoices` | serial integer | `FinanceInvoiceRepo`, `FinanceOpsRepo` | Real data possible but schema incomplete |
| `invoices` (schema-finance-invoicing) | UUID (cuid2) | No observed service | Likely unused |
| `sales_invoices` | Unknown | SD module | Referenced only via raw SQL in dashboard |

No migration plan or consolidation was found. The accounting dashboard (`getDashboard()`) reads from `sales_invoices` for AR totals while the AR aging reads from `fi_invoices` — these are different datasets.

### 6.8 AP Overdue Source Unknown

`FinanceApService.recalculateAging()` (`finance-ap.service.ts:34`) calls `this.repo.getUnpaidPurchaseInvoices()`. The `IFinanceApRepo` interface (`i-finance-ap.repo.ts` — not read, referenced at `finance-ap.service.ts:10`) defines this method. Which table it reads (purchase_invoices vs fi_invoices vs vendor_invoices) was not confirmed.

### 6.9 Invoice Number Generation is Non-Deterministic and Not Stored

Invoice numbers generated in the controller (`INV-${Date.now()}`) are never stored because no DB insert occurs. If the DB insert were added, the number generator would be unsafe under concurrent requests (two requests within the same millisecond produce duplicate numbers). The `invoices` table in `schema-finance-invoicing.ts` has a `UNIQUE` index on `invoice_number` which would catch duplicates at the DB level, but the `fi_invoices` table has no such constraint.

---

## Summary

The AR/AP/Invoices module has **solid read-path infrastructure** for aging buckets and overdue lists: real SQL queries, correct aging math, and a proper recalculation cycle. The `FinanceReportRepo.getArAging()` SQL is particularly well-structured with inline CASE bucketing.

However, the **write path is almost entirely non-functional**:

- Invoice creation returns a fake random ID with no DB record.
- Invoice posting to GL returns a success message with no action taken.
- Invoice detail lookup returns hardcoded `{ status: 'posted' }`.
- Payment-to-GL chaining is missing — payments are stored but never reflected in the ledger.
- Cash flow queries reference columns that do not exist in the Drizzle schema.

The three-table invoice fragmentation means no single source of truth exists for invoice totals, making the accounting dashboard AR/AP numbers unreliable.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|---|---|---|---|---|
| `createInvoice()` returns random ID, no DB insert | P0 | `finance-invoices.controller.ts:85–87` | No invoices are ever persisted | Implement `FinanceInvoiceRepo.saveInvoice()` call; use sequence for invoice_no |
| `postInvoice()` returns success string with no GL entry and no status update | P0 | `finance-invoices.controller.ts:100–103` | Invoice status never changes; GL never receives invoice posting | Call `FinanceInvoiceRepo.saveGlEntry()` and update `fi_invoices.status = 'posted'` |
| `getInvoice()` returns hardcoded stub `{ status: 'posted' }` | P0 | `finance-invoices.controller.ts:109–113` | Invoice detail view is fabricated | Call `FinanceInvoiceRepo.findInvoiceById(invoiceId)` |
| Payment recording does not create GL journal entry | P0 | `drizzle-finance-ops.repo.ts:82`; no `saveGlEntry` call follows | Cash receipts/disbursements invisible to trial balance | Chain `saveGlEntry()` after `recordPayment()` in the payment service |
| `fi_invoices` Drizzle schema missing `total_amount`, `paid_amount`, `payment_status`, `customer_name` columns | P0 | `schema-business-b-2.ts:61`; `drizzle-finance-report.repo.ts:28–46` | AR aging SQL will fail with "column not found" on a fresh DB | Add missing columns to Drizzle schema and create migration |
| `gl_journal_entries` queried for `account_type`/`account_code` columns that do not exist | P1 | `drizzle-finance-report.repo.ts:64–75`; `schema-business-b-1.ts:135` | Cash flow outflow calculation always throws, falls back to `source_type` filter | Add `account_code` and `account_type` to `gl_journal_entries` schema or rewrite query to use `entries` table |
| `POST /finance/ar/entries` and `POST /finance/ap/entries` not implemented | P1 | `AccountsReceivable.tsx:53`; `AccountsPayable.tsx:53` | Add AR/AP entry buttons always fail with 404 | Add routes to respective controllers |
| Three disjoint invoice tables (`fi_invoices`, `invoices`, `sales_invoices`) with no consolidation | P1 | `schema-business-b-2.ts:61`; `schema-finance-invoicing.ts:20`; raw SQL in `drizzle-finance-accounting.repo.ts:38` | AR totals in dashboard read different data than aging report | Designate one canonical table; migrate all usages |
| Invoice number generation (`INV-${Date.now()}`) is non-unique under concurrency and never stored | P1 | `finance-invoices.controller.ts:86` | Duplicate invoice numbers possible; no audit trail | Use DB sequence (`invoice_seq`) or UUID approach; store in DB |
| `fi_invoices.type` column ambiguity — single table for both AR and AP, distinguishing field is `type = 'payable'/'receivable'` but column is not enforced with a CHECK | P2 | `schema-business-b-2.ts:64` | AR and AP can be confused if `type` missing | Add `CHECK (type IN ('payable','receivable'))` |
| `vendor_invoices` table exists with 3-way match logic but no UI or service reads it via the finance module | P2 | `schema-business-b-2.ts:36`; `three_way_match_results` table | 3-way match feature is schema-only, not operational | Connect to procurement module or document as deferred |
| `invoices` table (schema-finance-invoicing) is defined with `invoiceStatusEnum` and FK to `sales_orders` but has no service layer | P3 | `schema-finance-invoicing.ts:20–50` | Unused schema adds migration overhead | Either wire to SD module or remove from active schema |
| No dedicated invoice list/detail page in frontend finance routes | P2 | `FinanceRoutes.tsx:37–71` | Finance team cannot browse or manage invoices from UI | Add `/accounting/invoices` route with list + detail pages |

---

## Open Questions / UNVERIFIED

1. What does the `GetInvoicesQuery` QueryBus handler (`get-invoices.query.ts`) resolve to? Which repository does it call? The controller dispatches the query but the handler was not found in the audit.
2. Does `IFinanceApRepo.getUnpaidPurchaseInvoices()` read `purchase_invoices`, `fi_invoices`, or both? The concrete implementation file was not identified.
3. What is the `WeeklySummary` type (`CashFlowARAP.tsx` → `./types`) and what endpoint feeds data to the `CashFlowARAP` component? The parent page was not read.
4. Does `sales_invoices` or `purchase_invoices` have a Drizzle schema definition in the SD or MM modules? If so, are they consistent with the raw SQL column references in the accounting dashboard?
5. Is `fi_payments` defined anywhere as a Drizzle table? The raw SQL inserts to it but no Drizzle schema was found, meaning Drizzle migrations will not create this table.
6. The `vendor_invoices.match_status` + `three_way_match_results` tables suggest a procurement AP workflow was planned — is there a corresponding service or it was abandoned?
