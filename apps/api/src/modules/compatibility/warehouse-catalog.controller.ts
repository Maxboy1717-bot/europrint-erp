/**
 * @module warehouse-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get, Post, Patch, Body, Query, Param, HttpCode, HttpException, HttpStatus , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseCatalogService } from './warehouse-catalog.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouse Catalog (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseCatalogController {
  constructor(private readonly svc: WarehouseCatalogService) {}

  @Get('materials')
  async getMaterials(@Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterials(search));
  }

  /**
   * MaterialsAccounting page calls GET /api/warehouse/movements for the
   * cross-warehouse movement journal. Mirrors the shape produced by
   * wms/movements (which lives at /api/wms/movements) but kept here so the
   * accounting page does not need to change its URL.
   *
   * P3-26: aggregator service not yet wired — clients should use
   * /api/wms/movements directly until this gateway is implemented.
   */
  @Get('movements')
  async getWarehouseMovements(
    @Query('limit') _limit?: string,
    @Query('warehouseId') _warehouseId?: string,
    @Query('materialId') _materialId?: string,
  ) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/movements (use /wms/movements instead)', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get('batches/stats')
  async getBatchesStats() {
    return unwrapOrInternal(await this.svc.getBatchesStats());
  }

  @Get('batches')
  async getBatches(
    @Query('materialId') materialId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return unwrapOrInternal(await this.svc.getBatches(materialId, warehouseId, status, search));
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createBatch(body));
  }

  @Patch('batches/:id')
  async updateBatch(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateBatch(id, body));
  }
}
