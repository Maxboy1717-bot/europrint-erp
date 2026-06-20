-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/org-node-portret-card-key-2026-06-20.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Enable per-CARD portret in org_node_portret.
--   Problem: node_id was NOT NULL + UNIQUE + FK->org_departments. All 97
--   org_functions cards live in one department (id=19), so a card-keyed
--   portret would violate the unique node_id index on the 2nd card.
--   (Proven in a rollback tx: card 2 insert -> duplicate key on
--   idx_org_node_portret_node_id.)
--   Fix (additive, non-destructive; table is empty — 0 rows):
--     1. node_id nullable (card rows carry NULL node_id).
--     2. node-level uniqueness only over node rows (WHERE card_id IS NULL).
--     3. card-level natural key uniqueness over card rows.
--   Node-level portret upsert (onConflictDoUpdate on node_id) still works
--   because the node-unique index now covers only card_id IS NULL rows.
-- Mirrored into the startup bootstrap (ddl-migrations.ts ensureOrgNodePortretTable)
--   so fresh DBs get this shape directly.
-- Idempotent.
-- ============================================================

ALTER TABLE org_node_portret ALTER COLUMN node_id DROP NOT NULL;

-- card_id already added by org-card-portret-2026-06-19.sql; ensure present.
ALTER TABLE org_node_portret
  ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL;

-- Replace the full unique node_id index with a partial one (node rows only).
DROP INDEX IF EXISTS idx_org_node_portret_node_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_node_portret_node_id
  ON org_node_portret(node_id) WHERE card_id IS NULL;

-- Card-level natural key: one portret per card.
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_node_portret_card_id
  ON org_node_portret(card_id) WHERE card_id IS NOT NULL;
