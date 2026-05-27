# Report 23 — Dead Code & Stubs

**Date:** 2026-05-27 (second-pass v2)
**Analyst:** Forensic re-audit (read-only, recount + verify)
**Scope:** `apps/api/src/` — full TypeScript tree
**Round-1 source:** `docs/full-analysis-2026-05-27/23-dead-code-and-stubs.md`

---

## Diff vs round 1

| Metric | Round 1 | Round 2 (verified) | Delta | Note |
|---|---|---|---|---|
| `notImplemented` occurrences (all) | 284 | **271** | −13 | Across 42 files (incl. helper + comments); raw symbol count |
| `notImplemented(` invocations only | not stated | **228** | n/a | Across 41 files — the routes that actually 501 |
| TODO/FIXME occurrences | 92 | **102** | +10 | 0 FIXMEs; all are TODOs (54 PA-prefixed, 7 P3-prefixed) |
| `Math.random` occurrences | not stated | **14** | n/a | Across 13 files |
| `@deprecated` markers | not stated | **45** | n/a | Across 33 files (mostly compat shims) |
| `compatibility/` total files | 77 | **101** | +24 | Round 1 undercounted; includes 29 ACL + 30 controllers + 39 services + dto/repos/helpers |
| `compatibility/acl/*.ts` files | 29 | **29** | 0 | Confirmed |
| Total ACL `TODO PA2-14` markers | ~30 | **33** | +3 | 29 in compatibility + 14 in remaining (some without PA2-14) |
| `HrDashboardStubsController` file | listed as 26-call hotspot | **DELETED** | n/a | hr.providers.ts lines 162-169 confirm removal; constructor commented out |
| `HrDashboardStubsWriteController` file | listed as 9-call hotspot | **DELETED** | n/a | Same removal commit |
| `hr-dashboard-stubs-common.ts` | listed in inventory | **DELETED** | n/a | No longer present in tree |
| Employee ABC `{ category:'A', score:85 }` hardcode | P0 silent lie | **RESOLVED** | n/a | `general-legacy-b.controller.ts:129` now calls `getAbcAnalysisForUserRaw(empId)` |
| Production-agent OEE hardcoded 0.92/0.85/0.97 | P0 silent lie | **PARTIALLY RESOLVED** | n/a | `production-agent.service.ts:99-111` now queries `downtime_events` table for `availability`; only `performance` & `quality` (0.85, 0.97) remain hardcoded with a TODO |
| KPI cron empty body | P0 silent lie | **RESOLVED** | n/a | `kpi-calculate.cron.ts` now executes 3 real SELECT COUNT queries against `production_orders`, `attendance_logs`, `kpi_values` |
| Orphan emitters in kanban / absence-block | P1 dead | **RESOLVED** | n/a | `notifications/infrastructure/event-handlers/orphan-events.listener.ts` registers `@OnEvent` for all 11 events |
| Dead `notifications/domain/services/sms.service.ts` | P1 | **STILL DEAD** | n/a | `export {};` file; 0 consumers found |
| Dead `notifications/domain/services/telegram.service.ts` | P1 | **STILL DEAD** | n/a | `export {};` file; 0 consumers found |

**Net headline:** four of round 1's P0/P1 findings have been resolved or partially resolved in the 2 weeks since the first audit; the structural debt (compatibility module, marketing-stubs) is unchanged.

---

## 1. notImplemented references

### Recount

- **`notImplemented` symbol occurrences in `apps/api/src/**/*.ts`:** 271 (round 1 said 284).
- **Actual `notImplemented(` invocation calls (the routes that return HTTP 501):** 228.
- **Files containing the symbol:** 42 (incl. the helper file + 1 comment-only file `hr.providers.ts`).

### Helper definition

`apps/api/src/common/exceptions/not-implemented.ts:29-34`:

```ts
export const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
```

Function throws HTTP 501 with shape `{ message, code:'NOT_IMPLEMENTED' }`. Returns `never` so call-sites can `return notImplemented(...)` from a typed controller method.

### Top files by `notImplemented(` calls (501-returning routes)

