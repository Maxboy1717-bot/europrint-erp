-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-tech-card-route-pvc-window-2026-07-11.sql
-- EP-PP-112 / §07 #118 — Oynakcha (PVC window / window-patch) = PVX material + qo'l-mehnat
-- ALOHIDA bosqich. A route operation can be flagged as the PVC-window attach stage
-- (operation_subtype = 'pvc_window') and carry the PVX-film material it consumes
-- (material_id -> material_cards). Its labor norm is the ordinary per-route norm
-- (norm_per_hour / setup_minutes already on tech_card_routes) — no new norm column.
--
-- Additive + non-regressive (Q-39/Q-46): both columns are NULLABLE with no default,
-- so every existing tech_card_routes row stays an ordinary operation (subtype NULL).
-- material_id FK is ON DELETE SET NULL, so deleting a material card only unlinks the
-- stage, never deletes a route. material_cards.id is INTEGER (canonical raw-material
-- table, STANDARTLAR §15) so the INTEGER FK is type-correct.
--
-- Idempotent: ALTER TABLE ... ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-tech-card-route-pvc-window-2026-07-11.sql

ALTER TABLE IF EXISTS tech_card_routes
  ADD COLUMN IF NOT EXISTS operation_subtype VARCHAR(30);

ALTER TABLE IF EXISTS tech_card_routes
  ADD COLUMN IF NOT EXISTS material_id INTEGER REFERENCES material_cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tech_card_routes_operation_subtype
  ON tech_card_routes (operation_subtype);

-- DB-proof (see spec.dbProof): after running
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'tech_card_routes' AND column_name IN ('operation_subtype','material_id');  -- expected: 2 rows
