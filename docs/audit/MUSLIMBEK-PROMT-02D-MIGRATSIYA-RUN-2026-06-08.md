# EXECUTOR DIRECTIVE #02D — ORG Phase 1 migration: APPROVED → RUN
> Owner reviewed the final SQL and the advisor independently DB-verified all your findings. Run it. 2026-06-08

## ✅ Your verify-don't-trust was confirmed (live DB) — every finding holds
The advisor independently re-checked your three findings against the live DB and the source:
- **`positions` has live CRUD writers** — `positions.repository.ts` (insert L35 / update L44 / delete L62) + `org-structure/sync-helper.ts` (INSERT L35 / UPDATE L45) + `master-data.seed.ts` (INSERT L123). → `positions`→VIEW correctly DEFERRED.
- **Unique index would fail** — live: org_function **11/12/14 have 3 active employees each**, plus 7 more with 2. org_functions is position-TYPE granular, not seat-granular. → 1-seat index correctly DEFERRED (needs EP-ORG-037 seat-split first).
- **Backfill key** — live: role-name = ~96 matches; dept+role = only 3 (the two tables number `department_id` differently). Both `"bosh direktor"` AND `"kassir"` are duplicated **on both sides** (positions + org_functions) → excluding them is correct (prevents mis-map, Q-40).
Excellent self-verification. The migration SQL (COALESCE = fills only NULLs, non-destructive; idempotent `IF NOT EXISTS`) is clean.

## ✅ OWNER DECISIONS (final gate passed)
1. **RUN the migration** (A `razryad_levels` + B 13 card-columns on `org_functions` + C backfill).
2. **Backfill key = ROLE-NAME** (`lower(positions.name_uz)=lower(org_functions.position_name)`, the 2 ambiguous names excluded). NOT strict dept+role.
3. **DEFER** the 1-seat unique index and `positions`→VIEW to a later phase (both have hard blockers).

## ▶️ GO — run `apps/api/src/shared/db/migrations/org-phase1-canonical-card-2026-06-08.sql`
The file already carries `-- APPROVED: owner 2026-06-08` and the owner has now given the explicit "ha" on the final SQL. Run only the A+B+C parts (the two deferred steps stay commented).

## ⭐ SELF-VERIFY (DB-proof) — prove it to yourself BEFORE reporting
After running, confirm with `node _audit/q.cjs`:
1. `razryad_levels` table exists (and its `UNIQUE(level)`).
2. `org_functions` now has the 13 new columns (`status, deleted_at, razryad_level_id, salary_type, code, level, rbac_tier, min_salary, max_salary, ai_exam_enabled, statistics_type, manager_id, updated_at`).
3. **Backfill count** — how many org_functions rows got `code`/`level`/`tskp` filled (expect ~93; the 2 excluded names stay NULL — list them honestly).
4. **No regression** — sample the 29 FK / employees+users links are intact (un-broken); `positions` table still writable (its writers untouched).
5. `tsc` = 0 + `bash scripts/run-all-reviewers.sh` = PASS + server boots 200 (Q-44 restart if 000).

## COMMIT + REPORT
- **Separate commit** — `git add` ONLY the migration file (never `-A`). Log the EP-ORG op-codes (EP-ORG-005/008/009/023/024/037/043/046/083).
- **Report to owner in Uzbek WITH PROOF** (the counts: razryad_levels created, 13 columns added, N rows backfilled, M left empty + which, FK intact) → wait for "davom".

## After this migration → continue Phase 1
Atomic card CRUD on the canonical card (`org_functions`): create / read / update / soft-delete real (BE+FE), `card_id NULL` → no login + no salary (EP-ORG-003). The 1-seat atomic guarantee is enforced at the APPLICATION layer for now (the DB unique index waits for the seat-split). Then Phase 2 (razryad master-data UI).

## RAILS
Self-verify everything before reporting · honest count of what didn't map · no regression (positions writers AND org_functions readers both keep working) · separate commit · Uzbek report with proof.
