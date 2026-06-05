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

## 2026-06-04 — FIX 4: POS→WMS/GL event bridge (PosMovementCompletedEvent NOT published)

> **⚠️ CORRECTION (2026-06-04, PHASE-1 two-worlds work):** the premise below originally said
> on-hand stock lives in "TWO parallel tables (current_stock ╳ warehouse_stock)". **That is wrong.**
> Live check (`pg_class.relkind`, `pg_get_viewdef`): **`current_stock` is a VIEW over `warehouse_stock`**
> (`SELECT … quantity AS quantity_on_hand, … material_id … FROM warehouse_stock`). They are the SAME
> data, not parallel. So the **canonical stock table is `warehouse_stock`**; `current_stock` is just a
> read/write alias. The double-write risk STILL holds, but reframed: the completion flow already writes
> `warehouse_stock` (inline, via the `current_stock` view) and the compat integration writes it too — so
> the dormant `onMovementCompleted` listener would be a **redundant extra writer to the same
> `warehouse_stock` table** (not a second table). The fix when activated: publish the event but let
> `onMovementCompleted` write only the **journal + GL** legs (warehouse_transactions + gl_posting_log),
> NOT stock — stock is already maintained. The "which of two tables is canonical" question is moot.

**What was proposed:** publish `PosMovementCompletedEvent` when a POS movement is completed, so the
(currently dormant) CQRS listeners run and the POS→warehouse/GL bridge comes alive:
- `PosWmsSyncCompletedListener` → `PosWmsSyncService.onMovementCompleted` — writes `warehouse_stock` + `warehouse_transactions`
- `PosGlAutoListener` → `pos-gl-auto` — writes `gl_posting_log`

Today nothing publishes it on the CQRS bus. `pos-movement-status.service.ts:86` emits the legacy
EventEmitter2 string `pos.movement.data.completed`, but that reaches only the notification handler — there
is no EE2→CQRS reverse bridge, so the WMS/GL `@EventsHandler` listeners never fire.

**Why deferred — DOUBLE-WRITE on stock (Q-40 "green but wrong"):** `warehouse_stock` is the single
canonical on-hand table; `current_stock` is a VIEW over it (see correction above). It is already written by
TWO live paths, and the dormant listener would add a third — all hitting the SAME `warehouse_stock`:

| Writer (all hit `warehouse_stock`) | Path | When |
|-------|------|------|
| `_processCompletedMovement` (`pos-movement-status.service.ts:163-174`) | inline, via the `current_stock` VIEW (upsertStockIn / decrementStock) | every completion |
| `compatibility/pos-warehouse-integration*.service.ts` | direct | its own flow |
| `pos-wms-sync.helpers.ts upsertWarehouseStock` (dormant `onMovementCompleted`) | direct | only if the event is published |

Publishing the event makes `onMovementCompleted` a redundant extra writer to `warehouse_stock`, so each
completion would increment the SAME stock row twice (once inline via the view, once via the listener) →
double-count. That is the conflict the executor was instructed to stop on.

**Nuance — only the stock leg conflicts; the journal + GL legs are safe.** Publishing the event activates
three consumers; two have NO inline writer (safe), one conflicts:

| Event consumer | Target | Verdict |
|----------------|--------|---------|
| onMovementCompleted → stock | `warehouse_stock` | ⚠️ CONFLICT (current_stock inline + compat already write stock) |
| onMovementCompleted → journal | `warehouse_transactions` | ✅ safe (no inline writer; FIX 2 fixed its direction + `unit` drift) |
| pos-gl-auto → GL | `gl_posting_log` | ✅ safe (no inline writer) |

**Decision needed (owner / architecture, Q-27/Q-34):** NOT "which of two tables" — `current_stock` is a
VIEW over `warehouse_stock` (settled). The remaining decision: when the bridge is activated, the dormant
`onMovementCompleted` must write ONLY the journal + GL legs and SKIP the stock upsert (stock is already
maintained by the inline completion path) — OR the inline stock write is removed in favour of the listener.
Either way exactly ONE writer per completion. Until that split is implemented, the event must NOT be published.

**Left untouched (Q-39):** `pos-movement-status.service.ts` is unchanged; no event publish was added; the
listeners stay dormant — nothing that works today is broken.

**De-risked for the future (FIX 2, commit 497a731c):** when the bridge IS eventually activated,
`warehouse_transactions` will record the correct movement direction and the handler will not crash on the
`unit` column (both fixed in FIX 2). So the journal + GL legs are ready; only the stock-table canonicity
blocks activation.

**Verified by:** code read (`pos-movement-status.service.ts` updateStatus + _processCompletedMovement;
`pos-wms-sync.service.ts` onMovementCompleted; `pos-wms-sync.helpers.ts` upsertWarehouseStock) + grep of
warehouse_stock writers (8 files incl. compatibility/pos-warehouse-integration*) + DB counts
(current_stock=25, warehouse_stock=25) via `_audit/q.cjs`. A read-only subagent investigation was
cross-checked; its "warehouse_stock empty" claim was corrected (the table holds 25 rows).

---

## Found bugs (out of current scope) — fix later

