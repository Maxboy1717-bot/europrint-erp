# EuroPrint ERP — Full Codebase Audit: Executive Summary

**Audit date:** 2026-05-27  
**Auditor:** Senior Software Audit Agent  
**Scope:** All 23 phase reports covering monorepo architecture, database schema, auth, HR, Finance, POS, Inventory, Sales, Production, Procurement, Kanban, Reports, Notifications, i18n, Frontend, API, Testing, Dead Code  
**Codebase snapshot:** EuroPrint-Clean (TypeScript · NestJS 11 / Fastify 5 · React 19 / Vite 7 · Drizzle ORM · PostgreSQL)

---

## 1. P0 Critical Findings (System-Breaking)

These defects silently corrupt data or return fabricated results without any error signal to callers.

### P0-01 · Finance GL — Journal entry is never written to database
**File:** `apps/api/src/modules/finance/gl-posting.service.ts:81–91`  
`GlPostingService.createJournalEntry()` validates debit/credit balance and then returns `Ok(Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE))` — no INSERT statement is executed. Every GL posting since deployment has been a no-op. The trial balance query in `drizzle-finance-gl.repo.ts:60–71` queries real data; the discrepancy will compound silently.

### P0-02 · Finance AR/AP — Invoice creation returns fake random ID
**File:** `apps/api/src/modules/finance/ar-ap/invoice.service.ts` (createInvoice, postInvoice, getInvoice)  
`createInvoice()` returns `Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE)` as the new invoice ID. `postInvoice()` returns a hardcoded string with no action. `getInvoice()` returns `{ data: { invoiceId, status: 'posted' } }` hardcoded regardless of DB state.

### P0-03 · HR Payroll — GL journal lines method only logs, never inserts
**File:** `apps/api/src/modules/hr/payroll/drizzle-hr-payroll.repo.ts` (`insertGlJournalLines`)  
The method calls `console.log` and returns — no INSERT. Payroll GL postings have been silently discarded since initial deployment.

### P0-04 · HR Employees — Salary review endpoint echoes request, writes nothing
**File:** `apps/api/src/modules/hr/employees/hr-employees.controller.ts:126`  
`PATCH /hr/employees/:id/salary-review` echoes the incoming DTO back to the caller with HTTP 200 and writes zero rows to the database.

### P0-05 · Auth — Refresh-token blacklist silently no-ops
**File:** `apps/api/src/modules/auth/` (refresh token guard)  
The `jti` column is missing from the `refresh_tokens` table in the live database (column exists in Drizzle schema but absent from DB — a schema drift artifact). The blacklist check queries a column that does not exist; on PostgreSQL this throws at runtime or (if caught) silently passes every token through. Stolen refresh tokens cannot be revoked.

### P0-06 · Auth — OTP endpoints return 404
**Files:** `apps/api/src/modules/auth/` (no controller registers `/api/auth/otp/request` or `/api/auth/otp/verify`)  
Frontend calls `POST /api/auth/otp/request` and `POST /api/auth/otp/verify`. No NestJS controller registers these paths. The backend controller for OTP is at `/auth/verify-otp` with different semantics. OTP login flow is completely broken.

### P0-07 · Reports — ABC analysis, KPI cron, and OEE all return hardcoded data
**Files:**  
- `apps/api/src/modules/reports/abc-analysis/abc-analysis.controller.ts` — `GET /abc-analysis/user` returns `{ category: 'A', score: 85 }` hardcoded  
- KPI cron task body: `result.processed = 0` — cron fires but processes nothing  
- MES OEE endpoint: `calculateOEE()` returns hardcoded `{ availability: 0.92, performance: 0.85, quality: 0.97 }`  
Real implementation `getAbcAnalysisForUserRaw()` exists in `legacy-kpi.helpers.ts:59–115` but is never called.

### P0-08 · Database — 73 Drizzle-defined tables absent from live database
**File:** `apps/api/src/shared/db/` and `lib/db/` Drizzle schemas  
73 tables defined in ORM schemas do not exist in PostgreSQL. All `ow_*` tables (16 tables) and `lms_lessons` are included. Services that INSERT/SELECT against these tables will throw `relation does not exist` at runtime. The migration journal (`meta/_journal.json`) records only migration 0000; migrations 0001–0016 were applied via `migrations-drift.ts` invariant runner outside Drizzle's tracking.

