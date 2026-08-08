# EXECUTOR DIRECTIVE #01C — ALL 10 SEMANTIC/DDL ITEMS APPROVED
> Owner approved EVERY item in `docs/POYDEVOR-DDL-TAKLIF-2026-06-08.md` (S1, S2, D1-D5). Execute all. 2026-06-08
> English directive · report to owner in Uzbek (Latin).

## ✅ APPROVED — proceed with all 7

### A-group (code-only, no DDL)
- **S1** — `wms-crud.repository.ts:158` getStockById: `wms_stock` → canonical **`warehouse_stock`** (`ws.material_id = mc.id`, `ws.warehouse_id = w.id`, drop the `deleted_at` filter it lacks).
- **S2** — `erp-reports.repository.ts:77,190`: `work_center_id`→`machine_id`, `duration_minutes`→`duration_min` (code rename to match DB).

### D-group (DDL — `ADD COLUMN IF NOT EXISTS`, each migration carries `-- APPROVED: owner 2026-06-08`)
- **D1** — `ALTER TABLE mes_shift_handovers ADD COLUMN IF NOT EXISTS notes text` + code `incoming_supervisor`→`received_by` (mes-shifts-stats.repo.ts:25).
- **D2** — `ALTER TABLE mes_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to int REFERENCES employees(id)` + code `work_center_id`→`equipment_id` (B5 SELECT, mes-shifts-stats.repo.ts:185).
- **D3** — `ALTER TABLE erp_daily_reports ADD COLUMN IF NOT EXISTS work_center_id int, ADD COLUMN IF NOT EXISTS shift text, ADD COLUMN IF NOT EXISTS planned_qty numeric, ADD COLUMN IF NOT EXISTS actual_qty numeric, ADD COLUMN IF NOT EXISTS notes text`.
- **D4** — `ALTER TABLE erp_downtime_logs ADD COLUMN IF NOT EXISTS resolved boolean DEFAULT false, ADD COLUMN IF NOT EXISTS reported_by int`.
- **D5** — `ALTER TABLE wms_transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz, ADD COLUMN IF NOT EXISTS deleted_by int`.

## Execution rules (per item)
1. **Permission (Q-28):** they are all pre-approved — you may apply, but still show each `file:line` + change before/with the commit so the owner can see.
2. **DDL:** idempotent `ADD COLUMN IF NOT EXISTS`, in a migration file with the `-- APPROVED: owner 2026-06-08` comment (Q-35 satisfied).
3. **Verify (Q-29/Q-40):** `tsc` 0 + DB-proof — after each ALTER, prove the failing INSERT/SELECT now resolves (use `BEGIN…ROLLBACK` for INSERTs so nothing persists).
4. **Commit** separately per item (`git add <exact-file>`; NEVER `-A`). Push at the end.
5. **No regressions (Q-39);** confirm server health 200 after the batch (Q-44 if 000 — restart).

## After all 7 are done → the foundation is CLEAN
- **Final report to owner (Uzbek):** every item done + commit hashes + a fresh re-probe showing the previously-broken endpoints (mes/shifts, mes/maintenance, erp/daily-reports, erp/downtime, wms/transactions, finance) now return **200 with real data**.
- Then **hand back to the advisor** → **Prompt #02: build T1 ORG/KARTALAR** (vision ready: `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` + `decisions/01-org-kartalar.md`).

## Rails (unchanged)
Per-item verify (tsc + DB-proof) · separate commit · no regressions · no rewrites · honest 501 over fake · leave untracked `batch_*.sql` alone · report in Uzbek.
