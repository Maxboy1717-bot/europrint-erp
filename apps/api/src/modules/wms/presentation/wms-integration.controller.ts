/**
 * @module wms-integration.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, Logger, Param, Post,
  BadRequestException, NotFoundException, InternalServerErrorException,
  UseGuards, HttpException, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { AuthenticatedUser } from '@common/types/user.types';
import { safeInt } from '../../hr/common/db-rows';
import { notImplemented } from '@common/exceptions/not-implemented';

const IntegrationCreateSchema = z.object({
  name: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  config: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director'];

// FEATURE_FLAGGED: warehouse MM/FI integration not yet wired (tracking #FX-3).
/**
 * WmsIntegrationController
 * Routes: /warehouse/integration/*, /warehouse/warehouses/:id/sync-pos
 * Handles external system sync, MM/FI integration, and POS Monitor webhooks.
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Integration')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsIntegrationController {
  private readonly logger = new Logger(WmsIntegrationController.name);

  constructor(
    private readonly svc: WmsWarehouseGatewayService,
    private readonly i18n: I18nService,
  ) {}

  // -- POS SYNC --------------------------------------------------------------

  /**
   * POST /api/warehouse/warehouses/:id/sync-pos
   * Works with numeric warehouse IDs or string codes (e.g. "WIP-MAIN").
   *
   * HONEST SCOPE (Q20 fix, 2026-07-04): POS Monitor does NOT hold a separate
   * copy of stock — `pos_warehouse_stock_view` is a live SQL VIEW directly over
   * `warehouse_stock`/`warehouses` (verified in DB), so there is nothing to
   * push/replicate. This endpoint's only real effect is recording an audit
   * event (`pos_sync_events`) that a sync was triggered for a given warehouse.
   * It is NOT a fabricated "real sync" against a table that doesn't exist —
   * it validates the warehouse is real and reports genuine failures instead
   * of swallowing them behind `ok:true`.
   */
  @ApiOperation({ summary: 'Log a POS Monitor sync-triggered event for a warehouse (audit-only; stock is always live via pos_warehouse_stock_view)' })
  @ApiResponse({ status: 201, description: 'Sync event logged' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  @ApiResponse({ status: 500, description: 'Event log write failed' })
  @Post('warehouses/:id/sync-pos')
  @Roles(...WH_WRITE, 'pos_operator')
  async syncToPos(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const numericId    = safeInt(id, 0);
    const warehouseRef = numericId || id;
    if (!warehouseRef) throw new BadRequestException(await this.i18n.t('errors.warehouseIdInvalid'));

    const exists = await this.svc.warehouseExists(numericId || null, warehouseRef);
    if (!exists) throw new NotFoundException(await this.i18n.t('errors.warehouseNotFound'));

    try {
      await this.svc.logPosSyncEvent(numericId || null, user?.id ?? null);
    } catch (e) {
      this.logger.error(`syncToPos failed for warehouse=${warehouseRef}: ${(e as Error).message}`);
      throw new InternalServerErrorException(await this.i18n.t('errors.warehouseSyncFailed'));
    }
    return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString() };
  }

  // -- MM/FI INTEGRATION -----------------------------------------------------
  @ApiOperation({ summary: 'Get integration mm pending deliveries' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Get('integration/mm/pending-deliveries') @Roles(...WH_READ)
  async getIntegrationMmPendingDeliveries() {
    return notImplemented('GET /warehouse/integration/mm/pending-deliveries');
  }

  @ApiOperation({ summary: 'Get integration mm reorder suggestions' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Get('integration/mm/reorder-suggestions') @Roles(...WH_READ)
  async getIntegrationMmReorderSuggestions() {
    return notImplemented('GET /warehouse/integration/mm/reorder-suggestions');
  }

  @ApiOperation({ summary: 'Get integration fi stock valuation' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Get('integration/fi/stock-valuation') @Roles(...WH_READ)
  async getIntegrationFiStockValuation() {
    return notImplemented('GET /warehouse/integration/fi/stock-valuation');
  }

  @ApiOperation({ summary: 'Get integration summary' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Get('integration/summary') @Roles(...WH_READ)
  async getIntegrationSummary() {
    return notImplemented('GET /warehouse/integration/summary');
  }

  @ApiOperation({ summary: 'Get integration' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Get('integration') @Roles(...WH_READ)
  async getIntegration() {
    return notImplemented('GET /warehouse/integration');
  }

  @ApiOperation({ summary: 'Create integration' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-3' })
  @Post('integration') @Roles(...WH_WRITE)
  async createIntegration(@Body() body: unknown) {
    IntegrationCreateSchema.parse(body);
    return notImplemented('POST /warehouse/integration');
  }
}