### P0-09 · Inventory — FK type mismatch causes silent data corruption
**File:** `apps/api/src/shared/db/pos-schema-v2.ts`  
`min_stock_alerts.materialCardId` is declared `varchar` in Drizzle but `material_cards.id` is `serial` (integer). PostgreSQL will coerce on read but comparison silently fails: no alert will ever match its card. Same pattern: `goods_receipt_lines.material_card_id` is varchar vs `material_cards.id` integer.

### P0-10 · Procurement — `purchase_order_items` has dual conflicting FK columns
**File:** `apps/api/src/shared/db/` (procurement schema)  
`purchase_order_items` has both `po_id` and `purchase_order_id` (different FKs to same parent) and both `raw_material_id` and `material_id` (different FKs to different material tables). ORM queries and raw SQL queries target different columns — half of all PO line insertions land in orphaned rows.

### P0-11 · Finance — Duplicate GL account codes break double-entry constraint
**File:** `apps/api/src/modules/finance/` (chart of accounts seed/migration)  
Account code `5000` is assigned to both CAPITAL and COGS. Account code `2200` is assigned to both SALES_TAX and DEDUCTIONS. Any trial balance or financial statement using these codes will be arithmetically wrong.

---

## 2. Per-Module Risk Scorecard

| # | Module | Risk Score (1–10) | P0 Count | Primary Risk |
|---|--------|-------------------|----------|--------------|
| 1 | Finance GL / AR / AP | **10** | 3 | All write paths return fake data; zero real DB writes |
| 2 | Auth / Security | **9** | 2 | Token blacklist broken; OTP 404; username column drift |
| 3 | HR Payroll | **9** | 2 | GL lines never inserted; salary-review is echo |
| 4 | Database Integrity | **9** | 2 | 73 absent tables; 527 missing columns; journal desync |
| 5 | Inventory / Materials | **8** | 2 | FK type mismatch; material_card_id vs material_id collision |
| 6 | Procurement / MM | **8** | 1 | Dual FK columns; 3-way match partial; MM invoices disconnected |
| 7 | Reports / Analytics | **8** | 1 | ABC/KPI/OEE all hardcoded; real logic dead-wired |
| 8 | Production / MES | **7** | 0 | BOM references wrong table; MRP unconfirmed; stub endpoints |
| 9 | HR Employees | **7** | 1 | Documents 501; salary-review echo; dual employee tables |
| 10 | POS / Retail | **6** | 0 | Dual stock tracking no reconciliation; dormant schema mismatch |
| 11 | Sales / Orders | **5** | 0 | Denormalized counters; dual customer registries; dual status cols |
| 12 | Notifications / Events | **7** | 0 | Three parallel event buses; 10+ orphan emitters; absence cron unheard |
| 13 | Kanban / Tasks | **5** | 0 | 5 orphan emits; OrderCancelledEvent class mismatch; WIP in-memory |
| 14 | i18n / UX | **6** | 0 | 486 missing uz-latin keys; 109 TSX files hardcoded Cyrillic |
| 15 | Frontend Routing | **5** | 0 | 74 stub routes; 5 dead sidebar links; MES role guard wrong |
| 16 | API Surface | **7** | 0 | 15 duplicate route pairs; 12 bare @Controller(); MES returns [] |
| 17 | Testing / Build | **6** | 0 | Stryker wrong runner; 5% frontend coverage threshold; alias mismatch |
| 18 | Dead Code / Stubs | **5** | 0 | 284 notImplemented refs; compatibility module 77 files |

---

## 3. Systemic Patterns

**Pattern 1 — Stub-and-ship:** At least 11 service methods across Finance, HR, Reports, and MES return hardcoded values or `Math.random()` results instead of DB operations. These were scaffolded and shipped without implementation. The pattern is consistent enough to suggest a development practice, not isolated incidents.

**Pattern 2 — Schema drift as normal operation:** The migration journal records only migration 0000. Migrations 0001–0016 (apps/api) and 0001–0050 (lib/db) were applied via `migrations-drift.ts`, a 1,151-statement boot-time invariant runner. This means the ORM's schema state is permanently desynced from what Drizzle believes was migrated. Any attempt to run `drizzle-kit push` or generate new migrations will be based on incorrect baseline.

