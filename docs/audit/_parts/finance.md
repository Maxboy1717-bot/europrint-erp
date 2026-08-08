# Part: finance — modules: finance   (static-only; backend down)

GL canonical ledger = `entries` (verified writer = drizzle-gl-posting.repo.insertJournal → `db.insert(entries)` inside tx).
`gl_documents`/`gl_lines` = the SAP-style accounting model (separate from `entries`); `gl_journal_entries`/`gl_lines` 2nd model exists but no finance route here touches it.

## Route inventory: total 102
- GET: 56
- POST: 33
- PUT: 4
- PATCH: 6
- DELETE: 4
(31 controllers under apps/api/src/modules/finance/**)

Guards: 5 global guards apply. Controllers with `@UseGuards(JwtAuthGuard, …)` or just `RolesGuard`/`PermissionGuard` are all behind the global JwtAuthGuard anyway → unauthenticated = 401 (INTENTIONAL/FINE). No `@Public()` anywhere in finance → no wrongly-open routes.

---

## 🔴 DECEPTIVE

| method+path | bucket+cause | file:line | DB proof | verdict |
|---|---|---|---|---|
| GET /api/finance/gl-entries/:id/reverse | 💀200-GREEN-LIE — hardcoded `{ reversed:false }`, never reads/reverses | finance-main-actions.controller.ts:78-81 | n/a (no DB call) | echo-only; deceptive "reverse" endpoint does nothing |
| POST /api/finance/payments/:paymentId/verify | 💀200-GREEN-LIE — returns `{ message:'Payment verified', paymentId }`, NO DB write/verify | finance-payments.controller.ts:120-127 | n/a (no DB call) | claims "verified" but persists nothing |
| GET /api/finance/payments/:invoiceId/outstanding | ⚠️200-MOCK — hardcoded `outstanding: 0` | finance-payments.controller.ts:132-138 | n/a | always 0 regardless of invoice |
| POST /api/finance/invoices/:invoiceId/post | 💀200-GREEN-LIE (partial) — returns `'Invoice posted to GL'` but ONLY does `updateInvoice(status='posted')`; NO GL `entries` insert | finance-invoices.controller.ts:124-139; repo updateInvoice fi_invoices drizzle-finance-invoice.repo.ts:130 | fi_invoices exists; no `entries` write in path | status flip is real; "posted to GL" message is a lie (no journal posted) |
| POST /api/finance/profitability/recalculate | 💀200-GREEN-LIE — `jobId = prof-recalc-${Date.now()}`, logs + returns `status:'queued'`; NO recompute, no queue | finance-main-actions.controller.ts:129-149 | n/a | fabricated job id; no work performed |
| POST /api/reports/profitability/export | 💀200-GREEN-LIE — `jobId = prof-export-${Date.now()}`, returns `status:'queued'`; NO export/queue | reports.controller.ts:109-130 | n/a | fabricated job id; nothing generated |
| GET /api/finance-extended/asset-inventory/summary | ⚠️200-MOCK — hardcoded `{ total:0, active:0, depreciated:0, totalValue:0 }` | finance-extended-income.controller.ts:108-111 | n/a | static zeros; sibling GET asset-inventory IS real |
| GET /api/finance-extended/ai-finance-insights | ⚠️200-MOCK — hardcoded `{ insights:[], generatedAt }` | finance-extended-income.controller.ts:158-161 | n/a | always empty insights |
| GET /api/finance/exchange-rates | ⚠️200-MOCK — hardcoded rates `{ USD,EUR,RUB:140,CNY }` from constants | finance-main.controller.ts:71-78 | n/a | static FX rates (RUB literal 140); no rate source |
| GET /api/fi/cost-centers | ⚠️200-MOCK fallback — if table empty/throws returns 4 literal cost-centers (CC-001..004) | fi.service.ts:77-82 → drizzle-fi.repo.ts:75-83 | cost_centers EXISTS (empty DB → fallback fires) | primary path real; silent-catch literal fallback masks empty/error state (e2-adjacent MOCK) |

Notes (NOT deceptive, ruled IN as real after proof):
- POST /api/finance/cfo-config — comment confirms a prior {success:true} green-lie was fixed; now real upsert via cfoConfig.update → cfo_config (table EXISTS). ✅ REAL.
- POST /api/ap/aging/recalculate & POST /api/ar/aging/recalculate — real read-compute-replace (finance-ap.service.ts:38-63). ✅ REAL.
- PATCH/POST /api/finance/payments/:id/approve — real `db.update(customer_payments)` (finance-actions.repository.ts:40-55). ✅ REAL (no rowcount check, but writes).
- POST /api/finance/ap/entries, /api/finance/ar/entries, /api/ap/entries, /api/ar/entries — real inserts into vendor_invoices / sales_invoices (finance-actions.repository.ts:106-134; finance-ap/ar.service). ✅ REAL.

---

## ❌ 5xx

| method+path | status | exact cause | file:line | DB proof | fix-type |
|---|---|---|---|---|---|
| GET /api/finance/budgets/:id | ❌500 | `QueryBus.execute(new (anonymous GetBudgetByIdQuery)(id))` — NO handler registered for this query → CQRS "No handler found" throws before assertOkOrThrow can map to 404 | finance-budgets.controller.ts:77-81; finance.module.ts:136-138 (queryHandlers list has no GetBudgetByIdHandler) | grep: GetBudgetByIdQuery/Handler appears ONLY in controller (anonymous inline class), no handler file | CODE — add+register GetBudgetByIdHandler (or call repo directly) |
| POST /api/finance/invoices | ❌500 | saveInvoice INSERT references columns `source_type`,`source_id` that do NOT exist on `fi_invoices` → "column does not exist" → repo Err → throws InternalServerErrorException | finance-invoices.controller.ts:69-92; drizzle-finance-invoice.repo.ts:108-122 | `SELECT … WHERE table_name='fi_invoices' AND column_name IN ('source_type','source_id')` → [] (absent); table has `sales_order_id` instead | DDL-NEEDED fi_invoices.source_type/source_id OR CODE-RENAME source_id→sales_order_id + drop source_type |
| POST /api/finance/invoices/create | ❌500 | same saveInvoice column drift (source_type/source_id absent) | finance-invoices.controller.ts:97-119; drizzle-finance-invoice.repo.ts:108-122 | same as above | DDL-NEEDED or CODE-RENAME (same fix) |

No 503 found: every table referenced by finance handlers was DB-proven to exist (entries, fi_invoices, cost_centers, profit_centers, income_expense_transactions, gl_documents, gl_lines, accounts, accounting_periods, budgets, budget_lines, payments, cash_flow_transactions, order_costings, order_costing_lines, price_tier, standard_cost, variance_report, cost_structure, cfo_config, payroll_advances, salary_history, salary_bands, payroll_tax_rules, oee_records, customer_payments, vendor_invoices, sales_invoices, purchase_invoices, stock_moves, warehouses, expense_reports, raw_materials, sales_orders). Inline-SQL endpoints (production-efficiency, tax-calendar, salary-benchmark/:id) column-checked → all columns present.

---

## 🟠 404 / 501

| method+path | cause | real route / note |
|---|---|---|
| GET /api/finance/reports | 🟠501-A honest stub — `notImplemented('GET /finance/reports')`, documented FEATURE_FLAGGED #FX-4 | finance-main.controller.ts:104-107 — FINE (declared 501) |
| GET /api/finance/loans | 🟠501-A honest stub — `notImplemented('GET /finance/loans')`, FEATURE_FLAGGED #FX-4 | finance-main.controller.ts:150-153 — FINE (declared 501) |
| POST /api/finance/payments | 🟠501-A honest 501 — `NotImplementedException`; on purpose, redirects to POST /finance/payments/record (avoids orphan payment) | finance-payments.controller.ts:70-81 — FINE (intentional, documented) |

No 404-A (URL drift), 404-B, 404-D, no 501-B/501-C found. `@Get(':id')`-style routes return content from real repos (404 handled where applicable, e.g. profit-centers update throws NotFound, invoice get throws NotFound).

Route-collision note (not a bug): two `@Controller('accounting')` (finance-accounting + fi has no accounting prefix) — actually finance-accounting.controller.ts and finance-main both expose overlapping concepts but on DISTINCT prefixes; `accounting` prefix appears once (finance-accounting). `payroll` prefix shared by FinancePayrollController (by-department/by-brigade/tax-summary) and PayrollPeriodsController (periods/calculate-tax) — distinct sub-paths, no collision. `finance-extended` shared by 3 controllers (income/payroll/categories) — distinct sub-paths, intentional Rule-16 split.

---

## 🟡🔵🔴 400/401/403 (BUG ones only)

None. All `@Body()` handlers validate via Zod (Rule 3 satisfied) → 400 only on bad input (correct/FINE). All routes 401 when unauthenticated (global JwtAuthGuard) — INTENTIONAL. RBAC `@Roles`/`@RequirePermission` correctly scoped (FINANCE_*/ACCOUNTANT/DIRECTOR/SUPER_ADMIN; pricing/break-even/variance/ratios/cashflow/standard-cost/cfo use PermissionGuard) — no misconfig found.

