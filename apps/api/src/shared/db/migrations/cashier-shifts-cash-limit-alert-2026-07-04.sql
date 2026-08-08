-- APPROVED: Phase-2 topilma SB0815/SB0829 (EP-FIN-072 — "kassa limiti + oshsa inkassatsiya
-- eslatmasi CRON", docs/audit/decisions/03-finance.md:517) — Moliya/GL/kassa soha (kod 20).
-- Additive ALTER TABLE ADD COLUMN — Q-35 ruxsat doirasida (yangi CREATE TABLE YO'Q). Idempotent.
-- cashier-shifts-pdf-data-2026-07-02.sql'dagi pdf_generated_at bilan BIR XIL naqsh: cron
-- idempotency guard ustuni (bir smena kuniga faqat bitta naqd-limit eslatmasi oladi).

ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS limit_alert_sent_at TIMESTAMP;

COMMENT ON COLUMN cashier_shifts.limit_alert_sent_at IS
  'Oxirgi naqd-limit (EP-FIN-072) inkassatsiya-eslatma yuborilgan vaqt — CashierCashLimitAlertCron idempotency guard (kuniga bitta eslatma)';
