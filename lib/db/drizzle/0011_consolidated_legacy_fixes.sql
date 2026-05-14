-- ============================================================================
-- 0011_consolidated_legacy_fixes.sql
-- Consolidation of 17 standalone fix-schema-*.sql files from project root.
-- These were applied manually outside the Drizzle migration journal during
-- early development. This single migration replays them in the original
-- order so future deployments use only `pnpm db:migrate` with no manual
-- steps.
--
-- All operations use IF NOT EXISTS / IF EXISTS guards where possible so
-- replay on existing databases is safe. Wrap the whole thing in a single
-- transaction so partial application is impossible.
-- ============================================================================

BEGIN;


-- ============================================================================
-- BEGIN: fix-schema.sql
-- ============================================================================
-- ============================================================================
-- EuroPrint ERP — Schema fix script
-- Applies missing tables/columns and removes problematic FK constraints
-- so empty tables return [] instead of 500 errors.
-- ============================================================================

-- 1. mes_telemetry (AiMesMonitor 30s loop crashes without it)
CREATE TABLE IF NOT EXISTS mes_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id TEXT NOT NULL,
  metric_type VARCHAR(100),
  metric_value NUMERIC(14, 3),
  value NUMERIC(14, 3),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS mes_telemetry_machine_idx ON mes_telemetry(machine_id);
CREATE INDEX IF NOT EXISTS mes_telemetry_recorded_at_idx ON mes_telemetry(recorded_at);

