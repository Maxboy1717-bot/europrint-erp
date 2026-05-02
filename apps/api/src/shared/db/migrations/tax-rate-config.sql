-- tax-rate-config.sql — TZ-D02: Soliq stavkasi konfiguratsiya jadvali
-- Har kompaniya uchun alohida stavkalar, sana asosida faollik

CREATE TABLE IF NOT EXISTS tax_rate_config (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    VARCHAR(100)  NOT NULL,
  rate_type     VARCHAR(20)   NOT NULL CHECK (rate_type IN ('INCLUSIVE', 'EXCLUSIVE')),
  rate          NUMERIC(7, 6) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  effective_from DATE         NOT NULL,
  effective_to   DATE         ,
  description   TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT tax_rate_config_rate_range_check
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_tax_rate_config_company_date
  ON tax_rate_config (company_id, effective_from DESC);

-- Misol ma'lumotlar (O'zbekiston QQS = 12%)
-- INSERT INTO tax_rate_config (company_id, rate_type, rate, effective_from, description)
-- VALUES ('DEFAULT', 'EXCLUSIVE', 0.120000, '2024-01-01', 'O''zbekiston QQS 12%');
