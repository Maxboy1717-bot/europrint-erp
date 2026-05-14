-- ============================================================================
-- Migration: org-structure-sync.sql
--
-- Maqsad: `/org-structure/hierarchy` sahifasini ishga tushirish.
--
-- Muammo: 2 ta parallel sistema mavjud:
--   - departments + employees (asosiy, ma'lumot bor)
--   - org_departments + employee_org_departments + users (yangi, BO'SH)
--
-- Frontend `OrgStructureHierarchy.tsx` faqat ikkinchi sistemadan o'qiydi.
-- Shuning uchun ma'lumotni birinchi sistemadan ikkinchisiga ko'chiramiz.
--
-- Bosqichlar:
--   1. `org_departments.is_active` ustunini qo'shish (Drizzle schema'da bor, DB'da yo'q)
--   2. `employees`'dan `users`'ga sync (login uchun, password_hash = test123 bcrypt)
--   3. `departments` → `org_departments` ko'chirish (head_user_id mapping bilan)
--   4. `employees.department_id` → `employee_org_departments` (xodim-bo'lim biriktirish)
--
-- Idempotent: ON CONFLICT, IF NOT EXISTS, WHERE NOT EXISTS bilan.
-- ============================================================================

-- ─── 1. is_active ustunini qo'shish ─────────────────────────────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
UPDATE org_departments SET is_active = true WHERE is_active IS NULL;

-- ─── 2. Employees → Users sync ──────────────────────────────────────────────
-- Har xodim uchun user yarataylik (agar mavjud bo'lmasa).
-- password_hash: QULFLANGAN — hech kim bu hash bilan kira olmaydi.
-- Admin panel orqali har bir foydalanuvchiga parol o'rnatilishi kerak.
-- XAVFSIZLIK: Eski 'test123' bcrypt hash ishlatilmaydi (CVE risk).

INSERT INTO users (
  username, email, password_hash, first_name, last_name,
  full_name, employee_id, role, status, is_active,
  department_id, position_id, phone, hire_date,
  created_at, updated_at
)
SELECT
  LOWER(SPLIT_PART(e.email_personal, '@', 1))                         AS username,
  e.email_personal                                                    AS email,
  '!' || encode(gen_random_bytes(20), 'hex')                          AS password_hash, -- Locked: bcrypt-invalid hash, no login until admin sets password
  e.first_name,
  e.last_name,
  TRIM(e.first_name || ' ' || COALESCE(e.last_name, ''))              AS full_name,
  e.id                                                                AS employee_id,
  CASE
    WHEN e.position_id IN (1, 2)         THEN 'super_admin'
    WHEN e.position_id IN (3, 4, 5)      THEN 'director'
    WHEN e.position_id BETWEEN 6 AND 20  THEN 'manager'
    ELSE 'employee'
  END                                                                 AS role,
  'active'                                                            AS status,
  true                                                                AS is_active,
  e.department_id,
  e.position_id,
  e.phone_number                                                      AS phone,
  e.hire_date::text                                                   AS hire_date,
  NOW(),
  NOW()
FROM employees e
WHERE e.status = 'active'
  AND e.email_personal IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.employee_id = e.id);

-- ─── 3. Departments → Org Departments ko'chirish ────────────────────────────
-- Hierarchy level hisoblash:
--   parent_id IS NULL                    → level 0 (Egasi)
--   parent_id matches level-0 dept       → level 1 (Boshqarma)
--   ...
-- Soddalashtirilgan: rekursiv CTE bilan hisoblaymiz.

INSERT INTO org_departments (
  id, name, name_ru, parent_id, level, hierarchy_level, node_type,
  head_user_id, sort_order, color, description, tskp,
  created_at, is_active
)
SELECT
  d.id,
  COALESCE(d.name_uz, d.name)                AS name,
  d.name_ru,
  d.parent_id,
  COALESCE(d.level, 0)                       AS level,
  COALESCE(d.level, 0)                       AS hierarchy_level,
  CASE
    WHEN d.parent_id IS NULL  THEN 'owner'
    WHEN d.level = 1          THEN 'top_director'
    WHEN d.level = 2          THEN 'director'
    ELSE 'department'
  END                                        AS node_type,
  u.id                                       AS head_user_id,
  COALESCE(d.sort_order, d.id)               AS sort_order,
  COALESCE(d.color, 'hsl(220 70% 50%)')      AS color,
  COALESCE(d.description, '')                AS description,
  CAST(GREATEST(1, COALESCE(d.level, 1) + 2) AS text) AS tskp, -- vakansiya soni placeholder
  NOW()                                      AS created_at,
  true                                       AS is_active
FROM departments d
LEFT JOIN users u ON u.employee_id = d.manager_id
WHERE NOT EXISTS (SELECT 1 FROM org_departments od WHERE od.id = d.id)
ON CONFLICT (id) DO UPDATE SET
  head_user_id = EXCLUDED.head_user_id,
  is_active = true;

-- Sequence'ni yangilash (id'lar departments'dan kelgani uchun)
SELECT setval(
  pg_get_serial_sequence('org_departments', 'id'),
  COALESCE((SELECT MAX(id) FROM org_departments), 1)
);

-- Hierarchy level rekursiv yangilash (departments'dan kelmaganlar uchun ham)
WITH RECURSIVE level_calc AS (
  SELECT id, parent_id, 0 AS calc_level FROM org_departments WHERE parent_id IS NULL
  UNION ALL
  SELECT od.id, od.parent_id, lc.calc_level + 1
  FROM org_departments od
  JOIN level_calc lc ON od.parent_id = lc.id
)
UPDATE org_departments od
SET level = lc.calc_level,
    hierarchy_level = lc.calc_level
FROM level_calc lc
WHERE od.id = lc.id;

-- ─── 4. Employee → Org Department assignment ────────────────────────────────
-- Har xodim'ni o'z bo'limiga biriktirib qo'yamiz.
-- `users.employee_id` orqali map qilamiz.

INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, assigned_at)
SELECT
  u.id                AS user_id,
  e.department_id     AS org_department_id,
  true                AS is_primary,
  NOW()               AS assigned_at
FROM employees e
JOIN users u ON u.employee_id = e.id
WHERE e.department_id IS NOT NULL
  AND e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM employee_org_departments eod
    WHERE eod.user_id = u.id AND eod.org_department_id = e.department_id
  );

-- ─── 5. Verification queries (psql output uchun) ────────────────────────────
SELECT '✓ org_departments' AS check, COUNT(*) AS count, COUNT(*) FILTER (WHERE is_active) AS active FROM org_departments
UNION ALL
SELECT '✓ users (xodim)',          COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NULL AND employee_id IS NOT NULL) FROM users
UNION ALL
SELECT '✓ employee_org_departments', COUNT(*), COUNT(*) FROM employee_org_departments;
