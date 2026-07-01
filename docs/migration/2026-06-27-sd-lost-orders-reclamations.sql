-- APPROVED: egasi '3340-prompt loop davom, GENUINE-PENDING ro'yxatidan SD lost-orders' 2026-06-27
-- SD lost-orders + reklamatsiya (T26-4-QC-WMS-SD buildable-gap). Additive faqat (Q-46).

CREATE TABLE IF NOT EXISTS sd_lost_orders (
  id SERIAL PRIMARY KEY,
  sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES sd_customers(id) ON DELETE SET NULL,
  reason_code VARCHAR(40) NOT NULL,
  reason_text TEXT,
  lost_amount NUMERIC(18,2),
  competitor_name VARCHAR(200),
  lost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_customer ON sd_lost_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_reason ON sd_lost_orders (reason_code);
CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_date ON sd_lost_orders (lost_date);

CREATE TABLE IF NOT EXISTS sd_reclamations (
  id SERIAL PRIMARY KEY,
  reclamation_number VARCHAR(40) NOT NULL,
  sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES sd_customers(id) ON DELETE SET NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  resolution_text TEXT,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sd_reclamations_number ON sd_reclamations (reclamation_number);
CREATE INDEX IF NOT EXISTS idx_sd_reclamations_status ON sd_reclamations (status);
CREATE INDEX IF NOT EXISTS idx_sd_reclamations_customer ON sd_reclamations (customer_id);
