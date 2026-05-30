/**
 * POS — Ombor konfiguratsiyasi (config-driven UI uchun).
 * Yangi toza per-tur ombor sahifalari shu endpointlardan generatsiya qilinadi.
 */
import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';

import { WarehouseConfigService } from '../application/services/warehouse-config.service';

const IssueStockSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit: z.string().max(50).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

@ApiTags('POS — Ombor konfiguratsiyasi')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/warehouse-config')
export class WarehouseConfigController {
  constructor(private readonly svc: WarehouseConfigService) {}

  /** Ombor turlari (config) + har turdagi omborlar soni. */
  @Get('types')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Ombor turlari konfiguratsiyasi (config-driven)' })
  async types() {
    return unwrapOrThrow(await this.svc.listTypes());
  }

  /** Omborlar ro'yxati (ixtiyoriy ?type= filtri). */
  @Get('warehouses')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Omborlar ro'yxati (tur bo'yicha)" })
  @ApiQuery({ name: 'type', required: false })
  async warehouses(@Query('type') type?: string) {
    return unwrapOrThrow(await this.svc.listWarehouses(type));
  }

  /** Bitta ombor qoldig'i — material kartochka bo'yicha joriy stok (warehouse_stock). */
  @Get('warehouses/:id/stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Ombor qoldig'i (material kartochka bo'yicha)" })
  async warehouseStock(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getWarehouseStock(id));
  }

  /** Ombordan material chiqim (iste'mol/sarf) — qoldiq kamayadi + material_movements jurnali. */
  @Post('warehouses/:id/issue')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Ombordan material chiqim (iste\'mol/sarf)' })
  async issueStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = IssueStockSchema.parse(body);
    return unwrapOrThrow(await this.svc.issueStock(id, dto, user.id));
  }

  /** Ombor kirim (qo'lda / tuzatish) — qoldiq oshadi + material_movements jurnali. */
  @Post('warehouses/:id/receive')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Ombor kirim (qo'lda / inventarizatsiya tuzatishi)" })
  async receiveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = IssueStockSchema.parse(body);
    return unwrapOrThrow(await this.svc.receiveStock(id, dto, user.id));
  }

  /** Material harakat tarixi (kirim/chiqim jurnali, eng yangisi birinchi). */
  @Get('materials/:materialId/movements')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Material harakat tarixi (material_movements)' })
  async materialMovements(@Param('materialId', ParseIntPipe) materialId: number) {
    return unwrapOrThrow(await this.svc.getMaterialMovements(materialId));
  }

  /** Moliya/Ombor dashboard — har ombor qoldiq+qiymat, yig'indilar, so'nggi harakatlar. */
  @Get('dashboard')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Moliya/Ombor umumiy dashboard (qoldiq + qiymat)' })
  async dashboard() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }
}
