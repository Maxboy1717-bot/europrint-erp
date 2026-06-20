/**
 * @module pos-operations.controller
 * @description POS Monitor — ombor operatsiyalari (kirim/chiqim/P2P qabul).
 *   Zavod ombori plansheti (POS Monitor) uchun mo'ljallangan: haqiqiy
 *   kirim/chiqim/P2P qabul amallarini bajaradi. ERP = ko'rish faqat;
 *   POS Monitor = operatsion nуqта.
 *
 *   Prefix: `pos/operations`
 */
import {
  Controller, Get, Post, Param, Body, Query, ParseIntPipe,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';

import { WarehouseConfigService, IssueStockInput } from '../application/services/warehouse-config.service';
import { ProcurementRequestService } from '../application/services/procurement-request.service';

// ── Zod sxemalari ──────────────────────────────────────────────────────────

/** Kirim/chiqim uchun umumiy sxema */
const StockOperationSchema = z.object({
  materialId: z.coerce.number().int().positive({ message: 'materialId musbat butun son bo\'lishi kerak' }),
  quantity: z.coerce.number().positive({ message: 'quantity musbat son bo\'lishi kerak' }),
  unit: z.string().optional(),
  reason: z.string().optional(),
});

/** P2P qabul sxemasi */
const ReceiveProcurementSchema = z.object({
  chekNumber: z.string().optional(),
  chekAmount: z.coerce.number().positive().optional(),
  warehouseId: z.union([z.string(), z.coerce.number()]).optional(),
  notes: z.string().optional(),
});

// ── Controller ─────────────────────────────────────────────────────────────

@ApiTags('POS Monitor — Operatsiyalar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/operations')
export class PosOperationsController {
  private readonly logger = new Logger(PosOperationsController.name);

  constructor(
    private readonly warehouseConfig: WarehouseConfigService,
    private readonly procurementRequest: ProcurementRequestService,
  ) {}

  // ─── OMBORLAR ─────────────────────────────────────────────────────────────

  /**
   * GET /pos/operations/warehouses
   * Ombor xodimi uchun: turdagi omborlar ro'yxati + har ombor qoldig'i.
   * Query: ?type=raw_material (ixtiyoriy)
   */
  @Get('warehouses')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'Omborlar ro\'yxati + qoldig\'i (POS Monitor)',
    description: 'Faol omborlar ro\'yxati (ixtiyoriy ?type= filtri) + har ombor uchun joriy qoldiq.',
  })
  async listWarehouses(@Query('type') type?: string) {
    const warehouses = unwrapOrThrow(await this.warehouseConfig.listWarehouses(type));
    const stockByWarehouse: Record<string, unknown> = {};
    for (const wh of warehouses) {
      const whId = Number(wh['id']);
      if (!whId) continue;
      const stockResult = await this.warehouseConfig.getWarehouseStock(whId);
      stockByWarehouse[String(whId)] = stockResult.ok ? stockResult.data : null;
    }
    return { warehouses, stockByWarehouse };
  }

  /**
   * GET /pos/operations/warehouses/:id/stock
   * Bitta ombor qoldig'i — POS plansheti uchun optimized (material kartochkalar + qoldiq).
   */
  @Get('warehouses/:id/stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Bitta ombor qoldig\'i (POS uchun optimized)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Ombor ID raqami' })
  async getWarehouseStock(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.warehouseConfig.getWarehouseStock(id));
  }

  // ─── CHIQIM ───────────────────────────────────────────────────────────────

  /**
   * POST /pos/operations/warehouses/:id/issue
   * Ombordan material chiqim (iste'mol/sarf). Atomik — qoldiq yetmasa 400.
   */
  @Post('warehouses/:id/issue')
  @RequirePermission('pos.operations.write')
  @ApiOperation({
    summary: 'Ombordan material chiqim (ISSUE)',
    description: 'warehouse_stock atomik kamaytiriladi; material_movements jurnaliga yoziladi.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Ombor ID raqami' })
  async issueStock(
    @Param('id', ParseIntPipe) warehouseId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto: IssueStockInput = StockOperationSchema.parse(body);
    this.logger.log(`[POS-OPS] Chiqim: ombor #${warehouseId} material #${dto.materialId} ×${dto.quantity} (user #${user.id})`);
    return unwrapOrThrow(await this.warehouseConfig.issueStock(warehouseId, dto, user.id));
  }

  // ─── KIRIM ────────────────────────────────────────────────────────────────

  /**
   * POST /pos/operations/warehouses/:id/receive
   * Omborga material qo'lda kirim (korreksiya/inventarizatsiya tuzatishi).
   * warehouse_stock upsert — mavjud bo'lsa oshiradi, bo'lmasa yangi qator yaratadi.
   */
  @Post('warehouses/:id/receive')
  @RequirePermission('pos.operations.write')
  @ApiOperation({
    summary: 'Omborga material qo\'lda kirim (RECEIVE)',
    description: 'warehouse_stock upsert (oshiradi yoki yangi qator); material_movements jurnaliga yoziladi.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Ombor ID raqami' })
  async receiveStock(
    @Param('id', ParseIntPipe) warehouseId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto: IssueStockInput = StockOperationSchema.parse(body);
    this.logger.log(`[POS-OPS] Kirim: ombor #${warehouseId} material #${dto.materialId} +${dto.quantity} (user #${user.id})`);
    return unwrapOrThrow(await this.warehouseConfig.receiveStock(warehouseId, dto, user.id));
  }

  // ─── P2P ──────────────────────────────────────────────────────────────────

  /**
   * GET /pos/operations/p2p/pending
   * POS Monitor uchun 'approved' P2P xarid so'rovlari — jismoniy qabul kutilmoqda.
   * Query: ?warehouseType=raw_material (ixtiyoriy)
   */
  @Get('p2p/pending')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'Jismoniy qabul kutilayotgan P2P so\'rovlar (approved)',
    description: 'Status=approved bo\'lgan P2P so\'rovlar — POS Monitor da qabul qilish uchun.',
  })
  async listPendingP2p(@Query('warehouseType') warehouseType?: string) {
    const result = await this.procurementRequest.listRequests({ status: 'approved' });
    const requests = unwrapOrThrow(result);
    const list = Array.isArray(requests) ? requests : [];
    // ixtiyoriy: target_warehouse_type bo'yicha filtrlash
    if (warehouseType) {
      return list.filter((r) => r['target_warehouse_type'] === warehouseType);
    }
    return list;
  }

  /**
   * POST /pos/operations/p2p/:requestId/receive
   * P2P jismoniy qabul — chek qabul + so'rov 'received' + podotchet reconcile + ombor prixod (§7.7).
   */
  @Post('p2p/:requestId/receive')
  @RequirePermission('pos.operations.write')
  @ApiOperation({
    summary: 'P2P xarid tovarini jismoniy qabul qilish',
    description: 'Chek qabul + so\'rov \'received\' + podotchet reconcile + ombor warehouse_stock prixod (§7.7).',
  })
  @ApiParam({ name: 'requestId', type: 'number', description: 'P2P so\'rov ID raqami' })
  async receiveProcurement(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = ReceiveProcurementSchema.parse(body);
    this.logger.log(`[POS-OPS] P2P qabul: so'rov #${requestId} (user #${user.id})`);
    return unwrapOrThrow(await this.procurementRequest.receiveProcurement(requestId, dto, user.id));
  }

  // ─── HARAKAT TARIXI ───────────────────────────────────────────────────────

  /**
   * GET /pos/operations/materials/:materialId/movements
   * Material harakat tarixi (material_movements) — kirim/chiqim jurnali, eng yangisi birinchi.
   */
  @Get('materials/:materialId/movements')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'Material harakat tarixi (RECEIVE/ISSUE/...)',
    description: 'material_movements jurnali — kirim/chiqim/P2P/...  so\'nggi 50 ta yozuv.',
  })
  @ApiParam({ name: 'materialId', type: 'number', description: 'Material kartochka ID raqami' })
  async getMaterialMovements(@Param('materialId', ParseIntPipe) materialId: number) {
    return unwrapOrThrow(await this.warehouseConfig.getMaterialMovements(materialId));
  }
}
