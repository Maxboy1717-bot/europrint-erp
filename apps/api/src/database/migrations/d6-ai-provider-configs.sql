-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Migration: d6-ai-provider-configs
-- Maqsad: ai_provider_configs jadvali — AI provider konfiguratsiyasi boshqaruvi
-- (P35 — AI CentralAI infra + provider-config DDL)
--
-- MUHIM: haqiqiy api_key HECH QACHON bu jadvalda saqlanmaydi — faqat .env orqali
--   (OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY). api_key_hint = faqat
--   oxirgi 4 belgi (ko'rsatish uchun).

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id                 SERIAL PRIMARY KEY,
  provider           VARCHAR(50) NOT NULL UNIQUE,    -- 'openai' | 'gemini' | 'claude'
  api_key_hint       VARCHAR(20),                    -- So'nggi 4 belgi, ko'rsatish uchun (HAQIQIY KALIT EMAS)
  default_model      VARCHAR(100),
  daily_budget_usd   NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes              TEXT,
  updated_at         TIMESTAMP DEFAULT NOW(),
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE ai_provider_configs IS
  'AI provayder konfiguratsiyasi. api_key HECH QACHON bu jadvalda saqlanmaydi — faqat .env orqali.';

COMMENT ON COLUMN ai_provider_configs.api_key_hint IS
  'Faqat oxirgi 4 belgi (ko''rsatish uchun). Haqiqiy kalit .env da.';

-- Seed: 3 ta default yozuv (is_active=false — admin aktivlashtiradi)
INSERT INTO ai_provider_configs (provider, default_model, daily_budget_usd, is_active, notes)
VALUES
  ('openai', 'gpt-4o-mini',      50.00, false, 'gpt-4o-mini — OPENAI_API_KEY env orqali'),
  ('gemini', 'gemini-1.5-flash', 50.00, false, 'gemini-1.5-flash — GEMINI_API_KEY env orqali'),
  ('claude', 'claude-3-5-haiku-20241022', 50.00, false, 'claude-3-haiku — ANTHROPIC_API_KEY env orqali')
ON CONFLICT (provider) DO NOTHING;
