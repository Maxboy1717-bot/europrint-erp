-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
-- G5/A7 — Kassir kun-oxiri avto Z-report PDF saqlash joyi.
-- employee_monthly_cards.pdf_data (BYTEA) naqshiga o'xshash: PDF baytlari smena qatorining o'zida.
-- Additive ALTER TABLE ADD COLUMN — Q-35 ruxsat doirasida (yangi CREATE TABLE YO'Q). Idempotent.

ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS pdf_data BYTEA;
ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP;

COMMENT ON COLUMN cashier_shifts.pdf_data IS
  'Kunlik kassa Z-hisobot PDF (vizyon A7) — CashierDailyZReportCron har kun 20:00 Asia/Tashkent yozadi';
COMMENT ON COLUMN cashier_shifts.pdf_generated_at IS
  'Oxirgi avto-PDF generatsiya vaqti (cron idempotency guard)';
