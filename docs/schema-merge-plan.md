# Two-Universe Schema Merge — Execution Plan

**Goal:** collapse the two parallel schema universes (`lib/db` = `@workspace/db` and `apps/api/src/shared/db` stubs) into a SINGLE source per table. Canonical home = `lib/db` (the shared package). Each `apps/api` duplicate becomes a one-way re-export of the lib/db canonical, then its body is deleted.

**Ledger:** `docs/schema-convergence-ledger.md` (auto-generated). 193 duplicated tables:
- **Tier 0 — 75 tables:** same id type & naming across defs → trivial (re-export + delete body). Batch-approved.
- **Tier 1 — 77 tables:** naming/column reconcile (camelCase↔snake_case) before re-export. Small-batch-approved.
- **Tier 2 — 41 tables:** HARD — `uuid` ↔ `integer/serial` id-type conflict (breaks consumers). Per-table approval. Ordered fewest→most consumers; the giants (employees 200, users 126, attendance 67, warehouses 53, materials 52, invoices 45, sales_orders 44) are mini-projects.

## Per-table procedure (the approval + commit unit)
1. **Inventory** (from ledger): all defs, id types, consumer count.
2. **Pick canonical** = the lib/db def (made a DB superset in Wave 1). For Tier 2, the winning id type = the LIVE DB's actual type (the running app uses the integer stub, so integer wins; the `uuid` def in `schema-core.ts` is the shadowed/aspirational one).
3. **Reconcile** (Tier 1/2): ensure the lib/db canonical has every column + the names the consumers use; for Tier 2, migrate consumers off the losing id type.
4. **Re-export**: replace the `apps/api` duplicate `export const X = pgTable(...)` body with `export { X } from "@workspace/db";` (ONE-WAY only — never a cyclic shim, per docs/dedup-safety-rules.md).
5. **Delete** the dead def body / drained stub file once nothing defines the table twice.
6. **Gate**: `pnpm --filter @europrint/api exec tsc --noEmit` == 0 → commit `merge(schema): <table> → single source`. Full typecheck + targeted tests at batch boundaries.

## Phase order
- **Phase A — Tier 0** (75): batches of ~12. Lowest risk.
- **Phase B — Tier 1** (77): batches of ~6 (naming reconcile each).
- **Phase C — Tier 2** (41): one table per commit, individual approval, fewest-consumers first; employees/users last (may need DB column-type migration + FK cascade, taken with a full DB backup).

## Safety
- Branch `chore/schema-convergence`; every table/batch = its own commit (yakka revert).
- Gate must be GREEN before next unit; red → restore, report, do not force.
- No DB writes from this code work. Tier-2 tables that require an actual DB `ALTER COLUMN ... TYPE` get a reviewed migration + `bash scripts/backup-db.sh` first.
- `scripts/reviewer-schema-dup.mjs` baseline ratchets DOWN after each batch (re-run `--update-baseline` post-batch so the count only shrinks).

## Approval workflow (proposed)
- Tier 0 & Tier 1: I present the batch list, you approve the batch.
- Tier 2: I present each table's specific plan (canonical id type, consumers to migrate, risk), you approve individually.
