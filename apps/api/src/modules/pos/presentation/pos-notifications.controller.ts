/**
 * @module pos-notifications.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Notifications Controller
 * Foydalanuvchi bildirishnomalar endpointlari
 */
import {
  Controller, Get, Post, Param, UseGuards,
  UseInterceptors, Logger, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { PosNotificationsService } from '../application/services/pos-notifications.service';

@ApiTags('POS — Bildirishnomalar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/notifications')
export class PosNotificationsController {
  private readonly logger = new Logger(PosNotificationsController.name);

  constructor(private readonly notificationsService: PosNotificationsService) {}

  @Get()
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Foydalanuvchiga tegishli bildirishnomalar' })
  async getAll(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.notificationsService.getForUser(user.id));
  }

  @Post(':id/read')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Bildirishnomani o\'qildi deb belgilash' })
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.notificationsService.markRead(id, user.id));
  }

  @Post('read-all')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Barcha bildirishnomalarni o\'qildi deb belgilash' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.notificationsService.markAllRead(user.id));
  }
}
