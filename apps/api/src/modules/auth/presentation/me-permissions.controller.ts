/**
 * MePermissions controller — `GET /api/auth/me/permissions`.
 *
 * ARCHITECTURE.md §7.7 — frontend `usePermissions` hook'i shu endpointdan o'qiydi.
 * Controller faqat transport qatlami: validatsiya + handler chaqiruv + javob.
 *
 * Cache: Redis 15 daqiqa, position_permissions o'zgartirilganda invalidate.
 * Auth: JwtAuthGuard avtomatik (global guard) — `@Public()` belgilanmagan.
 */
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../infrastructure/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { GetMyPermissionsHandler } from '../application/queries/get-my-permissions.handler';
import type { AuthenticatedUser } from '../types/authenticated-user';
import type { MyPermissions } from '../domain/types/my-permissions.types';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('auth/me')
@ApiTags('Auth')
export class MePermissionsController {
  private readonly logger = new Logger(MePermissionsController.name);

  constructor(private readonly handler: GetMyPermissionsHandler) {}

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Joriy foydalanuvchining ruxsat to\'plami',
    description:
      'Foydalanuvchining position_id asosida modules + features qaytaradi. ' +
      'Cache: Redis 15 daq. super_admin/admin uchun barcha modullarda FULL.',
  })
  async getMyPermissions(@CurrentUser() user: AuthenticatedUser): Promise<MyPermissions> {
    const result = await this.handler.execute({ userId: user.id });
    return unwrapOrThrow(result);
  }
}
