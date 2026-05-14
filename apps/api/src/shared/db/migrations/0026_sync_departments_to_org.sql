-- Migration 0026: Mavjud departments → org_departments ga bir martalik ko'chirish
-- Idempotent: ON CONFLICT (name, level) DO NOTHING
-- Maqsad: Org chart modulini "haqiqiy" bo'limlar bilan to'ldirish,
--         shundan keyin org chart SINGLE source of truth bo'ladi.

-- ─── 1. Daraxt tartibida (level asc) ko'chirish ───────────────────────────────
-- Level 1 bo'limlar (root nodes)
INSERT INTO org_departments (name, name_ru, parent_id, level, sort_order, is_active, node_type, created_at)
SELECT
  d.name_uz,
  d.name_ru,
  NULL,                          -- root, parent yo'q
  d.level,
  d.sort_order,
  d.is_active,
  'department',
  NOW()
FROM departments d
WHERE d.level = 1
  AND NOT EXISTS (
    SELECT 1 FROM org_departments od
    WHERE od.name = d.name_uz AND od.level = 1
  );

-- Level 2 bo'limlar (parent → level-1 org_department bilan match qilinadi)
INSERT INTO org_departments (name, name_ru, parent_id, level, sort_order, is_active, node_type, created_at)
SELECT
  d.name_uz,
  d.name_ru,
  od_parent.id,                  -- parent_id = level-1 org_department.id
  d.level,
  d.sort_order,
  d.is_active,
  'department',
  NOW()
FROM departments d
JOIN departments d_parent ON d_parent.id = d.parent_id
JOIN org_departments od_parent ON od_parent.name = d_parent.name_uz AND od_parent.level = 1
WHERE d.level = 2
  AND NOT EXISTS (
    SELECT 1 FROM org_departments od
    WHERE od.name = d.name_uz AND od.level = 2
  );

-- Level 3 bo'limlar
INSERT INTO org_departments (name, name_ru, parent_id, level, sort_order, is_active, node_type, created_at)
SELECT
  d.name_uz,
  d.name_ru,
  od_parent.id,
  d.level,
  d.sort_order,
  d.is_active,
  'department',
  NOW()
FROM departments d
JOIN departments d_parent ON d_parent.id = d.parent_id
JOIN org_departments od_parent ON od_parent.name = d_parent.name_uz AND od_parent.level = 2
WHERE d.level = 3
  AND NOT EXISTS (
    SELECT 1 FROM org_departments od
    WHERE od.name = d.name_uz AND od.level = 3
  );

-- ─── 2. departments.code → 'ORG-{org_id}' bilan bog'laymiz ──────────────────
-- Keyinchalik create/update da 'ORG-{id}' kodi ishlatiladi (sync uchun)
-- Bu qadam eski statik kodlarni yangi ORG kodi bilan yangilaydi
UPDATE departments d
SET code = 'ORG-' || od.id::text
FROM org_departments od
WHERE od.name = d.name_uz
  AND od.level = d.level
  AND d.code NOT LIKE 'ORG-%';

-- ─── 3. Lavozimlar: positions → org_departments (node_type='position') ───────
-- Har bir lavozim org chart kartasi sifatida qo'shiladi,
-- tegishli bo'lim ostiga biriktirilib
INSERT INTO org_departments (name, name_ru, parent_id, level, sort_order, is_active, node_type, created_at)
SELECT
  p.name_uz,
  COALESCE(p.name_ru, p.name_uz),
  od.id,                         -- parent = tegishli department
  od.level + 1,
  p.sort_order,
  p.is_active,
  'position',
  NOW()
FROM positions p
JOIN departments d ON d.id = p.department_id
JOIN org_departments od ON od.name = d.name_uz AND od.level = d.level
WHERE p.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM org_departments ex
    WHERE ex.name = p.name_uz AND ex.node_type = 'position' AND ex.parent_id = od.id
  )
LIMIT 500;

-- ─── 4. positions.code → 'ORG-{org_id}' bilan bog'laymiz ───────────────────
UPDATE positions p
SET code = 'ORG-' || od.id::text
FROM org_departments od
WHERE od.name = p.name_uz
  AND od.node_type = 'position'
  AND p.code NOT LIKE 'ORG-%';
