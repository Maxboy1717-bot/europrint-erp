-- Marketing GURUH 2 stub → real implementation tables
-- Created: 2026-05-28

-- Blog posts table (already defined in marketing-schema.ts as blogPosts)
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug VARCHAR(200) NOT NULL UNIQUE,
  title_uz VARCHAR(500) NOT NULL,
  title_ru VARCHAR(500),
  body_uz TEXT,
  body_ru TEXT,
  excerpt TEXT,
  cover_image TEXT,
  tags JSONB DEFAULT '[]',
  seo_title VARCHAR(255),
  seo_description TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id VARCHAR(36),
  view_count INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing budget lines (already defined in marketing-schema.ts as marketingBudgetLines)
CREATE TABLE IF NOT EXISTS marketing_budget_lines (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  category VARCHAR(50) NOT NULL,
  planned_amount NUMERIC(15,2) DEFAULT 0 CHECK (planned_amount IS NULL OR planned_amount >= 0),
  actual_amount NUMERIC(15,2) DEFAULT 0 CHECK (actual_amount IS NULL OR actual_amount >= 0),
  description VARCHAR(500),
  approved_by VARCHAR(36),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing calendar events (new table)
CREATE TABLE IF NOT EXISTS marketing_calendar_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'campaign'
    CHECK (event_type IN ('campaign','meeting','deadline','exhibition')),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','ongoing','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing lead contacts (already defined in marketing-schema.ts as marketingLeadContacts)
CREATE TABLE IF NOT EXISTS marketing_lead_contacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('call','meeting','email','whatsapp','telegram')),
  summary TEXT,
  outcome VARCHAR(100) CHECK (outcome IS NULL OR outcome IN ('interested','not_interested','callback','no_answer','converted')),
  contacted_by VARCHAR(36),
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts (is_published);
CREATE INDEX IF NOT EXISTS idx_marketing_budget_lines_year_month ON marketing_budget_lines (year, month);
CREATE INDEX IF NOT EXISTS idx_marketing_calendar_events_start_date ON marketing_calendar_events (start_date);
CREATE INDEX IF NOT EXISTS idx_marketing_lead_contacts_lead_id ON marketing_lead_contacts (lead_id);
