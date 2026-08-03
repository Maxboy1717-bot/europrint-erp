# EuroPrint ERP — Full Accounting-Standards Conformance Audit (read-only)

**Date:** 2026-07-06
**Scope:** The entire finance/accounting surface end to end — route inventory (Part A), standards conformance per accounting principle (Part B), and coverage gaps vs a complete double-entry ERP (Part C).
**Method:** FE router + BE controller reading (file:line) + **live** queries against `postgres@localhost:5432/europrint` (read-only `_audit/q.cjs`). 3 code-discovery investigators + direct ledger/reconciliation queries by the lead.
**Companion doc:** `docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md` (same day). This audit **re-verifies current state** of that doc's findings and adds the route-inventory, reconciliation, AI-boundary, and coverage-gap dimensions it did not cover. Where a finding is unchanged, it says so rather than re-deriving.

> **The seed/test-data rule applied throughout.** Presence of rows is **not** treated as proof a feature works. Live inspection shows the finance data is almost entirely **golden-thread seed/demo data**: 6 of 8 `finance_invoices` are literally named `INV-DEMO-00X`; 7 of 8 have `customer_id = NULL` and **all** have `vendor_id = NULL` (including the AP "purchase" invoice); the GL is dominated by one **62.8-billion-UZS garbage POS row** whose source movement has `total_amount = 0`. Every "populated" finance table is seed/demo, so a green status backed only by such rows is flagged **Test-data warning = Y**.

---

## Part A — Finance/accounting route inventory

Authoritative route table: `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx` (registered `AppRouter.tsx:105`). Canonical CFO route is `/cfo/dashboard`; `/cfo` and `/cfo-dashboard` are redirect aliases. **REAL = renders tables/forms/dashboards wired to `/api/…` (empty data ≠ stub); STUB = `EPComingSoon`/placeholder.**

| Route | Exists? | Renders real content? | Component file:line | Backend controller |
|---|---|---|---|---|
| `/cfo` | Redirect | — | `AppRouter.tsx:180` → `/cfo/dashboard` | — |
| `/cfo-dashboard` | Redirect | — | `AppRouter.tsx:142` → `/cfo/dashboard` | — |
| `/cfo/dashboard` (canonical) | Yes | REAL | `CFODashboard.tsx:65` | `compatibility/cfo.controller.ts` + `finance-ratios`, `finance-cashflow-forecast` |
| `/ai/finance` | Yes | REAL | `AIFinancePage.tsx:15` | `ai/…/ai-finance.controller.ts` (`ai/finance`) |
| `/finance-dashboard` | Yes | REAL | `FinanceDashboard.tsx:80` | `finance-main.controller.ts` + `reports`,`payroll`,`gl` |
| `/accounting/gl-documents` | Yes | REAL | `GLDocuments.tsx:86` | `finance-accounting.controller.ts` + `fi.controller.ts` |
| `/accounting/chart-of-accounts` | Yes | REAL | `ChartOfAccounts.tsx:36` | `gl-standalone.controller.ts` (`gl`) |
| `/accounting/period-closing` | Yes | REAL | `PeriodClosing.tsx:74` | `finance-accounting.controller.ts` + `fi.controller.ts` |
| `/finance/cashflow` | Yes | REAL | `CashFlowManagement.tsx:60` | `cashflow.controller.ts` + `cfo` |
| `/finance/budgets` | Yes | REAL | `BudgetManagement.tsx:89` | `budgets-standalone.controller.ts` + `gl`,`fi` |
| `/finance/profitability` | Yes | REAL | `ProductProfitability.tsx:37` | `finance-main.controller.ts` + `order-costing.controller.ts` |
| `/finance/reports` | Yes | REAL | `FinancialReports.tsx:45` | `finance/…/reports.controller.ts` |
| `/accounting/ar` | Yes | REAL | `AccountsReceivable.tsx:32` | `finance-ar.controller.ts` |
| `/accounting/ap` | Yes | REAL | `AccountsPayable.tsx:32` | `finance-ap.controller.ts` |
| `/accounting/ar-ap-aging` | Yes | REAL | `ArApAging.tsx:8` | `finance-ar` + `finance-ap` + `finance-cfo-config` |
| `/finance/approval` | Yes (ProductionRoutes) | REAL | `ProductionRoutes.tsx:133` → `FinanceApproval.tsx:42` | `papka-orders` + `qc` (`qc/approve/finance`) |
| `/accounting/cashier-hub` | Yes | REAL | `CashierHub.tsx` | `cashier-hub.controller.ts` + `cashier-payroll.controller.ts` |
| `/accounting/income-expense` | Yes | REAL | `IncomeExpense.tsx:27` | `finance-extended-income.controller.ts` |
| `/pos-monitor` | Yes (sub-app) | REAL | `pos-monitor/PosMonitorApp.tsx:118` | `pos/*` controllers |
| `/accounting/payroll-automation` | Yes | REAL | `PayrollAutomation.tsx:42` | `finance-extended-payroll.controller.ts` |
| `/finance/order-costing` | Yes | REAL | `OrderCosting.tsx:32` | `order-costing.controller.ts` |
| `/accounting/materials` | Yes | REAL | `MaterialsAccounting.tsx:42` | `finance-accounting.controller.ts` + warehouse |
| `/accounting/inventory-valuation` | Yes | REAL | `InventoryValuation.tsx:94` | `finance-extended.controller.ts` |
| `/accounting/asset-management` | Yes | REAL | `AssetManagement.tsx:76` | `compatibility/asset-management.controller.ts` |
| `/fi/cost-centers` | Yes | REAL (tab) | `FinanceExtended.tsx:83` (CostCentersTab) | `fi.controller.ts` |
| `/fi/transfer-pricing` | Yes | REAL (tab) | `FinanceExtended.tsx:88` (ProfitCentersTab) | `fi.controller.ts` (`fi/profit-centers`) |
| `/fi/tax-management` | Yes | REAL (tab) | `FinanceExtendedTabsExtra.tsx:36` (TaxTab) | `fi` + `finance-extended` |
| `/fi/tax-calendar` | Yes | **STUB** | `FinanceExtendedTabsExtra.tsx:103` (`EPComingSoon`) | none wired |
| `/fi/audit-log` | Yes | REAL — but **mislabeled** | `FinanceExtended.tsx:93` (GLDocumentsTab); `URL_TAB_MAP` `FinanceExtendedTypes.ts:66` | `fi.controller.ts` (`fi/gl-documents`) — shows GL docs, not an audit log |
| `/fi/risk-ai` | Yes | **STUB** | `FinanceExtendedTabsExtra.tsx:129` (`EPComingSoon`, static "—" KPI cards) | none wired |

