-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
-- =============================================================================
-- W4-MATERIAL-LIFE — Material hayot-tsikli atributlari (OMBOR vizyoni)
--
-- Vizyon bo'shliqlari (faqat ADDITIVE — Q-46: mavjud WMS dvigateli buzilmaydi):
--   EP-WMS-101  substitute/analog ruxsati          → material_substitutes jadval
--   EP-WMS-125  qaytib-ishlatish (vtorichka) chala  → material_cards.is_recyclable
--                rulon sifat-belgili                   + warehouse_stock.recycled_grade
--   EP-WMS-126  material yoshi/eskirish signali       → material_cards.age_alert_days
--                (muddatsizga ham)
--   EP-WMS-128  bo'yoq/kley/lak maxsus-saqlash        → material_cards.hazard_class
--                xavf-zona                              + storage_condition
--   EP-WMS-123  bizniki ╳ mijoz-mol (davalcheskiy)    → material_cards.owner_type
--                                                        + warehouse_stock.owner_type
--   EP-WMS-086  poddon (pallet) birligi               → material_cards.pallet_unit_qty
--   EP-WMS-130  namuna/probnik chiqim alohida         → material_cards.is_sample
--
-- ⚠️ Q-40 (fabrikatsiya taqiq): bu migration FAQAT struktura qo'shadi. Hech qanday
--   real qiymat (hazard_class, age_alert_days, owner_type) seed QILINMAYDI — ular
--   egasi/operator master-data orqali kiritadi (default = neytral: own/NULL/FALSE).
--
-- Faqat ALTER ... ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT EXISTS +
-- CREATE INDEX IF NOT EXISTS. DESTRUCTIVE (DROP / type→VIEW) YO'Q.
-- =============================================================================

-- =============================================================================
-- 1) material_cards — material-karta darajasidagi hayot-tsikli atributlari.
--    (karta = "to'g'ri material ta'rifi"; bu atributlar har bir stock qatoriga
--     emas, material TURIga tegishli — shu sabab kartada.)
-- =============================================================================

-- 1.1  Egalik turi (EP-WMS-123): 'own' = bizniki, 'customer' = mijoz-moli
--      (davalcheskiy/giveth). Default 'own' (neytral — joriy data bizniki deb
--      hisoblanadi; mijoz-moli alohida belgilanadi).
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS owner_type VARCHAR(16) NOT NULL DEFAULT 'own';

-- 1.2  Xavf-sinfi (EP-WMS-128): bo'yoq/kley/lak/erituvchi uchun maxsus saqlash
--      xavf-zonasi. NULL = xavfsiz/belgilanmagan. Masalan 'flammable',
--      'toxic', 'oxidizer' — egasi master-data orqali kiritadi.
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS hazard_class VARCHAR(32);

-- 1.3  Saqlash sharti (EP-WMS-128): erkin-matn yoki kod ('cool_dry',
--      'below_25c', 'ventilated'). storage_conditions(jsonb) allaqachon mavjud,
--      lekin bu yengil skalyar zona-belgisi UI-filtr + xavf-zona uchun.
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS storage_condition VARCHAR(64);

-- 1.4  Yosh/eskirish ogohlantirish kuni (EP-WMS-126): shelf_life_days bo'lmagan
--      (muddatsiz) materialga ham yoshi bo'yicha "eskirmoqda" signali. NULL =
--      yosh-ogohlantirish yo'q. Masalan 365 → 1 yildan oshgan partiya signal beradi.
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS age_alert_days INTEGER;

-- 1.5  Qayta-ishlatiladigan (EP-WMS-125): vtorichka/chala-rulon qayta ishlatishga
--      ruxsat. FALSE = faqat birlamchi (yangi) ishlatiladi.
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS is_recyclable BOOLEAN NOT NULL DEFAULT FALSE;

-- 1.6  Poddon (pallet) birligidagi miqdor (EP-WMS-086): bir poddonga sig'adigan
--      asosiy-birlik miqdori (qadoqlash/yuklash birligi). NULL = poddon-birlik
--      qo'llanmaydi.
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS pallet_unit_qty NUMERIC;

