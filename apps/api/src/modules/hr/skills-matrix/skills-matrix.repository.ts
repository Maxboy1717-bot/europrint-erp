/**
 * @module skills-matrix.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import {
  skill_catalog, employee_skill_scores, position_skill_requirements, hrEmployees,
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
      return Ok(castTo<Row[]>(rows));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeSkills(employeeId: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT ess.*, sc.name AS skill_name, sc.name_ru, sc.category
        FROM employee_skill_scores ess
        JOIN skill_catalog sc ON sc.code = ess.skill_code
        WHERE ess.employee_id = ${employeeId}
        ORDER BY sc.category, sc.name
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async upsertSkillScore(employeeId: number, skillCode: string, currentLevel: number, assessedBy?: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO employee_skill_scores (employee_id, skill_code, current_level, assessed_by, last_assessed_at)
        VALUES (${employeeId}, ${skillCode}, ${currentLevel}, ${assessedBy ?? null}, NOW())
        ON CONFLICT (employee_id, skill_code)
        DO UPDATE SET current_level = ${currentLevel}, assessed_by = ${assessedBy ?? null}, last_assessed_at = NOW()
        RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getGapAnalysis(employeeId: number, positionId?: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT psr.skill_code, sc.name, sc.category,
               COALESCE(ess.current_level, 0) AS current_level,
               psr.required_level,
               (psr.required_level - COALESCE(ess.current_level, 0)) AS gap
        FROM position_skill_requirements psr
        JOIN skill_catalog sc ON sc.code = psr.skill_code
        LEFT JOIN employee_skill_scores ess ON ess.skill_code = psr.skill_code AND ess.employee_id = ${employeeId}
        WHERE ${positionId ?? null}::int IS NULL OR psr.position_id = ${positionId ?? null}
        ORDER BY gap DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTeamMatrix(departmentId: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT e.id AS employee_id, e.first_name || ' ' || e.last_name AS employee_name,
               sc.code AS skill_code, sc.name AS skill_name, sc.category,
               COALESCE(ess.current_level, 0) AS current_level
        FROM employees e
        CROSS JOIN skill_catalog sc
        LEFT JOIN employee_skill_scores ess ON ess.employee_id = e.id AND ess.skill_code = sc.code
        WHERE e.department_id = ${departmentId} AND e.status = 'active' AND sc.is_active = true
        ORDER BY e.last_name, sc.category, sc.name
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeesNeedingAssessment(): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT e.id AS employee_id, e.first_name, e.last_name,
               COUNT(ess.id) AS scored_skills, AVG(ess.current_level) AS avg_level
        FROM employees e
        LEFT JOIN employee_skill_scores ess ON ess.employee_id = e.id
        WHERE e.status = 'active'
        GROUP BY e.id, e.first_name, e.last_name
        HAVING COUNT(ess.id) < 3
        ORDER BY scored_skills ASC
        LIMIT 50
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
