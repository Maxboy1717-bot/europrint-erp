/**
 * @module warehouse-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   warehouse-catalog module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, UseGuards, Get, Post, Patch, Body, Query, Param, HttpCode, HttpException, HttpStatus , UseInterceptors} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
type Rows = { rows?: unknown[] };
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseCatalogService } from './warehouse-catalog.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';

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
  constructor(private readonly svc: WarehouseCatalogService) {}

  @Get('materials')
  async getMaterials(@Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterials(search));
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

  // C1 retire (2026-06-05): GET /api/warehouse/movements was a 501 alias for the canonical
  // GET /api/wms/movements (no FE GET caller — MaterialsAccounting uses POST elsewhere). Removed
  // the alias stub on this @deprecated shim. See docs/yashil-yolgon-reja-2026-06-05.md C1.

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

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      INSERT INTO material_movements
        (session_id, order_id, material_id, material_name, movement_type, quantity, unit, performed_by, scanned_at)
      VALUES (
        ${dto['session_id'] ?? dto['sessionId'] ?? null}::int,
        ${dto['order_id']   ?? dto['orderId']   ?? null}::int,
        ${dto['material_id'] ?? dto['materialId'] ?? null}::int,
        ${String(dto['material_name'] ?? dto['materialName'] ?? '')}::text,
        ${String(dto['movement_type'] ?? dto['type'] ?? 'in')}::text,
        ${Number(dto['quantity'] ?? 1)}::numeric,
        ${String(dto['unit'] ?? 'шт')}::text,
        ${user?.id ?? 0}::int,
        NOW()
      )
      RETURNING id
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    return { message: "Harakat qayd etildi", data: row };
  }
}
