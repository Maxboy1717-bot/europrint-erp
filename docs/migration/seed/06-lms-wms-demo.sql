-- =============================================================
-- DEMO SEED: LMS (kurslar + enrollmentlar) + WMS (stock + harakatlar)
-- Maqsad: dashboard vizyon demo ma'lumotlari
-- Muallif: Claude (subagent), 2026-06-20
-- IDEMPOTENT: ON CONFLICT DO NOTHING
-- Kanonik jadvallar: courses, modules, lessons, enrollments
-- lms_* = VIEW over canonical tables
-- =============================================================

BEGIN;

-- ============================================================
-- (A) LMS: 5 kurs, modullar, darslar, 14 enrollment
-- ============================================================

-- 1. Kurslar (courses jadvaliga INSERT — lms_courses=VIEW)
-- NOT NULL: id(serial), code, title, is_required(def:false), level(def:'beginner'),
--           created_at(def:now()), status(def:'active')

INSERT INTO courses
  (code, title, title_ru, description, category,
   difficulty_level, duration_hours, passing_score,
   is_mandatory, is_active, author_id, status, created_at)
VALUES
  ('LMS-OHS-01',
   'Mehnat muhofazasi va xavfsizlik',
   'Охрана труда и безопасность',
   'Korxonadagi xavfsizlik qoidalari, yong''in xavfsizligi va shaxsiy himoya vositalari',
   'Xavfsizlik', 'beginner', 4, 80,
   true, true, 1, 'active', NOW()),

  ('LMS-ERP-01',
   'ERP tizimida ishlash asoslari',
   'Основы работы в ERP системе',
   'EuroPrint ERP modullaridan foydalanish: buyurtmalar, omborxona, moliya',
   'IT va Tizimlar', 'beginner', 6, 75,
   true, true, 1, 'active', NOW()),

  ('LMS-PRINT-01',
   'Ofset bosma texnologiyasi',
   'Технология офсетной печати',
   'Ofset stanogida ishlash, rang kalibratsiyasi, plat tayyorlash',
   'Ishlab chiqarish', 'intermediate', 8, 85,
   false, true, 1, 'active', NOW()),

  ('LMS-QC-01',
   'Sifat nazorati asoslari',
   'Основы контроля качества',
   'Mahsulot sifatini tekshirish, nuqsonlarni aniqlash, ISO standartlari',
   'Sifat', 'intermediate', 5, 80,
   false, true, 1, 'active', NOW()),

  ('LMS-LEAD-01',
   'Jamoa boshqaruvi va rahbarlik',
   'Управление командой и лидерство',
   'Vysotskiy 7 model, smena boshqaruvi, KPI va motivatsiya',
   'Boshqaruv', 'advanced', 10, 90,
   false, true, 1, 'active', NOW())
ON CONFLICT (code) DO NOTHING;

-- Kurs ID larini aniqlash
DO $$
DECLARE
  c1_id INT; c2_id INT; c3_id INT; c4_id INT; c5_id INT;
