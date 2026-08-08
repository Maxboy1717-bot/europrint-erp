-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- seed-00-foundation-canonical: CANONICAL foundation master-data, aligned to the REAL
-- (drizzle-generated) table columns. Replaces the stale seed-02/03/04 which targeted a
-- non-existent idealized schema (name_uz on razryad/units, `code` on accounts).
-- roles + defect_catalog intentionally skipped: roles is vestigial (app uses users.role);
-- QC uses its own defect tables, not defect_catalog.
BEGIN;

-- RAZRYAD 1-6 (coefficients per vision: 1.00/1.25/1.55/1.90/2.30/2.80)
INSERT INTO razryad_levels (level, name, name_uz, coefficient, min_months, is_active, created_at, updated_at) VALUES
  (1, '1-razryad', '1-razryad', 1.00, 0,  true, now(), now()),
  (2, '2-razryad', '2-razryad', 1.25, 3,  true, now(), now()),
  (3, '3-razryad', '3-razryad', 1.55, 6,  true, now(), now()),
  (4, '4-razryad', '4-razryad', 1.90, 12, true, now(), now()),
  (5, '5-razryad', '5-razryad', 2.30, 18, true, now(), now()),
  (6, '6-razryad', '6-razryad', 2.80, 24, true, now(), now());

-- UNIT OF MEASURES (asosiy birliklar)
INSERT INTO unit_of_measures (code, name, name_ru, category, is_active, created_at) VALUES
  ('dona',  'Dona',         'Штука',     'count',  true, now()),
  ('kg',    'Kilogramm',    'Килограмм', 'weight', true, now()),
  ('m',     'Metr',         'Метр',      'length', true, now()),
  ('m2',    'Kvadrat metr', 'Кв. метр',  'area',   true, now()),
  ('litr',  'Litr',         'Литр',      'volume', true, now()),
  ('rulon', 'Rulon',        'Рулон',     'count',  true, now()),
  ('list',  'List',         'Лист',      'count',  true, now());

-- ACCOUNTS (BHMS — GL-posting ishlatadigan hisoblar: cashier-hub/golden-thread legs)
INSERT INTO accounts (account_code, account_name, account_name_ru, account_type, is_active, created_at) VALUES
  ('1000', 'Tovar-moddiy zaxiralar', 'ТМЗ',                 'asset',     true, now()),
  ('4000', 'Debitorlar (AR)',        'Дебиторы',            'asset',     true, now()),
  ('5010', 'Kassa / Naqd pul',       'Касса',               'asset',     true, now()),
  ('6310', 'QQS (VAT)',              'НДС',                 'liability', true, now()),
  ('6710', 'Ish haqi (to''lanadigan)','Зарплата к выплате', 'liability', true, now()),
  ('9010', 'Sotuvdan daromad',       'Доход от продаж',     'revenue',   true, now()),
  ('9100', 'Tovar tannarxi (COGS)',  'Себестоимость',       'expense',   true, now()),
  ('9500', 'Boshqa xarajatlar',      'Прочие расходы',      'expense',   true, now());

COMMIT;