### 2026-06-04 — PRODUCTION-ORDER WORLD (`orders`/sd_orders/ow_orders) — separate from sales_orders (STEP 3 A.4)
Found during STEP 3 BO'LAK A. The "second order world" is a **production-order** concept, distinct
from the canonical `sales_orders` (12 real sales orders). Scope: `orders` table + `sd_orders` VIEW +
`ow_orders` VIEW + the **order-workflow module** (`drizzle-order.repo.ts`, `order-transition.guard.ts`)
+ **legacy-iot production reports** (`legacy-iot.service.ts:96,111` getProductionOrdersReport/
getPpProductionOrders) + **legacy-warehouse** (`legacy-warehouse.helpers.ts:176` getOrdersByDateRaw) +
**seed-sd-marketing** sd_orders seed.

**Why it's NOT a clean repoint to sales_orders (verified live):**
- `orders` is a **CONFLATED table**: production fields (`product_id`, `work_center_id`,
  `production_order_id` — used by legacy-iot's production joins) MIXED WITH SD-ish fields
  (`advance_percent`, `balance_due`, `delivery_*`, `receiver_*` — used by the seed). sales_orders has
  NEITHER set fully, so a naive `FROM orders -> FROM sales_orders` repoint **breaks** (missing columns)
  and is **semantically wrong** (production order ≠ sales order).
- order-workflow is a separate **lifecycle** with its own columns (`state_version`, `customer_tier`,
  `assigned_sales_manager`, `tenant_id`) not on sales_orders.
- All of it is **0 rows (dormant)**. All ids are integer (no uuid issue — verified).

**Decision needed (owner interview, after production-order vs sales-order distinction is clarified):**
(i) split into a clean standalone production-order system, OR (ii) merge into sales_orders by adding the
production columns, OR (iii) drop if truly dead. **LEFT UNTOUCHED for now (Q-39)** — misunderstood
structure; only the director order-count KPI was repointed to sales_orders (STEP 3 A.1, commit a1bb3ec5,
which correctly counts the 12 real sales orders instead of the empty sd_orders view).

### 2026-06-04 — SD lead→order convert BROKEN: `sales_orders.sd_lead_id` column does not exist
Found during STEP 1b (leads→crm_leads). `sd-leads.repository.ts` `insertOrderFromLead` (:146) and
`convertLeadToOrderAtomic` (:178) do `INSERT INTO sales_orders (customer_id, total_amount, status,
sd_lead_id, notes)` — but **`sales_orders` has NO `sd_lead_id` column** (verified:
`information_schema` → `sd_lead_id_exists = 0`; no `%lead%` column on sales_orders at all). So every
SD lead→order conversion's INSERT errors (returns Err) — the lead→order link is silently lost.
This is **pre-existing drift, orthogonal to the leads→crm_leads repoint** (that repoint only changes
the lead-table reference `UPDATE sd_leads`→`crm_leads`; it does NOT touch the sales_orders INSERT).
**Left untouched (Q-39).** Fix = a DDL/semantic decision (owner): either add `sd_lead_id integer`
to sales_orders (to record the source lead) OR drop `sd_lead_id` from the INSERT (if the link isn't
needed). Owner decides — separate task. `sd_lead_activities.lead_id` (integer) is fine.

### 2026-06-04 — kanban assignCard → honest 501, real fix is a 1-line owner_user_id UPDATE
`PATCH /api/kanban/cards/:id/assign` (kanban-cards.controller.ts) was a fake
`{ id, assignedTo, updated:true }` (no write). Converted to an honest 501 (STAGE B.2). The
real fix is small but deferred for a confirmation: `kanban_cards` has only `owner_user_id`
(integer) as a user field — no separate assignee vs creator column. Assigning would
`UPDATE kanban_cards SET owner_user_id = :assignedTo, updated_at = NOW()` via
`KanbanExtCardService` → `DrizzleKanbanExtRepository`. Deferred only to confirm that "assign"
should overwrite `owner_user_id` (vs. add a dedicated `assignee_id` column). Once confirmed,
it is a one-method add + delegators. Lower-stakes (kanban card assignment).

### 2026-06-04 — vendor-invoice payment → honest 501, waits on `fi_payments` (money)
`PATCH /api/mm/vendor-invoices/:id/payment` (mm-dashboard.controller.ts) was a fake
`{ success: true }` — it claimed an invoice was paid but wrote nothing. Converted to an honest
**501** (STAGE B.2) because a real payment record is **C-blocked**:
- `vendor_invoices` has only `status` — NO `paid_amount` / `paid_at` / `payment_method` column.
- the payment-ledger table **`fi_payments` does not exist** (also flagged in `docs/drift-c-class-2026-06-04.md`).
- no FE consumer calls this endpoint today.

Marking `status='paid'` without a payment record would be a NEW fake-success on a money path, so
it was rejected (owner decision). **To re-enable:** add the `fi_payments` table (or paid_amount/
paid_at/method columns on vendor_invoices) — DDL, owner-gated (Q-35) — then implement a real
INSERT into fi_payments + set vendor_invoices.status. This is tied to the finance GL/payment
build-out (drizzle-finance-invoice.repo also needs fi_payments + the gl_documents repoint).

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
