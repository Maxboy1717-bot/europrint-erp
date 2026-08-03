# EXECUTOR DIRECTIVE #02B — ORG Phase 0 APPROVED → Phase 1 GO
> Owner reviewed your ORG Phase 0 re-audit and decided the 3 architecture issues. Proceed to Phase 1.
> English directive · reports to owner in Uzbek. 2026-06-08

## ✅ Phase 0 — approved, excellent work
Read-only, sequential, no agents, self-verified — and you caught the real two-world (EP-ORG-040). Good.

## ✅ OWNER DECISIONS (the 3 issues)
- **MASALA-1 — Canonical card = `positions`.** Do NOT create a new `cards` table (it would be a 3rd world). `positions` (96, already rich: ckp/ai_exam_enabled/statistics_type/min-max_salary/rbac_tier/level/manager_id) **IS the canonical CARD**. Merge `org_functions` into it: move its useful fields (tskp/tskp_target/tskp_measurement_unit, tree-link to `org_departments`) onto `positions`; then make `org_functions` a **VIEW over `positions`** (so existing FK refs/readers don't break — Q-39). The card-centric model lives on `positions`. (Name "positions" vs "cards" is cosmetic — the MODEL is what matters.)
- **MASALA-2 — APPROVED: create `razryad_levels` master-data table.** Idempotent, `-- APPROVED: owner 2026-06-08`. Columns: `level` (int/number), `name`, `min_requirement` (text), `salary_min`/`salary_max`, `exam_type`, `certificate` (text), `description`. `positions.razryad_level_id` → FK to it.
- **MASALA-3 — REUSE the existing ЦКП measure column** (fill as `SON|FOIZ|VAQT` enum). Put it on the canonical card (`positions`) — migrate `org_functions.tskp_measurement_unit` onto `positions` during the merge; don't add a new column.
- **Phase order P1→P7 confirmed.** Phase 1 = the canonical-card consolidation FIRST.

## ▶️ GO — PHASE 1: card data-model + atomic CARD CRUD
Goal: `positions` = the canonical, atomic CARD; `org_functions` merged → VIEW; card CRUD real (BE+FE).

**Tasks (each with its own permission → fix → SELF-VERIFY → commit cycle):**
1. **DDL (concept pre-approved by owner; still post the exact migration before running):**
   - `positions` ADD COLUMN IF NOT EXISTS: `status` (text, e.g. active/frozen/vacant/archived), `deleted_at` timestamptz (soft-delete — it lacks one), `razryad_level_id` int FK, `salary_type` text (ishbay/soatbay), `otdeleniye_id`/tree-node link if missing, `tskp_measurement_unit` text (SON/FOIZ/VAQT, migrated from org_functions).
   - `CREATE TABLE IF NOT EXISTS razryad_levels (...)` (MASALA-2).
   - After merging org_functions data into positions → `CREATE OR REPLACE VIEW org_functions AS SELECT ... FROM positions ...` (preserve the columns current readers expect; verify no reader breaks — Q-39).
2. **Card = atomic** (1 seat = 1 employee, EP-ORG-002); `positions` row linked to its `org_departments` tree-node (the seat). `card_id NULL` → no login + no salary (EP-ORG-003).
3. **BE CRUD:** create / read / update / soft-delete a card (positions); Result<T> + Zod + real DB; reuse the existing `org-structure` service/repo (don't rewrite — extend).
4. **FE:** card form persists (Q-43) — extend the existing OrgStructure node pages; FormPage template + EP Linear Soft tokens.
5. **(Defer to a later phase, just note):** org-change → roles auto; new dept → POS warehouse auto (event) — Phase 1 can stub the event emit, wire later.

**Implementation detail:** consult `VISION-1000-SAVOL-JAVOB` ORG answers (Q1, Q2, Q20, Q44, Q48, Q50 — card-creation triggers, two-table migration, soft-delete cascade, race-safety with DB unique index for 1-active-card-per-seat).

## RAILS (this phase)
- Permission gate before each change · BE+FE parallel · **SELF-VERIFY** (re-read diff + tsc 0 + reviewers PASS + DB-proof via q.cjs/BEGIN-ROLLBACK + FE round-trip + live probe) → only then report.
- Separate commit per task (`git add <file>`; never -A). Log `EP-ORG-###` op-codes.
- No rewrite (extend org-structure module). No regression (org_functions VIEW must keep current readers working). Honest 501 over fake.
- Report to owner in Uzbek with PROOF after Phase 1, then wait for "davom" → Phase 2 (razryad).

## STOP POINTS
- Post the exact migration SQL before running it (owner sees it, even though pre-approved in concept).
- Before making `org_functions` a VIEW — show which current readers depend on it + prove they still work after.
- After Phase 1 — full report + proof, wait for "davom".
