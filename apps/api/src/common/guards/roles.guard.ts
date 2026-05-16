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
    const user = request.user as { role?: string; permissionSet?: PermissionSet } | undefined;
    const userRole = user?.role;

    if (!userRole) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }

    const userRoleLower = userRole.toLowerCase();

    if (userRoleLower === 'admin' || userRoleLower === 'super_admin') {
      return true;
    }

    const normalizedRequired = (Array.isArray(requiredRoles) ? requiredRoles : []).map((r) => r.toLowerCase());
    if (!normalizedRequired.includes(userRoleLower)) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }

    return true;
  }
}