**Pattern 3 — Dual entity tables without reconciliation:** Every major domain has two parallel tables for the same entity with no sync mechanism: `users` vs `hrEmployees`, `leave_requests` vs `hr_leave_requests`, `fi_invoices` vs `invoices` vs `sales_invoices`, `material_cards` vs `raw_materials`, `crm_companies` vs `sd_customers`, `pos_products` vs `retail_pos_products`. Read paths target one; write paths target the other.

**Pattern 4 — Three event buses with no single source of truth:** CQRS `EventBus`, `EventEmitter2` with typed `ERP_EVENTS` constants, and `EventEmitter2` with raw string literals all coexist. `EventBridgeService` bridges 33 CQRS classes to ERP_EVENTS strings but does not cover all events. At least 10 event types are emitted with zero registered handlers.

**Pattern 5 — Type mismatch on FK columns:** `varchar` FK columns referencing `serial` (integer) PK columns appear in at minimum 12 tables across Inventory, Procurement, and HR schemas. PostgreSQL implicit coercion hides the mismatch on simple reads but breaks JOIN predicates and index scans silently.

**Pattern 6 — Dead-wired real logic alongside hardcoded stubs:** The real implementations exist (`getAbcAnalysisForUserRaw`, `GlPostingService` balance validation, `PayrollCalculationService`) but are bypassed by stubs that return plausible-looking data. This is harder to catch than missing implementations because tests that mock the service layer will pass.

---

## 4. Prioritized Backlog — All Gaps

Priority codes: **P0** = system-breaking (data loss / security breach / silent wrong result) · **P1** = feature broken (endpoint returns wrong data or 4xx/5xx) · **P2** = data integrity / maintainability risk · **P3** = quality / UX debt

