/**
 * OrgChartCompatService — `/org-chart/tree` va `/org-chart/flat` uchun.
 *
 * Frontend (`OrgChartPage.tsx`) kutadi:
 *   {
 *     tree: OrgChartNode[],
 *     stats: { totalDepartments, totalEmployees, maxDepth }
 *   }
 *
 * OrgChartNode: { id, name, vep?, employeeCount?, color?, icon?, children? }
 *
 * MUHIM: `safeCall` natijani avtomatik `Ok(value)` bilan o'raydi —
 * shu sababli ichkarida QO'LDA `{ ok: true, data: ... }` qaytarmaslik kerak
 * (avvalgi versiyada double-wrap bor edi → frontend tree undefined olardi).
 */
import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows, type DbRow } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

interface DeptRow extends DbRow {
  id: string;
  name: string;
  parentId: number | null;
  managerId: number | null;
  vep: string | null;
  color: string | null;
  icon: string | null;
  level: number | null;
  employeeCount: number;
  children?: DeptRow[];
}

export interface OrgTreeData {
  tree: DeptRow[];
  stats: {
    totalDepartments: number;
    totalEmployees: number;
    maxDepth: number;
  };
}

export interface FlatDept extends DbRow {
  id: string;
  name: string;
  parentId: number | null;
  managerId: number | null;
  employeeCount: number;
}

function buildTree(nodes: DeptRow[], parentId: number | null = null): DeptRow[] {
  const safe = Array.isArray(nodes) ? nodes : [];
  return safe
    .filter((n) => (n.parentId ?? null) === parentId)
    .map((n) => ({ ...n, children: buildTree(safe, Number(n.id)) }));
}

function computeMaxDepth(nodes: DeptRow[], depth = 1): number {
  if (!Array.isArray(nodes) || nodes.length === 0) return depth - 1;
  return Math.max(...nodes.map((n) => computeMaxDepth(n.children ?? [], depth + 1)));
}

@Injectable()
export class OrgChartCompatService {
  /**
   * `/api/org-chart/tree` — hierarchical bo'limlar daraxti + statistika.
   */
  async getOrgTree(departmentId?: string): Promise<Result<OrgTreeData, AppError>> {
    return safeCall(async () => {
      const deptFilter = departmentId
        ? sql`WHERE d.id = ${parseInt(departmentId, 10)}`
        : sql``;

      const depts = await rawSql(sql`
        SELECT
          d.id::text                                  AS id,
          COALESCE(d.name_uz, d.name, '')             AS name,
          d.parent_id                                 AS "parentId",
          d.manager_id                                AS "managerId",
          COALESCE(
            NULLIF(TRIM(mgr.first_name || ' ' || COALESCE(mgr.last_name, '')), ''),
            d.vep
          )                                           AS vep,
          d.color,
          d.icon,
          d.level,
          COUNT(e.id)::int                            AS "employeeCount"
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        LEFT JOIN employees mgr ON mgr.id = d.manager_id
        ${deptFilter}
        GROUP BY d.id, d.name, d.name_uz, d.parent_id, d.manager_id,
                 d.vep, d.color, d.icon, d.level, d.sort_order,
                 mgr.first_name, mgr.last_name
        ORDER BY d.parent_id NULLS FIRST, d.sort_order, COALESCE(d.name_uz, d.name)
      `);

      const deptList = dbRows<DeptRow>(depts);
      const safeList = Array.isArray(deptList) ? deptList : [];
      const tree = buildTree(safeList, null);

      const totalEmployees = safeList.reduce(
        (sum, d) => sum + Number(d.employeeCount ?? 0),
        0,
      );
      const maxDepth = computeMaxDepth(tree);

      return {
        tree,
        stats: {
          totalDepartments: safeList.length,
          totalEmployees,
          maxDepth,
        },
      };
    });
  }

  /**
   * `/api/org-chart/flat` — bo'limlar yassi ro'yxati (hierarchy yo'q).
   */
  async getOrgFlat(_departmentId?: string): Promise<Result<FlatDept[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          d.id::text                                  AS id,
          COALESCE(d.name_uz, d.name, '')             AS name,
          d.parent_id                                 AS "parentId",
          d.manager_id                                AS "managerId",
          COUNT(e.id)::int                            AS "employeeCount"
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.id, d.name, d.name_uz, d.parent_id, d.manager_id
        ORDER BY COALESCE(d.name_uz, d.name)
      `);
      const rows = dbRows<FlatDept>(r);
      return Array.isArray(rows) ? rows : [];
    });
  }
}