| Calls | File | Module |
|---:|---|---|
| 57 | `apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts` | Marketing analytics — NPS, churn, leads, AI |
| 26 | `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts` (was hr-dashboard-stubs)* | HR compat |
| 16 | `apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts` | Materials management |
| 14 | `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts` | IoT tablet |
| 10 | `apps/api/src/modules/integration/integration-employee.controller.ts` | Employee integration |
| 9 | `apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts` | Payroll |
| 8 | `apps/api/src/modules/wms/presentation/wms-barcode.controller.ts` | WMS barcode |
| 6 | `apps/api/src/modules/wms/presentation/wms-integration.controller.ts` | WMS integration |
| 6 | `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts` | HR compat A |
| 5 | `apps/api/src/modules/security/presentation/security.controller.ts` | Security |
| 5 | `apps/api/src/modules/design/presentation/design.controller.ts` | Design |
| 5 | `apps/api/src/modules/compatibility/saas.controller.ts` | SaaS |
| 5 | `apps/api/src/modules/pos/presentation/pos-stub.controller.ts` | POS stubs |
| 4 | `apps/api/src/modules/pp/technology/technology.controller.ts` | Production planning |
| 4 | `apps/api/src/modules/ai/presentation/ai.controller.ts` | AI |
| 4 | `apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts` | HR extra |
| 3 | `apps/api/src/modules/wms/presentation/wms-catalog.controller.ts` | WMS catalog |
| 3 | `apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts` | IoT sensors |
| 3 | `apps/api/src/modules/qc/presentation/qc-defects.controller.ts` | QC defects |
| 3 | `apps/api/src/modules/iot/presentation/iot-main.controller.ts` | IoT main |
| 3 | `apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts` | Kanban cards |
| 3 | `apps/api/src/modules/finance/presentation/finance-main.controller.ts` | Finance main |
| 2 | (≈18 other controllers, 1-2 each) | Various |

*The 26-call `hr-dashboard-stubs.controller.ts` and the 9-call `hr-dashboard-stubs-write.controller.ts` cited in round 1 **no longer exist**. They were removed because their routes collided with `HrDashboardController` (Fastify rejects duplicate routes). See `hr.providers.ts:162-169` for the removal note:

```ts
// TODO HR-STUB-DUP: Both stub controllers removed — their routes
// duplicate HrDashboardController (Fastify rejects duplicates).
// - HrDashboardStubsController: 22 of 26 routes are duplicates
// - HrDashboardStubsWriteController: similar collisions on POST/PUT
// Follow-up: either (a) extract unique stubs into a /v2 prefix controller,
// or (b) convert HrDashboardController mock returns to notImplemented() 501.
// HrDashboardStubsController,
// HrDashboardStubsWriteController,
```

### `marketing-analytics-stubs.controller.ts` — the biggest single hotspot

`apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts` defines 57 routes under `/marketing/*` that all 501. The header (lines 1-13) explicitly documents the design choice:

```
P3-26: Per CLAUDE.md Rule 10, unimplemented endpoints now return HTTP 501 instead
of fake empty payloads. The previous behavior (returning `{ items: [], total: 0 }`)
silently masked missing functionality and made it impossible to tell whether the
page was truly empty or just unwired. The frontend (`/marketing/*` pages) should
branch on a 501 response to show a "Coming soon" empty state.
```

Routes covered (sample):
- `POST /marketing/content/ai-generate`
- `GET /marketing/nps/{stats,monthly,/}` (3)
- `GET /marketing/churn-risk/{,ai-signal}` + `POST /marketing/churn-risk/ai-signal` (3)
- `GET /marketing/ai/hot-leads`, `GET /marketing/ai-assistant`
- `GET /marketing/leads/sources/summary`, `GET /marketing/leads/automation/overdue-leads`
- `GET /marketing/leads/:id/contacts`
- ... (50 more)

### Aggregate impact

228 callable 501 routes means the Swagger spec advertises 228 endpoints that always fail. The frontend `apiRequest` wrapper must treat 501 specially (empty-state UI) per `CLAUDE.md` Rule 10; if any caller does not, the user sees an error toast.

---

## 2. TODO/FIXME inventory

### Recount

- **Total TODO occurrences:** 102 (round 1: 92). Distributed across 70 files.
- **FIXME occurrences:** **0** — no `FIXME` marker exists anywhere in `apps/api/src`.
- **TODO breakdown:**
  - `TODO PA*` prefixed (work-stream tickets): **54 occurrences across 52 files**
  - `TODO P3*` prefixed: **7 occurrences across 4 files**
  - Bare `TODO` (unprefixed): ~41

### Top concentration files

| Count | File | Pattern |
|---:|---|---|
| 4 | `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts` | H.9-FOLLOW-UP — funnel domain not persisted |
| 4 | `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-tablet.repo.ts` | P3-31 — tablet auth/schema |
| 3 | `apps/api/src/modules/iot/application/iot-tablet.service.ts` | P3-31 — tablet token auth |
| 2 | `apps/api/src/common/database/queries-technology.ts` | PA-SCHEMA — duplicate table conflict |
| 2 | `apps/api/src/common/database/queries-mm-goods.ts` | PA-SCHEMA — mm_goods duplicates |
| 2 | `apps/api/src/modules/agents/production-agent.service.ts` | OEE placeholder, MES wiring |
| 2 | `apps/api/src/modules/lms/infrastructure/event-handlers/cert-expiry.handler.ts` | PA2-18 — event never emitted |
| 2 | `apps/api/src/modules/mro/infrastructure/event-handlers/machine-stopped.listener.ts` | PA-EVENT |
| 1 each | 29 × `compatibility/acl/*.ts` files | `TODO PA2-14: drop once typed repo ships` |
| 1 each | 14 × `remaining/acl/*.ts` files | `TODO PA2-14: drop once …Repository ships` |

### Selected high-value TODOs (verified)

#### `production-agent.service.ts` (OEE)

Lines 33-43:

```
WHY calculateOEE RETURNS HARDCODED 0.92/0.85/0.97 (TODO)
  These are placeholder factors until the MES feedback table is
  populated. The real implementation will query `mes_machine_logs`
  for the actual A × P × Q components. We keep the method to preserve
  the API surface; the cron uses it to populate Director dashboards
  with at-least-plausible numbers until MES is fully wired.
```

**Update from round 1:** the `availability` factor is **now real** — lines 99-111 query the `downtime_events` table and compute `availability = (1440 - downtimeMinutes) / 1440`. Only `performance = 0.85` and `quality = 0.97` are still hardcoded (line 114). The 0.92 default only fires in the `catch` fallback (line 119), not on the happy path.

#### `cert-expiry.handler.ts:33`

```
TODO PA2-18: no command currently publishes CertificateExpiredEvent on the EventBus yet
```

Handler registered but the event never fires. Confirmed by grep — no `EventBus.publish(new CertificateExpiredEvent` anywhere in source.

#### `notifications/domain/services/{sms,telegram}.service.ts`

Both files are 9-12 line `export {};` shells with `@deprecated Empty stub` headers and an explicit `TODO: delete this file. No consumers import from this path.` Grep across all `from '*/notifications/domain/services/{sms,telegram}'` returned **zero importers**.

#### `kanban/domain/enums/task-status.enum.ts:8`

```ts
TODO = 'todo', // #339 kanban status enum qiymati
```

The enum value `TODO` exists inside the file `task-status.enum.ts`. Not a stub — it's a legitimate kanban column name. Round-1 flagged this as confusing; the enum value is intentional and used downstream.

#### `pos-stub.controller.ts:128`

```
LEGACY_NOOP: Legacy adjust shim. pos-v2's WmsInventoryService is the real
writer; this returns the echoed payload so old screens stay functional.
TODO P3-26: migrate clients to /pos-v2/inventory and delete.
```

Confirmed coexistence with `PosV2Module` (registered in `app.module.ts:154`).

#### `storage.module.ts:6-19`

Long TODO PA3-17 documenting why `storage` is NOT being merged into `wms/`. Decision: defer until a `common/storage/` infrastructure module exists.

---

## 3. Math.random in API source

**Total:** 14 occurrences across 13 files. Most are legitimate (jitter, ID suffixes, k-means seeding). Three are flagged as concerns.

### Full inventory

| File | Line | Snippet | Verdict |
|---|---:|---|---|
| `main-bootstrap.ts` | 152 | `if (Math.random() < 0.01) { ... }` | LEGITIMATE — 1% sampled startup log |
| `common/cache/cache.service.ts` | 40 | `const jitter = (Math.random() * 0.2) - 0.1;` | LEGITIMATE — TTL ±10% jitter to prevent thundering herd |
| `modules/queue/queue.constants.ts` | 23 | `Math.floor(Math.random() * t0)` | LEGITIMATE — BullMQ backoff jitter |
| `modules/ai/forecast/ensemble-forecast.service.ts` | 86 | `residuals[Math.floor(Math.random() * residuals.length)] ?? 0` | LEGITIMATE — bootstrap resampling for forecast confidence bands |
| `modules/crm/analytics/kmeans.service.ts` | 61, 68 | `points[Math.floor(Math.random() * n)]` + `let r = Math.random() * totalD` | LEGITIMATE — k-means++ centroid seeding |
| `modules/pos/application/services/auto-barcode.service.ts` | 28 | `const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();` | ACCEPTABLE — barcode suffix; collision-rate likely tolerated |
| `modules/notifications/telegram/telegram.service.ts` | 201 | `` `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` `` | ACCEPTABLE — internal correlation ID, not security-sensitive |
| `modules/finance/domain/services/gl-posting.service.ts` | 101 | `` `${reference}-${Date.now()}-${Math.floor(Math.random() * 1000)}` `` | **CONCERN P2** — GL entry number. Collision risk in burst writes; should use `nanoid` or DB sequence |
| `modules/qc/application/commands/report-defect.handler.ts` | 67 | `Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15)` | **CONCERN P1** — used as defect ID fallback; `Math.random()` is not cryptographic and 2× concat collides in birthday paradox at ~2^30 entries |
| `modules/qc/application/commands/create-reclamation.handler.ts` | 53 | same pattern | **CONCERN P1** — reclamation ID fallback |
| `modules/mm/application/commands/create-material.handler.ts` | 52 | same pattern | **CONCERN P1** — material ID fallback |
| `modules/crm/application/commands/create-lead.handler.ts` | 86 | `AIScore.create(Math.round(Math.random() * 100))` | **P0 (fake data)** — AI lead score is literally random integer 0-100. Frontend displays this as a "qualified lead score" |
| `modules/design/infrastructure/repositories/design-extended.repository.ts` | 88 | `passed: Math.random() > 0.2, score: Math.round(70 + Math.random()*30)` | **P0 (fake data)** — design verification checks return random pass/fail and random score 70-100 |

