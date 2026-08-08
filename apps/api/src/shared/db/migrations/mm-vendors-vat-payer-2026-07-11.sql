-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35
-- MM-11 #11.44 -- "QQS to'lovchi" (VAT payer) bayrog'i mm_vendors uchun.
-- Ba'zi ta'minotchilar QQS to'lovchi emas (soddalashtirilgan/patent soliq tizimi) --
-- bu holatda xarid summasidan QQS ajratib bo'lmaydi (Finance QQS hisob-kitobida
-- keyinchalik ishlatiladi). Default TRUE -- mavjud vendor qatorlari QQS to'lovchi
-- deb hisoblanadi (umumiy soliq tizimi bo'yicha standart holat, regressiyasiz);
-- egasi keyinchalik har bir vendor uchun aniqlashtiradi.
--
-- ⚠️ TUZATISH (drafted spec live-DB'da xato taxmin qilgan): `mm_vendors` BAZA JADVAL
-- EMAS -- u `vendors` ustidan oddiy VIEW (pg_get_viewdef bilan tasdiqlandi, 2026-07-11).
-- Shuning uchun ustun asl `vendors` jadvaliga qo'shiladi, so'ng view is_vat_payer'ni
-- ko'rsatishi uchun CREATE OR REPLACE VIEW bilan qayta e'lon qilinadi (bir xil ustun
-- ro'yxati + yangi ustun, mavjud ustunlar o'chirilmaydi/qayta nomlanmaydi -- Q-39).
--
-- FAQAT QO'SHISH: mavjud ustun o'zgartirilmaydi/o'chirilmaydi. Qayta ishga
-- tushirish xavfsiz (IF NOT EXISTS / CREATE OR REPLACE VIEW).
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_vat_payer boolean NOT NULL DEFAULT true;

CREATE OR REPLACE VIEW mm_vendors AS
SELECT
  id,
  vendor_code,
  name,
  name_ru,
  address,
  phone,
  email,
  tax_id,
  payment_terms,
  currency,
  is_active,
  created_at,
  deleted_at,
  tin,
  rating,
  code,
  contact_person,
  is_vat_payer
FROM vendors;
