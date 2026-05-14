/**
 * @module position-permissions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RbacCacheService } from '@common/cache/rbac-cache.service';
import { Result, safeCall } from '@common/result';
import { positions, positionPermissions } from '@europrint/schemas';
import { PositionPermissionsRepository } from './position-permissions.repository';

/**
 * Event payload — kelajak listenerlar (WebSocket, frontend invalidation) uchun.
 * EventEmitter2 orqali emit qilinadi: 'rbac.permission.changed'.
 */
export interface PermissionChangedPayload {
  positionId: number;
  moduleCode: string;
  accessLevel: string;
  changedAt: Date;
}

type PositionRow = typeof positions.$inferSelect;
type PermRow = typeof positionPermissions.$inferSelect;

@Injectable()
export class PositionPermissionsService {
  private readonly logger = new Logger(PositionPermissionsService.name);
  constructor(
    private readonly repo: PositionPermissionsRepository,
    @Optional() private readonly rbacCache?: RbacCacheService,
    @Optional() private readonly eventBus?: EventEmitter2,
  ) {}

  /**
   * Cache invalidation — har permission o'zgarishida chaqiriladi.
   * Best-effort: Redis bog'lanmagan bo'lsa silently o'tib ketadi.
   * Event ham emit qilinadi — kelajak listenerlar uchun (WebSocket, frontend refresh).
   */
  private async invalidatePositionCache(payload: PermissionChangedPayload): Promise<void> {
    if (this.rbacCache?.isRedisConnected) {
      const result = await this.rbacCache.clearPositionPerms(payload.positionId);
      if (!result.ok) {
        this.logger.warn(`Cache clear failed for position ${payload.positionId}: ${String(result.error)}`);
      }
    }
    if (this.eventBus) {
      this.eventBus.emit('rbac.permission.changed', payload);
    }
  }

  async getByPosition(positionId: number): Promise<Result<{ position: PositionRow; permissions: PermRow[]; permMap: Record<string, string> }>> {
    return safeCall(async () => {
      const positionResult = await this.repo.findPosition(positionId);
      if (!positionResult.ok) throw new Error(String(positionResult.error));
      if (!positionResult.data) throw new NotFoundException(`Lavozim #${positionId} topilmadi`);
      const permsResult = await this.repo.findPermissionsByPosition(positionId);
      if (!permsResult.ok) throw new Error(String(permsResult.error));
      const perms = permsResult.data;
      const permMap: Record<string, string> = {};
      for (const p of perms) { permMap[String(p.moduleCode)] = String(p.accessLevel); }
      return { position: positionResult.data, permissions: perms, permMap };
    });
  }

  async getAll(): Promise<Result<Array<PositionRow & { permissions: Record<string, string> }>>> {
    return safeCall(async () => {
      const posResult = await this.repo.findAllPositions();
      if (!posResult.ok) throw new Error(String(posResult.error));
      const permResult = await this.repo.findAllPermissions();
      if (!permResult.ok) throw new Error(String(permResult.error));
      const allPositions = posResult.data;
      const allPerms = permResult.data;
      const safePositions = Array.isArray(allPositions) ? allPositions : [];
      const safePerms = Array.isArray(allPerms) ? allPerms : [];
      return (Array.isArray(safePositions) ? safePositions : []).map((pos) => {
        const posPerms = (Array.isArray(safePerms) ? safePerms : []).filter((p) => p.positionId === pos.id);
        const permissions: Record<string, string> = {};
        for (const p of posPerms) { permissions[String(p.moduleCode)] = String(p.accessLevel); }
        return { ...pos, permissions };
      });
    });
  }

  async setPermission(positionId: number, moduleCode: string, accessLevel: string) {
    return safeCall(async () => {
      this.logger.log(`Pozitsiya #${positionId} uchun ruxsat o'rnatilmoqda: ${moduleCode}=${accessLevel}`);
      const existResult = await this.repo.findExistingPermissions(positionId);
      if (!existResult.ok) throw new Error(String(existResult.error));
      const existing = existResult.data;
      const safeExisting = Array.isArray(existing) ? existing : [];
      const found = (Array.isArray(safeExisting) ? safeExisting : []).find((p) => p.moduleCode === moduleCode);
      let result;
      if (found) {
        const r = await this.repo.updatePermission(found.id, accessLevel);
        if (!r.ok) throw new Error(String(r.error));
        result = r.data;
      } else {
        const r = await this.repo.insertPermission(positionId, moduleCode, accessLevel);
        if (!r.ok) throw new Error(String(r.error));
        result = r.data;
      }
      // Cache invalidation + event emit (best-effort)
      await this.invalidatePositionCache({
        positionId,
        moduleCode,
        accessLevel,
        changedAt: new Date(),
      });
      return result;
    });
  }

  async hasAccess(positionId: number, moduleCode: string, requiredLevel: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const levels = ['NONE', 'READ', 'READ_PLUS', 'WRITE', 'FULL'];
      const permsResult = await this.repo.findPermissionsByPosition(positionId);
      if (!permsResult.ok) throw new Error(String(permsResult.error));
      const perms = permsResult.data;
      const found = (Array.isArray(perms) ? perms : []).find((p) => p.moduleCode === moduleCode);
      if (!found) return false;
      return levels.indexOf(String(found.accessLevel).toUpperCase()) >= levels.indexOf(requiredLevel.toUpperCase());
    });
  }
}
