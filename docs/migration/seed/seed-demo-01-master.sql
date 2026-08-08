-- =============================================================================
-- DEMO MASTER DATA SEED
-- Fayl: docs/migration/seed/seed-demo-01-master.sql
-- Yaratildi: 2026-06-20
-- Maqsad: Dashboard vizyonini ko'rsatish uchun demo/namuna ma'lumotlar
--         (Q-40: soxta emas — demo deb belgilangan)
-- Idempotent: takroriy ishlatsa ham xato bermaydi (ON CONFLICT / DO NOTHING)
-- DIQQAT: Sxema o'zgartirmaydi — faqat data INSERT
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. SD_CUSTOMERS — O'zbek kompaniya nomlari (demo)
-- ---------------------------------------------------------------------------
-- Mavjud: 9 ta (id 1-9). Yangi 6 ta qo'shamiz (kod bilan).
-- Unique constraint yo'q, idempotent qilish uchun customer_code filtr qilamiz.

INSERT INTO sd_customers (name, stir, phone, email, address, customer_code, customer_type, segment, industry, payment_terms_days, credit_limit, status)
SELECT v.name, v.stir, v.phone, v.email, v.address, v.customer_code, v.customer_type, v.segment, v.industry, v.payment_terms_days, v.credit_limit, v.status
FROM (VALUES
  ('Toshkent Qog''ozchi MChJ',   '3071234501', '+998712001234', 'info@tqogozchi.uz',     'Toshkent, Yunusobod t., 12-uy',      'CUST-D001', 'legal',   'B2B', 'Printing',      30, 50000000,  'active'),
  ('Samarqand Ofset Nashr',      '1561234502', '+998662005678', 'info@samarkand-ofset.uz','Samarqand, Registon ko''ch., 5',    'CUST-D002', 'legal',   'B2B', 'Publishing',    45, 30000000,  'active'),
  ('UzPack Qadoqlash OAJ',       '2081234503', '+998612009900', 'sales@uzpack.uz',        'Namangan, Yangi Namangan, 88',      'CUST-D003', 'legal',   'B2B', 'Packaging',     60, 100000000, 'active'),
  ('Andijon Super Market Tizimi','1111234504', '+998742006677', 'procurement@asm.uz',     'Andijon, Mustaqillik pr., 34',      'CUST-D004', 'legal',   'B2B', 'Retail',        14, 20000000,  'active'),
  ('Buxoro Ziyorat Lojaligi',    '1901234505', '+998652003344', 'orders@bukhara-zl.uz',  'Buxoro, Ark ko''ch., 2',            'CUST-D005', 'legal',   'B2B', 'Tourism',       30, 15000000,  'active'),
  ('Farg''ona Neft Mahsulotlari','2421234506', '+998732008811', 'print@fargona-neft.uz',  'Farg''ona, Sanoat ko''ch., 100',    'CUST-D006', 'legal',   'B2B', 'Energy',        45, 75000000,  'active')
) AS v(name, stir, phone, email, address, customer_code, customer_type, segment, industry, payment_terms_days, credit_limit, status)
WHERE NOT EXISTS (
  SELECT 1 FROM sd_customers WHERE customer_code = v.customer_code
);

-- ---------------------------------------------------------------------------
-- 2. MATERIAL_CARDS — Qog'oz/karton/bo'yoq turlari (demo)
-- ---------------------------------------------------------------------------
-- Mavjud: 21 ta (id 1-21). Yangi 10 ta qo'shamiz (kod bilan).
-- Idempotent: kod bo'yicha tekshiramiz.

INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, grammage, material_type, abc_segment, is_active)
SELECT v.kod, v.xom_ashyo, v.xom_ashyo_ru, v.unit_of_measure, v.category, v.grammage, v.material_type, v.abc_segment, true
FROM (VALUES
  ('CARD-GF-300',   'Gofrokarton 300g/m² (B-flyut)',      'Гофрокартон 300г/м² (В-флют)',       'm2',  'Gofrokarton',  300, 'raw_material', 'A'),
  ('CARD-GF-200',   'Gofrokarton 200g/m² (E-flyut)',      'Гофрокартон 200г/м² (Е-флют)',       'm2',  'Gofrokarton',  200, 'raw_material', 'A'),
  ('CARD-KR-350',   'Karton Kraft 350g/m²',               'Крафт-картон 350г/м²',               'm2',  'Karton',       350, 'raw_material', 'A'),
  ('CARD-KR-450',   'Karton Kraft 450g/m²',               'Крафт-картон 450г/м²',               'm2',  'Karton',       450, 'raw_material', 'B'),
  ('INK-UV-CYAN',   'UV bo''yoq Cyan 5kg',                'УФ-краска Cyan 5кг',                 'kg',  'Boyoq',        NULL, 'raw_material', 'A'),
  ('INK-UV-MAG',    'UV bo''yoq Magenta 5kg',             'УФ-краска Magenta 5кг',              'kg',  'Boyoq',        NULL, 'raw_material', 'A'),
  ('VANISH-MAT',    'Lak mat 20L',                        'Лак матовый 20л',                    'l',   'Lak',          NULL, 'raw_material', 'B'),
  ('VANISH-GLOS',   'Lak glyansli 20L',                   'Лак глянцевый 20л',                  'l',   'Lak',          NULL, 'raw_material', 'B'),
  ('FILM-BOPP-18',  'Plyonka BOPP 18mkm',                 'Плёнка BOPP 18мкм',                  'm',   'Plyonka',      NULL, 'raw_material', 'B'),
  ('PLATE-CTF',     'CTP plat (ofset, 0.3mm)',            'CTP-пластина (офсет, 0,3мм)',        'sht', 'Plat',         NULL, 'raw_material', 'C')
) AS v(kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, grammage, material_type, abc_segment)
WHERE NOT EXISTS (
  SELECT 1 FROM material_cards WHERE kod = v.kod
);

-- ---------------------------------------------------------------------------
-- 3. VENDORS — Yetkazib beruvchilar (demo)
-- ---------------------------------------------------------------------------
-- Mavjud: 15 ta (id 1-15). Yangi 5 ta qo'shamiz.
-- Idempotent: vendor_code bo'yicha tekshiramiz.

INSERT INTO vendors (vendor_code, name, name_ru, phone, email, address, currency, payment_terms, rating, is_active)
SELECT v.vendor_code, v.name, v.name_ru, v.phone, v.email, v.address, v.currency, v.payment_terms, v.rating, true
FROM (VALUES
  ('V-D001', 'Toshkent Qog''oz Zavodi',        'Ташкентский Бумажный Завод',  '+998712011234', 'sales@tqz.uz',        'Toshkent, Chilonzor',   'UZS', 'net30', 4.5),
  ('V-D002', 'Farg''ona Kimyo Kombinati',      'Ферганский Химкомбинат',       '+998732021234', 'info@fkk.uz',         'Farg''ona, Sanoat',     'UZS', 'net45', 4.0),
  ('V-D003', 'Samarqand Offset Plat MChJ',    'Самарканд Офсет Плат',          '+998662031234', 'plates@sop.uz',       'Samarqand',             'USD', 'net30', 4.2),
  ('V-D004', 'Drupa Supplies GmbH (UZ rep)',  'Drupa Supplies GmbH (UZ реп)', '+998712041234', 'uzrep@drupa.com',     'Toshkent, Mirzo-Ulug''bek', 'EUR', 'net60', 4.8),
  ('V-D005', 'Namangan Poligrafiya Xom Ashyo','Наманган Полиграф Сырьё',       '+998692051234', 'info@npxa.uz',        'Namangan',              'UZS', 'net30', 3.9)
) AS v(vendor_code, name, name_ru, phone, email, address, currency, payment_terms, rating)
WHERE NOT EXISTS (
  SELECT 1 FROM vendors WHERE vendor_code = v.vendor_code
);

-- ---------------------------------------------------------------------------
-- 4. EMPLOYEES — Demo xodimlar (faqat 10 ta kam bo'lsa qo'shamiz)
-- ---------------------------------------------------------------------------
-- Mavjud: 30 ta (id 2-31). Etarli — qo'shmaymiz.
-- Shuning uchun bu blok faqat mavjud holat uchun COUNT ni tasdiqlaydi.

