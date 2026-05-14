-- ============================================================
-- Kanban Extended Tables Migration
-- Created: 2026-05-09
-- ============================================================

-- Bildirishnomalar (Notifications)
CREATE TABLE IF NOT EXISTS kanban_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     INTEGER NOT NULL,
  card_id     TEXT,
  board_id    TEXT,
  type        TEXT NOT NULL DEFAULT 'task_assigned',
  title       TEXT NOT NULL,
  message     TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kanban_notif_user_idx ON kanban_notifications(user_id);
CREATE INDEX IF NOT EXISTS kanban_notif_read_idx  ON kanban_notifications(is_read);
CREATE INDEX IF NOT EXISTS kanban_notif_card_idx  ON kanban_notifications(card_id);

-- Shablonlar (Templates)
CREATE TABLE IF NOT EXISTS kanban_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  priority         TEXT NOT NULL DEFAULT 'normal',
  board_id         TEXT,
  checklist_items  JSONB DEFAULT '[]',
  columns_config   JSONB DEFAULT '[]',
  created_by_id    INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS kanban_templates_board_idx ON kanban_templates(board_id);

-- Vaqt kuzatuvi (Time Tracking)
CREATE TABLE IF NOT EXISTS kanban_time_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          TEXT NOT NULL,
  user_id          INTEGER NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  target_minutes   INTEGER,
  is_running       BOOLEAN NOT NULL DEFAULT FALSE,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kanban_time_card_idx ON kanban_time_tracks(card_id);
CREATE INDEX IF NOT EXISTS kanban_time_user_idx ON kanban_time_tracks(user_id);

-- Teglar (Tags)
CREATE TABLE IF NOT EXISTS kanban_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#3b82f6',
  board_id   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kanban_tags_board_idx ON kanban_tags(board_id);

CREATE TABLE IF NOT EXISTS kanban_card_tags (
  id         SERIAL PRIMARY KEY,
  card_id    TEXT NOT NULL,
  tag_id     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, tag_id)
);
CREATE INDEX IF NOT EXISTS kanban_card_tags_card_idx ON kanban_card_tags(card_id);

-- Natijalar (Results)
CREATE TABLE IF NOT EXISTS kanban_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       TEXT NOT NULL,
  description   TEXT,
  created_by_id INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kanban_results_card_idx ON kanban_results(card_id);

CREATE TABLE IF NOT EXISTS kanban_result_files (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id  TEXT NOT NULL,
  file_name  TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  file_size  INTEGER,
  mime_type  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kanban_result_files_result_idx ON kanban_result_files(result_id);

-- Kuzatuvchilar (Observers)
CREATE TABLE IF NOT EXISTS kanban_observers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    TEXT NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);
CREATE INDEX IF NOT EXISTS kanban_observers_card_idx ON kanban_observers(card_id);

-- Hamijrochilar (Co-Executors)
CREATE TABLE IF NOT EXISTS kanban_co_executors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    TEXT NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);
CREATE INDEX IF NOT EXISTS kanban_co_exec_card_idx ON kanban_co_executors(card_id);

-- Fayl birikmalari (File Attachments)
CREATE TABLE IF NOT EXISTS kanban_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id        TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_url       TEXT NOT NULL,
  file_size      INTEGER,
  mime_type      TEXT,
  uploaded_by_id INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS kanban_files_card_idx ON kanban_files(card_id);

-- kanban_boards jadvali mavjudligini tekshirish va ustunlarni to'ldirish
DO $$
BEGIN
  -- accepted_at ustuni
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN accepted_at TIMESTAMPTZ;
  END IF;
  -- accepted_by_id ustuni
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'accepted_by_id'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN accepted_by_id TEXT;
  END IF;
  -- completed_at ustuni
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  -- completion_report ustuni
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'completion_report'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN completion_report TEXT;
  END IF;
  -- recurrence_pattern ustuni (daily|weekly|monthly|none)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN recurrence_pattern TEXT NOT NULL DEFAULT 'none';
  END IF;
  -- recurrence_end_date ustuni
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN recurrence_end_date DATE;
  END IF;
  -- parent_card_id ustuni (recurring templates)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_cards' AND column_name = 'parent_card_id'
  ) THEN
    ALTER TABLE kanban_cards ADD COLUMN parent_card_id TEXT;
  END IF;
  -- board department filter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_boards' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE kanban_boards ADD COLUMN department_id TEXT;
  END IF;
END $$;
