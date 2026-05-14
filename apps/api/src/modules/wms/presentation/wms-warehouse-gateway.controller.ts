/**
 * @module wms-warehouse-gateway.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertInternal } from '@common/assertions';
import {
  Body, Controller, Get, Param, Post, Patch,
  UseGuards, UseInterceptors, Logger, Query, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  WmsCreateTransferSchema, WmsCreateTransferDto,
  WmsCreateInternalRequestSchema, WmsCreateInternalRequestDto,
  WmsCreateGoodsReceiptSchema, WmsCreateGoodsReceiptDto,
  WmsQcLineSchema, WmsQcLineDto,
} from '../dto/wms.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsWarehouseGatewayController
 * Routes: /warehouse/transfers, /warehouse/internal-requests, /warehouse/goods-receipts/*
 * Core movement operations: stock transfers, internal requests, goods receipts & QC.
 *
 * Bins/Zones  → WmsGatewayBinZoneController
 * Warehouses  → WmsGatewayWarehousesController
 * Inv. Counts → WmsGatewayInventoryController
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsWarehouseGatewayController {
  private readonly logger = new Logger(WmsWarehouseGatewayController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // ── TRANSFERS ─────────────────────────────────────────────────────────────

  @Post('transfers')
  @UsePipes(new ZodValidationPipe(WmsCreateTransferSchema))
  @Roles(...WH_WRITE)
  async createTransfer(
    @Body() body: WmsCreateTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log('POST warehouse transfer');
    const row = await this.svc.createTransfer(body, user?.id ?? null);
    assertInternal(row, 'Transfer yaratishda xatolik');
    return row;
  }

  @Get('transfers/:id')
  @Roles(...WH_READ)
  async getTransferById(@Param('id') id: string) {
    return { id, status: 'pending' };
  }

  @Patch('transfers/:id/status')
  @Roles(...WH_WRITE)
  async updateTransferStatus(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return { id, ...body };
  }

  // ── INTERNAL REQUESTS ─────────────────────────────────────────────────────

  @Post('internal-requests')
  @UsePipes(new ZodValidationPipe(WmsCreateInternalRequestSchema))
  @Roles(...WH_WRITE)
  async createInternalRequest(
    @Body() body: WmsCreateInternalRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log('POST internal request');
    const row = await this.svc.createInternalRequest(body, user?.id ?? null);
    assertInternal(row, "So'rov yaratishda xatolik");
    return row;
  }

  // ── GOODS RECEIPTS ────────────────────────────────────────────────────────

  @Get('goods-receipts/stats')
  @Roles(...WH_READ)
  async getGoodsReceiptStats() {
    return await this.svc.getGoodsReceiptStats();
  }

  @Get('goods-receipts')
  @Roles(...WH_READ)
  async getGoodsReceipts(@Query('status') status?: string) {
    const r = await this.svc.getGoodsReceipts(status);
    const items = Array.isArray(r) ? r : [];
    return { items, total: items.length };
  }

  @Post('goods-receipts')
  @UsePipes(new ZodValidationPipe(WmsCreateGoodsReceiptSchema))
  @Roles(...WH_WRITE)
  async createGoodsReceipt(
    @Body() body: WmsCreateGoodsReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const row = await this.svc.createGoodsReceipt(body, user?.id ?? null);
    assertInternal(row, 'Tovar qabul qilishda xatolik');
    return row;
  }

  @Get('goods-receipts/:id/lines')
  @Roles(...WH_READ)
  async getGoodsReceiptLines(@Param('id') id: string) {
    return await this.svc.getGoodsReceiptLines(safeInt(id, 0));
  }

  @Post('goods-receipts/lines/:id/qc')
  @UsePipes(new ZodValidationPipe(WmsQcLineSchema))
  @Roles(...WH_WRITE)
  async qcLine(
    @Param('id') id: string,
    @Body() body: WmsQcLineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.svc.qcLine(safeInt(id, 0), Boolean(body.passed), body.notes ? String(body.notes) : null, user?.id ?? null);
  }

  @Patch('goods-receipts/lines/:id/qc')
  @UsePipes(new ZodValidationPipe(WmsQcLineSchema))
  @Roles(...WH_WRITE)
  async patchQcLine(
    @Param('id') id: string,
    @Body() body: WmsQcLineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.svc.qcLine(safeInt(id, 0), Boolean(body.passed), body.notes ? String(body.notes) : null, user?.id ?? null);
  }

  @Post('goods-receipts/:id/lines')
  @Roles(...WH_WRITE)
  async addGoodsReceiptLine(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return { id: Date.now(), receiptId: safeInt(id, 0), ...body, created: true };
  }

  @Post('goods-receipts/:id/complete')
  @UseInterceptors(AuditInterceptor)
  @Roles(...WH_WRITE)
  async completeGoodsReceipt(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.svc.completeGoodsReceipt(safeInt(id, 0), user?.id ?? null);
  }
}
