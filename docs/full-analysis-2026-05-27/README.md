# EuroPrint ERP — Full Codebase Audit (2026-05-27)

Full audit of the EuroPrint ERP monorepo: 23 phase reports covering architecture, database, auth, all business modules, frontend, testing, and dead code.

**Stack:** NestJS 11 / Fastify 5 · React 19 / Vite 7 · Drizzle ORM · PostgreSQL  
**Scope:** 16,238 TS/TSX source files · 54 NestJS modules · 338 controllers · 665+ DB tables  
**Auditor:** Senior Software Audit Agent · Date: 2026-05-27

---

## Report Index

| # | Report | One-line Summary |
|---|--------|-----------------|
| 00 | [00-EXECUTIVE-SUMMARY.md](./00-EXECUTIVE-SUMMARY.md) | Synthesis of all 23 reports: 11 P0 findings, 18-module risk scorecard, 138-item backlog, 10-sprint roadmap |
| 01 | [01-architecture-monorepo.md](./01-architecture-monorepo.md) | Monorepo structure with 11 workspace packages; `@workspace/math-utils` missing runtime alias; `.env` files committed |
| 02 | [02-database-schema-overview.md](./02-database-schema-overview.md) | Two parallel Drizzle schema systems (`lib/db` 665 tables, `apps/api` 362 tables) with full table inventory |
| 03 | [03-db-drift-and-duplicates.md](./03-db-drift-and-duplicates.md) | 73 tables absent from live DB, 527 missing columns, `material_card_id` vs `material_id` collision across 40+ sites |
| 04 | [04-auth-and-permissions.md](./04-auth-and-permissions.md) | OTP routes return 404, refresh-token blacklist broken (`jti` column missing), three duplicate JWT guard implementations |
| 05 | [05-hr-employees.md](./05-hr-employees.md) | Salary-review endpoint echoes request without DB write; documents endpoint returns 501; dual employee tables unsynchronized |
| 06 | [06-hr-payroll.md](./06-hr-payroll.md) | `insertGlJournalLines()` only logs and never inserts; `payroll_calculations` has no Drizzle schema; `approvedBy` hardcoded |
| 07 | [07-hr-recruitment-leave-attendance.md](./07-hr-recruitment-leave-attendance.md) | Two `leave_requests` tables; `check_in_time` type conflict across ORM/raw SQL/DB; non-Telegram channels are stubs |
| 08 | [08-finance-general-ledger.md](./08-finance-general-ledger.md) | `createJournalEntry()` returns `Math.random()` with no INSERT; duplicate GL account codes 5000 and 2200 |
| 09 | [09-finance-ar-ap-invoices.md](./09-finance-ar-ap-invoices.md) | `createInvoice()` returns fake random ID; `getInvoice()` returns hardcoded `status:'posted'`; three disjoint invoice tables |
| 10 | [10-pos-monitor-warehouse.md](./10-pos-monitor-warehouse.md) | POS module is factory warehouse (not retail); dual stock tracking between POS ledger and WMS with no reconciliation |
| 11 | [11-pos-products-pricing.md](./11-pos-products-pricing.md) | `pos_products` is dormant in wrong schema file; active table is `retail_pos_products`; JSONB items with no price history |
| 12 | [12-inventory-materials-stock.md](./12-inventory-materials-stock.md) | varchar FK vs integer PK type mismatch on 12 tables; `current_stock` updated without transaction; dual material entities |
| 13 | [13-sales-and-orders.md](./13-sales-and-orders.md) | 23-stage `master_status` lifecycle implemented with real queries; dual customer registries and duplicate tax columns |
| 14 | [14-production-manufacturing.md](./14-production-manufacturing.md) | BOM `component_id` references wrong table (products not material_cards); MRP service existence unconfirmed; dual date types |
| 15 | [15-procurement-vendors.md](./15-procurement-vendors.md) | Dual FK columns on `purchase_order_items`; no purchase requisitions; `purchase_invoices` disconnected from Finance |
| 16 | [16-tasks-kanban-coordination.md](./16-tasks-kanban-coordination.md) | Full CQRS implementation; 5 orphan task event emitters; `OrderCancelledEvent` class identity mismatch; WIP limits in-memory only |
| 17 | [17-reports-and-analytics.md](./17-reports-and-analytics.md) | ABC analysis, KPI cron, and OEE all return hardcoded data; real ABC implementation exists but is dead-wired |
| 18 | [18-notifications-and-events.md](./18-notifications-and-events.md) | Three parallel event buses coexist; 10+ orphan emitters; absence-block cron emits three events with zero listeners |
| 19 | [19-i18n-coverage.md](./19-i18n-coverage.md) | uz-latin missing 486 navigation keys present in uz-cyr; 2,241 Cyrillic chars in Latin bundles; 5 empty namespaces |
| 20 | [20-frontend-routing-sidebar.md](./20-frontend-routing-sidebar.md) | 449 routes, 74 stubs, 5 dead sidebar links, MES guarded by wrong role constant, ~100 duplicate-UI routes |
| 21 | [21-api-endpoint-inventory.md](./21-api-endpoint-inventory.md) | 2,851 route declarations; 15 genuine duplicate route pairs; Finance, MES, WMS, SD endpoints return empty or fake data |
| 22 | [22-testing-and-build-health.md](./22-testing-and-build-health.md) | Stryker references Angular/Karma (wrong runner); 5% frontend coverage threshold; `@assets` alias gap in tsconfig |
| 23 | [23-dead-code-and-stubs.md](./23-dead-code-and-stubs.md) | 284 `notImplemented()` references; 92 TODO/FIXME; `compatibility` module 77 files pending typed-repo migration |

---

## Quick Reference — P0 Locations

| Finding | File | Impact |
|---------|------|--------|
| GL journal entry never written | `gl-posting.service.ts:81–91` | All GL postings are no-ops |
| Invoice create/post/get all fake | `ar-ap/invoice.service.ts` | Finance AR/AP is non-functional |
| Payroll GL lines only logged | `drizzle-hr-payroll.repo.ts` | Payroll GL silently discarded |
| Salary-review echoes request | `hr-employees.controller.ts:126` | No salary changes ever recorded |
| Refresh-token blacklist broken | `refresh_tokens` table (live DB) | Stolen tokens cannot be revoked |
| OTP endpoints return 404 | No controller registered | OTP login flow completely broken |
| ABC/KPI/OEE hardcoded | Various controllers | Analytics data is fabricated |
| 73 tables absent from live DB | `meta/_journal.json` desync | Runtime `relation does not exist` |
| FK type mismatch (varchar vs int) | `pos-schema-v2.ts` (12 tables) | Stock alerts never match cards |
| Dual FK columns on PO items | Procurement schema | Half of PO lines are orphaned |
| Duplicate GL account codes | Chart of accounts seed | Trial balance arithmetically wrong |