| # | Priority | Module | Gap | Evidence |
|---|----------|--------|-----|----------|
| 1 | P0 | Finance GL | `createJournalEntry()` returns Math.random(), no INSERT | `gl-posting.service.ts:81–91` |
| 2 | P0 | Finance AR/AP | `createInvoice()` returns fake random ID | `invoice.service.ts` |
| 3 | P0 | Finance AR/AP | `postInvoice()` no-op string return | `invoice.service.ts` |
| 4 | P0 | Finance AR/AP | `getInvoice()` returns hardcoded `status:'posted'` | `invoice.service.ts` |
| 5 | P0 | HR Payroll | `insertGlJournalLines()` only logs, never inserts | `drizzle-hr-payroll.repo.ts` |
| 6 | P0 | HR Employees | `PATCH /hr/employees/:id/salary-review` echoes, no DB write | `hr-employees.controller.ts:126` |
| 7 | P0 | Auth | `jti` column missing from live `refresh_tokens` — blacklist broken | `schema-core.ts` vs live DB |
| 8 | P0 | Auth | OTP routes `/api/auth/otp/request` and `/api/auth/otp/verify` return 404 | No controller registered |
| 9 | P0 | Reports | `GET /abc-analysis/user` returns hardcoded `{category:'A', score:85}` | `abc-analysis.controller.ts` |
| 10 | P0 | Reports | KPI cron body: `result.processed = 0`, processes nothing | KPI cron task |
| 11 | P0 | Reports | `calculateOEE()` returns hardcoded 0.92/0.85/0.97 | MES OEE endpoint |
| 12 | P0 | Database | 73 Drizzle-defined tables absent from live DB | Schema diff |
| 13 | P0 | Database | All 16 `ow_*` tables absent from live DB | `lib/db` schemas |
| 14 | P0 | Database | `lms_lessons` absent from live DB | Schema diff |
| 15 | P0 | Inventory | `min_stock_alerts.materialCardId` varchar vs `material_cards.id` integer | `pos-schema-v2.ts` |
| 16 | P0 | Inventory | `goods_receipt_lines.material_card_id` varchar vs `material_cards.id` integer | Procurement schema |
| 17 | P0 | Procurement | `purchase_order_items` dual FK columns (`po_id`+`purchase_order_id`, `raw_material_id`+`material_id`) | Procurement schema |
| 18 | P0 | Finance | GL account code `5000` assigned to CAPITAL and COGS | Chart of accounts seed |
| 19 | P0 | Finance | GL account code `2200` assigned to SALES_TAX and DEDUCTIONS | Chart of accounts seed |
| 20 | P1 | Auth | `username` column queried in auth guard but absent from `schema-core.ts` | Auth guard |
| 21 | P1 | Auth | Three duplicate guard implementations (`JwtAuthGuard`, `AuthGuard`, `TokenGuard`) | Auth module |
| 22 | P1 | HR Employees | Documents endpoint always returns 501 | `hr-employees.controller.ts` |
| 23 | P1 | HR Employees | 8+ profile tabs call unknown backend endpoints | Frontend tabs |
| 24 | P1 | HR Payroll | `payroll_calculations` table has no Drizzle schema | Payroll module |
| 25 | P1 | HR Payroll | `salary_history` column drift: raw (9 cols) vs `@europrint/schemas` version | Payroll schema |
| 26 | P1 | HR Payroll | `approvedBy: "admin"` hardcoded in `CalculationsTab.tsx:22` | Frontend |
| 27 | P1 | HR Leave | Two `leave_requests` tables: `leave_requests` and `hr_leave_requests` | `schema-compat-2.ts:42`, `schema-business-c-2-hr-safety.ts:78` |
| 28 | P1 | HR Attendance | `attendance.check_in_time` type conflict: ORM=timestamp, SQL=TEXT::time cast, DB=TIME | `schema-business-c-2-hr-safety.ts`, migration 0014 |
| 29 | P1 | Finance | `GLDocumentsTab.tsx:53` fetches `/api/fi/gl-documents` but controller at `/accounting/gl-documents` | Route mismatch |
| 30 | P1 | Finance AR/AP | Payment recording writes to `fi_payments` but no `saveGlEntry()` follows | AR/AP service |
| 31 | P1 | Finance AR/AP | Three disjoint invoice tables: `fi_invoices`, `invoices`, `sales_invoices` | Schema survey |
| 32 | P1 | Finance AR/AP | `fi_invoices` Drizzle schema missing `total_amount`, `paid_amount`, `payment_status`, `customer_name` | `fi-invoices` schema |
| 33 | P1 | POS | `pos_transactions` and `pos_products` defined in wrong schema file (`fi-payroll-ext.ts`) | Schema placement |
| 34 | P1 | POS | Dual stock tracking: POS ledger vs WMS transactions, no reconciliation | POS + WMS modules |
| 35 | P1 | Inventory | `pos_products` dormant plain table; active table is `retail_pos_products` | Schema diff |
| 36 | P1 | Inventory | `retail_pos_transactions.items` is JSONB — no normalized items table | `retail_pos` schema |
| 37 | P1 | Inventory | `material_cards.current_stock` updated without DB transaction | Inventory service |
| 38 | P1 | Inventory | `material_card_id` vs `material_id` naming conflict across 40+ call sites | 12 tables in `pos-schema-v2.ts` |
| 39 | P1 | Sales | `sd_customers.total_orders` and `total_revenue` denormalized, no sync trigger | `sd_customers` schema |
| 40 | P1 | Sales | Dual customer registries: `crm_companies` + `sd_customers` with no sync | Sales module |
| 41 | P1 | Sales | Dual status columns: `overall_status` + `master_status` on orders | Sales schema |
| 42 | P1 | Production | `bom_items.component_id` references `products.id` not `material_cards.id` — BOM cannot drive material consumption | BOM schema |
| 43 | P1 | Production | `production_order_components.raw_material_id` references `raw_materials` not `material_cards` | Production schema |
| 44 | P1 | Production | MRP explosion service existence unconfirmed | Production module |
| 45 | P1 | Production | `production_facts_sm72.operatorId` has no FK constraint | Production schema |
| 46 | P1 | Procurement | No purchase requisition module — PR→PO flow is manual | Procurement module |
| 47 | P1 | Procurement | `purchase_invoices` (MM) disconnected from Finance module | MM + Finance |
| 48 | P1 | Procurement | 3-way match only enforced at POS movement level, not at invoice approval | Procurement logic |
| 49 | P1 | API | 15 genuine cross-controller duplicate route pairs (P0 per spec) | `21-api-endpoint-inventory.md` |
| 50 | P1 | API | `GET /mes/orders`, `/mes/shifts`, `/mes/maintenance` all return `[]` | MES controllers |
| 51 | P1 | API | `GET /wms/movements` returns `[]` | WMS controller |
| 52 | P1 | API | `GET /sd/contracts` returns `[]` | SD controller |
| 53 | P1 | Reports | Real ABC analysis implementation dead-wired (`legacy-kpi.helpers.ts:59–115`) | Reports module |
| 54 | P1 | Notifications | `access.chip.revoke`, `iot.attendance.block`, `email.account.disable` emitted with zero listeners | Absence-block cron |
| 55 | P1 | Kanban | `OrderCancelledEvent` locally redefined — class identity mismatch with SD module | Kanban + SD modules |
| 56 | P1 | Kanban | 5 orphan emits: `kanban.task.created`, `.moved`, `.assigned`, `.deleted`, `notifications.create` | Kanban module |
| 57 | P2 | Database | Migration journal records only migration 0000; 0001–0016 applied out-of-band | `meta/_journal.json` |
| 58 | P2 | Database | 527 missing columns across 177 tables (Drizzle schema vs live DB) | Schema diff |
| 59 | P2 | Database | `tenant_id` interceptor registered but never applied in actual ORM queries | Tenant interceptor |
| 60 | P2 | Database | Two parallel Drizzle schema systems: `lib/db` (665 tables) + `apps/api/src/shared/db` (362 tables) | Monorepo structure |
| 61 | P2 | Auth | Dual employee tables: `users` (CRUD target) vs `hrEmployees` (operational) with no sync | HR + Auth |
| 62 | P2 | HR Attendance | Raw SQL in attendance joins `employees` table (third employee entity) | Attendance queries |
| 63 | P2 | HR Notifications | Non-Telegram publish channels are stubs | Notifications module |
| 64 | P2 | Finance | Duplicate `stir` + `inn` tax columns on customer/vendor tables | Sales + Procurement schemas |
| 65 | P2 | Procurement | `vendors.tax_id` + `tin` duplicate columns; `vendor_code` + `code` duplicate columns | Vendor schema |
| 66 | P2 | Sales | `stir` + `inn` duplicate tax identifier columns | Sales schema |
| 67 | P2 | Production | Dual date types: varchar + timestamp in production tables | Production schema |
| 68 | P2 | POS | `retail_pos_transactions.created_by` is text not integer FK | Retail POS schema |
| 69 | P2 | POS | No price history table — `retail_pos_products` price changes leave no audit trail | Retail POS schema |
| 70 | P2 | API | 12 controllers with bare `@Controller()` — no route prefix, routes resolve to root | API controllers |
| 71 | P2 | API | `POST /finance/invoices/create` returns Math.random() — dead route alongside stub | Finance API |
| 72 | P2 | Notifications | `employee.absence.*` events emitted with no listeners | Absence module |
| 73 | P2 | Notifications | 6 AI agent output events emitted with no listeners | AI agent module |
| 74 | P2 | Notifications | `ai.planner.deadline_risk` emitted with no listeners | AI planner |
| 75 | P2 | Events | Three parallel event buses: CQRS EventBus + EventEmitter2(ERP_EVENTS) + EventEmitter2(raw strings) | Across modules |
| 76 | P2 | Events | `EventBridgeService` bridges 33 CQRS classes to ERP_EVENTS but incomplete | `event-bridge.service.ts` |
| 77 | P2 | Kanban | WIP limits stored in-memory only — lost on restart | Kanban module |
| 78 | P2 | Kanban | 5 extended card columns absent from Drizzle schema | Kanban schema |
| 79 | P2 | i18n | `uz/navigation.json` has 199 keys; `uz-cyr/navigation.json` has 685 — 486 missing | i18n files |
| 80 | P2 | i18n | 2,241 Cyrillic characters in `uz/*.json` (should be Latin) — worst: `warehouse.json` 1,440 chars | i18n files |
| 81 | P2 | i18n | 5 empty namespaces: `adaptation`, `analytics`, `employee-profile`, `erp`, `planning` | i18n files |
| 82 | P2 | i18n | `.bak.t2c` backup files committed to repository | i18n dir |
| 83 | P2 | Frontend | 74 stub routes in `StubRoutes.tsx` — render identical placeholder UI | Frontend routing |
| 84 | P2 | Frontend | 5 sidebar links with no registered routes: `/assets`, `/notifications`, `/hr/documents`, `/cfo`, `/org-chart` | Sidebar config |
| 85 | P2 | Frontend | MES routes guarded by `IOT_ROLES` not `PRODUCTION_ROLES` | Frontend routing |
| 86 | P2 | Frontend | ~100 routes (~22%) render identical UI | `StubRoutes.tsx` |
| 87 | P2 | Dead Code | `compatibility` module: 77 files, 30 controllers, 39 services — legacy ACL adapters | `compatibility/` |
| 88 | P2 | Dead Code | 92 TODO/FIXME comments; 30 are `TODO PA2-14` (drop compatibility when typed repo ships) | Codebase-wide |
| 89 | P2 | Dead Code | Dead SMS/Telegram services in notifications module with `TODO: delete` | Notifications |
| 90 | P2 | Testing | Stryker config references `karma`/`angular-cli` — wrong test runner for NestJS/Vitest | `stryker.conf.js` |
| 91 | P2 | Testing | Frontend coverage threshold: 5%; backend: 25% — insufficient | `vitest.config.ts` |
| 92 | P2 | Testing | `lib/db` build not included in local `build:all` script | `package.json` |
| 93 | P2 | Testing | `aisha-i18n.spec.ts` uses `.spec.ts` extension excluded from Vitest glob | Test config |
| 94 | P2 | Testing | `@assets` alias in `vite.config.ts` absent from `tsconfig.json` — path not resolved by tsc | Config files |
| 95 | P2 | Testing | `ts-jest` configured with `diagnostics: false` — suppresses TypeScript errors in tests | Jest config |
| 96 | P2 | Testing | `code-quality.yml` GitHub Actions filter targets `erp-dashboard` not `@workspace/erp-dashboard` | CI config |
| 97 | P2 | Monorepo | `@workspace/math-utils` has no runtime `_moduleAliases` entry | `package.json` |
| 98 | P2 | Monorepo | `.env` files committed to repository | Repository root |
| 99 | P3 | i18n | 109 TSX files contain 13,215 hardcoded Cyrillic characters not in i18n system | Frontend |
| 100 | P3 | Frontend | ~100 sidebar paths covered by both old and new config sections (duplicate sidebar entries) | Sidebar config |
| 101 | P3 | API | `@Controller()` decorator missing route prefix on 12 controllers | API controllers |
| 102 | P3 | Dead Code | 284 `notImplemented()` references: 57 marketing-analytics, 26 hr-dashboard, 16 mm-dashboard | Codebase-wide |
| 103 | P3 | Dead Code | Marketing analytics stubs: 57 `notImplemented()` calls | Marketing module |
| 104 | P3 | Dead Code | HR dashboard stubs: 26 `notImplemented()` calls | HR module |
| 105 | P3 | Dead Code | MM dashboard stubs: 16 `notImplemented()` calls | MM module |
| 106 | P3 | Production | `bom_items` has no migration creating it — table may not exist in live DB | BOM schema |
| 107 | P3 | Sales | 23-stage `master_status` lifecycle has no state machine guard against invalid transitions | Sales module |
| 108 | P3 | HR Attendance | `attendance.check_in_time` raw SQL uses `::time` cast on TEXT column instead of proper migration | Attendance |
| 109 | P3 | Finance | No automated reconciliation between `fi_payments` and GL entries | Finance module |
| 110 | P3 | Finance | Three disjoint invoice tables never reconciled into single source of truth | Finance module |
| 111 | P3 | Procurement | No vendor performance scoring or preferred-vendor logic | Procurement |
| 112 | P3 | Procurement | No automated 3-way match at invoice approval stage | Procurement |
| 113 | P3 | POS | GL posting async (`ai_gl_status='PENDING'`) with no retry or dead-letter queue | POS module |
| 114 | P3 | Kanban | `OrderCancelledEvent` class identity mismatch not caught by existing tests | Kanban + SD |
| 115 | P3 | Reports | WMS ABC analysis in `abc-aging-expiry.service.ts` is real but separate from user-facing ABC | Reports |
| 116 | P3 | Notifications | Telegram bot HR handler scope unclear — may overlap with absence-block cron | HR + Notifications |
| 117 | P3 | Events | Raw string event literals across modules create rename-blindness bugs | Events |
| 118 | P3 | Testing | No integration or e2e tests confirmed in any module | Testing |
| 119 | P3 | Testing | Mutation testing (Stryker) effectively disabled due to wrong runner config | Testing |
| 120 | P3 | Build | `migrations-drift.ts` (1,151 statements) fires on every server boot — adds startup latency | Boot sequence |
| 121 | P3 | Database | `meta/_journal.json` desync means `drizzle-kit push` will attempt to re-apply all migrations | Migration tooling |
| 122 | P3 | Monorepo | 16,238 TS/TSX files — no tree-shaking analysis performed | Monorepo |
| 123 | P3 | Monorepo | 54 NestJS modules with 338 controllers — no documented module ownership map | Monorepo |
| 124 | P3 | Security | `tenant_id` multi-tenancy is cosmetic — no row-level enforcement in queries | Security |
| 125 | P3 | Security | Three duplicate JWT guard implementations — inconsistent token validation logic | Auth |
| 126 | P3 | HR | Non-Telegram notification channels (SMS, email) are stubs — HR can only notify via Telegram | HR + Notifications |
| 127 | P3 | Production | Dual raw material tables (`material_cards` vs `raw_materials`) with no clear ownership boundary | Production + Inventory |
| 128 | P3 | Sales | `sd_customers` denormalized `total_orders`/`total_revenue` will drift from real aggregates | Sales |
| 129 | P3 | Inventory | No inventory reconciliation report between POS ledger and WMS movement totals | Inventory |
| 130 | P3 | Finance | `migrations-drift.ts` boot runner applies finance schema DDL outside Drizzle tracking | Finance + DB |
| 131 | P3 | API | 449 registered routes — no API versioning strategy documented | API design |
| 132 | P3 | Frontend | `StubRoutes.tsx` — 74 routes all render same placeholder with no ETAs | Frontend |
| 133 | P3 | i18n | Static bundle i18n (no lazy loading) — all 55 namespaces loaded on initial page load | Frontend |
| 134 | P3 | i18n | `uz-cyr` has 486 more navigation keys than `uz-latin` — two scripts will show different menu items | i18n |
| 135 | P3 | Dead Code | `TODO PA2-14` on 30 files — `compatibility` module not yet replaceable without typed repo | Compatibility |
| 136 | P3 | Testing | `ts-jest diagnostics: false` hides compile errors in payroll and finance test suites | Testing |
| 137 | P3 | Build | `@assets` alias gap between `vite.config.ts` and `tsconfig.json` will fail `tsc --noEmit` | Build |
| 138 | P3 | Build | `code-quality.yml` filter mismatch means CI quality gate never fires for dashboard package | CI |

