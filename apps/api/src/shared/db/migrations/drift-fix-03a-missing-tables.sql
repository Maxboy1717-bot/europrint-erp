-- =============================================================================
-- drift-fix-03a-missing-tables.sql
-- Create missing tables (Part A: order-workflow + kanban-extended + lms)
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS)
-- NO FK constraints — base column types only
-- =============================================================================

-- ─── ORDER WORKFLOW SCHEMA ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ow_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  qty NUMERIC(14,3) NOT NULL,
  unit_price NUMERIC(14,4) NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  sum_net NUMERIC(14,2),
  tech_card_id UUID
);

CREATE TABLE IF NOT EXISTS ow_order_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  fields JSONB NOT NULL DEFAULT '{}',
  ai_autofill_confidence NUMERIC(4,3),
  completeness_score NUMERIC(4,3) NOT NULL DEFAULT 0,
  completed_by INTEGER,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ow_order_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  iteration INTEGER NOT NULL DEFAULT 1,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  produced_at TIMESTAMPTZ,
  customer_decision TEXT DEFAULT 'PENDING',
  feedback JSONB,
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS ow_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  contract_number TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  file_url TEXT,
  template_id UUID,
  ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  signed_by_customer_at TIMESTAMPTZ,
  signed_by_company_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ow_tech_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_line_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  content JSONB NOT NULL DEFAULT '{}',
  ai_generated_from UUID,
  approved_by INTEGER,
  approved_at TIMESTAMPTZ,
  immutable_after_approval BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ow_production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  machine_id TEXT NOT NULL,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  ai_optimizer_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ow_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id UUID NOT NULL,
  order_line_id UUID,
  machine_id TEXT NOT NULL,
  operator_id INTEGER,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  qty_target NUMERIC(14,3) NOT NULL,
  qty_good NUMERIC(14,3) NOT NULL DEFAULT 0,
  qty_scrap NUMERIC(14,3) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ow_qc_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL,
  inspector_id INTEGER,
  ai_vision_agent TEXT,
  verdict TEXT NOT NULL,
  color_delta_e NUMERIC(6,3),
  defect_codes JSONB,
  photo_urls TEXT[],
  inspected_at TIMESTAMPTZ DEFAULT NOW(),
  ai_confidence NUMERIC(4,3),
  human_override BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ow_packaging_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL,
  pallet_barcode TEXT NOT NULL,
  qty NUMERIC(14,3) NOT NULL,
  packaging_type TEXT,
  packed_by INTEGER,
  packed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ow_fg_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  from_location TEXT NOT NULL DEFAULT 'PRODUCTION',
  to_location TEXT NOT NULL DEFAULT 'FG_WAREHOUSE',
  approved_by_prod_head INTEGER,
  approved_by_fg_head INTEGER,
  transferred_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ow_shipping_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  requested_by INTEGER,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by INTEGER,
  delivery_address JSONB NOT NULL DEFAULT '{}',
  contact_phone TEXT,
  payment_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ow_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_request_id UUID NOT NULL,
  truck_id TEXT,
  driver_id INTEGER,
  route_plan JSONB,
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  customer_signature_url TEXT,
  gps_track_url TEXT,
  status TEXT NOT NULL DEFAULT 'DISPATCHED'
);

CREATE TABLE IF NOT EXISTS ow_rework_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  work_order_id UUID,
  trigger TEXT NOT NULL,
  root_cause TEXT,
  qty_affected NUMERIC(14,3),
  cost_impact NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ow_pallet_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_barcode TEXT NOT NULL,
  order_id UUID,
  recoverable_qty NUMERIC(14,3),
  scrap_qty NUMERIC(14,3),
  recovered_at TIMESTAMPTZ,
  recovered_by INTEGER
);

CREATE TABLE IF NOT EXISTS ow_credit_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id INTEGER NOT NULL,
  tier TEXT NOT NULL DEFAULT 'NEW',
  limit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  assessed_at TIMESTAMPTZ,
  assessed_by INTEGER,
  next_review_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ow_document_workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  routing_path JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── KANBAN EXTENDED ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_checklists (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  board_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_card_tags (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  tag_id VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS task_time_entries (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  checklist_items TEXT[],
  board_id VARCHAR,
  created_by_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  deleted_by VARCHAR
);

CREATE TABLE IF NOT EXISTS task_files (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_results (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  description TEXT,
  created_by_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_result_files (
  id SERIAL PRIMARY KEY,
  result_id VARCHAR NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_time_tracks (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  target_minutes INTEGER,
  is_running BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_observers (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  added_by_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_co_executors (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  added_by_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  card_id VARCHAR,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- ─── LMS ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  module_number INTEGER NOT NULL,
  title_uz VARCHAR(200) NOT NULL,
  title_ru VARCHAR(200),
  description TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(30),
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  weight DECIMAL(3,1) DEFAULT 1.0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  score DECIMAL(5,2),
  total_questions INTEGER,
  correct_answers INTEGER,
  is_passed BOOLEAN DEFAULT FALSE,
  answers JSONB,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