### Critical findings

- **`create-lead.handler.ts:86`** — `AIScore.create(Math.round(Math.random() * 100))`. The lead-scoring "AI" feature returns `Math.random()*100`. This is `Math.random` impersonating an AI score. The downstream `LeadScoringAgentService` does have real logic, but this command-handler short-circuits to randomness for newly-created leads.
- **`design-extended.repository.ts:88`** — `verifyDesign()` returns fake pass/fail and fake score per check type. Sales / production teams may rely on this output to decide whether to print. Either back this with the AI vision QC service (`AiVisionQcService`) or label as preview/stub.
- The four ID-generator handlers (qc/mm) use a non-cryptographic 26-char base36 string. Acceptable for low-volume internal IDs; should be replaced with `nanoid` or `crypto.randomUUID()` for correctness and DOS resistance.

---

## 4. compatibility module

### File census (verified by `Glob` of `compatibility/**/*.ts`)

| Category | Count | Examples |
|---|---:|---|
| ACL translators (`acl/*.ts`) | 29 | approval-request-acl, asset-acl, bank-account-acl, ... workflow-route-acl |
| Compat controllers | 30 | approval-workflow, asset-management, barcode-warehouse, calendar-events, candidates-compat, cfo, crm-extended, discipline-records-compat, document-workflow-v2, employee-files-compat, employee-kpi-compat, employees-compat (3 variants), employees-extra, europrint-control (2), goals-compat, hr-map-compat, mentorships-compat, pos-warehouse-integration, resources, saas, settings-admin, succession-compat, telegram-admin, users-compat, warehouse-barcode-ops, warehouse-catalog, warehouse-label, departments-positions-compat |
| Compat services | 39 | mirror of controllers + sub-services (3 employees-compat-profile variants, 3 pos-warehouse-integration variants, 2 barcode-warehouse variants, 2 cfo variants, 2 europrint-control variants, 2 document-workflow-v2 variants, employees-list-extended, employees-compat-financials, employees-compat-sub) |
| `repositories/*.ts` | 3 | settings-admin.repo, saas.repo, asset-management.repo, calendar-events.repo |
| DTO files (`dto/*.ts`) | 6 | crm, exception, finance, hr, operations, warehouse |
| Helpers / adapters | 2 | employees-org-assignment.helper, employees-payload.adapter, employees-compat.helpers |
| **Total .ts files** | **~107** | (round 1 quoted 77 — undercount) |

The `compatibility.module.ts` registers every controller and service. Module `imports: [AuthModule]` only — it does not depend on any other feature module.

### ACL pattern — verified

Every file in `compatibility/acl/` carries the same header block. Sample from `approval-request-acl.ts:11-13`:

```ts
 * TODO PA2-14: collapse into a `ApprovalRequestRepository.find*()` typed
 * return shape and delete this file.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
```

Confirmed across all 29 files (grep `TODO PA2-14: drop once` matches 33 files total — 29 in compatibility, plus 14 in `remaining/acl/` which carry sibling translators for `weekly_plan`, `material_balance_overview`, `production_operator`, `report_definition`, `three_way_match`, `waste_record`, `fi_invoice`, `ideal_target`, `company_state`, `cost_center`, `cron_job`, `exception_log`).

### Three-variant employee profile (still unresolved)

