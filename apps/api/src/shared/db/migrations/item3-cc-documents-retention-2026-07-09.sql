-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 5 Item 3 (CC arxiv-saqlash muddati, EP-CC-016).
--   Q73: tasdiqlangan hujjat immutable, o'chmaydi — faqat arxivga ko'chadi; saqlash muddati lavozimga qarab:
--     RAHBAR (leader — kengash/direktor/menejer roli) 10 yil, ISHCHI (worker) 3 yil.
--   cc_documents ga saqlash-sinfi (retention_class) va saqlash-muddati (retention_until) qo'shiladi.
--
-- FAQAT ADD COLUMN: yangi jadval yo'q, destructive amal yo'q (mavjud 2 qatorda NULL — arxivlashda to'ladi).
-- IF NOT EXISTS idempotent. Sana `retention_until` = arxivlangan sana + (10 yoki 3 yil), servisda hisoblanadi.

ALTER TABLE cc_documents ADD COLUMN IF NOT EXISTS retention_class varchar(20);
ALTER TABLE cc_documents ADD COLUMN IF NOT EXISTS retention_until date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'cc_documents'::regclass
      AND conname = 'chk_cc_documents_retention_class'
  ) THEN
    ALTER TABLE cc_documents ADD CONSTRAINT chk_cc_documents_retention_class
      CHECK (retention_class IS NULL OR retention_class IN ('leader', 'worker'));
  END IF;
END $$;
