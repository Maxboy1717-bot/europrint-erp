# EXECUTOR DIRECTIVE #02C — ORG Phase 1 CORRECTED: canonical card = org_functions
> Your FK analysis was right — the direction is inverted. Owner approved the safe path. Proceed. 2026-06-08

## ✅ Excellent catch (verify-don't-trust worked)
You proved `org_functions` is the real FK hub (29 FK from 28 tables; employees/users link to it), `positions` has 0 incoming FK. Making org_functions a VIEW would have been catastrophic. You stopped before running — exactly right (Q-40/Q-29). The advisor's Phase 0 column-based read was wrong; your FK-based read is correct.

## ✅ OWNER DECISIONS (corrected)
- **Canonical card = `org_functions`** (NOT positions). It already holds employees/users/login + 29 FKs + the ЦКП measure column. Do NOT touch its ids or FKs.
- **Migration approach:** ADD the missing card-columns TO `org_functions`; **backfill `positions`' rich columns (ckp/code/salary_min/max/rbac_tier/level/ai_exam_enabled/statistics_type) onto `org_functions` IN PHASE 1** (org_functions becomes the full card now); then `positions` (0 FK) → **VIEW over org_functions** (safe — nothing FKs to positions).
- **`razryad_levels` CREATE** approved (idempotent, `-- APPROVED: owner 2026-06-08`); `org_functions.razryad_level_id` FK.
- **ЦКП measure:** reuse the existing `org_functions.tskp_measurement_unit` (fill SON/FOIZ/VAQT) — already there.

## ▶️ GO — Phase 1 migration
1. **Prepare the migration file** with `-- APPROVED: owner 2026-06-08`:
   - `CREATE TABLE IF NOT EXISTS razryad_levels (...)`.
   - `ALTER TABLE org_functions ADD COLUMN IF NOT EXISTS` ×N: card-columns it lacks (status, deleted_at soft-delete, razryad_level_id FK, salary_type, salary_min, salary_max, ckp/code if not present, rbac_tier, ai_exam_enabled, statistics_type, level — the ~14 you listed).
   - **Backfill** positions' data onto org_functions WHERE they semantically map (be careful: ids don't align — map by the correct key, e.g. department/role match, NOT by id; if no clean mapping, leave columns empty and note it — do NOT mis-map).
   - 1-seat-1-employee **unique index** (the atomic-card guarantee, EP-ORG-002).
   - `CREATE OR REPLACE VIEW positions AS SELECT ... FROM org_functions ...` — preserve the columns current positions-readers expect (the 17 BE refs); verify each reader still works (Q-39).
2. **Show the final SQL to the owner** (you said you would; owner confirmed "show then run"). Wait for "ha".
3. **Run it**, then **SELF-VERIFY (DB-proof):** `q.cjs` — confirm razryad_levels exists, org_functions has the new columns, the unique index is there, the positions VIEW resolves, and a sample of the 29 FK / employees-users links are intact (un-broken). Confirm `tsc` 0 + reviewers PASS + server boots 200.
4. **Commit** (separate, `git add <file>`; APPROVED migration). Log EP-ORG op-codes.
5. **Report to owner in Uzbek with PROOF** (counts, index, VIEW check, FK intact) → wait "davom".

## ⚠️ Backfill caution
The ids are NOT aligned (id=1 differs between the two tables). When backfilling positions→org_functions, map by a RELIABLE key (department + role/name), never by id. If a row has no clean match, leave it empty and list it in the report — never mis-map data (Q-40).

## RAILS
Self-verify everything before reporting · no regression (both org_functions readers AND the new positions-VIEW readers must keep working) · honest report of anything that didn't map · DDL has APPROVED marker · separate commit · Uzbek report with proof.

## After Phase 1 migration → continue Phase 1
Card CRUD on the canonical card (org_functions): create/read/update/soft-delete real (BE+FE), atomic (1 seat=1 employee via the unique index), card_id NULL → no login+no salary. Then Phase 2 (razryad master-data UI).
