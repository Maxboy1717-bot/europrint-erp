# EuroPrint ERP — Full Codebase Audit, Round 2: Executive Summary

**Audit date:** 2026-05-27
**Auditor:** Senior Software Audit Agent (second pass)
**Scope:** All 23 phase reports — monorepo architecture, database, auth, HR, Finance, POS, Inventory, Sales, Production, Procurement, Kanban, Reports, Notifications, i18n, Frontend, API, Testing, Dead Code
**Codebase snapshot:** EuroPrint-Clean (TypeScript · NestJS 11 / Fastify 5 · React 19 / Vite 7 · Drizzle ORM · PostgreSQL · pnpm 9)
**Verified counts (this pass):** 16,242 TS/TSX source files · 50 NestJS module directories · 338 controller files · 122 Drizzle schema files · 957 unique `pgTable` declarations vs 951 live DB tables · 271 `notImplemented` references · 14 `Math.random` references in API source · 102 TODO/FIXME markers

---

## 0. How to read this round-2 audit

Every finding below is tagged with one of three relationship-to-round-1 markers:

- `[CONFIRMED]` — round 1 said this; round 2 verified against current code and it still holds.
- `[CHANGED]` — round 1 raised a related issue, but the underlying code has shifted (sometimes fixed, sometimes replaced by a different bug). The net production impact is described.
- `[NEW]` — round 1 missed this entirely.

The biggest single insight of this re-audit is that round 1's loudest P0 findings — `Math.random()` invoice IDs, the `createJournalEntry` no-op, the OTP 404, the hardcoded ABC score — **have all been partially or fully addressed in the two weeks since**. But the patterns that produced them are still alive, and in several cases the "fix" introduced a different bug with identical end-user impact (e.g. invoice IDs are now real but written to columns that don't exist; GL journal entries now INSERT but with `'OFFSET'` string literals where account IDs should go).

If you only have time for one section, read §1 (current P0s) and §10 (remediation roadmap).

---

## 1. P0 critical findings (system-breaking, as of 2026-05-27)

Eleven defects that silently corrupt data, return fabricated results, or break a primary user flow. Each is tagged with both a severity and a round-1 relationship. Where a round-1 P0 has been resolved, it is moved to §2 with explanation.

### P0-01 · Finance GL — Journal entry writes string literals into FK columns [CHANGED]

**File:** `apps/api/src/modules/finance/gl-posting.service.ts:85-120` (edited 2026-05-27 13:06)

Round 1's `Math.random()` return is gone. The method now iterates lines and calls `glPostingRepo.insertEntry()` per line. But the new code writes the string literal `'OFFSET'` into `entries.debitAccountId` / `entries.creditAccountId`, which are varchar FKs to `accounts.id` (serial integer, values 1000+). Every call fails with FK type mismatch at runtime. **Net production impact is unchanged from round 1:** GL postings still do not persist. The diagnosis was simply wrong.

Cross-effects: `getTrialBalance` always returns `balanced: true` because both `*_account_id` columns are non-null on every row (one side is `'OFFSET'`), so the two SUMs are arithmetically equal regardless of actual debit/credit. `findProfitLoss` and `queryBalanceSheet` join only on `entries.debitAccountId = accounts.id` for both revenue *and* expense; since revenue is credited, **total revenue is always reported as 0**.

### P0-02 · Finance AR/AP — Invoice INSERT references columns that do not exist [NEW]

**File:** `apps/api/src/modules/finance/finance-invoices/infrastructure/finance-invoice.repository.ts` (`saveInvoice`)

Round 1's `Math.random()` invoice ID is fixed (commit `75fc8a2f`, "fix(finance): replace Math.random stubs with real DB writes"). `FINANCE_RANDOM_REF_RANGE` no longer appears anywhere in finance code. But `saveInvoice` INSERTs eight columns (`source_type`, `source_id`, `total_amount`, `paid_amount`, etc.) that exist neither in the Drizzle schema (`schema-business-b-2.ts:61`) nor in the migration seed (`migrations-drift.ts:1955`). Every successful invoice create on a fresh DB will throw `column does not exist`. The bug was visible in round 1's snapshot but the fix was applied to the wrong layer.

Additionally: `RecordPaymentHandler` writes `fi_payments` and `gl_journal_entries`, but never persists the new `paid_amount` / `status` back to `fi_invoices`. AR aging therefore continues to show the full balance as outstanding after every payment.

### P0-03 · HR Payroll — Five primary UI routes return HTTP 501 [NEW]

**File:** `apps/api/src/modules/hr/payroll/finance-extended-payroll.controller.ts`

All 5 `FinanceExtendedPayrollController` routes return HTTP 501. Yet the entire `PayrollAutomation.tsx` page — the main payroll UI — calls 3 of them as its primary data source. The user-facing payroll automation screen has no working backend. Round 1 missed this because it focused on `insertGlJournalLines`, which (it turns out) *does* INSERT correctly into `gl_journal_entries`. Round 1's P0 here was based on a stale snapshot.

Adjacent: `HrPayrollController.postToGL` only flips status to `'paid'` — does not post to GL despite the name. `use-hr-payroll.ts` calls `/api/hr/payroll/periods`, a route that does not exist in any controller.

