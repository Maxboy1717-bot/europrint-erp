# EuroPrint ERP — Full "Two-Worlds" / Parallel-System Audit (read-only, whole project)

**Date:** 2026-07-06
**Scope:** The entire project — DB schema (Part A), backend code paths (Part B), frontend (Part C), and role/taxonomy catalogs (Part D). Goal: find **every** remaining instance of the recurring pattern where one business concept is represented by 2+ parallel, independently-written paths that can disagree.
**Method:** 4 code-path investigators + direct live divergence queries by the lead against `postgres@localhost:5432/europrint` (1063 tables, read-only `_audit/q.cjs`). Every divergence claim carries a live query result or file:line. Git history (`--since=2026-06-20`) was checked so **fixed** instances are separated from **still-open** ones — a large two-worlds cleanup loop has run, so this reports **current** state, not the historical backlog.
**Cross-referenced:** `docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md`, `docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md`, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`, `SAP-CONFORMANCE-CHECK.md`.

> **Severity key.** **HIGH** = both sides actively written/read AND already diverged in live data (producing wrong answers now). **MEDIUM** = both live but not yet diverged (latent), or a code-level parallel with empty data. **LOW** = one side confirmed dead/empty (eventual cleanup only).

---

## Part A — Database schema duplication

| # | Concept | World 1 | World 2 (+3/4) | Canonical | Both written? | Live divergence (evidence) | Sev |
|---|---------|---------|----------------|-----------|:---:|-----------|:---:|
| A1 | **Invoices** | `invoices` TABLE (7, uuid PK, Σ259M) | `finance_invoices` TABLE (8, int PK, Σ344M); views `fi_invoices`/`sd_invoices`/`crm_invoices` all `FROM invoices` | `finance_invoices` (`d6286993`) | Y (repos→canonical, aging→legacy view) | **Y.** Same `INV-DEMO-004` in both: legacy uuid PK / `status='pending'` / `customer_name='Andijon Bosmaxona'` / USD vs canonical int id=5 / `payment_status='unpaid'` / `customer_id=NULL` / no `created_by`. `INV-GT-2026-001` (85M) exists ONLY in canonical → the exact ~85M AR gap. | **HIGH** |
| A2 | **GL / ledger** | `entries` TABLE (7) | `gl_journal_entries`(0), `gl_lines`(0), `pos_gl_postings`(0), `gl_documents`(0) | `entries` | N (alternates empty) | N (nothing to diverge). One garbage `POS-GL-1`=62.8B row dominates (finance-audit A2). | **LOW** |
| A3 | **Stock levels** | `warehouse_stock` TABLE (39) | `stocks`(0 dead); `current_stock` VIEW | `warehouse_stock` | N | N — but Drizzle def conflict, see A17 | **LOW** |
| A4 | **Materials** | `material_cards` (31, item+stock) | `raw_materials`(10 dict), `products`(2), `materials`(0 dead), `mm_materials` VIEW | `material_cards` | N | N — genuinely-different concepts (card-with-stock vs lookup dict), a related-lookup pair, not parallel truth | **LOW** |
| A5 | **Sales orders** | `sales_orders` TABLE (13, int PK) | `orders` DROPPED; `papka_orders`(0 dead); `sd_sales_orders` VIEW; `production_orders`(7)=different concept | `sales_orders` | N | N (legacy `orders` dropped `ce8d72c4`) | **LOW** |
| A6 | **Payments** | `payments`(0) | `finance_payments`(0), `customer_payments`(0), `invoice_payments`(0), `sd_payments`(0) | none live | Code four/five-worlds (see B5) | N (all empty — code-level only) | **MEDIUM** |
| A7 | **Position / job-card** | `positions` (96) | `org_functions` (97, 29-FK hub) + `org_departments` position-nodes (93 of 143) | `org_departments` (`d89c87de` node=card) | Y — all three populated & referenced | **Y.** `positions.name_uz` ∩ `org_functions.position_name` = **95**; `org_functions` ∩ `org_departments` position-nodes = **92**. Same 90+ titles in three tables, three schemas. | **HIGH** |
| A8 | **Users vs employees** | `users` (32, login) | `employees` (31, all have `user_id`) | 1:1 mirror (auth vs HR) | Y both | Partial — overlapping personal-data columns (prior audits); 31/31 mapped 1:1 | **MEDIUM** |
| A9 | **Payroll** | `payroll_period_record`(10) + `payroll_calculations`(10) | `payroll_rows`(0, gated canonical); `salary_history`(10)/`salary_change_log`(1)=audit | `payroll_rows` intended but empty | Legacy both written, canonical never ran | **Y.** Same employees; `payroll_period_record.salary_earned`=4,452,000 (gross-ish) vs `payroll_calculations.net_pay`=3,913,308 (post-tax), unreconciled; gated canonical=0 (finance-audit C12). | **HIGH** |
| A10 | **FX rates** | `currencies.exchange_rate` (USD 12500 / EUR 13500 / RUB 135) | `exchange_rates.rate` (USD **12700** / EUR **13800** / RUB **140** / CNY 1750) | `exchange_rates` (seed-09) | Y both read | **Y.** 1.5–3.7% disagreement on every shared pair (finance-audit E21). | **HIGH** |
| A11 | **Vendor rating** | `mm_vendor_ratings`(7) → `vendor_rating_unified` VIEW | `vendor_performance`(2, orphan); `material_supplier_ratings`(0), `vendor_performance_metrics`(0) dead | `mm_vendor_ratings` (`c2b5e32d`) | mm canonical; `vendor_performance` holds 2 orphan rows | **Y (partial).** Unified view unions the EMPTY `vendor_performance_metrics`, silently omitting the 2 populated `vendor_performance` rows. | **MEDIUM** |
| A12 | **Customers** | `sd_customers`(16) | `clients`(0), `customer_accounts`(0), `customer_orders`(0), `customer_contacts`(0) dead; no `customers` table | `sd_customers` (`77c19e37`) | N | N — but AI code expects a `customers` table (naming split) | **LOW** |
| A13 | **Leads** | `crm_leads`(16) | `marketing_leads`(14); `leads`(0), `exhibition_leads`(0) dead | none unified | Y both populated & written | **Y (concept-level).** Same "prospect" split CRM vs Marketing, both with name/company/contact, no shared key/sync. **NEW.** | **MEDIUM** |
| A14 | **Deals** | `deals`(5) | `crm_deals` VIEW over `deals` | `deals` | View | N (same data) | **LOW** |
| A15 | **Attendance** | `attendance`(10 daily summary) | `attendance_records`(126 raw events); `attendance_logs`(0), `hr_ai_attendance`(0), `security_attendance`(0) dead | `attendance_records`=source, `attendance`=summary | Y both populated | **Y (grain mismatch).** 126 raw events vs 10 summary rows, no visible regeneration link → summary can drift. **NEW.** | **MEDIUM** |
| A16 | **`sales_orders` Drizzle dup** | `lib/db/src/schema/sd-orders.ts:22` `serial` | `apps/api/src/shared/db/schema-compat-2.ts:20` `integer` | live PK integer; compatible | Two defs | N | **LOW** |
| A17 | **`warehouse_stock` Drizzle dup** | `lib/db/src/schema/wms-schema.ts:432` `warehouse_id`/`material_id` **varchar** | `apps/api/src/shared/db/schema-compat-2.ts:188` **integer** | live = integer | Two conflicting defs | **Y (schema drift).** lib/db "canonical" def types the FK cols as varchar but live is integer. **NEW.** | **MEDIUM** |
| A18 | **Invoice views → wrong base** | `fi_invoices`/`sd_invoices`/`crm_invoices` VIEWS `FROM invoices` (legacy) | canonical base `finance_invoices` | — | Aging/`getOutstandingPayment` read the views | **Y.** Same root as A1: AR aging reads `fi_invoices` (legacy) → understates ~85M, AP blind to sole payable. | **HIGH** |

---

## Part B — Backend code-path duplication

| # | Operation | World 1 (file:line) | World 2 (file:line) | Canonical | Both reachable? | Evidence | Sev |
|---|-----------|---------------------|---------------------|-----------|:---:|-----------|:---:|
| B1 | GL post engine | `gl-posting.service.ts:90` → `drizzle-gl-posting.repo.ts:61/112` | (single engine, 7 callers) | `GlPostingService.postJournal` | — | Unified engine; 7 callers route through it | **LOW** |
| B2 | **Payroll → GL** | `hr/…/drizzle-hr.repo.ts:196` `postPayrollToGL` direct `insert(entries)`, live via `hr-payroll.controller.ts:140` | `hr/payroll/payroll.service.ts:173` `gl.postJournal(...)` (engine) | Engine | BOTH live | Two payroll-GL formats/refs; per-record path bypasses the ONE engine → validation/period-lock drift | **HIGH** |
| B3 | **POS movement → GL** | `pos/…/gl-posting-log.repository.ts:161` direct `INSERT INTO entries` (`POS-GL-{id}`) | `pos/…/auto-gl-posting.service.ts:157` engine `postJournal` | Engine (intent, `f846a393`) | BOTH present | Two POS→GL subsystems, **different idempotency keys** → double-post / reconciliation drift | **MEDIUM** |
| B4 | GL entry writer (orphan) | `finance/…/drizzle-finance-invoice.repo.ts:213` `saveGlEntry` — UNBALANCED direct insert | engine (B1) | engine | World 1 DEAD (no caller) | Unbalanced writer, dead but compiled | **LOW** |
| B5 | **Payment write** | `finance/…/drizzle-finance-ops.repo.ts:78` → `finance_payments` (`/finance/payments`) | `fi/drizzle-fi.repo.ts:68` → `payments` (`/fi`); `sd/…/sd-payments.repository.ts:110` → `sd_payments` (`/sd`) | none unified | ALL THREE reachable | A "payment" lands in **3 tables** by route, no cross-sync, no FK → AR reconciliation divergence. **NEW (extends known 4-table finding with the SD path).** | **HIGH** |
| B6 | Invoice create | `finance/…/drizzle-finance-invoice.repo.ts:220` → `finance_invoices` | `sd/invoices/drizzle-sd-invoices.repo.ts:66` → `sd_invoices`; `integration-employee.controller.ts:220` `createInvoice` | `finance_invoices` | reachable | SD invoice world (int-PK) still separate; integration shim = 3rd surface | **MEDIUM** |
| B7 | **Recruitment stage-change event** | `recruitment.gateway.ts:119` `@OnEvent('candidate.stage-changed')` (hyphen) | `telegram-bots-cron-recruitment.service.ts:232` `@OnEvent('candidate.stage_changed')` (underscore) | gateway (matches emitter `recruitment-funnel.service.ts:220`) | Only gateway fires | **NEW BUG:** emitter uses hyphen; telegram listens underscore → **silent dead listener**, recruitment Telegram notification never fires. | **MEDIUM** (silent-dead) |
| B8 | Legacy POS vs POS/WMS ops | `pos/…/pos.controller.ts:39` `@Controller('legacy/pos')` | `pos/…/movements.controller.ts:58` `@Controller('pos/movements')` + `wms/*` | `pos/*`+`wms/*` | legacy still registered | Parallel movements CRUD under `legacy/pos` | **LOW-MED** |
| B9 | `warehouse` prefix collision | `compatibility/warehouse-catalog.controller.ts:45` `@Controller('warehouse')` | `wms/…/wms-catalog.controller.ts:27` + 6 `wms-gateway-*` all `@Controller('warehouse')` | wms/* | BOTH registered | 8+ controllers share the `warehouse` prefix across compat vs wms | **MEDIUM** |
| B10 | Material master create | `mm/…/mm-materials.controller.ts:142` → `material_cards` | `wms/…/inventory-materials.repository.ts:48`; `compatibility/warehouse-catalog.service.ts:42`; `compatibility/resources.service.ts:69` | `material_cards` | compat surfaces reachable | Multiple create-material entry points across mm/wms/compat | **MEDIUM** |
| B11 | Sales-order create | `sd/…/sd-orders.controller.ts:126` (sales_orders) | `erp/erp-orders.controller.ts:76`; `compatibility/saas.controller.ts:152` | sd/sales_orders | reachable | Legacy order surfaces persist in erp/saas (see C1 for the FE-visible divergence) | **MEDIUM** |
| B12 | Surviving `/v2` route | `pos/…/pos-printer-config-v2.controller.ts:24` `@Controller('v2/pos/printer-config')` LIVE | canonical `/warehouse/printer-config` | warehouse | v2 registered | `44038eb9` removed `/v2` ACL routes; this one survived. **NEW.** | **LOW-MED** |

*Benign (checked, not two-worlds):* ~25 `*-compat` controllers = FE route aliases delegating to canonical services; `*-extended`/`*-ext` = Rule-16 ≤300-line file splits over the SAME service; most multi-`@OnEvent` events are complementary (WS push vs domain vs notification), not overlapping.

---

## Part C — Frontend duplication

| # | Function/Metric | World 1 (file:line + endpoint) | World 2 (file:line + endpoint) | Routed/canonical | Both live? | Divergence risk | Sev |
|---|-----------------|--------------------------------|--------------------------------|------------------|:---:|-----------|:---:|
| C1 | **Sales-order list/create** | `SalesOrders.tsx:37,109` `/api/sap/sales-orders` reads `sap_sales_orders`-first, **create writes `sales_orders`** (`sap.repository.ts:21-64`) | `SDSalesOrders.tsx:190` `/api/sd/orders` → `sales_orders` | Both routed (`/erp/sales`, `/sd/sales-orders`) | Y | **Y** — read/write **asymmetry**: orders created to `sales_orders` may not show on `/erp/sales` (reads `sap_sales_orders`) but do on `/sd/sales-orders`. **NEW.** | **HIGH** |
| C2 | **Receivables aging** | `AccountsReceivable.tsx:32` `/api/ar/aging` → **`ar_aging` snapshot** (`finance-ar.repository.ts:10`) | `ArApAging.tsx:8` `/api/ar/ecl-aging` → **live `fi_invoices`** (`ar-aging.handler.ts:75`) | Both routed (`/accounting/ar`, `/accounting/ar-ap-aging`) | Y | **Y** — stale snapshot vs live invoices → different outstanding totals. **NEW.** | **HIGH** |
| C3 | **Debtor amounts (3rd view)** | C2's two (`ar_aging`, `fi_invoices`) | `SDDebitors.tsx:50` `/api/sd/debitors` → **`sales_orders`** (order-level) | Both routed (`/accounting/ar`, `/sd/debitors`) | Y | **Y** — three "who owes us" screens over three tables. **NEW.** | **HIGH** |
| C4 | Warehouse/stock dashboard | `WMSDashboard.tsx:50` `/api/warehouse/*` → `warehouse_stock` | `WarehouseDashboardPage`/`PosMonitorPage` via `/api/pos/*` → `warehouse_stock`+`pos_stock`+`stocks` | Both routed (`/wms/dashboard`, `/wms/overview`+…) | Y | **Y (partial)** — different endpoint namespaces; POS also touches `pos_stock`/`stocks` | **MED-HIGH** |
| C5 | Stock hook namespaces | `use-wms.ts:20` `/api/warehouse/stock` | `use-wms.ts:38,100` `/api/wms/low-stock`, `/api/wms/stock/` | same hook mixes both | Y | **Y (latent)** — one hook fans out to two stock endpoint families → possibly different counts | **MEDIUM** |
| C6 | Vendor view | `MMVendors.tsx:74` `/api/mm/vendors` → `mm_vendors` | `VendorPerformance.tsx:57` `/api/mm/vendor-performance`+`/vendor-ratings`+`/api/integration/vendor-performance` | Both routed | Y | **Y (partial)** — rating page hits 3 endpoints across 2 modules (ties to A11) | **MEDIUM** |
| C7 | Executive revenue/health KPI | `DirectorDashboard.tsx:45` `/api/director/dashboard`; `CompanyStatePage.tsx:57` `/api/company-state/current` | `CFODashboard.tsx:65` `/api/cfo/dashboard`; `FinanceDashboard.tsx:80` `/api/finance/dashboard` | All routed (role homes) | Y | **Y** — four aggregators recompute revenue/health, no shared source (role-scoped, partly expected) | **MEDIUM** |
| C8 | Weekly plan | `WeeklyPlanPage.tsx:29` `/api/weekly-plans` | `WeeklyPlansPage.tsx:58` `/api/weekly-plans` | Both routed (`/weekly-plan`, `/weekly-plans`) | Y | **N** — same endpoint; duplicate UI only | **MEDIUM** (dup page) |
| C9 | Mentorship | `Mentorship.tsx:34` `/api/mentorships` | `MentorshipsPage.tsx:55` `/api/mentorships` | Both routed | Y | **N** — identical endpoint; duplicate UI | **MEDIUM** (dup page) |

*Orphaned (unrouted) pages:* `pages/AIProviderConfig.tsx` (overlaps `/settings`), `pages/StubPage.tsx` (stub remnant) — both referenced only by `config/module-status.ts`, never routed. LOW.

---

## Part D — Role/permission/taxonomy duplication

| # | Catalog | Site 1 (file:line) | Site 2 (file:line) | Agree or drifted | Both used? | Sev |
|---|---------|--------------------|--------------------|------------------|:---:|:---:|
| D1 | **Role enum — casing** | `common/constants/roles.constants.ts:8` (16, **lowercase**) | `modules/auth/enums/role.enum.ts:6` (16, **UPPERCASE**) | **DRIFTED** — ~8 overlap, `super_admin`≠`SUPER_ADMIN`, disjoint members | Y both imported | **HIGH** (source) |
| D2 | **Role enum — 3rd/4th catalog** | `admin/…/user.aggregate.ts:11` `UserRole` (5: …`department_head`) | `admin/…/admin-extra.service.ts:36` `getRoles()` (8 inline: …`warehouse_manager`) | **DRIFTED** — `department_head` found nowhere else; `warehouse_manager` vs `warehouse_keeper` | Y | **HIGH** (source) |
| D3 | **Per-controller local `enum Role`** | `finance/…/finance-payments.controller.ts:29` (UPPERCASE) | `wms/…/wms-stock.controller.ts:24` (lowercase) + **25 more** | **DRIFTED — 27 duplicate local enums**, split casing, divergent subsets | Y — each gates live routes | **HIGH** (source, runtime-neutralized) |
| D4 | FE role lists | `routes/roleConstants.ts:6` (20 + 15 arrays) | `lib/roleRoutes.ts:6`, `lib/permissions.ts` (accepts `super_admin` AND `superadmin`), `hooks/use-role-menus.ts:21` | **DRIFTED** — 4–5 independent FE catalogs | Y (UX gating) | **MEDIUM** |
| D5 | **Design status** | `shared/db/schema-enums.ts:127` pgEnum (6: pending/in_progress/under_review/approved/rejected/completed) | `design/…/design-status.enum.ts:6` (7: new/ai_generated/designer_review/…) **+** `design/orders/orders.service.ts:10` DB_TO_API map (introduces `archived`) | **DRIFTED — 3-way**; map's `archived` is in NEITHER enum | Y all three | **HIGH** (NEW — 3rd site) |
| D6 | POS movement types | DB seed `invariants/migrations-crm.ts:146` `pos_movement_types` (11) | FE `pos-monitor/…/PosMovementChiqimTypes.ts:19` (7 union, 5 allow-list) | MOSTLY CONSISTENT (FE omits inbound by design, adds `CUSTOMER_MATERIAL`) | Y | **MEDIUM** (NEW) |
| D7 | QC/reclamation status | `schema-enums.ts:79` qcStatusEnum + `wms/…/wms-quarantine.constants.ts:73` | `qc/…/reclamation.aggregate.ts:12` | CONSISTENT (aligned `f5428125`/`bff5888f`) | Y | **LOW** |
| D8 | Lead/in-transit/quarantine status | `constants/lead-sources.constants.ts:26`; `wms-quarantine.constants.ts:34`; `i-wms-in-transit.repo.ts:17` | corresponding pgEnums in `schema-enums.ts` | MOSTLY CONSISTENT (const maps mirror pgEnum) | Y | **LOW** |

**Role-catalog finalization (precise current numbers):** **~36 role catalogs** exist — 4 named backend (`roles.constants` 16 lowercase / `auth/role.enum` 16 UPPERCASE / `UserRole` 5 / `admin-extra.getRoles` 8) + **27 per-controller local `enum Role`** + ~5 FE. **No two of the 4 named enums share a role set.** `@Roles(` appears **1,425×** across **325 controller files**. Of ~40 distinct role tokens in guards, **only 4 exist among live users** (`SELECT role,count(*) FROM users` → manager 27, super_admin 3, director 1, employee 1); **~35 role tokens match zero live user** → those guards are reachable only via the `super_admin`/`director`/`admin` bypass in `roles.guard.ts:89`. **No `roles`/`permissions`/`role_permissions` table exists** (only position-keyed `position_permissions`/`position_feature_flags`) — ⚠️ the MAGIC-NUMBERS-AUDIT-V2 repeatedly asserting "roles table exists" (lines 143/503/592/651) is **factually wrong**. The case-drift is **runtime-neutralized** (`roles.guard.ts` lowercases both sides, lines 82/93/95) but the **catalog fragmentation is unfixed** — the guard masks the symptom, it does not consolidate the source.

---

## Totals

**47 two-worlds instances** across the four parts (A:18, B:12, C:9, D:8):

| Severity | Count | Instances |
|---|---|---|
| **HIGH** (both written + already diverged) | **13** | A1, A7, A9, A10, A18, B2, B5, C1, C2, C3, D1, D2, D3, D5 *(D1-3 count as one role-catalog cluster; D5 design status)* → **de-duplicated to ~10 distinct concepts** |
| **MEDIUM** (both live, latent / code-level) | **19** | A6, A8, A11, A13, A15, A17, B3, B6, B7, B9, B10, B11, C4, C5, C6, C7, C8, C9, D4, D6 |
| **LOW** (one side dead) | **15** | A2, A3, A4, A5, A12, A14, A16, B1, B4, B8, B12, D7, D8 + 2 orphaned FE pages |

*(HIGH raw count = 14 rows; collapsing D1/D2/D3 into one "role-catalog N-worlds" cluster gives ~10 distinct HIGH concepts.)*

---

## Top 10 highest-severity (both sides actively written AND already diverged — producing wrong answers now)

1. **Invoices canonical-vs-legacy** (A1 + A18 + C2) — repos write `finance_invoices`, but the AR/AP aging CQRS handlers + 3 views read legacy `invoices`/`fi_invoices`. Live: same `INV-DEMO-004` with different PK type + status vocab, and an 85M invoice present only in canonical. **AR understates ~85M, AP blind to its only payable, today.**
2. **Receivables three-way FE split** (C2 + C3) — `/accounting/ar` reads an `ar_aging` **snapshot**, `/accounting/ar-ap-aging` reads **live `fi_invoices`**, `/sd/debitors` reads **`sales_orders`**. Three "who owes us" screens, three tables, three numbers.
3. **Positions three-world** (A7) — `positions`(96), `org_functions`(97, 29-FK hub), `org_departments` position-nodes(93). Live name-overlap 95/92; the same 90+ job titles maintained in three tables with three schemas. The org unification built the new tree but left the old two populated.
4. **FX rate divergence** (A10) — `currencies.exchange_rate` (USD 12500) vs `exchange_rates.rate` (USD 12700), disagreeing 1.5–3.7% on every shared pair; both are read live → screens value the same FX amount differently.
5. **Payment three-table split** (B5 + A6) — a payment lands in `finance_payments`, `payments`, or `sd_payments` depending on the route (`/finance` vs `/fi` vs `/sd`), with no cross-sync and no FK. Once payments flow, AR will not reconcile.
6. **Payroll unreconciled dual tables** (A9) — `payroll_period_record.salary_earned`=4,452,000 (gross-ish) vs `payroll_calculations.net_pay`=3,913,308 (post-tax) for the same employees; the gated canonical `payroll_rows` is empty. Reports pick whichever table.
7. **Sales-order read/write asymmetry** (C1 + B11) — `/erp/sales` reads `sap_sales_orders`-first but writes `sales_orders`; `/sd/sales-orders` reads `sales_orders`. An order can be invisible on the screen that created it.
8. **Design status 3-way** (D5) — pgEnum (6 values) vs domain enum (7 values) vs a DB→API map that invents `archived` (in neither enum). A status can round-trip to a value no layer agrees on.
9. **Role catalog N-worlds** (D1/D2/D3) — 36 divergent role catalogs (4 named + 27 local + 5 FE), ~35 of ~40 guard tokens matching no live user. Runtime-safe today only because the guard lowercases; structurally a landmine for any new role provisioning.
10. **Leads two-worlds** (A13) — `crm_leads`(16) vs `marketing_leads`(14), both populated and written, no shared key or sync; the same prospect can exist, differ, or be missing depending on which module you ask.

*Honorable mentions (dangerous but not yet diverged / silent):* payroll→GL & POS→GL dual writers bypassing the ONE engine (B2/B3); recruitment Telegram notification **silently dead** from hyphen-vs-underscore event drift (B7); attendance summary-vs-raw grain (A15); `vendor_performance` 2 rows silently dropped by the unified view (A11); `warehouse_stock` Drizzle varchar-vs-integer type conflict (A17); stock endpoint namespace split `/api/warehouse/*` vs `/api/pos/*` (C4/C5).

---

## Root-cause clusters (one fix resolves several)

1. **Incomplete canonical migrations — repos repointed, readers/handlers not.** The single biggest cluster. `d6286993` made `finance_invoices` canonical in the *repositories* but the *aging CQRS handlers* and 3 *views* still read legacy `invoices`. **One fix** (repoint `fi_invoices`/`sd_invoices`/`crm_invoices` + `ar-aging.handler`/`ap-aging.handler` to `finance_invoices`) closes **A1, A18, C2, C3** at once.
2. **Multiple writers bypassing the ONE engine / one table.** GL has 4 writers (engine + payroll-direct + POS-direct + dead SD `saveGlEntry`); payments have 3 write paths → 3 tables. **Fix:** route B2/B3 through `GlPostingService.postJournal`; collapse B5 onto one payment repo/table with an FK to `finance_invoices`. Closes **B2, B3, B4, B5, A6** and hardens the finance-audit period-lock finding.
3. **KARTA-centric org unification incomplete.** `d89c87de` built `org_departments` as node=card but left `positions`(96) and `org_functions`(97) populated with the same titles. **Fix:** pick one (the KARTA memory says `org_departments`/`org_functions` per prior decisions), migrate FK references, retire the others. Closes **A7** (and simplifies the D3 per-controller role enums that key off position tiers).
4. **Two config sources for one value.** FX (`currencies` vs `exchange_rates`), roles (4 backend + 27 local + 5 FE enums), design status (3 sites). **Fix:** anchor each on ONE source — drop `currencies.exchange_rate` in favor of `exchange_rates`; make every controller import the single `Role` enum and delete the 27 local copies; make `design-status.enum` import the pgEnum. Closes **A10, D1, D2, D3, D4, D5**.
5. **Rewrite-in-place left the old module registered.** `legacy/pos` vs `pos/wms`, `/v2/pos/printer-config`, erp/saas `createOrder`, the `warehouse` prefix shared by compat + wms. Mostly benign aliases, but each is a live parallel surface. **Fix:** deregister the confirmed-dead ones (B8, B12) and consolidate the compat/wms `warehouse` prefix (B9).
6. **Snapshot vs live grain.** `ar_aging` snapshot vs live `fi_invoices` (C2), `attendance` summary vs `attendance_records` raw (A15). **Fix:** either always read live, or guarantee snapshot regeneration on every underlying write.

---

## Cross-reference — already documented vs genuinely NEW

**NOT new (re-verified current state; cite prior doc):**
- Invoices `fi_invoices`/`finance_invoices` split — `FINANCE-FULL-AUDIT-2026-07-06.md` Part B risk #1.
- GL multi-writer bypassing `GlPostingService` — `FINANCE-FULL-AUDIT` Part A / `ACCOUNTING-STANDARDS-AUDIT` #4.
- FX `currencies` vs `exchange_rates` — `FINANCE-FULL-AUDIT` E21.
- Payments 4-table (no FK) — `FINANCE-FULL-AUDIT` B9 (this audit extends it with the SD `sd_payments` path = 3 live write routes).
- `users`×n / `employees`×2 personal-data overlap; `sales_orders` multi-Drizzle-def — `SAP-CONFORMANCE-CHECK.md` #1.
- 3 role catalogs + case-drifted `@Roles` — `MAGIC-NUMBERS-AUDIT-V2` (this audit finalizes the count at ~36 catalogs / 1,425 guards / ~35 dead tokens, and corrects that doc's false "roles table exists" claim).
- `pos/*` vs `wms/*` route overlap; `/v2` ACL routes — memory / `44038eb9` (ACL removed; `/v2/pos/printer-config` survives).

**Genuinely NEW discoveries from this broader sweep:**
- **A13 Leads two-worlds** — `crm_leads` vs `marketing_leads`, both populated, no sync.
- **A15 Attendance two-worlds** — summary `attendance`(10) vs raw `attendance_records`(126), grain drift.
- **A11 Vendor-rating orphan** — `vendor_performance`(2) excluded from `vendor_rating_unified` (view unions the empty metrics table).
- **A17 `warehouse_stock` Drizzle type conflict** — varchar (lib/db) vs integer (live) on the FK columns of the canonical stock table.
- **A7 Positions as a THREE-world** — prior audits noted `positions`/`org_functions`; this adds `org_departments` position-nodes as the live third.
- **B5 Three payment write routes** — adds `sd_payments` (`/sd`) to the known finance/fi split.
- **B7 Recruitment event-name drift** (hyphen vs underscore) — silent dead Telegram listener.
- **B12 `/v2/pos/printer-config`** — a `/v2` route that outlived the ACL cleanup.
- **D5 Design status 3-way** — the pgEnum is the third site (prior audit saw only enum↔map); the map's `archived` exists nowhere else.
- **C1 Sales-order read/write asymmetry**, **C2/C3 receivables snapshot-vs-live-vs-order three-way** — page-level divergences not previously flagged.
- **C8/C9 duplicate same-endpoint pages** (`WeeklyPlan`/`WeeklyPlans`, `Mentorship`/`Mentorships`).

---

*Investigation only. No code, migration, seed, or commit performed. Live figures are read-only queries against `europrint` on 2026-07-06; reproduce with `node _audit/q.cjs "…"`. This audit reports CURRENT state — a substantial two-worlds cleanup loop has already fixed the `orders` table, GL Drizzle unification, `sd_customers`, budgets repo, vendor-rating tables, and `/v2` ACL routes (commits cited inline).*
