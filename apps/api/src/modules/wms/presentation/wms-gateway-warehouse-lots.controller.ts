/**
 * @module wms-gateway-warehouse-lots.controller
 * @description NestJS controller. Zones / Bins / Lots sub-routes split from
 *   `WmsGatewayWarehousesController` to keep individual files under 300 lines.
 */

import {
  Body, Controller, Get, Logger, Param, Patch, Post, Query,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

const CreateLotSchema = z.object({
  batch_number: z.string().max(200).optional(),
  lot_number: z.string().max(200).optional(),
  material_id: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  unit: z.string().max(50).optional(),
  quality_status: z.string().max(50).optional(),
  supplier_batch_number: z.string().max(200).optional(),
  cost_per_unit: z.union([z.string(), z.number()]).optional(),
  defect_reason: z.string().max(2000).optional(),
  quarantine_reason: z.string().max(2000).optional(),
  serial_number: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const UpdateLotSchema = z.object({
  quality_status: z.string().max(50).optional(),
  defect_reason: z.string().max(2000).optional(),
  quarantine_reason: z.string().max(2000).optional(),
  bin_location_id: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
  is_active: z.boolean().optional(),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Gateway Warehouse Lots')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsGatewayWarehouseLotsController {
  private readonly logger = new Logger(WmsGatewayWarehouseLotsController.name);

  @ApiOperation({ summary: 'Get warehouse zones' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('warehouses/:id/zones')
  @Roles(...WH_READ)
  async getWarehouseZones(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`
        SELECT z.id::text AS id, z.code, z.name, z.name_ru AS "nameRu",
               z.zone_type AS "zoneType", z.warehouse_id::text AS "warehouseId",
               z.capacity, z.is_active AS "isActive", z.created_at AS "createdAt",
               COUNT(b.id)::int AS "binCount",
               COALESCE(SUM(b.current_occupancy), 0)::numeric AS "totalOccupancy"
        FROM warehouse_zones z
        LEFT JOIN warehouse_bins b ON b.zone_id = z.id AND b.deleted_at IS NULL
        WHERE z.warehouse_id = ${parseInt(id, 10)} AND z.deleted_at IS NULL
        GROUP BY z.id, z.code, z.name, z.name_ru, z.zone_type, z.warehouse_id, z.capacity, z.is_active, z.created_at
        ORDER BY z.code
      `);
      return (r as { rows?: unknown[] }).rows ?? [];
    } catch (e) { this.logger.warn(`getWarehouseZones failed: ${(e as Error).message}`); throw e; }
  }

  @ApiOperation({ summary: 'Get warehouse bins' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('warehouses/:id/bins')
  @Roles(...WH_READ)
  async getWarehouseBins(
    @Param('id') id: string,
    @Query('zone_id') zoneId?: string,
  ) {
    try {
      const r = await rawSql(sql`
        SELECT b.id, b.bin_code AS "binCode", b.row, b.shelf, b.level, b.bin_type AS "binType",
               b.max_weight AS "maxWeight", b.max_volume AS "maxVolume",
               b.current_occupancy AS "currentOccupancy", b.is_active AS "isActive",
               b.zone_id AS "zoneId", z.name AS "zoneName",
               CASE WHEN b.max_volume > 0 THEN ROUND((b.current_occupancy / b.max_volume * 100)::numeric, 1) ELSE 0 END AS "occupancyPct"
        FROM warehouse_bins b
        LEFT JOIN warehouse_zones z ON z.id = b.zone_id
        WHERE b.warehouse_id = ${parseInt(id, 10)}
          AND b.deleted_at IS NULL AND b.is_active = true
          AND (${zoneId ?? null}::int IS NULL OR b.zone_id = ${zoneId ? parseInt(zoneId, 10) : null}::int)
        ORDER BY b.row, b.shelf, b.level, b.bin_code LIMIT 500
      `);
      return (r as { rows?: unknown[] }).rows ?? [];
    } catch (e) { this.logger.warn(`getWarehouseBins failed: ${(e as Error).message}`); throw e; }
  }

  @ApiOperation({ summary: 'Get warehouse lots' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('warehouses/:id/lots')
  @Roles(...WH_READ)
  async getWarehouseLots(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    try {
      const r = await rawSql(sql`
        SELECT bl.id, COALESCE(bl.lot_number, bl.batch_number) AS lot_number, bl.batch_number,
               bl.quantity, bl.remaining_quantity AS available_quantity,
               bl.unit, bl.quality_status AS status, bl.expiry_date, bl.production_date,
               COALESCE(bl.received_date, bl.created_at) AS received_date,
               bl.supplier_batch_number, bl.cost_per_unit, bl.defect_reason,
               bl.quarantine_reason, bl.serial_number, bl.is_fifo_locked,
               wb.bin_code, wb.row AS bin_row, wb.shelf AS bin_shelf,
               mc.xom_ashyo AS material_name, mc.kod AS material_code, mc.unit_of_measure,
               mc.grammage, mc.format_a, mc.format_b,
               EXTRACT(DAY FROM NOW() - COALESCE(bl.production_date, bl.created_at))::int AS age_days,
               CASE WHEN bl.expiry_date IS NOT NULL
                    THEN EXTRACT(DAY FROM bl.expiry_date - NOW())::int
                    ELSE NULL END AS days_until_expiry
        FROM batch_lots bl
        LEFT JOIN warehouse_bins wb ON wb.id = bl.bin_location_id
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE bl.warehouse_id = ${parseInt(id, 10)} AND bl.is_active = true
          AND (${status ?? null}::text IS NULL OR bl.quality_status = ${status ?? null})
        ORDER BY COALESCE(bl.production_date, bl.created_at) ASC LIMIT 300
      `);
      const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const fifoWarnings   = rows.filter(lot => Number(lot.age_days) > 30 && Number(lot.available_quantity) > 0);
      const expiryWarnings = rows.filter(lot => lot.days_until_expiry !== null && Number(lot.days_until_expiry) <= 30 && Number(lot.days_until_expiry) >= 0);
      return { data: rows, total: rows.length, fifoWarnings: fifoWarnings.length, expiryWarnings: expiryWarnings.length };
    } catch (e) {
      this.logger.warn(`getWarehouseLots failed: ${(e as Error).message}`);
      return { data: [], total: 0, fifoWarnings: 0, expiryWarnings: 0 };
    }
  }

  @ApiOperation({ summary: 'Create lot' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('warehouses/:id/lots')
  @Roles(...WH_WRITE)
  async createLot(
    @Param('id') id: string,
    @Body() rawBody: unknown,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    const body = CreateLotSchema.parse(rawBody);
    try {
      const batchNum = body.batch_number ?? body.lot_number ?? `LOT-${Date.now()}`;
      const r = await rawSql(sql`
        INSERT INTO batch_lots
          (batch_number, lot_number, material_id, warehouse_id, quantity, remaining_quantity,
           unit, quality_status, supplier_batch_number, cost_per_unit,
           defect_reason, quarantine_reason, serial_number, received_date, notes, is_active)
        VALUES
          (${batchNum}, ${body.lot_number ?? batchNum}, ${body.material_id ?? null},
           ${parseInt(id, 10)}, ${Number(body.quantity ?? 0)}, ${Number(body.quantity ?? 0)},
           ${body.unit ?? 'dona'}, ${body.quality_status ?? 'pending'},
           ${body.supplier_batch_number ?? null}, ${Number(body.cost_per_unit ?? 0)},
           ${body.defect_reason ?? null}, ${body.quarantine_reason ?? null},
           ${body.serial_number ?? null}, NOW(), ${body.notes ?? null}, true)
        RETURNING id, batch_number, lot_number, quantity, quality_status, created_at
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { ok: true };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @ApiOperation({ summary: 'Update lot status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('warehouses/:id/lots/:lotId')
  @Roles(...WH_WRITE)
  async updateLotStatus(
    @Param('id') id: string,
    @Param('lotId') lotId: string,
    @Body() rawBody: unknown,
  ) {
    const body = UpdateLotSchema.parse(rawBody);
    try {
      const r = await rawSql(sql`
        UPDATE batch_lots SET
          quality_status    = COALESCE(${body.quality_status    ?? null}, quality_status),
          defect_reason     = COALESCE(${body.defect_reason     ?? null}, defect_reason),
          quarantine_reason = COALESCE(${body.quarantine_reason ?? null}, quarantine_reason),
          bin_location_id   = COALESCE(${body.bin_location_id ? parseInt(String(body.bin_location_id), 10) : null}::int, bin_location_id),
          notes             = COALESCE(${body.notes    ?? null}, notes),
          is_active         = COALESCE(${body.is_active ?? null}::boolean, is_active)
        WHERE id = ${parseInt(lotId, 10)} AND warehouse_id = ${parseInt(id, 10)}
        RETURNING id, batch_number, lot_number, quality_status
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { ok: true };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }
}
