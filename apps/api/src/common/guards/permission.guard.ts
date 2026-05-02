import { Injectable, CanActivate, ExecutionContext, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RbacCacheService } from '../cache/rbac-cache.service';
import { db } from '@shared/db';
import { positionPermissions } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';

const LEVELS = ['NONE', 'READ', 'READ_PLUS', 'WRITE', 'FULL'];

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() private readonly rbacCache: RbacCacheService,
  ) {}

  private getRequiredPermission(context: ExecutionContext): string | null {
    return this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY, [context.getHandler(), context.getClass()],
    ) ?? null;
  }

  private isAdminRole(user: Record<string, unknown>): boolean {
    const role = String(user['role'] ?? '').toLowerCase();
    return role === 'super_admin' || role === 'admin' || role === 'director';
  }

  private async fetchFromCacheAsync(positionId: number, moduleCode: string, level: string): Promise<boolean | null> {
    if (!this.rbacCache?.isRedisConnected) return null;
    const cachedResult = await this.rbacCache.getPositionPerms(positionId);
    if (!cachedResult.ok || !cachedResult.data) return null;
    const cached = cachedResult.data;
    if (!cached?.conditions) return null;
    const modulePerms = cached.conditions as Record<string, string>;
    const accessLevel = modulePerms[moduleCode];
    if (accessLevel === undefined) return null;
    return LEVELS.indexOf(accessLevel.toUpperCase()) >= LEVELS.indexOf(level);
  }

  private async checkFromDb(positionId: number, moduleCode: string, level: string): Promise<boolean> {
    const perms = await db.select().from(positionPermissions).where(eq(positionPermissions.positionId, positionId));
    if (!perms.length) return false;
    const modulePerms: Record<string, string> = {};
    for (const p of perms) { modulePerms[p.moduleCode] = p.accessLevel; }
    if (this.rbacCache?.isRedisConnected) {
      await this.rbacCache.setPositionPerms(positionId, {
        actions: [], resources: (perms ?? []).map((p) => p.moduleCode), conditions: modulePerms,
      });
    }
    const accessLevel = modulePerms[moduleCode];
    if (!accessLevel) return false;
    return LEVELS.indexOf(accessLevel.toUpperCase()) >= LEVELS.indexOf(level);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.getRequiredPermission(context);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest() as { user: Record<string, unknown> };
    if (!user) return false;
    if (this.isAdminRole(user)) return true;
    const positionId = (user['positionId'] ?? user['position_id']) as number | undefined;
    if (!positionId) return false;
    const [moduleCode, requiredLevel] = required.split(':');
    const level = (requiredLevel || 'READ').toUpperCase();
    const cached = await this.fetchFromCacheAsync(positionId, moduleCode, level);
    if (cached !== null) return cached;
    try { return await this.checkFromDb(positionId, moduleCode, level); } catch { return false; }
  }
}
