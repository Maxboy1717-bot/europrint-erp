/**
 * @module sprint6-migration.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * Sprint 6 — Kanban extended tables
 *
 * The following tables were defined in schema-kanban.ts but were never
 * included in a SQL migration file and therefore do not exist in the DB:
 *
 *   kanban_tags, kanban_card_tags,
 *   kanban_observers, kanban_co_executors,
 *   kanban_time_tracks,
 *   kanban_results, kanban_result_files,
 *   kanban_files,
 *   kanban_notifications,
 *   kanban_templates
 *
 * Every `CREATE TABLE / INDEX` is guarded with IF NOT EXISTS so this service
 * is fully idempotent and safe to run on every app start.
 */
@Injectable()
export class Sprint6MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint6MigrationService.name);

  onApplicationBootstrap(): void {
    this.ensureKanbanExtendedTables().catch((e: unknown) =>
      this.logger.warn(`Sprint6Migration background failed: ${String(e)}`),
    );
  }

  private async ensureKanbanExtendedTables(): Promise<void> {
    const ddls: string[] = [
      // ── Core kanban tables (missing from earlier migrations) ───────────────
      `CREATE TABLE IF NOT EXISTS kanban_checklists (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id    TEXT NOT NULL,
        title      TEXT NOT NULL,
        position   INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_checklists_card_idx ON kanban_checklists (card_id)`,

      `CREATE TABLE IF NOT EXISTS kanban_checklist_items (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        checklist_id TEXT NOT NULL,
        title        TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        assignee_id  INTEGER,
        due_date     TEXT,
        position     INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_checklist_items_checklist_idx ON kanban_checklist_items (checklist_id)`,

      `CREATE TABLE IF NOT EXISTS kanban_card_comments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id    TEXT NOT NULL,
        user_id    INTEGER NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_card_comments_card_idx ON kanban_card_comments (card_id)`,

      `CREATE TABLE IF NOT EXISTS kanban_card_watchers (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id    TEXT NOT NULL,
        user_id    INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE (card_id, user_id)
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_card_watchers_card_idx ON kanban_card_watchers (card_id)`,

      // ── Tags ──────────────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_tags (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL,
        color      TEXT NOT NULL DEFAULT '#3b82f6',
        board_id   TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_tags_board_idx ON kanban_tags (board_id)`,

      `CREATE TABLE IF NOT EXISTS kanban_card_tags (
        id         SERIAL PRIMARY KEY,
        card_id    TEXT NOT NULL,
        tag_id     TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE (card_id, tag_id)
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_card_tags_card_idx ON kanban_card_tags (card_id)`,

      // ── Observers ─────────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_observers (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id    TEXT NOT NULL,
        user_id    INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE (card_id, user_id)
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_observers_card_idx ON kanban_observers (card_id)`,

      // ── Co-executors ──────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_co_executors (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id    TEXT NOT NULL,
        user_id    INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE (card_id, user_id)
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_co_exec_card_idx ON kanban_co_executors (card_id)`,

      // ── Time tracking ─────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_time_tracks (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id          TEXT NOT NULL,
        user_id          INTEGER NOT NULL,
        started_at       TIMESTAMPTZ NOT NULL,
        ended_at         TIMESTAMPTZ,
        duration_minutes INTEGER,
        target_minutes   INTEGER,
        is_running       BOOLEAN NOT NULL DEFAULT FALSE,
        description      TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_time_card_idx ON kanban_time_tracks (card_id)`,
      `CREATE INDEX IF NOT EXISTS kanban_time_user_idx ON kanban_time_tracks (user_id)`,

      // ── Results ───────────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_results (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id       TEXT NOT NULL,
        description   TEXT,
        created_by_id INTEGER NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_results_card_idx ON kanban_results (card_id)`,

      `CREATE TABLE IF NOT EXISTS kanban_result_files (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        result_id  TEXT NOT NULL,
        file_name  TEXT NOT NULL,
        file_url   TEXT NOT NULL,
        file_size  INTEGER,
        mime_type  TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_result_files_result_idx ON kanban_result_files (result_id)`,

      // ── Files ─────────────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_files (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id        TEXT NOT NULL,
        file_name      TEXT NOT NULL,
        file_url       TEXT NOT NULL,
        file_size      INTEGER,
        mime_type      TEXT,
        uploaded_by_id INTEGER,
        created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        deleted_at     TIMESTAMPTZ
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_files_card_idx ON kanban_files (card_id)`,

      // ── Notifications ─────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_notifications (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    INTEGER NOT NULL,
        card_id    TEXT,
        board_id   TEXT,
        type       TEXT NOT NULL DEFAULT 'task_assigned',
        title      TEXT NOT NULL,
        message    TEXT,
        is_read    BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_notif_user_idx ON kanban_notifications (user_id)`,
      `CREATE INDEX IF NOT EXISTS kanban_notif_read_idx ON kanban_notifications (is_read)`,

      // ── Templates ─────────────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS kanban_templates (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        description     TEXT,
        priority        TEXT NOT NULL DEFAULT 'normal',
        board_id        TEXT,
        checklist_items JSONB DEFAULT '[]',
        columns_config  JSONB DEFAULT '[]',
        created_by_id   INTEGER,
        created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        deleted_at      TIMESTAMPTZ
      )`,
      `CREATE INDEX IF NOT EXISTS kanban_templates_board_idx ON kanban_templates (board_id)`,

      // ── kanban_cards column additions ─────────────────────────────────────
      // These columns are required by acceptCard / completeCard / recurring cron.
      // ADD COLUMN IF NOT EXISTS is idempotent in PG 9.6+.
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS accepted_at       TIMESTAMPTZ`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS accepted_by_id    TEXT`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS completed_at      TIMESTAMPTZ`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS completion_report  TEXT`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT NOT NULL DEFAULT 'none'`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS recurrence_end_date DATE`,
      `ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS parent_card_id    TEXT`,
    ];

    let created = 0;
    for (const ddl of ddls) {
      try {
        await ddlRun(sql.raw(ddl));
        created++;
      } catch (e: unknown) {
        this.logger.warn(`Sprint6Migration DDL skipped: ${String(e)}`);
      }
    }
    this.logger.log(`Sprint6Migration: ${created}/${ddls.length} DDL statements applied`);
  }
}
