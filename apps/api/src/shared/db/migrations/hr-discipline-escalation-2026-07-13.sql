-- APPROVED: owner directive 2026-07-13 (Muslimbek, chat) -- HR Nazorat 4-page fix (Intizom).
--
-- Context: discipline_records already has a real severity classifier + _applyLatenessPenalty
-- fine calc (late-arrival.service.ts) -- NOT rewritten here. Missing per vision:
--   (a) reprimands auto soft-archive after 6 months, with repeat violations counted
--       cumulatively (not reset by archival);
--   (b) escalation follows verbal -> written -> fine -> dismissal stages.
--
-- Both are wired via apps/api/src/modules/hr/attendance/discipline-escalation.helper.ts
-- (computeDisciplineEscalation, called from every discipline_records insert path) and
-- apps/api/src/cron/discipline.cron.ts (expireOldRecords, unchanged 01:00 daily cadence).
--
-- Thresholds are business_settings-driven (Q-40 -- never hardcoded in chat). Defaults below
-- reuse the 3/5/8 figures already live as DISCIPLINE_LATE_WARNING_THRESHOLD /
-- DISCIPLINE_LATE_REPRIMAND_THRESHOLD / DISCIPLINE_LATE_DISCHARGE_THRESHOLD
-- (apps/api/src/common/constants/business.constants.ts, flagged in
-- project_magic_numbers_verify_2026_07_07.md), generalised here from "late arrivals per
-- calendar month" to "any discipline_records violation within a rolling window" (cumulative
-- count reuses the previously-dormant violation_count_this_category column; the equally
-- dormant is_first_warning/is_second_warning/is_final_warning booleans are now also stamped).
--
-- Human-readable mirror of the entries appended to SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the actual boot-time loader --
-- this file is documentation only, re-run is idempotent via IF NOT EXISTS / ON CONFLICT).

ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS escalation_stage VARCHAR(20) DEFAULT 'verbal';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discipline_records_escalation_stage_chk'
  ) THEN
    ALTER TABLE discipline_records ADD CONSTRAINT discipline_records_escalation_stage_chk
      CHECK (escalation_stage IS NULL OR escalation_stage IN ('verbal','written','fine','dismissal'));
  END IF;
END $$;

-- NOTE: value_type must be one of business_settings_value_type_chk's allowed values
-- (number|percent|days|minutes|amount|text|boolean) -- 'months' is NOT in that list
-- (business-settings-2026-07-11.sql) and silently failed every boot until fixed
-- 2026-07-13; 'number' + unit='oy' carries the same meaning.
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('hr', 'hr.discipline_archive_after_months', 'Intizom: ogohlantirish arxiv muddati (oy)', 'number', 6, 'oy', 1, 60,
  'discipline_records.discipline_type = ''reprimand'' bo''lgan yozuvlar shu oy sonidan (issued_date bo''yicha) o''tgach discipline.cron.ts orqali avtomatik soft-arxivlanadi (is_archived=true) -- o''chirilmaydi, faqat faol Intizom ro''yxatidan yashiriladi, kumulyativ hisobga ta''sir qilmaydi. Default=6 oy, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('hr', 'hr.discipline_escalation_window_months', 'Intizom: eskalatsiya oyna muddati (oy)', 'number', 12, 'oy', 1, 60,
  'Xodimning intizom eskalatsiya bosqichi (verbal/written/fine/dismissal) shu oy oynasi ichidagi qoidabuzarliklar soni bo''yicha hisoblanadi. Default=12 oy, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('hr', 'hr.discipline_written_threshold', 'Intizom: yozma ogohlantirish bosqichi (dona)', 'number', 3, 'ta', 1, NULL,
  'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''written''ga o''tadi. Default=3, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('hr', 'hr.discipline_fine_threshold', 'Intizom: jarima bosqichi (dona)', 'number', 5, 'ta', 1, NULL,
  'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''fine''ga o''tadi. Default=5, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('hr', 'hr.discipline_dismissal_threshold', 'Intizom: ishdan bo''shatish bosqichi (dona)', 'number', 8, 'ta', 1, NULL,
  'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''dismissal''ga o''tadi. Default=8, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;