**Newly-found finance routes (not in the given list), all REAL:** `/cfo/dashboard` (`CFODashboard`), `/finance/daily-kpi` (`DailyKPIDashboard.tsx:37`), `/cfo/config` (`CfoConfigSettings.tsx:42` → `finance-cfo-config.controller.ts`), `/finance/variance` (`FinanceVariance.tsx:96` → `finance-variance.controller.ts`), `/finance/break-even` (`FinanceBreakEven.tsx:83` → `finance-break-even.controller.ts`), `/finance/pricing-tiers` (`PricingTiers.tsx:66`). Finance-adjacent in other route files: `/wms/pos-monitor`, `/integration/gl-posting` (`GLPostingMonitor`), `/integration/invoice-verification`, `/director/finance`.

**Summary — Part A:** ~30 finance routes exist; **only 2 are stubs** (`/fi/tax-calendar`, `/fi/risk-ai`). One route is **mislabeled** (`/fi/audit-log` renders GL documents, not an audit trail — a governance signal, since there is no actual finance audit-log UI). Everything else renders real, API-wired content. **The surface is broad and largely built; the problem is not missing pages — it is what's behind them (Parts B/C).**

---

## Part B — Standards conformance, per accounting principle

| # | Principle | Status | Live evidence (query result / file:line) | Test-data warning |
|---|-----------|--------|-------------------------------------------|:---:|
| 4 | **Single-ledger principle** | **VIOLATED** | **Four** distinct writers INSERT into `entries`: (1) the ONE engine repo `drizzle-gl-posting.repo.ts:61,112` (behind `GlPostingService`); (2) HR payroll `drizzle-hr.repo.ts:196` (`postPayrollToGL`, bespoke); (3) SD invoice `drizzle-finance-invoice.repo.ts:220` (raw `INSERT INTO entries`); (4) POS `gl-posting-log.repository.ts:161` (raw `INSERT INTO entries`). **Live `document_type` proves all 7 rows came from the 3 bespoke writers** (`pos_movement`×2, `SD_*`×4, `PAYROLL`×1); the engine's own `document_type='journal'` count = **0**. | **Y** |
| 5 | **Subledger-to-GL reconciliation** | **VIOLATED (every account)** | Live GL net vs subledger: **AR** acct 4000 GL = **85,000,000** vs `finance_invoices` sales outstanding = **143,760,000** (only 1 of 7 sales invoices ever posted an AR leg). **AP** acct 6000 GL = **−62,823,462,295** (garbage) vs `finance_invoices` purchase outstanding = **2,000,000**. **Payroll** acct 6710 GL = **4,242,000** (1 entry) vs `payroll_period_record` earned = **34,163,046** across **10** records (1 of 10 posted). **Cash** acct 5010 GL = **−850,000** vs cashier subledger empty (`cashier_movements`=0, one open shift opened=100,000). No subledger reconciles. | **Y** |
| 6 | **Period-close enforcement** | **PARTIAL (enforced only in the unused engine)** | Lock lives at `gl-posting.service.ts:166-174` (`findClosedPeriodForDate` → Err) — but **only the engine checks it**. The 3 bespoke writers that carry all live data (payroll/SD/POS) never call it → a closed period would still accept their postings. Live `accounting_periods` = **0** → never exercised regardless. | **Y** |
| 7 | **Audit-trail completeness** | **PARTIAL / VIOLATED** | `entries` `created_by` 100%/7 but `posted_by` **0%**. `pos_movements` `created_by` 100%/9, `approved_by` 55.6%, `completed_by` 0%. **Missing the column entirely:** `finance_invoices` (no `created_by`/`approved_by` — 8 rows unattributed), `finance_payments`, `cashier_shifts`, `payroll_advances` (only timestamps), `payroll_period_record` (no `created_by`; `approved_by` 0%, `paid_by` 10%). Empty tables (`payments`,`budgets`,`customer_payments`,`bonus_payments`,`cashier_movements`,`order_costings` = 0) → % meaningless. | **Y** |
| 8 | **Separation of duties** | **VIOLATED (structurally unreachable)** | Live `users.role`: **manager 27, super_admin 3, director 1, employee 1** — **no `accountant`/`finance_officer`/`cfo` user**. Payment create = `@Roles(FINANCE_OFFICER, SUPER_ADMIN)` (`finance-payments.controller.ts:76,106`), approve = `@Roles(DIRECTOR, SUPER_ADMIN)` (:90). `super_admin` is in **both**, and `roles.guard.ts` admin-bypass lets `director` create+approve. The only maker role (`finance_officer`) has **0 users**. `SodGuard` (`sod.guard.ts`) is fail-open (`if(!user) return true`), keys off permission strings from **non-existent** `permissions`/`role_permissions` tables, and matches `method==='PUT'` while the real approve is `PATCH` → **can never fire**. | N |
| 9 | **Multi-currency discipline** | **PARTIAL — stub feed + asymmetric enforcement** | `cron/currency-rates.cron.ts:14-27` is a **fake-success stub** — sets `result.processed=5` and logs `✅` with **no HTTP fetch and no INSERT**. `exchange_rates` = **4** hand-seeded rows (`source='seed-initial'`, max `created_at` 2026-07-05, no `updated_at` column). `currencies` table **diverges** (USD 12500 vs 12700, EUR 13500 vs 13800, RUB 135 vs 140; `updated_at` NULL) — two conflicting rate sources. Missing-rate behavior **asymmetric**: cashier `cashier-hub.service.ts:379-386` **gates** (`KAS-1`, never fabricates); POS `pos-movement.service.ts:329,450` silently `?? 1` (**1:1 default**). | **Y** |
| 10 | **AI-accountant boundary** | **REAL (advisory-only, human gate present)** | Every AI→money touchpoint is a suggestion behind a human step. Podotchet OCR sets `ocrExtracted`/`ocrMatch` only ("SIGNAL for the human approver", `cashier-podotchet.service.ts:203-208`); debt cleared solely by human `approveAdvanceReport:316-333`. AI invoice classify writes only `gl_documents.metadata` jsonb (`ai-automation.repository.ts:143-151`) — annotation, no posting/status-change. `/ai/finance` endpoints (`ai-finance.controller.ts:61-190`) all **return** analysis, write nothing. `/fi/risk-ai` is a UI stub. **No AI path posts to GL, approves a payment, or flips invoice status.** | N |
| 11 | **Chart-of-accounts integrity** | **REAL — no orphans** | `accounts` = **42** live. Every code referenced in `gl-accounts.constants.ts`, `auto-gl-posting.service.ts:33-46`, and `gl_account_mappings` exists in `accounts`; `resolveAccountIds` (`drizzle-gl-posting.repo.ts:90-92`) Err's on a missing code. Live: every `debit_account_id`/`credit_account_id` in `entries` joins to a real `accounts` row (0 nulls in the trial balance). Dormant `GL_ACCOUNTS_V2` has non-chart codes but is unused. | N |
| 12 | **Data-quality gate on GL entries** | **VIOLATED** | Only `postDeliveryCompleted` validates `amount>0` (`gl-posting.service.ts:121-125`). `postSalesInvoice`/`postCustomerPayment`/`postPayroll`/`postGoodsReceipt`/`postVendorPayment`/generic `postJournal` have **no** non-zero gate; a zero journal silently no-ops (`:148-156`). **No source-document existence validation anywhere** — `reference` is a free string (`:138`). Decisively: the **62.8B garbage row came from the POS bespoke writer** (`gl-posting-log.repository.ts:161`), which **bypasses this engine entirely** → the garbage-entry root cause has **no structural fix** and can recur. | **Y** |