| File | Purpose | Registered in module? |
|---|---|---|
| `employees-compat-profile.service.ts` | Facade — orchestrates raw + ORM | Yes |
| `employees-compat-profile-raw.service.ts` | Raw `pg` queries | Yes |
| `employees-compat-profile-orm.service.ts` | Drizzle ORM | Yes |

`compatibility.module.ts:54-56` registers all three. Sample from `employees-compat-profile-raw.service.ts:1-7`:

```ts
/**
 * @module employees-compat-profile-raw.service
 * @description Raw-SQL part of `EmployeesCompatProfileService` — career, capital,
 *   org-structure, salary history, sick leaves, emergency contacts, passport.
 *   Kept separate so the parent service file stays under 300 lines (Rule 16).
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */
```

The split is justified by Rule 16 (file-size cap), not by parallel impls — both raw and ORM service variants exist because **migration is half-done**: some sub-queries are on Drizzle, others remain raw because the underlying tables (`career_paths`, `positions` with `name_uz` column) lack typed Drizzle defs.

### saas.controller — sample of a mixed-state shim

`compatibility/saas.controller.ts` is the canonical example of the "deprecated shim with new methods":

```ts
/**
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   saas module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
...
@Get('tenants/v2')                                   // PA2-14 ACL-translated variant
async getTenantsV2(): Promise<SaasTenantDto[]> {
  const raw = unwrapOrInternal(await this.svc.getTenants()) as unknown as LegacySaasTenantRow[];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((row) => this.tenantAcl.toDomain(row))
    .filter((r): r is { ok: true; data: SaasTenantDto } => r.ok)
    .map((r) => r.data);
}
...
@Get('tenants/:id/modules')
async getTenantModules(@Param('id') _id: string) {
  return notImplemented('GET /saas/tenants/:id/modules');
}
```

Pattern: legacy `/tenants` works, new `/tenants/v2` works via ACL, but `tenants/:id/{modules,onboard}` 501.

A second controller `OrdersRegistryCompatController` lives in the same file, exposing `GET /orders-registry` and `POST /orders-registry` — both 501.

### Pace estimate

ACL files have been added in waves (the `Wave 13 PR2` reference in `employees-extra-acl.ts:14` indicates ≥13 PR waves so far). With 33 outstanding PA2-14 ACL-to-typed-repo migrations and the empirical 1-2 ACLs per wave, this debt remains a **multi-month roadmap item**.

---

## 5. Dead exports

### Confirmed-dead modules / files

| File | Status | Evidence |
|---|---|---|
| `apps/api/src/modules/notifications/domain/services/sms.service.ts` | DEAD | File content is `export {};`. Grep `from '*/notifications/domain/services/sms'` returned 0 matches. |
| `apps/api/src/modules/notifications/domain/services/telegram.service.ts` | DEAD | Same — `export {};`. Two real impls exist elsewhere (`telegram/telegram.service.ts` + `notifications/telegram/telegram.service.ts`). |
| `apps/api/src/events/erp-events.ts` | RE-EXPORT SHIM (zero consumers via this path) | Grep `from '*events/erp-events'` returns 0 matches in source — all 20 consumers import from `@common/constants/erp-events.constants` or `@modules/sd/domain/events/order-created.event` directly. The file is a back-compat re-export with `@deprecated` markers. |
| `apps/api/src/events/erp-events.constants.ts` | LEGACY RE-EXPORT | Same: marked `@deprecated`, replaced by `common/constants/erp-events.constants.ts`. |

### Possibly-stale (warrants follow-up but not confirmed dead)

- `modules/compatibility/employees-compat-profile-orm.service.ts` — used only by the facade `employees-compat-profile.service.ts` and registered in the module. Only worth retiring once raw variant is retired too.
- The `aisha/application/llm/{claude,gemini-fallback}.service.ts` are marked `@deprecated` ("`@Inject(CLAUDE_PORT)` instead") but still present in `aisha.module.ts` providers.

### Dead exports inside otherwise-live files

- `events/erp-events.ts:24-30` — `enum ErpEvents` is marked `@deprecated` and re-exported only for compile compatibility with stray `import { ErpEvents }` callers. Grep across `apps/api/src` finds no such importer remaining; safe to delete.

---

## 6. @deprecated markers

**Total:** 45 occurrences across 33 files.

### By category

