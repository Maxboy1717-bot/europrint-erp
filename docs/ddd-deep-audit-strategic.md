# DDD Deep Audit — Strategic & Bounded Contexts

Date: 2026-05-17 · Scope: `apps/api/src/modules/` · 56 modules
Verifies: `docs/ddd-sprint-completion.md` (claimed 75 → 93/100)

## Independent verdict

**Strategic DDD score: 58/100** — well below the 93/100 the sprint claims (the sprint's "Overall DDD discipline" rolls up tactical scores from the 5 named layers; strategic concerns weren't measured separately).

## STEP 1 — Domain area inventory (56 modules)

| Area | Modules |
|---|---|
| Sales & Customer | crm(114), sd(67), sales(4), marketing(28), ecommerce(10), website(6) |
| Manufacturing | pp(76), production(6), mes(40), qc(63), design(25), mm(47), technology(6), mro(21) |
| Warehouse & Inventory | wms(83), pos(139), pos-v2(24), logistics(24), storage(2) |
| Finance | finance(134), fi(1), order-workflow(16) |
| HR | hr(230), hr-assets(6), lms(54), feedback-360(4), adaptation(4), applications(7) |
| Platform | auth(40), admin(28), ai(83), aisha(55), agents(19), ai-agents(11), iot(50), chat(29), kanban(50), notifications(31), director(60), communication-center(33), security(25), queue(11), export(4), analytics(8), org-structure(12), core(29) |
| Integration | bot-gateway(13), sap(5), integration(12), erp(15) |
| Legacy/Migration | compatibility(88), general(10), remaining(37) |
| Shared | shared(16), common(5) |

**Proper DDD layout** (D/A/I/P all present): 29 modules. **Flat / non-DDD:** 27 modules — i.e. **48% are still flat** despite the sprint's 75→93 claim.

## STEP 9 — Module size distribution

| Size | Count | Notes |
|---|---:|---|
| HUGE (>300) | 0 | — |
| LARGE (100-300) | 4 | hr(230), pos(139), finance(134), crm(114) — candidates for splitting |
| MEDIUM (30-100) | 16 | Healthy bounded contexts |
| SMALL (10-30) | 19 | Focused |
| TINY (<10) | 17 | **30% of modules** are likely merge candidates |

Tiny modules: fi(1), storage(2), sales(4), feedback-360(4), adaptation(4), export(4), common(5), sap(5), production(6), hr-assets(6), website(6), technology(6), applications(7), analytics(8), ecommerce(10), general(10), ai-agents(11).

## STEP 2 — Bounded context boundaries (5-module sample)

`sd/sd.module.ts` — only 1 cross-context import (`@modules/crm/domain/events/deal-won.event` for event handler; clean).
`crm/`, `hr/`, `wms/`, `pp/`, `finance/` — zero `@modules/*` direct imports. Strategic isolation via `@modules` alias **is good**.

**But relative-path leaks tell another story.** Real cross-module imports (filtered to actually crossing boundaries): **~98 lines** with concentrations:
- `../../hr/common/db-rows` — **42 imports** by `compatibility/`, `crm/presentation/`, `wms/`, `mm/`, `mes/`, `pp/`, `qc/`, `sd/`, `finance/`, `general/`, `remaining/`, `applications/`, `production/`, `sap/`, `erp/`, `sales/` (16 modules). A DB row helper is sitting inside the HR bounded context — **shared-kernel leak**.
- `../../auth/{decorators,guards,types}` — **37 imports**. Acceptable as cross-cutting but ought to live in `common/auth` not `auth/`.
- `../../wms/domain/services/{eoq-calculator,safety-stock}` consumed by `queue/processors/mrp-run.processor.ts:17-19` — **MRP processor reaches into WMS domain** = direct domain-service crossing.
- `../../pp/domain/services/bom-explosion.service` likewise pulled by `queue/processors/mrp-run.processor.ts:17`.

## STEP 3 — Context map

`docs/context-map.md` — **does not exist**. `apps/api/src/modules/ARCHITECTURE.md` (288 lines) is a **single-context document** (CRM ↔ SD triggers only); not a context map. No documented Customer/Supplier, ACL, Open Host Service, or Published Language relationships across the 56 modules.

## STEP 4 — Anti-Corruption Layer (legacy)

`compatibility/` (88 files) — **no ACL**. Sampled controllers (`employees-compat.controller.ts`, `cfo.controller.ts`, `barcode-warehouse.controller.ts`) all delegate to `*-compat.service.ts` which **directly executes raw SQL** (36 `sql\``/`rawSql`/`db.execute` calls across the folder; `employees-compat.service.ts:37` ships an inline SELECT). No translation layer, no DTO mapping, no domain models. Legacy concepts leak straight to HTTP.

`general/services/legacy.service.ts:27` still uses `sql.raw(rawQuery)` (flagged as SQL-injection in `CLAUDE.md` Qoida B).

`remaining/` (37 files) — same pattern: each `*.repository.ts` is a thin SQL pass-through; no aggregates, no events.

## STEP 5 — Shared kernel quality

`apps/api/src/modules/shared/domain/value-objects/` — 6 VOs present: `CustomerId`, `EmployeeId`, `ProductId`, `Email`, `PhoneNumber`, `Money`. **P2-21 verified**.
`apps/api/src/shared/result.ts` + `result.pattern.ts` both exist — duplicate primitives. P2-19 deleted the *modules*/shared duplicate, but `apps/api/src/shared/result.ts` and `apps/api/src/shared/result.pattern.ts` still coexist.
`apps/api/src/shared/db/` — **god-module**: 30+ `schema-*.ts` files, plus `invariants.ts` (1000+ lines per Qoida B), `db-cqrs.ts`, `europrint-compat.ts`. Schema-bloat is real.

