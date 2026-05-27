# Report 08 — Finance: General Ledger
**Date:** 2026-05-27  
**Analyst:** Forensic audit sub-agent  
**Scope:** Full vertical slice — frontend → API → service → repository → Drizzle schema → DB table

---

## 1. Module Overview

The General Ledger (GL) module is the central double-entry bookkeeping engine of EuroPrint ERP. It manages the chart of accounts, GL documents (journal entry headers), GL lines (individual debit/credit lines), accounting periods, and a trial balance endpoint. The module is split across two controller paths (`/finance/gl` and `/accounting`) and three service layers.

Key source files:

| Layer | File |
|---|---|
| Canonical schema | `lib/db/src/schema/fi-gl.ts` |
| App schema re-export | `apps/api/src/shared/db/schema-ext-b-1.ts` (line 41–42) |
| Stub schema (entries) | `apps/api/src/shared/db/schema-finance-extended.ts` (line 30–38) |
| GL repository interface | `apps/api/src/modules/finance/gl/i-finance-gl.repo.ts` |
| GL repository impl | `apps/api/src/modules/finance/gl/drizzle-finance-gl.repo.ts` |
| GL service | `apps/api/src/modules/finance/gl/gl.service.ts` |
| GL controller | `apps/api/src/modules/finance/presentation/finance-gl.controller.ts` |
| Accounting controller | `apps/api/src/modules/finance/presentation/finance-accounting.controller.ts` |
| Accounting service | `apps/api/src/modules/finance/application/finance-accounting.service.ts` |
| Accounting repo | `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-accounting.repo.ts` |
| GL posting service | `apps/api/src/modules/finance/domain/services/gl-posting.service.ts` |
| GL account constants | `apps/api/src/modules/finance/domain/constants/gl-accounts.constants.ts` |

---

## 2. Page/Screen Inventory

All finance/GL routes are registered in `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx`:

| Route | Component (lazy-loaded) | File |
|---|---|---|
| `/accounting/gl-documents` | `GLDocuments` | `src/pages/GLDocuments.tsx` |
| `/accounting/chart-of-accounts` | `ChartOfAccounts` | `src/pages/ChartOfAccounts.tsx` |
| `/finance/gl-chart-of-accounts` | `GLChartOfAccounts` | `src/pages/GLChartOfAccounts.tsx` |
| `/accounting/period-closing` | `PeriodClosing` | `src/pages/PeriodClosing.tsx` |
| `/finance-dashboard` | `FinanceDashboard` | `src/pages/FinanceDashboard.tsx` |
| `/finance/reports` | `FinancialReports` | `src/pages/FinancialReports.tsx` |
| `/accounting/income-expense` | `IncomeExpense` | `src/pages/IncomeExpense.tsx` |
| `/accounting/inventory-valuation` | `InventoryValuation` | `src/pages/InventoryValuation.tsx` |

The `GLDocumentsTab` component (`src/components/finance/GLDocumentsTab.tsx`) is an inline sub-tab embedded in a parent view; it queries `/api/fi/gl-documents` and renders a paginated table with a "Post" action button per draft document.

The `AccountantView` page (`src/pages/AccountantView.tsx`) is the main accountant landing page, reached at an implicit route. It queries four separate endpoints under `/api/europrint-control/accountant/...`.

---

## 3. Data Flow Chains

### Chain A — Chart of Accounts

```
GET /accounting/accounts?type=&limit=&offset=
  → FinanceAccountingController.getAccounts()  [finance-accounting.controller.ts:63]
  → FinanceAccountingService.getAccounts()     [finance-accounting.service.ts:21]
  → DrizzleFinanceAccountingRepo.findAccounts() [drizzle-finance-accounting.repo.ts:18]
  → raw SQL: SELECT id, code, name, account_type FROM accounts WHERE ...
  → accounts table (lib/db/src/schema/fi-gl.ts:23)
```

Alternative path (used by GL sub-module):
```
GET /finance/gl/accounts (not visible in controller — missing endpoint)
  → GlService.findAllAccounts()               [gl.service.ts:46]
  → DrizzleFinanceGlRepository.findAllAccounts() [drizzle-finance-gl.repo.ts:28]
  → db.select().from(accounts)
  → accounts table
```

