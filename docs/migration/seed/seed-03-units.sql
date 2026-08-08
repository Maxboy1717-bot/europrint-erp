-- APPROVED: owner (2026-06-18); column-aligned to REAL schema (2026-06-26, A87)
-- seed-03-units.sql: O'lchov birliklari (unit_of_measures)
-- ⚠️ Ustunlar JONLI sxemaga moslandi: code, name, name_ru, category, base_unit_id,
--    conversion_factor, is_active, created_at (avvalgi name_uz/symbol/is_base XATO edi —
--    jonli jadvalda bunday ustunlar yo'q, category esa NOT NULL). Manba: lib/db/src/schema/
--    core/core-rules.ts (unitOfMeasures) + information_schema.columns (live europrint DB).
-- category qiymatlari seed-00-foundation-canonical bilan bir xil: count/weight/length/area/volume
--    (+time mehnat normlari uchun). Kanonik kod = kichik harf (foundation seed bilan izchil).
-- Idempotent: ON CONFLICT (code) DO NOTHING — seed-00-foundation 7 ta birlikni oldin qo'ysa ham xavfsiz.
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-03-units.sql

BEGIN;

-- ============================================================
-- EuroPrint: gofra/offset/packaging fabrikasi uchun
-- Standart: O'zbekiston me'yori + xalqaro SI
-- ============================================================

INSERT INTO unit_of_measures (code, name, name_ru, category, conversion_factor, is_active, created_at)
VALUES
  -- Dona/son (count)
  ('dona',   'Dona',           'Штука',           'count',  1, true, NOW()),
  ('pachka', 'Pachka',         'Пачка',           'count',  1, true, NOW()),
  ('toplam', 'To''plam',       'Набор',           'count',  1, true, NOW()),
  ('rulon',  'Rulon',          'Рулон',           'count',  1, true, NOW()),
  ('list',   'List',           'Лист',            'count',  1, true, NOW()),
  ('quti',   'Quti',           'Коробка',         'count',  1, true, NOW()),
  ('palet',  'Palet',          'Паллет',          'count',  1, true, NOW()),

  -- Uzunlik (length)
  ('m',      'Metr',           'Метр',            'length', 1, true, NOW()),
  ('mm',     'Millimetr',      'Миллиметр',       'length', 1, true, NOW()),
  ('sm',     'Santimetr',      'Сантиметр',       'length', 1, true, NOW()),

  -- Yuza (area)
  ('m2',     'Kvadrat metr',   'Кв. метр',        'area',   1, true, NOW()),
  ('sm2',    'Kvadrat sm',     'Кв. сантиметр',   'area',   1, true, NOW()),

  -- Hajm (volume)
  ('litr',   'Litr',           'Литр',            'volume', 1, true, NOW()),
  ('ml',     'Millilitr',      'Миллилитр',       'volume', 1, true, NOW()),

  -- Og'irlik (weight)
  ('kg',     'Kilogramm',      'Килограмм',       'weight', 1, true, NOW()),
  ('g',      'Gramm',          'Грамм',           'weight', 1, true, NOW()),
  ('tonna',  'Tonna',          'Тонна',           'weight', 1, true, NOW()),

  -- Vaqt (time — mehnat normlari uchun)
  ('soat',   'Soat',           'Час',             'time',   1, true, NOW()),
  ('daqiqa', 'Daqiqa',         'Минута',          'time',   1, true, NOW())

ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT code, name, name_ru, category FROM unit_of_measures ORDER BY category, code;
