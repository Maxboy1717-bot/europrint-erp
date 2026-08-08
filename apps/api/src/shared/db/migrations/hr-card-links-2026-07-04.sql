-- APPROVED: additive-only ALTER, no new table (Q-35). Closes SB0071 (mentor↔card link)
-- + SB0072/SB0101 (onboarding→card target link), soha "02" (HR/Xodim/karta-xodim bog'lanish).
--
-- Context:
--   1. `mentors` was a generic profile (id/name/bio/expertise/user_id) with NO link to the
--      canonical card table (`org_departments`, card.repository.ts). A mentor is assigned to
--      guide an employee INTO a specific card (onboarding target position) — without card_id
--      the mentor↔card relationship the vision calls for cannot be recorded at all.
--   2. `hr_employee_onboardings` had employee_id/plan_id/mentor_id but no card_id — so
--      onboarding.service.completeProbation() had no target card to activate against
--      employee_cards on a passed probation (SB0072/SB0101 "onboarding→karta buzuq").
--
-- Both columns are NULLable (no backfill possible — genuinely new data going forward,
-- Q-40 fabrikatsiya taqiq) and reference the live canonical FK target confirmed via
-- `employee_cards_card_id_fkey` (card_id → org_departments(id), NOT org_functions —
-- the org-phase6 migration comment predates the org_departments repoint).
--
-- Dry-run verified 2026-07-04 (BEGIN/ROLLBACK against live `europrint` DB):
--   - mentors: ADD COLUMN card_id + FK succeeded (0 existing rows to violate FK)
--   - hr_employee_onboardings: ADD COLUMN card_id + FK succeeded
--   - both rolled back cleanly, no live-schema side effects until this file is applied
--
-- ON DELETE SET NULL: mirrors sales-orders-deal-id-fk-2026-07-04.sql convention —
-- deleting/archiving a card must not cascade-delete mentor or onboarding history rows.

ALTER TABLE mentors
  ADD COLUMN IF NOT EXISTS card_id integer REFERENCES org_departments(id) ON DELETE SET NULL;

ALTER TABLE hr_employee_onboardings
  ADD COLUMN IF NOT EXISTS card_id integer REFERENCES org_departments(id) ON DELETE SET NULL;

COMMENT ON COLUMN mentors.card_id IS
  'Karta bog''lanishi (org_departments.id) — hozircha faqat read-only surface (mentorships-compat.service.ts); LIVE mentor-karta UI (MentorTab.tsx, T11-10) hamon user_id-derivation ishlatadi (Q-40 rationale MentorTab.tsx header''da). NULL = eski umumiy mentor profili.';

COMMENT ON COLUMN hr_employee_onboardings.card_id IS
  'Onboarding nishon-kartasi (org_departments.id) — probation o''tgach shu karta employee_cards''ga faollashtiriladi (SB0072/SB0101, OnboardingService.completeProbation). NULL = karta ko''rsatilmagan (eski yozuv yoki hali belgilanmagan).';

-- ADDITIONAL FIX (found while live-verifying SB0072/SB0101, same session):
-- hr_employee_onboardings.created_at/updated_at were NOT NULL with NO DB-level default, while
-- the Drizzle schema (schema-compat-1b.ts) declares `.defaultNow()` — a client-side-only default
-- that only fires when Drizzle explicitly sets the column. `drizzle-hr-onboarding.repo.ts
-- startOnboarding()` never included createdAt/updatedAt in its insert row, so Drizzle emitted
-- `DEFAULT` for both columns, hit the (missing) DB default, and every `POST /api/hr/onboarding/
-- start` call threw "null value in column created_at violates not-null constraint" — a 100%
-- reproducible pre-existing bug (0 rows in the live table proves it never once succeeded).
-- Same DRIFT-NN class of bug documented in docs/default-loss-audit-2026-06-01.md (104 other
-- tables already fixed 2026-06-01) — this table was missed by that sweep.
-- Dry-run verified 2026-07-04: insert succeeds immediately after SET DEFAULT, rolled back cleanly.
ALTER TABLE hr_employee_onboardings ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE hr_employee_onboardings ALTER COLUMN updated_at SET DEFAULT now();
