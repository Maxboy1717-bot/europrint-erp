-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 06-sd #2 — "MaterialRequiredEvent + MM reject / 24h→48h escalation".
-- The initial material-wait SIGNAL already flows (OrderMaterialWaitingEvent →
-- OutboxEventWriter → domain_events; MM's OrderMaterialWaitingListener writes a
-- hitl_approvals review item). This migration adds the MISSING escalation half:
-- a durable, idempotent ledger recording who was escalated at which level, so the
-- hourly sweep parks the order in 'material-wait' (Ожд.Сырьё) and escalates
-- 24h→sales_manager, 48h→director (vision-given fixed defaults; NO owner data).
-- Standalone table (no FK to sales_orders) so it never blocks on legacy/absent
-- orders; empty by default → zero behavioural change until the cron fires.
CREATE TABLE IF NOT EXISTS sd_material_wait_escalations (
  id               serial PRIMARY KEY,
  sales_order_id   integer NOT NULL,
  hitl_approval_id integer,
  escalation_level integer NOT NULL,          -- 1 = sales_manager (24h / MM-reject), 2 = director (48h)
  notify_role      varchar(64) NOT NULL,      -- 'sales_manager' | 'director'
  reason           text,
  age_hours        integer,                   -- material-wait age (hours) when escalated
  escalated_at     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);
-- Idempotency: at most one escalation per (order, level); the hourly sweep re-runs safely.
CREATE UNIQUE INDEX IF NOT EXISTS ux_sd_matwait_escal_order_level
  ON sd_material_wait_escalations (sales_order_id, escalation_level);
CREATE INDEX IF NOT EXISTS ix_sd_matwait_escal_order
  ON sd_material_wait_escalations (sales_order_id);
