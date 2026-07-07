/**
 * @module wms-counts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import {
BadRequestException, Body, Controller, Delete, Get, NotFoundException,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, Logger, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  WmsCreateInventoryCountSchema, WmsCreateInventoryCountDto,
  WmsCreateInternalRequestSchema, WmsCreateInternalRequestDto,
  WmsUpdateInternalRequestSchema, WmsUpdateInternalRequestDto,
  WmsCountLineSchema, WmsCountLineDto,
  WmsFreezeZoneSchema, WmsFreezeZoneDto,
} from './dto/wms-counts.dto';
import { assertOk, throwFromError, unwrapOrInternal, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { safeInt } from '../../hr/common/db-rows';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WmsCountsService } from '../application/wms-counts.service';
import { WmsCrudService } from '../application/wms-crud.service';
import { InventoryFreezeService } from '../application/inventory-freeze.service';

const WMS_WRITE_ROLES = ['warehouse_manager', 'ERP_MANAGER', 'mm_manager', 'super_admin', 'director'];
const WMS_FLOOR_ROLES = ['WAREHOUSE_WORKER', 'warehouse_manager', 'ERP_MANAGER', 'mm_manager', 'super_admin', 'director'];

@ApiThrottle()
@ApiTags('Wms Counts')
@Controller('wms')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...WMS_WRITE_ROLES)
export class WmsCountsController {
  private readonly logger = new Logger(WmsCountsController.name);

  constructor(
    private readonly svc: WmsCountsService,
    private readonly crudSvc: WmsCrudService,
    private readonly freezeSvc: InventoryFreezeService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List inventory counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-counts')
  async listInventoryCounts(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('blind') blind?: string,
  ) {
    // KO'R-SANOQ (blind count): blind=true → tizim-miqdori sanoqchidan yashiriladi.
    const isBlind = blind === 'true' || blind === '1';
    const r = await this.svc.listInventoryCounts(warehouseId, status, safeInt(limit, 20), isBlind);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length, blind_mode: isBlind };
  }

  @ApiOperation({ summary: 'List count deviation reasons (catalog)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('count-deviation-reasons')
  @Roles(...WMS_FLOOR_ROLES)
  async listDeviationReasons() {
    const r = await this.freezeSvc.listDeviationReasons();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Record a count line (deviation reason required when system != counted)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / deviation reason required' })
  @Post('count-lines')
  @UsePipes(new ZodValidationPipe(WmsCountLineSchema))
  @Roles(...WMS_FLOOR_ROLES)
  async recordCountLine(@Body() body: WmsCountLineDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.recordCountLine({
      countId: safeInt(body.count_id, 0),
      materialId: safeInt(body.material_id, 0),
      systemQty: Number(body.system_qty),
      countedQty: Number(body.counted_qty),
      deviationReasonCode: body.deviation_reason_code != null ? String(body.deviation_reason_code) : null,
      notes: body.notes != null ? String(body.notes) : null,
      countedBy: user?.id ?? null,
    }));
  }

  @ApiOperation({ summary: 'List inventory freeze zones' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('freeze-zones')
  async listFreezeZones(@Query('status') status?: string, @Query('warehouseId') warehouseId?: string) {
    const r = await this.freezeSvc.listFreezes(status, warehouseId ? safeInt(warehouseId, 0) : undefined);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Freeze a zone/material for inventory count' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('freeze-zones')
  @UsePipes(new ZodValidationPipe(WmsFreezeZoneSchema))
  async freezeZone(@Body() body: WmsFreezeZoneDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.freezeSvc.freezeZone({
      warehouseId: safeInt(body.warehouse_id, 0),
      materialId: body.material_id != null ? safeInt(body.material_id, 0) : null,
      countId: body.count_id != null ? safeInt(body.count_id, 0) : null,
      reason: body.reason != null ? String(body.reason) : null,
      frozenBy: user?.id ?? null,
    }));
  }

  @ApiOperation({ summary: 'Release an inventory freeze zone' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found / already released' })
  @Patch('freeze-zones/:id/release')
  async releaseFreezeZone(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrNotFound(await this.freezeSvc.releaseZone(id, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Create inventory count' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('inventory-counts')
  @UsePipes(new ZodValidationPipe(WmsCreateInventoryCountSchema))
  async createInventoryCount(@Body() body: WmsCreateInventoryCountDto) {
    const { warehouse_id, counted_by, notes } = body;
    assertRequired(warehouse_id, await this.i18n.t('validation.warehouseIdRequired'));
    return unwrapOrThrow(await this.svc.createInventoryCount(safeInt(warehouse_id, 0), counted_by != null ? safeInt(counted_by, 0) : null, notes != null ? String(notes) : null));
  }

  @ApiOperation({ summary: 'Delete inventory count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('inventory-counts/:id')
  @UsePipes(new ZodValidationPipe(WmsCreateInventoryCountSchema))
  async deleteInventoryCount(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteInventoryCount(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }

  @ApiOperation({ summary: 'List internal requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('internal-requests')
  async listInternalRequests(@Query('status') status?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.listInternalRequests(status, safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Create internal request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('internal-requests')
  @UsePipes(new ZodValidationPipe(WmsCreateInternalRequestSchema))
  @Roles(...WMS_FLOOR_ROLES)
  async createInternalRequest(@Body() body: WmsCreateInternalRequestDto, @CurrentUser() user: AuthenticatedUser) {
    const { from_warehouse_id, to_warehouse_id, material_id, quantity, notes } = body;
    const materialQuantityMsg = await this.i18n.t('validation.materialIdAndQuantityRequired');
    assertRequired(material_id, materialQuantityMsg);
    assertRequired(quantity, materialQuantityMsg);
    return unwrapOrThrow(await this.svc.createInternalRequest(user?.id ?? null, from_warehouse_id != null ? safeInt(from_warehouse_id, 0) : null, to_warehouse_id != null ? safeInt(to_warehouse_id, 0) : null, safeInt(material_id, 0), safeInt(quantity, 0), notes != null ? String(notes) : null));
  }

  @ApiOperation({ summary: 'Update internal request' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('internal-requests/:id')
  @UsePipes(new ZodValidationPipe(WmsUpdateInternalRequestSchema))
  async updateInternalRequest(@Param('id') id: string, @Body() body: WmsUpdateInternalRequestDto) {
    const { status, notes } = body;
    const _rR = await this.svc.updateInternalRequest(safeInt(id, 0), status != null ? String(status) : null, notes != null ? String(notes) : null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.requestNotFound', { args: { id } }));
    const items = Array.isArray(r) ? r : [];
    return items[0];
  }

  @ApiOperation({ summary: 'List batches' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('batches')
  async listBatches(@Query('materialId') materialId?: string, @Query('warehouseId') warehouseId?: string, @Query('expiring') expiring?: string) {
    return unwrapOrInternal(await this.svc.listBatches(materialId, warehouseId, expiring));
  }

  @ApiOperation({ summary: 'Get production supply' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-supply')
  async getProductionSupply(@Query('sessionId') sessionId?: string) {
    return unwrapOrInternal(await this.svc.getProductionSupply(sessionId));
  }
}