---

## 5. Remediation Order — 10-Sprint Roadmap

### Sprint 1 — Stop the bleeding (P0 Finance + Auth)
1. Implement real INSERT in `GlPostingService.createJournalEntry()` — replace Math.random() return
2. Implement real INSERT in `insertGlJournalLines()` — remove console.log stub
3. Implement real invoice CRUD in AR/AP service — createInvoice, postInvoice, getInvoice
4. Add `jti` column to live `refresh_tokens` table — run targeted migration
5. Register OTP controller at `/api/auth/otp/request` and `/api/auth/otp/verify` or update frontend routes

### Sprint 2 — Database integrity baseline
6. Run schema diff tooling — produce authoritative list of 73 absent tables
7. Generate and apply migration for all `ow_*` tables and `lms_lessons`
8. Fix `jti` column migration and resync `meta/_journal.json` baseline
9. Fix GL account code duplicates (5000 CAPITAL/COGS, 2200 SALES_TAX/DEDUCTIONS)
10. Add missing columns from 527-column drift list (start with finance-critical columns)

### Sprint 3 — Inventory and Procurement FK fixes
11. Fix `min_stock_alerts.materialCardId` type from varchar to integer
12. Fix `goods_receipt_lines.material_card_id` type from varchar to integer
13. Resolve `purchase_order_items` dual FK columns — pick canonical names and migrate data
14. Standardize `material_card_id` vs `material_id` across all 40+ call sites
15. Add FK constraints on all 12 tables in `pos-schema-v2.ts`

