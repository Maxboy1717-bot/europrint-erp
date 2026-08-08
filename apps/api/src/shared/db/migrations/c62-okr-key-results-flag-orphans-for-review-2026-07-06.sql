-- APPROVED: Critical-Correctness Fix Loop, item 6.2 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 6.2 "orphaned OKR key results" — deleteObjective() code-side cascade fixed in commit
--   4432944f; this file documents the DATA-side handling of the pre-existing orphaned rows found
--   during that fix's verification).
--
-- Owner decision: do not delete, do not force-relink; flag unresolvable rows for manual review.
--
-- Investigation (see docs/audit/MASTER-STATUS-BOARD-2026-07-06.md, Critical-Correctness row):
-- every row in okr_key_results with objective_id=1 is placeholder/test data (title='KR1' constant
-- across 100% of rows, created_by=2 which has no matching row in `users`, okr_objectives itself
-- only ever uses 3 generic titles 'Grow'/'X'/'Title'). No genuine correlating signal (owner_id,
-- created_by, title/theme, department) links any orphan to a specific real objective — forcing a
-- relink would fabricate false provenance, so ALL orphans go to "needs manual review" rather than
-- any being force-relinked. The orphan count grew from 84 (when the finding was first written) to
-- 99 by the time this was applied (2026-07-06) — this is an ACTIVELY FIRING bug, not settled
-- historical debris; a concurrent git worktree (.claude/worktrees/green-lie-group1) touching the
-- same OKR module against this shared dev DB is the most likely source (see board note) — this
-- flag is NOT a fix for the root cause, only a marker on the already-affected rows.
--
-- Applied live 2026-07-06 (99 rows flagged, ids 9-109). Written as SQL after the fact for a
-- durable, reproducible record — this file is idempotent (WHERE notes IS NULL guard) and safe to
-- re-run in any environment, including catching any further rows created before the root-cause
-- source is found and stopped.
--
-- FAQAT UPDATE (mavjud NULL notes ustunini to'ldiradi): yangi jadval/ustun yo'q, destructive amal
-- yo'q (hech qanday qator o'chirilmaydi yoki boshqa ustuni o'zgartirilmaydi).

UPDATE okr_key_results
SET notes = '[NEEDS_REVIEW 2026-07-06] Orphaned: objective_id=1 does not exist in okr_objectives ' ||
  '(id range 12+). Investigated per CRITICAL-CORRECTNESS-AUDIT-2026-07-06 finding 6.2 -- confirmed ' ||
  'this is placeholder/test data (title=''KR1'' constant, created_by=2 which has no matching users ' ||
  'row), no genuine parent objective could be inferred (owner_id/created_by never correlate to any ' ||
  'real objective). Do not force-relink; flagged for manual owner review per decision on ' ||
  'docs/audit/MASTER-STATUS-BOARD-2026-07-06.md.',
  updated_at = NOW()
WHERE objective_id = 1 AND notes IS NULL;
