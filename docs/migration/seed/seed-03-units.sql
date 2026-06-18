-- APPROVED: owner (2026-06-18)
-- seed-03-units.sql: O'lchov birliklari (unit_of_measures)
-- Idempotent: ON CONFLICT (code) DO NOTHING
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-03-units.sql

BEGIN;

-- ============================================================
-- EuroPrint: gofra/offset/packaging fabrikasi uchun
-- Standart: O'zbekiston me'yori + xalqaro SI
-- ============================================================

INSERT INTO unit_of_measures (code, name_uz, name_ru, symbol, is_base, created_at, updated_at)
VALUES
  -- Dona/son
  ('PCS',   'Dona',           'Штука',       'шт',   true,  NOW(), NOW()),
  ('PACK',  'Pachka',         'Пачка',       'пач',  false, NOW(), NOW()),
  ('SET',   'To''plam',       'Набор',       'нбр',  false, NOW(), NOW()),

  -- Uzunlik
  ('M',     'Metr',           'Метр',        'м',    true,  NOW(), NOW()),
  ('MM',    'Millimetr',      'Миллиметр',   'мм',   false, NOW(), NOW()),
  ('CM',    'Santimetr',      'Сантиметр',   'см',   false, NOW(), NOW()),

  -- Yuza
  ('M2',    'Kvadrat metr',   'Квадратный метр', 'м²', true, NOW(), NOW()),
  ('CM2',   'Kvadrat sm',     'Кв. сантиметр',  'см²',false, NOW(), NOW()),

  -- Hajm
  ('L',     'Litr',           'Литр',        'л',    true,  NOW(), NOW()),
  ('ML',    'Millilitr',      'Миллилитр',   'мл',   false, NOW(), NOW()),

  -- Og'irlik
  ('KG',    'Kilogramm',      'Килограмм',   'кг',   true,  NOW(), NOW()),
  ('G',     'Gramm',          'Грамм',       'г',    false, NOW(), NOW()),
  ('TON',   'Tonna',          'Тонна',       'т',    false, NOW(), NOW()),

  -- Gofra/Offset maxsus
  ('SHEET', 'List',           'Лист',        'л',    true,  NOW(), NOW()),
  ('ROLL',  'Rulon',          'Рулон',       'рул',  true,  NOW(), NOW()),
  ('BOX',   'Quti',           'Коробка',     'кор',  false, NOW(), NOW()),
  ('PALLET','Palet',          'Паллет',      'пал',  false, NOW(), NOW()),

  -- Vaqt (mehnat normlari uchun)
  ('HOUR',  'Soat',           'Час',         'ч',    true,  NOW(), NOW()),
  ('MIN',   'Daqiqa',         'Минута',      'мин',  false, NOW(), NOW()),

  -- Moliya
  ('UZS',   'O''zbek so''mi', 'Узбекский сум','сум', true, NOW(), NOW()),
  ('USD',   'AQSh dollari',   'Доллар США',  '$',    false, NOW(), NOW())

ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT code, name_uz, symbol FROM unit_of_measures ORDER BY code;
