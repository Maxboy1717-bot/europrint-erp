-- FINAL FIX: oxirgi 6 ta xato

-- 1. attendance jadvali (director/dashboard, hr, ai-summary uchun)
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. sd_customers: stir va status ustunlari (sd/customers uchun)
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS stir VARCHAR(50);
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 3. sales_orders.customer_id INTEGER (sap/sales-orders JOIN uchun)
DO $$
BEGIN
  ALTER TABLE sales_orders ALTER COLUMN customer_id TYPE INTEGER
    USING (CASE WHEN customer_id::text ~ '^[0-9]+$' THEN customer_id::INTEGER ELSE NULL END);
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE sales_orders ALTER COLUMN customer_id TYPE INTEGER USING NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 4. crm_leads va crm_deals — drop+recreate (sd/reports/funnel uchun)
-- Bu jadvallar bo'sh, xavfsiz qayta yaratish mumkin
DROP TABLE IF EXISTS crm_deals CASCADE;
CREATE TABLE crm_deals (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER,
  stage_semantic_id VARCHAR(50) DEFAULT 'new',
  opportunity NUMERIC(18, 2) DEFAULT 0,
  value NUMERIC(18, 2) DEFAULT 0,
  customer_id INTEGER,
  manager_id INTEGER,
  status VARCHAR(50) DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS crm_leads CASCADE;
CREATE TABLE crm_leads (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  manager_id INTEGER,
  status VARCHAR(50) DEFAULT 'new',
  status_description VARCHAR(200),
  source VARCHAR(50),
  contact_name VARCHAR(200),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(200),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