---

## Part C — Coverage gaps vs a complete double-entry ERP

| Capability | Status | Evidence (file:line / no-match) | Why it matters | Effort |
|---|---|---|---|---|
| **1. Bank reconciliation / statement import & matching** | **ABSENT** | `bank_accounts`/`bank_statements` tables exist but are pure DDL stubs (only in `invariants/migrations-drift.ts`); no reader/writer. No matches for `reconcil\|mt940\|statementImport`. `employee_bank_accounts` is payroll bank-detail, not reconciliation. | Cash/GL never tied out to the bank — unreconciled cash is a top audit finding. | HIGH |
| **2. Fixed-asset depreciation posted to GL** | **PARTIAL** | Real calc engine `depreciation.service.ts` (SL/DB/SYD/UOP + `buildSchedule`), but `depreciateAsset` only `UPDATE asset_items SET accumulated_depreciation/current_value` (`asset-management.repo.ts:231-253`) — **no `postJournal`/`entries` write**. | Depreciation expense & accumulated-depreciation never hit the ledger → P&L and balance sheet understate depreciation. | MEDIUM |
| **3. Intercompany / inter-department eliminations** | **ABSENT** | `/fi/transfer-pricing` exists but no elimination logic; `eliminat\|intercompany\|consolidat` matches are unrelated comments only. | Intercompany profit/balances not removed on consolidation (low priority while single-entity). | HIGH |
| **4. Journal-entry approval workflow (draft→review→post)** | **PARTIAL** | Canonical `createGlDocument` posts **immediately** (`finance-accounting.service.ts:207-227`, balance-checked, no approver). `fi` module has `gl_documents.status` draft→posted + `POST /fi/gl-documents/:id/post` (`fi.controller.ts:85`) but that flips a header shim only, not canonical `entries`. Only real gate is the period-lock, not a reviewer. | Any authorized user posts directly to the ledger; no maker-checker on the GL itself. | MEDIUM |
| **5. Financial-statement generation (period-locked, exportable official docs)** | **PARTIAL** | Real queries + persisted `rpt_` snapshots (`financial-reports-query.helpers.ts:131` `queryBalanceSheet`, `financial-reports-snapshot.service.ts` crons). But **no formal export**: `reports.controller.ts:111` — "File generation (xlsx/csv) requires a real export engine; until then returns raw JSON". No PDF, no statement-level period lock. | On-screen numbers exist; no signed, period-frozen statutory statement to file/archive. | MEDIUM |
| **6. Recurring / template journal entries** | **ABSENT** | No finance recurring/template journals; `recurring` hits are Kanban/Comms crons only. | Monthly accruals/prepaids re-keyed by hand → errors, omissions. | MEDIUM |
| **7. Year-end closing (retained-earnings rollover / P&L zero-out)** | **ABSENT** | Only monthly `closePeriod` exists. `retainedEarnings` is computed on the fly (`financial-reports-query.helpers.ts:169`), never booked; no closing entry zeroes P&L. | P&L accounts never reset; retained earnings is a report calc, not a booked balance. | MEDIUM |
| **8. Statutory / regulatory (tax-filing) reporting** | **ABSENT (by design)** | `GeneralTaxService` computes VAT breakdown (`general-tax.service.ts:115-146`); `fi` tracks tax due/paid — internal only. Payroll is **gross-only, tax deferred to external 1C** (`business.constants.ts:197`). No soliq.uz/didox/e-invoice filing-format export. | No machine-readable statutory returns; filing depends on external 1C. | HIGH |
| **9. Period-end currency revaluation (unrealized FX gain/loss)** | **ABSENT** | Zero matches for `revaluat\|unrealized\|fx.?gain\|fx.?loss` anywhere. No revaluation run, no realized/unrealized FX accounts. | Open FX balances never restated at period-end → misstated balances under any FX exposure. | MEDIUM |

