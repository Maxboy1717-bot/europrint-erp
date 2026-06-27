-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- POS Monitor — Harakat taksonomiyasini kengaytirish (ADDITIVE faqat).
-- Vizyon ❌ yopiladi:
--   1. WASTE_IN       — chiqindi/qoldiq (otxody/makulatura) ikkilamchi qog'oz omboriga kirim
--   2. LAB_SAMPLE_OUT — laboratoriya namuna olish (chiqim-sabab)
--   3. PARTIAL_RECEIPT — kam/buzuq material qisman qabul rejimi
--   4. CUSTOMER_MATERIAL — mijoz-mol (davalcheskoe) ajratilgan kirim
--
-- Q-46: ishlaydigan WMS dvigateli BUZILMAYDI — faqat yangi qatorlar (seed) +
--       yangi enum qiymatlari (IF NOT EXISTS) + yangi kontekst jadvali.
-- Q-40: fabrikatsiya YO'Q — faqat taksonomik faktlar (kod/yo'nalish), biznes-narx emas.

-- ─── 1. Enum qiymatlarini qo'shish (faqat enum TYPE mavjud bo'lsa) ───────────────
-- Eslatma: jonli DB'da pos_movements.movement_type = varchar (enum TYPE umuman
-- yaratilmagan), shuning uchun ADD VALUE majburiy emas. Drizzle sxema enum'i
-- bilan izchillik uchun, agar kelajakda type yaratilsa, idempotent qo'shamiz.
-- Type yo'q bo'lsa — jimgina o'tkazib yuboriladi (xato bermaydi).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_movement_type_enum') THEN
    ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'WASTE_IN';
    ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'LAB_SAMPLE_OUT';
    ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'PARTIAL_RECEIPT';
    ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'CUSTOMER_MATERIAL';
  END IF;
END$$;

-- ─── 2. pos_movement_types lookup — yangi harakat turlari (seed) ─────────────────
-- direction CHECK: ('in','out','transfer','adjustment') — quyidagilar mos.
INSERT INTO pos_movement_types (code, name, name_ru, direction, is_issue, is_receipt, is_active, requires_document)
VALUES
  ('WASTE_IN',          'Chiqindi/Qoldiq kirim (makulatura)', 'Приход отходов/макулатуры',   'in',  false, true,  true, false),
  ('LAB_SAMPLE_OUT',    'Laboratoriya namunasi (chiqim)',      'Лабораторная проба (расход)', 'out', true,  false, true, false),
  ('PARTIAL_RECEIPT',   'Qisman qabul (kam/buzuq)',            'Частичная приёмка',           'in',  false, true,  true, true),
  ('CUSTOMER_MATERIAL', 'Mijoz-mol (davalcheskoe) kirim',      'Давальческое сырьё',          'in',  false, true,  true, true)
ON CONFLICT (code) DO NOTHING;

-- ─── 3. pos_movement_context — yangi harakat turlari uchun qo'shimcha kontekst ───
-- ADDITIVE: pos_movements (dvigatel jadvali) tegilmaydi — kontekst alohida
-- 1:1 jadvalda saqlanadi. Hech bir mavjud oqim bu jadvalga bog'liq emas.
CREATE TABLE IF NOT EXISTS pos_movement_context (
  id                 SERIAL PRIMARY KEY,
  movement_id        INTEGER NOT NULL UNIQUE,
  -- LAB_SAMPLE_OUT
  lab_sample_reason  TEXT,
  lab_test_ref       VARCHAR(100),
  -- PARTIAL_RECEIPT (kam/buzuq qabul) — qatorlar bo'yicha jami
  ordered_qty        NUMERIC(18,3),
  accepted_qty       NUMERIC(18,3),
  rejected_qty       NUMERIC(18,3),
  partial_reason     TEXT,
  -- CUSTOMER_MATERIAL (davalcheskoe) — mol egasi
  customer_id        VARCHAR(50),
  customer_name      TEXT,
  is_customer_owned  BOOLEAN NOT NULL DEFAULT false,
  -- WASTE_IN (makulatura/chiqindi)
  waste_source       VARCHAR(100),
  created_at         TIMESTAMP NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_movement_context_movement
  ON pos_movement_context (movement_id);
