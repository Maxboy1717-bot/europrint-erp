-- pos-49-mes-session-id-fk-2026-07-11.sql
-- POS-19 #49 — Bitta qurilmada MES brak + POS chiqim, mes_session_id FK.
-- Vision: vision-1000-answers/19-pos.md #49 — "MES sessiya ID POS harakat metadata'siga
-- avtomatik bog'lanadi: pos_movements.mes_session_id -> MES production_sessions.id FK."
--
-- APPROVED: owner schema-approval wave 2026-07-11 (Muslimbek, chat) — Q-35.
-- docs/audit/_PHASE2-OWNER-DECISIONS-2026-07-11.md ##49 (Schema sign-off Q-35 batch, 13 items).
--
-- Scope: schema-only, per the build note — no consumer wiring yet. The auto-link from an
-- active MES production_session to the POS chiqim it originated from is a separate, later
-- slice; this migration only adds the column + FK + index it will need.
--
-- Verified before drafting: pos_movements has 57 live columns and none named mes_session_id
-- (full information_schema.columns read, 2026-07-11). Target table production_sessions
-- exists with an integer primary key `id` (confirmed live).
--
-- Additive + idempotent: nullable column, defaults NULL (= no MES-session context = current
-- behavior for every existing row, no regress). ON DELETE SET NULL: deleting a
-- production_session must not delete/cascade the POS movement that referenced it.
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of
-- the entries actually executed from
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS array,
-- 'pos_movements.mes_session_id FK -> production_sessions (POS-19 #49)' and its companion
-- index entry).

ALTER TABLE IF EXISTS pos_movements
  ADD COLUMN IF NOT EXISTS mes_session_id INTEGER REFERENCES production_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pos_movements_mes_session_id
  ON pos_movements (mes_session_id);