### P0-04 · Auth — OTP verification never issues a token [CHANGED]

**Files:** `apps/api/src/modules/auth/application/services/verify-otp.service.ts`; `artifacts/erp-dashboard/src/components/auth/LoginForm.tsx:37,55`

Round 1's "OTP routes return 404" claim is outdated. `LoginForm` now calls `/api/auth/resend-otp` and `/api/auth/verify-otp`, which **do** exist (registered in `auth-account.controller.ts:60,71`). However, `VerifyOtpService` returns `{success, message}` and **never issues a JWT or sets a cookie**. There is no SMS gateway anywhere in the codebase. The comment in the controller claiming the server sets an `access_token` cookie is false. The phone+OTP login path therefore cannot authenticate a user.

### P0-05 · Auth — Refresh-token blacklist writer and reader use different keys [CHANGED]

**Files:** `drizzle-auth.repo.ts:113-124` (writer); `jwt-auth.guard.ts:99-115` (reader); `schema-core.ts:69` (schema)

Round 1's "`jti` column missing" is partially resolved at the schema layer (Drizzle declaration added 2026-05-27), and a migration step exists in `migrations-drift.ts:3197-3198`. But `_db_cols.txt` (live DB snapshot 2026-05-25) still lacks the column, and **the blacklist writer never populates `jti`** — it inserts the SHA-256 hash of the raw token, while the reader queries by `jti`. The two halves never meet. Refresh-issued tokens also lack a `jti` claim. Stolen refresh tokens cannot be revoked. Logout uses `jwt.decode` (not `verify`) so anyone with a JWT-shaped string can write a blacklist row.

### P0-06 · Database — Migration journal records only `0000` while 1245 statements run at boot [CONFIRMED]

**File:** `apps/api/src/main.ts:95-107`; `apps/api/src/shared/db/invariants/migrations-drift.ts` (1180 entries) + `ensureDbInvariants` (22 CHECKs) + `ensureSchemaAdditions` (34 schema + 13 trigger + 60 CRM + 1193 drift = ~1300 idempotent DDL statements)

`apps/api/drizzle/meta/_journal.json` registers only migration `0000`. Every subsequent migration (`0001`–`0016` on apps/api, plus 41 unwired `drift-fix-*.sql` files in `apps/api/src/shared/db/migrations/`) was applied via the boot-time invariant runner that fires on every container start. `drizzle-kit push` or `drizzle-kit generate` would now produce migrations against an incorrect baseline. The drift runner has accumulated 29 hand-written FK-type-fix entries at the tail. Round 1 documented this correctly; round 2 confirms the count is now 1180 (was 1151).

### P0-07 · Database — 73 Drizzle-declared tables absent from live DB; 527 missing columns [CONFIRMED]

**Files:** `_drift_report_fresh.txt`; verified by re-running `_drift_check.mjs`

Drift summary verified: 73 missing tables, 527 missing columns across 135 tables. Round 1's claim of "177 missing columns" was a stale header value embedded in `migrations-drift.ts`, not the actual drift. Worth noting: re-running the drift check against an even-more-recent DB snapshot produces 0 missing tables and only 46 columns across 23 tables — the on-disk `_drift_report_fresh.txt` has not been regenerated since 2026-05-25.

The 73 missing tables include 28 `cc_*` Communication Center tables (entire module is schema-only), 5 `approval_workflow_*`, and the long-flagged `ow_*` block. **However:** all 22 `ow_*` Order Workflow tables now exist in the live DB (round 1 said 16 defined, 0 in DB — that has changed).

### P0-08 · Inventory — Broader varchar→serial FK mismatches than round 1 identified [CHANGED]

Round 1's specific case (`min_stock_alerts.materialCardId`) is fixed in source: now `integer("material_id")` referencing `materialCards.id` (`mm-material-cards.ts:126`). Drift-runner ALTER applied for `goods_receipt_lines.material_id` (line 3283).

But round 2 found **126 varchar→serial FK mismatches** in `lib/db/src/schema` alone: 108 → `users.id`, 10 → `vendors.id`, 7 → `materialCards.id`, 1 → `departments.id`. Only 9 are fixed by the drift-runner tail block. The most operationally damaging remaining cases:

- `warehouse_stock.materialCardId:297` — canonical balance table.
- `picking_tasks:466`, `cycle_count_results:506`, `material_barcodes:245`, `qc_inspections:74,297`, `stockReservations:35`.
- `vendor_performance_metrics.vendor_id` (varchar→integer).

### P0-09 · Procurement — Goods receipt never updates inventory; PO read/write split across two tables [NEW]

**Files:** `mm/goods-receipt.service.ts`; `mm/queries-mm-goods.ts:222-224`; `mm/purchase.service.ts:30-37`

A goods receipt records only the receipt header/line rows; **it never updates `raw_materials.current_stock` or `material_cards.current_stock`**. Inventory balance therefore does not reflect received goods.

Separately, PO write path goes to `purchase_orders_legacy`, while the list read goes to `mm_purchase_orders` — newly-created POs are invisible in the PO list. Round 1's "dual FK columns on `purchase_order_items`" finding is half-right: both `po_id`/`purchase_order_id` and `raw_material_id`/`material_id` exist, but `purchase_order_id` and `material_id` are bare `integer` columns with no `.references()` — they are unconstrained alias columns, not true FKs. Active query code (`queries-mm-goods.ts:222-224`) reads these aliases, not the canonical columns.

