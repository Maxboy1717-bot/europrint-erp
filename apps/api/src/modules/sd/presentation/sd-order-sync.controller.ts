/**
 * @module sd-order-sync.controller
 * @description Transport-only. Kashirovka offset+gofra sync (vision 06-sd#40):
 *   GET sd/orders/:id/sync-status (predecessor link + MES can_start gate) and
 *   PUT sd/orders/:id/predecessor (set/clear the predecessor order).
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards, UseInterceptors,
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
import { SdOrderSyncService } from '../application/sd-order-sync.service';

// 'manager' — SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
const SD_SYNC_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin', 'technologist'];

const SetPredecessorSchema = z.object({
  predecessorOrderId: z.number().int().positive().nullable(),
});

@ApiThrottle()
@ApiTags('Sd Order Sync')
@ApiBearerAuth()
@Controller('sd/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_SYNC_ROLES)
export class SdOrderSyncController {
  constructor(private readonly svc: SdOrderSyncService) {}

  @ApiOperation({ summary: 'Kashirovka offset+gofra sync — predecessor link + MES can-start gate' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/sync-status')
  async getSyncStatus(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getSyncStatus(id));
  }

  @ApiOperation({ summary: 'Set/clear the predecessor order for sync scheduling' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Cycle detected' })
  @Put(':id/predecessor')
  @Roles('sales_manager', 'manager', 'director', 'super_admin', 'technologist')
  async setPredecessor(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SetPredecessorSchema)) body: z.infer<typeof SetPredecessorSchema>,
  ) {
    return unwrapOrThrow(await this.svc.setPredecessor(id, body.predecessorOrderId));
  }
}
