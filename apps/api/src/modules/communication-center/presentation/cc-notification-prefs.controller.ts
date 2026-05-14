/**
 * /api/cc/notification-prefs — har xodim o'z bildirishnoma sozlamalarini boshqaradi.
 */
import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
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
@Controller('cc/notification-prefs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcNotificationPrefsController {
  constructor(private readonly repo: CcNotificationPrefsRepository) {}

  @Post()
  create() {
    throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get()
  get(@CurrentUser() user: { id: number }) {
    return this.repo.getOrDefault(user.id);
  }

  @Put()
  update(
    @Body(new ZodValidationPipe(UpdateSchema)) body: CcNotificationPrefsUpdate,
    @CurrentUser() user: { id: number },
  ) {
    return this.repo.upsert(user.id, body);
  }
}
