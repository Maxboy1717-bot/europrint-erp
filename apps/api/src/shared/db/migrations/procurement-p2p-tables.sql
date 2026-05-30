-- procurement-p2p-tables.sql
-- 2026-05-30 — P2P xarid-to'lov jadvallari (Maxboy vision): procurement_requests + items + approvals.
-- Toza P2P-maxsus. Tasdiq zanjiri ProcurementApprovalChainService (org-sxema) bilan to'ldiriladi.
-- Idempotent: CREATE TABLE IF NOT EXISTS.
--
-- Qo'llash: psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/procurement-p2p-tables.sql

CREATE TABLE IF NOT EXISTS procurement_requests (
  id                     serial PRIMARY KEY,
  request_number         varchar(50) NOT NULL UNIQUE,
  requester_employee_id  integer NOT NULL,
  requester_user_id      integer,
  org_department_id      integer,
  title                  text NOT NULL,
  description            text,
  vendor_id              integer,
  total_amount           numeric(18,2) NOT NULL DEFAULT 0,
  currency               varchar(3) NOT NULL DEFAULT 'UZS',
  payment_mode           varchar(20) NOT NULL DEFAULT 'advance',
  target_warehouse_type  varchar(40),
  status                 varchar(24) NOT NULL DEFAULT 'draft',
  current_approval_level integer NOT NULL DEFAULT 0,
  needed_by_date         varchar(10),
  rules                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by             integer,
  created_at             timestamp NOT NULL DEFAULT now(),
  updated_at             timestamp NOT NULL DEFAULT now(),
  CONSTRAINT procurement_requests_status_chk CHECK (status IN ('draft','pending_approval','approved','rejected','purchasing','received','closed','cancelled')),
  CONSTRAINT procurement_requests_payment_chk CHECK (payment_mode IN ('advance','reimburse'))
);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_requester ON procurement_requests(requester_employee_id);

CREATE TABLE IF NOT EXISTS procurement_request_items (
  id              serial PRIMARY KEY,
  request_id      integer NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  material_id     integer,
  description     text NOT NULL,
  quantity        numeric(18,2) NOT NULL DEFAULT 1,
  unit            varchar(20) NOT NULL DEFAULT 'dona',
  estimated_price numeric(18,2) NOT NULL DEFAULT 0,
  line_total      numeric(18,2) NOT NULL DEFAULT 0,
  created_at      timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procurement_request_items_request ON procurement_request_items(request_id);

CREATE TABLE IF NOT EXISTS procurement_approvals (
  id                serial PRIMARY KEY,
  request_id        integer NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  level             integer NOT NULL,
  org_department_id integer,
  approver_user_id  integer NOT NULL,
  status            varchar(16) NOT NULL DEFAULT 'pending',
  decided_at        timestamp,
  comments          text,
  created_at        timestamp NOT NULL DEFAULT now(),
  CONSTRAINT procurement_approvals_status_chk CHECK (status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS idx_procurement_approvals_request ON procurement_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_procurement_approvals_approver ON procurement_approvals(approver_user_id);
