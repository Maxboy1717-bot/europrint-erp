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
