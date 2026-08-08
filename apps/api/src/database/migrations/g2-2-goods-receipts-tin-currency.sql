-- =============================================================================
-- G2-2: goods_receipts (POS/WMS GRN header) — supplier_tin/currency/movement_id
--   ustunlari YO'Q edi → GoodsReceiptService.create({supplierTin, currency})
--   FE (WarehouseKirimWizard) dan kelgan qiymatlarni JIM tashlab yuborardi
--   (goods-receipt.repository.ts INSERT ro'yxatida yo'q edi, findAll doim
--   NULL/'UZS' qattiq-kod qaytarardi). SB0541 (P0, WMS/POS audit 2026-07-04).
-- APPROVED: additive ALTER, barcha ustun NULL-able/DEFAULT bilan — mavjud
--   qatorlar (goods_receipts, hozircha bo'sh test-muhitda) buzilmaydi;
--   yangi CREATE TABLE emas (Q-35 ruxsat doirasida).
-- Canonical joy: bu GRN HEADER darajasi (bitta qabul = bitta STIR/valyuta) —
--   T8-14 (warehouse_stock denormalizatsiya, aggregat qoldiq) bilan
--   ARALASHTIRILMAYDI, u hamon GATED/egasi-qaror kutmoqda (P49, alohida band).
-- =============================================================================

ALTER TABLE goods_receipts
  -- Yetkazib-beruvchi STIR — sd_customers.stir bilan bir xil tur (varchar).
  ADD COLUMN IF NOT EXISTS supplier_tin varchar(20),

  -- Valyuta (ISO 4217, 3 harf) — pos_movements.currency bilan izchil default.
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'UZS',

  -- Shartnoma raqami (waybill_number = mavjud invoice_number ustuniga mos keladi,
  -- lekin contract_number alohida — invoice != shartnoma).
  ADD COLUMN IF NOT EXISTS contract_number varchar(100),

  -- pos_movements bilan bog'lanish (GRN qaysi EXTERNAL_IN harakatdan yaratilgani).
  ADD COLUMN IF NOT EXISTS movement_id integer;

CREATE INDEX IF NOT EXISTS idx_goods_receipts_supplier_tin
  ON goods_receipts (supplier_tin)
  WHERE supplier_tin IS NOT NULL;
