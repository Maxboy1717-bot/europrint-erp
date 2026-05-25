/**
 * @module finance-ap.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Post, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceApService } from '../application/finance-ap.service';


@ApiThrottle()
@ApiTags('Finance Ap')
@Controller('ap')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'admin')
export class FinanceApController {
  private readonly logger = new Logger(FinanceApController.name);

  constructor(private readonly svc: FinanceApService) {}

  @ApiOperation({ summary: 'Get aging buckets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('aging')
  async getAgingBuckets() {
    const _rAging = await this.svc.getAgingBuckets();
    assertOk(_rAging);
    const { buckets, totals } = _rAging.data as { buckets: Record<string, unknown>[]; totals: Record<string, unknown> };
    const t = totals as Record<string, unknown>;
    return {
      buckets,
      totals: {
        current: Number(t.current) || 0,
        days31to60: Number(t.days31to60) || 0,
        days61to90: Number(t.days61to90) || 0,
        days91to120: Number(t.days91to120) || 0,
        over120: Number(t.over120) || 0,
        totalOutstanding: Number(t.total_outstanding) || 0,
      },
    };
  }

  @ApiOperation({ summary: 'Get overdue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('overdue')
  async getOverdue() {
    return unwrapOrInternal(await this.svc.getOverdue());
  }

  @ApiOperation({ summary: 'Recalculate aging' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('aging/recalculate')
  async recalculateAging() {
    const bucketsUpdated = await this.svc.recalculateAging();
    return { bucketsUpdated };
  }
}
