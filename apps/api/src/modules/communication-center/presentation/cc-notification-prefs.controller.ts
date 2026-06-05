/**
 * /api/cc/notification-prefs — har xodim o'z bildirishnoma sozlamalarini boshqaradi.
 */
import { Body, Controller, Get, HttpException, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  CcNotificationPrefsRepository,
  type CcNotificationPrefsUpdate,
} from '../infrastructure/repositories/cc-notification-prefs.repo';

const UpdateSchema = z.object({
  urgentOnly:       z.boolean().optional(),
  telegramEnabled:  z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  language:         z.enum(['uz', 'ru']).optional(),
});

@Throttle({ default: { limit: 60, ttl: 60_000 } })
@ApiTags('Cc Notification Prefs')
@ApiBearerAuth()
@Controller('cc/notification-prefs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcNotificationPrefsController {
  constructor(private readonly repo: CcNotificationPrefsRepository) {}

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  create(
    @Body(new ZodValidationPipe(UpdateSchema)) body: CcNotificationPrefsUpdate,
    @CurrentUser() user: { id: number },
  ) {
    // POST = create-or-update (upsert) of the caller's own single prefs row (PK user_id),
    // the SAME canonical path as PUT. Was a {success:true} green-lie that saved nothing.
    return this.repo.upsert(user.id, body);
  }

  @ApiOperation({ summary: 'Get' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  get(@CurrentUser() user: { id: number }) {
    return this.repo.getOrDefault(user.id);
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put()
  update(
    @Body(new ZodValidationPipe(UpdateSchema)) body: CcNotificationPrefsUpdate,
    @CurrentUser() user: { id: number },
  ) {
    return this.repo.upsert(user.id, body);
  }
}
