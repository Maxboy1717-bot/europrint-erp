-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #27 — Nightly inactive-customer cron (A=90/B=60/C=30).
--   Per-ABC inactivity thresholds live in crm_inactivity_rules, seeded A=90/B=60/C=30
--   (vision-specified; no owner data). A nightly sweep flags sd_customers whose most
--   recent non-cancelled sales_orders.created_at is older than their class threshold.
--   All additive + idempotent: new table via IF NOT EXISTS, seed via INSERT..WHERE NOT
--   EXISTS, new sd_customers columns default false/NULL — existing rows unaffected.

CREATE TABLE IF NOT EXISTS crm_inactivity_rules (
  abc_class     varchar(1) PRIMARY KEY,
  inactive_days integer NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO crm_inactivity_rules (abc_class, inactive_days)
  SELECT v.abc_class, v.inactive_days
    FROM (VALUES ('A', 90), ('B', 60), ('C', 30)) AS v(abc_class, inactive_days)
   WHERE NOT EXISTS (SELECT 1 FROM crm_inactivity_rules r WHERE r.abc_class = v.abc_class);

ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS is_inactive           boolean NOT NULL DEFAULT false;
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS inactive_since        timestamptz;
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS inactivity_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sd_customers_is_inactive
  ON sd_customers (is_inactive) WHERE is_inactive = true;