### P0-10 · Production — Every production-order INSERT violates a DB CHECK [NEW]

**File:** `apps/api/src/common/database/queries-pp.ts:18-27`

`execSavePo` writes status `'planned'` or `'released_to_production'` (from the aggregate enum) into a `production_orders.status` column constrained to `('created','released','in_progress','completed','closed','qc_hold')`. **Every save attempt throws CHECK violation at runtime.** The same function also hard-codes `plannedQuantity: 1`. Three incompatible production-order state machines coexist: DB CHECK (6 statuses), `PoStatus` aggregate enum (5 different names), `PP_TRANSITIONS` constant (7 different names again).

Adjacent: BOM "explosion" endpoint (`/api/erp/bom-headers/:id/explosion`) is a 1-level JOIN, not a real explosion. Frontend BOM page therefore shows wrong required materials for any multi-level BOM. The MRP service (`run-mrp.handler.ts`, 269 lines, Wagner-Whitin/POQ/EOQ/L4L) and `bom-explosion.service.ts` (232 lines, topo-sorted, cycle-safe) *do* exist — round 1's "unconfirmed" status is wrong — but neither is reachable via any HTTP route.

### P0-11 · Sales — Wrong column written for status updates; 23-state lifecycle unreachable [NEW]

**Files:** sales-orders update path (see §13 of full report); aggregate `SalesOrder.VALID_TRANSITIONS`

The `updateMasterStatus` code writes the `overallStatus` column (3-value CHECK) instead of `masterStatus` (23-value CHECK). Any real `master_status` value triggers a CHECK violation. The CQRS aggregate enumerates only 15 states (missing `pending_design`, `qc_failed`, `in_fg_warehouse`, etc.), and the four competing state-machine definitions do not align with each other or with the DB CHECK. The `MASTER_STATUS_CHAIN` constant round 1 praised has zero importers.

Three competing physical "sales order" tables exist: `sales_orders` (71 cols, SAP-style), `sd_orders` (47 cols, EuroPrint-style with its own 13-state enum), and `sd_sales_orders` (CQRS target). Different writers hit different tables. **No code path inserts `sales_order_items`** — all order-creation paths write only the header row.

---

## 2. Round-1 P0 findings that have been resolved (or downgraded by code change)

For each round-1 P0, the table below records the round-1 claim, the round-2 verification, and the current production-impact severity.

| Round-1 P0 | Status | Round-2 evidence | Current severity |
|---|---|---|---|
| `createJournalEntry()` returns `Math.random()` | **Replaced** | Now INSERTs but writes `'OFFSET'` literal into FK columns | P0-01 (different bug, identical impact) |
| `createInvoice()` / `postInvoice()` / `getInvoice()` fake | **Resolved at service layer** | Real repo writes; but INSERT references nonexistent columns | P0-02 (different bug, identical impact) |
| `insertGlJournalLines()` only logs | **Refuted (was already fixed)** | `drizzle-hr-payroll.repo.ts:97-109` performs real INSERT | Downgraded; see P1-03 (debit=credit account on each row) |
| Salary-review echoes request | **Refuted** | `hr-employees.controller.ts:142-184` reads + INSERTs `salary_history` + UPDATEs `hrEmployees` | Resolved |
| Refresh-token blacklist broken | **Schema partially fixed; logic still broken** | Writer stores SHA-256 hash, reader queries `jti` — they never meet | P0-05 (intact) |
| OTP endpoints 404 | **Replaced** | Routes exist; but `VerifyOtpService` issues no JWT | P0-04 (different bug, identical impact) |
| ABC analysis / KPI / OEE hardcoded | **Mostly fixed** | ABC real (`general-legacy-b.controller.ts:129`); KPI runs 3 COUNT queries but no aggregate; OEE availability real, performance/quality still hardcoded | Downgraded to P1 (see §5) |
| 73 tables absent from live DB | **Confirmed (but `ow_*` resolved)** | All 22 `ow_*` tables now exist; 73-table headline stands for other domains | P0-07 (intact) |
| FK type mismatch varchar→serial | **Specific case fixed; broader pattern remains** | `min_stock_alerts.materialCardId` fixed; 126 other instances remain | P0-08 (intact) |
| Dual FK columns on `purchase_order_items` | **Half-true** | Columns exist but aliases lack `.references()` — different operational pattern | Reframed as P0-09 |
| Duplicate GL account codes 5000 & 2200 | **Half-fixed** | COA seed has no duplicates; runtime `GL` constant still has 5000=CAPITAL+COGS, 2200=SALES_TAX+DEDUCTIONS, 7000=MATERIAL+EMPLOYER — still imported by `gl-posting.service.ts` | P1-11 (constant marked `@deprecated` but is the live one) |

**Net assessment:** of the 11 round-1 P0s, 1 is fully resolved (salary-review), 1 is materially reduced (analytics hardcoding), and 9 either remain in different form or have been replaced by structurally similar bugs. The pattern that produces these findings is more durable than any individual fix.

