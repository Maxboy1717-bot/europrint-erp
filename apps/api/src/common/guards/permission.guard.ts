/**
 * @module permission.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { Injectable, CanActivate, ExecutionContext, Optional, Logger, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RbacCacheService } from '../cache/rbac-cache.service';
import { db } from '@shared/db';
import { positionPermissions } from '../../shared/db/schema';
import { eq, sql } from 'drizzle-orm';

const LEVELS = ['NONE', 'READ', 'READ_PLUS', 'WRITE', 'FULL'];

/**
 * EP-ORG (A6) — KARTA-markazli modul-ruxsat manbai.
 *
 * Vizyon (egasi qarori 4/7): birlamchi karta (request.user.cardId =
 * org_departments.id) ham modul-ruxsat manbai bo'ladi. Karta — to'g'ri ishning
 * ta'rifi; ruxsat ham kartaga bog'lanishi kerak (xodimga emas).
 *
 * ⚠️ FABRIKATSIYA TAQIQ (Q-40): hozir DB'da karta→modul-ruxsat ma'lumoti YO'Q —
 * `org_departments`da position_id/module_code/permissions ustuni yo'q, alohida
 * `card_permissions` jadvali ham yo'q. `position_permissions` esa lavozim-fazoda
 * (key 1..92) kalitlanadi va karta id'lari (19..173) shu oraliq bilan KESISHADI —
 * shuning uchun "position_permissions WHERE position_id = cardId" SOXTA ruxsat
 * beradi (50-karta 50-lavozim ruxsatini meros oladi). Bu TAQIQ.
 *
 * Shu sabab karta-yo'li hozir HAR DOIM null qaytaradi (real karta-ruxsat manbai
 * bo'sh) → guard eski lavozim-yo'liga TOZA fallback qiladi (buzilish yo'q, Q-39).
 * Egasi karta-ruxsat jadvalini (kanonik manba) bergach, shu seam orqali ulanadi —
 * bugun esa hech qanday soxta "allow" qaytarilmaydi.
 */
const CARD_PERMISSION_SOURCE_READY = false;

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

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
        actions: [], resources: (Array.isArray(perms) ? perms : []).map((p) => p.moduleCode), conditions: modulePerms,
      });
    }
    const accessLevel = modulePerms[moduleCode];
    if (!accessLevel) return false;
    return LEVELS.indexOf(accessLevel.toUpperCase()) >= LEVELS.indexOf(level);
  }

  /**
   * Birlamchi kartadan modul-ruxsat (A6 — additiv manba).
   *
   * Qaytaradi:
   *  - true/false  → karta uchun REAL ruxsat-yozuvi topildi (qaror shu kartadan).
   *  - null        → karta uchun ruxsat-manbai yo'q/bo'sh → chaqiruvchi lavozim-yo'liga fallback qiladi.
   *
   * FABRIKATSIYA TAQIQ (Q-40): real karta-ruxsat manbai (kanonik jadval) tayyor
   * bo'lmaguncha har doim null — soxta "allow" yo'q (yuqoridagi izohga qarang).
   */
  private async checkCardFromDb(cardId: number, _moduleCode: string, _level: string): Promise<boolean | null> {
    if (!CARD_PERMISSION_SOURCE_READY) return null;
    // Kanonik karta-ruxsat manbai ulanganda shu yerda parametrlangan Drizzle so'rov
    // bo'ladi (card_id bo'yicha, lavozim-fazo bilan kesishmaydigan jadval). Bugun
    // manba bo'sh → hech qachon bu yerga yetib kelmaydi; cardId faqat seam uchun.
    void db; void sql; void cardId;
    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.getRequiredPermission(context);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest() as { user: Record<string, unknown> };
    if (!user) return false;
    if (this.isAdminRole(user)) return true;
    const [moduleCode, requiredLevel] = required.split(':');
    const level = (requiredLevel || 'READ').toUpperCase();

    // A6 — KARTA-yo'li (additiv, birlamchi): birlamchi kartadan modul-ruxsat.
    // Real karta-ruxsat manbai bo'sh bo'lsa null qaytaradi → lavozim-yo'liga fallback
    // (eski xulq aynan saqlanadi, Q-39). Soxta allow yo'q (Q-40).
    const cardId = (user['cardId'] ?? user['card_id']) as number | undefined;
    if (cardId) {
      try {
        const cardDecision = await this.checkCardFromDb(cardId, moduleCode, level);
        if (cardDecision !== null) return cardDecision;
      } catch (err: unknown) {
        this.logger.error(`RBAC card lookup failed: ${err}`);
        throw new InternalServerErrorException('Permission check temporarily unavailable — please retry');
      }
    }

    // Lavozim-yo'li (fallback, o'zgartirilmagan): users.position_id → position_permissions.
    const positionId = (user['positionId'] ?? user['position_id']) as number | undefined;
    if (!positionId) return false;
    const cached = await this.fetchFromCacheAsync(positionId, moduleCode, level);
    if (cached !== null) return cached;
    try {
      return await this.checkFromDb(positionId, moduleCode, level);
    } catch (err: unknown) {
      this.logger.error(`RBAC DB lookup failed: ${err}`);
      throw new InternalServerErrorException('Permission check temporarily unavailable — please retry');
    }
  }
}
