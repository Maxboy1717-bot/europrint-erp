/**
 * @module finance-ar.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceArService } from '../application/finance-ar.service';
import { z } from 'zod';

const CreateArEntrySchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional().nullable(),
  amount: z.number().positive(),
  dueDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});


@ApiThrottle()
@ApiTags('Finance Ar')
@Controller('ar')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'admin')
export class FinanceArController {
  private readonly logger = new Logger(FinanceArController.name);

  constructor(private readonly svc: FinanceArService) {}

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

  @ApiOperation({ summary: 'Create AR entry' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('entries')
  async createArEntry(@Body() body: unknown) {
    const dto = CreateArEntrySchema.parse(body);
    const result = await this.svc.createEntry({
      customerId:  dto.customerId ?? null,
      amount:      dto.amount,
      dueDate:     dto.dueDate ?? null,
      description: dto.description ?? null,
    });
    return unwrapOrInternal(result);
  }
}
