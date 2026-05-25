/**
 * @module wms-barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { notImplemented } from '@common/exceptions/not-implemented';

// P3-26: barcode/material-kit persistence is not yet wired. Return 501 instead of
const PrinterConfigSchema = z.object({
  name: z.string().max(200).optional(),
  ipAddress: z.string().max(50).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  paperSize: z.string().max(50).optional(),
  active: z.boolean().optional(),
}).passthrough();

const MaterialKitSchema = z.object({
  name: z.string().max(200).optional(),
  items: z.array(z.record(z.unknown())).optional(),
  warehouseId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const MaterialKitStatusSchema = z.object({
  status: z.string().max(50),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsBarcodeController
 * Routes: /warehouse/printer-config, /warehouse/material-kits
 * Handles barcode label printing configuration and material kit scanning.
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Barcode')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsBarcodeController {
  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // -- PRINTER CONFIG --------------------------------------------------------

  @ApiOperation({ summary: 'Get printer configs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('printer-config')
  @Roles(...WH_READ)
  async getPrinterConfigs() {
    return notImplemented('GET /warehouse/printer-config');
  }

  @ApiOperation({ summary: 'Create printer config' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('printer-config')
  @Roles(...WH_WRITE)
  async createPrinterConfig(@Body() body: unknown) {
    PrinterConfigSchema.parse(body);
    return notImplemented('POST /warehouse/printer-config');
  }

  @ApiOperation({ summary: 'Update printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('printer-config/:id')
  @Roles(...WH_WRITE)
  async updatePrinterConfig(
    @Param('id') _id: string,
    @Body() body: unknown,
  ) {
    PrinterConfigSchema.partial().parse(body);
    return notImplemented('PATCH /warehouse/printer-config/:id');
  }

  @ApiOperation({ summary: 'Delete printer config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Delete('printer-config/:id')
  @Roles(...WH_WRITE)
  async deletePrinterConfig(@Param('id') _id: string) {
    return notImplemented('DELETE /warehouse/printer-config/:id');
  }

  // -- MATERIAL KITS (item-scan / kit assembly) ------------------------------

  @ApiOperation({ summary: 'Get material kits' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('material-kits')
  @Roles(...WH_READ)
  async getMaterialKits() {
    return notImplemented('GET /warehouse/material-kits');
  }

  @ApiOperation({ summary: 'Create material kit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('material-kits')
  @Roles(...WH_WRITE)
  async createMaterialKit(@Body() body: unknown) {
    MaterialKitSchema.parse(body);
    return notImplemented('POST /warehouse/material-kits');
  }

  @ApiOperation({ summary: 'Update material kit status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('material-kits/:id/status')
  @Roles(...WH_WRITE)
  async updateMaterialKitStatus(
    @Param('id') _id: string,
    @Body() body: unknown,
  ) {
    MaterialKitStatusSchema.parse(body);
    return notImplemented('PATCH /warehouse/material-kits/:id/status');
  }

  @ApiOperation({ summary: 'Get material kit items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('material-kits/:id/items')
  @Roles(...WH_READ)
  async getMaterialKitItems(@Param('id') _id: string) {
    return notImplemented('GET /warehouse/material-kits/:id/items');
  }
}
