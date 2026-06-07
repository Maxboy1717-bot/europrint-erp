-- APPROVED: owner 2026-06-07
-- Phase 2 tables: hr_referrals · hr_mentorship_pairings · employee_business_trips
--   · councils · mes_sos_events · mes_material_consumption · micro_modules
--   · micro_module_views · qc_approvals · mm_vendor_ratings · mm_mrp_results
-- FK type fix: exhibitions.id varchar/UUID → SERIAL INT

-- ============================================================
-- 1. hr_referrals  (Drizzle schema already in schema-hr-tz2.ts)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_referrals (
  id                   SERIAL PRIMARY KEY,
  referrer_id          INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  candidate_full_name  TEXT NOT NULL,
  candidate_email      TEXT,
  candidate_phone      TEXT,
  position_title       TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','contacted','interviewing','hired','rejected','bonus_paid')),
  bonus_type           TEXT,
  bonus_amount         NUMERIC(14,2),
  bonus_paid           BOOLEAN NOT NULL DEFAULT false,
  hr_notes             TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_referrals_referrer ON hr_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_hr_referrals_status   ON hr_referrals(status);

-- ============================================================
-- 2. hr_mentorship_pairings  (Drizzle schema already in schema-hr-tz2.ts)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_mentorship_pairings (
  id           SERIAL PRIMARY KEY,
  mentor_id    INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mentee_id    INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id    INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','paused','completed','cancelled')),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_mentorship_mentor ON hr_mentorship_pairings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hr_mentorship_mentee ON hr_mentorship_pairings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_hr_mentorship_status ON hr_mentorship_pairings(status);

-- ============================================================
-- 3. employee_business_trips
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_business_trips (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  purpose     TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','completed','cancelled')),
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ebt_employee ON employee_business_trips(employee_id);

-- ============================================================
-- 4. councils  (seed data via ON CONFLICT DO NOTHING)
-- ============================================================
CREATE TABLE IF NOT EXISTS councils (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  council_type     TEXT,
  description      TEXT,
  chairperson_id   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  meeting_schedule TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO councils (id, name, council_type, is_active) VALUES
  (1, 'Boshqaruv Kengashi', 'management', true),
  (2, 'Sifat Kengashi',     'quality',    true),
  (3, 'Moliya Kengashi',    'finance',    true),
  (4, 'HR Kengashi',        'hr',         true),
  (5, 'Texnik Kengash',     'technical',  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. mes_sos_events
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_sos_events (
  id             SERIAL PRIMARY KEY,
  session_id     INTEGER REFERENCES production_sessions(id) ON DELETE SET NULL,
  employee_id    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  reason         TEXT,
  work_center_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  resolved_by    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mes_sos_session ON mes_sos_events(session_id);
CREATE INDEX IF NOT EXISTS idx_mes_sos_wc      ON mes_sos_events(work_center_id);

-- ============================================================
-- 6. mes_material_consumption
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_material_consumption (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER REFERENCES production_sessions(id) ON DELETE SET NULL,
  material_id     INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
  quantity        NUMERIC(14,4) NOT NULL,
  batch_number    TEXT,
  unit_of_measure TEXT,
  recorded_by     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mes_mc_session  ON mes_material_consumption(session_id);
CREATE INDEX IF NOT EXISTS idx_mes_mc_material ON mes_material_consumption(material_id);

-- ============================================================
-- 7. micro_modules  (LMS)
-- ============================================================
CREATE TABLE IF NOT EXISTS micro_modules (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  title_ru    TEXT,
  course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_micro_modules_course  ON micro_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_micro_modules_active  ON micro_modules(is_active);

-- ============================================================
-- 8. micro_module_views  (depends on micro_modules above)
-- ============================================================
CREATE TABLE IF NOT EXISTS micro_module_views (
  micro_module_id INTEGER NOT NULL REFERENCES micro_modules(id) ON DELETE CASCADE,
  employee_id     INTEGER NOT NULL REFERENCES employees(id)     ON DELETE CASCADE,
  viewed_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (micro_module_id, employee_id)
);

-- ============================================================
-- 9. qc_approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS qc_approvals (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER NOT NULL,
  approval_stage TEXT NOT NULL
                   CHECK (approval_stage IN ('design','technical','qc','finance')),
  approved_by    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'approved'
                   CHECK (status IN ('approved','rejected','conditional')),
  notes          TEXT,
  approved_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qc_approvals_order ON qc_approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_qc_approvals_stage ON qc_approvals(approval_stage);

-- ============================================================
-- 10. mm_vendor_ratings
--     mm_vendors / mm_purchase_orders do not yet exist → no FK for those columns
-- ============================================================
CREATE TABLE IF NOT EXISTS mm_vendor_ratings (
  id                SERIAL PRIMARY KEY,
  vendor_id         INTEGER,
  quality_score     NUMERIC(4,2),
  delivery_score    NUMERIC(4,2),
  price_score       NUMERIC(4,2),
  purchase_order_id INTEGER,
  rater_id          INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  notes             TEXT,
  rated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mm_vendor_ratings_vendor ON mm_vendor_ratings(vendor_id);

-- ============================================================
-- 11. mm_mrp_results  (material_cards EXISTS → FK safe)
-- ============================================================
CREATE TABLE IF NOT EXISTS mm_mrp_results (
  material_id         INTEGER PRIMARY KEY REFERENCES material_cards(id) ON DELETE CASCADE,
  required_qty        NUMERIC(14,4) NOT NULL DEFAULT 0,
  available_qty       NUMERIC(14,4) NOT NULL DEFAULT 0,
  shortage_qty        NUMERIC(14,4) NOT NULL DEFAULT 0,
  suggested_order_qty NUMERIC(14,4) NOT NULL DEFAULT 0,
  calculated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. exhibitions.id: character varying (UUID) → SERIAL INT
--     Safe: build-phase DB; 1 test row present → TRUNCATE first
-- ============================================================
TRUNCATE exhibitions CASCADE;
ALTER TABLE exhibitions DROP CONSTRAINT IF EXISTS exhibitions_pkey;
ALTER TABLE exhibitions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE exhibitions ALTER COLUMN id TYPE INTEGER USING NULL;
CREATE SEQUENCE IF NOT EXISTS exhibitions_id_seq START 1;
ALTER TABLE exhibitions ALTER COLUMN id SET DEFAULT nextval('exhibitions_id_seq');
ALTER SEQUENCE exhibitions_id_seq OWNED BY exhibitions.id;
ALTER TABLE exhibitions ADD PRIMARY KEY (id);

-- Fix exhibition_leads.estimated_volume: character varying → numeric (0 rows, safe)
ALTER TABLE exhibition_leads ALTER COLUMN estimated_volume TYPE NUMERIC(14,4)
  USING CASE WHEN estimated_volume ~ '^[0-9]+(\.[0-9]+)?$'
             THEN estimated_volume::NUMERIC(14,4) ELSE NULL END;
