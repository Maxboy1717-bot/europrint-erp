/**
 * POS → WMS Gateway Controller
 *
 * WMS /warehouse frontend'i uchun POS ma'lumotlariga kirish nuqtalari.
 * Ombor menejerlar va nazoratchilar real-time stok va harakat tarixini ko'radi.
 */
import {
  Controller, Get, Param, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { unwrapOrInternal } from '@common/http-result';
import { PosWmsQueryService } from '../application/services/pos-wms-query.service';

@ApiTags('POS → WMS Gateway')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/wms')
export class PosWmsController {
  private readonly logger = new Logger(PosWmsController.name);

  constructor(private readonly wmsQuery: PosWmsQueryService) {}

  // -------------------------------------------------------------------------
  // GET /pos/wms/warehouses  — barcha omborlar ro'yxati (POS Monitor uchun)
  // -------------------------------------------------------------------------
  @Get('warehouses')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'WMS: Barcha omborlar ro\'yxati (nomi, turi, stok soni bilan)' })
  async getWarehousesList() {
    this.logger.debug('[PosWms] getWarehousesList');
    return unwrapOrInternal(await this.wmsQuery.getWarehousesList());
  }

  // -------------------------------------------------------------------------
  // GET /pos/wms/materials — material qidirish
  // -------------------------------------------------------------------------
  @Get('materials')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'WMS: Materiallar qidirish (nom, kod, barcode, kategoriya)' })
  @ApiQuery({ name: 'q',           required: false })
  @ApiQuery({ name: 'category',    required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'limit',       required: false })
  async searchMaterials(
    @Query('q')           q?: string,
    @Query('category')    category?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('limit')       limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return unwrapOrInternal(
      await this.wmsQuery.searchMaterials(q, category, warehouseId, parsedLimit),
    );
  }

  // -------------------------------------------------------------------------
  // GET /pos/wms/warehouse/:warehouseId/stock
  // -------------------------------------------------------------------------
  @Get('warehouse/:warehouseId/stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'WMS: Ombor stok holati (POS manbadan)',
    description:
      'Berilgan ombor uchun material_cards + pos_stock_balances ma\'lumotlarini qaytaradi.',
  })
  @ApiParam({ name: 'warehouseId', description: 'Ombor identifikatori' })
  async getWarehouseStock(
    @Param('warehouseId') warehouseId: string,
  ) {
    this.logger.debug(`[PosWms] getWarehouseStock warehouseId=${warehouseId}`);
    return unwrapOrInternal(
      await this.wmsQuery.getWarehouseStockForWms(warehouseId),
    );
  }

  // -------------------------------------------------------------------------
  // GET /pos/wms/warehouse/:warehouseId/movements
  // -------------------------------------------------------------------------
  @Get('warehouse/:warehouseId/movements')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'WMS: Yakunlangan harakatlar tarixi (POS manbadan)',
    description:
      'Ombor bilan bog\'liq barcha completed pos_movements ni qaytaradi.',
  })
  @ApiParam({ name: 'warehouseId', description: 'Ombor identifikatori' })
  @ApiQuery({ name: 'limit', required: false, description: 'Yozuvlar soni (default: 100)' })
  async getMovementHistory(
    @Param('warehouseId') warehouseId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    this.logger.debug(`[PosWms] getMovementHistory warehouseId=${warehouseId} limit=${parsedLimit}`);
    return unwrapOrInternal(
      await this.wmsQuery.getMovementHistoryForWms(warehouseId, parsedLimit),
    );
  }

  // -------------------------------------------------------------------------
  // GET /pos/wms/low-stock
  // -------------------------------------------------------------------------
  @Get('low-stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'WMS: Min stok chegarasidan past materiallar',
    description:
      'available_qty < min_stock bo\'lgan barcha materiallarni qaytaradi.',
  })
  async getLowStock() {
    this.logger.debug('[PosWms] getLowStock');
    return unwrapOrInternal(
      await this.wmsQuery.getLowStockForWms(),
    );
  }
}
