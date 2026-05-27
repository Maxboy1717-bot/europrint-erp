# EuroPrint ERP — Full Codebase Audit, Round 2 (2026-05-27)

Second-pass full audit of the EuroPrint ERP monorepo, produced from a fresh independent investigation. This audit is structured to be directly comparable to the first-round audit (`full-analysis-2026-05-27/`) so that you can see what changed, what is still broken, and what was missed the first time.

**Stack:** NestJS 11 / Fastify 5 · React 19 / Vite 7 · Drizzle ORM · PostgreSQL · pnpm 9 workspaces
**Codebase snapshot (this pass):** 16,242 TS/TSX source files · 50 NestJS module directories · 338 `@Controller`-decorated files · 122 Drizzle schema files · 957 unique `pgTable` declarations · 951 tables/views in live DB · 271 `notImplemented` references · 14 `Math.random` references in API source · 102 TODO/FIXME markers
**Auditor:** Senior Software Audit Agent (second pass)
**Date:** 2026-05-27

---

## How this audit differs from round 1

The first-round audit (sibling folder `full-analysis-2026-05-27/`) was thorough but written from a single linear pass. This second pass:

1. **Re-derives every count from scratch** rather than carrying numbers forward. Where round 1 said "16,238 TS/TSX files" and "665+ DB tables", round 2 measured 16,242 TS/TSX files and 957 distinct `pgTable` declarations across schema files (with 951 tables/views actually present in PostgreSQL per `_db_tables.txt`).
2. **Verifies each P0 finding against current code** rather than restating the prior claim. Findings that are still present are tagged `[CONFIRMED]`. Findings that no longer match current code are tagged `[CHANGED]` with explanation. Anything new is tagged `[NEW]`.
3. **Cross-checks against existing audit artifacts** in `audit/`, `_audit_out/`, and `_drift_report_fresh.txt` rather than treating them as ground truth.

---

## Report index

| # | Report | One-line summary |
|---|--------|------------------|
| 00 | [00-EXECUTIVE-SUMMARY.md](./00-EXECUTIVE-SUMMARY.md) | Synthesis: P0 findings, per-module risk scorecard, systemic patterns, remediation roadmap, diff vs round 1 |
| 01 | [01-architecture-monorepo.md](./01-architecture-monorepo.md) | Workspace packages, build pipelines, tsconfig aliases, env file hygiene |
| 02 | [02-database-schema-overview.md](./02-database-schema-overview.md) | Drizzle schema layout across `lib/db` and `apps/api/src/shared/db`, table inventory |
| 03 | [03-db-drift-and-duplicates.md](./03-db-drift-and-duplicates.md) | ORM vs live DB drift, missing tables/columns, dual-entity patterns |
| 04 | [04-auth-and-permissions.md](./04-auth-and-permissions.md) | JWT guards, refresh tokens, OTP, RBAC, session management |
| 05 | [05-hr-employees.md](./05-hr-employees.md) | Employees module: controllers, services, repos, dual tables, stubs |
| 06 | [06-hr-payroll.md](./06-hr-payroll.md) | Payroll calculations, GL posting, salary tables, stubs |
| 07 | [07-hr-recruitment-leave-attendance.md](./07-hr-recruitment-leave-attendance.md) | Recruitment, leave duplication, attendance, check-in types |
| 08 | [08-finance-general-ledger.md](./08-finance-general-ledger.md) | GL: journal entries, trial balance, COA, duplicate codes |
| 09 | [09-finance-ar-ap-invoices.md](./09-finance-ar-ap-invoices.md) | Invoice create/post/get, dual invoice tables, AR/AP flows |
| 10 | [10-pos-monitor-warehouse.md](./10-pos-monitor-warehouse.md) | POS module nature, stock tracking, dual ledgers |
| 11 | [11-pos-products-pricing.md](./11-pos-products-pricing.md) | `pos_products` vs `retail_pos_products`, price history |
| 12 | [12-inventory-materials-stock.md](./12-inventory-materials-stock.md) | `material_cards` vs `raw_materials`, FK type mismatches, stock updates |
| 13 | [13-sales-and-orders.md](./13-sales-and-orders.md) | SO lifecycle, master_status, customer registries |
| 14 | [14-production-manufacturing.md](./14-production-manufacturing.md) | MES, BOM, MRP, production orders |
| 15 | [15-procurement-vendors.md](./15-procurement-vendors.md) | Purchase orders, dual FK columns, requisitions, vendor management |
| 16 | [16-tasks-kanban-coordination.md](./16-tasks-kanban-coordination.md) | Kanban CQRS, event emitters, WIP limits |
| 17 | [17-reports-and-analytics.md](./17-reports-and-analytics.md) | ABC analysis, KPI cron, OEE, dead-wired real logic |
| 18 | [18-notifications-and-events.md](./18-notifications-and-events.md) | Event buses (CQRS, EventEmitter2), orphan emitters |
| 19 | [19-i18n-coverage.md](./19-i18n-coverage.md) | Translation bundles, missing keys, hardcoded Cyrillic |
| 20 | [20-frontend-routing-sidebar.md](./20-frontend-routing-sidebar.md) | React routes, sidebar links, stubs, role guards |
| 21 | [21-api-endpoint-inventory.md](./21-api-endpoint-inventory.md) | Route declarations, duplicates, bare `@Controller()`, empty returns |
| 22 | [22-testing-and-build-health.md](./22-testing-and-build-health.md) | Jest/Stryker config, coverage thresholds, tsconfig aliases, CI |
| 23 | [23-dead-code-and-stubs.md](./23-dead-code-and-stubs.md) | `notImplemented` refs, TODO/FIXME, compatibility module |

---

## Diff vs round 1 — at a glance

Reports 01–23 each include a `## Diff vs round 1` section near the top that lists exactly what changed, what was missed, and what was incorrectly stated previously. The executive summary aggregates these into a single table.

If you only have time to read one file, read `00-EXECUTIVE-SUMMARY.md`.
