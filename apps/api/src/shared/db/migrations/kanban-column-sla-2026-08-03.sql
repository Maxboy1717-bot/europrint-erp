-- Migration: kanban-column-sla-2026-08-03.sql
-- Sabab: NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md #1.3/#6 (P0-4, vizyon
-- Item 19 "har status/ustun uchun alohida SLA") -- `kanban_column_sla` jonli bazada
-- mavjud emas edi (to_regclass('kanban_column_sla') = NULL, shu tahlilda tasdiqlangan).
-- Har mavjud kanban_columns qatoriga BITTA default SLA qatori: sla_hours=24 (schema-
-- kanban.ts kanbanCards.sla_hours izohidagi business_settings
-- 'kanban.tt_task_sla_hours_default' default qiymati bilan bir xil),
-- warning_threshold_pct=80. Egasi keyin har ustun uchun CRUD orqali o''zgartiradi.
-- Bu migratsiya faqat sxema+default qator qo''shadi -- SLA-buzilish cron/alert
-- ulanishi shu o''zgarish doirasidan tashqarida.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + seed faqat mavjud bo''lmagan column_id
-- uchun (qayta ishga tushirilsa xato bermaydi, qator ikkilanmaydi).
--
-- APPROVED: owner 2026-08-03 (autonomous vision-gap-closure mandate -- memory
-- feedback_manager_drive_to_vision.md: "go to vision non-stop, I make
-- flag-decisions" -- table+columns fully specified by the already-approved
-- NOTIFICATIONS vision spec, not a novel invention).

CREATE TABLE IF NOT EXISTS kanban_column_sla (
  id                    SERIAL PRIMARY KEY,
  column_id             INTEGER NOT NULL UNIQUE REFERENCES kanban_columns(id) ON DELETE CASCADE,
  sla_hours             NUMERIC(6,2) NOT NULL DEFAULT 24,
  warning_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 80,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_column_sla_column_id ON kanban_column_sla (column_id);

-- Boshlang''ich (default) qatorlar -- egasi keyin har ustun uchun CRUD orqali
-- o''zgartira oladi.
INSERT INTO kanban_column_sla (column_id, sla_hours, warning_threshold_pct)
SELECT kc.id, 24, 80
FROM kanban_columns kc
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_column_sla s WHERE s.column_id = kc.id
);
