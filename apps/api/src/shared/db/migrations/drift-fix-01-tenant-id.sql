-- ===========================================================================
-- drift-fix-01-tenant-id.sql
-- Adds missing tenant_id column to all tables where Drizzle schema defines it
-- but the DB column does not exist.
-- Idempotent: uses ADD COLUMN IF NOT EXISTS
-- Default = 1 (tenant-1 backfill; multi-tenancy Phase-2 mandate)
-- ===========================================================================

ALTER TABLE employees            ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE attendance           ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE candidates           ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE departments          ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE crm_companies        ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE crm_contacts         ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE crm_deals            ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE crm_leads            ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE leave_requests       ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE payroll_periods      ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE purchase_orders      ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE sales_invoices       ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE sales_orders         ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE salary_history       ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE discipline_records   ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE vacancies            ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE aisha_conversations  ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;
ALTER TABLE aisha_tool_calls     ADD COLUMN IF NOT EXISTS tenant_id integer NOT NULL DEFAULT 1;

-- Index for efficient per-tenant queries (deferred CREATE INDEX CONCURRENTLY recommended in prod)
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id          ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id         ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id     ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant_id       ON sales_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_tenant_id     ON salary_history(tenant_id);
