/**
 * @module users-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { UsersCompatService } from './users-compat.service';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('users')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'HR_MANAGER', 'HR_SPECIALIST', 'MANAGER')
export class UsersCompatController {

  constructor(private readonly svc: UsersCompatService) {}

  @Get()
  async listUsers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.listUsers(page, limit, search));
  }
}
