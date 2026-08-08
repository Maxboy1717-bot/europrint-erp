-- APPROVED: additive-only ALTER, no new table (Q-35).
-- Closes gap: mentor assignment/approval CRUD on lms_card_mentors is real (EP-ORG-116/T10-09,
-- apps/api/src/modules/lms/presentation/lms-misc.controller.ts LmsMentorsController), but no
-- rating or qualification-verification columns existed. `rating` is nullable NUMERIC(2,1) —
-- existing rows are unaffected (Q-39, live table is 0 rows as of 2026-07-07 dry-run check),
-- bounded 0..5 via CHECK constraint (same bounded-rating shape as
-- employee_360_assessments.self_rating/manager_rating/... ). `qualification_verified_at` /
-- `qualification_verified_by` record who verified the mentor's qualification and when —
-- both nullable, unset until an HR_MANAGER/TRAINING_OFFICER/DIRECTOR/SUPER_ADMIN acts via the
-- new PATCH /mentors/cards/:id/rating endpoint. FK convention mirrors
-- standard_cost.created_by / price_tier.created_by (REFERENCES users(id) ON DELETE SET NULL).
--
-- Actually applied at boot (idempotent, IF NOT EXISTS) via
-- apps/api/src/shared/db/invariants/migrations-schema.ts -> ensureSchemaAdditions() — this file
-- is the human-readable mirror of that entry (see docs/DRIZZLE_STANDARTLARI.md migration workflow).
ALTER TABLE lms_card_mentors ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5);
ALTER TABLE lms_card_mentors ADD COLUMN IF NOT EXISTS qualification_verified_at TIMESTAMP;
ALTER TABLE lms_card_mentors ADD COLUMN IF NOT EXISTS qualification_verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
