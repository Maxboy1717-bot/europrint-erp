-- Migration: alert-thresholds-2026-08-03.sql
-- Sabab: NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md #1.3/#6 (P0-4, vizyon
-- Item 19/57) -- "per-modul alert-chegara CRUD" jadval jonli bazada mavjud emas edi
-- (to_regclass('alert_thresholds') = NULL, shu tahlilda tasdiqlangan). Owner qoidasi
-- (business_settings-style CRUD-with-defaults): chegara raqami hech qachon chatda
-- so'ralmaydi -- har alert_type uchun BITTA sozlanadigan DEFAULT qator bilan
-- ta'minlanadi, egasi keyin CRUD orqali o'zgartiradi. alert_type qiymatlari
-- notification_routing_rules.event_type (notification-routing-rules-2026-07-01.sql)
-- lug'atiga mos -- bir xil hodisa-turi kodlari ikkala jadvalda ham ishlatiladi.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + seed faqat mavjud bo''lmagan alert_type
-- uchun (qayta ishga tushirilsa xato bermaydi, qator ikkilanmaydi).
--
-- APPROVED: owner 2026-08-03 (autonomous vision-gap-closure mandate -- memory
-- feedback_manager_drive_to_vision.md: "go to vision non-stop, I make
-- flag-decisions" -- table+columns fully specified by the already-approved
-- NOTIFICATIONS vision spec, not a novel invention).

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id              SERIAL PRIMARY KEY,
  alert_type      TEXT NOT NULL UNIQUE,
  threshold_value NUMERIC NOT NULL,
  unit            VARCHAR(20) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_type ON alert_thresholds (alert_type) WHERE is_active = TRUE;

-- Boshlang''ich (default) qatorlar -- egasi keyin FE/CRUD orqali o''zgartira oladi.
INSERT INTO alert_thresholds (alert_type, threshold_value, unit, description)
SELECT v.alert_type, v.threshold_value, v.unit, v.description
FROM (VALUES
  ('wms.low_stock',       20::numeric, 'percent', 'Ombor qoldig''i reorder nuqtaning shu foizidan pastga tushsa ogohlantirish (DEFAULT -- CRUD orqali sozlanadi).'),
  ('qc.failed',           5::numeric,  'percent', 'Brak/rad foizi shu chegaradan oshsa eskalatsiya (DEFAULT -- CRUD orqali sozlanadi).'),
  ('mro.machine_stopped', 30::numeric, 'minutes', 'Uskuna to''xtash davomiyligi shu daqiqadan oshsa ogohlantirish (DEFAULT -- CRUD orqali sozlanadi).'),
  ('wms.lot_expiring',    7::numeric,  'days',    'Partiya/lot muddati tugashiga shu kun qolganda ogohlantirish (DEFAULT -- CRUD orqali sozlanadi).')
) AS v(alert_type, threshold_value, unit, description)
WHERE NOT EXISTS (
  SELECT 1 FROM alert_thresholds a WHERE a.alert_type = v.alert_type
);
