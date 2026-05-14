/**
 * @module position-permissions.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, positionPermissions, positions } from '@europrint/schemas';
import { eq, sql } from 'drizzle-orm';

type PositionRow = typeof positions.$inferSelect;
type PermRow = typeof positionPermissions.$inferSelect;

@Injectable()
export class PositionPermissionsRepository {
  async findPosition(positionId: number): Promise<Result<PositionRow | null>> {
    try {
      const rows = await db.select().from(positions).where(eq(positions.id, positionId));
      return Ok(rows[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findPermissionsByPosition(positionId: number): Promise<Result<PermRow[]>> {
    try {
      const rows = await db.select().from(positionPermissions).where(eq(positionPermissions.positionId, positionId));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findAllPositions(): Promise<Result<PositionRow[]>> {
    try {
      const rows = await db.select().from(positions).where(sql`${positions}.deleted_at IS NULL`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findAllPermissions(): Promise<Result<PermRow[]>> {
    try {
      const rows = await db.select().from(positionPermissions);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findExistingPermissions(positionId: number): Promise<Result<PermRow[]>> {
    try {
      const rows = await db.select().from(positionPermissions).where(eq(positionPermissions.positionId, positionId));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updatePermission(id: number, accessLevel: string): Promise<Result<PermRow[]>> {
    try {
      const rows = await db.update(positionPermissions).set({ accessLevel }).where(eq(positionPermissions.id, id)).returning();
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async insertPermission(positionId: number, moduleCode: string, accessLevel: string): Promise<Result<PermRow[]>> {
    try {
      const rows = await db.insert(positionPermissions).values({ positionId, moduleCode, accessLevel } as typeof positionPermissions.$inferInsert).returning();
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
