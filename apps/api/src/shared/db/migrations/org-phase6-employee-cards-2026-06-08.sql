-- org-phase6-employee-cards-2026-06-08.sql
-- ORG #02 Phase 6 — employee↔card MANY-to-many link table + idempotent backfill.
-- APPROVED: owner 2026-06-13 (D1=max_salary, D2=Variant C app-guard, D3=create employee_cards, D4=monthly).
--
-- Model: an employee may hold SEVERAL cards (employee→many cards); each card SHOULD have ≤1 active
--   employee (the atomic seat guard EP-ORG-002 / EP-ORG-094). Per owner decision D2=Variant C the
--   ≤1-active-per-card rule is enforced at the APPLICATION layer (CardService.canAssignEmployee), NOT
--   by a DB partial-unique index — because live data has 10 over-occupied cards (11/12/14=3, 7 more=2);
--   the DB-level unique index waits for the EP-ORG-037 seat-split.
-- employees.org_function_id is KEPT as the primary-card mirror (Q-39 — 6 live readers must keep working).
-- Idempotent: re-running inserts 0 rows.

-- ── 1. M:N junction table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_cards (
  id           serial PRIMARY KEY,
  employee_id  integer NOT NULL REFERENCES public.employees(id)     ON DELETE CASCADE,
  card_id      integer NOT NULL REFERENCES public.org_functions(id) ON DELETE RESTRICT,
  is_primary   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- one active (employee, card) pair — guards accidental duplicate active link (SAFE: pairs are distinct,
-- the 10 over-occupied cards carry DIFFERENT employees so (emp,card) never collides).
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_cards_active_link
  ON public.employee_cards(employee_id, card_id) WHERE is_active;

CREATE INDEX IF NOT EXISTS ix_employee_cards_employee ON public.employee_cards(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_cards_card     ON public.employee_cards(card_id);

-- ⚠️ uq_employee_cards_active_card (≤1 active employee per card) DEFERRED on purpose (D2=Variant C).
--    Would FAIL on the 10 over-occupied cards today. Added after EP-ORG-037 seat-split.
--    Until then: app-layer guard CardService.canAssignEmployee (counts via employee_cards).

-- ── 2. Idempotent backfill of the 30 existing employees.org_function_id links ─
INSERT INTO public.employee_cards (employee_id, card_id, is_primary, is_active, assigned_at)
SELECT e.id, e.org_function_id, true, true, now()
FROM public.employees e
WHERE e.org_function_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.employee_cards ec
    WHERE ec.employee_id = e.id AND ec.card_id = e.org_function_id
  );
