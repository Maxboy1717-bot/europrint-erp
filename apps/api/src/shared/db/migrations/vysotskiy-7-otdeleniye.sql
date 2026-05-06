-- ============================================================================
-- Migration: vysotskiy-7-otdeleniye.sql
--
-- Maqsad: PRD'ga muvofiq Vysotskiy 7 otdeleniye tuzilmasini joriy etish.
--
-- Hierarchy 6 daraja:
--   0. Egasi (Owner)
--   1. Bosh Direktor (CEO)
--   2. 7 Otdeleniye (Vysotskiy)
--   3. Otdellar (Departments)
--   4. Sektsiyalar (Sections)
--   5. Sektorlar (Sectors)
--
-- 7 Otdeleniye:
--   1. Qurilish bo'linmasi   — HR, Marketing, Kommunikatsiyalar
--   2. Tarqatish bo'linmasi  — Savdo, CRM, Mijozlar xizmati
--   3. Ishlab chiqarish      — Offset, Flexo, Digital, Prepress
--   4. Texnik ta'minot       — Uskunalar, IT, Xom ashyo
--   5. Moliya                — Buxgalteriya, Kassa, Budjet
--   6. Rivojlanish           — IT/ERP, Marketing strategiyasi, Innovatsiya
--   7. Ma'muriy bo'lim       — Egasi ofisi, Bosh direktor ofisi, Rasmiy masalalar
-- ============================================================================

-- ─── 1. otdeleniye_id ustunini qo'shish ────────────────────────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS otdeleniye_id INTEGER;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS otdeleniye_code VARCHAR(20);

-- ─── 2. 6-daraja hierarchy uchun node_type kengaytirish ────────────────────
-- Hozirgi: owner, top_director, director, department
-- Yangi:   owner, ceo, otdeleniye, department, section, sector

-- ─── 3. Mavjud Ma'muriyat (id=19) — Egasi (level 0) qoldiramiz ─────────────
-- Bu eng yuqori shaxs (kompaniya egasi)

-- ─── 4. Yangi: 7 ta Otdeleniye qo'shish (level 2) ──────────────────────────
-- ID'larni yuqoridan boshlaymiz (existing'larni buzmaslik uchun)

DO $$
DECLARE
  ceo_dept_id INTEGER;
  otd_qurilish_id INTEGER;
  otd_tarqatish_id INTEGER;
  otd_ishlab_chiqarish_id INTEGER;
  otd_texnik_id INTEGER;
  otd_moliya_id INTEGER;
  otd_rivojlanish_id INTEGER;
  otd_mamuriy_id INTEGER;