### Sprint 4 — HR real implementations
16. Implement `PATCH /hr/employees/:id/salary-review` — write to `salary_history` or `hrEmployees`
17. Implement HR documents endpoint — replace 501 with real query
18. Create Drizzle schema for `payroll_calculations` table
19. Fix `approvedBy: "admin"` hardcode in CalculationsTab.tsx — wire to auth context
20. Resolve `leave_requests` vs `hr_leave_requests` — merge into single canonical table

### Sprint 5 — Reports real implementations
21. Wire `getAbcAnalysisForUserRaw()` to `GET /abc-analysis/user` endpoint
22. Implement KPI cron processing body — remove `result.processed = 0`
23. Implement real OEE calculation — remove hardcoded 0.92/0.85/0.97
24. Wire WMS ABC analysis to user-facing reports

### Sprint 6 — Auth consolidation and multi-tenancy
25. Consolidate three JWT guard implementations into one
26. Fix `username` column in auth guard to match live schema
27. Implement real `tenant_id` row-level filtering in ORM queries
28. Audit all 15 duplicate route pairs — resolve conflicts

### Sprint 7 — Production and BOM integrity
29. Fix `bom_items.component_id` FK to reference `material_cards.id` not `products.id`
30. Fix `production_order_components.raw_material_id` to reference `material_cards`
31. Confirm or implement MRP explosion service
32. Add FK on `production_facts_sm72.operatorId`

