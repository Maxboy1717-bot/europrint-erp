# Deferred decisions — items blocked on an owner/architecture decision

**Purpose:** a record of fixes that were *investigated and confirmed real* but **deferred**
because completing them requires a design/semantic decision the executor must not guess
(CLAUDE.md Q-34 design-decision gate, Q-40 "correct = master-plan vision", Q-27 vision vs
execution). Each entry states what is broken, why it is blocked, what decision is needed, and
what was intentionally **left untouched** (Q-39 no-regression: live code is not broken while we wait).

This is distinct from `deleted-routes.md` (things removed root-and-branch). Nothing here is
deleted — it is parked until the owner resolves the dependency.

---

## 2026-06-03 — STAGE 1.3: QC approve / reject / inspector-submit (silent echo)

**What is broken (confirmed live):** 8 endpoints in
`apps/api/src/modules/qc/presentation/qc-defects.controller.ts` only parse the body and echo a
literal — they never write to the DB (Q-40 "green but wrong" / silent data loss):

| Route(s) | Handler | Echo |
|----------|---------|------|
| `PATCH/POST /api/qc/approve/finance/:orderId` | `approveFinance` / `postApproveFinance` (144, 154) | `{ orderId, approved: true }` |
| `PATCH/POST /api/qc/approve/qc/:orderId` | `approveQc` / `postApproveQc` (164, 174) | `{ orderId, approved: true }` |
| `PATCH/POST /api/qc/reject/:orderId` | `rejectOrder` / `postRejectOrder` (184, 194) | `{ orderId, rejected: true }` |
| `PATCH/POST /api/qc/inspector-submit/:orderId` | `inspectorSubmit` / `postInspectorSubmit` (204, 214) | `{ orderId, submitted: true }` |

**These ARE live (so this is real data loss, not dead code):**
- `artifacts/erp-dashboard/src/pages/QCApproval.tsx:75,92,119` — inspector-submit, approve/qc, reject (stage `qc`)
- `artifacts/erp-dashboard/src/pages/FinanceApproval.tsx:52,68` — approve/finance, reject (stage `finance`)

**Why deferred — the "real UPDATE" target table is genuinely ambiguous (Q-34):**
- The FE drives an order-status workflow: QCApproval reads `GET /api/qc/pending/qc` and filters
  `status === "pending_qc" | "pending_review"`; FinanceApproval reads `GET /api/papka-orders?status=approved`.
  After approve/reject the FE invalidates those lists — i.e. it expects the **order's status** to change.
- But the canonical order-status table is unclear:
  - `papka_orders` is documented as a **messaging table** (`from_user_id`/`to_user_ids`/`subject`/`body`/`files`;
    `apps/api/src/shared/db/schema-business-c-1.ts:156`) yet FinanceApproval reads `/api/papka-orders` as orders.
  - `GET /api/qc/pending/qc` has **no locatable backend handler** (likely missing / 404).
  - `qc_inspections` exists (`order_id`, `status`) but is **empty (0 rows)** and is not the status the FE filters on.
  - `sales_orders` has `status` / `overall_status` / `tech_approved_*` but **no `qc_status`** column.
- Guessing a target risks writing to the messaging table (`papka_orders`) or inventing a status state
  machine — worse than the Stage-1.1 `/material-cards` mis-target. Q-34 forbids choosing the table unilaterally.

