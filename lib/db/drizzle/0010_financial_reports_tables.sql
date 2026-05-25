-- Financial Reports snapshot tables
-- Run: drizzle-kit push  (in lib/db/)

CREATE TABLE IF NOT EXISTS "rpt_kassa_transactions" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"     DATE NOT NULL,
  "total_inflow"    NUMERIC(18,4) NOT NULL DEFAULT 0,
  "total_outflow"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "net_cash_flow"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "opening_balance" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "closing_balance" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "currency"        VARCHAR(10) NOT NULL DEFAULT 'UZS',
  "details"         JSONB,
  "created_at"      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_rpt_kassa_inflow_nn"  CHECK (total_inflow  >= 0),
  CONSTRAINT "chk_rpt_kassa_outflow_nn" CHECK (total_outflow >= 0)
);
CREATE INDEX IF NOT EXISTS "idx_rpt_kassa_report_date" ON "rpt_kassa_transactions" ("report_date");

CREATE TABLE IF NOT EXISTS "rpt_ombor_qoldiq" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"         DATE NOT NULL,
  "warehouse_id"        INTEGER,
  "warehouse_name"      TEXT,
  "total_items"         INTEGER NOT NULL DEFAULT 0,
  "total_quantity"      NUMERIC(18,4) NOT NULL DEFAULT 0,
  "total_value"         NUMERIC(18,4) NOT NULL DEFAULT 0,
  "average_value_30d"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overstock_flag"      TEXT DEFAULT 'normal',
  "details"             JSONB,
  "created_at"          TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_rpt_ombor_overstock_flag" CHECK (overstock_flag IN ('normal','warning','critical'))
);
CREATE INDEX IF NOT EXISTS "idx_rpt_ombor_report_date"   ON "rpt_ombor_qoldiq" ("report_date");
CREATE INDEX IF NOT EXISTS "idx_rpt_ombor_warehouse_id"  ON "rpt_ombor_qoldiq" ("warehouse_id");

CREATE TABLE IF NOT EXISTS "rpt_debitorlar" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"      DATE NOT NULL,
  "customer_id"      INTEGER,
  "customer_name"    TEXT,
  "total_receivable" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "current"          NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_30"       NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_60"       NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_90_plus"  NUMERIC(18,4) NOT NULL DEFAULT 0,
  "currency"         VARCHAR(10) NOT NULL DEFAULT 'UZS',
  "details"          JSONB,
  "created_at"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_rpt_debitorlar_receivable_nn" CHECK (total_receivable >= 0)
);
CREATE INDEX IF NOT EXISTS "idx_rpt_debitorlar_report_date"  ON "rpt_debitorlar" ("report_date");
CREATE INDEX IF NOT EXISTS "idx_rpt_debitorlar_customer_id"  ON "rpt_debitorlar" ("customer_id");

CREATE TABLE IF NOT EXISTS "rpt_kreditorlar" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"    DATE NOT NULL,
  "vendor_id"      INTEGER,
  "vendor_name"    TEXT,
  "total_payable"  NUMERIC(18,4) NOT NULL DEFAULT 0,
  "current"        NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_30"     NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_60"     NUMERIC(18,4) NOT NULL DEFAULT 0,
  "overdue_90_plus" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "currency"       VARCHAR(10) NOT NULL DEFAULT 'UZS',
  "details"        JSONB,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_rpt_kreditorlar_payable_nn" CHECK (total_payable >= 0)
);
CREATE INDEX IF NOT EXISTS "idx_rpt_kreditorlar_report_date"  ON "rpt_kreditorlar" ("report_date");
CREATE INDEX IF NOT EXISTS "idx_rpt_kreditorlar_vendor_id"    ON "rpt_kreditorlar" ("vendor_id");

CREATE TABLE IF NOT EXISTS "rpt_balans" (
  "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"            DATE NOT NULL,
  "total_assets"           NUMERIC(18,4) NOT NULL DEFAULT 0,
  "current_assets"         NUMERIC(18,4) NOT NULL DEFAULT 0,
  "non_current_assets"     NUMERIC(18,4) NOT NULL DEFAULT 0,
  "total_liabilities"      NUMERIC(18,4) NOT NULL DEFAULT 0,
  "current_liabilities"    NUMERIC(18,4) NOT NULL DEFAULT 0,
  "non_current_liabilities" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "equity"                 NUMERIC(18,4) NOT NULL DEFAULT 0,
  "retained_earnings"      NUMERIC(18,4) NOT NULL DEFAULT 0,
  "currency"               VARCHAR(10) NOT NULL DEFAULT 'UZS',
  "details"                JSONB,
  "created_at"             TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_rpt_balans_report_date" ON "rpt_balans" ("report_date");

CREATE TABLE IF NOT EXISTS "rpt_ishlab_chiqarish" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date"      DATE NOT NULL,
  "planned_quantity" NUMERIC(18,4) NOT NULL DEFAULT 0,
  "actual_quantity"  NUMERIC(18,4) NOT NULL DEFAULT 0,
  "good_quantity"    NUMERIC(18,4) NOT NULL DEFAULT 0,
  "scrap_quantity"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "efficiency_pct"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "scrap_rate_pct"   NUMERIC(18,4) NOT NULL DEFAULT 0,
  "downtime_minutes" INTEGER NOT NULL DEFAULT 0,
  "work_center_id"   INTEGER,
  "details"          JSONB,
  "created_at"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_rpt_ishlab_efficiency_range" CHECK (efficiency_pct >= 0 AND efficiency_pct <= 100),
  CONSTRAINT "chk_rpt_ishlab_scrap_range"      CHECK (scrap_rate_pct >= 0 AND scrap_rate_pct <= 100),
  CONSTRAINT "chk_rpt_ishlab_downtime_nn"      CHECK (downtime_minutes >= 0)
);
CREATE INDEX IF NOT EXISTS "idx_rpt_ishlab_report_date" ON "rpt_ishlab_chiqarish" ("report_date");
