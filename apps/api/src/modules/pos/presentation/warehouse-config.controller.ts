/**
 * POS — Ombor konfiguratsiyasi (config-driven UI uchun).
 * Yangi toza per-tur ombor sahifalari shu endpointlardan generatsiya qilinadi.
 */
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
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
}
