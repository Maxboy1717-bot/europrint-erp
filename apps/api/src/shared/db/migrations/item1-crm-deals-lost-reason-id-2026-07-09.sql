-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 5 Item 1 (CRM lost-reason taxonomy).
--   OWNER-QUEUE Part2 #4 (finding #31, SB0655/0663/0675). Strukturaviy yo'qotish-sababi FK
--   (lost_reason_id -> crm_loss_reasons) qo'shiladi. ⚠️ crm_deals = VIEW; kanonik BAZAVIY jadval = `deals`.
--   Ustun BAZAVIY `deals` jadvaliga qo'shiladi (view o'zgartirilmaydi — u boshqa sessiya tomonidan
--   qayta yaratilmoqda). Yozuv/o'qish bazaviy `deals` jadvaliga to'g'ridan-to'g'ri boradi.
--   Erkin-matnli `deals.lost_reason` O'Z JOYIDA qoladi (qo'shimcha izoh); lost_reason_id = kanonik taksonomiya.
--
-- FAQAT ADD COLUMN: yangi jadval yo'q, destructive amal yo'q (mavjud qatorlarda NULL). IF NOT EXISTS idempotent.
-- FK crm_loss_reasons(id) — ON DELETE SET NULL (sabab o'chsa dealdagi havola tozalanadi, deal qolmaydi).

ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'deals'::regclass
      AND conname = 'fk_deals_lost_reason'
  ) THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_lost_reason
      FOREIGN KEY (lost_reason_id) REFERENCES crm_loss_reasons(id) ON DELETE SET NULL;
  END IF;
END $$;
