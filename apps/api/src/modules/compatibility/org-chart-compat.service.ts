import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
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

  async getOrgTree(departmentId?: string): Promise<Result<Record<string, unknown>>>{
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
      ? sql`WHERE d.id = ${parseInt(departmentId, 10)}`
      : sql``;
    return Promise.all([
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
  }

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
