-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- pos_material_requests.quantity is a LEGACY NOT NULL column with no DEFAULT. The current
-- Drizzle schema omits it, so service INSERTs (which never supply `quantity`) fail with
-- "null value in column quantity violates not-null constraint". The live request model uses
-- other quantity fields; this legacy column just needs a default so inserts succeed.
-- Idempotent: SET DEFAULT is safe to re-run.
ALTER TABLE pos_material_requests ALTER COLUMN quantity SET DEFAULT 0;
