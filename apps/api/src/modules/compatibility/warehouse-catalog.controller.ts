/**
 * @module warehouse-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get, Post, Patch, Body, Query, Param, HttpCode, HttpStatus , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseCatalogService } from './warehouse-catalog.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouse Catalog (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseCatalogController {
  constructor(private readonly svc: WarehouseCatalogService) {}

  @Get('materials')
  async getMaterials(@Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterials(search));
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