BEGIN
  SELECT id INTO c1_id FROM courses WHERE code='LMS-OHS-01';
  SELECT id INTO c2_id FROM courses WHERE code='LMS-ERP-01';
  SELECT id INTO c3_id FROM courses WHERE code='LMS-PRINT-01';
  SELECT id INTO c4_id FROM courses WHERE code='LMS-QC-01';
  SELECT id INTO c5_id FROM courses WHERE code='LMS-LEAD-01';

  -- 2. Modullar (modules jadvaliga) NOT NULL: id(serial), course_id, title, order, created_at
  INSERT INTO modules (course_id, title, title_ru, "order", created_at)
  VALUES
    -- Kurs 1: Xavfsizlik
    (c1_id, '1-modul: Asosiy xavfsizlik qoidalari', '1-модуль: Основные правила безопасности', 1, NOW()),
    (c1_id, '2-modul: Yong''in xavfsizligi',         '2-модуль: Пожарная безопасность',         2, NOW()),
    -- Kurs 2: ERP
    (c2_id, '1-modul: Tizimga kirish va navigatsiya', '1-модуль: Вход и навигация',    1, NOW()),
    (c2_id, '2-modul: Buyurtmalar moduli',            '2-модуль: Модуль заказов',      2, NOW()),
    -- Kurs 3: Bosma
    (c3_id, '1-modul: Ofset stanogi tuzilishi', '1-модуль: Устройство офсетного станка', 1, NOW()),
    (c3_id, '2-modul: Rang kalibratsiyasi',     '2-модуль: Цветовая калибровка',        2, NOW()),
    -- Kurs 4: Sifat
    (c4_id, '1-modul: Vizual tekshiruv', '1-модуль: Визуальная проверка', 1, NOW()),
    -- Kurs 5: Rahbarlik
    (c5_id, '1-modul: Vysotskiy 7 model', '1-модуль: Модель Высоцкого 7', 1, NOW()),
    (c5_id, '2-modul: Smena boshqaruvi',  '2-модуль: Управление сменой',  2, NOW())
  ON CONFLICT DO NOTHING;

  -- 3. Darslar (lessons jadvaliga) NOT NULL: id(serial), module_id, type, title, order, created_at
  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Shaxsiy himoya vositalari (SHV)', 'Средства индивидуальной защиты (СИЗ)',
         1, 'video', 20, 1, true, NOW()
  FROM modules m WHERE m.course_id=c1_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'text', 'Ish joyida xavfsiz harakat qoidalari', 'Правила безопасного поведения на рабочем месте',
         2, 'text', 15, 2, true, NOW()
  FROM modules m WHERE m.course_id=c1_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Yong''in o''chirgich turlari va qo''llash', 'Типы огнетушителей и применение',
         1, 'video', 25, 1, true, NOW()
  FROM modules m WHERE m.course_id=c1_id AND m."order"=2
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'text', 'Evakuatsiya yo''llari', 'Пути эвакуации',
         2, 'text', 10, 2, true, NOW()
  FROM modules m WHERE m.course_id=c1_id AND m."order"=2
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Tizimga login va bosh sahifa', 'Вход в систему и главная страница',
         1, 'video', 15, 1, true, NOW()
  FROM modules m WHERE m.course_id=c2_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'text', 'Menyu va modullar navigatsiyasi', 'Навигация по меню и модулям',
         2, 'text', 20, 2, true, NOW()
  FROM modules m WHERE m.course_id=c2_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Yangi buyurtma yaratish', 'Создание нового заказа',
         1, 'video', 30, 1, true, NOW()
  FROM modules m WHERE m.course_id=c2_id AND m."order"=2
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Ofset stanogi qismlari', 'Части офсетного станка',
         1, 'video', 40, 1, true, NOW()
  FROM modules m WHERE m.course_id=c3_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'ICC profil va rang kalibratsiyasi', 'ICC-профиль и калибровка цвета',
         1, 'video', 35, 1, true, NOW()
  FROM modules m WHERE m.course_id=c3_id AND m."order"=2
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Nuqsonlarni vizual aniqlash', 'Визуальное обнаружение дефектов',
         1, 'video', 25, 1, true, NOW()
  FROM modules m WHERE m.course_id=c4_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'text', 'Tekshiruv varaqasi to''ldirish', 'Заполнение контрольного листа',
         2, 'text', 20, 2, true, NOW()
  FROM modules m WHERE m.course_id=c4_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'text', 'Vysotskiy 7-otdeleniye tuzilmasi', 'Структура Высоцкого 7-отделение',
         1, 'text', 30, 1, true, NOW()
  FROM modules m WHERE m.course_id=c5_id AND m."order"=1
  ON CONFLICT DO NOTHING;

  INSERT INTO lessons (module_id, type, title, title_ru, "order", content_type, duration_minutes, sort_order, is_active, created_at)
  SELECT m.id, 'video', 'Smena qabul qilish va topshirish', 'Приём и сдача смены',
         1, 'video', 25, 1, true, NOW()
  FROM modules m WHERE m.course_id=c5_id AND m."order"=2
  ON CONFLICT DO NOTHING;

  -- 4. Enrollmentlar (enrollments jadvaliga)
  -- NOT NULL: id(serial), employee_id, course_id, created_at, updated_at
  INSERT INTO enrollments
    (employee_id, course_id, enrolled_at, started_at, completed_at,
     progress_percent, status, score, created_at, updated_at)
  VALUES
    -- Kurs 1 (Xavfsizlik - majburiy)
    (2, c1_id, NOW()-INTERVAL '30d', NOW()-INTERVAL '28d', NOW()-INTERVAL '20d', 100, 'completed', 92, NOW(), NOW()),
    (3, c1_id, NOW()-INTERVAL '30d', NOW()-INTERVAL '29d', NOW()-INTERVAL '22d', 100, 'completed', 88, NOW(), NOW()),
    (4, c1_id, NOW()-INTERVAL '25d', NOW()-INTERVAL '24d', NULL,                  60, 'in_progress', NULL, NOW(), NOW()),
    (5, c1_id, NOW()-INTERVAL '20d', NULL,                 NULL,                   0, 'enrolled',    NULL, NOW(), NOW()),
    -- Kurs 2 (ERP)
    (2, c2_id, NOW()-INTERVAL '25d', NOW()-INTERVAL '23d', NOW()-INTERVAL '10d', 100, 'completed',   95, NOW(), NOW()),
    (6, c2_id, NOW()-INTERVAL '15d', NOW()-INTERVAL '14d', NULL,                  45, 'in_progress', NULL, NOW(), NOW()),
    (7, c2_id, NOW()-INTERVAL '10d', NOW()-INTERVAL '9d',  NULL,                  30, 'in_progress', NULL, NOW(), NOW()),
    -- Kurs 3 (Bosma texnologiya)
    (8, c3_id, NOW()-INTERVAL '20d', NOW()-INTERVAL '18d', NOW()-INTERVAL '5d',  100, 'completed',   78, NOW(), NOW()),
    (9, c3_id, NOW()-INTERVAL '18d', NOW()-INTERVAL '17d', NULL,                  70, 'in_progress', NULL, NOW(), NOW()),
    -- Kurs 4 (Sifat nazorati)
    (10, c4_id, NOW()-INTERVAL '12d', NULL, NULL,                                  0, 'enrolled',    NULL, NOW(), NOW()),
    -- Kurs 5 (Rahbarlik)
    (2,  c5_id, NOW()-INTERVAL '8d', NOW()-INTERVAL '7d', NULL,                   20, 'in_progress', NULL, NOW(), NOW()),
    (11, c1_id, NOW()-INTERVAL '15d', NOW()-INTERVAL '14d', NOW()-INTERVAL '8d', 100, 'completed',   85, NOW(), NOW()),
    (12, c2_id, NOW()-INTERVAL '5d',  NOW()-INTERVAL '4d',  NULL,                 15, 'in_progress', NULL, NOW(), NOW()),
    (13, c3_id, NOW()-INTERVAL '10d', NULL,                  NULL,                  0, 'enrolled',    NULL, NOW(), NOW())
  ON CONFLICT DO NOTHING;

