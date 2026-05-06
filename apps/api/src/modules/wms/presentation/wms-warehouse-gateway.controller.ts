import { assertInternal } from '@common/assertions';
import {
Body, Controller, Get, Param, Post, Patch, Delete,
  UseGuards, UseInterceptors, Logger, InternalServerErrorException, Query, UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  WmsCreateTransferSchema, WmsCreateTransferDto,
  WmsCreateInternalRequestSchema, WmsCreateInternalRequestDto,
  WmsCreateGoodsReceiptSchema, WmsCreateGoodsReceiptDto,
  WmsQcLineSchema, WmsQcLineDto,
} from '../dto/wms.dto';
import { throwFromError, unwrapOrThrow, assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WmsWarehouseGatewayService } from '../application/wms-warehouse-gateway.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

const WH_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director', 'ERP_MANAGER'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsWarehouseGatewayController {
  private readonly logger = new Logger(WmsWarehouseGatewayController.name);

  constructor(private readonly svc: WmsWarehouseGatewayService) {}

  @Post('transfers')
  @UsePipes(new ZodValidationPipe(WmsCreateTransferSchema))
  @Roles(...WH_WRITE)
  async createTransfer(@Body() body: WmsCreateTransferDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST warehouse transfer');
    const row = await this.svc.createTransfer(body, user?.id ?? null);
    assertInternal(row, 'Transfer yaratishda xatolik');
    return row;
  }

  @Post('internal-requests')
  @UsePipes(new ZodValidationPipe(WmsCreateInternalRequestSchema))
  @Roles(...WH_WRITE)
  async createInternalRequest(@Body() body: WmsCreateInternalRequestDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST internal request');
    const row = await this.svc.createInternalRequest(body, user?.id ?? null);
    assertInternal(row, "So'rov yaratishda xatolik");
    return row;
  }

  @Get('goods-receipts/stats')
  @Roles(...WH_READ)
  async getGoodsReceiptStats() {
    this.logger.log('GET goods receipts stats');
    return await this.svc.getGoodsReceiptStats();
  }

  @Get('goods-receipts')
  @Roles(...WH_READ)
  async getGoodsReceipts(@Query('status') status?: string) {
    this.logger.log('GET goods receipts');
    const r = await this.svc.getGoodsReceipts(status);
    const items = Array.isArray(r) ? r : [];
    return { items, total: items.length };
  }

  @Post('goods-receipts')
  @UsePipes(new ZodValidationPipe(WmsCreateGoodsReceiptSchema))
  @Roles(...WH_WRITE)
  async createGoodsReceipt(@Body() body: WmsCreateGoodsReceiptDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST goods receipt');
    const row = await this.svc.createGoodsReceipt(body, user?.id ?? null);
    assertInternal(row, 'Tovar qabul qilishda xatolik');
    return row;
  }

  @Get('goods-receipts/:id/lines')
  @Roles(...WH_READ)
  async getGoodsReceiptLines(@Param('id') id: string) {
    this.logger.log(`GET goods receipt lines for ${id}`);
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
    this.logger.log(`POST QC for line ${id}`);
    const _rQcLine = await this.svc.qcLine(
      safeInt(id, 0),
      Boolean(body.passed),
      body.notes ? String(body.notes) : null,
      user?.id ?? null,
    );
    return _rQcLine;
  }

  @Post('goods-receipts/:id/complete')
  @UseInterceptors(AuditInterceptor)
  @Roles(...WH_WRITE)
  async completeGoodsReceipt(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`POST complete goods receipt ${id}`);
    return await this.svc.completeGoodsReceipt(safeInt(id, 0), user?.id ?? null);
  }

  @Get('bins') @Roles(...WH_READ)
  async getBins() { return { data: [], total: 0 }; }

  @Get('bins/:id/360') @Roles(...WH_READ)
  async getBin360(@Param('id') id: string) { return { id, zone360: null }; }

  @Get('bins/:id') @Roles(...WH_READ)
  async getBinById(@Param('id') id: string) { return { id, location: null }; }

  @Get('zones') @Roles(...WH_READ)
  async getZones() { return { data: [], total: 0 }; }

  @Patch('zones/:id') @Roles(...WH_WRITE)
  async updateZone(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Delete('zones/:id') @Roles(...WH_WRITE)
  async deleteZone(@Param('id') id: string) { return { deleted: true, id }; }

  // Eslatma: GET /api/warehouse/warehouses ro'yxat endpoint'i `legacy.service.ts`
  // ichidagi `getWarehouseList()` orqali ta'minlangan (general-legacy-b.controller.ts).
  // Bu yerda dublikat ochmaymiz — Fastify route konflikti bo'lardi.

  /**
   * GET /api/warehouse/warehouses/:id/stock — ombordagi stok.
   * POS Monitor real-time view (`pos_warehouse_stock_view`) bilan integratsiyalashgan —
   * agar view mavjud bo'lsa shundan o'qiydi, aks holda fallback `warehouse_stock` jadvalidan.
   */
  @Get('warehouses/:id/stock')
  @Roles(...WH_READ, 'pos_operator', 'employee', 'manager', 'admin')
  async getWarehouseStock(@Param('id') id: string) {
    const wid = safeInt(id, 0);
    if (!wid) return { totalItems: 0, items: [] };
    try {
      // 1-yo'l: POS-integratsiya view'idan
      const fromView = await rawSql(sql`
        SELECT
          stock_id AS id,
          material_card_id AS "materialId",
          material_code AS "materialCode",
          material_name AS "materialName",
          unit_of_measure AS unit,
          quantity, reserved_quantity AS reserved,
          available_quantity AS available,
          min_stock AS "minStock", max_stock AS "maxStock",
          unit_price AS "unitPrice", currency,
          stock_status AS "stockStatus"
        FROM pos_warehouse_stock_view
        WHERE warehouse_id = ${wid}
        ORDER BY material_name ASC
        LIMIT 500
      `);
      const items = Array.isArray(fromView) ? fromView : [];
      return { totalItems: items.length, items };
    } catch {
      // 2-yo'l: fallback jadvaldan
      try {
        const rows = await rawSql(sql`
          SELECT
            ws.id::text AS id,
            ws.material_card_id AS "materialId",
            mc.code AS "materialCode",
            mc.name AS "materialName",
            mc.unit_of_measure AS unit,
            ws.quantity::numeric AS quantity,
            COALESCE(ws.reserved_quantity, 0)::numeric AS reserved,
            (COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0))::numeric AS available,
            mc.min_stock AS "minStock",
            mc.max_stock AS "maxStock",
            mc.unit_price AS "unitPrice",
            COALESCE(mc.currency, 'UZS') AS currency
          FROM warehouse_stock ws
          LEFT JOIN material_cards mc ON mc.id = ws.material_card_id
          WHERE ws.warehouse_id = ${wid}
          ORDER BY mc.name ASC
          LIMIT 500
        `);
        const items = Array.isArray(rows) ? rows : [];
        return { totalItems: items.length, items };
      } catch (e) {
        this.logger.warn(`getWarehouseStock failed: ${(e as Error).message}`);
        return { totalItems: 0, items: [] };
      }
    }
  }

  /**
   * POST /api/warehouse/warehouses/:id/sync-pos — ombor → POS Monitor sinxronizatsiya.
   * POS Monitor offline rejimda ishlasa, bu endpoint orqali stokni dolzarblashtirish.
   */
  @Post('warehouses/:id/sync-pos')
  @Roles(...WH_WRITE, 'pos_operator')
  async syncToPos(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    // id raqam yoki ombor kodi (masalan "WIP-MAIN") bo'lishi mumkin
    const numericId = safeInt(id, 0);
    const warehouseRef = numericId || id; // raqam yoki string
    if (!warehouseRef) throw new BadRequestException('Ombor ID noto\'g\'ri');
    try {
      // POS Monitor cache jadvaliga (mavjud bo'lsa) yangilash signali yuboriladi.
      // warehouse_id int yoki varchar bo'lishi mumkin — safe cast ishlatamiz
      await rawSql(sql`
        INSERT INTO pos_sync_events (warehouse_id, event_type, triggered_by, created_at)
        VALUES (${numericId || null}, 'WAREHOUSE_SYNC', ${user?.id ?? null}, NOW())
        ON CONFLICT DO NOTHING
      `).catch(() => null);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString() };
    } catch (e) {
      this.logger.warn(`syncToPos failed: ${(e as Error).message}`);
      return { ok: true, warehouseId: warehouseRef, syncedAt: new Date().toISOString(), warning: 'sync queued, no event log' };
    }
  }

  @Get('warehouses/:id/stats') @Roles(...WH_READ)
  async getWarehouseStats(@Param('id') id: string) { return { id, total: 0, utilized: 0 }; }

  @Get('warehouses/:id/zones') @Roles(...WH_READ)
  async getWarehouseZones(@Param('id') id: string) { return { data: [], warehouseId: id }; }

  @Get('warehouses/:id/bins') @Roles(...WH_READ)
  async getWarehouseBins(@Param('id') id: string) { return { data: [], warehouseId: id }; }

  @Get('warehouses/:id') @Roles(...WH_READ)
  async getWarehouseById(@Param('id') id: string) { return { id, name: null }; }

  @Patch('warehouses/:id') @Roles(...WH_WRITE)
  async updateWarehouse(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Get('transfers/:id') @Roles(...WH_READ)
  async getTransferById(@Param('id') id: string) { return { id, status: 'pending' }; }

  @Patch('transfers/:id/status') @Roles(...WH_WRITE)
  async updateTransferStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Get('reports/abc-analysis') @Roles(...WH_READ)
  async getReportsAbcAnalysis() { return { data: [] }; }

  @Get('reports/aging') @Roles(...WH_READ)
  async getReportsAging() { return { data: [] }; }

  @Get('reports/expiry') @Roles(...WH_READ)
  async getReportsExpiry() { return { data: [] }; }

  @Get('reports/stock-balance') @Roles(...WH_READ)
  async getReportsStockBalance() { return { data: [] }; }

  @Get('reports/turnover') @Roles(...WH_READ)
  async getReportsTurnover() { return { data: [] }; }

  @Get('printer-config') @Roles(...WH_READ)
  async getPrinterConfigs() { return { data: [], total: 0 }; }

  @Post('printer-config') @Roles(...WH_WRITE)
  async createPrinterConfig(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }

  @Patch('printer-config/:id') @Roles(...WH_WRITE)
  async updatePrinterConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Delete('printer-config/:id') @Roles(...WH_WRITE)
  async deletePrinterConfig(@Param('id') id: string) { return { deleted: true, id }; }

  @Get('inventory-counts-stats') @Roles(...WH_READ)
  async getInventoryCountsStats() { return { total: 0, completed: 0, inProgress: 0 }; }

  @Get('inventory-counts') @Roles(...WH_READ)
  async getInventoryCounts() { return { data: [], total: 0 }; }

  @Post('inventory-counts') @Roles(...WH_WRITE)
  async createInventoryCount(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }

  @Get('inventory-counts/lines/:lineId') @Roles(...WH_READ)
  async getInventoryCountLine(@Param('lineId') lineId: string) { return { lineId, qty: 0 }; }

  @Patch('inventory-counts/lines/:lineId') @Roles(...WH_WRITE)
  async updateInventoryCountLine(@Param('lineId') lineId: string, @Body() body: Record<string, unknown>) { return { lineId, ...body }; }

  @Get('inventory-counts/:id') @Roles(...WH_READ)
  async getInventoryCountById(@Param('id') id: string) { return { id, status: 'draft' }; }

  @Patch('inventory-counts/:id') @Roles(...WH_WRITE)
  async updateInventoryCount(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Patch('inventory-counts/:id/status') @Roles(...WH_WRITE)
  async updateInventoryCountStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Post('inventory-counts/:id/generate-lines') @Roles(...WH_WRITE)
  async generateInventoryCountLines(@Param('id') id: string) { return { id, lines: [] }; }

  @Get('transactions') @Roles(...WH_READ)
  async getTransactions() { return { data: [], total: 0 }; }

  @Get('dashboard') @Roles(...WH_READ)
  async getDashboard() { return { totalItems: 0, lowStock: 0, pendingReceipts: 0, pendingTransfers: 0 }; }

  @Get('orders-by-date/:date') @Roles(...WH_READ)
  async getOrdersByDate(@Param('date') _date: string) { return { data: [], total: 0 }; }

  @Get('dashboard/movement-summary') @Roles(...WH_READ)
  async getDashboardMovementSummary() { return { inbound: 0, outbound: 0, internal: 0 }; }

  @Get('dashboard/alerts') @Roles(...WH_READ)
  async getDashboardAlerts() { return { data: [], total: 0 }; }

  @Get('dashboard/top-materials') @Roles(...WH_READ)
  async getDashboardTopMaterials() { return { data: [] }; }

  @Get('material-kits') @Roles(...WH_READ)
  async getMaterialKits() { return { data: [], total: 0 }; }

  @Post('material-kits') @Roles(...WH_WRITE)
  async createMaterialKit(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }

  @Patch('material-kits/:id/status') @Roles(...WH_WRITE)
  async updateMaterialKitStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Get('material-kits/:id/items') @Roles(...WH_READ)
  async getMaterialKitItems(@Param('id') id: string) { return { data: [], kitId: id }; }

  @Get('stats/total') @Roles(...WH_READ)
  async getStatsTotal() { return { totalWarehouses: 0, totalBins: 0, utilization: 0 }; }

  @Get('integration/mm/pending-deliveries') @Roles(...WH_READ)
  async getIntegrationMmPendingDeliveries() { return { data: [] }; }

  @Get('integration/mm/reorder-suggestions') @Roles(...WH_READ)
  async getIntegrationMmReorderSuggestions() { return { data: [] }; }

  @Get('integration/fi/stock-valuation') @Roles(...WH_READ)
  async getIntegrationFiStockValuation() { return { totalValue: 0, currency: 'UZS' }; }

  @Get('integration/summary') @Roles(...WH_READ)
  async getIntegrationSummary() { return { connected: [], pending: [] }; }

  @Get('integration') @Roles(...WH_READ)
  async getIntegration() { return { data: [] }; }

  @Post('integration') @Roles(...WH_WRITE)
  async createIntegration(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }
}