---

## 3. Per-module risk scorecard (round 2)

Score 1–10. P0 column reflects the **round-2 verified** P0 count (not round 1's). Comparison column shows round-1 vs round-2 score.

| # | Module | Score | P0 | r1 → r2 | Primary risk |
|---|--------|-------|------|---------|--------------|
| 1 | Finance GL | **10** | 1 | 10 → 10 | Posting returns success but never persists due to FK type mismatch on string literals |
| 2 | Finance AR/AP | **9** | 1 | 10 → 9 | Invoice INSERTs reference nonexistent columns; payments don't update invoice status |
| 3 | Sales / Orders | **9** | 1 | 5 → 9 | Three competing SO tables; status updates write the wrong column; 23-state lifecycle unreachable |
| 4 | Production / MES | **9** | 1 | 7 → 9 | Every PO INSERT violates CHECK; BOM explosion is 1-level; MRP exists but unreachable |
| 5 | Auth / Security | **9** | 2 | 9 → 9 | OTP issues no token; refresh blacklist writer/reader misaligned |
| 6 | HR Payroll | **9** | 1 | 9 → 9 | Five primary UI routes return 501; `payroll_calculations` schema exists but unused |
| 7 | Database integrity | **9** | 2 | 9 → 9 | 1245-statement boot-time drift runner; 126 varchar→serial FK mismatches |
| 8 | Procurement / MM | **8** | 1 | 8 → 8 | Goods receipt doesn't update stock; PO read/write split across two tables |
| 9 | Inventory / Materials | **8** | 0 | 8 → 8 | 12 POS tables with no FK to material_cards; 3 parallel count systems |
| 10 | POS / Retail | **8** | 3 | 6 → 8 | WMS sync dead-letter; `warehouse_transactions` always hardcoded `kirim`; no price update endpoint |
| 11 | Reports / Analytics | **6** | 0 | 8 → 6 | KPI/OEE partially real; ~24 HR dashboard stubs returning `{ items: [], total: 0 }` |
| 12 | Notifications / Events | **7** | 1 | 7 → 7 | SOS alert event has no listener; 6 CQRS event classes with zero consumers |
| 13 | HR Employees | **6** | 0 | 7 → 6 | Salary-review fixed; but operator-stats stub; dead `EmployeesService` |
| 14 | HR Recruitment/Leave/Attendance | **7** | 1 | — | Frontend calls non-existent `/hr/leave/requests`; `POST /hr/recruitment/vacancies` is a stub |
| 15 | Kanban / Tasks | **5** | 0 | 5 → 5 | OrderCancelledEvent never published; WIP limit bypassed on drag-drop |
| 16 | i18n / UX | **8** | 1 | 6 → 8 | **16 of 55 `locales/uz/*.json` files are truncated mid-string** (likely build-breaking); `uz-cyr` is dead code in main dashboard |
| 17 | Frontend Routing | **5** | 1 | 5 → 5 | `/order-workflow` uses uppercase role strings against lowercase comparator |
| 18 | API surface | **8** | 1 | 7 → 8 | **185 frontend calls hit non-existent backend routes**; `/hr-v2` namespace fully disjoint across BE/FE |
| 19 | Testing / Build | **6** | 1 | 6 → 6 | `@assets/Logo_Euro_Print_*.png` referenced but `attached_assets/` doesn't exist — `pnpm build:erp` fails |
| 20 | Dead code / Stubs | **5** | 0 | 5 → 5 | 271 `notImplemented` refs; `compatibility/` is 107 files (not 77) |

---

## 4. Systemic patterns

The round-1 patterns are still in force, but round 2 adds three new patterns that explain why "fixes" keep reintroducing the same operational symptoms.

### Pattern 1 — Stub-and-ship [CONFIRMED]

At least 14 service methods across Finance, HR, Reports, MES, and Procurement still return hardcoded values, `Math.random()`, or empty arrays instead of DB operations. The aggregate count of `Math.random` in API source is 14 across 13 files, with three particularly damaging instances: `create-lead.handler.ts:86` (`AIScore.create(Math.round(Math.random()*100))`), `design-extended.repository.ts:88` (random verification result), and historical-but-fixed finance services.

### Pattern 2 — Schema drift as normal operation [CONFIRMED]

Four parallel migration mechanisms with no shared journal: (a) `drizzle-kit` registers only `0000`, (b) 17 SQL files in `apps/api/drizzle/`, (c) the boot-time invariants runner (1245 statements), (d) 41 unwired `drift-fix-01..04c-*.sql` files in `apps/api/src/shared/db/migrations/`. The runtime is whatever survives the boot sequence.

### Pattern 3 — Dual entity tables without reconciliation [CONFIRMED, EXPANDED]

Round 1 listed 6 pairs. Round 2 finds 15 cross-layer pairs, plus four-way duplication on `attendance` (4 `pgTable` definitions), three-way on `users`, three-way on `employees`, three-way on `leave_requests`, two-way on `vendors`, `warehouses`, `crm_companies`, `salary_history`, `sales_orders`. `warehouses` has a PK *type* conflict: `lib/db` declares `varchar(50)` UUID, `apps/api/schema-compat-2.ts` declares `integer`.

### Pattern 4 — Three event buses with orphan emitters [PARTIALLY RESOLVED]

CQRS `EventBus`, `EventEmitter2` with `ERP_EVENTS` constants, and `EventEmitter2` with raw strings still coexist. The `OrphanEventsListener` was wired (round 1 missed this), but the listeners are TODO-log stubs for chip/iot/email. Six CQRS event classes have zero `@EventsHandler` consumers (`TaskCreatedEvent`, `TaskMovedEvent`, `TaskAssignedEvent`, three `KanbanTask*Event`). **`SosAlertRaisedEvent` (IoT tablet safety button) is bridged but has no listener anywhere** — a P0 in safety terms.

### Pattern 5 — Type mismatch on FK columns [INTENSIFIED]

Round 1 said "at minimum 12 tables". Round 2 measured **126 varchar→serial FK mismatches** in `lib/db/src/schema` alone (108 → `users.id`, 10 → `vendors.id`, 7 → `materialCards.id`, 1 → `departments.id`). Only 9 are fixed by the drift-runner tail block.

### Pattern 6 — Dead-wired real logic alongside hardcoded stubs [CONFIRMED]

`MRP service` (269 lines of textbook lot-sizing), `BomExplosionService` (232 lines, topo-sorted with cycle detection), `getAbcAnalysisForUserRaw`, `PayrollCalculationService`, `PosWmsSyncService`, `NotificationPreferencesService` — all exist with real logic; none is fully wired into the live request path. Round 2 verified that `PosWmsSyncService` has a complete sync pipeline that is dead-lettered because publishers emit string topics while the listener subscribes to CQRS classes.

### Pattern 7 — Three-layer wire mismatches [NEW]

A recurring shape: backend exists, frontend exists, schema exists — but each layer was built against a different version of the contract, so the call doesn't reach the handler.

- `use-hr-leave.ts` calls `/hr/leave/requests` (BE: `/hr/leave`), uses `PUT` (BE: `PATCH`).
- `SDSalesOrders.tsx` sends `{status, note}` (BE expects `{newStatus}`); calls `/cancel` (BE has no such route).
- `productId` flows as `number` (frontend) → `number` (controller DTO) → `string` (service DTO) → `uuid` (DB).
- Frontend invoice page expects routes registered by no controller.
- `usePOSSocket` listens for `movement.status_changed`; backend emits `movement.confirmed`.
- 109 of 449 frontend routes (24%) render generic `*Extended` / `Dashboard` shell components that don't read the URL.

Round-2 API report quantifies this: **185 frontend calls hit non-existent backend routes**, and 999 backend routes (34.6% of the live 2,886 surface) have no frontend consumer. The `/hr-v2` namespace has 17 frontend paths and 29 backend paths — and the two sets are **completely disjoint**.

### Pattern 8 — Build-breaking inconsistencies in non-API surfaces [NEW]

The build is one missing file from failing: `PublicFooter.tsx:9` and `PublicHeader.tsx:10` import `@assets/Logo_Euro_Print_1769616882846.png`, but `attached_assets/` doesn't exist on disk. **`pnpm build:erp` fails.** The `@assets` alias was added to tsconfig (round 1 said it was missing — that's been fixed), but the asset file itself isn't there. 16 of 55 `locales/uz/*.json` files are truncated mid-string and JSON parsers will reject them.

