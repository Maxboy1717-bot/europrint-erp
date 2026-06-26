-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql
-- P36 AI CKP + Fit schema migration (ckp/fit slice).
-- ⛔ GATED — egasi (owner) tasdiqlamaguncha ISHGA TUSHIRILMAYDI.
--    HOZIR tasdiq-belgisi YO'Q (ataylab) — check-unauthorized-migration WARN beradi.
--    Egasi ruxsat berganda shu qatorga tasdiq izohini qo'shing (so'z: APPROVED + ":"
--    + owner + sana) — shundan keyingina migration ishga tushiriladi.
--    Sabab gated: AI ckp/fit servislari real ishlashi uchun AI-kalit + egasi
--    qarori kerak (Q-35 DDL darvozasi, Q-40 fabrikatsiya taqiq). Struktura/skelet
--    shu yerda — soxta data YO'Q.
-- Manba: docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md §QADAM 1-2,6.
-- Idempotent (CREATE TABLE/INDEX IF NOT EXISTS — qайта ishga tushsa zararsiz).
-- JONLI HOLAT (2026-06-26 probe): ai_ckp_scores/ai_ckp_chat_logs/ai_fit_scores
--    allaqachon mavjud (ai-p36-fit-ckp-slice-2026-06-21.sql orqali) — bu fayl
--    ularni IF NOT EXISTS bilan takrorlaydi (no-op) + ai_ckp_config yangi qo'shadi.
-- No FK to employees/org_functions (cross-module integrity in logic per ADR;
--    employee_id → employees.id, card_id → org_functions.id — logical refs).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_ckp_scores (
  id               SERIAL PRIMARY KEY,
  employee_id      INTEGER NOT NULL,   -- HR modul tomonidan o'qiladi: maosh darvozasi
  score_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ckp_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  attendance_score NUMERIC(5,2) DEFAULT 0,
  quality_score    NUMERIC(5,2) DEFAULT 0,
  plan_score       NUMERIC(5,2) DEFAULT 0,
  time_score       NUMERIC(5,2) DEFAULT 0,
  ai_explanation   TEXT,
  salary_gate_pass BOOLEAN NOT NULL DEFAULT FALSE,
  raw_metrics      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ckp_scores_employee_date
  ON ai_ckp_scores(employee_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_ckp_scores_salary_gate
  ON ai_ckp_scores(salary_gate_pass, score_date DESC);

CREATE TABLE IF NOT EXISTS ai_ckp_chat_logs (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ckp_chat_session
  ON ai_ckp_chat_logs(session_id, created_at);

CREATE TABLE IF NOT EXISTS ai_fit_scores (
  id                    SERIAL PRIMARY KEY,
  employee_id           INTEGER NOT NULL,   -- logical ref employees.id
  card_id               INTEGER NOT NULL,   -- logical ref org_functions.id
  fit_score             NUMERIC(5,2) NOT NULL,
  fit_report            JSONB,
  bonus_recommendation  NUMERIC(10,2),
  succession_candidate  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_provider           TEXT,
  evaluated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_employee
  ON ai_fit_scores(employee_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_card
  ON ai_fit_scores(card_id, fit_score DESC);

-- ── CKP konfiguratsiya jadvali (Q65: vaznlar master-data, kod konstantasi emas) ──
-- Vaznlar/chegaralar EGASI UI orqali kiritadi (kod ixtiro qilmaydi).
CREATE TABLE IF NOT EXISTS ai_ckp_config (
  id            SERIAL PRIMARY KEY,
  config_key    VARCHAR(100) NOT NULL UNIQUE,
  config_value  NUMERIC(10,4) NOT NULL,
  description   TEXT,
  updated_at    TIMESTAMP DEFAULT NOW(),
  updated_by_id INTEGER
);

-- ⚠️ SEED QIYMATLARI: EGASI QIYMATI KERAK (Q-40 fabrikatsiya taqiq).
-- Quyidagi INSERT IZOHDA — egasi /settings/ai-ckp-config ekranida kiritadi.
-- Q42 vaznlar (ЦКП=40 / sifat=30 / muddat=20 / boshqa=10) MISOL, egasi tasdiqlaydi:
-- INSERT INTO ai_ckp_config (config_key, config_value, description) VALUES
--   ('ckp_pass_threshold', 60,   'CKP o''tish chegarasi (0-100). EGASI TASDIQLAYDI.'),
--   ('weight_attendance',  0.30, 'Ishtirok og''irligi. EGASI TASDIQLAYDI.'),
--   ('weight_quality',     0.30, 'Sifat og''irligi.   EGASI TASDIQLAYDI.'),
--   ('weight_plan',        0.25, 'Reja og''irligi.    EGASI TASDIQLAYDI.'),
--   ('weight_time',        0.15, 'Vaqt og''irligi.    EGASI TASDIQLAYDI.')
-- ON CONFLICT (config_key) DO NOTHING;
