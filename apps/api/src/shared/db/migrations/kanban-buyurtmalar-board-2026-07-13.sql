-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Owner decision 2026-07-13 (chat): the "orders" Kanban board must have exactly these 7
-- columns, in this exact order: Navbatda -> Flekso -> Yuqori bosma -> Kesish/Vysechka ->
-- Kashirovka -> Qadoqlash -> Tayyor. Applies to the EXISTING orders board — not a new,
-- separate board concept.
--
-- kanban_boards and kanban_columns were BOTH EMPTY (0 rows, verified live 2026-07-13, post
-- the 2026-07-11 full company reset). OrderCreatedKanbanHandler ->
-- KanbanCardsRepository.createKanbanForOrder()
-- (apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts) already runs
-- on every new sales order and looks for a board matching type='sales' OR
-- name ILIKE '%buyurtma%'/'%order%'/'%sotuv%', then drops a card into that board's first
-- (lowest sort_order) column. With zero boards this has been silently no-op'ing (logs a warn,
-- never blocks order creation — by design). This migration seeds exactly the board+columns
-- that lookup already expects, closing the gap without touching that repo code. Its own log
-- message even says so: "Yangi board yaratish uchun type='sales' qilib board oching."
--
-- Column labels are reused verbatim from taxonomy_entries (category='kanban_stage',
-- sort_order 1-7), already seeded by taxonomy-seed-2026-07-11.sql — no re-invented wording
-- (Q-40).
--
-- Both statements are idempotent (safe to re-run every boot — apps/api/src/shared/db/
-- invariants.ts ensureSchemaAdditions() re-executes every SCHEMA_MIGRATIONS entry on each
-- start, there is no migrations-tracking table):
--   1) the board insert only fires if no board already matches the same type/name predicate
--      that createKanbanForOrder() itself uses to find "the" orders board;
--   2) the column insert only fires for the exact 'Buyurtmalar'/'sales' board and only while
--      it has zero active (non-deleted) columns — mirrors the existing precedent in
--      g4-kanban-europrint-columns-seed-2026-07-02.sql (now inert, targets a different,
--      no-longer-existing 'EUROPRINT' board; left untouched, Q-46).
--
-- Out of scope (deliberately not touched here): kanban_status_column_map (SD-status ->
-- column auto-move rules) ships intentionally empty per its own migration
-- (kanban-status-column-map-2026-07-09.sql) — populating it is a separate business-policy
-- decision, not part of this seed (Q-40, no fabrication).
--
-- Registered in apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS
-- array).

INSERT INTO kanban_boards (name, type, description)
SELECT
  'Buyurtmalar',
  'sales',
  'Standart 7 bosqichli buyurtma ishlab chiqarish oqimi: Navbatda -> Flekso -> Yuqori bosma -> Kesish/Vysechka -> Kashirovka -> Qadoqlash -> Tayyor.'
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_boards
  WHERE deleted_at IS NULL
    AND (type = 'sales' OR name ILIKE '%buyurtma%' OR name ILIKE '%order%' OR name ILIKE '%sotuv%')
);

INSERT INTO kanban_columns (board_id, name, sort_order, color)
SELECT b.id, v.name, v.sort_order, v.color
FROM kanban_boards b
CROSS JOIN (VALUES
  ('Navbatda',        0, '#A0AEC0'),
  ('Flekso',          1, '#5B9BD5'),
  ('Yuqori bosma',    2, '#F5C96A'),
  ('Kesish/Vysechka', 3, '#A78BFA'),
  ('Kashirovka',      4, '#F6AD55'),
  ('Qadoqlash',       5, '#6DC5A0'),
  ('Tayyor',          6, '#48BB78')
) AS v(name, sort_order, color)
WHERE b.name = 'Buyurtmalar'
  AND b.type = 'sales'
  AND b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
  );
