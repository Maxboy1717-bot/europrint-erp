import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionSet } from '../cache/permission-set.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      throw new ForbiddenException('Ruxsat yoq');
    }

    const userRoleLower = userRole.toLowerCase();

    if (userRoleLower === 'admin' || userRoleLower === 'super_admin') {
      return true;
    }

    const normalizedRequired = (requiredRoles ?? []).map((r) => r.toLowerCase());
    if (!normalizedRequired.includes(userRoleLower)) {
      throw new ForbiddenException('Ruxsat yoq');
    }

    return true;
  }
}
