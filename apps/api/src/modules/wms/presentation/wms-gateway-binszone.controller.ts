/**
 * @module wms-gateway-binszone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsGatewayBinZoneController
 * Routes: /warehouse/bins/*, /warehouse/zones/*
 * Storage-structure management: bins and zones CRUD.
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsGatewayBinZoneController {
  private readonly logger = new Logger(WmsGatewayBinZoneController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // ── BINS ──────────────────────────────────────────────────────────────────

  @Get('bins')
  @Roles(...WH_READ)
  async getBins(
    @Query('warehouse_id') warehouseId?: string,
    @Query('zone_id') zoneId?: string,
  ) {
    try {
      const r = await rawSql(sql`
        SELECT b.id::text AS id, b.bin_code AS "binCode", b.row, b.shelf, b.level,
               b.bin_type AS "binType", b.max_weight AS "maxWeight", b.max_volume AS "maxVolume",
               b.current_occupancy AS "currentOccupancy", b.is_active AS "isActive",
               b.zone_id AS "zoneId", b.warehouse_id AS "warehouseId",
               z.name AS "zoneName", z.zone_type AS "zoneType",
               w.name AS "warehouseName",
               CASE WHEN b.max_volume > 0 THEN ROUND((b.current_occupancy / b.max_volume * 100)::numeric,1) ELSE 0 END AS "occupancyPct"
        FROM warehouse_bins b
        LEFT JOIN warehouse_zones z ON z.id = b.zone_id
        LEFT JOIN warehouses w ON w.id = b.warehouse_id
        WHERE b.deleted_at IS NULL AND b.is_active = true
          AND (${warehouseId ?? null}::int IS NULL OR b.warehouse_id = ${warehouseId ? parseInt(warehouseId, 10) : null}::int)
          AND (${zoneId ?? null}::int IS NULL OR b.zone_id = ${zoneId ? parseInt(zoneId, 10) : null}::int)
        ORDER BY b.warehouse_id, z.code, b.bin_code LIMIT 500
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows ?? [];
    } catch (e) { this.logger.warn(`getBins failed: ${(e as Error).message}`); throw e; }
  }

  @Post('bins')
  @Roles(...WH_WRITE)
  async createBin(
    @Body() body: Record<string, unknown>,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    try {
      const r = await rawSql(sql`
        INSERT INTO warehouse_bins (zone_id, warehouse_id, bin_code, row, shelf, level, bin_type, max_weight, max_volume, current_occupancy, is_active, created_at)
        VALUES (${body.zone_id ? parseInt(String(body.zone_id), 10) : null}::int,
                ${body.warehouse_id ? parseInt(String(body.warehouse_id), 10) : null}::int,
                ${String(body.bin_code ?? body.binCode ?? `BIN-${Date.now()}`)},
                ${body.row   ? String(body.row)   : null},
                ${body.shelf ? String(body.shelf) : null},
                ${body.level ? String(body.level) : null},
                ${String(body.bin_type ?? body.binType ?? 'storage')},
                ${Number(body.max_weight ?? body.maxWeight ?? 500)},
                ${Number(body.max_volume ?? body.maxVolume ?? 2.0)},
                0, true, NOW())
        RETURNING id::text AS id, bin_code AS "binCode", zone_id AS "zoneId", warehouse_id AS "warehouseId", is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { ok: true };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @Get('bins/:id/360')
  @Roles(...WH_READ)
  async getBin360(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`
        SELECT b.id::text, b.bin_code AS "binCode", b.row, b.shelf, b.level,
               b.current_occupancy AS "currentOccupancy", b.max_volume AS "maxVolume",
               z.name AS "zoneName", z.zone_type AS "zoneType", w.name AS "warehouseName"
        FROM warehouse_bins b
        LEFT JOIN warehouse_zones z ON z.id = b.zone_id
        LEFT JOIN warehouses w ON w.id = b.warehouse_id
        WHERE b.id = ${parseInt(id, 10)}
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch { return { id }; }
  }

  @Get('bins/:id')
  @Roles(...WH_READ)
  async getBinById(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`
        SELECT b.id::text, b.bin_code AS "binCode", b.row, b.shelf, b.level, b.bin_type AS "binType",
               b.current_occupancy AS "currentOccupancy", b.max_volume AS "maxVolume", b.is_active AS "isActive",
               z.name AS "zoneName", w.name AS "warehouseName"
        FROM warehouse_bins b
        LEFT JOIN warehouse_zones z ON z.id = b.zone_id
        LEFT JOIN warehouses w ON w.id = b.warehouse_id
        WHERE b.id = ${parseInt(id, 10)}
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch { return { id }; }
  }

  @Patch('bins/:id')
  @Roles(...WH_WRITE)
  async updateBin(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      const r = await rawSql(sql`
        UPDATE warehouse_bins SET
          bin_type   = COALESCE(${body.bin_type ?? body.binType ?? null}, bin_type),
          max_weight = COALESCE(${body.max_weight != null ? Number(body.max_weight) : null}::numeric, max_weight),
          max_volume = COALESCE(${body.max_volume != null ? Number(body.max_volume) : null}::numeric, max_volume),
          is_active  = COALESCE(${body.is_active != null ? Boolean(body.is_active) : null}::boolean, is_active)
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, bin_code AS "binCode", is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @Delete('bins/:id')
  @Roles(...WH_WRITE)
  async deleteBin(@Param('id') id: string) {
    try {
      await rawSql(sql`DELETE FROM warehouse_bins WHERE id = ${parseInt(id, 10)}`);
      return { deleted: true, id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  // ── ZONES ─────────────────────────────────────────────────────────────────

  @Get('zones')
  @Roles(...WH_READ)
  async getZones(@Query('warehouse_id') warehouseId?: string) {
    try {
      const r = await rawSql(sql`
        SELECT z.id::text AS id, z.code, z.name, z.name_ru AS "nameRu",
               z.zone_type AS "zoneType", z.capacity, z.is_active AS "isActive",
               z.warehouse_id AS "warehouseId", w.name AS "warehouseName",
               COUNT(b.id)::int AS "binCount"
        FROM warehouse_zones z
        LEFT JOIN warehouses w ON w.id = z.warehouse_id
        LEFT JOIN warehouse_bins b ON b.zone_id = z.id AND b.deleted_at IS NULL
        WHERE z.deleted_at IS NULL
          AND (${warehouseId ?? null}::int IS NULL OR z.warehouse_id = ${warehouseId ? parseInt(warehouseId, 10) : null}::int)
        GROUP BY z.id, z.code, z.name, z.name_ru, z.zone_type, z.capacity, z.is_active, z.warehouse_id, w.name
        ORDER BY z.warehouse_id, z.code LIMIT 200
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows ?? [];
    } catch (e) { this.logger.warn(`getZones failed: ${(e as Error).message}`); throw e; }
  }

  @Post('zones')
  @Roles(...WH_WRITE)
  async createZone(
    @Body() body: Record<string, unknown>,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    try {
      const r = await rawSql(sql`
        INSERT INTO warehouse_zones (warehouse_id, code, name, name_ru, zone_type, capacity, is_active, created_at)
        VALUES (${body.warehouse_id ? parseInt(String(body.warehouse_id), 10) : null}::int,
                ${String(body.code ?? 'Z')},
                ${String(body.name ?? 'Zona')},
                ${body.name_ru ? String(body.name_ru) : null},
                ${String(body.zone_type ?? body.zoneType ?? 'storage')},
                ${body.capacity ? Number(body.capacity) : 500}::numeric,
                true, NOW())
        RETURNING id::text AS id, code, name, zone_type AS "zoneType", warehouse_id AS "warehouseId", is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { ok: true };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @Patch('zones/:id')
  @Roles(...WH_WRITE)
  async updateZone(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      const r = await rawSql(sql`
        UPDATE warehouse_zones SET
          name      = COALESCE(${body.name     ? String(body.name)     : null}, name),
          name_ru   = COALESCE(${body.name_ru  ? String(body.name_ru)  : null}, name_ru),
          zone_type = COALESCE(${body.zone_type ?? body.zoneType ? String(body.zone_type ?? body.zoneType) : null}, zone_type),
          capacity  = COALESCE(${body.capacity != null ? Number(body.capacity) : null}::numeric, capacity),
          is_active = COALESCE(${body.is_active != null ? Boolean(body.is_active) : null}::boolean, is_active)
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, code, name, is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @Delete('zones/:id')
  @Roles(...WH_WRITE)
  async deleteZone(@Param('id') id: string) {
    try {
      await rawSql(sql`UPDATE warehouse_zones SET deleted_at = NOW() WHERE id = ${parseInt(id, 10)}`);
      return { deleted: true, id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }
}