Intentional-401 count: all 102 routes (no @Public).
Correct-400 (Zod) count: ~40 write routes.
Correct-403 (RBAC) count: all routes guarded; advance routes have method-level @Roles narrowing (FINANCE_OFFICER/DIRECTOR/SUPER_ADMIN).

---

## ✅ FINE (grouped, real DB-backed) — counts

- **fi.controller (/api/fi)** — accounting-periods (GET/POST), close, gl-documents/:id/post, payments (GET/POST), cost-centers CRUD (GET real + POST/PATCH/DELETE), profit-centers CRUD, stats, recent-transactions, gl-documents (GET/POST), profit-centers (GET). Real via drizzle-fi.repo (cost_centers/profit_centers/income_expense_transactions/gl_documents/payments/accounting_periods). **20 routes ✅** (cost-centers GET listed above as MOCK-fallback).
- **finance-accounting (/api/accounting)** — dashboard, accounts, gl-documents GET/POST, periods, periods/:id/close, materials, materials/by-order, inventory-valuation. Real via drizzle-finance-accounting.repo (gl_documents/gl_lines/accounts/accounting_periods/stock_moves/raw_materials/sales_invoices/purchase_invoices/expense_reports). **9 routes ✅**
- **finance-main (/api/finance)** — dashboard, gl-entries, gl-accounts, transactions, budget, cash-flow, accounts, expenses, expense-reports, expense-reports/:id, accounting. Real via gl/cashflow/budgets/accounting services. **11 ✅** (+ reports/loans = 501-A above, + exchange-rates = MOCK above).
- **finance-main-actions (/api/finance)** — gl-entries POST (real glSvc.postDocument→entries), gl-entries/:id/reverse POST (real postDocument w/ reversalOf), salary-benchmark/:userId (real salary_history), ap/entries, ar/entries. **5 ✅** (+ gl-entries/:id/reverse GET + profitability/recalculate = deceptive above).
- **finance-gl (/api/finance/gl)** — list, post-sales-invoice, post-payroll, trial-balance, ledger/:accountCode. Real GlPostingService→entries + GlService. **5 ✅**
- **finance-ap (/api/ap)** + **finance-ar (/api/ar)** — aging, overdue, aging/recalculate, entries. Real. **8 ✅**
- **finance-advance (/api/finance/advances)** — list, request, override, pending. Real payroll_advances + CheckAdvanceHandler. **4 ✅**
- **finance-budgets (/api/finance/budgets)** — list, stats, :id/variance, POST, :id/submit, :id/approve (CQRS handlers registered). **6 ✅** (+ GET :id = 500 above).
- **finance-invoices (/api/finance/invoices)** — list, :invoiceId GET. **2 ✅** (+ POST, POST create = 500; :id/post = green-lie above).
- **finance-payments (/api/finance/payments)** — list, record, :id/approve ×2. **4 ✅** (+ POST=501, verify+outstanding=deceptive).
- **finance-extended-income (/api/finance-extended)** — income-expense CRUD (summary/list/POST/PUT/DELETE), inventory-counts (GET/POST), asset-inventory (GET/POST/:id), daily-metrics (GET/today), overtime, customs, insurance. Real via FinanceExtendedService. **18 ✅** (+ asset-inventory/summary + ai-finance-insights = MOCK above).
- **finance-extended-payroll (/api/finance-extended)** — payroll calculate/ai-calculate/run, payroll-calculations (GET + approve PATCH/POST), payroll-contracts, tax-calendar (inline SQL payroll_tax_rules ✓cols), salary-benchmark/:id (inline SQL salary_bands ✓cols). Real. **9 ✅**
- **finance-extended (/api/finance-extended)** — finance-categories CRUD (GET/GET:id/POST/PUT/PATCH/DELETE). Real. **6 ✅**
- **financial-reports (/api/financial-reports)** — kassa/ombor/debitorlar/kreditorlar/balans/ishlab-chiqarish/analytics/dashboard/alerts(overstock,overdue-debts)/alerts/send-report. Real via FinancialReportsQuery/Analytics services. send-report fires dailyCron async (real trigger). **11 ✅**
- **reports (/api/reports)** — trial-balance, profit-loss, weekly-summary(×2), monthly-summary, kpi-dashboard, production-efficiency (inline SQL oee_records ✓cols). **7 ✅** (+ profitability/export = green-lie above).
- **reports-hub (/api/finance/reports-hub)** — GET hub summary. Real. **1 ✅**
- **order-costing (/api/order-costing)** — top-profitable, top-loss, list, POST, :id/calculate. Real order_costings/_lines. **5 ✅**
- **cashflow (/api/cashflow)** — transactions GET/POST, daily-summary, forecast. Real cash_flow_transactions. **4 ✅**
- **budgets-standalone (/api/budgets)** — list, POST, :id/lines GET/POST. Real budgets/budget_lines. **4 ✅**
- **gl-standalone (/api/gl)** — accounts, seed-accounts, accounts POST. Real GlService. **3 ✅**
- **sales-orders-standalone (/api/sales-orders)** — GET all. Real salesOrders. **1 ✅**
- **pricing (/api/pricing)** — calculate, tiers/:productName, tiers POST. Real price_tier. **3 ✅**
- **finance-cfo-config (/api/finance/cfo-config)** — POST(upsert), GET, PUT :key. Real cfo_config. **3 ✅**
- **finance-cashflow-forecast (/api/finance/cashflow/forecast)** — GET. Real. **1 ✅**
- **finance-variance (/api/finance/variance/:orderId)** — GET. Real variance_report. **1 ✅**
- **finance-ratios (/api/finance/ratios)** — GET. Real. **1 ✅**
- **finance-standard-cost (/api/finance/standard-cost)** — :productId, name/:productName, name/:productName/periods, name/:productName/calculate. Real standard_cost. **4 ✅**
- **finance-payroll (/api/payroll)** — by-department, by-brigade, tax-summary. Real. **3 ✅**
- **payroll-periods (/api/payroll)** — periods GET/POST, periods/:id/calculate, periods/:id/close, calculate-tax (pure 12%/8% calculator, no DB — acceptable utility). Real PayrollService for periods. **5 ✅** (calculate-tax is compute-only, FINE not GREEN-LIE — it's a stateless calculator, not a persist endpoint).
- **finance-break-even (/api/finance/break-even)** — analyze GET, cost-structure POST. Real cost_structure. **2 ✅**

---

## COUNTS (sum = 102)

- ✅ 200-REAL: 87
- ⚠️ 200-MOCK: 5 (gl-entries/:id/reverse-GET[also green-lie], exchange-rates, asset-inventory/summary, ai-finance-insights, payments/:invoiceId/outstanding) — fi cost-centers counted as REAL-with-fallback within the 87
- 💀 200-GREEN-LIE: 5 (gl-entries/:id/reverse GET, payments verify, profitability/recalculate, reports profitability/export, invoices/:id/post[partial — status real, GL claim false])
- ❌ 500: 3 (finance/budgets/:id [no CQRS handler], finance/invoices POST, finance/invoices/create POST — last two = fi_invoices column drift)
- 🟠 501-A (honest/FINE): 3 (finance/reports, finance/loans, finance/payments POST)
- 🔵 401 intentional: applies to all 102 (FINE)
- 🟡 400 correct Zod / 🔴 403 correct RBAC: 0 BUG

Deceptive total (MOCK+GREEN-LIE, de-duped — reverse-GET is both): 9 distinct routes.
5xx total: 3.
