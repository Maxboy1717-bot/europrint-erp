-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 09-qc #22 — Davriy ichki sifat auditi (qc_internal_audits), cron bilan choraklik reja.
--   Vizyon (vision-1000-answers/09-qc.md #22): davriy ichki sifat auditi QC modulida alohida
--   jadvalda saqlanadi (cron choraklik/yillik); Coordination kalendariga "sifat auditi" turi bilan
--   bog'lanadi (calendar_event_id) va topilmalar Coordination protokoliga bog'lanadi (protocol_id).
--
-- ADD-ONLY: yangi jadval, destructive amal yo'q. Idempotent (IF NOT EXISTS).
--   auditor_id / findings / calendar_event_id / protocol_id / completed_at NULL — runtime'da to'ladi
--   (egasi-data kerak emas; cron faqat 'scheduled' qatorini yaratadi). period = idempotentlik kaliti
--   (masalan '2026-Q3') — cron takror ishga tushsa dublikat yozmaydi (uq_qc_internal_audits_period).

CREATE TABLE IF NOT EXISTS qc_internal_audits (
  id                serial PRIMARY KEY,
  period            varchar(20) NOT NULL,
  scheduled_for     date NOT NULL,
  scope             varchar(50) NOT NULL DEFAULT 'full_quality_system',
  auditor_id        integer REFERENCES users(id) ON DELETE SET NULL,
  findings          jsonb,
  status            varchar(20) NOT NULL DEFAULT 'scheduled',
  calendar_event_id integer REFERENCES calendar_events(id) ON DELETE SET NULL,
  protocol_id       integer REFERENCES protocol(id) ON DELETE SET NULL,
  completed_at      timestamp,
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_internal_audits_period ON qc_internal_audits (period);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'qc_internal_audits'::regclass
      AND conname = 'chk_qc_internal_audits_status'
  ) THEN
    ALTER TABLE qc_internal_audits ADD CONSTRAINT chk_qc_internal_audits_status
      CHECK (status IN ('scheduled','in_progress','completed','cancelled'));
  END IF;
END $$;
