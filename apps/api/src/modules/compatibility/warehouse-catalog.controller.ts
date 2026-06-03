/**
 * @module warehouse-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   warehouse-catalog module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
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
import { notImplemented } from '@common/exceptions/not-implemented';
import { z } from 'zod';
import {
  WarehouseMaterialAclTranslator,
  type LegacyWarehouseMaterialRow,
  type WarehouseMaterialDto,
} from './acl/warehouse-material-acl';

const CreateWarehouseMaterialSchema = z.object({
  materialCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(500),
  unit: z.string().trim().min(1).max(50).optional(),
  category: z.string().trim().max(100).optional(),
  minStock: z.number().nonnegative().optional(),
});

@ApiTags('Warehouse Catalog (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseCatalogController {
  /** PA2-14 ACL translator. Stateless - direct instantiation is fine. */
  private readonly materialAcl = new WarehouseMaterialAclTranslator();

  constructor(private readonly svc: WarehouseCatalogService) {}

  @Get('materials')
  async getMaterials(@Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterials(search));
  }

  /**
   * PA2-14 ACL-translated variant of materials. New BC-5 (Warehouse)
   * consumers should target this route; `/materials` stays for
   * backwards-compat.
   */
  @Get('materials/v2')
  async getMaterialsV2(@Query('search') search?: string): Promise<WarehouseMaterialDto[]> {
    const rows = unwrapOrInternal(await this.svc.getMaterials(search)) as unknown as LegacyWarehouseMaterialRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.materialAcl.toDomain(row))
      .filter((r): r is { ok: true; data: WarehouseMaterialDto } => r.ok)
      .map((r) => r.data);
  }

  /**
   * POST /api/warehouse/materials — MaterialCardsPage create form. Real INSERT
   * into material_cards (canonical). Zod-validated; duplicate `kod` → 409.
   */
  @Post('materials')
  @HttpCode(HttpStatus.CREATED)
  async createMaterial(@Body() body: unknown) {
    const dto = CreateWarehouseMaterialSchema.parse(body);
    return unwrapOrInternal(await this.svc.createMaterial(dto));
  }

  /**
   * MaterialsAccounting page calls GET /api/warehouse/movements for the
   * cross-warehouse movement journal. Mirrors the shape produced by
   * wms/movements (which lives at /api/wms/movements) but kept here so the
   * accounting page does not need to change its URL.
   *
   * P3-26: aggregator service not yet wired - clients should use
   * /api/wms/movements directly until this gateway is implemented.
   */
  @Get('movements')
  async getWarehouseMovements(
    @Query('limit') _limit?: string,
    @Query('warehouseId') _warehouseId?: string,
    @Query('materialId') _materialId?: string,
  ) {
    return notImplemented('GET /warehouse/movements (use /wms/movements instead)');
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
