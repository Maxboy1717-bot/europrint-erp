-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- W3-COUNT — Inventarizatsiya kuchaytirish (ADDITIVE faqat; Q-46 regress-taqiq).
--
-- Vizyon (❌ yopiladi):
--   1. KO'R-SANOQ (blind count): inventarizatsiya paytida tizim-miqdori (system_qty)
--      sanoqchidan YASHIRILADI — sanoqchi ko'r-ko'rona sanaydi, keyin og'ish hisoblanadi.
--   2. OG'ISH SABABI MAJBURIY: count-line da system≠counted bo'lsa, deviation_reason_code
--      ro'yxatdan (count_deviation_reasons seed-jadval) tanlanishi SHART.
--   3. ZONA/MATERIAL MUZLATISH (freeze): inventarizatsiya vaqtida ombor-zona (yoki ayrim
--      material) muzlatiladi — chiqim (goods-issue) hard-gate muzlatilgan zonadan chiqimni
--      BLOKLAYDI (mavjud OutboundEnforcement gate'iga ADDITIVE qo'shiladi).
--
-- HECH NIMA DESTRUCTIVE EMAS: faqat CREATE TABLE IF NOT EXISTS + seed ON CONFLICT.
-- Mavjud wms_inventory_counts oqimi / chiqim dvigateli O'ZGARMAYDI.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Og'ish sabablari katalogi (lookup / seed-only).
--    count_deviation_reasons — count-line og'ishini majburiy izohlash uchun kod ro'yxati.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS count_deviation_reasons (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(64)  NOT NULL UNIQUE,
  name        TEXT         NOT NULL,
  name_ru     TEXT,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Idempotent seed (egasi keyin to'ldiradi/kengaytiradi — bu baza ro'yxat).
INSERT INTO count_deviation_reasons (code, name, name_ru, description, sort_order) VALUES
  ('DAMAGE',        'Shikastlangan / brak',      'Повреждение / брак',     'Material shikastlangan yoki yaroqsiz holatda topildi', 10),
  ('THEFT',         'O''g''irlik / yo''qolish',  'Кража / пропажа',        'Material yo''qolgan, sabab noma''lum / o''g''irlik shubhasi', 20),
  ('MISCOUNT',      'Oldingi sanoq xatosi',      'Ошибка прошлого учёта',  'Avvalgi kirim/chiqim noto''g''ri qayd etilgan', 30),
  ('EXPIRY',        'Muddati o''tgan',           'Истёк срок годности',    'Material yaroqlilik muddati tugagan', 40),
  ('UNIT_MISMATCH', 'O''lchov birligi farqi',    'Расхождение ед. изм.',   'O''lchov birligi yoki konvertatsiya farqi', 50),
  ('RECEIPT_ERROR', 'Kirim hujjati xatosi',      'Ошибка приёмки',         'Qabul qilishda miqdor noto''g''ri kiritilgan', 60),
  ('SHRINKAGE',     'Tabiiy kamayish',           'Естественная убыль',     'Bug''lanish / quriydigan tabiiy kamayish', 70),
  ('OTHER',         'Boshqa (izoh majburiy)',    'Прочее (коммент. обяз.)', 'Yuqoridagilarga to''g''ri kelmaydi — izoh shart', 100)
ON CONFLICT (code) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Inventarizatsiya muzlatish zonalari.
--    inventory_freeze_zones — aktiv muzlatish chiqim hard-gate tomonidan tekshiriladi.
--    warehouse_id = muzlatilgan zona (ombor). material_id NULL bo'lsa BUTUN zona muzlaydi;
--    material_id to'ldirilgan bo'lsa FAQAT shu material muzlaydi.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_freeze_zones (
  id            SERIAL PRIMARY KEY,
  warehouse_id  INTEGER      NOT NULL,
  material_id   INTEGER,                    -- NULL = butun zona; aks holda faqat shu material
  count_id      INTEGER,                    -- ixtiyoriy: wms_inventory_counts.id bilan bog'lanish
  status        VARCHAR(16)  NOT NULL DEFAULT 'active',  -- 'active' | 'released'
  reason        TEXT,
  frozen_by     INTEGER,
  frozen_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  released_by   INTEGER,
  released_at   TIMESTAMP,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Aktiv muzlatishni tez topish uchun (chiqim-gate har chiqimda tekshiradi).
CREATE INDEX IF NOT EXISTS idx_inventory_freeze_zones_active
  ON inventory_freeze_zones (warehouse_id, material_id)
  WHERE status = 'active';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Og'ish sababini KODLI qilib count-line ga bog'lash (majburiy izoh uchun).
--    inventory_count_lines da allaqachon erkin-matn `reason` bor; bu ustun esa
--    count_deviation_reasons katalogidan KOD saqlaydi (validatsiya ilovada).
--    ADDITIVE: faqat IF NOT EXISTS ustun — mavjud satrlar O'ZGARMAYDI (NULL).
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE inventory_count_lines
  ADD COLUMN IF NOT EXISTS deviation_reason_code VARCHAR(64);
