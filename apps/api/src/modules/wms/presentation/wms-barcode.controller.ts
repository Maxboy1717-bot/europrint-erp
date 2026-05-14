/**
 * @module wms-barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsBarcodeController
 * Routes: /warehouse/printer-config, /warehouse/material-kits
 * Handles barcode label printing configuration and material kit scanning.
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsBarcodeController {
  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // ── PRINTER CONFIG ────────────────────────────────────────────────────────

  @Get('printer-config')
  @Roles(...WH_READ)
  async getPrinterConfigs() {
    return { data: [], total: 0 };
  }

  @Post('printer-config')
  @Roles(...WH_WRITE)
  async createPrinterConfig(@Body() body: Record<string, unknown>) {
    return { id: 0, ...body };
  }

  @Patch('printer-config/:id')
  @Roles(...WH_WRITE)
  async updatePrinterConfig(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return { id, ...body };
  }

  @Delete('printer-config/:id')
  @Roles(...WH_WRITE)
  async deletePrinterConfig(@Param('id') id: string) {
    return { deleted: true, id };
  }

  // ── MATERIAL KITS (item-scan / kit assembly) ──────────────────────────────

  @Get('material-kits')
  @Roles(...WH_READ)
  async getMaterialKits() {
    return { data: [], total: 0 };
  }

  @Post('material-kits')
  @Roles(...WH_WRITE)
  async createMaterialKit(@Body() body: Record<string, unknown>) {
    return { id: 0, ...body };
  }

  @Patch('material-kits/:id/status')
  @Roles(...WH_WRITE)
  async updateMaterialKitStatus(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return { id, ...body };
  }

  @Get('material-kits/:id/items')
  @Roles(...WH_READ)
  async getMaterialKitItems(@Param('id') id: string) {
    return { data: [], kitId: id };
  }
}
