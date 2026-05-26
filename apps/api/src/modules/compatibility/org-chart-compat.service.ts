import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

/**
 * O(n) tree builder using a parent→children Map.
 *
 * Replaces the previous O(n²) recursive filter implementation that called
 * `nodes.filter(...)` once per node (visiting every node n times).
 *
 * Algorithm (single pass O(n)):
 *   1. Walk `nodes` once; copy each into a `byId` map keyed by node.id, pre-allocating
 *      an empty `children` array.
 *   2. Walk `byId` once; attach each node to its parent's `children` array or to the
 *      `roots` list when parent_id is null / missing.
 *
 * Total work: 2n iterations + n constant-time Map lookups = O(n) time, O(n) space.
 */
export function buildTree(
  nodes: ReadonlyArray<Record<string, unknown>>,
): Record<string, unknown>[] {
  const list = Array.isArray(nodes) ? nodes : [];
  if (list.length === 0) return [];

  const byId = new Map<number, Record<string, unknown>>();

  // Pass 1: index every node by id with an empty children array.
  for (const n of list) {
    const id = Number(n['id']);
    if (!Number.isFinite(id)) continue;
    byId.set(id, { ...n, children: [] });
  }

  const roots: Record<string, unknown>[] = [];

  // Pass 2: link each node to its parent or push to roots.
  for (const [, node] of byId) {
    const rawParent = node['parent_id'];
    const parentId = rawParent === null || rawParent === undefined
      ? null
      : Number(rawParent);

    if (parentId === null || !Number.isFinite(parentId)) {
      roots.push(node);
      continue;
    }

    const parent = byId.get(parentId);
    if (!parent) {
      // Orphan: parent not in result set → treat as root to avoid losing the node.
      roots.push(node);
      continue;
    }

    (parent['children'] as Record<string, unknown>[]).push(node);
  }

  return roots;
}

@Injectable()
export class OrgChartCompatService {

  async getOrgTree(departmentId?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [depts, emps] = await this.fetchOrgTreeRaw(departmentId);
      const deptList = dbRows(depts);
      const empList = dbRows(emps);
      const tree = buildTree(deptList);
      return { ok: true, data: { tree, departments: deptList, employees: empList } };
    });
  }

  private async fetchOrgTreeRaw(departmentId?: string) {
    const deptFilter = departmentId
      ? sql`WHERE od.id = ${parseInt(departmentId, 10)}`
      : sql``;
    return Promise.all([
      rawSql(sql`
        SELECT od.id, od.name_uz AS name, od.name_uz, od.parent_id, od.manager_id,
               COUNT(DISTINCT eod.user_id) AS employee_count
        FROM org_departments od
        LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id
          AND eod.is_primary = true
        ${deptFilter}
        GROUP BY od.id, od.name_uz, od.parent_id, od.manager_id
        ORDER BY od.parent_id NULLS FIRST, od.name_uz
      `),
      rawSql(sql`
        SELECT e.id, e.first_name || ' ' || e.last_name AS full_name,
               primary_org.dept_id AS department_id, e.photo_url, e.employee_code,
               COALESCE(primary_org.pos_name, '') AS position_name
        FROM employees e
        JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active' AND e.deleted_at IS NULL
        ORDER BY e.first_name
      `),
    ]);
  }

  async getOrgFlat(_departmentId?: string) {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT od.id, od.name_uz AS name, od.name_uz, od.parent_id, od.manager_id,
               COUNT(DISTINCT eod.user_id) AS employee_count
        FROM org_departments od
        LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id
          AND eod.is_primary = true
        GROUP BY od.id, od.name_uz, od.parent_id, od.manager_id
        ORDER BY od.name_uz
      `);
      return { ok: true, data: dbRows(r) };
    });
  }
}
