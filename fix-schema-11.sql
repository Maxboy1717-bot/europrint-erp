-- Backend log'dagi aniq ustun nomlariga moslashtirish

-- 1. quality_defects_camera — backend kutgan to'liq ustunlar
DROP TABLE IF EXISTS quality_defects_camera CASCADE;
CREATE TABLE quality_defects_camera (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  work_center_id INTEGER,
  product_name VARCHAR(200),
  defect_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  image_url TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. qc_certificates — backend kutgan ustunlar (cert_number, issued_date, expiry_date, issued_by)
DROP TABLE IF EXISTS qc_certificates CASCADE;
CREATE TABLE qc_certificates (
  id SERIAL PRIMARY KEY,
  cert_number VARCHAR(100) UNIQUE,
  order_id INTEGER,
  product_name VARCHAR(200),
  issued_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'valid',
  notes TEXT,
  issued_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. qc_final_inspections — status ustun qo'shish (backend uni ishlatadi)
ALTER TABLE qc_final_inspections ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- 4. qc_defects — defect_code va severity ustunlar
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS defect_code VARCHAR(100);
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'minor';

-- 5. sales_orders.id INTEGER bo'lishi kerak (JOIN qc_final_inspections.order_id INTEGER bilan)
-- Avval qarang: agar varchar bo'lsa, JOIN xato beradi
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name='sales_orders' AND column_name='id';

  IF col_type IS NOT NULL AND col_type <> 'integer' THEN
    -- sales_orders qayta yaratish kerak
    DROP TABLE IF EXISTS sales_orders CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100),
  customer_id INTEGER,
  customer_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'new',
  total_amount NUMERIC(18, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mavjud sales_orders ga ustunlar qo'shish (agar table boshqacha bo'lsa)
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';

-- 6. employees — first_name, last_name ta'minlash
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  position VARCHAR(100),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
