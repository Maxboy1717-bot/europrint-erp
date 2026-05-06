/**
 * GetMyPermissions handler — foydalanuvchining ruxsat to'plamini yig'adi.
 *
 * ARCHITECTURE.md §7.7 — Redis cache (15 daq), DB fallback.
 * `super_admin` / `admin` rollar — har modulga FULL avtomatik (DB query'siz).
 *
 * Result<T> pattern: try/catch repository ichida — bu yerda faqat orchestration.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import {
  DrizzleMyPermissionsRepository,
  type UserPositionRow,
  type ModulePermRow,
} from '../../infrastructure/repositories/drizzle-my-permissions.repo';
import { RbacCacheService } from '@common/cache/rbac-cache.service';
import type { MyPermissions, ModulePermission } from '../../domain/types/my-permissions.types';

const ALL_MODULES: ReadonlyArray<string> = [
  'MDM', 'CRM', 'SD', 'PP', 'MM', 'FI', 'WMS', 'QC', 'HR',
  'LMS', 'DESIGN', 'LOGISTICS', 'POS', 'ECOMMERCE', 'BI',
];

const ADMIN_ROLES: ReadonlyArray<string> = ['super_admin', 'admin'];

export interface GetMyPermissionsQuery {
  userId: number;
}

interface CachedPerms {
  modules: ReadonlyArray<ModulePermission>;
  featureFlags: ReadonlyArray<string>;
}

@Injectable()
export class GetMyPermissionsHandler {
  private readonly logger = new Logger(GetMyPermissionsHandler.name);

  constructor(
    private readonly repo: DrizzleMyPermissionsRepository,
    @Optional() private readonly rbacCache?: RbacCacheService,
  ) {}

  async execute(query: GetMyPermissionsQuery): Promise<Result<MyPermissions>> {
    const userRes = await this.repo.findUserWithPosition(query.userId);
    if (!userRes.ok) return Err(AppErr('INTERNAL', String(userRes.error)));

    const user = userRes.data;
    if (!user) {
      return Err(AppErr('NOT_FOUND', `User ${query.userId} not found`));
    }

    // Admin rollar — barcha modullarga FULL, DB query'siz
    const isAdmin = user.role !== null && ADMIN_ROLES.includes(user.role);
    if (isAdmin) {
      return Ok(this.buildAdminPermissions(user));
    }

    // Position bo'lmasa — bo'sh permission set
    if (user.positionId === null) {
      return Ok(this.buildEmptyPermissions(user));
    }

    // Cache tekshiruvi (best-effort)
    const cached = await this.tryGetFromCache(user.positionId);
    if (cached) {
      return Ok(this.assemblePermissions(user, cached.modules, cached.featureFlags, false));
    }

    // DB'dan o'qish — modules va features parallel
    const [modulesRes, featuresRes] = await Promise.all([
      this.repo.findModulePermissions(user.positionId),
      this.repo.findFeatureFlags(user.positionId),
    ]);

    if (!modulesRes.ok) return Err(AppErr('INTERNAL', String(modulesRes.error)));
    if (!featuresRes.ok) return Err(AppErr('INTERNAL', String(featuresRes.error)));

    const modules: ReadonlyArray<ModulePermission> = this.normalizeModules(modulesRes.data);
    const featureFlags: ReadonlyArray<string> = featuresRes.data;

    // Cache'ga yozish (best-effort, xato bo'lsa loglab davom etamiz)
    await this.trySetCache(user.positionId, modules, featureFlags);

    return Ok(this.assemblePermissions(user, modules, featureFlags, false));
  }

  private normalizeModules(rows: ReadonlyArray<ModulePermRow>): ReadonlyArray<ModulePermission> {
    const safe = Array.isArray(rows) ? rows : [];
    return safe.map((r) => ({ module: r.module, level: r.level }));
  }

  private buildAdminPermissions(user: UserPositionRow): MyPermissions {
    const safeModulesList = Array.isArray(ALL_MODULES) ? ALL_MODULES : [];
    const modules: ReadonlyArray<ModulePermission> =
      safeModulesList.map((m) => ({ module: m, level: 'FULL' }));
    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      positionId: user.positionId,
      positionCode: user.positionCode,
      positionNameUz: user.positionNameUz,
      positionNameRu: user.positionNameRu,
      departmentCode: user.departmentCode,
      departmentNameUz: user.departmentNameUz,
      rbacTier: user.rbacTier,
      modules,
      featureFlags: [],
      isAdmin: true,
    };
  }

  private buildEmptyPermissions(user: UserPositionRow): MyPermissions {
    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      positionId: null,
      positionCode: null,
      positionNameUz: null,
      positionNameRu: null,
      departmentCode: null,
      departmentNameUz: null,
      rbacTier: null,
      modules: [],
      featureFlags: [],
      isAdmin: false,
    };
  }

  private assemblePermissions(
    user: UserPositionRow,
    modules: ReadonlyArray<ModulePermission>,
    featureFlags: ReadonlyArray<string>,
    isAdmin: boolean,
  ): MyPermissions {
    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      positionId: user.positionId,
      positionCode: user.positionCode,
      positionNameUz: user.positionNameUz,
      positionNameRu: user.positionNameRu,
      departmentCode: user.departmentCode,
      departmentNameUz: user.departmentNameUz,
      rbacTier: user.rbacTier,
      modules,
      featureFlags,
      isAdmin,
    };
  }

  private async tryGetFromCache(positionId: number): Promise<CachedPerms | null> {
    if (!this.rbacCache?.isRedisConnected) return null;
    const result = await this.rbacCache.getPositionPerms(positionId);
    if (!result.ok || !result.data) return null;
    const cached = result.data;
    if (!cached.conditions) return null;
    const cond = cached.conditions as Record<string, string>;
    const entries = Object.entries(cond);
    const safeEntries = Array.isArray(entries) ? entries : [];
    const modules: ReadonlyArray<ModulePermission> = safeEntries.map(
      ([module, level]) => ({ module, level }),
    );
    const featureFlags: ReadonlyArray<string> = Array.isArray(cached.actions) ? cached.actions : [];
    return { modules, featureFlags };
  }

  private async trySetCache(
    positionId: number,
    modules: ReadonlyArray<ModulePermission>,
    featureFlags: ReadonlyArray<string>,
  ): Promise<void> {
    if (!this.rbacCache?.isRedisConnected) return;
    const conditions: Record<string, string> = {};
    for (const m of modules) {
      conditions[m.module] = m.level;
    }
    const safeModules = Array.isArray(modules) ? modules : [];
    const setRes = await this.rbacCache.setPositionPerms(positionId, {
      actions: [...featureFlags],
      resources: safeModules.map((m) => m.module),
      conditions,
    });
    if (!setRes.ok) {
      this.logger.warn(`Cache set failed for position ${positionId}: ${String(setRes.error)}`);
    }
  }
}
