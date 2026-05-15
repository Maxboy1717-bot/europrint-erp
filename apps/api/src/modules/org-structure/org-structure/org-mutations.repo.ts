/**
 * @module org-structure/org-mutations.repo
 * @description Create/update/deactivate/move/assignUser mutations.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Cross-module UPDATE against the `users` table (department_id sync) which
 *     belongs to the auth module's schema, not org-structure's — using sql
 *     preserves repository boundary while propagating the assignment
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { syncToCoreTable } from './sync-helper';

type Row = Record<string, unknown>;

@Injectable()
export class OrgMutationsRepo {
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

      await syncToCoreTable(row as Row, 'create');
      return castTo<Record<string, unknown>>(row);
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
      await syncToCoreTable(row as Row, 'update');
      return castTo<Record<string, unknown>>(row);
    }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<void> {
    const [row] = await db
      .update(orgDepartments)
      .set({ is_active: false })
      .where(eq(orgDepartments.id, id))
      .returning();
    if (row) await syncToCoreTable(row as Row, 'deactivate');
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

    const [node] = await db
      .select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
      .from(orgDepartments)
      .where(eq(orgDepartments.id, nodeId))
      .limit(1);
    if (node && (node.node_type === 'department' || node.node_type === null)) {
      await runQuery(sql`UPDATE users SET department_id = ${nodeId} WHERE id = ${userId}`);
    }
  }
}
