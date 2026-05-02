import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

function buildTree(
  nodes: Record<string, unknown>[],
  parentId: number | null = null,
): Record<string, unknown>[] {
  return (Array.isArray(nodes) ? nodes : []).filter((n) => (n['parent_id'] ?? null) === parentId)
    .map((n) => ({ ...n, children: buildTree(nodes, n['id'] as number) }));
}

@Injectable()
export class OrgChartCompatService {

  async getOrgTree(departmentId?: string): Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
    const deptFilter = departmentId
      ? sql`WHERE d.id = ${parseInt(departmentId, 10)}`
      : sql``;
    const [depts, emps] = await Promise.all([
      rawSql(sql`
        SELECT d.id, d.name, d.name_uz, d.parent_id, d.manager_id,
               COUNT(e.id) AS employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        ${deptFilter}
        GROUP BY d.id, d.name, d.name_uz, d.parent_id, d.manager_id
        ORDER BY d.parent_id NULLS FIRST, d.name
      `),
      rawSql(sql`
        SELECT e.id, e.first_name || ' ' || e.last_name AS full_name,
               e.department_id, e.photo_url, e.employee_code,
               COALESCE(p.name, p.name_uz) AS position_name
        FROM employees e
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.status = 'active'
        ORDER BY e.first_name
      `),
    ]);
    const deptList = dbRows(depts);
    const empList = dbRows(emps);
    const tree = buildTree(deptList);
    return { ok: true, data: { tree, departments: deptList, employees: empList } };
  
    });}

  async getOrgFlat(_departmentId?: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT d.id, d.name, d.name_uz, d.parent_id, d.manager_id,
             COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name, d.name_uz, d.parent_id, d.manager_id
      ORDER BY d.name
    `);
    return { ok: true, data: dbRows(r) };
  
    });}
}