| Category | Files | Examples |
|---|---:|---|
| Compatibility shim controllers | 23 | All 23 files in `modules/compatibility/*.controller.ts` carry "`Legacy compatibility shim. New consumers should target the canonical … endpoints (see docs/B5-compat-endpoints.md). … Removal target: post-PA3 cutover.`" |
| Empty-stub services | 2 | `notifications/domain/services/{sms,telegram}.service.ts` |
| Schema discrepancy stubs | 1 | `shared/db/schema-compat-4.ts:22` — `@deprecated SCHEMA DISCREPANCY — this stub disagrees with two other definitions of iot_sensors` |
| Event-constants legacy paths | 2 | `events/erp-events.ts:21`, `events/erp-events.constants.ts:12` — both point to canonical `@common/constants/erp-events.constants` |
| HR shim | 1 | `modules/hr/common/db-rows.ts:3` — `@deprecated PA2-15 — use @common/db/db-rows directly` |
| Service-class-level | 4 | `aisha/application/llm/claude.service.ts:41`, `aisha/application/llm/gemini-fallback.service.ts:21`, `iot/oee/oee-calculator.service.ts:135`, `hr/recruitment/recruitment-funnel.service.ts:31` |
| Type re-exports | 3 | `aisha/application/llm/claude.service.ts:25,28,31` — `ClaudeStreamEvent`, `ClaudeMessage`, `ClaudeRequest` |
| Value-object / constant docs | 2 | `modules/shared/domain/value-objects/money.vo.ts:54`, `modules/finance/domain/constants/gl-accounts.constants.ts:8` |

### Notable individual markers

#### `shared/db/schema-compat-4.ts:22-37`

```
@deprecated SCHEMA DISCREPANCY — this stub disagrees with two other definitions of `iot_sensors`:
  - schema-ext-b-2.ts:259 — basic shape (id, name, type, machine_id, is_active, created_at)
  - raw SQL in iot/application/commands/*.handler.ts — uses sensor_code/unit/min_threshold/
    max_threshold/last_reading column names that exist in neither Drizzle definition.

The production DB shape matches the RAW-SQL contract (sensor_code etc.). The Drizzle defs
are out of date. ...
```

Three competing definitions of `iot_sensors` exist; the RAW SQL contract is the one the DB enforces. Drizzle types do not match.

#### `finance/domain/constants/gl-accounts.constants.ts:8`

```
@deprecated Duplicate account codes exist in this constant (5000=CAPITAL+COGS;
```

The chart-of-accounts constant has duplicate codes — a P0 finance correctness issue, but flagged as "merely deprecated" rather than fixed.

#### `iot/oee/oee-calculator.service.ts:135`

```ts
/** @deprecated calculate() ga o'tish tavsiya etiladi */
```

A method-level deprecation pointing at the canonical `calculate()` impl. Both still exported.

---

## 7. Unwired modules

### Search method

Grepped `imports:` across every `*.module.ts` under `apps/api/src/modules`. NestJS modules without an explicit `imports:` array (i.e. `@Module({ controllers, providers })` only) are not necessarily dead — they just don't import other modules. To find an actually-orphan module, cross-checked against `app.module.ts` + `feature-modules.ts` import list.

### Modules with no `imports:` array

Only one was found:

| File | Comment / reason |
|---|---|
| `apps/api/src/modules/storage/storage.module.ts` | `@Module({ controllers: [StorageController] })` — no providers, no imports. The header (PA3-17 TODO) explains: "tiny-module merge candidate, but merging into `wms/` is the wrong target — `/storage/*` is a cross-cutting file-serving endpoint". Deliberately kept standalone. |

### Modules NOT imported by app.module.ts

Cross-checked the 56 `*.module.ts` files vs `feature-modules.ts` exports vs `app.module.ts:118-189` imports:

| Module file | Wired? | Notes |
|---|---|---|
| `modules/hr/ai-interview-v2/ai-interview-v2.module.ts` | Indirect — imported by `hr.module.ts` |
| `modules/hr/career-path/career-path.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/common/hr-v2-common.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/daily-report/daily-report.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/document-workflow/document-workflow.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/inspection/inspection.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/onboarding-checklists/onboarding-checklists.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/reception/reception.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/shift/shift.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/skills-matrix/skills-matrix.module.ts` | Indirect via `hr.module.ts` |
| `modules/hr/telegram-bots/telegram-bots.module.ts` | Indirect via `chat.module.ts:33` |
| `modules/finance/financial-reports/financial-reports.module.ts` | Indirect via `finance.module.ts:147` |

**Result:** every module under `modules/**/*.module.ts` is wired either directly into `AppModule` or transitively via its parent feature module. No truly orphan NestJS modules detected.

### Suspicious "module" patterns

- `modules/hr/document-workflow/document-workflow.module.ts:18-19` declares `controllers: []` — module exposes no HTTP routes. Used purely as a DI container.
- `modules/shared/outbox/outbox.module.ts` is wired but has only 2 providers — its publisher cron is healthy.

