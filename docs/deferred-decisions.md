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
