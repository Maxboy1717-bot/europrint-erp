import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RbacCacheService } from '@common/cache/rbac-cache.service';
import { Result, safeCall } from '@common/result';
import { positions, positionPermissions } from '@europrint/schemas';
import { PositionPermissionsRepository } from './position-permissions.repository';

type PositionRow = typeof positions.$inferSelect;
type PermRow = typeof positionPermissions.$inferSelect;

@Injectable()
export class PositionPermissionsService {
  private readonly logger = new Logger(PositionPermissionsService.name);
  constructor(
    private readonly repo: PositionPermissionsRepository,
    private rbacCache?: RbacCacheService,
  ) {}

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
      return (safePositions ?? []).map((pos) => {
        const posPerms = (safePerms ?? []).filter((p) => p.positionId === pos.id);
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
      const found = (safeExisting ?? []).find((p) => p.moduleCode === moduleCode);
      if (found) {
        const r = await this.repo.updatePermission(found.id, accessLevel);
        if (!r.ok) throw new Error(String(r.error));
        return r.data;
      }
      const r = await this.repo.insertPermission(positionId, moduleCode, accessLevel);
      if (!r.ok) throw new Error(String(r.error));
      return r.data;
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
