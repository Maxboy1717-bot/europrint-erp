/**
 * @module finance-ap.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Post, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { assertOk, unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceApService } from '../application/finance-ap.service';
import type { Result } from '@common/result';
import { ApAgingQuery, type ApAgingResult } from '../application/queries/ap-aging.handler';
import { z } from 'zod';

const CreateApEntrySchema = z.object({
  vendorId: z.union([z.string(), z.number()]).optional().nullable(),
  amount: z.number().positive(),
  dueDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});


@ApiThrottle()
@ApiTags('Finance Ap')
@Controller('ap')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'admin')
export class FinanceApController {
  private readonly logger = new Logger(FinanceApController.name);

  constructor(
    private readonly svc: FinanceApService,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /api/ap/ecl-aging — creditor aging by due-date bucket (0-30 / 31-60 / 61-90 / 90+).
   * Payables carry no ECL (no expected-credit-loss on money you owe) — amount/percentage only.
   * Drives the consolidated kreditor view of the ArApAging FE page. Real fi_invoices data only.
   */
  @ApiOperation({ summary: 'AP aging (0-30/31-60/61-90/90+)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ecl-aging')
  async getEclAging() {
    return unwrapOrThrow(await this.queryBus.execute<ApAgingQuery, Result<ApAgingResult>>(new ApAgingQuery()));
  }

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

  @ApiOperation({ summary: 'Create AP entry' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('entries')
  async createApEntry(@Body() body: unknown) {
    const dto = CreateApEntrySchema.parse(body);
    const result = await this.svc.createEntry({
      vendorId:    dto.vendorId ?? null,
      amount:      dto.amount,
      dueDate:     dto.dueDate ?? null,
      description: dto.description ?? null,
    });
    return unwrapOrInternal(result);
  }
}
