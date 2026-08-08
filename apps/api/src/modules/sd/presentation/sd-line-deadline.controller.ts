/**
 * @module sd-line-deadline.controller
 * @description Transport-only. SD per-line deadline scheduling (06-sd #29):
 *   GET order line deadlines, PATCH per_line_scheduling toggle, PATCH a line's deadline.
 */

import {
  Body, Controller, Get, NotFoundException, Param, Patch,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { SdLineDeadlineService } from '../application/sd-line-deadline.service';

// 'manager' — SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
const SD_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin'];

const PerLineSchedulingSchema = z.object({
  enabled: z.boolean(),
});

const SetLineDeadlineSchema = z.object({
  deadline: z.string().datetime().nullable(),
});

@ApiThrottle()
@ApiTags('Sd Line Deadline Scheduling')
@ApiBearerAuth()
@Controller('sd')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdLineDeadlineController {
  constructor(private readonly svc: SdLineDeadlineService) {}

  @ApiOperation({ summary: 'List a sales order lines with effective per-line deadlines' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get('orders/:orderId/line-deadlines')
  async getOrderLineDeadlines(@Param('orderId') orderId: string) {
    const result = await this.svc.getOrderLineDeadlines(parseInt(orderId, 10));
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Toggle per-line scheduling on a sales order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('orders/:orderId/per-line-scheduling')
  async setPerLineScheduling(
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(PerLineSchedulingSchema)) body: z.infer<typeof PerLineSchedulingSchema>,
  ) {
    return unwrapOrThrow(await this.svc.setPerLineScheduling(parseInt(orderId, 10), body.enabled));
  }

  @ApiOperation({ summary: 'Set or clear a single line deadline (null clears -> falls back to order deadline)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('order-items/:itemId/line-deadline')
  async setLineDeadline(
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(SetLineDeadlineSchema)) body: z.infer<typeof SetLineDeadlineSchema>,
  ) {
    return unwrapOrThrow(await this.svc.setLineDeadline({ itemId: parseInt(itemId, 10), deadline: body.deadline }));
  }
}
