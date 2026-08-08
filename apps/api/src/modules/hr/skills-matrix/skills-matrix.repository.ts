/**
 * @module skills-matrix.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * CANONICAL TABLE DECISION (2026-07-13): per-employee skill records live in
 * `employee_skills` — NOT `employee_skill_scores`. Reasoning:
 *   - `employee_skills` is the table already wired to the FE "Ko'nikmalar
 *     Matritsasi" page (SkillsMatrix.tsx -> /api/hr/employee-skills via
 *     hr-compat-a.controller.ts), to the MES cert-expiry gate
 *     (lms-cert-expired-block.service.ts), to Director analytics
 *     (analytics-extended.repository.ts), hr-gsd, and shift.repository.ts —
 *     7+ live call sites.
 *   - A prior team decision (see schema-misc-app-b.ts:104-110, dated
 *     2026-05-31) already froze the `skills`/`user_skills` pair in favour of
 *     `employee_skills` ("the live employee-skill source is employee_skills
 *     ... do not add new consumers").
 *   - The live DB column set on employee_skills (verified via
 *     information_schema, 2026-07-13) already carries current_level,
 *     required_level, skill_code, status, skill_category, self_score,
 *     manager_score, final_score, certification_id — a superset of what
 *     employee_skill_scores offered (id, employee_id, skill_code,
 *     current_level, assessed_by, last_assessed_at). No schema change is
 *     needed to fold this module in.
 *   - `employee_skill_scores` had exactly ONE consumer: this module. No FE
 *     page calls /api/hr-v2/skills-matrix/* (grep-verified against
 *     artifacts/erp-dashboard/src) — it was an orphaned parallel table, not a
 *     genuinely different business concept. 0 rows in both tables (post
 *     2026-07-11 company reset) — nothing to migrate.
 *
 * `skill_catalog` (taxonomy) and `position_skill_requirements` (target level
 * per position) are kept as-is — they are shared, complementary reference
 * tables (not per-employee skill records) and are not part of the
 * incompatible-duplicate cluster.
 *
 * KNOWN GAP (flagged for owner, not fixed here — Q-35 schema changes need
 * approval): employee_skills has no UNIQUE constraint on
 * (employee_id, skill_code), so upsertSkillScore() below does a manual
 * check-then-write instead of an atomic ON CONFLICT upsert. Under concurrent
 * writes for the same employee+skill this can create a duplicate row. Adding
 * `CREATE UNIQUE INDEX employee_skills_emp_skill_code_uniq ON employee_skills
 * (employee_id, skill_code) WHERE skill_code IS NOT NULL` (owner-approved
 * migration) would close this and let the upsert use ON CONFLICT.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import {
  skill_catalog, employee_skills, position_skill_requirements,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class SkillsMatrixRepository {
  async getSkillCatalog(): Promise<Result<Row[]>>  {
    try {
      const rows = await db.select()
        .from(skill_catalog)
        .where(eq(skill_catalog.is_active, true))
        .orderBy(skill_catalog.category, skill_catalog.name);
      return Ok(castTo<Row[]>(rows));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getEmployeeSkills(employeeId: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT es.*, sc.name_ru
        FROM employee_skills es
        LEFT JOIN skill_catalog sc ON sc.code = es.skill_code
        WHERE es.employee_id = ${employeeId}
        ORDER BY es.skill_category NULLS LAST, es.skill_name
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async upsertSkillScore(employeeId: number, skillCode: string, currentLevel: number, assessedBy?: number): Promise<Result<Row[]>>  {
    try {
      const catalogRows = await runQuery<Row>(sql`
        SELECT name, category FROM skill_catalog WHERE code = ${skillCode} AND is_active = true LIMIT 1
      `);
      const catalogRow = catalogRows.rows[0];
      if (!catalogRow) return Err(`skill_catalog code not found: ${skillCode}`);

      const existing = await runQuery<Row>(sql`
        SELECT id FROM employee_skills WHERE employee_id = ${employeeId} AND skill_code = ${skillCode} LIMIT 1
      `);

      const rows = existing.rows.length > 0
        ? await runQuery<Row>(sql`
            UPDATE employee_skills
            SET current_level = ${currentLevel}, verified_by = ${assessedBy ?? null}, updated_at = NOW()
            WHERE employee_id = ${employeeId} AND skill_code = ${skillCode}
            RETURNING *
          `)
        : await runQuery<Row>(sql`
            INSERT INTO employee_skills (
              employee_id, skill_code, skill_name, skill_category,
              current_level, verified_by, created_at, updated_at
            )
            VALUES (
              ${employeeId}, ${skillCode}, ${catalogRow['name']}, ${catalogRow['category']},
              ${currentLevel}, ${assessedBy ?? null}, NOW(), NOW()
            )
            RETURNING *
          `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getGapAnalysis(employeeId: number, positionId?: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT psr.skill_code, psr.skill_name, psr.skill_category AS category,
               COALESCE(es.current_level, 0) AS current_level,
               psr.required_level,
               (psr.required_level - COALESCE(es.current_level, 0)) AS gap
        FROM position_skill_requirements psr
        LEFT JOIN employee_skills es ON es.skill_code = psr.skill_code AND es.employee_id = ${employeeId}
        WHERE ${positionId ?? null}::int IS NULL OR psr.position_id = ${positionId ?? null}
        ORDER BY gap DESC
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getTeamMatrix(departmentId: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT e.id AS employee_id, e.first_name || ' ' || e.last_name AS employee_name,
               sc.code AS skill_code, sc.name AS skill_name, sc.category,
               COALESCE(es.current_level, 0) AS current_level
        FROM employees e
        CROSS JOIN skill_catalog sc
        LEFT JOIN employee_skills es ON es.employee_id = e.id AND es.skill_code = sc.code
        WHERE e.department_id = ${departmentId} AND e.status = 'active' AND sc.is_active = true
        ORDER BY e.last_name, sc.category, sc.name
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getEmployeesNeedingAssessment(): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT e.id AS employee_id, e.first_name, e.last_name,
               COUNT(es.id) AS scored_skills, AVG(es.current_level) AS avg_level
        FROM employees e
        LEFT JOIN employee_skills es ON es.employee_id = e.id
        WHERE e.status = 'active'
        GROUP BY e.id, e.first_name, e.last_name
        HAVING COUNT(es.id) < 3
        ORDER BY scored_skills ASC
        LIMIT 50
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
