/**
 * @module employees-for-face.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrGsdService } from './hr-gsd.service';

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin', 'security', 'SECURITY')
@UseInterceptors(AuditInterceptor)
@Controller('employees-for-face')
export class EmployeesForFaceController {
  constructor(private readonly svc: HrGsdService) {}

  @Get()
  async getEmployeesForFace(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pg = Math.max(1, Number(page ?? 1));
    const lm = Math.min(Number(limit ?? 100), 500);
    const r = await this.svc.getEmployeesList(lm, (pg - 1) * lm);
    const items = Array.isArray(r) ? r : [];
    return { items, total: items.length, page: pg, limit: lm };
  }
}
