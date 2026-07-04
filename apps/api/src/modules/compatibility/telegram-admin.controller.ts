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
  constructor(private readonly svc: TelegramAdminService) {}

  @Get('stats')
  async getStats() {
    return unwrapOrBadRequest(await this.svc.getStats());
  }

  @Get('users')
  async getUsers() {
    return unwrapOrBadRequest(await this.svc.getUsers());
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(@Body() body: unknown) {
    const dto = BroadcastSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.broadcast(dto.message, dto.targetRole));
  }
}