### Pattern 9 — "Compat layer" as load-bearing architecture [NEW]

`apps/api/src/modules/compatibility/` is 107 files (round 1 said 77). It is the only path that creates a `users` row when an employee is onboarded — the canonical `POST /hr/employees` writes only `hrEmployees` and never the linked `users` row. If anyone deletes the "compat" path on the assumption that it's legacy code being phased out, onboarded employees lose the ability to log in. The pattern recurs in POS (sales path via compat), Procurement (PO list via compat), and HR (salary-history via compat).

---

## 5. Major round-1 claims this audit refuted or downgraded

| # | Round-1 claim | Round-2 finding |
|---|---------------|-----------------|
| 1 | `.env` files committed | False — only `.example` files are tracked. The real leak is in `.replit:34` (plaintext Neon Postgres URL with password `npg_Nq7S5FRhXBDk`). |
| 2 | Backend has 54 NestJS modules | 50 module directories under `apps/api/src/modules/`. |
| 3 | `bill_of_materials.component_id` references wrong table | False — DB has FK to `material_cards(id)` via `migrations-drift.ts:3288-3297` (TASK 4+5). Drizzle ORM is unaware, but DB is correct. |
| 4 | Three duplicate JWT guard implementations | Inaccurate — five files exist but four are single-line re-export shims; only one is real. |
| 5 | `POSDashboardDialogs.tsx` is the add/edit product dialog | False — contains only `PaymentDialog` + `ReceiptDialog`. |
| 6 | MES role guard uses wrong constant | False — `AppRouter.tsx:110` uses `PRODUCTION_ROLES` correctly. |
| 7 | 5 dead sidebar links | False — all 5 have explicit redirects at `AppRouter.tsx:173-177`. After cross-checking 301 unique sidebar URLs against the routes file with `:param`-aware regex, zero remain unmatched. |
| 8 | 2,241 Cyrillic chars in Latin bundles | Not reproducible — re-running the regex gives 0 in every `.json` file in `locales/uz/`. |
| 9 | uz-latin missing 486 navigation keys present in uz-cyr | Wrong direction and wrong count — real numbers: uz-cyr − uz = 16 keys missing; uz-cyr − ru = 486 keys missing. |
| 10 | Stryker config references Angular/Karma | False — uses Jest runner correctly. |
| 11 | Vitest frontend coverage threshold is 5% | False — threshold is 15/15/10/15 (stale comment in file misled round 1). |
| 12 | `OrderCancelledEvent` class identity mismatch | Resolved — one class definition exists; handler imports it correctly. But: **no code path publishes the event** — handler is dead. End-user impact identical to round 1, root cause different. |
| 13 | KPI cron `result.processed = 0` | Partially fixed — now runs 3 real COUNT queries on `production_orders`, `attendance_logs`, `kpi_values`. Still no per-employee score, no aggregate, no INSERT into `kpi_values`. Misnamed. |
| 14 | OEE returns hardcoded `{0.92, 0.85, 0.97}` | Partial — availability is now real per-machine SQL (but query doesn't filter by `machineId`, so every machine shows same number); performance (0.85) and quality (0.97) still hardcoded. |
| 15 | salary-review endpoint echoes request | False — endpoint persists via `hrRepo.savePayroll` + UPDATE. |

---

## 6. Major findings round 1 missed

| # | Finding | Severity |
|---|---------|----------|
| 1 | `gl-posting.service.ts` now writes `'OFFSET'` string literal into varchar FK columns | P0 |
| 2 | Invoice `saveInvoice` INSERTs 8 columns that exist in neither schema nor migration | P0 |
| 3 | `RecordPaymentHandler` writes `fi_payments` + `gl_journal_entries` but never updates `fi_invoices.paid_amount`/`status` | P0 |
| 4 | Five `FinanceExtendedPayrollController` routes return 501; frontend payroll page consumes 3 of them | P0 |
| 5 | OTP verify endpoint exists but issues no JWT/cookie; no SMS gateway in codebase | P0 |
| 6 | `execSavePo` writes statuses that violate `production_orders.status` CHECK constraint | P0 |
| 7 | `updateMasterStatus` writes wrong column (`overallStatus` instead of `masterStatus`) | P0 |
| 8 | Three competing physical sales-order tables; no path inserts `sales_order_items` | P0 |
| 9 | Goods receipt never updates `current_stock` | P0 |
| 10 | PO write goes to `purchase_orders_legacy`; PO list reads from `mm_purchase_orders` | P0 |
| 11 | `warehouse_transactions` always inserts `transaction_type='kirim'` regardless of direction | P0 |
| 12 | `PosWmsSyncService` exists but is dead-letter (publisher/subscriber topic-class mismatch) | P0 |
| 13 | `SosAlertRaisedEvent` bridged but has no listener anywhere (safety-critical) | P0 |
| 14 | `@assets/Logo_Euro_Print_*.png` referenced but `attached_assets/` directory missing — `pnpm build:erp` fails | P0 |
| 15 | 16 of 55 `locales/uz/*.json` files are truncated mid-string (JSON parse failures) | P0 |
| 16 | 185 frontend calls hit non-existent backend routes; `/hr-v2` namespace fully disjoint across layers | P0 |
| 17 | `/order-workflow` `RoleRoute` uses UPPER_CASE role strings against lowercase comparator | P0 |
| 18 | `apps/api/src/main.ts` calls `drizzle(pool)` without `{ schema }` — disables relational `db.query.*` API on apps/api side | P1 |
| 19 | 89-table parking-lot file at `schema-db-only-generated.ts` (auto-generated 2026-05-22); only 1 of 89 promoted | P1 |
| 20 | 110 live DB tables have no Drizzle definition anywhere (dominated by 28 `cc_*` Communication Center) | P1 |
| 21 | Frontend `EmployeeProfile.tsx:289` bypasses Director-only canonical salary endpoint | P1 |
| 22 | 6 CQRS event classes (TaskCreated/Moved/Assigned + 3 KanbanTask*) have no consumers | P1 |
| 23 | Tax math bug: `totalAmount = subtotal − discountAmount` ignores `tax_amount` (`cash-register.service.ts:122`) | P1 |
| 24 | `RecruitingKanban` registered twice with different role guards (HR_ROLES vs ALL_AUTHENTICATED) | P1 |
| 25 | `/iot/tablet` registered both in App.tsx (no layout, no auth — wins) and ProductionRoutes (guarded) | P1 |
| 26 | `RolesGuard` and `PermissionGuard` have inconsistent admin-bypass lists (one includes `director`, one doesn't) | P2 |
| 27 | Logout uses `jwt.decode` not `jwt.verify` — any JWT-shaped string writes a blacklist row | P2 |
| 28 | Three independent kanban implementations on the frontend; only main is wired to `/api/kanban` | P2 |
| 29 | Three TelegramService classes coexist (plus two `@deprecated` stubs) | P2 |
| 30 | `lib/db/tsconfig.cjs.json:14-21` disables strict mode entirely; relaxed types flow into the API | P2 |

---

## 7. Newly verified-real systems

To balance the catalog of defects: these systems are confirmed working in round 2 (some flagged as broken or missing in round 1).

- **Director dashboard** (`dashboard-query.repository.ts`) — real per-employee KPI roll-up.
- **Director analytics** (11 routes) — real SQL.
- **POS / POS-v2 reports** — real Drizzle queries.
- **Finance reports** (except profitability export) — real GL queries.
- **Kanban reports + Excel/PDF export** — ExcelJS + pdfmake, real data.
- **WMS ABC/aging/expiry** — real queries.
- **Daily HR financial-reports cron** — full Telegram pipeline including chart rendering.
- **org-structure Excel/PDF** — pdf-lib + ExcelJS.
- **Daily-report cron** — real `INSERT INTO hr_daily_reports`.
- **Backend i18n** (`nestjs-i18n`) — uz / uz-cyr / ru loaded, 282-key parity, working resolver chain.
- **POS Monitor SPA** — 28 routes, separate JWT, IndexedDB offline sync, hardware scanner integration.
- **`@OrphanEventsListener`** — 12 of round 1's "no listener" events now have a registered handler (though several handlers are still log-only TODOs).

---

## 8. Comparable counts: round 1 vs round 2

| Metric | Round 1 | Round 2 (verified) | Note |
|--------|---------|--------------------|------|
| TS/TSX source files | 16,238 | 16,242 | +4 |
| NestJS module directories | 54 | 50 | Round 1 miscount |
| Controllers (files) | 338 | 338 | Same |
| Drizzle schema files | — | 122 | New count |
| Unique pgTable declarations | "665+" | 957 | Round 1 undercounted; 951 in live DB |
| Drizzle tables missing in DB | 73 | 73 (live drift file) / 0 (re-run on current DB) | File is stale |
| Columns missing in DB | 527 | 527 / 46 (re-run on current DB) | File is stale |
| Route declarations | 2,851 | 2,942 | +91, new code added |
| Duplicate route pairs | "15 genuine" | 30 file-pairs, **0 live** | The 30 all reference 7 unregistered controllers |
| Bare `@Controller()` | 12 | 11 | 3 of 11 also unregistered |
| Stub routes (frontend) | 74 | 64 (`STUB_ROUTES` array), 8 still render `Stub` | Round 1 overcounted |
| `notImplemented` references | 284 | 271 | -13 |
| TODO/FIXME | 92 | 102 | +10 |
| `Math.random` in API source | (not counted) | 14 across 13 files | — |
| `@deprecated` markers | (not counted) | 45 across 33 files | — |
| `compatibility/` files | 77 | 107 | Round 1 undercounted |
| Bridged CQRS events (EVENT_NAME_MAP) | 33 | 33 | Confirmed |
| Locale files in `uz/` | (not measured) | 55, of which 16 are truncated | New finding |
| `uz-cyr` keys | (assumed live) | 15,797 (dead code) | Round 1 wrong |
| Frontend calls → BE 404 | (not counted) | 185 | New finding |
| Orphan BE endpoints | (not counted) | 999 (34.6% of surface) | New finding |
| `useTranslation` call sites | (not counted) | 1,802 across 1,164 files | — |
| `t(...)` invocations | (not counted) | 15,166 | — |

---

## 9. Round-2 backlog (P0 + P1 only, ordered by user-visible impact)

These items would, if fixed, restore the most operational surface for the least engineering investment. P2 items live in the individual phase reports.

1. **Finance GL** — Replace `'OFFSET'` string literal in `gl-posting.service.ts:85-120` with real account ID resolution; add INSERT-side INTEGRATION test. (P0)
2. **Finance AR/AP** — Reconcile `saveInvoice` INSERT column list with `fi_invoices` schema and migration seed; add column-missing CI check. (P0)
3. **Finance AR/AP** — Update `RecordPaymentHandler` to call `updateInvoice` so `paid_amount`/`status` reflect payments. (P0)
4. **HR Payroll** — Wire `FinanceExtendedPayrollController` (5 routes) to real services or remove `PayrollAutomation.tsx` from the user-facing menu. (P0)
5. **Auth** — Either complete the OTP flow (issue JWT + set cookie + actual SMS gateway) or remove the OTP-by-phone tab. (P0)
6. **Auth** — Fix refresh-token blacklist: writer must populate `jti` (or reader must query by hash). Add `jti` to JWT claims. Roll the active refresh keyset. (P0)
7. **Database** — Reset `_journal.json` to capture the actual applied state; freeze the boot-time drift runner; introduce normal `drizzle-kit` flow. (P0)
8. **Inventory** — Migrate the remaining 117 varchar→serial FK columns (especially `warehouse_stock.materialCardId`). (P0)
9. **Procurement** — `mm/goods-receipt.service.ts` must update `current_stock` inside the same transaction as the receipt-line INSERT. (P0)
10. **Procurement** — Consolidate `purchase_orders_legacy` vs `mm_purchase_orders` to a single canonical table; remove the legacy writer. (P0)
11. **Production** — Align `execSavePo`'s status value with `production_orders.status` CHECK; pick one of the three competing state machines. (P0)
12. **Sales** — Fix `updateMasterStatus` to write `masterStatus` (not `overallStatus`); align CQRS aggregate with DB CHECK. (P0)
13. **Sales** — Choose one canonical SO table and migrate; implement `sales_order_items` write path. (P0)
14. **POS** — Fix `warehouse_transactions` to write the actual movement direction (not always `'kirim'`). (P0)
15. **POS** — Reconcile publisher topic strings with CQRS class subscribers so `PosWmsSyncService` becomes live. (P0)
16. **Notifications** — Register a listener for `SosAlertRaisedEvent` (safety-critical). (P0)
17. **Build** — Restore `attached_assets/Logo_Euro_Print_*.png` or remove the import. (P0)
18. **i18n** — Repair the 16 truncated `locales/uz/*.json` files. (P0)
19. **API surface** — Pick a side for the `/hr-v2` namespace (resolve the 17-vs-29 disjoint sets); document or delete `/hr/discipline/*`, `/adaptation/*`, `/seven-functions/*`. (P0)
20. **Frontend routing** — Fix `/order-workflow` role-string case; align with `hasRole()` comparator. (P0)

P1 items (selection):

21. Goods-issue `withTransaction` exists but unused — wrap FEFO reservation loop.
22. `getProfitLoss` / `queryBalanceSheet` — fix join condition to include both debit and credit accounts.
23. `KPI` cron — replace COUNT-only logic with real per-employee aggregation + INSERT INTO `kpi_values`.
24. OEE — wire `performance` and `quality` formulas; add `machineId` filter to availability SQL.
25. `BomExplosionService` — expose via HTTP route; replace 1-level JOIN at `/api/erp/bom-headers/:id/explosion`.
26. `RunMrpHandler` — expose via HTTP route; replace AI-mocked "Production Planning" page.
27. Notification orphan listeners — replace TODO log stubs with real notify paths.
28. `HrDashboardController` — migrate the 25 hardcoded `{ items: [], total: 0 }` routes (`hr-dashboard.controller.ts:111-246`).
29. Resolve duplicate `RecruitingKanban` route guards; pick one.
30. Delete the 7 unregistered controller files (~56 dead routes).

---

## 10. Remediation roadmap (8 sprints)

This roadmap assumes a steady-state team of 4 engineers and gates work by user-visible impact.

**Sprint 1 — Stop the bleed (Finance + Auth)**
P0-01, P0-02, P0-03, P0-04, P0-05. Goal: bookkeeping is honest; logins are honest; payroll UI either works or is removed.

**Sprint 2 — Stop the bleed (Operations)**
P0-09, P0-10, P0-11, P0-12, P0-13, P0-14. Goal: a goods receipt updates stock, a sales order can advance through its lifecycle, POs are visible after creation, sales-order items are persisted.

**Sprint 3 — Stabilize the platform**
P0-06, P0-07, P0-08, P0-15, P0-17, P0-18, P0-19, P0-20. Goal: migrations stop drifting; FK types stop coercing; the build is reproducible; i18n loads.

**Sprint 4 — Wire the dead-wired**
Items 22–26. Goal: BOM explosion, MRP, OEE, KPI aggregation actually run when the user clicks the button.

**Sprint 5 — Delete the parallel universes**
Pattern 3 (dual entity tables) and Pattern 4 (three event buses): pick one of each, migrate, delete the other(s). Highest-value targets: `sales_orders` vs `sd_orders` vs `sd_sales_orders`; CQRS `EventBus` vs `EventEmitter2`.

**Sprint 6 — API surface cleanup**
Pattern 7: align frontend and backend route contracts. Resolve `/hr-v2`, `/hr/discipline/*`, `/adaptation/*`, `/seven-functions/*`. Delete the 999 orphan backend routes that have no consumer.

**Sprint 7 — Schema hygiene**
89-table `schema-db-only-generated.ts` parking lot: promote or delete each table. Address the 110 live DB tables with no Drizzle definition. Reduce schema-file naming to one convention.

**Sprint 8 — Compatibility module retirement**
107 files in `compatibility/`. Map each to its canonical replacement; migrate consumers; delete. (This is the highest-risk sprint because the compat path is load-bearing in HR, POS, Procurement.)

---

## 11. Caveats and unverified items

Round 2 was a desk audit: source code, schemas, drift report, and live-DB column dump. It did not:

- Run the test suite to verify CI green.
- Run `pnpm build:all` to verify the build claim about `@assets`.
- Connect to a running database to query for actual data corruption.
- Inspect logs or traces for runtime failure rates of the FK-mismatch P0s.

Several round-2 claims are derived from `_db_tables.txt` / `_db_cols.txt` snapshots dated 2026-05-25 and would benefit from a fresh `\d+` dump. Where round 2 could not confirm a claim, the individual phase report tags it `UNVERIFIED`.

---

## 12. Acknowledgements

This audit deliberately verifies rather than restates round 1. Where round 2 disagrees with round 1, it is not because round 1 was sloppy — it is because the codebase changed in the two-week interval, or because the prior agent read an older revision of a file, or because a fix was applied at a different layer than the bug. The pattern that produces these findings — schema drift, dual implementations, dead-wired real logic, three-layer wire mismatches — is durable. Round 3 will find variations on the same themes if the systemic patterns in §4 are not addressed.

— End of Executive Summary —