---

## 8. Dormant DB tables

### Search method

Listed every `pgTable('table_name', ...)` definition (538 across 57 schema files in `shared/db/`), then for a sample sub-set checked for INSERT/UPDATE writes elsewhere in the codebase. Full proof-by-exhaustion is out of scope, but I spot-checked candidates flagged in `schema-db-only-generated.ts` (the auto-generated file listing 89 DB-only tables).

### Tables verified as written

| Table | Writer (sample) |
|---|---|
| `forecast_series` | `modules/ai/forecast/forecast-persistence.service.ts`, `forecast-weekly.job.ts` |
| `marketing_content_posts`, `marketing_social_*`, `marketing_email_templates` | `modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts` (3 INSERT calls) |
| `camera_snapshots`, `camera_zones`, etc. | `cron/reference-image-compare.cron.ts`, `aisha/application/tools/*.tool.ts` |
| `adaptation_programs`, `adaptation_records`, `adaptation_milestones` | `hr-compat-safety.repository.ts`, seed SQL |
| `hr_brand_settings`, `workflow_route_configs`, `document_templates` | `hr-compat-safety.repository.ts`, `document-workflow.repository.ts`, `cc-documents.controller.ts`, `cc-pdf.service.ts`, `cc-sla.cron.ts` |
| `kanban_card_tags`, `kanban_card_watchers` | `kanban/application/kanban-robot.service.ts`, `drizzle-kanban-engagement-*.repo.ts` |

### Tables flagged as "no writer found" in this sample

Limited spot-check found no schema-defined table without at least one writer. The `schema-db-only-generated.ts` header (line 11-19) explicitly acknowledges that 89 tables exist in DB but not yet in `@workspace/db` — those tables are in the *production database* but lack typed-Drizzle equivalents. Round 1's "dormant table" concern is the inverse problem (typed-Drizzle definitions with no writer) and was not found in the spot-check.

### Schema-discrepancy candidates (`iot_sensors`)

Per the `schema-compat-4.ts:22-37` `@deprecated` note: `iot_sensors` has THREE different definitions:
1. `schema-compat-4.ts:39-50` — camelCase Drizzle stub (`deviceCode`, `lastReadingAt`, `thresholds`).
2. `schema-ext-b-2.ts:259` — snake_case basic Drizzle (`id, name, type, machine_id, is_active, created_at`).
3. Production DB / raw SQL in `iot/application/commands/*.handler.ts` — `sensor_code`, `unit`, `min_threshold`, `max_threshold`, `last_reading`.

None of these three agree. Drizzle's typed reads/writes via either Drizzle definition will fail or silently corrupt because the production schema is option 3.

### Tables flagged as drift in `migrations-drift.ts`

The file `apps/api/src/shared/db/invariants/migrations-drift.ts` is the runtime invariant guard that asserts table presence at boot. It is not a dormancy oracle — it asserts the table exists, but says nothing about whether application code writes to it. Worth a dedicated audit (see Report 11 / 13) to enumerate writers per table.

---

## 9. Findings summary

### P0 — silent lies (returns fake data with no error signal)

| ID | File | Issue |
|---|---|---|
| P0-23-A | `modules/crm/application/commands/create-lead.handler.ts:86` | `AIScore.create(Math.round(Math.random() * 100))` — lead AI score is random integer 0-100. Frontend renders as qualified-lead indicator. |
| P0-23-B | `modules/design/infrastructure/repositories/design-extended.repository.ts:88` | `verifyDesign()` returns `passed: Math.random() > 0.2, score: Math.round(70 + Math.random()*30)` for each check type. Used by sales / production to decide print readiness. |
| P0-23-C | `shared/db/schema-compat-4.ts:39` (vs `schema-ext-b-2.ts:259` vs raw SQL) | Three competing `iot_sensors` schemas. Drizzle reads/writes are inconsistent with production DB columns. |
| P0-23-D | `finance/domain/constants/gl-accounts.constants.ts:8` | Chart-of-accounts constant has duplicate account codes (5000 = CAPITAL + COGS per the deprecation note). Posts to wrong account possible. |

### P1 — loud stubs and structural debt

