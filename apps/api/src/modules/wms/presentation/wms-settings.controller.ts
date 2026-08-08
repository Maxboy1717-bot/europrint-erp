/**
 * @module wms-settings.controller
 * @description NestJS controller for the WMS settings hub (generic key-value
 *   config page — reuses the SD/Marketing/QC config-page pattern for the
 *   Ombor module). Delegates to WmsSettingsService and returns unwrapped
 *   Result data. APPROVED: egasi vizyon-qurish 2026-07-01, FAZA
 *   "Sozlama har bo'limda".
 */

import { Body, Controller, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { WmsSettingsService } from '../application/wms-settings.service';

const WS_READ = ['super_admin', 'warehouse_manager', 'director'];
const WS_WRITE = ['super_admin', 'warehouse_manager', 'director'];

const SaveSettingsSchema = z.record(z.string());
const PatchSettingSchema = z.object({ value: z.string() });

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Settings')
@ApiBearerAuth()
@Controller('wms/settings')
export class WmsSettingsController {
  constructor(private readonly svc: WmsSettingsService) {}

  @ApiOperation({ summary: 'Ombor sozlamalarini olish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...WS_READ)
  async getAll() {
    const items = unwrapOrThrow(await this.svc.getAll());
    return { items };
  }

  @ApiOperation({ summary: 'Ombor sozlamalarini saqlash (bulk key-value)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post()
  @Roles(...WS_WRITE)
  async saveMany(@Body() body: unknown) {
    const dto = SaveSettingsSchema.parse(body ?? {});
    return unwrapOrThrow(await this.svc.saveMany(dto));
  }

  @ApiOperation({ summary: 'Bitta sozlamani yangilash' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch(':id')
  @Roles(...WS_WRITE)
  async patchById(@Param('id') id: string, @Body() body: unknown) {
    const dto = PatchSettingSchema.parse(body ?? {});
    return unwrapOrThrow(await this.svc.patchById(id, dto.value));
  }
}