**Part C summary:** 3 PARTIAL (depreciation, JE approval, financial statements — real scaffolding, not finished), 6 ABSENT (bank rec, eliminations, recurring journals, year-end close, statutory filing, FX revaluation). Two ABSENTs are **deliberate design choices** worth stating plainly: statutory tax filing and payroll tax are intentionally offloaded to an **external 1C** system (`business.constants.ts:197`) — so #8 is arguably out of scope by architecture, not a defect. The rest are genuine gaps for a standalone double-entry system.

---

## Overall verdict

**Does this accounting module, as discovered end to end, match standard double-entry ERP practice? — PARTIAL, and not trustworthy as a system of record today.**

The **surface** is impressively complete: ~30 real, API-wired finance routes covering CFO, GL, AR/AP, cashier, POS, costing, budgeting, tax, and variance — only 2 stubs. The **engines** are largely genuine: balanced double-entry decomposition, FIFO COGS, standard-cost + 5-way variance, depreciation math, budget-vs-actual against real GL, a period-lock, and — a clear positive — a **correctly-drawn AI boundary** (every AI output is advisory behind a human gate; nothing auto-posts to the ledger). Chart-of-accounts integrity is clean.

But the **core double-entry disciplines that make a ledger trustworthy are violated at the structural level**, and these are genuine code/architecture defects, not merely unseeded data:

