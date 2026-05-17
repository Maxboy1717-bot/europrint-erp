/**
 * @module pos-warehouse-integration.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   pos-warehouse-integration module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Controller, Get, Post, Body, Query, Param,
  ParseIntPipe, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { PosWarehouseIntegrationService } from './pos-warehouse-integration.service';
import {
  PosStockAlertAclTranslator,
  type LegacyPosStockAlertRow,
  type PosStockAlertDto,
} from './acl/pos-stock-alert-acl';

@Throttle({ default: { limit: 200, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'super_admin', 'admin', 'director', 'manager', 'employee',
  'warehouse_keeper', 'warehouse_manager', 'pos_operator',
  'SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGER',
)
@Controller('pos/wh')
export class PosWarehouseIntegrationController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly stockAlertAcl = new PosStockAlertAclTranslator();

  constructor(
    private readonly svc: PosWarehouseIntegrationService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * GET /api/pos/stock — POS uchun real-time stok (warehouse_stock'dan)
   * Query: warehouseId, category, onlyAvailable, search
   */
  @Get('stock')
  async getStock(
    @Query('warehouseId') warehouseId?: string,
    @Query('category') category?: string,
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('search') search?: string,
  ) {
    return unwrapOrInternal(
      await this.svc.getRealTimeStock({
        warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
        category,
        onlyAvailable: onlyAvailable === 'true',
        search,
      }),
    );
  }

  /**
   * GET /api/pos/barcode/:barcode — barcode bo'yicha material topish
   */
  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return unwrapOrInternal(await this.svc.findByBarcode(barcode));
  }

  /**
   * POST /api/pos/movements — yangi POS movement (EXTERNAL_IN, INTERNAL_ISSUE, ...)
   */
  @Post('movements')
  async createMovement(
    @Body() body: {
      movementType?: string;
      fromWarehouseId?: number;
      toWarehouseId?: number;
      materialCardId?: number;
      quantity?: number;
      reason?: string;
      notes?: string;
      barcode?: string;
    },
    @CurrentUser() user: { id: number },
  ) {
    if (!body.movementType) throw new BadRequestException(await this.i18n.t('errors.movementTypeRequired'));
    if (!body.materialCardId) throw new BadRequestException(await this.i18n.t('errors.materialCardIdRequired'));
    if (!body.quantity) throw new BadRequestException(await this.i18n.t('errors.quantityRequired'));

    const validTypes = ['EXTERNAL_IN', 'EXTERNAL_OUT', 'INTERNAL_ISSUE', 'INTERNAL_RETURN', 'INTERNAL_TRANSFER', 'DAMAGE'];
    if (!validTypes.includes(body.movementType)) {
      throw new BadRequestException(await this.i18n.t('errors.movementTypeInvalid', { args: { types: validTypes.join(', ') } }));
    }

    return unwrapOrInternal(
      await this.svc.createMovement({
        movementType: body.movementType as never,
        fromWarehouseId: body.fromWarehouseId ? Number(body.fromWarehouseId) : undefined,
        toWarehouseId: body.toWarehouseId ? Number(body.toWarehouseId) : undefined,
        materialCardId: Number(body.materialCardId),
        quantity: Number(body.quantity),
        performedBy: user.id,
        reason: body.reason,
        notes: body.notes,
        barcode: body.barcode,
      }),
    );
  }

  /**
   * GET /api/pos/movements — movement tarixi
   */
  @Get('movements')
  async getMovementHistory(
    @Query('materialCardId') materialCardId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(
      await this.svc.getMovementHistory({
        materialCardId: materialCardId ? parseInt(materialCardId, 10) : undefined,
        warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
        movementType,
        limit: limit ? parseInt(limit, 10) : 100,
      }),
    );
  }

  /**
   * GET /api/pos/alerts — past stok ogohlantirishlari
   */
  @Get('alerts')
  async getStockAlerts() {
    return unwrapOrInternal(await this.svc.getStockAlerts());
  }

  /**
   * PA2-14 ACL-translated variant of the stock alerts. New BC-4 / BC-5
   * consumers should target `/v2`; the original `alerts` stays for
   * backwards-compat.
   */
  @Get('alerts/v2')
  async getStockAlertsV2(): Promise<PosStockAlertDto[]> {
    const rows = unwrapOrInternal(await this.svc.getStockAlerts()) as unknown as LegacyPosStockAlertRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.stockAlertAcl.toDomain(row))
      .filter((r): r is { ok: true; data: PosStockAlertDto } => r.ok)
      .map((r) => r.data);
  }
}
