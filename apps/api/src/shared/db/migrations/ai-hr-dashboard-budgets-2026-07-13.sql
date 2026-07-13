-- HR AI Dashboard: per-provider budgets/limits business_settings seed (2026-07-13).
--
-- Context: artifacts/erp-dashboard/src/pages/HRAIDashboard.tsx ("AI HR Dashboard" page,
-- distinct from the plain HR Dashboard) shows a "Provayderlar va byudjet" panel (monthly
-- $ budget + daily request limit per AI provider: openai/gemini/claude) backed by
-- GET /api/ai-hr/providers and GET /api/ai-hr/usage/budget
-- (apps/api/src/modules/ai/presentation/ai-hr-new.controller.ts). Both read
-- AiHrNewService.buildProviderBudgets(), which used to be a static PROVIDER_BUDGETS
-- array built from apps/api/src/common/constants/app.constants.ts. Two of the three
-- "dailyRequestLimit" numbers were unrelated constants reused by numeric coincidence:
-- MAX_EXPORT_LIMIT (an export row-count cap used by WMS controllers) was reused as
-- OpenAI's daily AI-request limit, and AI_SHORT_MAX_TOKENS (a per-call token cap used by
-- CRM/finance AI services) was reused as Claude's daily AI-request limit. Q-12/Q-40:
-- no hardcoded business threshold — every number is now read via
-- getBusinessSettingNumber(key, fallback), same pattern as ai.forecast_min_orders
-- (demand-forecast.service.ts) and rush_order_* (rush-orders.service.ts). The 7th key,
-- ai.hr_dashboard_task_max_tokens, replaces a bare `maxTokens: 800` literal in
-- AiHrNewService.submitTask() (the ad-hoc "Run AI task" panel).
--
-- Defaults below are IDENTICAL to the previous hardcoded values, so today's displayed
-- numbers do not change until the owner tunes them via the Business Settings CRUD screen
-- (Q-40 — never hardcoded/asked in chat).
--
-- Additive-only: existing business_settings rows/table untouched; ON CONFLICT DO NOTHING.
-- Human-readable mirror of the entries appended to SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the actual boot-time loader --
-- this file is documentation only).

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_budget_openai_monthly', 'AI HR Dashboard - OpenAI oylik byudjet', 'number', 100, 'USD', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - OpenAI uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=100, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_budget_gemini_monthly', 'AI HR Dashboard - Gemini oylik byudjet', 'number', 50, 'USD', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - Gemini uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=50, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_budget_claude_monthly', 'AI HR Dashboard - Claude oylik byudjet', 'number', 80, 'USD', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - Claude uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=80, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_daily_limit_openai', 'AI HR Dashboard - OpenAI kunlik so''rov chegarasi', 'number', 1000, 'so''rov/kun', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - OpenAI uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=1000, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_daily_limit_gemini', 'AI HR Dashboard - Gemini kunlik so''rov chegarasi', 'number', 2000, 'so''rov/kun', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - Gemini uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=2000, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_daily_limit_claude', 'AI HR Dashboard - Claude kunlik so''rov chegarasi', 'number', 500, 'so''rov/kun', 0, NULL,
    'AI HR Dashboard (Provayderlar va byudjet paneli) - Claude uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=500, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.hr_dashboard_task_max_tokens', 'AI HR Dashboard - vazifa AI javobi token chegarasi', 'number', 800, 'token', 1, NULL,
    'AiHrNewService.submitTask() (AI HR Dashboard "AI vazifani ishga tushirish" paneli) har bir ad-hoc AI chaqiruvi uchun max_tokens chegarasi. Placeholder default=800, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;
