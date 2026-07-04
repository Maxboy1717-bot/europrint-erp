/**
 * @module users-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   users module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { UsersCompatService } from './users-compat.service';
import { unwrapOrInternal, unwrapOrDefault } from '@common/http-result';

@ApiThrottle()
@Controller('users')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'HR_MANAGER', 'HR_SPECIALIST', 'MANAGER')
export class UsersCompatController {
  constructor(private readonly svc: UsersCompatService) {}

  /**
   * Legacy backwards-compat endpoint — returns raw rows untouched. Kept so
   * existing UI consumers do not break while the migration is in progress.
   */
  @Get()
  async listUsers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    const r = await this.svc.listUsers(page, limit, search);
    return r.ok && r.data ? r.data : [];
  }
}
