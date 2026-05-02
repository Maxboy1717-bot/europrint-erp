-- ============================================================================
-- 4-bosqich: type mismatch fix + marketing jadvallar
-- ============================================================================

-- 1. sales_orders.customer_id: VARCHAR → INTEGER (sap/sales-orders uchun)
DO $$
BEGIN
  ALTER TABLE sales_orders ALTER COLUMN customer_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. crm_contacts.company_id: VARCHAR → INTEGER (crm/contacts uchun)
DO $$
BEGIN
  ALTER TABLE crm_contacts ALTER COLUMN company_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. crm_companies.id ham INTEGER bo'lishini tekshirish
DO $$
BEGIN
  ALTER TABLE crm_companies ALTER COLUMN id TYPE INTEGER USING id::text::INTEGER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. sd_customers.id INTEGER bo'lishini tekshirish
DO $$
BEGIN
  ALTER TABLE sd_customers ALTER COLUMN id TYPE INTEGER USING id::text::INTEGER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. sap_sales_orders.customer_id INTEGER
DO $$
BEGIN
  ALTER TABLE sap_sales_orders ALTER COLUMN customer_id TYPE INTEGER USING NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. marketing_leads jadvali (dashboard/stats, leads/loss-analysis uchun)
CREATE TABLE IF NOT EXISTS marketing_leads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  converted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS campaign_id INTEGER;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 7. marketing_content_posts jadvali (content/posts uchun)
CREATE TABLE IF NOT EXISTS marketing_content_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500),
  content TEXT,
  post_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id INTEGER,
  tags TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(50);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS author_id INTEGER;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE marketing_content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
