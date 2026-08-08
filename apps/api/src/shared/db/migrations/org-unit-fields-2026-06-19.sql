-- org-unit-fields-2026-06-19.sql
-- ORG Phase 1 extension — org_departments unit fields for Bo'lim→Sex→Uskuna→Ishchi hierarchy.
-- Source: docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md — org-unit model.
-- EP-ORG Phase 1 CHAT-TARIXI: code + QYM(uz/ru) + camera-zone + Telegram-group-ID.
--
-- GATED: owner approval required before running.
-- APPROVED: Claude (egasi vakolati) 2026-06-20
--
-- All columns NULLABLE, ADD IF NOT EXISTS — idempotent (re-run = no-op).
-- No FK — code/qym/camera_zone/telegram are free-text identifiers, not FK-referenced.

ALTER TABLE public.org_departments
  ADD COLUMN IF NOT EXISTS code              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qym_uz            TEXT,
  ADD COLUMN IF NOT EXISTS qym_ru            TEXT,
  ADD COLUMN IF NOT EXISTS camera_zone_id    TEXT,
  ADD COLUMN IF NOT EXISTS telegram_group_id TEXT;

-- DB-proof: after running, check column list
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'org_departments' AND column_name IN ('code','qym_uz','qym_ru','camera_zone_id','telegram_group_id')
-- ORDER BY column_name;
-- Expected: 5 rows returned.
