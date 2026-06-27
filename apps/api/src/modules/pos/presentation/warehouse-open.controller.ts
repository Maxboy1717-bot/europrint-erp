/**
 * @module warehouse-open.controller
 * @description POS Terminal — kirgach xodim omborlari AUTO-OPEN + per-warehouse-type ETIKET config.
 * Spec: OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md.
 *   GET   /api/pos/my-warehouses            — joriy user omborlari + default (is_primary) + switcher.
 *   GET   /api/pos/label-config             — barcha etiket configlar (admin).
 *   GET   /api/pos/label-config/:type       — ombor-turi etiket config (Q-40: yo'q → default).
 *   GET   /api/pos/label-config/warehouse/:id — ombor (id) etiket config.
 *   PATCH /api/pos/label-config             — etiket config upsert (real saqlash, Q-43).
 */

import {
  Controller, Get, Patch, Param, Body, UseGuards, ParseIntPipe,
  Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { unwrapOrInternal } from '@common/http-result';

import { WarehouseOpenService } from '../application/services/warehouse-open.service';
import { UpsertLabelConfigSchema, type UpsertLabelConfigDto } from '../dto/warehouse-open.dto';

@ApiTags('POS — Terminal ombor ochish + etiket')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class WarehouseOpenController {
  private readonly logger = new Logger(WarehouseOpenController.name);

  constructor(private readonly service: WarehouseOpenService) {}

  // ─── Kirgach: is_primary ombor AVTO-ochiladi + switcher ro'yxati ──────────
  @Get('my-warehouses')
  @RequirePermission('pos.employee.read_own')
  @ApiOperation({ summary: 'Joriy xodim omborlari (is_primary default, bir nechta → switcher)' })
  async getMyWarehouses(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.service.getMyWarehouses(user.id));
  }

  // ─── Etiket config: barcha (admin) ────────────────────────────────────────
  @Get('label-config')
  @RequirePermission('pos.config.read')
  @ApiOperation({ summary: 'Barcha ombor-turi etiket configlari' })
  async listLabelConfigs() {
    return unwrapOrInternal(await this.service.listLabelConfigs());
  }

  // ─── Etiket config: ombor (id) bo'yicha ──────────────────────────────────
  @Get('label-config/warehouse/:id')
  @RequirePermission('pos.config.read')
  @ApiOperation({ summary: 'Ombor (id) etiket config (turini topib qaytaradi)' })
  async getLabelConfigByWarehouse(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.getLabelConfigByWarehouse(id));
  }

  // ─── Etiket config: ombor-turi bo'yicha (Q-40: yo'q → default) ────────────
  @Get('label-config/:type')
  @RequirePermission('pos.config.read')
  @ApiOperation({ summary: 'Ombor-turi etiket config (yo\'q bo\'lsa default o\'lcham)' })
  async getLabelConfig(@Param('type') type: string) {
    return unwrapOrInternal(await this.service.getLabelConfig(type));
  }

  // ─── Etiket config upsert (real saqlash, Q-43) ───────────────────────────
  @Patch('label-config')
  @RequirePermission('pos.config.update')
  @UsePipes(new ZodValidationPipe(UpsertLabelConfigSchema))
  @ApiOperation({ summary: 'Ombor-turi etiket o\'lchamini saqlash (upsert)' })
  async upsertLabelConfig(
    @Body() dto: UpsertLabelConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.service.upsertLabelConfig({
      warehouseType: dto.warehouseType,
      labelWidthMm:  dto.labelWidthMm,
      labelHeightMm: dto.labelHeightMm,
      template:      dto.template,
      updatedBy:     user.id,
    }));
  }
}
