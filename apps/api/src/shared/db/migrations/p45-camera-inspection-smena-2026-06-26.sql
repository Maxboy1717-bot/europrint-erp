-- ============================================================================
-- P45 (T11-12) — IoT camera AI inspection + smena (smena_type/smena_boss_card_id)
-- ============================================================================
-- STATUS: ⛔ GATED — PENDING OWNER APPROVAL — DO NOT AUTO-APPLY (Q-35).
--   This file is NOT wired into the migration runner. Add a line
--   "-- APPROVED: <egasi/sana>" below and remove this banner before applying.
--
-- WHY GATED (2 sabab):
--   1. Q-35 — yangi CREATE TABLE / ALTER TABLE = egasi ruxsati shart.
--   2. FABRIKATSIYA TAQIQ (Q-40) — kamera xona-tekshiruvi REAL ishlashi uchun
--      Gemini VLM API kaliti (GEMINI_API_KEY = egasi-DATA) kerak. Kalitsiz AI
--      chaqiruvi soxta bo'ladi. Bu migration FAQAT struktura (jadval/ustun) yaratadi;
--      kalit berilmaguncha 2-soatlik cron va inspectRoom() jonli ishlamaydi.
--      Struktura tasdiq: jadvallar tayyor, AI-kalit kelganda darrov "tiriladi".
--
-- LIVE-PROOF (europrint @127.0.0.1:5432, T11-12 read-only probe 2026-06-26):
--   • production_sessions.smena_type / smena_boss_card_id — YO'Q (qo'shiladi).
--   • room_inspections / inspection_violations / ppe_alerts / attendance_camera_log — YO'Q.
--   • camera_zones MAVJUD (iot-schema.ts:59, id=serial/integer) — FK target tayyor;
--     ideal_photo_url / description ustunlari YO'Q (qo'shiladi).
--   • oee_snapshots MAVJUD — source_session_id / calculated_at ustunlari YO'Q (qo'shiladi).
--
-- ADDITIVE ONLY: hech qanday mavjud ustun o'zgartirilmaydi/o'chirilmaydi.
--   IF NOT EXISTS hamma joyda — idempotent. Build-faza (jadvallar bo'sh) → xavfsiz.
--
-- IZOLYATSIYA: machines jadvali bu fayl egasi EMAS (P44 kanonik). Bu yerda
--   machines CREATE/seed YO'Q. Bu fayl machines.id ga FK QILMAYDI (E1 kamera oqimi
--   camera_zones ga, smena_boss_card_id esa karta ID — FK qo'yilmaydi: karta-yadro
--   (org_functions / employee_cards) hali to'liq bog'lanmagan, EP-IOT izoh).

-- ----------------------------------------------------------------------------
-- 1. production_sessions — smena (A/B/C) + smena boshlig'i kartasi
-- ----------------------------------------------------------------------------
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS smena_type         VARCHAR(1),
  ADD COLUMN IF NOT EXISTS smena_boss_card_id INTEGER;

