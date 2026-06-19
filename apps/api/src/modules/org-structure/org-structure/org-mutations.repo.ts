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

  /**
   * P51 — Recomputes `org_functions.manager_id` and `employees.manager_id` from
   * the org tree (parent-chain head_user_id, recursive, NULL-skipping).
   *
   * Two gates protect this write:
   *   1. DATA gate — every active org_departments node must have a non-null
   *      head_user_id (owner/HR knowledge — code cannot fabricate it, Q-40).
   *      `dataGateOpen` is true only when `nullHeadCount === 0`.
   *   2. dryRun — when true, only previews how many rows WOULD change; writes
   *      nothing. Default behaviour at the endpoint is dryRun=true.
   *
   * Idempotent: only touches rows where manager_id IS NULL OR = 0, and only
   * derives a manager where a non-null head exists up the chain (NULL stays
   * NULL — never fabricated). Safe to run repeatedly.
   */
  async backfillManagerIds(dryRun = true): Promise<Result<{
    nullHeadCount: number;
    dataGateOpen: boolean;
    updatedFunctions: number;
    updatedEmployees: number;
    message: string;
  }>> {
    return safeCall(async () => {
      // 1. DATA gate — count active nodes still missing a head.
      const gate = (await runQuery<{ null_head_count: number }>(sql`
        SELECT COUNT(*)::int AS null_head_count
        FROM   org_departments
        WHERE  is_active = true AND head_user_id IS NULL
      `)).rows;
      const nullHeadCount = Number(gate[0]?.null_head_count ?? 999);
      const dataGateOpen = nullHeadCount === 0;

      if (!dataGateOpen) {
        return {
          nullHeadCount,
          dataGateOpen: false,
          updatedFunctions: 0,
          updatedEmployees: 0,
          message:
            `DATA DARVOZA YOPIQ: ${nullHeadCount} ta aktiv node head_user_id = NULL. ` +
            `Avval barcha rahbarlik ma'lumotlarini to'ldiring.`,
        };
      }

      if (dryRun) {
        const fnPreview = (await runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt
          FROM   org_functions f
          WHERE  f.is_active = true AND (f.manager_id IS NULL OR f.manager_id = 0)
        `)).rows;
        const empPreview = (await runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt
          FROM   employees
          WHERE  manager_id IS NULL OR manager_id = 0
        `)).rows;
        return {
          nullHeadCount: 0,
          dataGateOpen: true,
          updatedFunctions: Number(fnPreview[0]?.cnt ?? 0),
          updatedEmployees: Number(empPreview[0]?.cnt ?? 0),
          message: "DRY RUN: hech narsa yozilmadi. dryRun=false bilan qayta chaqiring.",
        };
      }

      // 2. org_functions.manager_id ← nearest ancestor head_user_id.
      // RULE4_EXCEPTION: recursive-CTE correlated UPDATE — not expressible in
      // Drizzle. Idempotent via the manager_id IS NULL / = 0 guard.
      const fnRes = (await runQuery<{ id: number }>(sql`
        UPDATE org_functions f
        SET    manager_id = (
          WITH RECURSIVE ancestor AS (
            SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
            FROM   org_departments od
            WHERE  od.id = f.department_id AND od.is_active = true
            UNION ALL
            SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
            FROM   org_departments od2
            JOIN   ancestor a ON od2.id = a.parent_id
            WHERE  od2.is_active = true AND a.depth < 10
          )
          SELECT head_user_id
          FROM   ancestor
          WHERE  head_user_id IS NOT NULL
          ORDER  BY depth
          LIMIT  1
        )
        WHERE  f.is_active = true
          AND  (f.manager_id IS NULL OR f.manager_id = 0)
        RETURNING f.id
      `)).rows;
      const updatedFunctions = Array.isArray(fnRes) ? fnRes.length : 0;

      // 3. employees.manager_id ← manager's employees.id, via the employee's
      // primary card → department → parent head_user_id → employees lookup.
      // KANONIK JOIN: employee_cards (M:N, org-phase6). employee_functions does
      // NOT exist. employees.manager_id stores employees.id (not users.id), so
      // we map the resolved head_user_id back through employees.user_id.
      const empRes = (await runQuery<{ id: number }>(sql`
        UPDATE employees e
        SET    manager_id = mgr_emp.id
        FROM   employee_cards ec
        JOIN   org_functions   f    ON f.id = ec.card_id AND f.is_active = true
        JOIN   org_departments dept ON dept.id = f.department_id AND dept.is_active = true
        JOIN   org_departments par  ON par.id = dept.parent_id  AND par.is_active = true
        JOIN   employees mgr_emp    ON mgr_emp.user_id = par.head_user_id
        WHERE  ec.employee_id = e.id
          AND  ec.is_primary = true
          AND  ec.is_active = true
          AND  (e.manager_id IS NULL OR e.manager_id = 0)
          AND  par.head_user_id IS NOT NULL
          AND  mgr_emp.id <> e.id
        RETURNING e.id
      `)).rows;
      const updatedEmployees = Array.isArray(empRes) ? empRes.length : 0;

      return {
        nullHeadCount: 0,
        dataGateOpen: true,
        updatedFunctions,
        updatedEmployees,
        message:
          `Backfill yakunlandi: org_functions=${updatedFunctions} ta yangilandi, ` +
          `employees=${updatedEmployees} ta yangilandi.`,
      };
    }, 'DB_ERROR');
  }
}
