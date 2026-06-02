-- org-node-portret-tables.sql
-- 2026-06-02 — Lavozim kartochkasi (Portret wizard) backend persistence (Agent12 §5).
-- Org-sxema node "Portret" tab (OrgNodePortretTab.tsx) endi haqiqatan saqlanadi:
--   org_node_portret  — har node uchun 1 portret (UNIQUE node_id → upsert), portret_data JSONB.
--   node_hr_requests  — portretdan ko'tarilgan "HR ga so'rov" (HRRequestDialog).
-- ADD-ONLY / idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- Runtime ekvivalenti: ensureOrgNodePortretTable() / ensureNodeHrRequestsTable()
--   (apps/api/src/common/database/ddl-migrations.ts) — repo birinchi chaqiruvda lazy yaratadi.
--
-- Qo'llash: psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/org-node-portret-tables.sql

CREATE TABLE IF NOT EXISTS org_node_portret (
  id           serial PRIMARY KEY,
  node_id      integer NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  portret_data jsonb   NOT NULL DEFAULT '{}'::jsonb,
  creator_id   integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
-- One portret per node — upsert keyed on node_id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_node_portret_node_id ON org_node_portret(node_id);

CREATE TABLE IF NOT EXISTS node_hr_requests (
  id           serial PRIMARY KEY,
  node_id      integer NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  portret_id   integer REFERENCES org_node_portret(id) ON DELETE SET NULL,
  request_type varchar(40) NOT NULL DEFAULT 'new_hire',
  priority     varchar(20) NOT NULL DEFAULT 'normal',
  status       varchar(20) NOT NULL DEFAULT 'new',
  comment      text,
  node_name    text,
  requester_id integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_node_hr_requests_node_id ON node_hr_requests(node_id);
