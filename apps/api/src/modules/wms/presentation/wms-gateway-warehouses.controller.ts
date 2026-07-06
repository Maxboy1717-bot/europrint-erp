/**
 * @module wms-gateway-warehouses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Zones / Bins / Lots sub-routes are handled by:
 *   - WmsGatewayWarehouseLotsController (./wms-gateway-warehouse-lots.controller.ts)
 * Both are registered in `wms.module.ts`.
 */

import {
  Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query,
  UseGuards, BadRequestException, NotFoundException, ConflictException,
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
import { safeInt } from '../../hr/common/db-rows';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';

const CreateWarehouseSchema = z.object({
  name: z.string().max(200).optional(),
  code: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  warehouse_type: z.string().max(50).optional(),
  name_ru: z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
}).passthrough();

const UpdateWarehouseSchema = z.object({
  name: z.string().max(200).optional(),
  name_ru: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  location: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsGatewayWarehousesController
 * Routes: /warehouse/warehouses, /warehouse/warehouses/:id (CRUD), stock, stats.
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Gateway Warehouses')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsGatewayWarehousesController {
  private readonly logger = new Logger(WmsGatewayWarehousesController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  @ApiOperation({ summary: 'Get warehouses total stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('warehouses/stats/total')
  @Roles(...WH_READ)
  async getWarehousesTotalStats() {
    try {
      const r = await rawSql(sql`
        SELECT
          COUNT(DISTINCT w.id)::int AS warehouse_count,
          COUNT(DISTINCT ws.material_id)::int AS material_count,
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

  @ApiOperation({ summary: 'Get warehouses' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Create warehouse' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('warehouses')
  @Roles(...WH_WRITE)
  async createWarehouse(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = CreateWarehouseSchema.parse(body);
    try {
      const name = String(dto.name ?? 'Nomsiz ombor');
      const code = dto.code
        ? String(dto.code)
        : name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10) + '_' + Date.now().toString().slice(-4);
      const warehouseType = String(dto.type ?? dto.warehouse_type ?? 'main');
      const nameRu   = dto.name_ru ? String(dto.name_ru) : null;
      const location = (dto.location ?? dto.address) ? String(dto.location ?? dto.address) : null;

      // Ombor tozalash (WMS-POS-FULL-AUDIT-2026-07-05, item 2): same duplicate-name
      // guard as WmsWarehousesController.create() -- code has a DB UNIQUE constraint,
      // name does not.
      const dup = await rawSql(sql`
        SELECT id FROM warehouses WHERE is_active = true AND lower(trim(name)) = lower(trim(${name})) LIMIT 1
      `);
      if ((dup as { rows?: Record<string, unknown>[] }).rows?.length) {
        throw new ConflictException(`Bu nomli ombor allaqachon mavjud: "${name}"`);
      }

      const r = await rawSql(sql`
        INSERT INTO warehouses (code, name, name_ru, type, location, is_active, manager_id)
        VALUES (${code}, ${name}, ${nameRu}, ${warehouseType}, ${location}, true, ${user?.id ?? null})
        RETURNING id, code, name, name_ru, type, location, is_active, manager_id, created_at
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
    } catch (e) {
      if (e instanceof ConflictException) throw e;
      throw new BadRequestException(`Ombor yaratishda xatolik: ${String(e).substring(0, 200)}`);
    }
  }

  @ApiOperation({ summary: 'Get warehouse stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
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
            ws.id::text AS id, ws.material_id AS "materialId",
            mc.kod AS "materialCode", mc.xom_ashyo AS "materialName",
            mc.unit_of_measure AS unit, ws.quantity::numeric AS quantity,
            COALESCE(ws.reserved_quantity, 0)::numeric AS reserved,
            (COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0))::numeric AS available,
            mc.min_stock AS "minStock", mc.max_stock AS "maxStock",
            mc.unit_price AS "unitPrice", COALESCE(mc.currency, 'UZS') AS currency
          FROM warehouse_stock ws
          LEFT JOIN material_cards mc ON mc.id = ws.material_id
          WHERE ws.warehouse_id = ${wid}
          ORDER BY mc.xom_ashyo ASC LIMIT 500
        `);
        const items = Array.isArray(rows) ? rows : [];
        return { totalItems: items.length, items };
      } catch (e) {
        this.logger.warn(`getWarehouseStock failed: ${(e as Error).message}`);
        return { totalItems: 0, items: [] };
      }
    }
  }

  @ApiOperation({ summary: 'Get warehouse stats (warehouse-360: stock + value + occupancy + zones/bins + batch/expiry + movements)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('warehouses/:id/stats')
  @Roles(...WH_READ)
  async getWarehouseStats(@Param('id') id: string) {
    const wid = safeInt(id, 0);
    try {
      // warehouse-360 rollup: each source is one round-trip (no N+1). Stock/value
      // from warehouse_stock×material_cards; occupancy from warehouse_bins
      // (current_occupancy/max_volume = the real capacity source — warehouses.capacity
      // is unpopulated); zone count from warehouse_zones; batch/expiry from batch_lots;
      // movements (kirim/chiqim) from warehouse_transactions. Q-40: every number is a
      // live SELECT — empty source tables stay honestly zero, no hardcoded/echo values.
      const [wRows, sRows, occRows, zRows, blRows, mvRows] = await Promise.all([
        rawSql(sql`SELECT id, code, name, name_ru, type, location, is_active, capacity, created_at FROM warehouses WHERE id = ${wid} AND deleted_at IS NULL`),
        rawSql(sql`
          SELECT COUNT(DISTINCT ws.material_id)::int AS material_count,
                 COALESCE(SUM(ws.quantity),0)::numeric AS total_quantity,
                 COALESCE(SUM(ws.reserved_quantity),0)::numeric AS reserved_qty,
                 COALESCE(SUM(ws.available_quantity),0)::numeric AS available_qty,
                 COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS stock_value,
                 SUM(CASE WHEN mc.min_stock > 0 AND ws.quantity < mc.min_stock THEN 1 ELSE 0 END)::int AS low_stock_count
          FROM warehouse_stock ws
          LEFT JOIN material_cards mc ON mc.id = ws.material_id
          WHERE ws.warehouse_id = ${wid}
        `),
        rawSql(sql`
          SELECT COUNT(*)::int AS bin_count,
                 COUNT(*) FILTER (WHERE is_active = true)::int AS active_bin_count,
                 COALESCE(SUM(current_occupancy),0)::numeric AS used_volume,
                 COALESCE(SUM(max_volume),0)::numeric AS capacity_volume
          FROM warehouse_bins
          WHERE warehouse_id = ${wid} AND deleted_at IS NULL
        `),
        rawSql(sql`SELECT COUNT(*)::int AS zone_count FROM warehouse_zones WHERE warehouse_id = ${wid} AND deleted_at IS NULL`),
        rawSql(sql`
          SELECT COUNT(*)::int AS lot_count,
                 COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days')::int AS expiring_soon_count,
                 COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date < NOW())::int AS expired_count
          FROM batch_lots WHERE warehouse_id = ${wid} AND is_active = true
        `),
        rawSql(sql`
          SELECT COUNT(*)::int AS movement_count,
                 COALESCE(SUM(CASE WHEN transaction_type IN ('receipt','goods_receipt','in','inbound','kirim') THEN quantity ELSE 0 END),0)::numeric AS total_in,
                 COALESCE(SUM(CASE WHEN transaction_type IN ('issue','goods_issue','out','outbound','chiqim') THEN quantity ELSE 0 END),0)::numeric AS total_out,
                 MAX(created_at)::text AS last_movement_at
          FROM warehouse_transactions WHERE warehouse_id = ${wid}
        `),
      ]);
      const w  = (wRows  as { rows?: Record<string, unknown>[] }).rows?.[0];
      const s  = (sRows  as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const oc = (occRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const z  = (zRows  as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const bl = (blRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const mv = (mvRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const usedVolume     = Number(oc.used_volume     ?? 0);
      const capacityVolume = Number(oc.capacity_volume ?? 0);
      const totalIn  = Number(mv.total_in  ?? 0);
      const totalOut = Number(mv.total_out ?? 0);
      return {
        ...(w ?? { id: String(wid) }),
        materialCount:     Number(s.material_count    ?? 0),
        totalQuantity:     Number(s.total_quantity     ?? 0),
        reservedQuantity:  Number(s.reserved_qty       ?? 0),
        availableQuantity: Number(s.available_qty      ?? 0),
        stockValue:        Number(s.stock_value        ?? 0),
        lowStockCount:     Number(s.low_stock_count    ?? 0),
        // Occupancy (Zona-Qator-Javon locator volume). occupancyPct = used/capacity
        // when a capacity is defined; null when no bins/capacity yet (honest-empty).
        occupancy: {
          zoneCount:      Number(z.zone_count        ?? 0),
          binCount:       Number(oc.bin_count        ?? 0),
          activeBinCount: Number(oc.active_bin_count ?? 0),
          usedVolume,
          capacityVolume,
          occupancyPct: capacityVolume > 0 ? Math.round((usedVolume / capacityVolume) * 1000) / 10 : null,
        },
        // Batch / expiry (FEFO-relevant) summary.
        batch: {
          lotCount:          Number(bl.lot_count           ?? 0),
          expiringSoonCount: Number(bl.expiring_soon_count ?? 0),
          expiredCount:      Number(bl.expired_count       ?? 0),
        },
        // Movements (kirim/chiqim). warehouse_transactions is currently empty in this
        // environment → totals are honestly 0; populated once movements are logged.
        movements: {
          movementCount:  Number(mv.movement_count ?? 0),
          totalIn,
          totalOut,
          netChange:      totalIn - totalOut,
          lastMovementAt: mv.last_movement_at ? String(mv.last_movement_at) : null,
        },
      };
    } catch (e) {
      this.logger.warn(`getWarehouseStats failed: ${(e as Error).message}`);
      return { id: String(wid), materialCount: 0, totalQuantity: 0 };
    }
  }

  @ApiOperation({ summary: 'Get warehouse by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
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

  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('warehouses/:id')
  @Roles(...WH_WRITE)
  async updateWarehouse(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateWarehouseSchema.parse(body);
    try {
      const r = await rawSql(sql`
        UPDATE warehouses SET
          name      = COALESCE(${parsed.name     ? String(parsed.name)     : null}, name),
          name_ru   = COALESCE(${parsed.name_ru  ? String(parsed.name_ru)  : null}, name_ru),
          type      = COALESCE(${parsed.type     ? String(parsed.type)     : null}, type),
          location  = COALESCE(${parsed.location ? String(parsed.location) : null}, location),
          is_active = COALESCE(${parsed.is_active != null ? Boolean(parsed.is_active) : null}::boolean, is_active)
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, code, name, type, is_active AS "isActive"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('warehouses/:id')
  @Roles(...WH_WRITE)
  async deleteWarehouse(@Param('id') id: string) {
    try {
      await rawSql(sql`UPDATE warehouses SET deleted_at = NOW(), is_active = false WHERE id = ${parseInt(id, 10)}`);
      return { deleted: true, id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }
}