-- CHECK ni alohida (IF NOT EXISTS bilan ADD COLUMN inline CHECK takror qo'yilmasin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'production_sessions_smena_type_chk'
  ) THEN
    ALTER TABLE production_sessions
      ADD CONSTRAINT production_sessions_smena_type_chk
      CHECK (smena_type IS NULL OR smena_type IN ('A','B','C'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. camera_zones — ideal holat rasmi (xona-tekshiruvi uchun) + tavsif
-- ----------------------------------------------------------------------------
ALTER TABLE camera_zones
  ADD COLUMN IF NOT EXISTS ideal_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT;

-- ----------------------------------------------------------------------------
-- 3. room_inspections (EP-IOT-010/011) — Gemini VLM xona-tekshiruvi natijasi
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_inspections (
  id              SERIAL PRIMARY KEY,
  camera_zone_id  INTEGER NOT NULL REFERENCES camera_zones(id) ON DELETE CASCADE,
  inspected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score_0_100     INTEGER NOT NULL CHECK (score_0_100 BETWEEN 0 AND 100),
  violations      JSONB,    -- [{criterion, description, severity}]
  ai_model        VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-flash',
  prompt_used     TEXT,
  raw_response    TEXT,
  ideal_url       TEXT,     -- ideal_photo_url snapshot
  actual_url      TEXT,     -- tekshiruv vaqtidagi snapshot
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_insp_zone_time
  ON room_inspections(camera_zone_id, inspected_at DESC);

-- ----------------------------------------------------------------------------
-- 4. inspection_violations (EP-IOT-012) — yopiq tsikl: assign→resolve→escalate
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_violations (
  id                    SERIAL PRIMARY KEY,
  inspection_id         INTEGER NOT NULL REFERENCES room_inspections(id) ON DELETE CASCADE,
  criterion_code        VARCHAR(50) NOT NULL,
  description           TEXT NOT NULL,
  severity              VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  photo_url             TEXT,
  assigned_to_card_id   INTEGER,
  due_date              DATE,
  resolved_at           TIMESTAMPTZ,
  resolved_by_card_id   INTEGER,
  escalated_at          TIMESTAMPTZ,
  escalated_to_card_id  INTEGER,
  status                VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','assigned','resolved','escalated','closed')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_violations_status
  ON inspection_violations(status, due_date);

-- ----------------------------------------------------------------------------
-- 5. ppe_alerts (EP-IOT-077/078) — E1: AI aniqlaydi, INSON tasdiqlaydi
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ppe_alerts (
  id                    SERIAL PRIMARY KEY,
  camera_zone_id        INTEGER REFERENCES camera_zones(id) ON DELETE SET NULL,
  detected_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  worker_card_id        INTEGER,              -- NULL = noma'lum
  violation_type        VARCHAR(50) NOT NULL, -- no_helmet, no_vest, no_gloves, no_mask, other
  photo_url             TEXT,
  ai_confidence         NUMERIC(5,4),         -- 0.0-1.0
  confirmed_by_card_id  INTEGER,              -- E1: inson tasdiqlaydi (NULL = hali tasdiqlanmagan)
  confirmed_at          TIMESTAMPTZ,
  action_taken          TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','dismissed','resolved')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppe_alerts_status ON ppe_alerts(status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppe_alerts_zone   ON ppe_alerts(camera_zone_id, detected_at DESC);

-- ----------------------------------------------------------------------------
-- 6. attendance_camera_log (Q108) — event-based: entry/exit/workspace
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_camera_log (
  id              SERIAL PRIMARY KEY,
  worker_card_id  INTEGER NOT NULL,
  camera_zone_id  INTEGER REFERENCES camera_zones(id) ON DELETE SET NULL,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type      VARCHAR(30) NOT NULL
    CHECK (event_type IN ('entry','exit','workspace_arrival','workspace_departure')),
  ai_confidence   NUMERIC(5,4),
  photo_url       TEXT,
  verified        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_cam_log_worker ON attendance_camera_log(worker_card_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_att_cam_log_zone   ON attendance_camera_log(camera_zone_id, detected_at DESC);

-- ----------------------------------------------------------------------------
-- 7. oee_snapshots — real session-data bilan to'ldirishga tayyorlash (additiv)
-- ----------------------------------------------------------------------------
ALTER TABLE oee_snapshots
  ADD COLUMN IF NOT EXISTS source_session_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS calculated_at     TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- APPLY (egasi APPROVED qo'ygandan keyin):
--   docker exec -i <postgres> psql -U postgres -d europrint \
--     < apps/api/src/shared/db/migrations/p45-camera-inspection-smena-2026-06-26.sql
-- KEYIN: lib/db/src/schema/iot-schema.ts ga mos Drizzle pgTable qo'shiladi
--   (roomInspections, inspectionViolations, ppeAlerts, attendanceCameraLog,
--    + productionSessions.smenaType/smenaBossCardId) — sxema↔DB mosligi uchun.
-- ============================================================================