END $$;


-- ============================================================
-- (B) WMS: warehouse_stock boshlang'ich qoldiqlar (10 pozitsiya)
--          + wms_transactions (2 mustaqil harakat)
-- Warehouse IDs: 11=Xom Ashyo Ombori, 12=Rulon Ombori
-- Material IDs 29-38 (material_cards dan tasdiqlangan)
-- ============================================================

-- 5. Boshlang'ich qoldiqlar
INSERT INTO warehouse_stock
  (warehouse_id, material_id, quantity, reserved_quantity, available_quantity,
   unit_of_measure, reorder_point, last_updated_at, created_at)
VALUES
  (11, 29, 25.000,   5.000,  20.000, 'kg',  10.000, NOW(), NOW()),   -- UV Cyan
  (11, 30, 18.500,   3.000,  15.500, 'kg',  10.000, NOW(), NOW()),   -- UV Magenta
  (11, 31, 150.000, 20.000, 130.000, 'sht', 50.000, NOW(), NOW()),   -- CTP Plat
  (11, 32,  60.000, 10.000,  50.000, 'l',   20.000, NOW(), NOW()),   -- Glyansli lak
  (11, 38,  40.000,  5.000,  35.000, 'l',   20.000, NOW(), NOW()),   -- Mat lak
  (12, 33, 800.000,100.000, 700.000, 'm2', 200.000, NOW(), NOW()),   -- Kraft 350
  (12, 34, 650.000, 50.000, 600.000, 'm2', 150.000, NOW(), NOW()),   -- Gofra 200 E
  (12, 35, 400.000, 80.000, 320.000, 'm2', 100.000, NOW(), NOW()),   -- Gofra 300 B
  (12, 36,1200.000,200.000,1000.000, 'm',  300.000, NOW(), NOW()),   -- BOPP 18mkm
  (12, 37, 300.000, 30.000, 270.000, 'm2',  80.000, NOW(), NOW())    -- Kraft 450
ON CONFLICT (warehouse_id, material_id) DO UPDATE
  SET quantity           = EXCLUDED.quantity,
      reserved_quantity  = EXCLUDED.reserved_quantity,
      available_quantity = EXCLUDED.available_quantity,
      last_updated_at    = NOW();

-- 6. WMS harakatlari (wms_transactions) — mustaqil demo
INSERT INTO wms_transactions
  (warehouse_id, material_id, type, quantity, unit_cost, batch_number,
   notes, created_by, created_at)
VALUES
  (11, 32, 'receipt', 40.000, 85000.00, 'BATCH-LAK-2026-06',
   'DEMO: Yetkazib beruvchidan lak glyansli 40L qabul qilindi. Hujjat: Kirim-2026-06-18',
   2, NOW() - INTERVAL '2 days'),

  (12, 34, 'issue', 150.000, 12500.00, 'BATCH-GF-2026-05',
   'DEMO: Gofrokarton 200g/m² ishlab chiqarishga (buyurtma BOX-2026-0145 uchun)',
   2, NOW() - INTERVAL '1 day')
;

COMMIT;

-- Natija tekshiruvi
SELECT 'courses (lms_courses view orqali)' as tbl, COUNT(*) as cnt FROM courses WHERE code LIKE 'LMS-%'
UNION ALL SELECT 'modules', COUNT(*) FROM modules WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'LMS-%')
UNION ALL SELECT 'lessons', COUNT(*) FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'LMS-%'))
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'LMS-%')
UNION ALL SELECT 'warehouse_stock (material 29-38)', COUNT(*) FROM warehouse_stock WHERE material_id BETWEEN 29 AND 38
UNION ALL SELECT 'wms_transactions (demo)', COUNT(*) FROM wms_transactions
ORDER BY tbl;
