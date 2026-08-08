-- Item #151 (CC audit tavsiya #24, docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md:291):
-- cc-sla.cron.ts remindOverdue48h() ichida INTERVAL '48 hours' va INTERVAL '24 hours'
-- hardcode edi — Q-40 (threshold qiymatlar chatda so'ralmaydi, business_settings'ga
-- default bilan CRUD orqali sozlanadi) bo'yicha cc.stale_draft_archive_days bilan bir
-- xil naqshda business_settings'ga ko'chirildi. Auto-reject YO'Q (20-cc#30, 2026-07-11
-- owner qarori hali kuchda) — faqat takroriy eslatma vaqt-chegarasi sozlanadigan bo'ldi.
-- Human-readable mirror of the entries appended to SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the actual boot-time loader —
-- this file is documentation only).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('cc', 'cc.overdue_reminder_threshold_hours', 'Kiruvchi savat: necha soatdan keyin takroriy eslatma boshlanadi', 'number', 48, 'soat', 1, 336,
  'cc-sla.cron.ts remindOverdue48h() — basket_entered_at dan shu soatdan ko''p vaqt o''tgan hujjatlarga takroriy eslatma yuborish boshlanadi (avto-rad etish YO''Q, 20-cc#30)', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('cc', 'cc.overdue_reminder_repeat_hours', 'Takroriy eslatma orasidagi minimal interval', 'number', 24, 'soat', 1, 168,
  'cc-sla.cron.ts remindOverdue48h() — overdue_reminder_sent_at gate: shu soatdan kam vaqt o''tgan bo''lsa qayta eslatma yuborilmaydi', true)
ON CONFLICT (setting_key) DO NOTHING;
