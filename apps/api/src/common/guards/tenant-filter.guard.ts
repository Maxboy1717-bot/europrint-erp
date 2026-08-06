/**
 * @module tenant-filter.guard
 * @description NestJS guard. canActivate() resolves the per-request tenant
 *   filter and attaches it to the request, then ALWAYS permits the request
 *   (single-tenant default mechanism — it never blocks).
 *
 *   ─────────────────────────────────────────────────────────────────────────
 *   A93 (To'lqin-5 yetuklashtirish — xavfsizlik) — TENANT-FILTER GUARD
 *   ─────────────────────────────────────────────────────────────────────────
 *
 *   ## Maqsad (vazifa)
 *
 *   So'rovlarga `tenant_id` filterini biriktirish: oddiy foydalanuvchi faqat
 *   o'z tenant'ining ma'lumotini ko'radi; admin (super_admin/admin/director)
 *   barcha tenant'larni ko'radi (filter = null = "hammasi"). Bu MEXANIZM —
 *   bitta-tenant o'rnatishda default tenant ishlaydi, hech narsa bloklanmaydi.
 *
 *   ## Nima qiladi
 *
 *   1. `request.user.tenantId` (yoki snake_case `tenant_id`) dan tenant'ni
 *      o'qiydi. JWT claim `JwtStrategy.validate()` da `payload.tenantId`'dan
 *      keladi (auth/.../jwt.strategy.ts:49) — legacy tokenlarda yo'q bo'lishi
 *      mumkin, shunda DEFAULT_TENANT_ID ishlatiladi.
 *   2. ADMIN BYPASS: rol super_admin/admin/director bo'lsa → filter = null
 *      ("barcha tenant"). Bu AYNAN o'sha admin-rol to'plami — RolesGuard,
 *      PermissionGuard.isAdminRole va LoginService.isCardExemptRole bilan bir xil.
 *   3. Hal qilingan filterni `request.tenantFilter` ga yozadi (downstream
 *      repository/handler `WHERE tenant_id = ?` qurishi uchun aniq manba).
 *   4. HAR DOIM `true` qaytaradi — bu filter-biriktirgich, kirish-rad qiluvchi
 *      EMAS. Hech bir mavjud so'rov yo'lini buzmaydi (Q-39/Q-46).
 *
 *   ## Mavjud TenantContextInterceptor bilan farqi (qo'shimcha, takror emas)
 *
 *   `shared/db/tenant-context.interceptor.ts` — AsyncLocalStorage SCOPE o'rnatadi
 *   (`getTenantId()` orqali implicit o'qiladi), lekin (a) admin-bypass
 *   POLITIKASINI qo'llamaydi va (b) so'rovga aniq, o'qiladigan filter qiymatini
 *   biriktirmaydi. Bu guard shu ikki bo'shliqni to'ldiradi — additiv:
 *     - Interceptor: implicit scope (signature-siz repo o'qishi uchun).
 *     - Guard (bu fayl): explicit `request.tenantFilter` + admin-bypass siyosati
 *       (controller/handler `@CurrentTenantFilter()` yoki `req.tenantFilter`
 *       orqali to'g'ridan o'qiy oladi).
 *   Ikkalasi birga ishlaydi; bittasi ikkinchisini o'rnini bosmaydi.
 *
 *   ## Wiring (bu commit'da QILINMAYDI — mexanizm-only, A93 fayl-izolyatsiya)
 *
 *   Global yoqish uchun (kelajak — egasi tasdig'i bilan), guardlar tartibida
 *   JwtAuthGuard DAN KEYIN (request.user to'lgan bo'lishi shart) app.module.ts'da:
 *
 *       { provide: APP_GUARD, useClass: TenantFilterGuard },  // JwtAuthGuard'dan keyin
 *
 *   yoki per-controller: `@UseGuards(TenantFilterGuard)`.
 *
 *   ⚠️ HOLAT (2026-08-07 yangilandi — audit T26C): guard endi app.module.ts:218'da
 *   GLOBAL ro'yxatga OLINGAN (#122), lekin funksional jihatdan hali NO-OP —
 *   canActivate() har doim true qaytaradi va hech bir controller/repository
 *   `@CurrentTenantFilter()`/`req.tenantFilter`'ni o'qimaydi. Haqiqiy
 *   multi-tenant enforcement A90-A92 (SD/PP/MM/WMS/FIN tenant_id ustun rollout)
 *   tugagach, repository'lar filterni o'qishni boshlaganda kuchga kiradi
 *   (Q-40: struktura tayyor, soxta enforcement yo'q).
 *
 * @see apps/api/src/shared/db/tenant-context.interceptor.ts — implicit scope (additiv juft)
 * @see apps/api/src/shared/db/tenant-context.ts — DEFAULT_TENANT_ID = 1 (integer)
 * @see apps/api/src/common/guards/roles.guard.ts — bir xil admin-rol to'plami
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DEFAULT_TENANT_ID } from '../../shared/db/tenant-context';

/**
 * Minimal request shape this guard reads/writes. Framework-agnostic (no direct
 * express/fastify import) — the Nest adapter normalizes both to this shape and
 * we only touch `user` (read) and `tenantFilter` (write).
 *
 * `tenantFilter` semantics (the value this guard attaches):
 *   - `number` → scope every tenant-owned query to this tenant id.
 *   - `null`   → admin bypass; NO `WHERE tenant_id` filter (all tenants).
 */
