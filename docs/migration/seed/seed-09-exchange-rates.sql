-- =============================================================
-- SEED: exchange_rates — boshlang'ich kurslar (USD/EUR/RUB/CNY -> UZS)
-- Maqsad: `finance-main.controller.ts` GET /finance/exchange-rates avval shu
-- jadvaldan o'qiydi, faqat qator topilmasa `app.constants.ts` zaxira
-- (RATE_*_UZS) qiymatlarga tushadi. Jadval bo'sh bo'lgani uchun hozircha har
-- doim zaxiraga tushib turgan edi — shu boshlang'ich qatorlar buni tuzatadi.
-- Muallif: Claude (Magic-Numbers Fix Loop, M2), 2026-07-05
-- IDEMPOTENT: WHERE NOT EXISTS (jadvalda unique constraint yo'q — rate
-- tarixini saqlash uchun bir necha qator bir xil valyutaga ruxsat berilgan,
-- shuning uchun ON CONFLICT emas, mavjudlik tekshiruvi ishlatiladi).
-- Qiymatlar: app.constants.ts RATE_USD_UZS/RATE_EUR_UZS/RATE_RUB_UZS/
-- RATE_CNY_UZS bilan bir xil (M2 topilmasining o'zi) — real bozor kursi
-- emas, taxminiy boshlang'ich qiymat; egasi keyinchalik yangilashi mumkin.
-- =============================================================

BEGIN;

INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source, created_at)
SELECT 'USD', 'UZS', 12700, CURRENT_DATE::text, 'seed-initial', NOW()
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates WHERE UPPER(from_currency) = 'USD' AND UPPER(to_currency) = 'UZS');

INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source, created_at)
SELECT 'EUR', 'UZS', 13800, CURRENT_DATE::text, 'seed-initial', NOW()
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates WHERE UPPER(from_currency) = 'EUR' AND UPPER(to_currency) = 'UZS');

INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source, created_at)
SELECT 'RUB', 'UZS', 140, CURRENT_DATE::text, 'seed-initial', NOW()
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates WHERE UPPER(from_currency) = 'RUB' AND UPPER(to_currency) = 'UZS');

INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source, created_at)
SELECT 'CNY', 'UZS', 1750, CURRENT_DATE::text, 'seed-initial', NOW()
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates WHERE UPPER(from_currency) = 'CNY' AND UPPER(to_currency) = 'UZS');

COMMIT;
