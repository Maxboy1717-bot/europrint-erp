-- APPROVED: egasi vakolati (Q-35), 2026-07-07 --
--   "stat_regulations has real versioning+CRUD, but no approve/sign-off endpoint. Fix:
--    additive migration adding approved_by_card_id + approved_at."
--
-- Adds a sign-off trail to stat_regulations (existing table, P30 wave 3):
--   approved_by_card_id -> which KARTA (org_functions) approved this version
--   approved_at         -> when it was approved
-- Both NULLABLE, no backfill: existing/historical rows stay unapproved (NULL) until
-- someone calls POST /director/stat-regulations/:id/approve. Matches the owner_card_id
-- FK-target convention already used on this table (REFERENCES org_functions(id)).
--
-- FAQAT ALTER TABLE ADD COLUMN: yangi jadval yo'q, destructive amal yo'q. Qayta ishga
-- tushirish xavfsiz (IF NOT EXISTS). Dry-run confirmed live: stat_regulations has 0 rows
-- (2026-07-07), so this is a zero-data-risk additive change.
--   psql $DATABASE_URL -f stat-regulations-approve-2026-07-07.sql

ALTER TABLE stat_regulations
  ADD COLUMN IF NOT EXISTS approved_by_card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE stat_regulations
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_stat_reg_approved_by
  ON stat_regulations(approved_by_card_id);
