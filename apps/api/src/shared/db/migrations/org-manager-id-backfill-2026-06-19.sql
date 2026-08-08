-- ============================================================
-- P51 — org_functions.manager_id + employees.manager_id backfill
-- Root-cause #3: vertical Vysotskiy-7 chain (manager_id derivation).
-- ============================================================
-- ⚠️ NO DDL here. org_functions.manager_id (core-schema.ts:348) and
-- employees.manager_id (employees.ts:38) ALREADY EXIST. This file is a pure
-- DATA backfill, gated behind TWO doors:
--
--   1. DDL/RUN DARVOZA (Q-35): the owner must add an APPROVED stamp below
--      before this file is ever passed to psql.
--   2. DATA DARVOZA: every active org_departments node must have a non-null
--      head_user_id. "Who manages whom" is human knowledge, not derivable by
--      code (Q-40 — no fabricated data). The DO-block below HARD-STOPS while
--      any active node still has a NULL head.
--
-- Equivalent runtime path: POST /org-structure/admin/backfill-manager-ids
-- {"dryRun": false} (org-structure.controller.ts) does the same, also gated.
--
-- GATED — owner fills these two lines, then runs:
-- APPROVED:   <egasi ismi> <sana>     ← owner adds this line to authorise the run
-- DATA_READY: <egasi ismi> <sana>     ← owner adds this once head_user_id is complete
-- ============================================================

-- ⚠️ DATA DARVOZA SAFETY CHECK — aborts the whole migration if any active node
-- is still missing a head_user_id. As of 2026-06-07: ~124 nodes NULL.
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM   org_departments
  WHERE  is_active = true AND head_user_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION
      'DATA DARVOZA BLOKIROVKA: % ta aktiv node head_user_id = NULL. '
      'Avval barcha rahbarlik ma''lumotlarini to''ldiring, so''ng qayta ishlating.',
      null_count;
  END IF;
END $$;

-- ============================================================
-- QISM A: org_functions.manager_id ← nearest ancestor head_user_id
-- Idempotent: only NULL/0 rows. NULL stays NULL where no head up the chain.
-- ============================================================
UPDATE org_functions f
SET    manager_id = (
  WITH RECURSIVE ancestor AS (
    SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
    FROM   org_departments od
    WHERE  od.id = f.department_id AND od.is_active = true
    UNION ALL
    SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
    FROM   org_departments od2
    JOIN   ancestor a ON od2.id = a.parent_id
    WHERE  od2.is_active = true AND a.depth < 10
  )
  SELECT head_user_id
  FROM   ancestor
  WHERE  head_user_id IS NOT NULL
  ORDER  BY depth
  LIMIT  1
)
WHERE  f.is_active = true
  AND  (f.manager_id IS NULL OR f.manager_id = 0);

-- ============================================================
-- QISM B: employees.manager_id ← manager's employees.id
-- Path: primary employee_cards → org_functions → department → parent →
-- head_user_id → employees.id (employees.manager_id stores employees.id,
-- NOT users.id — see employees.ts:38).
-- ⚠️ KANONIK JOIN: employee_cards (M:N, org-phase6-employee-cards-2026-06-08).
--    employee_functions JADVALI MAVJUD EMAS — runtime "relation does not exist".
-- ============================================================
UPDATE employees e
SET    manager_id = mgr_emp.id
FROM   employee_cards    ec
JOIN   org_functions      f    ON f.id = ec.card_id AND f.is_active = true
JOIN   org_departments    dept ON dept.id = f.department_id AND dept.is_active = true
JOIN   org_departments    par  ON par.id = dept.parent_id  AND par.is_active = true
JOIN   employees          mgr_emp ON mgr_emp.user_id = par.head_user_id
WHERE  ec.employee_id = e.id
  AND  ec.is_primary = true
  AND  ec.is_active = true
  AND  (e.manager_id IS NULL OR e.manager_id = 0)
  AND  par.head_user_id IS NOT NULL
  AND  mgr_emp.id <> e.id;

-- ============================================================
-- TEKSHIRUV — backfill natijasi
-- ============================================================
SELECT
  'org_functions.manager_id' AS "jadval",
  COUNT(*) FILTER (WHERE manager_id IS NOT NULL) AS "to_ldirildi",
  COUNT(*) FILTER (WHERE manager_id IS NULL)     AS "null_qoldi",
  COUNT(*)                                        AS "jami"
FROM org_functions WHERE is_active = true

UNION ALL

SELECT
  'employees.manager_id',
  COUNT(*) FILTER (WHERE manager_id IS NOT NULL),
  COUNT(*) FILTER (WHERE manager_id IS NULL),
  COUNT(*)
FROM employees;
