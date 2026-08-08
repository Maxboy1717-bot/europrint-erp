-- dir-diary-chronic-escalation-2026-08-05.sql
-- APPROVED: vision-given default, no owner decision required (Q-35 n/a — see rationale).
-- Vizyon: vision-1000-answers/05-director.md #7 — "3 kun ketma-ket 'hal qilinmadi' ->
-- 'surunkali muammo' kategoriyasiga tushadi va direktor + sababchi bo'lim rahbariga
-- eskalatsiya boradi; chegara dir_chronic_days master-data'da sozlanadi (default=3)".
-- Independently pre-scoped in docs/audit/_SCHEMA-BUILD-QUEUE-2026-07-11.md
-- ("05-director #7": ALTER TABLE diary_entries ADD COLUMN dir_chronic_days integer DEFAULT 0).
--
-- Human-readable mirror only. The actual boot-time DDL/seed lives in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS).

ALTER TABLE IF EXISTS diary_entries ADD COLUMN IF NOT EXISTS dir_chronic_days INTEGER NOT NULL DEFAULT 0;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('director', 'director.diary_chronic_threshold_days',
  'Surunkali muammo eskalatsiya chegarasi (kun)', 'days', 3, 'kun', 1, 30,
  'diary_entries.main_issue shu kunlar soni ketma-ket carry-over qilinsa "surunkali muammo" deb belgilanadi va direktor + author_card_id ning org_functions.manager_id zanjiridagi yuqori kartaga eskalatsiya-bildirishnoma yuboriladi. Default=3 - vision-1000-answers/05-director.md#7.', true)
ON CONFLICT (setting_key) DO NOTHING;
