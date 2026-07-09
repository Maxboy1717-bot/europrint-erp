-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 5 Item 4 (PP navbat, EP-PP-085 "Очеред").
--   production_orders ga operator ko'radigan STANOK-ICHI navbat raqami (queue_sequence) qo'shish.
--   Real 25-04.xlsx "Очеред"/"Очеред2" — zavod operatorlari aynan navbat raqami (1,2,3...) bilan ishlaydi,
--   drag-drop bilan qayta tartiblanadi. Bu `priority` (past/normal/yuqori/shoshilinch) va `is_urgent`
--   (ZARUR) dan ALOHIDA — navbat = har stanok ichidagi qo'lda tartiblanadigan aniq o'rin.
--
-- FAQAT ADD COLUMN: yangi jadval yo'q, destructive amal yo'q. Nullable (mavjud 7 qatorda NULL qoladi —
--   navbatga qo'yilmagan buyurtma). IF NOT EXISTS bilan idempotent.

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS queue_sequence integer;

-- Bir stanok (work_center) ichida navbat raqami takrorlanmasin — qisman unique index
-- (faqat navbatga qo'yilgan, o'chirilmagan buyurtmalar uchun).
CREATE UNIQUE INDEX IF NOT EXISTS uq_production_orders_wc_queue_seq
  ON production_orders (work_center_id, queue_sequence)
  WHERE queue_sequence IS NOT NULL AND deleted_at IS NULL;
