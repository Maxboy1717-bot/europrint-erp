-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda"
-- wms-mro-settings-tables.sql — Ombor(WMS) va MRO modullariga SD/Marketing/QC
-- patternidagi generic key-value sozlama infratuzilmasini qo'shadi (additive, idempotent).
-- Naqsh manbasi: marketing_settings (lib/db/src/schema/marketing-schema.ts:552).

CREATE TABLE IF NOT EXISTS wms_settings (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  category    VARCHAR(100) DEFAULT 'general',
  description TEXT,
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mro_settings (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  category    VARCHAR(100) DEFAULT 'general',
  description TEXT,
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_settings_category ON wms_settings (category);
CREATE INDEX IF NOT EXISTS idx_mro_settings_category ON mro_settings (category);

-- Boshlang'ich sozlamalar (idempotent seed) — WMS
INSERT INTO wms_settings (key, value, category, description) VALUES
  ('low_stock_threshold_pct', '10', 'inventory', 'Kam qoldiq ogohlantirish chegarasi (%)'),
  ('default_reorder_lead_days', '7', 'inventory', 'Standart qayta buyurtma yetkazib berish muddati (kun)'),
  ('auto_reorder_enabled', 'false', 'inventory', 'Avtomatik qayta buyurtma yoqilganmi')
ON CONFLICT (key) DO NOTHING;

-- Boshlang'ich sozlamalar (idempotent seed) — MRO
INSERT INTO mro_settings (key, value, category, description) VALUES
  ('pm_reminder_days_before', '3', 'maintenance', 'Profilaktik texnik xizmat eslatmasi (necha kun oldin)'),
  ('canteen_default_portion_cost', '0', 'canteen', 'Oshxona standart porsiya narxi'),
  ('cleaning_schedule_default_interval_days', '7', 'cleaning', 'Tozalash jadvali standart intervali (kun)')
ON CONFLICT (key) DO NOTHING;
