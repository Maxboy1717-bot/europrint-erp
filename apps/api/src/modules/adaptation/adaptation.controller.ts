import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { AdaptationService } from './adaptation.service';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { unwrapOrInternal } from '@common/http-result';
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('adaptation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.HR_SPECIALIST)
@UseInterceptors(AuditInterceptor)
export class AdaptationController {
  constructor(private readonly svc: AdaptationService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('programs')
  async getPrograms(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.getPrograms(limit, offset));
  }

  @Get('records')
  async getRecords(
    @Query('status') status?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.getRecords(status, limit, offset));
  }

  @Get('cases')
  async getCases(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.getCases(limit, offset));
  }

  @Get('new-employees/:id')
  async getNewEmployeeRecord(@Param('id') id: string) {
    const result = await this.svc.findRecordById(Number(id));
    return { data: (result.ok && result.data != null) ? result.data : null };
  }
}
