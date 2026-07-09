-- APPROVED: egasi 2026-07-09 (owner-decisions batch item 4 — Kanban status->column auto-move mechanism)
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/kanban-status-column-map-2026-07-09.sql
-- SD status -> Kanban column auto-move mapping (Guruh-B owner policy).
--   When a sales order's SD status changes, a linked kanban card may auto-move to
--   a mapped column. The listener half (OrderStatusChangedKanbanHandler +
--   KanbanCardsRepository.moveOrderCardByStatusMap) is wired ON TOP of the existing
--   note-append (appendOrderStatusNote stays unchanged). One rule PER SD status
--   (UNIQUE sd_status). kanban_column_id -> kanban_columns(id) (integer serial PK).
-- SHIPS INERT: ZERO seed rows. The move mechanism is a pure no-op until the owner
--   inserts (sd_status -> kanban_column_id) rules via master-data — no regression to
--   the note-append golden-thread sync.
-- Boot mirror: this table is also created idempotently on app start by
--   apps/api/src/infrastructure/database/sprint6-migration.service.ts (the kanban
--   OnApplicationBootstrap DDL runner) — same CREATE TABLE, kept in sync with this file.
-- Additive + idempotent (CREATE TABLE IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS kanban_status_column_map (id serial PRIMARY KEY, sd_status varchar(64) NOT NULL UNIQUE, kanban_column_id integer NOT NULL REFERENCES kanban_columns(id), created_at timestamptz DEFAULT now());
