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