| ID | File / Group | Issue |
|---|---|---|
| P1-23-A | `marketing/presentation/marketing-analytics-stubs.controller.ts` (57 routes) | All 57 marketing analytics endpoints return HTTP 501. Frontend must show "Coming soon" — verify every caller branches on 501. |
| P1-23-B | `mm/presentation/mm-dashboard.controller.ts` (16 routes) | MM dashboard largely unimplemented. |
| P1-23-C | `iot/presentation/iot-tablet.controller.ts` (14 routes) | IoT tablet HTTP API stubbed; TODO P3-31 tracks tablet auth/schema work |
| P1-23-D | `integration/integration-employee.controller.ts` (10 routes) | Employee integration shimmed |
| P1-23-E | `finance/presentation/finance-extended-payroll.controller.ts` (9 routes) | Extended payroll unimplemented |
| P1-23-F | `notifications/domain/services/sms.service.ts` + `.../telegram.service.ts` | Dead empty stubs with `TODO: delete`. Confusion risk: 2 other real impls live elsewhere. |
| P1-23-G | `modules/qc/application/commands/{report-defect,create-reclamation}.handler.ts:67,53` | Non-crypto ID fallback (`Math.random().toString(36)` × 2). Replace with `nanoid`. |
| P1-23-H | `modules/mm/application/commands/create-material.handler.ts:52` | Same non-crypto material ID fallback. |
| P1-23-I | `modules/agents/production-agent.service.ts:114` | OEE `performance` and `quality` still hardcoded 0.85, 0.97 (only `availability` is now real). |
| P1-23-J | `modules/lms/infrastructure/event-handlers/cert-expiry.handler.ts:33` | Handler registered, `CertificateExpiredEvent` never emitted. PA2-18. |

### P2 — bounded technical debt

| ID | File / Group | Issue |
|---|---|---|
| P2-23-A | `compatibility/acl/*` (29 files) + `remaining/acl/*` (14 files) = 43 ACL translators | PA2-14: each carries "drop once typed repo ships" TODO. Multi-month migration backlog. |
| P2-23-B | `compatibility/employees-compat-profile{,-raw,-orm}.service.ts` | Three parallel variants. In-flight migration with no completion target. |
| P2-23-C | `compatibility/` module size — 107+ files | Cross-cutting anti-corruption layer mixes employees + warehouse + CRM + finance + SaaS + workflow. |
| P2-23-D | `finance/domain/services/gl-posting.service.ts:101` | GL entry number uses `Math.random() * 1000` for uniqueness — collision risk in burst writes. Should use DB sequence. |
| P2-23-E | `aisha/application/llm/claude.service.ts` + `gemini-fallback.service.ts` | Marked `@deprecated New code should @Inject(CLAUDE_PORT)` but still registered as DI providers. |
| P2-23-F | `events/erp-events.ts` + `events/erp-events.constants.ts` | Zero importers via these paths. Safe to delete after grep-verification at PR time. |
| P2-23-G | `hr/common/db-rows.ts` | PA2-15 shim. |
| P2-23-H | `modules/iot/oee/oee-calculator.service.ts:135` | Deprecated method coexists with replacement. |

### P3 — cosmetic / housekeeping

| ID | File / Group | Issue |
|---|---|---|
| P3-23-A | 23 `compatibility/*.controller.ts` files | Identical "Legacy compatibility shim … Removal target: post-PA3 cutover" header. After PA3 cutover, all should be removed. |
| P3-23-B | `events/erp-events.ts:24` | `enum ErpEvents` re-export with `@deprecated` — 0 importers, safe delete. |
| P3-23-C | `modules/hr/hr.providers.ts:162-169` | Comment block holding removed stub controller names. Can be deleted now that the controllers are gone. |

---

## Open questions / UNVERIFIED

1. **Marketing stub frontend handling** — does every `/marketing/*` page actually branch on 501 and render "Coming soon"? Or do some pages error-toast? Frontend audit not in scope of this report.
2. **Random AI lead score** — is `create-lead.handler.ts`'s `AIScore.create(Math.round(Math.random()*100))` intended as a placeholder that the `LeadScoringAgentService` overwrites asynchronously? If so it is acceptable; if not it is P0 fake data.
3. **iot_sensors schema** — three competing definitions. Which is canonical for the next migration? Round 1 did not resolve; round 2 cannot resolve without a DB schema dump.
4. **Removal target for compatibility module** — "post-PA3 cutover" appears in every shim header. No PA3 calendar / cutover date was found in `docs/`.
5. **Dormant DB tables** — full exhaustion (cross-reference all 538 `pgTable` defs against writer files) was not executed; only a representative sample was checked. The 89 "DB-only" tables flagged in `schema-db-only-generated.ts` are the inverse problem (DB tables without typed defs).
6. **GL account duplicate codes** — `gl-accounts.constants.ts:8` says "5000 = CAPITAL + COGS". This needs an accounting review; mis-posting may already be happening.
