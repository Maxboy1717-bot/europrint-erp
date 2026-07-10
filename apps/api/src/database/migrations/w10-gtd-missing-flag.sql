-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- =============================================================================
-- W10-GTD: Vision 10-warehouse#10 — GTD (bojxona yuk deklaratsiyasi) yo'q bo'lsa
--   ogohlantirish + bayroq (blok EMAS). Import qabulida GTD raqami kiritilmasa,
--   14 kundan keyin Klassifikatsiya + Moliyaga eskalatsiya (qabulni BLOKLAMAYDI).
--   Bugungacha goods_receipts'da faqat invoice_number bor edi, GTD/bojxona maydoni
--   YO'Q (verified: information_schema.columns + to_regclass = null gtd*).
-- Kanonik jadval: goods_receipts (relkind='r'); mm_goods_receipts = uning ustidan
--   VIEW (relkind='v') — shu sabab ustunlar BAZA jadvalga qo'shiladi, so'ng VIEW
--   qayta-yaratiladi (CREATE OR REPLACE faqat oxiriga ustun qo'shadi — xavfsiz).
-- Additive ALTER — barcha ustun NULL/DEFAULT/derived; mavjud qatorlar buzilmaydi
--   (yangi CREATE TABLE emas — Q-35 ruxsat doirasida).
-- =============================================================================

-- Bojxona deklaratsiyasi raqami (kiritilganda "yetishmovchilik" bayrog'i o'chadi)
-- va uni talab qilish muddati (import qabulida receipt_date + 14 kun qo'yiladi;
-- domashniy/ichki qabullar due_date OLMAYDI → hech qachon bayroqlanmaydi).
ALTER TABLE goods_receipts
  ADD COLUMN IF NOT EXISTS gtd_number   varchar(40),
  ADD COLUMN IF NOT EXISTS gtd_due_date date;

-- Sof derivatsiya: GTD talab qilingan (due_date qo'yilgan) LEKIN raqam yo'q.
-- STORED generated — qo'lda yozib bo'lmaydi (izchillik kafolati), indekslash mumkin.
ALTER TABLE goods_receipts
  ADD COLUMN IF NOT EXISTS gtd_missing boolean
    GENERATED ALWAYS AS (gtd_due_date IS NOT NULL AND gtd_number IS NULL) STORED;

-- Muddati o'tgan GTD-yetishmovchiliklarni tez topish (eskalatsiya cron) — qisman
-- indeks BAZA ustunlar predikati bilan (generated-ustun predikatidan qochish).
CREATE INDEX IF NOT EXISTS idx_goods_receipts_gtd_missing
  ON goods_receipts (gtd_due_date)
  WHERE gtd_due_date IS NOT NULL AND gtd_number IS NULL;

-- Kanonik READ-yuza (VIEW) ni yangi ustunlar bilan sinxronlash. CREATE OR REPLACE
-- avvalgi 21 ustunni AYNAN saqlab, oxiriga 3 ustun qo'shadi (Postgres qoidasi).
CREATE OR REPLACE VIEW mm_goods_receipts AS
  SELECT id, receipt_number, receipt_date, supplier_id, supplier_name, warehouse_id,
         purchase_order_id, status, total_items, total_value, qc_required_items,
         qc_passed_items, received_by, qc_by, notes, invoice_number, invoice_date,
         created_at, received_at, completed_by, completed_at,
         gtd_number, gtd_due_date, gtd_missing
  FROM goods_receipts;
