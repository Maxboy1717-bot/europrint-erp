-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql
-- P36 AI Violation + Block + Camera + Burnout + Fraud schema.
-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
--   (T18-C3-CRM-GATED — STRUKTURA only; AI salbiy ta'sir faqat inson tasdig'i bilan §85-86).
-- ⛔ GATED edi — egasi 2026-06-26 ochiq direktiva bilan tasdiqladi.
--    HOZIR tasdiq-belgisi YO'Q (ataylab) — check-unauthorized-migration WARN beradi.
--    Egasi ruxsat berganda tasdiq izohini qo'shing (so'z: APPROVED + ":" + owner + sana).
--    Sabab gated: AI qoidabuzarlik/blok qarorlari real ishlashi uchun AI-kalit +
--    egasi qarori kerak (Q-35 DDL darvozasi, Q-40 fabrikatsiya taqiq).
-- Manba: docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md §QADAM 3,6.
-- Idempotent (CREATE TABLE/INDEX IF NOT EXISTS).
-- JONLI HOLAT (2026-06-26 probe): barcha quyidagi jadvallar DB da YO'Q (yangi).
--
-- ⚠️ FALSAFA (OCHIQ-JAVOBLAR §85-86 global printsip):
--    AI KUZATADI / TAKLIF QILADI — salbiy ta'sir (jarima/blok/razryad tushishi)
--    FAQAT INSON (manager/HR) TASDIG'I bilan kuchga kiradi. AI avtomatik
--    SALBIY ta'sir QILMAYDI — faqat pending taklif yozadi.
-- ============================================================

-- ⚠️ AI violation TAKLIF qiladi (status='pending_review' default).
-- Salbiy ta'sir faqat 'confirmed' statusida (manager/HR tasdiqlaydi).
CREATE TABLE IF NOT EXISTS ai_violations (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL,   -- logical ref employees.id
  violation_type  TEXT NOT NULL CHECK (violation_type IN ('attendance','quality','behavior','fraud','safety')),
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  description     TEXT NOT NULL,
  evidence        JSONB,
  ai_confidence   NUMERIC(5,2),
  -- DEFAULT 'pending_review': inson tasdig'isiz salbiy ta'sir YO'Q
  status          TEXT NOT NULL DEFAULT 'pending_review'
                    CHECK (status IN ('pending_review','confirmed','resolved','dismissed')),
  confirmed_by    INTEGER,    -- manager/HR user_id tasdiqladi
  confirmed_at    TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  resolved_by     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_violations_employee
  ON ai_violations(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_violations_severity
  ON ai_violations(severity, created_at DESC);

-- ⚠️ AI blok TAKLIF qiladi, inson TASDIQLAYDI.
-- is_active = FALSE (pending) default; manager/HR tasdiqlaganda TRUE ga o'tadi.
CREATE TABLE IF NOT EXISTS ai_block_log (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL,
  block_type    TEXT NOT NULL CHECK (block_type IN ('salary','system_access','order_approval','exit','login')),
  reason        TEXT NOT NULL,
  proposed_by   TEXT NOT NULL,   -- har doim 'ai_auto'; kuchga kirishi uchun inson kerak
  -- DEFAULT FALSE: inson tasdig'isiz blok kuchga KIRMAYDI (§85-86)
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by   INTEGER,         -- manager/HR user_id tasdiqladi
  approved_at   TIMESTAMPTZ,     -- qachon tasdiqlandi
  unblocked_at  TIMESTAMPTZ,
  unblocked_by  INTEGER,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_block_log_employee_active
  ON ai_block_log(employee_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_camera_cross_check (
  id                SERIAL PRIMARY KEY,
  employee_id       INTEGER NOT NULL,
  shift_id          INTEGER,
  expected_location TEXT,
  detected_location TEXT,
  match_score       NUMERIC(5,2),
  anomaly_detected  BOOLEAN NOT NULL DEFAULT FALSE,
  camera_source     TEXT,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_burnout_assessments (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  risk_level     TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  risk_score     NUMERIC(5,2) NOT NULL,
  factors        JSONB,
  recommendation TEXT,
  assessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_fraud_alerts (
  id           SERIAL PRIMARY KEY,
  entity_type  TEXT NOT NULL,
  entity_id    INTEGER NOT NULL,
  alert_type   TEXT NOT NULL,
  severity     TEXT NOT NULL,
  description  TEXT NOT NULL,
  evidence     JSONB,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  resolved_by  INTEGER,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