DO $$
DECLARE
  emp_count INTEGER;
BEGIN
  SELECT count(*) INTO emp_count FROM employees WHERE deleted_at IS NULL;
  IF emp_count < 10 THEN
    RAISE NOTICE 'Employees < 10 (%), qo''shiladi', emp_count;
    -- Qo'shimcha xodimlar zarur bo'lsa shu yerda INSERT
    INSERT INTO employees (first_name, last_name, email, status, employment_status, tenant_id)
    SELECT v.fn, v.ln, v.em, 'active', 'active', 1
    FROM (VALUES
      ('Bobur',    'Azimov',    'bobur.a@europrint.uz'),
      ('Kamola',   'Yusupova',  'kamola.y@europrint.uz'),
      ('Sardor',   'Toshmatov', 'sardor.t@europrint.uz'),
      ('Mavluda',  'Karimova',  'mavluda.k@europrint.uz'),
      ('Ibrohim',  'Holmatov',  'ibrohim.h@europrint.uz'),
      ('Shahlo',   'Abdullayeva','shahlo.a@europrint.uz'),
      ('Dilshod',  'Normatov',  'dilshod.n@europrint.uz'),
      ('Gulnora',  'Mirzayeva', 'gulnora.m@europrint.uz'),
      ('Ulugbek',  'Razzaqov',  'ulugbek.r@europrint.uz'),
      ('Feruza',   'Sobirov',   'feruza.s@europrint.uz')
    ) AS v(fn, ln, em)
    WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = v.em);
  ELSE
    RAISE NOTICE 'Employees = % (etarli, qo''shilmaydi)', emp_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. VERIFICATION COUNTS
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  c_custs    INTEGER;
  c_mats     INTEGER;
  c_vendors  INTEGER;
  c_emps     INTEGER;
  c_accounts INTEGER;
BEGIN
  SELECT count(*) INTO c_custs    FROM sd_customers;
  SELECT count(*) INTO c_mats     FROM material_cards;
  SELECT count(*) INTO c_vendors  FROM vendors;
  SELECT count(*) INTO c_emps     FROM employees WHERE deleted_at IS NULL;
  SELECT count(*) INTO c_accounts FROM accounts;
  RAISE NOTICE '=== SEED YAKUNIY HISOBOT ===';
  RAISE NOTICE 'sd_customers   : %', c_custs;
  RAISE NOTICE 'material_cards : %', c_mats;
  RAISE NOTICE 'vendors        : %', c_vendors;
  RAISE NOTICE 'employees      : %', c_emps;
  RAISE NOTICE 'accounts       : %', c_accounts;
END $$;

COMMIT;

-- =============================================================================
-- ID REFERENCE (downstream agentlar uchun)
-- =============================================================================
-- sd_customers (DEMO yangi):
--   CUST-D001 = 'Toshkent Qog'ozchi MChJ'
--   CUST-D002 = 'Samarqand Ofset Nashr'
--   CUST-D003 = 'UzPack Qadoqlash OAJ'
--   CUST-D004 = 'Andijon Super Market Tizimi'
--   CUST-D005 = 'Buxoro Ziyorat Lojaligi'
--   CUST-D006 = 'Farg'ona Neft Mahsulotlari'
--
-- material_cards (DEMO yangi):
--   CARD-GF-300, CARD-GF-200, CARD-KR-350, CARD-KR-450
--   INK-UV-CYAN, INK-UV-MAG, VANISH-MAT, VANISH-GLOS
--   FILM-BOPP-18, PLATE-CTF
--
-- vendors (DEMO yangi):
--   V-D001 = 'Toshkent Qog'oz Zavodi'
--   V-D002 = 'Farg'ona Kimyo Kombinati'
--   V-D003 = 'Samarqand Offset Plat MChJ'
--   V-D004 = 'Drupa Supplies GmbH (UZ rep)'
--   V-D005 = 'Namangan Poligrafiya Xom Ashyo'
-- =============================================================================
