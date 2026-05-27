# Report 08 — Finance General Ledger

**Date:** 2026-05-27 (round 2)
**Analyst:** Forensic audit sub-agent (verification pass)
**Scope:** `apps/api/src/modules/finance/`, `apps/api/src/modules/fi/`, `lib/db/src/schema/fi-gl.ts`
**Method:** Re-read every file round 1 named; verify quoted code; widen the search where round 1's claims do not match what is on disk today.

---

## Diff vs round 1

Round 1 was written against a snapshot in which `GlPostingService.createJournalEntry` was a 10-line stub that returned `Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE)` instead of inserting anything. That snapshot **no longer exists**. The file was last touched today (`2026-05-27 13:06`); the constants file was touched today (`13:07`); the GL posting repository was touched today (`13:07`). Round 1's evidence quote is stale.

What changed since round 1:

| Round-1 finding | Round-1 severity | Round-2 verdict |
|---|---|---|
| **P0-01** `createJournalEntry` returns `Math.random()`, never writes | **P0** | **REFUTED.** Method now iterates lines, calls `glPostingRepo.insertEntry()` per line, returns the first inserted row id. Real INSERTs land in `entries` via Drizzle. See section 2. |
| **P0-11** Duplicate codes in chart-of-accounts seed (5000=CAPITAL+COGS, 2200=SALES_TAX+DEDUCTIONS, 7000=MATERIAL+EMPLOYER) | **P0** | **PARTIALLY REFUTED.** The default CoA *seed* (`gl.service.ts:135-148`) seeds CASH/AR/INVENTORY_ADJ/FIXED_ASSETS/AP/SHORT_TERM_LOANS/CAPITAL/REVENUE/MATERIAL_EXPENSE/LABOR_EXPENSE — **all ten codes are unique** within the seed. The duplicates only exist in the *runtime constant* `GL` (`gl-accounts.constants.ts:11-30`), which is now marked `@deprecated` with a note pointing to `GL_ACCOUNTS_V2`. However the `GL` constant is still the one imported by `gl-posting.service.ts:6` and `gl.service.ts:10` — so journal-line `debitAccountId`/`creditAccountId` values are still corrupted. `GL_ACCOUNTS_V2` is defined but unused anywhere outside its own file. Severity stays P0 — see section 3. |
| Trial balance query (`drizzle-finance-gl.repo.ts:60-71`) reads real data from `entries` | informational | **CONFIRMED**, code is byte-identical. See section 4. |
| Stub schema `entries` (6-col) coexists with canonical `entries` (12+col) | P1 | **PARTIALLY CONFIRMED.** Canonical `entries` table is now in `lib/db/src/schema/fi-gl.ts:51-72` with extra ADD-ONLY drift columns (`debit_account text`, `credit_account text`, `reference_id`, `posted_by`, `posted_at`). The "stub" version round 1 cited at `schema-finance-extended.ts:30` was not re-checked but `drizzle-gl-posting.repo.ts:12` is explicit: `import { entries } from '@workspace/db';` "(canonical fi-gl schema with entryNumber) rather than @europrint/schemas which resolves to the stub (missing entryNumber column)." Both schemas still exist; the posting repo and the GL repo deliberately import from different aliases. |
| Period close UPDATE issues `status='closed'` against (possibly) `is_closed boolean` schema | P1 | **PARTIALLY REFUTED.** Canonical schema has BOTH `status varchar` AND ADD-ONLY `is_closed boolean` (`fi-gl.ts:225, 231`). The UPDATE will succeed against the canonical schema. There is still no real *closing* logic — the period-close UPDATE flips a status column and nothing else. See section 6. |
| `gl_journal_entries` (old) coexists with `gl_documents`/`entries` (new) | P2 | **CONFIRMED.** `drizzle-finance-invoice.repo.ts:240` still reads `LEFT JOIN gl_journal_lines gjl ON gjl.entry_id = gje.id`. `drizzle-finance-planning.repo.ts:162` reads `FROM gl_journal_lines jl`. See section 5. |
| `GlService.findAllAccounts()` has no HTTP route | P2 | **REFUTED.** `GlStandaloneController` (`presentation/gl-standalone.controller.ts:38-41`) wires `GET /gl/accounts` to `glSvc.findAllAccounts()`. |
| `gl_account_mappings` table at `schema-business-b-1.ts:124` | informational | Not re-verified — outside scope of round-2 verification list. |

New round-2 findings not in round 1:

1. The `fi/` module the user asked about (`apps/api/src/modules/fi/`) is **empty except for a one-line re-export shim** (`fi/tax/general-tax.service.ts`). The README explicitly states the `fi/` micro-module was deleted ("PA3-17: Moved from `modules/fi/tax/general-tax.service.ts` as part of the tiny-module consolidation pass. The `fi/` micro-module has been deleted").
2. There are now TWO controllers mounted under `/fi` and `/accounting` doing overlapping work — `FiController` at `presentation/fi.controller.ts` (route prefix `fi`) and `FinanceAccountingController` at `presentation/finance-accounting.controller.ts` (route prefix `accounting`). They both create and post GL documents.
3. There is NO inter-company support. There is NO foreign-currency revaluation. `gl_documents.currency` defaults to `'UZS'` and is propagated through the INSERT but is never converted, never revalued, never split into base + transaction currency.
4. There is NO retained-earnings / year-end closing logic. Period close = `UPDATE accounting_periods SET status='closed'`.
5. The "balance sheet" query (`financial-reports-query.helpers.ts:124-160`) is *structurally wrong* — it only sums `entries.amount` joined on `debit_account_id`, so credits never reduce the balance and equity is taken from a different aggregate than assets/liabilities. See section 8.
6. Trial balance query in `drizzle-finance-gl.repo.ts:60-71` and the *other* trial balance query in `reports/drizzle-reports.repo.ts:18-35` give different answers — the first sums all-time, the second filters by `EXTRACT(YEAR FROM created_at) = ?` in the JOIN condition (so non-matching entries become NULL rows, not excluded). See section 4.

---

## 1. Module structure (finance/ vs fi/)

There are TWO directories on disk:

```
apps/api/src/modules/
├── finance/                      153 .ts files — the main module
│   ├── fi/                       3 files (drizzle-fi.repo.ts, fi.service.ts, i-fi.repo.ts)
│   ├── gl/                       3 files
│   ├── domain/services/          gl-posting.service.ts, financial-ratios, depreciation...
│   ├── infrastructure/repositories/   ~15 drizzle repos
│   ├── presentation/             ~30 controllers
│   ├── financial-reports/        own sub-module with cron jobs
│   └── ...
└── fi/                           1 file — a shim
    └── tax/general-tax.service.ts    (re-export only)
```

Top-level `fi/tax/general-tax.service.ts` is four lines:

```typescript
/**
 * Re-export shim: GeneralTaxService lives in finance/application.
 * This barrel keeps the legacy fi/tax import path working.
 */
export { GeneralTaxService } from '../../finance/application/general-tax.service';
```

So the answer to "what's the relationship?" is: **`fi/` has been deleted in fact; only a one-symbol back-compat shim survives.** The real `fi/`-style code (accounting periods, GL documents, payments, cost centers, profit centers) was folded into `finance/fi/` and `finance/presentation/fi.controller.ts`. The README at `apps/api/src/modules/finance/README.md` is now inaccurate — it still describes `finance/` as the CFO-analytics layer sitting on top of `fi/`:

```
> CFO-facing financial analytics + period close. Companion to `fi/` (which
> handles raw bookkeeping — GL entries, AP/AR, journal posting). `finance/`
> sits on top of `fi/` and produces the numbers you see on the CFO dashboard.
```

…but `fi/` no longer exists at the top level. The bookkeeping it described now lives at `finance/fi/`.

Inside `finance/`, the GL slice has THREE controllers and TWO services that overlap:

| HTTP prefix | Controller | Service | Repository | What it does |
|---|---|---|---|---|
| `/accounting` | `FinanceAccountingController` | `FinanceAccountingService` | `DrizzleFinanceAccountingRepo` | List/create/close periods; create GL documents with raw-SQL inserts; trial-balance dashboard counts |
| `/fi` | `FiController` | `FiService` | `DrizzleFiRepository` | Same domain — list/create/close accounting periods; list/create GL documents (Drizzle ORM, no raw SQL); cost centers; profit centers |
| `/finance/gl` | `FinanceGlController` | `GlService` + `GlPostingService` | `DrizzleFinanceGlRepository` + `DrizzleGlPostingRepository` | GL document listing; trial-balance aggregation; ledger drilldown; sales-invoice and payroll posting |
| `/gl` | `GlStandaloneController` | `GlService` | `DrizzleFinanceGlRepository` | Get accounts; seed accounts; create account |
| `/reports` | `ReportsController` | `FinanceReportsService` | `DrizzleFinanceReportsRepository` | Trial balance v2; profit/loss; weekly/monthly summary; KPI dashboard |
| `/financial-reports` | `FinancialReportsController` | `FinancialReportsQueryService` | `FinancialReportsRepository` | Kassa / Ombor / Debitorlar / Kreditorlar / Balance sheet snapshots |

So a journal entry can be created via at least three different paths:

1. `POST /fi/gl-documents` → `FiService.createGlDoc` → `db.insert(glDocuments)` — no lines
2. `POST /accounting/gl-documents` → `FinanceAccountingService.createGlDocument` → raw SQL `INSERT INTO gl_documents` + loop over `lines[]` calling `execGlLineInsert` → real `gl_lines` rows
3. `POST /finance/gl/post-sales-invoice` (or `/post-payroll`) → `GlPostingService.postSalesInvoice` → builds JournalLine[] in code → `createJournalEntry` → per-line INSERT into `entries`

Path 1 produces a `gl_documents` header with no lines. Path 2 produces header + `gl_lines`. Path 3 produces multiple `entries` rows with no `gl_documents` row at all. The three writes never reconcile to one another, and the trial-balance reader (path 3 reads `entries`) never sees path-1 or path-2 data.

---

## 2. createJournalEntry (verify P0-01)

**Round 1 said** (paraphrased): `GlPostingService.createJournalEntry()` at `gl-posting.service.ts:81-91` validates debit/credit then returns `Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE)` with no INSERT.

**Verification.** Current `apps/api/src/modules/finance/domain/services/gl-posting.service.ts:85-120` reads:

```typescript
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

  this.logger.debug(`Journal entry created - Reference: ${reference}, Debit/Credit: ${totalDebit}`);
  return Ok(firstId ?? 0);
}
```

**Verdict: P0-01 is REFUTED.** The method now writes a real row per non-zero line via `glPostingRepo.insertEntry()`, returns the first inserted id, and surfaces DB failures as `Err(AppErr('DB_ERROR', ...))`. There is no `Math.random()` return value anywhere; the only `Math.random` call left is in the entry-number suffix to keep `entry_number` unique under the `UNIQUE` constraint at `fi-gl.ts:53`.

The repository it calls (`apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts:18-55`):

```typescript
async insertEntry(data: {
  entryNumber: string;
  entryDate: string;
  documentType: string;
  documentId?: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string;
  createdBy?: number;
}): Promise<Result<number>> {
  try {
    const insertValues: typeof entries.$inferInsert = {
      entryNumber: data.entryNumber,
      entryDate: data.entryDate,
      documentType: data.documentType,
      documentId: data.documentId ?? null,
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
      amount: data.amount,
      description: data.description ?? null,
      createdBy: data.createdBy ?? null,
    };

    const result = await db
      .insert(entries)
      .values(insertValues)
      .returning({ id: entries.id });

    const inserted = result[0];
    if (!inserted) {
      return Err(AppErr('DB_ERROR', 'GL entry insert returned no rows'));
    }
    return Ok(inserted.id);
  } catch (e: unknown) {
    return Err(AppErr('DB_ERROR', `GL_INSERT_FAILED: ${String(e)}`));
  }
}
```

The repo is registered in `finance.module.ts:164` and provided behind the `GL_POSTING_REPO` injection token. The interface lives at `apps/api/src/modules/finance/domain/repositories/i-gl-posting.repo.ts:9-23`.

### Remaining concerns even after the fix

Although the lines do persist, the design has six problems that round 1 did not call out:

