/**
 * @module gl.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — GL Posting Controller
 * AI GL 5-bosqich logi va tasdiqlash endpointlari
 */
import {
  Controller, Get, Post, Param, UseGuards,
  UseInterceptors, Logger, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { GlPostingLogService } from '../services/gl-posting-log.service';

@ApiTags('POS — GL Posting')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/gl')
export class GlController {
  private readonly logger = new Logger(GlController.name);

  constructor(private readonly glService: GlPostingLogService) {}

  @Get('movement/:id')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Harakat GL logi (5 bosqich)' })
  async getMovementGl(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.glService.getByMovement(id));
  }

  /** Spec-canonical: approve all GL entries for a movement */
  @Post('approve/:movementId')
  @RequirePermission('pos.gl.approve')
  @ApiOperation({ summary: 'Harakat bo\'yicha barcha GL yozuvlarini tasdiqlash' })
  async approveByMovement(
    @Param('movementId', ParseIntPipe) movementId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.glService.approveByMovement(movementId, user.id));
  }

  /** Approve a single GL log entry by its own ID */
  @Post('entry/:id/approve')
  @RequirePermission('pos.gl.approve')
  @ApiOperation({ summary: 'GL yozuvini moliya tasdiqlashi' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.glService.approveEntry(id, user.id));
  }

  @Post('entry/:id/reject')
  @RequirePermission('pos.gl.approve')
  @ApiOperation({ summary: 'GL yozuvini rad etish' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.glService.rejectEntry(id, user.id));
  }

  @Get('pending')
  @RequirePermission('pos.gl.approve')
  @ApiOperation({ summary: 'AI GL tasdiqlash kutayotgan yozuvlar' })
  async getPending() {
    return unwrapOrInternal(await this.glService.getPending());
  }

  @Get('journal')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'GL jurnal hisobot (tasdiqlangan yozuvlar)' })
  async getJournal() {
    return unwrapOrInternal(await this.glService.getJournal());
  }
}
