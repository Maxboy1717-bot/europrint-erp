-- =============================================================================
-- seed-08-fin-delivery-gl.sql
-- EuroPrint ERP — Golden thread FIN/GL: delivery-completed posting prerequisites
-- =============================================================================
-- APPROVED: Claude(egasi vakolati) 2026-06-19
--   (DATA SEED — no destructive DDL; the two CREATE TABLE statements are IF NOT EXISTS
--    guards for tables that already exist via migrations-drift.ts + schema-core.ts.
--    ⚠️ Bu fayl YOZILGAN lekin ISHGA TUSHIRILMAGAN — jonli DB nazorati egasida.)
--
-- Idempotent: ON CONFLICT / WHERE NOT EXISTS → xavfsiz qayta-ishga-tushirish.
--
-- Maqsad (P08-GOLDEN T-14 + P06-GOLDEN gl_account_mappings):
--   1. settings.EP_COST_RATIO = 0.65 — DeliveryCompletedListener tannarx (COGS) ni
--      shu koeffitsientdan hisoblaydi (EP-FIN-005). Egasi qarori MASSIV-50 #3 = 0.65,
--      sozlanadigan (ekrandan/seeddan o'zgartiriladi). Kodga qotirilmagan.
--   2. gl_account_mappings — postMovementToLedger (gl-posting-log.repository.ts:131)
--      har POS harakat turi uchun debit/kredit hisobni shu jadvaldan qidiradi. Mavjud
--      seed-gl-account-mappings-pos.sql 6 turni qamragan; bu fayl qolgan 2 turni
--      (INTERNAL_TRANSFER, INVENTORY_ADJUST) qo'shadi → "posted: false" to'xtaydi.
--
-- Hisob kodlari O'zbekiston BHMS bo'yicha; mavjud pos-seed kod oilasiga mos
-- (1010/4000/6000/2010/9010/9500/9810). debit_account/credit_account → accounts.account_code
-- (GlPostingLogRepository.postMovementToLedger post vaqtida accounts.id ga resolve qiladi).
--
-- ⚠️ Kanonik daftar = `entries`. gl_journal_entries / gl_lines TEGILMAYDI (SAP#76 taqiq).
--
-- Qo'llash (egasi tomonidan, jonli DB da):
--   psql "$DATABASE_URL" -f docs/migration/seed/seed-08-fin-delivery-gl.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. GATED guards — jadvallar allaqachon mavjud (zaxira IF NOT EXISTS).
--    settings: schema-core.ts:112 (key text unique, value text notNull).
--    gl_account_mappings: schema-business-b-1.ts:124 + migrations-drift.ts:1876.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gl_account_mappings (
  id               SERIAL PRIMARY KEY,
  transaction_type TEXT,
  account_code     TEXT,
  debit_account    TEXT,
  credit_account   TEXT,
  description      TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 1. EP_COST_RATIO — tannarx koeffitsienti (EP-FIN-005). Egasi qarori = 0.65.
--    Sozlanadigan: keyin ekrandan/UPDATE bilan o'zgartiriladi. settings.value = TEXT.
--    id majburiy (PK, default yo'q jonli DB da bo'lishi mumkin) → barqaror kalit beramiz.
-- -----------------------------------------------------------------------------
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  'setting-ep-cost-ratio',
  'EP_COST_RATIO',
  '0.65',   -- ⚠️ Egasi qarori MASSIV-50 #3: ishlab chiqarish tannarxi nisbati (0.0–1.0).
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. gl_account_mappings — yetishmayotgan 2 ta POS harakat turi.
--    Mavjud 6 tur (EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN, DAMAGE, INVENTORY_ADJ_PLUS)
--    seed-gl-account-mappings-pos.sql da. Bu yerda faqat qolgan 2 tur — WHERE NOT EXISTS
--    bilan ikkalasi ham idempotent, bir-biriga zid emas.
-- -----------------------------------------------------------------------------
INSERT INTO gl_account_mappings
  (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
FROM (VALUES
  -- Ombor ko'chirish: bir ombordan ikkinchisiga. Bir xil hisob guruhi (1010/1010) —
  -- sof GL ta'sir nol, lekin postMovementToLedger uchun mapping shart (aks holda posted:false).
  ('INTERNAL_TRANSFER',
   '1010', '1010',
   'Ombor ko''chirish: Dr Xom ashyo (qabul) / Cr Xom ashyo (chiqim) — bir guruh'),

  -- Inventarizatsiya tuzatish (taqchil): seed-pos-movement-types.ts da 'INVENTORY_ADJUST'
  -- kodi. Qoldiq kamayadi → Dr Boshqa operatsion xarajatlar / Cr Xom ashyo (zarar logikasi).
  ('INVENTORY_ADJUST',
   '9500', '1010',
   'Inventarizatsiya tuzatish: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo')
) AS v(tt, da, ca, descr)
WHERE NOT EXISTS (
  SELECT 1 FROM gl_account_mappings g WHERE g.transaction_type = v.tt
);

COMMIT;

-- =============================================================================
-- TEKSHIRUV (egasi jonli DB da):
--   SELECT key, value FROM settings WHERE key = 'EP_COST_RATIO';
--     -> EP_COST_RATIO | 0.65
--   SELECT transaction_type, debit_account, credit_account
--     FROM gl_account_mappings ORDER BY transaction_type;
--     -> kamida 8 tur (6 mavjud + INTERNAL_TRANSFER + INVENTORY_ADJUST)
--   Idempotentlik: faylni 2-marta ishga tushiring → 0 yangi qator (INSERT 0 0).
-- =============================================================================
