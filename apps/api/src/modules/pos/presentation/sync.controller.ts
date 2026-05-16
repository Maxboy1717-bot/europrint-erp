/**
 * @module sync.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Sync Controller
 * Offline rejim — push/pull/status endpointlari
 */
import {
  Controller, Get, Post, Body, UseGuards,
  UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { PosSyncService } from '../application/services/pos-sync.service';
import { z } from 'zod';

const PushSchema = z.object({
  clientUuid:          z.string().uuid(),
  terminalId:          z.string().min(1),
  offlineCreatedAt:    z.string(),
  movements:           z.array(z.record(z.unknown())),
  forceClientVersion:  z.boolean().optional(),
});

const PullSchema = z.object({
  terminalId: z.string().min(1),
  since:      z.string().optional(),
});

@ApiTags('POS — Offline Sync')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 50, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: PosSyncService) {}

  @Post('push')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Offline harakatlarni serverga yuborish (idempotency key bilan)' })
  async push(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = PushSchema.parse(body);
    return unwrapOrInternal(await this.syncService.push({
      ...parsed,
      userId: user.id,
    }));
  }

  @Post('pull')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'So\'nggi o\'zgarishlarni olish' })
  async pull(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = PullSchema.parse(body);
    return unwrapOrInternal(await this.syncService.pull({ ...parsed, userId: user.id }));
  }

  @Get('status')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Sync holati (pending/synced/conflict soni)' })
  async getStatus() {
    return unwrapOrInternal(await this.syncService.getStatus());
  }
}
