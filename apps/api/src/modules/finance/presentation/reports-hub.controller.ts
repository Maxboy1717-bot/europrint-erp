/**
 * @module reports-hub.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ReportsHubService } from '../reports-hub/reports-hub.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Reports Hub')
@Controller('reports-hub')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class ReportsHubController {
  constructor(private readonly svc: ReportsHubService) {}

  @ApiOperation({ summary: 'Get hub' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getHub() {
    return unwrapOrInternal(await this.svc.getSummary());
  }
}
