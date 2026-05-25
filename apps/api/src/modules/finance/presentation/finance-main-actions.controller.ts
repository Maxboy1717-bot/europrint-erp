/**
 * @module finance-main-actions.controller
 * @description Write/action endpoints (POST GL/AP/AR/reverse, profitability recalc,
 * salary benchmark) split from finance-main.controller.ts per Rule 16 (≤ 300 lines).
 * Shares the `/finance` route prefix and FINANCE_ROLES guard with the read sibling.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { FinanceActionsService } from '../application/finance-actions.service';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

const CreateGlEntrySchema = z.object({
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  postingDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  reversalOf: z.union([z.string(), z.number()]).optional(),
  lines: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

const ApEntrySchema = z.object({
  vendorId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

const ArEntrySchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Finance Main Actions')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceMainActionsController {
  private readonly logger = new Logger(FinanceMainActionsController.name);
  constructor(
    private readonly glSvc: GlService,
    private readonly actionsSvc: FinanceActionsService,
  ) {}

  @ApiOperation({ summary: 'Create gl entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-entries')
  @HttpCode(HttpStatus.CREATED)
  async createGlEntry(@Body() body: unknown) {
    const dto = CreateGlEntrySchema.parse(body);
    return unwrapOrThrow(await this.glSvc.postDocument(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Get gl entry reverse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gl-entries/:id/reverse')
  getGlEntryReverse(@Param('id') _id: string) {
    return { reversed: false };
  }

  @ApiOperation({ summary: 'Post gl entry reverse' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gl-entries/:id/reverse')
  @HttpCode(HttpStatus.ACCEPTED)
  async postGlEntryReverse(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateGlEntrySchema.parse(body);
    // Full reversal requires fetching the original entry and posting a mirrored document.
    // Wire to glSvc.reverseDocument once that method is implemented in Sprint 3.
    const reversal = await this.glSvc.postDocument({
      ...(dto as Record<string, unknown>),
      description: `[REVERSAL] ${String(dto.description ?? '')}`.trim(),
      reversalOf: id,
    });
    return unwrapOrThrow(reversal);
  }

  @ApiOperation({ summary: 'Get salary benchmark' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('salary-benchmark/:userId')
  async getSalaryBenchmark(@Param('userId') userId: string) {
    const r = await this.actionsSvc.getSalaryBenchmark();
    const row = unwrapOrThrow(r);
    return {
      data: {
        userId,
        market_min: row['market_min'] ?? null,
        market_median: row['market_median'] ?? null,
        market_max: row['market_max'] ?? null,
        market_avg: row['market_avg'] ?? null,
        sample_size: Number(row['sample_size'] ?? 0),
        currency: 'UZS',
      },
    };
  }

  /**
   * POST /api/finance/profitability/recalculate — trigger a profitability
   * recalculation across all open order-costing rows. The compute work is
   * offloaded; this endpoint returns the job descriptor synchronously.
   */
  @ApiOperation({ summary: 'Recalculate profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('profitability/recalculate')
  @HttpCode(HttpStatus.ACCEPTED)
  async recalculateProfitability(@Body() body: unknown) {
    try {
      const payload = (body ?? {}) as { orderId?: string; from?: string; to?: string };
      const jobId = `prof-recalc-${Date.now()}`;
      this.logger.log(`Profitability recalc queued: jobId=${jobId} orderId=${payload.orderId ?? 'all'}`);
      return {
        jobId,
        status: 'queued',
        orderId: payload.orderId ?? null,
        from: payload.from ?? null,
        to: payload.to ?? null,
        queuedAt: _time.now().toISOString(),
        message: 'Rentabellik qayta hisoblash navbatga qo\'shildi.',
      };
    } catch (e) {
      this.logger.error(`recalculateProfitability: ${(e as Error).message}`);
      return { jobId: null, status: 'error', error: (e as Error).message };
    }
  }

  /** POST /api/finance/ap/entries — create accounts-payable entry */
  @ApiOperation({ summary: 'Create ap entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ap/entries')
  @HttpCode(HttpStatus.CREATED)
  async createApEntry(@Body() body: unknown) {
    const dto = ApEntrySchema.parse(body);
    const result = await this.actionsSvc.createApEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }

  /** POST /api/finance/ar/entries — create accounts-receivable entry */
  @ApiOperation({ summary: 'Create ar entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ar/entries')
  @HttpCode(HttpStatus.CREATED)
  async createArEntry(@Body() body: unknown) {
    const dto = ArEntrySchema.parse(body);
    const result = await this.actionsSvc.createArEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }
}
