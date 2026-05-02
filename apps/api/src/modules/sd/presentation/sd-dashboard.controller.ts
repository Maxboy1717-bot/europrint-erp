import { safeInt } from '../../hr/common/db-rows';
import {
  Controller,
  UseGuards,
  Get,
  Logger,
  Query,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@shared/decorators/roles.decorator';
import { SdDashboardService } from '../application/sd-dashboard.service';

@Roles('admin', 'manager', 'supervisor', 'operator', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('sd/dashboard')
export class SdDashboardController {
  private readonly logger = new Logger(SdDashboardController.name);

  constructor(private readonly svc: SdDashboardService) {}

  @Get('overview')
  async getOverview(@Query('period') _period?: string) {
    return unwrapOrThrow(await this.svc.getOverview());
  }

  @Get('manager-actions')
  async getManagerActions(@Query('managerId') managerId?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getManagerActions(managerId ? safeInt(managerId, 0) : null, safeInt(limit, 20)));
  }

  @Get('quota')
  async getQuotaStats(@Query('managerId') managerId?: string, @Query('period') _period?: string) {
    return unwrapOrThrow(await this.svc.getQuotaStats(managerId ? safeInt(managerId, 0) : null));
  }
}
