# EuroPrint ERP — Full Finance Module Deep-Dive Audit (read-only)

**Date:** 2026-07-06
**Scope:** GL, AR/AP, Payroll, Cashier/POS, Multi-currency, Budgeting/Costing/Reporting, Authorization & Audit-trail — end to end.
**Method:** Code reading (file:line) + **live** queries against `postgres@localhost:5432/europrint` (read-only via `_audit/q.cjs`). 7 parallel investigators, each cross-referencing prior audits and re-verifying the interim fix-commits rather than trusting commit messages.
**Prior audits cross-referenced:** `docs/audit/SAP-CONFORMANCE-CHECK.md`, `docs/audit/SAP-AUDIT-2026-06-06.md`, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`.

> **Read this first — the two things that decide everything below.**
> 1. **The canonical `entries` ledger is structurally self-balancing.** Each row is *one* `debit_account_id` + *one* `credit_account_id` + *one* `amount`. ΣDebit ≡ ΣCredit for **any** dataset by construction (live: 62,963,781,568 = 62,963,781,568, nets to zero). "Balanced" therefore proves nothing about correctness — the real questions are *leg completeness*, *amount provenance*, and *which of several writers produced the row*.
> 2. **Most of what "can't be verified" is empty data (build stage), not fabricated logic.** The engines are largely real; the failures cluster in *wiring* (multiple writers / wrong source table) and one *data-quality bomb*. Empty-data (seed later) is kept strictly separate from code defects (write code) throughout.

---

## Part A — General Ledger (GL) core

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| A1 | Double-entry integrity of `createJournalEntry` end to end | **REAL (code) / EMPTY-DATA (this engine)** | Engine `gl-posting.service.ts:138-203` (ΣDr−ΣCr>0.01 → Err at :154; multi-leg → balanced pair-rows :181-196; atomic tx `drizzle-gl-posting.repo.ts:96-117`). Live: all 7 `entries` rows are self-balanced pairs; **ΣDebit = ΣCredit = 62,963,781,568 UZS**, per-account net sums to 0. | ⚠️ **GlPostingService has written 0 live rows** (`document_type='journal'` count = 0). All 7 live rows came from **other** direct-insert writers (see A2/cross-cutting #1). Engine is real but currently **unexercised**. |
| A2 | Two-GL-worlds: POS bridged to `entries`, or still separate `pos_gl_postings`? | **PARTIAL — bridged, but via a *second* writer; a third mirror path also exists** | `pos_gl_postings` count = **0** (subledger empty/dead). Live `entries` ids 7 & 85 = `POS-GL-2`/`POS-GL-1` came from approval path `gl-posting-log.repository.ts:111-168` (`postMovementToLedger`, resolves via `gl_account_mappings`, 8 rows). Second path `auto-gl-posting.service.ts:148-163` mirror rows = 0. | POS **is** in canonical `entries` (no longer isolated) but through the **older approval writer**, not the unified engine. Two writers, **different idempotency keys** → double-post risk. `POS-GL-1` = **62.8 B UZS** garbage. |
| A3 | Vendor-payment + MM goods-receipt GL posting — callers now, or still zero? | **STUB (unwired)** | `postVendorPayment` (`gl-posting.service.ts:54`) = **0 callers**. GL-engine `postGoodsReceipt` (`:45`) = **0 callers**; the MM `postGoodsReceipt` callers (`mm-goods.service.ts:46`) update receipt status and post **no GL**. MM→GL only if `wms-goods-issued.listener.ts:151-175` fires. Live: 0 vendor-payment / 0 MM-GR rows in `entries`. | **Unchanged since SAP-CONFORMANCE-CHECK #3.** AP cash-out still never hits GL. |
| A4 | Period-close locks further postings (DB/service, not UI)? | **REAL (code) / EMPTY-DATA** | Lock enforced in engine before every insert: `gl-posting.service.ts:166-174` → `findClosedPeriodForDate` (`drizzle-gl-posting.repo.ts:138-158`). Write side `drizzle-finance-accounting.repo.ts:85-88`. Live: `accounting_periods` = **0 rows** → never exercised. | ⚠️ Lock lives **only inside GlPostingService**. The direct writers (payroll, SD-invoice, POS) **bypass the period-lock check entirely** — a closed period would still accept those. Not system-wide. |
| A5 | Chart of accounts — orphan referenced codes? | **REAL — no orphans** | `accounts` = **42** live. Every code referenced in `gl-accounts.constants.ts:17-36`, `auto-gl-posting.service.ts:33-46`, `gl_account_mappings` is present in `accounts`; `resolveAccountIds` (`drizzle-gl-posting.repo.ts:90-92`) Err's on a missing code (fails honestly). | Dormant `GL_ACCOUNTS_V2` (`:39-58`) has codes not in the chart (1210/1410/3110/8400/9110) but is unused → no live orphan. |
| A6 | Reversal produces a real mirrored balanced entry? | **REAL (code) / EMPTY-DATA** | `finance-accounting.service.ts:242-271` swaps debit/credit, posts via `postJournal(...,`REV-${id}`)`, idempotent. Live: `entry_number LIKE 'REV-%'` = **0**. Commit `1462bef9` (Q2) verified genuine in code. | Correct, balanced-by-construction; no reversal executed live yet. |

**Cross-cutting GL risks**
1. **At least 4 distinct writers INSERT into `entries`; the unified engine has posted 0 of the 7 live rows.** Live writers: HR `postPayrollToGL` (`drizzle-hr.repo.ts:196-206`, `PAYROLL-{id}`, text account cols left NULL); a bespoke SD-invoice writer (`SD_INVOICE`/`SD_COGS`/`SD_VAT`/`SD_DELIVERY_COST` + `GL-000000NNN`); POS `postMovementToLedger`; GlPostingService (0). Heterogeneous number/type/column patterns confirm independence.
2. **Period lock + reference-idempotency are enforced ONLY in GlPostingService** — the three writers carrying real data bypass both, so the flagship period-close protection is inert in practice.
3. **Two POS→`entries` writers with non-shared dedup keys** (`document_type+document_id` vs `entry_number` prefix) → double-post if both fire.
4. **Schema drift:** `entries.debit_account_id/credit_account_id` are integer FKs live but declared `varchar` in Drizzle → every writer `String(id)`-casts (`drizzle-gl-posting.repo.ts:104-105`). Fragile.
5. **Data-quality bomb:** `POS-GL-1` = 62,823,437,295 UZS (62.8 B, ~740× the next entry) dominates the ledger. Its **source `pos_movements.id=1` has `total_amount = 0.00`, `status='pending'`, `ai_gl_status='PENDING'`, `gl_document_id=NULL`** — the GL amount is **untraceable to the source document** and was posted for a non-completed movement. This is both a data-cleanup problem *now* and a code gap (posting amount not validated against source).
6. **Two period-close write paths** (`drizzle-finance-accounting.repo.ts:87` sets `status='closed'`; `fi/drizzle-fi.repo.ts:38` via `@europrint/schemas`) vs a lock READ that checks `status='closed' OR is_closed=true` → a close setting only one column could partially lock.

---

## Part B — Accounts Receivable / Accounts Payable

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| B7 | Aging buckets 90/60/30 — hardcoded/duplicated or consolidated? | **STUB (unresolved)** | 30/60/90 hardcoded inline in `ar-aging.handler.ts:66-69` **and** duplicated in `ap-aging.handler.ts:45-48`. A **second, divergent** 30/60/90/**120** scheme in `finance-ar.service.ts:52-56` + `finance-ap.service.ts:52-56`. ECL rates hardcoded `ar-aging.handler.ts:36-41,57-60` + dup in `cashflow-forecast.service.ts:75-78`. No named constant. | **Four** files, **two incompatible bucketings** (3-bucket vs 5-bucket). Self-inconsistent ECL: `DEFAULT_ECL_RATES` 0.02/0.08/0.20/0.50 vs `?? 0.01/0.05/0.20/0.50` second fallback. |
| B8 | Overdue AR/AP — real SUM vs fabricated `total*0.3`? | **REAL (M3 fixed)** | `total*0.3` **gone** — only a comment remains (`financial-reports-query.helpers.ts:107`). Live code `queryReceivables()` (`:96-98`) = real `SUM(CASE WHEN payment_date < cutoff …)`; handlers `SUM(total_amount − COALESCE(paid_amount,0))` by bucket (`ar-aging.handler.ts:72-79`). Commit `9919dc92` confirmed. Live: `finance_invoices` id=2 `overdue`, due 2026-06-07, 20.16 M. | ⚠️ **MAGIC-NUMBERS-AUDIT-V2 line 131 is now STALE** — it still lists `helpers.ts:101` as `total*0.3` HIGH; the file no longer contains it. (Only "site 1/4" — other M3 sites out of this scope.) |
| B9 | Invoice→payment FK linkage; status flips on real payment sums? | **EMPTY-DATA + code REAL-but-fragmented** | Status flip is real (not manual): `record-payment.handler.ts:65-76` (sum + overpayment guard :72) → `updateInvoicePaidAmount(...,'paid'/'partial')` on canonical `finance_invoices`. **But** record→`finance_payments`, `approvePayment`→`customer_payments` (`finance-actions.repository.ts:45`), `verifyPayment`→`finance_payments`. The `payments` table (has `invoice_id`) has **no FK**. Live: `payments`/`finance_payments`/`customer_payments`/`invoice_payments` **all = 0**. | Cannot exercise live. **Four** payment tables, **zero DB-level FK**; the three write paths each touch a *different* table. |
| B10 | Can a payment release without a passing three-way match? | **STUB / GAP CONFIRMED** | Customer-payment approve `finance-actions.repository.ts:42-53` = `UPDATE … status='approved'`, **no match precondition**. `RecordPaymentHandler` has no 3-way check. Vendor `payVendorInvoice`/`matchVendorInvoice` (`mm-dashboard.controller.ts:193-203`) are `notImplemented`. Match enforced **only at goods-receipt** (`goods-receipt.handler.ts:40`). | **Unchanged** since SAP-CONFORMANCE-CHECK rec #5. `fad2c7f8` fixed the *goods-receipt* match computation, not a payment gate. |

**AR/AP-specific risks**
1. **HIGHEST-IMPACT (wrong non-zero numbers today):** the "`finance_invoices` = canonical" migration (`d6286993`, 2026-07-02) was applied to the **repositories** but **not** to the CQRS **aging handlers**, which still read the legacy VIEW `fi_invoices` (over base `invoices`). Live proof: canonical unpaid = **145,760,000 UZS / 5 invoices**, but `fi_invoices` (what `ArAgingHandler`/`ApAgingHandler` read at `ar-aging.handler.ts:75` / `ap-aging.handler.ts:54`) = **60,760,000 / 4** → AR aging **understates by ~85 M UZS**.
2. **AP aging is blind to the only payable.** The single canonical purchase invoice (`finance_invoices` id=8, `invoice_type='purchase'`, 2 M) is absent from the `fi_invoices` view (7 legacy rows, all sales) → AP aging silently reports **zero payables**.
3. **A *third* invoice source:** `getOutstandingPayment` (`finance-payments.controller.ts:143`) reads legacy base `invoices`, inconsistent with the record path's `finance_invoices`.
4. **Four disconnected payment tables + no FK** — once data flows, an approved payment (`customer_payments`) and its ledger row (`finance_payments`) are different rows, none tied to an invoice at the DB level.

---

## Part C — Payroll

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| C11 | Tax/pension/JSHD rate consistency across FE / BE / domain | **STUB — disagree (4 ways)** | FE label "INPS 12%, JSHD 12%" (`FinanceDashboard.tsx:225`, `finance.json:567-568`). BE controller `TAX_RATE=12; PENSION_RATE=8` (`payroll-periods.controller.ts:68-69`). Settings/schema `inps_rate 0.12 / jshd_rate 0.01` (`schema-hr-lms.ts:59-60`). Actual close path **0% gross-only** (`business.constants.ts:196-197` "tax constants removed"; HR `closePeriod` computes no tax). | **Four contradictory answers**; no consolidating constant. **Extra bug:** FE expects `{inpsAmount,jshdAmount}`, BE returns `{incomeTax,pensionDeduction}` → renders `formatCurrency(undefined)` = NaN. **Mitigant:** it is a *preview dialog*, not wired to close → **does not corrupt persisted payroll** (which is gross-only, internally consistent). Danger is a user filing statutory numbers off it. |
| C12 | Card salary formula wired into `closePeriod`, or preview-only? | **REAL (code) / EMPTY-DATA (never run)** | `computeGatedMonthlySalary` (`payroll.service.ts:410`) → `generatePeriodRows` (:664) upserts `payroll_rows.base_salary = sumGatedGross` (:812-822, gated not raw). Reachable via `/hr/payroll/closure/periods/:id/generate` + `/close`; Finance proxies (`de4bb5be`). Live: `payroll_rows` = **0**; `payroll_periods` id=1 status='open', null dates. | Gated path genuinely wired (`3f1357c5`/`056a14c2` present) but **never executed**. The 10 `payroll_period_record` rows are a **different legacy table** (compat raw INSERTs), not gated-formula output — reports summing it read raw figures. |
| C13 | ЦКП-gate + LMS-gate live at close, real data? | **REAL (code) / EMPTY-DATA (cannot bind)** | Both gates inside `computeGatedMonthlySalary`: LMS `:452-466` (fail-closed), ЦКП `:478-510` (per-day 0/1 from `ckp_fact_values`), batch-prefetch `:722-723`. Live: `ckp_fact_values` = **0** → every day factor = 0 → gated salary = 0 for every card. | Structurally live; with no ЦКП facts the design **intentionally pays 0**. EMPTY-DATA, not defect. |
| C14 | Payroll→GL atomicity vs mark-closed ordering | **REAL — correct ordering** | GL posted **first** `postJournal(glLines,`PR-${periodId}`)` at `payroll.service.ts:173`; only then `markPeriodClosed` (:176), `markRowsPosted` (:179). Comment :166-169 explicit; idempotency `PR-${periodId}`. | Safe order (no closed-but-unposted window). Minor: mark-closed + mark-rows-posted are sequential calls, not one txn (cosmetic self-heal). Live `entries` id 52 is a legacy text-path payroll row; no `PR-*` yet (gated close never ran). |
| C15 | Advances / loans / bonus — real writes or stubs? | **REAL (code) / EMPTY-DATA** | `bonus_payments`: real INSERT `bonus.repository.ts:59-80`; `POST /hr/bonuses` + `/approve`; summed via `sumApprovedGroupedByEmployee` (`payroll.service.ts:705`, `68931eac`/`025c356a`). `payroll_advances`: real INSERT `drizzle-finance-ops.repo.ts:57`. Live: both = **0**. | Real & reachable; only `approved` bonuses feed payroll. Duplicate deprecated schema `schema-ext-b-2.ts:102` = noise only. |

**Payroll-specific risks:** C11 is the dominant finding and **still present** — four mutually contradictory tax truths, plus a NaN-rendering FE↔BE key mismatch, in a self-contradictory calculator (Q-46 "buzuq kod"). **Materiality mitigant:** the real close path is gross-only, so the ledger is not corrupted; the contradiction is an advisory/display defect. Secondary: two parallel payroll worlds (legacy `payroll_period_record`/`payroll_calculations` = 10 rows vs new gated `payroll_rows` = 0); mark-close not transactional.

---

## Part D — Cashier / POS financial flows

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| D16 | Shift close: expected = opening + Σin − Σout, variance genuinely computed? | **REAL (code) / EMPTY-DATA** | `cashier-hub.service.ts:120-122` (`expected = opening + cashIn − cashOut; variance = closed − expected`); totals from live SQL `SUM(CASE WHEN type='cash_in' …)` (`drizzle-cashier-hub.repo.ts:167-211`), UZS-equivalent `amount × COALESCE(exchange_rate,1)`. Live: `cashier_shifts` id=3 `open`, opened=100000, closed/expected/variance = NULL (never closed). | Genuinely computed, currency-aware. Close arithmetic unexercised (1 perpetually-open shift). |
| D17 | Every cashier movement posts to canonical `entries` via GlPostingService? | **REAL (code) / EMPTY-DATA** | GL posted **first** (`cashier-hub.service.ts:391-394`), movement inserted only on success (:396-408); map :420-449 (advance Dr4000/Cr5010, salary Dr6710/Cr5010, expense Dr9100/Cr5010, cash_in Dr5010/Cr9010). Live: `cashier_movements` = **0**. | ⚠️ POS→`entries` mirror is **best-effort** (`auto-gl-posting.service.ts:158-159` — canonical-ledger failure only logged, movement still succeeds) → `pos_gl_postings` can succeed while `entries` silently misses a leg. |
| D18 | Podotchet AI-OCR→human-confirm real e2e AND wired to profile UI? | **REAL (was orphaned, now wired) / EMPTY-DATA** | OCR sends real image **bytes** (`cashier-podotchet.service.ts:263`), null on unreadable (no forged verdict). Human gate: `submitAdvanceReport` creates *pending*, `approveAdvanceReport:316-333` clears debt. FE wired: `EmployeeProfile.tsx:60,391` → `ObligationsTab.tsx:91-93` (`GET …/employees/:id/debt`); submit/OCR/approve UI `CashierHub.tsx:218-328`. Live: `expense_reports` = 0. | Prior "orphaned" finding **RESOLVED**. OCR is a signal; human approval is the final gate (correct). |
| D19 | Is `POST /finance/cashier/salary-payouts/pay` now wired into the FE? | **STUB (still orphaned)** | BE real + gated (`cashier-payroll.service.ts:193-241`: Gate1 chain approved, Gate2 PIN + GL Dr6710/Cr5010). FE grep for `salary-payouts/pay` = **no matches**. `CashierHub.tsx` calls `/salary-payouts` (create), `/:id/approve`, `/:id/reject` — **never `/pay`**. | **Unchanged.** The terminal disbursement (cash-out + GL) is unreachable from the UI — a fully-approved payout can't be executed through the app. |

**Cashier/POS risks:** (1) **D19 dead terminal step** — approvals reachable, disbursement not; money never leaves the drawer via the app. (2) **POS→`entries` best-effort mirror** — canonical ledger not guaranteed complete for POS. (3) **Two parallel POS-GL paths** (`auto-gl-posting.service.ts` → entries+pos_gl_postings vs `pos-movement-status.service.ts:216-236` → `gl_posting_log` AWAITING_REVIEW). (4) **PIN gate un-passable live** — no `users.pin_hash` column (`drizzle-cashier-hub.repo.ts:380-403` returns null) → every PIN-required movement is GATED/rejected (fail-closed, correct; explains `cashier_movements=0`). D16/D17/D18 are EMPTY-DATA; **D19 is a genuine wiring defect**.

---

## Part E — Multi-currency

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| E20 | `exchange_rates` state + every conversion call site | **PARTIAL (real read-path, stale seed data)** | Live `SELECT * FROM exchange_rates` = **4 rows**, all `source='seed-initial'`, `rate_date='2026-07-05'`: USD→UZS 12700, EUR→UZS 13800, RUB→UZS 140, CNY→UZS 1750; **no `updated_at` column**, `created_by` all NULL. Read path `finance-main.controller.ts:76-107` prefers DB (`source:'db'`), falls back to `app.constants.ts:121-124` only on empty/error, with `Logger.warn` at :98/:100. | Commit `31c6953c` verified TRUE live: DB path now wins, RUB constant named, honest warns fire. |
| E21 | FX-rate source of truth (feed vs manual) + staleness | **STUB (no real feed; one-time seed)** | Live: `max(created_at)=2026-07-05T13:30`, sources = `{seed-initial}`. Update code `cron/currency-rates.cron.ts:13-27` (`@Cron('0 9 * * *')`) is a **STUB**: comments say "CBU API dan olish" but **no HTTP fetch, no INSERT** — it sets `result.processed=5` and logs `✅ processed=5`. | Rates **go stale silently** — worse, the stub logs a fake daily success implying freshness. No `updated_at` to self-report staleness; no FX write endpoint. |

**FX-specific risks (staleness weighted heavily)**
1. **Silent staleness behind a fabricated-success cron** — the dominant risk. The 09:00 cron never fetches CBU and never writes, yet logs `✅ processed=5` daily; the 4 rows are frozen at the seed. Not "no rates" but "rates that look maintained and are not."
2. **No `updated_at` / no attribution** — the table cannot self-report staleness; correction requires off-system raw SQL.
3. **Two divergent sources of truth for the same pairs** — the `currencies` table carries its own `exchange_rate` (USD=12500, EUR=13500, RUB=135) that **disagrees** with `exchange_rates` (USD=12700, EUR=13800, RUB=140) by ~1.5–3.7%. Live inconsistency, not hypothetical.
4. **POS 1:1 fallback** — `pos-movement.service.ts:328-329,449-450` `exchangeRate = dto.exchangeRate ?? 1` with **no log** (unlike cashier-hub `:365-389` which GATES with `KAS-1`). A foreign-currency POS movement lacking an explicit rate is booked at par (a silent 12,700× USD understatement).
5. Fallback constants equal the seed values, so an emptied table returns identical numbers distinguished only by `source:'default'` + a warn line — easy to miss.

**Changed since MAGIC-NUMBERS (M2):** `exchange_rates` 0 → 4 (seed-09, 2026-07-05); DB-preferred read path now actually wins; RUB constant named + two warns added (`31c6953c`, verified). **Not fixed:** the cron stub, missing feed, missing `updated_at`, `currencies` vs `exchange_rates` divergence, POS 1:1 default. Net: moved from "empty and honest" to "populated and silently aging behind a fake-success cron."

---

## Part F — Budgeting, cost accounting, reporting

| # | Question | Status | Evidence (file:line + live query) | Notes |
|---|----------|--------|-----------------------------------|-------|
| F22 | Budget vs actual — real GL or fabricated %? | **REAL (code) / EMPTY-DATA** | Variance `get-budget-variance.handler.ts:53-89`; actuals from **real GL**: `drizzle-finance-budgets.repo.ts:201-210` `LEFT JOIN entries e ON LOWER(e.description)=LOWER(bl.category)`, `SUM(e.amount)`. Live: `budgets`/`budget_lines` = 0. | Not fabricated. **Two code defects:** (1) join key is **free-text `description=category`**, no `account_id` FK — fragile; (2) `updateActuals` writes only `budgets.totalActual`, never per-line `actualAmount` → the handler's per-line variance/`topOverspentCategories` read a never-populated column. |
| F23 | Standard / order costing — real inputs or placeholders? | **REAL (code) / EMPTY-DATA** | `standard-cost.service.ts:105-108` (material Σ BOM qty×cost; labor/overhead Σ hours×rate from `cfo_config`). 5-way variance `variance-analysis.service.ts:131-136` (MPV/MQV/LRV/LEV/OV) vs `standard_cost` + `warehouse_transactions` + `mes_sessions`. `recalculateProfitability` real `UPDATE order_costings SET gross_profit=selling_price−total_cost` (`finance-accounting.service.ts:283-306`). Live: `order_costings`=0, `standard_cost`=0. | No hardcoded cost figures. **Caveat:** `variance-analysis.service.ts:112-127` substitutes *standard* for missing actuals → variances degenerate to ~0 (masks missing data rather than flagging). |
| F24 | Trial balance / P&L / balance sheet aggregate live data? | **PARTIAL (one real, one tautological)** | **TB #1 real:** `drizzle-reports.repo.ts:18-40` per-account `SUM(CASE WHEN debit_account_id=… )` over live `entries`+`accounts`. **TB #2 defective:** `drizzle-finance-gl.repo.ts:83-94` sums `amount` where debit-not-null and where credit-not-null — every row has both ⇒ both = Σamount ⇒ `balanced` **always true** (tautology; `GET /finance/gl/trial-balance`). **P&L** `drizzle-reports.repo.ts:43-79` real by `account_type`. **Balance sheet** `financial-reports-query.helpers.ts:131-171` real. Live spot-check: **ΣDebit = ΣCredit = 62,963,781,568** (7 entries, balanced). | Two divergent TB implementations. P&L pulls REVENUE **and** EXPENSE via `debit_account_id` (`:53,57`) — revenue is normally the credit leg → possible mis-siding. Balance sheet sums only the debit leg per type. |
| F25 | Cost centers / profit centers used in allocation, or decorative? | **STUB / decorative** | Only usage is CRUD (`drizzle-fi.repo.ts:75-102,153-174`). **No calculation reads a cost/profit-center id.** `entries` has **no `cost_center_id`/`profit_center_id` column** (live `information_schema` = []). Live: `cost_centers`=1 (`CC-TEST` placeholder), `profit_centers`=0. | Architectural gap, not just empty data: even if populated, no allocation engine consumes them; segment/centre-level P&L impossible with current schema. |

**Budgeting/costing/reporting risks:** (1) **tautological GL trial-balance flag** can never surface an out-of-balance ledger (F24, `drizzle-finance-gl.repo.ts:83-94`); (2) **fragile text-match budget join** + per-line actuals never written (F22); (3) **variance masking** substitutes standard for missing actuals (F23); (4) **no cost-center allocation engine / no `cost_center_id` on `entries`** (F25); (5) P&L revenue mis-sided (F24). Re-verified: `3857bfcb` (profitability→service), `9a144dc2` (500-on-error), `121560a3` (FIFO COGS real), `a77c62db` (canonical budgets repo dedup) — all confirmed.

---

## Part G — Authorization and audit trail (finance-specific)

**Baseline:** `app.module.ts:195-199` registers 5 app-wide `APP_GUARD`s (Throttler → JwtAuth → Roles → Sod → Permission). `RolesGuard` lowercases both sides before comparing and `super_admin`/`admin`/`director` bypass the allow-list (`roles.guard.ts:82,89,93`). Live `SELECT DISTINCT role FROM users` = **super_admin, director, manager, employee** (lowercase). **No `roles` table exists.** No `accountant`/`finance_officer`/`finance_manager`/`cashier`/`hr_manager`/`admin` user exists.

| # | Question | Status | Evidence (file:line + live) | Notes |
|---|----------|--------|------------------------------|-------|
| G26 | Real role guard on every GL-post / payment-release / period-close endpoint, matching the live enum? | **REAL (with dead-role caveat)** | Every money endpoint has `@UseGuards(RolesGuard)` + `@Roles(...)`; **zero `@Public`** in finance. GL `finance-gl.controller.ts:36,65,80`; canonical `finance-main-actions.controller.ts:57,74,119,175,187` (FINANCE_ROLES); payments `finance-payments.controller.ts:48,72-158` (create=FINANCE_OFFICER; approve/verify=DIRECTOR — SoD split present); period close `fi.controller.ts:50,76`, `finance-accounting.controller.ts:38,109`, `payroll-periods.controller.ts:21,56`; cashier `cashier-*.controller.ts` (CASHIER_ROLES). Role strings are UPPERCASE but guard normalizes → **M8 casing drift does NOT open a hole.** | ⚠️ **SoD is inert:** allow-lists reference roles with **zero live users**; only `super_admin`/`director` exist among grantees, both admin-bypass → every money endpoint is effectively gated to **super_admin + director only** (fail-closed). The intended create≠approve separation **never fires** because accountant/finance_officer are never provisioned. Not a hole; the control is non-operative. |
| G27 | Audit-trail population on highest-stakes financial writes | **MIXED — 100% where column exists, MISSING columns on 2 key tables** | `entries` `created_by` **7/7 = 100%** (all user 1). `pos_movements` **9/9 = 100%** (user 1). `payments` = EMPTY (0 rows). `cashier_movements` = EMPTY (0 rows). `payroll_period_record`: **no `created_by` column at all**; `approved_by` **0/10 = 0%**, `paid_by` **1/10 = 10%**. `finance_invoices`: **no `created_by`/`updated_by` column** — 8 live invoices fully un-attributed. | Highest-stakes gaps: **`finance_invoices` has no audit column** (can't trace who created any of 8 invoices); **payroll approvals carry no approver** (0% populated). `entries` proves the mechanism works where the column exists (but single-actor). |

**Authz/audit-trail risks:** SoD non-functional (needs accountant/finance_officer users to exist); dead uppercase allow-list entries make decorators *look* granular while runtime collapses to super_admin/director; **missing creator columns** on `finance_invoices` and `payroll_period_record`; empty `payments`/`cashier_movements` mean those audit trails are unverified by data.

---

## Overall financial-integrity verdict

**No — the numbers this system produces today cannot be trusted for a real financial decision or a statutory audit.** This is a build-stage system, and the untrustworthiness comes from a small number of concrete, nameable causes rather than a rotten core:

1. **The canonical ledger is polluted.** One garbage POS entry (`POS-GL-1` = 62.8 B UZS, ~99.8% of the entire GL) whose source movement has `total_amount=0` and `status='pending'` would grossly distort any trial balance, P&L, or balance sheet pulled today. Every aggregate report is currently meaningless because of this one row.
2. **The GL has four independent writers, and the safety controls live in the one writer that has produced zero live rows.** Period-lock and reference-idempotency are enforced only inside `GlPostingService`; the payroll, SD-invoice, and POS writers that carry the real data bypass them. So "the period is closed" is not currently an enforceable guarantee, and double-posting is possible on the POS path.
3. **Two subledgers report wrong non-zero numbers right now** (not empty-data): AR aging understates outstanding by ~85 M UZS and AP aging shows zero payables, because the aging handlers still read the legacy `fi_invoices` view instead of the canonical `finance_invoices`. The GL-module trial-balance flag is tautological and can never detect an imbalance.
4. **Multi-currency silently ages** behind a fake-success cron, with two rate tables that disagree and a POS path that books missing rates 1:1.
5. **Separation of duties is not operative** (only super_admin/director exist), and the two highest-stakes documents — invoices and payroll approvals — carry no creator/approver attribution.

**The important counterweight:** the *engines* are largely real. Double-entry decomposition, 3-way match at goods-receipt, FIFO COGS, standard-cost and 5-way variance, budget-vs-actual against real GL, reversal, period-lock logic, and the gated card-salary formula are all genuinely implemented and, where re-verified, balanced/correct in code. The dominant failure mode is **"logic built, wiring or data incomplete"** — consistent with SAP-CONFORMANCE-CHECK's own conclusion. Once the garbage row is purged, the writers are unified behind the single engine (so the controls actually bind), the aging handlers are pointed at the canonical invoice table, and master data is seeded, most of these engines would produce trustworthy numbers. **Today, they do not.**

---

## Top 10 highest-risk findings (ranked by money/legal exposure)

1. **62.8 B UZS garbage POS entry dominates the canonical ledger** (data + code gap). Source `pos_movements.id=1` has `total_amount=0`, `status='pending'`; GL amount is untraceable to source. Any TB/P&L/BS today is wrong. *[A2/A cross-cutting #5, F24]* — **purge the row; add amount-vs-source validation on POS→GL.**
2. **Multi-writer GL bypasses period-lock + idempotency; the engine that enforces them wrote 0 live rows** (architecture). Closed-period postings possible via the real writers; POS double-post possible. *[A1/A2/A4]*
3. **AR/AP aging reads legacy `fi_invoices`, not canonical `finance_invoices`** (code). AR understates ~85 M; AP blind to payables — wrong non-zero numbers today. *[B risk #1/#2]*
4. **FX silent staleness** behind a fabricated-success cron, + `currencies` vs `exchange_rates` divergence, + POS 1:1 rate default (code + data). Mis-valued foreign-currency bookings, invisibly. *[E21]*
5. **Payment-time three-way-match gate is absent** (code). A vendor/customer payment can be released with no match-status check — the original SAP gap, unchanged. *[B10]*
6. **Payroll tax rates disagree four ways** (24% / 20% / 13% / 0%) in a NaN-rendering calculator (code). Statutory-filing risk if a user trusts it. *Mitigated:* the real close path is gross-only, so the ledger is not corrupted. *[C11]*
7. **Separation of duties is inert** (config). Create≠approve never fires; everything collapses to super_admin/director (both admin-bypass). No real segregation on money movement. *[G26]*
8. **No creator attribution on `finance_invoices` (8 rows) and `payroll_period_record` (approver 0%)** (schema). A real audit cannot attribute invoice creation or payroll approval to anyone. *[G27]*
9. **Tautological GL trial-balance flag** always returns `balanced=true` (code). The one report meant to catch an out-of-balance ledger structurally cannot. *[F24]*
10. **Four disconnected payment tables, zero FK linkage** (code). Once payments flow, the approved row, the ledger row, and the invoice are three different unlinked records. *[B9]*

*Honorable mentions:* salary-payout `/pay` unreachable from the UI (D19); best-effort POS→`entries` mirror that swallows ledger-write failures (D17); fragile free-text budget-actuals join + per-line actuals never written (F22); aging thresholds hardcoded ×4 across two incompatible bucketings with self-inconsistent ECL (B7); `entries` FK-type schema drift (integer live vs varchar Drizzle).

---

## What has genuinely improved since SAP-Conformance and Magic-Numbers (verified, with commits)

- **M3 — AR overdue is now a real SUM, not `total*0.3`** (`9919dc92`). Verified live: the fabrication is gone from `financial-reports-query.helpers.ts`; only a comment remains. ⚠️ **MAGIC-NUMBERS-AUDIT-V2 line 131 is now stale** and should be struck.
- **M2 — `exchange_rates` seeded 0 → 4; DB read path now wins; honest fallback logging** (`31c6953c`). The core "empty table, always stale constant" finding is resolved for the finance endpoint (though the feed/staleness problem remains — see Part E).
- **Q1 — `POST /finance/gl-entries` posts to canonical `entries`** (`87f7e883`); **Q2 — real GL reversal mirror** (`1462bef9`). Both verified in code.
- **POS → canonical `entries` bridge** (`f846a393`) + **AWAITING_REVIEW bypass closed** (`f849c6f4`). POS is no longer an isolated subledger — `pos_gl_postings`=0 and POS rows are in `entries` (via the older writer; see A2 caveat).
- **Payroll gated card-sum wired into close** (`3f1357c5`, `056a14c2`); **Finance payroll-close proxies HR `closePeriod`** (`de4bb5be`); **bonus wired to real approval chain** (`68931eac`, `025c356a`); **GL-before-close atomic ordering** verified (C14). The HR-audit's top "preview-only" finding is code-resolved (data still empty).
- **MM three-way match computes real matched/variance** (`fad2c7f8`) — at goods-receipt (not payment; B10 still open).
- **Podotchet AI-OCR + human-confirm + FE profile wiring** (`e85cbea7`, `fa257fac`, `f21bbb7b`). The prior "orphaned" podotchet finding is **resolved** (D18).
- **`finance_invoices` made the canonical invoice source** (`d6286993`) — but only in the repositories, not the aging handlers (B risk #1, the regression that this half-migration created).
- **Canonical budgets repo dedup** (`a77c62db`); **profitability logic moved out of controller** (`3857bfcb`); **500-on-error honesty** (`9a144dc2`); **real FIFO batch cost into COGS GL** (`121560a3`); **cashier USD+UZS + X/Z USD→UZS conversion** (`c8fbe2ab`, `3d76951d`). All re-verified in code.

---

## Empty-data (seed later) vs genuine code defect (write code) — kept separate

**EMPTY-DATA — code is real and structurally sound, simply unexercised (fix = seed / operate, NOT rewrite):**
- `GlPostingService` itself has posted **0** rows; `accounting_periods`=0 → period-lock never exercised (A1/A4).
- `payments`/`finance_payments`/`customer_payments`/`invoice_payments`=0 → invoice-payment linkage & status-flip logic unexercised (B9).
- `payroll_rows`=0 → gated close never ran; `ckp_fact_values`=0 → gates pay 0; `bonus_payments`/`payroll_advances`=0 (C12/C13/C15).
- `cashier_movements`=0, one perpetually-open shift → shift-close & cashier-GL unexercised (D16/D17). *(Note: partly gated by the missing `pin_hash` column — see below, which is a code item.)*
- `budgets`/`budget_lines`=0, `order_costings`=0, `standard_cost`=0, `profit_centers`=0, `cost_centers`=1 placeholder → budgeting/costing engines dormant (F22/F23/F25).
- `expense_reports`/`advance_reports`=0 → podotchet flow unexercised (D18).
- FX: the 4 `exchange_rates` rows are a one-time seed — the *read* path is real; only *freshness* is unproven (borderline; the missing feed is a code item — E21).

**GENUINE CODE DEFECTS — present regardless of data (fix = write/change code):**
- Four GL writers; period-lock + idempotency only inside the unused engine (A1/A2/A4). Two POS→entries writers with non-shared dedup keys (A cross-cutting #3). `entries` FK schema drift integer↔varchar (A #4). POS→GL posting amount not validated against source `total_amount` (A #5).
- `postVendorPayment` / GL `postGoodsReceipt` still zero callers (A3).
- Aging handlers read legacy `fi_invoices` not canonical `finance_invoices` (B risk #1/#2); third invoice source in `getOutstandingPayment` (B risk #3); four payment tables, no FK (B9); aging thresholds hardcoded ×4 across two bucketings + self-inconsistent ECL (B7); **no payment-time 3-way gate** (B10).
- Payroll tax 4-way disagreement + FE↔BE `inpsAmount`/`incomeTax` key mismatch → NaN (C11); mark-close not transactional (C14, cosmetic).
- POS→`entries` mirror swallows ledger-write failures (D17); **`/salary-payouts/pay` has no FE caller** (D19); **no `users.pin_hash` column** so every PIN-gated cashier movement is blocked (D-risk #4 — code/schema item).
- FX **fake-success cron stub** (`currency-rates.cron.ts:13-27`), no `updated_at`, `currencies` vs `exchange_rates` divergence, POS 1:1 rate default (E21).
- **Tautological GL trial-balance** (`drizzle-finance-gl.repo.ts:83-94`), P&L revenue mis-sided, balance-sheet debit-only (F24); budget free-text join + per-line actuals never written (F22); variance masking substitutes standard for missing actuals (F23); no cost-center allocation engine + no `cost_center_id` on `entries` (F25).
- SoD inert — depends on unprovisioned roles (G26; config/data item); **missing `created_by` columns** on `finance_invoices` and `payroll_period_record`, `approved_by` 0% (G27 — schema item).

**DATA-CLEANUP (neither seed nor rewrite — purge):** the 62.8 B `POS-GL-1` garbage row.

---

*Investigation only. No code, migration, seed, or commit was performed. All live figures are from read-only queries against `europrint` on 2026-07-06; re-run `node _audit/q.cjs "…"` to reproduce.*
