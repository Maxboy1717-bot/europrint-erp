/**
 * @module wms-gateway-warehouses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query,
  UseGuards, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeInt } from '../../hr/common/db-rows';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsGatewayWarehousesController
 * Routes: /warehouse/warehouses/*, /warehouse/warehouses/:id/*
 * Warehouses CRUD, stock, stats, zones, bins, lots.
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsGatewayWarehousesController {
  private readonly logger = new Logger(WmsGatewayWarehousesController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  @Get('warehouses/stats/total')
  @Roles(...WH_READ)
  async getWarehousesTotalStats() {
    try {
      const r = await rawSql(sql`
        SELECT
          COUNT(DISTINCT w.id)::int AS warehouse_count,
          COUNT(DISTINCT ws.material_card_id)::int AS material_count,
          COALESCE(SUM(ws.quantity), 0)::numeric AS total_quantity
        FROM warehouses w
        LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        WHERE w.deleted_at IS NULL AND w.is_active = true
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        warehouseCount: Number(row.warehouse_count ?? 0),
        materialCount:  Number(row.material_count  ?? 0),
        totalQuantity:  Number(row.total_quantity   ?? 0),
      };
    } catch { return { warehouseCount: 0, materialCount: 0, totalQuantity: 0 }; }
  }

  @Get('warehouses')
  @Roles(...WH_READ)
  async getWarehouses(@Query('type') type?: string) {
    try {
      const r = await rawSql(sql`
        SELECT id::text AS id, code, name, name_ru, type, location, is_active,
               manager_id, created_at,
               (SELECT COUNT(*)::int FROM warehouse_stock ws WHERE ws.warehouse_id = warehouses.id) AS stock_items
        FROM warehouses
        WHERE deleted_at IS NULL
          AND (${type ?? null}::text IS NULL OR type = ${type ?? null})
        ORDER BY name ASC LIMIT 200
      `);
      const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      return rows.map(w => ({
        id:        String(w.id ?? ''),
        code:      String(w.code ?? ''),
        name:      String(w.name ?? ''),
        nameRu:    w.name_ru ? String(w.name_ru) : null,
        type:      String(w.type ?? 'main'),
        location:  w.location ? String(w.location) : null,
        isActive:  Boolean(w.is_active),
        managerId: w.manager_id ? String(w.manager_id) : null,
        createdAt: String(w.created_at ?? ''),
        stockItems: Number(w.stock_items ?? 0),
      }));
    } catch (e) {
      this.logger.warn(`getWarehouses failed: ${(e as Error).message}`);
      throw e;
    }
  }

  @Post('warehouses')
  @Roles(...WH_WRITE)
  async createWarehouse(
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      const name = String(dto.name ?? 'Nomsiz ombor');
      const code = dto.code
        ? String(dto.code)
        : name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10) + '_' + Date.now().toString().slice(-4);
      const warehouseType = String(dto.type ?? dto.warehouse_type ?? 'main');
      const nameRu   = dto.name_ru ? String(dto.name_ru) : null;
      const location = (dto.location ?? dto.address) ? String(dto.location ?? dto.address) : null;
      const r = await rawSql(sql`
        INSERT INTO warehouses (code, name, name_ru, type, location, is_active, manager_id)
        VALUES (${code}, ${name}, ${nameRu}, ${warehouseType}, ${location}, true, ${user?.id ?? null})
        RETURNING id, code, name, name_ru, type, location, is_active, manager_id, created_at
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
    } catch (e) {
      throw new BadRequestException(`Ombor yaratishda xatolik: ${String(e).substring(0, 200)}`);
    }
  }

  @Get('warehouses/:id/stock')
  @Roles(...WH_READ, 'pos_operator', 'employee', 'manager', 'admin')
  async getWarehouseStock(@Param('id') id: string) {
    const wid = safeInt(id, 0);
    if (!wid) return { totalItems: 0, items: [] };
    try {
      const fromView = await rawSql(sql`
        SELECT
          stock_id AS id, material_card_id AS "materialId",
          material_code AS "materialCode", material_name AS "materialName",
          unit_of_measure AS unit, quantity, reserved_quantity AS reserved,
          available_quantity AS available, min_stock AS "minStock", max_stock AS "maxStock",
          unit_price AS "unitPrice", currency, stock_status AS "stockStatus"
        FROM pos_warehouse_stock_view
        WHERE warehouse_id = ${wid}
        ORDER BY material_name ASC LIMIT 500
      `);
      const items = Array.isArray(fromView) ? fromView : [];
      return { totalItems: items.length, items };
    } catch {
      try {
        const rows = await rawSql(sql`
          SELECT
            ws.id::text AS id, ws.material_card_id AS "materialId",
            mc.code AS "materialCode", mc.name AS "materialName",
            mc.unit_of_measure AS unit, ws.quantity::numeric AS quantity,
            COALESCE(ws.reserved_quantity, 0)::numeric AS reserved,
            (COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0))::numeric AS available,
            mc.min_stock AS "minStock", mc.max_stock AS "maxStock",
            mc.unit_price AS "unitPrice", COALESCE(mc.currency, 'UZS') AS currency
          FROM warehouse_stock ws
          LEFT JOIN material_cards mc ON mc.id = ws.material_card_id
          WHERE ws.warehouse_id = ${wid}
          ORDER BY mc.name ASC LIMIT 500
        `);
        const items = Array.isArray(rows) ? rows : [];
        return { totalItems: items.length, items };
      } catch (e) {
        this.logger.warn(`getWarehouseStock failed: ${(e as Error).message}`);
        return { totalItems: 0, items: [] };
      }
    }
  }

  @Get('warehouses/:id/stats')
  @Roles(...WH_READ)
  async getWarehouseStats(@Param('id') id: string) {
    try {
      const [wRows, sRows] = await Promise.all([
        rawSql(sql`SELECT id, code, name, name_ru, type, location, is_active, created_at FROM warehouses WHERE id = ${id} AND deleted_at IS NULL`),
        rawSql(sql`
          SELECT COUNT(DISTINCT ws.material_card_id)::int AS material_count,
                 COALESCE(SUM(ws.quantity),0)::numeric AS total_quantity,
                 COALESCE(SUM(ws.reserved_quantity),0)::numeric AS reserved_qty,
                 COALESCE(SUM(ws.available_quantity),0)::numeric AS available_qty,
                 COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS stock_value,
                 SUM(CASE WHEN mc.min_stock > 0 AND ws.quantity < mc.min_stock THEN 1 ELSE 0 END)::int AS low_stock_count
          FROM warehouse_stock ws
          LEFT JOIN material_cards mc ON mc.id = ws.material_card_id
          WHERE ws.warehouse_id = ${id}
        `),
      ]);
      const w = (wRows as { rows?: Record<string, unknown>[] }).rows?.[0];
      const s = (sRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        ...(w ?? { id }),
        materialCount:     Number(s.material_count    ?? 0),
        totalQuantity:     Number(s.total_quantity     ?? 0),
        reservedQuantity:  Number(s.reserved_qty       ?? 0),
        availableQuantity: Number(s.available_qty      ?? 0),
        stockValue:        Number(s.stock_value        ?? 0),
        lowStockCount:     Number(s.low_stock_count    ?? 0),
      };
    } catch { return { id, materialCount: 0, totalQuantity: 0 }; }
  }

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

  @Post('warehouses/:id/lots')
  @Roles(...WH_WRITE)
  async createLot(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
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

  @Patch('warehouses/:id/lots/:lotId')
  @Roles(...WH_WRITE)
  async updateLotStatus(
    @Param('id') id: string,
    @Param('lotId') lotId: string,
    @Body() body: Record<string, unknown>,
  ) {
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

  @Get('warehouses/:id')
  @Roles(...WH_READ)
  async getWarehouseById(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`SELECT id, code, name, name_ru, type, location, is_active, manager_id, created_at FROM warehouses WHERE id = ${id} AND deleted_at IS NULL`);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
      if (!row) throw new NotFoundException(`Ombor #${id} topilmadi`);
      return row;
    } catch (e) { if (e instanceof NotFoundException) throw e; return { id }; }
  }

  @Patch('warehouses/:id')
  @Roles(...WH_WRITE)
  async updateWarehouse(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      const r = await rawSql(sql`
        UPDATE warehouses SET
          name      = COALESCE(${body.name     ? String(body.name)     : null}, name),
          name_ru   = COALESCE(${body.name_ru  ? String(body.name_ru)  : null}, name_ru),
          type      = COALESCE(${body.type     ? String(body.type)     : null}, type),
          location  = COALESCE(${body.location ? String(body.location) : null}, location),
          is_active = COALESCE(${body.is_active != null ? Boolean(body.is_active) : null}::boolean, is_active)
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, code, name, type, is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @Delete('warehouses/:id')
  @Roles(...WH_WRITE)
  async deleteWarehouse(@Param('id') id: string) {
    try {
      await rawSql(sql`UPDATE warehouses SET deleted_at = NOW(), is_active = false WHERE id = ${parseInt(id, 10)}`);
      return { deleted: true, id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }
}