### Chain B — GL Documents (Journal Entry Headers)

```
GET /accounting/gl-documents?status=&documentType=&startDate=&endDate=
  → FinanceAccountingController.getGlDocuments() [finance-accounting.controller.ts:75]
  → FinanceAccountingService.getGlDocuments()    [finance-accounting.service.ts:30]
  → DrizzleFinanceAccountingRepo.getGlDocumentsFiltered() [drizzle-finance-accounting.repo.ts:53]
  → raw SQL: SELECT * FROM gl_documents WHERE ...
  → gl_documents table (lib/db/src/schema/fi-gl.ts:138)

POST /accounting/gl-documents
  → FinanceAccountingController.createGlDocument() [finance-accounting.controller.ts:92]
  → FinanceAccountingService.createGlDocument()    [finance-accounting.service.ts:36]
  → DrizzleFinanceAccountingRepo.getGlDocumentSeq()  → NEXTVAL('gl_document_seq')
  → DrizzleFinanceAccountingRepo.insertGlDocument()  → INSERT INTO gl_documents
  → DrizzleFinanceAccountingRepo.insertGlLine() (per line) → execGlLineInsert()
  → gl_documents + gl_lines tables
```

### Chain C — Trial Balance (CRITICAL)

```
GET /finance/gl/trial-balance?date=YYYY-MM-DD
  → FinanceGlController.getTrialBalance()        [finance-gl.controller.ts:88]
  → GlService.getTrialBalance(date)              [gl.service.ts:113]
  → DrizzleFinanceGlRepository.getTrialBalance() [drizzle-finance-gl.repo.ts:60]
  → db.select({ totalDebit: sql`COALESCE(SUM(CASE WHEN entries.debit_account_id IS NOT NULL ...))`,
                totalCredit: sql`COALESCE(SUM(CASE WHEN entries.credit_account_id IS NOT NULL ...))` })
     .from(entries)
     .where(sql`entries.entry_date <= ${targetDate}`)
  → entries table (lib/db/src/schema/fi-gl.ts:51 / schema-finance-extended.ts:30)
  → returns { debit, credit, balanced: Math.abs(debit-credit) < 0.01, date }
```

### Chain D — Ledger Drilldown

```
GET /finance/gl/ledger/:accountCode?page=&limit=
  → FinanceGlController.getLedger()            [finance-gl.controller.ts:98]
  → GlService.getLedger(accountCode, p, l)     [gl.service.ts:121]
  → DrizzleFinanceGlRepository.getLedger()     [drizzle-finance-gl.repo.ts:74]
  → db.select().from(entries).where(
       or(eq(entries.debitAccountId, accountCode),
          eq(entries.creditAccountId, accountCode)))
  → entries table
```

### Chain E — GL Posting (Sales Invoice, Payroll)

```
POST /finance/gl/post-sales-invoice  { invoiceId, amount, tax }
  → FinanceGlController.postSalesInvoice()      [finance-gl.controller.ts:59]
  → GlPostingService.postSalesInvoice()         [gl-posting.service.ts:22]
  → builds JournalLine[] [DR: AR_TRADE, CR: REVENUE + SALES_TAX]
  → GlPostingService.createJournalEntry()       [gl-posting.service.ts:81]
  → validates debit == credit (tolerance 0.01)
  → returns Ok(Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE))
```

---

## 4. DB Tables & Columns Used

### `accounts` (Chart of Accounts)
**Canonical:** `lib/db/src/schema/fi-gl.ts:23`  
Re-exported via `@workspace/db` → `schema-ext-b-1.ts:41`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `account_code` | varchar(20) UNIQUE NOT NULL | e.g. '1000', '4000' |
| `account_name` | text NOT NULL | |
| `account_name_ru` | text | |
| `account_type` | varchar(20) NOT NULL | CHECK: asset/liability/equity/revenue/expense |
| `parent_account_id` | varchar | Self-reference FK |
| `is_active` | boolean | default true |
| `created_at` | timestamp | |
| `deleted_at` | timestamp | soft delete |

