/**
 * warehouse-features.controller.ts
 *
 * POS Monitor va ERP Warehouse Hub uchun kengaytirilgan endpointlar:
 *   • Ombor xodimlari (assign/list/remove)
 *   • Auto-barkod generatsiya (movement uchun)
 *   • Material 360° profili
 *
 * Barchasi `/api/pos/wh-features/*` da.
 */
import {
  Controller, Get, Post, Delete, Param, Body, Query, ParseIntPipe,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';

import { WarehouseEmployeesService } from '../services/warehouse-employees.service';
import { AutoBarcodeService } from '../services/auto-barcode.service';
import { Material360Service } from '../services/material-360.service';
import { AutoGlPostingService } from '../services/auto-gl-posting.service';
import { WarehouseKpiService } from '../services/warehouse-kpi.service';
import { GoodsReceiptService } from '../services/goods-receipt.service';
import { QuarantineWorkflowService } from '../services/quarantine-workflow.service';
import { ThreeWayMatchService } from '../services/three-way-match.service';

@ApiTags('POS — Warehouse Features')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 200, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/wh-features')
export class WarehouseFeaturesController {
  private readonly logger = new Logger(WarehouseFeaturesController.name);

  constructor(
    private readonly employees:    WarehouseEmployeesService,
    private readonly autoBarcode:  AutoBarcodeService,
    private readonly material360:  Material360Service,
    private readonly autoGl:       AutoGlPostingService,
    private readonly kpi:          WarehouseKpiService,
    private readonly grn:          GoodsReceiptService,
    private readonly quarantine:   QuarantineWorkflowService,
    private readonly threeWay:     ThreeWayMatchService,
  ) {}

  // ─── XODIMLAR ─────────────────────────────────────────────────────────

  @Get('warehouse/:warehouseId/employees')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Ombordagi xodimlar ro\'yxati' })
  @ApiParam({ name: 'warehouseId', type: 'number' })
  async listEmployees(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return unwrapOrInternal(await this.employees.listByWarehouse(warehouseId));
  }

  @Get('user/:userId/warehouses')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Xodim biriktirilgan omborlar ro\'yxati' })
  async listUserWarehouses(@Param('userId', ParseIntPipe) userId: number) {
    return unwrapOrInternal(await this.employees.listByUser(userId));
  }

  @Post('warehouse/:warehouseId/employees')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Omborga yangi xodim biriktirish' })
  async assignEmployee(
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
    @Body() body: {
      userId:    number;
      role:      'manager' | 'staff' | 'keeper' | 'qc_inspector' | 'observer';
      isPrimary?: boolean;
      notes?:    string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.employees.assign({
      warehouseId,
      userId:     body.userId,
      role:       body.role,
      isPrimary:  body.isPrimary,
      assignedBy: user.id,
      notes:      body.notes,
    }));
  }

  @Delete('employees/:assignmentId')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Xodimni omborlardan olib tashlash' })
  async removeEmployee(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.employees.remove(assignmentId, user.id));
  }

  // ─── AUTO-BARCODE ─────────────────────────────────────────────────────

  @Post('movement/:movementId/auto-barcode')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'EXTERNAL_IN harakat uchun avtomatik barkodlar yaratish' })
  async generateBarcodes(@Param('movementId', ParseIntPipe) movementId: number) {
    return unwrapOrInternal(await this.autoBarcode.generateForMovement(movementId));
  }

  @Get('movement/:movementId/barcodes')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Harakat uchun yaratilgan barkodlar ro\'yxati' })
  async listBarcodes(@Param('movementId', ParseIntPipe) movementId: number) {
    return unwrapOrInternal(await this.autoBarcode.listForMovement(movementId));
  }

  // ─── MATERIAL 360 PROFILE ─────────────────────────────────────────────

  @Get('material/:materialId/profile')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'Material 360° profili — to\'liq ma\'lumot bitta sahifada',
    description: 'Material asosiy ma\'lumot + har omborda stok + harakat tarixi + narx tarixi + ta\'minotchilar + barkodlar',
  })
  async getMaterialProfile(@Param('materialId', ParseIntPipe) materialId: number) {
    return unwrapOrInternal(await this.material360.getProfile(materialId));
  }

  // ─── GL POSTING (AUTOMATIK) ──────────────────────────────────────────

  @Post('movement/:movementId/gl-post')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Movement uchun avtomatik GL yozuvlari yaratish' })
  async postGl(@Param('movementId', ParseIntPipe) movementId: number) {
    return unwrapOrInternal(await this.autoGl.postForMovement(movementId));
  }

  @Get('movement/:movementId/gl-postings')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Movement GL yozuvlari ro\'yxati' })
  async listGl(@Param('movementId', ParseIntPipe) movementId: number) {
    return unwrapOrInternal(await this.autoGl.listForMovement(movementId));
  }

  @Get('gl/journal')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'GL Journal — filtrli ro\'yxat' })
  async getGlJournal(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
    @Query('debitAccount')  debitAccount?: string,
    @Query('creditAccount') creditAccount?: string,
    @Query('limit')    limit?: string,
  ) {
    return unwrapOrInternal(await this.autoGl.getJournal({
      dateFrom, dateTo, debitAccount, creditAccount,
      limit: limit ? parseInt(limit, 10) : undefined,
    }));
  }

  // ─── KPI ──────────────────────────────────────────────────────────────

  @Get('kpi/warehouses')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Har ombor bo\'yicha KPI' })
  async getWarehouseKpis() {
    return unwrapOrInternal(await this.kpi.getWarehouseKpis());
  }

  @Get('kpi/system')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Umumiy tizim KPI' })
  async getSystemKpi() {
    return unwrapOrInternal(await this.kpi.getSystemKpi());
  }

  // ─── GOODS RECEIVING (GRN) ───────────────────────────────────────────

  @Get('grn')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Qabul Aktlari (GRN) ro\'yxati' })
  async listGrn(
    @Query('status')      status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('supplier')    supplierName?: string,
    @Query('dateFrom')    dateFrom?: string,
    @Query('dateTo')      dateTo?: string,
    @Query('limit')       limit?: string,
  ) {
    return unwrapOrInternal(await this.grn.findAll({
      status, supplierName, dateFrom, dateTo,
      warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
      limit:       limit ? parseInt(limit, 10) : undefined,
    }));
  }

  @Post('grn')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Yangi Qabul Akti (GRN) yaratish' })
  async createGrn(
    @Body() body: {
      supplierName: string;
      supplierTin?: string;
      warehouseId: number;
      waybillNumber?: string;
      contractNumber?: string;
      totalAmount?: number;
      currency?: string;
      notes?: string;
      movementId?: number;
      purchaseOrderId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.grn.create({ ...body, receivedBy: user.id }));
  }

  @Post('grn/:id/approve')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'GRN ni tasdiqlash' })
  async approveGrn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.grn.approve(id, user.id));
  }

  // ─── QUARANTINE WORKFLOW ──────────────────────────────────────────────

  @Get('quarantine')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Karantindagi materiallar ro\'yxati' })
  async getQuarantine() {
    return unwrapOrInternal(await this.quarantine.listQuarantine());
  }

  @Post('movement/:id/move-to-quarantine')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Movement ni avtomatik Karantin omboriga ko\'chirish' })
  async moveToQuarantine(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.quarantine.moveToQuarantine(id));
  }

  @Post('movement/:id/qc-decision')
  @RequirePermission('pos.qc.decide')
  @ApiOperation({ summary: 'QC qarori: QABUL/REWORK/CHIQARISH' })
  async qcDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { decision: 'QABUL' | 'REWORK' | 'CHIQARISH'; qcNote?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.quarantine.qcDecision(id, body.decision, body.qcNote, user.id));
  }

  // ─── 3-WAY MATCH ──────────────────────────────────────────────────────

  @Get('three-way-match/variances')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Variance bor 3-way match yozuvlari (5%+)' })
  async listVariances() {
    return unwrapOrInternal(await this.threeWay.listVariances());
  }

  @Post('three-way-match')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Bitta movement uchun 3-way match yaratish/yangilash' })
  async createMatch(
    @Body() body: {
      movementId: number;
      purchaseOrderNo?: string;
      receiptNo?: string;
      invoiceNo?: string;
      poQuantity?: number;
      receivedQuantity?: number;
      invoicedQuantity?: number;
      poAmount?: number;
      invoiceAmount?: number;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.threeWay.match({ ...body, matchedBy: user.id }));
  }

  @Post('three-way-match/auto')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Barcha completed EXTERNAL_IN uchun avtomatik match' })
  async autoMatch() {
    return unwrapOrInternal(await this.threeWay.autoMatchAll());
  }
}
