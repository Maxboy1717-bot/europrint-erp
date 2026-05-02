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
