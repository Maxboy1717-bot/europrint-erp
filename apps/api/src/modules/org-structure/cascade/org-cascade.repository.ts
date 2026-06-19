/**
 * @module org-structure/cascade/org-cascade.repository
 * @description EP-ORG-041 (ORG-CASCADE) data-access layer. Reuses the EXISTING
 *   `warehouses` table (lib/db wms-schema) and the EXISTING RBAC mechanism
 *   (`users.role` + RolesGuard) — NO parallel master tables (Q-46).
 *
 * Idempotency: keyed on `warehouses.code` (UNIQUE) via warehouseCodeForNode().
 * Re-running the cascade for the same node finds the existing warehouse and
 * skips the INSERT — no duplicate row.
 *
 * NOTE (Rule 4 / Rule 15): the RBAC grant is a cross-module UPDATE against the
 * auth module's `users` table. Raw parametrized SQL preserves the module
 * boundary (org-structure does not own a Drizzle handle on users.role writes)
 * and mirrors the established pattern in org-mutations.repo.ts assignUser().
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { warehouses } from '@europrint/schemas';
import { Result, Ok, Err } from '@common/result';
import {
  CASCADE_WAREHOUSE_TYPE,
  warehouseCodeForNode,
  isGrantableRole,
} from './org-cascade.constants';

@Injectable()
export class OrgCascadeRepository {
  /**
   * Look up an existing warehouse by its deterministic node code.
   * @returns Ok(id) when present, Ok(null) when absent. (warehouses.id is the
   *   integer surrogate in the canonical compat schema.)
   */
  async findWarehouseByNode(nodeId: number): Promise<Result<number | null>> {
    try {
      const code = warehouseCodeForNode(nodeId);
      const rows = await db
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.code, code))
        .limit(1);
      return Ok(rows[0]?.id ?? null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Ombor qidirishda xatolik');
    }
  }

  /**
   * Insert the node's warehouse using the EXISTING warehouses table — only the
   * columns the canonical (compat) schema declares, matching how the WMS module
   * itself writes warehouses. Head linkage is via the RBAC grant + the gated
   * `org_department_id` column (migration 08). Real INSERT — no echo (Q-40).
   */
  async createWarehouseForNode(input: {
    nodeId: number;
    name: string;
    headUserId: number | null;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const code = warehouseCodeForNode(input.nodeId);
      const values = {
        code,
        name: input.name,
        type: CASCADE_WAREHOUSE_TYPE,
        isActive: true,
      };
      // onConflictDoNothing on the UNIQUE code keeps a racing double-create safe.
      const rows = await db
        .insert(warehouses)
        .values(values as typeof warehouses.$inferInsert)
        .onConflictDoNothing({ target: warehouses.code })
        .returning();
      if (!rows[0]) {
        // Lost the race — fetch the existing row so the caller has the id.
        const existing = await db
          .select()
          .from(warehouses)
          .where(eq(warehouses.code, code))
          .limit(1);
        if (!existing[0]) return Err('Ombor yaratildi lekin topilmadi');
        return Ok(existing[0]);
      }
      return Ok(rows[0]);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Ombor yaratishda xatolik');
    }
  }

  /**
   * Read the node head's current role (canonical RBAC = users.role varchar).
   * @returns Ok(role|null) — null when the user has no role set.
   */
  async getUserRole(userId: number): Promise<Result<string | null>> {
    try {
      const r = await runQuery<{ role: string | null }>(sql`
        SELECT role FROM users WHERE id = ${userId} LIMIT 1
      `);
      if (!Array.isArray(r.rows) || r.rows.length === 0) {
        return Err(`Foydalanuvchi #${userId} topilmadi`);
      }
      return Ok(r.rows[0]?.role ?? null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Rol o\'qishda xatolik');
    }
  }

  /**
   * Grant the warehouse role to the node head WITHOUT clobbering a higher
   * privilege. Real UPDATE against the existing users table; guarded so
   * protected roles (super_admin/admin/director) are never downgraded.
   * @returns Ok(true) when the role was written, Ok(false) when skipped.
   */
  async grantRoleToUser(userId: number, role: string): Promise<Result<boolean>> {
    try {
      const currentR = await this.getUserRole(userId);
      if (!currentR.ok) return Err(currentR.error.message);
      const current = currentR.data;
      if (!isGrantableRole(current)) {
        return Ok(false); // protected role — leave untouched (Q-46)
      }
      if ((current ?? '').toLowerCase() === role.toLowerCase()) {
        return Ok(false); // already has the role — idempotent no-op
      }
      await runQuery(sql`
        UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}
      `);
      return Ok(true);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Rol berishda xatolik');
    }
  }
}
