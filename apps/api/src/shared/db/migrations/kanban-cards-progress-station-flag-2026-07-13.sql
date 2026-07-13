-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- kanban-cards-progress-station-flag-2026-07-13.sql
-- Owner decision (2026-07-13, chat): kanban_cards needs 4 new fields —
--   1. Tiraj/progress       — production quantity progress (percent or produced-vs-ordered
--                              count; owner did not specify which, so this ships as a plain
--                              nullable NUMERIC with no invented precision/scale/bounds, Q-40).
--   2. qoldiq-to'lov        — remaining payment owed on the linked sales_order. NOT added as a
--                              stored column here — implemented as a read-time computed field
--                              instead (LEFT JOIN sales_orders ON kc.related_type='sales_order'
--                              AND so.id=kc.related_id AND so.deleted_at IS NULL,
--                              COALESCE(so.balance_due_amount, so.total_amount - so.paid_amount))
--                              in KanbanCardsController.getBoardCards/getAllCards. A
--                              stored/synced column would need a write-path hook everywhere
--                              sales_orders payments change (Finance/SD) to stay correct —
--                              exactly the sync-bug risk the task asked to avoid; the join is
--                              clean because kanban_cards.related_id already stores the
--                              sales_orders.id link (both integer, confirmed live) and
--                              sales_orders already carries a maintained balance_due_amount.
--   3. stansiya-operator    — which work-station/operator is handling this card. work_centers
--                              is the correct existing FK target (confirmed live: id integer PK,
--                              other tables e.g. mes_sos_events/pp_shift_plans already FK to it
--                              the same way). Column: station_operator_id INTEGER REFERENCES
--                              work_centers(id) ON DELETE SET NULL.
--   4. Izoh-belgi           — comment/flag marker. Implemented as a plain boolean
--                              ("has important note") per the task's own safest-option guidance
--                              — no enum values were invented.
--
-- Additive + idempotent: all three physical columns are nullable or have a structural (not
-- business) default; existing rows are unaffected (Q-39/Q-46). No destructive change.
--
-- Verified live before drafting (2026-07-13): kanban_cards had exactly 32 columns, none of
-- these three yet (\d kanban_cards); work_centers.id is an integer PK; sales_orders has
-- total_amount/paid_amount/balance_due_amount/advance_paid_amount columns already maintained by
-- the SD/Finance modules. sales_orders and work_centers are both base tables (relkind='r'), not
-- views.
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of the
-- entries actually executed from apps/api/src/shared/db/invariants/migrations-schema.ts
-- (SCHEMA_MIGRATIONS array, 'kanban_cards.progress column ...' / 'kanban_cards.station_operator_id
-- FK -> work_centers ...' / 'kanban_cards.station_operator_id index ...' /
-- 'kanban_cards.comment_flag column ...' entries).
-- ============================================================================

ALTER TABLE IF EXISTS kanban_cards
  ADD COLUMN IF NOT EXISTS progress NUMERIC;

ALTER TABLE IF EXISTS kanban_cards
  ADD COLUMN IF NOT EXISTS station_operator_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kanban_cards_station_operator_id
  ON kanban_cards (station_operator_id);

ALTER TABLE IF EXISTS kanban_cards
  ADD COLUMN IF NOT EXISTS comment_flag BOOLEAN NOT NULL DEFAULT false;
