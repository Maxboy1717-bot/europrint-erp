-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Owner decision 2026-07-13 (chat): the Kanban WIP-limit (previously hardcoded
-- KANBAN_WIP_LIMIT_JARAYONDA=3 in kanban-boards.service.ts, enforced identically on
-- every "Jarayonda" column of every board) is now per-column CRUD-configurable, and a
-- supervisor-role user who moves a card into an at-limit column bypasses the block —
-- the move is allowed and logged instead of being rejected with CONFLICT.
--
-- kanban_columns.wip_limit — nullable INTEGER. NULL means "no per-column override";
-- KanbanBoardsService.assertCanMoveTo() falls back to the historical global default
-- KANBAN_WIP_LIMIT_JARAYONDA=3 in that case, so every existing board/column keeps
-- behaving exactly as before (additive, Q-46 non-regression). Per-column (not
-- per-board) because the enforcement code keys entirely off the destination
-- column id — a board can have more than one column mapped to the JARAYONDA stage
-- (statusFromColumnName is name-based), so per-column is what the code actually
-- needs. CRUD: the existing POST /kanban/boards/:boardId/columns (create) and
-- PATCH /kanban/boards/:boardId/columns/:columnId (update) endpoints now also
-- accept wipLimit/wip_limit (kanban.dto.ts KanbanAddColumnSchema /
-- KanbanUpdateColumnSchema); GET /kanban/boards/:boardId returns it on each column.
--
-- kanban_wip_overrides — audit log. Shape/naming mirrors qc_override_log
-- (schema-misc-qc.ts / qc-override-log-2026-07-11.sql: user_id, reason, created_at)
-- per the same override-log convention: overridden_by_user_id, reason, created_at.
-- Written by KanbanBoardsService.assertCanMoveTo() when a 'supervisor'-role acting
-- user (KANBAN_WIP_OVERRIDE_ROLES, case-insensitive — same comparison RolesGuard
-- uses) moves a card into a column that is already at its WIP limit: instead of the
-- normal CONFLICT error, the move is allowed and a row is inserted here. A
-- log-insert failure does not block the (already-authorized) move — fail-open,
-- consistent with the existing WIP count-query fail-open behavior in the same method.
--
-- Verified before drafting (europrint, 2026-07-13): kanban_columns / kanban_cards are
-- both base tables (relkind='r', not views); neither kanban_columns.wip_limit nor
-- kanban_wip_overrides exist yet; kanban_cards.id and kanban_columns.id are both
-- integer serial primary keys and users.id is integer (FK-safe for the new table).
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror
-- of the entries actually executed from
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS array,
-- 'kanban_columns.wip_limit column (per-column WIP-limit override, owner 2026-07-13)'
-- and 'kanban_wip_overrides table (WIP-limit supervisor-override log, owner
-- 2026-07-13)' plus its two index entries).
-- Idempotent: ADD COLUMN/CREATE TABLE/CREATE INDEX all use IF NOT EXISTS — safe to
-- re-run.

ALTER TABLE IF EXISTS kanban_columns
  ADD COLUMN IF NOT EXISTS wip_limit INTEGER;

CREATE TABLE IF NOT EXISTS kanban_wip_overrides (
  id                    SERIAL PRIMARY KEY,
  card_id               INTEGER NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  column_id             INTEGER NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  overridden_by_user_id INTEGER NOT NULL REFERENCES users(id),
  reason                TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kanban_wip_overrides_column ON kanban_wip_overrides (column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_wip_overrides_card ON kanban_wip_overrides (card_id);
