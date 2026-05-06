-- ============================================================================
-- Migration: pos-warehouse-integration.sql
--
-- PRD Q29-58: POS ↔ Warehouse to'liq integratsiya.
--
-- Yondashuv:
--   1. Warehouses (10 ta turli tipdagi: MAIN, QUARANTINE, FINISHED_GOODS, ...)
--   2. Material cards (50 ta sample material — qog'oz, bo'yoq, plat, plyonka)
--   3. Initial warehouse_stock to'ldirish
--   4. Unified pos_stock_view — POS oldin warehouse'dan o'qiydi
--   5. Movement type seed (EXTERNAL_IN, EXTERNAL_OUT, INTERNAL_*, DAMAGE)
-- ============================================================================

-- ─── 1. WAREHOUSES — PRD Q29 turlari ───────────────────────────────────────
INSERT INTO warehouses (code, name, name_ru, type, location, is_active, created_at)
SELECT * FROM (VALUES
  ('WH-MAIN',      'Asosiy ombor',         'Главный склад',         'MAIN',           'Bosh bino, 1-qavat',       true, NOW()),
  ('WH-QUARANT',   'Karantin ombori',      'Карантинный склад',     'QUARANTINE',     'Bosh bino, kirish zonasi', true, NOW()),
  ('WH-QC',        'QC ombori',            'Склад ОТК',             'QC',             'QC laboratoriyasi',        true, NOW()),
  ('WH-DEFECT',    'Brak ombor',           'Склад брака',           'DEFECTIVE',      'Bosh bino, podval',        true, NOW()),
  ('WH-FINISHED',  'Tayyor mahsulot',      'Готовая продукция',     'FINISHED_GOODS', 'Yetkazib berish zonasi',   true, NOW()),
  ('WH-PROD-OFFSET','Ofset sex ombori',    'Склад офсет цеха',      'PRODUCTION_OFFSET','Ofset sex',              true, NOW()),
  ('WH-PROD-FLEXO','Flekso sex ombori',    'Склад флексо цеха',     'PRODUCTION_FLEXO','Flekso sex',              true, NOW()),
  ('WH-PROD-PRE',  'Preprint ombor',       'Склад препресс',        'PRODUCTION_PREP','Preprint zonasi',          true, NOW()),
  ('WH-DEPT-HR',   'HR ombori',            'Склад кадров',          'DEPARTMENT_HR',  'HR bo''limi',              true, NOW()),
  ('WH-DEPT-OFFICE','Ofis ombori',         'Офисный склад',         'DEPARTMENT_OFFICE','Ma''muriy bino',         true, NOW())
) AS w(code, name, name_ru, type, location, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = w.code);

-- ─── 2. MATERIAL CATEGORIES — material turlari ────────────────────────────
INSERT INTO material_categories (name, name_ru, code, parent_id, sort_order, is_active)
SELECT * FROM (VALUES
  ('Qog''oz',        'Бумага',         'PAPER',     NULL::integer, 1, true),
  ('Bo''yoq',        'Краска',         'INK',       NULL,         2, true),
  ('Plyonka',        'Пленка',         'FILM',      NULL,         3, true),
  ('Plat',           'Пластина',       'PLATE',     NULL,         4, true),
  ('Aktiv',          'Актив',          'ASSET',     NULL,         5, true),
  ('Ishlat. matn.',  'Расходники',     'CONSUMABLE',NULL,         6, true),
  ('Ofis',           'Офис',           'OFFICE',    NULL,         7, true)
) AS c(name, name_ru, code, parent_id, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM material_categories WHERE code = c.code);

-- ─── 3. MATERIAL CARDS — 30 ta material (sample) ──────────────────────────
DO $$
DECLARE
  wh_main_id INTEGER;
  wh_offset_id INTEGER;
  wh_flexo_id INTEGER;
