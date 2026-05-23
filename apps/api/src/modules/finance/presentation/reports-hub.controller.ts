/**
 * @module finance-reports-hub.controller
 * @description Finance-specific Reports Hub controller.
 *
 *   Route prefix is `finance/reports-hub` to avoid collision with the canonical
 *   ReportsHubController in `remaining` module which uses prefix `reports-hub`
 *   and exposes 10+ endpoints backed by ReportsHubRepository.
 *
 *   This controller exposes the Finance-domain summary (invoices/payments/budgets/GL)
 *   via the Finance-specific ReportsHubService → DrizzleReportsHubRepository.
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
@ApiTags('Finance Reports Hub')
@Controller('finance/reports-hub')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class ReportsHubController {
  constructor(private readonly svc: ReportsHubService) {}

  @ApiOperation({ summary: 'Get Finance hub summary (invoices, payments, budgets, GL)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getHub() {
    return unwrapOrInternal(await this.svc.getSummary());
  }
}