export interface RequestWithTenantFilter {
  user?: {
    role?: string;
    tenantId?: number | string;
    tenant_id?: number | string;
  };
  /** Written by this guard; read by repositories / `@CurrentTenantFilter()`. */
  tenantFilter?: number | null;
}

/**
 * Canonical admin-role set — identical (case-insensitive) to RolesGuard,
 * PermissionGuard.isAdminRole and LoginService.isCardExemptRole. These roles
 * see every tenant (filter = null). Kept as a frozen literal set so the three
 * call sites stay in lockstep; if the policy changes it changes in one place
 * per guard by design (no shared mutable import to accidentally drift).
 */
const ADMIN_ROLES: ReadonlySet<string> = new Set(['super_admin', 'admin', 'director']);

@Injectable()
export class TenantFilterGuard implements CanActivate {
  private readonly logger = new Logger(TenantFilterGuard.name);

  constructor(private readonly reflector: Reflector) {}

  /**
   * Resolve the integer tenant id from the request user. Accepts camelCase
   * (`tenantId`) and snake_case (`tenant_id`), number or numeric string.
   * Falls back to DEFAULT_TENANT_ID (1) when absent/invalid so legacy tokens
   * and the single-tenant install keep hitting the tenant-1 backfill rows —
   * mirrors TenantContextInterceptor.resolveTenantId exactly.
   *
   * @param user - request.user (may be undefined for @Public/legacy routes)
   * @returns a positive integer tenant id (DEFAULT_TENANT_ID when unresolved)
   */
  private resolveTenantId(user: RequestWithTenantFilter['user']): number {
    const raw = user?.tenantId ?? user?.tenant_id;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return Math.trunc(raw);
    }
    if (typeof raw === 'string') {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_TENANT_ID;
  }

  /**
   * True when the user holds a system-level admin role (case-insensitive).
   * Admins bypass tenant scoping → see all tenants (filter = null).
   *
   * @param user - request.user (may be undefined)
   * @returns whether the role is in the canonical admin set
   */
  private isAdminRole(user: RequestWithTenantFilter['user']): boolean {
    const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
    return ADMIN_ROLES.has(role);
  }

  /**
   * Resolve the tenant filter and attach it to the request. ALWAYS returns
   * true — this guard scopes data, it does not deny access. Denial stays the
   * job of JwtAuthGuard / RolesGuard / PermissionGuard.
   *
   * @param context - NestJS execution context; reads/writes `request`
   * @returns always true (single-tenant default mechanism)
   */
  canActivate(context: ExecutionContext): boolean {
    // Honor @Public(): no auth ran, so request.user is absent. Scope such
    // routes to the default tenant (mechanism stays consistent) and allow.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithTenantFilter>();
    const user = request.user;

    // Admin (super_admin / admin / director) → cross-tenant: null = no filter.
    // Public route or any other user → scope to the resolved tenant id.
    const tenantFilter: number | null =
      !isPublic && this.isAdminRole(user) ? null : this.resolveTenantId(user);

    request.tenantFilter = tenantFilter;

    if (tenantFilter === null) {
      this.logger.debug('Tenant filter bypassed (admin role) — all tenants');
    }

    return true;
  }
}
