-- LAST FIX: /api/sap/sales-orders
-- sales_orders va sap_sales_orders to'liq qayta yaratish
-- (ikkalasi ham bo'sh, xavfsiz)

DROP TABLE IF EXISTS sales_orders CASCADE;
CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  paid_amount NUMERIC(18, 2) DEFAULT 0,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS sap_sales_orders CASCADE;
CREATE TABLE sap_sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  customer_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(18, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
