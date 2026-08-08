-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Kanban — TT (topshiriq/task) tur-governance + CC-parity 24h SLA.
--
-- Owner decision (2026-07-13 chat): TT majburiy-maydon + 24 soatlik eskalatsiya CC
-- (Communication Center) shablon qoidalariga mos kelishi kerak — CRUD-extensible, CC'ning
-- haqiqiy 24h SLA mexanizmini (cc_document_templates.inbox_sla_hours, cc-sla.cron.ts
-- markInboxOverdue() — 30-daqiqalik poll) qayta ishlatib, Kanban'ning hozirgi umumiy
-- KUNLIK-09:00 job'i (kanban-cron.processor.ts OVERDUE_ESCALATION, due_date-asosli)
-- o'rniga emas — QO'SHIMCHA (Q-46, mavjud xatti-harakat o'zgarmaydi).
--
-- kanban_cards.task_type — taxonomy_entries (category='kanban_task_type') kodiga soft-
-- reference (bu jadvaldagi related_type ustuni bilan bir xil FK'siz varchar konvensiyasi —
-- taxonomy_entries'ga HECH BIR jadval FK qilmaydi, 2026-07-13 tekshiruvda tasdiqlangan).
-- Egasi istalgan vaqt yangi TT turini mavjud generic Taksonomiya CRUD orqali qo'sha oladi
-- (TaxonomyRepository.create(), taxonomy-entries-2026-07-11.sql). operation_type kategoriyasi
-- ATAYLAB ishlatilmadi — u MES/ishlab-chiqarish operatsiyalari (bosma/kashirovka/kley/lak/
-- rezka/vysechka) uchun, TT vazifa-turi bilan semantik aloqasi yo'q.
--
-- kanban_cards.sla_hours — karta darajasidagi ixtiyoriy SLA override (soat). Job effektiv
-- SLA'ni ushbu zanjirdan hisoblaydi: (1) kanban_cards.sla_hours, (2)
-- taxonomy_entries.attrs->>'sla_hours' (tur darajasidagi standart), (3) business_settings
-- 'kanban.tt_task_sla_hours_default' (global default — Q-40, hech qanday raqam kodga
-- hardcode qilinmaydi; CC inbox_sla_hours bilan bir xil boshlang'ich qiymat 24).
--
-- Ikkalasi ham additive/nullable — mavjud kartalar (task_type=NULL) yangi TT_SLA_ESCALATION
-- job query'siga kirmaydi; joriy due_date-asosidagi kunlik OVERDUE_ESCALATION O'ZGARMAYDI.
--
-- C9 note (2026-07-13): kanban's cron infra migrated to BullMQ same day — this SLA job is
-- registered as a 3rd repeatable job (TT_SLA_ESCALATION, every 30 min) in the same
-- kanban-cron.processor.ts, not a standalone @Cron file.
ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS task_type VARCHAR(60);
ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS sla_hours NUMERIC(6,2);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kanban_cards_sla_hours_chk'
  ) THEN
    ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_sla_hours_chk CHECK (sla_hours IS NULL OR sla_hours > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kanban_cards_task_type ON kanban_cards (task_type) WHERE task_type IS NOT NULL;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description)
  SELECT 'kanban', 'kanban.tt_task_sla_hours_default', 'TT vazifa standart SLA (soat)', 'number', 24, 'soat', 1, 168,
    'Owner 2026-07-13 (chat): TT/task karta uchun standart eskalatsiya SLA (soat) - CC cc_document_templates.inbox_sla_hours (24) bilan bir xil boshlang''ich qiymat. Karta darajasida (kanban_cards.sla_hours) yoki tur darajasida (taxonomy_entries.attrs->>''sla_hours'', category=''kanban_task_type'') override qilinishi mumkin; hech biri bo''lmasa shu global default ishlatiladi.'
  WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'kanban.tt_task_sla_hours_default');