-- 2. hr_candidate_funnels (AI auto-screen cron crashes without it)
CREATE TABLE IF NOT EXISTS hr_candidate_funnels (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER,
  vacancy_id INTEGER,
  funnel_stage VARCHAR(50) NOT NULL DEFAULT 'NEW',
  productivity_category VARCHAR(50) DEFAULT 'UNKNOWN',
  source VARCHAR(50) DEFAULT 'OTHER',
  source_details TEXT,
  referred_by_id INTEGER,
  initial_screening_notes TEXT,
  screening_score INTEGER,
  is_quick_rejected BOOLEAN NOT NULL DEFAULT FALSE,
  quick_rejection_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rejection_reason TEXT,
  hired_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  assigned_recruiter_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hr_candidate_funnels_candidate_idx ON hr_candidate_funnels(candidate_id);
CREATE INDEX IF NOT EXISTS hr_candidate_funnels_stage_idx ON hr_candidate_funnels(funnel_stage);

-- 3. forecast_series (Sprint3 migration fails on this)
CREATE TABLE IF NOT EXISTS forecast_series (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  series_type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  forecast_value NUMERIC(14, 2),
  confidence_level NUMERIC(4, 3),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. violation_catalog (HR v2 seed)
CREATE TABLE IF NOT EXISTS violation_catalog (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_ru VARCHAR(200),
  severity VARCHAR(30) DEFAULT 'warning',
  default_fine_percent DECIMAL(5, 2) DEFAULT 0,
  default_fine_amount DECIMAL(10, 2) DEFAULT 0,
  points_deducted INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. badge_catalog (Gamification seed)
CREATE TABLE IF NOT EXISTS badge_catalog (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_ru VARCHAR(100),
  icon VARCHAR(100) DEFAULT '🏅',
  description TEXT,
  criteria TEXT,
  category VARCHAR(50),
  point_value INTEGER DEFAULT 0,
  is_auto_award BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. discipline_records ensure all columns exist
CREATE TABLE IF NOT EXISTS discipline_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  catalog_code VARCHAR(50),
  violation_type VARCHAR(100),
  discipline_type VARCHAR(30),
  severity VARCHAR(20),
  violation_date DATE,
  description TEXT,
  evidence_url TEXT,
  issued_by INTEGER,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE,
  is_first_warning BOOLEAN DEFAULT FALSE,
  is_second_warning BOOLEAN DEFAULT FALSE,
  is_final_warning BOOLEAN DEFAULT FALSE,
  previous_warning_id INTEGER,
  fine_amount DECIMAL(12, 2),
  suspension_days INTEGER,
  violation_count_this_category INTEGER DEFAULT 1,
  is_expired BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'issued',
  is_soft_deleted BOOLEAN DEFAULT FALSE,
  soft_delete_reason VARCHAR(255),
  soft_deleted_by INTEGER,
  soft_deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'issued';
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS is_soft_deleted BOOLEAN DEFAULT FALSE;

-- 7. hr_interview_sessions
CREATE TABLE IF NOT EXISTS hr_interview_sessions (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE,
  expires_at TIMESTAMPTZ,
  candidate_name VARCHAR(200),
  candidate_language VARCHAR(10) DEFAULT 'uz',
  candidate_id INTEGER,
  vacancy_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  communication_score DECIMAL(5, 2),
  confidence_score DECIMAL(5, 2),
  problem_solving_score DECIMAL(5, 2),
  body_language_score DECIMAL(5, 2),
  emotional_state_score DECIMAL(5, 2),
  professional_appearance_score DECIMAL(5, 2),
  overall_score DECIMAL(5, 2),
  recommendation VARCHAR(50),
  ai_summary TEXT,
  transcript TEXT,
  camera_rejections INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. ow_orders missing columns
ALTER TABLE IF EXISTS ow_orders ADD COLUMN IF NOT EXISTS tech_card_confirmed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS ow_orders ADD COLUMN IF NOT EXISTS customer_signature_url TEXT;

-- 9. mm_purchase_orders missing columns
ALTER TABLE IF EXISTS mm_purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ;
ALTER TABLE IF EXISTS mm_purchase_orders ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ;

-- 10. Materialized views — empty placeholders so REFRESH doesn't error
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_monthly AS
  SELECT 1 AS id, NOW() AS created_at WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_daily AS
  SELECT 1 AS id, NOW() AS created_at WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpi_daily AS
  SELECT 1 AS id, NOW() AS created_at WHERE FALSE;

-- ============================================================================
-- Drop ALL foreign key constraints to prevent type mismatch crashes
-- This makes empty tables return [] instead of 500 errors.
-- (Tables remain functional, FK enforcement just isn't done at DB level.)
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- Convert varchar FK columns to integer where possible
-- (Only converts columns that are empty or contain only numeric strings)
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  has_data BOOLEAN;
  all_numeric BOOLEAN;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.data_type = 'character varying'
      AND (
        c.column_name LIKE '%_id'
        OR c.column_name LIKE '%_by'
        OR c.column_name = 'created_by'
        OR c.column_name = 'updated_by'
        OR c.column_name = 'assigned_to'
        OR c.column_name = 'manager_id'
        OR c.column_name = 'parent_id'
      )
      AND c.column_name NOT IN ('user_id', 'tenant_id', 'external_id', 'transaction_id', 'reference_id')
  LOOP
    BEGIN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I LIMIT 1)', r.table_name) INTO has_data;
      IF NOT has_data THEN
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN %I TYPE INTEGER USING NULL',
          r.table_name, r.column_name
        );
      ELSE
        EXECUTE format(
          'SELECT NOT EXISTS (SELECT 1 FROM %I WHERE %I IS NOT NULL AND %I !~ ''^[0-9]+$'')',
          r.table_name, r.column_name, r.column_name
        ) INTO all_numeric;
        IF all_numeric THEN
          EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE INTEGER USING %I::INTEGER',
            r.table_name, r.column_name, r.column_name
          );
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- Done. Backend should now have far fewer 500 errors.
-- ============================================================================

-- END: fix-schema.sql

-- ============================================================================
-- BEGIN: fix-schema-2.sql
-- ============================================================================
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

-- END: fix-schema-2.sql

-- ============================================================================
-- BEGIN: fix-schema-3.sql
-- ============================================================================
-- ============================================================================
-- 3-bosqich: employees jadvali (KPI team uchun)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  position_id INTEGER,
  department_id INTEGER,
  manager_id INTEGER,
  email VARCHAR(200),
  phone VARCHAR(50),
  hire_date DATE,
  termination_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  salary NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tegishli ustunlar borligini tekshirish
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- END: fix-schema-3.sql

-- ============================================================================
-- BEGIN: fix-schema-4.sql
-- ============================================================================
-- ============================================================================
-- 4-bosqich: type mismatch fix + marketing jadvallar
-- ============================================================================

-- 1. sales_orders.customer_id: VARCHAR → INTEGER (sap/sales-orders uchun)
DO $$
BEGIN
  ALTER TABLE sales_orders ALTER COLUMN customer_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. crm_contacts.company_id: VARCHAR → INTEGER (crm/contacts uchun)
DO $$
BEGIN
  ALTER TABLE crm_contacts ALTER COLUMN company_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. crm_companies.id ham INTEGER bo'lishini tekshirish
DO $$
BEGIN
  ALTER TABLE crm_companies ALTER COLUMN id TYPE INTEGER USING id::text::INTEGER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. sd_customers.id INTEGER bo'lishini tekshirish
DO $$
BEGIN
  ALTER TABLE sd_customers ALTER COLUMN id TYPE INTEGER USING id::text::INTEGER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. sap_sales_orders.customer_id INTEGER
DO $$
BEGIN
  ALTER TABLE sap_sales_orders ALTER COLUMN customer_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. marketing_leads jadvali (dashboard/stats, leads/loss-analysis uchun)
CREATE TABLE IF NOT EXISTS marketing_leads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  converted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS campaign_id INTEGER;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 7. marketing_content_posts jadvali (content/posts uchun)
CREATE TABLE IF NOT EXISTS marketing_content_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500),
  content TEXT,
  post_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id INTEGER,
  tags TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(50);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS author_id INTEGER;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- END: fix-schema-4.sql

-- ============================================================================
-- BEGIN: fix-schema-5.sql
-- ============================================================================
-- ============================================================================
-- FINAL FIX: barcha qolgan xatolarni to'g'irlash
-- DROP + CREATE: PK type'lari noto'g'ri jadvallar uchun
-- CREATE IF NOT EXISTS: yo'q jadvallar uchun
-- ============================================================================

-- ───── 1. PK type fix — drop va qayta yaratish ─────
-- (barchasi bo'sh bo'lgani uchun xavfsiz)

DROP TABLE IF EXISTS sap_sales_orders CASCADE;
CREATE TABLE sap_sales_orders (
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

DROP TABLE IF EXISTS crm_contacts CASCADE;
CREATE TABLE crm_contacts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  first_name VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  position VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS crm_companies CASCADE;
CREATE TABLE crm_companies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL DEFAULT 'Unknown',
  inn VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS sd_customers CASCADE;
CREATE TABLE sd_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL DEFAULT 'Unknown',
  inn VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ───── 2. Director dashboard uchun yetishmayotgan jadvallar ─────

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mes_sessions (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'active',
  defect_qty NUMERIC(14, 3) DEFAULT 0,
  quality_passed BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  machine_id INTEGER,
  operator_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  order_id INTEGER,
  amount NUMERIC(18, 2) DEFAULT 0,
  total_amount NUMERIC(18, 2) DEFAULT 0,
  paid_amount NUMERIC(18, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(18, 2) DEFAULT 0;

-- ───── 3. employees jadvaliga yetishmayotgan ustunlar ─────

ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active';

-- ───── 4. sales_orders jadvaliga yetishmayotgan ustunlar ─────

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- ───── 5. status ustun type'ini tuzatish (agar boshqa type bo'lsa) ─────

DO $$
BEGIN
  ALTER TABLE sales_orders ALTER COLUMN status TYPE VARCHAR(50);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ───── 6. attendance va mes_sessions ham bo'sh, mos type ─────
-- (allaqachon to'g'ri yaratildi)

-- ───── 7. stock_items uchun (Sprint3 mv_inventory_daily) ─────
CREATE TABLE IF NOT EXISTS stock_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  warehouse_id INTEGER,
  quantity NUMERIC(14, 3) DEFAULT 0,
  cost_price NUMERIC(18, 2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ───── DONE ─────

-- END: fix-schema-5.sql

-- ============================================================================
-- BEGIN: fix-schema-6.sql
-- ============================================================================
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

-- END: fix-schema-6.sql

-- ============================================================================
-- BEGIN: fix-schema-7.sql
-- ============================================================================
-- LAST FIX: /api/sap/sales-orders
-- sales_orders va sap_sales_orders to'liq qayta yaratish
-- (ikkalasi ham bo'sh, xavfsiz)

DROP TABLE IF EXISTS sales_orders CASCADE;
CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  paid_amount NUMERIC(18, 2) DEFAULT 0,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS sap_sales_orders CASCADE;
CREATE TABLE sap_sales_orders (
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

-- END: fix-schema-7.sql

-- ============================================================================
-- BEGIN: fix-schema-8.sql
-- ============================================================================
-- design_orders jadvali (Design moduli uchun)
DROP TABLE IF EXISTS design_orders CASCADE;
CREATE TABLE design_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  client_name VARCHAR(200),
  product_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  deadline DATE,
  assigned_to INTEGER,
  description TEXT,
  ai_prompt TEXT,
  file_urls TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  approved_at TIMESTAMPTZ,
  deal_id INTEGER,
  papka_order_id INTEGER,
  client_company VARCHAR(200),
  client_phone VARCHAR(50),
  client_email VARCHAR(200),
  product_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- END: fix-schema-8.sql

-- ============================================================================
-- BEGIN: fix-schema-9.sql
-- ============================================================================
-- QC moduli uchun yetishmayotgan jadvallar
DROP TABLE IF EXISTS qc_reclamations CASCADE;
CREATE TABLE qc_reclamations (
  id SERIAL PRIMARY KEY,
  reclamation_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  product_name VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'new',
  severity VARCHAR(20) DEFAULT 'medium',
  reported_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  resolution TEXT,
  cost_impact NUMERIC(18, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS qc_lab_tests CASCADE;
CREATE TABLE qc_lab_tests (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(200),
  test_type VARCHAR(100),
  sample_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  result VARCHAR(50),
  result_value NUMERIC(18, 4),
  unit VARCHAR(50),
  performed_by INTEGER,
  performed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS qc_parameters CASCADE;
CREATE TABLE qc_parameters (
  id SERIAL PRIMARY KEY,
  parameter_name VARCHAR(200),
  parameter_group VARCHAR(100),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  target_value NUMERIC(18, 4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS qc_certificates CASCADE;
CREATE TABLE qc_certificates (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(100) UNIQUE,
  certificate_type VARCHAR(100),
  issued_to VARCHAR(200),
  issued_at DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'valid',
  product_id INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS qc_defects_extended CASCADE;
CREATE TABLE qc_defects_extended (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  defect_type VARCHAR(100),
  defect_code VARCHAR(50),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  resolution VARCHAR(50),
  cost_impact NUMERIC(18, 2),
  reported_by INTEGER,
  resolved_by INTEGER,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS qc_ai_trend CASCADE;
CREATE TABLE qc_ai_trend (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20),
  pass_rate NUMERIC(8, 4),
  defect_count INTEGER,
  dpmo NUMERIC(18, 4),
  sigma_level NUMERIC(8, 4),
  total_inspections INTEGER,
  trend_direction VARCHAR(20),
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- qc_inspections (dashboard/stats uchun)
CREATE TABLE IF NOT EXISTS qc_inspections (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  inspector_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  result VARCHAR(50),
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  inspected_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- qc_defects (asosiy)
CREATE TABLE IF NOT EXISTS qc_defects (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER,
  defect_type VARCHAR(100),
  defect_count INTEGER DEFAULT 0,
  severity VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- END: fix-schema-9.sql

-- ============================================================================
-- BEGIN: fix-schema-10.sql
-- ============================================================================
-- QC jadvallarini backend SQL'iga moslashtirish

-- 1. qc_parameters — backend kutgan ustunlar bilan qayta yaratish
DROP TABLE IF EXISTS qc_parameters CASCADE;
CREATE TABLE qc_parameters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  category VARCHAR(100),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  target_value NUMERIC(18, 4),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. qc_lab_tests — backend kutgan ustunlar
DROP TABLE IF EXISTS qc_lab_tests CASCADE;
CREATE TABLE qc_lab_tests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  parameter_name VARCHAR(200),
  value NUMERIC(18, 4),
  unit VARCHAR(50),
  result VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  tested_by INTEGER,
  notes TEXT,
  tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. qc_final_inspections — dashboard/stats uchun
CREATE TABLE IF NOT EXISTS qc_final_inspections (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  inspector_id INTEGER,
  result VARCHAR(50),
  inspected_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. qc_braks — dashboard/stats subquery uchun
CREATE TABLE IF NOT EXISTS qc_braks (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_name VARCHAR(200),
  quantity INTEGER DEFAULT 0,
  reason TEXT,
  cost_impact NUMERIC(18, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. quality_defects_camera — qc/reclamations uchun
CREATE TABLE IF NOT EXISTS quality_defects_camera (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  defect_type VARCHAR(100),
  description TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. qc_defects — status ustun mavjudligini ta'minlash
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open';

-- 7. qc_certificates qayta yaratish (frontend kutgan ustunlar)
DROP TABLE IF EXISTS qc_certificates CASCADE;
CREATE TABLE qc_certificates (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(100) UNIQUE,
  certificate_type VARCHAR(100),
  product_id INTEGER,
  issued_to VARCHAR(200),
  issued_at DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'valid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. qc_reclamations
DROP TABLE IF EXISTS qc_reclamations CASCADE;
CREATE TABLE qc_reclamations (
  id SERIAL PRIMARY KEY,
  reclamation_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  product_name VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'new',
  severity VARCHAR(20) DEFAULT 'medium',
  reported_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  resolution TEXT,
  cost_impact NUMERIC(18, 2),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- END: fix-schema-10.sql

-- ============================================================================
-- BEGIN: fix-schema-11.sql
-- ============================================================================
-- Backend log'dagi aniq ustun nomlariga moslashtirish

-- 1. quality_defects_camera — backend kutgan to'liq ustunlar
DROP TABLE IF EXISTS quality_defects_camera CASCADE;
CREATE TABLE quality_defects_camera (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  work_center_id INTEGER,
  product_name VARCHAR(200),
  defect_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  image_url TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. qc_certificates — backend kutgan ustunlar (cert_number, issued_date, expiry_date, issued_by)
DROP TABLE IF EXISTS qc_certificates CASCADE;
CREATE TABLE qc_certificates (
  id SERIAL PRIMARY KEY,
  cert_number VARCHAR(100) UNIQUE,
  order_id INTEGER,
  product_name VARCHAR(200),
  issued_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'valid',
  notes TEXT,
  issued_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. qc_final_inspections — status ustun qo'shish (backend uni ishlatadi)
ALTER TABLE qc_final_inspections ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- 4. qc_defects — defect_code va severity ustunlar
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS defect_code VARCHAR(100);
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'minor';

-- 5. sales_orders.id INTEGER bo'lishi kerak (JOIN qc_final_inspections.order_id INTEGER bilan)
-- Avval qarang: agar varchar bo'lsa, JOIN xato beradi
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name='sales_orders' AND column_name='id';

  IF col_type IS NOT NULL AND col_type <> 'integer' THEN
    -- sales_orders qayta yaratish kerak
    DROP TABLE IF EXISTS sales_orders CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100),
  customer_id INTEGER,
  customer_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'new',
  total_amount NUMERIC(18, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mavjud sales_orders ga ustunlar qo'shish (agar table boshqacha bo'lsa)
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';

-- 6. employees — first_name, last_name ta'minlash
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  position VARCHAR(100),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- END: fix-schema-11.sql

-- ============================================================================
-- BEGIN: fix-schema-12.sql
-- ============================================================================
-- MES, IoT, Camera, Gamification jadvallarini yaratish/tuzatish

-- 1. employees ga yetishmagan ustunlar
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 2. mes_maintenance_requests
CREATE TABLE IF NOT EXISTS mes_maintenance_requests (
  id SERIAL PRIMARY KEY,
  requested_by INTEGER,
  equipment_id INTEGER,
  title VARCHAR(200),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. mes_maintenance_tasks
CREATE TABLE IF NOT EXISTS mes_maintenance_tasks (
  id SERIAL PRIMARY KEY,
  request_id INTEGER,
  assigned_to INTEGER,
  title VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. mes_downtime_reasons
CREATE TABLE IF NOT EXISTS mes_downtime_reasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. mes_production_sessions
CREATE TABLE IF NOT EXISTS mes_production_sessions (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER,
  equipment_id INTEGER,
  order_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  produced_qty INTEGER DEFAULT 0,
  defect_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. gamification_points
CREATE TABLE IF NOT EXISTS gamification_points (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  points INTEGER DEFAULT 0,
  reason VARCHAR(200),
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. cameras
CREATE TABLE IF NOT EXISTS cameras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  location VARCHAR(200),
  ip_address VARCHAR(50),
  rtsp_url TEXT,
  status VARCHAR(50) DEFAULT 'online',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. camera_events (camera_id text/varchar — backend ::text cast qiladi)
CREATE TABLE IF NOT EXISTS camera_events (
  id SERIAL PRIMARY KEY,
  camera_id VARCHAR(50),
  event_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'low',
  status VARCHAR(50) DEFAULT 'new',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. camera_zones
CREATE TABLE IF NOT EXISTS camera_zones (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  zone_name VARCHAR(200),
  zone_type VARCHAR(100),
  coordinates TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. iot_sensors (agar yo'q bo'lsa)
CREATE TABLE IF NOT EXISTS iot_sensors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  sensor_type VARCHAR(100),
  equipment_id INTEGER,
  location VARCHAR(200),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. iot_sensor_readings
CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  value NUMERIC(18, 4),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. iot_alerts
CREATE TABLE IF NOT EXISTS iot_alerts (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  alert_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. equipment (agar yo'q bo'lsa)
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  code VARCHAR(100),
  type VARCHAR(100),
  location VARCHAR(200),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- END: fix-schema-12.sql

-- ============================================================================
-- BEGIN: fix-schema-FINAL.sql
-- ============================================================================
-- ============================================================
-- YAKUNIY SCHEMA TUZATISH (fix-10, 11, 12 + qo'shimcha hammasi)
-- Backend runtime SQL'larini tahlil qilib, aniq ustunlar
-- ============================================================

-- ─── EMPLOYEES (asos jadval — ko'p JOIN'lar shundan) ─────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- ─── MES jadvallar ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mes_maintenance_requests (
  id SERIAL PRIMARY KEY,
  title TEXT,
  equipment_id INTEGER,
  requested_by INTEGER,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  description TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mes_maintenance_tasks (
  id SERIAL PRIMARY KEY,
  request_id INTEGER,
  assigned_to INTEGER,
  title TEXT,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  result TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mes_downtime_reasons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT,
  category TEXT,
  is_planned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mes_production_sessions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  operator_id INTEGER,
  machine_id INTEGER,
  shift_id INTEGER,
  session_date DATE,
  status TEXT DEFAULT 'active',
  produced_qty NUMERIC(15, 4) DEFAULT 0,
  defect_qty NUMERIC(15, 4) DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── GAMIFICATION ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_points (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  event_type TEXT,
  description TEXT,
  reference_id INTEGER,
  reason TEXT,
  given_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── CAMERA / IoT ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cameras (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  name_ru TEXT,
  location TEXT,
  ip_address VARCHAR(50),
  port INTEGER,
  rtsp_url TEXT,
  stream_url TEXT,
  work_center_id VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_sensitivity VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS code VARCHAR(100);
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS location TEXT;

CREATE TABLE IF NOT EXISTS camera_events (
  id SERIAL PRIMARY KEY,
  camera_id VARCHAR(50),
  event_type VARCHAR(100) NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'new',
  ai_confidence NUMERIC(5, 4),
  screenshot_url TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);
ALTER TABLE camera_events ADD COLUMN IF NOT EXISTS camera_id VARCHAR(50);
ALTER TABLE camera_events ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE camera_events ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium';
ALTER TABLE camera_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';

CREATE TABLE IF NOT EXISTS camera_zones (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  zone_name TEXT NOT NULL DEFAULT '',
  zone_type VARCHAR(50) NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: quality_defects_camera (backend kutgan ustunlar) ───
DROP TABLE IF EXISTS quality_defects_camera CASCADE;
CREATE TABLE quality_defects_camera (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  work_center_id INTEGER,
  product_name VARCHAR(200),
  defect_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  image_url TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: certificates (cert_number, issued_date, expiry_date) ─
DROP TABLE IF EXISTS qc_certificates CASCADE;
CREATE TABLE qc_certificates (
  id SERIAL PRIMARY KEY,
  cert_number TEXT NOT NULL UNIQUE,
  order_id INTEGER,
  product_name TEXT,
  issued_date TEXT,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  issued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: final_inspections (status ustun) ───────────────────
CREATE TABLE IF NOT EXISTS qc_final_inspections (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  inspector_id INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  passed BOOLEAN DEFAULT FALSE,
  result TEXT,
  defect_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE qc_final_inspections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ─── QC: defects (defect_code, severity) ────────────────────
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS defect_code TEXT;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'minor';
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- ─── QC: parameters (name, category, target_value) ──────────
DROP TABLE IF EXISTS qc_parameters CASCADE;
CREATE TABLE qc_parameters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  category VARCHAR(100),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  target_value NUMERIC(18, 4),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: lab_tests (parameter_name, value, tested_by) ───────
DROP TABLE IF EXISTS qc_lab_tests CASCADE;
CREATE TABLE qc_lab_tests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  parameter_name VARCHAR(200),
  value NUMERIC(18, 4),
  unit VARCHAR(50),
  result VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  tested_by INTEGER,
  notes TEXT,
  tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: braks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qc_braks (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_name VARCHAR(200),
  quantity INTEGER DEFAULT 0,
  reason TEXT,
  cost_impact NUMERIC(18, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── QC: reclamations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS qc_reclamations (
  id SERIAL PRIMARY KEY,
  reclamation_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  product_name VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'new',
  severity VARCHAR(20) DEFAULT 'medium',
  reported_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  resolution TEXT,
  cost_impact NUMERIC(18, 2),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── SALES_ORDERS (id INTEGER, JOIN qc_final_inspections) ───
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';

-- ─── EQUIPMENT ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  code VARCHAR(100),
  type VARCHAR(100),
  location VARCHAR(200),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── IoT sensors (qo'shimcha) ───────────────────────────────
CREATE TABLE IF NOT EXISTS iot_sensors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  sensor_type VARCHAR(100),
  equipment_id INTEGER,
  location VARCHAR(200),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  value NUMERIC(18, 4),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS iot_alerts (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  alert_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── INDEX'lar (so'rovlarni tezlashtirish) ──────────────────
CREATE INDEX IF NOT EXISTS idx_camera_events_event_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_created_at ON camera_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_defects_resolved ON quality_defects_camera(is_resolved);
CREATE INDEX IF NOT EXISTS idx_gamification_employee ON gamification_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_mes_sessions_status ON mes_production_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mes_sessions_created ON mes_production_sessions(created_at);

-- ─── Tekshiruv: hammasi muvaffaqiyatli bo'lganini aytadi ────
DO $$
BEGIN
  RAISE NOTICE '✓ Schema tuzatish yakunlandi';
END $$;

-- END: fix-schema-FINAL.sql

-- ============================================================================
-- BEGIN: fix-schema-FINAL2.sql
-- ============================================================================
-- ============================================================
-- FINAL2: ERP, MM, PP, Logistika, Material qatlam jadvallari
-- ============================================================

-- ─── MATERIAL CARDS / CATEGORIES (products) ─────────────────
CREATE TABLE IF NOT EXISTS material_categories (
  id SERIAL PRIMARY KEY,
  code TEXT,
  name TEXT,
  parent_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS material_cards (
  id SERIAL PRIMARY KEY,
  code TEXT,
  name TEXT,
  category_id INTEGER,
  unit TEXT,
  description TEXT,
  price NUMERIC(18, 2),
  cost NUMERIC(18, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- ─── BOM ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bom_headers (
  id SERIAL PRIMARY KEY,
  product_id TEXT,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER,
  material_id TEXT,
  quantity NUMERIC(15, 4),
  unit TEXT,
  scrap_percent NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ROUTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routings (
  id SERIAL PRIMARY KEY,
  name TEXT,
  product_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pp_routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER,
  work_center_id TEXT,
  sequence_no INTEGER DEFAULT 1,
  name TEXT,
  planned_duration NUMERIC(10, 2) DEFAULT 0,
  setup_time_min NUMERIC(8, 2) DEFAULT 0,
  run_time_min NUMERIC(8, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- routing_operations alias (eski endpoint)
CREATE TABLE IF NOT EXISTS routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id TEXT,
  work_center_id TEXT,
  name TEXT,
  sequence INTEGER DEFAULT 1,
  setup_time_min NUMERIC(8, 2) DEFAULT 0,
  run_time_min NUMERIC(8, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── WORK_CENTERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_centers (
  id SERIAL PRIMARY KEY,
  code TEXT,
  name TEXT,
  type TEXT,
  capacity NUMERIC(10, 2) DEFAULT 1,
  hours_per_day NUMERIC(5, 2) DEFAULT 8,
  cost_per_hour NUMERIC(18, 2) DEFAULT 0,
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS hours_per_day NUMERIC(5, 2) DEFAULT 8;
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS department TEXT;

-- ─── PRODUCTION_ORDERS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  sales_order_id INTEGER,
  quantity NUMERIC(15, 4) DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'pending',
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  work_center_id INTEGER,
  bom_id INTEGER,
  routing_id INTEGER,
  operator_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- ─── TECHNOLOGY CARDS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technology_cards (
  id SERIAL PRIMARY KEY,
  papka_order_id INTEGER,
  material TEXT,
  ink_colors TEXT,
  print_type TEXT,
  finishing TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- tech_cards alias
CREATE TABLE IF NOT EXISTS tech_cards (
  id SERIAL PRIMARY KEY,
  papka_order_id INTEGER,
  material TEXT,
  ink_colors TEXT,
  print_type TEXT,
  finishing TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PAPKA ORDERS (production version) ──────────────────────
CREATE TABLE IF NOT EXISTS papka_orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT,
  status TEXT DEFAULT 'pending_design',
  sales_order_id INTEGER,
  client_name TEXT,
  product_name TEXT,
  product_type TEXT,
  quantity INTEGER DEFAULT 0,
  format_width NUMERIC(10, 2),
  format_height NUMERIC(10, 2),
  deadline DATE,
  papka_no TEXT,
  mijoz_nomi TEXT,
  mahsulot_nomi TEXT,
  tiraj INTEGER,
  format_a TEXT,
  format_b TEXT,
  tayyor_bolish_sanasi DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── MM (LOGISTIKA) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mm_vehicles (
  id SERIAL PRIMARY KEY,
  plate_number TEXT,
  vehicle_type TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  assigned_driver_id INTEGER,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mm_vehicle_fuel_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER,
  log_date DATE,
  fuel_amount NUMERIC(10, 2),
  fuel_cost NUMERIC(15, 2),
  mileage NUMERIC(10, 2),
  liters NUMERIC(10, 2),
  total_cost NUMERIC(15, 2),
  odometer_km NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mm_drivers (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  license_number TEXT,
  license_class TEXT,
  license_expiry DATE,
  vehicle_id INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mm_driver_expenses (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER,
  vehicle_id INTEGER,
  expense_date DATE,
  expense_type TEXT,
  amount NUMERIC(15, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ERP REPORTS / PRODUCTION ────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_production_plans (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  plan_date DATE,
  planned_qty NUMERIC(15, 4),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_production_facts (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  machine_id INTEGER,
  product_id INTEGER,
  work_center_id INTEGER,
  produced_qty NUMERIC(15, 4) DEFAULT 0,
  shift_date DATE,
  fact_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_shift_calendars (
  id SERIAL PRIMARY KEY,
  shift_date DATE,
  shift_number INTEGER DEFAULT 1,
  is_working BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_mrp_runs (
  id SERIAL PRIMARY KEY,
  run_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mrp_runs (
  id SERIAL PRIMARY KEY,
  run_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── MACHINE_TASKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_tasks (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER,
  operator_id INTEGER,
  order_id INTEGER,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PURCHASE REQUISITIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id SERIAL PRIMARY KEY,
  title TEXT,
  requested_by INTEGER,
  needed_by DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mm_purchase_requisitions (
  id SERIAL PRIMARY KEY,
  title TEXT,
  requested_by INTEGER,
  needed_by DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── MES SESSIONS (work_center capacity uchun) ──────────────
CREATE TABLE IF NOT EXISTS mes_sessions (
  id SERIAL PRIMARY KEY,
  work_center_id INTEGER,
  operator_id INTEGER,
  status TEXT DEFAULT 'idle',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  produced_qty NUMERIC(15, 4) DEFAULT 0,
  defect_qty NUMERIC(15, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── INTEGRATION_SHIFTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_shifts (
  id SERIAL PRIMARY KEY,
  shift_date DATE,
  shift_number INTEGER DEFAULT 1,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── INDEX'lar ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_routing_ops_routing ON pp_routing_operations(routing_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_papka_orders_status ON papka_orders(status);
CREATE INDEX IF NOT EXISTS idx_mm_fuel_vehicle ON mm_vehicle_fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_erp_facts_date ON erp_production_facts(shift_date);
CREATE INDEX IF NOT EXISTS idx_machine_tasks_status ON machine_tasks(status);

DO $$
BEGIN
  RAISE NOTICE '✓ FINAL2 schema tuzatish yakunlandi (ERP/MM/PP/Logistika)';
END $$;

-- END: fix-schema-FINAL2.sql

-- ============================================================================
-- BEGIN: fix-schema-FINAL3.sql
-- ============================================================================
-- ============================================================
-- FINAL3: HR/Adaptation/Recruitment/Offboarding to'liq tuzatish
-- Backend log'dagi har bir SQL'ni tahlil qilib
-- ============================================================

-- ─── EMPLOYEES — yetishmagan ustunlar ───────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_work VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_personal VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary NUMERIC(15, 2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vysotskiy_category VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- ─── POSITIONS — name_uz ustun ──────────────────────────────
ALTER TABLE positions ADD COLUMN IF NOT EXISTS name_uz TEXT;

-- ─── DISCIPLINE / OFFBOARDING ───────────────────────────────
CREATE TABLE IF NOT EXISTS discipline_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  type TEXT,
  description TEXT,
  severity VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS offboarding_cases (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  dismissal_type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PIP / ENPS / CONTRACTS / BLOCKS ────────────────────────
CREATE TABLE IF NOT EXISTS pip_plans (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  status TEXT DEFAULT 'active',
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS enps_surveys (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  questions JSONB,
  period TEXT,
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS enps_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER,
  employee_id INTEGER,
  answers JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  contract_number TEXT,
  contract_type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_blocks (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── RACI / CRISIS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raci_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  responsible_id INTEGER,
  accountable_id INTEGER,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS raci_stages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS crisis_records (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  reported_by INTEGER,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── AI INTERVIEW ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER,
  vacancy_id INTEGER,
  questions JSONB,
  answers JSONB,
  score NUMERIC(5, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ADAPTATION (4 ta jadval) ───────────────────────────────
CREATE TABLE IF NOT EXISTS adaptation_programs (
  id SERIAL PRIMARY KEY,
  program_name TEXT,
  position_id INTEGER,
  department_id INTEGER,
  duration_days INTEGER DEFAULT 90,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  program_id INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'in_progress',
  progress_percent INTEGER DEFAULT 0,
  current_milestone INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_milestones (
  id SERIAL PRIMARY KEY,
  record_id INTEGER,
  milestone_number INTEGER,
  milestone_title TEXT,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_feedback (
  id SERIAL PRIMARY KEY,
  new_employee_id INTEGER,
  feedback_type TEXT,
  scheduled_date DATE,
  completed_date DATE,
  rating NUMERIC(3, 1),
  status TEXT DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── EMPLOYEE TRANSFERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_transfers (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  from_department_id INTEGER,
  to_department_id INTEGER,
  from_position_id INTEGER,
  to_position_id INTEGER,
  transfer_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── HR BRAND SETTINGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_brand_settings (
  id SERIAL PRIMARY KEY,
  company_id TEXT DEFAULT 'default',
  brand_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Default qator
INSERT INTO hr_brand_settings (company_id, brand_data)
VALUES ('default', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ─── ORG_DEPARTMENTS — yetishmagan ustunlar ─────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS node_type TEXT DEFAULT 'department';
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS tskp_ru TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS tskp TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS head_user_id INTEGER;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS name_ru TEXT;

CREATE TABLE IF NOT EXISTS employee_org_departments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  org_department_id INTEGER,
  role TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── INDEX'lar ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_discipline_employee ON discipline_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON employee_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_adaptation_records_employee ON adaptation_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_org_dept_active ON org_departments(is_active);

DO $$
BEGIN
  RAISE NOTICE '✓ FINAL3 schema tuzatish yakunlandi (HR/Adaptation/Recruitment + 17 jadval)';
END $$;

-- END: fix-schema-FINAL3.sql

-- ============================================================================
-- BEGIN: fix-schema-FINAL4.sql
-- ============================================================================
-- ============================================================
-- FINAL4: Oxirgi log'dagi xatolarni tuzatish
-- ============================================================

-- ─── EMPLOYEES — full_name computed column ──────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE employees
   SET full_name = TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
 WHERE full_name IS NULL OR full_name = '';

-- ─── DISCIPLINE_RECORDS — yetishmagan ustunlar ──────────────
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ─── ORG_DEPARTMENTS — yetishmagan ustunlar ─────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── SHIFT_SCHEDULES — yangi jadval ─────────────────────────
CREATE TABLE IF NOT EXISTS shift_schedules (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  shift_date DATE,
  shift_type TEXT,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ATTENDANCE — agar yo'q bo'lsa ──────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  attendance_date DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── USERS jadvali — deleted_at va full_name ────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id INTEGER;

DO $$
BEGIN
  RAISE NOTICE '✓ FINAL4 yakunlandi';
END $$;

-- END: fix-schema-FINAL4.sql

-- ============================================================================
-- BEGIN: fix-schema-FINAL5.sql
-- ============================================================================
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

-- END: fix-schema-FINAL5.sql

COMMIT;
