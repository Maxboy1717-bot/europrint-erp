import { Injectable, NotFoundException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

const ORG_DEFAULT_PAGE_LIMIT = 50;
const ORG_EMPLOYEES_FETCH_LIMIT = 100;

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
          headUserName: appUsers.full_name,
          headUserEmployeeId: appUsers.employee_id,
          employeeCount: sql<number>`(SELECT COUNT(*)::int FROM employee_org_departments eod JOIN users eu ON eu.id = eod.user_id AND eu.deleted_at IS NULL WHERE eod.org_department_id = ${orgDepartments.id})`,
          capacity: sql<string>`COALESCE(${orgDepartments.tskp_ru}, ${orgDepartments.tskp}, '0')`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), sql`${appUsers.deleted_at} IS NULL`))
        .where(eq(orgDepartments.is_active, true))
        .orderBy(orgDepartments.level, orgDepartments.sort_order, orgDepartments.id);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async getStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true) AS "totalNodes", (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true AND node_type = 'department') AS "totalDepartments", (SELECT COUNT(*)::int FROM users u JOIN employee_org_departments eod ON eod.user_id = u.id WHERE u.deleted_at IS NULL) AS "totalEmployees", (SELECT COALESCE(SUM(CAST(NULLIF(tskp_ru, '') AS integer)), 0) FROM org_departments WHERE is_active = true AND tskp_ru ~ '^[0-9]+$') AS "totalCapacity", (SELECT COUNT(*)::int FROM org_departments WHERE is_active = true AND created_at >= NOW() - INTERVAL '30 days') AS "recentChanges"`);
      return castTo<Record<string, unknown>>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getFlat(search: unknown, nodeType: unknown, page: number, limit: number): Promise<Result<{ rows: Record<string, unknown>[]; total: number }>> {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      const searchCond = search ? sql`(${orgDepartments.name} ILIKE ${'%' + (search as string) + '%'} OR ${orgDepartments.name_ru} ILIKE ${'%' + (search as string) + '%'})` : sql`true`;
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
          headUserName: appUsers.full_name,
          employeeCount: sql<number>`(SELECT COUNT(*)::int FROM employee_org_departments eod JOIN users eu ON eu.id = eod.user_id AND eu.deleted_at IS NULL WHERE eod.org_department_id = ${orgDepartments.id})`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), sql`${appUsers.deleted_at} IS NULL`))
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
          headUserName: appUsers.full_name,
          headUserEmployeeId: appUsers.employee_id,
          employeeCount: sql<number>`(SELECT COUNT(*)::int FROM employee_org_departments eod JOIN users eu ON eu.id = eod.user_id AND eu.deleted_at IS NULL WHERE eod.org_department_id = ${orgDepartments.id})`,
          childCount: sql<number>`(SELECT COUNT(*)::int FROM org_departments WHERE parent_id = ${orgDepartments.id} AND is_active = true)`,
        })
        .from(orgDepartments)
        .leftJoin(appUsers, and(eq(appUsers.id, orgDepartments.head_user_id), sql`${appUsers.deleted_at} IS NULL`))
        .where(eq(orgDepartments.id, id));

      if (!nodeRows[0]) throw new NotFoundException(`Node #${id} topilmadi`);

      const empRows = await db
        .select({
          id: appUsers.id,
          fullName: appUsers.full_name,
          employeeId: appUsers.employee_id,
          phone: appUsers.phone,
        })
        .from(employeeOrgDepartments)
        .innerJoin(appUsers, and(eq(appUsers.id, employeeOrgDepartments.user_id), sql`${appUsers.deleted_at} IS NULL`))
        .where(eq(employeeOrgDepartments.org_department_id, id))
        .orderBy(appUsers.full_name)
        .limit(ORG_EMPLOYEES_FETCH_LIMIT);

      const childRows = await db
        .select({
          id: orgDepartments.id,
          name: orgDepartments.name,
          color: orgDepartments.color,
          nodeType: orgDepartments.node_type,
          employeeCount: sql<number>`(SELECT COUNT(*)::int FROM employee_org_departments WHERE org_department_id = ${orgDepartments.id})`,
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
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<void> {
    await db.update(orgDepartments).set({ is_active: false }).where(eq(orgDepartments.id, id));
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
  }
}