### `gl_documents` (Journal Entry Headers)
**Canonical:** `lib/db/src/schema/fi-gl.ts:138`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `document_number` | varchar(50) UNIQUE NOT NULL | |
| `document_date` | varchar(10) NOT NULL | YYYY-MM-DD |
| `posting_date` | varchar(10) NOT NULL | |
| `document_type` | varchar(20) NOT NULL | CHECK: invoice/payment/transfer/adjustment/sales_invoice/purchase_invoice |
| `reference_type` | varchar(30) | sales_order/purchase_order/manual etc. |
| `reference_id` | varchar | |
| `description` | text | |
| `currency` | varchar(10) | default 'UZS' |
| `total_debit` | numeric(15,2) | |
| `total_credit` | numeric(15,2) | |
| `status` | varchar(20) | CHECK: draft/posted/reversed |
| `posted_by` | varchar FK→users | |
| `posted_at` | timestamp | |
| `deleted_at` | timestamp | soft delete |
| `created_at` | timestamp | |

### `gl_lines` (Journal Entry Lines)
**Canonical:** `lib/db/src/schema/fi-gl.ts:193`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `gl_document_id` | varchar NOT NULL FK→gl_documents CASCADE | |
| `line_number` | integer NOT NULL | |
| `account_id` | varchar NOT NULL FK→accounts RESTRICT | |
| `cost_center_id` | varchar FK→cost_centers | |
| `profit_center_id` | varchar FK→profit_centers | |
| `debit_amount` | numeric(15,2) | default 0 |
| `credit_amount` | numeric(15,2) | default 0 |
| `description` | text | |
| `created_at` | timestamp | |

### `entries` (Simple Double-Entry Rows)
**Canonical:** `lib/db/src/schema/fi-gl.ts:51`  
**Stub also exists:** `apps/api/src/shared/db/schema-finance-extended.ts:30`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `entry_number` | varchar(50) UNIQUE NOT NULL | |
| `entry_date` | varchar(10) NOT NULL | YYYY-MM-DD |
| `document_type` | varchar(50) NOT NULL | |
| `document_id` | varchar | |
| `debit_account_id` | varchar FK→accounts | |
| `credit_account_id` | varchar FK→accounts | |
| `amount` | numeric NOT NULL | CHECK: > 0 |
| `description` | text | |
| `created_by` | integer FK→users | |
| `created_at` | timestamp | |

### `accounting_periods`
**Canonical:** `lib/db/src/schema/fi-gl.ts:218`  
**Stub also exists:** `apps/api/src/shared/db/schema-finance-extended.ts:43`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `period_code` | varchar(7) UNIQUE | YYYY-MM |
| `fiscal_year` | integer NOT NULL | |
| `month` | integer NOT NULL | CHECK: 1–12 |
| `start_date`, `end_date` | varchar(10) | |
| `status` | varchar(20) | CHECK: open/closed/soft_closed |
| `closed_by` | varchar FK→users | |
| `closed_at` | timestamp | |

Also referenced by raw SQL in the accounting repo as `accounting_periods` with columns `status`, `fiscal_year`, `month`, `closed_by`, `closed_at` — these match the canonical schema.

### `gl_journal_entries` (Secondary, older table)
**Defined in:** `apps/api/src/shared/db/schema-business-b-1.ts:135`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `document_id` | integer | |
| `document_type` | text | |
| `debit_account` | text | |
| `credit_account` | text | |
| `amount` | numeric(15,2) | |
| `currency` | text | default 'UZS' |
| `description` | text | |
| `posted_at` | timestamp | |
| `created_at` | timestamp | |

This is a **separate, older table** with a simpler schema. It is used by `FinanceInvoiceRepo.saveGlEntry()` and `FinanceOpsRepo` cash-flow calculations — it coexists with the canonical `gl_documents`/`gl_lines`/`entries` system.

### `gl_account_mappings`
**Defined in:** `apps/api/src/shared/db/schema-business-b-1.ts:124`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `transaction_type` | text | |
| `account_code` | text | |
| `debit_account` | text | |
| `credit_account` | text | |
| `description` | text | |

