/**
 * @module business-settings.controller
 * @description Global biznes-sozlamalar CRUD (OWNER-JAVOBLAR-2026-07-11 §0/§1 — "global CRUD
 *   qoidasi"). Threshold/norma/%/kun/daqiqa/summa qiymatlari kodga hardcode qilinmaydi — egasi
 *   shu ekrandan boshqaradi. Transport-only (Qoida 6): Zod validatsiya → servisga delegat → Result unwrap.
 *
 *   GET    /api/business-settings?module=&includeInactive=   — ro'yxat (ixtiyoriy modul filtri)
 *   GET    /api/business-settings/:key                        — bitta kalit
 *   POST   /api/business-settings                             — yangi sozlama
 *   PATCH  /api/business-settings/:key                        — qiymat/metadata yangilash
 *   DELETE /api/business-settings/:key                        — o'chirish
 */

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BusinessSettingsService } from './business-settings.service';
import {
  ListBusinessSettingsQuerySchema,
  CreateBusinessSettingSchema,
  UpdateBusinessSettingSchema,
} from './business-settings.dto';

const READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.MANAGER, Role.PRODUCTION_MANAGER, Role.FINANCE_MANAGER];
const WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR];

@ApiThrottle()
@ApiTags('Business Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('business-settings')
export class BusinessSettingsController {
  constructor(private readonly svc: BusinessSettingsService) {}

  @Get()
  @Roles(...READ)
  @ApiOperation({ summary: 'List business settings (optional module filter)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() query: unknown) {
    const q = ListBusinessSettingsQuerySchema.parse(query);
    const items = unwrapOrThrow(await this.svc.list(q.module, q.includeInactive));
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':key')
  @Roles(...READ)
  @ApiOperation({ summary: 'Get one business setting by key' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOne(@Param('key') key: string) {
    const r = await this.svc.getByKey(key);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Post()
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Create a business setting' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 409, description: 'Key conflict' })
  async create(@Body() body: unknown) {
    const dto = CreateBusinessSettingSchema.parse(body);
    const r = await this.svc.create(dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Patch(':key')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Update a business setting value/metadata' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('key') key: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = UpdateBusinessSettingSchema.parse(body);
    const r = await this.svc.updateByKey(key, { ...dto, updatedBy: user?.id ?? null });
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Delete(':key')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Delete a business setting' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('key') key: string) {
    const r = await this.svc.deleteByKey(key);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }
}
