-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0004_coordination_tables_update
-- Adds missing columns to `dokla` and `rasporyazhenie` tables so that the
-- Drizzle schema (schema-business-a-2.ts) matches the actual database.
--
-- Root cause: original tables were created with a minimal schema (id, title,
-- employee_id/issued_by, status, created_at, updated_at).  The Drizzle schema
-- was later updated to expect the full column set, but no migration was run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── dokla ────────────────────────────────────────────────────────────────────
ALTER TABLE "dokla"
  ADD COLUMN IF NOT EXISTS "from_user_id"  integer,
  ADD COLUMN IF NOT EXISTS "from_name"     text,
  ADD COLUMN IF NOT EXISTS "council_level" text,
  ADD COLUMN IF NOT EXISTS "subject"       text,
  ADD COLUMN IF NOT EXISTS "problem"       text,
  ADD COLUMN IF NOT EXISTS "result"        text,
  ADD COLUMN IF NOT EXISTS "proposal"      text;

-- Back-fill: map legacy columns → new columns for existing rows
UPDATE "dokla"
  SET "subject"      = "title"
WHERE "subject" IS NULL AND "title" IS NOT NULL;

UPDATE "dokla"
  SET "from_user_id" = "employee_id"
WHERE "from_user_id" IS NULL AND "employee_id" IS NOT NULL;

-- ── rasporyazhenie ───────────────────────────────────────────────────────────
ALTER TABLE "rasporyazhenie"
  ADD COLUMN IF NOT EXISTS "from_user_id" integer,
  ADD COLUMN IF NOT EXISTS "to_user"      text,
  ADD COLUMN IF NOT EXISTS "task"         text,
  ADD COLUMN IF NOT EXISTS "deadline"     date,
  ADD COLUMN IF NOT EXISTS "priority"     text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "done_at"      timestamp,
  ADD COLUMN IF NOT EXISTS "done_by"      integer,
  ADD COLUMN IF NOT EXISTS "done_note"    text;

-- Back-fill: map legacy columns → new columns for existing rows
UPDATE "rasporyazhenie"
  SET "task"         = "title"
WHERE "task" IS NULL AND "title" IS NOT NULL;

UPDATE "rasporyazhenie"
  SET "from_user_id" = "issued_by"
WHERE "from_user_id" IS NULL AND "issued_by" IS NOT NULL;
