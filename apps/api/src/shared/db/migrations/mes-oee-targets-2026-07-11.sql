-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 08-mes #36 — OEE maqsad (target) faqat НО/direktor tomonidan o'zgartiriladi; versiyalanadi.
-- Vizyon: vision-1000-answers/08-mes.md #36. Ilgari MESExtended.tsx:146 da "oee >= 85"
--   qattiq-kodlangan edi (settings-jadval yo'q). Bu migration OEE-target sozlama jadvalini
--   yaratadi: har o'zgartirish YANGI versiya (append-only), joriy target = is_active row.
--   station_id NULL = zavod-bo'yicha default; NOT NULL station_id = alohida stanok/uchastka.
--
-- FAQAT ADDITIV: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS + seed
--   (INSERT ... WHERE NOT EXISTS). DESTRUCTIVE amal YO'Q. Idempotent — qayta qo'llasa xavfsiz.
-- created_by = users(id) ga soft-link (FK yo'q — seed/eski satrlar uchun NULL = "tizim/egasi").
-- station_id = equipment(id) ga soft-link (FK yo'q — zavod-default uchun NULL).
--   DB-proof: rollback-tx europrint (2026-07-11) — seed v1/85 -> createTarget v2/90 ->
--   getCurrent v2/90, 1 active row, ROLLBACK: to_regclass = null (jonli sxema tegilmagan).

CREATE TABLE IF NOT EXISTS mes_oee_targets (
  id             SERIAL PRIMARY KEY,
  station_id     INTEGER NULL,
  target_percent NUMERIC(5,2) NOT NULL DEFAULT 85,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version        INTEGER NOT NULL DEFAULT 1,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_by     INTEGER NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mes_oee_targets_station ON mes_oee_targets(station_id, effective_date);
CREATE INDEX IF NOT EXISTS idx_mes_oee_targets_active  ON mes_oee_targets(is_active, station_id);

-- Seed one factory-wide target = 85 (the historical hardcoded MESExtended.tsx:146 value),
-- so the OEE "world-class" gate keeps working immediately. Owner adjusts at runtime via
-- POST /mes/oee-targets (НО/direktor RBAC). Additive: only inserts if no factory-wide row.
INSERT INTO mes_oee_targets (station_id, target_percent, effective_date, version, is_active, created_by)
SELECT NULL, 85, CURRENT_DATE, 1, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM mes_oee_targets WHERE station_id IS NULL);