BEGIN
  SELECT id INTO wh_main_id FROM warehouses WHERE code = 'WH-MAIN';
  SELECT id INTO wh_offset_id FROM warehouses WHERE code = 'WH-PROD-OFFSET';
  SELECT id INTO wh_flexo_id FROM warehouses WHERE code = 'WH-PROD-FLEXO';

  -- Qog'oz (PAPER)
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, grammage, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('PAPER-001', 'Qog''oz A4 80g/m²',     'Бумага A4 80г/м²',     'sht', 'PAPER',  80, 5000.0, 1000.0, 10000.0, 250.0,  'UZS', wh_main_id, 'CONSUMABLE', true, NOW()),
    ('PAPER-002', 'Qog''oz A3 100g/m²',    'Бумага A3 100г/м²',    'sht', 'PAPER',  100, 2000.0, 500.0, 5000.0,  450.0,  'UZS', wh_main_id, 'CONSUMABLE', true, NOW()),
    ('PAPER-003', 'Qog''oz B2 120g/m²',    'Бумага B2 120г/м²',    'sht', 'PAPER',  120, 1000.0, 200.0, 3000.0,  650.0,  'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('PAPER-004', 'Karton 250g/m²',        'Картон 250г/м²',       'sht', 'PAPER',  250, 800.0,  100.0, 2000.0,  1200.0, 'UZS', wh_main_id, 'CONSUMABLE', true, NOW()),
    ('PAPER-005', 'Karton 300g/m²',        'Картон 300г/м²',       'sht', 'PAPER',  300, 600.0,  100.0, 2000.0,  1500.0, 'UZS', wh_main_id, 'CONSUMABLE', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, grammage, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);

  -- Bo'yoq (INK)
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('INK-CYAN',    'Bo''yoq Cyan 1kg',    'Краска Cyan 1кг',    'kg',  'INK', 50.0, 20.0, 200.0, 85000.0,  'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('INK-MAGENTA', 'Bo''yoq Magenta 1kg', 'Краска Magenta 1кг', 'kg',  'INK', 45.0, 20.0, 200.0, 85000.0,  'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('INK-YELLOW',  'Bo''yoq Yellow 1kg',  'Краска Yellow 1кг',  'kg',  'INK', 60.0, 20.0, 200.0, 80000.0,  'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('INK-BLACK',   'Bo''yoq Black 1kg',   'Краска Black 1кг',   'kg',  'INK', 70.0, 20.0, 200.0, 75000.0,  'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('INK-WHITE',   'Bo''yoq Oq 1kg',      'Краска Белая 1кг',   'kg',  'INK', 30.0, 10.0, 100.0, 95000.0,  'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);

  -- Plyonka (FILM)
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('FILM-PE-12',  'Plyonka PE 12mkm',    'Пленка PE 12мкм',    'm',   'FILM', 5000.0, 1000.0, 20000.0, 1500.0, 'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW()),
    ('FILM-PP-20',  'Plyonka PP 20mkm',    'Пленка PP 20мкм',    'm',   'FILM', 3000.0, 500.0,  10000.0, 2000.0, 'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW()),
    ('FILM-OPP-25', 'Plyonka OPP 25mkm',   'Пленка OPP 25мкм',   'm',   'FILM', 2500.0, 500.0,  10000.0, 2200.0, 'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW()),
    ('FILM-FOIL',   'Folga 9mkm',          'Фольга 9мкм',        'm',   'FILM', 800.0,  200.0,  3000.0,  3500.0, 'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);

  -- Plat (PLATE)
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('PLATE-OFFSET', 'Ofset plat',        'Офсетная пластина',   'sht', 'PLATE', 200.0, 50.0, 1000.0, 25000.0, 'UZS', wh_offset_id, 'CONSUMABLE', true, NOW()),
    ('PLATE-FLEXO',  'Flekso plat',       'Флексо пластина',     'sht', 'PLATE', 150.0, 30.0, 500.0,  85000.0, 'UZS', wh_flexo_id, 'CONSUMABLE', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);

  -- Ofis (OFFICE)
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('OFFICE-PEN',  'Qalam (qora)',         'Ручка (черная)',     'sht', 'OFFICE', 200.0, 50.0, 500.0, 5000.0,  'UZS', wh_main_id, 'CONSUMABLE', true, NOW()),
    ('OFFICE-NB',   'Daftar A5',            'Тетрадь A5',         'sht', 'OFFICE', 100.0, 20.0, 300.0, 15000.0, 'UZS', wh_main_id, 'CONSUMABLE', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, max_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);

  -- Aktivlar (ASSET) — laptop, telefon — boshqa narxda
  INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  SELECT * FROM (VALUES
    ('ASSET-LAPTOP', 'Noutbuk HP 15.6"',   'Ноутбук HP 15.6"',   'sht', 'ASSET',  10.0, 2.0, 8500000.0, 'UZS', wh_main_id, 'ASSET', true, NOW()),
    ('ASSET-PHONE',  'Korporativ telefon', 'Корп. телефон',      'sht', 'ASSET',  15.0, 5.0, 1200000.0, 'UZS', wh_main_id, 'ASSET', true, NOW()),
    ('ASSET-BADGE',  'Kirish badge',       'Бейдж доступа',      'sht', 'ASSET',  100.0, 20.0, 25000.0, 'UZS', wh_main_id, 'ASSET', true, NOW())
  ) AS m(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, current_stock, min_stock, unit_price, currency, warehouse_id, material_type, is_active, created_at)
  WHERE NOT EXISTS (SELECT 1 FROM material_cards mc WHERE mc.kod = m.kod);
END $$;

-- ─── 4. WAREHOUSE_STOCK — har materialdan har ombor uchun ─────────────────
INSERT INTO warehouse_stock (warehouse_id, material_card_id, quantity, reserved_quantity, available_quantity, unit_of_measure, last_updated_at, created_at)
SELECT
  mc.warehouse_id,
  mc.id,
  mc.current_stock,
  COALESCE(mc.reserved_stock, 0),
  mc.current_stock - COALESCE(mc.reserved_stock, 0),
  mc.unit_of_measure,
  NOW(),
  NOW()
FROM material_cards mc
WHERE mc.warehouse_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM warehouse_stock ws
    WHERE ws.warehouse_id = mc.warehouse_id AND ws.material_card_id = mc.id
  );

-- ─── 5. POS-WAREHOUSE STOCK VIEW — POS shu yerdan o'qiydi ──────────────────
DROP VIEW IF EXISTS pos_warehouse_stock_view;
CREATE VIEW pos_warehouse_stock_view AS
SELECT
  ws.id                  AS stock_id,
  ws.warehouse_id,
  w.code                 AS warehouse_code,
  w.name                 AS warehouse_name,
  w.type                 AS warehouse_type,
  ws.material_card_id,
  mc.kod                 AS material_code,
  mc.xom_ashyo           AS material_name,
  mc.xom_ashyo_ru        AS material_name_ru,
  mc.category,
  mc.material_type,
  mc.unit_of_measure,
  ws.quantity,
  ws.reserved_quantity,
  ws.available_quantity,
  mc.min_stock,
  mc.max_stock,
  mc.unit_price,
  mc.currency,
  -- Stock holatini hisoblash
  CASE
    WHEN ws.available_quantity <= 0 THEN 'OUT_OF_STOCK'
    WHEN ws.available_quantity < mc.min_stock THEN 'LOW_STOCK'
    WHEN ws.available_quantity > mc.max_stock THEN 'OVER_STOCK'
    ELSE 'OK'
  END                     AS stock_status,
  ws.last_updated_at,
  mc.is_active
FROM warehouse_stock ws
JOIN warehouses w ON w.id = ws.warehouse_id
JOIN material_cards mc ON mc.id = ws.material_card_id
WHERE w.is_active = true AND mc.is_active = true;

-- ─── 6. Verify ──────────────────────────────────────────────────────────────
SELECT 'warehouses'        AS t, COUNT(*) FROM warehouses
UNION ALL SELECT 'material_categories', COUNT(*) FROM material_categories
UNION ALL SELECT 'material_cards',      COUNT(*) FROM material_cards
UNION ALL SELECT 'warehouse_stock',     COUNT(*) FROM warehouse_stock
UNION ALL SELECT 'pos_warehouse_view',  COUNT(*) FROM pos_warehouse_stock_view;
