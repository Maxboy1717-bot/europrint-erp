-- =============================================================================
-- drift-fix-03b-missing-tables.sql
-- Create missing tables (Part B: ecommerce + crm + mm + pp + hr + misc)
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS)
-- NO FK constraints — base column types only
-- =============================================================================

-- ─── ECOMMERCE SCHEMA ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public_categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  image_url TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_name_ru TEXT,
  quantity INTEGER NOT NULL,
  unit VARCHAR(20) DEFAULT 'dona',
  unit_price NUMERIC(18,2) NOT NULL,
  total_price NUMERIC(18,2) NOT NULL,
  specifications JSONB,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_favorites (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  rating INTEGER NOT NULL,
  review TEXT NOT NULL,
  review_ru TEXT,
  product_id INTEGER,
  order_id INTEGER,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_chat_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  customer_id INTEGER,
  role VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  provider VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── CRM SCHEMA ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contact_companies (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  role VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  telegram VARCHAR(50),
  contact_type VARCHAR(30) DEFAULT 'primary',
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_interactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  direction VARCHAR(10) DEFAULT 'out',
  contact_id INTEGER,
  manager_id INTEGER,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  outcome TEXT,
  next_action TEXT,
  next_action_date TIMESTAMP,
  duration_minutes INTEGER,
  interaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  file_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_invoice_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UZS',
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  notes TEXT,
  created_by_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_invoice_products (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_description TEXT,
  sku VARCHAR(100),
  quantity NUMERIC(18,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  discount NUMERIC(18,2) DEFAULT 0,
  discount_type VARCHAR(20) DEFAULT 'percent',
  tax_rate NUMERIC(18,2) DEFAULT 0,
  total_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  sort INTEGER DEFAULT 100
);

-- ─── MM SCHEMA ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_material_insights (
  id SERIAL PRIMARY KEY,
  material_id VARCHAR,
  warehouse_id VARCHAR,
  insight_type VARCHAR(30) NOT NULL,
  insight_date VARCHAR(10) NOT NULL,
  confidence NUMERIC(18,2),
  priority VARCHAR(10) DEFAULT 'medium',
  title TEXT NOT NULL,
  title_ru TEXT,
  description TEXT NOT NULL,
  description_ru TEXT,
  payload JSONB,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_taken BOOLEAN NOT NULL DEFAULT FALSE,
  action_taken_by VARCHAR,
  action_taken_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── PP ENHANCED ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_maintenance_records (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL,
  maintenance_type VARCHAR(30) NOT NULL DEFAULT 'preventive',
  scheduled_date VARCHAR(10),
  completed_date VARCHAR(10),
  technician_name TEXT,
  vendor_id INTEGER,
  cost NUMERIC(18,2) DEFAULT 0,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  next_maintenance_date VARCHAR(10),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_insurance (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  insurer_name TEXT NOT NULL,
  coverage_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10) NOT NULL,
  premium_amount NUMERIC(18,2) DEFAULT 0,
  coverage_amount NUMERIC(18,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── HR RECRUITER ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr_vacancy_profiles (
  id SERIAL PRIMARY KEY,
  vacancy_id INTEGER NOT NULL,
  candidate_portrait JSONB,
  required_tool_test JSONB,
  ideal_profile JSONB,
  job_description TEXT,
  job_description_ru TEXT,
  key_responsibilities TEXT[],
  kpi_metrics JSONB,
  salary_from INTEGER,
  salary_to INTEGER,
  bonus_system TEXT,
  work_schedule VARCHAR(50),
  work_location VARCHAR(30),
  probation_days INTEGER DEFAULT 90,
  perks TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_weekly_statistics (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL,
  week_start TIMESTAMP NOT NULL,
  week_end TIMESTAMP NOT NULL,
  new_candidates INTEGER NOT NULL DEFAULT 0,
  questionnaires_sent INTEGER NOT NULL DEFAULT 0,
  phone_screenings_done INTEGER NOT NULL DEFAULT 0,
  tests_sent INTEGER NOT NULL DEFAULT 0,
  interviews_scheduled INTEGER NOT NULL DEFAULT 0,
  interviews_conducted INTEGER NOT NULL DEFAULT 0,
  offers_sent INTEGER NOT NULL DEFAULT 0,
  hired INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  source_breakdown JSONB,
  flagman_count INTEGER NOT NULL DEFAULT 0,
  processnik_count INTEGER NOT NULL DEFAULT 0,
  unproductive_count INTEGER NOT NULL DEFAULT 0,
  kpi_score INTEGER,
  bonus_earned INTEGER,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── ORDERS REGISTRY ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders_registry (
  id SERIAL PRIMARY KEY,
  number VARCHAR(30) NOT NULL,
  category VARCHAR(10) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  issued_by VARCHAR,
  issued_date VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  department_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── POS SCHEMA V2 ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_write_off_acts (
  id SERIAL PRIMARY KEY,
  act_number VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  reason TEXT NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  gl_document_id INTEGER,
  pdf_path TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_write_off_act_lines (
  id SERIAL PRIMARY KEY,
  act_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  issuance_log_id INTEGER,
  quantity NUMERIC(18,2) NOT NULL,
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_material_allocs (
  id SERIAL PRIMARY KEY,
  allocation_number VARCHAR(50) NOT NULL,
  production_order_id VARCHAR(50) NOT NULL,
  material_id INTEGER NOT NULL,
  batch_id INTEGER,
  from_warehouse_id VARCHAR(50) NOT NULL,
  to_warehouse_id VARCHAR(50) NOT NULL,
  pos_movement_id INTEGER,
  planned_qty NUMERIC(18,2) NOT NULL,
  allocated_qty NUMERIC(18,2) NOT NULL,
  unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_financial_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  excess_qty NUMERIC(18,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  returned_qty NUMERIC(18,2) DEFAULT 0,
  return_movement_id INTEGER,
  returned_at TIMESTAMP,
  order_completion_warning_at TIMESTAMP,
  allocated_by INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_stock_reservations (
  id SERIAL PRIMARY KEY,
  reservation_number VARCHAR(50) NOT NULL,
  production_order_id VARCHAR(50) NOT NULL,
  material_id INTEGER NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  batch_id INTEGER,
  reserved_qty NUMERIC(18,2) NOT NULL,
  issued_qty NUMERIC(18,2) NOT NULL DEFAULT 0,
  remaining_qty NUMERIC(18,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  reserved_by_ai BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP,
  cache_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_serial_number_items (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  barcode VARCHAR(200),
  warehouse_id VARCHAR(50),
  bin_location VARCHAR(100),
  assigned_to_user_id INTEGER,
  status VARCHAR(30) NOT NULL DEFAULT 'IN_WAREHOUSE',
  purchase_date TIMESTAMP,
  warranty_expires_at TIMESTAMP,
  unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── POS SCHEMA (telegram routes + role permissions) ────────────────────────

CREATE TABLE IF NOT EXISTS pos_telegram_routes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  chat_id VARCHAR(100) NOT NULL,
  movement_type_id INTEGER,
  warehouse_id VARCHAR(50),
  events JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_movement_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  movement_type_id INTEGER NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve BOOLEAN NOT NULL DEFAULT FALSE,
  can_cancel BOOLEAN NOT NULL DEFAULT FALSE,
  max_amount NUMERIC(18,2),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── SKILLS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_requirements (
  id SERIAL PRIMARY KEY,
  position_id INTEGER,
  skill_category_id INTEGER,
  skill_name VARCHAR(100) NOT NULL,
  required_level VARCHAR(20),
  is_mandatory INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── STRATEGIC EXT (token_blacklist) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  user_id VARCHAR,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── API SCHEMAS ─────────────────────────────────────────────────────────────

-- admin_filters
CREATE TABLE IF NOT EXISTS admin_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'general',
  config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_hr_interviews
CREATE TABLE IF NOT EXISTS ai_hr_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id TEXT NOT NULL,
  position_title TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'screening',
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_planning_plans
CREATE TABLE IF NOT EXISTS ai_planning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number TEXT NOT NULL,
  plan_date TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'daily',
  status TEXT NOT NULL DEFAULT 'draft',
  confidence_score INTEGER NOT NULL DEFAULT 87,
  auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  auto_approval_threshold INTEGER,
  total_orders INTEGER,
  total_machine_hours INTEGER,
  estimated_completion TIMESTAMPTZ,
  plan_data JSONB DEFAULT '[]',
  optimization_metrics JSONB DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_reservation_batches
CREATE TABLE IF NOT EXISTS ai_reservation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kanban_flows
CREATE TABLE IF NOT EXISTS kanban_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kanban_robots
CREATE TABLE IF NOT EXISTS kanban_robots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id TEXT,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'card_moved',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- lms_events
CREATE TABLE IF NOT EXISTS lms_events (
  id INTEGER PRIMARY KEY,
  type VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
);

-- lms_sessions
CREATE TABLE IF NOT EXISTS lms_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP
);

-- design_library_items
CREATE TABLE IF NOT EXISTS design_library_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  tags TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- hitl_approvals
CREATE TABLE IF NOT EXISTS hitl_approvals (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- logistics_routes
CREATE TABLE IF NOT EXISTS logistics_routes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  from_location TEXT,
  to_location TEXT,
  distance_km DECIMAL(8,2),
  estimated_hours DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- marketing_email_templates
CREATE TABLE IF NOT EXISTS marketing_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'newsletter',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- marketing_social_posts
CREATE TABLE IF NOT EXISTS marketing_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- mro_inventory
CREATE TABLE IF NOT EXISTS mro_inventory (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT,
  warehouse_id TEXT,
  quantity DECIMAL(15,4) DEFAULT 0,
  unit TEXT,
  min_quantity DECIMAL(15,4) DEFAULT 0,
  unit_price DECIMAL(18,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- security_access
CREATE TABLE IF NOT EXISTS security_access (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  access_level TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- security_attendance
CREATE TABLE IF NOT EXISTS security_attendance (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pos_movements_legacy
CREATE TABLE IF NOT EXISTS pos_movements_legacy (
  id INTEGER PRIMARY KEY,
  movement_number TEXT,
  movement_type_id INTEGER,
  status TEXT,
  from_warehouse_id INTEGER,
  to_warehouse_id INTEGER,
  received_by_employee_id INTEGER,
  created_by TEXT,
  supplier_name TEXT,
  document_number TEXT,
  document_date DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
