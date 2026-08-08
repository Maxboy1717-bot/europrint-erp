-- =============================================================================
-- T8-14 / P49: WMS yetkazib-beruvchi izlanuvchanligi (supplier traceability)
--   warehouse_stock ga: supplier_tin (STIR), photo_urls, per-qator weight, cert.
-- Vision: MUSLIMBEK-PROMT-08-WMS-2026-06-08.md (qabul akti — yetkazib-beruvchi STIR,
--   foto-dalil, og'irlik o'lchovi, sertifikat) — qabulda kim/qancha/sifat hujjati.
-- =============================================================================
-- ⚠️  GATED (Q-35 / P49 — egasi qarori): bu migratsiya YOZILDI, lekin BU YERDA
--     ISHGA TUSHIRILMAYDI. Faqat EGASI tasdiqlagandan keyin qo'llang.
--
--     P49 = egasi qarori, chunki supplier-traceability'ning KANONIK joyi munozarali:
--       - STIR + foto + waybill + shartnoma — qabul AKTI darajasi (GRN header):
--         JONLI jadval `goods_receipts` / `mm_goods_receipts` (yetkazib-beruvchi
--         bilan bir marta kiritiladi), va FE `createGrn({ supplierTin })` allaqachon
--         shu oqim orqali yuboradi (pos-monitor.api.ts:391).
--       - `warehouse_stock` = AGREGAT qoldiq (1 qator = 1 ombor × 1 material joriy
--         qoldig'i). U KO'P qabuldan to'planadi → bitta STIR/foto/og'irlik/sertifikat
--         qiymati semantik jihatdan qatorga to'g'ri kelmaydi (oxirgi qabulnimi?
--         o'rtachami?). Shu sabab bu ustunlar QO'LDA denormalizatsiya (oxirgi-qabul
--         oynasi/hisobot tezligi uchun) — yangi haqiqat manbai EMAS.
--
--     EGASI TASDIQLASHI KERAK (ownerDataNeeded):
--       1) supplier_tin/photo/weight/cert KANONIK joyi qaysi:
--          (a) faqat GRN (goods_receipts) darajasida qoladimi (bu fayl QO'LLANMAYDI), YOKI
--          (b) warehouse_stock ga ham denormalizatsiya qilinadimi (bu fayl QO'LLANADI).
--       2) Agar (b): `supplier_tin` semantikasi — OXIRGI qabul STIR'imi yoki
--          birlamchi/asosiy yetkazib-beruvchi'mi (qoldiq ko'p manbali bo'lsa).
--       3) `cert` formati — bitta sertifikat raqami (text) yoki ko'p hujjat (jsonb).
--       4) `weight` birligi — kg (etalon) yoki materialning o'z birligi (unit_of_measure).
-- -----------------------------------------------------------------------------
-- HOLAT: GATED — APPROVED izohi ATAYIN yo'q (egasi P49 qarorini bermaguncha
--        check-unauthorized-migration.mjs WARN beradi, bu KUTILGAN). QO'LLAMANG.
-- -----------------------------------------------------------------------------
-- Xavfsizlik: barcha ustun NULL-able + IF NOT EXISTS → DESTRUCTIVE EMAS
--             (mavjud 37 qator buzilmaydi, default qo'shilmaydi). Faqat egasi
--             "ha, warehouse_stock ga denormalizatsiya" deganda ishga tushiriladi.
-- -----------------------------------------------------------------------------

ALTER TABLE warehouse_stock
  -- Yetkazib-beruvchi STIR (soliq identifikatori). varchar(20) — sd_customers.stir,
  -- mm_raw_materials.tin bilan izchil (O'zbekiston STIR = 9 raqam, kelajakka 20 zaxira).
  ADD COLUMN IF NOT EXISTS supplier_tin varchar(20),

  -- Qabul foto-dalillari (rasm URL'lari). jsonb massiv: ["/storage/...","/storage/..."]
  -- (exit_logs.photo_path = bitta yo'l; bu yerda ko'p foto kerak → jsonb).
  ADD COLUMN IF NOT EXISTS photo_urls jsonb,

  -- Per-qator o'lchangan og'irlik (qabulda tarozida). numeric — qiymat-tabiatli
  -- (numericMoney-mos), birligi egasi tasdig'iga ko'ra (kg yoki material birligi).
  ADD COLUMN IF NOT EXISTS weight numeric,

  -- Sifat/muvofiqlik sertifikati (raqam yoki havola). text — egasi (3)-bandi jsonb
  -- desa, keyin TYPE o'zgartiriladi (hozircha eng kam taxminli = text).
  ADD COLUMN IF NOT EXISTS cert text;

-- Yetkazib-beruvchi bo'yicha qidiruv/hisobot uchun indeks (NULL qatorlarni o'tkazib).
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_supplier_tin
  ON warehouse_stock (supplier_tin)
  WHERE supplier_tin IS NOT NULL;
