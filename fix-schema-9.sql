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
