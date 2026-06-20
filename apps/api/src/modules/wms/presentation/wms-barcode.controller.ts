/**
 * @module wms-barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const PrinterConfigSchema = z.object({
  name: z.string().max(200).optional(),
  ipAddress: z.string().max(50).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  paperSize: z.string().max(50).optional(),
  active: z.boolean().optional(),
}).passthrough();

const MaterialKitSchema = z.object({
  // FE createKitMutation fields
  orderId: z.union([z.string(), z.number()]).optional(),
  scheduledDate: z.string().max(50).optional(),
  scheduledTime: z.string().max(50).optional(),
  equipmentId: z.union([z.string(), z.number()]).optional(),
  // legacy / optional
  name: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.record(z.unknown())).optional(),
  warehouseId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const MaterialKitStatusSchema = z.object({
  status: z.string().max(50),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

type Row = Record<string, unknown>;
const rows = (r: unknown): Row[] => ((r as { rows?: Row[] }).rows) ?? [];

/**
 * WmsBarcodeController
 * Routes: /warehouse/printer-config, /warehouse/material-kits
 * Wired to pos_printer_configs and material_kits tables (were notImplemented stubs).
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Barcode')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsBarcodeController {
  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // -- PRINTER CONFIG (pos_printer_configs) ------------------------------------

  @ApiOperation({ summary: 'Get printer configs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('printer-config')
  @Roles(...WH_READ)
  async getPrinterConfigs() {
    return rows(await db.execute(sql`SELECT * FROM pos_printer_configs ORDER BY is_default DESC, id DESC`));
  }

  @ApiOperation({ summary: 'Create printer config' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('printer-config')
  @Roles(...WH_WRITE)
  async createPrinterConfig(@Body() body: unknown) {
    const dto = PrinterConfigSchema.parse(body);
    const r = await db.execute(sql`
      INSERT INTO pos_printer_configs (name, ip_address, port, is_active, settings, created_at, updated_at)
      VALUES (
        ${dto.name ?? ''},
        ${dto.ipAddress ?? ''},
        ${dto.port ?? 9100},
        ${dto.active ?? true},
        ${JSON.stringify({ paperSize: dto.paperSize ?? 'A4' })}::jsonb,
        NOW(), NOW()
      ) RETURNING *
    `);
    return rows(r)[0] ?? {};
  }

  @ApiOperation({ summary: 'Update printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('printer-config/:id')
  @Roles(...WH_WRITE)
  async updatePrinterConfig(@Param('id') id: string, @Body() body: unknown) {
    const dto = PrinterConfigSchema.partial().parse(body);
    await db.execute(sql`
      UPDATE pos_printer_configs SET
        name       = COALESCE(${dto.name       ?? null}, name),
        ip_address = COALESCE(${dto.ipAddress  ?? null}, ip_address),
        port       = COALESCE(${dto.port       ?? null}, port),
        is_active  = COALESCE(${dto.active     ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${parseInt(id, 10)}
    `);
    return { id: parseInt(id, 10), updated: true };
  }

  @ApiOperation({ summary: 'Delete printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('printer-config/:id')
  @Roles(...WH_WRITE)
  async deletePrinterConfig(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM pos_printer_configs WHERE id=${parseInt(id, 10)}`);
    return { id: parseInt(id, 10), deleted: true };
  }

  // -- MATERIAL KITS (material_kits + material_kit_items) ----------------------

  @ApiOperation({ summary: 'Get material kits' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('material-kits')
  @Roles(...WH_READ)
  async getMaterialKits() {
    return rows(await db.execute(sql`SELECT * FROM material_kits WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50`));
  }

  @ApiOperation({ summary: 'Create material kit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('material-kits')
  @Roles(...WH_WRITE)
  async createMaterialKit(@Body() body: unknown) {
    const dto = MaterialKitSchema.parse(body);
    const orderId = dto.orderId !== undefined ? parseInt(String(dto.orderId), 10) : null;
    const equipmentId = dto.equipmentId !== undefined ? parseInt(String(dto.equipmentId), 10) : null;
    const scheduledDate = dto.scheduledDate ?? null;
    const scheduledTime = dto.scheduledTime ?? null;
    const notes = dto.notes ?? dto.name ?? null;
    const r = await db.execute(sql`
      INSERT INTO material_kits
        (kit_number, order_id, equipment_id, scheduled_date, scheduled_time, status, notes, created_at)
      VALUES (
        'MK-' || extract(epoch from now())::bigint,
        ${orderId},
        ${equipmentId},
        ${scheduledDate},
        ${scheduledTime},
        'pending',
        ${notes},
        NOW()
      ) RETURNING *
    `);
    return rows(r)[0] ?? {};
  }

  @ApiOperation({ summary: 'Update material kit status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('material-kits/:id/status')
  @Roles(...WH_WRITE)
  async updateMaterialKitStatus(@Param('id') id: string, @Body() body: unknown) {
    const dto = MaterialKitStatusSchema.parse(body);
    await db.execute(sql`UPDATE material_kits SET status=${dto.status} WHERE id=${parseInt(id, 10)} AND deleted_at IS NULL`);
    return { id: parseInt(id, 10), status: dto.status, updated: true };
  }

  @ApiOperation({ summary: 'Get material kit items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('material-kits/:id/items')
  @Roles(...WH_READ)
  async getMaterialKitItems(@Param('id') id: string) {
    return rows(await db.execute(sql`SELECT * FROM material_kit_items WHERE kit_id=${parseInt(id, 10)} ORDER BY id`));
  }
}
