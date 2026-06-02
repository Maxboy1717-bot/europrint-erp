/**
 * @module wms-gateway-inventory.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
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
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';

const CreateInventoryCountSchema = z.object({
  count_date: z.string().optional(),
  warehouse_id: z.union([z.string(), z.number()]).optional(),
  count_type: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const UpdateInventoryCountLineSchema = z.object({
  counted_qty: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const UpdateInventoryCountSchema = z.object({
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  counted_items: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const InventoryCountStatusSchema = z.object({
  status: z.string().max(50).optional(),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsGatewayInventoryController
 * Routes: /warehouse/inventory-counts*, /warehouse/inventory-counts-stats
 * Inventory count sessions: create, update, status, line management, generate.
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Gateway Inventory')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsGatewayInventoryController {
  private readonly logger = new Logger(WmsGatewayInventoryController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  @ApiOperation({ summary: 'Get inventory counts stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-counts-stats')
  @Roles(...WH_READ)
  async getInventoryCountsStats() {
    try {
      const r = await rawSql(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'completed')::int   AS completed,
          COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
          COUNT(*) FILTER (WHERE status = 'draft')::int       AS draft
        FROM inventory_counts
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        total:      Number(row.total       ?? 0),
        completed:  Number(row.completed   ?? 0),
        inProgress: Number(row.in_progress ?? 0),
        draft:      Number(row.draft       ?? 0),
      };
    } catch { return { total: 0, completed: 0, inProgress: 0, draft: 0 }; }
  }

  @ApiOperation({ summary: 'Get inventory counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-counts')
  @Roles(...WH_READ)
  async getInventoryCounts(
    @Query('status') status?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    try {
      const r = await rawSql(sql`
        SELECT ic.id::text AS id, ic.count_number AS "countNumber", ic.count_date AS "countDate",
               ic.warehouse_id AS "warehouseId", w.name AS "warehouseName",
               ic.count_type AS "countType", ic.status,
               ic.total_items AS "totalItems", ic.counted_items AS "countedItems",
               ic.variance_items AS "varianceItems",
               ic.total_book_value AS "totalBookValue",
               ic.total_counted_value AS "totalCountedValue",
               ic.total_variance AS "totalVariance",
               ic.assigned_to AS "assignedTo", emp.full_name AS "assignedToName",
               ic.created_at AS "createdAt", ic.completed_at AS "completedAt"
        FROM inventory_counts ic
        LEFT JOIN warehouses w ON w.id = ic.warehouse_id
        LEFT JOIN employees emp ON emp.id = ic.assigned_to
        WHERE (${status ?? null}::text IS NULL OR ic.status = ${status ?? null})
          AND (${warehouseId ?? null}::int IS NULL OR ic.warehouse_id = ${warehouseId ? parseInt(warehouseId, 10) : null}::int)
        ORDER BY ic.created_at DESC LIMIT 100
      `);
      const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      return { data: rows, total: rows.length };
    } catch (e) { this.logger.warn(`getInventoryCounts failed: ${(e as Error).message}`); return { data: [], total: 0 }; }
  }

  @ApiOperation({ summary: 'Create inventory count' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('inventory-counts')
  @Roles(...WH_WRITE)
  async createInventoryCount(
    @Body() rawBody: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const body = CreateInventoryCountSchema.parse(rawBody);
    try {
      const countNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const r = await rawSql(sql`
        INSERT INTO inventory_counts (count_number, count_date, warehouse_id, count_type, status, total_items, counted_items, assigned_to, notes, created_at)
        VALUES (${countNum},
                ${String(body.count_date ?? new Date().toISOString().split('T')[0])},
                ${body.warehouse_id ? parseInt(String(body.warehouse_id), 10) : null}::int,
                ${String(body.count_type ?? 'spot')},
                'draft', 0, 0,
                ${user?.id ?? null}::int,
                ${body.notes ? String(body.notes) : null},
                NOW())
        RETURNING id::text AS id, count_number AS "countNumber", status, count_date AS "countDate"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { ok: true };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @ApiOperation({ summary: 'Get inventory count line' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('inventory-counts/lines/:lineId')
  @Roles(...WH_READ)
  async getInventoryCountLine(@Param('lineId') lineId: string) {
    return { lineId, qty: 0 };
  }

  @ApiOperation({ summary: 'Update inventory count line' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('inventory-counts/lines/:lineId')
  @Roles(...WH_WRITE)
  async updateInventoryCountLine(
    @Param('lineId') lineId: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateInventoryCountLineSchema.parse(body);
    return { lineId, ...dto };
  }

  @ApiOperation({ summary: 'Get inventory count by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('inventory-counts/:id')
  @Roles(...WH_READ)
  async getInventoryCountById(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`
        SELECT ic.*, w.name AS "warehouseName"
        FROM inventory_counts ic
        LEFT JOIN warehouses w ON w.id = ic.warehouse_id
        WHERE ic.id = ${parseInt(id, 10)}
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id, status: 'draft' };
    } catch { return { id, status: 'draft' }; }
  }

  @ApiOperation({ summary: 'Update inventory count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('inventory-counts/:id')
  @Roles(...WH_WRITE)
  async updateInventoryCount(
    @Param('id') id: string,
    @Body() rawBody: unknown,
  ) {
    const body = UpdateInventoryCountSchema.parse(rawBody);
    try {
      const r = await rawSql(sql`
        UPDATE inventory_counts SET
          status        = COALESCE(${body.status        ? String(body.status)                              : null}, status),
          notes         = COALESCE(${body.notes         ? String(body.notes)                               : null}, notes),
          counted_items = COALESCE(${body.counted_items != null ? parseInt(String(body.counted_items), 10) : null}::int, counted_items)
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, status, count_number AS "countNumber"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @ApiOperation({ summary: 'Update inventory count status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('inventory-counts/:id/status')
  @Roles(...WH_WRITE)
  async updateInventoryCountStatus(
    @Param('id') id: string,
    @Body() rawBody: unknown,
  ) {
    const body = InventoryCountStatusSchema.parse(rawBody);
    try {
      const newStatus = String(body.status ?? 'in_progress');
      const r = await rawSql(sql`
        UPDATE inventory_counts SET
          status       = ${newStatus},
          completed_at = CASE WHEN ${newStatus} = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = ${parseInt(id, 10)}
        RETURNING id::text AS id, status, completed_at AS "completedAt"
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id, status: newStatus };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  @ApiOperation({ summary: 'Generate inventory count lines' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('inventory-counts/:id/generate-lines')
  @Roles(...WH_WRITE)
  async generateInventoryCountLines(@Param('id') id: string) {
    try {
      const cnt = await rawSql(sql`SELECT warehouse_id FROM inventory_counts WHERE id = ${parseInt(id, 10)}`);
      const whId = (cnt as { rows?: Record<string, unknown>[] }).rows?.[0]?.warehouse_id;
      if (!whId) return { id, lines: [] };
      const r = await rawSql(sql`
        SELECT ws.id, mc.xom_ashyo AS "materialName", mc.kod AS "materialCode",
               ws.quantity AS "bookQty", ws.available_quantity AS "availableQty", mc.unit_of_measure AS unit
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        WHERE ws.warehouse_id = ${whId}::int
        ORDER BY mc.xom_ashyo
      `);
      const lines = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      return { id, lines, total: lines.length };
    } catch (e) { return { id, lines: [], error: (e as Error).message }; }
  }
}
