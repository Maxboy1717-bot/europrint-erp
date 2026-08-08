-- APPROVED: additive-only idempotent backfill INSERT, no new table (Q-35).
-- Closes SB0079/SB0100 ("employee_cards M:N ABANDONED / flow disconnected — 0 live rows"),
-- soha "02" (HR/Xodim/karta-xodim bog'lanish).
--
-- Context (live-verified 2026-07-04):
--   org-phase6-employee-cards-2026-06-08.sql shipped a backfill INSERT that joined
--   employees.org_function_id directly onto employee_cards.card_id. That was correct
--   AT THE TIME (employee_cards.card_id → org_functions(id)). Since then the canonical
--   card table was re-pointed org_functions → org_departments (PHASE-00, card.repository.ts
--   header) and employee_cards_card_id_fkey now targets org_departments(id) (confirmed via
--   pg_constraint). employees.org_function_id was NEVER migrated off the retired
--   org_functions id-space, so the phase6 backfill silently produced 0 rows applied against
--   the live DB — either it was never run, or (proven by dry-run below) it would hard-fail
--   on FK violation because org_functions.id and org_departments.id are different id-spaces
--   with only accidental numeric overlaps (e.g. org_function_id=24 happens to also be a valid
--   org_departments.id, but for an unrelated card — "O'qitish Boshlig'i" vs "Marketing").
--
--   Only 1 live employee_cards row existed pre-migration (employee 34 → card 173, created
--   2026-06-26 via the real CardAssignDialog.tsx UI flow — proves the assign/unassign code
--   path itself is fully wired end-to-end, controller→service→repo→DB; the gap was purely
--   the one-time historical backfill of the 30 pre-existing employees.org_function_id links).
--
-- Fix: backfill by NAME match (org_functions.position_name = org_departments.name), the same
--   pattern already used by org-phase1-canonical-card-2026-06-08.sql ("backfill-by-name").
--   Verified 2026-07-04: all 30 employees with org_function_id resolve to exactly one
--   org_departments row by name (0 duplicate-name collisions, 0 unmatched). Dry-run
--   (BEGIN/INSERT/ROLLBACK against live `europrint`) inserted the expected 30 rows with
--   zero FK violations; the original ID-keyed join was re-tested and confirmed to throw
--   `employee_cards_card_id_fkey` violation immediately, proving the ID-join is unsafe and
--   the name-join is the correct replacement.
--
-- Idempotent: re-running inserts 0 rows (guarded by NOT EXISTS on any active link for the
--   employee, matching the ON CONFLICT semantics of assignEmployee()).
-- Does NOT touch employees.org_function_id (that mirror column is left as-is; the M:N table
--   is additive, per org-phase6 Q-39 compatibility contract).

INSERT INTO public.employee_cards (employee_id, card_id, is_primary, is_active, assigned_at)
SELECT e.id, od.id, true, true, now()
FROM public.employees e
JOIN public.org_functions ofn   ON ofn.id = e.org_function_id
JOIN public.org_departments od  ON od.name = ofn.position_name AND od.is_active = true
WHERE e.org_function_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.employee_cards ec
    WHERE ec.employee_id = e.id AND ec.is_active
  );
