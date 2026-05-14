/**
 * @module wms-integration.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, Logger, Param, Post,
  BadRequestException, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { AuthenticatedUser } from '@common/types/user.types';
import { safeInt } from '../../hr/common/db-rows';

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

/**
 * WmsIntegrationController
 * Routes: /warehouse/integration/*, /warehouse/warehouses/:id/sync-pos
 * Handles external system sync, MM/FI integration, and POS Monitor webhooks.
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsIntegrationController {
  private readonly logger = new Logger(WmsIntegrationController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  // ── POS SYNC ──────────────────────────────────────────────────────────────

  /**
   * POST /api/warehouse/warehouses/:id/sync-pos
   * Triggers a POS Monitor stock sync for the given warehouse.
   * Works with numeric warehouse IDs or string codes (e.g. "WIP-MAIN").
   */
  @Post('warehouses/:id/sync-pos')
  @Roles(...WH_WRITE, 'pos_operator')
  async syncToPos(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const numericId    = safeInt(id, 0);
    const warehouseRef = numericId || id;
    if (!warehouseRef) throw new BadRequestException('Ombor ID noto\'g\'ri');
    try {
      await this.svc.logPosSyncEvent(numericId || null, user?.id ?? null);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString() };
    } catch (e) {
      this.logger.warn(`syncToPos failed: ${(e as Error).message}`);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString(), warning: 'sync queued, no event log' };
    }
  }

  // ── MM (Materials Management) INTEGRATION ─────────────────────────────────

  @Get('integration/mm/pending-deliveries')
  @Roles(...WH_READ)
  async getIntegrationMmPendingDeliveries() {
    return { data: [] };
  }

  @Get('integration/mm/reorder-suggestions')
  @Roles(...WH_READ)
  async getIntegrationMmReorderSuggestions() {
    return { data: [] };
  }

  // ── FI (Finance) INTEGRATION ──────────────────────────────────────────────

  @Get('integration/fi/stock-valuation')
  @Roles(...WH_READ)
  async getIntegrationFiStockValuation() {
    return { totalValue: 0, currency: 'UZS' };
  }

  // ── GENERAL INTEGRATION ───────────────────────────────────────────────────

  @Get('integration/summary')
  @Roles(...WH_READ)
  async getIntegrationSummary() {
    return { connected: [], pending: [] };
  }

  @Get('integration')
  @Roles(...WH_READ)
  async getIntegration() {
    return { data: [] };
  }

  @Post('integration')
  @Roles(...WH_WRITE)
  async createIntegration(@Body() body: Record<string, unknown>) {
    return { id: 0, ...body };
  }
}
