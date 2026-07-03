/**
 * @module roles.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { PermissionSet } from '../cache/permission-set.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Role-based access guard. Reads `@Roles('director', 'cfo', ...)` metadata
 * and checks the authenticated user's role.
 *
 * Special cases:
 *  - Routes without `@Roles()` are allowed (true) — auth checked elsewhere by JwtAuthGuard
 *  - System-level roles `super_admin`, `admin`, `director` (case-insensitive) bypass
 *    the allow-list. This is the SAME exempt set used by the rest of the card-RBAC
 *    chain — `PermissionGuard.isAdminRole` (permission.guard.ts) and
 *    `LoginService.isCardExemptRole` (login.service.ts). These roles are card-less by
 *    design (card-gate exempt), so their JWT carries a null `rbacTier`; without the
 *    role bypass a card-less `director` could not be authorized by the tier path either.
 *  - Comparison is case-insensitive on both sides
 *  - EP-ORG (A5): in addition to `user.role`, the authenticated user's primary-card
 *    `rbacTier` claim (operator/specialist/manager/executive — see rbac-tier.policy.ts,
 *    derived from the primary card's razryad in resolveCardGate) is ALSO accepted against
 *    the allow-list. This is additive: `role` continues to authorize exactly as before;
 *    `rbacTier` only ever GRANTS additional access, never removes it. Card-less users
 *    (rbacTier null) keep the legacy role-only behavior. Login-gate stays OFF (default).
 *  - `@Public()` routes (method or class metadata, same `IS_PUBLIC_KEY` the global
 *    `JwtAuthGuard` reads) short-circuit to allowed — mirrors JwtAuthGuard's own
 *    `@Public()` bypass. Needed because `@UseGuards(RolesGuard)` + class-level
 *    `@Roles(...)` otherwise applies to EVERY method (including ones later marked
 *    `@Public()` for external/webhook access), and there is no `request.user` on an
 *    unauthenticated request for the role check to evaluate. A route that opts into
 *    `@Public()` must supply its own authentication (e.g. `WebhookSignatureGuard`) —
 *    RolesGuard has nothing to check there and must not throw Forbidden first.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  /**
   * @param context - NestJS execution context; reads `request.user.role`
   * @returns true if the user's role is in the allow-list (or is admin)
   * @throws ForbiddenException when the role is missing or not allowed
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { role?: string; rbacTier?: string | null; permissionSet?: PermissionSet }
      | undefined;
    const userRole = user?.role;
    // EP-ORG (A5): primary-card RBAC tier claim (JWT, set by resolveCardGate). Additive — see class doc.
    const rbacTier = typeof user?.rbacTier === 'string' && user.rbacTier !== '' ? user.rbacTier : null;

    // Neither a role nor a card tier → no identity to authorize.
    if (!userRole && !rbacTier) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }

    const userRoleLower = userRole ? userRole.toLowerCase() : null;

    // System-level role bypass — same exempt set as PermissionGuard.isAdminRole and
    // LoginService.isCardExemptRole (super_admin / admin / director). Additive: only ever
    // GRANTS access. director is card-less by design, so it cannot be authorized via the
    // rbacTier path below — the role bypass is what authorizes it, consistently with the
    // other card-RBAC consumers.
    if (userRoleLower === 'admin' || userRoleLower === 'super_admin' || userRoleLower === 'director') {
      return true;
    }

    const normalizedRequired = (Array.isArray(requiredRoles) ? requiredRoles : []).map((r) => r.toLowerCase());
    // Grant when EITHER the legacy role OR the primary-card rbacTier is allow-listed.
    const rbacTierLower = rbacTier ? rbacTier.toLowerCase() : null;
    const allowedByRole = userRoleLower != null && normalizedRequired.includes(userRoleLower);
    const allowedByTier = rbacTierLower != null && normalizedRequired.includes(rbacTierLower);
    if (!allowedByRole && !allowedByTier) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }

    return true;
  }
}