---

## 5. UI Elements & Handlers

### GLDocumentsTab (`src/components/finance/GLDocumentsTab.tsx`)

| Element | Handler | File:Line |
|---|---|---|
| "Yangi hujjat" button | opens Dialog | GLDocumentsTab.tsx:122 |
| Document Number input | form field | GLDocumentsTab.tsx:136 |
| Document Date input | form field | GLDocumentsTab.tsx:146 |
| Posting Date input | form field | GLDocumentsTab.tsx:155 |
| Document Type select | form field | GLDocumentsTab.tsx:165 |
| Description textarea | form field | GLDocumentsTab.tsx:184 |
| Save button (submit) | `createMutation.mutate(d)` → POST `/api/fi/gl-documents` | GLDocumentsTab.tsx:135 |
| "Joylashtirish" button | `postMutation.mutate(doc.id)` → POST `/api/fi/gl-documents/:id/post` | GLDocumentsTab.tsx:247 |

Note: The component fetches from `/api/fi/gl-documents` (line 53) but the controller is mounted at `/accounting/gl-documents`. This is a URL mismatch — the correct path is `GET /accounting/gl-documents`.

### AccountsReceivable page (`src/pages/AccountsReceivable.tsx`)

| Element | Handler | File:Line |
|---|---|---|
| Recalculate button | `recalculateMutation.mutate()` → POST `/api/ar/aging/recalculate` | AccountsReceivable.tsx:154 |
| Export CSV button | `handleExport()` | AccountsReceivable.tsx:158 |
| Add AR Entry dialog submit | `addEntryMutation.mutate()` → POST `/api/finance/ar/entries` | AccountsReceivable.tsx:51 |

### AccountsPayable page (`src/pages/AccountsPayable.tsx`)

| Element | Handler | File:Line |
|---|---|---|
| Recalculate button | `recalculateMutation.mutate()` → POST `/api/ap/aging/recalculate` | AccountsPayable.tsx:154 |
| Export button | `handleExport()` | AccountsPayable.tsx:158 |
| Add AP Entry dialog submit | `addEntryMutation.mutate()` → POST `/api/finance/ap/entries` | AccountsPayable.tsx:51 |

---

## 6. What Is Missing or Broken

### 6.1 Trial Balance — REAL DB QUERY (Confirmed)

The trial balance is backed by a **real database query**. Exact code from `drizzle-finance-gl.repo.ts:60–71`:

```typescript
async getTrialBalance(date?: string): Promise<Result<{ debit: number; credit: number; balanced: boolean; date: string }>> {
  try {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const rows = await db.select({
      totalDebit:  sql<number>`COALESCE(SUM(CASE WHEN ${entries.debitAccountId}  IS NOT NULL THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
      totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${entries.creditAccountId} IS NOT NULL THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
    }).from(entries)
      .where(sql`${entries.entryDate} <= ${targetDate}`);
    const debit  = Number(rows[0]?.totalDebit  ?? 0);
    const credit = Number(rows[0]?.totalCredit ?? 0);
    return Ok({ debit, credit, balanced: Math.abs(debit - credit) < 0.01, date: targetDate });
  } catch (e: unknown) { return Err((e as Error)?.message || 'Trial balance xatolik'); }
}
```

This queries the `entries` table. No synthetic data, no `Math.random`, no static arrays. The result is correct in structure but has a **critical schema ambiguity** (see 6.3 below).

### 6.2 GL Posting Service Does NOT Persist to DB

`GlPostingService.createJournalEntry()` (`gl-posting.service.ts:81–91`) validates debit/credit balance but **never writes to any database table**. The return value is:

```typescript
return Ok(Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE));
```

The random integer is returned as an "entry ID" but no INSERT is executed. Every call to `postSalesInvoice`, `postPayroll`, `postCustomerPayment`, `postGoodsReceipt`, `postVendorPayment`, `postMaterialConsumption` silently discards the validated journal lines. This is a **P0 data loss defect**.

### 6.3 `entries` Table Schema Ambiguity (Dual Definition)

The `entries` table is defined twice:

1. **Canonical** — `lib/db/src/schema/fi-gl.ts:51` — full schema with `entry_number`, `document_type`, `document_id`, FK to `accounts`, CHECK constraint `amount > 0`.
2. **Stub** — `apps/api/src/shared/db/schema-finance-extended.ts:30` — minimal 6-column version with `integer` PK and `text` account IDs (no FK).

The GL repo imports `entries` from `@europrint/schemas` (`drizzle-finance-gl.repo.ts:8`). Which schema takes effect at runtime depends on the `@europrint/schemas` package export, which was not resolved to a single source of truth. The trial balance query uses `entries.debitAccountId` and `entries.creditAccountId` column names, which match the Drizzle camelCase for `debit_account_id` / `credit_account_id` in the canonical schema.

### 6.4 Frontend API URL Mismatch for GL Documents

`GLDocumentsTab.tsx:53` fetches from `/api/fi/gl-documents`. The accounting controller (`finance-accounting.controller.ts:75`) is mounted at `@Controller('accounting')` → route is `/accounting/gl-documents`. The path `/api/fi/gl-documents` has no matching controller in the codebase. The tab will always receive a 404.

### 6.5 `POST /api/finance/ar/entries` and `POST /api/finance/ap/entries` — Unimplemented

Both `AccountsReceivable.tsx:53` and `AccountsPayable.tsx:53` call these endpoints. No controller or route in the codebase handles `POST /finance/ar/entries` or `POST /finance/ap/entries`. The AR controller (`finance-ar.controller.ts`) exposes only GET `/ar/aging`, GET `/ar/overdue`, POST `/ar/aging/recalculate`. These buttons will 404.

### 6.6 Account Code Collision in GL Constants

`gl-accounts.constants.ts` maps two logically distinct accounts to the same code `5000`:
- `CAPITAL: '5000'` (equity)
- `COGS: '5000'` (expense)

And `2200` is shared between:
- `SALES_TAX_PAYABLE: '2200'`
- `EMPLOYEE_DEDUCTIONS: '2200'`

And `7000` is shared between:
- `MATERIAL_EXPENSE: '7000'`
- `EMPLOYER_CONTRIBUTION: '7000'`

When GL posting uses these codes they produce ambiguous ledger entries.

### 6.7 Period Closing — Stub Schema Mismatch

`DrizzleFinanceAccountingRepo.closePeriod()` (`drizzle-finance-accounting.repo.ts:107`) issues:
```sql
UPDATE accounting_periods SET status = 'closed', closed_by = ..., closed_at = NOW() WHERE id = ...
```
The stub schema (`schema-finance-extended.ts:43`) defines `is_closed boolean` (not `status text`). The canonical schema (`fi-gl.ts:218`) has `status varchar`. If the wrong schema is running the DB migration, the UPDATE will fail on `status` column not existing.

---

## Summary

The GL module has a **solid structural foundation**: a canonical Drizzle schema (`fi-gl.ts`) with proper CHECK constraints, a clean DDD layering (controller → service → repo → DB), and a trial balance endpoint backed by a real aggregation query over the `entries` table. Double-entry balance is enforced at the service layer before every `postDocument` call.

However, the module has severe functional gaps:

1. GL posting (sales invoices, payroll, goods receipts) produces validated journal lines in memory but **never writes them to the database** — the system passes back a fake random ID.
2. The frontend GL Documents tab calls a non-existent API route.
3. AR and AP "Add Entry" buttons point to unimplemented endpoints.
4. The GL chart of accounts has duplicate account codes that corrupt the chart semantics.
5. Two separate schemas for the `entries` table create runtime ambiguity.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|---|---|---|---|---|
| `GlPostingService.createJournalEntry()` never persists to DB — returns random fake ID | P0 | `gl-posting.service.ts:81–91` | All GL postings (sales, payroll, goods receipts, payments) are silently lost | Inject a repo, call `db.insert(entries).values(...)` inside `createJournalEntry`, return real inserted ID |
| Frontend `GLDocumentsTab` queries `/api/fi/gl-documents` (404) | P0 | `GLDocumentsTab.tsx:53` | GL Documents tab always empty | Change query key to `/api/accounting/gl-documents` |
| `POST /finance/ar/entries` not implemented | P1 | `AccountsReceivable.tsx:53` | "Add AR Entry" dialog always fails with 404 | Implement endpoint in `finance-ar.controller.ts` |
| `POST /finance/ap/entries` not implemented | P1 | `AccountsPayable.tsx:53` | "Add AP Entry" dialog always fails with 404 | Implement endpoint in `finance-ap.controller.ts` |
| Duplicate GL account codes (`5000` = CAPITAL and COGS; `2200` = TAX and DEDUCTIONS; `7000` = MATERIAL and EMPLOYER) | P1 | `gl-accounts.constants.ts:11–25` | Journal entries posted to wrong accounts, trial balance corrupted | Assign unique codes per Uzbekistan BX standard (CAPITAL → 8400, COGS → 9100, SALES_TAX → 6410, EMPLOYER_CONT → 6520) |
| Dual `entries` table schema (stub vs. canonical) — runtime import unclear | P1 | `schema-finance-extended.ts:30`; `fi-gl.ts:51` | Trial balance query may fail or use wrong column names depending on which schema wins | Remove stub definition; ensure all repos import from `@workspace/db` / `lib/db/src/schema/fi-gl.ts` |
| `accounting_periods` stub schema (`is_closed boolean`) conflicts with canonical (`status varchar`) | P1 | `schema-finance-extended.ts:43`; `fi-gl.ts:218` | `closePeriod` SQL UPDATE will fail if wrong schema is migrated | Remove stub; converge to canonical |
| `GlService.findAllAccounts()` path has no registered HTTP route in either controller | P2 | `gl.service.ts:46` (method exists but no controller route) | Chart of accounts endpoint missing from `/finance/gl` path | Add `GET /finance/gl/accounts` to `finance-gl.controller.ts` |
| `gl_journal_entries` (old table, `schema-business-b-1.ts:135`) coexists with `gl_documents`/`entries` (new schema) — no consolidation | P2 | `schema-business-b-1.ts:135`; `drizzle-finance-invoice.repo.ts:199` | Invoice GL entries go to `gl_journal_entries`; posting goes to `entries`; trial balance only reads `entries` — split ledger | Migrate `FinanceInvoiceRepo.saveGlEntry()` to use canonical `entries` table; deprecate `gl_journal_entries` |
| `AccountantView` queries `/api/europrint-control/accountant/financial-summary` — source of data unknown | P2 | `AccountantView.tsx:122–124` | Cannot verify if summary is real DB data or synthetic | Trace `europrint-control` module controller |
| No frontend page renders the ledger drilldown (`GET /finance/gl/ledger/:accountCode`) | P3 | `finance-gl.controller.ts:98` | Ledger endpoint exists but is unreachable from UI | Add ledger view to `GLDocuments` or `ChartOfAccounts` page |

---

## Open Questions / UNVERIFIED

1. What does `@europrint/schemas` resolve to at build time? Is it the canonical `lib/db/src/schema/fi-gl.ts` exports or a separate package? This determines which `entries` schema the trial balance query actually runs against.
2. Is the `gl_document_seq` PostgreSQL sequence created by any migration? `DrizzleFinanceAccountingRepo.getGlDocumentSeq()` falls back to a timestamp string if NEXTVAL fails — the fallback path may mask a missing sequence.
3. Does the `FINANCE_RANDOM_REF_RANGE` constant provide any meaningful value? The random ID returned by `GlPostingService` is used as `entryId` in the API response — is downstream code treating it as a real FK?
4. The `FinanceGlController` uses `QueryBus` for `GetGlEntriesQuery` (`finance-gl.controller.ts:52`) but the query handler was not found in scope — what does it resolve to?
5. Is there a DB trigger or application-level hook that auto-posts entries to `entries` when a `gl_documents` record transitions from `draft` → `posted`? No such logic was found in the service layer.
