# Deferred: erp-reports WRITE methods — phantom columns + open semantics (2026-06-02)

**Status:** DEFERRED (needs FE-contract check + semantic decisions). Owner-approved 2026-06-02.
**Branch:** chore/schema-convergence
**File:** `apps/api/src/modules/erp/erp-reports.repository.ts`
**Related:** Stage 0.2 #5 fixed the 4 READ methods (dropped phantom JOINs). These 4 WRITE
methods share the same column mismatch but were NOT fixed, because the fix requires
guessing write semantics + JSONB shape + the frontend contract.

## Why deferred

The blessed schema (Drizzle `pgTable` in `schema-ext-c-1.ts` + `migrations-drift.ts`
CREATE TABLE) defines the REAL columns. The code writes phantom columns that were never
intended. Unlike the READ fix (just drop a JOIN), the WRITE fix must DECIDE where each
phantom field goes — and guessing that is exactly what breaks data. Both tables are 0 rows,
so nothing is lost by waiting.

Real schemas:
- `erp_daily_reports`: `id, report_date, department_id, data (jsonb), created_at`
- `erp_downtime_logs`: `id, machine_id, reason, started_at, ended_at, duration_min, created_at`

## The 4 WRITE methods + open questions

### 1. `createDailyReport` (line ~135)
Current INSERT columns: `(work_center_id, report_date, shift, planned_qty, actual_qty, notes)`
Real columns available: `report_date, department_id, data (jsonb)`
Open questions:
- `work_center_id` — the report is department-level (`department_id`). Does the FE actually
  send a work center, or a department? Map to `department_id`, or drop?
- `shift, planned_qty, actual_qty, notes` — pack into the `data` jsonb? What key names does
  the FE expect to read back?

### 2. `updateDailyReport` (line ~142)
Current UPDATE SET: `planned_qty, actual_qty, notes, updated_at`
Real columns: none of these exist; there is no `updated_at`.
Open questions:
- Merge into `data` jsonb (`data = data || jsonb_build_object(...)`)? Drop `updated_at`?

### 3. `createDowntimeLog` (line ~170)
Current INSERT columns: `(work_center_id, started_at, reason, duration_minutes, resolved, reported_by)`
Real columns available: `machine_id, reason, started_at, ended_at, duration_min`
Open questions:
- `work_center_id` -> `machine_id`? These are DIFFERENT concepts (a work center is not a
  machine). Do NOT assume — confirm with the FE/domain.
- `duration_minutes` -> `duration_min` (clean rename, low risk).
- `resolved` (boolean) — no column. Represent via `ended_at IS NOT NULL`? Or add nothing?
- `reported_by` — no column. Drop (data loss) or is it needed? `erp_downtime_logs` has no
  `data` jsonb to park it in.

### 4. `updateDowntimeLog` (line ~77)
Current UPDATE SET: `reason, duration_minutes, resolved, updated_at`
Real columns: `reason` (ok), `duration_min` (rename), no `resolved`, no `updated_at`.
Open questions:
- `duration_minutes` -> `duration_min`.
- `resolved` -> set `ended_at = NOW()`? Drop?
- `updated_at` — drop (no column).

## Required before fixing

1. **FE-contract check** — read the frontend forms/calls that POST/PATCH to
   `/api/erp/daily-reports` and `/api/erp/downtime-logs`: exact field names + types sent,
   and which fields the UI reads back (so JSONB keys match).
2. **Domain decision** — does `work_center_id` map to `machine_id` / `department_id`, or
   neither? What happens to `reported_by` / `resolved` (no target column)?
3. Then rewrite the 4 methods to the real schema (JSONB packing for daily_reports;
   `machine_id`/`duration_min` for downtime_logs), verify, commit.

## Urgency: LOW

Both tables are 0 rows. The create/update endpoints currently fail against the real schema,
but no data exists and the READ endpoints (the ones flagged in the 500/503 catalog) are
fixed. Safe to defer to an erp-reports write-path task with the FE contract in hand.