## STEP 6 — Ubiquitous language consistency: ~55/100

- "Order" duplicated across **5 aggregates**: `sd/SalesOrder`, `pp/ProductionOrder`, `design/DesignOrder`, `mm/PurchaseOrder`, `order-workflow/OrderAggregate`. Plus controllers in `erp/erp-orders`, `ecommerce/ecommerce-orders`, `compatibility/OrdersRegistryCompatController`. Five contexts each own "an order" but no shared `IOrder` interface or translation table.
- "Customer" split: `sd/SdCustomersService`, `crm/CrmCompaniesService` (companies = customers?), `ecommerce/EcommerceCustomersController`, `shared/.../CustomerId`. The same business entity has three controllers in three modules.
- Department/Position lives in **`core/`** (3 aggregates), **`org-structure/`** (12 flat files) and **`hr/`** (referenced via FK). Three modules, one concept.
- Uzbek/Russian leak: i18n keys mention "Mijoz/Klient/Buyurtma/Zakaz" inconsistently. `compatibility/` (kept by P3-26) and `general/` still ship Uzbek-named files mixed with English.

## STEP 7 — Strategic anti-patterns

1. **God-modules**: `compatibility/` (88 files, 36 raw SQL), `remaining/` (37 files, 12 separate sub-domains: cfo/waste/ideal-rasm/three-way-match/...), `hr/` (230 files — 13 sub-`*.module.ts`).
2. **Featureless modules**: `fi/` = 1 file (`tax/general-tax.service.ts`); `storage/` = 2 files; `feedback-360`, `adaptation`, `export`, `sap`, `sales` ≤ 5 files each — all candidates to fold into a parent context.
3. **Cross-context coupling violations** (file:line):
   - `queue/processors/mrp-run.processor.ts:17-19` → reaches `pp/domain/services/bom-explosion.service`, `wms/domain/services/{eoq-calculator,safety-stock}`.
   - `communication-center/telegram/cc-bot.service.ts` → imports `../../agents`.
   - 16 modules pulling `../../hr/common/db-rows` (helper trapped in wrong context).
4. **Shared database**: all 56 modules share one Postgres; per-context schema separation only via filename (`schema-finance-*.ts`, `schema-hr-*.ts`).
5. **No published-language API**: `admin/domain/aggregates/user.aggregate.ts` exported via 10+ files, including `infrastructure/decorators/roles.decorator.ts:7` and `presentation/controllers/admin-*.controller.ts` — aggregate type leaks to the presentation layer of the same context (intra-context, but no DTO shield).

## STEP 8 — Multi-tenancy

Only `order-workflow/OrderAggregate` carries `tenantId`. `lib/db/src/schema/saas-schema.ts`, `security-ops-schema.ts`, `order-workflow-schema.ts` have `tenant_id`. **53 of 56 modules have zero tenant isolation.** Multi-tenancy is **not** a bounded context yet — it's an undeclared cross-cutting concern.

## STEP 10 — Findings

| # | Item | Result |
|---|---|---|
| 1 | Strategic bounded-context score | **58/100** |
| 2 | Modules with proper BC discipline | **20/56** (~36%) — crm, sd, hr, wms, pp, finance, qc, mes, mm, design, kanban, iot, lms, marketing, notifications, logistics, mro, pos, pos-v2, security |
| 3 | Merge candidates | fi → finance · sales → sd · storage → wms · hr-assets → hr · adaptation+feedback-360+applications → hr · sap+integration+erp → bot-gateway · production → pp |
| 4 | Split candidates | hr (230 → split by 13 sub-modules to ≤100 each) · compatibility (88 → fold into source contexts) · remaining (37 → 12 contexts) · core (29 → org-structure) |
| 5 | Cross-context violations | `queue/processors/mrp-run.processor.ts:17-19`; 42 files importing `hr/common/db-rows`; 36 raw SQLs in `compatibility/` |
| 6 | ACL state | **Missing** — compatibility & remaining are zero-translation pass-throughs |
| 7 | Ubiquitous language score | **55/100** — 5 "Order" aggregates, 3 "Customer" controllers, 3 "Department" owners |
| 8 | Top 5 strategic violations | (a) no context map; (b) no ACL on `compatibility/`+`remaining/`; (c) `hr/common/db-rows` shared kernel in wrong place; (d) 5 unreconciled "Order" aggregates; (e) multi-tenancy unmodeled in 53 modules |

## Recommendations

1. Create `docs/context-map.md` enumerating 8–10 bounded contexts + Customer/Supplier/ACL labels.
2. Move `hr/common/db-rows.ts` → `apps/api/src/common/db/db-rows.ts` and re-export from HR for back-compat.
3. Add an ACL layer to `compatibility/` and `remaining/` — DTOs mapped to new aggregates, raw SQL banned by reviewer.
4. Resolve the 5 "Order" aggregates: publish an `IOrderHeader` interface in `modules/shared/domain/`, document each context's reading model.
5. Merge 7 tiny modules (`fi`, `sales`, `storage`, `hr-assets`, `feedback-360`, `adaptation`, `sap`) into parents.
6. Decide multi-tenancy strategy and add `TenantId` VO to `modules/shared/domain/value-objects/` if going row-scoped.

## Cross-reference vs sprint claim

`docs/ddd-sprint-completion.md` claims **93/100 overall**, derived from tactical layer scores (Domain 94, Application 92, Infrastructure 89, Presentation 94, Cross-cutting 88). **Strategic DDD was not scored separately** — and on independent measurement it's **58/100**, materially lower. The tactical work is real and well-executed; the strategic/bounded-context dimension was not the sprint's focus and remains the weakest pillar.
