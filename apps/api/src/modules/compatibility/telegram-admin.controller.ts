/**
 * @module telegram-admin.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   telegram-admin module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Body, Controller, Get, HttpCode, Post, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { TelegramAdminService } from './telegram-admin.service';
import {
  TelegramUserAclTranslator,
  type LegacyTelegramUserRow,
  type TelegramUserDto,
} from './acl/telegram-user-acl';

const BroadcastSchema = z.object({
  message: z.string().min(1),
  targetRole: z.string().optional(),
});

@ApiTags('Telegram Admin')
@ApiBearerAuth()
@Roles('super_admin', 'admin')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('telegram/admin')
export class TelegramAdminController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly userAcl = new TelegramUserAclTranslator();

  constructor(private readonly svc: TelegramAdminService) {}

  @Get('stats')
  async getStats() {
    return unwrapOrBadRequest(await this.svc.getStats());
  }

  @Get('users')
  async getUsers() {
    return unwrapOrBadRequest(await this.svc.getUsers());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-10 (Platform / Notifications)
   * consumers should target this endpoint; the legacy `/users` route stays
   * for backwards-compat.
   */
  @Get('users/v2')
  async getUsersV2(): Promise<{ items: TelegramUserDto[]; total: number }> {
    const raw = unwrapOrBadRequest(await this.svc.getUsers()) as unknown as { users?: unknown; total?: unknown };
    const rows = raw && Array.isArray(raw.users) ? raw.users : [];
    const items = rows
      .map((row) => this.userAcl.toDomain(row as unknown as LegacyTelegramUserRow))
      .filter((r): r is { ok: true; data: TelegramUserDto } => r.ok)
      .map((r) => r.data);
    return { items, total: items.length };
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(@Body() body: unknown) {
    const dto = BroadcastSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.broadcast(dto.message, dto.targetRole));
  }
}
