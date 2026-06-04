/**
 * @module users-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

@Injectable()
export class UsersCompatService {

  async listUsers(page = '1', limit = '50', search = ''): Promise<Result<{ ok: boolean; data: Record<string, unknown>[]; total: number; page: number; limit: number }>> {
    return safeCall(async () => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 50);
    const offset = (pageNum - 1) * limitNum;
    const searchPattern = `%${search}%`;
    const result = await rawSql(sql`
      SELECT u.id, u.username, u.email, NULL::text AS role, u.created_at, u.updated_at,
        COALESCE(NULLIF(TRIM(COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'')), ''), (u.first_name || ' ' || u.last_name)) AS full_name,
        COALESCE(NULLIF(TRIM(COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'')), ''), (u.first_name || ' ' || u.last_name)) AS "fullName",
        primary_org.dept_id   AS "orgDepartmentId",
        primary_org.dept_name AS "orgDepartmentName",
        primary_org.pos_name  AS "orgPositionName",
        e.id AS employee_id
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT
          eod.org_department_id::text        AS dept_id,
          od.name                         AS dept_name,
          COALESCE(of2.position_name, '')    AS pos_name
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
        WHERE eod.user_id = u.id AND eod.is_primary = true
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      ) primary_org ON true
      WHERE (${search} = '' OR (u.first_name || ' ' || u.last_name) ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern} OR u.username ILIKE ${searchPattern})
      ORDER BY u.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);
    const countResult = await rawSql(sql`
      SELECT COUNT(*) AS total FROM users u
      WHERE (${search} = '' OR (u.first_name || ' ' || u.last_name) ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern} OR u.username ILIKE ${searchPattern})
    `);
    const total = Number((dbRows(countResult)[0] as Record<string, unknown>)?.['total'] ?? 0);
    return { ok: true, data: dbRows(result), total, page: pageNum, limit: limitNum };
  
    });}
}
