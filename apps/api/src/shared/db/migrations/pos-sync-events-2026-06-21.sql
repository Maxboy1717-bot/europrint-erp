-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/pos-sync-events-2026-06-21.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-21
-- pos_sync_events: the ONE swallowed-error gap with a genuine writer.
--   wms-warehouse-gateway.repo.ts logPosSyncEvent() INSERTs here on every
--   POST /api/warehouse/warehouses/:id/sync-pos, but the INSERT silently
--   no-ops (.catch(()=>null)) because the table was missing. Columns matched
--   EXACTLY to that INSERT (warehouse_id, event_type, triggered_by, created_at).
-- FK triggered_by->users(id) live-verified (PK). NO FK on warehouse_id:
--   wms_warehouses.id has no PK/UNIQUE in live DB; the writer also passes NULL.
-- (Other audit gaps DEFERRED — no writer: skill_gap_analysis, warehouse_materials;
--  position_skills is a name-drift bug fixed in code, not a new table.)
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_sync_events (
  id           SERIAL PRIMARY KEY,
  warehouse_id INTEGER,
  event_type   VARCHAR(64) NOT NULL DEFAULT 'WAREHOUSE_SYNC',
  triggered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos_sync_events_warehouse_id ON pos_sync_events (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pos_sync_events_created_at   ON pos_sync_events (created_at DESC);
