/**
 * POS — Ombor konfiguratsiyasi (ERP ko'rish uchun — config-driven).
 * Faqat GET endpointlar: turlari, omborlar, qoldig'i, harakatlar tarixi, dashboard.
 * Kirim/chiqim operatsiyalari = pos-operations.controller (POS Monitor uchun).
 */
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { unwrapOrThrow } from '@common/http-result';

import { WarehouseConfigService } from '../application/services/warehouse-config.service';

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

  /** Bitta ombor qoldig'i — material kartochka bo'yicha joriy stok + tur-config. ERP ko'rish. */
  @Get('warehouses/:id/stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Ombor qoldig'i ko'rish (ERP moliya nazorat)" })
  async warehouseStock(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getWarehouseStock(id));
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
