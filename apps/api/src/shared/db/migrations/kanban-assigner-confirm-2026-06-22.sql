-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/kanban-assigner-confirm-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- EP-KAN — assigner-confirm completion. Owner's vision: the person who ASSIGNED
-- a task confirms its completion (the assignee cannot self-mark "Bajarildi"; the
-- assignee moves the card INTO "Tekshiruvda" to request confirmation, and the
-- assigner approves it into "Bajarildi"). The canonical board (kanban_cards) only
-- had owner_user_id (assignee) — it lacked an assigner column to enforce this.
--
-- Additive + idempotent. kanban_cards has ZERO existing FK constraints and
-- owner_user_id is a plain integer (no FK), so assigner_user_id follows that same
-- convention (plain integer, no FK; users.id is integer). Existing human-created
-- cards keep assigner_user_id = NULL → treated as legacy/freely-movable (no
-- regression, Q-39). New cards record their creator as the assigner.
-- ============================================================

ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS assigner_user_id integer;
CREATE INDEX IF NOT EXISTS kanban_cards_assigner_user_id_idx ON kanban_cards (assigner_user_id);
