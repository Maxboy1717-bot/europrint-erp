-- ============================================================================
-- Eski WH-* omborlarni nofaol qilish + 9 ta standart omborni tasdiqlash
-- ============================================================================
-- MAQSAD:
--   POS Monitor va ERP "Ombor Boshqaruvi" bitta omborlar to'plamini ko'rsatsin.
--   Faqat 9 ta rasmiy ombor faol bo'ladi: RM-MAIN, RM-ROLLS, FG-MAIN, WIP-MAIN,
--   SCRAP-MAIN, QC-HOLD, TOOL-MAIN, MRO-MAIN, MRO-STORE.
--
-- USULI:
--   Eski WH-* omborlar O'CHIRILMAYDI (ma'lumotlar saqlanadi). Faqat `is_active`
--   = false bo'ladi, shunda POS Monitor va ERP ularni ko'rsatmaydi, lekin
--   tarixiy harakatlar va stok ma'lumotlari saqlanib qoladi.
--
-- IDEMPOTENT: Ushbu fayl bir necha marta ishga tushirilishi mumkin.
-- ============================================================================

DO $$
DECLARE
  has_warehouses BOOLEAN;
  deactivated_count INTEGER;
BEGIN
  -- 1) warehouses jadvali bormi tekshirish
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses')
    INTO has_warehouses;

  IF NOT has_warehouses THEN
    RAISE NOTICE 'warehouses jadvali topilmadi — cleanup o''tkazib yuborildi';
    RETURN;
  END IF;

  -- 2) Eski WH-* omborlarni nofaol qilish
  UPDATE warehouses
     SET is_active = false
   WHERE code LIKE 'WH-%'
     AND is_active = true;

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RAISE NOTICE 'Nofaol qilingan WH-* omborlar soni: %', deactivated_count;
END $$;

-- ─── 9 ta standart omborni qayta tasdiqlash (idempotent) ────────────────────
-- Bu blok warehouse-9-types-seed.sql bilan bir xil — agar omborlar mavjud
-- bo'lsa, hech narsa qilmaydi; bo'lmasa qo'shadi.

DO $$
DECLARE
  has_warehouses BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses')
    INTO has_warehouses;

  IF NOT has_warehouses THEN
    RETURN;
  END IF;

  -- 1. RM-MAIN — Xom Ashyo Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'RM-MAIN', 'Xom Ashyo Ombori', 'raw_material', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-MAIN');

  -- 2. RM-ROLLS — Rulon Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'RM-ROLLS', 'Rulon Ombori', 'raw_material', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-ROLLS');

  -- 3. FG-MAIN — Tayyor Mahsulot Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'FG-MAIN', 'Tayyor Mahsulot Ombori', 'finished_goods', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'FG-MAIN');

  -- 4. WIP-MAIN — Yarim Tayyor Mahsulot
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'WIP-MAIN', 'Yarim Tayyor Mahsulot', 'wip', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'WIP-MAIN');

  -- 5. SCRAP-MAIN — Brak Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'SCRAP-MAIN', 'Brak Ombori', 'scrap', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'SCRAP-MAIN');

  -- 6. QC-HOLD — Karantin Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'QC-HOLD', 'Karantin Ombori', 'quarantine', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'QC-HOLD');

  -- 7. TOOL-MAIN — Asbob-Uskuna Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'TOOL-MAIN', 'Asbob-Uskuna Ombori', 'tools', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'TOOL-MAIN');

  -- 8. MRO-MAIN — Xo'jalik Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'MRO-MAIN', 'Xo''jalik Ombori', 'household', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-MAIN');

  -- 9. MRO-STORE — MRO Ombori
  INSERT INTO warehouses (code, name, type, is_active, created_at)
  SELECT 'MRO-STORE', 'MRO Ombori', 'mro', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-STORE');

  RAISE NOTICE '9 ta standart ombor tasdiqlandi (RM-MAIN..MRO-STORE)';
END $$;

-- ─── Mavjud 9 ta omborni qayta faollashtirish (agar nofaol bo'lib qolgan) ────
DO $$
BEGIN
  UPDATE warehouses
     SET is_active = true
   WHERE code IN ('RM-MAIN','RM-ROLLS','FG-MAIN','WIP-MAIN','SCRAP-MAIN',
                  'QC-HOLD','TOOL-MAIN','MRO-MAIN','MRO-STORE')
     AND (is_active IS NULL OR is_active = false);
END $$;

-- ─── Yakuniy holatni tekshirish ─────────────────────────────────────────────
DO $$
DECLARE
  active_count INTEGER;
  inactive_old_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
    FROM warehouses
   WHERE is_active = true
     AND code IN ('RM-MAIN','RM-ROLLS','FG-MAIN','WIP-MAIN','SCRAP-MAIN',
                  'QC-HOLD','TOOL-MAIN','MRO-MAIN','MRO-STORE');

  SELECT COUNT(*) INTO inactive_old_count
    FROM warehouses
   WHERE code LIKE 'WH-%'
     AND is_active = false;

  RAISE NOTICE '── Yakuniy holat ──────────────────────';
  RAISE NOTICE 'Faol standart omborlar (9 dan): %', active_count;
  RAISE NOTICE 'Nofaol eski WH-* omborlar: %', inactive_old_count;
  RAISE NOTICE '───────────────────────────────────────';
END $$;

-- ============================================================================
-- TAYYOR. Endi POS Monitor va ERP Ombor moduli bir xil 9 ta omborni
-- ko'rsatadi: RM-MAIN, RM-ROLLS, FG-MAIN, WIP-MAIN, SCRAP-MAIN, QC-HOLD,
-- TOOL-MAIN, MRO-MAIN, MRO-STORE.
-- ============================================================================
