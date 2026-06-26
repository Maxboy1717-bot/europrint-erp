/**
 * @module roles.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { PermissionSet } from '../cache/permission-set.interface';

/**
 * Role-based access guard. Reads `@Roles('director', 'cfo', ...)` metadata
 * and checks the authenticated user's role.
 *
 * Special cases:
 *  - Routes without `@Roles()` are allowed (true) — auth checked elsewhere by JwtAuthGuard
 *  - Roles `admin` and `super_admin` (case-insensitive) bypass the allow-list
 *  - Comparison is case-insensitive on both sides
 *  - EP-ORG (A5): in addition to `user.role`, the authenticated user's primary-card
 *    `rbacTier` claim (operator/specialist/manager/executive — see rbac-tier.policy.ts,
 *    derived from the primary card's razryad in resolveCardGate) is ALSO accepted against
 *    the allow-list. This is additive: `role` continues to authorize exactly as before;
 *    `rbacTier` only ever GRANTS additional access, never removes it. Card-less users
 *    (rbacTier null) keep the legacy role-only behavior. Login-gate stays OFF (default).
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

    // admin / super_admin bypass — unchanged.
    if (userRoleLower === 'admin' || userRoleLower === 'super_admin') {
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
