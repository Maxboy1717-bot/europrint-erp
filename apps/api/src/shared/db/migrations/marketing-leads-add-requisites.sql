-- ===========================================================================
-- Migration: marketing-leads-add-requisites.sql                  (2026-07-11)
-- APPROVED: owner qaror docs/audit/QARORLAR-JURNALI-2026-07-11.md:62 —
--   "14-mkt #14-96 | SD'ga o'tish majburiy → STIR + shartnoma + manzil"
--   (vision EP-MKT-118, TASDIQ-2146 §14 #96, VISION-QUESTIONS-V2-2026-06-08.md:10468 variant A).
-- ===========================================================================
-- Sabab (problem): marketing_leads jadvalida STIR (soliq raqami), shartnoma
--   raqami va manzil ustunlari umuman yo'q edi — Marketing→CRM konversiya
--   darvozasi (convertLeadToCrm, marketing-analytics-stubs.controller.ts)
--   bu rekvizitlarni tekshira olmasdi, chunki tekshiradigan ustun mavjud emas
--   (node _audit/q.cjs bilan tasdiqlangan — information_schema.columns bo'sh).
--
-- Nomlash: `stir` (sd_customers.stir/crm_companies.stir bilan bir xil),
--   `contract_number varchar(100)` (goods_receipts.contract_number/
--   pos_inventory_passport.contract_number bilan bir xil kenglik), `address text`
--   (sd_customers.address bilan bir xil) — loyihada mavjud konvensiyalar qayta
--   ishlatildi, yangi nom o'ylab topilmadi.
--
-- Additive-only: 3 ta yangi NULLABLE ustun, mavjud ustun o'chirilmaydi/
-- o'zgartirilmaydi. IDEMPOTENT (IF NOT EXISTS) — qayta ishga tushirish xavfsiz.

ALTER TABLE marketing_leads
  ADD COLUMN IF NOT EXISTS stir             varchar(20),
  ADD COLUMN IF NOT EXISTS contract_number  varchar(100),
  ADD COLUMN IF NOT EXISTS address          text;

-- Tekshiruv:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name='marketing_leads' AND column_name IN ('stir','contract_number','address');
