-- Migration: fix-succession-candidates-schema.sql
-- Maqsad: succession_plans va candidates jadvallari schema'ni kod bilan mos qilish.

-- ─── 1. succession_plans ────────────────────────────────────────────────────
-- DB:    user_id, target_position_id, target_date, notes, status
-- Code:  position_id, current_holder_id, candidate_id, readiness_level, development_plan, priority

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='succession_plans' AND column_name='target_position_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='succession_plans' AND column_name='position_id') THEN
    ALTER TABLE succession_plans RENAME COLUMN target_position_id TO position_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='succession_plans' AND column_name='user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='succession_plans' AND column_name='candidate_id') THEN
    ALTER TABLE succession_plans RENAME COLUMN user_id TO candidate_id;
  END IF;
END$$;

ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS current_holder_id integer REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS readiness_level varchar(20) DEFAULT 'developing';
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS development_plan text;
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS priority varchar(20) DEFAULT 'medium';

-- ─── 2. candidates ──────────────────────────────────────────────────────────
-- DB:    id, full_name, phone, email, ..., deleted_at, deleted_by
-- Code:  first_name, last_name, rating, experience_years, is_archived

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS first_name varchar(100);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS last_name varchar(100);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Existing rows uchun first_name/last_name'ni full_name'dan to'ldirish
UPDATE candidates
SET first_name = COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)),
    last_name  = COALESCE(last_name, NULLIF(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1), ''))
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- ─── 3. leave-types route — agar /api/leave-types kerak bo'lsa ─────────────
-- (Bu controller-level vazifa, hozir leave-types alohida controller yo'q.
--  /api/hr/leave-types deb ham mavjud emas. Frontend boshqa endpoint chaqiradi.)

-- ─── 4. Test data ──────────────────────────────────────────────────────────
-- Succession plans uchun (key positions for top managers)
INSERT INTO succession_plans (
  candidate_id, position_id, current_holder_id, readiness_level,
  development_plan, target_date, priority, status
)
SELECT
  null::int, p.id, mgr.id,
  CASE WHEN p.id <= 3 THEN 'ready_now' WHEN p.id <= 8 THEN 'ready_1y' ELSE 'developing' END,
  'Strategik lavozim uchun yetishtiruv rejasi',
  CURRENT_DATE + INTERVAL '6 months',
  CASE WHEN p.id <= 5 THEN 'high' ELSE 'medium' END,
  'active'
FROM positions p
LEFT JOIN employees mgr ON mgr.position_id = p.id AND mgr.status = 'active'
WHERE p.id <= 10
  AND NOT EXISTS (SELECT 1 FROM succession_plans sp WHERE sp.position_id = p.id);

-- Candidates demo
INSERT INTO candidates (full_name, first_name, last_name, phone, email, position_id, status, rating, experience_years, source)
SELECT * FROM (VALUES
  ('Iskandar Tursunov', 'Iskandar', 'Tursunov', '+998901111200', 'iskandar.t@candidate.uz', 1,  'screening', 75, 5,  'linkedin'),
  ('Dilnoza Ahmadova',  'Dilnoza',  'Ahmadova', '+998901111201', 'dilnoza.a@candidate.uz',  2,  'interview', 82, 7,  'referral'),
  ('Murod Karimov',     'Murod',    'Karimov',  '+998901111202', 'murod.k@candidate.uz',     3,  'offer',     90, 10, 'website'),
  ('Sevara Yusupova',   'Sevara',   'Yusupova', '+998901111203', 'sevara.y@candidate.uz',    6,  'applied',   60, 3,  'jobsite'),
  ('Bahodir Eshonov',   'Bahodir',  'Eshonov',  '+998901111204', 'bahodir.e@candidate.uz',   10, 'screening', 70, 6,  'referral')
) AS c(full_name, first_name, last_name, phone, email, position_id, status, rating, experience_years, source)
WHERE NOT EXISTS (SELECT 1 FROM candidates c2 WHERE c2.full_name = c.full_name);

-- ─── Verify ─────────────────────────────────────────────────────────────────
SELECT 'succession_plans' AS t, COUNT(*) FROM succession_plans
UNION ALL SELECT 'candidates', COUNT(*) FROM candidates;