**Decision needed (owner / master-plan vision, Q-27):**
1. Which table holds the **canonical order QC/finance approval status**? (This is tied to the known
   "two order worlds / canonical order table" architecture item — owner's Q1.)
2. The status state machine: `pending_qc → (inspector-submit) → pending_review → (approve/qc) → … →
   (approve/finance) → done`, with `reject` at each stage → which status values?
3. Should `inspector-submit` also persist the QC results into `qc_inspections`?

**Left untouched (Q-39):** the 8 echo handlers are **not modified** — they stay live (returning their
echo) until the canonical order-world decision is made, so nothing that "works" today is broken. When the
owner resolves the order-table question, re-open this as a real-UPDATE fix.

**Verified by:** code read (controller + 2 FE pages) + DB schema/row-count proof via `_audit/q.cjs`
(qc_inspections empty; papka_orders = messaging; sales_orders has no qc_status). Backend live at :3030.

---

## Found bugs (out of current scope) — fix later

### 2026-06-04 — eNPS respond: `surveyId` hardcoded to 0 (responses not bound to a survey)
**Symptom:** `apps/api/src/modules/hr/enps/enps.controller.ts:86` — `respond()` passes
`surveyId: 0, // placeholder for now` to `repo.respond(...)`, so **every** eNPS response is written
with `survey_id = 0` instead of the survey it answers. Responses are therefore not linkable back to
their survey (silent data-integrity loss — a Q-40 "green but wrong").

**Found during:** FIX 1 (PIP/eNPS role gate, 2026-06-04). The role-gate subagent surfaced it while
auditing the controller. **Not fixed in the security pass** — it is a separate *functional* defect, and
the endpoint has **no live FE consumer** (grep: nothing calls `hr-v2/enps/respond`; the eNPS page
`HREnps.tsx` uses a different `/api/hr/enps/surveys*` path family).

**Also latent (same endpoint):** `employee_id` is taken from the request body unchecked — a self-response
endpoint should derive it from `request.user` so a user can only submit as themselves. Moot today (HR-gated
by FIX 1 + no FE caller), but must be addressed if eNPS self-response is ever exposed to employees.

**Fix candidates (owner picks later):**
- (a) take `survey_id` from a route param (`POST /hr-v2/enps/:id/respond`) or the body, validate it exists; AND
- (b) derive `employee_id` from `request.user` (self-ownership), not the body — and decide whether `respond`
  should be reachable by all employees (with self-ownership) vs HR-only (it is HR-only now).

**Left untouched (Q-39):** the handler is unchanged; it is now HR-gated (FIX 1) and has no live caller, so
nothing that "works" today is broken while this waits.

### 2026-06-04 — POST /api/asset-management/maintenance returns 400 (maintenance create broken)
**Symptom:** the FE "add maintenance" form (`AssetManagement.tsx` → `completeMaintenanceForm` flow uses
`POST /api/asset-management/maintenance` to create) gets HTTP 400. Surfaced during the STAGE-1.4
live-HTTP proof (the live `complete` test had to seed a row directly because create failed).

**Cause:** `apps/api/src/modules/compatibility/repositories/asset-management.repo.ts` `insertMaintenance`
uses Drizzle `db.insert(assetMaintenance).values({...})`; Drizzle emits `id` + `created_at` as the SQL
keyword `default` — but the physical `asset_maintenance.id` (uuid) and `created_at` columns have **NO DB
default** (confirmed via information_schema), so the INSERT fails:
`Failed query: insert into "asset_maintenance" (..., "id", ..., "created_at") values (default, $1..., default)`.

**NOT this session's fix:** STAGE 1.4 fixed `depreciate` + `maintenance/:id/complete` (both live-proven).
The `create` endpoint is a separate pre-existing bug — left untouched (Q-39).

**Fix candidates (owner picks later):**
- (a) make the `assetMaintenance` Drizzle schema generate them client-side — `id` `.defaultRandom()`,
  `createdAt` `.$defaultFn(() => new Date())` / `.defaultNow()`; OR
- (b) add DB defaults `gen_random_uuid()` / `now()` to `asset_maintenance.id` / `created_at` (a migration →
  Q-35 owner permission); OR
- (c) `insertMaintenance` provides `id`/`createdAt` explicitly.

**Verified by:** live `POST /api/asset-management/maintenance` → 400 with the `values (default, …, default)`
error body; `asset_maintenance.id`/`created_at` confirmed no-default in information_schema.

### 2026-06-04 — CAT 3 (Result pattern) for 3 POS repo list-methods — SKIPPED (service already wraps)
A code-style cleanup proposed converting 3 raw-array repo methods to `Promise<Result<T>>`:
`AutoGlPostingRepository.listForMovement` + `.getJournal` and `ThreeWayMatchRepository.listVariances`
(all currently `Promise<unknown[]>`). **Skipped, not done**, because:
- **Verify-don't-trust:** the audit (cca-group1-codestyle.md) also listed `ThreeWayMatchRepository.update`
  and `.insert` as violations — but reading the code, both ALREADY return `Promise<Result<…>>` via `safeCall`.
  So 2 of the 5 flagged methods were false positives.
- The 3 real raw-array methods are intentional **raw query helpers** that the SERVICE layer already wraps
  in Result: `three-way-match.service.ts:80` does `Ok(await this.repo.listVariances())`, and
  `auto-gl-posting.service.ts` wraps with `.then/.catch`. The Result pattern is therefore satisfied at the
  service boundary (which is what controllers consume).
- Converting the repo methods would be **redundant** with the service wrapping AND would change error-path
  behavior: `three-way-match.service.ts:92` currently does `await this.repo.listVariances() as Array<…>`
  (a DB error throws → 500); after a Result conversion an unguarded `r.ok ? r.data : []` would return `[]`
  on error (200 with empty data) — a behavior change.

**Decision:** leave the 3 repo methods as raw helpers. If a future pass wants strict per-method Result,
it must also update the 2 services to pass the Result through and unwrap with `unwrapOrThrow` (to keep the
500-on-error behavior). Out of scope for the behavior-preserving cleanup.