1. **Not one ledger — four writers, and the controls live in the one that isn't used.** All 7 live GL rows came from three bespoke writers (payroll, SD-invoice, POS) that bypass the engine's period-lock, amount validation, and idempotency. "The books" have three uncontrolled side-doors (#4, #6, #12).
2. **No subledger reconciles to the GL** (#5). AR shows 85M in the GL against 143.76M in the invoice subledger; payroll shows 1 of 10 records posted; AP shows a 62.8-billion garbage balance against a 2M subledger. A general ledger that doesn't tie out to its subledgers is not a system of record.
3. **The data-quality root cause is unfixed** (#12): only one posting method checks amount>0, nothing validates a source document, and the writer that produced the 62.8B garbage doesn't even route through the engine — so the same failure can recur.
4. **Separation of duties is structurally unreachable** (#8): no maker role has any users, super_admin sits in both create and approve lists, director admin-bypasses, and the `SodGuard` keys off permission tables that don't exist. Maker-checker cannot fire.
5. **The audit trail is incomplete at the schema level** (#7): the two highest-stakes documents — invoices and payroll — have no creator/approver columns at all.
6. **Multi-currency silently ages** behind a fake-success cron with two divergent rate tables, and POS books a missing rate 1:1 (#9).

**Distinguishing the two categories the prompt asks for:**
- **Genuine code/architecture defects (fix = write code / change schema):** #4 multi-writer ledger, #5 no reconciliation (the writers simply don't post most subledger events), #6 period-lock only in the engine, #7 missing `created_by`/`approved_by` columns, #8 unreachable SoD, #9 FX stub cron + POS 1:1 + divergent rate tables, #12 no amount/source gate. Plus Part C's PARTIALs (#2 depreciation not posted to GL, #4 no JE approval, #5 no statement export) and ABSENTs (bank rec, recurring JE, year-end close, FX revaluation).
- **Merely unseeded-but-correct logic (fix = seed / operate):** the engine's balance check and reversal, budget-vs-actual, standard-cost/variance, cashier reconciliation, gated payroll close, and the gates that depend on empty master data (`accounting_periods`=0, `ckp_fact_values`=0, `payroll_rows`=0) are structurally correct and simply unexercised.
- **Data-cleanup (neither):** purge the 62.8B `POS-GL-1` row.

**Bottom line:** this is a broad, mostly-built accounting module with a sound AI boundary and correct engines, sitting on an **unsound ledger foundation** — multiple uncontrolled GL writers, no subledger reconciliation, no data-quality gate, and non-functional segregation of duties. Until the writers are unified behind the single engine (so the period-lock, amount, and source-document controls actually bind every posting), the subledgers are made to post and reconcile, and SoD is provisioned with real maker roles, **the numbers cannot be relied on for a financial decision or a statutory audit** — regardless of how much data is seeded. The empty tables are the smaller problem; the wiring is the larger one.

---

*Investigation only. No code, migration, seed, or commit performed. Live figures are read-only queries against `europrint` on 2026-07-06; reproduce with `node _audit/q.cjs "…"`. Cross-reference: `docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md`.*
