/**
 * @module org-structure/org-queries.repo
 * @description Read queries: hierarchy / stats / flat list / details / approval chain.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { SQL, SQLWrapper, and, eq, sql } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

const ORG_EMPLOYEES_FETCH_LIMIT = 100;
const fullName = sql<string>`(${appUsers.first_name} || ' ' || ${appUsers.last_name})`;

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => (await runQuery<Row>(q)).rows as Row[];

@Injectable()
export class OrgQueriesRepo {
  async getHierarchyNodes(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: orgDepartments.id,
          name: orgDepartments.name,
          nameRu: orgDepartments.name_ru,
          description: orgDepartments.description,
          descriptionRu: orgDepartments.description_ru,
          color: orgDepartments.color,
          tskp: orgDepartments.tskp,
          tskpRu: orgDepartments.tskp_ru,
          parentId: orgDepartments.parent_id,
          hierarchyLevel: orgDepartments.level,
          nodeType: orgDepartments.node_type,
          isActive: orgDepartments.is_active,
          sortOrder: orgDepartments.sort_order,
          headUserId: orgDepartments.head_user_id,
          headUserName: fullName,
          employeeCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM employee_org_departments eod
            JOIN users eu ON eu.id = eod.user_id AND eu.is_active = TRUE
            WHERE eod.org_department_id = ${orgDepartments.id}
          )`,
          capacity: sql<string>`COALESCE(${orgDepartments.tskp_ru}, ${orgDepartments.tskp}, '0')`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), eq(appUsers.is_active, true)))
        .where(eq(orgDepartments.is_active, true))
        .orderBy(orgDepartments.level, orgDepartments.sort_order, orgDepartments.id);
      return castTo<Record<string, unknown>[]>(rows);
    }, 'DB_ERROR');
  }

  async getStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await exec(sql`
        SELECT
          (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true) AS "totalNodes",
          (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true AND node_type = 'department') AS "totalDepartments",
          (SELECT COUNT(*)::int FROM users u JOIN employee_org_departments eod ON eod.user_id = u.id WHERE u.is_active = TRUE) AS "totalEmployees",
          (SELECT COALESCE(SUM(CAST(NULLIF(tskp_ru, '') AS integer)), 0)
             FROM org_departments WHERE is_active = true AND tskp_ru ~ '^[0-9]+$') AS "totalCapacity",
          (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true AND created_at >= NOW() - INTERVAL '30 days') AS "recentChanges"
      `);
      return castTo<Record<string, unknown>>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async getFlat(search: unknown, nodeType: unknown, page: number, limit: number): Promise<Result<{ rows: Record<string, unknown>[]; total: number }>> {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      const searchCond = search
        ? sql`(${orgDepartments.name} ILIKE ${'%' + (search as string) + '%'} OR ${orgDepartments.name_ru} ILIKE ${'%' + (search as string) + '%'})`
        : sql`true`;
      const typeCond = nodeType ? eq(orgDepartments.node_type, nodeType as string) : sql`true`;

      const rows = await db
        .select({
          id: orgDepartments.id, name: orgDepartments.name, nameRu: orgDepartments.name_ru,
          color: orgDepartments.color, parentId: orgDepartments.parent_id,
          hierarchyLevel: orgDepartments.level, nodeType: orgDepartments.node_type,
          tskp: orgDepartments.tskp, tskpRu: orgDepartments.tskp_ru,
          headUserName: fullName,
          employeeCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM employee_org_departments eod
            JOIN users eu ON eu.id = eod.user_id AND eu.is_active = TRUE
            WHERE eod.org_department_id = ${orgDepartments.id}
          )`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), eq(appUsers.is_active, true)))
        .where(and(eq(orgDepartments.is_active, true), searchCond, typeCond))
        .orderBy(orgDepartments.level, orgDepartments.sort_order)
        .limit(limit).offset(offset);

      const [countRow] = await db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(orgDepartments)
        .where(and(eq(orgDepartments.is_active, true), searchCond, typeCond));

      return { rows: castTo<Record<string, unknown>[]>(rows), total: Number(countRow?.total ?? 0) };
    }, 'DB_ERROR');
  }

  async findOneWithDetails(id: number): Promise<Result<{ node: Record<string, unknown>; employees: Record<string, unknown>[]; children: Record<string, unknown>[] }>> {
    return safeCall(async () => {
      const nodeRows = await db
        .select({
          id: orgDepartments.id, name: orgDepartments.name, nameRu: orgDepartments.name_ru,
          description: orgDepartments.description, descriptionRu: orgDepartments.description_ru,
          color: orgDepartments.color, tskp: orgDepartments.tskp, tskpRu: orgDepartments.tskp_ru,
          parentId: orgDepartments.parent_id, hierarchyLevel: orgDepartments.level,
          nodeType: orgDepartments.node_type, isActive: orgDepartments.is_active,
          headUserId: orgDepartments.head_user_id, headUserName: fullName,
          employeeCount: sql<number>`(
            SELECT COUNT(*)::int FROM employee_org_departments eod
            JOIN users eu ON eu.id = eod.user_id AND eu.is_active = TRUE
            WHERE eod.org_department_id = ${orgDepartments.id}
          )`,
          childCount: sql<number>`(
            SELECT COUNT(*)::int FROM org_departments
            WHERE parent_id = ${orgDepartments.id} AND is_active = true
          )`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), eq(appUsers.is_active, true)))
        .where(eq(orgDepartments.id, id));

      if (!nodeRows[0]) throw new NotFoundException(`Node #${id} topilmadi`);

      const empRows = await db
        .select({
          id: appUsers.id, firstName: appUsers.first_name, lastName: appUsers.last_name,
          fullName, phone: appUsers.phone,
        })
        .from(employeeOrgDepartments)
        .innerJoin(appUsers, and(eq(appUsers.id, employeeOrgDepartments.user_id), eq(appUsers.is_active, true)))
        .where(eq(employeeOrgDepartments.org_department_id, id))
        .orderBy(appUsers.first_name, appUsers.last_name)
        .limit(ORG_EMPLOYEES_FETCH_LIMIT);

      const childRows = await db
        .select({
          id: orgDepartments.id, name: orgDepartments.name, color: orgDepartments.color,
          nodeType: orgDepartments.node_type,
          employeeCount: sql<number>`(
            SELECT COUNT(*)::int FROM employee_org_departments
            WHERE org_department_id = ${orgDepartments.id}
          )`,
        })
        .from(orgDepartments)
        .where(and(eq(orgDepartments.parent_id, id), eq(orgDepartments.is_active, true)))
        .orderBy(orgDepartments.sort_order);

      return {
        node: castTo<Record<string, unknown>>(nodeRows[0]),
        employees: castTo<Record<string, unknown>[]>(empRows),
        children: castTo<Record<string, unknown>[]>(childRows),
      };
    }, 'DB_ERROR');
  }

  async getApprovalChain(nodeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await exec(sql`
        WITH RECURSIVE chain AS (
          SELECT id, name, parent_id, head_user_id, level, 1 AS depth
          FROM org_departments WHERE id = ${nodeId} AND is_active = true
          UNION ALL
          SELECT od.id, od.name, od.parent_id, od.head_user_id, od.level, c.depth + 1
          FROM org_departments od
          JOIN chain c ON od.id = c.parent_id
          WHERE od.is_active = true AND c.depth < 10
        )
        SELECT c.id AS node_id, c.name AS node_name, c.level, c.depth,
               u.id AS manager_id,
               TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS manager_name,
               u.email AS manager_email, u.phone AS manager_phone
        FROM chain c
        LEFT JOIN users u ON u.id = c.head_user_id AND u.is_active = true
        ORDER BY c.depth
      `);
      return rows;
    }, 'DB_ERROR');
  }

  async getDirectManager(nodeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await exec(sql`
        SELECT
          u.id, u.first_name, u.last_name,
          TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS full_name,
          u.email, u.phone,
          e.telegram_chat_id
        FROM org_departments od
        LEFT JOIN org_departments parent ON parent.id = od.parent_id AND parent.is_active = true
        LEFT JOIN users u ON u.id = COALESCE(parent.head_user_id, od.head_user_id) AND u.is_active = true
        LEFT JOIN employees e ON e.id::text = u.id::text
        WHERE od.id = ${nodeId}
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async getTelegramGroupForNode(nodeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await exec(sql`
        SELECT
          od.id AS node_id, od.name AS node_name,
          e.telegram_chat_id AS head_telegram_chat_id,
          TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS head_full_name
        FROM org_departments od
        LEFT JOIN users u ON u.id = od.head_user_id AND u.is_active = true
        LEFT JOIN employees e ON e.id::text = u.id::text
        WHERE od.id = ${nodeId}
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async getParentLevel(parentId: unknown): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ level: orgDepartments.level })
        .from(orgDepartments)
        .where(eq(orgDepartments.id, parentId as number))
        .limit(1);
      return Number((castTo<Record<string, unknown>>(row))?.level ?? 0) + 1;
    }, 'DB_ERROR');
  }

  async existsById(id: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db
        .select({ id: orgDepartments.id })
        .from(orgDepartments)
        .where(eq(orgDepartments.id, id))
        .limit(1);
      return rows.length > 0;
    }, 'DB_ERROR');
  }
}
