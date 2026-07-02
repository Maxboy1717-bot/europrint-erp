/**
 * @module wms-barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Patch, Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { db, posPrinterConfig } from '@shared/db';
import { sql, eq, desc } from 'drizzle-orm';

// G9-4: kanonik jadval = pos_printer_config (POS label-print pipeline shu jadvaldan
// getActiveConfig o'qiydi; FE test tugmasi ham /v2/pos/printer-config/:id/test ga boradi).
// Avval bu controller DUBLIKAT pos_printer_configs (ko'plik) jadvaliga yozardi — FE
// yaratgan config test qilinganda singular jadvalda topilmasdi (ikki-dunyo bug).
const PrinterConfigSchema = z.object({
  name: z.string().max(200).optional(),
  printerIp: z.string().max(100).optional(),
  printerPort: z.number().int().min(1).max(65535).optional(),
  printFormat: z.string().max(10).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  // legacy maydon nomlari (eski chaqiruvchilar mosligi uchun)
  ipAddress: z.string().max(100).optional(),
  port: z.number().int().min(1).max(65535).optional(),
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
 * Wired to pos_printer_config (kanonik, G9-4) and material_kits tables.
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Barcode')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsBarcodeController {
  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // -- PRINTER CONFIG (kanonik: pos_printer_config, G9-4) ----------------------

  @ApiOperation({ summary: 'Get printer configs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('printer-config')
  @Roles(...WH_READ)
  async getPrinterConfigs() {
    const list = await db
      .select()
      .from(posPrinterConfig)
      .orderBy(desc(posPrinterConfig.isActive), desc(posPrinterConfig.id));
    const configs = Array.isArray(list) ? list : [];
    // FE (PrinterSettingsTab) shakli: { configs, active }
    return { configs, active: configs.find((c) => c.isActive) ?? null };
  }

  @ApiOperation({ summary: 'Create printer config' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('printer-config')
  @Roles(...WH_WRITE)
  async createPrinterConfig(@Body() body: unknown) {
    const dto = PrinterConfigSchema.parse(body);
    const [row] = await db
      .insert(posPrinterConfig)
      .values({
        name:        dto.name ?? 'Printer',
        printerIp:   dto.printerIp ?? dto.ipAddress ?? '',
        printerPort: dto.printerPort ?? dto.port ?? 9100,
        printFormat: dto.printFormat ?? 'ZPL',
        isActive:    dto.isActive ?? dto.active ?? true,
        notes:       dto.notes,
      })
      .returning();
    return row ?? {};
  }

  @ApiOperation({ summary: 'Update printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('printer-config/:id')
  @Roles(...WH_WRITE)
  async updatePrinterConfig(@Param('id') id: string, @Body() body: unknown) {
    const dto = PrinterConfigSchema.parse(body);
    const patch: Partial<typeof posPrinterConfig.$inferInsert> = { updatedAt: new Date() };
    if (dto.name !== undefined) patch.name = dto.name;
    const printerIp = dto.printerIp ?? dto.ipAddress;
    if (printerIp !== undefined) patch.printerIp = printerIp;
    const printerPort = dto.printerPort ?? dto.port;
    if (printerPort !== undefined) patch.printerPort = printerPort;
    if (dto.printFormat !== undefined) patch.printFormat = dto.printFormat;
    const isActive = dto.isActive ?? dto.active;
    if (isActive !== undefined) patch.isActive = isActive;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    const [row] = await db
      .update(posPrinterConfig)
      .set(patch)
      .where(eq(posPrinterConfig.id, parseInt(id, 10)))
      .returning();
    if (!row) throw new NotFoundException('Printer config topilmadi');
    return row;
  }

  @ApiOperation({ summary: 'Delete printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('printer-config/:id')
  @Roles(...WH_WRITE)
  async deletePrinterConfig(@Param('id') id: string) {
    const [row] = await db
      .delete(posPrinterConfig)
      .where(eq(posPrinterConfig.id, parseInt(id, 10)))
      .returning({ id: posPrinterConfig.id });
    if (!row) throw new NotFoundException('Printer config topilmadi');
    return { id: row.id, deleted: true };
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
