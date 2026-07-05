-- APPROVED: egasi B13 (2026-07-05) — "standardize on ... decimal-precision currency
--   (no float)". PLAN: "List every place ... float-typed currency ... Plan the fix per
--   location." EXECUTE: "Implement per group (by module), run tests, show diffs, commit
--   each group separately."
--
-- TOPILMA: jonli DB'da 4 ta pul-ustun float (`double precision`/`real`) sifatida
--   saqlangan, garchi Drizzle sxemasi (`numericMoney()` wrapper) ularni ALLAQACHON
--   `numeric` deb kutgan bo'lsa ham (drift, kod-sxema emas):
--     - production_orders.planned_cost, production_orders.actual_cost (double precision)
--     - system_settings.inps_rate, system_settings.qqs_rate (real)
--   Ikkalasi ham HOZIRDA bo'sh/NULL (production_orders 7 qator hammasi NULL,
--   system_settings 0 qator) — hech qanday jonli ma'lumotga ta'sir qilmaydi. Bu drift'ni
--   TUZATADI (kod allaqachon numeric-shaped/string qiymat kutadi), yangi xavf
--   kiritmaydi.
--
-- CHETLAB O'TILDI (shu partiyada): entries.entry_date (varchar(10) -> date). Dry-run
--   ko'rsatdiki, bu ustunni raw-SQL orqali o'qiydigan ~12 finance-modul fayli
--   (Drizzle emas, xom pg driver) `date`ga o'tgandan keyin JS Date obyekti oladi (string
--   emas) — global type-parser override yo'q, shuning uchun Tashkent (UTC+5) uchun
--   bitta-kunlik siljish xavfi bor (server-side qiymat to'g'ri, faqat klient-tomon
--   ko'rsatish/solishtirish xavfli). Bosh moliyaviy defter jadvali (GL) — yuqori
--   ta'sir-radiusi. Alohida, kengroq partiyaga qoldirildi (RESIDUAL-FIX-LOOP-2026-07-04.md
--   "B13" bo'limiga qarang).
--
-- FAQAT ADDITIV/TUZATISH: DDL turi-o'zgartirish, DESTRUCTIVE amal yo'q (USING cast bilan,
--   0/NULL ma'lumot). Dry-run (rollback-tx) TASDIQLANDI, keyin to'liq qo'llanildi
--   (jonli DB, 2026-07-05).

ALTER TABLE production_orders ALTER COLUMN planned_cost TYPE numeric(18,4) USING planned_cost::numeric(18,4);
ALTER TABLE production_orders ALTER COLUMN actual_cost TYPE numeric(18,4) USING actual_cost::numeric(18,4);
ALTER TABLE system_settings ALTER COLUMN inps_rate TYPE numeric(9,4) USING inps_rate::numeric(9,4);
ALTER TABLE system_settings ALTER COLUMN qqs_rate TYPE numeric(9,4) USING qqs_rate::numeric(9,4);
