-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-tech-card-routes-construction-phase-2026-07-11.sql
-- EP-PP-126 (Modul-07 #132) — Konstruktor/dizayn bosqichi marshrutda (chizma+qolip vaqt/holat).
--   Vizyon: TASDIQ-2146 §07 #132. Marshrut endi ishlab-chiqarish oplaridan OLDIN keladigan
--   konstruktor bosqichini (chizma + qolip tayyorlash) o'z holati va rejalashtirilgan davomiyligi
--   bilan ifodalay oladi.
--
-- Kanonik jadval: tech_card_routes (lib/db/src/schema/pp/pp-enhanced.ts -> techCardRoutes) —
--   ALTER qilinadi, HECH QANDAY dublikat jadval fork qilinmaydi (STANDARTLAR §15, DB_ERD).
--
-- Additive + regresssiz (Q-39/Q-46): is_construction_phase DEFAULT false — mavjud barcha qatorlar
--   oddiy op sifatida qoladi (joriy xatti-harakat o'zgarmaydi); construction_status va
--   construction_duration_min NULLABLE (bo'sh = holat/davomiylik hali yo'q).
--
-- Idempotent: CREATE TYPE pg_type guard bilan; ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
--   Qayta ishga tushirilsa xatosiz o'tadi.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-tech-card-routes-construction-phase-2026-07-11.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'construction_phase_status') THEN
    CREATE TYPE construction_phase_status AS ENUM ('not_started', 'drawing', 'mold_making', 'completed');
  END IF;
END $$;

ALTER TABLE tech_card_routes ADD COLUMN IF NOT EXISTS is_construction_phase boolean NOT NULL DEFAULT false;
ALTER TABLE tech_card_routes ADD COLUMN IF NOT EXISTS construction_status construction_phase_status;
ALTER TABLE tech_card_routes ADD COLUMN IF NOT EXISTS construction_duration_min integer;

COMMENT ON COLUMN tech_card_routes.is_construction_phase IS 'EP-PP-126: op = konstruktor/dizayn bosqichi (chizma+qolip), ishlab-chiqarish oplaridan oldin';
COMMENT ON COLUMN tech_card_routes.construction_status IS 'EP-PP-126: konstruktor bosqichi holati (not_started/drawing/mold_making/completed)';
COMMENT ON COLUMN tech_card_routes.construction_duration_min IS 'EP-PP-126: konstruktor bosqichi rejalashtirilgan davomiyligi (daqiqa)';