-- 1.7  Namuna/probnik (EP-WMS-130): namuna sifatida chiqariladigan material-karta.
--      TRUE → chiqim alohida hisoblanadi (sotuv/ishlab-chiqarish emas).
ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- 2) warehouse_stock — partiya/qoldiq darajasidagi atributlar (kanonik stock
--    jadval — ADR-004). Q-46: mavjud ustunlarga TEGILMAYDI.
-- =============================================================================

-- 2.1  Qoldiq egalik turi (EP-WMS-123): aynan shu partiya bizniki yoki mijoz-moli.
--      Kartadan meros oladi, lekin partiya darajasida bekor qilinishi mumkin
--      (bir material ham bizniki, ham davalcheskiy bo'lishi mumkin).
ALTER TABLE warehouse_stock
  ADD COLUMN IF NOT EXISTS owner_type VARCHAR(16) NOT NULL DEFAULT 'own';

-- 2.2  Mijoz egasi (EP-WMS-123): owner_type='customer' bo'lganda kimning moli
--      (sd_customers.id ga ishora — soft, FK majburlanmaydi: data bo'sh bo'lishi
--      mumkin). NULL = bizniki yoki noma'lum.
ALTER TABLE warehouse_stock
  ADD COLUMN IF NOT EXISTS owner_customer_id INTEGER;

-- 2.3  Vtorichka sifat-belgisi (EP-WMS-125): qayta-ishlatilgan chala-rulon/material
--      sifat darajasi ('A'/'B'/'C' yoki 'recycled'). NULL = birlamchi (yangi).
ALTER TABLE warehouse_stock
  ADD COLUMN IF NOT EXISTS recycled_grade VARCHAR(16);

-- =============================================================================
-- 3) material_substitutes — material o'rnini bosuvchi/analog (EP-WMS-101).
--    Yo'naltirilgan juftlik: material_id (asosiy) → substitute_id (o'rnini bosadi).
--    Bir asosiy materialga ko'p analog bo'lishi mumkin (prioritet bilan).
-- =============================================================================
CREATE TABLE IF NOT EXISTS material_substitutes (
  id              SERIAL PRIMARY KEY,
  -- Asosiy material (material_cards.id) — o'rnini bosish kerak bo'lgan.
  material_id     INTEGER     NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
  -- O'rnini bosuvchi/analog material (material_cards.id).
  substitute_id   INTEGER     NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
  -- Tanlash prioriteti (kichik = afzalroq). Default 100.
  priority        INTEGER     NOT NULL DEFAULT 100,
  -- O'rnini bosishga texnologik ruxsat (TRUE = ishlatish mumkin).
  is_approved     BOOLEAN     NOT NULL DEFAULT TRUE,
  -- Analog sifatida foydalanish izohi/sharti (masalan grammaj farqi).
  notes           TEXT,
  created_by      INTEGER,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMP,
  deleted_by      INTEGER,
  -- Bir material→substitute juftligi takrorlanmaydi.
  CONSTRAINT uq_material_substitutes_pair UNIQUE (material_id, substitute_id),
  -- Material o'z-o'zining substituti bo'lolmaydi.
  CONSTRAINT chk_material_substitutes_not_self CHECK (material_id <> substitute_id)
);

-- Asosiy material bo'yicha tez qidirish (faol analoglarni topish).
CREATE INDEX IF NOT EXISTS idx_material_substitutes_material
  ON material_substitutes (material_id)
  WHERE deleted_at IS NULL;

-- Teskari qidirish (bu material qaysi materiallarga analog).
CREATE INDEX IF NOT EXISTS idx_material_substitutes_substitute
  ON material_substitutes (substitute_id)
  WHERE deleted_at IS NULL;

-- Egalik turi bo'yicha filtr (mijoz-moli ╳ bizniki ajratish, EP-WMS-123).
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_owner_type
  ON warehouse_stock (owner_type);

-- Xavf-sinfi bo'yicha filtr (xavf-zona ko'rinishi, EP-WMS-128).
CREATE INDEX IF NOT EXISTS idx_material_cards_hazard_class
  ON material_cards (hazard_class)
  WHERE hazard_class IS NOT NULL;
