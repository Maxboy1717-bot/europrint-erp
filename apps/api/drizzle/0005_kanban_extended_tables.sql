-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0005_kanban_extended_tables
-- Creates missing kanban extended tables that were defined in schema-kanban.ts
-- but were never added to the database via a migration.
--
-- Missing tables: kanban_tags, kanban_card_tags, kanban_observers,
--   kanban_co_executors, kanban_time_tracks, kanban_results,
--   kanban_result_files, kanban_files, kanban_notifications,
--   kanban_templates
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_tags" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text NOT NULL,
  "color"      text NOT NULL DEFAULT '#3b82f6',
  "board_id"   text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "kanban_tags_board_idx" ON "kanban_tags" ("board_id");

CREATE TABLE IF NOT EXISTS "kanban_card_tags" (
  "id"         serial PRIMARY KEY,
  "card_id"    text NOT NULL,
  "tag_id"     text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("card_id", "tag_id")
);
CREATE INDEX IF NOT EXISTS "kanban_card_tags_card_idx" ON "kanban_card_tags" ("card_id");

-- ── Observers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_observers" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id"    text NOT NULL,
  "user_id"    integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("card_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "kanban_observers_card_idx" ON "kanban_observers" ("card_id");

-- ── Co-executors ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_co_executors" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id"    text NOT NULL,
  "user_id"    integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("card_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "kanban_co_exec_card_idx" ON "kanban_co_executors" ("card_id");

-- ── Time tracking ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_time_tracks" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id"          text NOT NULL,
  "user_id"          integer NOT NULL,
  "started_at"       timestamp with time zone NOT NULL,
  "ended_at"         timestamp with time zone,
  "duration_minutes" integer,
  "target_minutes"   integer,
  "is_running"       boolean NOT NULL DEFAULT false,
  "description"      text,
  "created_at"       timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "kanban_time_card_idx"  ON "kanban_time_tracks" ("card_id");
CREATE INDEX IF NOT EXISTS "kanban_time_user_idx"  ON "kanban_time_tracks" ("user_id");

-- ── Results ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_results" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id"       text NOT NULL,
  "description"   text,
  "created_by_id" integer NOT NULL,
  "created_at"    timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"    timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "kanban_results_card_idx" ON "kanban_results" ("card_id");

CREATE TABLE IF NOT EXISTS "kanban_result_files" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "result_id"  text NOT NULL,
  "file_name"  text NOT NULL,
  "file_url"   text NOT NULL,
  "file_size"  integer,
  "mime_type"  text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "kanban_result_files_result_idx" ON "kanban_result_files" ("result_id");

-- ── Files ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_files" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id"        text NOT NULL,
  "file_name"      text NOT NULL,
  "file_url"       text NOT NULL,
  "file_size"      integer,
  "mime_type"      text,
  "uploaded_by_id" integer,
  "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at"     timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "kanban_files_card_idx" ON "kanban_files" ("card_id");

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_notifications" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    integer NOT NULL,
  "card_id"    text,
  "board_id"   text,
  "type"       text NOT NULL DEFAULT 'task_assigned',
  "title"      text NOT NULL,
  "message"    text,
  "is_read"    boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "kanban_notif_user_idx"  ON "kanban_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "kanban_notif_read_idx"  ON "kanban_notifications" ("is_read");

-- ── Templates ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "kanban_templates" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            text NOT NULL,
  "description"     text,
  "priority"        text NOT NULL DEFAULT 'normal',
  "board_id"        text,
  "checklist_items" jsonb DEFAULT '[]',
  "columns_config"  jsonb DEFAULT '[]',
  "created_by_id"   integer,
  "created_at"      timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"      timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at"      timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "kanban_templates_board_idx" ON "kanban_templates" ("board_id");
