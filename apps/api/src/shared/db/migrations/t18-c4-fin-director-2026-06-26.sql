-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
-- T18-C4-FIN-DIRECTOR — finance + director + master-data vizyon-mexanizm.
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / seed ON CONFLICT.
-- DESTRUCTIVE amal YO'Q (DROP/TYPE-change/VIEW-convert yo'q). Idempotent — qayta qo'llasa xavfsiz.

-- ---------------------------------------------------------------------------
-- (4) Master-data: sd_customers ABC segment (yillik xarid → A/B/C auto-compute)
-- ---------------------------------------------------------------------------
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS abc_class       VARCHAR(1);
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS abc_computed_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- (2) Tushum 4-fond auto-split — owner-configurable percentages (graceful).
--     Jadval bo'lmasa kod-default (INCOME_SPLIT_DEFAULT) ishlatiladi; bu jadval
--     egasi foizlarni override qilishi uchun. Seed = kod-default bilan bir xil.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS income_split_config (
  id         SERIAL PRIMARY KEY,
  fund_key   VARCHAR(10) NOT NULL UNIQUE,   -- MAIN / TAX / HEAD / WORKING
  share      NUMERIC(5,4) NOT NULL,         -- 0..1 (yig'indi ~1.0)
  is_active  BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default shares (MAIN 0.50 / TAX 0.20 / HEAD 0.15 / WORKING 0.15).
-- ⚠️ Bu KOD-DEFAULT (Q-40 — soxta DATA emas; egasi keyin UPDATE qiladi).
INSERT INTO income_split_config (fund_key, share, is_active) VALUES
  ('MAIN',    0.50, true),
  ('TAX',     0.20, true),
  ('HEAD',    0.15, true),
  ('WORKING', 0.15, true)
ON CONFLICT (fund_key) DO NOTHING;
