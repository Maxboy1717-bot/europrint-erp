-- ============================================================================
-- EuroPrint ERP — 2-bosqich schema fix
-- Quyidagi 4 endpoint uchun yetishmayotgan ustun/jadvallar:
--   /api/sd/kpi/team        → employees, sales_orders, sd_leads JOIN
--   /api/sd/reports/funnel  → crm_leads.status_description, crm_deals.*
--   /api/sap/sales-orders   → sap_sales_orders table
--   /api/crm/contacts       → crm_contacts, crm_companies tables
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. crm_leads — funnel uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS status_description VARCHAR(200);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. crm_deals — funnel uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_deals (
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
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage_semantic_id VARCHAR(50) DEFAULT 'new';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS opportunity NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS lead_id INTEGER;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. crm_companies — contacts JOIN uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_companies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  inn VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. crm_contacts — list uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_contacts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  position VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ───────────────────────────────────────────────────────────────────────────
-- 5. sap_sales_orders — SAP module uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sap_sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. sd_customers — JOIN target uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sd_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  inn VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. sales_orders — KPI team JOIN uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  paid_amount NUMERIC(18, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_id INTEGER;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18, 2) DEFAULT 0;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. sd_leads — KPI team JOIN uchun
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sd_leads (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER,
  customer_id INTEGER,
  contact_name VARCHAR(200),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(200),
  source VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE sd_leads ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE sd_leads ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- ───────────────────────────────────────────────────────────────────────────
-- 9. employees — ensure required columns
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS position_id INTEGER;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- ───────────────────────────────────────────────────────────────────────────
-- 10. ow_orders va mm_purchase_orders (oldingi xato bergan jadvallar)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ow_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  tech_card_confirmed_at TIMESTAMPTZ,
  customer_signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mm_purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(100) UNIQUE,
  supplier_id INTEGER,
  status VARCHAR(50) DEFAULT 'draft',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  expected_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ───────────────────────────────────────────────────────────────────────────
-- DONE
-- ───────────────────────────────────────────────────────────────────────────