1. **One journal entry per line, not per document.** Each `JournalLine` produces a SEPARATE row in `entries` with its own `entry_number` (`${reference}-${Date.now()}-${rnd}`). There is no header row tying the lines together. The `entries` schema has no `group_id` / `batch_id` / `gl_document_id` column. To reconstruct an entry you must filter by the shared `reference` portion of the entry number — which is fragile (string parsing) and not indexed.
2. **`'OFFSET'` is not a real account.** When a JournalLine has only a debit, the credit side gets `creditAccountId: 'OFFSET'` (string literal). The `entries.creditAccountId` column has FK `references(() => accounts.id, { onDelete: "set null" })` (`fi-gl.ts:58`). If `'OFFSET'` doesn't exist in `accounts`, the INSERT will fail with a FK violation — but `accounts.id` is `serial` (integer), and `'OFFSET'` is text. Drizzle will coerce; PostgreSQL will reject with `invalid input syntax for type integer: "OFFSET"`. Every `postSalesInvoice` / `postPayroll` / etc. call that contains a single-sided line will throw at the DB layer.
3. **Account-code mismatch.** `JournalLine.accountCode` is `'1000'`, `'1200'`, etc. — string codes from the `GL` constant. The `entries.debitAccountId` column references `accounts.id` (integer PK), not `accounts.account_code`. So `debitAccountId: '1000'` is again written as text into a varchar that's expected to coerce to integer FK. Whether it works depends entirely on whether `accounts.id` ever happens to be `1000` — for the first ten seeded accounts the serial id sequence starts at 1, so the codes will NOT match the ids.
4. **No transaction.** The for-loop calls `insertEntry` one row at a time with no `db.transaction(...)`. If line 2 fails, line 1 is already committed and the ledger is out of balance.
5. **`entry_number` collisions.** `${Date.now()}-${Math.floor(Math.random() * 1000)}` has only 1000 random slots per millisecond. Concurrent posting from POS + sales + payroll cron can collide; the unique constraint will reject one of them.
6. **Single-line entries silently dropped.** `if (amount <= 0) continue;` — a JournalLine where both debit and credit are 0 is skipped. Combined with concern (1), an entry whose intended structure is `D 100 / C 100` becomes two unrelated rows.

The fix to P0-01 is real but the resulting design has new P0 / P1 defects that weren't there in the random-fake-id version.

---

## 3. Chart of accounts & duplicate codes (verify P0-11)

**Round 1 said** there are duplicate GL account codes (`5000` = CAPITAL + COGS, `2200` = SALES_TAX_PAYABLE + EMPLOYEE_DEDUCTIONS, plus `7000` = MATERIAL_EXPENSE + EMPLOYER_CONTRIBUTION) in the chart-of-accounts seed.

**Two artefacts must be distinguished:**

### 3a. The runtime `GL` constant (`gl-accounts.constants.ts:11-30`)

```typescript
/**
 * @deprecated Duplicate account codes exist in this constant (5000=CAPITAL+COGS;
 * 2200=SALES_TAX+DEDUCTIONS; 7000=MATERIAL+EMPLOYER). Use GL_ACCOUNTS_V2 for new code.
 */
export const GL = {
  CASH:                     '1000', // Kassa
  ACCOUNTS_RECEIVABLE:      '1100', // Debitorlik qarzlar
  ACCOUNTS_RECEIVABLE_TRADE:'1200', // Savdo debitorlari
  INVENTORY:                '1040', // Tovar-moddiy qiymatliklar
  FIXED_ASSETS:             '3000', // Asosiy vositalar
  ACCOUNTS_PAYABLE:         '4000', // Kreditorlik qarzlar
  INVENTORY_ADJ:            '2000', // Tovar va materiallar korreksiyasi
  SHORT_TERM_LOANS:         '4100', // Qisqa muddatli kreditlar
  CAPITAL:                  '5000', // Ustav kapitali
  COGS:                     '5000', // Ishlab chiqarish tanarchisi
  SALARY_EXPENSE:           '5100', // Mehnat haqi xarajatlari
  REVENUE:                  '6000', // Savdo tushumlari
  MATERIAL_EXPENSE:         '7000', // Moddiy xarajatlar
  LABOR_EXPENSE:            '7100', // Mehnat haqi xarajatlari
  EMPLOYER_CONTRIBUTION:    '7000', // Ish beruvchi badali
  SALES_TAX_PAYABLE:        '2200', // QQS to'lanishi lozim
  EMPLOYEE_DEDUCTIONS:      '2200', // Xodim ushlanmalari
  SALARY_PAYABLE:           '2500', // Mehnat haqi to'lanishi lozim
} as const;
```

Duplicates inside `GL` (confirmed):

| Code | Field A | Field B |
|---|---|---|
| `5000` | `CAPITAL` (Ustav kapitali — equity) | `COGS` (Ishlab chiqarish tanarchisi — expense) |
| `2200` | `SALES_TAX_PAYABLE` (QQS — liability) | `EMPLOYEE_DEDUCTIONS` (xodim ushlanmalari — liability) |
| `7000` | `MATERIAL_EXPENSE` (Moddiy xarajatlar — expense) | `EMPLOYER_CONTRIBUTION` (ish beruvchi badali — expense) |

Round 1's claim about duplicates in the runtime constant is **CONFIRMED**.

### 3b. The `defaultChartOfAccounts()` seed (`gl.service.ts:135-148`)

```typescript
private defaultChartOfAccounts(): Record<string, unknown>[] {
  return [
    { accountCode: GL.CASH,                accountName: 'Asosiy kassa',              accountType: 'asset'     },
    { accountCode: GL.ACCOUNTS_RECEIVABLE, accountName: 'Debitorlik qarzlar',        accountType: 'asset'     },
    { accountCode: GL.INVENTORY_ADJ,       accountName: 'Tovar va materiallar',      accountType: 'asset'     },
    { accountCode: GL.FIXED_ASSETS,        accountName: 'Asosiy vositalar',          accountType: 'asset'     },
    { accountCode: GL.ACCOUNTS_PAYABLE,    accountName: 'Kreditorlik qarzlar',       accountType: 'liability' },
    { accountCode: GL.SHORT_TERM_LOANS,    accountName: 'Qisqa muddatli kreditlar',  accountType: 'liability' },
    { accountCode: GL.CAPITAL,             accountName: 'Ustav kapitali',            accountType: 'equity'    },
    { accountCode: GL.REVENUE,             accountName: 'Savdo tushumlari',          accountType: 'revenue'   },
    { accountCode: GL.MATERIAL_EXPENSE,    accountName: 'Moddiy xarajatlar',         accountType: 'expense'   },
    { accountCode: GL.LABOR_EXPENSE,       accountName: 'Mehnat haqi xarajatlari',   accountType: 'expense'   },
  ];
}
```