### Sprint 8 — Event bus consolidation
33. Pick canonical event bus (recommendation: typed ERP_EVENTS on EventEmitter2)
34. Migrate all raw string emitters to ERP_EVENTS constants
35. Register handlers for all 10+ orphan event types
36. Consolidate or remove `EventBridgeService` once CQRS events migrated

### Sprint 9 — i18n completeness and frontend routing
37. Add 486 missing keys to `uz/navigation.json`
38. Replace 2,241 Cyrillic chars in `uz/*.json` with Latin equivalents
39. Begin systematic replacement of 13,215 hardcoded Cyrillic chars in TSX files
40. Fix MES route guard from `IOT_ROLES` to `PRODUCTION_ROLES`
41. Register routes for 5 dead sidebar links or remove sidebar entries

### Sprint 10 — Dead code cleanup and test coverage
42. Remove `compatibility` module after typed repository ships (PA2-14)
43. Replace 284 `notImplemented()` stubs with real implementations or explicit 501 + feature-flag
44. Fix Stryker config to use correct test runner
45. Raise frontend coverage threshold from 5% to 60%
46. Delete committed `.env` files and rotate any exposed secrets

---

## 6. Open Questions

1. **Finance reconciliation baseline:** Given that no GL journal entries have been written since deployment, what is the current reconciliation state between the UI-displayed balances and the actual PostgreSQL data? Is there a compensating data entry in the DB done manually?

