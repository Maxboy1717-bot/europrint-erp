# ADR-006: Multi-Tenancy Strategy — Column-Based Isolation with Async-Local Context

## Status

**Decision recorded:** 2026-05-17
**Author:** Wave-6 scaffolding agent
**State:** Accepted — scaffolding committed; rollout phased (see "Rollout phases" below)
**Supersedes:** none
**Superseded by:** none

---

## Context

EuroPrint ERP currently runs as a **single-organization installation**: one
Postgres database, one tenant, one set of users. The HR module already carries
a `tenant_id` column on its core tables (migration `0016_add_tenant_id_to_hr_tables.sql`)
backfilled to `1` for compatibility, and an existing
`apps/api/src/shared/db/tenant-context.ts` propagates the integer id via
`AsyncLocalStorage` — but the rest of the codebase (Sales/Distribution,
Production, WMS, Finance, CRM, SaaS, security-ops) has **no tenant column
at all**. Queries against those tables are implicitly "all rows in the
database belong to the one and only tenant."

This works today. It will **not** work the moment a second tenant is
provisioned, because:

1. There is no SQL `WHERE` predicate that limits a query to one tenant's rows.
2. There is no compile-time or review-time mechanism that **forces** developers
   to add such a predicate when they introduce a new query.
3. Cross-tenant data leakage in an ERP context is catastrophic — financial
   records, customer lists, employee salaries — and is regulated under
   GDPR/UZ-DPL data segregation clauses.

Forecast on the product roadmap (per the Wave-3 SaaS module spec) says
multi-tenant SaaS launch is targeted for **Q3-2026**. We have approximately
four months. Re-architecting the entire data layer at the moment of launch
is not feasible. We need to start adding the scaffolding now so the
incremental migration of each module can begin once this ADR lands.

---

## Decision drivers

- **Operational simplicity:** one database, one connection pool, one backup,
  one set of migrations. The ops team is two engineers and the current
  Postgres install is a single primary + replica.
- **Migration cost:** anything that requires re-importing every tenant's
  data into a separate database/schema is rejected outright.
- **Review-ability:** static review (`grep` / AST scan) must be able to flag
  a query that omits the tenant filter. The reviewer runs in CI; humans
  are not the last line of defence.
- **Compatibility with the existing HR integer-tenant prototype:** the new
  scaffolding coexists with the integer-based system; both can run side by
  side until a future migration unifies them.
- **Postgres limits:** schema-per-tenant hits a soft wall at ~5,000 schemas
  per database (catalog-table bloat, `pg_dump` regressions, `\d`-listing
  pain). We expect to onboard at minimum 200 print shops in year-1; the
  ceiling is too close.
- **Row-Level Security (RLS) considerations:** Postgres RLS is technically
  superior — the database itself refuses to return rows from the wrong
  tenant — but in our experience RLS bugs are debugged by exactly **two**
  people in the entire company. The blast radius of a misconfigured RLS
  policy is "queries silently return empty results", which is harder to
  diagnose than "query is missing a `WHERE` clause".

---

## Options considered

### Option A — Per-tenant database

Each tenant gets a dedicated Postgres database. The connection pool routes
to the correct database based on the JWT tenant claim.

- **Pros:** strongest isolation (physical), trivial per-tenant backup/restore,
  no risk of cross-tenant query bugs whatsoever, easy to relocate a "hot"
  tenant to dedicated hardware.
- **Cons:** ops cost scales linearly with tenant count (200 backups, 200
  migration runs, 200 connection pools), cross-tenant analytics (CFO
  consolidated dashboards across subsidiaries — a confirmed Q4-2026
  requirement) requires a separate warehouse, schema drift across tenants
  is hard to prevent, application-layer joins across tenants become
  application-layer Cartesian fetches.
- **Verdict:** rejected. The operational overhead does not match the team
  size, and the consolidated-analytics requirement is a hard blocker.

### Option B — Schema-per-tenant

One database, one schema per tenant. Application sets `search_path` per
request.

- **Pros:** good isolation, single backup, single migration tool with a loop,
  cheap to clone a tenant.
- **Cons:** Postgres performance degrades with schema count (catalog bloat
  starts to bite around 1,000 schemas, becomes painful around 5,000), every
  ORM migration must run N times, `pg_dump` of the whole database becomes
  unusable, `search_path` is a session-level setting and easy to forget
  inside long-lived connections (PgBouncer transaction pooling makes this
  worse), cross-tenant queries require explicit `UNION` over each schema.
- **Verdict:** rejected. The catalog-bloat ceiling is too close to our
  year-1 onboarding target, and the `search_path` pitfall is exactly the
  category of bug we are trying to eliminate.

### Option C — Row-Level Security (RLS)

Single database, single schema, `tenant_id` column on every tenant-scoped
table, and a Postgres RLS policy:

```sql
CREATE POLICY tenant_isolation ON sd_orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The application sets `SET LOCAL app.tenant_id = ...` at the start of every
transaction.

- **Pros:** the database itself refuses to return rows from the wrong
  tenant — defence in depth, not just discipline. Code that forgets the
  filter simply returns empty results instead of leaking data.
- **Cons:** `SET LOCAL` is per-transaction; in a PgBouncer transaction-pooling
  setup (which we run) a missed `SET LOCAL` reuses the previous transaction's
  tenant id — a silent leak. Debugging "why does this query return zero
  rows" when the policy mismatches is a known operational pain. ORM
  integration is shallow — Drizzle does not yet ship first-class RLS
  helpers, so policy violations surface as 500s, not as compile errors.
- **Verdict:** rejected as the primary mechanism, **kept as plan B**. If
  column-filter discipline slips (the reviewer reports more than zero
  failures sustainably) we will layer RLS on top as a belt-and-braces
  defence.

### Option D — Column-based isolation (chosen)

Single database, single schema. Every tenant-scoped table gains a
`tenant_id uuid not null` column. Every query filters by
`WHERE tenant_id = <ctx.tenantId>`. The current tenant is propagated via
`AsyncLocalStorage` so service signatures stay clean. A reviewer script
(`scripts/reviewer-tenant-isolation.sh`) statically verifies that every
read of a tenant-scoped table carries the filter.

- **Pros:** zero re-architecture; the migration is "add a column, add a
  predicate", each module independently; cross-tenant analytics is a
  trivial `WHERE tenant_id IN (...)` or no filter at all (via the
  `withTenantBypass()` escape hatch); single backup/migration/connection
  pool; reviewable in CI without database access.
- **Cons:** every developer must remember to add the filter on every new
  query — the reviewer catches the omission but only at PR time, not at
  type-check time. Forgotten filters in unreviewed paths (e.g., admin
  scripts) remain a risk. Application-level enforcement is weaker than
  database-level (RLS) enforcement.
- **Verdict:** **chosen.**

---

## Decision

We adopt **column-based multi-tenancy** with the following components:

1. **`TenantId` value object** at
   `apps/api/src/modules/shared/domain/value-objects/tenant-id.vo.ts`,
   following the existing `CustomerId` / `ProductId` pattern (private
   constructor, `Result`-returning factory). Accepts both `string` (UUID
   from JWT) and `number` (legacy integer-tenant compatibility) inputs.
2. **Async-local context** at
   `apps/api/src/common/context/tenant-context.ts` exposing
   `tenantContext`, `getTenantId()`, `runWithTenant()`, and
   `withTenantBypass()` (the elevated-role escape hatch for cross-tenant
   aggregation).
3. **NestJS middleware skeleton** at
   `apps/api/src/common/middleware/tenant.middleware.ts` that reads the
   `tenant_id` claim from `req.user` (populated by `JwtAuthGuard`),
   defaults to `DEFAULT_TENANT_ID` when absent, and runs the rest of the
   request inside `tenantContext.run({ tenantId }, next)`.
4. **CI reviewer** at `scripts/reviewer-tenant-isolation.sh` that greps
   for `db.select().from(<table>)` patterns where `<table>` is on the
   tenant-scoped list, and fails the build if the same statement chain
   does not include `.where(eq(<table>.tenant_id, ...))` within 5 lines.
5. **Cross-tenant escape hatch:** `withTenantBypass(fn)` runs `fn` with
   the tenant set to `null`, which repositories interpret as "no filter".
   Use cases: CFO consolidated dashboards, platform-admin audit queries,
   nightly aggregation jobs. **Requires** the calling controller to be
   guarded by an elevated role (`PLATFORM_ADMIN` or `CFO_CONSOLIDATED`);
   the role check is the caller's responsibility, not the helper's.

The `TenantId` carries UUID semantics for forward-compatibility with the
SaaS launch. The existing HR integer-tenant system at
`apps/api/src/shared/db/tenant-context.ts` continues to operate
independently until the unification migration (Phase P3).

---

## Consequences

### Positive (`+`)

- **No re-architecture required.** Each module gains tenant awareness
  independently; the rollout can be paced.
- **SQL-reviewable.** Every guarded query reduces to a `WHERE tenant_id = $1`
  predicate; a junior engineer can read a query and tell whether it is
  tenant-safe.
- **Operational continuity.** One database, one backup, one migration tool —
  no change to the ops runbook.
- **Cross-tenant analytics is a first-class operation.** Consolidated CFO
  dashboards are a one-line `withTenantBypass()` call (with an explicit
  role check at the controller) rather than a federated query across
  databases.
- **The reviewer catches the common failure mode at PR time** — the
  hardest tenant-isolation bug to debug is the one that returns *wrong*
  rows; this design promotes that bug from runtime to CI.

### Negative (`-`)

- **Every developer must remember the filter.** The reviewer is a
  backstop, not a compiler.
- **No defence in depth.** A SQL injection that bypasses the ORM also
  bypasses tenant isolation. (Mitigation: `sql.raw(variable)` is already
  banned by `Rule B` in `CLAUDE.md` and enforced by `reviewer-raw-sql.sh`.)
- **The reviewer is a heuristic** — it greps within 5 lines and does not
  parse the AST. False negatives are possible for highly creative query
  builders. (Mitigation: keep the list of tenant-scoped tables small and
  audit each module's repos by hand the first time the column is added.)
- **The integer-tenant HR system and the UUID-tenant new system coexist
  during transition.** Each call site must know which context to consult.
  The decision doc (this file) is the authoritative source on which
  modules use which.

---

## Rollout phases

### Phase P1 — Scaffolding (this commit, Wave 6)

- `TenantId` VO created.
- `tenant-context.ts` async-local helpers created.
- `tenant.middleware.ts` skeleton created (not yet wired globally).
- `DEFAULT_TENANT_ID` constant added to `business.constants.ts`.
- `reviewer-tenant-isolation.sh` created with the tenant-scoped-table list
  empty (initial expected output: PASS, because no module has the column
  yet — the reviewer is forward-looking).

**Exit criteria:** files created, typecheck clean, reviewer runs to
completion with the expected initial output.

### Phase P2 — First three modules (future)

The three modules identified by the prior wave's data agent as
already-tenant-aware:

1. `order-workflow` → `sd_orders` table gains `tenant_id uuid not null`.
2. `saas` → `crm_leads` table gains `tenant_id uuid not null`.
3. `security-ops` → `crm_deals` table gains `tenant_id uuid not null`.

For each:
- Add the column via a Drizzle migration (with backfill to
  `DEFAULT_TENANT_ID`).
- Wire the middleware into the module's NestJS module file (`module.imports`
  or `configure(consumer)` in `AppModule`).
- Update the repository to filter every query by `getTenantId()`.
- Add the table name to the reviewer's tenant-scoped-table list.
- The reviewer should now report `PASS` against the new filters.

**Exit criteria:** three repositories filter by tenant, reviewer passes,
manual test of "tenant A cannot see tenant B's data" succeeds.

### Phase P3 — Remaining modules (future)

Expand the column + filter to every remaining tenant-scoped module:
finance, production, WMS, CRM (extended), HR (unify with the existing
integer-tenant system — this is the migration that retires
`shared/db/tenant-context.ts`).

The list of tenant-scoped tables in the reviewer grows with each PR.

**Exit criteria:** every module that holds tenant-customer data filters
by tenant; the integer-tenant scaffolding at
`shared/db/tenant-context.ts` is removed in favour of the UUID-tenant
system.

### Phase P4 — Seeding multi-tenancy (future)

- The seed scripts insert a single tenant row with
  `id = '00000000-0000-0000-0000-000000000001'` representing the
  single-org install.
- A platform-admin UI gains a "Create tenant" action that inserts new
  tenant rows and provisions per-tenant default data.
- The JWT issuer (auth module) embeds the user's `tenant_id` claim on
  login.
- The default-tenant fallback in the middleware remains, but logs a
  warning whenever it is used (so we can find call sites that bypass
  authentication once the SaaS launch happens).

**Exit criteria:** a second tenant can be created, a user can log into
that tenant, and that user sees only their own tenant's data across
every module.

---

## Alternatives explicitly rejected

- **Schema-per-tenant.** Postgres's per-database schema count has a soft
  limit around 5,000 (catalog-table bloat begins to dominate query
  planning around 1,000). Year-1 onboarding target is 200 tenants; year-3
  target is 5,000+. The headroom is insufficient. Migration loops across
  thousands of schemas are also operationally painful.
- **Row-Level Security as the primary mechanism.** Kept as the documented
  Plan B if column-filter discipline slips. RLS is debuggability-painful
  in a PgBouncer transaction-pooling setup, and Drizzle's RLS helpers are
  immature. We reconsider RLS in 12 months if the reviewer reports
  sustained failures.
- **Implicit tenant from the connection pool.** Some frameworks set the
  tenant id at connection-acquire time and assume every query in the
  transaction is for that tenant. PgBouncer transaction pooling violates
  this assumption — a connection released back to the pool can be picked
  up by the next request without a re-acquire — so the design is unsafe
  for us.

---

## References

- `apps/api/src/modules/shared/domain/value-objects/customer-id.vo.ts` —
  the VO pattern this design follows.
- `apps/api/src/shared/db/tenant-context.ts` — the existing
  integer-tenant HR system that this design coexists with and ultimately
  unifies into.
- `lib/db/drizzle/0016_add_tenant_id_to_hr_tables.sql` — the migration
  that introduced the integer-tenant column on HR tables; the model for
  Phase P2 migrations.
- `scripts/reviewer-tenant-isolation.sh` — the CI reviewer created in
  this wave.
- `CLAUDE.md` Rule B — bans `sql.raw(variable)`, which is the only
  realistic way to bypass tenant isolation outside the ORM.
