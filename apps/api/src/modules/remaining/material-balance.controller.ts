/**
 * @module material-balance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { AuthenticatedUser } from '@common/types/user.types';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MaterialBalanceService } from './material-balance.service';
import { MaterialBalanceBodyDto } from '../compatibility/dto/operations.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('material-balance')
export class MaterialBalanceController {
  constructor(private readonly svc: MaterialBalanceService) {}

  @Get('overview')
  async getOverview() {
    return unwrapOrInternal(await this.svc.getOverview());
  }

  @Get('alerts')
  async getAlerts() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @Get('internal-requests')
  async getInternalRequests() {
    return unwrapOrInternal(await this.svc.getInternalRequests());
  }

  @Patch('internal-requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'warehouse_manager', 'manager')
  async approveRequest(
    @Param('id') id: string,
    @Body() body: MaterialBalanceBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.approveRequest(id, body, user.id));
  }

  @Patch('internal-requests/:id/issue')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'warehouse_manager', 'manager')
  async issueRequest(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.issueRequest(id));
  }

  @Get('production')
  async getProduction(@Query() _q: Record<string, string>) {
    // FE (MaterialBalance "production" tab) reads response.data — wrap as { success, data }.
    const data = unwrapOrInternal(await this.svc.getProduction());
    return { success: true, data: Array.isArray(data) ? data : [] };
  }

  @Post('production/take')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async takeMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.takeMaterial(body));
  }

  @Post('production/use')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async useMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.useMaterial(body));
  }

  @Post('production/return')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async returnMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.returnMaterial(body));
  }

  @Post('negative-stock-check')
  async negativeStockCheck() {
    return unwrapOrInternal(await this.svc.negativeStockCheck());
  }

  @Get(':materialId/history')
  async getHistory(@Param('materialId') materialId: string, @Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getHistory(materialId, q));
  }

  /**
   * MaterialBalance page calls GET /api/material-balance/movements as a
   * cross-material movement feed — queries material_movements directly.
   */
  @Get('movements')
  async getMovements(@Query('limit') limit?: string) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const r = await db.execute(sql`
      SELECT * FROM material_movements ORDER BY created_at DESC LIMIT ${lim}
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = (body ?? {}) as Record<string, unknown>;

    // FE sends { material: "<kod or name>", quantity, type }
    // Resolve material_id + material_name via lookup in material_cards.
    const materialRaw = String(
      dto['material'] ?? dto['material_name'] ?? dto['materialName'] ?? '',
    ).trim();

    let resolvedMaterialId: number | null =
      typeof dto['material_id'] === 'number'
        ? dto['material_id']
        : typeof dto['materialId'] === 'number'
          ? dto['materialId']
          : null;
    let resolvedMaterialName = materialRaw;

    if (materialRaw) {
      const lookupR = await db.execute(sql`
        SELECT id, xom_ashyo FROM material_cards
        WHERE kod = ${materialRaw} OR xom_ashyo ILIKE ${materialRaw}
        LIMIT 1
      `);
      const found = ((lookupR as { rows?: unknown[] }).rows ?? [])[0] as Record<string, unknown> | undefined;
      if (found) {
        resolvedMaterialId = Number(found['id']);
        resolvedMaterialName = String(found['xom_ashyo'] ?? materialRaw);
      }
    }

    const r = await db.execute(sql`
      INSERT INTO material_movements
        (session_id, order_id, material_id, material_name, movement_type, quantity, unit, performed_by, scanned_at)
      VALUES (
        ${dto['session_id'] ?? dto['sessionId'] ?? null}::int,
        ${dto['order_id']   ?? dto['orderId']   ?? null}::int,
        ${resolvedMaterialId}::int,
        ${resolvedMaterialName}::text,
        ${String(dto['movement_type'] ?? dto['type'] ?? 'in')}::text,
        ${Number(dto['quantity'] ?? 1)}::numeric,
        ${String(dto['unit'] ?? 'шт')}::text,
        ${user?.id ?? 0}::int,
        NOW()
      )
      RETURNING id, material_id, material_name
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? null;
    return { message: 'Harakat qayd etildi', data: row };
  }

  @Get(':materialId/reconciliation')
  async getReconciliation(@Param('materialId') materialId: string) {
    return unwrapOrInternal(await this.svc.getReconciliation(materialId));
  }

  @Get('warehouse/:warehouseId')
  async getByWarehouse(@Param('warehouseId') warehouseId: string) {
    return unwrapOrInternal(await this.svc.getByWarehouse(warehouseId));
  }
}
