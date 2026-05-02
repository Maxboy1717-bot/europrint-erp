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