Codes that the seed actually attempts to insert:

| Code | Name | Type |
|---|---|---|
| 1000 | Asosiy kassa | asset |
| 1100 | Debitorlik qarzlar | asset |
| 2000 | Tovar va materiallar | asset |
| 3000 | Asosiy vositalar | asset |
| 4000 | Kreditorlik qarzlar | liability |
| 4100 | Qisqa muddatli kreditlar | liability |
| 5000 | Ustav kapitali | equity |
| 6000 | Savdo tushumlari | revenue |
| 7000 | Moddiy xarajatlar | expense |
| 7100 | Mehnat haqi xarajatlari | expense |

**Within the seed array itself there are NO duplicate codes** — round 1's specific claim that "5000 (CAPITAL+COGS) and 2200 (SALES_TAX+DEDUCTIONS)" appear in the COA seed is **inaccurate**. The seed only picks ONE of each colliding pair (CAPITAL not COGS; neither SALES_TAX nor DEDUCTIONS appears in the seed at all).

### 3c. Why P0-11 is still a real defect

The seed is fine, but the runtime constant is used for `accountCode` on every posted line in `gl-posting.service.ts`:

- `postSalesInvoice` writes a line with `accountCode: GL.SALES_TAX_PAYABLE = '2200'`. There is no account with code `2200` in the seed.
- `postPayroll` writes lines with `GL.EMPLOYER_CONTRIBUTION = '7000'` AND `GL.EMPLOYEE_DEDUCTIONS = '2200'`. The first collides with MATERIAL_EXPENSE; the second points to nothing.
- `postMaterialConsumption` writes a line with `GL.COGS = '5000'`. The seed has `5000` registered as `CAPITAL` (equity, not expense). Every `postMaterialConsumption` debits "Ustav kapitali" instead of "Ishlab chiqarish tanarchisi" — that's a balance-sheet vs P&L misclassification.

So the defect is real, just not where round 1 located it. It manifests in:
- `gl-posting.service.ts:31` — Sales-tax credit hits account `2200` (not seeded → FK orphan or wrong account).
- `gl-posting.service.ts:66` — Material consumption debits account `5000` which the seed registered as CAPITAL.
- `gl-posting.service.ts:76, 78` — Employer contribution debits `7000` (MATERIAL_EXPENSE) and employee deductions credit `2200` (unseeded).

### 3d. The "fixed" constant that nothing uses

The same file (`gl-accounts.constants.ts:33-52`) declares:

```typescript
/** Uzbekistan BHM-compliant unique account codes (v2 — no duplicate codes) */
export const GL_ACCOUNTS_V2 = {
  // Assets
  CASH:                '1010',
  BANK:                '1020',
  ACCOUNTS_RECEIVABLE: '1210',
  INVENTORY:           '1410',
  // Liabilities
  ACCOUNTS_PAYABLE:    '3110',
  SALES_TAX_PAYABLE:   '6410',  // was 2200 (duplicate with DEDUCTIONS)
  EMPLOYEE_DEDUCTIONS: '6520',  // was 2200 (duplicate with SALES_TAX)
  EMPLOYER_CONTRIB:    '6530',  // was 7000 (duplicate with MATERIAL_EXPENSE)
  // Equity
  CAPITAL:             '8400',  // was 5000 (duplicate with COGS)
  // Revenue
  REVENUE:             '9010',
  // Expenses
  COGS:                '9110',  // was 5000 (duplicate with CAPITAL)
  MATERIAL_EXPENSE:    '9400',  // was 7000 (duplicate with EMPLOYER_CONTRIB)
  PAYROLL_EXPENSE:     '9500',
} as const;
```

`grep -r 'GL_ACCOUNTS_V2'` over the whole repo returns three hits — the export site, the deprecation comment, and round 1's own report file. **Nothing actually imports `GL_ACCOUNTS_V2`.** The fix is half-done; the V2 constant is dead code until someone wires it into `gl-posting.service.ts` and `gl.service.ts`.

---

## 4. Trial balance query

**Round 1 said** the trial-balance query at `drizzle-finance-gl.repo.ts:60-71` runs against real data.

**Verification.** Code at `apps/api/src/modules/finance/gl/drizzle-finance-gl.repo.ts:60-72`:

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

**Verdict: CONFIRMED.** It really does query `entries`, sums debits and credits separately, and returns whether they're balanced. The query is structurally sensible.

**Caveats round 1 missed:**

- The query says "balanced when `|debit - credit| < 0.01`" but the way `gl-posting.service.ts:106-107` writes rows makes EVERY row contribute to BOTH sides — it sets `debitAccountId` AND `creditAccountId` on the same `entries` row (one to the real account, one to literal `'OFFSET'`). So `entries.debitAccountId IS NOT NULL` is true for every row AND `entries.creditAccountId IS NOT NULL` is also true for every row. The two SUMs over `amount` therefore always yield the same number. The query *always* reports `balanced: true` regardless of actual data integrity.
- A debit row of 100 contributes 100 to `totalDebit` AND 100 to `totalCredit` (because both columns are non-null). Total debit = total credit = sum of all amounts. This is exactly the kind of false reassurance the round-1 report warned about: the trial-balance endpoint will never report imbalance.

### Second trial-balance query (round 1 did not mention)

`apps/api/src/modules/finance/reports/drizzle-reports.repo.ts:18-35` defines a SECOND trial-balance method, exposed under `/reports/trial-balance`:

```typescript
async findTrialBalance(fiscalYear?: number): Promise<Result<object[]>> {
  try {
    const year = fiscalYear ?? _time.now().getFullYear();
    const rows = await db.select({
      code: accounts.accountCode,
      name: accounts.accountName,
      type: accounts.accountType,
      debit:  sql<number>`COALESCE(SUM(CASE WHEN ${entries.debitAccountId}  = ${accounts.id}::varchar THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
      credit: sql<number>`COALESCE(SUM(CASE WHEN ${entries.creditAccountId} = ${accounts.id}::varchar THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
    })
      .from(accounts)
      .leftJoin(entries, sql`EXTRACT(YEAR FROM ${entries.createdAt}) = ${year}`)
      .where(eq(accounts.isActive, true))
      .groupBy(accounts.id, accounts.accountCode, accounts.accountName, accounts.accountType)
      .orderBy(accounts.accountCode);
    return Ok(rows);
  } catch (e: unknown) { return Err((e as Error).message || 'Sinov balansi topilmadi'); }
}
```

Two problems:

1. The `leftJoin` predicate is `EXTRACT(YEAR FROM entries.created_at) = year` with **no equality between `accounts.id` and `entries.*_account_id`**. PostgreSQL will Cartesian-join every active account against every entry from the year, then the `CASE WHEN debitAccountId = accounts.id` filter inside SUM does the matching. Functionally OK but the JOIN explodes intermediate rows by `|accounts| × |year entries|`.
2. Same `OFFSET` issue as section 4.1 — entries written by `GlPostingService` have `'OFFSET'` in one of the two `account_id` columns, which won't match any real account id, so half the amount disappears from the per-account totals. The trial balance shown to the user will have the wrong magnitude on every account that's been hit by a `GlPostingService.post*` call.

---

## 5. Journal entry lines insertion

**Round 1 referenced `gl_journal_lines`** (an older table from `schema-business-b-1.ts`).

**Verification.** `grep -E 'INSERT INTO gl_journal_lines|insert\(glJournalLines'` over the whole tree:

```
(no matches)
```

**Nothing writes to `gl_journal_lines` anywhere.** It is read-only in current code:

- `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-planning.repo.ts:162` — `FROM gl_journal_lines jl JOIN gl_accounts a ON a.id = jl.account_id JOIN gl_journal_entries e ON e.id = jl.entry_id` (financial-ratios query)
- `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo.ts:240` — `LEFT JOIN gl_journal_lines gjl ON gjl.entry_id = gje.id` (invoice GL drilldown)

Both queries depend on data that nothing in the codebase ever produces. Either there's an external ETL job or seed dataset feeding these tables, or every query returns empty rows. There are also no migrations creating `gl_journal_lines` (the schema is defined in `schema-business-b-1.ts` but `find apps/api/src/database/seeds/` has no seeds touching it).

The canonical alternative — `gl_lines` (note: no "journal") — IS written, but only via the `/accounting/gl-documents` POST path:

`apps/api/src/common/database/queries-remaining-b.ts:210-221`:

```typescript
export async function execGlLineInsert(docId: number, lineNumber: number, line: Record<string, unknown>): Promise<void> {
  await db.insert(gl_lines).values({
    glDocumentId: String(docId),
    lineNumber: lineNumber,
    accountId: String(line.accountId || line.account_id || ''),
    costCenterId: (line.costCenterId || line.cost_center_id || null) as string | null,
    profitCenterId: (line.profitCenterId || line.profit_center_id || null) as string | null,
    debitAmount: Number(line.debitAmount || line.debit_amount) || 0,
    creditAmount: Number(line.creditAmount || line.credit_amount) || 0,
    description: (line.description || null) as string | null,
  });
}
```

Called from `DrizzleFinanceAccountingRepo.insertGlLine` (`drizzle-finance-accounting.repo.ts:93`) inside the `FinanceAccountingService.createGlDocument` loop (`finance-accounting.service.ts:41-43`).

**Summary of GL line tables and their lifecycle:**

| Table | Writes | Reads |
|---|---|---|
| `entries` | `DrizzleGlPostingRepository.insertEntry` (called only by `GlPostingService.createJournalEntry`) | trial balance, ledger, P&L, balance sheet |
| `gl_lines` | `execGlLineInsert` (called only by `FinanceAccountingService.createGlDocument` via `/accounting/gl-documents`) | dashboard `(SELECT COUNT(*) FROM gl_lines)` aggregate at `drizzle-finance-accounting.repo.ts:35` and nothing else |
| `gl_journal_lines` | **nothing** | financial-ratios query, invoice drilldown |
| `gl_journal_entries` (header for `gl_journal_lines`) | `FinanceInvoiceRepo.saveGlEntry` per round 1 (not re-verified) | financial-ratios, invoice drilldown |

So three separate "journal entry line" tables coexist; the writers and readers don't match.

---

## 6. Period close logic

`POST /accounting/periods/:id/close` resolves to:

- Controller: `apps/api/src/modules/finance/presentation/finance-accounting.controller.ts:109-118`

```typescript
@Post('periods/:id/close')
@UsePipes(new ZodValidationPipe(FinanceClosePeriodSchema))
async closePeriod(@Param('id') id: string, @Body() body: FinanceClosePeriodDto) {
  const periodId = safeInt(id, 0);
  const period = await this.svc.getPeriod(periodId);
  assertFound(period, 'Davr topilmadi');
  assertValidated((period as Record<string, unknown>).status !== 'closed', 'Davr allaqachon yopilgan');
  const closedBy = body.closedBy ? Number(body.closedBy) : null;
  return unwrapOrInternal(await this.svc.closePeriod(periodId, closedBy));
}
```

- Service: `finance-accounting.service.ts:55-57`

```typescript
async closePeriod(id: number, closedBy: number | null) {
  return this.accountingRepo.closePeriod(id, closedBy);
}
```

- Repo: `drizzle-finance-accounting.repo.ts:107-112`

```typescript
async closePeriod(id: number, closedBy: number | null): Promise<Row> {
  const rows = await runQuery<Row>(sql`
    UPDATE accounting_periods SET status = 'closed', closed_by = ${closedBy}, closed_at = NOW() WHERE id = ${id} RETURNING *
  `);
  return (rows.rows[0] ?? {}) as Row;
}
```

`POST /fi/accounting-periods/:id/close` resolves to the parallel path:

- Controller: `fi.controller.ts:76-79`
- Service: `fi.service.ts:33-40`
- Repo: `drizzle-fi.repo.ts:36-44`

```typescript
async closeAccountingPeriod(id: number): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await db.update(accountingPeriods)
      .set({ status: 'closed', closedAt: _time.now() })
      .where(eq(accountingPeriods.id, id))
      .returning();
    return Ok(result[0] ?? null);
  } catch (e: unknown) { return Err((e as Error).message || 'Yopishda xatolik'); }
}
```

### What real period-close does in a proper GL

A real period close runs four steps:
1. **Lock the period** so no new entries can be posted with `entry_date` in that period.
2. **Compute year-end closing entries** — debit each revenue account to zero, credit each expense account to zero, transfer the net to retained earnings (or equity).
3. **Snapshot** balance-sheet account balances as opening balances for the next period.
4. **Mark the period closed** and audit the close.

### What this codebase does

Only step 4. The repo flips `status='closed'` and writes a `closed_at` timestamp. Nothing else:

- No closing-entry generation. `grep -i 'retained.earning|closing.entries|net.income.transfer|year.end.close'` returns zero hits in `apps/api/src/modules/finance/`.
- No write-lock on entries with `entry_date` in the closed period. `GlPostingService.createJournalEntry` does not check `accounting_periods.status` before inserting; you can still post into closed periods.
- No opening-balance snapshot. The trial-balance and balance-sheet queries always start from `entries` history with no carryover row.

So "period close" is a UI status toggle. It satisfies neither the locking nor the income-summary part of GAAP/IFRS period close.

---

## 7. Multi-currency / inter-company

### Multi-currency

- `gl_documents.currency` exists in the schema (`fi-gl.ts:147`) with `default 'UZS'`.
- `DrizzleFinanceAccountingRepo.insertGlDocument` (line 84-87) reads `currency = 'UZS'` from the body and writes it through:

```typescript
const { document_type, document_date, posting_date, description, currency = 'UZS', ... } = body;
const rows = await runQuery<Row>(sql`
  INSERT INTO gl_documents (..., currency, ...) VALUES (..., ${currency}, ..., 'draft')
  RETURNING *
`);
```

- The `entries` table has NO `currency` column at all (`fi-gl.ts:51-72`). All `amount` values are stored without a currency tag.
- The `gl_lines` table has NO `currency` column (`fi-gl.ts:193-204`).
- `GlPostingService.createJournalEntry` passes no currency to `insertEntry` — every posted line is implicitly UZS.
- `grep -i 'exchange.rate|exchangeRate|fx_rate|fxRate|currencyRate'` over `apps/api/src/modules/finance/` returns **zero** results. No exchange-rate table, no rate lookup, no FX-revaluation cron.

**Verdict:** multi-currency is **labelled in the header table only**. There is no actual currency math. A USD invoice posted via `GlPostingService` would write `amount: 100` into `entries.amount` and be summed into the trial balance as 100 UZS. There is no inter-currency reconciliation, no FX gain/loss account in the chart, and no rate provider.

### Inter-company

- `grep -i 'company_id|companyId|inter.company|intercompany'` across `apps/api/src/modules/finance/` returns one match: `application/general-tax.service.ts:28` ("Companies on simplified taxation [...] live in the same table — `companyId` selects") — but that's about per-company tax rates, not about inter-company GL postings.
- `entries` has no `company_id`. `gl_documents` has no `company_id`. `accounts` has no `company_id`.
- There are no inter-company elimination entries, no inter-company AR/AP mirror tables, no inter-company netting cron.

**Verdict:** there is **no inter-company support at all** — the system is single-entity. A single-entity Uzbekistan SME printshop may not need this, but any "ERP" claim that implies multi-company or holding-company use is unfounded by this code.

---

## 8. Reporting endpoints

### 8.1 `/finance/gl/trial-balance` — section 4. Real data, but the `'OFFSET'` design defect makes it always-balanced.

### 8.2 `/reports/trial-balance` — section 4.2. Real data, but the LEFT JOIN predicate makes it a Cartesian explosion per account.

### 8.3 `/reports/profit-loss` — `reports.controller.ts:38-40` → `FinanceReportsService.findProfitLoss` → `drizzle-reports.repo.ts:37-55`:

```typescript
async findProfitLoss(from?: string, to?: string): Promise<Result<Record<string, unknown>>> {
  try {
    const fromDate = from ?? `${_time.now().getFullYear()}-01-01`;
    const toDate = to ?? _time.now().toISOString().slice(0, 10);
    const [revenue, expense] = await Promise.all([
      db.select({ total: sum(entries.amount) })
        .from(entries)
        .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
        .where(sql`${accounts.accountType} = 'revenue' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`),
      db.select({ total: sum(entries.amount) })
        .from(entries)
        .leftJoin(accounts, eq(entries.debitAccountId, accounts.id))
        .where(sql`${accounts.accountType} = 'expense' AND ${entries.entryDate} >= ${fromDate} AND ${entries.entryDate} <= ${toDate}`),
    ]);
    const totalRevenue = Number(revenue[0]?.total || 0);
    const totalExpense = Number(expense[0]?.total || 0);
    return Ok({ from: fromDate, to: toDate, totalRevenue, totalExpense, netProfit: totalRevenue - totalExpense });
  } catch (e: unknown) { return Err((e as Error).message || 'Foyda-zarar topilmadi'); }
}
```

P&L queries are wrong in three ways:
- Revenue is normally CREDITED, not debited. This query joins `entries.debitAccountId = accounts.id` and filters `accountType = 'revenue'`. Revenue accounts that are debited (reversals, returns) are summed as "revenue"; the actual credit-side revenue postings are missed entirely.
- Both subqueries use the same JOIN — `entries.debitAccountId = accounts.id`. So expense is computed correctly (expense is normally debited) but revenue is wrong.
- Because `GlPostingService` writes the REVENUE account id into `creditAccountId` (sales invoice: `{ accountCode: GL.REVENUE, debit: 0, credit: amount }` → `creditAccountId: '6000'`), and this query reads `debitAccountId`, **no GL-service-posted revenue will EVER appear in the P&L**. Total revenue will be 0 in practice.

### 8.4 `/financial-reports/balans` — `financial-reports-query.helpers.ts:124-160` (quoted in section 1 — the diff). Same defect class: it joins on `entries.debitAccountId = accounts.id`, so credit-only postings are invisible. Equity is taken from this same flawed aggregate, then `retainedEarnings` is computed as `byType.revenue - byType.expense` from the SAME flawed sums.

The balance sheet has zero chance of balancing because it never reads the credit side of the ledger.

### 8.5 `/financial-reports/kassa, ombor, debitorlar, kreditorlar` — separate per-source queries against `cashTransactions`, `warehouseTransactions`, `customerPayments`, `invoicePayments`. Real data, no GL ledger involvement.

### 8.6 `/reports/production-efficiency` — `reports.controller.ts:75-78` explicitly returns 501 (`notImplemented`).

### 8.7 `/reports/profitability/export` — `reports.controller.ts:88-108` returns a fake `jobId` of `prof-export-${Date.now()}` and a "queued" status, but there is no job queue and no worker. The export will never produce a file. This is the kind of round-1 P0 that round 1 missed.

### 8.8 `/finance/gl` (`listGlEntries`) — uses `QueryBus.execute(new GetGlEntriesQuery(...))`. Handler is in `application/queries/get-gl-entries.handler.ts` — round 1 flagged it as unresolved; not re-verified here.

---

## 9. Findings summary

### P0 (data integrity / data loss)

| # | Issue | Evidence | Why P0 |
|---|---|---|---|
| **P0-08-A** | `GlPostingService.createJournalEntry` writes `'OFFSET'` (a string literal) into `entries.debitAccountId` / `creditAccountId` columns, which the schema declares as varchar FKs to `accounts.id` (a serial integer). PostgreSQL will reject this with `invalid input syntax for type integer: "OFFSET"`. | `gl-posting.service.ts:106-107`; `fi-gl.ts:57-58` | Every `postSalesInvoice`, `postCustomerPayment`, `postPayroll`, `postGoodsReceipt`, `postVendorPayment`, `postMaterialConsumption` call will throw at the DB layer and return `Err(AppErr('DB_ERROR'))`. No GL postings actually persist in practice. The "fix" to round 1's P0-01 is non-functional. |
| **P0-08-B** | `GlPostingService` writes `accountCode` strings (`'1000'`, `'1200'`, `'5000'`) into FK columns that reference `accounts.id` (serial PK starting at 1). The seed inserts ten accounts so ids are 1..10; codes are 1000..7100. There is no overlap; every line is a dangling FK reference. | `gl-posting.service.ts:106`; `fi-gl.ts:57`; seed at `gl.service.ts:135-148` | Same as above — INSERT fails or the constraint is `ON DELETE SET NULL`, leaving NULL on both sides. Either way the data is unusable. |
| **P0-08-C** | The runtime `GL` constant has three duplicate-code pairs: `5000` (CAPITAL+COGS), `2200` (SALES_TAX+DEDUCTIONS), `7000` (MATERIAL+EMPLOYER). `gl-posting.service.ts` still imports `GL`, not `GL_ACCOUNTS_V2`. So `postMaterialConsumption` debits the equity account, `postPayroll` writes employer contributions and material expenses to the same code, etc. | `gl-accounts.constants.ts:11-30`; `gl-posting.service.ts:6, 31, 49, 66, 75-78` | Even if (a) and (b) were fixed, the resulting ledger entries would post to wrong accounts. `GL_ACCOUNTS_V2` exists at `gl-accounts.constants.ts:33-52` but no file imports it. Half-finished migration. |
| **P0-08-D** | `getTrialBalance` (`drizzle-finance-gl.repo.ts:60-71`) sums `amount` whenever `debitAccountId IS NOT NULL` AND separately when `creditAccountId IS NOT NULL`. Because `GlPostingService` always sets BOTH columns (the offset side gets `'OFFSET'`), both conditions are true for every row. `totalDebit` and `totalCredit` are mathematically identical. | `drizzle-finance-gl.repo.ts:60-71`; `gl-posting.service.ts:106-107` | Trial balance always reports `balanced: true` regardless of actual data integrity. The endpoint actively misinforms the user. |
| **P0-08-E** | `findProfitLoss` (`reports.repo.ts:37-55`) joins `entries.debitAccountId = accounts.id` and filters `accountType = 'revenue'` to compute revenue. Revenue is credited, not debited. `GlPostingService` writes the revenue id into `creditAccountId`. So total revenue computed by `/reports/profit-loss` is always 0 (or only counts reversal entries). | `reports.repo.ts:37-55`; `gl-posting.service.ts:30` | P&L net profit is wrong by the entire revenue line. |
| **P0-08-F** | `queryBalanceSheet` (`financial-reports-query.helpers.ts:124-160`) has the same one-side-only flaw. It joins `entries.debitAccountId = accounts.id` for all five account types. Equity and liability totals are computed from debit side only. Balance sheet cannot balance. | `financial-reports-query.helpers.ts:124-160` | Balance sheet is structurally wrong for any account where the normal-balance side is credit (liabilities, equity, revenue). |
| **P0-08-G** | `/reports/profitability/export` returns a fake `jobId` string formed as `prof-export-${Date.now()}` and never queues a real job. No worker exists. The user receives a 202 Accepted, a "Tayyor bo'lganda bildirishnoma yuboriladi" promise, and no file is ever produced. | `reports.controller.ts:88-108` | Silent feature-pretending. |

### P1 (correctness / completeness)

| # | Issue | Evidence | Why P1 |
|---|---|---|---|
| **P1-08-H** | One `entries` row per journal line — no header row, no `gl_document_id` FK on `entries`. To reconstruct a journal entry the only handle is the prefix of `entry_number` (`${reference}-${ts}-${rnd}`). No index on the prefix. | `gl-posting.service.ts:101-110`; `fi-gl.ts:51-72` | Cannot reverse / drill-down / audit a multi-line entry as a unit. Concurrent posting + 1000-slot random suffix can collide and lose entries. |
| **P1-08-I** | Per-line INSERTs run in no transaction. If line 2 fails after line 1 commits, the ledger is unbalanced and the calling code returns `Err` but does not roll back line 1. | `gl-posting.service.ts:97-115` | Partial postings violate double-entry. |
| **P1-08-J** | "Period close" is a status flip with no closing entries, no period lock, no income-summary transfer. `GlPostingService` can still write `entries` rows dated inside a closed period. | `drizzle-finance-accounting.repo.ts:107-112`; `drizzle-fi.repo.ts:36-44`; absence of any `entry_date` vs period check in posting service | Periods are not actually closed in any accounting sense. |
| **P1-08-K** | Two parallel close endpoints exist (`/accounting/periods/:id/close` and `/fi/accounting-periods/:id/close`), backed by two different repos. They both write `status='closed'` but go through different code paths — different audit interceptors, different DTO validation, no shared concurrency control. | `finance-accounting.controller.ts:109`; `fi.controller.ts:76` | Operator can close the same period twice through different routes; second call wins. Inconsistent audit trail. |
| **P1-08-L** | Three separate "GL journal line" tables coexist with mismatched writers and readers. `entries` (write: `GlPostingService`; read: trial balance, ledger, P&L, balance sheet). `gl_lines` (write: `/accounting/gl-documents`; read: only one dashboard count). `gl_journal_lines` (write: **nothing**; read: financial-ratios, invoice drilldown). | `gl-posting.service.ts:102`; `queries-remaining-b.ts:210`; `drizzle-finance-planning.repo.ts:162`; `drizzle-finance-invoice.repo.ts:240` | The bookkeeping is split across three tables that don't reconcile. Financial-ratios query at `drizzle-finance-planning.repo.ts:162` always returns empty rows because nothing writes its source table. |
| **P1-08-M** | No multi-currency support. `gl_documents.currency` field exists but is metadata only; `entries.amount` carries no currency, no FX rate, no conversion. | `fi-gl.ts:51-72, 147`; `gl-posting.service.ts:102-110`; absence of any FX table | Any non-UZS posting silently becomes UZS. No re-measurement. |
| **P1-08-N** | `GlPostingService.createJournalEntry` skips lines with `amount <= 0` (`gl-posting.service.ts:99`). For a planned entry of `D 100 / C 100`, both lines are kept; but for a planned entry of `D 100 / C 0` plus offset, the offset side is dropped and only the debit side persists. Combined with the `'OFFSET'` literal, this means single-sided lines drop their counterpart instead of producing a proper contra. | `gl-posting.service.ts:97-110` | Half-entries in the database; trial balance won't catch them because of P0-08-D. |

### P2 (architectural)

| # | Issue | Evidence | Why P2 |
|---|---|---|---|
| **P2-08-O** | `finance/README.md` is stale. It describes `fi/` as a separate module that `finance/` sits on top of, but `apps/api/src/modules/fi/` is now just a one-symbol re-export shim. The "bookkeeping" the README points at lives at `finance/fi/`. | `finance/README.md:1-7`; `fi/tax/general-tax.service.ts:1-5` | Misleading documentation, but not data-affecting. |
| **P2-08-P** | Three controllers (`/accounting`, `/fi`, `/finance/gl`) handle overlapping GL document operations through different services and repos. Frontend has to pick which path to call; round 1 already noted `GLDocumentsTab.tsx:53` calling `/api/fi/gl-documents` even though `FiController` `getGlDocuments` exists at `fi.controller.ts:167`. The path is actually mounted; round 1's 404 claim should be re-checked in frontend report. | `finance-accounting.controller.ts:75`; `fi.controller.ts:167`; `finance-gl.controller.ts:45-53` | Architectural duplication. Frontend confusion. |
| **P2-08-Q** | `entries` schema in `fi-gl.ts:51-72` carries "ADD-ONLY drift columns" — `debit_account text`, `credit_account text`, `reference_id`, `reference_type`, `posted_by`, `posted_at` — alongside the original `debit_account_id`, `credit_account_id`, etc. There's no migration story about which side new code should use. The trial-balance reads the original `*_account_id` columns; the new drift columns are written by nobody seen in scope. | `fi-gl.ts:62-69` | Schema-drift accumulation. Indicates DB has columns added by hand outside Drizzle migrations. |
| **P2-08-R** | `entries.amount` has `check("entries_amount_chk", amount > 0)` constraint (`fi-gl.ts:71`). The `GlPostingService.createJournalEntry` loop computes `amount = line.debit > 0 ? line.debit : line.credit` and skips if `<= 0`. Safe today; but anyone passing a negative debit will fail at the DB layer with `entries_amount_chk` violation rather than at the service layer. | `fi-gl.ts:71`; `gl-posting.service.ts:98-99` | Error surface mismatch. |

### Refuted from round 1

- **P0-01** "createJournalEntry returns Math.random, no INSERT" — REFUTED. Method now INSERTs via Drizzle. (But fix is non-functional due to P0-08-A, P0-08-B above.)
- **P0-11** "Duplicate codes 5000 and 2200 in COA seed" — partially refuted as to the seed itself (no duplicates in the seed array), but the underlying constant still has duplicates and is still in use. Severity remains P0 but the *evidence* round 1 cited was the wrong file/line.
- **P2 "`findAllAccounts` has no HTTP route"** — REFUTED. `GlStandaloneController` at `gl-standalone.controller.ts:38-41` mounts `GET /gl/accounts`.

### Confirmed unchanged from round 1

- Stub vs canonical `entries` schema coexistence — `drizzle-gl-posting.repo.ts:12` explicitly switches alias to import the canonical one, but the stub still exists.
- `gl_journal_entries` / `gl_journal_lines` orphan tables — confirmed; nothing writes to `gl_journal_lines` anywhere in the codebase.

---

## Final word

The fix that landed today (`2026-05-27 13:06`) for round 1's headline P0 — the Math.random fake ID — replaced the symptom with a deeper bug. The new code looks like it persists; the test (`apps/api/test/finance/gl.service.spec.ts`) mocks the repo and never exercises the real DB layer, so the test suite is green. But the FK type mismatch (`'OFFSET'` string into integer FK column; `accountCode` string into integer FK column) means every real call to `GlPostingService.post*` will throw at the database. The `'OFFSET'` literal + dual-column INSERT pattern also defeats the trial-balance check (always returns balanced=true) and breaks the P&L and balance-sheet aggregations.

If a forensic auditor were to verify the GL postings actually exist in PostgreSQL after a sales invoice is posted via `POST /finance/gl/post-sales-invoice`, they would find zero rows in `entries` (FK violation caught at DB, returned as `Err`, no entry created) — which is functionally the same outcome as round 1's reported defect, just reached by a different mechanism. The "GL posting works" claim is unchanged in practical effect; only the failure mode moved from silent loss to caught-and-returned error.

The chart of accounts duplicate-codes defect (round 1's P0-11) is half-fixed by the existence of `GL_ACCOUNTS_V2`, but the V2 constant is dead code — nothing imports it. The `GL` constant with duplicates is what the posting service uses. So even if the FK type mismatch were fixed, sales-tax credits would still hit code `2200` (which is also EMPLOYEE_DEDUCTIONS), material consumption would still debit code `5000` (which is also CAPITAL), and the GL semantics would be corrupted.

The `fi/` module the prompt asked about is functionally gone — only a re-export shim survives. The bookkeeping it used to provide lives now at `finance/fi/`, and the surface area is split across three overlapping controllers (`/accounting`, `/fi`, `/finance/gl`). Period close is a status flip with no closing entries, no period lock, and no income-summary transfer. Multi-currency is a column on the header table only — amounts carry no currency tag, no FX rate, no conversion. Inter-company is absent.

Treat the GL slice as a non-functional surface for any general-ledger purpose. Trial-balance, P&L, and balance-sheet endpoints return responses but the numbers cannot be trusted.
