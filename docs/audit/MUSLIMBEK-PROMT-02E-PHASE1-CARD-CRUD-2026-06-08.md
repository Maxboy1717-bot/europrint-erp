# EXECUTOR DIRECTIVE #02E — ORG Phase 1 (continuation): atomic CARD CRUD on org_functions
> Migration done + advisor-verified (78aefcef). Now build the card lifecycle on the canonical card. 2026-06-08

## ✅ Where we are
The data model is ready: `org_functions` is the canonical CARD (97 rows, 13 card-columns added, backfilled, FK intact — independently DB-verified). Now make the card a real, editable, atomic entity (BE + FE), extending the EXISTING `modules/org-structure` module (24 real endpoints) — do NOT rewrite it.

## ▶️ PHASE 1 (continuation) — card CRUD lifecycle
Build, each with its own permission → change → SELF-VERIFY → commit cycle:

1. **Read first:** `MUSLIMBEK-PROMT-02-ORG-BUILD` (the spec) + the ORG section of `VISION-1000-SAVOL-JAVOB` (esp. Q1 card-creation triggers, Q2 two-table model, Q20 soft-delete cascade, Q44 form persistence, Q48/Q50 race-safety) + `OCHIQ-JAVOBLAR` ORG + `decisions/01-org-kartalar.md`.

2. **BE CRUD on `org_functions`** (Result<T> + Zod + Drizzle, via the existing repo — extend, don't duplicate):
   - **create** card (position_name, department/tree-node link, razryad_level_id, salary_type, min/max_salary, rbac_tier, status, ЦКП/tskp + tskp_measurement_unit SON/FOIZ/VAQT, statistics_type, ai_exam_enabled, code).
   - **read** (list + by-id; 404 via Result, Q-11).
   - **update** (partial; never overwrite with NULL by accident).
   - **soft-delete** (set `deleted_at` + `status='archived'`; never hard DELETE — preserves the 29 FK refs). All reads filter `deleted_at IS NULL`.

3. **Atomicity (application layer for now, EP-ORG-002):** 1 seat = 1 active employee. The DB unique index is DEFERRED (data isn't seat-granular yet — org_function 11/12/14 have 3 employees), so enforce in the service: assigning an employee to a card that already has an active occupant → reject with a clear Result error. Note in the report that this is app-layer until the seat-split (EP-ORG-037) adds the DB index.

4. **`card_id NULL` → no login + no salary (EP-ORG-003):** an employee/user with no `org_function_id` gets no login session and no salary aggregation. Wire the guard (BE-side projection); if the login/salary path already exists, just add the card-link check.

5. **FE (parallel):** card create/edit form persists for real (Q-43: enter → save → reopen → still there). Extend the existing OrgStructure node pages; use the **FormPage** template + EP Linear Soft tokens (Q-41) — no new design. Loading state (F1) + mutation onError (F2) + delete ConfirmDialog (Qoida 14).

6. **(Stub-emit only, wire later):** card change → roles auto-update event; new department → POS warehouse auto event. Phase 1 may emit the event and log it; full handler is a later phase.

## ⭐ SELF-VERIFY before reporting (each task)
Re-read your diff · `tsc` 0 · `run-all-reviewers` PASS · **DB-proof** (create a card via the endpoint → `q.cjs` shows the real row; soft-delete → `deleted_at` set, row still FK-referenceable) · **FE round-trip** (save → reopen → persisted) · live probe 200 · be your own strict reviewer (no fake, no `-A`, op-code logged, no regression to the 24 existing org-structure endpoints).

## DoD-7 (this phase)
real BE · real FE · doc note · a test for the new endpoint (Q-29) · UZ+RU i18n keys · edge-cases (duplicate-name cards, NULL card_id, soft-deleted not listed) · automation/event stub.

## COMMIT + REPORT
Separate commit per task (`git add <exact-file>`, never `-A`). Log EP-ORG op-codes (EP-ORG-001 create, 002 atomic-guard, 003 card-link-gate, 004 read, 005 soft-delete). Report to owner in Uzbek WITH PROOF → wait "davom" → Phase 2 (razryad master-data UI).

## RAILS
Extend, don't rewrite (org-structure) · no regression (the 24 endpoints + positions writers keep working) · honest 501 over fake · canonical card = org_functions only · EP tokens + FormPage template only · self-verify everything.