2. **Migration journal reset:** Is there a safe path to resync `meta/_journal.json` to reflect migrations 0001–0016 as applied, without triggering Drizzle to re-apply them? What is the rollback plan if `drizzle-kit push` is accidentally run against production?

3. **`migrations-drift.ts` boot-time cost:** At 1,151 idempotent SQL statements on every boot, what is the measured startup latency impact? Is there a plan to move this to a one-time migration once drift is resolved?

4. **POS module intent:** Is the `pos/` module (factory warehouse kirim/chiqim) actively used by warehouse operators, or is retail fully handled by `retail_pos_*`? Is the `pos/` module intended for eventual removal?

5. **Dual customer registries:** Is there a business rule defining when a customer lives in `crm_companies` vs `sd_customers`? If they are the same entity, which table is the system of record?

6. **`ow_*` tables (16 absent):** These appear to be a complete sub-system (Order Workflow?). Were they intentionally removed from the DB, or are they in a planned but not yet deployed sprint?

7. **Compatibility module timeline:** `TODO PA2-14` annotations reference "typed repo ships" as the trigger for dropping the compatibility module. What is the current status and ETA for the typed repository?

8. **Multi-tenancy scope:** Is `tenant_id` scoping intended to be enforced at the DB query level (row-level security) or is it application-level only? If application-level, is the interceptor pattern the agreed approach?

9. **Event bus selection:** Is there an architectural decision record choosing between CQRS EventBus, typed ERP_EVENTS, and raw-string EventEmitter2? The three coexist without documented rationale.

10. **MRP and production planning:** Is the MRP explosion service a planned feature or a current capability? If planned, which sprint is it targeted for, and what is the dependency on BOM FK fixes?

---

*End of Executive Summary. See individual phase reports 01–23 for per-module detail and line-level evidence.*
