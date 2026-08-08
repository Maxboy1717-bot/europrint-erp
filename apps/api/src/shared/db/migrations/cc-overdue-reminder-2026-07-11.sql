-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 20-cc#30 — egasi qarori (2026-07-11 chat): 48-soatlik AVTO-RAD ETISH olib tashlandi
-- (bu hujjatni majburiy 'rejected' qilib qo'yardi — noto'g'ri xatti-harakat edi).
-- O'rniga: 24 soatda bir marta takroriy eslatma (HR/mas'ul + yuboruvchiga), hujjat holati
-- o'zgarmaydi. Bu ustun takroriy eslatmani 24 soatda BIR MARTA cheklash uchun.
ALTER TABLE cc_documents
  ADD COLUMN IF NOT EXISTS overdue_reminder_sent_at TIMESTAMPTZ;
COMMENT ON COLUMN cc_documents.overdue_reminder_sent_at IS
  '20-cc#30: 48h+ muddatidan oshgan hujjat uchun oxirgi takroriy-eslatma vaqti (24h gate, avto-rad emas).';
