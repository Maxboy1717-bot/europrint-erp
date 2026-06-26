-- APPROVED: egasi 'hamma vizyon' 2026-06-26
-- Gap #15 (T20-B1) — error_catalog → ЦКП-hodisa ULA.
-- ЦКП kunlik fakt (ckp_fact_values) ga ixtiyoriy `error_code` link qo'shamiz: operator/AI
-- fakt yozganda nuqson/xato sababini error_catalog.code'ga bog'lashi mumkin (achievement past
-- bo'lsa SABABI ko'rinadi). ADDITIV + idempotent (Q-46 destructiv yo'q, Q-35 APPROVED).
-- FK YO'Q (error_catalog.code partial-unique faqat is_active=true bo'lganda → FK noaniq;
-- soft-link text + idx). FABRIKATSIYA YO'Q: error_code NULL = sabab ko'rsatilmagan (default-neytral).

ALTER TABLE IF EXISTS ckp_fact_values ADD COLUMN IF NOT EXISTS error_code TEXT;

-- Tezkor filtr/agregat uchun (qaysi xato-kod necha marta sabab bo'lgan).
CREATE INDEX IF NOT EXISTS idx_ckp_fact_values_error_code
  ON ckp_fact_values (error_code) WHERE error_code IS NOT NULL;
