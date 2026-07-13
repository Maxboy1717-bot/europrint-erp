-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Owner decision 2026-07-13 (chat): QC/MES/Design events now fan out into Kanban cards.
-- Session added 3 real event listeners (QcFailedKanbanHandler, MesCompletedKanbanHandler,
-- DesignRequestedKanbanHandler — apps/api/src/modules/kanban/application/event-handlers/)
-- that call KanbanCardsRepository.createKanbanForQcInspection / createKanbanForMesSession /
-- createKanbanForDesignTask, which all delegate into the shared
-- createKanbanForSource() helper (kanban-cards.repo.ts) with these exact hint arrays:
--   QC:         boardTypeHints=['qc'],                 boardNameHints=['sifat','qc','nazorat']
--   MES:        boardTypeHints=['production','mes'],   boardNameHints=['ishlab chiqarish','mes','production']
--   Design:     boardTypeHints=['design'],              boardNameHints=['dizayn','design']
--
-- Live-verified 2026-07-13: kanban_boards has exactly 1 row (id=2, type='sales', the
-- 'Buyurtmalar' board from kanban-buyurtmalar-board-2026-07-13.sql). None of the 3 hint
-- arrays above match it, so all 3 new triggers have been silently no-op'ing since they were
-- wired today (createKanbanForSource logs a warn and returns Ok(void) — by design, it must
-- never block QC/MES/Design workflows).
--
-- This migration seeds 3 more boards, each with exactly 1 default column, closing that gap —
-- mirrors kanban-buyurtmalar-board-2026-07-13.sql's pattern exactly (board INSERT guarded by
-- WHERE NOT EXISTS on the same predicate the lookup itself uses, then a column INSERT guarded
-- by "this board has zero active columns"). Column name 'Navbatda' reused verbatim from the
-- existing 'Buyurtmalar' board's first column — no re-invented wording (Q-40); this is pure
-- board/column infrastructure scaffolding, not a business threshold/number, so no
-- business_settings entry is needed.
--
-- Only 3 boards (not 4): the MES hint array OR-matches type='production' OR type='mes', so a
-- single board with type='production' satisfies createKanbanForMesSession's lookup without a
-- separate 'mes'-type board — avoids inventing a 4th board the repo code never asks for.
--
-- Both statements per board are idempotent (safe to re-run every boot — apps/api/src/shared/
-- db/invariants.ts ensureSchemaAdditions() re-executes every SCHEMA_MIGRATIONS entry on each
-- start, there is no migrations-tracking table).
--
-- Registered in apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS
-- array).

-- 1) QC board — matches createKanbanForQcInspection's hint arrays.
INSERT INTO kanban_boards (name, type, description)
SELECT
  'Sifat nazorati',
  'qc',
  'QC tekshiruvi rad etilganda avtomatik karta tushadigan standart kanban board.'
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_boards
  WHERE deleted_at IS NULL
    AND (type = 'qc' OR name ILIKE '%sifat%' OR name ILIKE '%qc%' OR name ILIKE '%nazorat%')
);

INSERT INTO kanban_columns (board_id, name, sort_order, color)
SELECT b.id, 'Navbatda', 0, '#A0AEC0'
FROM kanban_boards b
WHERE b.name = 'Sifat nazorati'
  AND b.type = 'qc'
  AND b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
  );

-- 2) Production/MES board — matches createKanbanForMesSession's hint arrays
--    (type='production' alone OR-satisfies the ['production','mes'] type-hint check).
INSERT INTO kanban_boards (name, type, description)
SELECT
  'Ishlab chiqarish',
  'production',
  'MES ishlab chiqarish sessiyasi tugaganda avtomatik karta tushadigan standart kanban board.'
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_boards
  WHERE deleted_at IS NULL
    AND (type = 'production' OR type = 'mes' OR name ILIKE '%ishlab chiqarish%' OR name ILIKE '%mes%' OR name ILIKE '%production%')
);

INSERT INTO kanban_columns (board_id, name, sort_order, color)
SELECT b.id, 'Navbatda', 0, '#A0AEC0'
FROM kanban_boards b
WHERE b.name = 'Ishlab chiqarish'
  AND b.type = 'production'
  AND b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
  );

-- 3) Design board — matches createKanbanForDesignTask's hint arrays.
INSERT INTO kanban_boards (name, type, description)
SELECT
  'Dizayn',
  'design',
  'Dizayn vazifasi talab qilinganda avtomatik karta tushadigan standart kanban board.'
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_boards
  WHERE deleted_at IS NULL
    AND (type = 'design' OR name ILIKE '%dizayn%' OR name ILIKE '%design%')
);

INSERT INTO kanban_columns (board_id, name, sort_order, color)
SELECT b.id, 'Navbatda', 0, '#A0AEC0'
FROM kanban_boards b
WHERE b.name = 'Dizayn'
  AND b.type = 'design'
  AND b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
  );
