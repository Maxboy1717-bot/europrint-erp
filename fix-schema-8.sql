-- design_orders jadvali (Design moduli uchun)
DROP TABLE IF EXISTS design_orders CASCADE;
CREATE TABLE design_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
  client_name VARCHAR(200),
  product_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  deadline DATE,
  assigned_to INTEGER,
  description TEXT,
  ai_prompt TEXT,
  file_urls TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  approved_at TIMESTAMPTZ,
  deal_id INTEGER,
  papka_order_id INTEGER,
  client_company VARCHAR(200),
  client_phone VARCHAR(50),
  client_email VARCHAR(200),
  product_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
