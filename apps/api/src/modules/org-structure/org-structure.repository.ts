/**
 * @module org-structure.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

const ORG_DEFAULT_PAGE_LIMIT = 50;
const ORG_EMPLOYEES_FETCH_LIMIT = 100;

// Computed full_name expression for users table (first_name + last_name)
const fullName = sql<string>`(${appUsers.first_name} || ' ' || ${appUsers.last_name})`;

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class OrgStructureRepository {
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
          (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true)                                              AS "totalNodes",
          (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true AND node_type = 'department')                AS "totalDepartments",
          (SELECT COUNT(*)::int FROM users u JOIN employee_org_departments eod ON eod.user_id = u.id WHERE u.is_active = TRUE) AS "totalEmployees",
          (SELECT COALESCE(SUM(CAST(NULLIF(tskp_ru, '') AS integer)), 0)
             FROM org_departments WHERE is_active = true AND tskp_ru ~ '^[0-9]+$')                                       AS "totalCapacity",
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
          id: orgDepartments.id,
          name: orgDepartments.name,
          nameRu: orgDepartments.name_ru,
          color: orgDepartments.color,
          parentId: orgDepartments.parent_id,
          hierarchyLevel: orgDepartments.level,
          nodeType: orgDepartments.node_type,
          tskp: orgDepartments.tskp,
          tskpRu: orgDepartments.tskp_ru,
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
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(orgDepartments)
        .where(and(eq(orgDepartments.is_active, true), searchCond, typeCond));

      return {
        rows: castTo<Record<string, unknown>[]>(rows),
        total: Number(countRow?.total ?? 0),
      };
    }, 'DB_ERROR');
  }

  async findOneWithDetails(id: number): Promise<Result<{ node: Record<string, unknown>; employees: Record<string, unknown>[]; children: Record<string, unknown>[] }>> {
    return safeCall(async () => {
      const nodeRows = await db
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
          headUserId: orgDepartments.head_user_id,
          headUserName: fullName,
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
          id: appUsers.id,
          firstName: appUsers.first_name,
          lastName: appUsers.last_name,
          fullName: fullName,
          phone: appUsers.phone,
        })
        .from(employeeOrgDepartments)
        .innerJoin(appUsers, and(eq(appUsers.id, employeeOrgDepartments.user_id), eq(appUsers.is_active, true)))
        .where(eq(employeeOrgDepartments.org_department_id, id))
        .orderBy(appUsers.first_name, appUsers.last_name)
        .limit(ORG_EMPLOYEES_FETCH_LIMIT);

      const childRows = await db
        .select({
          id: orgDepartments.id,
          name: orgDepartments.name,
          color: orgDepartments.color,
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

  async create(dto: Record<string, unknown>, level: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(orgDepartments)
        .values({
          name: dto.name as string,
          name_ru: (dto.nameRu as string) ?? null,
          description: (dto.description as string) ?? null,
          description_ru: (dto.descriptionRu as string) ?? null,
          color: (dto.color as string) ?? '#3b82f6',
          tskp: (dto.tskp as string) ?? null,
          tskp_ru: (dto.tskpRu as string) ?? null,
          parent_id: (dto.parentId as number) ?? null,
          level,
          node_type: (dto.nodeType as string) ?? 'department',
          sort_order: (dto.sortOrder as number) ?? 0,
        })
        .returning();

      // Sync to departments/positions for FK compatibility
      await this._syncToCoreTable(row as Row, 'create');

      return castTo<Record<string, unknown>>(row);
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

  async updateFromDto(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      type OrgDeptPatch = Partial<typeof orgDepartments.$inferInsert>;
      const patch: OrgDeptPatch = {};
      if (dto.name !== undefined)          patch.name = dto.name as string;
      if (dto.nameRu !== undefined)        patch.name_ru = dto.nameRu as string;
      if (dto.description !== undefined)   patch.description = dto.description as string;
      if (dto.descriptionRu !== undefined) patch.description_ru = dto.descriptionRu as string;
      if (dto.color !== undefined)         patch.color = dto.color as string;
      if (dto.tskp !== undefined)          patch.tskp = dto.tskp as string;
      if (dto.tskpRu !== undefined)        patch.tskp_ru = dto.tskpRu as string;
      if (dto.headUserId !== undefined)    patch.head_user_id = dto.headUserId as number;
      if (dto.nodeType !== undefined)      patch.node_type = dto.nodeType as string;
      if (dto.sortOrder !== undefined)     patch.sort_order = dto.sortOrder as number;
      if (dto.isActive !== undefined)      patch.is_active = dto.isActive as boolean;
      if (Object.keys(patch).length === 0) return { id };

      const [row] = await db.update(orgDepartments).set(patch).where(eq(orgDepartments.id, id)).returning();

      // Sync to departments/positions for FK compatibility
      await this._syncToCoreTable(row as Row, 'update');

      return castTo<Record<string, unknown>>(row);
    }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<void> {
    const [row] = await db
      .update(orgDepartments)
      .set({ is_active: false })
      .where(eq(orgDepartments.id, id))
      .returning();
    if (row) await this._syncToCoreTable(row as Row, 'deactivate');
  }

  async move(id: number, newParentId: number | null, level: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .update(orgDepartments)
        .set({ parent_id: newParentId ?? null, level })
        .where(eq(orgDepartments.id, id))
        .returning();
      return castTo<Record<string, unknown>>(row);
    }, 'DB_ERROR');
  }

  async assignUser(userId: number, nodeId: number): Promise<void> {
    await db
      .insert(employeeOrgDepartments)
      .values({ user_id: userId, org_department_id: nodeId, is_primary: false })
      .onConflictDoNothing();

    // Sync user's departmentId to the users table
    const [node] = await db
      .select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
      .from(orgDepartments)
      .where(eq(orgDepartments.id, nodeId))
      .limit(1);
    if (node && (node.node_type === 'department' || node.node_type === null)) {
      await runQuery(sql`
        UPDATE users SET department_id = ${nodeId} WHERE id = ${userId}
      `);
    }
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

  // ─── Core table sync ───────────────────────────────────────────────────────
  // Keeps `departments` and `positions` tables in sync with org_departments
  // so all FK-dependent modules (HR, payroll, kanban) see live org chart data.

  private async _syncToCoreTable(
    row: Row,
    action: 'create' | 'update' | 'deactivate',
  ): Promise<void> {
    try {
      const nodeType = (row.node_type as string) ?? 'department';
      const orgId   = Number(row.id);
      const name    = String(row.name ?? '');
      const nameRu  = row.name_ru ? String(row.name_ru) : null;
      const isActive = action !== 'deactivate';

      if (nodeType === 'position') {
        // Sync to `positions` table
        if (action === 'create') {
          await runQuery(sql`
            INSERT INTO positions (code, name_uz, name_ru, is_active, created_at, updated_at)
            VALUES (
              ${'ORG-' + orgId},
              ${name},
              ${nameRu ?? name},
              ${isActive},
              NOW(), NOW()
            )
            ON CONFLICT (code) DO UPDATE
              SET name_uz   = EXCLUDED.name_uz,
                  name_ru   = EXCLUDED.name_ru,
                  is_active = EXCLUDED.is_active,
                  updated_at = NOW()
          `);
        } else {
          await runQuery(sql`
            UPDATE positions
            SET name_uz    = ${name},
                name_ru    = ${nameRu ?? name},
                is_active  = ${isActive},
                updated_at = NOW()
            WHERE code = ${'ORG-' + orgId}
          `);
        }
      } else {
        // Sync to `departments` table (node_type = 'department' | null)
        if (action === 'create') {
          await runQuery(sql`
            INSERT INTO departments (code, name_uz, name_ru, level, sort_order, is_active, created_at, updated_at)
            VALUES (
              ${'ORG-' + orgId},
              ${name},
              ${nameRu ?? name},
              ${Number(row.level ?? 1)},
              ${Number(row.sort_order ?? 0)},
              ${isActive},
              NOW(), NOW()
            )
            ON CONFLICT (code) DO UPDATE
              SET name_uz    = EXCLUDED.name_uz,
                  name_ru    = EXCLUDED.name_ru,
                  level      = EXCLUDED.level,
                  sort_order = EXCLUDED.sort_order,
                  is_active  = EXCLUDED.is_active,
                  updated_at = NOW()
          `);
        } else {
          await runQuery(sql`
            UPDATE departments
            SET name_uz    = ${name},
                name_ru    = ${nameRu ?? name},
                is_active  = ${isActive},
                updated_at = NOW()
            WHERE code = ${'ORG-' + orgId}
          `);
        }
      }
    } catch {
      // Non-critical sync failure — log but don't break the org chart operation
    }
  }
}
