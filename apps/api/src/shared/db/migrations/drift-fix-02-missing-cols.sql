-- ===========================================================================
-- drift-fix-02-missing-cols.sql
-- Adds other high-priority missing columns to existing DB tables.
-- Idempotent: uses ADD COLUMN IF NOT EXISTS
-- ===========================================================================

-- ── ai_usage_logs ─────────────────────────────────────────────────────────
-- These columns are used by ai-router-call.service.ts inserts
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS module         text NOT NULL DEFAULT 'system';
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS action         text NOT NULL DEFAULT 'unknown';
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS cost           decimal(10,6) DEFAULT 0;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS total_tokens   integer DEFAULT 0;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS session_id     text;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS request_summary  text;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS response_summary text;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS latency_ms     integer DEFAULT 0;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS estimated_cost decimal(12,6) DEFAULT 0;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS provider       text;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS task_type      text;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'success';

-- ── employees extra columns ───────────────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type       varchar(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth         date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role                  varchar(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS total_points          integer DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_embedding_updated_at timestamp;

-- ── downtime_events ───────────────────────────────────────────────────────
ALTER TABLE downtime_events ADD COLUMN IF NOT EXISTS reason_code_id  integer;
ALTER TABLE downtime_events ADD COLUMN IF NOT EXISTS duration_min     integer;

-- ── salary_history (extra cols used by payroll service) ──────────────────
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS amount      decimal(18,2);
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS currency    text DEFAULT 'UZS';
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS created_by  integer;

-- ── courses ───────────────────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'active';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_url     text;

-- ── shift_schedules ───────────────────────────────────────────────────────
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- ── lms_tests ─────────────────────────────────────────────────────────────
ALTER TABLE lms_tests ADD COLUMN IF NOT EXISTS max_score       integer DEFAULT 100;
ALTER TABLE lms_tests ADD COLUMN IF NOT EXISTS difficulty_level text;

-- ── lms_assignments ───────────────────────────────────────────────────────
ALTER TABLE lms_assignments ADD COLUMN IF NOT EXISTS enrollment_id text;
ALTER TABLE lms_assignments ADD COLUMN IF NOT EXISTS module_id     text;
ALTER TABLE lms_assignments ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'pending';
ALTER TABLE lms_assignments ADD COLUMN IF NOT EXISTS score         decimal(5,2);

-- ── asset_items ───────────────────────────────────────────────────────────
ALTER TABLE asset_items ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
ALTER TABLE asset_items ADD COLUMN IF NOT EXISTS is_active   boolean DEFAULT true;

-- ── invoice_payments ──────────────────────────────────────────────────────
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS vendor_id    integer;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS cleared_at   timestamp;

-- ── design_orders ─────────────────────────────────────────────────────────
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS sales_order_id text;
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS title          text;
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS files          text DEFAULT '[]';

-- ── stock_transfer_lines (wms-schema version columns) ─────────────────────
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS material_id        integer;
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS quantity           decimal(15,4);
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS unit               text;
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS status             text DEFAULT 'pending';

-- ── production_sessions ───────────────────────────────────────────────────
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS session_id    text;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS work_center_id text;

-- ── warehouse_transactions (used by finance queries) ─────────────────────
-- material_id is the renamed column from material_card_id; already in DB
-- (no ADD needed — material_id already exists, we just fixed Drizzle schema above)

-- ── mm_deliveries ─────────────────────────────────────────────────────────
ALTER TABLE mm_deliveries ADD COLUMN IF NOT EXISTS purchase_order_id text;
ALTER TABLE mm_deliveries ADD COLUMN IF NOT EXISTS vendor_id         text;

-- ── bom_items ─────────────────────────────────────────────────────────────
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS material_id   text;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS scrap_percent decimal(5,2) DEFAULT 0;

-- ── mm_goods_receipts ─────────────────────────────────────────────────────
ALTER TABLE mm_goods_receipts ADD COLUMN IF NOT EXISTS po_id text;
