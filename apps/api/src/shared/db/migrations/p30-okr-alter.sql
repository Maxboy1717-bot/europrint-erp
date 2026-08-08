-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/p30-okr-alter.sql
-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- P30 Wave 3: OKR kaskad + card-centric owner
-- Ishga tushirish: egasi APPROVED: stampini qo'ygandan KEYIN.
--   psql $DATABASE_URL -f p30-okr-alter.sql
-- Idempotent: ADD COLUMN IF NOT EXISTS — qayta ishlatilsa xato bermaydi.
-- ============================================================

ALTER TABLE okr_objectives
  ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER
    REFERENCES okr_objectives(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_okr_parent
  ON okr_objectives(parent_goal_id) WHERE parent_goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_okr_owner_card
  ON okr_objectives(owner_card_id);

ALTER TABLE okr_key_results
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

ALTER TABLE strategic_tasks
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;
