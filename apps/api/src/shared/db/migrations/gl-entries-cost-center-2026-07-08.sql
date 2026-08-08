-- gl-entries-cost-center-2026-07-08.sql
-- VISION-3340 #21 — Cost centers are full CRUD master data (cost_centers table,
-- drizzle-fi.repo.ts), but no GL posting could be tagged to one: the canonical
-- posting table `entries` (fi-gl.ts, written by drizzle-gl-posting.repo.ts's
-- insertJournal/insertEntry) had no cost_center_id column. This adds an OPTIONAL
-- cost-center tag to each GL journal line.
--
-- Canonical-table note (GL two-worlds hazard): the ONE engine
-- GlPostingService.createJournalEntry() -> DrizzleGlPostingRepository.insertJournal()
-- INSERTs into `entries` (NOT gl_journal_entries / gl_lines — SAP#76 forbidden).
-- Cross-checked against lib/db/src/schema/fi-gl.ts `entries` pgTable. Only `entries`
-- gets the column.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #21
-- Additive, nullable, no new table (Q-35). FK to cost_centers(id) ON DELETE SET NULL:
-- deleting a cost center must NOT delete historical GL entries — it only unsets the tag.
-- cost_centers.id is SERIAL (integer) so the INTEGER FK type matches.
-- Existing rows/callers unaffected (column is NULL when the tag is omitted — Q-39/Q-46).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS — re-running is a no-op.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f gl-entries-cost-center-2026-07-08.sql

ALTER TABLE IF EXISTS entries
  ADD COLUMN IF NOT EXISTS cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_entries_cost_center_id ON entries (cost_center_id);

-- DB-proof: after running
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'entries' AND column_name = 'cost_center_id';   -- expected: 1 row
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'entries' AND indexname = 'idx_entries_cost_center_id';  -- expected: 1 row
