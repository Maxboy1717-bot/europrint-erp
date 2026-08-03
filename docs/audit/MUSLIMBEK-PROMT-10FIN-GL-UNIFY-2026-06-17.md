# DIRECTIVE — #10 FIN (continued): UNIFY ALL canonical `entries` GL writers

> Advisor (Claude) → Executor (Muslimbek). Owner-approved 2026-06-17 ("Hozir to'liq tuzatamiz" = full unify).
> Context: the #10 GL.* CoA remap (commit `8bb2eef8`) is CORRECT and stays. This directive finishes #10 — the remap
> fixed only the `gl-posting.service` path, but the canonical `entries` ledger has OTHER live writers that bypass
> GL.* and write wrong/nonexistent codes. Advisor-verified against code + live DB (workflow w833vwooa + manual).

---

## RULES BLOCK (read first — every executor prompt)
- **Role:** You are the EXECUTOR (🟢). You write code + commit. Do EXACTLY this task; no extra fixes/refactors/next-steps beyond what's listed (no-scope-creep). Carry only correctness rails.
- **Q-30/Q-45:** No JWT/token minting. Secrets never printed. Log files NEVER committed (`backend.log*`, `*.log.*`). `git add <exact-file>` only — NEVER `git add -A`/`.`.
- **Q-35 / DDL:** This task should need NO new tables. If you believe a `CREATE TABLE`/`ALTER` is required, STOP and show the SQL to the owner first (`APPROVED:` comment). Do not run DDL silently. **Do NOT drop the `entries.debit_account`/`credit_account` text columns** (that's DDL + may break readers) — just stop writing to them as the source of truth and populate the `_id` columns.
- **SAP #76:** `gl_journal_entries` / `gl_lines` = DON'T TOUCH (separate ledger). Canonical money ledger = `entries`.
- **Style:** Result<T> pattern (no raw throw), Array.isArray guards, Zod for new DTOs, `typedExecute<T>` for raw SQL, files ≤900 / functions ≤150 lines.
- **Q-40 (ishlaydi ≠ to'g'ri):** A 200/green response is NOT proof. Prove each fix with a DB-level rollback test (BEGIN/ROLLBACK) showing the row lands with the CORRECT account IDs + balanced.
- **Self-verify is the gate (Q-38):** finish → run the proofs below → report done/defer/commits. The advisor will independently re-verify live.

---

## THE ONE-ENGINE PRINCIPLE (the target convention)
There must be **ONE posting engine** for the canonical `entries` table: `GlPostingService`
(`apps/api/src/modules/finance/domain/services/gl-posting.service.ts`). It already does the correct thing —
resolves GL.* codes → `accounts.id` via the repo's `resolveAccountIds`, validates `ΣDR==ΣCR`, decomposes the
journal into **balanced pair-rows** written to `entries.debit_account_id` / `credit_account_id` (INT).

Every write to `entries` MUST go through this engine and populate the `_id` columns. The text columns
(`debit_account`/`credit_account`) must NOT be the source of truth.

**Enabling step:** `createJournalEntry(lines, reference)` is currently `private`. Add a thin **public** method
so other modules can post a balanced multi-leg journal through the same engine, e.g.:
```ts
async postJournal(lines: JournalLine[], reference: string): Promise<Result<number>> {
  return this.createJournalEntry(lines, reference);
}
```
(JournalLine = { accountCode, accountName, debit, credit }.) Reuse this everywhere below.

---

## FIXES (priority order)

### P0-A 🔴 — HR payroll closure (LIVE, corrupts `entries` on every period close)
Files: `apps/api/src/modules/hr/payroll/payroll-closure.service.ts` (PAYROLL_GL_ACCOUNTS:49, buildJournal:117),
`apps/api/src/modules/hr/payroll/drizzle-hr-payroll.repo.ts` (insertGlJournalLines:96-115),
caller `apps/api/src/modules/hr/payroll/payroll.service.ts:74,85`.

**Verified defects:** codes `6720`/`6760`/`6730` DO NOT EXIST in live `accounts`; `6710` is a *payable* used as
*expense*; and `insertGlJournalLines` writes `debit_account = credit_account = line.account` (SAME account on
both sides = self-canceling) into the text columns, `_id` NULL.

**Fix:**
1. Correct `PAYROLL_GL_ACCOUNTS` to live codes (all verified present + correct type in `accounts`):
   - `EXPENSE_SALARY` → **9410** (Ish haqi, EXPENSE)
   - `EXPENSE_BONUS`  → **9410** (fold into salary expense) — *unless* a distinct bonus/premium EXPENSE account
     exists in the 42-row chart; check `SELECT account_code,account_name FROM accounts WHERE account_type='EXPENSE'`
     and use it if present, else 9410 with a comment.
   - `LIABILITY_TAXES` (deductions INPS/JSHD) → **6520** (LIABILITY)
   - `LIABILITY_NET` (net payable) → **6710** (Xodimlarga ish haqi, LIABILITY)
   - `buildJournal`'s balance logic is already correct (base+bonus == deductions+net); keep it.
2. Replace `insertGlJournalLines`'s per-leg same-account text INSERT. Instead, in `payroll.service.ts`, map the
   `GlJournalLine[]` from `buildJournal` into `JournalLine[]` and call `GlPostingService.postJournal(lines, \`PR-${periodId}\`)`.
   This resolves codes → `_id` and writes balanced pair-rows. Inject `GlPostingService` into the payroll module
   (add to providers/imports as needed). Then delete (or make delegate) the old `insertGlJournalLines` text path.
3. Keep idempotency: don't double-post a period already closed.

### P0-B 🔴 — Finance invoice posting (LIVE endpoint, text labels into `entries`)
Files: `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo.ts` (postInvoiceWithGl:~210-292),
caller `apps/api/src/modules/finance/presentation/finance-invoices.controller.ts:131`.

**Verified defect:** inserts text labels `'accounts_receivable'`/`'revenue'`/`'tax_payable'` into
`entries.debit_account`/`credit_account`, leaves `_id` NULL → invisible to id-based trial balance; bypasses GL.*.

**Fix:** the GL legs must come from `GlPostingService.postSalesInvoice(invoiceId, amount, tax)` (DR AR(amount+tax) /
CR Revenue(amount) + CR VAT(tax), resolved to `_id`). Repos must NOT depend on services, so move the GL-posting
orchestration OUT of the repo into the application/controller layer:
- The controller (or a finance application service) does: (a) idempotency check (invoice already 'posted' → skip),
  (b) `GlPostingService.postSalesInvoice(...)`, (c) flip `fi_invoices.status='posted'` via the repo.
- The repo keeps only data ops (find invoice, update status). Remove the bespoke text-label INSERT.

### P1 🟠 — Wire the orphaned correct methods (GR / VP / MC)
`GlPostingService.postGoodsReceipt` / `postVendorPayment` / `postMaterialConsumption` are correct but **never called**.
- Goods receipt: when MM posts a goods receipt (`#09` path, `drizzle-mm-goods.repo` / `queries-mm-goods.execPostGoodsReceiptStock`),
  also post the GL leg `DR Inventory / CR AP` via `GlPostingService.postGoodsReceipt(grId, amount)`.
- Material consumption (goods issue): on goods-issue, post `DR COGS / CR Inventory` via `postMaterialConsumption`.
- Vendor payment: on AP payment, post `DR AP / CR Cash` via `postVendorPayment`.
- If any trigger requires cross-module event wiring beyond a direct service call, do the direct call where the
  action completes. If a trigger genuinely cannot be reached without new infra, DEFER that one with a written
  reason in the report (don't fake it).

### P2 🟠 — POS auto-gl-posting subledger (separate table `pos_gl_postings`, NOT `entries`)
File: `apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts:19-64`.
**Verified:** local `GL_ACCOUNTS` uses nonexistent `6010`/`4010`/`9110`/`1020`/`1030`; INTERNAL_TRANSFER self-washes
`1010` (DR==CR same account); INVENTORY_ADJUST routes through `9430` (= Amortizatsiya/depreciation, wrong).
**Fix:** correct the codes to live equivalents — AP **6000**, AR **4000**, COGS **9100**, REVENUE **9010**;
WAREHOUSE_RM keep **1010** (exists = Xom ashyo). For WIP/FG (`1020`/`1030` absent), INTERNAL_TRANSFER (self-wash),
and INVENTORY_ADJUST (use a real inventory/shortage account, NOT depreciation 9430): pick the closest real account
from the live chart and comment it; if no suitable account exists, FLAG it in the report for the owner — do NOT
invent a code. (This subledger doesn't pollute canonical `entries`, but must stop using nonexistent codes.)

### P3 🟡 — Latent / cleanup
- `saveGlEntry` (drizzle-finance-invoice.repo.ts:294) uses `source_type` as `debit_account`, single-sided, no
  validation. It is NOT reachable from any controller (latent). Either route it through `GlPostingService` or add a
  guard + comment that it's unreachable. Low priority — quick fix or defer-with-reason.
- Fake-green: `finance-extended-income.controller.ts:109` (asset-inventory/summary hardcoded zeros) and `:156`
  (ai-finance-insights hardcoded empty). Replace with a real query/service OR honest `501 NOT_IMPLEMENTED` /
  `{items:[],total:0}` — no fabricated money data. Low priority — fix or defer-with-reason.

---

## SELF-VERIFY GATE (run before reporting)
1. `pnpm --filter @europrint/api exec tsc --noEmit` → 0 errors. Reviewers (`bash scripts/run-all-reviewers.sh`) no new FAIL.
2. **DB-proof (BEGIN/ROLLBACK), each must show `_id` columns set + balanced:**
   - Payroll close: simulate a period close → assert `entries` rows have `debit_account_id`/`credit_account_id`
     resolved to 9410/6520/6710 (NOT equal to each other, NOT NULL), ΣDR==ΣCR.
   - Invoice post: post a sales invoice → assert `entries` rows DR AR(4000) / CR Revenue(9010) + VAT(6310) by `_id`,
     `debit_account`/`credit_account` text either NULL or consistent, balanced.
   - Goods receipt (if P1 wired): DR Inventory(1000) / CR AP(6000) by `_id`.
3. `node scripts/golden-thread-chain-proof.cjs` → exit 0 (no regression).
4. `gl_journal_entries` / `gl_lines` untouched (grep your diff). No DDL ran (or DDL was owner-approved + shown).
5. Login intact: health 200, `POST /api/auth/login {}` → 401/422.

## COMMIT + REPORT
- `git add <exact files>` only. Commit message: `fix(finance): #10 unify entries GL writers — payroll+invoice+GR/VP/MC through GlPostingService (resolveAccountIds→_id, balanced)`.
- Report: what was fixed vs deferred-with-reason (per item P0-A..P3), commit hash(es), the DB-proof outputs,
  harness exit, login codes. Then stop — advisor re-verifies live before #11.
