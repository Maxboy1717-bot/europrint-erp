-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Owner decision 2026-07-13 (chat): CC template-level archive_after_days
-- (cc_document_templates, kun hisobida — 18 ta shablonda mavjud lekin qiymat
-- yo'q edi, hech qanday kod o'qimasdi) endi cc-sla.cron.ts (applyTemplateArchival)
-- tomonidan haqiqatan qo'llaniladi. Bundan tashqari yangi 90-kunlik "eskirgan
-- qoralama" (stale draft) arxiv qoidasi qo'shildi (archiveStaleDrafts). Q-40 —
-- 90-kunlik chegara chatda hardcode qilinmaydi, business_settings CRUD orqali
-- sozlanadigan (default 90). Human-readable mirror of the entry appended to
-- SCHEMA_MIGRATIONS in apps/api/src/shared/db/invariants/migrations-schema.ts
-- (the actual boot-time loader — this file is documentation only).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('cc', 'cc.stale_draft_archive_days', 'Eskirgan qoralama arxiv muddati (kun)', 'days', 90, 'kun', 1, NULL,
  'DRAFT holatda shu kundan ko''proq turgan (hech qachon yuborilmagan) CC hujjatlar cc-sla.cron.ts ning archiveStaleDrafts() joblari orqali avtomatik arxivlanadi (o''chirilmaydi, faqat archived_at o''rnatiladi, cc-retention.service.archiveWithRetention orqali). Owner 2026-07-13 (chat).', true)
ON CONFLICT (setting_key) DO NOTHING;
