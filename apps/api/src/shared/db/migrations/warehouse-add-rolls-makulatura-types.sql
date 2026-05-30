-- warehouse-add-rolls-makulatura-types.sql
-- 2026-05-30 — Ombor taksonomiyasiga 2 yangi tur (Maxboy vision intervyu):
--   paper_rolls  = Rulon qog'oz ombori (har rulon alohida QR: o'lcham/og'irlik/partiya/narx)
--   waste_paper  = Makulatura ombori (ishlab chiqarish chiqindisi -> sotish/qayta ishlash)
--
-- ADD-ONLY + idempotent: mavjud CHECK qiymatlari (live superset) saqlanadi, faqat 2 yangi
-- qiymat qo'shiladi. Hech qaysi mavjud qator buzilmaydi (strict superset).
--
-- Qo'llash (manual): psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/warehouse-add-rolls-makulatura-types.sql

ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_type_chk;
ALTER TABLE warehouses ADD CONSTRAINT warehouses_type_chk CHECK (
  type IN (
    -- Drizzle schema kanonik turlari
    'main','raw_material','finished_goods','transit','semi_finished','defective',
    'quarantine','tools_equipment','household_mro','mro','production',
    -- Live-DB superset (mavjud jonli qiymatlar — ADD-ONLY saqlanadi)
    'department_warehouse','MAIN','QUARANTINE','PRODUCTION_OFFSET','PRODUCTION_FLEXO',
    'tools','household','wip','scrap',
    -- 2026-05-30 yangi turlar
    'paper_rolls','waste_paper'
  )
);
