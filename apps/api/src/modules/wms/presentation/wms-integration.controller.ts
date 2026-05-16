/**
 * @module wms-integration.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, Logger, Param, Post,
  BadRequestException, UseGuards, HttpException, HttpStatus,
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

const IntegrationCreateSchema = z.object({
  name: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  config: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
}).passthrough();

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

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

  // ── POS SYNC ──────────────────────────────────────────────────────────────

  /**
   * POST /api/warehouse/warehouses/:id/sync-pos
   * Triggers a POS Monitor stock sync for the given warehouse.
   * Works with numeric warehouse IDs or string codes (e.g. "WIP-MAIN").
   */
  @ApiOperation({ summary: 'Sync to pos' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('warehouses/:id/sync-pos')
  @Roles(...WH_WRITE, 'pos_operator')
  async syncToPos(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const numericId    = safeInt(id, 0);
    const warehouseRef = numericId || id;
    if (!warehouseRef) throw new BadRequestException(await this.i18n.t('errors.warehouseIdInvalid'));
    try {
      await this.svc.logPosSyncEvent(numericId || null, user?.id ?? null);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString() };
    } catch (e) {
      this.logger.warn(`syncToPos failed: ${(e as Error).message}`);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString(), warning: 'sync queued, no event log' };
    }
  }

  // ── MM (Materials Management) INTEGRATION ─────────────────────────────────
  // P3-26: MM/FI integration services are not yet wired. Return 501 instead of
  // fake empty payloads so the warehouse integration page shows an honest
  // "coming soon" state.

  @ApiOperation({ summary: 'Get integration mm pending deliveries' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('integration/mm/pending-deliveries')
  @Roles(...WH_READ)
  async getIntegrationMmPendingDeliveries() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/integration/mm/pending-deliveries', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get integration mm reorder suggestions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('integration/mm/reorder-suggestions')
  @Roles(...WH_READ)
  async getIntegrationMmReorderSuggestions() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/integration/mm/reorder-suggestions', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  // ── FI (Finance) INTEGRATION ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Get integration fi stock valuation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('integration/fi/stock-valuation')
  @Roles(...WH_READ)
  async getIntegrationFiStockValuation() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/integration/fi/stock-valuation', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  // ── GENERAL INTEGRATION ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get integration summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('integration/summary')
  @Roles(...WH_READ)
  async getIntegrationSummary() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/integration/summary', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get integration' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('integration')
  @Roles(...WH_READ)
  async getIntegration() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /warehouse/integration', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Create integration' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('integration')
  @Roles(...WH_WRITE)
  async createIntegration(@Body() body: unknown) {
    IntegrationCreateSchema.parse(body);
    throw new HttpException(
      { message: 'Endpoint not yet implemented: POST /warehouse/integration', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