BEGIN
  -- Bosh Direktor ofisi → Level 1 (CEO)
  -- Mavjud id=20 ga update
  UPDATE org_departments
  SET level = 1, hierarchy_level = 1, node_type = 'ceo', otdeleniye_code = 'CEO'
  WHERE id = 20;
  ceo_dept_id := 20;

  -- 7 Otdeleniye — yangi yozuvlar (faqat hali yo'q bo'lsa)

  -- 1. Qurilish bo'linmasi (HR, Marketing, Kommunikatsiyalar)
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Qurilish bo''linmasi', 'Отделение построения', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(330 70% 55%)', 'Users', 100, true, 'BUILD', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'BUILD')
  RETURNING id INTO otd_qurilish_id;
  IF otd_qurilish_id IS NULL THEN
    SELECT id INTO otd_qurilish_id FROM org_departments WHERE otdeleniye_code = 'BUILD';
  END IF;

  -- 2. Tarqatish bo'linmasi
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Tarqatish bo''linmasi', 'Отделение распространения', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(140 70% 45%)', 'TrendingUp', 200, true, 'DIST', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'DIST')
  RETURNING id INTO otd_tarqatish_id;
  IF otd_tarqatish_id IS NULL THEN
    SELECT id INTO otd_tarqatish_id FROM org_departments WHERE otdeleniye_code = 'DIST';
  END IF;

  -- 3. Ishlab chiqarish bo'linmasi
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Ishlab chiqarish bo''linmasi', 'Отделение производства', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(0 75% 55%)', 'Factory', 300, true, 'PROD', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'PROD')
  RETURNING id INTO otd_ishlab_chiqarish_id;
  IF otd_ishlab_chiqarish_id IS NULL THEN
    SELECT id INTO otd_ishlab_chiqarish_id FROM org_departments WHERE otdeleniye_code = 'PROD';
  END IF;

  -- 4. Texnik ta'minot bo'linmasi
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Texnik ta''minot', 'Техническое обеспечение', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(50 80% 50%)', 'Wrench', 400, true, 'TECH', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'TECH')
  RETURNING id INTO otd_texnik_id;
  IF otd_texnik_id IS NULL THEN
    SELECT id INTO otd_texnik_id FROM org_departments WHERE otdeleniye_code = 'TECH';
  END IF;

  -- 5. Moliya bo'linmasi
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Moliya bo''linmasi', 'Финансовое отделение', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(200 80% 50%)', 'DollarSign', 500, true, 'FIN', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'FIN')
  RETURNING id INTO otd_moliya_id;
  IF otd_moliya_id IS NULL THEN
    SELECT id INTO otd_moliya_id FROM org_departments WHERE otdeleniye_code = 'FIN';
  END IF;

  -- 6. Rivojlanish bo'linmasi
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Rivojlanish bo''linmasi', 'Отделение развития', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(260 70% 55%)', 'Rocket', 600, true, 'DEV', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'DEV')
  RETURNING id INTO otd_rivojlanish_id;
  IF otd_rivojlanish_id IS NULL THEN
    SELECT id INTO otd_rivojlanish_id FROM org_departments WHERE otdeleniye_code = 'DEV';
  END IF;

  -- 7. Ma'muriy bo'lim
  INSERT INTO org_departments (name, name_ru, parent_id, level, hierarchy_level, node_type,
    color, icon, sort_order, is_active, otdeleniye_code, created_at)
  SELECT 'Ma''muriy bo''lim', 'Административное отделение', ceo_dept_id, 2, 2, 'otdeleniye',
    'hsl(220 70% 50%)', 'Crown', 700, true, 'ADMIN', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM org_departments WHERE otdeleniye_code = 'ADMIN')
  RETURNING id INTO otd_mamuriy_id;
  IF otd_mamuriy_id IS NULL THEN
    SELECT id INTO otd_mamuriy_id FROM org_departments WHERE otdeleniye_code = 'ADMIN';
  END IF;

  -- ─── 5. Mavjud bo'limlarni 7 otdeleniyaga tayinlash ──────────────────────
  -- Kadrlar bo'limi (id=21) → Qurilish (HR)
  UPDATE org_departments SET parent_id = otd_qurilish_id, otdeleniye_id = otd_qurilish_id, level = 3, hierarchy_level = 3
    WHERE id = 21;
  -- Yollash sektsiyasi (id=22) → Kadrlar bo'limi ostida (level 4)
  UPDATE org_departments SET otdeleniye_id = otd_qurilish_id, level = 4, hierarchy_level = 4, node_type = 'section'
    WHERE id = 22;
  -- O'qitish bo'limi (id=23) → Qurilish (HR talim)
  UPDATE org_departments SET parent_id = otd_qurilish_id, otdeleniye_id = otd_qurilish_id, level = 3, hierarchy_level = 3
    WHERE id = 23;
  -- Marketing (id=24) → Qurilish
  UPDATE org_departments SET parent_id = otd_qurilish_id, otdeleniye_id = otd_qurilish_id, level = 3, hierarchy_level = 3
    WHERE id = 24;
  -- PR va aloqalar (id=35) → Qurilish
  UPDATE org_departments SET parent_id = otd_qurilish_id, otdeleniye_id = otd_qurilish_id, level = 3, hierarchy_level = 3
    WHERE id = 35;

  -- Sotuvlar (id=25) → Tarqatish
  UPDATE org_departments SET parent_id = otd_tarqatish_id, otdeleniye_id = otd_tarqatish_id, level = 3, hierarchy_level = 3
    WHERE id = 25;
  -- Hamkorlar (id=36) → Tarqatish
  UPDATE org_departments SET parent_id = otd_tarqatish_id, otdeleniye_id = otd_tarqatish_id, level = 3, hierarchy_level = 3
    WHERE id = 36;
  -- Yetkazib berish (id=33) → Tarqatish
  UPDATE org_departments SET parent_id = otd_tarqatish_id, otdeleniye_id = otd_tarqatish_id, level = 3, hierarchy_level = 3
    WHERE id = 33;

  -- Ishlab chiqarish (id=28) → Ishlab chiqarish bo'linmasi (top-level dept)
  UPDATE org_departments SET parent_id = otd_ishlab_chiqarish_id, otdeleniye_id = otd_ishlab_chiqarish_id, level = 3, hierarchy_level = 3
    WHERE id = 28;
  -- Flekso, Ofset, Preprint sexlari → Ishlab chiqarish, level 4 (sex)
  UPDATE org_departments SET otdeleniye_id = otd_ishlab_chiqarish_id, level = 4, hierarchy_level = 4, node_type = 'section'
    WHERE id IN (29, 30, 31);
  -- Sifat nazorati (id=34) → Ishlab chiqarish
  UPDATE org_departments SET parent_id = otd_ishlab_chiqarish_id, otdeleniye_id = otd_ishlab_chiqarish_id, level = 3, hierarchy_level = 3
    WHERE id = 34;
  -- Ombor (id=32) → Ishlab chiqarish
  UPDATE org_departments SET parent_id = otd_ishlab_chiqarish_id, otdeleniye_id = otd_ishlab_chiqarish_id, level = 3, hierarchy_level = 3
    WHERE id = 32;

  -- Moliya (id=26) → Moliya bo'linmasi
  UPDATE org_departments SET parent_id = otd_moliya_id, otdeleniye_id = otd_moliya_id, level = 3, hierarchy_level = 3
    WHERE id = 26;
  -- Buxgalteriya (id=27) → Moliya, level 4
  UPDATE org_departments SET otdeleniye_id = otd_moliya_id, level = 4, hierarchy_level = 4, node_type = 'section'
    WHERE id = 27;

  -- Bosh Direktor ofisi sub'lari (yo'q hozircha)
  -- Ma'muriyat (id=19, level 0) — Egasi
  UPDATE org_departments SET node_type = 'owner' WHERE id = 19;
END $$;

-- ─── 6. Index'lar ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_otdeleniye ON org_departments(otdeleniye_id) WHERE otdeleniye_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_otdeleniye_code ON org_departments(otdeleniye_code) WHERE otdeleniye_code IS NOT NULL;

-- ─── 7. Verify ──────────────────────────────────────────────────────────────
SELECT level, COUNT(*) AS dept_count
FROM org_departments
WHERE is_active = true
GROUP BY level
ORDER BY level;

SELECT id, level, node_type, name, otdeleniye_code, parent_id
FROM org_departments
WHERE is_active = true
ORDER BY level, sort_order, id;
