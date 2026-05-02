-- ============================================================================
-- Replit DB uchun yetishmayotgan jadvallar va ustunlarni qo'shish
-- (diagnose.sh natijasidan kelib chiqib)
-- ============================================================================
-- Foydalanish: psql "$DATABASE_URL" -f fix-replit.sql
-- ============================================================================

\echo '→ employees.full_name ustunini qo''shish...'
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE employees
   SET full_name = TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
 WHERE (full_name IS NULL OR full_name = '');

-- ─── Missing 1: sd_invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sd_invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  customer_id INTEGER,
  invoice_number VARCHAR(100),
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 2-4: PP modul (Production Planning) ────────────────────────────
CREATE TABLE IF NOT EXISTS pp_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100),
  product_id INTEGER,
  quantity NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pp_routing (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  routing_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pp_work_centers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50),
  name TEXT,
  capacity_per_hour NUMERIC(15,2),
  cost_per_hour NUMERIC(15,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 5: mes_operations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mes_operations (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  operation_type VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 6: wms_inventory ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wms_inventory (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER,
  material_id INTEGER,
  quantity NUMERIC(15,2) DEFAULT 0,
  reserved_quantity NUMERIC(15,2) DEFAULT 0,
  available_quantity NUMERIC(15,2) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  unit VARCHAR(20),
  reorder_point NUMERIC(15,2),
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 7-8: HR v2 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_v2_documents (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  document_type VARCHAR(50),
  title TEXT,
  description TEXT,
  status VARCHAR(30) DEFAULT 'draft',
  file_url TEXT,
  current_step INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS hr_v2_daily_reports (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  report_date DATE DEFAULT CURRENT_DATE,
  tasks_completed TEXT,
  tasks_planned TEXT,
  blockers TEXT,
  hours_worked NUMERIC(5,2),
  status VARCHAR(30) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 9-10: Finance ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  payment_method VARCHAR(50),
  reference VARCHAR(100),
  status VARCHAR(30) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS fi_gl_documents (
  id SERIAL PRIMARY KEY,
  doc_number VARCHAR(100),
  doc_type VARCHAR(50),
  posting_date DATE DEFAULT CURRENT_DATE,
  reference TEXT,
  total_amount NUMERIC(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  status VARCHAR(30) DEFAULT 'draft',
  posted_by INTEGER,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 11: iot_devices ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iot_devices (
  id SERIAL PRIMARY KEY,
  device_code VARCHAR(100) UNIQUE,
  device_type VARCHAR(50),
  name TEXT,
  location TEXT,
  status VARCHAR(30) DEFAULT 'active',
  last_seen_at TIMESTAMPTZ,
  thresholds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missing 12: cron_status ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_status (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(200) UNIQUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status VARCHAR(30) DEFAULT 'pending',
  last_error TEXT,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Indekslar (tezlik uchun) ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sd_invoices_order ON sd_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_sd_invoices_status ON sd_invoices(status);
CREATE INDEX IF NOT EXISTS idx_pp_orders_status ON pp_orders(status);
CREATE INDEX IF NOT EXISTS idx_mes_operations_session ON mes_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_wms_inventory_warehouse ON wms_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_inventory_material ON wms_inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_hr_v2_docs_employee ON hr_v2_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_v2_reports_employee ON hr_v2_daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_invoice ON finance_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_code ON iot_devices(device_code);
CREATE INDEX IF NOT EXISTS idx_cron_status_job ON cron_status(job_name);

-- ─── Yakuniy ma'lumot ───────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✓ fix-replit.sql qo''llandi: 12 jadval + employees.full_name';
END $$;
