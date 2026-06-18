import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeCall, Ok, Err, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OrgRepository {
  private exec(q: ReturnType<typeof sql>): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  async listRazryad(): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT id, level, name_uz, name_ru, coefficient, min_months, description_uz
      FROM razryad_levels
      ORDER BY level
    `);
  }

  async listDepartments(): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT
        d.id, d.name, d.name_ru, d.node_type, d.level, d.parent_id,
        d.head_user_id, d.color, d.tskp, d.is_active,
        COUNT(DISTINCT ef.user_id) FILTER (WHERE ef.deleted_at IS NULL) AS employee_count,
        COUNT(DISTINCT f.id)       FILTER (WHERE f.deleted_at IS NULL)  AS function_count
      FROM org_departments d
      LEFT JOIN org_functions     f  ON f.department_id = d.id
      LEFT JOIN employee_functions ef ON ef.function_id = f.id
      WHERE d.is_active = true
      GROUP BY d.id
      ORDER BY d.level, d.sort_order, d.name
    `);
  }

  async listFunctions(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT
        f.id,
        f.position_name,
        f.position_name_ru,
        f.code,
        f.level,
        f.status,
        f.salary_type,
        f.min_salary,
        f.max_salary,
        f.tskp,
        f.tskp_target,
        f.tskp_measurement_unit,
        f.ai_exam_enabled,
        f.is_active,
        f.created_at,
        d.id   AS department_id,
        d.name AS department_name,
        r.level      AS razryad_level,
        r.name_uz    AS razryad_name,
        r.coefficient AS razryad_coefficient,
        COUNT(DISTINCT ef.id) FILTER (WHERE ef.deleted_at IS NULL) AS employee_count
      FROM org_functions f
      LEFT JOIN org_departments  d  ON d.id = f.department_id
      LEFT JOIN razryad_levels   r  ON r.id = f.razryad_level_id
      LEFT JOIN employee_functions ef ON ef.function_id = f.id
      WHERE f.deleted_at IS NULL
        AND (${departmentId}::int IS NULL OR f.department_id = ${departmentId})
        AND (${status}::text IS NULL OR f.status = ${status})
      GROUP BY f.id, d.id, d.name, r.level, r.name_uz, r.coefficient
      ORDER BY d.name, f.position_name
    `);
  }

  async findFunctionById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT
        f.*,
        d.name AS department_name,
        r.level AS razryad_level, r.name_uz AS razryad_name, r.coefficient AS razryad_coefficient,
        COUNT(DISTINCT ef.id) FILTER (WHERE ef.deleted_at IS NULL) AS employee_count
      FROM org_functions f
      LEFT JOIN org_departments  d  ON d.id = f.department_id
      LEFT JOIN razryad_levels   r  ON r.id = f.razryad_level_id
      LEFT JOIN employee_functions ef ON ef.function_id = f.id
      WHERE f.id = ${id} AND f.deleted_at IS NULL
      GROUP BY f.id, d.name, r.level, r.name_uz, r.coefficient
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
