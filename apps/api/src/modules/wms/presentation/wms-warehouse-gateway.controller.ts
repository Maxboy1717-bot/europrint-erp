/**
 * @module wms-warehouse-gateway.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertInternal } from '@common/assertions';
import {
  Body, BadRequestException, Controller, Get, Param, Post, Patch,
  UseGuards, UseInterceptors, Logger, Query, UsePipes,
} from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';

const TransferStatusUpdateSchema = z.object({
  status: z.string().max(50),
  notes: z.string().max(2000).optional(),
}).passthrough();

const GoodsReceiptLineSchema = z.object({
  materialId: z.union([z.string(), z.number()]).optional(),
  material_id: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  unitCost: z.union([z.string(), z.number()]).optional(),
  unit_cost: z.union([z.string(), z.number()]).optional(),
}).passthrough();
import {
  WmsCreateTransferSchema, WmsCreateTransferDto,
  WmsCreateInternalRequestSchema, WmsCreateInternalRequestDto,
  WmsCreateGoodsReceiptSchema, WmsCreateGoodsReceiptDto,
  WmsQcLineSchema, WmsQcLineDto,
} from '../dto/wms.dto';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Warehouse Gateway')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsWarehouseGatewayController {
  private readonly logger = new Logger(WmsWarehouseGatewayController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // ── TRANSFERS ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create transfer' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get transfer by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('transfers/:id')
  @Roles(...WH_READ)
  async getTransferById(@Param('id') id: string) {
    return { id, status: 'pending' };
  }

  @ApiOperation({ summary: 'Update transfer status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('transfers/:id/status')
  @Roles(...WH_WRITE)
  async updateTransferStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = TransferStatusUpdateSchema.parse(body);
    try {
      const intId = parseInt(id, 10);
      const r = await rawSql(sql`
        UPDATE warehouse_transfers SET status = ${dto.status}
        WHERE id = ${intId}
        RETURNING id::text AS id, status, from_warehouse_id, to_warehouse_id, quantity
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? { id, ...dto };
    } catch (e) { throw new BadRequestException((e as Error).message); }
  }

  // ── INTERNAL REQUESTS ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create internal request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get goods receipt stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('goods-receipts/stats')
  @Roles(...WH_READ)
  async getGoodsReceiptStats() {
    return await this.svc.getGoodsReceiptStats();
  }

  @ApiOperation({ summary: 'Get goods receipts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('goods-receipts')
  @Roles(...WH_READ)
  async getGoodsReceipts(@Query('status') status?: string) {
    const r = await this.svc.getGoodsReceipts(status);
    const items = Array.isArray(r) ? r : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create goods receipt' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get goods receipt lines' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('goods-receipts/:id/lines')
  @Roles(...WH_READ)
  async getGoodsReceiptLines(@Param('id') id: string) {
    return await this.svc.getGoodsReceiptLines(safeInt(id, 0));
  }

  @ApiOperation({ summary: 'Qc line' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Patch qc line' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Add goods receipt line' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('goods-receipts/:id/lines')
  @Roles(...WH_WRITE)
  async addGoodsReceiptLine(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = GoodsReceiptLineSchema.parse(body);
    return await this.svc.addGoodsReceiptLine(safeInt(id, 0), dto);
  }

  @ApiOperation({ summary: 'Complete goods receipt' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
