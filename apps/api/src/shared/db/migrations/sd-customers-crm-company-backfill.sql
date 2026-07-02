-- ===========================================================================
-- Migration: sd-customers-crm-company-backfill.sql              (2026-07-02)
-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- ===========================================================================
-- Sabab (problem): OWNER QARORI — `sd_customers` mijoz-manba sifatida KANONIK.
--   `sd_customers.crm_company_id` (integer, application-level FK, drift-fix-04b
--   migratsiyasida qo'shilgan) 15/15 qatorda NULL edi — CRM (`crm_companies`)
--   va SD (`sd_customers`) o'rtasida REAL bog'lanish yo'q edi (ikki-dunyo).
--
-- Isbot (DDLdan OLDIN, _audit/q.cjs bilan tasdiqlangan):
--   • crm_companies = 4 qator (id 5,6,7,8); sd_customers = 15 qator, hammasi
--     crm_company_id IS NULL.
--   • crm_companies.inn / .stir hammasi NULL — INN bo'yicha mos kelish MUMKIN
--     EMAS; moslashtirish shahar+soha (industry)+manzil (street)+telefon
--     bo'yicha amalga oshirildi (nom bo'yicha aniq emas — quyida har juftlik
--     uchun dalil ko'rsatilgan):
--     - crm_companies.id=7 "UzPack Premium Qadoqlash" (Packaging, Namangan,
--       phone +998612009900)
--         ↔ sd_customers.id=15 "UzPack Qadoqlash OAJ" (Packaging, Namangan,
--            phone +998612009900 — AYNAN BIR XIL telefon, bir xil brend/shahar/soha)
--     - crm_companies.id=6 "Samarqand Digital Press MChJ" (Publishing,
--       Samarqand, "Registon ko'ch.")
--         ↔ sd_customers.id=14 "Samarqand Ofset Nashr" (Publishing, Samarqand,
--            "Registon ko'ch., 5" — AYNAN BIR XIL ko'cha+shahar+soha)
--     - crm_companies.id=5 "Toshkent Matbaa Uyushma OAJ" (Printing, Toshkent)
--         ↔ sd_customers.id=16 "Toshkent Qog'ozchi MChJ" (Printing, Toshkent —
--            bir xil shahar+soha)
--   • crm_companies.id=8 "Buxoro Reklama Agentligi" (industry=Advertising) —
--     sd_customers ichida "Advertising" sohasiga mos hech qanday qator YO'Q
--     (eng yaqin nomzod sd_customers.id=12 "Buxoro Ziyorat Lojaligi" —
--     industry=Tourism, MUTLAQO BOSHQA biznes turi — soxta moslashtirish
--     bo'lardi, Q-40 taqiqlaydi) → ATAYLAB O'TKAZIB YUBORILDI (crm_company_id
--     NULL qoladi; bog'lash uchun yangi sd_customers qator kerak — egasi keyin
--     yaratadi).
--   • sd_customers.id 1-4,6,9 (test/demo qatorlar, inn='1315461315' takroriy) va
--     id 7,8 (test qatorlar) hamda id 12,13,17 (Tourism/Retail/Energy — crm_companies'da
--     mos sanoat yo'q) — hech qanday crm_companies qatoriga mos kelmaydi → O'ZGARTIRILMAYDI.
--
-- Nima uchun ID-asosli (fuzzy pattern EMAS): ma'lumot juda "shovqinli" (INN
--   hammasi NULL, nomlar turlicha yozilgan). Umumiy ILIKE/soundex qoidasi
--   noto'g'ri juftliklarni ham bog'lab qo'yishi mumkin (Q-40 soxta-javob
--   taqiqi). Shu sabab har juftlik qo'lda tekshirilgan va aniq ID bilan
--   yozilgan — auditable, idempotent, xavfsiz.
--
-- IDEMPOTENT: UPDATE shart bilan (faqat crm_company_id IS NULL bo'lsa yozadi)
--   — qayta ishga tushirish xavfsiz, mavjud qo'lda kiritilgan bog'lanishni
--   ustidan yozmaydi.
--
-- FK: `sd_customers_crm_company_id_fkey` — ON DELETE SET NULL (crm_leadga
--   qo'shilgan `sales_orders_crm_lead_id_fkey` patterniga mos: CRM kompaniya
--   o'chirilsa, SD mijoz YASHAB QOLADI — faqat bog'lanish tozalanadi, ma'lumot
--   yo'qolmaydi).
--
-- Qo'llash (manual):
--   node _audit/apply-migration.cjs apps/api/src/shared/db/migrations/sd-customers-crm-company-backfill.sql
-- ===========================================================================

-- 1) Backfill — faqat aniq tasdiqlangan 3 juftlik, faqat hozir NULL bo'lsa
UPDATE sd_customers SET crm_company_id = 7 WHERE id = 15 AND crm_company_id IS NULL;
UPDATE sd_customers SET crm_company_id = 6 WHERE id = 14 AND crm_company_id IS NULL;
UPDATE sd_customers SET crm_company_id = 5 WHERE id = 16 AND crm_company_id IS NULL;

-- 2) Referensial yaxlitlik — bo'lajak yozuvlar uchun ham majburlanadi
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sd_customers_crm_company_id_fkey') THEN
    ALTER TABLE sd_customers
      ADD CONSTRAINT sd_customers_crm_company_id_fkey
      FOREIGN KEY (crm_company_id) REFERENCES crm_companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Qidiruv tezligi uchun indeks (FK ustunlar odatda index'lanadi)
CREATE INDEX IF NOT EXISTS idx_sd_customers_crm_company_id ON sd_customers(crm_company_id);

-- Tekshiruv (kutilgan: 3 qator, crm_company_id NOT NULL):
--   SELECT id, name, crm_company_id FROM sd_customers WHERE crm_company_id IS NOT NULL ORDER BY id;
