-- ============================================================================
-- FINAL5: SD/CRM endpoint xatolarini tuzatish
-- ============================================================================
-- Backend log'idan:
--   1) /api/sd/contracts -- sd_contracts jadvali yo'q
--   2) /api/crm/companies -- crm_companies.date_create ustuni yo'q
-- ============================================================================

-- 1) SD CONTRACTS jadvali yaratish
CREATE TABLE IF NOT EXISTS sd_contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(100) UNIQUE,
  order_id INTEGER,
  customer_id INTEGER,
  contract_type VARCHAR(50) DEFAULT 'sales',
  status VARCHAR(30) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  signed_at TIMESTAMPTZ,
  signed_by INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sd_contracts_order ON sd_contracts(order_id);
CREATE INDEX IF NOT EXISTS idx_sd_contracts_customer ON sd_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_sd_contracts_status ON sd_contracts(status);

-- 2) sales_orders jadvali (sd_contracts JOIN qiladi)
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  status VARCHAR(30) DEFAULT 'pending',
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);

-- 3) sd_customers'da name ustuni borligini ta'minlash
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS name TEXT;

-- 4) CRM COMPANIES yetishmagan ustunlar (Bitrix24 stilida)
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS websites JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS stir VARCHAR(20);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS date_create TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS date_modify TIMESTAMPTZ DEFAULT NOW();

-- Eski created_at qiymatlarini date_create'ga ko'chirish (agar bor bo'lsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_companies' AND column_name = 'created_at'
  ) THEN
    UPDATE crm_companies
       SET date_create = COALESCE(date_create, created_at)
     WHERE date_create IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_companies' AND column_name = 'name'
  ) THEN
    UPDATE crm_companies
       SET title = COALESCE(title, name)
     WHERE title IS NULL OR title = '';
  END IF;
END $$;

-- 5) crm_contacts.company_id (JOIN uchun)
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);

-- 6) Indekslar (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_crm_companies_title ON crm_companies(title);
CREATE INDEX IF NOT EXISTS idx_crm_companies_stir ON crm_companies(stir);
CREATE INDEX IF NOT EXISTS idx_crm_companies_date_create ON crm_companies(date_create DESC);

-- 7) Statistika
DO $$
DECLARE
  n_contracts INT;
  n_companies INT;
  n_columns INT;
BEGIN
  SELECT COUNT(*) INTO n_contracts FROM sd_contracts;
  SELECT COUNT(*) INTO n_companies FROM crm_companies;
  SELECT COUNT(*) INTO n_columns
    FROM information_schema.columns
   WHERE table_name = 'crm_companies'
     AND column_name IN ('title','status','industry','websites','stir',
                          'address','credit_limit','date_create');

  RAISE NOTICE '=== FINAL5 yakunlandi ===';
  RAISE NOTICE 'sd_contracts: % qator', n_contracts;
  RAISE NOTICE 'crm_companies: % qator', n_companies;
  RAISE NOTICE 'crm_companies kerakli ustunlar: %/8', n_columns;
END $$;
