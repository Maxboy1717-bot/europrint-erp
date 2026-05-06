-- ============================================================================
-- 9 ta standart ombor — EuroPrint ERP
-- ============================================================================
-- Sidebar'da ko'rsatilgan 9 ta ombor turi avtomatik yaratiladi.
-- Har bir ombor o'z kodi va turi bilan, POS Monitor ham shu ma'lumotlardan
-- foydalanadi.
-- ============================================================================

DO $$
DECLARE
  has_warehouses BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses')
    INTO has_warehouses;

  IF NOT has_warehouses THEN
    RAISE NOTICE 'warehouses jadvali topilmadi — seed o''tkazib yuborildi';
    RETURN;
  END IF;

  -- Mavjud bo'lmasa qo'shish (ON CONFLICT — code unique bo'lmasa ham xavfsiz)
  -- 1. RM-MAIN — Xom Ashyo
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'RM-MAIN', 'Xom Ashyo Ombori', 'raw_material', true, 'Asosiy bino, 1-qavat', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-MAIN');

  -- 2. RM-ROLLS — Rulon Ombori
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'RM-ROLLS', 'Rulon Ombori', 'raw_material', true, 'Asosiy bino, 1-qavat, B-blok', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-ROLLS');

  -- 3. FG-MAIN — Tayyor Mahsulot
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'FG-MAIN', 'Tayyor Mahsulot Ombori', 'finished_goods', true, 'Asosiy bino, 2-qavat', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'FG-MAIN');

  -- 4. WIP-MAIN — Yarim Tayyor
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'WIP-MAIN', 'Yarim Tayyor Mahsulot', 'wip', true, 'Ishlab chiqarish sexi', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'WIP-MAIN');

  -- 5. SCRAP-MAIN — Brak Ombori
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'SCRAP-MAIN', 'Brak Ombori', 'scrap', true, 'Yordamchi bino, 1-qavat', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'SCRAP-MAIN');

  -- 6. QC-HOLD — Karantin Ombori
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'QC-HOLD', 'Karantin Ombori', 'quarantine', true, 'Qabul zonasi yonida', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'QC-HOLD');

  -- 7. TOOL-MAIN — Asbob Uskuna
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'TOOL-MAIN', 'Asbob-Uskuna Ombori', 'tools', true, 'Texnik xizmat zonasi', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'TOOL-MAIN');

  -- 8. MRO-MAIN — Xo'jalik Ombori
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'MRO-MAIN', 'Xo''jalik Ombori', 'household', true, 'Yordamchi bino', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-MAIN');

  -- 9. MRO-STORE — MRO Ombori (Maintenance, Repair, Operations)
  INSERT INTO warehouses (code, name, type, is_active, address, created_at, updated_at)
  SELECT 'MRO-STORE', 'MRO Ombori', 'mro', true, 'Texnik xizmat sexi', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-STORE');

  RAISE NOTICE '9 ta standart ombor seed muvaffaqiyatli';
END $$;

-- ─── name_ru bo'sh bo'lsa default qiymat ────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'warehouses' AND column_name = 'name_ru') THEN
    UPDATE warehouses SET name_ru = COALESCE(name_ru, name) WHERE name_ru IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 9 standart warehouse seed completed
-- ============================================================================
