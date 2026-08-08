-- =============================================================================
-- DEMO SEED: Material Management — Purchase Orders + Lines + Vendor Ratings
-- Faqat DEMO/NAMUNA data (dashboard vizyonni ko'rsatish uchun)
-- Idempotent: DELETE+INSERT pattern (ON CONFLICT not available, no sequences on some cols)
-- Tasdiqlangan vendorIds: [20,16,19,18,17] (mm_vendors.id)
-- Tasdiqlangan materialCardIds: [29..38] (material_cards.id)
-- MUHIM: mm_purchase_orders va mm_purchase_order_items = VIEW
--   → Base jadvallar: purchase_orders, purchase_order_items
--   → purchase_order_items.raw_material_id NOT NULL → raw_materials seedi kerak
-- created_by: 2 (birinchi mavjud xodim)
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. raw_materials seed (purchase_order_items.raw_material_id uchun)
--    material_cards.id larini raw_materials.id sifatida qayta ishlat
--    raw_materials jadvali bo'sh → IDs 29-38 xavfsiz
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM raw_materials WHERE id IN (29,30,31,32,33,34,35,36,37,38);

INSERT INTO raw_materials (id, code, name, name_ru, category, unit, minimum_stock, current_stock, unit_price, supplier_name, is_active)
OVERRIDING SYSTEM VALUE
VALUES
  (29, 'INK-UV-CYAN',   'UV bo''yoq Cyan 5kg',           'UV краска Cyan 5кг',         'ink',     'kg',  10,  0, 215000, 'Farg''ona Kimyo Kombinati',     TRUE),
  (30, 'INK-UV-MAG',    'UV bo''yoq Magenta 5kg',         'UV краска Magenta 5кг',       'ink',     'kg',  10,  0, 228000, 'Farg''ona Kimyo Kombinati',     TRUE),
  (31, 'PLATE-CTF',     'CTP plat (ofset, 0.3mm)',         'CTP плита (офсет, 0.3мм)',    'plate',   'sht', 50,  0,  36000, 'Samarqand Offset Plat MChJ',    TRUE),
  (32, 'VANISH-GLOS',   'Lak glyansli 20L',               'Лак глянцевый 20Л',           'varnish', 'l',   5,   0, 210000, 'Drupa Supplies GmbH',           TRUE),
  (33, 'CARD-KR-350',   'Karton Kraft 350g/m²',           'Картон Крафт 350г/м²',        'cardboard','m2', 200, 0,  18750, 'Toshkent Qog''oz Zavodi',      TRUE),
  (34, 'CARD-GF-200',   'Gofrokarton 200g/m² (E-flyut)',  'Гофрокартон 200г/м² (Е)',     'cardboard','m2', 300, 0,  12500, 'Toshkent Qog''oz Zavodi',      TRUE),
  (35, 'CARD-GF-300',   'Gofrokarton 300g/m² (B-flyut)',  'Гофрокартон 300г/м² (Б)',     'cardboard','m2', 300, 0,  15800, 'Toshkent Qog''oz Zavodi',      TRUE),
  (36, 'FILM-BOPP-18',  'Plyonka BOPP 18mkm',             'Пленка BOPP 18мкм',           'film',    'm',   500, 0,  26000, 'Drupa Supplies GmbH',           TRUE),
  (37, 'CARD-KR-450',   'Karton Kraft 450g/m²',           'Картон Крафт 450г/м²',        'cardboard','m2', 150, 0,  29500, 'Namangan Poligrafiya Xom Ashyo',TRUE),
  (38, 'VANISH-MAT',    'Lak mat 20L',                    'Лак матовый 20Л',             'varnish', 'l',   5,   0, 221000, 'Namangan Poligrafiya Xom Ashyo',TRUE);

-- raw_materials sequence sinxron qilish
SELECT setval('raw_materials_id_seq', GREATEST((SELECT MAX(id) FROM raw_materials), 38));

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. purchase_orders (base table) — 5 PO, turli statuslarda
--    id: nextval('purchase_orders_id_seq') → explicit IDs 1001-1005
--    vendor_id NOT NULL, po_number NOT NULL, order_date NOT NULL
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM purchase_order_items WHERE po_id IN (1001,1002,1003,1004,1005);
DELETE FROM mm_vendor_ratings WHERE purchase_order_id IN (1001,1002,1003,1004,1005);
DELETE FROM purchase_orders WHERE id IN (1001,1002,1003,1004,1005);

-- PO-1001: DRAFT — Toshkent Qog'oz Zavodi (vendor_id=20)
INSERT INTO purchase_orders
  (id, po_number, vendor_id, vendor_name, order_date, delivery_date, expected_date,
   status, total_amount, currency, created_by, created_at, updated_at,
   notes, invoice_matched, three_way_matched, tenant_id)
OVERRIDING SYSTEM VALUE
VALUES
  (1001, 'PO-001001', 20, 'Toshkent Qog''oz Zavodi',
   '2026-06-10', '2026-06-25', '2026-06-25',
   'draft', 18750000, 'UZS',
   2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days',
   'DEMO: Karton va gofrokarton buyurtma — yangi nashr uchun', FALSE, FALSE, 1);

-- PO-1002: APPROVED — Farg'ona Kimyo Kombinati (vendor_id=16)
INSERT INTO purchase_orders
  (id, po_number, vendor_id, vendor_name, order_date, delivery_date, expected_date,
   status, total_amount, currency, created_by, created_at, updated_at,
   approved_at, notes, invoice_matched, three_way_matched, tenant_id)
OVERRIDING SYSTEM VALUE
VALUES
  (1002, 'PO-001002', 16, 'Farg''ona Kimyo Kombinati',
   '2026-06-05', '2026-06-20', '2026-06-20',
   'approved', 24300000, 'UZS',
   2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '13 days',
   'DEMO: UV bo''yoqlar va lak buyurtma — raqamli bosib chiqarish uchun',
   TRUE, FALSE, 1);

-- PO-1003: RECEIVED — Samarqand Offset Plat MChJ (vendor_id=19)
INSERT INTO purchase_orders
  (id, po_number, vendor_id, vendor_name, order_date, delivery_date, expected_date,
   actual_delivery_date, status, total_amount, currency,
   created_by, created_at, updated_at,
   approved_at, invoice_matched, three_way_matched,
   notes, tenant_id)
OVERRIDING SYSTEM VALUE
VALUES
  (1003, 'PO-001003', 19, 'Samarqand Offset Plat MChJ',
   '2026-05-28', '2026-06-12', '2026-06-12',
   '2026-06-11 14:30:00+05',
   'received', 8640000, 'UZS',
   2, NOW() - INTERVAL '23 days', NOW() - INTERVAL '9 days',
   NOW() - INTERVAL '21 days',
   TRUE, TRUE,
   'DEMO: CTP platlar — o''z vaqtida yetkazildi (1 kun erta)', 1);

-- PO-1004: CANCELLED — Drupa Supplies GmbH (vendor_id=18)
INSERT INTO purchase_orders
  (id, po_number, vendor_id, vendor_name, order_date, delivery_date, expected_date,
   status, total_amount, currency, created_by, created_at, updated_at,
   notes, invoice_matched, three_way_matched, tenant_id)
OVERRIDING SYSTEM VALUE
VALUES
  (1004, 'PO-001004', 18, 'Drupa Supplies GmbH (UZ rep)',
   '2026-05-20', '2026-06-05', '2026-06-05',
   'cancelled', 31200000, 'UZS',
   2, NOW() - INTERVAL '31 days', NOW() - INTERVAL '18 days',
   'DEMO: BOPP plyonka buyurtma — narx kelishuvi bo''lmagani uchun bekor qilindi',
   FALSE, FALSE, 1);

-- PO-1005: PENDING (tasdiqlash kutilmoqda) — Namangan Poligrafiya Xom Ashyo (vendor_id=17)
INSERT INTO purchase_orders
  (id, po_number, vendor_id, vendor_name, order_date, delivery_date, expected_date,
   status, total_amount, currency, created_by, created_at, updated_at,
   notes, invoice_matched, three_way_matched, tenant_id)
OVERRIDING SYSTEM VALUE
VALUES
  (1005, 'PO-001005', 17, 'Namangan Poligrafiya Xom Ashyo',
   '2026-06-18', '2026-07-03', '2026-07-03',
   'pending', 15480000, 'UZS',
   2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
   'DEMO: Karton Kraft va lak — tasdiqlash kutilmoqda', FALSE, FALSE, 1);

-- purchase_orders sequence sinxron qilish
SELECT setval('purchase_orders_id_seq', GREATEST((SELECT MAX(id) FROM purchase_orders), 1005));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. purchase_order_items (base table)
--    raw_material_id NOT NULL → raw_materials.id (29-38 yuqorida qo'shilgan)
--    material_id = material_cards.id (qo'shimcha kanonik bog'lanish)
-- ─────────────────────────────────────────────────────────────────────────────

-- PO-1001 items: Karton Kraft 350 + Gofrokarton 200 (raw_material 33, 34)
INSERT INTO purchase_order_items
  (po_id, purchase_order_id, raw_material_id, material_id, quantity, unit, unit_price, total_price)
VALUES
  (1001, 1001, 33, 33, 500,  'm2', 18750,  9375000),
  (1001, 1001, 34, 34, 750,  'm2', 12500,  9375000);

-- PO-1002 items: UV bo'yoq Cyan + Magenta (raw_material 29, 30)
INSERT INTO purchase_order_items
  (po_id, purchase_order_id, raw_material_id, material_id, quantity, unit, unit_price, total_price)
VALUES
  (1002, 1002, 29, 29, 60,  'kg', 215000, 12900000),
  (1002, 1002, 30, 30, 50,  'kg', 228000, 11400000);

-- PO-1003 items: CTP plat (raw_material 31)
INSERT INTO purchase_order_items
  (po_id, purchase_order_id, raw_material_id, material_id, quantity, unit, unit_price, total_price)
VALUES
  (1003, 1003, 31, 31, 240, 'sht', 36000,  8640000);

-- PO-1004 items: Plyonka BOPP 18mkm (raw_material 36)
INSERT INTO purchase_order_items
  (po_id, purchase_order_id, raw_material_id, material_id, quantity, unit, unit_price, total_price)
VALUES
  (1004, 1004, 36, 36, 1200, 'm',  26000, 31200000);

-- PO-1005 items: Karton Kraft 450 + Lak mat (raw_material 37, 38)
INSERT INTO purchase_order_items
  (po_id, purchase_order_id, raw_material_id, material_id, quantity, unit, unit_price, total_price)
VALUES
  (1005, 1005, 37, 37, 300,  'm2', 29500,  8850000),
  (1005, 1005, 38, 38,  30,  'l',  221000,  6630000);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. mm_vendor_ratings (yetkazib-berish reyting — on-time va sifat)
--    id: nextval('mm_vendor_ratings_id_seq') — avtomatik
-- ─────────────────────────────────────────────────────────────────────────────

-- PO-1003 (Samarqand Offset Plat, vendor_id=19) — 1 kun erta yetkazildi → yuqori reyting
INSERT INTO mm_vendor_ratings
  (vendor_id, quality_score, delivery_score, price_score, purchase_order_id, rater_id, notes, rated_at)
VALUES
  (19, 4.8, 5.0, 4.2, 1003, 2,
   'DEMO: Platlar sifati a''lo, yetkazilish 1 kun erta, narx muzokarali',
   NOW() - INTERVAL '8 days');

-- Toshkent Qog'oz Zavodi (vendor_id=20) — oldingi PO bo'yicha reyting
INSERT INTO mm_vendor_ratings
  (vendor_id, quality_score, delivery_score, price_score, purchase_order_id, rater_id, notes, rated_at)
VALUES
  (20, 4.5, 4.0, 4.7, NULL, 2,
   'DEMO: Karton sifati yaxshi, kechikish 2 kun, narx raqobatbardosh',
   NOW() - INTERVAL '30 days');

-- Farg'ona Kimyo Kombinati (vendor_id=16)
INSERT INTO mm_vendor_ratings
  (vendor_id, quality_score, delivery_score, price_score, purchase_order_id, rater_id, notes, rated_at)
VALUES
  (16, 3.9, 3.5, 4.8, NULL, 2,
   'DEMO: Bo''yoq sifati o''rtacha, kechikish 3 kun, narx eng arzon',
   NOW() - INTERVAL '45 days');

-- Namangan Poligrafiya Xom Ashyo (vendor_id=17)
INSERT INTO mm_vendor_ratings
  (vendor_id, quality_score, delivery_score, price_score, purchase_order_id, rater_id, notes, rated_at)
VALUES
  (17, 4.2, 4.6, 4.0, NULL, 2,
   'DEMO: Sifat yaxshi, vaqtida yetkazildi, narx o''rtacha',
   NOW() - INTERVAL '60 days');

-- Drupa Supplies GmbH (vendor_id=18) — narx kelishmovchiligi
INSERT INTO mm_vendor_ratings
  (vendor_id, quality_score, delivery_score, price_score, purchase_order_id, rater_id, notes, rated_at)
VALUES
  (18, 3.5, 3.8, 2.5, NULL, 2,
   'DEMO: Narxlar yuqori, narx kelishuvi bo''lmadi — PO-1004 bekor qilindi',
   NOW() - INTERVAL '18 days');

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tekshirish so'rovlari
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT id, po_number, vendor_name, status, total_amount, currency FROM purchase_orders WHERE id IN (1001,1002,1003,1004,1005);
-- SELECT poi.id, poi.po_id, rm.name, mc.xom_ashyo, poi.quantity, poi.unit, poi.unit_price, poi.total_price FROM purchase_order_items poi LEFT JOIN raw_materials rm ON rm.id=poi.raw_material_id LEFT JOIN material_cards mc ON mc.id=poi.material_id WHERE poi.po_id IN (1001,1002,1003,1004,1005) ORDER BY poi.id;
-- SELECT vr.id, v.name, vr.quality_score, vr.delivery_score, vr.price_score, vr.purchase_order_id FROM mm_vendor_ratings vr JOIN mm_vendors v ON v.id=vr.vendor_id ORDER BY vr.rated_at DESC;
